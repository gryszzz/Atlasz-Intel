/*
 * Federal Register adapter.
 *
 * Uses the official FederalRegister.gov API documented at:
 * https://www.federalregister.gov/reader-aids/developer-resources/rest-api
 *
 * Real regulatory/public-policy documents only. No fake rules, no AI
 * commentary, no invented exposure mapping. FederalRegister.gov HTML/XML is a
 * prototype/non-official legal edition; when present, the govinfo PDF is kept as
 * the official print/legal source trail. Malformed records are dropped, never
 * repaired. HTTP/rate-limit failures surface via shared fetchPolicy.
 *
 * provenance: official-api   category: regulatory-document
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { RegulatoryDocument, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'federal_register_public'
const SOURCE_NAME = 'Federal Register API'
const DEFAULT_DOCUMENTS_URL = 'https://www.federalregister.gov/api/v1/documents.json'
const DEFAULT_USER_AGENT = 'Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)'
const DEFAULT_LOOKBACK_DAYS = 14
const DEFAULT_MAX_RECORDS = 25
const MAX_RECORDS_CAP = 100
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DOCUMENT_URL_PATTERN = /^https:\/\/www\.federalregister\.gov\/documents\//
const GOVINFO_PDF_PATTERN = /^https:\/\/www\.govinfo\.gov\/content\/pkg\/FR-\d{4}-\d{2}-\d{2}\/pdf\/[^/]+\.pdf$/

const FIELD_ALLOWLIST = [
  'document_number',
  'title',
  'type',
  'agencies',
  'publication_date',
  'effective_on',
  'comments_close_on',
  'abstract',
  'html_url',
  'pdf_url',
  'raw_text_url',
  'body_html_url',
  'citation',
  'action',
]

export type FederalRegisterConfig = {
  documentsUrl: string
  userAgent: string
  lookbackDays: number
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readFederalRegisterConfig(env: NodeJS.ProcessEnv = process.env): FederalRegisterConfig | null {
  if (env.ATLASZ_FEDERAL_REGISTER_DISABLE === '1') {
    return null
  }
  const documentsUrl = asString(env.ATLASZ_FEDERAL_REGISTER_URL) || DEFAULT_DOCUMENTS_URL
  if (!/^https:\/\//i.test(documentsUrl)) {
    return null
  }
  return {
    documentsUrl,
    userAgent: asString(env.ATLASZ_FEDERAL_REGISTER_USER_AGENT) || asString(env.ATLASZ_HTTP_USER_AGENT) || DEFAULT_USER_AGENT,
    lookbackDays: clampInteger(Number(env.ATLASZ_FEDERAL_REGISTER_LOOKBACK_DAYS ?? DEFAULT_LOOKBACK_DAYS), 1, 90),
    maxRecords: clampInteger(Number(env.ATLASZ_FEDERAL_REGISTER_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_FEDERAL_REGISTER_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_FEDERAL_REGISTER_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_FEDERAL_REGISTER_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchFederalRegisterDocuments(
  signal: AbortSignal,
  config = readFederalRegisterConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const retrievedAt = Date.now()
  const requestUrl = buildRequestUrl(config, retrievedAt)
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchFederalRegisterJson(requestUrl, config.userAgent, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseFederalRegisterDocuments(payload, { retrievedAt, sourceApiUrl: requestUrl })
  return normalizeFederalRegisterDocuments(records)
}

async function fetchFederalRegisterJson(url: string, userAgent: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json', 'user-agent': userAgent },
  })
  assertOk(response, 'Federal Register')
  return response.json() as Promise<unknown>
}

/** Pure normalizer — testable with real Federal Register API response fixtures. */
export function parseFederalRegisterDocuments(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string } = {},
): RegulatoryDocument[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { results?: unknown }).results
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? DEFAULT_DOCUMENTS_URL
  const out: RegulatoryDocument[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const record = row as Record<string, unknown>
    const documentNumber = asString(record.document_number)
    const title = asString(record.title)
    const documentType = asString(record.type)
    const publicationDate = asString(record.publication_date)
    const publicationTimestamp = Date.parse(`${publicationDate}T00:00:00Z`)
    const htmlUrl = asString(record.html_url)
    const pdfUrl = validPdfUrl(asString(record.pdf_url))

    if (!hasValidDocument({ documentNumber, title, documentType, publicationDate, publicationTimestamp, htmlUrl, sourceApiUrl, retrievedAt })) {
      continue
    }

    const agencies = extractAgencies(record.agencies)
    const rawPayloadJson = stableStringify(record)
    out.push({
      id: regulatoryDocumentId(documentNumber),
      documentNumber,
      title,
      documentType,
      agencies,
      publicationDate,
      publicationTimestamp,
      effectiveDate: validDate(asString(record.effective_on)),
      commentEndDate: validDate(asString(record.comments_close_on)),
      abstract: asString(record.abstract).replace(/\s+/g, ' ').slice(0, 800),
      htmlUrl,
      pdfUrl,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForDocument({ documentNumber, title, documentType, publicationDate, publicationTimestamp, htmlUrl, sourceApiUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  out.sort((a, b) => b.publicationTimestamp - a.publicationTimestamp || a.documentNumber.localeCompare(b.documentNumber))
  return out
}

export function normalizeFederalRegisterDocuments(records: RegulatoryDocument[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: RegulatoryDocument): WorldIntelEvent {
  const dedupeKey = `federal-register|${record.documentNumber}`.toLowerCase()
  const agencyNote = record.agencies.length > 0 ? ` Agency: ${record.agencies.slice(0, 3).join(', ')}.` : ''
  const effective = record.effectiveDate ? ` Effective ${record.effectiveDate}.` : ''
  const comments = record.commentEndDate ? ` Comments close ${record.commentEndDate}.` : ''
  const pdfNote = record.pdfUrl ? ' Official PDF is available via govinfo.' : ' Official PDF was not present in the API record.'
  const summary = `${record.documentType} ${record.documentNumber} published ${record.publicationDate}: ${record.title}.${agencyNote}${effective}${comments}${pdfNote}`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.documentType} — ${record.title}`.slice(0, 160),
    summary,
    source: record.sourceName,
    url: record.htmlUrl,
    observedAt: record.publicationTimestamp,
    category: 'regulatory-document',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['Federal Register', record.documentType, ...record.agencies]),
    extractedEntities: unique([record.documentNumber, ...record.agencies]),
  })

  return {
    ...event,
    countryCodes: ['US'],
    region: 'United States',
    severity: 'watch',
    confidence: record.confidence,
    regulatoryDocument: record,
  }
}

function buildRequestUrl(config: FederalRegisterConfig, now: number): string {
  const since = new Date(now - config.lookbackDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url = new URL(config.documentsUrl)
  url.searchParams.set('per_page', String(config.maxRecords))
  url.searchParams.set('order', 'newest')
  url.searchParams.set('conditions[publication_date][gte]', since)
  for (const field of FIELD_ALLOWLIST) {
    url.searchParams.append('fields[]', field)
  }
  return url.toString()
}

function extractAgencies(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    const agency = entry as Record<string, unknown>
    const name = asString(agency.name) || asString(agency.raw_name)
    if (name) out.push(name)
  }
  return unique(out).slice(0, 8)
}

function hasValidDocument(input: {
  documentNumber: string
  title: string
  documentType: string
  publicationDate: string
  publicationTimestamp: number
  htmlUrl: string
  sourceApiUrl: string
  retrievedAt: number
}): boolean {
  return Boolean(
    input.documentNumber &&
      input.title &&
      input.documentType &&
      ISO_DATE_PATTERN.test(input.publicationDate) &&
      Number.isFinite(input.publicationTimestamp) &&
      DOCUMENT_URL_PATTERN.test(input.htmlUrl) &&
      /^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/.test(input.sourceApiUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForDocument(input: Parameters<typeof hasValidDocument>[0]): number {
  return hasValidDocument(input) ? 96 : 60
}

function validDate(value: string): string | undefined {
  return ISO_DATE_PATTERN.test(value) ? value : undefined
}

function validPdfUrl(value: string): string | undefined {
  if (!value) return undefined
  return GOVINFO_PDF_PATTERN.test(value) ? value : undefined
}

function regulatoryDocumentId(documentNumber: string): string {
  return `${SOURCE_ID}:${documentNumber.toLowerCase()}`
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

export const FEDERAL_REGISTER_SOURCE_ID = SOURCE_ID
