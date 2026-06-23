/*
 * Pure proof-gate for Federal Register regulatory document source-trail
 * rendering. A document earns a card only when it carries complete official
 * source metadata and payload proof.
 */
import type { RegulatoryDocument, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableRegulatoryDocuments(events: WorldIntelEvent[], limit = 8): RegulatoryDocument[] {
  const out: RegulatoryDocument[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const document = event.regulatoryDocument
    if (!document) continue
    const earns =
      Boolean(document.documentNumber) &&
      Boolean(document.title) &&
      /^\d{4}-\d{2}-\d{2}$/.test(document.publicationDate) &&
      /^https:\/\/www\.federalregister\.gov\/documents\//.test(document.htmlUrl) &&
      /^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/.test(document.sourceApiUrl) &&
      Boolean(document.rawPayloadHash) &&
      Number.isFinite(document.retrievedAt) &&
      document.confidence >= 90
    if (!earns || seen.has(document.documentNumber)) continue
    seen.add(document.documentNumber)
    out.push(document)
  }
  return out.slice(0, limit)
}
