/*
 * OpenAlex research source-trail cards.
 *
 * Renders normalized OpenAlex Works metadata only. Every card shows the official
 * OpenAlex work URL, sanitized API query, payload hash, retrieved time, and the
 * hard boundary: metadata is not validation of technical claims, breakthrough
 * quality, or market impact. Empty input shows DATA_UNAVAILABLE; nothing is
 * fabricated.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { selectRenderableOpenAlexWorks } from './openAlexTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './OpenAlexSourceTrail.css'

const OPENALEX_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function OpenAlexSourceTrail({ events, limit = 8, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const works = selectRenderableOpenAlexWorks(events, limit)
  return (
    <section className="openalex-trail">
      <header className="openalex-trail-head">
        <span>OpenAlex research</span>
        <strong>{works.length > 0 ? `${works.length} works` : OPENALEX_UNAVAILABLE}</strong>
      </header>
      <p className="openalex-trail-boundary">Research metadata, not validation of technical claims, breakthroughs, citation quality, or market impact.</p>
      {works.length > 0 ? (
        <div className="openalex-trail-stack">
          {works.map((work) => (
            <article key={work.id} className="openalex-row">
              <div className="openalex-row-head">
                <strong>{work.queryBucket || 'topic bucket'}</strong>
                <ProvenanceBadge value={work.provenance} size="sm" />
                <FreshnessBadge size="sm" now={now} retrievedAt={work.retrievedAt} />
                <span className="openalex-change">{work.changeType.replace('_', ' ')}</span>
                <span>{work.confidence}%</span>
              </div>
              <p className="openalex-title">{work.title}</p>
              <dl className="openalex-meta">
                <div>
                  <dt>Work ID</dt>
                  <dd>{work.openAlexWorkId}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{work.publicationDate ?? work.publicationYear ?? 'unknown'}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{work.type}</dd>
                </div>
                {work.venue && (
                  <div>
                    <dt>Venue</dt>
                    <dd>{work.venue}</dd>
                  </div>
                )}
                <div>
                  <dt>Source</dt>
                  <dd>{work.sourceName}</dd>
                </div>
                <div>
                  <dt>Retrieved</dt>
                  <dd>{new Date(work.retrievedAt).toISOString().slice(0, 10)}</dd>
                </div>
                <div>
                  <dt>Cited by</dt>
                  <dd>{work.citedByCount ?? 'n/a'} metadata</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{work.rawPayloadHash.slice(0, 12)}...</dd>
                </div>
              </dl>
              {(work.topics.length > 0 || work.institutions.length > 0) && (
                <div className="openalex-tags" aria-label="OpenAlex topics and institutions">
                  {work.topics.slice(0, 4).map((topic) => <span key={`topic-${topic}`}>{topic}</span>)}
                  {work.institutions.slice(0, 3).map((institution) => <span key={`institution-${institution}`}>{institution}</span>)}
                </div>
              )}
              <div className="openalex-links">
                <a href={work.openAlexUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  OpenAlex work
                </a>
                <a href={work.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  API query (key-free)
                </a>
                {work.doiUrl && (
                  <a href={work.doiUrl} target="_blank" rel="noreferrer">
                    <Link2 size={12} />
                    DOI
                  </a>
                )}
                {work.landingPageUrl && (
                  <a href={work.landingPageUrl} target="_blank" rel="noreferrer">
                    <Link2 size={12} />
                    landing page
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="openalex-trail-empty">
          <strong>{OPENALEX_UNAVAILABLE}</strong>
          <p>No OpenAlex research metadata available. The public source returned nothing, failed, or hit rate limits. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
