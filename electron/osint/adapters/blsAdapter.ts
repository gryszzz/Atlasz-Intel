/*
 * U.S. Bureau of Labor Statistics (BLS) macro time-series adapter.
 *
 * Uses the official BLS Public Data API v2
 * (https://api.bls.gov/publicAPI/v2/timeseries/data/). Public by default; an
 * optional registration key (ATLASZ_BLS_API_KEY) raises rate limits and is sent
 * ONLY in the request body (registrationkey), never placed in any persisted URL
 * or source trail.
 *
 * Real data only: missing/non-numeric values, annual-average (M13) periods, and
 * malformed series are dropped, never repaired. HTTP/rate-limit failures surface
 * via the shared fetchPolicy (assertOk -> HttpError -> fetchWithRetry) so the
 * ingest layer shows DATA_UNAVAILABLE.
 *
 * provenance: official-api   category: macro-event
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { BlsObservation, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'bls_public'
const BLS_SOURCE_NAME = 'U.S. Bureau of Labor Statistics'
const BLS_API_BASE = 'https://api.bls.gov/publicAPI/v2'
const BLS_SERIES_WEB_BASE = 'https://data.bls.gov/timeseries'
const SERIES_ID_PATTERN = /^[A-Z0-9]{8,}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type BlsSeriesMeta = { seriesId: string; label: string }

export const BLS_SERIES: BlsSeriesMeta[] = [
  { seriesId: 'CUUR0000SA0', label: 'CPI-U, all items' },
  { seriesId: 'LNS14000000', label: 'Unemployment rate' },
  { seriesId: 'CES0000000001', label: 'Total nonfarm payroll employment' },
  { seriesId: 'LNS11300000', label: 'Labor force participation rate' },
  { seriesId: 'CES0500000003', label: 'Average hourly earnings, total private' },
]

export type BlsAdapterConfig = {
  apiBase: string
  series: BlsSeriesMeta[]
  apiKey?: string
}

type BlsObservationRow = {
  year?: string
  period?: string
  periodName?: string
  value?: string
}

type BlsSeriesPayload = {
  status?: string
  Results?: { series?: Array<Record<string, unknown>> }
}

export function readBlsConfig(env: NodeJS.ProcessEnv = process.env): BlsAdapterConfig | null {
  if (env.ATLASZ_BLS_DISABLE === '1') {
    return null
  }
  const apiBase = asString(env.ATLASZ_BLS_API_BASE) || BLS_API_BASE
  if (!/^https:\/\//i.test(apiBase)) {
    return null
  }
  const series = parseSeriesAllowlist(env.ATLASZ_BLS_SERIES) ?? BLS_SERIES
  const apiKey = asString(env.ATLASZ_BLS_API_KEY) || undefined
  return { apiBase, series, apiKey }
}

export async function fetchBlsObservations(
  signal: AbortSignal,
  config = readBlsConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.series.length === 0) {
    return []
  }
  const now = Date.now()
  const currentYear = new Date(now).getUTCFullYear()
  const body: Record<string, unknown> = {
    seriesid: config.series.map((meta) => meta.seriesId),
    startyear: String(currentYear - 1),
    endyear: String(currentYear),
    catalog: true,
  }
  // Registration key travels ONLY in the request body; never persisted in a trail.
  if (config.apiKey) {
    body.registrationkey = config.apiKey
  }

  const response = await fetch(`${config.apiBase}/timeseries/data/`, {
    signal,
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  assertOk(response, 'BLS')
  const payload = (await response.json()) as unknown
  const records = parseBlsResponse(payload, { retrievedAt: now, config })
  return normalizeBlsObservations(records)
}

/** Pure normalizer — testable with fixture BLS v2 payloads. */
export function parseBlsResponse(
  payload: unknown,
  options: { retrievedAt?: number; config?: Partial<BlsAdapterConfig> } = {},
): BlsObservation[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload as BlsSeriesPayload
  const series = body.Results?.series
  if (!Array.isArray(series) || series.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const labels = new Map((options.config?.series ?? BLS_SERIES).map((meta) => [meta.seriesId, meta.label]))
  const out: BlsObservation[] = []

  for (const entry of series) {
    const seriesId = asString(entry.seriesID).toUpperCase()
    const observation = latestValidObservation(entry.data)
    if (!SERIES_ID_PATTERN.test(seriesId) || !observation) {
      continue
    }
    const observationDate = blsObservationDate(asString(observation.year), asString(observation.period))
    const rawValue = asString(observation.value)
    const value = Number(rawValue)
    const sourceUrl = `${BLS_SERIES_WEB_BASE}/${seriesId}`
    const title = seriesTitle(entry) || labels.get(seriesId) || seriesId

    if (!hasValidBlsObservation({ seriesId, observationDate, value, sourceUrl, retrievedAt })) {
      continue // Drop malformed observations; never repair.
    }

    const observationTimestamp = Date.parse(`${observationDate}T00:00:00Z`)
    const rawRecord = {
      seriesId,
      title,
      year: asString(observation.year),
      period: asString(observation.period),
      periodName: asString(observation.periodName),
      observationDate,
      value,
      rawValue,
      sourceUrl,
      sourceApiUrl: `${BLS_API_BASE}/timeseries/data/`,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    out.push({
      id: blsRecordId(seriesId, observationDate as string),
      seriesId,
      title,
      period: asString(observation.period).toUpperCase(),
      periodName: asString(observation.periodName),
      year: asString(observation.year),
      observationDate: observationDate as string,
      observationTimestamp,
      value,
      rawValue,
      sourceUrl,
      // sourceApiUrl never contains the registration key (key is body-only).
      sourceApiUrl: `${BLS_API_BASE}/timeseries/data/`,
      sourceName: BLS_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForBlsObservation({ seriesId, observationDate, value, sourceUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  return out
}

export function normalizeBlsObservations(records: BlsObservation[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: BlsObservation): WorldIntelEvent {
  const dedupeKey = `bls|${record.seriesId}|${record.observationDate}`.toLowerCase()
  const summary =
    `Official BLS observation for ${record.seriesId} (${record.title}) — ${record.periodName} ${record.year}: ` +
    `${record.rawValue}. Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.seriesId} — ${record.title}`,
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observationTimestamp,
    category: 'macro-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['BLS macro series', record.seriesId, record.title, 'United States']),
    extractedEntities: unique([record.title, record.seriesId, 'United States macro']),
  })

  return {
    ...event,
    confidence: record.confidence,
    blsObservation: record,
  }
}

function latestValidObservation(data: unknown): BlsObservationRow | null {
  if (!Array.isArray(data)) {
    return null
  }
  // BLS returns newest-first; take the first numeric, periodic observation.
  for (const row of data) {
    const observation = row as BlsObservationRow
    const value = asString(observation.value)
    const date = blsObservationDate(asString(observation.year), asString(observation.period))
    if (date && value && value !== '-' && Number.isFinite(Number(value))) {
      return observation
    }
  }
  return null
}

/** Map a BLS year + period to a calendar date; null for annual-average (M13) etc. */
function blsObservationDate(year: string, period: string): string | null {
  if (!/^\d{4}$/.test(year)) {
    return null
  }
  const p = period.toUpperCase()
  if (/^M(0[1-9]|1[0-2])$/.test(p)) return `${year}-${p.slice(1)}-01`
  if (/^Q0[1-4]$/.test(p)) return `${year}-${String(Number(p.slice(1)) * 3).padStart(2, '0')}-01`
  if (p === 'A01') return `${year}-01-01`
  if (p === 'S01') return `${year}-01-01`
  if (p === 'S02') return `${year}-07-01`
  return null // M13 (annual average) and unknown periods are skipped.
}

function seriesTitle(entry: Record<string, unknown>): string {
  const catalog = entry.catalog as Record<string, unknown> | undefined
  return asString(catalog?.series_title)
}

function hasValidBlsObservation(input: {
  seriesId: string
  observationDate: string | null
  value: number
  sourceUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    SERIES_ID_PATTERN.test(input.seriesId) &&
      input.observationDate &&
      ISO_DATE_PATTERN.test(input.observationDate) &&
      Number.isFinite(input.value) &&
      /^https:\/\/data\.bls\.gov\/timeseries\/[A-Z0-9]+$/.test(input.sourceUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForBlsObservation(input: {
  seriesId: string
  observationDate: string | null
  value: number
  sourceUrl: string
  retrievedAt: number
}): number {
  return hasValidBlsObservation(input) ? 96 : 60
}

function parseSeriesAllowlist(value: unknown): BlsSeriesMeta[] | null {
  const ids = asString(value)
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => SERIES_ID_PATTERN.test(item))
  if (ids.length === 0) {
    return null
  }
  const labels = new Map(BLS_SERIES.map((meta) => [meta.seriesId, meta.label]))
  return ids.map((seriesId) => ({ seriesId, label: labels.get(seriesId) ?? seriesId }))
}

function blsRecordId(seriesId: string, observationDate: string): string {
  return `${SOURCE_ID}:${seriesId.toLowerCase()}:${observationDate}`
}

export const BLS_SOURCE_ID = SOURCE_ID
