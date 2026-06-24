/*
 * Alpaca IEX equity/ETF quote provider — key-gated, fail-closed.
 *
 * Uses the official Alpaca Market Data API (latest trades) for real last-trade
 * prices. Requires ATLASZ_ALPACA_API_KEY + ATLASZ_ALPACA_SECRET_KEY; without
 * them the provider does not resolve (no quotes, never a fake price). Keys travel
 * ONLY in request headers — never in the sanitized sourceApiUrl or rawPayloadJson.
 * No random-walk fallback; HTTP/rate-limit/schema failures fail closed.
 */
import { createHash } from 'node:crypto'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { MarketQuote, MarketQuoteAssetType } from '../../../src/marketQuote'

// Self-contained hashing so this provider stays decoupled from the WorldIntelEvent
// builder (keeps it light + safe to import inside the market ingestion worker).
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}
function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
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

const SOURCE_ID = 'alpaca_equity_quotes'
const SOURCE_NAME = 'Alpaca Market Data (IEX)'
const HUMAN_SOURCE_URL = 'https://alpaca.markets/data'
const DEFAULT_DATA_BASE = 'https://data.alpaca.markets/v2'
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000
const STALE_AFTER_MS = 15 * 60_000 // quotes go stale fast
const TICKER_PATTERN = /^[A-Z][A-Z0-9.]{0,9}$/

export type AlpacaQuoteConfig = {
  apiBase: string
  apiKey: string
  secretKey: string
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type AlpacaTradesPayload = {
  trades?: Record<string, { p?: number; s?: number; t?: string; x?: string }>
  quotes?: Record<string, { ap?: number; bp?: number; as?: number; bs?: number; t?: string }>
}

export function readAlpacaQuoteConfig(env: NodeJS.ProcessEnv = process.env): AlpacaQuoteConfig | null {
  if (env.ATLASZ_EQUITY_QUOTE_DISABLE === '1') return null
  const apiKey = text(env.ATLASZ_ALPACA_API_KEY)
  const secretKey = text(env.ATLASZ_ALPACA_SECRET_KEY)
  const apiBase = text(env.ATLASZ_ALPACA_DATA_BASE) || DEFAULT_DATA_BASE
  if (!apiKey || !secretKey || !/^https:\/\//i.test(apiBase)) return null
  return {
    apiBase,
    apiKey,
    secretKey,
    timeoutMs: clampInt(Number(env.ATLASZ_ALPACA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_ALPACA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_ALPACA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export function createAlpacaQuoteProvider(config: AlpacaQuoteConfig) {
  return {
    id: SOURCE_ID,
    name: SOURCE_NAME,
    trustTier: 'key-gated-market-data' as const,
    requiredEnv: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY'],
    async fetchQuotes(tickers: string[], signal: AbortSignal): Promise<MarketQuote[]> {
      const symbols = normalizeTickers(tickers)
      if (symbols.length === 0) return []
      const retrievedAt = Date.now()
      const url = new URL(`${config.apiBase.replace(/\/$/, '')}/stocks/trades/latest`)
      url.searchParams.set('symbols', symbols.join(','))
      const sourceApiUrl = url.toString() // no keys (they go in headers)
      const payload = await fetchWithRetry(
        (attemptSignal) => fetchAlpacaJson(url, config, linkedSignal(signal, attemptSignal)),
        { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
      )
      return parseAlpacaQuotes(payload, { tickers: symbols, retrievedAt, sourceApiUrl })
    },
  }
}

/** Pure normalizer — testable with fixture Alpaca trades/quotes payloads. */
export function parseAlpacaQuotes(
  payload: unknown,
  options: { tickers?: string[]; retrievedAt?: number; sourceApiUrl?: string; assetTypes?: Record<string, MarketQuoteAssetType> } = {},
): MarketQuote[] {
  if (!payload || typeof payload !== 'object') return []
  const body = payload as AlpacaTradesPayload
  const trades = body.trades ?? {}
  const quotes = body.quotes ?? {}
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? `${DEFAULT_DATA_BASE}/stocks/trades/latest`
  if (/[?&](api[_-]?key|apca|secret|token)/i.test(sourceApiUrl)) return [] // never normalize a key-leaking URL
  const symbols = options.tickers && options.tickers.length > 0 ? options.tickers : Object.keys(trades)
  const out: MarketQuote[] = []

  for (const rawTicker of symbols) {
    const ticker = rawTicker.trim().toUpperCase()
    if (!TICKER_PATTERN.test(ticker)) continue
    const trade = trades[ticker] ?? trades[rawTicker]
    const quote = quotes[ticker] ?? quotes[rawTicker]
    const price = num(trade?.p)
    const marketTimestamp = epoch(trade?.t) ?? epoch(quote?.t)
    if (price === undefined || price <= 0 || marketTimestamp === undefined) continue // drop; never fabricate

    const rawRecord = {
      ticker,
      price,
      bid: num(quote?.bp),
      ask: num(quote?.ap),
      volume: num(trade?.s),
      marketTimestamp,
      sourceId: SOURCE_ID,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    out.push({
      id: `${SOURCE_ID}:${ticker.toLowerCase()}`,
      ticker,
      assetType: options.assetTypes?.[ticker],
      price,
      bid: num(quote?.bp),
      ask: num(quote?.ap),
      volume: num(trade?.s),
      marketTimestamp,
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      retrievedAt,
      staleAt: marketTimestamp + STALE_AFTER_MS,
      provenance: 'auth-gated',
      marketDataClass: 'key-gated-market-data',
      confidence: 95,
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

async function fetchAlpacaJson(url: URL, config: AlpacaQuoteConfig, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.secretKey,
      'user-agent': 'AtlaszIntel/0.4 (local-first market intelligence; key-gated Alpaca quotes)',
    },
  })
  assertOk(response, 'Alpaca quotes')
  return (await response.json()) as unknown
}

function normalizeTickers(tickers: string[]): string[] {
  return [...new Set(tickers.map((t) => t.trim().toUpperCase()).filter((t) => TICKER_PATTERN.test(t)))].slice(0, 100)
}

function epoch(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
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

export const ALPACA_QUOTE_SOURCE_ID = SOURCE_ID
