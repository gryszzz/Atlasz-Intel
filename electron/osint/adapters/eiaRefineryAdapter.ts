/*
 * U.S. Energy Information Administration (EIA) petroleum refinery adapter.
 *
 * First slice of the Energy Infra Pack on the Shared Geospatial Core. Uses the
 * official EIA U.S. Energy Atlas "Petroleum Refineries" layer (EIA-820 Refinery
 * Capacity Report), a public GeoJSON FeatureCollection exposing company/operator,
 * site name, state, atmospheric crude distillation capacity, status, and (per
 * feature) latitude/longitude.
 *
 * Discipline (identical to the power-plant slice):
 *   - official EIA source only; real refinery records only; no simulated sites
 *   - location/capacity CONTEXT only — never an outage/disruption/vulnerability
 *     or targeting claim
 *   - operator/company shown exactly as published (no inference)
 *   - operator links to a market company ONLY on an exact curated identity
 *   - coordinates only when source-backed; missing -> region-only/unknown
 *   - stale state explicit; malformed features dropped; fail-closed on HTTP/limit
 *
 * provenance: official-api   category: energy-facility
 */
import { adapterEventId, asNumber, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import {
  coordinatesAgreeWithPrecision,
  coordinatesAreValid,
  isValidPrecision,
  normalizeUsState,
  precisionForCoordinates,
} from '../../../src/engine/geo/geoCore'
import type { EiaRefineryFacility, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_refineries_public'
const EIA_SOURCE_NAME = 'U.S. Energy Information Administration'
const SOURCE_DATASET = 'EIA U.S. Energy Atlas — Petroleum Refineries (EIA-820)'
const HUMAN_SOURCE_URL = 'https://atlas.eia.gov/datasets/petroleum-refineries'
const DEFAULT_API_URL =
  'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/PetroleumRefineries_US_EIA/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX_REFINERIES = 200
const MAX_REFINERIES_CAP = 1_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 180 * DAY_MS // EIA-820 is an annual report.

/**
 * Exact curated operator -> market identity map. ONLY exact (normalized) name
 * matches resolve. No fuzzy/partial matching: a subsidiary or non-exact name
 * (e.g. "Marathon Petroleum Galveston Bay") stays unlinked.
 */
const OPERATOR_IDENTITY: Record<string, { ticker: string }> = {
  'marathon petroleum': { ticker: 'MPC' },
  'marathon petroleum corp': { ticker: 'MPC' },
  'valero energy': { ticker: 'VLO' },
  'valero': { ticker: 'VLO' },
  'phillips 66': { ticker: 'PSX' },
  'exxonmobil': { ticker: 'XOM' },
  'exxon mobil': { ticker: 'XOM' },
  'chevron': { ticker: 'CVX' },
  'chevron usa inc': { ticker: 'CVX' },
  'pbf energy': { ticker: 'PBF' },
  'hf sinclair': { ticker: 'DINO' },
  'par pacific': { ticker: 'PARR' },
}

export type EiaRefineryConfig = {
  apiUrl: string
  maxRefineries: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readEiaRefineryConfig(env: NodeJS.ProcessEnv = process.env): EiaRefineryConfig | null {
  if (env.ATLASZ_EIA_REFINERIES_DISABLE === '1') return null
  const apiUrl = asString(env.ATLASZ_EIA_REFINERIES_URL) || DEFAULT_API_URL
  if (!isOfficialRefineryApiUrl(apiUrl)) return null
  return {
    apiUrl,
    maxRefineries: clampInteger(Number(env.ATLASZ_EIA_REFINERY_MAX ?? DEFAULT_MAX_REFINERIES), 1, MAX_REFINERIES_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_EIA_REFINERY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_EIA_REFINERY_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_EIA_REFINERY_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchEiaRefineries(
  signal: AbortSignal,
  config = readEiaRefineryConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchGeoJson(config.apiUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const refineries = parseEiaRefineries(payload, { retrievedAt, sourceApiUrl: config.apiUrl, maxRefineries: config.maxRefineries })
  return normalizeEiaRefineries(refineries)
}

/** Pure normalizer — testable with fixture EIA Atlas GeoJSON FeatureCollections. */
export function parseEiaRefineries(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxRefineries?: number } = {},
): EiaRefineryFacility[] {
  if (!payload || typeof payload !== 'object') return []
  const features = (payload as { features?: unknown }).features
  if (!Array.isArray(features) || features.length === 0) return []

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? DEFAULT_API_URL
  const maxRefineries = options.maxRefineries ?? DEFAULT_MAX_REFINERIES
  const out: EiaRefineryFacility[] = []
  const seen = new Set<string>()

  for (const feature of features) {
    if (!feature || typeof feature !== 'object') continue
    const props = (feature as Record<string, unknown>).properties as Record<string, unknown> | undefined
    const geometry = (feature as Record<string, unknown>).geometry as Record<string, unknown> | undefined
    if (!props) continue

    const facilityName = pick(props, ['Site', 'SITE', 'site', 'Plant_Name', 'refinery', 'Refinery', 'NAME', 'Name'])
    const operatorName = pick(props, ['Company', 'COMPANY', 'company', 'Operator', 'Operator_Name']) || undefined
    const companyName = pick(props, ['Corp', 'CORP', 'Corporation', 'corp', 'Parent']) || undefined
    if (!facilityName && !operatorName) continue // drop malformed; never repair

    const objectId = asNumber(props.OBJECTID ?? props.FID ?? props.objectid)
    const facilityId =
      pick(props, ['Refinery_ID', 'RefID']) ||
      (objectId !== undefined ? String(objectId) : '') ||
      slug(`${operatorName ?? ''}-${facilityName}-${pick(props, ['State', 'STATE', 'state'])}`)
    if (!facilityId || seen.has(facilityId)) continue
    seen.add(facilityId)

    const { code: state, name: stateName } = normalizeUsState(pick(props, ['State', 'STATE', 'state']))
    const county = pick(props, ['County', 'COUNTY', 'county']) || undefined
    const city = pick(props, ['City', 'CITY', 'city']) || undefined
    const padd = pick(props, ['PADD', 'Padd', 'padd']) || undefined
    const status = pick(props, ['Status', 'STATUS', 'status', 'Operational_Status']) || undefined

    const coords = coordinatesFrom(geometry, props)
    const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(state || county || city))

    const crudeCapacity = asNumber(
      props.AD_Mbpd ?? props.AtmCrudeDist ?? props.atm_crude ?? props.Cap_Crude ?? props.crude_capacity ?? props.AtmosphericCrudeDistillation,
    )
    const crudeCapacityUnit = crudeCapacity !== undefined ? 'thousand barrels per calendar day' : undefined
    const products = parseProducts(props)
    const operatorName2 = operatorName ?? companyName
    const operatorTicker = operatorName2 ? OPERATOR_IDENTITY[normalizeOperator(operatorName2)]?.ticker : undefined

    const rawRecord = {
      facilityId, facilityName, operatorName, companyName,
      operatorId: pick(props, ['Operator_ID', 'OperatorID']) || undefined,
      operatorTicker, state, stateName, county, city, padd, status,
      latitude: coords?.lat, longitude: coords?.lon, geospatialPrecision,
      crudeCapacity, crudeCapacityUnit, products,
      sourceDataset: SOURCE_DATASET, sourceUrl: HUMAN_SOURCE_URL, sourceApiUrl,
      properties: sanitizeProps(props),
    }
    const rawPayloadJson = stableStringify(rawRecord)

    const refinery: EiaRefineryFacility = {
      id: refineryRecordId(facilityId),
      facilityId,
      facilityName: facilityName || (operatorName as string),
      facilityKind: 'refinery',
      operatorName,
      companyName,
      operatorId: pick(props, ['Operator_ID', 'OperatorID']) || undefined,
      operatorTicker,
      state,
      stateName,
      county,
      city,
      padd,
      latitude: coords?.lat,
      longitude: coords?.lon,
      geospatialPrecision,
      crudeCapacity,
      crudeCapacityUnit,
      products,
      status,
      sourceDataset: SOURCE_DATASET,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      sourceName: EIA_SOURCE_NAME,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceForRefinery({ facilityId, facilityName: facilityName || (operatorName as string), sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidRefinery(refinery)) out.push(refinery)
  }

  return out
    .sort((a, b) => (b.crudeCapacity ?? 0) - (a.crudeCapacity ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, maxRefineries)
}

export function normalizeEiaRefineries(refineries: EiaRefineryFacility[]): WorldIntelEvent[] {
  return refineries.filter(hasValidRefinery).map(toEvent)
}

function toEvent(refinery: EiaRefineryFacility): WorldIntelEvent {
  const dedupeKey = `eia-refinery|${refinery.facilityId}`.toLowerCase()
  const where = [refinery.city, refinery.county, refinery.stateName ?? refinery.state].filter(Boolean).join(', ')
  const cap =
    refinery.crudeCapacity !== undefined ? `${refinery.crudeCapacity} ${refinery.crudeCapacityUnit ?? ''}`.trim() : 'capacity unavailable'
  const loc =
    refinery.geospatialPrecision === 'exact' ? `coordinates ${refinery.latitude}, ${refinery.longitude}` : `location ${refinery.geospatialPrecision}`
  const summary =
    `EIA published petroleum refinery ${refinery.facilityName}${where ? ` in ${where}` : ''}: crude distillation ${cap}, ${loc}. ` +
    'Facility location/capacity context only — not a verified outage, disruption, or vulnerability claim.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Refinery: ${refinery.facilityName}${refinery.state ? ` (${refinery.state})` : ''}`.slice(0, 180),
    summary,
    source: EIA_SOURCE_NAME,
    url: refinery.sourceUrl,
    observedAt: refinery.retrievedAt,
    category: 'energy-facility',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: refinery,
    affectedAssets: refinery.operatorTicker ? [refinery.operatorTicker] : [],
    narrativeTags: unique(['EIA refinery', 'petroleum', 'crude oil', refinery.status ?? '']),
    extractedEntities: unique([
      refinery.facilityName,
      refinery.operatorName ?? '',
      refinery.companyName ?? '',
      refinery.county ?? refinery.city ?? '',
      refinery.stateName ?? refinery.state ?? '',
    ]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Petroleum Refining', ...event.affectedSectors]),
    affectedCommodities: unique(['Crude Oil', ...(refinery.products ?? []), ...event.affectedCommodities]),
    lat: refinery.latitude,
    lon: refinery.longitude,
    confidence: refinery.confidence,
    eiaRefinery: refinery,
  }
}

export function hasValidRefinery(refinery: EiaRefineryFacility): boolean {
  return (
    Boolean(refinery.facilityId) &&
    Boolean(refinery.facilityName) &&
    refinery.facilityKind === 'refinery' &&
    isValidPrecision(refinery.geospatialPrecision) &&
    coordinatesAgreeWithPrecision(refinery.geospatialPrecision, refinery.latitude, refinery.longitude) &&
    refinery.sourceDataset.length > 0 &&
    isOfficialRefinerySourceUrl(refinery.sourceUrl) &&
    isOfficialRefineryApiUrl(refinery.sourceApiUrl) &&
    refinery.sourceName === EIA_SOURCE_NAME &&
    refinery.provenance === 'official-api' &&
    Number.isFinite(refinery.retrievedAt) &&
    Number.isFinite(refinery.staleAt) &&
    refinery.rawPayloadHash.length > 0 &&
    refinery.confidence >= 90
  )
}

function confidenceForRefinery(input: { facilityId: string; facilityName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return Boolean(input.facilityId) && Boolean(input.facilityName) && isOfficialRefineryApiUrl(input.sourceApiUrl) && Number.isFinite(input.retrievedAt)
    ? 95
    : 60
}

function coordinatesFrom(geometry: Record<string, unknown> | undefined, props: Record<string, unknown>): { lat: number; lon: number } | null {
  const coords = Array.isArray(geometry?.coordinates) ? (geometry?.coordinates as unknown[]) : []
  let lon = asNumber(coords[0])
  let lat = asNumber(coords[1])
  if (!coordinatesAreValid(lat, lon)) {
    lat = asNumber(props.Latitude ?? props.latitude ?? props.LAT ?? props.Y)
    lon = asNumber(props.Longitude ?? props.longitude ?? props.LON ?? props.LONG ?? props.X)
  }
  return coordinatesAreValid(lat, lon) ? { lat: lat as number, lon: lon as number } : null
}

function parseProducts(props: Record<string, unknown>): string[] | undefined {
  const raw = pick(props, ['Products', 'PRODUCTS', 'products', 'Refined_Products'])
  if (!raw) return undefined
  const products = unique(raw.split(/[,;|]/).map((p) => p.trim()))
  return products.length > 0 ? products : undefined
}

function isOfficialRefinerySourceUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)eia\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function isOfficialRefineryApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (/(^|\.)eia\.gov$/i.test(parsed.hostname)) return true
    // EIA publishes the Atlas layer via Esri ArcGIS Online; accept only refinery FeatureServers.
    return /(^|\.)arcgis\.com$/i.test(parsed.hostname) && /refiner/i.test(parsed.pathname)
  } catch {
    return false
  }
}

async function fetchGeoJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/geo+json, application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first energy infrastructure intelligence; official EIA Energy Atlas)',
    },
  })
  assertOk(response, 'EIA refineries')
  return (await response.json()) as unknown
}

function pick(props: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(props[key])
    if (value) return value
  }
  return ''
}

function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (/api[_-]?key|token/i.test(key)) continue
    out[key] = value
  }
  return out
}

function normalizeOperator(value: string): string {
  return value.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()
}

function refineryRecordId(facilityId: string): string {
  return `${SOURCE_ID}:${facilityId.toLowerCase()}`
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, attempt: AbortSignal): AbortSignal {
  if (parent.aborted || attempt.aborted) {
    const controller = new AbortController()
    controller.abort()
    return controller.signal
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  attempt.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export const EIA_REFINERY_SOURCE_ID = SOURCE_ID
export { OPERATOR_IDENTITY as REFINERY_OPERATOR_IDENTITY }
