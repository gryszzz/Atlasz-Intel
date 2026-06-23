/*
 * Pure proof-gate for GDELT media-observation source-trail rendering. An article
 * earns a card only when it carries complete observation metadata + payload proof.
 * GDELT is media observation, not a verified event — the gate never upgrades that.
 */
import type { GdeltArticle, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableGdeltArticles(events: WorldIntelEvent[], limit = 8): GdeltArticle[] {
  const out: GdeltArticle[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const article = event.gdeltArticle
    if (!article) continue
    const earns =
      Boolean(article.title) &&
      /^https:\/\//i.test(article.url) &&
      Boolean(article.domain) &&
      Boolean(article.seenDate) &&
      Number.isFinite(article.seenTimestamp) &&
      Boolean(article.rawPayloadHash) &&
      Number.isFinite(article.retrievedAt) &&
      article.provenance === 'media-observation' &&
      article.confidence >= 90
    if (!earns || seen.has(article.rawPayloadHash)) continue
    seen.add(article.rawPayloadHash)
    out.push(article)
  }
  return out.slice(0, limit)
}
