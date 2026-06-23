/*
 * Proof gate for Market Reference Master cards. SEC company_tickers.json proves
 * ticker, CIK, and legal title only. No exchange/sector/industry is fabricated.
 */
import type { MarketIdentity, WorldIntelEvent } from '../../worldIntel'

const SEC_COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json'

export function selectRenderableMarketIdentities(events: WorldIntelEvent[], limit = 8): MarketIdentity[] {
  return filterRenderableMarketIdentities(events.flatMap((event) => event.marketIdentity ? [event.marketIdentity] : []), limit)
}

export function filterRenderableMarketIdentities(identities: MarketIdentity[], limit = 8): MarketIdentity[] {
  const out: MarketIdentity[] = []
  const seen = new Set<string>()
  for (const identity of identities) {
    const earns =
      /^[A-Z0-9.-]{1,24}$/.test(identity.ticker) &&
      /^\d+$/.test(identity.cik) &&
      /^\d{10}$/.test(identity.cikPadded) &&
      Boolean(identity.legalName) &&
      identity.sourceUrl === SEC_COMPANY_TICKERS_URL &&
      identity.provenance === 'official-api' &&
      identity.confidence >= 90 &&
      Boolean(identity.rawPayloadHash) &&
      Number.isFinite(identity.retrievedAt)
    const key = `${identity.ticker}:${identity.cik}`
    if (!earns || seen.has(key)) continue
    seen.add(key)
    out.push(identity)
  }
  return out.slice(0, limit)
}
