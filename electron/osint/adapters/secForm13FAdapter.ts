/*
 * SEC Form 13F institutional-holdings adapter.
 *
 * Official SEC source. Public but requires a descriptive contactable User-Agent
 * (ATLASZ_SEC_USER_AGENT); fail closed without it. Institutional managers are a
 * bounded curated CIK allowlist; the filer NAME comes from the submissions feed
 * (source-bounded). Issuers are identified by CUSIP — mapped to a canonical ticker
 * ONLY via an exact curated CUSIP→ticker table; otherwise the issuer stays
 * source-bounded (name + CUSIP) with no exposure.
 *
 * Discipline: QUARTERLY DELAYED snapshot — never a current position. No conviction,
 * sentiment (bullish/bearish), fund-performance, valuation, price, or trading-advice
 * claims. No person enrichment. Information-table rows only; malformed dropped;
 * HTTP/schema/rate-limit fail closed. Official SEC hosts only.
 *
 * provenance: public-disclosure   category: institutional-holding
 */
import { asString, sha256, stableStringify, unique, adapterEventId } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { Form13FChangeType, Form13FHolding, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_form13f_public'
const DEFAULT_SUBMISSIONS_BASE = 'https://data.sec.gov/submissions'
const DEFAULT_ARCHIVES_BASE = 'https://www.sec.gov/Archives/edgar/data'
const DEFAULT_PER_MANAGER = 1
const MAX_PER_MANAGER = 8
const DEFAULT_MAX_HOLDINGS = 50
const MAX_HOLDINGS_CAP = 500
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_500
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Curated institutional-manager EDGAR CIKs (public identifiers; operator-overridable).
const DEFAULT_MANAGER_CIKS = [
  '1067983', // Berkshire Hathaway
  '1364742', // BlackRock
  '102909', // Vanguard Group
  '93751', // State Street
  '1423053', // Citadel Advisors
  '1595888', // Jane Street Group
  '1037389', // Renaissance Technologies
  '1697748', // ARK Investment Management
]

// Exact CUSIP -> canonical ticker (allowlist issuers only). No fuzzy mapping.
const CUSIP_TO_TICKER: Record<string, string> = {
  '037833100': 'AAPL',
  '67066G104': 'NVDA',
  '594918104': 'MSFT',
  '023135106': 'AMZN',
  '02079K305': 'GOOGL',
  '02079K107': 'GOOG',
  '30303M102': 'META',
  '88160R101': 'TSLA',
  '007903107': 'AMD',
  '458140100': 'INTC',
  '30231G102': 'XOM',
  '166764100': 'CVX',
}

export type Form13FConfig = {
  submissionsBase: string
  archivesBase: string
  userAgent: string
  managerCiks: string[]
  perManagerFilings: number
  maxHoldingsPerFiling: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readForm13FConfig(env: NodeJS.ProcessEnv = process.env): Form13FConfig | null {
  if (env.ATLASZ_SEC_13F_DISABLE === '1') return null
  const userAgent = asString(env.ATLASZ_SEC_USER_AGENT)
  if (!userAgent || !/@|https?:\/\//.test(userAgent)) return null // descriptive UA required
  const submissionsBase = asString(env.ATLASZ_SEC_13F_SUBMISSIONS_BASE) || DEFAULT_SUBMISSIONS_BASE
  const archivesBase = asString(env.ATLASZ_SEC_13F_ARCHIVES_BASE) || DEFAULT_ARCHIVES_BASE
  if (![submissionsBase, archivesBase].every(isSecHost)) return null // official SEC hosts only
  const requestedCiks = parseCiks(env.ATLASZ_SEC_13F_CIKS)
  const managerCiks = requestedCiks
    ? requestedCiks.filter((cik) => DEFAULT_MANAGER_CIKS.includes(cik))
    : DEFAULT_MANAGER_CIKS
  return {
    submissionsBase,
    archivesBase,
    userAgent,
    managerCiks,
    perManagerFilings: clampInt(Number(env.ATLASZ_SEC_13F_PER_MANAGER ?? DEFAULT_PER_MANAGER), 1, MAX_PER_MANAGER),
    maxHoldingsPerFiling: clampInt(Number(env.ATLASZ_SEC_13F_MAX_HOLDINGS ?? DEFAULT_MAX_HOLDINGS), 1, MAX_HOLDINGS_CAP),
    timeoutMs: clampInt(Number(env.ATLASZ_SEC_13F_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_SEC_13F_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_SEC_13F_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchSecForm13F(signal: AbortSignal, config = readForm13FConfig()): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const records: Form13FHolding[] = []
  for (const managerCik of config.managerCiks) {
    const filings = await listRecent13FFilings(managerCik, config, signal)
    for (const filing of filings.slice(0, config.perManagerFilings)) {
      const infoTableUrl = await findInfoTableUrl(filing.dir, config, signal)
      if (!infoTableUrl) continue
      const xml = await fetchText(infoTableUrl, config, signal)
      records.push(
        ...parseForm13F(xml, {
          filer: filing.filer,
          accessionNumber: filing.accessionNumber,
          filingType: filing.filingType,
          reportPeriod: filing.reportPeriod,
          filingDate: filing.filingDate,
          sourceFilingUrl: filing.filingUrl,
          sourceInfoTableUrl: infoTableUrl,
          maxHoldings: config.maxHoldingsPerFiling,
          retrievedAt: Date.now(),
        }),
      )
    }
  }
  return normalizeForm13F(records)
}

type Form13FFilingRef = {
  filer: { cik: string; cikPadded: string; name: string }
  accessionNumber: string
  filingType: string
  reportPeriod: string
  filingDate: string
  filingUrl: string
  dir: string
}

async function listRecent13FFilings(managerCik: string, config: Form13FConfig, signal: AbortSignal): Promise<Form13FFilingRef[]> {
  const cik = managerCik.replace(/\D/g, '').replace(/^0+/, '')
  const cikPadded = cik.padStart(10, '0')
  const url = `${config.submissionsBase.replace(/\/$/, '')}/CIK${cikPadded}.json`
  const payload = await fetchWithRetry((s) => fetchJson(url, config, linkedSignal(signal, s)), { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs })
  const root = asObject(payload)
  const filerName = asString(root?.name)
  const recent = asObject(asObject(root?.filings)?.recent)
  if (!recent) return []
  const forms = asArray(recent.form)
  const accns = asArray(recent.accessionNumber)
  const dates = asArray(recent.filingDate)
  const reportDates = asArray(recent.reportDate)
  const out: Form13FFilingRef[] = []
  for (let i = 0; i < forms.length; i += 1) {
    const form = asString(forms[i]).toUpperCase()
    if (form !== '13F-HR' && form !== '13F-HR/A') continue
    const accessionNumber = asString(accns[i])
    const filingDate = asString(dates[i])
    if (!accessionNumber || !ISO_DATE_PATTERN.test(filingDate)) continue
    const accnNoDashes = accessionNumber.replace(/-/g, '')
    const dir = `${config.archivesBase.replace(/\/$/, '')}/${cik}/${accnNoDashes}`
    out.push({
      filer: { cik, cikPadded, name: filerName },
      accessionNumber,
      filingType: form,
      reportPeriod: asString(reportDates[i]),
      filingDate,
      filingUrl: `${dir}/${accessionNumber}-index.html`,
      dir,
    })
  }
  return out
}

async function findInfoTableUrl(dir: string, config: Form13FConfig, signal: AbortSignal): Promise<string | null> {
  const index = asObject(await fetchWithRetry((s) => fetchJson(`${dir}/index.json`, config, linkedSignal(signal, s)), { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs }))
  const items = asArray(asObject(index?.directory)?.item)
  const candidates = items
    .map((item) => asString(asObject(item)?.name))
    .filter((name) => /\.xml$/i.test(name) && !/^primary_doc\.xml$/i.test(name) && !/^xsl/i.test(name))
  for (const name of candidates) {
    const url = `${dir}/${name}`
    const xml = await fetchText(url, config, signal)
    if (/<(?:[\w-]+:)?informationTable\b/i.test(xml)) return url
  }
  return null
}

/** Pure parser — testable with real 13F information-table XML fixtures. */
export function parseForm13F(
  xml: string,
  options: {
    filer: { cik: string; cikPadded: string; name: string }
    accessionNumber: string
    filingType: string
    reportPeriod: string
    filingDate: string
    sourceFilingUrl?: string
    sourceInfoTableUrl?: string
    maxHoldings?: number
    retrievedAt?: number
  },
): Form13FHolding[] {
  if (!xml || !/<(?:[\w-]+:)?informationTable\b/i.test(xml)) return []
  const { filer, accessionNumber, filingType, reportPeriod, filingDate } = options
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxHoldings = options.maxHoldings ?? DEFAULT_MAX_HOLDINGS
  const isAmendment = /\/A$/i.test(filingType)
  const out: Form13FHolding[] = []

  for (const row of eachTag(xml, 'infoTable')) {
    if (out.length >= maxHoldings) break
    const issuerName = textOf(row, 'nameOfIssuer')
    const cusip = textOf(row, 'cusip').toUpperCase()
    const classTitle = textOf(row, 'titleOfClass')
    const value = numberValue(textOf(row, 'value'))
    const shrs = firstTag(row, 'shrsOrPrnAmt')
    const sharesOrPrincipal = numberValue(textOf(shrs, 'sshPrnamt'))
    const sharesPrincipalType = textOf(shrs, 'sshPrnamtType') || undefined
    const putCall = textOf(row, 'putCall') || undefined
    const investmentDiscretion = textOf(row, 'investmentDiscretion') || undefined
    const voting = firstTag(row, 'votingAuthority')

    if (!hasValidHolding({ issuerName, cusip, value, accessionNumber, filingDate, filingType, filerName: filer.name })) {
      continue // malformed row -> drop, never repair, never infer missing values
    }

    const issuerTicker = CUSIP_TO_TICKER[cusip] // exact mapping only; else undefined
    const sourceFilingUrl = options.sourceFilingUrl ?? ''
    const sourceInfoTableUrl = options.sourceInfoTableUrl ?? ''
    const rawRecord = {
      filerCik: filer.cik,
      accessionNumber,
      filingType,
      reportPeriod,
      issuerName,
      cusip,
      classTitle,
      value,
      sharesOrPrincipal,
      sharesPrincipalType,
      putCall,
      investmentDiscretion,
      sourceFilingUrl,
      sourceInfoTableUrl,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    const confidence = confidenceForHolding({ accessionNumber, filingDate, sourceFilingUrl, sourceInfoTableUrl, rawPayloadJson })

    out.push({
      id: `${SOURCE_ID}:${filer.cikPadded}:${accessionNumber}:${cusip}:${putCall ?? 'none'}`.toLowerCase(),
      accessionNumber,
      filingType,
      isAmendment,
      reportPeriod,
      filingDate,
      filerCik: filer.cik,
      filerCikPadded: filer.cikPadded,
      filerName: filer.name,
      issuerName,
      issuerTicker,
      cusip,
      classTitle,
      value: value as number,
      sharesOrPrincipal,
      sharesPrincipalType,
      putCall,
      investmentDiscretion,
      votingSole: numberValue(textOf(voting, 'Sole')),
      votingShared: numberValue(textOf(voting, 'Shared')),
      votingNone: numberValue(textOf(voting, 'None')),
      sourceFilingUrl,
      sourceInfoTableUrl,
      retrievedAt,
      provenance: 'public-disclosure',
      confidence,
      changeType: 'first_seen',
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }
  return out
}

export function normalizeForm13F(records: Form13FHolding[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

export function applyForm13FChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.form13fHolding) return event
  const prior = previous?.form13fHolding
  const changeType: Form13FChangeType = !prior
    ? 'first_seen'
    : prior.rawPayloadHash === event.form13fHolding.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, form13fHolding: { ...event.form13fHolding, changeType } }
}

function toEvent(record: Form13FHolding): WorldIntelEvent {
  const dedupeKey = `form13f|${record.filerCik}|${record.accessionNumber}|${record.cusip}|${record.putCall ?? ''}`.toLowerCase()
  const formLabel = record.isAmendment ? 'SEC Form 13F-HR/A (amendment)' : 'SEC Form 13F-HR'
  const shares = record.sharesOrPrincipal !== undefined ? `${record.sharesOrPrincipal.toLocaleString('en-US')} ${record.sharesPrincipalType ?? 'shares'}` : 'a position'
  const summary =
    `${formLabel}: ${record.filerName} reported ${shares} of ${record.issuerName} (value ${formatUsd(record.value)} as reported) ` +
    `for the quarter ending ${record.reportPeriod || 'n/a'}, filed ${record.filingDate}. ` +
    `Quarterly SEC-reported holding snapshot; not current position, conviction, or trading advice.`
  const observedAt = ISO_DATE_PATTERN.test(record.filingDate) ? Date.parse(`${record.filingDate}T00:00:00Z`) : record.retrievedAt

  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: Number.isFinite(observedAt) ? observedAt : record.retrievedAt,
    title: `13F: ${record.filerName} · ${record.issuerName}${record.issuerTicker ? ` (${record.issuerTicker})` : ''}`.slice(0, 180),
    summary,
    countryCodes: ['US'],
    region: 'United States',
    category: 'institutional-holding',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceFilingUrl || record.sourceInfoTableUrl,
    provenance: 'public-disclosure',
    // affectedAssets carries the issuer ticker ONLY when an exact CUSIP mapping
    // exists — so exposure resolves through the canonical identity, never fuzzy.
    affectedAssets: record.issuerTicker ? [record.issuerTicker] : [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.filerName, record.issuerName, record.cusip, record.issuerTicker ?? '']),
    narrativeTags: unique(['SEC Form 13F', 'institutional holding', record.filerName]),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    form13fHolding: record,
  }
}

function hasValidHolding(input: {
  issuerName: string
  cusip: string
  value: number | undefined
  accessionNumber: string
  filingDate: string
  filingType: string
  filerName: string
}): boolean {
  return Boolean(
    input.filerName &&
      (input.filingType === '13F-HR' || input.filingType === '13F-HR/A') &&
      input.issuerName &&
      /^[0-9A-Z]{9}$/.test(input.cusip) &&
      input.value !== undefined &&
      Number.isFinite(input.value) &&
      input.accessionNumber &&
      ISO_DATE_PATTERN.test(input.filingDate),
  )
}

function confidenceForHolding(input: {
  accessionNumber: string
  filingDate: string
  sourceFilingUrl: string
  sourceInfoTableUrl: string
  rawPayloadJson: string
}): number {
  return input.accessionNumber &&
    ISO_DATE_PATTERN.test(input.filingDate) &&
    isSecHost(input.sourceFilingUrl) &&
    isSecHost(input.sourceInfoTableUrl) &&
    input.rawPayloadJson.length > 2
    ? 96
    : 70
}

function isSecHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)sec\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

async function fetchJson(url: string, config: Form13FConfig, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json', 'user-agent': config.userAgent } })
  assertOk(response, 'SEC 13F submissions')
  return response.json() as Promise<unknown>
}

async function fetchText(url: string, config: Form13FConfig, signal: AbortSignal): Promise<string> {
  return fetchWithRetry(
    async (s) => {
      const response = await fetch(url, { signal: linkedSignal(signal, s), headers: { accept: 'application/xml, text/xml, application/json', 'user-agent': config.userAgent } })
      assertOk(response, 'SEC 13F document')
      return response.text()
    },
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
}

function firstTag(xml: string, tag: string): string {
  const match = new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i').exec(xml)
  return match?.[1] ?? ''
}

function eachTag(xml: string, tag: string): string[] {
  if (!xml) return []
  return [...xml.matchAll(new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'gi'))].map((m) => m[1] ?? '')
}

function textOf(xml: string, tag: string): string {
  return decodeXml(firstTag(xml, tag)).trim()
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
  const n = Number(value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function formatUsd(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toLocaleString('en-US')}`
}

function parseCiks(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const ciks = value.split(',').map((c) => c.replace(/\D/g, '').replace(/^0+/, '')).filter(Boolean)
  return ciks.length > 0 ? unique(ciks) : undefined
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

export const SEC_FORM13F_SOURCE_ID = SOURCE_ID
export const FORM13F_CUSIP_TICKERS = CUSIP_TO_TICKER
