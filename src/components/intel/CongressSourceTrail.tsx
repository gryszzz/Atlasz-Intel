/*
 * Congress.gov bill/action source-trail cards.
 *
 * Renders official legislative action metadata with bill identity, latest
 * action, policy/committee fields when source-published, local change status,
 * sanitized official API URLs, and raw payload proof. Empty input shows
 * DATA_UNAVAILABLE; nothing is fabricated.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableCongressBills } from './congressTrailSelect'
import type { CongressBillChangeType, WorldIntelEvent } from '../../worldIntel'
import './CongressSourceTrail.css'

const CONGRESS_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function CongressSourceTrail({ events, limit = 8 }: { events: WorldIntelEvent[]; limit?: number }) {
  const bills = selectRenderableCongressBills(events, limit)
  return (
    <section className="congress-trail">
      <header className="congress-trail-head">
        <span>Congress.gov</span>
        <strong>{bills.length > 0 ? `${bills.length} bill actions` : CONGRESS_UNAVAILABLE}</strong>
      </header>
      {bills.length > 0 ? (
        <div className="congress-trail-stack">
          {bills.map((bill) => (
            <article key={bill.id} className={`congress-row congress-change-${bill.changeType}`}>
              <div className="congress-row-head">
                <strong>
                  {bill.billType} {bill.billNumber}
                </strong>
                <ProvenanceBadge value={bill.provenance} size="sm" />
                <ChangeChip status={bill.changeType} />
                <span>{bill.confidence}%</span>
              </div>
              <p className="congress-title">{bill.title}</p>
              <p className="congress-action">{bill.latestActionText}</p>
              <dl className="congress-meta">
                <div>
                  <dt>Congress</dt>
                  <dd>{bill.congress}</dd>
                </div>
                <div>
                  <dt>Latest action</dt>
                  <dd>{bill.latestActionDate}</dd>
                </div>
                {bill.introducedDate && (
                  <div>
                    <dt>Introduced</dt>
                    <dd>{bill.introducedDate}</dd>
                  </div>
                )}
                <div>
                  <dt>Policy</dt>
                  <dd>{bill.policyArea ?? 'unlisted'}</dd>
                </div>
                <div>
                  <dt>Committee</dt>
                  <dd>{bill.committees.length > 0 ? bill.committees.slice(0, 2).join(', ') : 'unlisted'}</dd>
                </div>
                <div>
                  <dt>Payload hash</dt>
                  <dd>{bill.rawPayloadHash.slice(0, 12)}...</dd>
                </div>
              </dl>
              <div className="congress-links">
                <a href={bill.officialUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  bill source trail
                </a>
                <a href={bill.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  official API URL
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="congress-trail-empty">
          <strong>{CONGRESS_UNAVAILABLE}</strong>
          <p>No Congress.gov bill actions available. The API key is missing, the official API failed, or no proof-bearing records were returned. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}

function ChangeChip({ status }: { status: CongressBillChangeType }) {
  return <span className={`congress-change-chip congress-change-${status}`}>{status}</span>
}
