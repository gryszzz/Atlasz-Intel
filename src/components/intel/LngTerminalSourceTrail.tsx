/*
 * LNG terminal source-trail + dossier + geospatial context card.
 *
 * Shows official LNG import/export terminals (EIA U.S. Energy Atlas / FERC /
 * DOE-FECM) with their full proof trail and a shared GeoAsset-style dossier.
 * Location/capacity CONTEXT only — never an outage, disruption, export-flow,
 * vulnerability, or targeting claim. Operator links to a market identity only
 * on an exact match. Reuses the Shared Geospatial Core (`buildGeoContext`).
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableLngTerminals } from './lngTerminalTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import type { GeospatialPrecision, LngTerminalFacility, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Facility location context, not verified outage/disruption/export impact.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function LngTerminalSourceTrail({
  events,
  limit = 24,
  now,
}: {
  events: WorldIntelEvent[]
  limit?: number
  now: number
}) {
  const terminals = selectRenderableLngTerminals(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>LNG Terminals · Source Trail</span>
        <strong>{terminals.length > 0 ? `${terminals.length} terminals` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official LNG import/export terminals (EIA U.S. Energy Atlas, built from EIA + FERC information). {DISCLAIMER}{' '}
        Coordinates are shown only when the source provides them; terminal type and capacity only when source-backed.
        Operator is shown as published; a market identity is linked only on an exact match.
      </p>
      {terminals.length > 0 ? (
        <div className="eia-fac-stack">
          {terminals.map((terminal) => (
            <TerminalCard key={terminal.id} terminal={terminal} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official LNG terminal records are available. This connector is fail-closed: it stays inert until an
            official source endpoint is pinned (ATLASZ_LNG_TERMINALS_URL), or the source may be unavailable/rate-limited.
            Atlasz does not fabricate terminals, coordinates, or export flows.
          </p>
        </div>
      )}
    </section>
  )
}

function TerminalCard({ terminal, events, now }: { terminal: LngTerminalFacility; events: WorldIntelEvent[]; now: number }) {
  const geo = buildGeoContext(
    { id: terminal.facilityId, name: terminal.facilityName, latitude: terminal.latitude, longitude: terminal.longitude, state: terminal.state, stateName: terminal.stateName },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{terminal.facilityName}</strong>
        <code>lng {terminal.facilityId}</code>
        <ProvenanceBadge value={terminal.provenance} size="sm" />
        {terminal.terminalType ? <span className="eia-ticker">{terminal.terminalType}</span> : null}
        <span className={`eia-precision eia-precision-${terminal.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[terminal.geospatialPrecision]}
        </span>
        <FreshnessBadge size="sm" now={now} retrievedAt={terminal.retrievedAt} staleAt={terminal.staleAt} />
      </div>

      <dl className="eia-dossier">
        <Field label="Operator">
          {terminal.operatorName ?? terminal.ownerName ?? 'unknown'}
          {terminal.operatorTicker ? <span className="eia-ticker"> · {terminal.operatorTicker}</span> : null}
        </Field>
        <Field label="Owner">{terminal.ownerName ?? 'unknown'}</Field>
        <Field label="Terminal type">{terminal.terminalType ?? 'unknown'}</Field>
        <Field label="Capacity">
          {terminal.capacity !== undefined ? `${terminal.capacity.toLocaleString('en-US')} ${terminal.capacityUnit ?? ''}`.trim() : 'unknown'}
        </Field>
        <Field label="Status">{terminal.status ?? 'unknown'}</Field>
        <Field label="State">{terminal.stateName ?? terminal.state ?? 'unknown'}</Field>
        <Field label="City / County">{terminal.city ?? terminal.county ?? 'unknown'}</Field>
        <Field label="Coordinates">
          {terminal.geospatialPrecision === 'exact' ? `${terminal.latitude}, ${terminal.longitude}` : 'unknown'}
        </Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{terminal.confidence}</Field>
        <Field label="Dataset">{terminal.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(terminal.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(terminal.staleAt)}</Field>
        <Field label="Hash">{terminal.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={terminal.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> {terminal.sourceName} source
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
