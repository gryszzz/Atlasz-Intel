/*
 * UN Comtrade reference catalog layer.
 *
 * Fetches and parses the official public reference files (no key required):
 *   - Reporters.json      (reporting countries)
 *   - partnerAreas.json   (partner countries/areas)
 *   - <classification>.json e.g. HS.json / H6.json (commodity codes + descriptions)
 * Trade flows have no downloadable reference file; UN documents a small fixed
 * canonical set (M/X/RM/RX/…), provided here as a built-in reference (not invented
 * data — these are the official flow codes).
 *
 * Each catalog snapshot carries source URL + retrievedAt + a content hash so the
 * "all commodities" coverage is discovered from the catalog, never hardcoded.
 * Malformed rows are dropped, never repaired. HTTP failures fail closed.
 */
import { asString, sha256, stableStringify } from './adapterShared'
import { assertOk } from '../fetchPolicy'

const REFERENCE_BASE = 'https://comtradeapi.un.org/files/v1/app/reference'

export type ComtradeCatalogKind = 'reporters' | 'partners' | 'flows' | 'commodities'

export type ComtradeCatalogEntry = {
  code: string
  text: string
  iso3?: string
  isGroup?: boolean
  /** Commodity classification depth (2/4/6 digit) where applicable. */
  aggrLevel?: number
  isLeaf?: boolean
}

export type ComtradeCatalog = {
  kind: ComtradeCatalogKind
  /** Classification code for commodity catalogs (HS, H6, …). */
  classification?: string
  entries: ComtradeCatalogEntry[]
  sourceUrl: string
  retrievedAt: number
  rawPayloadHash: string
}

// Official UN Comtrade trade-flow (MOT/flow) codes — fixed canonical reference.
const FLOW_REFERENCE: Array<{ code: string; text: string }> = [
  { code: 'M', text: 'Import' },
  { code: 'X', text: 'Export' },
  { code: 'RM', text: 'Re-import' },
  { code: 'RX', text: 'Re-export' },
  { code: 'MIP', text: 'Import of goods for inward processing' },
  { code: 'XIP', text: 'Export of goods for inward processing' },
  { code: 'MOP', text: 'Import of goods for outward processing' },
  { code: 'XOP', text: 'Export of goods for outward processing' },
]

export function flowsCatalog(now = Date.now()): ComtradeCatalog {
  const entries = FLOW_REFERENCE.map((flow) => ({ code: flow.code, text: flow.text }))
  return {
    kind: 'flows',
    entries,
    sourceUrl: 'https://comtradeapi.un.org/ (documented flow codes)',
    retrievedAt: now,
    rawPayloadHash: sha256(stableStringify(entries)),
  }
}

/** Pure parser for the Reporters.json reference file. */
export function parseReporters(payload: unknown, options: { retrievedAt?: number } = {}): ComtradeCatalog {
  const results = resultsArray(payload)
  const entries: ComtradeCatalogEntry[] = []
  const seen = new Set<string>()
  for (const row of results) {
    const record = asObject(row)
    if (!record) continue
    const code = codeValue(record.reporterCode ?? record.id)
    const text = asString(record.reporterDesc ?? record.text)
    if (!code || !text || seen.has(code)) continue
    seen.add(code)
    entries.push({
      code,
      text,
      iso3: asString(record.reporterCodeIsoAlpha3) || undefined,
      isGroup: record.isGroup === true,
    })
  }
  return finalizeCatalog('reporters', undefined, entries, `${REFERENCE_BASE}/Reporters.json`, options.retrievedAt)
}

/** Pure parser for the partnerAreas.json reference file (capitalized PartnerCode). */
export function parsePartners(payload: unknown, options: { retrievedAt?: number } = {}): ComtradeCatalog {
  const results = resultsArray(payload)
  const entries: ComtradeCatalogEntry[] = []
  const seen = new Set<string>()
  for (const row of results) {
    const record = asObject(row)
    if (!record) continue
    const code = codeValue(record.PartnerCode ?? record.partnerCode ?? record.id)
    const text = asString(record.PartnerDesc ?? record.partnerDesc ?? record.text)
    if (!code || !text || seen.has(code)) continue
    seen.add(code)
    entries.push({
      code,
      text,
      iso3: asString(record.PartnerCodeIsoAlpha3 ?? record.partnerCodeIsoAlpha3) || undefined,
      isGroup: record.isGroup === true,
    })
  }
  return finalizeCatalog('partners', undefined, entries, `${REFERENCE_BASE}/partnerAreas.json`, options.retrievedAt)
}

/** Pure parser for a classification commodity reference file (HS.json, H6.json, …). */
export function parseCommodities(
  payload: unknown,
  options: { classification?: string; retrievedAt?: number } = {},
): ComtradeCatalog {
  const record = asObject(payload)
  const classification = options.classification ?? (asString(record?.classCode) || 'HS')
  const results = resultsArray(payload)
  const entries: ComtradeCatalogEntry[] = []
  const seen = new Set<string>()
  for (const row of results) {
    const item = asObject(row)
    if (!item) continue
    const code = codeValue(item.id)
    const text = asString(item.text)
    if (!code || !text || seen.has(code)) continue
    seen.add(code)
    entries.push({
      code,
      text,
      aggrLevel: typeof item.aggrLevel === 'number' ? item.aggrLevel : Number(item.aggrLevel) || undefined,
      isLeaf: item.isLeaf === '1' || item.isLeaf === 1 || item.isLeaf === true,
    })
  }
  return finalizeCatalog('commodities', classification, entries, `${REFERENCE_BASE}/${classification}.json`, options.retrievedAt)
}

export async function fetchComtradeCatalog(
  kind: 'reporters' | 'partners',
  signal: AbortSignal,
  options: { now?: number } = {},
): Promise<ComtradeCatalog> {
  const url = kind === 'reporters' ? `${REFERENCE_BASE}/Reporters.json` : `${REFERENCE_BASE}/partnerAreas.json`
  const payload = await fetchReferenceJson(url, signal)
  const retrievedAt = options.now ?? Date.now()
  return kind === 'reporters' ? parseReporters(payload, { retrievedAt }) : parsePartners(payload, { retrievedAt })
}

export async function fetchCommodityCatalog(
  classification: string,
  signal: AbortSignal,
  options: { now?: number } = {},
): Promise<ComtradeCatalog> {
  const cls = sanitizeClassification(classification)
  const url = `${REFERENCE_BASE}/${cls}.json`
  const payload = await fetchReferenceJson(url, signal)
  return parseCommodities(payload, { classification: cls, retrievedAt: options.now ?? Date.now() })
}

/** Commodity codes eligible for ingestion at a given digit level (leaf codes by default). */
export function commodityCodesForLevel(catalog: ComtradeCatalog, options: { aggrLevel?: number; leafOnly?: boolean } = {}): string[] {
  const leafOnly = options.leafOnly ?? true
  return catalog.entries
    .filter((entry) => entry.code !== 'TOTAL')
    .filter((entry) => (options.aggrLevel === undefined ? true : entry.aggrLevel === options.aggrLevel))
    .filter((entry) => (leafOnly ? entry.isLeaf !== false : true))
    .map((entry) => entry.code)
}

async function fetchReferenceJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
  assertOk(response, 'UN Comtrade reference')
  const text = await response.text()
  if (!text.trim().startsWith('{')) {
    throw new Error(`UN Comtrade reference non-JSON response from ${url}`)
  }
  return JSON.parse(text) as unknown
}

function finalizeCatalog(
  kind: ComtradeCatalogKind,
  classification: string | undefined,
  entries: ComtradeCatalogEntry[],
  sourceUrl: string,
  retrievedAt = Date.now(),
): ComtradeCatalog {
  return {
    kind,
    classification,
    entries,
    sourceUrl,
    retrievedAt,
    rawPayloadHash: sha256(stableStringify(entries)),
  }
}

function resultsArray(payload: unknown): unknown[] {
  const record = asObject(payload)
  const results = record?.results
  return Array.isArray(results) ? results : []
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/** Coerce a code that may arrive as a number (reporterCode: 4) or string ("010119"). */
function codeValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeClassification(value: string): string {
  // Only allow short alphanumerics so a classification can't smuggle a path.
  return /^[A-Za-z0-9]{1,6}$/.test(value) ? value : 'HS'
}

export const COMTRADE_REFERENCE_BASE = REFERENCE_BASE
