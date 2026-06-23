/*
 * USPTO patent source-trail cards.
 *
 * Renders normalized patents (events carrying a `patentRecord`), each earning its
 * card only with a complete source trail: patent id, title, grant date, assignee
 * organizations, classifications, official URL, payload hash. Assignees are
 * organizations only — no inventor/person data. Empty input shows DATA_UNAVAILABLE.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderablePatents } from './patentTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './PatentSourceTrail.css'

const PATENT_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function PatentSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const patents = selectRenderablePatents(events, limit)
  return (
    <section className="pt-trail">
      <header className="pt-trail-head">
        <span>USPTO Patents</span>
        <strong>{patents.length > 0 ? `${patents.length} granted` : PATENT_UNAVAILABLE}</strong>
      </header>
      {patents.length > 0 ? (
        <div className="pt-trail-stack">
          {patents.map((patent) => (
            <article key={patent.id} className="pt-row">
              <div className="pt-row-head">
                <strong>{patent.patentId}</strong>
                <ProvenanceBadge value={patent.provenance} size="sm" />
                <span>{patent.confidence}%</span>
              </div>
              <p className="pt-title">{patent.title}</p>
              <dl className="pt-meta">
                <div>
                  <dt>Granted</dt>
                  <dd>{patent.patentDate}</dd>
                </div>
                <div>
                  <dt>Assignee</dt>
                  <dd>{patent.assignees.length > 0 ? patent.assignees.join(', ') : 'unassigned'}</dd>
                </div>
                {patent.cpcCodes.length > 0 && (
                  <div>
                    <dt>CPC</dt>
                    <dd>{patent.cpcCodes.slice(0, 4).join(', ')}</dd>
                  </div>
                )}
                <div>
                  <dt>Source</dt>
                  <dd>{patent.sourceName}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{patent.rawPayloadHash.slice(0, 12)}…</dd>
                </div>
              </dl>
              <a href={patent.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={12} />
                patent source trail
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="pt-trail-empty">
          <strong>{PATENT_UNAVAILABLE}</strong>
          <p>No USPTO patents available. Configure ATLASZ_PATENTSVIEW_API_KEY; the connector is fail-closed without it. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}
