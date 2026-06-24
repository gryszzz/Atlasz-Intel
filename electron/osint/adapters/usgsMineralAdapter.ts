/*
 * USGS minerals / mines adapter — Materials Pack slice 1.
 *
 * Official USGS Mineral Resources Online Spatial Data, TWO-SOURCE-AWARE:
 *   - USMIN: developing national-scale authoritative U.S. deposit database
 *   - MRDS:  older global occurrence database — LEGACY, not systematically
 *            updated since 2011 (records flagged legacyNotMaintained = true; never
 *            presented as current mine activity)
 *
 * Materials REFERENCE layer only: never current production, reserves, ownership,
 * resource size, or investment/trading signal. Production/development status
 * appear only when the source provides them. Operator links to a market identity
 * ONLY on an exact curated match. Coordinates source-backed only.
 *
 * SOURCE DISCIPLINE: fail-closed with no default endpoint. Operator pins the
 * official USGS export(s) via ATLASZ_USGS_USMIN_URL / ATLASZ_USGS_MRDS_URL
 * (host validated to usgs.gov); at least one required. Parser is the tested core
 * and accepts CSV (header-mapped) or a JSON array.
 *
 * provenance: official-api   category: materials
 */
import { adapterEventId, asNumber, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import {
  coordinatesAreValid,
  isValidPrecision,
  normalizeCountry,
  normalizeUsState,
  precisionForCoordinates,
} from '../../../src/engine/geo/geoCore'
import type { MineralDatabase, MineralSite, MineralSiteKind, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'usgs_minerals_public'
const SOURCE_NAME = 'USGS Mineral Resources'
const HUMAN_SOURCE_URL = 'https://mrdata.usgs.gov/'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX = 600
const MAX_CAP = 5_000
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 180 * DAY_MS

/** Exact curated operator/owner -> market identity. Exact normalized match only. */
const OPERATOR_IDENTITY: Record<string, { ticker: string }> = {
  'freeport-mcmoran': { ticker: 'FCX' },
  'freeport mcmoran': { ticker: 'FCX' },
  'newmont': { ticker: 'NEM' },
  'newmont corporation': { ticker: 'NEM' },
  'rio tinto': { ticker: 'RIO' },
  'bhp': { ticker: 'BHP' },
  'albemarle': { ticker: 'ALB' },
  'mp materials': { ticker: 'MP' },
  'cleveland-cliffs': { ticker: 'CLF' },
  'nucor': { ticker: 'NUE' },
}

export type UsgsMineralSource = { database: MineralDatabase; url: string }
export type UsgsMineralConfig = {
  sources: UsgsMineralSource[]
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readUsgsMineralConfig(env: NodeJS.ProcessEnv = process.env): UsgsMineralConfig | null {
  if (env.ATLASZ_USGS_MINERALS_DISABLE === '1') return null
  const sources: UsgsMineralSource[] = []
  const usmin = asString(env.ATLASZ_USGS_USMIN_URL)
  const mrds = asString(env.ATLASZ_USGS_MRDS_URL)
  if (usmin && isOfficialUsgsUrl(usmin)) sources.push({ database: 'USMIN', url: usmin })
  if (mrds && isOfficialUsgsUrl(mrds)) sources.push({ database: 'MRDS', url: mrds })
  if (sources.length === 0) return null
  return {
    sources,
    maxRecords: clampInteger(Number(env.ATLASZ_USGS_MINERALS_MAX ?? DEFAULT_MAX), 1, MAX_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_USGS_MINERALS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_USGS_MINERALS_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_USGS_MINERALS_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchUsgsMinerals(signal: AbortSignal, config = readUsgsMineralConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const records: MineralSite[] = []
  const errors: Error[] = []
  for (const source of config.sources) {
    try {
      const body = await fetchWithRetry(
        (attemptSignal) => fetchMineral(source.url, linkedSignal(signal, attemptSignal)),
        { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
      )
      records.push(...parseMineralSites(body, { database: source.database, retrievedAt, sourceApiUrl: source.url, maxRecords: config.maxRecords }))
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    }
  }
  if (records.length === 0 && errors.length > 0) throw errors[0]
  return normalizeMineralSites(records)
}

/** Pure normalizer — accepts CSV text or a JSON array of mineral-site objects. */
export function parseMineralSites(
  input: unknown,
  options: { database: MineralDatabase; retrievedAt?: number; sourceApiUrl?: string; maxRecords?: number },
): MineralSite[] {
  const database = options.database
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? ''
  if (!isOfficialUsgsUrl(sourceApiUrl)) return [] // never normalize from a non-official endpoint
  const maxRecords = options.maxRecords ?? DEFAULT_MAX
  const rows = toRows(input)
  if (rows.length === 0) return []

  const sourceDataset = database === 'USMIN' ? 'USGS USMIN deposit database' : 'USGS MRDS (legacy occurrence database, not updated since 2011)'
  const out: MineralSite[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const siteId = pick(row, ['dep_id', 'mrds_id', 'rec_id', 'ftr_id', 'site_id', 'id', 'objectid'])
    const siteName = pick(row, ['site_name', 'name', 'ftr_name', 'sitename', 'deposit_name'])
    if (!siteId || !siteName) continue // drop malformed; never repair
    const dedupe = `${database}:${siteId}`
    if (seen.has(dedupe)) continue
    seen.add(dedupe)

    const lat = asNumber(pick(row, ['latitude', 'lat', 'y', 'dec_lat']))
    const lon = asNumber(pick(row, ['longitude', 'lon', 'long', 'x', 'dec_long']))
    const coords = coordinatesAreValid(lat, lon) ? { lat: lat as number, lon: lon as number } : null

    const commodities = parseCommodities(row)
    const developmentStatus = pick(row, ['dev_stat', 'development_status', 'dev_status', 'status']) || undefined
    const productionStatus = pick(row, ['prod_size', 'production_status', 'production', 'producer']) || undefined
    const depositType = pick(row, ['dep_type', 'deposit_type', 'model']) || undefined

    const { code: countryCode, name: countryName } = normalizeCountry(pick(row, ['country', 'country_code', 'nation']))
    const rawState = pick(row, ['state', 'state_prov', 'province', 'region'])
    const usState = countryCode === 'US' ? normalizeUsState(rawState) : {}
    const state = usState.code ?? (rawState || undefined)
    const stateName = usState.name ?? (rawState || undefined)
    const county = pick(row, ['county', 'district', 'county_district']) || undefined

    const geospatialPrecision = precisionForCoordinates(coords?.lat, coords?.lon, Boolean(countryCode || state || county))
    const operatorName = pick(row, ['operator', 'owner', 'oper_name', 'company']) || undefined
    const operatorTicker = operatorName ? OPERATOR_IDENTITY[normalizeOperator(operatorName)]?.ticker : undefined
    const facilityKind = mineralKind(developmentStatus, productionStatus)

    const rawRecord = { database, siteId, siteName, commodities, developmentStatus, productionStatus, depositType, country: countryName, countryCode, state, stateName, county, latitude: coords?.lat, longitude: coords?.lon, operatorName, operatorTicker, sourceDataset, sourceUrl: HUMAN_SOURCE_URL, sourceApiUrl }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: MineralSite = {
      id: `${SOURCE_ID}:${database.toLowerCase()}:${siteId.toLowerCase()}`,
      siteId,
      siteName,
      facilityKind,
      database,
      legacyNotMaintained: database === 'MRDS',
      commodities,
      depositType,
      developmentStatus,
      productionStatus,
      operatorName,
      operatorTicker,
      country: countryName,
      countryCode,
      state,
      stateName,
      county,
      district: pick(row, ['district', 'mining_district']) || undefined,
      latitude: coords?.lat,
      longitude: coords?.lon,
      geospatialPrecision,
      sourceDataset,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceFor({ siteId, siteName, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidMineralSite(record)) out.push(record)
    if (out.length >= maxRecords) break
  }
  return out
}

export function normalizeMineralSites(records: MineralSite[]): WorldIntelEvent[] {
  return records.filter(hasValidMineralSite).map(toEvent)
}

function toEvent(site: MineralSite): WorldIntelEvent {
  const dedupeKey = `usgs-mineral|${site.database}|${site.siteId}`.toLowerCase()
  const where = [site.county, site.stateName ?? site.state, site.country ?? site.countryCode].filter(Boolean).join(', ')
  const commod = site.commodities.length > 0 ? site.commodities.join(', ') : 'commodity unspecified'
  const loc = site.geospatialPrecision === 'exact' ? `coordinates ${site.latitude}, ${site.longitude}` : `location ${site.geospatialPrecision}`
  const status = site.developmentStatus ? `; development status: ${site.developmentStatus} (as reported)` : ''
  const legacy = site.legacyNotMaintained ? ' MRDS legacy record — not systematically updated since 2011; not current mine activity.' : ''
  const summary =
    `USGS ${site.database} mineral site ${site.siteName}${where ? ` in ${where}` : ''}: commodities ${commod}, ${loc}${status}.` +
    `${legacy} ` +
    'Mineral resource reference data only — not current production, reserves, ownership, or an investment signal.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Mineral site: ${site.siteName}${site.commodities[0] ? ` (${site.commodities[0]})` : ''}`.slice(0, 180),
    summary,
    source: SOURCE_NAME,
    url: site.sourceUrl,
    observedAt: site.retrievedAt,
    category: 'materials',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: site,
    affectedAssets: site.operatorTicker ? [site.operatorTicker] : [],
    narrativeTags: unique(['USGS mineral site', site.database, site.facilityKind, ...site.commodities]),
    extractedEntities: unique([site.siteName, ...site.commodities, site.operatorName ?? '', site.stateName ?? site.state ?? '', site.country ?? '']),
  })

  return {
    ...event,
    countryCodes: site.countryCode ? unique([site.countryCode, ...event.countryCodes]) : event.countryCodes,
    affectedSectors: unique(['Materials', 'Mining', ...event.affectedSectors]),
    affectedCommodities: unique([...site.commodities, ...event.affectedCommodities]),
    lat: site.latitude,
    lon: site.longitude,
    confidence: site.confidence,
    mineralSite: site,
  }
}

export function hasValidMineralSite(site: MineralSite): boolean {
  const coordsPresent = coordinatesAreValid(site.latitude, site.longitude)
  return (
    Boolean(site.siteId) &&
    Boolean(site.siteName) &&
    (site.facilityKind === 'mine' || site.facilityKind === 'mineral-resource-site') &&
    (site.database === 'USMIN' || site.database === 'MRDS') &&
    isValidPrecision(site.geospatialPrecision) &&
    (site.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
    site.sourceDataset.length > 0 &&
    isUsgsHost(site.sourceUrl) &&
    isOfficialUsgsUrl(site.sourceApiUrl) &&
    site.sourceName === SOURCE_NAME &&
    site.provenance === 'official-api' &&
    Number.isFinite(site.retrievedAt) &&
    Number.isFinite(site.staleAt) &&
    site.rawPayloadHash.length > 0 &&
    site.confidence >= 90
  )
}

function confidenceFor(input: { siteId: string; siteName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return Boolean(input.siteId) && Boolean(input.siteName) && isOfficialUsgsUrl(input.sourceApiUrl) && Number.isFinite(input.retrievedAt) ? 95 : 60
}

function mineralKind(developmentStatus?: string, productionStatus?: string): MineralSiteKind {
  const text = `${developmentStatus ?? ''} ${productionStatus ?? ''}`
  return /producer|mine|operating|plant|past producer/i.test(text) ? 'mine' : 'mineral-resource-site'
}

function parseCommodities(row: Record<string, string>): string[] {
  const fields = ['commod1', 'commod2', 'commod3', 'commodity', 'commodities', 'commod_main', 'com_type']
  const values: string[] = []
  for (const field of fields) {
    const raw = (row[field] ?? '').trim()
    if (raw) values.push(...raw.split(/[,;|+]/).map((c) => titleCaseCommodity(c.trim())))
  }
  return unique(values).slice(0, 12)
}

function titleCaseCommodity(value: string): string {
  if (!value) return ''
  return value.length <= 3 ? value.toUpperCase() : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function toRows(input: unknown): Array<Record<string, string>> {
  if (Array.isArray(input)) return input.filter((r) => r && typeof r === 'object').map((r) => normalizeKeys(r as Record<string, unknown>))
  if (input && typeof input === 'object') {
    const arr = (input as { features?: unknown; data?: unknown }).features ?? (input as { data?: unknown }).data
    if (Array.isArray(arr)) {
      return arr
        .filter((r) => r && typeof r === 'object')
        .map((r) => {
          const props = (r as { properties?: unknown }).properties
          return normalizeKeys((props && typeof props === 'object' ? props : r) as Record<string, unknown>)
        })
    }
  }
  if (typeof input === 'string' && input.trim() !== '') return parseCsv(input)
  return []
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []
  const header = parseCsvLine(lines[0]).map(normalizeKey)
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
  return key.trim().toLowerCase().replace(/\s+/g, '_')
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

function isUsgsHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)usgs\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function isOfficialUsgsUrl(url: string): boolean {
  return isUsgsHost(url)
}

function normalizeOperator(value: string): string {
  return value.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()
}

async function fetchMineral(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'text/csv, application/json, application/geo+json, */*', 'user-agent': 'AtlaszIntel/0.4 (local-first materials intelligence; official USGS Mineral Resources)' },
  })
  assertOk(response, 'USGS minerals')
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

export const USGS_MINERALS_SOURCE_ID = SOURCE_ID
export { OPERATOR_IDENTITY as MINERAL_OPERATOR_IDENTITY }
