/*
 * Quote provider abstraction — key-gated, fail-closed market price plumbing.
 *
 * A QuoteProvider returns REAL source-backed quotes or nothing. No provider is
 * resolved without its credentials, so the system fails closed (PRICE_UNAVAILABLE)
 * rather than fabricating prices. Alpaca IEX is the first adapter; Polygon/Tiingo/
 * IEX Cloud can be added the same way.
 */
import type { MarketQuote } from '../../../src/marketQuote'
import { createAlpacaQuoteProvider, readAlpacaQuoteConfig } from './alpacaQuoteProvider'

export type QuoteProvider = {
  id: string
  name: string
  trustTier: 'key-gated-market-data'
  requiredEnv: string[]
  fetchQuotes(tickers: string[], signal: AbortSignal): Promise<MarketQuote[]>
}

/**
 * Resolve the configured equity/ETF quote provider, or null when none is
 * configured (fail-closed). Selection via ATLASZ_EQUITY_QUOTE_PROVIDER.
 */
export function resolveQuoteProvider(env: NodeJS.ProcessEnv = process.env): QuoteProvider | null {
  const selected = (env.ATLASZ_EQUITY_QUOTE_PROVIDER || 'alpaca').trim().toLowerCase()
  if (selected === 'alpaca') {
    const config = readAlpacaQuoteConfig(env)
    return config ? createAlpacaQuoteProvider(config) : null
  }
  // Other providers (polygon/tiingo/iex) not yet implemented -> fail closed.
  return null
}
