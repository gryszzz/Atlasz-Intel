/*
 * Market Reference Master adapter.
 *
 * Source: official SEC company_tickers.json file. This is a canonical public
 * identity spine for CIK <-> ticker <-> legal title only. The source does NOT
 * provide exchange, sector, industry, or ETF weights, so those remain absent.
 *
 * provenance: official-api   category: market-reference
 */
import { adapterEventId, asNumber, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { MarketIdentity, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_company_tickers_public'
const SOURCE_NAME = 'SEC company_tickers.json'
const DEFAULT_SOURCE_URL = 'https://www.sec.gov/files/company_tickers.json'
const DEFAULT_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000
const MAX_RECORDS = 25_000

export type MarketReferenceConfig = {
  sourceUrl: string
  userAgent?: string
  staleAfterMs: number
  maxRecords: number
}

type SecCompanyTickerRow = {
  cik_str?: unknown
  ticker?: unknown
  title?: unknown
}

export function readMarketReferenceConfig(env: NodeJS.ProcessEnv = process.env): MarketReferenceConfig | null {
  if (env.ATLASZ_MARKET_REFERENCE_DISABLE === '1') return null
  const sourceUrl = asString(env.ATLASZ_SEC_COMPANY_TICKERS_URL) || DEFAULT_SOURCE_URL
  if (!isOfficialSecCompanyTickersUrl(sourceUrl)) return null
  return {
    sourceUrl,
    userAgent: asString(env.ATLASZ_SEC_COMPANY_TICKERS_USER_AGENT) || asString(env.ATLASZ_SEC_USER_AGENT) || undefined,
    staleAfterMs: clampInt(Number(env.ATLASZ_MARKET_REFERENCE_STALE_AFTER_MS ?? DEFAULT_STALE_AFTER_MS), 60_000, 30 * DEFAULT_STALE_AFTER_MS),
    maxRecords: clampInt(Number(env.ATLASZ_MARKET_REFERENCE_MAX_RECORDS ?? MAX_RECORDS), 1, MAX_RECORDS),
  }
}

export async function fetchMarketReference(
  signal: AbortSignal,
  config = readMarketReferenceConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const headers: Record<string, string> = { accept: 'application/json' }
  if (config.userAgent) headers['user-agent'] = config.userAgent
  const response = await fetch(config.sourceUrl, {
    signal,
    headers,
  })
  assertOk(response, 'SEC company tickers')
  const payload = (await response.json()) as unknown
  return normalizeMarketIdentities(
    parseSecCompanyTickers(payload, {
      sourceUrl: config.sourceUrl,
      retrievedAt: Date.now(),
      staleAfterMs: config.staleAfterMs,
      maxRecords: config.maxRecords,
    }),
  )
}

export function parseSecCompanyTickers(
  payload: unknown,
  options: { sourceUrl?: string; retrievedAt?: number; staleAfterMs?: number; maxRecords?: number } = {},
): MarketIdentity[] {
  if (!payload || typeof payload !== 'object') return []
  const retrievedAt = options.retrievedAt ?? Date.now()
  const staleAt = retrievedAt + (options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS)
  const sourceUrl = options.sourceUrl ?? DEFAULT_SOURCE_URL
  if (!isOfficialSecCompanyTickersUrl(sourceUrl)) return []

  const rows = Array.isArray(payload)
    ? payload
    : Object.entries(payload as Record<string, unknown>)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([, value]) => value)
  const seenTickers = new Set<string>()
  const seenCiks = new Set<string>()
  const out: MarketIdentity[] = []

  for (const row of rows.slice(0, options.maxRecords ?? MAX_RECORDS)) {
    const record = row as SecCompanyTickerRow
    const ticker = normalizeTicker(asString(record.ticker))
    const cik = normalizeCik(asNumber(record.cik_str) ?? asString(record.cik_str))
    const legalName = collapse(asString(record.title))
    if (!ticker || !cik || !legalName) continue
    if (seenTickers.has(ticker) || seenCiks.has(cik)) continue
    seenTickers.add(ticker)
    seenCiks.add(cik)

    const aliases = unique([ticker, cik, padCik(cik), legalName])
    const rawPayloadJson = stableStringify({
      cik_str: Number(cik),
      ticker,
      title: legalName,
      source_url: sourceUrl,
    })
    const identity: MarketIdentity = {
      id: marketIdentityId(ticker),
      ticker,
      cik,
      cikPadded: padCik(cik),
      legalName,
      aliases,
      sourceUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      staleAt,
      provenance: 'official-api',
      confidence: confidenceForIdentity({ ticker, cik, legalName, sourceUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (identity.confidence >= 90) out.push(identity)
  }
  return out
}

export function normalizeMarketIdentities(records: MarketIdentity[]): WorldIntelEvent[] {
  return records.map(toEvent)
}

function toEvent(identity: MarketIdentity): WorldIntelEvent {
  const dedupeKey = `market-reference|sec-company-tickers|${identity.ticker}|${identity.cik}`.toLowerCase()
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: identity.retrievedAt,
    title: `Market identity: ${identity.ticker} -> CIK ${identity.cik}`,
    summary:
      `SEC company_tickers.json maps ticker ${identity.ticker} to CIK ${identity.cik} and legal title "${identity.legalName}". ` +
      'Exchange, sector, industry, ETF weights, and price context are not provided by this source.',
    countryCodes: ['US'],
    region: 'United States',
    category: 'market-reference',
    severity: 'stable',
    confidence: identity.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: identity.sourceUrl,
    provenance: 'official-api',
    affectedAssets: [identity.ticker],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([identity.legalName, `CIK ${identity.cik}`, identity.ticker]),
    narrativeTags: ['Market Reference Master', 'SEC company tickers', 'identity spine'],
    rawPayloadHash: identity.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    marketIdentity: identity,
  }
}

function confidenceForIdentity(input: { ticker: string; cik: string; legalName: string; sourceUrl: string; retrievedAt: number }): number {
  return input.ticker &&
    input.cik &&
    input.legalName &&
    isOfficialSecCompanyTickersUrl(input.sourceUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 96
    : 0
}

function isOfficialSecCompanyTickersUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'www.sec.gov' && url.pathname === '/files/company_tickers.json'
  } catch {
    return false
  }
}

function normalizeTicker(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9.-]/g, '').slice(0, 24)
}

function normalizeCik(value: string | number | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '')
  return digits
}

function padCik(cik: string): string {
  return cik.padStart(10, '0')
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 240)
}

function marketIdentityId(ticker: string): string {
  return `market-identity:${ticker.toLowerCase()}`
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.trunc(value)))
}

export const MARKET_REFERENCE_SOURCE_ID = SOURCE_ID
