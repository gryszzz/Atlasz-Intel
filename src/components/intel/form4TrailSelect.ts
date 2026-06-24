/*
 * Pure proof-gate for SEC Form 4 source-trail rendering. A transaction earns a card
 * only with complete reported-transaction metadata + payload proof. Source-reported
 * transaction evidence only — never sentiment, valuation, or trading advice.
 */
import type { Form4Transaction, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableForm4(events: WorldIntelEvent[], limit = 24): Form4Transaction[] {
  const out: Form4Transaction[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const txn = event.form4Transaction
    if (!txn) continue
    const earns =
      /^\d+$/.test(txn.issuerCik) &&
      Boolean(txn.issuerTicker) &&
      Boolean(txn.accessionNumber) &&
      Boolean(txn.ownerName) &&
      /^[A-Z]$/.test(txn.transactionCode) &&
      /^\d{4}-\d{2}-\d{2}$/.test(txn.transactionDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(txn.filingDate) &&
      Boolean(txn.rawPayloadHash) &&
      Number.isFinite(txn.retrievedAt) &&
      txn.provenance === 'public-disclosure' &&
      txn.confidence >= 90
    if (!earns || seen.has(txn.id)) continue
    seen.add(txn.id)
    out.push(txn)
  }
  return out.slice(0, limit)
}

/** Group renderable transactions by issuer ticker for a dossier insider-transactions view. */
export function groupForm4ByIssuer(events: WorldIntelEvent[], limit = 24): Map<string, Form4Transaction[]> {
  const grouped = new Map<string, Form4Transaction[]>()
  for (const txn of selectRenderableForm4(events, limit)) {
    grouped.set(txn.issuerTicker, [...(grouped.get(txn.issuerTicker) ?? []), txn])
  }
  return grouped
}
