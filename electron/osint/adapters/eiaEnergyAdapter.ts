/*
 * U.S. Energy Information Administration (EIA) energy adapter.
 *
 * Uses the official EIA Open Data API v2 /seriesid route for a narrow allowlist
 * of public energy series. EIA requires an API key; Atlasz sends it only on the
 * live request and never persists it in source trails or raw payload JSON.
 *
 * provenance: official-api   category: energy-event
 */
import {
  adapterEventId,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { EiaEnergyRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_energy_public'
const EIA_SOURCE_NAME = 'U.S. Energy Information Administration'
const EIA_API_BASE = 'https://api.eia.gov/v2'
const EIA_OPEN_DATA_URL = 'https://www.eia.gov/opendata/'
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const SERIES_ID_PATTERN = /^[A-Z0-9._-]+$/i
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type EiaSeriesMeta = {
  seriesId: string
  title: string
  energyCategory: string
  commodity: string
  region?: string
  countryCode?: string
  units?: string
  sourceUrl: string
}

export const EIA_ENERGY_SERIES: EiaSeriesMeta[] = [
  {
    seriesId: 'PET.RWTC.D',
    title: 'Cushing, OK WTI spot price FOB',
    energyCategory: 'Petroleum',
    commodity: 'Crude Oil',
    region: 'United States',
    countryCode: 'US',
    units: 'Dollars per Barrel',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/pri/spt',
  },
  {
    seriesId: 'NG.RNGWHHD.D',
    title: 'Henry Hub natural gas spot price',
    energyCategory: 'Natural Gas',
    commodity: 'Natural Gas',
    region: 'United States',
    countryCode: 'US',
    units: 'Dollars per Million Btu',
    sourceUrl: 'https://www.eia.gov/opendata/browser/natural-gas/pri/fut',
  },
  {
    seriesId: 'PET.EMM_EPM0_PTE_NUS_DPG.W',
    title: 'U.S. regular retail gasoline price',
    energyCategory: 'Petroleum',
    commodity: 'Gasoline',
    region: 'United States',
    countryCode: 'US',
    units: 'Dollars per Gallon',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/pri/gnd',
  },
  {
    seriesId: 'PET.WCESTUS1.W',
    title: 'U.S. ending stocks of crude oil',
    energyCategory: 'Petroleum',
    commodity: 'Crude Oil',
    region: 'United States',
    countryCode: 'US',
    units: 'Thousand Barrels',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/stoc/wstk',
  },
  {
    seriesId: 'ELEC.GEN.ALL-US-99.M',
    title: 'U.S. electricity net generation',
    energyCategory: 'Electricity',
    commodity: 'Electricity',
    region: 'United States',
    countryCode: 'US',
    units: 'Thousand Megawatthours',
    sourceUrl: 'https://www.eia.gov/opendata/browser/electricity/electric-power-operational-data',
  },
]

export type EiaEnergyAdapterConfig = {
  apiBase: string
  apiKey: string
  series: EiaSeriesMeta[]
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type EiaSeriesPayload = {
  response?: {
    data?: Array<Record<string, unknown>>
    description?: string
    frequency?: string
  }
  series?: Array<{
    series_id?: string
    name?: string
    units?: string
    data?: unknown[]
  }>
  error?: string
  code?: number
  request?: unknown
}

export function readEiaEnergyConfig(env: NodeJS.ProcessEnv = process.env): EiaEnergyAdapterConfig | null {
  if (env.ATLASZ_EIA_DISABLE === '1') {
    return null
  }
  const apiKey = text(env.ATLASZ_EIA_API_KEY)
  const apiBase = text(env.ATLASZ_EIA_API_BASE) || EIA_API_BASE
  if (!apiKey || !/^https:\/\//i.test(apiBase)) {
    return null
  }
  return {
    apiBase,
    apiKey,
    series: parseSeriesAllowlist(env.ATLASZ_EIA_SERIES) ?? EIA_ENERGY_SERIES,
    timeoutMs: clampInteger(Number(env.ATLASZ_EIA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_EIA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_EIA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchEiaEnergyRecords(
  signal: AbortSignal,
  config = readEiaEnergyConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.series.length === 0) {
    return []
  }
  const retrievedAt = Date.now()
  const records: EiaEnergyRecord[] = []

  for (const series of config.series) {
    const signedUrl = eiaSeriesUrl(config.apiBase, series, config.apiKey)
    const sourceApiUrl = eiaSeriesUrl(config.apiBase, series).toString()
    const payload = await fetchWithRetry(
      (attemptSignal) => fetchEiaJson<EiaSeriesPayload>(signedUrl, linkedSignal(signal, attemptSignal)),
      {
        maxRetries: config.maxRetries,
        backoffMs: config.backoffMs,
        timeoutMs: config.timeoutMs,
      },
    )
    records.push(...parseEiaEnergyResponse(payload, { retrievedAt, series, sourceApiUrl }))
  }

  return normalizeEiaEnergyRecords(records)
}

/** Pure normalizer — testable with fixture EIA API payloads. */
export function parseEiaEnergyResponse(
  payload: unknown,
  options: { retrievedAt?: number; series?: EiaSeriesMeta; sourceApiUrl?: string } = {},
): EiaEnergyRecord[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const series = options.series ?? EIA_ENERGY_SERIES[0]
  const rows = dataRows(payload as EiaSeriesPayload)
  if (rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? eiaSeriesUrl(EIA_API_BASE, series).toString()
  const row = latestValidRow(rows)
  if (!row) {
    return []
  }

  const period = text(row.period) || text(row.date)
  const observationDate = eiaObservationDate(period)
  const observationTimestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
  const rawValue = text(row.value)
  const value = parseEiaNumber(rawValue)
  const units = text(row.units) || text(row.unit) || text(row['value-units']) || series.units || 'value'
  const title = text(row['series-description']) || text(row.name) || text(row.description) || series.title
  const region = text(row['area-name']) || text(row.region) || series.region
  const countryCode = normalizeCountryCode(text(row.country) || text(row.countryCode) || series.countryCode)
  const rawRecord = {
    seriesId: series.seriesId.toUpperCase(),
    title,
    energyCategory: series.energyCategory,
    commodity: series.commodity,
    region,
    countryCode,
    period,
    observationDate,
    rawValue,
    value,
    units,
    sourceUrl: series.sourceUrl,
    sourceApiUrl,
    retrievedAt,
    row: sanitizeRow(row),
  }
  const rawPayloadJson = stableStringify(rawRecord)
  const candidate: EiaEnergyRecord = {
    id: eiaEnergyRecordId(series.seriesId, period),
    seriesId: series.seriesId.toUpperCase(),
    title,
    energyCategory: series.energyCategory,
    commodity: series.commodity,
    region,
    countryCode,
    period,
    observationDate: observationDate ?? '',
    observationTimestamp,
    value: value ?? Number.NaN,
    rawValue,
    units,
    sourceUrl: series.sourceUrl,
    sourceApiUrl,
    sourceName: EIA_SOURCE_NAME,
    retrievedAt,
    provenance: 'official-api',
    confidence: confidenceForEiaEnergyRecord({
      seriesId: series.seriesId,
      observationDate,
      value,
      sourceUrl: series.sourceUrl,
      sourceApiUrl,
      retrievedAt,
    }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }

  return hasValidEiaEnergyRecord(candidate) ? [candidate] : []
}

export function normalizeEiaEnergyRecords(records: EiaEnergyRecord[]): WorldIntelEvent[] {
  return records.filter(hasValidEiaEnergyRecord).map(toEvent)
}

export function eiaPublicApiUrl(seriesId: string, baseUrl = EIA_API_BASE): string {
  return eiaSeriesUrl(baseUrl, { ...EIA_ENERGY_SERIES[0], seriesId }).toString()
}

function toEvent(record: EiaEnergyRecord): WorldIntelEvent {
  const dedupeKey = `eia|${record.seriesId}|${record.period}`.toLowerCase()
  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `EIA ${record.seriesId} — ${record.title}`,
    summary:
      `Official EIA energy observation for ${record.seriesId} (${record.commodity}) at ${record.period}: ` +
      `${record.rawValue} ${record.units}. Source: ${record.sourceName}.`,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observationTimestamp,
    category: 'energy-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['EIA energy series', record.energyCategory, record.commodity, record.seriesId]),
    extractedEntities: unique([EIA_SOURCE_NAME, record.seriesId, record.title, record.commodity, record.region ?? '']),
  })

  return {
    ...event,
    countryCodes: unique([record.countryCode ?? 'US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', record.energyCategory, ...event.affectedSectors]),
    affectedCommodities: unique([record.commodity, ...event.affectedCommodities]),
    confidence: record.confidence,
    eiaEnergyRecord: record,
  }
}

function dataRows(payload: EiaSeriesPayload): Array<Record<string, unknown>> {
  if (payload.error || payload.code === 400 || payload.code === 404) {
    return []
  }
  const data = payload.response?.data
  if (Array.isArray(data)) {
    return data
  }
  const legacy = payload.series?.[0]
  if (Array.isArray(legacy?.data)) {
    const rows: Array<Record<string, unknown>> = []
    for (const entry of legacy.data) {
      if (!Array.isArray(entry) || entry.length < 2) continue
      rows.push({
        period: entry[0],
        value: entry[1],
        units: legacy.units,
        'series-description': legacy.name,
      })
    }
    return rows
  }
  return []
}

function latestValidRow(rows: Array<Record<string, unknown>>): Record<string, unknown> | null {
  let best: { row: Record<string, unknown>; timestamp: number } | null = null
  for (const row of rows) {
    const period = text(row.period) || text(row.date)
    const observationDate = eiaObservationDate(period)
    const timestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
    const value = parseEiaNumber(text(row.value))
    if (!observationDate || !Number.isFinite(timestamp) || value === null) {
      continue
    }
    if (!best || timestamp > best.timestamp) {
      best = { row, timestamp }
    }
  }
  return best?.row ?? null
}

function hasValidEiaEnergyRecord(record: EiaEnergyRecord): boolean {
  return (
    SERIES_ID_PATTERN.test(record.seriesId) &&
    record.title.length > 0 &&
    record.energyCategory.length > 0 &&
    record.commodity.length > 0 &&
    record.period.length > 0 &&
    ISO_DATE_PATTERN.test(record.observationDate) &&
    Number.isFinite(record.observationTimestamp) &&
    Number.isFinite(record.value) &&
    record.units.length > 0 &&
    /^https:\/\/www\.eia\.gov\//.test(record.sourceUrl) &&
    /^https:\/\/api\.eia\.gov\/v2\/seriesid\//.test(record.sourceApiUrl) &&
    !/[?&]api_key=/i.test(record.sourceApiUrl) &&
    record.sourceName === EIA_SOURCE_NAME &&
    record.provenance === 'official-api' &&
    Number.isFinite(record.retrievedAt) &&
    record.rawPayloadHash.length > 0 &&
    !(record.rawPayloadJson ?? '').includes('api_key')
  )
}

function confidenceForEiaEnergyRecord(input: {
  seriesId: string
  observationDate: string | null
  value: number | null
  sourceUrl: string
  sourceApiUrl: string
  retrievedAt: number
}): number {
  return SERIES_ID_PATTERN.test(input.seriesId) &&
    input.observationDate !== null &&
    ISO_DATE_PATTERN.test(input.observationDate) &&
    input.value !== null &&
    Number.isFinite(input.value) &&
    /^https:\/\/www\.eia\.gov\//.test(input.sourceUrl) &&
    /^https:\/\/api\.eia\.gov\/v2\/seriesid\//.test(input.sourceApiUrl) &&
    !/[?&]api_key=/i.test(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 96
    : 60
}

async function fetchEiaJson<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first energy intelligence; official EIA API)',
    },
  })
  assertOk(response, 'EIA')
  return (await response.json()) as T
}

function eiaSeriesUrl(baseUrl: string, series: Pick<EiaSeriesMeta, 'seriesId'>, apiKey?: string): URL {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/seriesid/${encodeURIComponent(series.seriesId.toUpperCase())}`)
  url.searchParams.set('length', '1')
  if (apiKey) {
    url.searchParams.set('api_key', apiKey)
  }
  return url
}

function eiaObservationDate(period: string): string | null {
  const trimmed = period.trim().toUpperCase()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const compactDay = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed)
  if (compactDay) return `${compactDay[1]}-${compactDay[2]}-${compactDay[3]}`
  const month = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed) ?? /^(\d{4})(0[1-9]|1[0-2])$/.exec(trimmed)
  if (month) return `${month[1]}-${month[2]}-01`
  const quarter = /^(\d{4})Q([1-4])$/.exec(trimmed) ?? /^(\d{4})-Q([1-4])$/.exec(trimmed)
  if (quarter) return `${quarter[1]}-${String(Number(quarter[2]) * 3).padStart(2, '0')}-01`
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`
  return null
}

function parseEiaNumber(raw: string): number | null {
  if (!raw || raw === '(NA)' || raw === 'NA' || raw === '---' || raw === '--' || raw === '.') {
    return null
  }
  const parsed = Number(raw.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (/api[_-]?key/i.test(key)) continue
    out[key] = value
  }
  return out
}

function parseSeriesAllowlist(value: unknown): EiaSeriesMeta[] | null {
  const items = text(value)
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
  if (items.length === 0) {
    return null
  }
  const defaults = new Map(EIA_ENERGY_SERIES.map((series) => [series.seriesId.toUpperCase(), series]))
  const series = items
    .map((seriesId) => {
      if (!SERIES_ID_PATTERN.test(seriesId)) return null
      return defaults.get(seriesId) ?? {
        seriesId,
        title: seriesId,
        energyCategory: 'Energy',
        commodity: 'Energy',
        region: 'United States',
        countryCode: 'US',
        sourceUrl: EIA_OPEN_DATA_URL,
      }
    })
    .filter((item): item is EiaSeriesMeta => item !== null)
  return series.length > 0 ? series : null
}

function normalizeCountryCode(value: string | undefined): string | undefined {
  if (!value) return undefined
  const upper = value.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) return upper
  if (upper === 'USA' || upper === 'UNITED STATES') return 'US'
  return undefined
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

function eiaEnergyRecordId(seriesId: string, period: string): string {
  return `${SOURCE_ID}:${seriesId.toUpperCase()}:${period.toLowerCase()}`
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, attempt: AbortSignal): AbortSignal {
  if (parent.aborted || attempt.aborted) {
    const controller = new AbortController()
    controller.abort()
    return controller.signal
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  attempt.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export const EIA_ENERGY_SOURCE_ID = SOURCE_ID
