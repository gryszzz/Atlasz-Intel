/*
 * EIA petroleum refinery source-trail + dossier + geospatial context card.
 *
 * Shows official EIA-published refineries with their full proof trail and a
 * shared GeoAsset-style dossier. Location/capacity CONTEXT only — never an
 * outage, disruption, vulnerability, or targeting claim. Operator links to a
 * market identity only on an exact match. Reuses the Shared Geospatial Core
 * (`buildGeoContext`) for the geospatial panel — no one-off context logic.
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableRefineries } from './eiaRefineryTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { isStale } from '../../engine/geo/geoCore'
import type { EiaRefineryFacility, GeospatialPrecision, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Facility location context, not verified outage/disruption.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function EiaRefinerySourceTrail({
  events,
  limit = 24,
  now,
}: {
  events: WorldIntelEvent[]
  limit?: number
  now: number
}) {
  const refineries = selectRenderableRefineries(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>EIA Refineries · Petroleum Facility Source Trail</span>
        <strong>{refineries.length > 0 ? `${refineries.length} refineries` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official EIA U.S. Energy Atlas Petroleum Refineries (EIA-820). {DISCLAIMER} Coordinates are shown only when the
        source provides them; otherwise location is region-only or unknown. Operator is shown as published; a market
        identity is linked only on an exact match.
      </p>
      {refineries.length > 0 ? (
        <div className="eia-fac-stack">
          {refineries.map((refinery) => (
            <RefineryCard key={refinery.id} refinery={refinery} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official EIA refinery records are available. The connector may be disabled, the source may be
            unavailable/rate-limited, or rows may be missing required proof fields. Atlasz does not fabricate refineries
            or coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

function RefineryCard({ refinery, events, now }: { refinery: EiaRefineryFacility; events: WorldIntelEvent[]; now: number }) {
  const stale = isStale(refinery.staleAt, now)
  const geo = buildGeoContext(
    { id: refinery.facilityId, name: refinery.facilityName, latitude: refinery.latitude, longitude: refinery.longitude, state: refinery.state, stateName: refinery.stateName },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{refinery.facilityName}</strong>
        <code>refinery {refinery.facilityId}</code>
        <ProvenanceBadge value={refinery.provenance} size="sm" />
        <span className={`eia-precision eia-precision-${refinery.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[refinery.geospatialPrecision]}
        </span>
        <span className={stale ? 'eia-stale' : 'eia-fresh'}>{stale ? 'stale (cached)' : 'fresh'}</span>
      </div>

      <dl className="eia-dossier">
        <Field label="Operator">
          {refinery.operatorName ?? 'unknown'}
          {refinery.operatorTicker ? <span className="eia-ticker"> · {refinery.operatorTicker}</span> : null}
        </Field>
        <Field label="Corporation">{refinery.companyName ?? 'unknown'}</Field>
        <Field label="Crude capacity">
          {refinery.crudeCapacity !== undefined ? `${refinery.crudeCapacity.toLocaleString('en-US')} ${refinery.crudeCapacityUnit ?? ''}`.trim() : 'unknown'}
        </Field>
        <Field label="Products">{refinery.products && refinery.products.length > 0 ? refinery.products.join(', ') : 'unknown'}</Field>
        <Field label="Status">{refinery.status ?? 'unknown'}</Field>
        <Field label="State">{refinery.stateName ?? refinery.state ?? 'unknown'}</Field>
        <Field label="City / County">{refinery.city ?? refinery.county ?? 'unknown'}</Field>
        <Field label="PADD">{refinery.padd ?? 'unknown'}</Field>
        <Field label="Coordinates">
          {refinery.geospatialPrecision === 'exact' ? `${refinery.latitude}, ${refinery.longitude}` : 'unknown'}
        </Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{refinery.confidence}</Field>
        <Field label="Dataset">{refinery.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(refinery.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(refinery.staleAt)}</Field>
        <Field label="Hash">{refinery.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={refinery.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> EIA Energy Atlas source
        </a>
        <span className="eia-api">{refinery.sourceName}</span>
      </div>
    </article>
  )
}

function GeoContextView({ geo }: { geo: GeoContext }) {
  return (
    <div className="eia-geo">
      <div className="eia-geo-head">Geospatial Context — {DISCLAIMER}</div>
      {geo.weatherRegionMatches.map((match) => (
        <div className="eia-geo-item" key={match.eventId}>
          <span className="eia-geo-tag eia-geo-weather">same region as alert</span>
          <span>
            {match.alertEvent} ({match.severity}) — {match.areaDesc}
          </span>
          <em>{match.note}</em>
        </div>
      ))}
      {geo.seismicProximities.map((prox) => (
        <div className="eia-geo-item" key={prox.eventId}>
          <span className="eia-geo-tag eia-geo-seismic">~{prox.distanceKm} km away</span>
          <span>
            M{prox.magnitude} — {prox.place}
          </span>
          <em>{prox.note}</em>
        </div>
      ))}
    </div>
  )
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
