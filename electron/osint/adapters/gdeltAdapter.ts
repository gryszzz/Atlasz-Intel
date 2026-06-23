/*
 * GDELT DOC 2.0 ArtList adapter — MEDIA OBSERVATION, NOT VERIFIED FACT.
 *
 * Uses the documented public GDELT DOC 2.0 API (no key):
 * https://api.gdeltproject.org/api/v2/doc/doc?mode=ArtList&format=json
 *
 * Hard boundary: a GDELT result is a record that an article matching a query
 * bucket was SEEN in media. It is never treated as a verified event. So:
 *  - provenance is `media-observation` (a distinct, lower trust tier);
 *  - every event is labeled "Observed in media, not verified event";
 *  - NO causality, NO company/sector exposure inferred from the headline/title,
 *    NO Goldstein/tone scoring, NO GKG/entity extraction in this slice;
 *  - severity is fixed low (never inflated from tone);
 *  - sourceCountry is the OUTLET's country, not an event location, so it is kept
 *    in the sub-record but never written to the event's countryCodes.
 *
 * Real articles only: malformed rows dropped (never repaired), deduped by a hash
 * of url|title|domain|seendate. HTTP/rate-limit failures fail closed via the
 * shared fetch policy; GDELT's non-JSON "query too broad / rate limited" bodies
 * are treated as DATA_UNAVAILABLE.
 *
 * provenance: media-observation   category: media
 */
import { adapterEventId, asString, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { GdeltArticle, WorldIntelEvent } from '../../../src/worldIntel'
import type { Severity } from '../../../src/data/intel'

const SOURCE_ID = 'gdelt_doc_public'
const SOURCE_NAME = 'GDELT DOC 2.0'
const DEFAULT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
// Explicit query buckets only — Atlasz controls the query; GDELT does not push topics.
const DEFAULT_QUERY = [
  '"Red Sea"',
  'semiconductor',
  'Taiwan',
  'tariffs',
  'sanctions',
  '"rare earth"',
  '"central bank"',
  'inflation',
  '"natural gas"',
  'oil',
  '"data center"',
  'copper',
  'uranium',
].join(' OR ')
const DEFAULT_MAX_RECORDS = 50
const MAX_RECORDS_CAP = 250
const DEFAULT_TIMESPAN = '1d'
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000
const TIMESPAN_PATTERN = /^\d{1,3}(min|h|hours|d|days|w|weeks|m|months)$/i
// GDELT DOC seendate is "YYYYMMDDTHHMMSSZ" (e.g. 20260602T044500Z); tolerate a bare
// 14-digit form too. Validity is checked via the parsed timestamp, not the string.
const SEENDATE_PATTERN = /^\d{8}T?\d{6}Z?$/
// GDELT article URLs are arbitrary publisher links; require https only.
const HTTPS_PATTERN = /^https:\/\//i

export type GdeltConfig = {
  endpoint: string
  query: string
  maxRecords: number
  timespan: string
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readGdeltConfig(env: NodeJS.ProcessEnv = process.env): GdeltConfig | null {
  if (env.ATLASZ_GDELT_DISABLE === '1') {
    return null
  }
  const endpoint = asString(env.ATLASZ_GDELT_ENDPOINT) || DEFAULT_ENDPOINT
  if (!HTTPS_PATTERN.test(endpoint)) {
    return null
  }
  const timespanRaw = asString(env.ATLASZ_GDELT_TIMESPAN)
  return {
    endpoint,
    query: asString(env.ATLASZ_GDELT_QUERY) || DEFAULT_QUERY,
    maxRecords: clampInteger(Number(env.ATLASZ_GDELT_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP),
    timespan: TIMESPAN_PATTERN.test(timespanRaw) ? timespanRaw : DEFAULT_TIMESPAN,
    timeoutMs: clampInteger(Number(env.ATLASZ_GDELT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_GDELT_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_GDELT_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchGdeltEvents(
  signal: AbortSignal,
  config = readGdeltConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const retrievedAt = Date.now()
  const requestUrl = buildRequestUrl(config)
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchGdeltJson(requestUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseGdeltArticles(payload, { retrievedAt, sourceApiUrl: requestUrl, query: config.query })
  return normalizeGdeltArticles(records)
}

async function fetchGdeltJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json', 'user-agent': 'AtlaszIntel/0.4 (local-first world-intel; media observation)' },
  })
  assertOk(response, 'GDELT DOC')
  const text = await response.text()
  // GDELT returns plain-text bodies (e.g. "query too broad", rate-limit notices)
  // with HTTP 200. Treat anything that is not a JSON object as DATA_UNAVAILABLE.
  if (!text.trim().startsWith('{')) {
    throw new Error(`GDELT DOC non-JSON response: ${text.trim().slice(0, 120) || 'empty body'}`)
  }
  return JSON.parse(text) as unknown
}

/** Pure normalizer — testable with fixture GDELT DOC ArtList payloads. */
export function parseGdeltArticles(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; query?: string } = {},
): GdeltArticle[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { articles?: unknown }).articles
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? DEFAULT_ENDPOINT
  const queryBucket = (options.query ?? DEFAULT_QUERY).slice(0, 300)
  const seen = new Set<string>()
  const out: GdeltArticle[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const record = row as Record<string, unknown>
    const title = collapse(asString(record.title)).slice(0, 300)
    const url = asString(record.url)
    const domain = asString(record.domain).toLowerCase()
    const language = asString(record.language) || undefined
    const sourceCountry = asString(record.sourcecountry) || undefined
    const seenDate = asString(record.seendate)
    const seenTimestamp = parseGdeltDate(seenDate)
    const rawPayloadJson = stableStringify({ title, url, domain, language, sourcecountry: sourceCountry, seendate: seenDate })
    const rawPayloadHash = sha256(`${url}|${title}|${domain}|${seenDate}`)

    if (!hasValidArticle({ title, url, domain, seenDate, seenTimestamp, sourceApiUrl, retrievedAt })) {
      continue // drop malformed; never repair
    }
    if (seen.has(rawPayloadHash)) {
      continue // dedupe by url|title|domain|seendate
    }
    seen.add(rawPayloadHash)

    out.push({
      id: gdeltArticleId(url),
      title,
      url,
      domain,
      language,
      sourceCountry,
      queryBucket,
      seenDate,
      seenTimestamp: seenTimestamp as number,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'media-observation',
      confidence: confidenceForArticle({ title, url, domain, seenDate, seenTimestamp, sourceApiUrl, retrievedAt }),
      rawPayloadHash,
      rawPayloadJson,
    })
  }

  out.sort((a, b) => b.seenTimestamp - a.seenTimestamp || a.url.localeCompare(b.url))
  return out.slice(0, MAX_RECORDS_CAP)
}

export function normalizeGdeltArticles(records: GdeltArticle[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: GdeltArticle): WorldIntelEvent {
  const dedupeKey = `gdelt|${record.url}`.toLowerCase()
  const countryNote = record.sourceCountry ? ` Outlet country: ${record.sourceCountry}.` : ''
  const summary =
    `Observed in media, not verified event: "${record.title}" — ${record.domain}.${countryNote} ` +
    `Seen ${new Date(record.seenTimestamp).toISOString()}. Source: GDELT DOC 2.0 query bucket (media observation, no causality or exposure inferred).`

  // Built directly (NOT via buildWorldIntelEventFromHeadline) so no tickers,
  // sectors, commodities, currencies, or country codes are inferred from the title.
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: record.seenTimestamp,
    title: record.title.slice(0, 200),
    summary,
    countryCodes: [], // sourceCountry is the outlet, not an event location — never implied here
    region: 'global',
    category: 'media',
    severity: GDELT_SEVERITY,
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.url,
    provenance: 'media-observation',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.domain]),
    narrativeTags: ['GDELT', 'media observation'],
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    gdeltArticle: record,
  }
}

const GDELT_SEVERITY: Severity = 'stable'

function hasValidArticle(input: {
  title: string
  url: string
  domain: string
  seenDate: string
  seenTimestamp: number | undefined
  sourceApiUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    input.title &&
      HTTPS_PATTERN.test(input.url) &&
      input.domain &&
      SEENDATE_PATTERN.test(input.seenDate) &&
      input.seenTimestamp !== undefined &&
      Number.isFinite(input.seenTimestamp) &&
      HTTPS_PATTERN.test(input.sourceApiUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForArticle(input: Parameters<typeof hasValidArticle>[0]): number {
  return hasValidArticle(input) ? 96 : 60
}

function buildRequestUrl(config: GdeltConfig): string {
  const url = new URL(config.endpoint)
  url.searchParams.set('query', config.query)
  url.searchParams.set('mode', 'ArtList')
  url.searchParams.set('format', 'json')
  url.searchParams.set('maxrecords', String(config.maxRecords))
  url.searchParams.set('timespan', config.timespan)
  url.searchParams.set('sort', 'DateDesc')
  return url.toString()
}

function parseGdeltDate(value: string): number | undefined {
  if (!SEENDATE_PATTERN.test(value)) {
    return undefined
  }
  const digits = value.replace(/\D/g, '') // strip the T / Z -> YYYYMMDDHHMMSS
  if (digits.length !== 14) {
    return undefined
  }
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}Z`
  const timestamp = Date.parse(iso)
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function gdeltArticleId(url: string): string {
  return `${SOURCE_ID}:${sha256(url).slice(0, 24)}`
}

function clampInteger(value: number, min: number, max: number): number {
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

export const GDELT_DOC_SOURCE_ID = SOURCE_ID
