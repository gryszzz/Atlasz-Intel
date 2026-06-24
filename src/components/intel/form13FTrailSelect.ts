/*
 * Pure proof gate for SEC Form 13F source-trail rendering.
 *
 * 13F rows are quarterly delayed SEC-reported holding snapshots. They render only
 * with complete proof fields and never imply current position, conviction,
 * sentiment, performance, valuation, price prediction, or trading advice.
 */
import type { Form13FHolding, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableForm13F(events: WorldIntelEvent[], limit = 24): Form13FHolding[] {
  const out: Form13FHolding[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const holding = event.form13fHolding
    if (!holding) continue
    const earns =
      /^\d+$/.test(holding.filerCik) &&
      /^\d{10}$/.test(holding.filerCikPadded) &&
      Boolean(holding.filerName) &&
      Boolean(holding.accessionNumber) &&
      /^(13F-HR|13F-HR\/A)$/i.test(holding.filingType) &&
      /^\d{4}-\d{2}-\d{2}$/.test(holding.filingDate) &&
      Boolean(holding.issuerName) &&
      /^[0-9A-Z]{9}$/.test(holding.cusip) &&
      Number.isFinite(holding.value) &&
      /^https:\/\/(?:www\.)?sec\.gov\//i.test(holding.sourceFilingUrl) &&
      /^https:\/\/(?:www\.)?sec\.gov\//i.test(holding.sourceInfoTableUrl) &&
      Boolean(holding.rawPayloadHash) &&
      Number.isFinite(holding.retrievedAt) &&
      holding.provenance === 'public-disclosure' &&
      holding.confidence >= 90
    if (!earns || seen.has(holding.id)) continue
    seen.add(holding.id)
    out.push(holding)
  }
  return out.slice(0, limit)
}

/** Group renderable 13F rows by reported institutional filer. */
export function groupForm13FByFiler(events: WorldIntelEvent[], limit = 24): Map<string, Form13FHolding[]> {
  const grouped = new Map<string, Form13FHolding[]>()
  for (const holding of selectRenderableForm13F(events, limit)) {
    const key = `${holding.filerCik}:${holding.filerName}`
    grouped.set(key, [...(grouped.get(key) ?? []), holding])
  }
  return grouped
}
