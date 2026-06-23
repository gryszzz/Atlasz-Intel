/*
 * SEC EDGAR company filings adapter.
 *
 * Uses the official SEC `data.sec.gov/submissions/CIK##########.json`
 * company submissions API. SEC requires a descriptive User-Agent with contact
 * info; we fail closed if ATLASZ_SEC_USER_AGENT is not configured.
 *
 * Runtime never simulates filings. Test fixtures exercise parser behavior.
 * CIK->ticker mapping is local/explicit; unmapped filings are kept as official
 * disclosures without inventing affected tickers.
 *
 * provenance: public-disclosure   category: filing
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { SecCompanyFiling, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_edgar_public'
const SEC_SOURCE_NAME = 'SEC EDGAR'
const SUBMISSIONS_BASE = 'https://data.sec.gov/submissions'
const ARCHIVES_BASE = 'https://www.sec.gov/Archives/edgar/data'
const DEFAULT_FORMS = ['8-K', '10-Q', '10-K']
const DEFAULT_MAX_FILINGS_PER_COMPANY = 12
const MAX_FILINGS_PER_COMPANY = 40

const DEFAULT_CIK_TICKER_MAP: Record<string, string> = {
  '320193': 'AAPL',
  '789019': 'MSFT',
  '1045810': 'NVDA',
  '1318605': 'TSLA',
  '1018724': 'AMZN',
  '1652044': 'GOOGL',
  '1326801': 'META',
}

export type SecFilingRecord = {
  companyName: string
  cik: string
  formType: string
  filedAt: number
  accessionNumber: string
  filingUrl: string
  sourceDomain: string
}

export type SecAdapterConfig = {
  userAgent: string
  formTypes: string[]
  includeAmendments: boolean
  cikTickerMap: Record<string, string>
  companyCiks: string[]
  maxFilingsPerCompany: number
}

type SecSubmissionsPayload = {
  cik?: string | number
  name?: string
  tickers?: unknown
  filings?: {
    recent?: Record<string, unknown>
  }
}

export function readSecConfig(env: NodeJS.ProcessEnv = process.env): SecAdapterConfig | null {
  const userAgent = asString(env.ATLASZ_SEC_USER_AGENT)
  // SEC blocks requests lacking a contactable UA. Fail closed without one.
  if (!userAgent || !/@|https?:\/\//.test(userAgent)) {
    return null
  }

  const formTypes = asString(env.ATLASZ_SEC_FORM_TYPES)
    ? asString(env.ATLASZ_SEC_FORM_TYPES)
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)
    : DEFAULT_FORMS
  const includeAmendments = env.ATLASZ_SEC_INCLUDE_AMENDMENTS !== '0'
  const cikTickerMap = { ...DEFAULT_CIK_TICKER_MAP, ...readCikTickerMap(env.ATLASZ_SEC_CIK_TICKER_MAP) }
  const envCiks = parseCikList(env.ATLASZ_SEC_COMPANY_CIKS)
  const companyCiks = envCiks.length > 0 ? envCiks : Object.keys(cikTickerMap)
  const maxFilingsPerCompany = clampInteger(
    Number(env.ATLASZ_SEC_MAX_FILINGS_PER_COMPANY ?? DEFAULT_MAX_FILINGS_PER_COMPANY),
    1,
    MAX_FILINGS_PER_COMPANY,
  )

  return {
    userAgent,
    formTypes,
    includeAmendments,
    cikTickerMap,
    companyCiks: unique(companyCiks.map(normalizeCik)).filter(Boolean),
    maxFilingsPerCompany,
  }
}

export async function fetchSecFilings(
  signal: AbortSignal,
  config = readSecConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.companyCiks.length === 0) {
    return []
  }

  const filings: SecCompanyFiling[] = []
  const failures: string[] = []

  for (const cik of config.companyCiks) {
    const sourceJsonUrl = secCompanySubmissionsUrl(cik)
    try {
      const response = await fetch(sourceJsonUrl, {
        signal,
        headers: {
          accept: 'application/json',
          'user-agent': config.userAgent,
        },
      })
      assertOk(response, `SEC EDGAR ${cik}`)
      const payload = (await response.json()) as unknown
      filings.push(...parseSecCompanySubmissions(payload, { config, sourceJsonUrl }))
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
    }
  }

  if (filings.length === 0 && failures.length > 0) {
    throw new Error(failures[0])
  }

  return normalizeSecFilings(filings, config)
}

export function parseSecCompanySubmissions(
  payload: unknown,
  options: {
    config?: Partial<SecAdapterConfig>
    sourceJsonUrl?: string
    observedAt?: number
  } = {},
): SecCompanyFiling[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload as SecSubmissionsPayload
  const recent = body.filings?.recent
  if (!recent || typeof recent !== 'object') {
    return []
  }

  const companyName = asString(body.name)
  const cik = normalizeCik(asString(body.cik))
  const accessionNumbers = stringArray(recent.accessionNumber)
  const forms = stringArray(recent.form)
  const filingDates = stringArray(recent.filingDate)
  const reportDates = stringArray(recent.reportDate)
  const acceptanceDates = stringArray(recent.acceptanceDateTime)
  const primaryDocuments = stringArray(recent.primaryDocument)
  const maxRows = Math.min(
    accessionNumbers.length,
    forms.length,
    filingDates.length,
    options.config?.maxFilingsPerCompany ?? DEFAULT_MAX_FILINGS_PER_COMPANY,
  )
  const tickers = stringArray(body.tickers).map((ticker) => ticker.toUpperCase())
  const configuredTicker = cik ? options.config?.cikTickerMap?.[cik] : undefined
  const ticker = configuredTicker ?? tickers[0]
  const sourceJsonUrl = options.sourceJsonUrl ?? (cik ? secCompanySubmissionsUrl(cik) : '')
  const observedAt = options.observedAt ?? Date.now()
  const filings: SecCompanyFiling[] = []

  for (let index = 0; index < maxRows; index += 1) {
    const formType = forms[index]?.toUpperCase().trim() ?? ''
    if (!matchesForm(formType, options.config?.formTypes ?? DEFAULT_FORMS, options.config?.includeAmendments ?? true)) {
      continue
    }
    const accessionNumber = accessionNumbers[index] ?? ''
    const filingDate = filingDates[index] ?? ''
    const acceptedAt = parseSecDate(acceptanceDates[index]) ?? parseSecDate(filingDate)
    const primaryDocument = primaryDocuments[index] ?? ''
    const sourceUrl = buildSecFilingUrl(cik, accessionNumber, primaryDocument)
    if (!hasValidFilingMetadata({ cik, companyName, formType, accessionNumber, filingDate, sourceUrl })) {
      continue
    }
    const rawRecord = {
      cik,
      companyName,
      ticker: ticker ?? '',
      formType,
      accessionNumber,
      filingDate,
      reportDate: reportDates[index] ?? '',
      acceptanceDateTime: acceptanceDates[index] ?? '',
      primaryDocument,
      sourceJsonUrl,
      sourceUrl,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    const rawPayloadHash = sha256(rawPayloadJson)
    filings.push({
      id: filingId(accessionNumber),
      cik,
      companyName,
      ticker: ticker ? ticker.toUpperCase() : undefined,
      formType,
      accessionNumber,
      filingDate,
      reportDate: reportDates[index] || undefined,
      acceptedAt,
      observedAt,
      primaryDocument: primaryDocument || undefined,
      sourceUrl,
      sourceJsonUrl,
      sourceName: SEC_SOURCE_NAME,
      provenance: 'public-disclosure',
      confidence: confidenceForSecFiling({ cik, companyName, formType, accessionNumber, filingDate, sourceUrl }),
      rawPayloadHash,
      rawPayloadJson,
    })
  }

  return filings
}

/** Pure normalizer — testable with fixture filing records. */
export function normalizeSecFilings(
  filings: Array<SecFilingRecord | SecCompanyFiling>,
  config: Partial<SecAdapterConfig> = {},
): WorldIntelEvent[] {
  const formTypes = (config.formTypes ?? DEFAULT_FORMS).map((value) => value.toUpperCase())
  const includeAmendments = config.includeAmendments ?? true
  const cikTickerMap = config.cikTickerMap ?? {}
  const events: WorldIntelEvent[] = []
  for (const filing of filings) {
    const normalized = isCompanyFiling(filing) ? filing : legacyFilingToCompanyFiling(filing, cikTickerMap)
    if (!matchesForm(normalized.formType, formTypes, includeAmendments)) {
      continue
    }
    if (normalized.confidence < 90) {
      continue
    }
    events.push(toEvent(normalized))
  }
  return events
}

function toEvent(filing: SecCompanyFiling): WorldIntelEvent {
  const ticker = filing.ticker ?? ''
  const dedupeKey = `sec|${filing.accessionNumber}`.toLowerCase()
  const summary = [
    `Official SEC ${filing.formType} filing by ${filing.companyName} (CIK ${filing.cik}).`,
    `Accession ${filing.accessionNumber}.`,
    ticker ? `Linked ticker: ${ticker}.` : 'No local ticker mapping available; kept as an unmapped filing.',
  ].join(' ')

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${filing.formType} — ${filing.companyName}`,
    summary,
    source: SEC_SOURCE_NAME,
    url: filing.sourceUrl,
    observedAt: filing.acceptedAt ?? parseSecDate(filing.filingDate) ?? filing.observedAt,
    category: 'filing',
    provenance: 'public-disclosure',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: filing,
    affectedAssets: ticker ? [ticker] : [],
    narrativeTags: unique(['SEC filing', filing.formType, 'Official public disclosure']),
    extractedEntities: unique([filing.companyName, `CIK ${filing.cik}`, filing.accessionNumber]),
  })

  return {
    ...event,
    confidence: filing.confidence,
    secFiling: filing,
  }
}

function legacyFilingToCompanyFiling(
  filing: SecFilingRecord,
  cikTickerMap: Record<string, string>,
): SecCompanyFiling {
  const cik = normalizeCik(filing.cik)
  const ticker = cikTickerMap[cik]
  const filingDate = new Date(filing.filedAt).toISOString().slice(0, 10)
  const sourceUrl = filing.filingUrl
  const rawPayloadJson = stableStringify(filing)
  return {
    id: filingId(filing.accessionNumber),
    cik,
    companyName: filing.companyName,
    ticker,
    formType: filing.formType.toUpperCase(),
    accessionNumber: filing.accessionNumber,
    filingDate,
    acceptedAt: filing.filedAt,
    observedAt: filing.filedAt,
    sourceUrl,
    sourceJsonUrl: cik ? secCompanySubmissionsUrl(cik) : '',
    sourceName: filing.sourceDomain || SEC_SOURCE_NAME,
    provenance: 'public-disclosure',
    confidence: confidenceForSecFiling({
      cik,
      companyName: filing.companyName,
      formType: filing.formType,
      accessionNumber: filing.accessionNumber,
      filingDate,
      sourceUrl,
    }),
    rawPayloadHash: sha256(rawPayloadJson),
    rawPayloadJson,
  }
}

function matchesForm(formType: string, formTypes: string[], includeAmendments: boolean): boolean {
  const normalized = formType.toUpperCase().trim()
  const base = normalized.replace(/\/A$/, '')
  const isAmendment = normalized.endsWith('/A')
  if (isAmendment && !includeAmendments) {
    return false
  }
  return formTypes.includes(base) || formTypes.includes(normalized)
}

/** Minimal, defensive Atom parser retained for old SEC feed fixtures. */
export function parseSecAtom(xml: string): SecFilingRecord[] {
  if (typeof xml !== 'string' || !xml.includes('<entry')) {
    return []
  }
  const records: SecFilingRecord[] = []
  const entries = xml.split(/<entry[\s>]/i).slice(1)
  for (const entry of entries) {
    const block = entry.split(/<\/entry>/i)[0] ?? ''
    const title = decodeXml(tag(block, 'title'))
    const updated = tag(block, 'updated')
    const filedAt = Date.parse(updated)
    const term = attr(block, 'category', 'term')
    const formFromTitle = title.split(' - ')[0]?.trim() ?? ''
    const formType = (term || formFromTitle).toUpperCase()
    const href = attr(block, 'link', 'href')
    const idTag = tag(block, 'id')
    const accession = extractAccession(idTag) || extractAccession(block)
    const cik = extractCik(title)
    const companyName = extractCompany(title)
    if (!formType || !Number.isFinite(filedAt) || !href) {
      continue
    }
    records.push({
      companyName,
      cik,
      formType,
      filedAt,
      accessionNumber: accession,
      filingUrl: href,
      sourceDomain: 'sec.gov',
    })
  }
  return records
}

export function secCompanySubmissionsUrl(cik: string): string {
  return `${SUBMISSIONS_BASE}/CIK${padCik(cik)}.json`
}

export function buildSecFilingUrl(cik: string, accessionNumber: string, primaryDocument?: string): string {
  const normalizedCik = normalizeCik(cik)
  const accession = accessionNumber.replace(/-/g, '')
  if (!normalizedCik || !accession) {
    return ''
  }
  if (primaryDocument) {
    return `${ARCHIVES_BASE}/${normalizedCik}/${accession}/${encodeURIComponent(primaryDocument)}`
  }
  return `${ARCHIVES_BASE}/${normalizedCik}/${accession}/${accessionNumber}-index.html`
}

function filingId(accessionNumber: string): string {
  return `${SOURCE_ID}:${accessionNumber.toLowerCase()}`
}

function hasValidFilingMetadata(input: {
  cik: string
  companyName: string
  formType: string
  accessionNumber: string
  filingDate: string
  sourceUrl: string
}): boolean {
  return Boolean(
    input.cik &&
      input.companyName &&
      input.formType &&
      input.accessionNumber &&
      /^\d{10}-\d{2}-\d{6}$/.test(input.accessionNumber) &&
      /^\d{4}-\d{2}-\d{2}$/.test(input.filingDate) &&
      /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//.test(input.sourceUrl),
  )
}

function confidenceForSecFiling(input: {
  cik: string
  companyName: string
  formType: string
  accessionNumber: string
  filingDate: string
  sourceUrl: string
}): number {
  return hasValidFilingMetadata(input) ? 96 : 62
}

function readCikTickerMap(value: unknown): Record<string, string> {
  const rawMap = asString(value)
  if (!rawMap) {
    return {}
  }
  try {
    const parsed = JSON.parse(rawMap) as Record<string, string>
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return Object.fromEntries(
      Object.entries(parsed).map(([cik, ticker]) => [normalizeCik(cik), String(ticker).toUpperCase()]),
    )
  } catch {
    // Ignore malformed maps; filings persist unmapped.
    return {}
  }
}

function parseCikList(value: unknown): string[] {
  return asString(value)
    .split(',')
    .map(normalizeCik)
    .filter(Boolean)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []
}

function parseSecDate(value: unknown): number | undefined {
  const raw = asString(value)
  if (!raw) {
    return undefined
  }
  const normalized = /^\d{14}$/.test(raw)
    ? raw.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3T$4:$5:$6Z')
    : /^\d{8}$/.test(raw)
      ? raw.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3T00:00:00Z')
      : raw
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

function isCompanyFiling(filing: SecFilingRecord | SecCompanyFiling): filing is SecCompanyFiling {
  return 'sourceUrl' in filing && 'sourceJsonUrl' in filing
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))
  return match ? match[1].trim() : ''
}

function attr(block: string, element: string, attribute: string): string {
  const match = block.match(new RegExp(`<${element}[^>]*\\b${attribute}="([^"]*)"`, 'i'))
  return match ? match[1].trim() : ''
}

function extractAccession(text: string): string {
  const match = text.match(/accession-number=([0-9-]+)/i) || text.match(/\b(\d{10}-\d{2}-\d{6})\b/)
  return match ? match[1] : ''
}

function extractCik(title: string): string {
  const match = title.match(/\((\d{4,10})\)/)
  return match ? normalizeCik(match[1]) : ''
}

function extractCompany(title: string): string {
  // "8-K - COMPANY NAME (0001234567) (Filer)" -> "COMPANY NAME"
  const afterForm = title.includes(' - ') ? title.split(' - ').slice(1).join(' - ') : title
  return afterForm.replace(/\(\d{4,10}\).*/, '').trim()
}

function normalizeCik(cik: string): string {
  const digits = String(cik).replace(/\D/g, '')
  return digits ? String(Number(digits)) : ''
}

function padCik(cik: string): string {
  return normalizeCik(cik).padStart(10, '0')
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export const SEC_SOURCE_ID = SOURCE_ID
