/*
 * U.S. Bureau of Economic Analysis (BEA) macro adapter.
 *
 * Uses the official BEA API for Data Retrieval (https://apps.bea.gov/api/data)
 * and fails closed without ATLASZ_BEA_API_KEY. The first narrow slice is NIPA
 * table T10101, line 1 (real GDP percent change). Malformed records are dropped,
 * never repaired or simulated.
 *
 * provenance: official-api   category: macro-event
 */
import {
  adapterEventId,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { BeaObservation, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'bea_public'
const BEA_SOURCE_NAME = 'U.S. Bureau of Economic Analysis'
const BEA_API_BASE = 'https://apps.bea.gov/api/data'
const BEA_GDP_SOURCE_URL = 'https://www.bea.gov/data/gdp/gross-domestic-product'
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type BeaSeriesMeta = {
  datasetName: string
  tableName: string
  lineNumber: string
  label: string
  frequency: string
  year: string
  sourceUrl: string
}

export const BEA_SERIES: BeaSeriesMeta[] = [
  {
    datasetName: 'NIPA',
    tableName: 'T10101',
    lineNumber: '1',
    label: 'Real gross domestic product percent change',
    frequency: 'Q',
    year: 'X',
    sourceUrl: BEA_GDP_SOURCE_URL,
  },
]

export type BeaAdapterConfig = {
  apiBase: string
  apiKey: string
  series: BeaSeriesMeta[]
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type BeaDataPayload = {
  BEAAPI?: {
    Results?: {
      Data?: Array<Record<string, unknown>>
      Error?: {
        APIErrorCode?: string | number
        APIErrorDescription?: string
      }
    }
  }
  Results?: {
    Data?: Array<Record<string, unknown>>
    Error?: {
      APIErrorCode?: string | number
      APIErrorDescription?: string
    }
  }
}

export function readBeaConfig(env: NodeJS.ProcessEnv = process.env): BeaAdapterConfig | null {
  if (env.ATLASZ_BEA_DISABLE === '1') {
    return null
  }
  const apiKey = text(env.ATLASZ_BEA_API_KEY)
  const apiBase = text(env.ATLASZ_BEA_API_BASE) || BEA_API_BASE
  if (!apiKey || !/^https:\/\//i.test(apiBase)) {
    return null
  }
  return {
    apiBase,
    apiKey,
    series: parseSeriesAllowlist(env.ATLASZ_BEA_SERIES) ?? BEA_SERIES,
    timeoutMs: clampInteger(Number(env.ATLASZ_BEA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_BEA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_BEA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchBeaObservations(
  signal: AbortSignal,
  config = readBeaConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.series.length === 0) {
    return []
  }
  const retrievedAt = Date.now()
  const records: BeaObservation[] = []

  for (const series of config.series) {
    const signedUrl = beaApiUrl(config.apiBase, series, config.apiKey)
    const sourceApiUrl = beaApiUrl(config.apiBase, series).toString()
    const payload = await fetchWithRetry(
      (attemptSignal) => fetchBeaJson<BeaDataPayload>(signedUrl, linkedSignal(signal, attemptSignal)),
      {
        maxRetries: config.maxRetries,
        backoffMs: config.backoffMs,
        timeoutMs: config.timeoutMs,
      },
    )
    records.push(...parseBeaResponse(payload, { retrievedAt, series, sourceApiUrl }))
  }

  return normalizeBeaObservations(records)
}

/** Pure normalizer — testable with fixture BEA API payloads. */
export function parseBeaResponse(
  payload: unknown,
  options: { retrievedAt?: number; series?: BeaSeriesMeta; sourceApiUrl?: string } = {},
): BeaObservation[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const series = options.series ?? BEA_SERIES[0]
  const rows = dataRows(payload as BeaDataPayload)
  if (rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? beaApiUrl(BEA_API_BASE, series).toString()
  const row = latestValidRow(rows, series)
  if (!row) {
    return []
  }

  const timePeriod = text(row.TimePeriod)
  const observationDate = beaObservationDate(timePeriod)
  const observationTimestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
  const rawValue = text(row.DataValue)
  const metricValue = parseBeaNumber(rawValue)
  const lineDescription = text(row.LineDescription) || series.label
  const units = text(row.CL_UNIT) || text(row.UnitOfMeasure) || 'value'
  const unitMultiplier = text(row.UNIT_MULT) || undefined
  const rawRecord = {
    datasetName: series.datasetName,
    tableName: series.tableName,
    lineNumber: series.lineNumber,
    lineDescription,
    timePeriod,
    observationDate,
    rawValue,
    metricValue,
    units,
    unitMultiplier,
    row,
    sourceUrl: series.sourceUrl,
    sourceApiUrl,
    retrievedAt,
  }
  const rawPayloadJson = stableStringify(rawRecord)
  const candidate: BeaObservation = {
    id: beaRecordId(series.datasetName, series.tableName, series.lineNumber, timePeriod),
    datasetName: series.datasetName,
    tableName: series.tableName,
    lineNumber: series.lineNumber,
    lineDescription,
    seriesCode: text(row.SeriesCode) || undefined,
    timePeriod,
    observationDate: observationDate ?? '',
    observationTimestamp,
    metricName: `${series.tableName} line ${series.lineNumber}: ${lineDescription}`,
    metricValue: metricValue ?? Number.NaN,
    rawValue,
    units,
    unitMultiplier,
    sourceUrl: series.sourceUrl,
    sourceApiUrl,
    sourceName: BEA_SOURCE_NAME,
    retrievedAt,
    provenance: 'official-api',
    confidence: confidenceForBeaObservation({
      datasetName: series.datasetName,
      tableName: series.tableName,
      lineNumber: series.lineNumber,
      observationDate,
      metricValue,
      sourceUrl: series.sourceUrl,
      sourceApiUrl,
      retrievedAt,
    }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }

  return hasValidBeaObservation(candidate) ? [candidate] : []
}

export function normalizeBeaObservations(records: BeaObservation[]): WorldIntelEvent[] {
  return records.filter(hasValidBeaObservation).map(toEvent)
}

function toEvent(record: BeaObservation): WorldIntelEvent {
  const dedupeKey = `bea|${record.datasetName}|${record.tableName}|${record.lineNumber}|${record.timePeriod}`.toLowerCase()
  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `BEA ${record.datasetName} ${record.tableName} — ${record.lineDescription}`,
    summary:
      `Official BEA observation for ${record.datasetName} ${record.tableName} line ${record.lineNumber} ` +
      `(${record.lineDescription}) at ${record.timePeriod}: ${record.rawValue} ${record.units}.`,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observationTimestamp,
    category: 'macro-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['BEA macro series', record.datasetName, record.tableName, record.lineDescription, 'United States']),
    extractedEntities: unique([BEA_SOURCE_NAME, 'United States', record.datasetName, record.tableName, record.lineDescription]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Macroeconomic data', ...event.affectedSectors]),
    confidence: record.confidence,
    beaObservation: record,
  }
}

function dataRows(payload: BeaDataPayload): Array<Record<string, unknown>> {
  const error = payload.BEAAPI?.Results?.Error ?? payload.Results?.Error
  if (error) {
    return []
  }
  const data = payload.BEAAPI?.Results?.Data ?? payload.Results?.Data
  return Array.isArray(data) ? data : []
}

function latestValidRow(rows: Array<Record<string, unknown>>, series: BeaSeriesMeta): Record<string, unknown> | null {
  let best: { row: Record<string, unknown>; timestamp: number } | null = null
  for (const row of rows) {
    if (text(row.TableName) && text(row.TableName).toUpperCase() !== series.tableName.toUpperCase()) continue
    if (text(row.LineNumber) !== series.lineNumber) continue
    const observationDate = beaObservationDate(text(row.TimePeriod))
    const timestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
    const value = parseBeaNumber(text(row.DataValue))
    if (!observationDate || !Number.isFinite(timestamp) || value === null) continue
    if (!best || timestamp > best.timestamp) {
      best = { row, timestamp }
    }
  }
  return best?.row ?? null
}

function hasValidBeaObservation(record: BeaObservation): boolean {
  return (
    record.datasetName.length > 0 &&
    record.tableName.length > 0 &&
    record.lineNumber.length > 0 &&
    ISO_DATE_PATTERN.test(record.observationDate) &&
    Number.isFinite(record.observationTimestamp) &&
    record.metricName.length > 0 &&
    Number.isFinite(record.metricValue) &&
    record.units.length > 0 &&
    /^https:\/\/www\.bea\.gov\//.test(record.sourceUrl) &&
    /^https:\/\/apps\.bea\.gov\/api\/data/.test(record.sourceApiUrl) &&
    !/[?&]UserID=/i.test(record.sourceApiUrl) &&
    record.sourceName === BEA_SOURCE_NAME &&
    record.provenance === 'official-api' &&
    Number.isFinite(record.retrievedAt) &&
    record.rawPayloadHash.length > 0
  )
}

function confidenceForBeaObservation(input: {
  datasetName: string
  tableName: string
  lineNumber: string
  observationDate: string | null
  metricValue: number | null
  sourceUrl: string
  sourceApiUrl: string
  retrievedAt: number
}): number {
  return input.datasetName.length > 0 &&
    input.tableName.length > 0 &&
    input.lineNumber.length > 0 &&
    input.observationDate !== null &&
    ISO_DATE_PATTERN.test(input.observationDate) &&
    input.metricValue !== null &&
    Number.isFinite(input.metricValue) &&
    /^https:\/\/www\.bea\.gov\//.test(input.sourceUrl) &&
    /^https:\/\/apps\.bea\.gov\/api\/data/.test(input.sourceApiUrl) &&
    !/[?&]UserID=/i.test(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 96
    : 60
}

async function fetchBeaJson<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first macro intelligence; official BEA API)',
    },
  })
  assertOk(response, 'BEA')
  const payload = (await response.json()) as T
  const error = beaApiError(payload)
  if (error) {
    throw new Error(error)
  }
  return payload
}

function beaApiError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const body = payload as BeaDataPayload
  const error = body.BEAAPI?.Results?.Error ?? body.Results?.Error
  if (!error) return null
  const code = text(error.APIErrorCode) || 'unknown'
  const description = text(error.APIErrorDescription) || 'Unknown BEA API error'
  return `BEA API error ${code}: ${description}`
}

function beaApiUrl(baseUrl: string, series: BeaSeriesMeta, apiKey?: string): URL {
  const url = new URL(baseUrl)
  if (apiKey) {
    url.searchParams.set('UserID', apiKey)
  }
  url.searchParams.set('method', 'GetData')
  url.searchParams.set('DataSetName', series.datasetName)
  url.searchParams.set('TableName', series.tableName)
  url.searchParams.set('Frequency', series.frequency)
  url.searchParams.set('Year', series.year)
  url.searchParams.set('ResultFormat', 'JSON')
  return url
}

function beaObservationDate(timePeriod: string): string | null {
  const trimmed = timePeriod.toUpperCase()
  const quarter = /^(\d{4})Q([1-4])$/.exec(trimmed) ?? /^(\d{4})-Q([1-4])$/.exec(trimmed)
  if (quarter) {
    return `${quarter[1]}-${String(Number(quarter[2]) * 3).padStart(2, '0')}-01`
  }
  const month = /^(\d{4})M(0[1-9]|1[0-2])$/.exec(trimmed) ?? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(trimmed)
  if (month) {
    return `${month[1]}-${month[2]}-01`
  }
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`
  }
  return null
}

function parseBeaNumber(raw: string): number | null {
  if (!raw || raw === '(NA)' || raw === '---' || raw === '--' || raw === '...') {
    return null
  }
  const normalized = raw.replace(/,/g, '')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function parseSeriesAllowlist(value: unknown): BeaSeriesMeta[] | null {
  const items = text(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (items.length === 0) {
    return null
  }
  const defaults = new Map(BEA_SERIES.map((series) => [`${series.tableName}:${series.lineNumber}`, series]))
  const series = items
    .map((item) => {
      const [tableName, lineNumber] = item.toUpperCase().split(':')
      if (!/^T\d{5}$/.test(tableName) || !/^\d+$/.test(lineNumber ?? '')) return null
      const key = `${tableName}:${lineNumber}`
      return defaults.get(key) ?? {
        datasetName: 'NIPA',
        tableName,
        lineNumber,
        label: `${tableName} line ${lineNumber}`,
        frequency: 'Q',
        year: 'X',
        sourceUrl: BEA_GDP_SOURCE_URL,
      }
    })
    .filter((item): item is BeaSeriesMeta => item !== null)
  return series.length > 0 ? series : null
}

function beaRecordId(datasetName: string, tableName: string, lineNumber: string, timePeriod: string): string {
  return `${SOURCE_ID}:${datasetName.toLowerCase()}:${tableName.toLowerCase()}:${lineNumber}:${timePeriod.toLowerCase()}`
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

export const BEA_SOURCE_ID = SOURCE_ID
