/*
 * NOAA / NWS weather alert source-trail cards.
 *
 * Renders normalized weather alerts (events carrying a `weatherAlert` record),
 * each earning its card only with a complete source trail: alert id, event type,
 * NWS severity/urgency/certainty, area, timing, official URL, payload hash. NWS
 * severity is shown verbatim — never inflated. Empty input shows DATA_UNAVAILABLE.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { selectRenderableAlerts } from './weatherTrailSelect'
import type { WorldIntelEvent } from '../../worldIntel'
import './WeatherAlertSourceTrail.css'

const ALERT_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function WeatherAlertSourceTrail({ events, limit = 8, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const alerts = selectRenderableAlerts(events, limit)
  return (
    <section className="wx-trail">
      <header className="wx-trail-head">
        <span>NOAA Weather Alerts</span>
        <strong>{alerts.length > 0 ? `${alerts.length} active` : ALERT_UNAVAILABLE}</strong>
      </header>
      {alerts.length > 0 ? (
        <div className="wx-trail-stack">
          {alerts.map((alert) => (
            <article key={alert.id} className={`wx-row wx-sev-${alert.severity.toLowerCase()}`}>
              <div className="wx-row-head">
                <strong>{alert.event}</strong>
                <ProvenanceBadge value={alert.provenance} size="sm" />
                <FreshnessBadge size="sm" now={now} retrievedAt={alert.retrievedAt} />
              </div>
              <p className="wx-area">{alert.areaDesc}</p>
              <div className="wx-meta">
                <span className="wx-sev-label">{alert.severity}</span>
                <span>{alert.urgency}</span>
                <span>{alert.certainty}</span>
                <span>{alert.confidence}% confidence</span>
              </div>
              <dl className="wx-proof-grid">
                <div>
                  <dt>Alert ID</dt>
                  <dd>{alert.alertId}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{alert.sourceName}</dd>
                </div>
                <div>
                  <dt>Retrieved</dt>
                  <dd>{formatTime(alert.retrievedAt)}</dd>
                </div>
                <div>
                  <dt>Effective</dt>
                  <dd>{formatIso(alert.effective)}</dd>
                </div>
                {alert.onset && (
                  <div>
                    <dt>Onset</dt>
                    <dd>{formatIso(alert.onset)}</dd>
                  </div>
                )}
                {alert.expires && (
                  <div>
                    <dt>Expires</dt>
                    <dd>{formatIso(alert.expires)}</dd>
                  </div>
                )}
                <div>
                  <dt>Payload hash</dt>
                  <dd>{alert.rawPayloadHash.slice(0, 12)}</dd>
                </div>
              </dl>
              <div className="wx-meta">
                {alert.expires && <span>expires {alert.expires.slice(0, 16)}</span>}
              </div>
              <small className="wx-sender">{alert.senderName}</small>
              <div className="wx-link-row">
                <a href={alert.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  NWS source trail
                </a>
                <a href={alert.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Official API URL
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="wx-trail-empty">
          <strong>{ALERT_UNAVAILABLE}</strong>
          <p>No active NWS alerts available. The public NWS API returned nothing, was rate-limited, or is disabled. Nothing is fabricated.</p>
        </div>
      )}
    </section>
  )
}

function formatIso(value: string): string {
  if (!value) return 'unavailable'
  return value.slice(0, 16)
}

function formatTime(value: number): string {
  if (!Number.isFinite(value)) return 'unavailable'
  return new Date(value).toISOString().slice(0, 16)
}
