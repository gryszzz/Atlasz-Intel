/*
 * Realtime Coverage + Market-Relevance Audit.
 *
 * A system-level audit over the market-impact universe: it maps Atlasz's REAL
 * connectors (and curated seeds) into market-relevance layers, declares each
 * one's cadence + market relevance, folds in live runtime status (from the
 * connector audit), and HONESTLY flags high-impact layers that are missing.
 *
 * Honesty rules (enforced here + in tests):
 *  - nothing is "covered" unless a real connector exists for it (provider
 *    'connector' + a known connector id), or it is explicitly curated-reference.
 *  - nothing is "live" unless cadence is realtime/near-realtime AND a connector
 *    is actually online — declared cadence alone is never "live".
 *  - curated-reference never counts as live coverage; media-observation never
 *    counts as verified coverage. Both have their own buckets.
 *  - missing layers are first-class (`provider: 'none'`) with a missingReason.
 */
import type { EntityKind } from './entityModel'
import type { ConnectorAuditRow, ConnectorRuntimeStatus } from './runtimeAudit'

export type MarketLayer =
  | 'market-identity'
  | 'price-market-data'
  | 'company-fundamentals'
  | 'ownership-positioning'
  | 'macro-rates-fiscal'
  | 'policy-regulation'
  | 'energy-commodities'
  | 'trade-logistics'
  | 'physical-risk'
  | 'technology-innovation'
  | 'cyber-operational-risk'
  | 'media-narrative'
  | 'geospatial-infrastructure'
  | 'structural-exposure'

export type Cadence =
  | 'realtime'
  | 'near-realtime'
  | 'intraday'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'static-reference'
  | 'curated-reference'
  | 'configured-only'

export type MarketRelevance = 'high' | 'medium' | 'low'

/** How a WatchedThing is backed: a runtime connector, a curated seed, or nothing yet. */
export type WatchedProvider = 'connector' | 'curated-seed' | 'none'

export type CoverageBucket =
  | 'realtime'
  | 'daily'
  | 'periodic'
  | 'static-reference'
  | 'curated-reference'
  | 'media-observation'
  | 'configured-only'
  | 'key-gated-unconfigured'
  | 'stale-or-failed'
  | 'missing'

export type WatchedThing = {
  id: string
  layer: MarketLayer
  label: string
  entityKinds: EntityKind[]
  provider: WatchedProvider
  /** Connector audit ids backing this (runtimeAudit.CONNECTOR_AUDIT_DEFINITIONS). */
  connectors: string[]
  cadence: Cadence
  trustTier: 'official-api' | 'public-disclosure' | 'public-unauthenticated' | 'curated-reference' | 'media-observation' | 'none'
  freshnessWindowMs: number
  expectedProofFields: string[]
  marketRelevance: MarketRelevance
  notes: string
  missingReason?: string
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const PROOF = ['sourceUrl', 'retrievedAt', 'rawPayloadHash', 'confidence', 'provenance']

function covered(
  id: string,
  layer: MarketLayer,
  label: string,
  connectors: string[],
  cadence: Cadence,
  trustTier: WatchedThing['trustTier'],
  entityKinds: EntityKind[],
  marketRelevance: MarketRelevance,
  freshnessWindowMs: number,
  notes: string,
): WatchedThing {
  return { id, layer, label, provider: 'connector', connectors, cadence, trustTier, entityKinds, marketRelevance, freshnessWindowMs, expectedProofFields: PROOF, notes }
}

function curated(id: string, layer: MarketLayer, label: string, entityKinds: EntityKind[], notes: string): WatchedThing {
  return { id, layer, label, provider: 'curated-seed', connectors: [], cadence: 'curated-reference', trustTier: 'curated-reference', entityKinds, marketRelevance: 'medium', freshnessWindowMs: Number.POSITIVE_INFINITY, expectedProofFields: ['sourceNote', 'confidence'], notes }
}

function missing(id: string, layer: MarketLayer, label: string, entityKinds: EntityKind[], marketRelevance: MarketRelevance, missingReason: string): WatchedThing {
  return { id, layer, label, provider: 'none', connectors: [], cadence: 'configured-only', trustTier: 'none', entityKinds, marketRelevance, freshnessWindowMs: DAY, expectedProofFields: PROOF, notes: 'Not yet built.', missingReason }
}

/**
 * The market-impact universe. Covered entries reference REAL connector ids;
 * missing entries are honest gaps with a reason. Curated entries are structure,
 * not live coverage.
 */
export const COVERAGE_REGISTRY: WatchedThing[] = [
  // 1. Market identity
  covered('identity-master', 'market-identity', 'Ticker/CIK identity', ['market-reference-master', 'sec-edgar'], 'daily', 'official-api', ['company', 'ticker', 'cik'], 'high', 7 * DAY, 'SEC company_tickers identity. No exchange/sector/industry mapping yet.'),
  missing('identity-exchanges-industries', 'market-identity', 'Exchanges / industries / global identity', ['company', 'ticker'], 'medium', 'No exchange listing, GICS-style industry, or non-US registry / ADR identity source wired.'),

  // 2. Price / market data
  missing('price-equities', 'price-market-data', 'Realtime equities', ['ticker', 'company'], 'high', 'No realtime/near-realtime equities price feed wired.'),
  missing('price-forex', 'price-market-data', 'Forex', ['ticker'], 'high', 'No FX feed wired.'),
  missing('price-futures', 'price-market-data', 'Commodity futures', ['commodity'], 'high', 'No commodity futures feed wired.'),
  missing('price-rates-vol', 'price-market-data', 'Rates / yields / volatility', ['macro-series'], 'high', 'Rates available via FRED (macro), but no realtime yield-curve/vol surface.'),

  // 3. Company fundamentals
  covered('fundamentals-facts', 'company-fundamentals', 'SEC reported fundamentals', ['sec-company-facts', 'sec-edgar'], 'daily', 'public-disclosure', ['company', 'filing'], 'high', 2 * DAY, 'XBRL companyfacts + filings. No estimates/valuation.'),
  missing('fundamentals-earnings', 'company-fundamentals', 'Earnings dates / releases / transcripts / guidance', ['company', 'ticker'], 'high', 'No earnings calendar, release, transcript, or guidance source wired (needs strict no-hype rules).'),

  // 4. Ownership / positioning
  covered('ownership-insiders', 'ownership-positioning', 'Insider transactions (Form 4)', ['sec-form4'], 'daily', 'public-disclosure', ['company', 'reporting-owner'], 'high', 2 * DAY, 'Event-driven insider ownership transactions.'),
  covered('ownership-institutions', 'ownership-positioning', 'Institutional holdings (13F)', ['sec-form13f'], 'quarterly', 'public-disclosure', ['company', 'institution', 'cusip'], 'high', 100 * DAY, 'Quarterly DELAYED 13F snapshots; not current positions.'),
  covered('ownership-etf', 'ownership-positioning', 'ETF basket holdings', ['etf-holdings'], 'daily', 'public-disclosure', ['etf', 'index', 'company'], 'high', 8 * DAY, 'Dated issuer holdings (SOXX/SPY/XLK/XLE/XLU). Limited fund coverage.'),
  missing('ownership-short-options', 'ownership-positioning', 'Short interest / options open interest', ['ticker', 'company'], 'high', 'No short-interest or options-OI source wired.'),

  // 5. Macro / rates / fiscal
  covered('macro-us', 'macro-rates-fiscal', 'US macro (FRED/Treasury/BLS/BEA)', ['fred', 'treasury-fiscal', 'bls', 'bea'], 'monthly', 'official-api', ['macro-series', 'fiscal-series', 'institution'], 'high', 35 * DAY, 'Official US macro/fiscal/labor/national-accounts series.'),
  missing('macro-central-banks', 'macro-rates-fiscal', 'Central banks ex-US / global bodies', ['institution', 'macro-series'], 'high', 'No ECB/BOJ/BOE/IMF/World Bank/OECD source wired.'),

  // 6. Policy / regulation / state action
  covered('policy-us', 'policy-regulation', 'US regulation / legislation / sanctions', ['federal-register', 'congress-gov', 'ofac-sdn'], 'daily', 'official-api', ['regulatory-document', 'legislation', 'sanctions-record'], 'high', 3 * DAY, 'Federal Register + Congress.gov + OFAC SDN. Tariffs/export-controls only via these documents.'),

  // 7. Energy / commodities
  covered('energy-series', 'energy-commodities', 'EIA energy/commodity series', ['eia'], 'monthly', 'official-api', ['commodity', 'macro-series'], 'high', 14 * DAY, 'Official EIA energy series (oil/gas/electricity).'),
  covered('energy-grid', 'energy-commodities', 'Grid regions / balancing authorities', ['eia-balancing-authorities'], 'static-reference', 'official-api', ['balancing-authority'], 'medium', 120 * DAY, 'BA reference; plant->BA via plant codes. Region-only.'),
  covered('energy-reactor-status', 'energy-commodities', 'NRC reactor status', ['nrc-reactor-status'], 'daily', 'official-api', ['facility'], 'medium', 4 * DAY, 'Daily reactor power level as the regulator publishes it.'),

  // 8. Trade / logistics
  covered('trade-flows', 'trade-logistics', 'Trade flows (Comtrade)', ['un-comtrade'], 'annual', 'official-api', ['trade-flow', 'commodity', 'country'], 'high', 400 * DAY, 'Bounded annual/periodic trade flows; no company-level claims.'),
  covered('trade-port-codes', 'trade-logistics', 'Port/location codes (UN/LOCODE)', ['un-locode'], 'static-reference', 'official-api', ['facility', 'place'], 'medium', 200 * DAY, 'Location-code registry; not live port activity.'),
  covered('trade-ports-physical', 'trade-logistics', 'Physical ports (World Port Index)', ['world-port-index'], 'static-reference', 'official-api', ['facility'], 'medium', 200 * DAY, 'Port location/harbor attributes; not live traffic.'),
  missing('trade-movement', 'trade-logistics', 'Live shipping AIS / aviation ADS-B / rail / port congestion', ['facility'], 'high', 'No AIS/ADS-B/rail/official port-congestion feed wired (movement feeds).'),

  // 9. Physical risk
  covered('risk-weather', 'physical-risk', 'NOAA/NWS alerts', ['noaa-alerts'], 'near-realtime', 'official-api', ['event', 'place', 'country'], 'high', 6 * HOUR, 'Active weather alerts; near-realtime polling.'),
  covered('risk-quakes', 'physical-risk', 'USGS earthquakes', ['usgs-earthquakes'], 'near-realtime', 'official-api', ['event', 'country'], 'high', 6 * HOUR, 'Observed earthquakes; near-realtime feed.'),
  missing('risk-fire-drought-flood', 'physical-risk', 'Wildfire / drought / hurricane track / flood gauges', ['event', 'place'], 'high', 'No wildfire/drought/hurricane-track/flood-gauge source wired.'),

  // 10. Technology / innovation
  covered('tech-research', 'technology-innovation', 'Patents / research / open-source', ['uspto', 'openalex-works', 'crossref-works', 'github-releases'], 'weekly', 'official-api', ['patent', 'research-work', 'repository', 'technology'], 'medium', 30 * DAY, 'USPTO + OpenAlex + Crossref + GitHub releases. Metadata only.'),

  // 11. Cyber / operational risk
  covered('cyber-vulns', 'cyber-operational-risk', 'Vulnerabilities & advisories', ['cisa-kev', 'nvd', 'ghsa', 'osv', 'cisa-advisories'], 'daily', 'official-api', ['vulnerability', 'technology'], 'medium', 2 * DAY, 'KEV+NVD+GHSA+OSV+CISA advisories converging on CVE nodes. Defensive only.'),

  // 12. Media / narrative
  covered('media-gdelt', 'media-narrative', 'GDELT (media observation)', ['gdelt-doc'], 'near-realtime', 'media-observation', ['event'], 'low', 6 * HOUR, 'Media observation only — never verified fact, never counted as coverage.'),

  // 13. Geospatial / infrastructure
  covered('infra-power', 'geospatial-infrastructure', 'Power plants', ['eia-power-plants'], 'monthly', 'official-api', ['facility', 'place'], 'high', 45 * DAY, 'EIA-860M plant facilities; location/capacity context only.'),
  covered('infra-refineries', 'geospatial-infrastructure', 'Refineries', ['eia-refineries'], 'static-reference', 'official-api', ['facility'], 'medium', 180 * DAY, 'EIA-820 petroleum refineries.'),
  covered('infra-lng', 'geospatial-infrastructure', 'LNG terminals', ['lng-terminals'], 'static-reference', 'official-api', ['facility'], 'medium', 180 * DAY, 'EIA/FERC LNG terminals; fail-closed without an official URL.'),
  covered('infra-nuclear', 'geospatial-infrastructure', 'Nuclear plants', ['eia-nuclear'], 'monthly', 'official-api', ['facility'], 'medium', 45 * DAY, 'EIA-860M nuclear facilities.'),
  covered('infra-mines', 'geospatial-infrastructure', 'Mineral sites / mines', ['usgs-minerals'], 'static-reference', 'official-api', ['facility', 'commodity'], 'high', 180 * DAY, 'USGS USMIN + MRDS (legacy). Reference only.'),
  missing('infra-tech-plants', 'geospatial-infrastructure', 'Data centers / fabs / battery / EV / chemical / steel plants', ['facility'], 'high', 'No official data-center/fab/battery/EV/chemical/steel-plant facility source wired (airports/rail hubs too).'),

  // 14. Structural exposure (curated)
  curated('structure-seeds', 'structural-exposure', 'Curated exposure seeds + minerals crosswalk', ['company', 'commodity', 'technology', 'sector', 'index', 'infrastructure'], 'Semiconductor/ports/energy/patents/corporate/critical-minerals seeds. Curated-reference structure, never live evidence.'),
]

export type CoverageAuditItem = WatchedThing & {
  bucket: CoverageBucket
  connectorStatuses: Array<{ id: string; status: ConnectorRuntimeStatus | 'unknown' }>
  lastSuccessfulFetch?: number
  recordCount: number
  freshness: 'fresh' | 'stale' | 'unknown'
  /** True only when cadence is realtime/near-realtime AND a connector is online. */
  liveCovered: boolean
}

export type CoverageSummary = {
  total: number
  covered: number
  missing: number
  realtime: number
  daily: number
  periodic: number
  staticReference: number
  curatedReference: number
  mediaObservation: number
  configuredOnly: number
  keyGatedUnconfigured: number
  staleOrFailed: number
  highRelevanceMissing: number
}

export type CoverageAudit = {
  generatedAt: number
  items: CoverageAuditItem[]
  byLayer: Record<MarketLayer, CoverageAuditItem[]>
  byBucket: Record<CoverageBucket, CoverageAuditItem[]>
  summary: CoverageSummary
}

const STALE_FAIL: ReadonlySet<ConnectorRuntimeStatus> = new Set(['stale', 'failed', 'rate-limited', 'unavailable'])
const UNCONFIGURED: ReadonlySet<ConnectorRuntimeStatus> = new Set(['missing-key', 'not-wired', 'disabled'])
const PENDING: ReadonlySet<ConnectorRuntimeStatus> = new Set(['configured', 'pending-first-fetch'])
const REALTIME_CADENCE: ReadonlySet<Cadence> = new Set(['realtime', 'near-realtime'])
const DAILY_CADENCE: ReadonlySet<Cadence> = new Set(['intraday', 'daily', 'weekly'])

export function buildCoverageAudit(input: {
  connectorRows: ConnectorAuditRow[]
  now?: number
  registry?: WatchedThing[]
}): CoverageAudit {
  const now = input.now ?? Date.now()
  const registry = input.registry ?? COVERAGE_REGISTRY
  const rowById = new Map(input.connectorRows.map((row) => [row.id, row]))

  const items: CoverageAuditItem[] = registry.map((thing) => {
    const connectorStatuses = thing.connectors.map((id) => ({ id, status: rowById.get(id)?.status ?? ('unknown' as const) }))
    const statuses = connectorStatuses.map((c) => c.status).filter((s): s is ConnectorRuntimeStatus => s !== 'unknown')
    const lastSuccessfulFetch = latest(thing.connectors.map((id) => rowById.get(id)?.lastSuccessfulFetch))
    const recordCount = thing.connectors.reduce((total, id) => total + (rowById.get(id)?.recordCount ?? 0), 0)

    const anyOnline = statuses.includes('online')
    const bucket = bucketFor(thing, statuses, anyOnline)
    const freshness = freshnessFor(thing, lastSuccessfulFetch, now)
    const liveCovered = anyOnline && REALTIME_CADENCE.has(thing.cadence) && thing.trustTier !== 'media-observation'

    return { ...thing, bucket, connectorStatuses, lastSuccessfulFetch, recordCount, freshness, liveCovered }
  })

  const byLayer = groupBy(items, (item) => item.layer) as Record<MarketLayer, CoverageAuditItem[]>
  const byBucket = groupBy(items, (item) => item.bucket) as Record<CoverageBucket, CoverageAuditItem[]>
  return { generatedAt: now, items, byLayer, byBucket, summary: summarize(items) }
}

function bucketFor(thing: WatchedThing, statuses: ConnectorRuntimeStatus[], anyOnline: boolean): CoverageBucket {
  if (thing.provider === 'curated-seed' || thing.trustTier === 'curated-reference') return 'curated-reference'
  if (thing.trustTier === 'media-observation') return 'media-observation'
  if (thing.provider === 'none' || thing.connectors.length === 0) return 'missing'
  if (statuses.length === 0) return 'configured-only' // wired but no runtime snapshot yet
  if (statuses.every((s) => UNCONFIGURED.has(s))) return 'key-gated-unconfigured'
  if (anyOnline) {
    if (REALTIME_CADENCE.has(thing.cadence)) return 'realtime'
    if (DAILY_CADENCE.has(thing.cadence)) return 'daily'
    if (thing.cadence === 'static-reference') return 'static-reference'
    return 'periodic'
  }
  if (statuses.some((s) => STALE_FAIL.has(s))) return 'stale-or-failed'
  if (statuses.some((s) => PENDING.has(s))) return 'configured-only'
  return 'configured-only'
}

function freshnessFor(thing: WatchedThing, lastSuccessfulFetch: number | undefined, now: number): 'fresh' | 'stale' | 'unknown' {
  if (thing.provider !== 'connector') return 'unknown'
  if (lastSuccessfulFetch === undefined) return 'unknown'
  return now - lastSuccessfulFetch <= thing.freshnessWindowMs ? 'fresh' : 'stale'
}

function summarize(items: CoverageAuditItem[]): CoverageSummary {
  const count = (bucket: CoverageBucket) => items.filter((i) => i.bucket === bucket).length
  return {
    total: items.length,
    covered: items.filter((i) => i.provider === 'connector').length,
    missing: count('missing'),
    realtime: count('realtime'),
    daily: count('daily'),
    periodic: count('periodic'),
    staticReference: count('static-reference'),
    curatedReference: count('curated-reference'),
    mediaObservation: count('media-observation'),
    configuredOnly: count('configured-only'),
    keyGatedUnconfigured: count('key-gated-unconfigured'),
    staleOrFailed: count('stale-or-failed'),
    highRelevanceMissing: items.filter((i) => i.bucket === 'missing' && i.marketRelevance === 'high').length,
  }
}

function latest(values: Array<number | undefined>): number | undefined {
  const finite = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return finite.length > 0 ? Math.max(...finite) : undefined
}

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const item of items) {
    const k = key(item)
    ;(out[k] ??= []).push(item)
  }
  return out
}
