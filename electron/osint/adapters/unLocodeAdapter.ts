/*
 * UN/LOCODE adapter — Trade/Logistics Pack slice 1, LAYER 1 (location registry).
 *
 * The official UNECE UN/LOCODE code list: standardized trade/transport location
 * codes for ports, rail/road terminals, airports, postal exchanges, border
 * crossings, etc. This is a LOCATION CODE REGISTRY, NOT proof of live port
 * operations — no vessel traffic, congestion, or disruption is ever implied.
 *
 * SOURCE DISCIPLINE (like LNG): ships FAIL-CLOSED with NO default endpoint.
 * UNECE files are release-versioned, so the operator pins the official UNECE CSV
 * via ATLASZ_UNLOCODE_URL (host validated to unece.org); inert without it. The
 * parser is the tested core and accepts the official 12-column CSV layout
 * (Change, Country, Location, Name, NameWoDiacritics, Subdivision, Status,
 * Function, Date, IATA, Coordinates, Remarks) or a header-labelled variant.
 *
 * Coordinates appear ONLY when the source row provides them (UN/LOCODE
 * "Coordinates" column, DDMM[N/S] DDDMM[E/W]); otherwise region-only.
 *
 * provenance: official-api   category: trade-logistics
 */
import { adapterEventId, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { coordinatesAreValid, isValidPrecision, precisionForCoordinates } from '../../../src/engine/geo/geoCore'
import type { UnLocode, UnLocodeFunctions, UnLocodeKind, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'un_locode_public'
const SOURCE_NAME = 'UNECE UN/LOCODE'
const SOURCE_DATASET = 'UNECE UN/LOCODE Code List'
const HUMAN_SOURCE_URL = 'https://unece.org/trade/cefact/UNLOCODE-Download'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX = 500
const MAX_CAP = 5_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 180 * DAY_MS // UN/LOCODE publishes a couple of times a year.
const COUNTRY_PATTERN = /^[A-Z]{2}$/
const LOCATION_PATTERN = /^[A-Z0-9]{3}$/

export type UnLocodeConfig = {
  url: string
  portsOnly: boolean
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readUnLocodeConfig(env: NodeJS.ProcessEnv = process.env): UnLocodeConfig | null {
  if (env.ATLASZ_UNLOCODE_DISABLE === '1') return null
  const url = asString(env.ATLASZ_UNLOCODE_URL)
  if (!url || !isOfficialUnLocodeUrl(url)) return null
  return {
    url,
    portsOnly: env.ATLASZ_UNLOCODE_PORTS_ONLY !== '0',
    maxRecords: clampInteger(Number(env.ATLASZ_UNLOCODE_MAX ?? DEFAULT_MAX), 1, MAX_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_UNLOCODE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_UNLOCODE_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_UNLOCODE_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchUnLocodes(signal: AbortSignal, config = readUnLocodeConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const text = await fetchWithRetry(
    (attemptSignal) => fetchCsv(config.url, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseUnLocodes(text, { retrievedAt, sourceApiUrl: config.url, maxRecords: config.maxRecords })
  const scoped = config.portsOnly ? records.filter(isPortLocode) : records
  return normalizeUnLocodes(scoped)
}

/** Pure normalizer — testable with fixture UN/LOCODE CSV text. */
export function parseUnLocodes(
  text: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxRecords?: number } = {},
): UnLocode[] {
  if (typeof text !== 'string' || text.trim() === '') return []
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? ''
  if (!isOfficialUnLocodeUrl(sourceApiUrl)) return [] // never normalize from a non-official endpoint
  const maxRecords = options.maxRecords ?? DEFAULT_MAX

  const rows = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  const cols = detectColumns(rows[0])
  const out: UnLocode[] = []
  const seen = new Set<string>()

  for (const line of rows) {
    const cells = parseCsvLine(line)
    if (cells.length < 8) continue
    if (cols.header && /country/i.test(cells[cols.country] ?? '')) continue // skip header row
    const countryCode = asString(cells[cols.country]).toUpperCase()
    const locationCode = asString(cells[cols.location]).toUpperCase()
    const locationName = asString(cells[cols.name])
    if (!COUNTRY_PATTERN.test(countryCode) || !LOCATION_PATTERN.test(locationCode) || !locationName) {
      continue // drop malformed; never repair
    }
    const locode = `${countryCode}${locationCode}`
    if (seen.has(locode)) continue
    seen.add(locode)

    const functionCode = asString(cells[cols.function])
    const functions = parseFunctions(functionCode)
    const subdivision = asString(cells[cols.subdivision]) || undefined
    const status = asString(cells[cols.status]) || undefined
    const iata = cols.iata >= 0 ? asString(cells[cols.iata]) || undefined : undefined
    const coords = cols.coordinates >= 0 ? parseCoordinates(asString(cells[cols.coordinates])) : null
    const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(countryCode || subdivision))
    const facilityKind = facilityKindFor(functions)

    const rawRecord = { locode, countryCode, locationCode, locationName, subdivision, status, iata, functionCode, latitude: coords?.lat, longitude: coords?.lon, sourceDataset: SOURCE_DATASET, sourceUrl: HUMAN_SOURCE_URL, sourceApiUrl }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: UnLocode = {
      id: `${SOURCE_ID}:${locode.toLowerCase()}`,
      locode,
      countryCode,
      locationCode,
      locationName,
      subdivision,
      status,
      iata,
      functions,
      functionCode,
      facilityKind,
      latitude: coords?.lat,
      longitude: coords?.lon,
      geospatialPrecision,
      sourceDataset: SOURCE_DATASET,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceFor({ countryCode, locationCode, locationName, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidUnLocode(record)) out.push(record)
    if (out.length >= maxRecords) break
  }
  return out
}

export function isPortLocode(record: UnLocode): boolean {
  return record.functions.port
}

export function normalizeUnLocodes(records: UnLocode[]): WorldIntelEvent[] {
  return records.filter(hasValidUnLocode).map(toEvent)
}

function toEvent(loc: UnLocode): WorldIntelEvent {
  const dedupeKey = `un-locode|${loc.locode}`.toLowerCase()
  const kinds = activeFunctionLabels(loc.functions)
  const loctxt = loc.geospatialPrecision === 'exact' ? `coordinates ${loc.latitude}, ${loc.longitude}` : `location ${loc.geospatialPrecision}`
  const summary =
    `UN/LOCODE ${loc.locode} — ${loc.locationName}, ${loc.countryCode}${loc.subdivision ? ` (${loc.subdivision})` : ''}. ` +
    `Functions: ${kinds.length > 0 ? kinds.join(', ') : 'unspecified'}; ${loctxt}. ` +
    'Trade/location registry context only — not live port activity, vessel traffic, congestion, or disruption.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Location ${loc.locode}: ${loc.locationName}${loc.functions.port ? ' (port)' : ''}`.slice(0, 180),
    summary,
    source: SOURCE_NAME,
    url: loc.sourceUrl,
    observedAt: loc.retrievedAt,
    category: 'trade-logistics',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: loc,
    affectedAssets: [],
    narrativeTags: unique(['UN/LOCODE', loc.facilityKind, ...kinds, loc.countryCode]),
    extractedEntities: unique([loc.locode, loc.locationName, loc.countryCode, loc.subdivision ?? '']),
  })

  return {
    ...event,
    countryCodes: unique([loc.countryCode, ...event.countryCodes]),
    affectedSectors: unique(['Trade & Logistics', ...event.affectedSectors]),
    lat: loc.latitude,
    lon: loc.longitude,
    confidence: loc.confidence,
    unLocode: loc,
  }
}

export function hasValidUnLocode(loc: UnLocode): boolean {
  const coordsPresent = coordinatesAreValid(loc.latitude, loc.longitude)
  return (
    COUNTRY_PATTERN.test(loc.countryCode) &&
    LOCATION_PATTERN.test(loc.locationCode) &&
    loc.locode === `${loc.countryCode}${loc.locationCode}` &&
    loc.locationName.length > 0 &&
    isValidPrecision(loc.geospatialPrecision) &&
    (loc.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
    loc.sourceDataset.length > 0 &&
    isOfficialUnLocodeSourceUrl(loc.sourceUrl) &&
    isOfficialUnLocodeUrl(loc.sourceApiUrl) &&
    loc.sourceName === SOURCE_NAME &&
    loc.provenance === 'official-api' &&
    Number.isFinite(loc.retrievedAt) &&
    Number.isFinite(loc.staleAt) &&
    loc.rawPayloadHash.length > 0 &&
    loc.confidence >= 90
  )
}

function confidenceFor(input: { countryCode: string; locationCode: string; locationName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return COUNTRY_PATTERN.test(input.countryCode) &&
    LOCATION_PATTERN.test(input.locationCode) &&
    input.locationName.length > 0 &&
    isOfficialUnLocodeUrl(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 95
    : 60
}

// UN/LOCODE Function classifier: position -> meaning. '-' or '0' means not set.
function parseFunctions(code: string): UnLocodeFunctions {
  const has = (ch: string) => code.includes(ch)
  return {
    port: has('1'),
    rail: has('2'),
    road: has('3'),
    airport: has('4'),
    postal: has('5'),
    multimodal: has('6'),
    fixedTransport: has('7'),
    borderCrossing: /B/i.test(code),
  }
}

function facilityKindFor(fns: UnLocodeFunctions): UnLocodeKind {
  if (fns.port) return 'port'
  if (fns.airport) return 'airport'
  if (fns.rail) return 'rail-terminal'
  return 'logistics-location'
}

function activeFunctionLabels(fns: UnLocodeFunctions): string[] {
  const out: string[] = []
  if (fns.port) out.push('port')
  if (fns.rail) out.push('rail')
  if (fns.road) out.push('road')
  if (fns.airport) out.push('airport')
  if (fns.postal) out.push('postal')
  if (fns.multimodal) out.push('multimodal')
  if (fns.fixedTransport) out.push('fixed-transport')
  if (fns.borderCrossing) out.push('border-crossing')
  return out
}

// UN/LOCODE coordinates: "DDMM[N/S] DDDMM[E/W]" e.g. "3343N 11815W".
function parseCoordinates(raw: string): { lat: number; lon: number } | null {
  const match = /^(\d{2})(\d{2})([NS])\s+(\d{3})(\d{2})([EW])$/.exec(raw.trim())
  if (!match) return null
  const lat = (Number(match[1]) + Number(match[2]) / 60) * (match[3] === 'S' ? -1 : 1)
  const lon = (Number(match[4]) + Number(match[5]) / 60) * (match[6] === 'W' ? -1 : 1)
  return coordinatesAreValid(lat, lon) ? { lat: round(lat), lon: round(lon) } : null
}

type Columns = { header: boolean; country: number; location: number; name: number; subdivision: number; status: number; function: number; iata: number; coordinates: number }

// Official 12-column positional layout, or a header-labelled CSV.
function detectColumns(firstLine: string | undefined): Columns {
  const positional: Columns = { header: false, country: 1, location: 2, name: 3, subdivision: 5, status: 6, function: 7, iata: 9, coordinates: 10 }
  if (!firstLine) return positional
  const cells = parseCsvLine(firstLine).map((c) => c.trim().toLowerCase())
  if (!cells.some((c) => c === 'country' || c === 'location' || c === 'function')) return positional
  const idx = (names: string[]) => cells.findIndex((c) => names.includes(c))
  return {
    header: true,
    country: at(idx(['country']), 1),
    location: at(idx(['location', 'code']), 2),
    name: at(idx(['name', 'namewodiacritics']), 3),
    subdivision: at(idx(['subdivision', 'subdiv']), 5),
    status: at(idx(['status']), 6),
    function: at(idx(['function']), 7),
    iata: idx(['iata']),
    coordinates: at(idx(['coordinates']), 10),
  }
}

function at(value: number, fallback: number): number {
  return value >= 0 ? value : fallback
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((cell) => cell.trim())
}

function isOfficialUnLocodeSourceUrl(url: string): boolean {
  return hostEndsWith(url, 'unece.org')
}

function isOfficialUnLocodeUrl(url: string): boolean {
  return hostEndsWith(url, 'unece.org')
}

function hostEndsWith(url: string, suffix: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && new RegExp(`(^|\\.)${suffix.replace('.', '\\.')}$`, 'i').test(parsed.hostname)
  } catch {
    return false
  }
}

async function fetchCsv(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'text/csv, text/plain, */*', 'user-agent': 'AtlaszIntel/0.4 (local-first trade/logistics intelligence; official UNECE UN/LOCODE)' },
  })
  assertOk(response, 'UN/LOCODE')
  return await response.text()
}

function round(value: number): number {
  return Math.round(value * 1e5) / 1e5
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

export const UN_LOCODE_SOURCE_ID = SOURCE_ID
