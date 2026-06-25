/*
 * Options chain / open interest contract (key-gated market data).
 *
 * Real, source-backed option contracts only — last trade/quote, implied
 * volatility, greeks, and open interest WHEN the source provides them. The
 * contract identity (underlying/expiration/type/strike) is decoded from the OCC
 * symbol (deterministic, not fabricated). There is NO "flow"/"unusual activity"
 * inference — only what the source reports. No trading advice, prediction, or
 * signal score. Missing/unconfigured -> not renderable (PRICE_UNAVAILABLE).
 */
import type { ProvenanceId } from './provenance'

export const OPTION_DATA_UNAVAILABLE = 'OPTION_DATA_UNAVAILABLE'

export type OptionType = 'call' | 'put'

export type OptionsContract = {
  id: string
  contractSymbol: string
  underlying: string
  optionType: OptionType
  strike: number
  /** Expiration date, YYYY-MM-DD. */
  expiration: string
  lastPrice?: number
  bid?: number
  ask?: number
  /** Open interest — only when the source field exists (often EOD, not realtime). */
  openInterest?: number
  volume?: number
  impliedVolatility?: number
  marketTimestamp: number
  sourceId: string
  sourceName: string
  sourceUrl: string
  sourceApiUrl: string
  retrievedAt: number
  staleAt: number
  provenance: ProvenanceId
  marketDataClass: 'key-gated-market-data'
  confidence: number
  rawPayloadHash: string
  rawPayloadJson?: string
}

const OCC_PATTERN = /^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/

/** Decode an OCC option symbol into its parts; null if it isn't a valid OCC symbol. */
export function parseOccSymbol(
  symbol: string,
): { underlying: string; expiration: string; optionType: OptionType; strike: number } | null {
  const match = OCC_PATTERN.exec(symbol.trim().toUpperCase())
  if (!match) return null
  const [, underlying, yy, mm, dd, cp, strikeRaw] = match
  const expiration = `20${yy}-${mm}-${dd}`
  if (!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(expiration)) return null
  const strike = Number(strikeRaw) / 1000
  if (!Number.isFinite(strike) || strike <= 0) return null
  return { underlying, expiration, optionType: cp === 'C' ? 'call' : 'put', strike }
}

/** Proof gate: a contract renders only when real and source-backed. */
export function isRenderableOption(contract: OptionsContract): boolean {
  const hasDataPoint =
    (contract.lastPrice !== undefined && contract.lastPrice > 0) ||
    (contract.bid !== undefined && contract.bid > 0) ||
    (contract.ask !== undefined && contract.ask > 0) ||
    contract.openInterest !== undefined
  return (
    OCC_PATTERN.test(contract.contractSymbol) &&
    Boolean(contract.underlying) &&
    contract.strike > 0 &&
    /^20\d{2}-\d{2}-\d{2}$/.test(contract.expiration) &&
    (contract.optionType === 'call' || contract.optionType === 'put') &&
    hasDataPoint &&
    Number.isFinite(contract.marketTimestamp) &&
    contract.marketTimestamp > 0 &&
    Boolean(contract.sourceId) &&
    /^https:\/\//.test(contract.sourceUrl) &&
    !/[?&](api[_-]?key|apca|secret|token)/i.test(contract.sourceApiUrl) &&
    contract.provenance === 'auth-gated' &&
    contract.marketDataClass === 'key-gated-market-data' &&
    Number.isFinite(contract.retrievedAt) &&
    Number.isFinite(contract.staleAt) &&
    contract.rawPayloadHash.length > 0 &&
    contract.confidence >= 90
  )
}

export function isOptionStale(contract: OptionsContract, now: number): boolean {
  return !Number.isFinite(contract.staleAt) || contract.staleAt <= now
}
