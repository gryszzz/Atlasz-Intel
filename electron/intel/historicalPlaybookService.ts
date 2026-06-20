/*
 * Historical precedent / playbook service (Phase 3.5). For a given event,
 * answers "when did something similar happen before, and how did linked assets
 * react?" using local-computed lexical embeddings + cosine similarity.
 *
 * Fail-closed: no prior events / no embeddings -> HISTORICAL_PLAYBOOK_UNAVAILABLE.
 * Return profiles are math-derived and present ONLY when real local price
 * history exists; otherwise RETURN_PROFILE_UNAVAILABLE. Matches are never
 * presented as verified truth.
 */
import {
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  cosineSimilarity,
  embedEvent,
  summaryHashFor,
} from './embeddingService'
import {
  PLAYBOOK_UNAVAILABLE,
  RETURN_PROFILE_UNAVAILABLE,
  unavailablePlaybook,
  type HistoricalPlaybook,
  type PrecedentMatch,
  type ReturnProfile,
} from '../../src/intel'
import type { WorldIntelEmbeddingRecord } from '../persistence'
import type { WorldIntelEvent } from '../../src/worldIntel'

const DAY = 86_400_000
const TOP_K = 3

export interface PlaybookSource {
  listWorldIntelEvents(limit?: number): WorldIntelEvent[]
  listWorldIntelEmbeddings(limit?: number): WorldIntelEmbeddingRecord[]
  saveWorldIntelEmbedding(record: WorldIntelEmbeddingRecord): void
  listMarketTicks(symbol: string, limit?: number): Array<{ price: number; observedAt: number }>
}

export class HistoricalPlaybookService {
  private readonly source: PlaybookSource

  constructor(source: PlaybookSource) {
    this.source = source
  }

  playbookFor(eventId: string, options: { now?: number } = {}): HistoricalPlaybook {
    const now = options.now ?? Date.now()
    const events = this.source.listWorldIntelEvents(400)
    const query = events.find((event) => event.id === eventId)
    if (!query) {
      return unavailablePlaybook(eventId, 'Event not found in local store.', now)
    }

    const embeddings = this.ensureEmbeddings(events)
    const queryVector = embeddings.get(eventId)
    if (!queryVector) {
      return unavailablePlaybook(eventId, `${PLAYBOOK_UNAVAILABLE}: no embedding for the query event.`, now)
    }

    const priorScored = events
      .filter((event) => event.timestamp < query.timestamp && event.id !== eventId && event.dedupeHash !== query.dedupeHash)
      .map((event) => ({ event, vector: embeddings.get(event.id) }))
      .filter((entry): entry is { event: WorldIntelEvent; vector: number[] } => Boolean(entry.vector))
      .map((entry) => ({ event: entry.event, similarity: cosineSimilarity(queryVector, entry.vector) }))
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, TOP_K)

    if (priorScored.length === 0) {
      return unavailablePlaybook(eventId, `${PLAYBOOK_UNAVAILABLE}: no prior comparable events (insufficient history).`, now)
    }

    const matches = priorScored.map((scored) => this.toMatch(query, scored.event, scored.similarity))
    return {
      queryEventId: eventId,
      generatedAt: now,
      embeddingModel: EMBEDDING_MODEL,
      available: true,
      matches,
    }
  }

  private ensureEmbeddings(events: WorldIntelEvent[]): Map<string, number[]> {
    const stored = new Map(this.source.listWorldIntelEmbeddings(800).map((record) => [record.eventId, record]))
    const map = new Map<string, number[]>()
    for (const event of events) {
      const hash = summaryHashFor(event)
      const existing = stored.get(event.id)
      if (
        existing &&
        existing.summaryHash === hash &&
        existing.embeddingModel === EMBEDDING_MODEL &&
        existing.embeddingVector.length === EMBEDDING_DIM
      ) {
        map.set(event.id, existing.embeddingVector)
        continue
      }
      const vector = embedEvent(event)
      if (!vector) {
        continue
      }
      map.set(event.id, vector)
      try {
        this.source.saveWorldIntelEmbedding({
          id: `emb-${event.id}`,
          eventId: event.id,
          timestamp: event.timestamp,
          summaryHash: hash,
          embeddingModel: EMBEDDING_MODEL,
          embeddingVector: vector,
          sourceEventCategory: String(event.category),
          provenance: 'local-computed',
          createdAt: Date.now(),
        })
      } catch {
        // Persistence failure must not break the read path.
      }
    }
    return map
  }

  private toMatch(query: WorldIntelEvent, candidate: WorldIntelEvent, similarity: number): PrecedentMatch {
    const sharedAssets = intersect(query.affectedAssets, candidate.affectedAssets)
    const sharedTags = intersect(query.narrativeTags, candidate.narrativeTags)
    const reasonParts = [`${Math.round(similarity * 100)}% lexical similarity`]
    if (query.category === candidate.category) {
      reasonParts.push(`same category (${String(candidate.category)})`)
    }
    if (sharedAssets.length > 0) {
      reasonParts.push(`shared assets: ${sharedAssets.slice(0, 4).join(', ')}`)
    }
    if (sharedTags.length > 0) {
      reasonParts.push(`shared narrative: ${sharedTags.slice(0, 3).join(', ')}`)
    }

    return {
      eventId: candidate.id,
      title: candidate.title,
      timestamp: candidate.timestamp,
      category: String(candidate.category),
      similarity,
      linkedAssets: candidate.affectedAssets,
      matchReason: reasonParts.join(' · '),
      provenance: 'local-computed',
      returnProfile: this.returnProfileFor(candidate),
    }
  }

  private returnProfileFor(event: WorldIntelEvent): ReturnProfile | null {
    for (const symbol of event.affectedAssets) {
      const bars = this.source
        .listMarketTicks(symbol, 800)
        .map((row) => ({ price: row.price, time: row.observedAt }))
        .filter((bar) => Number.isFinite(bar.price) && Number.isFinite(bar.time))
        .sort((left, right) => left.time - right.time)
      if (bars.length === 0) {
        continue
      }
      const base = nearestPrice(bars, event.timestamp, 3 * DAY)
      if (base === null) {
        continue
      }
      const oneDayPct = horizonReturn(bars, event.timestamp, 1 * DAY, base)
      const fiveDayPct = horizonReturn(bars, event.timestamp, 5 * DAY, base)
      const sevenDayPct = horizonReturn(bars, event.timestamp, 7 * DAY, base)
      const allMissing = oneDayPct === null && fiveDayPct === null && sevenDayPct === null
      return {
        symbol,
        oneDayPct,
        fiveDayPct,
        sevenDayPct,
        provenance: 'math-derived',
        unavailableReason: allMissing ? RETURN_PROFILE_UNAVAILABLE : undefined,
      }
    }
    return null
  }
}

function horizonReturn(
  bars: Array<{ price: number; time: number }>,
  from: number,
  horizonMs: number,
  base: number,
): number | null {
  const price = nearestPrice(bars, from + horizonMs, 2 * DAY)
  if (price === null || base === 0) {
    return null
  }
  return ((price - base) / base) * 100
}

function nearestPrice(bars: Array<{ price: number; time: number }>, target: number, toleranceMs: number): number | null {
  let best: { price: number; time: number } | null = null
  let bestDelta = Number.POSITIVE_INFINITY
  for (const bar of bars) {
    const delta = Math.abs(bar.time - target)
    if (delta < bestDelta) {
      best = bar
      bestDelta = delta
    }
  }
  if (!best || bestDelta > toleranceMs) {
    return null
  }
  return best.price
}

function intersect(a: string[], b: string[]): string[] {
  const set = new Set(b.map((value) => value.toUpperCase()))
  return [...new Set(a.filter((value) => set.has(value.toUpperCase())))]
}
