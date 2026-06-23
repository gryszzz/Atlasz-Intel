/*
 * Crossref DOI metadata source-trail cards.
 *
 * Renders normalized Crossref REST metadata only. Every card shows the DOI,
 * source URL, sanitized API query, payload hash, retrieved time, and the hard
 * boundary: DOI registry metadata is not full text and not validation of
 * research claims, citation quality, or market impact.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableCrossrefWorks } from './crossrefTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './CrossrefSourceTrail.css'

const CROSSREF_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function CrossrefSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const works = selectRenderableCrossrefWorks(events, limit)
  return (
    <section className="crossref-trail">
      <header className="crossref-trail-head">
        <span>Crossref DOI metadata</span>
        <strong>{works.length > 0 ? `${works.length} DOI records` : CROSSREF_UNAVAILABLE}</strong>
      </header>
      <p className="crossref-trail-boundary">DOI registry metadata, not full text and not validation of research claims, citation quality, or market impact.</p>
      {works.length > 0 ? (
        <div className="crossref-trail-stack">
          {works.map((work) => (
            <article key={work.id} className="crossref-row">
              <div className="crossref-row-head">
                <strong>{work.queryBucket || 'query bucket'}</strong>
                <ProvenanceBadge value={work.provenance} size="sm" />
                <span>{work.confidence}%</span>
              </div>
              <p className="crossref-title">{work.title}</p>
              <dl className="crossref-meta">
                <div>
                  <dt>DOI</dt>
                  <dd>{work.doi}</dd>
                </div>
                <div>
                  <dt>Issued</dt>
                  <dd>{work.issuedDate ?? 'unknown'}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{work.type}</dd>
                </div>
                {work.publisher && (
                  <div>
                    <dt>Publisher</dt>
                    <dd>{work.publisher}</dd>
                  </div>
                )}
                {work.containerTitle && (
                  <div>
                    <dt>Venue</dt>
                    <dd>{work.containerTitle}</dd>
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
                  <dt>Referenced by</dt>
                  <dd>{work.isReferencedByCount ?? 'n/a'} metadata</dd>
                </div>
                <div>
                  <dt>References</dt>
                  <dd>{work.referenceCount ?? 'n/a'} metadata</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{work.rawPayloadHash.slice(0, 12)}...</dd>
                </div>
              </dl>
              {(work.subjects.length > 0 || work.funders.length > 0 || work.licenseUrls.length > 0) && (
                <div className="crossref-tags" aria-label="Crossref subjects, funders, and licenses">
                  {work.subjects.slice(0, 4).map((subject) => <span key={`subject-${subject}`}>{subject}</span>)}
                  {work.funders.slice(0, 3).map((funder) => <span key={`funder-${funder}`}>{funder}</span>)}
                  {work.licenseUrls.length > 0 && <span>{work.licenseUrls.length} license link{work.licenseUrls.length === 1 ? '' : 's'}</span>}
                </div>
              )}
              <div className="crossref-links">
                <a href={work.doiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  DOI
                </a>
                <a href={work.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Crossref API query
                </a>
                {work.url && work.url !== work.doiUrl && (
                  <a href={work.url} target="_blank" rel="noreferrer">
                    <Link2 size={12} />
                    metadata URL
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="crossref-trail-empty">
          <strong>{CROSSREF_UNAVAILABLE}</strong>
          <p>No Crossref DOI metadata available. The official API returned nothing, failed, or hit rate limits. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
