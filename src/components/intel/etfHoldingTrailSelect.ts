/*
 * Pure proof gate for ETF holdings source-trail rendering.
 *
 * ETF rows render only with source date, official issuer URL, retrievedAt,
 * confidence, provenance, and payload hash. Weights are displayed only when the
 * source provided them; no ranking, current-position, or recommendation claims.
 */
import type { EtfHolding, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableEtfHoldings(events: WorldIntelEvent[], limit = 24, now = Date.now()): EtfHolding[] {
  const out: EtfHolding[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const holding = event.etfHolding
    if (!holding) continue
    const proof =
      Boolean(holding.fundTicker) &&
      Boolean(holding.fundName) &&
      Boolean(holding.issuer) &&
      /^\d{4}-\d{2}-\d{2}$/.test(holding.sourceDate) &&
      Number.isFinite(holding.sourceTimestamp) &&
      Boolean(holding.holdingName) &&
      /^https:\/\/(?:www\.)?(?:blackrock|ishares|ssga)\.com\//i.test(holding.sourceUrl) &&
      Boolean(holding.rawPayloadHash) &&
      Number.isFinite(holding.retrievedAt) &&
      Number.isFinite(holding.staleAt) &&
      holding.provenance === 'public-disclosure' &&
      holding.confidence >= 90
    if (!proof || seen.has(holding.id)) continue
    seen.add(holding.id)
    out.push(holding)
  }
  return out
    .sort((left, right) => {
      const staleLeft = left.staleAt <= now ? 1 : 0
      const staleRight = right.staleAt <= now ? 1 : 0
      return staleLeft - staleRight || right.sourceTimestamp - left.sourceTimestamp || left.fundTicker.localeCompare(right.fundTicker)
    })
    .slice(0, limit)
}

export function groupEtfHoldingsByFund(events: WorldIntelEvent[], limit = 24, now = Date.now()): Map<string, EtfHolding[]> {
  const grouped = new Map<string, EtfHolding[]>()
  for (const holding of selectRenderableEtfHoldings(events, limit, now)) {
    const key = `${holding.fundTicker}:${holding.sourceDate}`
    grouped.set(key, [...(grouped.get(key) ?? []), holding])
  }
  return grouped
}
