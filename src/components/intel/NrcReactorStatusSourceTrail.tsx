/*
 * NRC reactor status source-trail card (Layer 2, regulatory status).
 *
 * Shows the operating power level per reactor unit EXACTLY as the NRC publishes
 * it. This is NOT a geospatial layer (the feed has no coordinates) and is kept
 * SEPARATE from the EIA facility layer — never fused into a "nuclear impact"
 * claim. Atlasz never editorializes power level as a safety/outage/disruption
 * assessment.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableReactorStatus } from './nrcReactorStatusTrailSelect'
import { isStale } from '../../engine/geo/geoCore'
import type { NrcReactorStatus, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Operating power level as reported by NRC — not a safety, outage, or disruption assessment.'

export function NrcReactorStatusSourceTrail({ events, limit = 120, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const rows = selectRenderableReactorStatus(events, limit)
  const first = rows[0]
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>NRC Reactor Status · Regulatory Layer</span>
        <strong>{rows.length > 0 ? `${rows.length} units` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official NRC Power Reactor Status Report (latest status per unit). {DISCLAIMER} No coordinates in this feed, so
        there is no proximity context here; it is deliberately not merged with the EIA facility layer.
      </p>
      {rows.length > 0 ? (
        <article className="eia-fac">
          <div className="eia-fac-row-head">
            {first ? <ProvenanceBadge value={first.provenance} size="sm" /> : null}
            {first ? <span className={isStale(first.staleAt, now) ? 'eia-stale' : 'eia-fresh'}>{isStale(first.staleAt, now) ? 'stale (cached)' : 'fresh'}</span> : null}
            {first ? <code>as of {first.reportDate}</code> : null}
          </div>
          <table className="eia-status-table">
            <thead>
              <tr>
                <th scope="col">Reactor unit</th>
                <th scope="col">Power</th>
                <th scope="col">Report date</th>
                <th scope="col">Hash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.unitName}</th>
                  <td className="eia-num">{row.powerPercent}%</td>
                  <td>{row.reportDate}</td>
                  <td className="eia-hash">{row.rawPayloadHash.slice(0, 10)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
          {first ? (
            <div className="eia-links">
              <a href={first.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={12} /> {first.sourceName} source
              </a>
            </div>
          ) : null}
        </article>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official NRC reactor status rows are available. The source may be unavailable/rate-limited or rows may be
            missing required proof fields. Atlasz does not fabricate reactor status.
          </p>
        </div>
      )}
    </section>
  )
}

export type { NrcReactorStatus }
