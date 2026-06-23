/*
 * FRED official macro time-series adapter.
 *
 * Uses the official FRED REST API when ATLASZ_FRED_API_KEY is configured.
 * API keys come ONLY from env and are never embedded in source trails. Missing
 * keys, missing values, malformed metadata, and FRED "." observations fail
 * closed — no fake macro data, no synthetic commentary.
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
import type { FredMacroObservation, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'macro_calendar_fred'
const FRED_SOURCE_NAME = 'FRED (Federal Reserve Economic Data)'
const FRED_BASE = 'https://api.stlouisfed.org/fred'
const FRED_SERIES_WEB_BASE = 'https://fred.stlouisfed.org/series'
const DEFAULT_LIMIT = 1
const DEFAULT_RATE_LIMIT_MS = 1200
const RISK_PROXIES = ['DXY', 'TLT', 'SPY', 'QQQ', 'GLD', 'BTC']
const GROWTH_PROXIES = ['SPY', 'QQQ', 'DXY']

export type MacroSeriesMeta = {
  seriesId: string
  label: string
  defaultUnits: string
  proxies: string[]
}

export const MACRO_SERIES: MacroSeriesMeta[] = [
  { seriesId: 'CPIAUCSL', label: 'CPI', defaultUnits: 'index', proxies: RISK_PROXIES },
  { seriesId: 'UNRATE', label: 'Unemployment rate', defaultUnits: '%', proxies: GROWTH_PROXIES },
  { seriesId: 'FEDFUNDS', label: 'Federal funds rate', defaultUnits: '%', proxies: RISK_PROXIES },
  { seriesId: 'DGS10', label: '10-year Treasury yield', defaultUnits: '%', proxies: RISK_PROXIES },
  { seriesId: 'GDP', label: 'Gross domestic product', defaultUnits: 'billions of dollars', proxies: GROWTH_PROXIES },
  { seriesId: 'PAYEMS', label: 'Nonfarm payrolls', defaultUnits: 'thousands', proxies: RISK_PROXIES },
]

export type MacroAdapterConfig = {
  apiKey: string
  baseUrl: string
  series: MacroSeriesMeta[]
  rateLimitMs: number
}

export type FredObservation = {
  realtime_start?: string
  realtime_end?: string
  date: string
  value: string
}

export type FredSeriesMetadata = {
  id: string
  title: string
  units: string
  frequency: string
  seasonalAdjustment: string
}

type FredSeriesPayload = {
  seriess?: Array<Record<string, unknown>>
}

type FredObservationsPayload = {
  observations?: FredObservation[]
}

export function readMacroConfig(env: NodeJS.ProcessEnv = process.env): MacroAdapterConfig | null {
  const apiKey = asString(env.ATLASZ_FRED_API_KEY)
  if (!apiKey) {
    return null
  }
  const baseUrl = asString(env.ATLASZ_FRED_BASE_URL) || FRED_BASE
  const series = parseSeriesAllowlist(env.ATLASZ_FRED_SERIES_IDS) ?? MACRO_SERIES
  const rateLimitMs = Number.isFinite(Number(env.ATLASZ_FRED_RATE_LIMIT_MS))
    ? Math.max(0, Number(env.ATLASZ_FRED_RATE_LIMIT_MS))
    : DEFAULT_RATE_LIMIT_MS
  return { apiKey, baseUrl, series, rateLimitMs }
}

export async function fetchMacroCalendar(
  signal: AbortSignal,
  config = readMacroConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const records: FredMacroObservation[] = []
  for (const meta of config.series) {
    if (signal.aborted) {
      break
    }
    const seriesPayload = await fetchFredJson<FredSeriesPayload>(seriesMetadataUrl(config.baseUrl, meta.seriesId, config.apiKey), signal)
    const observationsPayload = await fetchFredJson<FredObservationsPayload>(
      seriesObservationsUrl(config.baseUrl, meta.seriesId, config.apiKey, DEFAULT_LIMIT),
      signal,
    )
    const record = normalizeFredSeriesObservation({
      requestedMeta: meta,
      seriesPayload,
      observationsPayload,
      retrievedAt: Date.now(),
      sourceApiUrl: sanitizedObservationApiUrl(config.baseUrl, meta.seriesId, DEFAULT_LIMIT),
    })
    if (record) {
      records.push(record)
    }
    await delay(config.rateLimitMs, signal)
  }
  return normalizeMacroObservations(records)
}

export function normalizeFredSeriesObservation(input: {
  requestedMeta: MacroSeriesMeta
  seriesPayload: unknown
  observationsPayload: unknown
  retrievedAt: number
  sourceApiUrl?: string
}): FredMacroObservation | null {
  const metadata = parseFredSeriesMetadata(input.seriesPayload, input.requestedMeta)
  const observation = latestValidObservation(input.observationsPayload)
  if (!metadata || !observation) {
    return null
  }

  const rawValue = asString(observation.value)
  const value = Number(rawValue)
  const observationTimestamp = Date.parse(`${observation.date}T00:00:00Z`)
  const sourceUrl = `${FRED_SERIES_WEB_BASE}/${metadata.id}`
  const sourceApiUrl = input.sourceApiUrl ?? sanitizedObservationApiUrl(FRED_BASE, metadata.id, DEFAULT_LIMIT)
  if (
    !hasValidFredObservation({
      seriesId: metadata.id,
      title: metadata.title,
      observationDate: observation.date,
      value,
      sourceUrl,
      retrievedAt: input.retrievedAt,
    })
  ) {
    return null
  }

  const rawRecord = {
    metadata,
    observation,
    sourceUrl,
    sourceApiUrl,
    retrievedAt: input.retrievedAt,
  }
  const rawPayloadJson = stableStringify(rawRecord)
  return {
    id: fredObservationId(metadata.id, observation.date),
    seriesId: metadata.id,
    title: metadata.title,
    units: metadata.units,
    frequency: metadata.frequency,
    seasonalAdjustment: metadata.seasonalAdjustment,
    observationDate: observation.date,
    observationTimestamp,
    value,
    rawValue,
    sourceUrl,
    sourceApiUrl,
    sourceName: FRED_SOURCE_NAME,
    retrievedAt: input.retrievedAt,
    provenance: 'official-api',
    confidence: confidenceForFredObservation({
      seriesId: metadata.id,
      title: metadata.title,
      observationDate: observation.date,
      value,
      sourceUrl,
      retrievedAt: input.retrievedAt,
    }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }
}

/** Backward-compatible pure normalizer for older tests and quant links. */
export function normalizeMacroObservation(
  meta: MacroSeriesMeta,
  observation: FredObservation | undefined,
): WorldIntelEvent | null {
  const record = normalizeFredSeriesObservation({
    requestedMeta: meta,
    seriesPayload: {
      seriess: [
        {
          id: meta.seriesId,
          title: meta.label,
          units: meta.defaultUnits,
          frequency: 'unknown',
          seasonal_adjustment: 'unknown',
        },
      ],
    },
    observationsPayload: { observations: observation ? [observation] : [] },
    retrievedAt: Date.now(),
  })
  return record ? normalizeMacroObservations([record])[0] ?? null : null
}

export function normalizeMacroObservations(records: FredMacroObservation[]): WorldIntelEvent[] {
  return records.map(toEvent)
}

function toEvent(record: FredMacroObservation): WorldIntelEvent {
  const dedupeKey = `fred|${record.seriesId}|${record.observationDate}`.toLowerCase()
  const proxies = MACRO_SERIES.find((item) => item.seriesId === record.seriesId)?.proxies ?? RISK_PROXIES
  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.seriesId} — ${record.title}`,
    summary:
      `Official FRED observation for ${record.seriesId} (${record.title}) on ${record.observationDate}: ` +
      `${record.rawValue} ${record.units}. Source: ${record.sourceName}.`,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observationTimestamp,
    category: 'macro-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: unique(proxies),
    narrativeTags: unique(['FRED macro series', record.seriesId, record.frequency, record.seasonalAdjustment]),
    extractedEntities: unique([record.title, record.seriesId, 'United States macro']),
  })

  return {
    ...event,
    confidence: record.confidence,
    fredObservation: record,
  }
}

function parseFredSeriesMetadata(payload: unknown, requestedMeta: MacroSeriesMeta): FredSeriesMetadata | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const body = payload as FredSeriesPayload
  const row = body.seriess?.[0]
  if (!row || typeof row !== 'object') {
    return null
  }
  const seriesId = asString(row.id).toUpperCase()
  const title = asString(row.title)
  const units = asString(row.units) || requestedMeta.defaultUnits
  const frequency = asString(row.frequency) || asString(row.frequency_short) || 'unknown'
  const seasonalAdjustment = asString(row.seasonal_adjustment) || asString(row.seasonal_adjustment_short) || 'unknown'
  if (!seriesId || seriesId !== requestedMeta.seriesId || !title) {
    return null
  }
  return { id: seriesId, title, units, frequency, seasonalAdjustment }
}

function latestValidObservation(payload: unknown): FredObservation | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const body = payload as FredObservationsPayload
  for (const observation of body.observations ?? []) {
    const value = asString(observation.value)
    if (value && value !== '.' && Number.isFinite(Number(value))) {
      return observation
    }
  }
  return null
}

function hasValidFredObservation(input: {
  seriesId: string
  title: string
  observationDate: string
  value: number
  sourceUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    input.seriesId &&
      input.title &&
      /^\d{4}-\d{2}-\d{2}$/.test(input.observationDate) &&
      Number.isFinite(input.value) &&
      /^https:\/\/fred\.stlouisfed\.org\/series\/[A-Z0-9_]+$/.test(input.sourceUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForFredObservation(input: {
  seriesId: string
  title: string
  observationDate: string
  value: number
  sourceUrl: string
  retrievedAt: number
}): number {
  return hasValidFredObservation(input) ? 96 : 60
}

async function fetchFredJson<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
  assertOk(response, 'FRED')
  return (await response.json()) as T
}

function seriesMetadataUrl(baseUrl: string, seriesId: string, apiKey: string): URL {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/series`)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  return url
}

function seriesObservationsUrl(baseUrl: string, seriesId: string, apiKey: string, limit: number): URL {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/series/observations`)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', String(limit))
  return url
}

function sanitizedObservationApiUrl(baseUrl: string, seriesId: string, limit: number): string {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/series/observations`)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', String(limit))
  return url.toString()
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

function fredObservationId(seriesId: string, observationDate: string): string {
  return `${SOURCE_ID}:${seriesId}:${observationDate}`
}

function parseSeriesAllowlist(value: unknown): MacroSeriesMeta[] | null {
  const ids = asString(value)
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
  if (ids.length === 0) {
    return null
  }
  return ids.map((seriesId) => MACRO_SERIES.find((item) => item.seriesId === seriesId) ?? {
    seriesId,
    label: seriesId,
    defaultUnits: '',
    proxies: RISK_PROXIES,
  })
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted || ms <= 0) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new Error('FRED macro fetch aborted'))
      },
      { once: true },
    )
  })
}

export const MACRO_SOURCE_ID = SOURCE_ID
