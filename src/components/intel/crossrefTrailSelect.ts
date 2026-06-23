/*
 * Pure proof-gate for Crossref DOI metadata source-trail rendering. A record
 * earns a card only with complete DOI metadata + payload proof, and only when
 * the optional polite-pool mailto never leaked into the persisted API URL.
 */
import type { CrossrefWork, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableCrossrefWorks(events: WorldIntelEvent[], limit = 8): CrossrefWork[] {
  const out: CrossrefWork[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const work = event.crossrefWork
    if (!work) continue
    const earns =
      /^10\.\d{4,}\//i.test(work.doi) &&
      Boolean(work.title) &&
      /^https:\/\/doi\.org\/10\.\d{4,}\//i.test(work.doiUrl) &&
      /^https:\/\/api\.crossref\.org\/works(?:\?|$)/i.test(work.sourceApiUrl) &&
      !/[?&]mailto=/i.test(work.sourceApiUrl) &&
      Boolean(work.rawPayloadHash) &&
      Number.isFinite(work.retrievedAt) &&
      work.provenance === 'official-api' &&
      work.confidence >= 90
    if (!earns || seen.has(work.doi)) continue
    seen.add(work.doi)
    out.push(work)
  }
  return out.slice(0, limit)
}
