/*
 * U.S. Energy Information Administration public bulk adapter.
 *
 * This is NOT the authenticated EIA Open Data API connector. It uses the
 * official no-key bulk manifest/ZIP files as a bounded reference baseline for a
 * small allowlist of Atlasz energy series. Large ZIP members are streamed,
 * inflated line-by-line, and stopped as soon as the allowlisted series are
 * found or the guardrails are reached.
 *
 * provenance: official-api   category: energy-event
 */
import { createInflateRaw } from 'node:zlib'
import { adapterEventId, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { EiaEnergyRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_bulk_public'
const EIA_SOURCE_NAME = 'U.S. Energy Information Administration'
const MANIFEST_URL = 'https://www.eia.gov/opendata/bulk/manifest.txt'
const BULK_PAGE_URL = 'https://www.eia.gov/opendata/bulkfiles.php'
const DEFAULT_TIMEOUT_MS = 12_000
const DEFAULT_DATASET_TIMEOUT_MS = 8_000
const DEFAULT_MAX_RETRIES = 0
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX_RECORDS = 5
const DEFAULT_MAX_LINES_PER_DATASET = 750_000
const DEFAULT_MAX_COMPRESSED_BYTES = 96 * 1024 * 1024
const DEFAULT_MAX_LINE_CHARS = 4 * 1024 * 1024
const EIA_BULK_USER_AGENT = 'AtlaszIntel/0.2.0 (local-first energy intelligence; official EIA public bulk)'
const ZIP_LOCAL_FILE_HEADER = 0x04034b50
const DEFLATE_METHOD = 8
const STORE_METHOD = 0
const DAY_MS = 24 * 60 * 60 * 1000
const SERIES_ID_PATTERN = /^[A-Z0-9._-]+$/i
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type EiaBulkDatasetId = 'PET' | 'NG' | 'ELEC'

export type EiaBulkSeriesMeta = {
  dataset: EiaBulkDatasetId
  seriesId: string
  title: string
  energyCategory: string
  commodity: string
  region?: string
  countryCode?: string
  sourceUrl: string
}

export const EIA_BULK_SERIES: EiaBulkSeriesMeta[] = [
  {
    dataset: 'PET',
    seriesId: 'PET.RWTC.D',
    title: 'Cushing, OK WTI spot price FOB',
    energyCategory: 'Petroleum',
    commodity: 'Crude Oil',
    region: 'United States',
    countryCode: 'US',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/pri/spt',
  },
  {
    dataset: 'NG',
    seriesId: 'NG.RNGWHHD.D',
    title: 'Henry Hub natural gas spot price',
    energyCategory: 'Natural Gas',
    commodity: 'Natural Gas',
    region: 'United States',
    countryCode: 'US',
    sourceUrl: 'https://www.eia.gov/opendata/browser/natural-gas/pri/fut',
  },
  {
    dataset: 'PET',
    seriesId: 'PET.EMM_EPM0_PTE_NUS_DPG.W',
    title: 'U.S. all grades retail gasoline price',
    energyCategory: 'Petroleum',
    commodity: 'Gasoline',
    region: 'United States',
    countryCode: 'US',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/pri/gnd',
  },
  {
    dataset: 'PET',
    seriesId: 'PET.WCESTUS1.W',
    title: 'U.S. ending stocks of crude oil',
    energyCategory: 'Petroleum',
    commodity: 'Crude Oil',
    region: 'United States',
    countryCode: 'US',
    sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/stoc/wstk',
  },
  {
    dataset: 'ELEC',
    seriesId: 'ELEC.GEN.ALL-US-99.M',
    title: 'U.S. electricity net generation',
    energyCategory: 'Electricity',
    commodity: 'Electricity',
    region: 'United States',
    countryCode: 'US',
    sourceUrl: 'https://www.eia.gov/opendata/browser/electricity/electric-power-operational-data',
  },
]

export type EiaBulkConfig = {
  manifestUrl: string
  series: EiaBulkSeriesMeta[]
  maxRecords: number
  maxLinesPerDataset: number
  maxCompressedBytes: number
  maxLineChars: number
  timeoutMs: number
  datasetTimeoutMs: number
  maxRetries: number
  backoffMs: number
}

type EiaBulkManifest = {
  dataset?: Record<string, EiaBulkManifestEntry>
}

type EiaBulkManifestEntry = {
  data_set?: string
  identifier?: string
  title?: string
  name?: string
  accessURL?: string
  modified?: string
  last_updated?: string
  publisher?: string
  accessLevel?: string
}

type EiaBulkRawSeries = {
  series_id?: string
  name?: string
  units?: string
  f?: string
  unitsshort?: string
  description?: string
  source?: string
  iso3166?: string
  geography?: string
  last_updated?: string
  data?: unknown
}

export type EiaBulkScanResult = {
  records: EiaEnergyRecord[]
  scannedLines: number
  foundSeries: string[]
  stoppedBy: 'complete' | 'line-limit' | 'byte-limit' | 'eof'
}

type ZipHeader = {
  method: number
  compressedSize: number
  dataOffset: number
}

export function readEiaBulkConfig(env: NodeJS.ProcessEnv = process.env): EiaBulkConfig | null {
  if (env.ATLASZ_EIA_BULK_DISABLE === '1') return null
  const manifestUrl = asString(env.ATLASZ_EIA_BULK_MANIFEST_URL) || MANIFEST_URL
  if (!isOfficialEiaBulkUrl(manifestUrl, 'manifest')) return null
  const includeElec = env.ATLASZ_EIA_BULK_INCLUDE_ELEC !== '0'
  const series = parseSeriesAllowlist(env.ATLASZ_EIA_BULK_SERIES, includeElec)
  if (series.length === 0) return null
  return {
    manifestUrl,
    series,
    maxRecords: clampInteger(Number(env.ATLASZ_EIA_BULK_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, 12),
    maxLinesPerDataset: clampInteger(Number(env.ATLASZ_EIA_BULK_MAX_LINES ?? DEFAULT_MAX_LINES_PER_DATASET), 1, 1_000_000),
    maxCompressedBytes: clampInteger(Number(env.ATLASZ_EIA_BULK_MAX_COMPRESSED_BYTES ?? DEFAULT_MAX_COMPRESSED_BYTES), 64 * 1024, 256 * 1024 * 1024),
    maxLineChars: clampInteger(Number(env.ATLASZ_EIA_BULK_MAX_LINE_CHARS ?? DEFAULT_MAX_LINE_CHARS), 64 * 1024, 8 * 1024 * 1024),
    timeoutMs: clampInteger(Number(env.ATLASZ_EIA_BULK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    datasetTimeoutMs: clampInteger(Number(env.ATLASZ_EIA_BULK_DATASET_TIMEOUT_MS ?? DEFAULT_DATASET_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_EIA_BULK_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 3),
    backoffMs: clampInteger(Number(env.ATLASZ_EIA_BULK_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchEiaBulkEnergyRecords(
  signal: AbortSignal,
  config = readEiaBulkConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.series.length === 0) return []
  const manifest = await fetchWithRetry(
    (attemptSignal) => fetchEiaBulkManifest(config.manifestUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const byDataset = new Map<EiaBulkDatasetId, EiaBulkSeriesMeta[]>()
  for (const series of config.series.slice(0, config.maxRecords)) {
    byDataset.set(series.dataset, [...(byDataset.get(series.dataset) ?? []), series])
  }

  const settled = await Promise.allSettled(
    [...byDataset.entries()].map(([dataset, series]) => fetchDatasetRecords(dataset, series, manifest, signal, config)),
  )
  const records = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  return normalizeEiaBulkEnergyRecords(records)
}

export function normalizeEiaBulkEnergyRecords(records: EiaEnergyRecord[]): WorldIntelEvent[] {
  return records.filter(hasValidEiaBulkEnergyRecord).map(toEvent)
}

export function parseEiaBulkSeriesLine(
  line: string,
  options: {
    series: EiaBulkSeriesMeta[]
    retrievedAt?: number
    sourceApiUrl?: string
    manifestModified?: string
    datasetTitle?: string
  },
): EiaEnergyRecord | null {
  const idMatch = /"series_id"\s*:\s*"([^"]+)"/.exec(line)
  const seriesId = idMatch?.[1]?.toUpperCase()
  if (!seriesId) return null
  const meta = options.series.find((candidate) => candidate.seriesId.toUpperCase() === seriesId)
  if (!meta) return null
  let payload: EiaBulkRawSeries
  try {
    payload = JSON.parse(line) as EiaBulkRawSeries
  } catch {
    return null
  }
  return normalizeBulkSeries(payload, {
    meta,
    retrievedAt: options.retrievedAt ?? Date.now(),
    sourceApiUrl: options.sourceApiUrl ?? bulkZipUrl(meta.dataset),
    manifestModified: options.manifestModified,
    datasetTitle: options.datasetTitle,
  })
}

export function scanEiaBulkJsonLines(
  lines: Iterable<string>,
  options: {
    series: EiaBulkSeriesMeta[]
    retrievedAt?: number
    sourceApiUrl?: string
    manifestModified?: string
    datasetTitle?: string
    maxLines?: number
    maxRecords?: number
  },
): EiaBulkScanResult {
  const targetIds = new Set(options.series.map((series) => series.seriesId.toUpperCase()))
  const processed = new Set<string>()
  const records: EiaEnergyRecord[] = []
  let scannedLines = 0
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES_PER_DATASET
  const maxRecords = options.maxRecords ?? DEFAULT_MAX_RECORDS
  for (const line of lines) {
    scannedLines += 1
    const idMatch = /"series_id"\s*:\s*"([^"]+)"/.exec(line)
    const seriesId = idMatch?.[1]?.toUpperCase()
    if (seriesId && targetIds.has(seriesId)) {
      processed.add(seriesId)
      const record = parseEiaBulkSeriesLine(line, options)
      if (record) records.push(record)
      if (processed.size >= targetIds.size || records.length >= maxRecords) {
        return { records, scannedLines, foundSeries: [...processed], stoppedBy: 'complete' }
      }
    }
    if (scannedLines >= maxLines) {
      return { records, scannedLines, foundSeries: [...processed], stoppedBy: 'line-limit' }
    }
  }
  return { records, scannedLines, foundSeries: [...processed], stoppedBy: 'eof' }
}

export function isOfficialEiaBulkUrl(value: string, kind: 'manifest' | 'zip' = 'zip'): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'www.eia.gov') return false
    if (kind === 'manifest') return url.pathname === '/opendata/bulk/manifest.txt'
    return /^\/opendata\/bulk\/[A-Z0-9_-]+\.zip$/.test(url.pathname)
  } catch {
    return false
  }
}

async function fetchEiaBulkManifest(url: string, signal: AbortSignal): Promise<EiaBulkManifest> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json, text/plain, */*', 'user-agent': EIA_BULK_USER_AGENT },
  })
  assertOk(response, 'EIA public bulk manifest')
  const payload = (await response.json()) as unknown
  if (!payload || typeof payload !== 'object') throw new Error('EIA public bulk manifest malformed')
  return payload as EiaBulkManifest
}

async function fetchDatasetRecords(
  dataset: EiaBulkDatasetId,
  series: EiaBulkSeriesMeta[],
  manifest: EiaBulkManifest,
  signal: AbortSignal,
  config: EiaBulkConfig,
): Promise<EiaEnergyRecord[]> {
  const entry = manifest.dataset?.[dataset]
  const sourceApiUrl = asString(entry?.accessURL) || bulkZipUrl(dataset)
  if (!isOfficialEiaBulkUrl(sourceApiUrl, 'zip')) return []
  const datasetSignal = timeoutLinkedSignal(signal, config.datasetTimeoutMs)
  const retrievedAt = Date.now()
  try {
    return await fetchWithRetry(
      async (attemptSignal) => {
        const response = await fetch(sourceApiUrl, {
          signal: linkedSignal(datasetSignal, attemptSignal),
          headers: { accept: 'application/zip, application/octet-stream, */*', 'user-agent': EIA_BULK_USER_AGENT },
        })
        assertOk(response, `EIA ${dataset} public bulk`)
        if (!response.body) throw new Error(`EIA ${dataset} public bulk missing response body`)
        const scan = await scanEiaBulkZipStream(response.body, {
          series,
          retrievedAt,
          sourceApiUrl,
          manifestModified: asString(entry?.modified || entry?.last_updated),
          datasetTitle: asString(entry?.title || entry?.name),
          maxLines: config.maxLinesPerDataset,
          maxRecords: config.maxRecords,
          maxCompressedBytes: config.maxCompressedBytes,
          maxLineChars: config.maxLineChars,
        })
        return scan.records
      },
      { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.datasetTimeoutMs },
    )
  } catch {
    // Partial public bulk baseline: if a huge dataset times out or hits a guard,
    // other datasets can still provide source-backed records. No fake fallback.
    return []
  }
}

async function scanEiaBulkZipStream(
  body: ReadableStream<Uint8Array>,
  options: {
    series: EiaBulkSeriesMeta[]
    retrievedAt: number
    sourceApiUrl: string
    manifestModified?: string
    datasetTitle?: string
    maxLines: number
    maxRecords: number
    maxCompressedBytes: number
    maxLineChars: number
  },
): Promise<EiaBulkScanResult> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const targetIds = new Set(options.series.map((series) => series.seriesId.toUpperCase()))
  const processed = new Set<string>()
  const records: EiaEnergyRecord[] = []
  let headerBuffer = Buffer.alloc(0)
  let header: ZipHeader | null = null
  let fedCompressedBytes = 0
  let scannedLines = 0
  let carry = ''
  let stoppedBy: EiaBulkScanResult['stoppedBy'] = 'eof'
  let destroyedEarly = false

  const inflator = createInflateRaw()
  const inflateDone = new Promise<void>((resolve, reject) => {
    inflator.on('data', (chunk: Buffer) => {
      consumeText(decoder.decode(chunk, { stream: true }))
    })
    inflator.on('end', () => {
      consumeText(decoder.decode())
      if (carry) consumeLine(carry)
      carry = ''
      resolve()
    })
    inflator.on('error', (error) => {
      if (destroyedEarly) resolve()
      else reject(error)
    })
  })

  const complete = () => processed.size >= targetIds.size || records.length >= options.maxRecords
  const stop = async (reason: EiaBulkScanResult['stoppedBy']) => {
    stoppedBy = reason
    destroyedEarly = true
    inflator.destroy()
    await reader.cancel().catch(() => undefined)
  }
  const writeInflate = (chunk: Buffer) => new Promise<void>((resolve, reject) => {
    inflator.write(chunk, (error) => error ? reject(error) : resolve())
  })

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      let chunk = Buffer.from(value)
      if (!header) {
        headerBuffer = Buffer.concat([headerBuffer, chunk])
        const parsed = parseZipHeader(headerBuffer)
        if (!parsed) continue
        header = parsed
        chunk = headerBuffer.subarray(header.dataOffset)
        headerBuffer = Buffer.alloc(0)
        if (header.method !== DEFLATE_METHOD && header.method !== STORE_METHOD) {
          throw new Error(`EIA public bulk unsupported ZIP method ${header.method}`)
        }
      }
      const remainingMemberBytes = header.compressedSize - fedCompressedBytes
      const remainingGuardBytes = options.maxCompressedBytes - fedCompressedBytes
      const writeLength = Math.min(chunk.length, remainingMemberBytes, remainingGuardBytes)
      if (writeLength > 0) {
        const payload = chunk.subarray(0, writeLength)
        fedCompressedBytes += writeLength
        if (header.method === DEFLATE_METHOD) await writeInflate(payload)
        else consumeText(decoder.decode(payload, { stream: true }))
      }
      if (complete()) {
        await stop('complete')
        break
      }
      if (scannedLines >= options.maxLines) {
        await stop('line-limit')
        break
      }
      if (fedCompressedBytes >= options.maxCompressedBytes && fedCompressedBytes < header.compressedSize) {
        await stop('byte-limit')
        break
      }
      if (fedCompressedBytes >= header.compressedSize) break
    }
    if (!destroyedEarly) {
      inflator.end()
      await inflateDone
    }
  } finally {
    if (!destroyedEarly) await reader.cancel().catch(() => undefined)
  }

  return { records, scannedLines, foundSeries: [...processed], stoppedBy }

  function consumeText(text: string) {
    if (!text || complete()) return
    carry += text
    if (carry.length > options.maxLineChars) {
      carry = ''
      scannedLines += 1
      return
    }
    for (;;) {
      const index = carry.indexOf('\n')
      if (index < 0) break
      const line = carry.slice(0, index).trim()
      carry = carry.slice(index + 1)
      if (line) consumeLine(line)
      if (complete() || scannedLines >= options.maxLines) break
    }
  }

  function consumeLine(line: string) {
    scannedLines += 1
    const idMatch = /"series_id"\s*:\s*"([^"]+)"/.exec(line)
    const seriesId = idMatch?.[1]?.toUpperCase()
    if (!seriesId || !targetIds.has(seriesId) || processed.has(seriesId)) return
    processed.add(seriesId)
    const record = parseEiaBulkSeriesLine(line, options)
    if (record) records.push(record)
  }
}

function normalizeBulkSeries(
  payload: EiaBulkRawSeries,
  options: {
    meta: EiaBulkSeriesMeta
    retrievedAt: number
    sourceApiUrl: string
    manifestModified?: string
    datasetTitle?: string
  },
): EiaEnergyRecord | null {
  const seriesId = asString(payload.series_id).toUpperCase()
  if (seriesId !== options.meta.seriesId.toUpperCase() || !Array.isArray(payload.data)) return null
  const latest = latestValidObservation(payload.data)
  if (!latest) return null
  const observationDate = eiaObservationDate(latest.period)
  const observationTimestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
  const units = asString(payload.units) || options.meta.title
  const title = asString(payload.name) || options.meta.title
  const lastUpdated = asString(payload.last_updated || options.manifestModified)
  const lastUpdatedAt = Date.parse(lastUpdated)
  const staleAt = (Number.isFinite(lastUpdatedAt) ? lastUpdatedAt : options.retrievedAt) + staleWindowForFrequency(asString(payload.f))
  const sourceApiUrl = sanitizeBulkUrl(options.sourceApiUrl)
  const rawPayloadJson = stableStringify({
    bulkReference: true,
    dataset: options.meta.dataset,
    datasetTitle: options.datasetTitle,
    seriesId,
    title,
    energyCategory: options.meta.energyCategory,
    commodity: options.meta.commodity,
    period: latest.period,
    observationDate,
    rawValue: latest.rawValue,
    value: latest.value,
    units,
    frequency: asString(payload.f),
    source: asString(payload.source),
    sourceUrl: options.meta.sourceUrl,
    sourceApiUrl,
    manifestModified: options.manifestModified,
    lastUpdated,
    retrievedAt: options.retrievedAt,
    staleAt,
  })
  const record: EiaEnergyRecord = {
    id: `${SOURCE_ID}:${seriesId}:${latest.period}`.toLowerCase(),
    seriesId,
    title,
    energyCategory: options.meta.energyCategory,
    commodity: options.meta.commodity,
    region: options.meta.region,
    countryCode: normalizeCountryCode(asString(payload.iso3166) || options.meta.countryCode),
    period: latest.period,
    observationDate: observationDate ?? '',
    observationTimestamp,
    value: latest.value,
    rawValue: latest.rawValue,
    units,
    sourceUrl: options.meta.sourceUrl || BULK_PAGE_URL,
    sourceApiUrl,
    sourceName: EIA_SOURCE_NAME,
    retrievedAt: options.retrievedAt,
    staleAt,
    provenance: 'official-api',
    confidence: confidenceForBulkRecord({ seriesId, observationDate, value: latest.value, sourceApiUrl, staleAt }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }
  return hasValidEiaBulkEnergyRecord(record) ? record : null
}

function toEvent(record: EiaEnergyRecord): WorldIntelEvent {
  const dedupeKey = `eia-bulk|${record.seriesId}|${record.period}`.toLowerCase()
  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `EIA public bulk ${record.seriesId} — ${record.title}`,
    summary:
      `EIA public bulk reference for ${record.seriesId} (${record.commodity}) at ${record.period}: ` +
      `${record.rawValue} ${record.units}. No API key required; bounded series subset, not full EIA API coverage.`,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observationTimestamp,
    category: 'energy-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['EIA public bulk reference', 'bounded series subset', record.energyCategory, record.commodity, record.seriesId]),
    extractedEntities: unique([EIA_SOURCE_NAME, 'EIA public bulk reference', record.seriesId, record.title, record.commodity, record.region ?? '']),
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

function parseZipHeader(buffer: Buffer): ZipHeader | null {
  if (buffer.length < 30) return null
  if (buffer.readUInt32LE(0) !== ZIP_LOCAL_FILE_HEADER) throw new Error('EIA public bulk ZIP malformed')
  const method = buffer.readUInt16LE(8)
  const compressedSize = buffer.readUInt32LE(18)
  const fileNameLength = buffer.readUInt16LE(26)
  const extraLength = buffer.readUInt16LE(28)
  const dataOffset = 30 + fileNameLength + extraLength
  if (buffer.length < dataOffset) return null
  if (!Number.isFinite(compressedSize) || compressedSize <= 0) throw new Error('EIA public bulk ZIP missing compressed size')
  return { method, compressedSize, dataOffset }
}

function latestValidObservation(data: unknown[]): { period: string; rawValue: string; value: number } | null {
  let best: { period: string; rawValue: string; value: number; timestamp: number } | null = null
  for (const entry of data) {
    if (!Array.isArray(entry) || entry.length < 2) continue
    const period = asString(entry[0])
    const rawValue = textValue(entry[1])
    const value = parseEiaNumber(rawValue)
    const observationDate = eiaObservationDate(period)
    const timestamp = observationDate ? Date.parse(`${observationDate}T00:00:00Z`) : Number.NaN
    if (!period || value === null || !Number.isFinite(timestamp)) continue
    if (!best || timestamp > best.timestamp) best = { period, rawValue, value, timestamp }
  }
  return best ? { period: best.period, rawValue: best.rawValue, value: best.value } : null
}

function textValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function hasValidEiaBulkEnergyRecord(record: EiaEnergyRecord): boolean {
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
    isOfficialEiaBulkUrl(record.sourceApiUrl, 'zip') &&
    !/[?&]api_key=/i.test(record.sourceApiUrl) &&
    record.sourceName === EIA_SOURCE_NAME &&
    record.provenance === 'official-api' &&
    Number.isFinite(record.retrievedAt) &&
    Number.isFinite(record.staleAt) &&
    record.rawPayloadHash.length > 0 &&
    !(record.rawPayloadJson ?? '').includes('api_key')
  )
}

function confidenceForBulkRecord(input: {
  seriesId: string
  observationDate: string | null
  value: number
  sourceApiUrl: string
  staleAt: number
}): number {
  return SERIES_ID_PATTERN.test(input.seriesId) &&
    input.observationDate !== null &&
    ISO_DATE_PATTERN.test(input.observationDate) &&
    Number.isFinite(input.value) &&
    isOfficialEiaBulkUrl(input.sourceApiUrl, 'zip') &&
    Number.isFinite(input.staleAt)
    ? 94
    : 60
}

function parseSeriesAllowlist(value: unknown, includeElec: boolean): EiaBulkSeriesMeta[] {
  const defaults = new Map(EIA_BULK_SERIES.map((series) => [series.seriesId.toUpperCase(), series]))
  const requested = asString(value)
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
  const selected = requested.length > 0
    ? requested.map((seriesId) => defaults.get(seriesId)).filter((series): series is EiaBulkSeriesMeta => Boolean(series))
    : EIA_BULK_SERIES.filter((series) => includeElec || series.dataset !== 'ELEC')
  return selected.filter((series, index, arr) => arr.findIndex((candidate) => candidate.seriesId === series.seriesId) === index)
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
  if (!raw || raw === '(NA)' || raw === 'NA' || raw === '---' || raw === '--' || raw === '.') return null
  const parsed = Number(raw.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function staleWindowForFrequency(frequency: string): number {
  switch (frequency.toUpperCase()) {
    case 'D':
      return 7 * DAY_MS
    case 'W':
      return 21 * DAY_MS
    case 'M':
      return 75 * DAY_MS
    case 'Q':
      return 180 * DAY_MS
    case 'A':
      return 545 * DAY_MS
    default:
      return 90 * DAY_MS
  }
}

function bulkZipUrl(dataset: EiaBulkDatasetId): string {
  return `https://www.eia.gov/opendata/bulk/${dataset}.zip`
}

function sanitizeBulkUrl(url: string): string {
  const parsed = new URL(url)
  parsed.search = ''
  return parsed.toString()
}

function normalizeCountryCode(value: string | undefined): string | undefined {
  if (!value) return undefined
  const upper = value.toUpperCase()
  if (upper === 'USA' || upper === 'UNITED STATES') return 'US'
  if (upper.startsWith('USA-')) return 'US'
  if (/^[A-Z]{2}$/.test(upper)) return upper
  return undefined
}

function timeoutLinkedSignal(parent: AbortSignal, timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  timeout.unref?.()
  if (parent.aborted) controller.abort()
  else parent.addEventListener('abort', () => controller.abort(), { once: true })
  return controller.signal
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

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const EIA_BULK_SOURCE_ID = SOURCE_ID
