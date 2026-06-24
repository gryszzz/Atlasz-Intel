/*
 * Pure proof-gate for SEC Company Facts source-trail rendering. A fact earns a card
 * only with complete reported-fact metadata + payload proof. Historical reported
 * facts only — never an estimate or valuation.
 */
import type { SecCompanyFact, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableCompanyFacts(events: WorldIntelEvent[], limit = 12): SecCompanyFact[] {
  const out: SecCompanyFact[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const fact = event.companyFact
    if (!fact) continue
    const earns =
      /^\d+$/.test(fact.cik) &&
      Boolean(fact.ticker) &&
      Boolean(fact.concept) &&
      Number.isFinite(fact.value) &&
      /^\d{4}-\d{2}-\d{2}$/.test(fact.periodEnd) &&
      /^\d{4}-\d{2}-\d{2}$/.test(fact.filedDate) &&
      Boolean(fact.form) &&
      Boolean(fact.rawPayloadHash) &&
      Number.isFinite(fact.retrievedAt) &&
      fact.provenance === 'public-disclosure' &&
      fact.confidence >= 90
    if (!earns || seen.has(fact.id)) continue
    seen.add(fact.id)
    out.push(fact)
  }
  return out.slice(0, limit)
}

/** Group renderable facts by ticker for a dossier "Reported Facts" view. */
export function groupCompanyFactsByTicker(events: WorldIntelEvent[], limit = 24): Map<string, SecCompanyFact[]> {
  const grouped = new Map<string, SecCompanyFact[]>()
  for (const fact of selectRenderableCompanyFacts(events, limit)) {
    grouped.set(fact.ticker, [...(grouped.get(fact.ticker) ?? []), fact])
  }
  return grouped
}

/** Reporting periods older than this read as stale fundamentals (≈ 15 months). */
const REPORTING_STALE_AFTER_MS = 460 * 24 * 60 * 60 * 1000

/**
 * A fact is shown stale if our snapshot is cache-stale (now past staleAt) OR the
 * reported period itself is old (e.g. a Capex last reported years ago). Old facts
 * are preserved with their real period — never hidden or fabricated — but flagged.
 */
export function isCompanyFactStale(fact: SecCompanyFact, now = Date.now()): boolean {
  if (Number.isFinite(fact.staleAt) && now > fact.staleAt) return true
  const periodEnd = Date.parse(`${fact.periodEnd}T00:00:00Z`)
  return Number.isFinite(periodEnd) && now - periodEnd > REPORTING_STALE_AFTER_MS
}
