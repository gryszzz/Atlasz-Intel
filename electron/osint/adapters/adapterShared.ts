/*
 * Shared helpers for Phase 2 OSINT adapters.
 *
 * Every adapter normalizes its structured records into the existing
 * `WorldIntelEvent` contract by reusing `buildWorldIntelEventFromHeadline`
 * (country inference, coordinates, sector/commodity tagging) and then
 * overriding the fields the adapter owns authoritatively: category,
 * provenance, affected assets, and stable hashes/id.
 *
 * Fail-closed: adapters return [] (never fabricate) when config/payloads are
 * missing or malformed. Nothing here invents tickers or marks data verified.
 */
import { createHash } from 'node:crypto'
import { buildWorldIntelEventFromHeadline, type WorldIntelEvent } from '../../../src/worldIntel'
import type { ProvenanceId } from '../../../src/provenance'

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))]
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/** Parse a date-ish value to epoch ms; undefined when not parseable. */
export function asEpochMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Heuristic: treat 10-digit values as seconds.
    return value < 1e12 ? Math.round(value * 1000) : Math.round(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value.trim())
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export type AdapterEventInput = {
  id: string
  title: string
  summary: string
  source: string
  url: string
  observedAt: number
  category: string
  provenance: ProvenanceId
  sourceId: string
  /** Stable, content-addressed dedupe key (e.g. accession number). */
  dedupeKey: string
  /** Raw upstream payload — hashed for provenance auditing. */
  rawPayload: unknown
  affectedAssets?: string[]
  narrativeTags?: string[]
  extractedEntities?: string[]
}

/**
 * Build a normalized WorldIntelEvent from an adapter record. The adapter's
 * explicit category/provenance/affectedAssets win over the generic builder's
 * inferred values; the builder still supplies geo/sector enrichment.
 */
export function buildAdapterEvent(input: AdapterEventInput): WorldIntelEvent {
  const base = buildWorldIntelEventFromHeadline(
    {
      id: input.id,
      title: input.title,
      source: input.source,
      url: input.url,
      sector: input.category,
      impact: input.summary,
      observedAt: input.observedAt,
    },
    { sourceId: input.sourceId, provenance: input.provenance },
  )

  return {
    ...base,
    category: input.category,
    provenance: input.provenance,
    summary: input.summary || base.summary,
    // Asset mapping is adapter-authoritative ONLY. We deliberately drop the
    // builder's text-extracted ticker guesses to avoid inventing tickers from
    // company names / prose (e.g. "APPLE", "INC"). Missing -> unmapped ([]).
    affectedAssets: unique(input.affectedAssets ?? []).slice(0, 16),
    narrativeTags: unique([...(input.narrativeTags ?? []), ...base.narrativeTags]).slice(0, 12),
    extractedEntities: unique([...(input.extractedEntities ?? []), ...base.extractedEntities]).slice(0, 18),
    rawPayloadHash: sha256(stableStringify(input.rawPayload)),
    dedupeHash: sha256(input.dedupeKey),
  }
}

/** Deterministic JSON for hashing (sorted keys). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

/** Stable adapter event id from a source id + dedupe key. */
export function adapterEventId(sourceId: string, dedupeKey: string): string {
  return `${sourceId}-${sha256(dedupeKey).slice(0, 20)}`
}
