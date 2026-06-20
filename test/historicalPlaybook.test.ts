import { describe, expect, it } from 'vitest'
import { cosineSimilarity, embedText, embedEvent } from '../electron/intel/embeddingService'
import { HistoricalPlaybookService, type PlaybookSource } from '../electron/intel/historicalPlaybookService'
import type { WorldIntelEmbeddingRecord } from '../electron/persistence'
import type { WorldIntelEvent } from '../src/worldIntel'

const DAY = 86_400_000

function makeEvent(partial: Partial<WorldIntelEvent>): WorldIntelEvent {
  return {
    id: partial.id ?? 'evt',
    timestamp: partial.timestamp ?? 0,
    title: partial.title ?? 'Event',
    summary: partial.summary ?? '',
    countryCodes: [],
    region: 'Global',
    category: partial.category ?? 'geopolitics',
    severity: 'moderate',
    confidence: 60,
    sourceId: 'test',
    provenance: 'public-unauthenticated',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: 'h',
    dedupeHash: partial.dedupeHash ?? (partial.id ?? 'evt'),
  }
}

class FakeSource implements PlaybookSource {
  private embeddings: WorldIntelEmbeddingRecord[] = []
  constructor(
    private readonly events: WorldIntelEvent[],
    private readonly ticks: Record<string, Array<{ price: number; observedAt: number }>> = {},
  ) {}
  listWorldIntelEvents(): WorldIntelEvent[] {
    return this.events
  }
  listWorldIntelEmbeddings(): WorldIntelEmbeddingRecord[] {
    return this.embeddings
  }
  saveWorldIntelEmbedding(record: WorldIntelEmbeddingRecord): void {
    this.embeddings = [...this.embeddings.filter((entry) => entry.eventId !== record.eventId), record]
  }
  listMarketTicks(symbol: string): Array<{ price: number; observedAt: number }> {
    return this.ticks[symbol] ?? []
  }
}

describe('lexical embedding', () => {
  it('is deterministic and self-similar', () => {
    const a = embedText('taiwan semiconductor export controls tighten')
    const b = embedText('taiwan semiconductor export controls tighten')
    expect(a).not.toBeNull()
    expect(cosineSimilarity(a!, b!)).toBeCloseTo(1, 6)
  })

  it('scores related text higher than unrelated text', () => {
    const query = embedText('taiwan semiconductor export controls tighten')!
    const related = embedText('taiwan semiconductor export restrictions expand')!
    const unrelated = embedText('brazil coffee harvest weather disruption')!
    expect(cosineSimilarity(query, related)).toBeGreaterThan(cosineSimilarity(query, unrelated))
  })

  it('returns null for empty / stopword-only text', () => {
    expect(embedText('')).toBeNull()
    expect(embedText('the and of to')).toBeNull()
  })
})

describe('historical playbook service', () => {
  const T0 = 1_700_000_000_000
  const query = makeEvent({
    id: 'Q',
    title: 'Taiwan semiconductor export controls tighten',
    timestamp: T0 + 10 * DAY,
  })
  const similar = makeEvent({
    id: 'A',
    title: 'Taiwan semiconductor export restrictions expand',
    affectedAssets: ['TSM'],
    timestamp: T0,
  })
  const dissimilar = makeEvent({ id: 'B', title: 'Brazil coffee harvest weather disruption', timestamp: T0 + 1000 })
  const future = makeEvent({ id: 'C', title: 'Taiwan semiconductor news later', timestamp: T0 + 11 * DAY })

  it('ranks the most similar prior event first and is local-computed', () => {
    const source = new FakeSource([query, similar, dissimilar, future], {
      TSM: [
        { price: 100, observedAt: T0 },
        { price: 105, observedAt: T0 + 1 * DAY },
        { price: 110, observedAt: T0 + 5 * DAY },
        { price: 95, observedAt: T0 + 7 * DAY },
      ],
    })
    const playbook = new HistoricalPlaybookService(source).playbookFor('Q')
    expect(playbook.available).toBe(true)
    expect(playbook.matches[0].eventId).toBe('A')
    expect(playbook.matches.every((m) => m.provenance === 'local-computed')).toBe(true)
    expect(playbook.matches.map((m) => m.eventId)).not.toContain('C') // future excluded
  })

  it('computes a math-derived return profile when price history exists', () => {
    const source = new FakeSource([query, similar], {
      TSM: [
        { price: 100, observedAt: T0 },
        { price: 105, observedAt: T0 + 1 * DAY },
        { price: 110, observedAt: T0 + 5 * DAY },
        { price: 95, observedAt: T0 + 7 * DAY },
      ],
    })
    const playbook = new HistoricalPlaybookService(source).playbookFor('Q')
    const match = playbook.matches.find((m) => m.eventId === 'A')!
    expect(match.returnProfile?.symbol).toBe('TSM')
    expect(match.returnProfile?.oneDayPct).toBeCloseTo(5, 5)
    expect(match.returnProfile?.fiveDayPct).toBeCloseTo(10, 5)
    expect(match.returnProfile?.sevenDayPct).toBeCloseTo(-5, 5)
    expect(match.returnProfile?.provenance).toBe('math-derived')
  })

  it('returns null return profile when no price history exists', () => {
    const source = new FakeSource([query, similar], {})
    const playbook = new HistoricalPlaybookService(source).playbookFor('Q')
    expect(playbook.matches.find((m) => m.eventId === 'A')?.returnProfile).toBeNull()
  })

  it('fails closed when there are no prior events', () => {
    const lonely = makeEvent({ id: 'solo', title: 'A unique isolated world event', timestamp: T0 })
    const playbook = new HistoricalPlaybookService(new FakeSource([lonely])).playbookFor('solo')
    expect(playbook.available).toBe(false)
    expect(playbook.unavailableReason).toContain('HISTORICAL_PLAYBOOK_UNAVAILABLE')
  })

  it('fails closed when the event is unknown', () => {
    const playbook = new HistoricalPlaybookService(new FakeSource([query])).playbookFor('missing')
    expect(playbook.available).toBe(false)
  })

  it('persists embeddings lazily and reuses them', () => {
    const source = new FakeSource([query, similar, dissimilar])
    const service = new HistoricalPlaybookService(source)
    service.playbookFor('Q')
    expect(source.listWorldIntelEmbeddings().length).toBeGreaterThan(0)
    expect(embedEvent(query)).not.toBeNull()
  })
})
