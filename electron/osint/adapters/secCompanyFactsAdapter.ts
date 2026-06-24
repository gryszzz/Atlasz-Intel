/*
 * SEC Company Facts adapter (XBRL companyfacts).
 *
 * Attaches REAL SEC-reported fundamentals to canonical CIK/ticker identities from
 * the Market Reference Master spine. Official SEC source, public, no key — but a
 * descriptive User-Agent (ATLASZ_SEC_USER_AGENT) is required or we fail closed.
 *
 * Discipline: historical reported facts ONLY — no forward estimates, no valuation,
 * no AI interpretation, no trading signal. CIKs are resolved from the official
 * company_tickers.json identity file (not guessed). Malformed facts are dropped,
 * never repaired. HTTP/schema/rate-limit failures fail closed. Records carry a
 * staleAt so the UI can show a stale/cache state.
 *
 * provenance: public-disclosure   category: company-fact
 */
import { asNumber, asString, sha256, stableStringify, unique, adapterEventId } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { parseSecCompanyTickers } from './marketReferenceAdapter'
import type { SecCompanyFact, SecCompanyFactChangeType, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'sec_company_facts_public'
const DEFAULT_FACTS_BASE = 'https://data.sec.gov/api/xbrl/companyfacts'
const DEFAULT_IDENTITY_URL = 'https://www.sec.gov/files/company_tickers.json'
const DEFAULT_STALE_DAYS = 100
const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_500
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Allowlisted tickers (Market Reference sample) — bounded, identity-resolved.
const DEFAULT_TICKERS = ['NVDA', 'AMD', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'INTC', 'XOM', 'CVX']

/**
 * Canonical concept allowlist. Each maps to one or more (taxonomy, concept)
 * candidates; the first present in a filing's facts wins. Only cleanly-mapped
 * concepts are included — nothing is inferred or computed.
 */
const CONCEPT_MAP: Array<{ label: string; candidates: Array<{ taxonomy: string; concept: string }> }> = [
  { label: 'Revenue', candidates: [{ taxonomy: 'us-gaap', concept: 'RevenueFromContractWithCustomerExcludingAssessedTax' }, { taxonomy: 'us-gaap', concept: 'Revenues' }] },
  { label: 'Net income', candidates: [{ taxonomy: 'us-gaap', concept: 'NetIncomeLoss' }] },
  { label: 'Assets', candidates: [{ taxonomy: 'us-gaap', concept: 'Assets' }] },
  { label: 'Liabilities', candidates: [{ taxonomy: 'us-gaap', concept: 'Liabilities' }] },
  { label: 'Cash', candidates: [{ taxonomy: 'us-gaap', concept: 'CashAndCashEquivalentsAtCarryingValue' }] },
  { label: 'Capex', candidates: [{ taxonomy: 'us-gaap', concept: 'PaymentsToAcquirePropertyPlantAndEquipment' }] },
  { label: 'Shares outstanding', candidates: [{ taxonomy: 'dei', concept: 'EntityCommonStockSharesOutstanding' }, { taxonomy: 'us-gaap', concept: 'CommonStockSharesOutstanding' }] },
]

export type CompanyFactsConfig = {
  factsBase: string
  identityUrl: string
  userAgent: string
  tickers: string[]
  staleAfterMs: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export type CompanyIdentityRef = { ticker: string; cik: string; cikPadded: string; companyName: string }

export function readCompanyFactsConfig(env: NodeJS.ProcessEnv = process.env): CompanyFactsConfig | null {
  if (env.ATLASZ_SEC_FACTS_DISABLE === '1') {
    return null
  }
  const userAgent = asString(env.ATLASZ_SEC_USER_AGENT)
  // SEC requires a descriptive, contactable User-Agent. Fail closed without it.
  if (!userAgent || !/@|https?:\/\//.test(userAgent)) {
    return null
  }
  const factsBase = asString(env.ATLASZ_SEC_FACTS_BASE) || DEFAULT_FACTS_BASE
  const identityUrl = asString(env.ATLASZ_SEC_FACTS_IDENTITY_URL) || DEFAULT_IDENTITY_URL
  // Official SEC sources only — refuse a non-SEC host rather than fetch elsewhere.
  if (!isSecHost(factsBase) || !isSecHost(identityUrl)) {
    return null
  }
  const staleDays = clampInt(Number(env.ATLASZ_SEC_FACTS_STALE_DAYS ?? DEFAULT_STALE_DAYS), 1, 400)
  return {
    factsBase,
    identityUrl,
    userAgent,
    tickers: parseTickers(env.ATLASZ_SEC_FACTS_TICKERS) ?? DEFAULT_TICKERS,
    staleAfterMs: staleDays * 24 * 60 * 60 * 1000,
    timeoutMs: clampInt(Number(env.ATLASZ_SEC_FACTS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_SEC_FACTS_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_SEC_FACTS_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

/** Resolve allowlisted tickers to canonical CIK identities via company_tickers.json. */
export async function resolveCompanyIdentities(config: CompanyFactsConfig, signal: AbortSignal): Promise<CompanyIdentityRef[]> {
  const response = await fetch(config.identityUrl, { signal, headers: { accept: 'application/json', 'user-agent': config.userAgent } })
  assertOk(response, 'SEC company tickers')
  const payload = (await response.json()) as unknown
  const identities = parseSecCompanyTickers(payload, { retrievedAt: Date.now() })
  const wanted = new Set(config.tickers.map((t) => t.toUpperCase()))
  return identities
    .filter((identity) => wanted.has(identity.ticker.toUpperCase()))
    .map((identity) => ({ ticker: identity.ticker, cik: identity.cik, cikPadded: identity.cikPadded, companyName: identity.legalName }))
}

export async function fetchSecCompanyFacts(
  signal: AbortSignal,
  config = readCompanyFactsConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const identities = await resolveCompanyIdentities(config, signal)
  const records: SecCompanyFact[] = []
  for (const identity of identities) {
    const url = `${config.factsBase.replace(/\/$/, '')}/CIK${identity.cikPadded}.json`
    const payload = await fetchWithRetry(
      (attemptSignal) => fetchFactsJson(url, config.userAgent, linkedSignal(signal, attemptSignal)),
      { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
    )
    records.push(...parseCompanyFacts(payload, { identity, retrievedAt: Date.now(), sourceUrl: url, staleAfterMs: config.staleAfterMs }))
  }
  return normalizeCompanyFacts(records)
}

async function fetchFactsJson(url: string, userAgent: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: 'application/json', 'user-agent': userAgent } })
  assertOk(response, 'SEC company facts')
  return response.json() as Promise<unknown>
}

/** Pure parser — testable with official companyfacts fixtures. Latest fact per concept. */
export function parseCompanyFacts(
  payload: unknown,
  options: { identity: CompanyIdentityRef; retrievedAt?: number; sourceUrl?: string; staleAfterMs?: number },
): SecCompanyFact[] {
  const root = asObject(payload)
  const facts = asObject(root?.facts)
  if (!root || !facts) return []
  const { identity } = options
  const retrievedAt = options.retrievedAt ?? Date.now()
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_DAYS * 24 * 60 * 60 * 1000
  const sourceUrl = options.sourceUrl ?? `${DEFAULT_FACTS_BASE}/CIK${identity.cikPadded}.json`
  const companyName = asString(root.entityName) || identity.companyName
  const out: SecCompanyFact[] = []

  for (const { label, candidates } of CONCEPT_MAP) {
    // A company may migrate between equivalent concepts over time (e.g. Revenues ->
    // RevenueFromContractWithCustomerExcludingAssessedTax). Pick the candidate whose
    // latest fact is FRESHEST, not just the first one present.
    let chosen: { taxonomy: string; concept: string; conceptNode: Record<string, unknown>; unitKey: string; latest: Record<string, unknown> } | null = null
    for (const candidate of candidates) {
      const conceptNode = asObject(asObject(facts[candidate.taxonomy])?.[candidate.concept])
      if (!conceptNode) continue
      const units = asObject(conceptNode.units)
      if (!units) continue
      const unitKey = Object.keys(units)[0]
      const series = Array.isArray(units[unitKey]) ? (units[unitKey] as unknown[]) : []
      const latest = latestFact(series)
      if (!latest) continue
      if (!chosen || factSortKey(latest) > factSortKey(chosen.latest)) {
        chosen = { taxonomy: candidate.taxonomy, concept: candidate.concept, conceptNode, unitKey, latest }
      }
    }
    {
      if (!chosen) continue
      const candidate = { taxonomy: chosen.taxonomy, concept: chosen.concept }
      const conceptNode = chosen.conceptNode
      const unitKey = chosen.unitKey
      const latest = chosen.latest

      const value = asNumber(latest.val)
      const periodEnd = asString(latest.end)
      const form = asString(latest.form)
      const filedDate = asString(latest.filed)
      if (value === undefined || !ISO_DATE_PATTERN.test(periodEnd) || !form || !ISO_DATE_PATTERN.test(filedDate)) {
        continue // malformed latest fact -> drop this concept, never repair
      }

      const rawPayloadJson = stableStringify({
        cik: identity.cik,
        taxonomy: candidate.taxonomy,
        concept: candidate.concept,
        unit: unitKey,
        val: value,
        start: asString(latest.start) || undefined,
        end: periodEnd,
        fy: asNumber(latest.fy),
        fp: asString(latest.fp),
        form,
        filed: filedDate,
        accn: asString(latest.accn) || undefined,
        frame: asString(latest.frame) || undefined,
      })

      out.push({
        id: `${SOURCE_ID}:${identity.cikPadded}:${candidate.taxonomy}:${candidate.concept}:${periodEnd}`.toLowerCase(),
        cik: identity.cik,
        cikPadded: identity.cikPadded,
        ticker: identity.ticker,
        companyName,
        taxonomy: candidate.taxonomy,
        concept: candidate.concept,
        conceptLabel: label,
        factLabel: asString(conceptNode.label) || candidate.concept,
        unit: unitKey,
        value,
        periodStart: ISO_DATE_PATTERN.test(asString(latest.start)) ? asString(latest.start) : undefined,
        periodEnd,
        fiscalYear: asNumber(latest.fy),
        fiscalPeriod: asString(latest.fp) || undefined,
        form,
        filedDate,
        accessionNumber: asString(latest.accn) || undefined,
        frame: asString(latest.frame) || undefined,
        sourceUrl,
        retrievedAt,
        staleAt: retrievedAt + staleAfterMs,
        provenance: 'public-disclosure',
        confidence: 96,
        changeType: 'first_seen',
        rawPayloadHash: sha256(rawPayloadJson),
        rawPayloadJson,
      })
    }
  }
  return out
}

export function normalizeCompanyFacts(records: SecCompanyFact[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) continue
    events.push(toEvent(record))
  }
  return events
}

export function applyCompanyFactChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.companyFact) return event
  const prior = previous?.companyFact
  const changeType: SecCompanyFactChangeType = !prior
    ? 'first_seen'
    : prior.rawPayloadHash === event.companyFact.rawPayloadHash
      ? 'unchanged'
      : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return { ...event, timestamp, companyFact: { ...event.companyFact, changeType } }
}

function toEvent(record: SecCompanyFact): WorldIntelEvent {
  const dedupeKey = `companyfact|${record.cik}|${record.concept}|${record.periodEnd}`.toLowerCase()
  const value = formatValue(record.value, record.unit)
  const period = record.fiscalYear ? ` ${record.fiscalPeriod ?? ''} FY${record.fiscalYear}`.trimEnd() : ''
  const summary =
    `SEC-reported ${record.conceptLabel.toLowerCase()} for ${record.companyName} (${record.ticker}): ${value} ` +
    `as of ${record.periodEnd}${period}, filed ${record.filedDate} on ${record.form}. ` +
    `Historical SEC-reported fact, not estimate or valuation.`
  const observedAt = Date.parse(`${record.filedDate}T00:00:00Z`)

  // affectedAssets carries the canonical ticker ONLY so the resolver can attach
  // the company to the curated exposure graph by exact alias — not a trading signal.
  return {
    id: adapterEventId(SOURCE_ID, dedupeKey),
    timestamp: Number.isFinite(observedAt) ? observedAt : record.retrievedAt,
    title: `${record.ticker} ${record.conceptLabel}: ${value} (${record.periodEnd})`.slice(0, 180),
    summary,
    countryCodes: ['US'],
    region: 'United States',
    category: 'company-fact',
    severity: 'stable',
    confidence: record.confidence,
    sourceId: SOURCE_ID,
    sourceUrl: record.sourceUrl,
    provenance: 'public-disclosure',
    affectedAssets: [record.ticker],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: unique([record.ticker, record.cikPadded, record.companyName, record.conceptLabel]),
    narrativeTags: unique(['SEC Company Facts', 'reported fundamental', record.conceptLabel]),
    rawPayloadHash: record.rawPayloadHash,
    dedupeHash: sha256(dedupeKey),
    companyFact: record,
  }
}

function latestFact(series: unknown[]): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null
  for (const item of series) {
    const fact = asObject(item)
    if (!fact) continue
    if (!best || factSortKey(fact) > factSortKey(best)) best = fact
  }
  return best
}

/** Sort key for "freshest" fact: most recent period end, then most recent filing. */
function factSortKey(fact: Record<string, unknown>): string {
  return `${asString(fact.end)}|${asString(fact.filed)}`
}

function formatValue(value: number, unit: string): string {
  if (unit === 'USD') {
    const abs = Math.abs(value)
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString('en-US')}`
  }
  if (unit === 'shares') return `${value.toLocaleString('en-US')} shares`
  return `${value.toLocaleString('en-US')} ${unit}`
}

function parseTickers(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const tickers = value.split(',').map((t) => t.trim().toUpperCase()).filter((t) => /^[A-Z.-]{1,12}$/.test(t))
  return tickers.length > 0 ? unique(tickers) : undefined
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/** Only official SEC hosts over https (data.sec.gov / www.sec.gov / sec.gov). */
function isSecHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)sec\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
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

export const SEC_COMPANY_FACTS_SOURCE_ID = SOURCE_ID
export const COMPANY_FACT_CONCEPTS = CONCEPT_MAP.map((c) => c.label)
