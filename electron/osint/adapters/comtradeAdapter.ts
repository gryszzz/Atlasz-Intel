/*
 * UN Comtrade trade-flow adapter (catalog-driven, bounded).
 *
 * Official UN Comtrade data API. Requires ATLASZ_UN_COMTRADE_API_KEY and fails
 * closed without it. The subscription key travels ONLY in the
 * Ocp-Apim-Subscription-Key header — never in a URL, source trail, or persisted
 * payload. Commodity coverage is discovered from the reference catalog (all
 * commodities), then pulled in bounded batches with checkpoint/resume — never an
 * uncontrolled full-world run. Real trade values only; malformed rows dropped.
 * No company-level claims and no inferred supply chains: country/partner/commodity
 * trade-flow evidence only.
 *
 * provenance: official-api   category: trade-flow
 */
import { adapterEventId, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { fetchCommodityCatalog, commodityCodesForLevel } from './comtradeCatalog'
import {
  buildQueryPlan,
  describeQueryScope,
  nextRunWindow,
  planKey,
  type ComtradeCheckpoint,
  type ComtradeQueryBatch,
  type ComtradeQueryFilter,
  type ComtradeQueryScope,
} from './comtradePlanner'
import type { ComtradeChangeType, ComtradeTradeRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'un_comtrade_public'
const SOURCE_NAME = 'UN Comtrade'
const DEFAULT_API_BASE = 'https://comtradeapi.un.org/data/v1/get'
const COMTRADE_PAGE = 'https://comtradeplus.un.org/'
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_500

export type ComtradeConfig = {
  apiBase: string
  apiKey: string
  typeCode: string
  freqCode: string
  classification: string
  reporterCode: string
  partnerCode: string
  flowCode: string
  period: string
  batchSize: number
  maxRequestsPerRun: number
  commodityAggrLevel?: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readComtradeConfig(env: NodeJS.ProcessEnv = process.env): ComtradeConfig | null {
  if (env.ATLASZ_UN_COMTRADE_DISABLE === '1') {
    return null
  }
  const apiKey = asString(env.ATLASZ_UN_COMTRADE_API_KEY)
  if (!apiKey) {
    return null // key-gated: fail closed
  }
  const apiBase = asString(env.ATLASZ_UN_COMTRADE_API_BASE) || DEFAULT_API_BASE
  if (!/^https:\/\//i.test(apiBase)) {
    return null
  }
  const aggr = Number(env.ATLASZ_UN_COMTRADE_COMMODITY_LEVEL)
  return {
    apiBase,
    apiKey,
    typeCode: asString(env.ATLASZ_UN_COMTRADE_TYPE) || 'C',
    freqCode: asString(env.ATLASZ_UN_COMTRADE_FREQ) || 'A',
    classification: asString(env.ATLASZ_UN_COMTRADE_CLASSIFICATION) || 'HS',
    reporterCode: asString(env.ATLASZ_UN_COMTRADE_REPORTER) || '842', // USA default; bounded single reporter
    partnerCode: asString(env.ATLASZ_UN_COMTRADE_PARTNER) || '0', // World
    flowCode: asString(env.ATLASZ_UN_COMTRADE_FLOW) || 'M,X',
    period: asString(env.ATLASZ_UN_COMTRADE_PERIOD) || String(new Date().getUTCFullYear() - 1),
    batchSize: clampInt(Number(env.ATLASZ_UN_COMTRADE_BATCH_SIZE ?? 50), 1, 100),
    maxRequestsPerRun: clampInt(Number(env.ATLASZ_UN_COMTRADE_MAX_REQUESTS ?? 5), 1, 50),
    commodityAggrLevel: Number.isFinite(aggr) && aggr > 0 ? aggr : undefined,
    timeoutMs: clampInt(Number(env.ATLASZ_UN_COMTRADE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_UN_COMTRADE_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_UN_COMTRADE_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

// Per-process checkpoint store so successive polls resume through the plan
// (bounded pulls only), rather than re-pulling the same batches every run.
const checkpointStore = new Map<string, ComtradeCheckpoint>()

export function fetchComtradeFilter(config: ComtradeConfig, commodityCodes: string[]): ComtradeQueryFilter {
  return {
    typeCode: config.typeCode,
    freqCode: config.freqCode,
    classification: config.classification,
    reporterCode: config.reporterCode,
    partnerCode: config.partnerCode,
    flowCode: config.flowCode,
    period: config.period,
    commodityCodes,
  }
}

export async function fetchComtradeEvents(
  signal: AbortSignal,
  config = readComtradeConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  // 1. Discover ALL commodity codes from the official catalog (no key needed).
  const catalog = await fetchCommodityCatalog(config.classification, signal)
  const commodityCodes = commodityCodesForLevel(catalog, { aggrLevel: config.commodityAggrLevel, leafOnly: true })
  if (commodityCodes.length === 0) {
    return []
  }
  // 2. Plan bounded batches over the full commodity set.
  const plan = buildQueryPlan(fetchComtradeFilter(config, commodityCodes), {
    batchSize: config.batchSize,
    maxRequestsPerRun: config.maxRequestsPerRun,
  })
  // 3. Resume from the prior checkpoint; run only this run's bounded window.
  const key = planKey(plan)
  const prior = checkpointStore.get(key) ?? null
  const window = nextRunWindow(plan, prior, Date.now())
  checkpointStore.set(key, window.done ? { ...window.nextCheckpoint, nextBatchIndex: 0, completedBatches: 0 } : window.nextCheckpoint)

  const records: ComtradeTradeRecord[] = []
  for (const batch of window.batches) {
    const batchRecords = await fetchComtradeBatch(batch, config, signal)
    records.push(...batchRecords)
  }
  return normalizeComtradeRecords(records)
}

async function fetchComtradeBatch(batch: ComtradeQueryBatch, config: ComtradeConfig, signal: AbortSignal): Promise<ComtradeTradeRecord[]> {
  const requestUrl = buildDataUrl(config, batch)
  const retrievedAt = Date.now()
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchComtradeJson(requestUrl, config.apiKey, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  return parseComtradeData(payload, { config, retrievedAt, sourceApiUrl: requestUrl })
}

async function fetchComtradeJson(url: string, apiKey: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    // Key travels ONLY in this header — never in the URL or any persisted field.
    headers: { accept: 'application/json', 'Ocp-Apim-Subscription-Key': apiKey },
  })
  assertOk(response, 'UN Comtrade')
  return response.json() as Promise<unknown>
}

/** Pure parser — testable with official Comtrade data-API response fixtures. */
export function parseComtradeData(
  payload: unknown,
  options: { config?: Partial<ComtradeConfig>; retrievedAt?: number; sourceApiUrl?: string } = {},
): ComtradeTradeRecord[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { data?: unknown }).data
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = sanitizeUrl(options.sourceApiUrl ?? DEFAULT_API_BASE)
  const classification = asString(options.config?.classification) || 'HS'
  const typeCode = asString(options.config?.typeCode) || 'C'
  const freqCode = asString(options.config?.freqCode) || 'A'
  const out: ComtradeTradeRecord[] = []

  for (const row of rows) {
    const record = asObject(row)
    if (!record) continue
    // Comtrade returns reporter/partner codes as NUMBERS; commodity may be either.
    const reporterCode = codeValue(record.reporterCode)
    const partnerCode = codeValue(record.partnerCode)
    const commodityCode = codeValue(record.cmdCode)
    const flowCode = asString(record.flowCode) || codeValue(record.flowCode)
    const period = asString(record.period) || codeValue(record.period) || asString(record.refPeriodId)
    const refYear = toNumber(record.refYear) ?? toNumber(record.period)
    const tradeValue = toNumber(record.primaryValue)
    const datasetCode = `${typeCode}-${freqCode}-${classification}`

    if (
      !hasValidRecord({ reporterCode, partnerCode, commodityCode, flowCode, period, refYear, tradeValue, sourceApiUrl, retrievedAt })
    ) {
      continue // drop malformed; never repair
    }

    const rawPayloadJson = stableStringify({
      typeCode,
      freqCode,
      classification,
      reporterCode,
      reporterDesc: asString(record.reporterDesc),
      partnerCode,
      partnerDesc: asString(record.partnerDesc),
      cmdCode: commodityCode,
      cmdDesc: asString(record.cmdDesc),
      flowCode,
      flowDesc: asString(record.flowDesc),
      period,
      refYear,
      primaryValue: tradeValue,
      qty: toNumber(record.qty),
      qtyUnitAbbr: asString(record.qtyUnitAbbr),
      netWgt: toNumber(record.netWgt),
    })

    out.push({
      id: comtradeRecordId({ datasetCode, reporterCode, partnerCode, commodityCode, flowCode, period }),
      datasetCode,
      typeCode,
      freqCode,
      classification,
      commodityCode,
      commodityDescription: asString(record.cmdDesc) || commodityCode,
      reporterCode,
      reporterDesc: asString(record.reporterDesc) || reporterCode,
      reporterIso3: asString(record.reporterISO) || undefined,
      partnerCode,
      partnerDesc: asString(record.partnerDesc) || partnerCode,
      partnerIso3: asString(record.partnerISO) || undefined,
      flowCode,
      flowDesc: asString(record.flowDesc) || flowCode,
      period,
      refYear: refYear as number,
      tradeValue: tradeValue as number,
      quantity: toNumber(record.qty),
      quantityUnit: asString(record.qtyUnitAbbr) || undefined,
      netWeight: toNumber(record.netWgt),
      sourceUrl: COMTRADE_PAGE,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForRecord({ reporterCode, partnerCode, commodityCode, flowCode, period, refYear, tradeValue, sourceApiUrl, retrievedAt }),
      changeType: 'first_seen',
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

export function normalizeComtradeRecords(records: ComtradeTradeRecord[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

export function applyComtradeChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.comtradeRecord) return event
  const prior = previous?.comtradeRecord
  const changeType: ComtradeChangeType = !prior
    ? 'first_seen'
    : prior.rawPayloadHash === event.comtradeRecord.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, comtradeRecord: { ...event.comtradeRecord, changeType } }
}

function toEvent(record: ComtradeTradeRecord): WorldIntelEvent {
  const dedupeKey = `comtrade|${record.id}`.toLowerCase()
  const value = formatUsd(record.tradeValue)
  const qtyNote = record.quantity !== undefined && record.quantityUnit ? ` Quantity: ${record.quantity} ${record.quantityUnit}.` : ''
  const summary =
    `UN Comtrade ${record.flowDesc.toLowerCase()} trade flow (${record.period}): ${record.reporterDesc} ${record.flowDesc.toLowerCase()} of ` +
    `${record.commodityDescription} with ${record.partnerDesc} — ${value}.${qtyNote} Official country/commodity trade-flow data; not a company-level claim.`
  const observedAt = Date.parse(`${record.refYear}-01-01T00:00:00Z`)

  // Built directly so no tickers/sectors/companies are inferred from descriptions.
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: Number.isFinite(observedAt) ? observedAt : record.retrievedAt,
    title: `${record.reporterDesc} ${record.flowDesc} · ${record.commodityCode} ${truncate(record.commodityDescription, 60)}`.slice(0, 180),
    summary,
    countryCodes: unique([record.reporterIso3, record.partnerIso3].filter((iso): iso is string => Boolean(iso && iso !== 'W00' && iso.length === 3))),
    region: 'global',
    category: 'trade-flow',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceUrl,
    provenance: 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.reporterDesc, record.partnerDesc, record.commodityCode]),
    narrativeTags: unique(['UN Comtrade', 'trade flow', record.flowDesc]),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    comtradeRecord: record,
  }
}

/** The bounded scope a fetch would cover, for the UI scope summary (no network). */
export function comtradeQueryScope(config: ComtradeConfig, commodityCodes: string[]): ComtradeQueryScope {
  const plan = buildQueryPlan(fetchComtradeFilter(config, commodityCodes), {
    batchSize: config.batchSize,
    maxRequestsPerRun: config.maxRequestsPerRun,
  })
  return describeQueryScope(plan)
}

function buildDataUrl(config: ComtradeConfig, batch: ComtradeQueryBatch): string {
  const base = config.apiBase.replace(/\/$/, '')
  const url = new URL(`${base}/${batch.typeCode}/${batch.freqCode}/${batch.classification}`)
  url.searchParams.set('reporterCode', batch.reporterCode)
  url.searchParams.set('period', batch.period)
  url.searchParams.set('partnerCode', batch.partnerCode)
  url.searchParams.set('flowCode', batch.flowCode)
  url.searchParams.set('cmdCode', batch.commodityCodes.join(','))
  // Note: NO subscription key here — it travels only in the request header.
  return url.toString()
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value)
    url.searchParams.delete('subscription-key')
    url.searchParams.delete('Ocp-Apim-Subscription-Key')
    return url.toString()
  } catch {
    return value
  }
}

function hasValidRecord(input: {
  reporterCode: string
  partnerCode: string
  commodityCode: string
  flowCode: string
  period: string
  refYear: number | undefined
  tradeValue: number | undefined
  sourceApiUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    /^\d+$/.test(input.reporterCode) &&
      /^\d+$/.test(input.partnerCode) &&
      input.commodityCode &&
      input.flowCode &&
      input.period &&
      input.refYear !== undefined &&
      Number.isFinite(input.refYear) &&
      input.tradeValue !== undefined &&
      Number.isFinite(input.tradeValue) &&
      input.tradeValue >= 0 &&
      !/subscription-key/i.test(input.sourceApiUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForRecord(input: Parameters<typeof hasValidRecord>[0]): number {
  return hasValidRecord(input) ? 96 : 60
}

function comtradeRecordId(parts: {
  datasetCode: string
  reporterCode: string
  partnerCode: string
  commodityCode: string
  flowCode: string
  period: string
}): string {
  return `${SOURCE_ID}:${parts.datasetCode}:${parts.reporterCode}:${parts.partnerCode}:${parts.commodityCode}:${parts.flowCode}:${parts.period}`.toLowerCase()
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/** Coerce a code that may arrive as a number (reporterCode: 842) or string. */
function codeValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return typeof value === 'string' ? value.trim() : ''
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, child: AbortSignal): AbortSignal {
  if (parent.aborted) return parent
  if (child.aborted) return child
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  child.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export function resetComtradeCheckpoints(): void {
  checkpointStore.clear()
}

export const UN_COMTRADE_SOURCE_ID = SOURCE_ID
