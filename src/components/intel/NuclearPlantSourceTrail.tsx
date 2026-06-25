/*
 * Nuclear plant source-trail + dossier + geospatial context card (Layer 1, EIA).
 *
 * Shows official EIA nuclear power plants with their proof trail and a shared
 * GeoAsset-style dossier. Facility/location/capacity CONTEXT only — never a
 * verified outage, safety condition, disruption, or vulnerability claim. NRC
 * reactor status is shown SEPARATELY (its own card), never fused here.
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableNuclearPlants } from './nuclearPlantTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import type { GeospatialPrecision, NuclearPlantFacility, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Facility location context, not verified outage, safety condition, or disruption.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function NuclearPlantSourceTrail({ events, limit = 24, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const plants = selectRenderableNuclearPlants(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>Nuclear Plants · EIA Facility Source Trail</span>
        <strong>{plants.length > 0 ? `${plants.length} plants` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official EIA generator inventory (EIA-860M) filtered to nuclear fuel. {DISCLAIMER} Coordinates are shown only
        when the source provides them. Reactor power status is a separate NRC layer, not fused here. Operator is shown as
        published; a market identity is linked only on an exact match.
      </p>
      {plants.length > 0 ? (
        <div className="eia-fac-stack">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official EIA nuclear plant records are available. The connector may be disabled (requires an EIA API key),
            the source may be unavailable/rate-limited, or rows may be missing required proof fields. Atlasz does not
            fabricate facilities or coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

function PlantCard({ plant, events, now }: { plant: NuclearPlantFacility; events: WorldIntelEvent[]; now: number }) {
  const geo = buildGeoContext(
    { id: plant.facilityId, name: plant.facilityName, latitude: plant.latitude, longitude: plant.longitude, state: plant.state, stateName: plant.stateName },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{plant.facilityName}</strong>
        <code>plant {plant.facilityId}</code>
        <ProvenanceBadge value={plant.provenance} size="sm" />
        <span className={`eia-precision eia-precision-${plant.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[plant.geospatialPrecision]}
        </span>
        <FreshnessBadge size="sm" now={now} retrievedAt={plant.retrievedAt} staleAt={plant.staleAt} />
      </div>

      <dl className="eia-dossier">
        <Field label="Operator">
          {plant.operatorName ?? 'unknown'}
          {plant.operatorTicker ? <span className="eia-ticker"> · {plant.operatorTicker}</span> : null}
        </Field>
        <Field label="Capacity">{plant.capacityMw !== undefined ? `${plant.capacityMw.toLocaleString('en-US')} MW` : 'unknown'}</Field>
        <Field label="Reactor type">{plant.reactorType ?? 'unknown (NRC enrichment)'}</Field>
        <Field label="Status">{plant.status ?? 'unknown'}</Field>
        <Field label="State">{plant.stateName ?? plant.state ?? 'unknown'}</Field>
        <Field label="County">{plant.county ?? 'unknown'}</Field>
        <Field label="Coordinates">{plant.geospatialPrecision === 'exact' ? `${plant.latitude}, ${plant.longitude}` : 'unknown'}</Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{plant.confidence}</Field>
        <Field label="Dataset">{plant.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(plant.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(plant.staleAt)}</Field>
        <Field label="Hash">{plant.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={plant.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> EIA-860M source
        </a>
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
