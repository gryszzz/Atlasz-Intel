/*
 * Pure proof-gate for USPTO patent source-trail rendering. Kept separate from the
 * component so it stays unit-testable and fast-refresh clean.
 */
import type { PatentRecord, WorldIntelEvent } from '../../worldIntel'

export function selectRenderablePatents(events: WorldIntelEvent[], limit = 8): PatentRecord[] {
  const out: PatentRecord[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const patent = event.patentRecord
    if (!patent) continue
    const earns =
      Boolean(patent.patentId) &&
      Boolean(patent.title) &&
      /^https:\/\/patents\.google\.com\/patent\//.test(patent.sourceUrl) &&
      Boolean(patent.rawPayloadHash) &&
      Number.isFinite(patent.retrievedAt) &&
      patent.confidence >= 90
    if (!earns || seen.has(patent.patentId)) continue
    seen.add(patent.patentId)
    out.push(patent)
  }
  return out.slice(0, limit)
}
