/*
 * EIA balancing authority / grid region adapter — Energy Infra Pack slice 4.
 *
 * The grid-operating-region reference layer that connects power plants to grid
 * geography. Uses the official EIA Open Data API v2 respondent facet of the
 * electricity/rto route — the authoritative list of U.S. balancing authorities
 * (code + name). Same EIA key as the other EIA slices; fail-closed without it.
 *
 * Grid-context reference ONLY: never an outage, grid-stress, reliability,
 * emergency, or vulnerability claim. No geometry from this source -> region-only.
 * NERC region is added only from a curated official EIA reference (by BA code);
 * operator links to a market identity ONLY on an exact curated match.
 *
 * The power-plant -> BA link does NOT depend on this connector: it rides on the
 * source-backed balancing-authority code already on each EIA plant record.
 *
 * provenance: official-api   category: energy-grid
 */
import { adapterEventId, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { isValidPrecision } from '../../../src/engine/geo/geoCore'
import type { GridRegion, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_balancing_authorities_public'
const EIA_SOURCE_NAME = 'U.S. Energy Information Administration'
const EIA_API_BASE = 'https://api.eia.gov/v2'
const FACET_ROUTE = 'electricity/rto/region-data/facet/respondent'
const SOURCE_DATASET = 'EIA U.S. Electric System Operating Data — balancing authorities'
const HUMAN_SOURCE_URL = 'https://www.eia.gov/opendata/browser/electricity/rto/region-data'
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX = 200
const MAX_CAP = 500
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 90 * DAY_MS // BA reference list changes rarely.
const BA_CODE_PATTERN = /^[A-Z0-9-]{2,16}$/

/**
 * Curated official NERC region by BA code (public EIA/NERC reference facts).
 * Used only to label region context; absent codes stay undefined (never guessed).
 */
const BA_NERC_REGION: Record<string, string> = {
  CISO: 'WECC', BANC: 'WECC', LDWP: 'WECC', BPAT: 'WECC', PACW: 'WECC', PACE: 'WECC', NEVP: 'WECC', AZPS: 'WECC', PNM: 'WECC', PSCO: 'WECC', WACM: 'WECC', IPCO: 'WECC', PGE: 'WECC',
  ERCO: 'TRE',
  MISO: 'MRO', SPA: 'MRO', SWPP: 'MRO',
  PJM: 'RFC',
  ISNE: 'NPCC', NYIS: 'NPCC',
  SOCO: 'SERC', TVA: 'SERC', DUK: 'SERC', CPLE: 'SERC', SC: 'SERC', SCEG: 'SERC', FPL: 'FRCC', FPC: 'FRCC', TEC: 'FRCC', JEA: 'FRCC',
}

/** Exact curated BA code -> market identity (some BAs are public utilities). */
const OPERATOR_IDENTITY: Record<string, { name: string; ticker: string }> = {
  DUK: { name: 'Duke Energy', ticker: 'DUK' },
  SOCO: { name: 'Southern Company', ticker: 'SO' },
  FPL: { name: 'NextEra Energy', ticker: 'NEE' },
  PSCO: { name: 'Xcel Energy', ticker: 'XEL' },
  AEP: { name: 'American Electric Power', ticker: 'AEP' },
}

export type EiaBalancingAuthorityConfig = {
  apiBase: string
  apiKey: string
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type FacetPayload = {
  response?: { facets?: Array<Record<string, unknown>>; totalFacets?: number }
  error?: string
  code?: number
}

export function readEiaBalancingAuthorityConfig(env: NodeJS.ProcessEnv = process.env): EiaBalancingAuthorityConfig | null {
  if (env.ATLASZ_EIA_BA_DISABLE === '1') return null
  const apiKey = asString(env.ATLASZ_EIA_API_KEY)
  const apiBase = asString(env.ATLASZ_EIA_API_BASE) || EIA_API_BASE
  if (!apiKey || !/^https:\/\//i.test(apiBase)) return null
  return {
    apiBase,
    apiKey,
    maxRecords: clampInteger(Number(env.ATLASZ_EIA_BA_MAX ?? DEFAULT_MAX), 1, MAX_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_EIA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_EIA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_EIA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchEiaBalancingAuthorities(
  signal: AbortSignal,
  config = readEiaBalancingAuthorityConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const signedUrl = facetUrl(config.apiBase, config.apiKey)
  const sourceApiUrl = facetUrl(config.apiBase)
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchEiaJson<FacetPayload>(signedUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  return normalizeBalancingAuthorities(parseBalancingAuthorities(payload, { retrievedAt, sourceApiUrl, maxRecords: config.maxRecords }))
}

/** Pure normalizer — testable with fixture EIA facet payloads. */
export function parseBalancingAuthorities(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxRecords?: number } = {},
): GridRegion[] {
  if (!payload || typeof payload !== 'object') return []
  const body = payload as FacetPayload
  if (body.error || body.code === 400 || body.code === 404) return []
  const facets = body.response?.facets
  if (!Array.isArray(facets) || facets.length === 0) return []

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? facetUrl(EIA_API_BASE)
  const maxRecords = options.maxRecords ?? DEFAULT_MAX
  const out: GridRegion[] = []
  const seen = new Set<string>()

  for (const facet of facets) {
    const baCode = asString(facet.id ?? facet.code).toUpperCase()
    const baName = asString(facet.name ?? facet.id)
    if (!BA_CODE_PATTERN.test(baCode) || !baName || seen.has(baCode)) continue
    seen.add(baCode)

    const identity = OPERATOR_IDENTITY[baCode]
    const rawRecord = { baCode, baName, nercRegion: BA_NERC_REGION[baCode], sourceDataset: SOURCE_DATASET, sourceUrl: HUMAN_SOURCE_URL, sourceApiUrl }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: GridRegion = {
      id: `${SOURCE_ID}:${baCode.toLowerCase()}`,
      baCode,
      baName,
      regionKind: 'balancing-authority',
      country: 'US',
      nercRegion: BA_NERC_REGION[baCode],
      operatorName: identity?.name,
      operatorTicker: identity?.ticker,
      geospatialPrecision: 'region-only',
      sourceDataset: SOURCE_DATASET,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      sourceName: EIA_SOURCE_NAME,
      retrievedAt,
      staleAt: retrievedAt + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: confidenceFor({ baCode, baName, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidGridRegion(record)) out.push(record)
  }
  return out.sort((a, b) => a.baCode.localeCompare(b.baCode)).slice(0, maxRecords)
}

export function normalizeBalancingAuthorities(records: GridRegion[]): WorldIntelEvent[] {
  return records.filter(hasValidGridRegion).map(toEvent)
}

function toEvent(region: GridRegion): WorldIntelEvent {
  const dedupeKey = `eia-ba|${region.baCode}`.toLowerCase()
  const nerc = region.nercRegion ? `, ${region.nercRegion} region` : ''
  const summary =
    `EIA balancing authority ${region.baCode} — ${region.baName}${nerc}. ` +
    'Grid operating-region reference only — not an outage, grid-stress, reliability, or vulnerability claim.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Balancing authority: ${region.baCode} — ${region.baName}`.slice(0, 180),
    summary,
    source: EIA_SOURCE_NAME,
    url: region.sourceUrl,
    observedAt: region.retrievedAt,
    category: 'energy-grid',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: region,
    affectedAssets: region.operatorTicker ? [region.operatorTicker] : [],
    narrativeTags: unique(['balancing authority', 'grid region', region.nercRegion ?? '', region.baCode]),
    extractedEntities: unique([region.baCode, region.baName, region.operatorName ?? '', region.nercRegion ?? '']),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Electric Power', ...event.affectedSectors]),
    affectedCommodities: unique(['Electricity', ...event.affectedCommodities]),
    confidence: region.confidence,
    gridRegion: region,
  }
}

export function hasValidGridRegion(region: GridRegion): boolean {
  return (
    BA_CODE_PATTERN.test(region.baCode) &&
    region.baName.length > 0 &&
    (region.regionKind === 'balancing-authority' || region.regionKind === 'grid-region') &&
    isValidPrecision(region.geospatialPrecision) &&
    region.geospatialPrecision !== 'exact' && // no geometry from this source
    region.country.length > 0 &&
    region.sourceDataset.length > 0 &&
    /^https:\/\/www\.eia\.gov\//.test(region.sourceUrl) &&
    /^https:\/\/api\.eia\.gov\/v2\/electricity\/rto\//.test(region.sourceApiUrl) &&
    !/[?&]api_key=/i.test(region.sourceApiUrl) &&
    region.sourceName === EIA_SOURCE_NAME &&
    region.provenance === 'official-api' &&
    Number.isFinite(region.retrievedAt) &&
    Number.isFinite(region.staleAt) &&
    region.rawPayloadHash.length > 0 &&
    !(region.rawPayloadJson ?? '').includes('api_key') &&
    region.confidence >= 90
  )
}

function confidenceFor(input: { baCode: string; baName: string; sourceApiUrl: string; retrievedAt: number }): number {
  return BA_CODE_PATTERN.test(input.baCode) &&
    input.baName.length > 0 &&
    /^https:\/\/api\.eia\.gov\/v2\/electricity\/rto\//.test(input.sourceApiUrl) &&
    !/[?&]api_key=/i.test(input.sourceApiUrl) &&
    Number.isFinite(input.retrievedAt)
    ? 95
    : 60
}

async function fetchEiaJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json', 'user-agent': 'AtlaszIntel/0.4 (local-first grid intelligence; official EIA API)' },
  })
  assertOk(response, 'EIA balancing authorities')
  return (await response.json()) as T
}

function facetUrl(apiBase: string, apiKey?: string): string {
  const url = new URL(`${apiBase.replace(/\/$/, '')}/${FACET_ROUTE}`)
  if (apiKey) url.searchParams.set('api_key', apiKey)
  return url.toString()
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

export const EIA_BALANCING_AUTHORITY_SOURCE_ID = SOURCE_ID
export { BA_NERC_REGION }
