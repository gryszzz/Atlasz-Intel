/*
 * Pure proof-gate for Congress.gov source-trail rendering. A bill/action earns
 * a card only with official source links, no leaked api_key, latest action
 * metadata, retrieval time, payload hash, and high confidence.
 */
import type { CongressBillAction, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableCongressBills(events: WorldIntelEvent[], limit = 8): CongressBillAction[] {
  const out: CongressBillAction[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const bill = event.congressBillAction
    if (!bill) continue
    const key = `${bill.congress}:${bill.billType}:${bill.billNumber}`.toLowerCase()
    const earns =
      Number.isInteger(bill.congress) &&
      bill.congress > 0 &&
      Boolean(bill.billType) &&
      Boolean(bill.billNumber) &&
      Boolean(bill.title) &&
      /^\d{4}-\d{2}-\d{2}$/.test(bill.latestActionDate) &&
      Boolean(bill.latestActionText) &&
      /^https:\/\/www\.congress\.gov\/bill\//.test(bill.officialUrl) &&
      /^https:\/\/api\.congress\.gov\/v3\/bill\//.test(bill.sourceApiUrl) &&
      !/api_key=/i.test(bill.sourceApiUrl) &&
      Boolean(bill.rawPayloadHash) &&
      Number.isFinite(bill.retrievedAt) &&
      bill.confidence >= 90
    if (!earns || seen.has(key)) continue
    seen.add(key)
    out.push(bill)
  }
  return out.slice(0, limit)
}
