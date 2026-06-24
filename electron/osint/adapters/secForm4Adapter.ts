/*
 * SEC Form 4 insider-transaction adapter.
 *
 * Official SEC source. Public but requires a descriptive contactable User-Agent
 * (ATLASZ_SEC_USER_AGENT); fail closed without it. Issuer CIKs are resolved from
 * the Market Reference Master identity spine (company_tickers.json) — never guessed.
 *
 * Discipline: source-reported transaction EVIDENCE only. No sentiment
 * (bullish/bearish), no valuation, no price prediction, no trading advice. Reporting
 * owner data is limited to the source-published name/title — no enrichment. Only
 * non-derivative transactions in this slice. Malformed filings/transactions dropped;
 * HTTP/schema/rate-limit fail closed. Official SEC hosts only.
 *
 * provenance: public-disclosure   category: insider-transaction
 */
import { asString, sha256, stableStringify, unique, adapterEventId } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { parseSecCompanyTickers } from './marketReferenceAdapter'
import type { Form4ChangeType, Form4Transaction, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_form4_public'
const DEFAULT_SUBMISSIONS_BASE = 'https://data.sec.gov/submissions'
const DEFAULT_ARCHIVES_BASE = 'https://www.sec.gov/Archives/edgar/data'
const DEFAULT_IDENTITY_URL = 'https://www.sec.gov/files/company_tickers.json'
const DEFAULT_TICKERS = ['NVDA', 'AMD', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'INTC', 'XOM', 'CVX']
const DEFAULT_FILINGS_PER_COMPANY = 5
const MAX_FILINGS_PER_COMPANY = 30
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_500
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Neutral SEC transaction-code definitions (descriptive, NOT sentiment).
const TRANSACTION_CODE_LABELS: Record<string, string> = {
  P: 'Open-market or private purchase',
  S: 'Open-market or private sale',
  A: 'Grant, award, or other acquisition',
  D: 'Disposition to the issuer',
  F: 'Shares withheld for tax liability',
  M: 'Exercise/conversion of derivative security',
  G: 'Bona fide gift',
  C: 'Conversion of derivative security',
  X: 'Exercise of in-the-money or at-the-money derivative',
  J: 'Other acquisition or disposition',
}

export type Form4Config = {
  submissionsBase: string
  archivesBase: string
  identityUrl: string
  userAgent: string
  tickers: string[]
  filingsPerCompany: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export type Form4Issuer = { ticker: string; cik: string; cikPadded: string; companyName: string }

export function readForm4Config(env: NodeJS.ProcessEnv = process.env): Form4Config | null {
  if (env.ATLASZ_SEC_FORM4_DISABLE === '1') {
    return null
  }
  const userAgent = asString(env.ATLASZ_SEC_USER_AGENT)
  if (!userAgent || !/@|https?:\/\//.test(userAgent)) {
    return null // descriptive contactable User-Agent required
  }
  const submissionsBase = asString(env.ATLASZ_SEC_FORM4_SUBMISSIONS_BASE) || DEFAULT_SUBMISSIONS_BASE
  const archivesBase = asString(env.ATLASZ_SEC_FORM4_ARCHIVES_BASE) || DEFAULT_ARCHIVES_BASE
  const identityUrl = asString(env.ATLASZ_SEC_FORM4_IDENTITY_URL) || DEFAULT_IDENTITY_URL
  if (![submissionsBase, archivesBase, identityUrl].every(isSecHost)) {
    return null // official SEC hosts only
  }
  return {
    submissionsBase,
    archivesBase,
    identityUrl,
    userAgent,
    tickers: parseTickers(env.ATLASZ_SEC_FORM4_TICKERS) ?? DEFAULT_TICKERS,
    filingsPerCompany: clampInt(Number(env.ATLASZ_SEC_FORM4_PER_COMPANY ?? DEFAULT_FILINGS_PER_COMPANY), 1, MAX_FILINGS_PER_COMPANY),
    timeoutMs: clampInt(Number(env.ATLASZ_SEC_FORM4_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_SEC_FORM4_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_SEC_FORM4_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

/** Resolve allowlisted tickers to canonical issuer identities via company_tickers.json. */
export async function resolveForm4Issuers(config: Form4Config, signal: AbortSignal): Promise<Form4Issuer[]> {
  const response = await fetch(config.identityUrl, { signal, headers: { accept: 'application/json', 'user-agent': config.userAgent } })
  assertOk(response, 'SEC company tickers')
  const identities = parseSecCompanyTickers(await response.json(), { retrievedAt: Date.now() })
  const wanted = new Set(config.tickers.map((t) => t.toUpperCase()))
  return identities
    .filter((identity) => wanted.has(identity.ticker.toUpperCase()))
    .map((identity) => ({ ticker: identity.ticker, cik: identity.cik, cikPadded: identity.cikPadded, companyName: identity.legalName }))
}

export async function fetchSecForm4(signal: AbortSignal, config = readForm4Config()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const issuers = await resolveForm4Issuers(config, signal)
  const records: Form4Transaction[] = []
  for (const issuer of issuers) {
    const filings = await listRecentForm4Filings(issuer, config, signal)
    for (const filing of filings.slice(0, config.filingsPerCompany)) {
      const xml = await fetchText(filing.xmlUrl, config, signal)
      records.push(...parseForm4(xml, { issuer, accessionNumber: filing.accessionNumber, filingDate: filing.filingDate, sourceFilingUrl: filing.filingUrl, sourceXmlUrl: filing.xmlUrl, retrievedAt: Date.now() }))
    }
  }
  return normalizeForm4(records)
}

type Form4FilingRef = { accessionNumber: string; filingDate: string; filingUrl: string; xmlUrl: string }

async function listRecentForm4Filings(issuer: Form4Issuer, config: Form4Config, signal: AbortSignal): Promise<Form4FilingRef[]> {
  const url = `${config.submissionsBase.replace(/\/$/, '')}/CIK${issuer.cikPadded}.json`
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchJson(url, config, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const recent = asObject(asObject(asObject(payload)?.filings)?.recent)
  if (!recent) return []
  const forms = asArray(recent.form)
  const accns = asArray(recent.accessionNumber)
  const dates = asArray(recent.filingDate)
  const docs = asArray(recent.primaryDocument)
  const out: Form4FilingRef[] = []
  for (let i = 0; i < forms.length; i += 1) {
    if (asString(forms[i]) !== '4') continue
    const accessionNumber = asString(accns[i])
    const filingDate = asString(dates[i])
    const primaryDoc = asString(docs[i])
    if (!accessionNumber || !ISO_DATE_PATTERN.test(filingDate) || !primaryDoc) continue
    const accnNoDashes = accessionNumber.replace(/-/g, '')
    const xmlDoc = primaryDoc.replace(/^xsl[^/]*\//i, '') // strip the human-readable XSL render prefix
    if (!/\.xml$/i.test(xmlDoc)) continue
    const dir = `${config.archivesBase.replace(/\/$/, '')}/${Number(issuer.cik)}/${accnNoDashes}`
    out.push({ accessionNumber, filingDate, filingUrl: `${dir}/`, xmlUrl: `${dir}/${xmlDoc}` })
  }
  return out
}

/** Pure parser — testable with real Form 4 ownership XML fixtures. */
export function parseForm4(
  xml: string,
  options: { issuer: Form4Issuer; accessionNumber: string; filingDate: string; sourceFilingUrl?: string; sourceXmlUrl?: string; retrievedAt?: number },
): Form4Transaction[] {
  if (!xml || !/<ownershipDocument/i.test(xml)) return []
  const { issuer, accessionNumber, filingDate } = options
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceFilingUrl = options.sourceFilingUrl ?? ''
  const sourceXmlUrl = options.sourceXmlUrl ?? ''

  const issuerBlock = firstTag(xml, 'issuer')
  const issuerCikRaw = textOf(issuerBlock, 'issuerCik')
  const issuerCik = issuerCikRaw.replace(/\D/g, '').replace(/^0+/, '') || issuer.cik
  // Identity guard: the filing's issuer CIK must match the canonical identity.
  if (issuerCik !== issuer.cik) return []

  const ownerBlock = firstTag(xml, 'reportingOwner')
  const ownerName = textOf(ownerBlock, 'rptOwnerName')
  const ownerCikRaw = textOf(ownerBlock, 'rptOwnerCik')
  const ownerCik = ownerCikRaw.replace(/\D/g, '').replace(/^0+/, '') || undefined
  const ownerRelationship = buildRelationship(firstTag(ownerBlock, 'reportingOwnerRelationship'))

  const out: Form4Transaction[] = []
  for (const txnXml of eachTag(xml, 'nonDerivativeTransaction')) {
    const securityTitle = valueOf(txnXml, 'securityTitle')
    const transactionDate = valueOf(txnXml, 'transactionDate')
    const coding = firstTag(txnXml, 'transactionCoding')
    const transactionCode = textOf(coding, 'transactionCode').toUpperCase()
    const amounts = firstTag(txnXml, 'transactionAmounts')
    const transactionShares = numberValue(valueOf(amounts, 'transactionShares'))
    const transactionPricePerShare = numberValue(valueOf(amounts, 'transactionPricePerShare'))
    const acquiredDisposedCode = valueOf(amounts, 'transactionAcquiredDisposedCode').toUpperCase()
    const post = firstTag(txnXml, 'postTransactionAmounts')
    const sharesOwnedFollowing = numberValue(valueOf(post, 'sharesOwnedFollowingTransaction'))
    const ownershipNature = valueOf(firstTag(txnXml, 'ownershipNature'), 'directOrIndirectOwnership').toUpperCase() || undefined

    if (!hasValidTransaction({ ownerName, transactionDate, transactionCode, accessionNumber, filingDate })) {
      continue // malformed transaction -> drop, never repair
    }

    const rawRecord = {
      issuerCik,
      issuerTicker: issuer.ticker,
      accessionNumber,
      filingDate,
      transactionDate,
      ownerName,
      ownerCik,
      ownerRelationship,
      securityTitle,
      transactionCode,
      transactionShares,
      transactionPricePerShare,
      acquiredDisposedCode,
      ownershipNature,
      sharesOwnedFollowing,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    out.push({
      id: `${SOURCE_ID}:${issuer.cikPadded}:${accessionNumber}:${transactionCode}:${transactionDate}:${transactionShares ?? 0}`.toLowerCase(),
      issuerCik,
      issuerCikPadded: issuer.cikPadded,
      issuerTicker: issuer.ticker,
      issuerName: textOf(issuerBlock, 'issuerName') || issuer.companyName,
      accessionNumber,
      filingDate,
      transactionDate,
      ownerName,
      ownerCik,
      ownerRelationship,
      securityTitle,
      transactionCode,
      transactionCodeLabel: TRANSACTION_CODE_LABELS[transactionCode] ?? 'Other transaction',
      transactionShares,
      transactionPricePerShare,
      acquiredDisposedCode,
      ownershipNature,
      sharesOwnedFollowing,
      sourceFilingUrl,
      sourceXmlUrl,
      retrievedAt,
      provenance: 'public-disclosure',
      confidence: 96,
      changeType: 'first_seen',
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

export function normalizeForm4(records: Form4Transaction[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

export function applyForm4ChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.form4Transaction) return event
  const prior = previous?.form4Transaction
  const changeType: Form4ChangeType = !prior
    ? 'first_seen'
    : prior.rawPayloadHash === event.form4Transaction.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, form4Transaction: { ...event.form4Transaction, changeType } }
}

function toEvent(record: Form4Transaction): WorldIntelEvent {
  const dedupeKey = `form4|${record.issuerCik}|${record.accessionNumber}|${record.transactionCode}|${record.transactionDate}|${record.transactionShares ?? 0}`.toLowerCase()
  const direction = record.acquiredDisposedCode === 'A' ? 'acquired' : record.acquiredDisposedCode === 'D' ? 'disposed' : 'reported'
  const shares = record.transactionShares !== undefined ? `${record.transactionShares.toLocaleString('en-US')} shares` : 'shares'
  const price = record.transactionPricePerShare !== undefined ? ` at $${record.transactionPricePerShare}` : ''
  const rel = record.ownerRelationship ? ` (${record.ownerRelationship})` : ''
  const summary =
    `SEC Form 4: ${record.ownerName}${rel} ${direction} ${shares} of ${record.issuerName} (${record.issuerTicker})${price} ` +
    `on ${record.transactionDate} — code ${record.transactionCode} (${record.transactionCodeLabel}), filed ${record.filingDate}. ` +
    `Source-reported SEC ownership transaction; not sentiment, valuation, or trading advice.`
  const observedAt = Date.parse(`${record.filingDate}T00:00:00Z`)

  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: Number.isFinite(observedAt) ? observedAt : record.retrievedAt,
    title: `Form 4: ${record.issuerTicker} ${record.ownerName} ${record.transactionCode} ${record.transactionShares?.toLocaleString('en-US') ?? ''}`.slice(0, 180),
    summary,
    countryCodes: ['US'],
    region: 'United States',
    category: 'insider-transaction',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceFilingUrl || record.sourceXmlUrl,
    provenance: 'public-disclosure',
    affectedAssets: [record.issuerTicker],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.issuerTicker, record.issuerCikPadded, record.issuerName, record.ownerName, record.transactionCode]),
    narrativeTags: unique(['SEC Form 4', 'insider transaction', record.transactionCode]),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    form4Transaction: record,
  }
}

function buildRelationship(relBlock: string): string {
  if (!relBlock) return ''
  const parts: string[] = []
  if (/<isDirector>\s*(1|true)\s*<\/isDirector>/i.test(relBlock)) parts.push('Director')
  if (/<isTenPercentOwner>\s*(1|true)\s*<\/isTenPercentOwner>/i.test(relBlock)) parts.push('10% owner')
  if (/<isOfficer>\s*(1|true)\s*<\/isOfficer>/i.test(relBlock)) {
    const title = textOf(relBlock, 'officerTitle')
    parts.push(title ? `Officer: ${title}` : 'Officer')
  }
  if (/<isOther>\s*(1|true)\s*<\/isOther>/i.test(relBlock)) {
    const other = textOf(relBlock, 'otherText')
    parts.push(other ? `Other: ${other}` : 'Other')
  }
  return parts.join(', ')
}

function hasValidTransaction(input: { ownerName: string; transactionDate: string; transactionCode: string; accessionNumber: string; filingDate: string }): boolean {
  return Boolean(
    input.ownerName &&
      ISO_DATE_PATTERN.test(input.transactionDate) &&
      /^[A-Z]$/.test(input.transactionCode) &&
      input.accessionNumber &&
      ISO_DATE_PATTERN.test(input.filingDate),
  )
}

function isSecHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)sec\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

async function fetchJson(url: string, config: Form4Config, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json', 'user-agent': config.userAgent } })
  assertOk(response, 'SEC Form 4 submissions')
  return response.json() as Promise<unknown>
}

async function fetchText(url: string, config: Form4Config, signal: AbortSignal): Promise<string> {
  return fetchWithRetry(
    async (attemptSignal) => {
      const response = await fetch(url, { signal: linkedSignal(signal, attemptSignal), headers: { accept: 'application/xml, text/xml', 'user-agent': config.userAgent } })
      assertOk(response, 'SEC Form 4 document')
      return response.text()
    },
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
}

function firstTag(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)
  return match?.[1] ?? ''
}

function eachTag(xml: string, tag: string): string[] {
  if (!xml) return []
  return [...xml.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => m[1] ?? '')
}

function textOf(xml: string, tag: string): string {
  return decodeXml(firstTag(xml, tag)).trim()
}

/** SEC ownership XML wraps amounts in a nested <value>…</value>. */
function valueOf(xml: string, tag: string): string {
  const block = firstTag(xml, tag)
  if (!block) return ''
  const inner = firstTag(block, 'value')
  return decodeXml(inner || block).trim()
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function numberValue(value: string): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseTickers(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const tickers = value.split(',').map((t) => t.trim().toUpperCase()).filter((t) => /^[A-Z.-]{1,12}$/.test(t))
  return tickers.length > 0 ? unique(tickers) : undefined
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
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

export const SEC_FORM4_SOURCE_ID = SOURCE_ID
