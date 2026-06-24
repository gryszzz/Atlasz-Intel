/*
 * LNG (liquefied natural gas) terminal adapter — Energy Infra Pack slice 2.
 *
 * SOURCE DISCIPLINE (stricter than other slices, by directive): this connector
 * ships FAIL-CLOSED with NO baked-in default endpoint. The operator must pin a
 * CONFIRMED official source via ATLASZ_LNG_TERMINALS_URL; without it the
 * connector is inert (DATA_UNAVAILABLE) rather than hitting a guessed URL.
 *
 * Confirmed official source paths (set one as ATLASZ_LNG_TERMINALS_URL):
 *   - EIA U.S. Energy Atlas "LNG Import and Export Terminals" layer
 *     (clearly EIA-owned: service Lng_ImportExportTerminals_US_EIA, EIA ArcGIS
 *     org FGr1D95XCGALKXqM; EIA builds it from EIA + FERC information)
 *   - FERC LNG terminal data (ferc.gov) or DOE/FECM LNG data (energy.gov)
 * Only https hosts ending in eia.gov / ferc.gov / energy.gov, or the confirmed
 * EIA LNG ArcGIS service, are accepted. No random GIS mirrors.
 *
 * The parser accepts BOTH GeoJSON (features[].properties + geometry.coordinates)
 * and Esri JSON (features[].attributes + geometry.x/y), so whichever official
 * export the operator points at works. Location/capacity context only — never an
 * outage/disruption/export-flow/vulnerability claim.
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
import type { LngTerminalFacility, LngTerminalType, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'lng_terminals_public'
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX_TERMINALS = 200
const MAX_TERMINALS_CAP = 1_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 180 * DAY_MS

const EIA_SOURCE = { name: 'U.S. Energy Information Administration', dataset: 'EIA U.S. Energy Atlas — LNG Import/Export Terminals', page: 'https://atlas.eia.gov/datasets/liquefied-natural-gas-lng-import-and-export-terminals' }
const FERC_SOURCE = { name: 'Federal Energy Regulatory Commission', dataset: 'FERC U.S. LNG Terminals', page: 'https://www.ferc.gov/natural-gas/lng' }
const DOE_SOURCE = { name: 'U.S. Department of Energy (FECM)', dataset: 'DOE/FECM LNG terminal data', page: 'https://www.energy.gov/fecm/listings/lng-reports' }

/**
 * Exact curated operator -> market identity map. ONLY exact (normalized) name
 * matches resolve. No fuzzy/partial matching: a subsidiary/project SPV name
 * (e.g. "Sabine Pass Liquefaction, LLC") stays unlinked.
 */
const OPERATOR_IDENTITY: Record<string, { ticker: string }> = {
  'cheniere': { ticker: 'LNG' },
  'cheniere energy': { ticker: 'LNG' },
  'sempra': { ticker: 'SRE' },
  'sempra energy': { ticker: 'SRE' },
  'sempra infrastructure': { ticker: 'SRE' },
  'kinder morgan': { ticker: 'KMI' },
  'dominion energy': { ticker: 'D' },
  'nextdecade': { ticker: 'NEXT' },
  'venture global': { ticker: 'VG' },
  'venture global lng': { ticker: 'VG' },
}

export type LngTerminalConfig = {
  apiUrl: string
  maxTerminals: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readLngTerminalConfig(env: NodeJS.ProcessEnv = process.env): LngTerminalConfig | null {
  if (env.ATLASZ_LNG_TERMINALS_DISABLE === '1') return null
  // No default: the operator must pin a confirmed official endpoint (fail-closed).
  const apiUrl = asString(env.ATLASZ_LNG_TERMINALS_URL)
  if (!apiUrl || !isOfficialLngApiUrl(apiUrl)) return null
  return {
    apiUrl,
    maxTerminals: clampInteger(Number(env.ATLASZ_LNG_TERMINAL_MAX ?? DEFAULT_MAX_TERMINALS), 1, MAX_TERMINALS_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_LNG_TERMINAL_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_LNG_TERMINAL_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_LNG_TERMINAL_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchLngTerminals(signal: AbortSignal, config = readLngTerminalConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchTerminalJson(config.apiUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const terminals = parseLngTerminals(payload, { retrievedAt, sourceApiUrl: config.apiUrl, maxTerminals: config.maxTerminals })
  return normalizeLngTerminals(terminals)
}

type RawFeature = { attrs: Record<string, unknown>; lat?: number; lon?: number }

/** Pure normalizer — testable with GeoJSON OR Esri-JSON fixtures. */
export function parseLngTerminals(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxTerminals?: number } = {},
): LngTerminalFacility[] {
  if (!payload || typeof payload !== 'object') return []
  const features = extractFeatures(payload)
  if (features.length === 0) return []

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? ''
  if (!isOfficialLngApiUrl(sourceApiUrl)) return [] // never normalize from a non-official endpoint
  const maxTerminals = options.maxTerminals ?? DEFAULT_MAX_TERMINALS
  const source = sourceFor(sourceApiUrl)
  const out: LngTerminalFacility[] = []
  const seen = new Set<string>()

  for (const { attrs, lat, lon } of features) {
    const facilityName = pick(attrs, ['Terminal', 'TerminalName', 'Name', 'NAME', 'Facility', 'FacilityName', 'Project'])
    const operatorName = pick(attrs, ['Operator', 'Operator_Name', 'Company', 'COMPANY']) || undefined
    const ownerName = pick(attrs, ['Owner', 'Owner_Name', 'Parent', 'OwnerName']) || undefined
    if (!facilityName && !operatorName) continue // drop malformed; never repair

    const objectId = asNumber(attrs.OBJECTID ?? attrs.FID ?? attrs.objectid)
    const facilityId =
      pick(attrs, ['Terminal_ID', 'TerminalID', 'ID']) ||
      (objectId !== undefined ? String(objectId) : '') ||
      slug(`${operatorName ?? ownerName ?? ''}-${facilityName}-${pick(attrs, ['State', 'STATE', 'state'])}`)
    if (!facilityId || seen.has(facilityId)) continue
    seen.add(facilityId)

    const { code: state, name: stateName } = normalizeUsState(pick(attrs, ['State', 'STATE', 'state']))
    const county = pick(attrs, ['County', 'COUNTY', 'county']) || undefined
    const city = pick(attrs, ['City', 'CITY', 'city']) || undefined
    const status = pick(attrs, ['Status', 'STATUS', 'status']) || undefined

    const coords = coordinatesAreValid(lat, lon)
      ? { lat: lat as number, lon: lon as number }
      : fallbackCoords(attrs)
    const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(state || county || city))

    const terminalType = normalizeTerminalType(pick(attrs, ['Type', 'TerminalType', 'Import_Export', 'ImportExport', 'Service', 'Operation']))
    const capacity = asNumber(attrs.Capacity ?? attrs.Capacity_Bcfd ?? attrs.CapacityBcfd ?? attrs.Capacity_BCFD ?? attrs.BaseloadCapacity)
    const capacityUnit = capacity !== undefined ? asString(attrs.CapacityUnit ?? attrs.Units) || 'Bcf/d' : undefined
    const operatorRef = operatorName ?? ownerName
    const operatorTicker = operatorRef ? OPERATOR_IDENTITY[normalizeOperator(operatorRef)]?.ticker : undefined

    const rawRecord = {
      facilityId, facilityName, operatorName, ownerName,
      operatorId: pick(attrs, ['Operator_ID', 'OperatorID']) || undefined,
      operatorTicker, state, stateName, county, city, status,
      latitude: coords?.lat, longitude: coords?.lon, geospatialPrecision,
      terminalType, capacity, capacityUnit,
      sourceDataset: source.dataset, sourceUrl: source.page, sourceApiUrl,
      attrs: sanitizeAttrs(attrs),
    }
    const rawPayloadJson = stableStringify(rawRecord)

    const terminal: LngTerminalFacility = {
      id: terminalRecordId(facilityId),
      facilityId,
      facilityName: facilityName || (operatorName as string),
      facilityKind: 'lng-terminal',
      operatorName,
      ownerName,
      operatorId: pick(attrs, ['Operator_ID', 'OperatorID']) || undefined,
      operatorTicker,
      state,
      stateName,
      county,
      city,
      latitude: coords?.lat,
      longitude: coords?.lon,
      geospatialPrecision,
      terminalType,
      capacity,
      capacityUnit,
      status,
      sourceDataset: source.dataset,
      sourceUrl: source.page,
      sourceApiUrl,
      sourceName: source.name,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceForTerminal({ facilityId, facilityName: facilityName || (operatorName as string), sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidTerminal(terminal)) out.push(terminal)
  }

  return out
    .sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, maxTerminals)
}

export function normalizeLngTerminals(terminals: LngTerminalFacility[]): WorldIntelEvent[] {
  return terminals.filter(hasValidTerminal).map(toEvent)
}

function toEvent(terminal: LngTerminalFacility): WorldIntelEvent {
  const dedupeKey = `lng-terminal|${terminal.facilityId}`.toLowerCase()
  const where = [terminal.city, terminal.county, terminal.stateName ?? terminal.state].filter(Boolean).join(', ')
  const role = terminal.terminalType ? `${terminal.terminalType} terminal` : 'LNG terminal'
  const cap = terminal.capacity !== undefined ? `, capacity ${terminal.capacity} ${terminal.capacityUnit ?? ''}`.trim() : ''
  const loc = terminal.geospatialPrecision === 'exact' ? `coordinates ${terminal.latitude}, ${terminal.longitude}` : `location ${terminal.geospatialPrecision}`
  const summary =
    `${terminal.sourceName} lists LNG ${role} ${terminal.facilityName}${where ? ` in ${where}` : ''}${cap}, ${loc}. ` +
    'Facility location/capacity context only — not a verified outage, disruption, export-flow, or vulnerability claim.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `LNG terminal: ${terminal.facilityName}${terminal.state ? ` (${terminal.state})` : ''}`.slice(0, 180),
    summary,
    source: terminal.sourceName,
    url: terminal.sourceUrl,
    observedAt: terminal.retrievedAt,
    category: 'energy-facility',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: terminal,
    affectedAssets: terminal.operatorTicker ? [terminal.operatorTicker] : [],
    narrativeTags: unique(['LNG terminal', 'liquefied natural gas', 'natural gas', terminal.terminalType ?? '', terminal.status ?? '']),
    extractedEntities: unique([
      terminal.facilityName,
      terminal.operatorName ?? '',
      terminal.ownerName ?? '',
      terminal.city ?? terminal.county ?? '',
      terminal.stateName ?? terminal.state ?? '',
    ]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Natural Gas', ...event.affectedSectors]),
    affectedCommodities: unique(['LNG', 'Natural Gas', ...event.affectedCommodities]),
    lat: terminal.latitude,
    lon: terminal.longitude,
    confidence: terminal.confidence,
    lngTerminal: terminal,
  }
}

export function hasValidTerminal(terminal: LngTerminalFacility): boolean {
  return (
    Boolean(terminal.facilityId) &&
    Boolean(terminal.facilityName) &&
    terminal.facilityKind === 'lng-terminal' &&
    isValidPrecision(terminal.geospatialPrecision) &&
    coordinatesAgreeWithPrecision(terminal.geospatialPrecision, terminal.latitude, terminal.longitude) &&
    terminal.sourceDataset.length > 0 &&
    isOfficialLngSourceUrl(terminal.sourceUrl) &&
    isOfficialLngApiUrl(terminal.sourceApiUrl) &&
    terminal.sourceName.length > 0 &&
    terminal.provenance === 'official-api' &&
    Number.isFinite(terminal.retrievedAt) &&
    Number.isFinite(terminal.staleAt) &&
    terminal.rawPayloadHash.length > 0 &&
    terminal.confidence >= 90
  )
}

function confidenceForTerminal(input: { facilityId: string; facilityName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return Boolean(input.facilityId) && Boolean(input.facilityName) && isOfficialLngApiUrl(input.sourceApiUrl) && Number.isFinite(input.retrievedAt)
    ? 95
    : 60
}

function extractFeatures(payload: unknown): RawFeature[] {
  const features = (payload as { features?: unknown }).features
  if (!Array.isArray(features)) return []
  const out: RawFeature[] = []
  for (const feature of features) {
    if (!feature || typeof feature !== 'object') continue
    const f = feature as Record<string, unknown>
    // GeoJSON: properties + geometry.coordinates [lon, lat]
    const props = f.properties as Record<string, unknown> | undefined
    const geometry = f.geometry as Record<string, unknown> | undefined
    if (props) {
      const coords = Array.isArray(geometry?.coordinates) ? (geometry?.coordinates as unknown[]) : []
      out.push({ attrs: props, lon: asNumber(coords[0]), lat: asNumber(coords[1]) })
      continue
    }
    // Esri JSON: attributes + geometry {x, y}
    const attributes = f.attributes as Record<string, unknown> | undefined
    if (attributes) {
      out.push({ attrs: attributes, lon: asNumber(geometry?.x), lat: asNumber(geometry?.y) })
    }
  }
  return out
}

function fallbackCoords(attrs: Record<string, unknown>): { lat: number; lon: number } | null {
  const lat = asNumber(attrs.Latitude ?? attrs.latitude ?? attrs.LAT ?? attrs.Y)
  const lon = asNumber(attrs.Longitude ?? attrs.longitude ?? attrs.LON ?? attrs.LONG ?? attrs.X)
  return coordinatesAreValid(lat, lon) ? { lat: lat as number, lon: lon as number } : null
}

function normalizeTerminalType(raw: string): LngTerminalType | undefined {
  const v = raw.toLowerCase()
  if (!v) return undefined
  if (/liquef/.test(v)) return 'liquefaction'
  if (/regas/.test(v)) return 'regasification'
  if (/export/.test(v)) return 'export'
  if (/import/.test(v)) return 'import'
  return undefined
}

function isOfficialLngSourceUrl(url: string): boolean {
  return hostMatches(url, (h) => /(^|\.)eia\.gov$/i.test(h) || /(^|\.)ferc\.gov$/i.test(h) || /(^|\.)energy\.gov$/i.test(h))
}

function isOfficialLngApiUrl(url: string): boolean {
  return hostMatches(url, (h, parsed) => {
    if (/(^|\.)eia\.gov$/i.test(h) || /(^|\.)ferc\.gov$/i.test(h) || /(^|\.)energy\.gov$/i.test(h)) return true
    // EIA publishes its Atlas LNG layer via Esri ArcGIS Online — accept ONLY the
    // confirmed EIA LNG service or an EIA-atlas opendata download for LNG.
    if (/(^|\.)arcgis\.com$/i.test(h)) {
      const path = parsed.pathname.toLowerCase()
      return /lng/.test(path) && (/lng_importexportterminals_us_eia/.test(path) || h.startsWith('atlas-eia') || /\/api\/download\/v1\/items\//.test(path))
    }
    return false
  })
}

function hostMatches(url: string, predicate: (host: string, parsed: URL) => boolean): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && predicate(parsed.hostname.toLowerCase(), parsed)
  } catch {
    return false
  }
}

function sourceFor(apiUrl: string): { name: string; dataset: string; page: string } {
  try {
    const host = new URL(apiUrl).hostname.toLowerCase()
    if (/(^|\.)ferc\.gov$/.test(host)) return FERC_SOURCE
    if (/(^|\.)energy\.gov$/.test(host)) return DOE_SOURCE
  } catch {
    /* fall through */
  }
  return EIA_SOURCE
}

async function fetchTerminalJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/geo+json, application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first energy infrastructure intelligence; official LNG terminal source)',
    },
  })
  assertOk(response, 'LNG terminals')
  return (await response.json()) as unknown
}

function pick(attrs: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(attrs[key])
    if (value) return value
  }
  return ''
}

function sanitizeAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (/api[_-]?key|token/i.test(key)) continue
    out[key] = value
  }
  return out
}

function normalizeOperator(value: string): string {
  return value.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()
}

function terminalRecordId(facilityId: string): string {
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

export const LNG_TERMINAL_SOURCE_ID = SOURCE_ID
export { OPERATOR_IDENTITY as LNG_OPERATOR_IDENTITY }
