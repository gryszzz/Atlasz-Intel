/*
 * OpenAlex research-intelligence adapter (Works endpoint, catalog-narrow).
 *
 * Official OpenAlex API. Requires ATLASZ_OPENALEX_API_KEY and fails closed without
 * it. The key travels as the `api_key` query param on the request only and is
 * stripped from every persisted/displayed URL. Metadata only - NOT a validation of
 * any technical claim, breakthrough, or market signal. Authors are kept minimal and
 * source-bounded (no person enrichment). citedByCount is metadata, not quality.
 *
 * Start narrow: an explicit topic-bucket allowlist, recent works only, bounded per
 * bucket. Malformed rows dropped (never repaired); HTTP/schema/rate-limit fail closed.
 *
 * provenance: official-api   category: research
 */
import { adapterEventId, asNumber, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { OpenAlexChangeType, OpenAlexWork, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'openalex_works_public'
const SOURCE_NAME = 'OpenAlex'
const DEFAULT_API_BASE = 'https://api.openalex.org/works'
const DEFAULT_MAX_AUTHORS = 4
const DEFAULT_PER_BUCKET = 10
const MAX_PER_BUCKET = 50
const DEFAULT_LOOKBACK_DAYS = 30
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const OPENALEX_ID_PATTERN = /^W\d+$/
const OPENALEX_URL_PATTERN = /^https:\/\/openalex\.org\/W\d+$/

// Explicit topic buckets - Atlasz controls the queries; OpenAlex does not push topics.
const DEFAULT_TOPIC_BUCKETS = [
  'semiconductors',
  'EUV lithography',
  'AI accelerators',
  'silicon photonics',
  'batteries',
  'grid storage',
  'nuclear energy',
  'LNG',
  'cybersecurity',
  'supply chain',
]

export type OpenAlexConfig = {
  apiBase: string
  apiKey: string
  topicBuckets: string[]
  perBucket: number
  maxAuthors: number
  lookbackDays: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readOpenAlexConfig(env: NodeJS.ProcessEnv = process.env): OpenAlexConfig | null {
  if (env.ATLASZ_OPENALEX_DISABLE === '1') {
    return null
  }
  const apiKey = asString(env.ATLASZ_OPENALEX_API_KEY)
  if (!apiKey) {
    return null // key-gated: fail closed
  }
  const apiBase = asString(env.ATLASZ_OPENALEX_API_BASE) || DEFAULT_API_BASE
  if (!isOfficialOpenAlexWorksUrl(apiBase)) {
    return null
  }
  return {
    apiBase,
    apiKey,
    topicBuckets: parseBuckets(env.ATLASZ_OPENALEX_TOPICS) ?? DEFAULT_TOPIC_BUCKETS,
    perBucket: clampInt(Number(env.ATLASZ_OPENALEX_PER_BUCKET ?? DEFAULT_PER_BUCKET), 1, MAX_PER_BUCKET),
    maxAuthors: clampInt(Number(env.ATLASZ_OPENALEX_MAX_AUTHORS ?? DEFAULT_MAX_AUTHORS), 0, 25),
    lookbackDays: clampInt(Number(env.ATLASZ_OPENALEX_LOOKBACK_DAYS ?? DEFAULT_LOOKBACK_DAYS), 1, 365),
    timeoutMs: clampInt(Number(env.ATLASZ_OPENALEX_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_OPENALEX_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_OPENALEX_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchOpenAlexWorks(
  signal: AbortSignal,
  config = readOpenAlexConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const out: OpenAlexWork[] = []
  for (const bucket of config.topicBuckets) {
    const retrievedAt = Date.now()
    const requestUrl = buildRequestUrl(config, bucket)
    const sourceApiUrl = sanitizeUrl(requestUrl)
    const payload = await fetchWithRetry(
      (attemptSignal) => fetchOpenAlexJson(requestUrl, linkedSignal(signal, attemptSignal)),
      { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
    )
    out.push(...parseOpenAlexWorks(payload, { retrievedAt, sourceApiUrl, queryBucket: bucket, maxAuthors: config.maxAuthors }))
  }
  return normalizeOpenAlexWorks(out)
}

async function fetchOpenAlexJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
  assertOk(response, 'OpenAlex')
  return response.json() as Promise<unknown>
}

/** Pure parser - testable with official OpenAlex Works response fixtures. */
export function parseOpenAlexWorks(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; queryBucket?: string; maxAuthors?: number } = {},
): OpenAlexWork[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { results?: unknown }).results
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = sanitizeUrl(options.sourceApiUrl ?? DEFAULT_API_BASE)
  const queryBucket = (options.queryBucket ?? '').slice(0, 80)
  const maxAuthors = options.maxAuthors ?? DEFAULT_MAX_AUTHORS
  const seen = new Set<string>()
  const out: OpenAlexWork[] = []

  for (const row of rows) {
    const record = asObject(row)
    if (!record) continue
    const openAlexWorkId = extractWorkId(asString(record.id) || asString(asObject(record.ids)?.openalex))
    const title = collapse(asString(record.title) || asString(record.display_name)).slice(0, 400)
    const openAlexUrl = openAlexWorkId ? `https://openalex.org/${openAlexWorkId}` : ''
    const publicationDate = validDate(asString(record.publication_date))
    const publicationYear = asNumber(record.publication_year)

    if (!hasValidWork({ openAlexWorkId, title, openAlexUrl, sourceApiUrl, retrievedAt })) {
      continue // drop malformed; never repair
    }
    if (seen.has(openAlexWorkId)) continue
    seen.add(openAlexWorkId)

    const primaryLocation = asObject(record.primary_location)
    const venue = asString(asObject(primaryLocation?.source)?.display_name) || undefined
    const landingPageUrl = httpsOrUndefined(asString(primaryLocation?.landing_page_url))
    const doi = normalizeDoi(asString(record.doi))
    const { authors, institutions, institutionCountries } = extractAuthorships(record.authorships, maxAuthors)
    const topics = extractTopics(record.topics, record.primary_topic)
    const citedByCount = asNumber(record.cited_by_count)
    const isRetracted = record.is_retracted === true

    const rawPayloadJson = stableStringify({
      id: openAlexWorkId,
      doi,
      title,
      publication_year: publicationYear,
      publication_date: publicationDate,
      type: asString(record.type),
      venue,
      institutions,
      institution_countries: institutionCountries,
      topics,
      authors,
      cited_by_count: citedByCount,
      is_retracted: isRetracted,
    })

    out.push({
      id: openAlexRecordId(openAlexWorkId),
      openAlexWorkId,
      doi,
      title,
      publicationYear,
      publicationDate,
      type: asString(record.type) || 'unknown',
      venue,
      institutions,
      institutionCountries,
      topics,
      authors,
      citedByCount,
      isRetracted,
      landingPageUrl,
      doiUrl: doi ? `https://doi.org/${doi}` : undefined,
      openAlexUrl,
      queryBucket,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForWork({ openAlexWorkId, title, openAlexUrl, sourceApiUrl, retrievedAt }),
      changeType: 'first_seen',
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

export function normalizeOpenAlexWorks(records: OpenAlexWork[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

export function applyOpenAlexChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.openAlexWork) return event
  const prior = previous?.openAlexWork
  const changeType: OpenAlexChangeType = !prior
    ? 'new_today'
    : prior.rawPayloadHash === event.openAlexWork.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, openAlexWork: { ...event.openAlexWork, changeType } }
}

function toEvent(record: OpenAlexWork): WorldIntelEvent {
  const dedupeKey = `openalex|${record.openAlexWorkId}`.toLowerCase()
  const venueNote = record.venue ? ` Venue: ${record.venue}.` : ''
  const retractedNote = record.isRetracted ? ' Flagged retracted by OpenAlex.' : ''
  const topicNote = record.topics.length > 0 ? ` Topics: ${record.topics.slice(0, 3).join(', ')}.` : ''
  const summary =
    `OpenAlex research metadata (${record.publicationDate ?? record.publicationYear ?? 'date unknown'}): "${record.title}".${venueNote}${topicNote}${retractedNote} ` +
    `Research metadata, not validation of technical claims, breakthroughs, or market impact.`
  const observedAt = record.publicationDate ? Date.parse(`${record.publicationDate}T00:00:00Z`) : record.retrievedAt

  // Built directly so nothing is inferred from the title: no tickers, sectors,
  // commodities, currencies. Country comes ONLY from institution metadata.
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: Number.isFinite(observedAt) ? observedAt : record.retrievedAt,
    title: `Research: ${record.title}`.slice(0, 180),
    summary,
    countryCodes: record.institutionCountries.slice(0, 8),
    region: 'global',
    category: 'research',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.openAlexUrl,
    provenance: 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([...record.topics, ...record.institutions].slice(0, 12)),
    narrativeTags: unique(['OpenAlex', 'research metadata', record.queryBucket].filter(Boolean)),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    openAlexWork: record,
  }
}

function buildRequestUrl(config: OpenAlexConfig, bucket: string): string {
  const since = new Date(Date.now() - config.lookbackDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url = new URL(config.apiBase)
  url.searchParams.set('search', bucket)
  url.searchParams.set('filter', `from_publication_date:${since}`)
  url.searchParams.set('sort', 'publication_date:desc')
  url.searchParams.set('per-page', String(config.perBucket))
  // Select only the fields we normalize (bounded payload, no extra author surface).
  url.searchParams.set('select', 'id,doi,title,display_name,publication_year,publication_date,type,primary_location,authorships,topics,primary_topic,cited_by_count,is_retracted,ids')
  url.searchParams.set('api_key', config.apiKey) // stripped from sourceApiUrl
  return url.toString()
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value)
    url.searchParams.delete('api_key')
    return url.toString()
  } catch {
    return value
  }
}

function extractWorkId(value: string): string {
  const match = value.match(/W\d+/)
  return match ? match[0] : ''
}

function normalizeDoi(value: string): string | undefined {
  if (!value) return undefined
  const doi = value.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim()
  return /^10\.\d{4,}\//.test(doi) ? doi : undefined
}

function extractAuthorships(value: unknown, maxAuthors: number): { authors: string[]; institutions: string[]; institutionCountries: string[] } {
  const authors: string[] = []
  const institutions: string[] = []
  const countries: string[] = []
  if (Array.isArray(value)) {
    for (const entry of value) {
      const authorship = asObject(entry)
      if (!authorship) continue
      const author = asString(asObject(authorship.author)?.display_name)
      if (author) authors.push(author)
      if (Array.isArray(authorship.institutions)) {
        for (const inst of authorship.institutions) {
          const institution = asObject(inst)
          const name = asString(institution?.display_name)
          const country = asString(institution?.country_code)
          if (name) institutions.push(name)
          if (country) countries.push(country.toUpperCase())
        }
      }
    }
  }
  return {
    authors: unique(authors).slice(0, maxAuthors), // minimal, source-bounded
    institutions: unique(institutions).slice(0, 8),
    institutionCountries: unique(countries).slice(0, 8),
  }
}

function extractTopics(topics: unknown, primaryTopic: unknown): string[] {
  const out: string[] = []
  const primary = asString(asObject(primaryTopic)?.display_name)
  if (primary) out.push(primary)
  if (Array.isArray(topics)) {
    for (const topic of topics) {
      const name = asString(asObject(topic)?.display_name)
      if (name) out.push(name)
    }
  }
  return unique(out).slice(0, 6)
}

function hasValidWork(input: { openAlexWorkId: string; title: string; openAlexUrl: string; sourceApiUrl: string; retrievedAt: number }): boolean {
  return Boolean(
    OPENALEX_ID_PATTERN.test(input.openAlexWorkId) &&
      input.title &&
      OPENALEX_URL_PATTERN.test(input.openAlexUrl) &&
      /^https:\/\/api\.openalex\.org\/works(?:\?|$)/i.test(input.sourceApiUrl) &&
      !/api_key=/i.test(input.sourceApiUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForWork(input: Parameters<typeof hasValidWork>[0]): number {
  return hasValidWork(input) ? 96 : 60
}

function openAlexRecordId(workId: string): string {
  return `${SOURCE_ID}:${workId.toLowerCase()}`
}

function parseBuckets(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const buckets = value.split(',').map((b) => b.trim()).filter(Boolean)
  return buckets.length > 0 ? unique(buckets) : undefined
}

function httpsOrUndefined(value: string): string | undefined {
  return /^https:\/\//i.test(value) ? value : undefined
}

function isOfficialOpenAlexWorksUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'api.openalex.org' && url.pathname.replace(/\/$/, '') === '/works'
  } catch {
    return false
  }
}

function validDate(value: string): string | undefined {
  return ISO_DATE_PATTERN.test(value) ? value : undefined
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

export const OPENALEX_WORKS_SOURCE_ID = SOURCE_ID
