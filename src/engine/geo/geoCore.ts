/*
 * Shared Geospatial Core — the one foundation every physical-world connector
 * plugs into (power plants, refineries, LNG/storage terminals, pipelines, ports,
 * mines, fabs, data centers, ...). It defines the universal shape of a located
 * real-world object and the proof discipline that keeps Atlasz honest:
 *
 *   - coordinates are SOURCE-BACKED ONLY; missing -> region-only/unknown,
 *     never guessed (precision is exact IFF valid coordinates exist)
 *   - an operator links to a market identity ONLY on an exact match (no fuzzy)
 *   - location context only — proximity/region, never damage/outage/disruption
 *   - freshness/staleness is explicit so the living map stays current & honest
 *
 * Pure + deterministic. Connectors normalize their records into a `GeoAsset`
 * (or pass a `GeoSubject` to the context engine) and reuse this everywhere.
 */
import type { GeospatialPrecision } from '../../worldIntel'

export type { GeospatialPrecision }

/** Extensible catalog of physical-world object kinds across all the big layers. */
export type GeoAssetKind =
  // Energy
  | 'power-plant'
  | 'refinery'
  | 'lng-terminal'
  | 'oil-gas-pipeline'
  | 'storage-terminal'
  | 'nuclear-plant'
  | 'grid-region'
  | 'balancing-authority'
  // Trade / Logistics
  | 'port'
  | 'container-terminal'
  | 'canal'
  | 'chokepoint'
  | 'airport'
  | 'rail-hub'
  | 'border-crossing'
  | 'warehouse'
  | 'logistics-location'
  // Commodities / Materials
  | 'mine'
  | 'oil-gas-field'
  | 'mineral-region'
  | 'steel-plant'
  | 'aluminum-plant'
  | 'chemical-plant'
  | 'fertilizer-plant'
  | 'agriculture-region'
  // Tech infrastructure
  | 'semiconductor-fab'
  | 'advanced-packaging-site'
  | 'memory-plant'
  | 'data-center'
  | 'battery-plant'
  | 'ev-plant'

/**
 * The universal located-object shape. Connector sub-records normalize into this
 * for graph derivation and geospatial context. Coordinates/operator are optional
 * and only ever present when source-backed.
 */
export type GeoAsset = {
  assetId: string
  assetKind: GeoAssetKind
  name: string
  latitude?: number
  longitude?: number
  geospatialPrecision: GeospatialPrecision
  state?: string
  stateName?: string
  county?: string
  /** ISO country code; defaults to 'US' for U.S. federal datasets. */
  countryCode?: string
  /** Operator name exactly as the source publishes it (never inferred). */
  operatorName?: string
  /** Set ONLY when an exact curated market identity exists for the operator. */
  operatorTicker?: string
}

/** Minimum needed to compute geospatial context for any located subject. */
export type GeoSubject = {
  id: string
  name: string
  latitude?: number
  longitude?: number
  state?: string
  stateName?: string
}

const EARTH_RADIUS_KM = 6371

/** U.S. state/territory name -> 2-letter code (shared by all U.S. geo connectors). */
export const US_STATE_CODES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'puerto rico': 'PR', 'virgin islands': 'VI', guam: 'GU',
}

const US_STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_CODES).map(([name, code]) => [code, titleCase(name)]),
)

/**
 * Normalize a source state value (2-letter code OR full name) into a code + name.
 * Returns {} when unrecognized — never guesses.
 */
export function normalizeUsState(value: unknown): { code?: string; name?: string } {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return {}
  const upper = raw.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper) && US_STATE_NAMES[upper]) return { code: upper, name: US_STATE_NAMES[upper] }
  const code = US_STATE_CODES[raw.toLowerCase()]
  return code ? { code, name: titleCase(raw.toLowerCase()) } : {}
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (ch) => ch.toUpperCase())
}

/** Coordinates are valid only inside Earth's bounds and not the null island (0,0). */
export function coordinatesAreValid(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !(lat === 0 && lon === 0)
  )
}

/**
 * Decide precision from what the source actually provided. Valid coordinates ->
 * `exact`; otherwise a known admin region (state/county/country) -> `region-only`;
 * nothing -> `unknown`. Never returns `exact` without coordinates.
 */
export function precisionForCoordinates(
  lat: number | undefined,
  lon: number | undefined,
  hasRegion: boolean,
): GeospatialPrecision {
  if (coordinatesAreValid(lat, lon)) return 'exact'
  return hasRegion ? 'region-only' : 'unknown'
}

/** Proof invariant: coordinates present IFF precision is `exact`. */
export function coordinatesAgreeWithPrecision(
  precision: GeospatialPrecision,
  lat: number | undefined,
  lon: number | undefined,
): boolean {
  const hasCoords = coordinatesAreValid(lat, lon)
  return precision === 'exact' ? hasCoords : !hasCoords
}

export function isValidPrecision(value: unknown): value is GeospatialPrecision {
  return value === 'exact' || value === 'approximate' || value === 'region-only' || value === 'unknown'
}

/** Great-circle distance in km between two points. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** A cached/source snapshot is stale once its staleAt instant has passed. */
export function isStale(staleAt: number, now: number): boolean {
  return Number.isFinite(staleAt) ? staleAt <= now : true
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
