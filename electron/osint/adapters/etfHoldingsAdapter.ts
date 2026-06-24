/*
 * ETF holdings adapter.
 *
 * Official issuer-published holdings snapshots only. The initial runtime slice
 * uses machine-readable public files from BlackRock/iShares (SOXX) and State
 * Street/SPDR (XLK, XLE, XLU, SPY). Holdings are dated snapshots, never live
 * positions, recommendations, price signals, or trading advice.
 *
 * Discipline: source date required; weights/shares/market value only when the
 * same source row provides them; missing/malformed rows dropped; unknown holdings
 * remain unresolved. No fuzzy company matching.
 *
 * provenance: public-disclosure   category: etf-holding
 */
import { inflateRawSync } from 'node:zlib'
import { adapterEventId, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { EtfHolding, EtfHoldingChangeType, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'etf_holdings_public'
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_500
const DEFAULT_MAX_HOLDINGS_PER_FUND = 80
const MAX_HOLDINGS_CAP = 500
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 7 * DAY_MS

export type EtfIssuerFormat = 'ishares-spreadsheetml' | 'ssga-xlsx'

export type EtfFundSource = {
  fundTicker: string
  fundName: string
  issuer: string
  sourceUrl: string
  sourceName: string
  format: EtfIssuerFormat
}

export type EtfHoldingsConfig = {
  funds: EtfFundSource[]
  timeoutMs: number
  maxRetries: number
  backoffMs: number
  maxHoldingsPerFund: number
}

export const DEFAULT_ETF_FUND_SOURCES: EtfFundSource[] = [
  {
    fundTicker: 'SOXX',
    fundName: 'iShares Semiconductor ETF',
    issuer: 'BlackRock / iShares',
    sourceName: 'iShares fund data download',
    format: 'ishares-spreadsheetml',
    sourceUrl:
      'https://www.blackrock.com/varnish-api/blk-one01-product-data/product-data/api/v1/get-fund-document?appSubType=ISHARES&appType=PRODUCT_PAGE&component=fundDownload&locale=en_US&portfolioId=239705&targetSite=us-ishares&userType=individual',
  },
  ssgaFund('SPY', 'State Street® SPDR® S&P 500® ETF Trust'),
  ssgaFund('XLK', 'State Street® Technology Select Sector SPDR® ETF'),
  ssgaFund('XLE', 'State Street® Energy Select Sector SPDR® ETF'),
  ssgaFund('XLU', 'State Street® Utilities Select Sector SPDR® ETF'),
]

function ssgaFund(ticker: string, fundName: string): EtfFundSource {
  return {
    fundTicker: ticker,
    fundName,
    issuer: 'State Street / SPDR',
    sourceName: 'State Street daily holdings XLSX',
    format: 'ssga-xlsx',
    sourceUrl: `https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-${ticker.toLowerCase()}.xlsx`,
  }
}

export function readEtfHoldingsConfig(env: NodeJS.ProcessEnv = process.env): EtfHoldingsConfig | null {
  if (env.ATLASZ_ETF_HOLDINGS_DISABLE === '1') return null
  const requested = asString(env.ATLASZ_ETF_HOLDINGS_FUNDS)
  const allow = requested
    ? new Set(requested.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean))
    : null
  const funds = DEFAULT_ETF_FUND_SOURCES
    .filter((source) => !allow || allow.has(source.fundTicker))
    .filter((source) => isOfficialIssuerUrl(source.sourceUrl))
  if (funds.length === 0) return null
  return {
    funds,
    timeoutMs: clampInt(Number(env.ATLASZ_ETF_HOLDINGS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_ETF_HOLDINGS_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_ETF_HOLDINGS_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
    maxHoldingsPerFund: clampInt(Number(env.ATLASZ_ETF_HOLDINGS_MAX_ROWS ?? DEFAULT_MAX_HOLDINGS_PER_FUND), 1, MAX_HOLDINGS_CAP),
  }
}

export async function fetchEtfHoldings(signal: AbortSignal, config = readEtfHoldingsConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const records: EtfHolding[] = []
  const errors: Error[] = []
  for (const source of config.funds) {
    try {
      const buffer = await fetchIssuerFile(source.sourceUrl, config, signal)
      records.push(...parseEtfHoldingWorkbook(buffer, source, { retrievedAt: Date.now(), maxRows: config.maxHoldingsPerFund }))
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    }
  }
  if (records.length === 0 && errors.length > 0) {
    throw errors[0]
  }
  return normalizeEtfHoldings(records)
}

export function parseEtfHoldingWorkbook(
  buffer: Buffer,
  source: EtfFundSource,
  options: { retrievedAt?: number; maxRows?: number } = {},
): EtfHolding[] {
  const rows = source.format === 'ssga-xlsx' ? parseXlsxRows(buffer) : parseSpreadsheetMlRows(buffer.toString('utf8'))
  return parseEtfHoldingRows(rows, source, options)
}

export function parseEtfHoldingRows(
  rows: string[][],
  source: EtfFundSource,
  options: { retrievedAt?: number; maxRows?: number } = {},
): EtfHolding[] {
  if (!rows.length || !isOfficialIssuerUrl(source.sourceUrl)) return []
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxRows = options.maxRows ?? DEFAULT_MAX_HOLDINGS_PER_FUND
  const fundName = source.format === 'ssga-xlsx'
    ? valueAfterLabel(rows, 'Fund Name:') || source.fundName
    : findIsharesFundName(rows) || source.fundName
  const fundTicker = (valueAfterLabel(rows, 'Ticker Symbol:') || source.fundTicker).toUpperCase()
  if (fundTicker !== source.fundTicker || !fundName) return []

  const sourceDate =
    source.format === 'ssga-xlsx'
      ? parseSourceDate(valueAfterLabel(rows, 'Holdings:'))
      : parseSourceDate(valueAfterLabel(rows, 'Fund Holdings as of'))
  if (!sourceDate) return []
  const sourceTimestamp = Date.parse(`${sourceDate}T00:00:00Z`)
  if (!Number.isFinite(sourceTimestamp)) return []

  const headerIndex = findHeaderRow(rows)
  if (headerIndex < 0) return []
  const header = rows[headerIndex].map(normalizeHeader)
  const col = (name: string) => header.indexOf(name)
  const nameIdx = col('name')
  const tickerIdx = col('ticker')
  const identifierIdx = col('identifier')
  const sedolIdx = col('sedol')
  const sectorIdx = col('sector')
  const assetClassIdx = col('asset_class')
  const weightIdx = col('weight')
  const weightPctIdx = col('weight_pct')
  const sharesIdx = col('shares_held') >= 0 ? col('shares_held') : col('quantity')
  const marketValueIdx = col('market_value')
  const currencyIdx = col('local_currency') >= 0 ? col('local_currency') : col('currency')
  if (nameIdx < 0) return []

  const out: EtfHolding[] = []
  for (let i = headerIndex + 1; i < rows.length && out.length < maxRows; i += 1) {
    const row = rows[i]
    const first = cleanCell(row[0])
    if (/^as of$/i.test(first) || /^nav per share$/i.test(first)) break
    const holdingName = cleanCell(row[nameIdx])
    if (!holdingName || /^[-–—]$/.test(holdingName)) continue
    const sourceTicker = cleanCell(row[tickerIdx]).toUpperCase()
    const assetClass = cleanCell(row[assetClassIdx]) || undefined
    const holdingTicker = equityTicker(sourceTicker, assetClass)
    const identifier = cleanCell(row[identifierIdx]).toUpperCase()
    const rawRecord = {
      fundTicker,
      fundName,
      issuer: source.issuer,
      sourceDate,
      holdingName,
      sourceTicker,
      identifier,
      sector: cleanCell(row[sectorIdx]),
      assetClass,
      weight: numberValue(row[weightIdx >= 0 ? weightIdx : weightPctIdx]),
      shares: numberValue(row[sharesIdx]),
      marketValue: numberValue(row[marketValueIdx]),
      currency: cleanCell(row[currencyIdx]),
      sourceUrl: source.sourceUrl,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: EtfHolding = {
      id: `${SOURCE_ID}:${fundTicker}:${holdingTicker ?? (identifier || slug(holdingName))}`.toLowerCase(),
      fundTicker,
      fundName,
      issuer: source.issuer,
      sourceDate,
      sourceTimestamp,
      holdingName,
      holdingTicker,
      cusip: identifier && /^[A-Z0-9]{9}$/.test(identifier) ? identifier : undefined,
      isin: identifier && /^[A-Z]{2}[A-Z0-9]{10}$/.test(identifier) ? identifier : undefined,
      sedol: cleanCell(row[sedolIdx]) || undefined,
      sector: cleanCell(row[sectorIdx]) && cleanCell(row[sectorIdx]) !== '-' ? cleanCell(row[sectorIdx]) : undefined,
      assetClass,
      weight: rawRecord.weight,
      weightSource: rawRecord.weight !== undefined ? 'source-provided' : undefined,
      shares: rawRecord.shares,
      marketValue: rawRecord.marketValue,
      currency: rawRecord.currency || undefined,
      sourceUrl: source.sourceUrl,
      sourceName: source.sourceName,
      retrievedAt,
      staleAt: sourceTimestamp + STALE_AFTER_MS,
      provenance: 'public-disclosure',
      confidence: confidenceForHolding(source.sourceUrl, sourceDate, holdingName, rawPayloadJson),
      changeType: 'first_seen',
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (record.confidence >= 90) out.push(record)
  }
  return out
}

export function normalizeEtfHoldings(records: EtfHolding[]): WorldIntelEvent[] {
  return records.filter((record) => record.confidence >= 90).map(toEvent)
}

export function applyEtfHoldingChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.etfHolding) return event
  const prior = previous?.etfHolding
  const changeType: EtfHoldingChangeType = !prior
    ? 'first_seen'
    : prior.rawPayloadHash === event.etfHolding.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, etfHolding: { ...event.etfHolding, changeType } }
}

function toEvent(record: EtfHolding): WorldIntelEvent {
  const holdingLabel = record.holdingTicker ? `${record.holdingName} (${record.holdingTicker})` : record.holdingName
  const weight = record.weight !== undefined ? `${record.weight.toFixed(3)}% source-provided weight` : 'weight unavailable'
  const summary =
    `${record.issuer} published ${record.fundTicker} ETF holdings as of ${record.sourceDate}: ${holdingLabel}, ${weight}. ` +
    'Holdings snapshot only; not a current-position guarantee, recommendation, price signal, or trading advice.'
  const dedupeKey = `etf-holding|${record.fundTicker}|${record.holdingTicker ?? record.cusip ?? record.isin ?? record.holdingName}`.toLowerCase()
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: record.sourceTimestamp,
    title: `ETF holding: ${record.fundTicker} · ${holdingLabel}`.slice(0, 180),
    summary,
    countryCodes: [],
    region: 'Global',
    category: 'etf-holding',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceUrl,
    provenance: 'public-disclosure',
    affectedAssets: record.holdingTicker ? [record.fundTicker, record.holdingTicker] : [record.fundTicker],
    affectedSectors: record.sector ? [record.sector] : [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.fundTicker, record.fundName, record.issuer, record.holdingName, record.holdingTicker ?? '', record.cusip ?? '']),
    narrativeTags: unique(['ETF holdings', record.issuer, record.fundTicker, record.changeType]),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    etfHolding: record,
  }
}

async function fetchIssuerFile(url: string, config: EtfHoldingsConfig, signal: AbortSignal): Promise<Buffer> {
  if (!isOfficialIssuerUrl(url)) throw new Error('ETF holdings source is not an approved official issuer URL')
  return fetchWithRetry(
    async (s) => {
      const response = await fetch(url, {
        signal: linkedSignal(signal, s),
        headers: {
          accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/xml, text/xml, */*',
          'user-agent': 'Atlasz Intel local-first connector (public ETF issuer holdings)',
        },
      })
      assertOk(response, 'ETF holdings issuer file')
      const bytes = await response.arrayBuffer()
      return Buffer.from(bytes)
    },
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
}

function parseXlsxRows(buffer: Buffer): string[][] {
  const files = unzipEntries(buffer)
  const sharedXml = files.get('xl/sharedStrings.xml')?.toString('utf8') ?? ''
  const sheetXml = files.get('xl/worksheets/sheet1.xml')?.toString('utf8') ?? ''
  if (!sheetXml) return []
  const shared = parseSharedStrings(sharedXml)
  const rows: string[][] = []
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = []
    for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] ?? ''
      const body = cellMatch[2] ?? ''
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? ''
      const index = ref ? columnIndex(ref) : row.length
      const type = /t="([^"]+)"/.exec(attrs)?.[1] ?? ''
      let value = firstXmlTag(body, 'v')
      if (type === 's') {
        value = shared[Number(value)] ?? ''
      } else if (type === 'inlineStr') {
        value = textFragments(body).join('')
      }
      row[index] = decodeXml(value)
    }
    if (row.some((cell) => cleanCell(cell))) rows.push(row.map((cell) => cleanCell(cell)))
  }
  return rows
}

function parseSpreadsheetMlRows(xml: string): string[][] {
  const rows: string[][] = []
  for (const rowMatch of xml.matchAll(/<(?:[\w-]+:)?Row\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Row>/gi)) {
    const row: string[] = []
    let cursor = 0
    for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<(?:[\w-]+:)?Cell\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?Cell>/gi)) {
      const attrs = cellMatch[1] ?? ''
      const explicitIndex = /(?:ss:)?Index="(\d+)"/i.exec(attrs)?.[1]
      const index = explicitIndex ? Number(explicitIndex) - 1 : cursor
      const value = textFragments(cellMatch[2] ?? '').join('')
      row[index] = cleanCell(decodeXml(value))
      cursor = index + 1
    }
    if (row.some((cell) => cleanCell(cell))) rows.push(row)
  }
  return rows
}

function unzipEntries(buffer: Buffer): Map<string, Buffer> {
  const eocd = findEndOfCentralDirectory(buffer)
  const centralDirOffset = buffer.readUInt32LE(eocd + 16)
  const entryCount = buffer.readUInt16LE(eocd + 10)
  const out = new Map<string, Buffer>()
  let ptr = centralDirOffset
  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) break
    const method = buffer.readUInt16LE(ptr + 10)
    const compressedSize = buffer.readUInt32LE(ptr + 20)
    const nameLength = buffer.readUInt16LE(ptr + 28)
    const extraLength = buffer.readUInt16LE(ptr + 30)
    const commentLength = buffer.readUInt16LE(ptr + 32)
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42)
    const name = buffer.subarray(ptr + 46, ptr + 46 + nameLength).toString('utf8')
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    const data = method === 0 ? Buffer.from(compressed) : method === 8 ? inflateRawSync(compressed) : Buffer.alloc(0)
    if (data.length > 0) out.set(name, data)
    ptr += 46 + nameLength + extraLength + commentLength
  }
  return out
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const min = Math.max(0, buffer.length - 66_000)
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i
  }
  throw new Error('Invalid XLSX: central directory not found')
}

function parseSharedStrings(xml: string): string[] {
  if (!xml) return []
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => decodeXml(textFragments(match[1] ?? '').join('')))
}

function textFragments(xml: string): string[] {
  return [...xml.matchAll(/<(?:[\w-]+:)?(?:t|Data)\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?(?:t|Data)>/g)].map((match) => match[1] ?? '')
}

function firstXmlTag(xml: string, tag: string): string {
  return new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)?.[1] ?? ''
}

function columnIndex(column: string): number {
  return column.split('').reduce((sum, char) => sum * 26 + (char.charCodeAt(0) - 64), 0) - 1
}

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex((row) => {
    const headers = row.map(normalizeHeader)
    return headers.includes('name') && headers.includes('ticker') && (headers.includes('weight') || headers.includes('weight_pct'))
  })
}

function valueAfterLabel(rows: string[][], label: string): string {
  const normalized = label.toLowerCase()
  for (const row of rows) {
    const idx = row.findIndex((cell) => cleanCell(cell).toLowerCase() === normalized)
    if (idx >= 0) return cleanCell(row[idx + 1])
  }
  return ''
}

function findIsharesFundName(rows: string[][]): string {
  return rows.flat().map(cleanCell).find((cell) => /iShares .* ETF/i.test(cell)) ?? ''
}

function normalizeHeader(value: string): string {
  return cleanCell(value)
    .toLowerCase()
    .replace(/\(%\)/g, 'pct')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseSourceDate(value: string): string | null {
  const cleaned = cleanCell(value).replace(/^as of\s+/i, '')
  if (!cleaned) return null
  const iso = parseMonthDate(cleaned) ?? parseDashDate(cleaned)
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

function parseMonthDate(value: string): string | null {
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})$/i.exec(value)
  if (!match) return null
  const month = monthNumber(match[1])
  return month ? `${match[3]}-${month}-${match[2].padStart(2, '0')}` : null
}

function parseDashDate(value: string): string | null {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(value)
  if (!match) return null
  const month = monthNumber(match[2])
  return month ? `${match[3]}-${month}-${match[1].padStart(2, '0')}` : null
}

function monthNumber(value: string): string | null {
  const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }
  return months[value.slice(0, 3).toLowerCase()] ?? null
}

function equityTicker(value: string, assetClass?: string): string | undefined {
  const ticker = cleanCell(value).toUpperCase()
  if (!ticker || ticker === '-' || ticker === 'USD') return undefined
  if (assetClass && /(cash|money market|futures|derivative|collateral|margin)/i.test(assetClass)) return undefined
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker) ? ticker : undefined
}

function confidenceForHolding(sourceUrl: string, sourceDate: string, holdingName: string, rawPayloadJson: string): number {
  return isOfficialIssuerUrl(sourceUrl) && /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) && holdingName && rawPayloadJson.length > 2 ? 94 : 70
}

function isOfficialIssuerUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && (
      /(^|\.)blackrock\.com$/i.test(parsed.hostname) ||
      /(^|\.)ishares\.com$/i.test(parsed.hostname) ||
      /(^|\.)ssga\.com$/i.test(parsed.hostname)
    )
  } catch {
    return false
  }
}

function numberValue(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const text = String(value).trim()
  if (!text || text === '-' || text === '--') return undefined
  const parsed = Number(text.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function cleanCell(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
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

export const ETF_HOLDINGS_SOURCE_ID = SOURCE_ID
