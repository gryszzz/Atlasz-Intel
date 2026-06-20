/*
 * Generic public JSON feed adapter. Normalizes a configured PUBLIC JSON endpoint
 * (array of news-like records) into WorldIntelEvent. Public URLs only; honest
 * normalization; fail-closed on malformed payloads.
 */
import { buildWorldIntelEventFromHeadline, classifyHeadlineText, type WorldIntelEvent } from '../../../src/worldIntel'
import type { ProvenanceId } from '../../../src/provenance'
import { adapterEventId, asEpochMs, asString } from './adapterShared'

export type CustomJsonOptions = {
  url: string
  sourceId: string
  sourceName: string
  provenance: ProvenanceId
  headers?: Record<string, string>
}

export async function fetchCustomJson(signal: AbortSignal, options: CustomJsonOptions): Promise<WorldIntelEvent[]> {
  if (!/^https?:\/\//i.test(options.url)) {
    return []
  }
  const response = await fetch(options.url, { signal, headers: { accept: 'application/json', ...(options.headers ?? {}) } })
  if (!response.ok) {
    throw new Error(`Custom JSON ${options.sourceName} HTTP ${response.status}`)
  }
  let payload: unknown
  try {
    payload = JSON.parse(await response.text())
  } catch {
    throw new Error(`Custom JSON ${options.sourceName} returned non-JSON`)
  }
  return normalizeCustomJson(payload, options)
}

/** Pure normalizer — testable with fixtures. */
export function normalizeCustomJson(payload: unknown, options: CustomJsonOptions): WorldIntelEvent[] {
  const records = extractRecords(payload)
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    const title = firstString(record, ['title', 'headline', 'name', 'summary'])
    const link = firstString(record, ['url', 'link', 'source_url', 'sourceUrl', 'permalink'])
    if (!title || !link) {
      continue
    }
    const description = firstString(record, ['summary', 'description', 'body', 'content', 'abstract'])
    const observedAt = asEpochMs(firstRaw(record, ['timestamp', 'date', 'published', 'publishedAt', 'time', 'created_at'])) ?? Date.now()
    const classification = classifyHeadlineText(`${title} ${description}`)
    events.push(
      buildWorldIntelEventFromHeadline(
        {
          id: adapterEventId(options.sourceId, link),
          title,
          source: options.sourceName,
          url: link,
          sector: classification.sector,
          impact: description || classification.impact,
          observedAt,
        },
        { sourceId: options.sourceId, provenance: options.provenance },
      ),
    )
  }
  return events
}

function extractRecords(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord)
  }
  if (isRecord(payload)) {
    for (const key of ['items', 'data', 'results', 'articles', 'events']) {
      const value = payload[key]
      if (Array.isArray(value)) {
        return value.filter(isRecord)
      }
    }
  }
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstRaw(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key]
    }
  }
  return undefined
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  return asString(firstRaw(record, keys))
}
