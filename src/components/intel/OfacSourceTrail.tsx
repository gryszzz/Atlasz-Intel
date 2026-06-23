/*
 * OFAC sanctions source-trail cards.
 *
 * Renders normalized OFAC SDN records with stable UID, source-published name,
 * type, programs/countries, local change status, official source links, and raw
 * payload proof. Empty input shows DATA_UNAVAILABLE; nothing is fabricated.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableOfacSanctions } from './ofacTrailSelect'
import type { OfacSanctionsChangeStatus, WorldIntelEvent } from '../../worldIntel'
import './OfacSourceTrail.css'

const OFAC_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function OfacSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const records = selectRenderableOfacSanctions(events, limit)
  return (
    <section className="ofac-trail">
      <header className="ofac-trail-head">
        <span>OFAC SDN</span>
        <strong>{records.length > 0 ? `${records.length} records` : OFAC_UNAVAILABLE}</strong>
      </header>
      {records.length > 0 ? (
        <div className="ofac-trail-stack">
          {records.map((record) => (
            <article key={record.id} className={`ofac-row ofac-change-${record.changeStatus}`}>
              <div className="ofac-row-head">
                <strong>UID {record.uid}</strong>
                <ProvenanceBadge value={record.provenance} size="sm" />
                <ChangeChip status={record.changeStatus} />
                <span>{record.confidence}%</span>
              </div>
              <p className="ofac-name">{record.name}</p>
              <dl className="ofac-meta">
                <div>
                  <dt>List</dt>
                  <dd>{record.listType}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{record.entityType}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{record.publishDate}</dd>
                </div>
                <div>
                  <dt>Programs</dt>
                  <dd>{record.programs.length > 0 ? record.programs.slice(0, 4).join(', ') : 'unlisted'}</dd>
                </div>
                <div>
                  <dt>Countries</dt>
                  <dd>{record.countries.length > 0 ? record.countries.slice(0, 4).join(', ') : 'unlisted'}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{record.rawPayloadHash.slice(0, 12)}…</dd>
                </div>
              </dl>
              <div className="ofac-links">
                <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  OFAC source trail
                </a>
                <a href={record.sourceDataUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  official SDN XML
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ofac-trail-empty">
          <strong>{OFAC_UNAVAILABLE}</strong>
          <p>No OFAC SDN records available. The official Treasury export returned nothing, failed, or is disabled. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}

function ChangeChip({ status }: { status: OfacSanctionsChangeStatus }) {
  return <span className={`ofac-change-chip ofac-change-${status}`}>{status}</span>
}
