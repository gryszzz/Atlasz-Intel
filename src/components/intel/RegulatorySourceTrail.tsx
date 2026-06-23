/*
 * Federal Register source-trail cards.
 *
 * Renders normalized regulatory documents (events carrying a
 * `regulatoryDocument`), each with document number, type, agencies, publication
 * date, official API URL, FederalRegister.gov document URL, and govinfo PDF when
 * present. Empty input shows DATA_UNAVAILABLE; nothing is fabricated.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableRegulatoryDocuments } from './regulatoryTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './RegulatorySourceTrail.css'

const REGULATORY_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function RegulatorySourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const documents = selectRenderableRegulatoryDocuments(events, limit)
  return (
    <section className="fr-trail">
      <header className="fr-trail-head">
        <span>Federal Register</span>
        <strong>{documents.length > 0 ? `${documents.length} documents` : REGULATORY_UNAVAILABLE}</strong>
      </header>
      {documents.length > 0 ? (
        <div className="fr-trail-stack">
          {documents.map((document) => (
            <article key={document.id} className="fr-row">
              <div className="fr-row-head">
                <strong>{document.documentNumber}</strong>
                <ProvenanceBadge value={document.provenance} size="sm" />
                <span>{document.confidence}%</span>
              </div>
              <p className="fr-title">{document.title}</p>
              <dl className="fr-meta">
                <div>
                  <dt>Type</dt>
                  <dd>{document.documentType}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{document.publicationDate}</dd>
                </div>
                {document.effectiveDate && (
                  <div>
                    <dt>Effective</dt>
                    <dd>{document.effectiveDate}</dd>
                  </div>
                )}
                {document.commentEndDate && (
                  <div>
                    <dt>Comments close</dt>
                    <dd>{document.commentEndDate}</dd>
                  </div>
                )}
                <div>
                  <dt>Agency</dt>
                  <dd>{document.agencies.length > 0 ? document.agencies.slice(0, 3).join(', ') : 'unlisted'}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{document.rawPayloadHash.slice(0, 12)}…</dd>
                </div>
              </dl>
              <div className="fr-links">
                <a href={document.htmlUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  document source trail
                </a>
                <a href={document.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  official API URL
                </a>
                {document.pdfUrl && (
                  <a href={document.pdfUrl} target="_blank" rel="noreferrer">
                    <Link2 size={12} />
                    govinfo official PDF
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="fr-trail-empty">
          <strong>{REGULATORY_UNAVAILABLE}</strong>
          <p>No Federal Register documents available. The official public API returned nothing, failed, or is disabled. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
