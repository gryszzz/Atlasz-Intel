/*
 * U.S. Energy Information Administration (EIA) power-plant facility adapter.
 *
 * The physical-world (electric generation) layer. Uses the official EIA Open
 * Data API v2 `electricity/operating-generator-capacity` route — the EIA-860M
 * monthly generator inventory — which exposes plant id, name, operating entity,
 * state/county, technology/energy source, nameplate capacity, status, balancing
 * authority, and (when published) latitude/longitude.
 *
 * Discipline:
 *   - official EIA source only; real facility records only; no simulated plants
 *   - location CONTEXT only — never an outage/disruption/vulnerability claim
 *   - operator name is shown exactly as EIA publishes it (no inference)
 *   - an operator links to a market company ONLY on an exact curated identity
 *     (never fuzzy-merged)
 *   - coordinates only when source-backed; missing lat/lon -> region-only/unknown
 *   - stale state explicit; api_key never persisted in trails or raw payloads
 *   - malformed rows dropped, never repaired; fail-closed on HTTP/rate-limit
 *
 * provenance: official-api   category: energy-facility
 */
import { adapterEventId, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import {
  coordinatesAgreeWithPrecision,
  coordinatesAreValid,
  isValidPrecision,
  precisionForCoordinates,
} from '../../../src/engine/geo/geoCore'
import type { EiaPowerPlantFacility, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_power_plants_public'
const EIA_SOURCE_NAME = 'U.S. Energy Information Administration'
const EIA_API_BASE = 'https://api.eia.gov/v2'
const FACILITY_ROUTE = 'electricity/operating-generator-capacity'
const SOURCE_DATASET = 'EIA-860M operating generator capacity'
const HUMAN_SOURCE_URL = 'https://www.eia.gov/electricity/data/eia860m/'
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX_FACILITIES = 200
const MAX_FACILITIES_CAP = 2_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 45 * DAY_MS // EIA-860M is a monthly inventory.
const STATE_PATTERN = /^[A-Z]{2}$/

/** EIA energy-source code -> human-readable primary fuel. Codes outside the map
 *  keep the raw code (honest), never a guessed fuel. */
const ENERGY_SOURCE_LABELS: Record<string, string> = {
  NG: 'Natural Gas',
  BIT: 'Coal (Bituminous)',
  SUB: 'Coal (Subbituminous)',
  LIG: 'Coal (Lignite)',
  RC: 'Coal (Refined)',
  DFO: 'Distillate Fuel Oil',
  RFO: 'Residual Fuel Oil',
  NUC: 'Nuclear',
  SUN: 'Solar',
  WND: 'Wind',
  WAT: 'Hydro',
  GEO: 'Geothermal',
  MWH: 'Battery Storage',
  WDS: 'Wood / Wood Waste',
  LFG: 'Landfill Gas',
  OBG: 'Other Biomass Gas',
  PC: 'Petroleum Coke',
  PUR: 'Purchased Steam',
}

/**
 * Exact curated operator -> market identity map. ONLY exact (normalized) name
 * matches resolve. There is deliberately no fuzzy/partial matching: an operator
 * EIA publishes that is not an exact key stays unlinked from any market company.
 */
const OPERATOR_IDENTITY: Record<string, { ticker: string }> = {
  'nextera energy': { ticker: 'NEE' },
  'florida power & light company': { ticker: 'NEE' },
  'duke energy': { ticker: 'DUK' },
  'duke energy carolinas, llc': { ticker: 'DUK' },
  'duke energy florida, llc': { ticker: 'DUK' },
  'southern company': { ticker: 'SO' },
  'georgia power co': { ticker: 'SO' },
  'alabama power co': { ticker: 'SO' },
  'constellation energy': { ticker: 'CEG' },
  'dominion energy': { ticker: 'D' },
  'virginia electric & power co': { ticker: 'D' },
  'the aes corporation': { ticker: 'AES' },
  'exelon': { ticker: 'EXC' },
  'pg&e': { ticker: 'PCG' },
  'pacific gas & electric co': { ticker: 'PCG' },
}

export type EiaFacilityConfig = {
  apiBase: string
  apiKey: string
  /** Optional state allowlist (2-letter codes) to keep the slice narrow. */
  states: string[]
  maxFacilities: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type EiaFacilityPayload = {
  response?: { data?: Array<Record<string, unknown>>; total?: number | string }
  error?: string
  code?: number
}

export function readEiaFacilityConfig(env: NodeJS.ProcessEnv = process.env): EiaFacilityConfig | null {
  if (env.ATLASZ_EIA_FACILITIES_DISABLE === '1') return null
  const apiKey = text(env.ATLASZ_EIA_API_KEY)
  const apiBase = text(env.ATLASZ_EIA_API_BASE) || EIA_API_BASE
  if (!apiKey || !/^https:\/\//i.test(apiBase)) return null
  return {
    apiBase,
    apiKey,
    states: parseStateAllowlist(env.ATLASZ_EIA_FACILITY_STATES),
    maxFacilities: clampInteger(Number(env.ATLASZ_EIA_FACILITY_MAX ?? DEFAULT_MAX_FACILITIES), 1, MAX_FACILITIES_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_EIA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_EIA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_EIA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchEiaFacilities(
  signal: AbortSignal,
  config = readEiaFacilityConfig(),
): Promise<WorldIntelEvent[]> {
  return normalizeEiaFacilities(await fetchEiaFacilityRecords(signal, config))
}

/**
 * Fetch + parse EIA generator inventory into plant-level facility records (before
 * event normalization). Reused by the nuclear slice, which filters these to
 * nuclear plants — so both share the same official source + proof discipline.
 */
export async function fetchEiaFacilityRecords(
  signal: AbortSignal,
  config = readEiaFacilityConfig(),
): Promise<EiaPowerPlantFacility[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const signedUrl = facilityUrl(config, config.apiKey)
  const sourceApiUrl = facilityUrl(config).toString()
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchEiaJson<EiaFacilityPayload>(signedUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  return parseEiaFacilities(payload, { retrievedAt, sourceApiUrl, maxFacilities: config.maxFacilities })
}

/** Pure normalizer — testable with fixture EIA generator-inventory payloads. */
export function parseEiaFacilities(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxFacilities?: number } = {},
): EiaPowerPlantFacility[] {
  if (!payload || typeof payload !== 'object') return []
  const body = payload as EiaFacilityPayload
  if (body.error || body.code === 400 || body.code === 404) return []
  const rows = body.response?.data
  if (!Array.isArray(rows) || rows.length === 0) return []

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl =
    options.sourceApiUrl ?? `${EIA_API_BASE}/${FACILITY_ROUTE}/data/?frequency=monthly&data[0]=nameplate-capacity-mw`
  const maxFacilities = options.maxFacilities ?? DEFAULT_MAX_FACILITIES

  // Group generator rows into plant-level facilities by plant id.
  const groups = new Map<string, Array<Record<string, unknown>>>()
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const plantId = text((row as Record<string, unknown>).plantid ?? (row as Record<string, unknown>).plantId)
    if (!plantId) continue // drop malformed rows; never repair
    groups.set(plantId, [...(groups.get(plantId) ?? []), row as Record<string, unknown>])
  }

  const out: EiaPowerPlantFacility[] = []
  for (const [plantId, unitRows] of groups) {
    const facility = aggregateFacility(plantId, unitRows, { retrievedAt, sourceApiUrl })
    if (facility && hasValidFacility(facility)) out.push(facility)
  }

  return out
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0) || a.facilityId.localeCompare(b.facilityId))
    .slice(0, maxFacilities)
}

function aggregateFacility(
  plantId: string,
  rows: Array<Record<string, unknown>>,
  ctx: { retrievedAt: number; sourceApiUrl: string },
): EiaPowerPlantFacility | null {
  const facilityName = firstText(rows, ['plantName', 'plantname'])
  if (!facilityName) return null

  const operatorName = firstText(rows, ['entityName', 'entityname']) || undefined
  const operatorId = firstText(rows, ['entityid', 'entityId']) || undefined
  const state = normalizeState(firstText(rows, ['stateid', 'state', 'stateId']))
  const stateName = firstText(rows, ['stateName', 'statename', 'stateDescription']) || undefined
  const county = firstText(rows, ['county', 'countyName']) || undefined
  const balancingAuthority =
    firstText(rows, ['balancing-authority-code', 'balancing_authority_code', 'balancingAuthorityCode']) ||
    firstText(rows, ['balancing-authority-name', 'balancing_authority_name', 'balancingAuthorityName']) ||
    undefined

  const coords = firstCoordinates(rows)
  const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(state || county))

  // Dominant unit drives plant type / primary fuel (largest reported nameplate).
  let dominant: Record<string, unknown> | null = null
  let dominantMw = -1
  let capacitySum = 0
  let hasCapacity = false
  const statuses = new Set<string>()
  for (const row of rows) {
    const mw = num(row['nameplate-capacity-mw'] ?? row.nameplate_capacity_mw ?? row.nameplateCapacityMw)
    if (mw !== undefined) {
      capacitySum += mw
      hasCapacity = true
      if (mw > dominantMw) {
        dominantMw = mw
        dominant = row
      }
    }
    const status = text(row.statusDescription ?? row.status)
    if (status) statuses.add(status)
  }
  if (!dominant) dominant = rows[0]

  const energySource = text(dominant['energy-source-code'] ?? dominant.energy_source_code ?? dominant.energySourceCode) || undefined
  const plantType = text(dominant.technology ?? dominant.technologyDescription) || undefined
  const primaryFuel = energySource ? ENERGY_SOURCE_LABELS[energySource.toUpperCase()] ?? energySource : undefined
  const status = statuses.size === 0 ? undefined : statuses.size === 1 ? [...statuses][0] : 'mixed'
  const period = maxText(rows, ['period']) || undefined
  const operatorTicker = operatorName ? OPERATOR_IDENTITY[normalizeOperator(operatorName)]?.ticker : undefined

  const rawRecord = {
    facilityId: plantId,
    facilityName,
    operatorName,
    operatorId,
    operatorTicker,
    plantType,
    primaryFuel,
    energySource,
    capacityMw: hasCapacity ? round(capacitySum) : undefined,
    unitCount: rows.length,
    status,
    state,
    stateName,
    county,
    balancingAuthority,
    latitude: coords?.lat,
    longitude: coords?.lon,
    geospatialPrecision,
    period,
    sourceDataset: SOURCE_DATASET,
    sourceUrl: HUMAN_SOURCE_URL,
    sourceApiUrl: ctx.sourceApiUrl,
    rows: rows.map(sanitizeRow),
  }
  const rawPayloadJson = stableStringify(rawRecord)

  return {
    id: facilityRecordId(plantId),
    facilityId: plantId,
    facilityName,
    facilityKind: 'power-plant',
    operatorName,
    operatorId,
    operatorTicker,
    plantType,
    primaryFuel,
    energySource: energySource?.toUpperCase(),
    capacityMw: hasCapacity ? round(capacitySum) : undefined,
    unitCount: rows.length,
    status,
    state,
    stateName,
    county,
    balancingAuthority,
    latitude: coords?.lat,
    longitude: coords?.lon,
    geospatialPrecision,
    sourceDataset: SOURCE_DATASET,
    sourceUrl: HUMAN_SOURCE_URL,
    sourceApiUrl: ctx.sourceApiUrl,
    sourceName: EIA_SOURCE_NAME,
    period,
    retrievedAt: ctx.retrievedAt,
    staleAt: ctx.retrievedAt + STALE_AFTER_MS,
    provenance: 'official-api',
    confidence: confidenceForFacility({ plantId, facilityName, sourceApiUrl: ctx.sourceApiUrl, retrievedAt: ctx.retrievedAt }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }
}

export function normalizeEiaFacilities(facilities: EiaPowerPlantFacility[]): WorldIntelEvent[] {
  return facilities.filter(hasValidFacility).map(toEvent)
}

function toEvent(facility: EiaPowerPlantFacility): WorldIntelEvent {
  const dedupeKey = `eia-facility|${facility.facilityId}`.toLowerCase()
  const where = [facility.county, facility.stateName ?? facility.state].filter(Boolean).join(', ')
  const cap = facility.capacityMw !== undefined ? `${facility.capacityMw} MW nameplate` : 'capacity unavailable'
  const fuel = facility.primaryFuel ? `${facility.primaryFuel} primary fuel` : 'fuel unavailable'
  const loc =
    facility.geospatialPrecision === 'exact'
      ? `coordinates ${facility.latitude}, ${facility.longitude}`
      : `location ${facility.geospatialPrecision}`
  const summary =
    `EIA published power-plant facility ${facility.facilityName} (plant ${facility.facilityId})` +
    `${where ? ` in ${where}` : ''}: ${cap}, ${fuel}, ${loc}. ` +
    'Facility location context only — not a verified outage, disruption, or vulnerability claim.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Power plant: ${facility.facilityName}${facility.state ? ` (${facility.state})` : ''}`.slice(0, 180),
    summary,
    source: EIA_SOURCE_NAME,
    url: facility.sourceUrl,
    observedAt: facility.retrievedAt,
    category: 'energy-facility',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: facility,
    affectedAssets: facility.operatorTicker ? [facility.operatorTicker] : [],
    narrativeTags: unique(['EIA power plant', 'electric generation', facility.primaryFuel ?? '', facility.status ?? '']),
    extractedEntities: unique([
      facility.facilityName,
      facility.operatorName ?? '',
      facility.primaryFuel ?? '',
      facility.county ?? '',
      facility.stateName ?? facility.state ?? '',
    ]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Electric Power', ...event.affectedSectors]),
    affectedCommodities: facility.primaryFuel ? unique([facility.primaryFuel, ...event.affectedCommodities]) : event.affectedCommodities,
    lat: facility.latitude,
    lon: facility.longitude,
    confidence: facility.confidence,
    eiaFacility: facility,
  }
}

export function hasValidFacility(facility: EiaPowerPlantFacility): boolean {
  return (
    Boolean(facility.facilityId) &&
    Boolean(facility.facilityName) &&
    facility.facilityKind === 'power-plant' &&
    isValidPrecision(facility.geospatialPrecision) &&
    coordinatesAgreeWithPrecision(facility.geospatialPrecision, facility.latitude, facility.longitude) &&
    facility.sourceDataset.length > 0 &&
    /^https:\/\/www\.eia\.gov\//.test(facility.sourceUrl) &&
    /^https:\/\/api\.eia\.gov\/v2\/electricity\/operating-generator-capacity\//.test(facility.sourceApiUrl) &&
    !/[?&]api_key=/i.test(facility.sourceApiUrl) &&
    facility.sourceName === EIA_SOURCE_NAME &&
    facility.provenance === 'official-api' &&
    Number.isFinite(facility.retrievedAt) &&
    Number.isFinite(facility.staleAt) &&
    facility.rawPayloadHash.length > 0 &&
    !(facility.rawPayloadJson ?? '').includes('api_key') &&
    facility.confidence >= 90
  )
}

function confidenceForFacility(input: { plantId: string; facilityName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return Boolean(input.plantId) &&
    Boolean(input.facilityName) &&
    /^https:\/\/api\.eia\.gov\/v2\/electricity\/operating-generator-capacity\//.test(input.sourceApiUrl) &&
    !/[?&]api_key=/i.test(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 95
    : 60
}

function firstCoordinates(rows: Array<Record<string, unknown>>): { lat: number; lon: number } | null {
  for (const row of rows) {
    const lat = num(row.latitude ?? row.lat)
    const lon = num(row.longitude ?? row.lon)
    if (coordinatesAreValid(lat, lon)) {
      return { lat: lat as number, lon: lon as number }
    }
  }
  return null
}

async function fetchEiaJson<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first energy infrastructure intelligence; official EIA API)',
    },
  })
  assertOk(response, 'EIA facilities')
  return (await response.json()) as T
}

function facilityUrl(config: Pick<EiaFacilityConfig, 'apiBase' | 'states' | 'maxFacilities'>, apiKey?: string): URL {
  const url = new URL(`${normalizeBaseUrl(config.apiBase)}/${FACILITY_ROUTE}/data/`)
  url.searchParams.set('frequency', 'monthly')
  url.searchParams.append('data[0]', 'nameplate-capacity-mw')
  url.searchParams.append('data[1]', 'net-summer-capacity-mw')
  for (const state of config.states ?? []) {
    url.searchParams.append('facets[stateid][]', state)
  }
  url.searchParams.set('sort[0][column]', 'period')
  url.searchParams.set('sort[0][direction]', 'desc')
  url.searchParams.set('offset', '0')
  url.searchParams.set('length', String(Math.min((config.maxFacilities ?? DEFAULT_MAX_FACILITIES) * 4, 5000)))
  if (apiKey) url.searchParams.set('api_key', apiKey)
  return url
}

function parseStateAllowlist(value: unknown): string[] {
  return text(value)
    .split(',')
    .map((item) => normalizeState(item.trim()))
    .filter((item): item is string => Boolean(item))
}

function normalizeState(value: string): string | undefined {
  const upper = value.trim().toUpperCase()
  return STATE_PATTERN.test(upper) ? upper : undefined
}

function normalizeOperator(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (/api[_-]?key/i.test(key)) continue
    out[key] = value
  }
  return out
}

function firstText(rows: Array<Record<string, unknown>>, keys: string[]): string {
  for (const row of rows) {
    for (const key of keys) {
      const value = text(row[key])
      if (value) return value
    }
  }
  return ''
}

function maxText(rows: Array<Record<string, unknown>>, keys: string[]): string {
  let best = ''
  for (const row of rows) {
    for (const key of keys) {
      const value = text(row[key])
      if (value && value > best) best = value
    }
  }
  return best
}

function facilityRecordId(plantId: string): string {
  return `${SOURCE_ID}:${plantId.toLowerCase()}`
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
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

export const EIA_FACILITY_SOURCE_ID = SOURCE_ID
export { OPERATOR_IDENTITY, ENERGY_SOURCE_LABELS }
