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
  type OsintSourceSnapshot,
  type WorldIntelEvent,
  type WorldIntelSnapshot,
} from './worldIntel'
import type { Severity } from './data/intel'

const USGS_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'

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
export async function fetchDevWorldSnapshot(): Promise<WorldIntelSnapshot> {
  const seed = buildSeedWorldIntelSnapshot()
  try {
    const response = await fetch(USGS_FEED)
    if (!response.ok) return seed
    const json = (await response.json()) as { features?: UsgsFeature[] }
    const events = (json.features ?? [])
      .map(eventFromFeature)
      .filter((event): event is WorldIntelEvent => event !== null)
      .sort((a, b) => b.timestamp - a.timestamp)
    if (events.length === 0) return seed
    const now = Date.now()
    return {
      ...seed,
      enabled: true,
      status: 'ready',
      sourceTrust: 'official-api',
      updatedAt: now,
      // worldEvents is the WorldIntelEvent[] the worldwatch layer registry reads.
      worldEvents: events,
      sources: [usgsSource(now, events.length)],
    }
  } catch {
    return seed
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
