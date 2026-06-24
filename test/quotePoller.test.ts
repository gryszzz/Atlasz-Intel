import { describe, expect, it } from 'vitest'
import { pollQuotesOnce, quotesToTicks } from '../electron/osint/quotes/quotePoller'
import type { QuoteProvider } from '../electron/osint/quotes/quoteProvider'
import type { MarketQuote } from '../src/marketQuote'

const NOW = Date.parse('2026-06-18T16:00:00Z')

function quote(partial: Partial<MarketQuote> & { ticker: string }): MarketQuote {
  return {
    id: `alpaca_equity_quotes:${partial.ticker.toLowerCase()}`,
    price: 100,
    marketTimestamp: NOW,
    sourceId: 'alpaca_equity_quotes',
    sourceName: 'Alpaca Market Data (IEX)',
    sourceUrl: 'https://alpaca.markets/data',
    sourceApiUrl: 'https://data.alpaca.markets/v2/stocks/trades/latest?symbols=AAPL',
    retrievedAt: NOW,
    staleAt: NOW + 900_000,
    provenance: 'auth-gated',
    marketDataClass: 'key-gated-market-data',
    confidence: 95,
    rawPayloadHash: 'h',
    ...partial,
  }
}

function fakeProvider(impl: QuoteProvider['fetchQuotes']): QuoteProvider {
  return { id: 'alpaca_equity_quotes', name: 'fake', trustTier: 'key-gated-market-data', requiredEnv: ['ATLASZ_ALPACA_API_KEY'], fetchQuotes: impl }
}

const signal = new AbortController().signal

describe('quote poller (runtime wiring logic)', () => {
  it('does not poll without a provider (missing-key)', async () => {
    const result = await pollQuotesOnce({ provider: null, tickers: ['AAPL'], signal })
    expect(result.status).toBe('missing-key')
    expect(result.ticks).toHaveLength(0)
  })

  it('is idle with no tickers', async () => {
    const result = await pollQuotesOnce({ provider: fakeProvider(async () => []), tickers: [], signal })
    expect(result.status).toBe('idle')
    expect(result.ticks).toHaveLength(0)
  })

  it('emits real ticks for configured fixture quotes', async () => {
    const provider = fakeProvider(async () => [quote({ ticker: 'AAPL', price: 195.34, volume: 100 })])
    const result = await pollQuotesOnce({ provider, tickers: ['AAPL'], signal })
    expect(result.status).toBe('connected')
    expect(result.ticks).toEqual([{ symbol: 'AAPL', price: 195.34, volume: 100, timestamp: NOW, source: 'alpaca' }])
  })

  it('fails closed on provider error with no fake fallback', async () => {
    const provider = fakeProvider(async () => {
      throw Object.assign(new Error('rate limited'), { status: 429 })
    })
    const result = await pollQuotesOnce({ provider, tickers: ['AAPL'], signal })
    expect(result.status).toBe('failed')
    expect(result.ticks).toHaveLength(0)
    expect(result.error).toMatch(/rate limited/i)
  })

  it('drops zero/invalid quotes and reports failed (no usable quote)', async () => {
    const provider = fakeProvider(async () => [quote({ ticker: 'AAPL', price: 0 })])
    const result = await pollQuotesOnce({ provider, tickers: ['AAPL'], signal })
    expect(result.status).toBe('failed')
    expect(result.ticks).toHaveLength(0)
    expect(result.quoteCount).toBe(1) // received but unrenderable
  })

  it('quotesToTicks filters unrenderable and never carries keys', () => {
    const ticks = quotesToTicks([
      quote({ ticker: 'AAPL', price: 195 }),
      quote({ ticker: 'BAD', price: 0 }),
    ])
    expect(ticks.map((t) => t.symbol)).toEqual(['AAPL'])
    expect(JSON.stringify(ticks)).not.toMatch(/key|secret|apca/i)
  })
})
