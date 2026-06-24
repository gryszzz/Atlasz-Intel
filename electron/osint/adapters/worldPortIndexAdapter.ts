/*
 * World Port Index adapter — Trade/Logistics Pack slice 1, LAYER 2 (physical).
 *
 * Official NGA Maritime Safety Information World Port Index (Pub 150): real port
 * location + physical attributes (harbor size/type, shelter, coordinates). This
 * is PHYSICAL REFERENCE DATA — never live vessel traffic, congestion, trade
 * volume, disruption, or company exposure.
 *
 * Links to the UN/LOCODE layer ONLY on an exact code match from the WPI source
 * field (modern WPI carries a UN/LOCODE column); never fuzzy. No match -> the
 * port stands alone.
 *
 * Source: official msi.nga.mil CSV (UpdatedPub150.csv). The default URL key may
 * change per WPI edition; operator can override via ATLASZ_WPI_URL. Host is
 * validated to nga.mil; fail-closed on HTTP/rate-limit.
 *
 * provenance: official-api   category: trade-logistics
 */
import { adapterEventId, asNumber, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { coordinatesAreValid, isValidPrecision, normalizeCountry, precisionForCoordinates } from '../../../src/engine/geo/geoCore'
import type { WorldIntelEvent, WorldPortIndexRecord } from '../../../src/worldIntel'

const SOURCE_ID = 'world_port_index_public'
const SOURCE_NAME = 'NGA World Port Index'
const SOURCE_DATASET = 'NGA World Port Index (Pub 150)'
const HUMAN_SOURCE_URL = 'https://msi.nga.mil/Publications/WPI'
const DEFAULT_API_URL = 'https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX = 800
const MAX_CAP = 5_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 180 * DAY_MS
const LOCODE_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}$/

export type WorldPortIndexConfig = {
  apiUrl: string
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readWorldPortIndexConfig(env: NodeJS.ProcessEnv = process.env): WorldPortIndexConfig | null {
  if (env.ATLASZ_WPI_DISABLE === '1') return null
  const apiUrl = asString(env.ATLASZ_WPI_URL) || DEFAULT_API_URL
  if (!isOfficialWpiUrl(apiUrl)) return null
  return {
    apiUrl,
    maxRecords: clampInteger(Number(env.ATLASZ_WPI_MAX ?? DEFAULT_MAX), 1, MAX_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_WPI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_WPI_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_WPI_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchWorldPortIndex(signal: AbortSignal, config = readWorldPortIndexConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const body = await fetchWithRetry(
    (attemptSignal) => fetchWpi(config.apiUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  return normalizeWorldPorts(parseWorldPortIndex(body, { retrievedAt, sourceApiUrl: config.apiUrl, maxRecords: config.maxRecords }))
}

/** Pure normalizer — accepts WPI CSV text OR a JSON array of port objects. */
export function parseWorldPortIndex(
  input: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxRecords?: number } = {},
): WorldPortIndexRecord[] {
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? DEFAULT_API_URL
  if (!isOfficialWpiUrl(sourceApiUrl)) return [] // never normalize from a non-official endpoint
  const maxRecords = options.maxRecords ?? DEFAULT_MAX
  const rows = toRows(input)
  if (rows.length === 0) return []

  const out: WorldPortIndexRecord[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const portNumber = pick(row, ['world port index number', 'port number', 'index number', 'wpi number', 'portnumber'])
    const portName = pick(row, ['main port name', 'port name', 'portname', 'name'])
    if (!portNumber || !portName || seen.has(portNumber)) continue // drop malformed; never repair
    seen.add(portNumber)

    const lat = asNumber(pick(row, ['latitude', 'lat', 'y']))
    const lon = asNumber(pick(row, ['longitude', 'lon', 'long', 'x']))
    const coords = coordinatesAreValid(lat, lon) ? { lat: lat as number, lon: lon as number } : null

    const locodeRaw = pick(row, ['un/locode', 'unlocode', 'un locode', 'locode']).toUpperCase().replace(/\s+/g, '')
    const linkedLocode = LOCODE_PATTERN.test(locodeRaw) ? locodeRaw : undefined

    const { code: countryFromField, name: countryName } = normalizeCountry(pick(row, ['country code', 'country']))
    const countryCode = (linkedLocode ? linkedLocode.slice(0, 2) : undefined) ?? countryFromField
    const region = pick(row, ['region name', 'region', 'world water body']) || undefined
    const subdivision = pick(row, ['subdivision', 'subdiv', 'state']) || undefined
    const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(countryCode || region || subdivision))

    const harborSize = pick(row, ['harbor size', 'harborsize']) || undefined
    const harborType = pick(row, ['harbor type', 'harbortype']) || undefined
    const shelter = pick(row, ['shelter afforded', 'shelter']) || undefined

    const rawRecord = { portNumber, portName, country: countryName, countryCode, region, subdivision, latitude: coords?.lat, longitude: coords?.lon, harborSize, harborType, shelter, linkedLocode, sourceDataset: SOURCE_DATASET, sourceUrl: HUMAN_SOURCE_URL, sourceApiUrl }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: WorldPortIndexRecord = {
      id: `${SOURCE_ID}:${portNumber.toLowerCase()}`,
      portNumber,
      portName,
      country: countryName,
      countryCode,
      subdivision,
      region,
      latitude: coords?.lat,
      longitude: coords?.lon,
      geospatialPrecision,
      harborSize,
      harborType,
      shelter,
      linkedLocode,
      sourceDataset: SOURCE_DATASET,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceFor({ portNumber, portName, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidWorldPort(record)) out.push(record)
    if (out.length >= maxRecords) break
  }
  return out
}

export function normalizeWorldPorts(records: WorldPortIndexRecord[]): WorldIntelEvent[] {
  return records.filter(hasValidWorldPort).map(toEvent)
}

function toEvent(port: WorldPortIndexRecord): WorldIntelEvent {
  const dedupeKey = `wpi|${port.portNumber}`.toLowerCase()
  const where = [port.subdivision, port.country ?? port.countryCode].filter(Boolean).join(', ')
  const loc = port.geospatialPrecision === 'exact' ? `coordinates ${port.latitude}, ${port.longitude}` : `location ${port.geospatialPrecision}`
  const attrs = [port.harborSize && `${port.harborSize} harbor`, port.harborType, port.shelter && `${port.shelter} shelter`].filter(Boolean).join(', ')
  const summary =
    `NGA World Port Index lists port ${port.portName} (No. ${port.portNumber})${where ? ` in ${where}` : ''}: ${loc}${attrs ? `; ${attrs}` : ''}` +
    `${port.linkedLocode ? `; UN/LOCODE ${port.linkedLocode}` : ''}. ` +
    'Physical port reference data only — not live traffic, congestion, trade volume, or disruption.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Port: ${port.portName}${port.countryCode ? ` (${port.countryCode})` : ''}`.slice(0, 180),
    summary,
    source: SOURCE_NAME,
    url: port.sourceUrl,
    observedAt: port.retrievedAt,
    category: 'trade-logistics',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: port,
    affectedAssets: [],
    narrativeTags: unique(['World Port Index', 'port', port.harborSize ?? '', port.linkedLocode ?? '']),
    extractedEntities: unique([port.portName, port.country ?? '', port.subdivision ?? '', port.linkedLocode ?? '']),
  })

  return {
    ...event,
    countryCodes: port.countryCode ? unique([port.countryCode, ...event.countryCodes]) : event.countryCodes,
    affectedSectors: unique(['Trade & Logistics', ...event.affectedSectors]),
    lat: port.latitude,
    lon: port.longitude,
    confidence: port.confidence,
    worldPort: port,
  }
}

export function hasValidWorldPort(port: WorldPortIndexRecord): boolean {
  const coordsPresent = coordinatesAreValid(port.latitude, port.longitude)
  return (
    Boolean(port.portNumber) &&
    Boolean(port.portName) &&
    isValidPrecision(port.geospatialPrecision) &&
    (port.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
    (port.linkedLocode === undefined || LOCODE_PATTERN.test(port.linkedLocode)) &&
    port.sourceDataset.length > 0 &&
    isOfficialWpiSourceUrl(port.sourceUrl) &&
    isOfficialWpiUrl(port.sourceApiUrl) &&
    port.sourceName === SOURCE_NAME &&
    port.provenance === 'official-api' &&
    Number.isFinite(port.retrievedAt) &&
    Number.isFinite(port.staleAt) &&
    port.rawPayloadHash.length > 0 &&
    port.confidence >= 90
  )
}

function confidenceFor(input: { portNumber: string; portName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return Boolean(input.portNumber) && Boolean(input.portName) && isOfficialWpiUrl(input.sourceApiUrl) && Number.isFinite(input.retrievedAt) ? 95 : 60
}

function toRows(input: unknown): Array<Record<string, string>> {
  if (Array.isArray(input)) {
    return input.filter((r) => r && typeof r === 'object').map((r) => normalizeKeys(r as Record<string, unknown>))
  }
  if (input && typeof input === 'object' && Array.isArray((input as { ports?: unknown }).ports)) {
    return ((input as { ports: unknown[] }).ports).filter((r) => r && typeof r === 'object').map((r) => normalizeKeys(r as Record<string, unknown>))
  }
  if (typeof input === 'string' && input.trim() !== '') return parseCsv(input)
  return []
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []
  const header = parseCsvLine(lines[0]).map((h) => normalizeKey(h))
  const out: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    for (let c = 0; c < header.length; c += 1) row[header[c]] = (cells[c] ?? '').trim()
    out.push(row)
  }
  return out
}

function normalizeKeys(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) out[normalizeKey(k)] = v === null || v === undefined ? '' : String(v)
  return out
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_\s]+/g, ' ').trim()
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = (row[key] ?? '').trim()
    if (value) return value
  }
  return ''
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
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

function isOfficialWpiSourceUrl(url: string): boolean {
  return hostEndsWith(url, 'nga.mil')
}

function isOfficialWpiUrl(url: string): boolean {
  return hostEndsWith(url, 'nga.mil')
}

function hostEndsWith(url: string, suffix: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && new RegExp(`(^|\\.)${suffix.replace('.', '\\.')}$`, 'i').test(parsed.hostname)
  } catch {
    return false
  }
}

async function fetchWpi(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'text/csv, application/json, text/plain, */*', 'user-agent': 'AtlaszIntel/0.4 (local-first trade/logistics intelligence; official NGA World Port Index)' },
  })
  assertOk(response, 'World Port Index')
  const contentType = response.headers.get('content-type') ?? ''
  if (/json/i.test(contentType)) return (await response.json()) as unknown
  return await response.text()
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

export const WORLD_PORT_INDEX_SOURCE_ID = SOURCE_ID
