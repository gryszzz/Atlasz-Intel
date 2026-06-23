/*
 * Pure proof-gate for UN Comtrade trade-flow source-trail rendering. A trade
 * record earns a card only with complete official trade-flow metadata + payload
 * proof, and only when the API key never leaked into the persisted source URL.
 */
import type { ComtradeTradeRecord, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableComtradeRecords(events: WorldIntelEvent[], limit = 8): ComtradeTradeRecord[] {
  const out: ComtradeTradeRecord[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const record = event.comtradeRecord
    if (!record) continue
    const earns =
      /^\d+$/.test(record.reporterCode) &&
      /^\d+$/.test(record.partnerCode) &&
      Boolean(record.commodityCode) &&
      Boolean(record.flowCode) &&
      Boolean(record.period) &&
      Number.isFinite(record.tradeValue) &&
      Boolean(record.rawPayloadHash) &&
      Number.isFinite(record.retrievedAt) &&
      !/subscription-key/i.test(record.sourceApiUrl) &&
      record.provenance === 'official-api' &&
      record.confidence >= 90
    if (!earns || seen.has(record.id)) continue
    seen.add(record.id)
    out.push(record)
  }
  return out.slice(0, limit)
}
