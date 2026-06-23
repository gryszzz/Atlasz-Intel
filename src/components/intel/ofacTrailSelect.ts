/*
 * Pure proof-gate for OFAC sanctions source-trail rendering. A record earns a
 * card only with official source links, stable UID, payload hash, retrieval time,
 * and high confidence.
 */
import type { OfacSanctionsRecord, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableOfacSanctions(events: WorldIntelEvent[], limit = 8): OfacSanctionsRecord[] {
  const out: OfacSanctionsRecord[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const record = event.ofacSanctionsRecord
    if (!record) continue
    const earns =
      /^\d+$/.test(record.uid) &&
      Boolean(record.name) &&
      Boolean(record.entityType) &&
      /^https:\/\/sanctionslist\.ofac\.treas\.gov\/Home\/SdnList$/.test(record.sourceUrl) &&
      /^https:\/\/sanctionslistservice\.ofac\.treas\.gov\/api\/PublicationPreview\/exports\/SDN\.XML$/i.test(record.sourceDataUrl) &&
      Boolean(record.rawPayloadHash) &&
      Number.isFinite(record.retrievedAt) &&
      record.confidence >= 90
    if (!earns || seen.has(record.uid)) continue
    seen.add(record.uid)
    out.push(record)
  }
  return out.slice(0, limit)
}
