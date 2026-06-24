/*
 * Quote poll loop — the runtime wiring logic for key-gated quotes.
 *
 * Pure + testable: given a provider (or null) and a ticker allowlist, it fetches
 * real quotes, proof-gates them, maps to LiveTicks, and reports status. It NEVER
 * emits an unrenderable/fake tick and has NO random-walk fallback. With no
 * provider it does not poll (missing-key); on error it fails closed.
 */
import { isRenderableQuote, type MarketQuote } from '../../../src/marketQuote'
import type { LiveTick } from '../../../src/realtime'
import type { QuoteProvider } from './quoteProvider'

export type QuotePollStatus = 'missing-key' | 'idle' | 'connected' | 'failed'

export type QuotePollResult = {
  status: QuotePollStatus
  ticks: LiveTick[]
  error?: string
  quoteCount: number
}

/** Map proof-gated quotes to LiveTicks. Unrenderable quotes are dropped. */
export function quotesToTicks(quotes: MarketQuote[], source = 'alpaca'): LiveTick[] {
  return quotes
    .filter(isRenderableQuote)
    .map((quote) => ({
      symbol: quote.ticker,
      price: quote.price,
      volume: quote.volume ?? 0,
      timestamp: quote.marketTimestamp,
      source,
    }))
}

/**
 * One poll cycle. Fail-closed: no provider -> missing-key (no poll); no tickers ->
 * idle; provider error -> failed (no ticks); zero usable quotes -> failed (no
 * fabricated tick). Returns only proof-gated ticks.
 */
export async function pollQuotesOnce(input: {
  provider: QuoteProvider | null
  tickers: string[]
  signal: AbortSignal
  source?: string
}): Promise<QuotePollResult> {
  if (!input.provider) {
    return { status: 'missing-key', ticks: [], quoteCount: 0, error: 'No configured quote provider/keys (fail-closed).' }
  }
  if (input.tickers.length === 0) {
    return { status: 'idle', ticks: [], quoteCount: 0 }
  }
  try {
    const quotes = await input.provider.fetchQuotes(input.tickers, input.signal)
    const ticks = quotesToTicks(quotes, input.source)
    if (ticks.length === 0) {
      return { status: 'failed', ticks: [], quoteCount: quotes.length, error: 'No usable real quotes returned.' }
    }
    return { status: 'connected', ticks, quoteCount: quotes.length }
  } catch (error) {
    // No fake fallback — surface the failure.
    return { status: 'failed', ticks: [], quoteCount: 0, error: error instanceof Error ? error.message : String(error) }
  }
}
