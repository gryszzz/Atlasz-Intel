/*
 * Pure proof-gate for OpenAlex research source-trail rendering. A work earns a card
 * only with complete official metadata + payload proof, and only when the api_key
 * never leaked into the persisted source URL. Research metadata, never validation.
 */
import type { OpenAlexWork, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableOpenAlexWorks(events: WorldIntelEvent[], limit = 8): OpenAlexWork[] {
  const out: OpenAlexWork[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const work = event.openAlexWork
    if (!work) continue
    const earns =
      /^W\d+$/.test(work.openAlexWorkId) &&
      Boolean(work.title) &&
      /^https:\/\/openalex\.org\/W\d+$/.test(work.openAlexUrl) &&
      Boolean(work.rawPayloadHash) &&
      Number.isFinite(work.retrievedAt) &&
      !/api_key=/i.test(work.sourceApiUrl) &&
      work.provenance === 'official-api' &&
      work.confidence >= 90
    if (!earns || seen.has(work.openAlexWorkId)) continue
    seen.add(work.openAlexWorkId)
    out.push(work)
  }
  return out.slice(0, limit)
}
