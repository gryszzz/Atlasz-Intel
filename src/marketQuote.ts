/*
 * Real, key-gated market quote contract (Realtime Equity/ETF Price Provider).
 *
 * A MarketQuote is a real, source-backed price — never a seeded/default
 * placeholder. There is NO random-walk fallback: if no real provider quote
 * exists, the UI shows PRICE_UNAVAILABLE. Quotes are key-gated market data
 * (provenance 'auth-gated'), shown stale when stale, and carry full proof
 * fields. No trading advice, prediction, or signal score is implied.
 */
import type { ProvenanceId } from './provenance'

export const PRICE_UNAVAILABLE = 'PRICE_UNAVAILABLE'

export type MarketQuoteAssetType = 'equity' | 'etf' | 'index'
export type MarketQuoteChange = 'first_seen' | 'updated' | 'unchanged'

export type MarketQuote = {
  id: string
  ticker: string
  /** Set only when the source/caller can classify it. */
  assetType?: MarketQuoteAssetType
  price: number
  bid?: number
  ask?: number
  volume?: number
  /** Exchange/source timestamp of the print (epoch ms). */
  marketTimestamp: number
  sourceId: string
  sourceName: string
  sourceUrl: string
  /** Sanitized API URL — never contains keys. */
  sourceApiUrl: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  /** Honest classification: this is authenticated, key-gated market data. */
  marketDataClass: 'key-gated-market-data'
  confidence: number
  changeType?: MarketQuoteChange
  rawPayloadHash: string
  rawPayloadJson?: string
}

/** Proof gate: a quote renders only when it is real and source-backed. */
export function isRenderableQuote(quote: MarketQuote): boolean {
  return (
    Boolean(quote.ticker) &&
    Number.isFinite(quote.price) &&
    quote.price > 0 &&
    Number.isFinite(quote.marketTimestamp) &&
    quote.marketTimestamp > 0 &&
    Boolean(quote.sourceId) &&
    /^https:\/\//.test(quote.sourceUrl) &&
    !/[?&](api[_-]?key|apca|secret|token)/i.test(quote.sourceApiUrl) &&
    quote.provenance === 'auth-gated' &&
    quote.marketDataClass === 'key-gated-market-data' &&
    Number.isFinite(quote.retrievedAt) &&
    Number.isFinite(quote.staleAt) &&
    quote.rawPayloadHash.length > 0 &&
    quote.confidence >= 90
  )
}

export function isQuoteStale(quote: MarketQuote, now: number): boolean {
  return !Number.isFinite(quote.staleAt) || quote.staleAt <= now
}

/** Render-safe price label; PRICE_UNAVAILABLE for any non-real/empty quote. */
export function quotePriceLabel(quote: MarketQuote | null | undefined): string {
  if (!quote || !isRenderableQuote(quote)) return PRICE_UNAVAILABLE
  if (quote.price >= 1000) return quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (quote.price >= 1) return quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return quote.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}
