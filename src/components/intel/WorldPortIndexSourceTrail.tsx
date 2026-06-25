/*
 * World Port Index source-trail + port dossier + geospatial context card.
 *
 * Shows official NGA World Port Index (Pub 150) physical ports with their proof
 * trail. Physical port reference CONTEXT only — never live traffic, congestion,
 * trade volume, or disruption. Links to a UN/LOCODE only on an exact code match.
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableWorldPorts } from './worldPortTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import type { GeospatialPrecision, WorldIntelEvent, WorldPortIndexRecord } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Physical port reference data, not live traffic, congestion, or disruption.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function WorldPortIndexSourceTrail({ events, limit = 30, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const ports = selectRenderableWorldPorts(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>World Port Index · Physical Port Source Trail</span>
        <strong>{ports.length > 0 ? `${ports.length} ports` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official NGA World Port Index (Pub 150). {DISCLAIMER} Coordinates are source-backed; a UN/LOCODE is shown only on
        an exact source-field code match (otherwise the port stands alone).
      </p>
      {ports.length > 0 ? (
        <div className="eia-fac-stack">
          {ports.map((port) => (
            <PortCard key={port.id} port={port} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official World Port Index records are available. The source may be unavailable/rate-limited (NGA may block
            non-browser fetches), or rows may be missing required proof fields. Atlasz does not fabricate ports or
            coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

function PortCard({ port, events, now }: { port: WorldPortIndexRecord; events: WorldIntelEvent[]; now: number }) {
  const geo = buildGeoContext(
    { id: port.portNumber, name: port.portName, latitude: port.latitude, longitude: port.longitude, state: port.countryCode === 'US' ? port.subdivision : undefined },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{port.portName}</strong>
        <code>WPI {port.portNumber}</code>
        <ProvenanceBadge value={port.provenance} size="sm" />
        {port.linkedLocode ? <span className="eia-ticker">{port.linkedLocode}</span> : null}
        <span className={`eia-precision eia-precision-${port.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[port.geospatialPrecision]}
        </span>
        <FreshnessBadge size="sm" now={now} retrievedAt={port.retrievedAt} staleAt={port.staleAt} />
      </div>

      <dl className="eia-dossier">
        <Field label="Country">{port.country ?? port.countryCode ?? 'unknown'}</Field>
        <Field label="Region">{port.region ?? 'unknown'}</Field>
        <Field label="Subdivision">{port.subdivision ?? 'unknown'}</Field>
        <Field label="Harbor size">{port.harborSize ?? 'unknown'}</Field>
        <Field label="Harbor type">{port.harborType ?? 'unknown'}</Field>
        <Field label="Shelter">{port.shelter ?? 'unknown'}</Field>
        <Field label="UN/LOCODE">{port.linkedLocode ?? 'no exact match (standalone)'}</Field>
        <Field label="Coordinates">{port.geospatialPrecision === 'exact' ? `${port.latitude}, ${port.longitude}` : 'unknown'}</Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{port.confidence}</Field>
        <Field label="Dataset">{port.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(port.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(port.staleAt)}</Field>
        <Field label="Hash">{port.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={port.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> {port.sourceName} source
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
