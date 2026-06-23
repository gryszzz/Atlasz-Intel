/*
 * Crossref DOI metadata adapter (Works endpoint, topic-narrow).
 *
 * Official Crossref REST API. No key required. Optional ATLASZ_CROSSREF_MAILTO
 * is sent as the polite-pool query param on requests only and stripped from
 * persisted/displayed URLs. Metadata only - no full-text scraping, no technical
 * claim validation, no citation-quality claim, and no market inference.
 *
 * Start narrow: explicit topic buckets, recent works only, bounded rows per
 * bucket. Malformed rows dropped (never repaired); HTTP/schema/rate-limit fail
 * closed.
 *
 * provenance: official-api   category: doi-metadata
 */
import { adapterEventId, asNumber, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { CrossrefWork, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'crossref_works_public'
const SOURCE_NAME = 'Crossref'
const DEFAULT_API_BASE = 'https://api.crossref.org/works'
const DEFAULT_ROWS_PER_BUCKET = 5
const MAX_ROWS_PER_BUCKET = 50
const DEFAULT_LOOKBACK_DAYS = 60
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000

const DEFAULT_QUERY_BUCKETS = [
  'semiconductors',
  'AI accelerators',
  'batteries',
  'cybersecurity',
  'supply chain',
]

export type CrossrefConfig = {
  apiBase: string
  mailto?: string
  queryBuckets: string[]
  rowsPerBucket: number
  lookbackDays: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readCrossrefConfig(env: NodeJS.ProcessEnv = process.env): CrossrefConfig | null {
  if (env.ATLASZ_CROSSREF_DISABLE === '1') {
    return null
  }
  const apiBase = asString(env.ATLASZ_CROSSREF_API_BASE) || DEFAULT_API_BASE
  if (!isOfficialCrossrefWorksUrl(apiBase)) {
    return null
  }
  const mailto = asString(env.ATLASZ_CROSSREF_MAILTO)
  return {
    apiBase,
    mailto: isLikelyEmail(mailto) ? mailto : undefined,
    queryBuckets: parseBuckets(env.ATLASZ_CROSSREF_TOPICS) ?? DEFAULT_QUERY_BUCKETS,
    rowsPerBucket: clampInt(Number(env.ATLASZ_CROSSREF_ROWS ?? DEFAULT_ROWS_PER_BUCKET), 1, MAX_ROWS_PER_BUCKET),
    lookbackDays: clampInt(Number(env.ATLASZ_CROSSREF_LOOKBACK_DAYS ?? DEFAULT_LOOKBACK_DAYS), 1, 365),
    timeoutMs: clampInt(Number(env.ATLASZ_CROSSREF_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_CROSSREF_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_CROSSREF_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchCrossrefWorks(
  signal: AbortSignal,
  config = readCrossrefConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const out: CrossrefWork[] = []
  for (const bucket of config.queryBuckets) {
    const retrievedAt = Date.now()
    const requestUrl = buildRequestUrl(config, bucket)
    const sourceApiUrl = sanitizeUrl(requestUrl)
    const payload = await fetchWithRetry(
      (attemptSignal) => fetchCrossrefJson(requestUrl, linkedSignal(signal, attemptSignal)),
      { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
    )
    out.push(...parseCrossrefWorks(payload, { retrievedAt, sourceApiUrl, queryBucket: bucket }))
  }
  return normalizeCrossrefWorks(out)
}

async function fetchCrossrefJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 (local-first research metadata; +https://github.com/gryszzz/Atlasz-Intel)',
    },
  })
  assertOk(response, 'Crossref')
  return response.json() as Promise<unknown>
}

/** Pure parser - accepts Crossref /works lists and /works/{doi} single records. */
export function parseCrossrefWorks(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; queryBucket?: string } = {},
): CrossrefWork[] {
  const message = asObject(asObject(payload)?.message)
  if (!message) return []
  const rows = Array.isArray(message.items) ? message.items : message.DOI ? [message] : []
  if (rows.length === 0) return []

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = sanitizeUrl(options.sourceApiUrl ?? DEFAULT_API_BASE)
  const queryBucket = (options.queryBucket ?? '').slice(0, 80)
  const seen = new Set<string>()
  const out: CrossrefWork[] = []

  for (const row of rows) {
    const record = asObject(row)
    if (!record) continue
    const doi = normalizeDoi(asString(record.DOI))
    const title = collapse(firstString(record.title)).slice(0, 500)
    if (!hasValidWork({ doi, title, sourceApiUrl, retrievedAt })) {
      continue
    }
    if (seen.has(doi)) continue
    seen.add(doi)

    const publisher = collapse(asString(record.publisher)).slice(0, 180) || undefined
    const containerTitle = collapse(firstString(record['container-title'])).slice(0, 240) || undefined
    const issuedDate = datePartsToLabel(asObject(record.issued))
    const publishedDate =
      datePartsToLabel(asObject(record.published)) ??
      datePartsToLabel(asObject(record['published-online'])) ??
      datePartsToLabel(asObject(record['published-print']))
    const url = httpsOrUndefined(asString(record.URL))
    const licenseUrls = extractLicenseUrls(record.license)
    const funders = extractFunders(record.funder)
    const subjects = extractStrings(record.subject, 8)
    const referenceCount = asNumber(record['reference-count'] ?? record['references-count'])
    const isReferencedByCount = asNumber(record['is-referenced-by-count'])

    const rawPayloadJson = stableStringify({
      DOI: doi,
      title,
      type: asString(record.type),
      publisher,
      container_title: containerTitle,
      issued: issuedDate,
      published: publishedDate,
      URL: url,
      license_urls: licenseUrls,
      funders,
      subjects,
      reference_count: referenceCount,
      is_referenced_by_count: isReferencedByCount,
      source: asString(record.source),
    })

    out.push({
      id: crossrefRecordId(doi),
      doi,
      doiUrl: `https://doi.org/${doi}`,
      title,
      type: asString(record.type) || 'unknown',
      publisher,
      containerTitle,
      issuedDate,
      publishedDate,
      url,
      licenseUrls,
      funders,
      subjects,
      referenceCount,
      isReferencedByCount,
      queryBucket,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForWork({ doi, title, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

export function normalizeCrossrefWorks(records: CrossrefWork[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: CrossrefWork): WorldIntelEvent {
  const dedupeKey = `crossref|${record.doi}`.toLowerCase()
  const venueNote = record.containerTitle ? ` Venue: ${record.containerTitle}.` : ''
  const publisherNote = record.publisher ? ` Publisher: ${record.publisher}.` : ''
  const countNote =
    record.isReferencedByCount !== undefined
      ? ` Referenced-by count: ${record.isReferencedByCount} (metadata, not quality).`
      : ''
  const summary =
    `Crossref DOI registry metadata (${record.issuedDate ?? record.publishedDate ?? 'date unknown'}): "${record.title}".${publisherNote}${venueNote}${countNote} ` +
    'DOI registry metadata, not validation of research claims, technical merit, citation quality, or market impact.'
  const observedAt = dateLabelToTimestamp(record.issuedDate ?? record.publishedDate) ?? record.retrievedAt

  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: observedAt,
    title: `DOI metadata: ${record.title}`.slice(0, 180),
    summary,
    countryCodes: [],
    region: 'global',
    category: 'doi-metadata',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceApiUrl,
    provenance: 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.publisher ?? '', record.containerTitle ?? '', ...record.funders, ...record.subjects].slice(0, 16)),
    narrativeTags: unique(['Crossref', 'DOI metadata', record.queryBucket].filter(Boolean)),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    crossrefWork: record,
  }
}

function buildRequestUrl(config: CrossrefConfig, bucket: string): string {
  const since = new Date(Date.now() - config.lookbackDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url = new URL(config.apiBase)
  url.searchParams.set('query', bucket)
  url.searchParams.set('filter', `from-pub-date:${since}`)
  url.searchParams.set('rows', String(config.rowsPerBucket))
  if (config.mailto) {
    url.searchParams.set('mailto', config.mailto)
  }
  return url.toString()
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value)
    url.searchParams.delete('mailto')
    return url.toString()
  } catch {
    return value
  }
}

function normalizeDoi(value: string): string {
  if (!value) return ''
  const doi = value.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim().toLowerCase()
  return /^10\.\d{4,}\//.test(doi) ? doi : ''
}

function hasValidWork(input: { doi: string; title: string; sourceApiUrl: string; retrievedAt: number }): boolean {
  return Boolean(
    input.doi &&
      input.title &&
      /^https:\/\/api\.crossref\.org\/works(?:\?|$)/i.test(input.sourceApiUrl) &&
      !/[?&]mailto=/i.test(input.sourceApiUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForWork(input: Parameters<typeof hasValidWork>[0]): number {
  return hasValidWork(input) ? 96 : 60
}

function crossrefRecordId(doi: string): string {
  return `${SOURCE_ID}:${sha256(doi).slice(0, 24)}`
}

function datePartsToLabel(value: Record<string, unknown> | null): string | undefined {
  const parts = Array.isArray(value?.['date-parts']) ? (value?.['date-parts'] as unknown[])[0] : undefined
  if (!Array.isArray(parts)) return undefined
  const year = asNumber(parts[0])
  if (!year || year < 1000) return undefined
  const month = asNumber(parts[1])
  const day = asNumber(parts[2])
  if (!month) return String(year)
  if (month < 1 || month > 12) return String(year)
  const monthText = String(month).padStart(2, '0')
  if (!day) return `${year}-${monthText}`
  if (day < 1 || day > 31) return `${year}-${monthText}`
  return `${year}-${monthText}-${String(day).padStart(2, '0')}`
}

function dateLabelToTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parts = value.split('-')
  const normalized = parts.length === 1 ? `${value}-01-01` : parts.length === 2 ? `${value}-01` : value
  const ts = Date.parse(`${normalized}T00:00:00Z`)
  return Number.isFinite(ts) ? ts : undefined
}

function extractLicenseUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const urls: string[] = []
  for (const item of value) {
    const url = httpsOrUndefined(asString(asObject(item)?.URL))
    if (url) urls.push(url)
  }
  return unique(urls).slice(0, 6)
}

function extractFunders(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const name = collapse(asString(asObject(item)?.name))
    if (name) out.push(name)
  }
  return unique(out).slice(0, 8)
}

function extractStrings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return unique(value.map((item) => collapse(asString(item))).filter(Boolean)).slice(0, limit)
}

function firstString(value: unknown): string {
  if (Array.isArray(value)) return asString(value[0])
  return asString(value)
}

function parseBuckets(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const buckets = value.split(',').map((b) => b.trim()).filter(Boolean)
  return buckets.length > 0 ? unique(buckets) : undefined
}

function httpsOrUndefined(value: string): string | undefined {
  return /^https:\/\//i.test(value) ? value : undefined
}

function isOfficialCrossrefWorksUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'api.crossref.org' && url.pathname.replace(/\/$/, '') === '/works'
  } catch {
    return false
  }
}

function isLikelyEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, child: AbortSignal): AbortSignal {
  if (parent.aborted) return parent
  if (child.aborted) return child
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  child.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export const CROSSREF_WORKS_SOURCE_ID = SOURCE_ID
