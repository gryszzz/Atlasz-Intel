/*
 * U.S. Treasury Fiscal Data adapter.
 *
 * Uses the official Treasury Fiscal Data REST API (no key required) for the
 * Debt to the Penny dataset. This is government finance context, not market
 * prediction. Malformed records are dropped, never repaired or simulated.
 *
 * provenance: official-api   category: fiscal-event
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { TreasuryFiscalRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'treasury_fiscal_public'
const TREASURY_SOURCE_NAME = 'U.S. Treasury Fiscal Data'
const TREASURY_BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service'
const DEBT_TO_PENNY_PATH = '/v2/accounting/od/debt_to_penny'
const DEBT_TO_PENNY_SOURCE_URL = 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/'
const DEFAULT_RECORD_LIMIT = 1
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000

export type TreasuryMetricDefinition = {
  field: string
  metricName: string
  units: string
}

export const TREASURY_DEBT_TO_PENNY_METRICS: TreasuryMetricDefinition[] = [
  { field: 'tot_pub_debt_out_amt', metricName: 'Total Public Debt Outstanding', units: 'USD' },
  { field: 'debt_held_public_amt', metricName: 'Debt Held by the Public', units: 'USD' },
  { field: 'intragov_hold_amt', metricName: 'Intragovernmental Holdings', units: 'USD' },
]

export type TreasuryFiscalConfig = {
  baseUrl: string
  recordLimit: number
  metrics: TreasuryMetricDefinition[]
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type TreasuryDebtToPennyPayload = {
  data?: Array<Record<string, unknown>>
  meta?: {
    labels?: Record<string, string>
    dataTypes?: Record<string, string>
    dataFormats?: Record<string, string>
  }
}

export function readTreasuryFiscalConfig(env: NodeJS.ProcessEnv = process.env): TreasuryFiscalConfig {
  return {
    baseUrl: asString(env.ATLASZ_TREASURY_BASE_URL) || TREASURY_BASE,
    recordLimit: clampInteger(Number(env.ATLASZ_TREASURY_RECORD_LIMIT ?? DEFAULT_RECORD_LIMIT), 1, 30),
    metrics: TREASURY_DEBT_TO_PENNY_METRICS,
    timeoutMs: clampInteger(Number(env.ATLASZ_TREASURY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_TREASURY_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_TREASURY_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchTreasuryFiscalData(
  signal: AbortSignal,
  config = readTreasuryFiscalConfig(),
): Promise<WorldIntelEvent[]> {
  const sourceApiUrl = debtToPennyApiUrl(config.baseUrl, config.recordLimit)
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchTreasuryJson<TreasuryDebtToPennyPayload>(sourceApiUrl, linkedSignal(signal, attemptSignal)),
    {
      maxRetries: config.maxRetries,
      backoffMs: config.backoffMs,
      timeoutMs: config.timeoutMs,
    },
  )
  const records = normalizeTreasuryDebtToPennyRecords({
    payload,
    retrievedAt: Date.now(),
    sourceApiUrl: sourceApiUrl.toString(),
    metrics: config.metrics,
  })
  return normalizeTreasuryFiscalRecords(records)
}

export function normalizeTreasuryDebtToPennyRecords(input: {
  payload: unknown
  retrievedAt: number
  sourceApiUrl?: string
  metrics?: TreasuryMetricDefinition[]
}): TreasuryFiscalRecord[] {
  if (!input.payload || typeof input.payload !== 'object') {
    return []
  }
  const body = input.payload as TreasuryDebtToPennyPayload
  if (!Array.isArray(body.data)) {
    return []
  }

  const metrics = input.metrics ?? TREASURY_DEBT_TO_PENNY_METRICS
  const sourceApiUrl = input.sourceApiUrl ?? debtToPennyApiUrl(TREASURY_BASE, DEFAULT_RECORD_LIMIT).toString()
  const records: TreasuryFiscalRecord[] = []

  for (const row of body.data) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const recordDate = asString(row.record_date)
    const recordTimestamp = Date.parse(`${recordDate}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate) || !Number.isFinite(recordTimestamp)) {
      continue
    }
    for (const metric of metrics) {
      const rawValue = asString(row[metric.field])
      const metricValue = Number(rawValue)
      const metricName = asString(body.meta?.labels?.[metric.field]) || metric.metricName
      const rawRecord = {
        datasetId: 'debt_to_penny',
        datasetName: 'Debt to the Penny',
        tableId: 'debt_to_penny',
        tableName: 'Debt to the Penny',
        recordDate,
        field: metric.field,
        metricName,
        rawValue,
        row,
        labels: body.meta?.labels ?? {},
        dataTypes: body.meta?.dataTypes ?? {},
        dataFormats: body.meta?.dataFormats ?? {},
        sourceUrl: DEBT_TO_PENNY_SOURCE_URL,
        sourceApiUrl,
        retrievedAt: input.retrievedAt,
      }
      const rawPayloadJson = stableStringify(rawRecord)
      const candidate: TreasuryFiscalRecord = {
        id: treasuryFiscalRecordId('debt_to_penny', metric.field, recordDate),
        datasetId: 'debt_to_penny',
        datasetName: 'Debt to the Penny',
        tableId: 'debt_to_penny',
        tableName: 'Debt to the Penny',
        recordDate,
        recordTimestamp,
        metricName,
        metricValue,
        rawValue,
        units: metric.units,
        sourceUrl: DEBT_TO_PENNY_SOURCE_URL,
        sourceApiUrl,
        sourceName: TREASURY_SOURCE_NAME,
        retrievedAt: input.retrievedAt,
        provenance: 'official-api',
        confidence: confidenceForTreasuryFiscalRecord({
          recordDate,
          metricName,
          metricValue,
          sourceUrl: DEBT_TO_PENNY_SOURCE_URL,
          sourceApiUrl,
          retrievedAt: input.retrievedAt,
        }),
        rawPayloadHash: sha256(rawPayloadJson),
        rawPayloadJson,
      }
      if (hasValidTreasuryFiscalRecord(candidate)) {
        records.push(candidate)
      }
    }
  }

  return records
}

export function normalizeTreasuryFiscalRecords(records: TreasuryFiscalRecord[]): WorldIntelEvent[] {
  return records.filter(hasValidTreasuryFiscalRecord).map(toEvent)
}

function toEvent(record: TreasuryFiscalRecord): WorldIntelEvent {
  const dedupeKey = `treasury|${record.datasetId}|${record.metricName}|${record.recordDate}`.toLowerCase()
  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.datasetName} — ${record.metricName}`,
    summary:
      `Official Treasury Fiscal Data observation for ${record.metricName} on ${record.recordDate}: ` +
      `${record.rawValue} ${record.units}. Dataset ${record.datasetId}, table ${record.tableId}.`,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.recordTimestamp,
    category: 'fiscal-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['Treasury Fiscal Data', record.datasetName, record.metricName, 'United States fiscal position']),
    extractedEntities: unique(['U.S. Treasury', 'United States', record.datasetName, record.tableName, record.metricName]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Government finance', ...event.affectedSectors]),
    confidence: record.confidence,
    treasuryFiscalRecord: record,
  }
}

function hasValidTreasuryFiscalRecord(record: TreasuryFiscalRecord): boolean {
  return Boolean(
    record.datasetId &&
      record.tableId &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.recordDate) &&
      Number.isFinite(record.recordTimestamp) &&
      record.metricName &&
      Number.isFinite(record.metricValue) &&
      record.units &&
      /^https:\/\/fiscaldata\.treasury\.gov\/datasets\/debt-to-the-penny\/?$/.test(record.sourceUrl) &&
      /^https:\/\/api\.fiscaldata\.treasury\.gov\/services\/api\/fiscal_service\/v2\/accounting\/od\/debt_to_penny/.test(record.sourceApiUrl) &&
      record.sourceName === TREASURY_SOURCE_NAME &&
      record.provenance === 'official-api' &&
      Number.isFinite(record.retrievedAt) &&
      record.rawPayloadHash.length > 0,
  )
}

function confidenceForTreasuryFiscalRecord(input: {
  recordDate: string
  metricName: string
  metricValue: number
  sourceUrl: string
  sourceApiUrl: string
  retrievedAt: number
}): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(input.recordDate) &&
    input.metricName.length > 0 &&
    Number.isFinite(input.metricValue) &&
    /^https:\/\/fiscaldata\.treasury\.gov\//.test(input.sourceUrl) &&
    /^https:\/\/api\.fiscaldata\.treasury\.gov\//.test(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 96
    : 60
}

async function fetchTreasuryJson<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first fiscal intelligence; official Treasury Fiscal Data API)',
    },
  })
  assertOk(response, 'Treasury Fiscal Data')
  return (await response.json()) as T
}

function debtToPennyApiUrl(baseUrl: string, limit: number): URL {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${DEBT_TO_PENNY_PATH}`)
  url.searchParams.set('sort', '-record_date')
  url.searchParams.set('page[size]', String(limit))
  url.searchParams.set(
    'fields',
    ['record_date', 'debt_held_public_amt', 'intragov_hold_amt', 'tot_pub_debt_out_amt', 'src_line_nbr'].join(','),
  )
  return url
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

function treasuryFiscalRecordId(datasetId: string, field: string, recordDate: string): string {
  return `${SOURCE_ID}:${datasetId}:${field}:${recordDate}`
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

export const TREASURY_FISCAL_SOURCE_ID = SOURCE_ID
