/*
 * Grid Region / Balancing Authority source-trail card.
 *
 * Shows official EIA balancing-authority reference records (code + name + NERC
 * region) with their proof trail, plus the SOURCE-BACKED grid context: which
 * states have EIA-listed plants in each BA, and whether any active NWS alert is
 * in the same state. Grid-context reference ONLY — never an outage, grid-stress,
 * reliability, emergency, or vulnerability claim.
 */
import type { ReactNode } from 'react'
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableGridRegions, statesForBa } from './gridRegionTrailSelect'
import { buildGeoContext, type GeoWeatherRegionMatch } from '../../engine/geo/geoContext'
import { isStale } from '../../engine/geo/geoCore'
import type { GridRegion, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Grid operating-region reference, not an outage, reliability, or grid-stress condition.'

export function GridRegionSourceTrail({ events, limit = 40, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const regions = selectRenderableGridRegions(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>Grid Regions · Balancing Authority Source Trail</span>
        <strong>{regions.length > 0 ? `${regions.length} regions` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official EIA balancing-authority reference (electricity/rto). {DISCLAIMER} No region geometry from this source
        (region-only). "States with EIA-listed plants" is derived from source-backed plant records, not an official
        service-territory claim.
      </p>
      {regions.length > 0 ? (
        <div className="eia-fac-stack">
          {regions.map((region) => (
            <RegionCard key={region.id} region={region} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official EIA balancing-authority records are available. The connector may be disabled (requires an EIA API
            key), the source may be unavailable/rate-limited, or rows may be missing required proof fields.
          </p>
        </div>
      )}
    </section>
  )
}

function RegionCard({ region, events, now }: { region: GridRegion; events: WorldIntelEvent[]; now: number }) {
  const stale = isStale(region.staleAt, now)
  const states = region.statesServed && region.statesServed.length > 0 ? region.statesServed : statesForBa(events, region.baCode)
  // Region weather context: a NWS alert in any of those states = same-region match (never outage).
  const weatherMatches = collectWeatherMatches(states, events)
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{region.baCode}</strong>
        <span>{region.baName}</span>
        <ProvenanceBadge value={region.provenance} size="sm" />
        <span className="eia-precision eia-precision-region-only">region only</span>
        <span className={stale ? 'eia-stale' : 'eia-fresh'}>{stale ? 'stale (cached)' : 'fresh'}</span>
      </div>

      <dl className="eia-dossier">
        <Field label="Region kind">{region.regionKind}</Field>
        <Field label="NERC region">{region.nercRegion ?? 'unknown'}</Field>
        <Field label="Operator">
          {region.operatorName ?? 'unknown'}
          {region.operatorTicker ? <span className="eia-ticker"> · {region.operatorTicker}</span> : null}
        </Field>
        <Field label="Country">{region.country}</Field>
        <Field label="States w/ EIA plants">{states.length > 0 ? states.join(', ') : 'none ingested'}</Field>
      </dl>

      {weatherMatches.length > 0 && (
        <div className="eia-geo">
          <div className="eia-geo-head">Grid Geospatial Context — {DISCLAIMER}</div>
          {weatherMatches.map((match) => (
            <div className="eia-geo-item" key={match.eventId}>
              <span className="eia-geo-tag eia-geo-weather">same state/region as alert</span>
              <span>
                {match.alertEvent} ({match.severity}) — {match.areaDesc}
              </span>
              <em>{match.note}</em>
            </div>
          ))}
        </div>
      )}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{region.confidence}</Field>
        <Field label="Dataset">{region.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(region.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(region.staleAt)}</Field>
        <Field label="Hash">{region.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={region.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> EIA grid data source
        </a>
      </div>
    </article>
  )
}

/** Reuse the shared geo core per served state; merge unique weather-region matches. */
function collectWeatherMatches(states: string[], events: WorldIntelEvent[]): GeoWeatherRegionMatch[] {
  const byId = new Map<string, GeoWeatherRegionMatch>()
  for (const state of states.slice(0, 20)) {
    const ctx = buildGeoContext({ id: `ba-state:${state}`, name: state, state }, events)
    for (const match of ctx.weatherRegionMatches) byId.set(match.eventId, match)
  }
  return [...byId.values()].slice(0, 8)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function formatIso(value: number): string {
  return Number.isFinite(value) ? new Date(value).toISOString() : 'unavailable'
}
