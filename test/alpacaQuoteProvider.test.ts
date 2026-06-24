import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ALPACA_QUOTE_SOURCE_ID,
  createAlpacaQuoteProvider,
  parseAlpacaQuotes,
  readAlpacaQuoteConfig,
} from '../electron/osint/quotes/alpacaQuoteProvider'
import { resolveQuoteProvider } from '../electron/osint/quotes/quoteProvider'
import { isQuoteStale, isRenderableQuote, quotePriceLabel, PRICE_UNAVAILABLE, type MarketQuote } from '../src/marketQuote'

const NOW = Date.parse('2026-06-18T16:00:30Z')
const API_URL = 'https://data.alpaca.markets/v2/stocks/trades/latest?symbols=AAPL,MSFT'

const FIXTURE = {
  trades: {
    AAPL: { p: 195.34, s: 100, t: '2026-06-18T15:59:59Z', x: 'V' },
    MSFT: { p: 0, t: '2026-06-18T15:59:59Z' }, // zero price -> dropped
  },
  quotes: {
    AAPL: { bp: 195.3, ap: 195.36, t: '2026-06-18T15:59:59Z' },
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('Alpaca quote provider (key-gated)', () => {
  it('fails closed without keys; resolves only when configured', () => {
    expect(readAlpacaQuoteConfig({})).toBeNull()
    expect(readAlpacaQuoteConfig({ ATLASZ_ALPACA_API_KEY: 'k' })).toBeNull() // secret required too
    expect(resolveQuoteProvider({})).toBeNull()
    const cfg = readAlpacaQuoteConfig({ ATLASZ_ALPACA_API_KEY: 'k', ATLASZ_ALPACA_SECRET_KEY: 's' })
    expect(cfg?.apiKey).toBe('k')
    const provider = resolveQuoteProvider({ ATLASZ_ALPACA_API_KEY: 'k', ATLASZ_ALPACA_SECRET_KEY: 's' })
    expect(provider?.id).toBe(ALPACA_QUOTE_SOURCE_ID)
    expect(provider?.requiredEnv).toContain('ATLASZ_ALPACA_API_KEY')
    expect(resolveQuoteProvider({ ATLASZ_EQUITY_QUOTE_PROVIDER: 'polygon', ATLASZ_ALPACA_API_KEY: 'k', ATLASZ_ALPACA_SECRET_KEY: 's' })).toBeNull()
  })

  it('parses a real quote with full proof fields and no fabricated price', () => {
    const quotes = parseAlpacaQuotes(FIXTURE, { tickers: ['AAPL', 'MSFT'], retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(quotes).toHaveLength(1) // MSFT (price 0) dropped
    const aapl = quotes[0]
    expect(aapl).toMatchObject({
      ticker: 'AAPL',
      price: 195.34,
      bid: 195.3,
      ask: 195.36,
      provenance: 'auth-gated',
      marketDataClass: 'key-gated-market-data',
      confidence: 95,
    })
    expect(aapl.marketTimestamp).toBe(Date.parse('2026-06-18T15:59:59Z'))
    expect(aapl.rawPayloadHash.length).toBeGreaterThan(0)
    expect(isRenderableQuote(aapl)).toBe(true)
    expect(quotePriceLabel(aapl)).not.toBe(PRICE_UNAVAILABLE)
  })

  it('a zero/seeded/default price never renders as real', () => {
    const fake: MarketQuote = {
      id: 'x', ticker: 'AAPL', price: 0, marketTimestamp: NOW, sourceId: 'alpaca_equity_quotes',
      sourceName: 'x', sourceUrl: 'https://alpaca.markets/data', sourceApiUrl: API_URL, retrievedAt: NOW,
      staleAt: NOW + 1, provenance: 'auth-gated', marketDataClass: 'key-gated-market-data', confidence: 95, rawPayloadHash: 'h',
    }
    expect(isRenderableQuote(fake)).toBe(false)
    expect(quotePriceLabel(fake)).toBe(PRICE_UNAVAILABLE)
    expect(quotePriceLabel(null)).toBe(PRICE_UNAVAILABLE)
  })

  it('refuses to normalize from a key-leaking source URL and never embeds keys', () => {
    expect(parseAlpacaQuotes(FIXTURE, { tickers: ['AAPL'], sourceApiUrl: 'https://data.alpaca.markets/v2/x?apca-api-key-id=leak' })).toEqual([])
    const aapl = parseAlpacaQuotes(FIXTURE, { tickers: ['AAPL'], retrievedAt: NOW, sourceApiUrl: API_URL })[0]
    expect(aapl.sourceApiUrl).not.toMatch(/key|secret|apca/i)
    expect(aapl.rawPayloadJson ?? '').not.toMatch(/secret|apca/i)
  })

  it('marks a quote stale once past staleAt', () => {
    const aapl = parseAlpacaQuotes(FIXTURE, { tickers: ['AAPL'], retrievedAt: NOW, sourceApiUrl: API_URL })[0]
    expect(isQuoteStale(aapl, aapl.marketTimestamp + 60_000)).toBe(false)
    expect(isQuoteStale(aapl, aapl.marketTimestamp + 20 * 60_000)).toBe(true)
  })

  it('sends keys only in headers and fails closed on HTTP rate-limit', async () => {
    let sentHeaders: Record<string, string> = {}
    let sentUrl = ''
    vi.stubGlobal('fetch', async (url: URL, init: { headers: Record<string, string> }) => {
      sentUrl = url.toString()
      sentHeaders = init.headers
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })
    const provider = createAlpacaQuoteProvider({ apiBase: 'https://data.alpaca.markets/v2', apiKey: 'secret-key', secretKey: 'secret-secret', timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    const quotes = await provider.fetchQuotes(['AAPL'], new AbortController().signal)
    expect(quotes[0].ticker).toBe('AAPL')
    expect(sentHeaders['APCA-API-KEY-ID']).toBe('secret-key')
    expect(sentUrl).not.toMatch(/secret-key|secret-secret/)
    expect(quotes[0].sourceApiUrl).not.toMatch(/secret-key|secret-secret/)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }))
    await expect(provider.fetchQuotes(['AAPL'], new AbortController().signal)).rejects.toMatchObject({ status: 429 })
  })
})
