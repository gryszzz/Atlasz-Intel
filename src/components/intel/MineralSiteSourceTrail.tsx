/*
 * USGS mineral site source-trail + materials dossier + geospatial context card.
 *
 * Shows official USGS mineral sites (USMIN authoritative + MRDS legacy) with
 * their proof trail. Mineral resource REFERENCE data only — never current
 * production, reserves, ownership, resource size, or investment signal. MRDS
 * records are clearly flagged as legacy (not updated since 2011).
 */
import type { ReactNode } from 'react'
import { Link2, MapPin } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { selectRenderableMineralSites } from './mineralSiteTrailSelect'
import { buildGeoContext, hasGeoContext, type GeoContext } from '../../engine/geo/geoContext'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import type { GeospatialPrecision, MineralSite, WorldIntelEvent } from '../../worldIntel'
import './EiaFacilitySourceTrail.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'
const DISCLAIMER = 'Mineral resource reference data, not current production, reserves, ownership, or investment signal.'

const PRECISION_LABEL: Record<GeospatialPrecision, string> = {
  exact: 'exact coordinates',
  approximate: 'approximate',
  'region-only': 'region only',
  unknown: 'unknown',
}

export function MineralSiteSourceTrail({ events, limit = 30, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const sites = selectRenderableMineralSites(events, limit)
  return (
    <section className="eia-fac-trail world-panel">
      <header className="eia-fac-head">
        <span>USGS Mineral Sites · Materials Source Trail</span>
        <strong>{sites.length > 0 ? `${sites.length} sites` : UNAVAILABLE}</strong>
      </header>
      <p className="eia-fac-note">
        Official USGS Mineral Resources (USMIN authoritative + MRDS legacy). {DISCLAIMER} MRDS is a legacy occurrence
        database not systematically updated since 2011 — flagged below and never shown as current activity.
      </p>
      {sites.length > 0 ? (
        <div className="eia-fac-stack">
          {sites.map((site) => (
            <MineralCard key={site.id} site={site} events={events} now={now} />
          ))}
        </div>
      ) : (
        <div className="eia-fac-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No official USGS mineral site records are available. MRDS legacy reference runs by default; optional
            USMIN/MRDS URLs can pin alternate official exports. The source may be unavailable/rate-limited. Atlasz does
            not fabricate sites or coordinates.
          </p>
        </div>
      )}
    </section>
  )
}

function MineralCard({ site, events, now }: { site: MineralSite; events: WorldIntelEvent[]; now: number }) {
  const geo = buildGeoContext(
    { id: site.siteId, name: site.siteName, latitude: site.latitude, longitude: site.longitude, state: site.countryCode === 'US' ? site.state : undefined, stateName: site.countryCode === 'US' ? site.stateName : undefined },
    events,
  )
  return (
    <article className="eia-fac">
      <div className="eia-fac-row-head">
        <strong>{site.siteName}</strong>
        <code>{site.database} {site.siteId}</code>
        <ProvenanceBadge value={site.provenance} size="sm" />
        <span className="eia-ticker">{site.facilityKind}</span>
        {site.legacyNotMaintained ? <span className="eia-stale">legacy · not updated since 2011</span> : null}
        <span className={`eia-precision eia-precision-${site.geospatialPrecision}`}>
          <MapPin size={11} /> {PRECISION_LABEL[site.geospatialPrecision]}
        </span>
        <FreshnessBadge size="sm" now={now} retrievedAt={site.retrievedAt} staleAt={site.staleAt} />
      </div>

      <dl className="eia-dossier">
        <Field label="Commodities">{site.commodities.length > 0 ? site.commodities.join(', ') : 'unspecified'}</Field>
        <Field label="Deposit type">{site.depositType ?? 'unknown'}</Field>
        <Field label="Development status">{site.developmentStatus ?? 'not reported'}</Field>
        <Field label="Production status">{site.productionStatus ?? 'not reported'}</Field>
        <Field label="Operator">
          {site.operatorName ?? 'not reported'}
          {site.operatorTicker ? <span className="eia-ticker"> · {site.operatorTicker}</span> : null}
        </Field>
        <Field label="Country">{site.country ?? site.countryCode ?? 'unknown'}</Field>
        <Field label="State / province">{site.stateName ?? site.state ?? 'unknown'}</Field>
        <Field label="County / district">{site.county ?? site.district ?? 'unknown'}</Field>
        <Field label="Coordinates">{site.geospatialPrecision === 'exact' ? `${site.latitude}, ${site.longitude}` : 'unknown'}</Field>
      </dl>

      {hasGeoContext(geo) && <GeoContextView geo={geo} />}

      <dl className="eia-proof-grid">
        <Field label="Confidence">{site.confidence}</Field>
        <Field label="Dataset">{site.sourceDataset}</Field>
        <Field label="Retrieved">{formatIso(site.retrievedAt)}</Field>
        <Field label="Stale after">{formatIso(site.staleAt)}</Field>
        <Field label="Hash">{site.rawPayloadHash.slice(0, 12)}…</Field>
      </dl>

      <div className="eia-links">
        <a href={site.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={12} /> {site.sourceName} source
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
