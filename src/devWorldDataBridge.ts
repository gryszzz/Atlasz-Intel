/*
 * DEV-ONLY real-data preview bridge.
 *
 * The production data path is the desktop (electron) bridge, where connectors
 * fetch in the main process. In `npm run web:dev` there is no desktop bridge, so
 * Worldwatch is empty. This module lets the browser preview populate from a REAL,
 * CORS-open, official public feed (USGS Earthquake Hazards Program) so we can see
 * the populated composition + color system without electron — and WITHOUT faking
 * anything. Every event carries real coordinates, a real source URL, a real
 * retrieval time, and a payload hash. It feeds the SAME pipeline (no second truth
 * engine): events -> worldwatchLayerRegistry -> globe markers.
 *
 * Gated to import.meta.env.DEV + absence of the desktop bridge. Never ships to the
 * desktop app or a production build.
 */
import {
  buildSeedWorldIntelSnapshot,
  type EarthquakeEvent,
  type InfrastructureSite,
  type OsintSourceSnapshot,
  type WorldIntelEvent,
  type WorldIntelSnapshot,
} from './worldIntel'
import type { Severity } from './data/intel'

const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'
// Public OpenStreetMap power infrastructure with operator (owner) tags. Community-
// sourced — labeled public-unauthenticated, never official.
const OSM_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OSM_QUERY =
  '[out:json][timeout:25];node["power"="plant"]["operator"]["plant:source"](-58,-180,72,180);out center 80;'

type UsgsFeature = {
  id: string
  properties: {
    mag: number | null
    place: string | null
    time: number
    url: string
    title: string
    tsunami: number
    sig: number | null
    status: string
    alert: string | null
  }
  geometry: { coordinates: [number, number, number] }
}

function severityForMagnitude(mag: number): Severity {
  if (mag >= 6.5) return 'critical'
  if (mag >= 5.5) return 'elevated'
  if (mag >= 4.8) return 'watch'
  return 'stable'
}

/** Small deterministic hash of the real payload — stands in for a content hash. */
function hashString(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }
  return `usgs_${hash.toString(16)}`
}

function regionForPlace(place: string | null): string {
  if (!place) return 'Unspecified region'
  const parts = place.split(',')
  return parts[parts.length - 1].trim() || place
}

function eventFromFeature(feature: UsgsFeature): WorldIntelEvent | null {
  const mag = feature.properties.mag
  const [lon, lat, depthKm] = feature.geometry.coordinates
  if (!Number.isFinite(mag) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const magnitude = mag as number
  const time = feature.properties.time
  const place = feature.properties.place
  const title = feature.properties.title ?? `M ${magnitude} earthquake`
  const payloadHash = hashString(`${feature.id}:${time}:${magnitude}:${lat}:${lon}`)
  const region = regionForPlace(place)

  const earthquakeEvent: EarthquakeEvent = {
    id: feature.id,
    eventId: feature.id,
    magnitude,
    place: place ?? region,
    title,
    time,
    depthKm: Number.isFinite(depthKm) ? depthKm : undefined,
    lat,
    lon,
    region,
    alert: feature.properties.alert ?? undefined,
    tsunami: feature.properties.tsunami === 1,
    significance: feature.properties.sig ?? undefined,
    status: feature.properties.status,
    sourceUrl: feature.properties.url,
    sourceFeedUrl: USGS_FEED,
    sourceName: 'USGS Earthquake Hazards Program',
    retrievedAt: Date.now(),
    provenance: 'official-api',
    confidence: 90,
    rawPayloadHash: payloadHash,
  }

  return {
    id: `usgs:${feature.id}`,
    timestamp: time,
    title,
    summary: `Observed magnitude ${magnitude} earthquake, ${place ?? region}. Depth ${
      Number.isFinite(depthKm) ? `${Math.round(depthKm)} km` : 'unknown'
    }. Official USGS observation — no damage, casualty, or market-impact claim is inferred.`,
    countryCodes: [],
    region,
    lat,
    lon,
    category: 'natural-hazard',
    severity: severityForMagnitude(magnitude),
    confidence: 90,
    sourceId: 'usgs-earthquakes',
    sourceUrl: feature.properties.url,
    provenance: 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: ['earthquake', 'natural-hazard'],
    rawPayloadHash: payloadHash,
    dedupeHash: payloadHash,
    earthquakeEvent,
  }
}

function usgsSource(now: number, itemCount: number): OsintSourceSnapshot {
  return {
    sourceId: 'usgs-earthquakes',
    sourceName: 'USGS Earthquake Hazards Program',
    sourceType: 'physical-world events',
    endpointType: 'rest',
    endpoint: USGS_FEED,
    pollIntervalMs: 5 * 60_000,
    rateLimitMs: 60_000,
    timeoutMs: 8_000,
    enabled: true,
    status: 'online',
    provenance: 'official-api',
    lastAttemptAt: now,
    lastSuccessAt: now,
    itemCount,
    sourceReliabilityScore: 0.95,
    legalSafetyNote: 'Official USGS public feed; no auth required.',
    parserAdapter: 'dev-web-usgs-geojson',
    category: 'physical-world events',
    authType: 'none',
    configured: true,
  }
}

/**
 * Fetch the real USGS feed and assemble a WorldIntelSnapshot the existing
 * pipeline can render. Returns the empty seed snapshot on any failure (honest:
 * no data rather than fabricated data).
 */
type OsmElement = {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Map a plant fuel/source to the market sector(s) it sits in — turns a raw
// facility into market-relevant exposure context (energy sub-sector), never a
// price or trading claim.
function sectorsForSource(energySource?: string): string[] {
  switch ((energySource ?? '').toLowerCase()) {
    case 'nuclear':
      return ['nuclear', 'utilities', 'uranium']
    case 'coal':
      return ['coal', 'utilities', 'thermal coal']
    case 'gas':
      return ['natural gas', 'utilities', 'LNG']
    case 'oil':
      return ['oil', 'utilities']
    case 'hydro':
      return ['hydro', 'utilities', 'renewables']
    case 'solar':
      return ['solar', 'renewables', 'utilities']
    case 'wind':
      return ['wind', 'renewables', 'utilities']
    case 'geothermal':
      return ['geothermal', 'renewables', 'utilities']
    case 'biomass':
    case 'biogas':
      return ['biomass', 'renewables', 'utilities']
    default:
      return ['power generation', 'utilities']
  }
}

function infrastructureEventFromElement(element: OsmElement): WorldIntelEvent | null {
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  const tags = element.tags ?? {}
  const name = tags.name
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !name) return null
  const operator = tags.operator
  const energySource = tags['plant:source']
  const capacity = tags['plant:output:electricity']
  const sectors = sectorsForSource(energySource)
  const payloadHash = hashString(`osm:${element.id}:${lat}:${lon}:${operator ?? ''}`)
  const sourceUrl = `https://www.openstreetmap.org/node/${element.id}`
  const now = Date.now()

  const site: InfrastructureSite = {
    id: String(element.id),
    name,
    operator,
    energySource,
    capacity,
    lat: lat as number,
    lon: lon as number,
    sourceName: 'OpenStreetMap (community)',
    sourceUrl,
    retrievedAt: now,
    provenance: 'public-unauthenticated',
    confidence: 60,
    rawPayloadHash: payloadHash,
  }

  const ownerClause = operator ? ` Operator/owner: ${operator}.` : ''
  const detail = [energySource ? `${energySource} plant` : 'power plant', capacity].filter(Boolean).join(', ')
  const sectorClause = ` Market sector exposure: ${sectors.join(' · ')}.`

  return {
    id: `osm:${element.id}`,
    timestamp: now,
    title: name,
    summary: `${detail}.${ownerClause}${sectorClause} Community-mapped (OpenStreetMap) location, operator, and sector context — public, unverified; not an official registry, outage, ownership-percentage, price, or trading claim.`,
    countryCodes: [],
    region: 'Infrastructure',
    lat: lat as number,
    lon: lon as number,
    category: 'infrastructure',
    severity: 'stable',
    confidence: 60,
    sourceId: 'osm-power',
    sourceUrl,
    provenance: 'public-unauthenticated',
    affectedAssets: [],
    affectedSectors: sectors,
    affectedCommodities: [],
    affectedCurrencies: [],
    // The operating company + its market sectors — the infrastructure -> company
    // -> sector exposure chain. Exact names only; no fuzzy ticker merge.
    extractedEntities: operator ? [operator, ...sectors] : sectors,
    narrativeTags: ['infrastructure', 'power', energySource].filter((tag): tag is string => Boolean(tag)),
    rawPayloadHash: payloadHash,
    dedupeHash: payloadHash,
    infrastructureSite: site,
  }
}

function osmSource(now: number, itemCount: number): OsintSourceSnapshot {
  return {
    sourceId: 'osm-power',
    sourceName: 'OpenStreetMap power infrastructure (community)',
    sourceType: 'infrastructure',
    endpointType: 'rest',
    endpoint: OSM_ENDPOINT,
    pollIntervalMs: 30 * 60_000,
    rateLimitMs: 120_000,
    timeoutMs: 25_000,
    enabled: true,
    status: 'online',
    provenance: 'public-unauthenticated',
    lastAttemptAt: now,
    lastSuccessAt: now,
    itemCount,
    sourceReliabilityScore: 0.6,
    legalSafetyNote: 'Public community-mapped OSM data (ODbL). No auth required.',
    parserAdapter: 'dev-web-osm-overpass',
    category: 'infrastructure',
    authType: 'none',
    configured: true,
  }
}

async function fetchUsgsEvents(): Promise<WorldIntelEvent[]> {
  try {
    const response = await fetch(USGS_FEED)
    if (!response.ok) return []
    const json = (await response.json()) as { features?: UsgsFeature[] }
    return (json.features ?? []).map(eventFromFeature).filter((event): event is WorldIntelEvent => event !== null)
  } catch {
    return []
  }
}

async function fetchOsmInfrastructure(): Promise<WorldIntelEvent[]> {
  try {
    const response = await fetch(`${OSM_ENDPOINT}?data=${encodeURIComponent(OSM_QUERY)}`)
    if (!response.ok) return []
    const json = (await response.json()) as { elements?: OsmElement[] }
    return (json.elements ?? [])
      .map(infrastructureEventFromElement)
      .filter((event): event is WorldIntelEvent => event !== null)
  } catch {
    return []
  }
}

/**
 * Fetch real public feeds (USGS earthquakes + OSM power infrastructure) and
 * assemble a WorldIntelSnapshot the existing pipeline renders. Each source fails
 * independently; returns the empty seed only if everything is empty (honest: no
 * data rather than fabricated data).
 */
export async function fetchDevWorldSnapshot(): Promise<WorldIntelSnapshot> {
  const seed = buildSeedWorldIntelSnapshot()
  const [quakes, infrastructure] = await Promise.all([fetchUsgsEvents(), fetchOsmInfrastructure()])
  const events = [...quakes, ...infrastructure].sort((a, b) => b.timestamp - a.timestamp)
  if (events.length === 0) return seed
  const now = Date.now()
  const sources: OsintSourceSnapshot[] = []
  if (quakes.length > 0) sources.push(usgsSource(now, quakes.length))
  if (infrastructure.length > 0) sources.push(osmSource(now, infrastructure.length))
  return {
    ...seed,
    enabled: true,
    status: 'ready',
    sourceTrust: quakes.length > 0 ? 'official-api' : 'public-unauthenticated',
    updatedAt: now,
    worldEvents: events,
    sources,
  }
}

export function devRealDataEnabled(): boolean {
  return (
    import.meta.env.DEV &&
    import.meta.env.MODE !== 'test' &&
    typeof window !== 'undefined' &&
    typeof window.location !== 'undefined' &&
    !window.atlaszDesktop?.world
  )
}
