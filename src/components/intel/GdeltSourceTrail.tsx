/*
 * GDELT media-observation source-trail cards.
 *
 * Renders normalized GDELT DOC 2.0 article observations (events carrying a
 * `gdeltArticle`). Every card leads with the hard boundary — "Observed in media,
 * not a verified event" — and shows title, domain, seen date, query bucket, and
 * payload hash. Empty input shows DATA_UNAVAILABLE; nothing is fabricated, and no
 * exposure, causality, or tone is shown.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableGdeltArticles } from './gdeltTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './GdeltSourceTrail.css'

const GDELT_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function GdeltSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const articles = selectRenderableGdeltArticles(events, limit)
  return (
    <section className="gdelt-trail">
      <header className="gdelt-trail-head">
        <span>GDELT (media)</span>
        <strong>{articles.length > 0 ? `${articles.length} observations` : GDELT_UNAVAILABLE}</strong>
      </header>
      <p className="gdelt-trail-boundary">Observed in media, not a verified event. No causality, tone, or company exposure is inferred.</p>
      {articles.length > 0 ? (
        <div className="gdelt-trail-stack">
          {articles.map((article) => (
            <article key={article.id} className="gdelt-row">
              <div className="gdelt-row-head">
                <strong>{article.domain}</strong>
                <ProvenanceBadge value={article.provenance} size="sm" />
                <span>{article.confidence}%</span>
              </div>
              <p className="gdelt-title">{article.title}</p>
              <dl className="gdelt-meta">
                <div>
                  <dt>Seen</dt>
                  <dd>{new Date(article.seenTimestamp).toISOString()}</dd>
                </div>
                {article.sourceCountry && (
                  <div>
                    <dt>Outlet country</dt>
                    <dd>{article.sourceCountry}</dd>
                  </div>
                )}
                {article.language && (
                  <div>
                    <dt>Language</dt>
                    <dd>{article.language}</dd>
                  </div>
                )}
                <div>
                  <dt>Query bucket</dt>
                  <dd className="gdelt-bucket">{article.queryBucket}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{article.rawPayloadHash.slice(0, 12)}…</dd>
                </div>
              </dl>
              <div className="gdelt-links">
                <a href={article.url} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  article (media source)
                </a>
                <a href={article.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  GDELT API query
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="gdelt-trail-empty">
          <strong>{GDELT_UNAVAILABLE}</strong>
          <p>No GDELT media observations available. The public DOC API returned nothing, failed, or is disabled. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
