/*
 * EIA power-plant facility source-trail + dossier + geospatial context card.
 *
 * Shows official EIA-published power-plant facilities with their full proof
 * trail (source URL/API, retrievedAt, stale state, payload hash, confidence,
 * geospatial precision). Location CONTEXT only — never an outage, disruption,
 * or vulnerability claim. Operator links to a market identity only when an
 * exact identity exists; otherwise the operator is shown as published with no
 * implied company link.
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { selectRenderableFacilities } from './eiaFacilityTrailSelect'
import { buildFacilityGeoContext, hasGeoContext } from '../../engine/facilityGeoContext'
import type { EiaPowerPlantFacility, GeospatialPrecision, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Facility location context, not verified outage/disruption.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function EiaFacilitySourceTrail({
  events,
  limit = 24,
  now,
}: {
  events: WorldIntelEvent[]
  limit?: number
  now: number
}) {
  const facilities = selectRenderableFacilities(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>EIA Power Plants · Facility Source Trail</span>
        <strong>{facilities.length > 0 ? `${facilities.length} facilities` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official EIA generator inventory (EIA-860M). {DISCLAIMER} Coordinates are shown only when the source provides
        them; otherwise location is labeled region-only or unknown. Operator is shown as published; a market identity is
        linked only on an exact match.
      </p>
      {facilities.length > 0 ? (
        <div className="eia-fac-stack">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official EIA power-plant facility records are available. The connector may be disabled (requires an EIA
            API key), the source may be unavailable/rate-limited, or rows may be missing required proof fields. Atlasz
            does not fabricate facilities or coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

/** Facility dossier: identity, operator, fuel/capacity, location precision, proof trail. */
function FacilityCard({ facility, events, now }: { facility: EiaPowerPlantFacility; events: WorldIntelEvent[]; now: number }) {
  const geo = buildFacilityGeoContext(facility, events)
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{facility.facilityName}</strong>
        <code>plant {facility.facilityId}</code>
        <ProvenanceBadge value={facility.provenance} size="sm" />
        <span className={`eia-precision eia-precision-${facility.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[facility.geospatialPrecision]}
        </span>
        <FreshnessBadge size="sm" now={now} retrievedAt={facility.retrievedAt} staleAt={facility.staleAt} />
      </div>

      <dl className="eia-dossier">
        <Field label="Operator">
          {facility.operatorName ?? 'unknown'}
          {facility.operatorTicker ? <span className="eia-ticker"> · {facility.operatorTicker}</span> : null}
        </Field>
        <Field label="Primary fuel">{facility.primaryFuel ?? 'unknown'}</Field>
        <Field label="Plant type">{facility.plantType ?? 'unknown'}</Field>
        <Field label="Capacity">{facility.capacityMw !== undefined ? `${facility.capacityMw.toLocaleString('en-US')} MW` : 'unknown'}</Field>
        <Field label="Units">{facility.unitCount ?? '—'}</Field>
        <Field label="Status">{facility.status ?? 'unknown'}</Field>
        <Field label="State">{facility.stateName ?? facility.state ?? 'unknown'}</Field>
        <Field label="County">{facility.county ?? 'unknown'}</Field>
        <Field label="Grid context (BA)">{facility.balancingAuthority ?? 'unknown'}</Field>
        <Field label="Coordinates">
          {facility.geospatialPrecision === 'exact' ? `${facility.latitude}, ${facility.longitude}` : 'unknown'}
        </Field>
      </dl>

      {hasGeoContext(geo) && <GeoContext geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{facility.confidence}</Field>
        <Field label="Dataset">{facility.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(facility.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(facility.staleAt)}</Field>
        <Field label="Hash">{facility.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={facility.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> EIA-860M source
        </a>
        <span className="eia-api">{stripApiKey(facility.sourceApiUrl)}</span>
      </div>
    </article>
  )
}

/** Geospatial Context panel: region/proximity matches only, never disruption claims. */
function GeoContext({ geo }: { geo: ReturnType<typeof buildFacilityGeoContext> }) {
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

function stripApiKey(url: string): string {
  return url.replace(/([?&])api_key=[^&]*/i, '$1api_key=REDACTED')
}

function formatIso(value: number): string {
  return Number.isFinite(value) ? new Date(value).toISOString() : 'unavailable'
}
