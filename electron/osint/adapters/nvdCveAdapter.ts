/*
 * NVD CVE vulnerability intelligence adapter.
 *
 * Uses the official NIST NVD 2.0 vulnerabilities API
 * (https://nvd.nist.gov/developers/vulnerabilities). Defensive vulnerability
 * intelligence only: no scanning, no exploitation logic, no payloads, no active
 * target collection, no person enrichment.
 *
 * The API is public; an optional API key (ATLASZ_NVD_API_KEY) raises rate limits
 * and is sent ONLY as a request header, never placed in any persisted URL or
 * source trail. Missing/malformed records are dropped, never repaired. On HTTP
 * failure, rate limiting, or disabled config the fetch throws / returns [] so the
 * ingest layer surfaces DATA_UNAVAILABLE rather than fabricating CVEs.
 *
 * Each CVE is cross-linked to the CISA KEV catalog (by exact CVE ID) so the UI
 * can show a KEV badge; exploitability is implied ONLY when KEV or official
 * references support it.
 *
 * provenance: official-api   category: cyber-advisory
 */
import {
  adapterEventId,
  asNumber,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { fetchKevCveIdSet, readKevConfig } from './cisaKevAdapter'
import { assertOk } from '../fetchPolicy'
import type { NvdCve, NvdCvssMetric, NvdReference, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'nvd_cve_public'
const NVD_SOURCE_NAME = 'NIST National Vulnerability Database'
const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
const NVD_DETAIL_BASE = 'https://nvd.nist.gov/vuln/detail'
const DEFAULT_RESULTS_PER_PAGE = 25
const MAX_RESULTS_PER_PAGE = 100
const DEFAULT_LOOKBACK_DAYS = 7
const MAX_LOOKBACK_DAYS = 120 // NVD caps a single date range at 120 days.
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/
const CWE_PATTERN = /^CWE-\d+$/

export type NvdAdapterConfig = {
  baseUrl: string
  apiKey?: string
  resultsPerPage: number
  lookbackDays: number
  linkKev: boolean
}

type NvdApiPayload = {
  vulnerabilities?: Array<{ cve?: Record<string, unknown> }>
}

export function readNvdConfig(env: NodeJS.ProcessEnv = process.env): NvdAdapterConfig | null {
  // Public, unauthenticated official API: configured by default, opt-out only.
  if (env.ATLASZ_NVD_DISABLE === '1') {
    return null
  }
  const baseUrl = asString(env.ATLASZ_NVD_BASE_URL) || NVD_API_BASE
  if (!/^https:\/\//i.test(baseUrl)) {
    return null
  }
  const apiKey = asString(env.ATLASZ_NVD_API_KEY) || undefined
  const resultsPerPage = clampInteger(
    Number(env.ATLASZ_NVD_RESULTS_PER_PAGE ?? DEFAULT_RESULTS_PER_PAGE),
    1,
    MAX_RESULTS_PER_PAGE,
  )
  const lookbackDays = clampInteger(
    Number(env.ATLASZ_NVD_LOOKBACK_DAYS ?? DEFAULT_LOOKBACK_DAYS),
    1,
    MAX_LOOKBACK_DAYS,
  )
  const linkKev = env.ATLASZ_NVD_LINK_KEV !== '0'
  return { baseUrl, apiKey, resultsPerPage, lookbackDays, linkKev }
}

export async function fetchNvdCves(
  signal: AbortSignal,
  config = readNvdConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const now = Date.now()
  const requestUrl = buildNvdRequestUrl(config, now)
  const headers: Record<string, string> = { accept: 'application/json' }
  // API key travels ONLY in the header; it is never persisted in a source trail.
  if (config.apiKey) {
    headers.apiKey = config.apiKey
  }

  const response = await fetch(requestUrl, { signal, headers })
  assertOk(response, 'NVD')
  const payload = (await response.json()) as unknown

  // Best-effort KEV cross-link; a KEV outage never blocks NVD intelligence.
  let knownExploitedCveIds = new Set<string>()
  if (config.linkKev) {
    knownExploitedCveIds = await fetchKevCveIdSet(signal, readKevConfig())
  }

  const records = parseNvdResponse(payload, {
    retrievedAt: now,
    sourceApiUrl: sanitizedApiUrl(config),
    knownExploitedCveIds,
  })
  return normalizeNvdCves(records)
}

/** Pure normalizer — testable with fixture NVD 2.0 payloads. */
export function parseNvdResponse(
  payload: unknown,
  options: {
    retrievedAt?: number
    sourceApiUrl?: string
    knownExploitedCveIds?: Set<string>
  } = {},
): NvdCve[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload as NvdApiPayload
  const rows = Array.isArray(body.vulnerabilities) ? body.vulnerabilities : []
  if (rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? NVD_API_BASE
  const kevIds = options.knownExploitedCveIds ?? new Set<string>()
  const records: NvdCve[] = []

  for (const row of rows) {
    const cve = row?.cve
    if (!cve || typeof cve !== 'object') {
      continue
    }
    const cveId = asString(cve.id).toUpperCase()
    const sourceIdentifier = asString(cve.sourceIdentifier)
    const published = asString(cve.published)
    const lastModified = asString(cve.lastModified)
    const vulnStatus = asString(cve.vulnStatus) || 'Unknown'
    const description = englishDescription(cve.descriptions)
    const sourceUrl = `${NVD_DETAIL_BASE}/${cveId}`
    const publishedTimestamp = Date.parse(published)
    const lastModifiedTimestamp = Date.parse(lastModified)

    if (
      !hasValidNvdRecord({
        cveId,
        sourceIdentifier,
        publishedTimestamp,
        lastModifiedTimestamp,
        sourceUrl,
        retrievedAt,
      })
    ) {
      continue // Drop malformed records; never repair.
    }

    const cvss = primaryCvssMetric(cve.metrics)
    const cweIds = extractCweIds(cve.weaknesses)
    const vendorProducts = extractVendorProducts(cve.configurations)
    const references = extractReferences(cve.references)
    const inKnownExploitedCatalog = kevIds.has(cveId)

    const rawRecord = {
      cveId,
      sourceIdentifier,
      published,
      lastModified,
      vulnStatus,
      description,
      cvss,
      cweIds,
      vendorProducts,
      references,
      sourceUrl,
      sourceApiUrl,
      inKnownExploitedCatalog,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    records.push({
      id: nvdRecordId(cveId),
      cveId,
      sourceIdentifier,
      published,
      publishedTimestamp,
      lastModified,
      lastModifiedTimestamp,
      vulnStatus,
      description,
      cvss,
      cweIds,
      vendorProducts,
      references,
      sourceUrl,
      sourceApiUrl,
      sourceName: NVD_SOURCE_NAME,
      retrievedAt,
      inKnownExploitedCatalog,
      provenance: 'official-api',
      confidence: confidenceForNvdRecord({
        cveId,
        sourceIdentifier,
        publishedTimestamp,
        lastModifiedTimestamp,
        sourceUrl,
        retrievedAt,
      }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  records.sort((a, b) => b.lastModifiedTimestamp - a.lastModifiedTimestamp)
  return records
}

export function normalizeNvdCves(records: NvdCve[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: NvdCve): WorldIntelEvent {
  const dedupeKey = `nvd|${record.cveId}`.toLowerCase()
  const severityNote = record.cvss
    ? ` CVSS ${record.cvss.version} ${record.cvss.baseScore} (${record.cvss.baseSeverity}).`
    : ' CVSS not yet assigned.'
  const kevNote = record.inKnownExploitedCatalog
    ? ' Listed in the CISA Known Exploited Vulnerabilities catalog (active exploitation confirmed).'
    : ''
  const productNote = record.vendorProducts.length > 0 ? ` Affected: ${record.vendorProducts.slice(0, 4).join(', ')}.` : ''
  const summary =
    `${record.cveId} (${record.vulnStatus}) published ${record.published.slice(0, 10)}.${severityNote}` +
    `${productNote}${kevNote} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: record.cvss
      ? `${record.cveId} — ${record.cvss.baseSeverity} (CVSS ${record.cvss.baseScore})`
      : `${record.cveId} — ${record.vulnStatus}`,
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.publishedTimestamp,
    category: 'cyber-advisory',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    // CVEs map to software vendors/products, never tradable tickers.
    affectedAssets: [],
    narrativeTags: unique([
      'NVD CVE',
      record.vulnStatus,
      record.cvss?.baseSeverity ?? '',
      record.inKnownExploitedCatalog ? 'CISA KEV' : '',
      ...record.cweIds,
    ]),
    extractedEntities: unique([record.cveId, ...record.vendorProducts, ...record.cweIds]),
  })

  return {
    ...event,
    confidence: record.confidence,
    nvdCve: record,
  }
}

function englishDescription(value: unknown): string {
  if (!Array.isArray(value)) {
    return ''
  }
  for (const entry of value) {
    if (entry && typeof entry === 'object' && asString((entry as Record<string, unknown>).lang) === 'en') {
      return asString((entry as Record<string, unknown>).value)
    }
  }
  // Fall back to the first description if no English one is present.
  const first = value[0]
  return first && typeof first === 'object' ? asString((first as Record<string, unknown>).value) : ''
}

/** Prefer CVSS v3.1, then v3.0, then v2.0. Returns undefined when none exist. */
export function primaryCvssMetric(metrics: unknown): NvdCvssMetric | undefined {
  if (!metrics || typeof metrics !== 'object') {
    return undefined
  }
  const body = metrics as Record<string, unknown>
  const order: Array<{ key: string; version: string }> = [
    { key: 'cvssMetricV31', version: '3.1' },
    { key: 'cvssMetricV30', version: '3.0' },
    { key: 'cvssMetricV2', version: '2.0' },
  ]
  for (const { key, version } of order) {
    const list = body[key]
    if (!Array.isArray(list) || list.length === 0) {
      continue
    }
    // Prefer the Primary metric when multiple sources are present.
    const primary = list.find((item) => item && typeof item === 'object' && asString((item as Record<string, unknown>).type) === 'Primary') ?? list[0]
    const metric = primary as Record<string, unknown>
    const cvssData = (metric.cvssData ?? {}) as Record<string, unknown>
    const baseScore = asNumber(cvssData.baseScore)
    if (baseScore === undefined) {
      continue
    }
    const baseSeverity =
      asString(cvssData.baseSeverity).toUpperCase() || asString(metric.baseSeverity).toUpperCase() || severityFromScore(baseScore)
    return {
      version,
      vectorString: asString(cvssData.vectorString) || undefined,
      baseScore,
      baseSeverity,
      source: asString(metric.source) || undefined,
      type: asString(metric.type) || undefined,
    }
  }
  return undefined
}

export function extractCweIds(weaknesses: unknown): string[] {
  if (!Array.isArray(weaknesses)) {
    return []
  }
  const ids: string[] = []
  for (const weakness of weaknesses) {
    const descriptions = (weakness as Record<string, unknown>)?.description
    if (!Array.isArray(descriptions)) {
      continue
    }
    for (const entry of descriptions) {
      const value = asString((entry as Record<string, unknown>)?.value).toUpperCase()
      if (CWE_PATTERN.test(value)) {
        ids.push(value)
      }
    }
  }
  return unique(ids)
}

/** Extract "vendor:product" pairs from CPE criteria, only when safely present. */
export function extractVendorProducts(configurations: unknown): string[] {
  if (!Array.isArray(configurations)) {
    return []
  }
  const pairs: string[] = []
  for (const configuration of configurations) {
    const nodes = (configuration as Record<string, unknown>)?.nodes
    if (!Array.isArray(nodes)) {
      continue
    }
    for (const node of nodes) {
      const cpeMatch = (node as Record<string, unknown>)?.cpeMatch
      if (!Array.isArray(cpeMatch)) {
        continue
      }
      for (const match of cpeMatch) {
        const criteria = asString((match as Record<string, unknown>)?.criteria)
        // cpe:2.3:<part>:<vendor>:<product>:<version>:...
        const parts = criteria.split(':')
        if (parts.length < 5 || parts[0] !== 'cpe') {
          continue
        }
        const vendor = parts[3]
        const product = parts[4]
        if (!vendor || !product || vendor === '*' || product === '*') {
          continue // Only emit vendor/product when safely available.
        }
        pairs.push(`${vendor}:${product}`)
      }
    }
  }
  return unique(pairs)
}

function extractReferences(references: unknown): NvdReference[] {
  if (!Array.isArray(references)) {
    return []
  }
  const out: NvdReference[] = []
  for (const reference of references) {
    const url = asString((reference as Record<string, unknown>)?.url)
    if (!/^https?:\/\//i.test(url)) {
      continue
    }
    const tagsValue = (reference as Record<string, unknown>)?.tags
    const tags = Array.isArray(tagsValue) ? unique(tagsValue.map((tag) => asString(tag))) : []
    out.push({ url, source: asString((reference as Record<string, unknown>)?.source) || undefined, tags })
  }
  return out.slice(0, 12)
}

function hasValidNvdRecord(input: {
  cveId: string
  sourceIdentifier: string
  publishedTimestamp: number
  lastModifiedTimestamp: number
  sourceUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    CVE_PATTERN.test(input.cveId) &&
      input.sourceIdentifier &&
      Number.isFinite(input.publishedTimestamp) &&
      Number.isFinite(input.lastModifiedTimestamp) &&
      /^https:\/\/nvd\.nist\.gov\/vuln\/detail\/CVE-\d{4}-\d{4,}$/.test(input.sourceUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForNvdRecord(input: {
  cveId: string
  sourceIdentifier: string
  publishedTimestamp: number
  lastModifiedTimestamp: number
  sourceUrl: string
  retrievedAt: number
}): number {
  return hasValidNvdRecord(input) ? 96 : 60
}

function severityFromScore(score: number): string {
  if (score >= 9) return 'CRITICAL'
  if (score >= 7) return 'HIGH'
  if (score >= 4) return 'MEDIUM'
  if (score > 0) return 'LOW'
  return 'NONE'
}

function buildNvdRequestUrl(config: NvdAdapterConfig, now: number): string {
  const url = new URL(config.baseUrl)
  url.searchParams.set('resultsPerPage', String(config.resultsPerPage))
  const end = new Date(now)
  const start = new Date(now - config.lookbackDays * 24 * 60 * 60 * 1000)
  url.searchParams.set('lastModStartDate', start.toISOString())
  url.searchParams.set('lastModEndDate', end.toISOString())
  return url.toString()
}

/** API URL retained in the source trail — never contains the API key. */
function sanitizedApiUrl(config: NvdAdapterConfig): string {
  const url = new URL(config.baseUrl)
  url.searchParams.set('resultsPerPage', String(config.resultsPerPage))
  return url.toString()
}

function nvdRecordId(cveId: string): string {
  return `${SOURCE_ID}:${cveId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const NVD_SOURCE_ID = SOURCE_ID
