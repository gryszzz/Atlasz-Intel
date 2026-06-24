/*
 * Port / UN/LOCODE source-trail + location dossier + geospatial context card.
 *
 * Shows official UNECE UN/LOCODE registry entries (location codes + transport
 * function flags) with their proof trail. Trade/location-registry CONTEXT only —
 * never live port activity, vessel traffic, congestion, or disruption. Physical
 * port geometry/attributes arrive later via World Port Index enrichment.
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableLocodes } from './portLocodeTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { isStale } from '../../engine/geo/geoCore'
import type { GeospatialPrecision, UnLocode, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Trade/location registry context, not live port activity or disruption.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function PortLocodeSourceTrail({ events, limit = 30, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const locodes = selectRenderableLocodes(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>Ports / UN/LOCODE · Location Registry Source Trail</span>
        <strong>{locodes.length > 0 ? `${locodes.length} locations` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official UNECE UN/LOCODE code registry. {DISCLAIMER} Coordinates are shown only when the source row provides them
        (else region-only); physical port geometry is a later World Port Index enrichment.
      </p>
      {locodes.length > 0 ? (
        <div className="eia-fac-stack">
          {locodes.map((loc) => (
            <LocodeCard key={loc.id} loc={loc} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official UN/LOCODE records are available. This connector is fail-closed: it stays inert until an official
            UNECE source URL is pinned (ATLASZ_UNLOCODE_URL), or the source may be unavailable/rate-limited. Atlasz does
            not fabricate locations or coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

function LocodeCard({ loc, events, now }: { loc: UnLocode; events: WorldIntelEvent[]; now: number }) {
  const stale = isStale(loc.staleAt, now)
  // NOAA region match only meaningful for US subdivisions (US state codes).
  const geo = buildGeoContext(
    { id: loc.locode, name: loc.locationName, latitude: loc.latitude, longitude: loc.longitude, state: loc.countryCode === 'US' ? loc.subdivision : undefined, stateName: undefined },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{loc.locode}</strong>
        <span>{loc.locationName}</span>
        <ProvenanceBadge value={loc.provenance} size="sm" />
        <span className="eia-ticker">{loc.facilityKind}</span>
        <span className={`eia-precision eia-precision-${loc.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[loc.geospatialPrecision]}
        </span>
        <span className={stale ? 'eia-stale' : 'eia-fresh'}>{stale ? 'stale (cached)' : 'fresh'}</span>
      </div>

      <dl className="eia-dossier">
        <Field label="Country">{loc.countryCode}</Field>
        <Field label="Subdivision">{loc.subdivision ?? 'unknown'}</Field>
        <Field label="Functions">{functionLabel(loc)}</Field>
        <Field label="Status">{loc.status ?? 'unknown'}</Field>
        <Field label="IATA">{loc.iata ?? '—'}</Field>
        <Field label="Coordinates">{loc.geospatialPrecision === 'exact' ? `${loc.latitude}, ${loc.longitude}` : 'unknown'}</Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{loc.confidence}</Field>
        <Field label="Dataset">{loc.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(loc.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(loc.staleAt)}</Field>
        <Field label="Hash">{loc.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={loc.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> {loc.sourceName} source
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

function functionLabel(loc: UnLocode): string {
  const f = loc.functions
  const parts = [
    f.port && 'port',
    f.rail && 'rail',
    f.road && 'road',
    f.airport && 'airport',
    f.postal && 'postal',
    f.multimodal && 'multimodal',
    f.fixedTransport && 'fixed-transport',
    f.borderCrossing && 'border-crossing',
  ].filter(Boolean)
  return parts.length > 0 ? (parts as string[]).join(', ') : 'unspecified'
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
