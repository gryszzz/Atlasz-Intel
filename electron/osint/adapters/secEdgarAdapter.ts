/*
 * SEC EDGAR public filings adapter (Phase 2).
 *
 * Uses ONLY the official SEC EDGAR public "latest filings" Atom feed. SEC
 * requires a descriptive User-Agent with contact info; we fail closed if
 * ATLASZ_SEC_USER_AGENT is not configured (no anonymous hammering).
 *
 * Filters 8-K / 10-Q / 10-K (+ amendments). CIK->ticker mapping is applied
 * only from a configured map; unmapped filings are KEPT (no invented tickers).
 *
 * provenance: official-api   category: filing
 */
import { adapterEventId, asString, buildAdapterEvent, unique } from './adapterShared'
import type { WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_edgar_public'
const DEFAULT_FORMS = ['8-K', '10-Q', '10-K']
const CURRENT_FEED =
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&count=100&output=atom'

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
  let cikTickerMap: Record<string, string> = {}
  const rawMap = asString(env.ATLASZ_SEC_CIK_TICKER_MAP)
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap) as Record<string, string>
      if (parsed && typeof parsed === 'object') {
        cikTickerMap = Object.fromEntries(
          Object.entries(parsed).map(([cik, ticker]) => [normalizeCik(cik), String(ticker).toUpperCase()]),
        )
      }
    } catch {
      // Ignore malformed map; filings persist unmapped.
    }
  }
  return { userAgent, formTypes, includeAmendments, cikTickerMap }
}

export async function fetchSecFilings(
  signal: AbortSignal,
  config = readSecConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const response = await fetch(CURRENT_FEED, {
    signal,
    headers: { accept: 'application/atom+xml', 'user-agent': config.userAgent },
  })
  if (!response.ok) {
    throw new Error(`SEC EDGAR HTTP ${response.status}`)
  }
  const xml = await response.text()
  const filings = parseSecAtom(xml)
  return normalizeSecFilings(filings, config)
}

/** Pure normalizer — testable with simulated filing records. */
export function normalizeSecFilings(filings: SecFilingRecord[], config: Partial<SecAdapterConfig> = {}): WorldIntelEvent[] {
  const formTypes = (config.formTypes ?? DEFAULT_FORMS).map((value) => value.toUpperCase())
  const includeAmendments = config.includeAmendments ?? true
  const cikTickerMap = config.cikTickerMap ?? {}
  const events: WorldIntelEvent[] = []
  for (const filing of filings) {
    if (!matchesForm(filing.formType, formTypes, includeAmendments)) {
      continue
    }
    events.push(toEvent(filing, cikTickerMap))
  }
  return events
}

function toEvent(filing: SecFilingRecord, cikTickerMap: Record<string, string>): WorldIntelEvent {
  const ticker = cikTickerMap[normalizeCik(filing.cik)] ?? ''
  const accession = filing.accessionNumber || `${filing.cik}-${filing.filedAt}`
  const dedupeKey = `sec|${accession}`.toLowerCase()
  const summary = [
    `SEC ${filing.formType} filing by ${filing.companyName || 'unknown filer'} (CIK ${filing.cik || 'n/a'}).`,
    `Accession ${accession}.`,
    ticker ? `Mapped ticker: ${ticker}.` : 'No ticker mapping available; persisted as unmapped filing.',
  ].join(' ')

  return buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${filing.formType} — ${filing.companyName || 'SEC filer'}`,
    summary,
    source: filing.sourceDomain || 'sec.gov',
    url: filing.filingUrl,
    observedAt: filing.filedAt,
    category: 'filing',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: filing,
    affectedAssets: ticker ? [ticker] : [],
    narrativeTags: unique(['SEC filing', filing.formType, 'Regulatory disclosure']),
    extractedEntities: unique([filing.companyName, `CIK ${filing.cik}`]),
  })
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

/** Minimal, defensive Atom parser for SEC EDGAR current-filings feed. */
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
    if (!formType || !Number.isFinite(filedAt)) {
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

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export const SEC_SOURCE_ID = SOURCE_ID
