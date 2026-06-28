import type { ProvenanceId } from '../provenance'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../worldIntel'
import { eventStructuralExposure } from './entityResolver'
import { freshnessLabel, freshnessWeight, type FreshnessLabel } from './freshness'

export type ConnectorAccessModel =
  | 'public'
  | 'key-gated'
  | 'user-agent-gated'
  | 'optional-key'
  | 'candidate'

export type ConnectorCadence = 'realtime' | 'periodic' | 'manual'

export type ConnectorRuntimeStatus =
  | 'online'
  | 'configured'
  | 'pending-first-fetch'
  | 'missing-key'
  | 'unavailable'
  | 'stale'
  | 'rate-limited'
  | 'failed'
  | 'disabled'
  | 'deferred'
  | 'not-wired'

export type ConnectorAuditDefinition = {
  id: string
  label: string
  domain: string
  sourceIds: string[]
  access: ConnectorAccessModel
  cadence: ConnectorCadence
  sourceIdentity: string
  officialUrl: string
  requiredEnv: string[]
  persistenceTables: string[]
  sourceTrailUi: string
  resolverSupport: 'yes' | 'partial' | 'identifier-only' | 'no' | 'not-wired'
  exposureSupport: 'curated-reference' | 'identifier-only' | 'future' | 'none'
  trust: ProvenanceId | 'catalog-only'
  notes: string
  implemented: boolean
  staleAfterMs?: number
  /** Unresolved by design (metadata/media/registry/status/market-data): not a gap. */
  unresolvedByDesign?: boolean
  /** Built + tested but live runtime wiring intentionally deferred. */
  liveWiringDeferred?: boolean
}

type ConnectorAuditDefinitionInput =
  Omit<ConnectorAuditDefinition, 'implemented' | 'staleAfterMs'> &
  Partial<Pick<ConnectorAuditDefinition, 'implemented' | 'staleAfterMs'>>

export type ConnectorAuditRow = ConnectorAuditDefinition & {
  status: ConnectorRuntimeStatus
  lastSuccessfulFetch?: number
  recordCount: number
  lastError?: string
  activeSourceCount: number
  missingReason?: string
}

export type ExposureSummary = {
  generatedAt: number
  windowMs: number
  consideredEventCount: number
  resolvedEventCount: number
  unresolvedEventCount: number
  curatedReferenceOnlyCount: number
  /** Low-trust media observations (e.g. GDELT) — context only, never in the ranks. */
  mediaObservationCount: number
  topCountries: ExposureCount[]
  topCompanies: ExposureCount[]
  topCommodities: ExposureCount[]
  topSectors: ExposureCount[]
  recentResolvedEvents: ResolvedExposureEvent[]
}

export type ExposureCount = {
  id: string
  label: string
  kind: string
  count: number
  /** Freshness × path-directness weighted score; ranks fresh+exact above stale+indirect. */
  score: number
}

export type ResolvedExposureEvent = {
  eventId: string
  title: string
  sourceId: string
  observedAt: number
  resolvedEntityIds: string[]
  exposedEntityCount: number
  exposureTrust: 'curated-reference'
  /** Canonical freshness of the proving event. */
  freshness: FreshnessLabel
  /** Sum of freshness × path-confidence over this event's exposure paths. */
  exposureScore: number
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const DEFAULT_STALE_AFTER_MS = 30 * HOUR_MS

export const CONNECTOR_AUDIT_DEFINITIONS: ConnectorAuditDefinition[] = [
  connector({
    id: 'gdelt-doc',
    label: 'GDELT (media)',
    domain: 'media observation',
    sourceIds: ['gdelt_doc_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'GDELT Project DOC 2.0 API',
    officialUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'GDELT media-observation source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'media-observation',
    notes: 'Media observation, not verified fact. No causality, tone, or company exposure inferred from headlines.',
  }),
  connector({
    id: 'wsj-markets-rss',
    label: 'WSJ Markets RSS',
    domain: 'market headline observation',
    sourceIds: ['wsj_markets_rss'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Dow Jones / WSJ public Markets RSS feed',
    officialUrl: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Public RSS headline source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'rss-public',
    notes: 'Public market-news headlines only. Full articles are not fetched; headlines remain context, not verified market facts or trading signals.',
  }),
  connector({
    id: 'sec-edgar',
    label: 'SEC EDGAR',
    domain: 'company disclosure',
    sourceIds: ['sec_edgar_public'],
    access: 'user-agent-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Securities and Exchange Commission',
    officialUrl: 'https://data.sec.gov/',
    requiredEnv: ['ATLASZ_SEC_USER_AGENT'],
    persistenceTables: ['sec_company_filings', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC filing source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Official company filings; fail-closed without a contactable User-Agent.',
  }),
  connector({
    id: 'sec-press-rss',
    label: 'SEC Press RSS',
    domain: 'company disclosure and enforcement releases',
    sourceIds: ['sec_press_rss'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Securities and Exchange Commission press releases RSS',
    officialUrl: 'https://www.sec.gov/news/pressreleases.rss',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC press-release RSS source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'rss-public',
    notes: 'Official SEC press-release headlines. Does not replace EDGAR filings and never creates company exposure without a filing/source-specific adapter.',
  }),
  connector({
    id: 'market-reference-master',
    label: 'Market Reference Master',
    domain: 'market identity',
    sourceIds: ['sec_company_tickers_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'SEC company_tickers.json',
    officialUrl: 'https://www.sec.gov/files/company_tickers.json',
    requiredEnv: [],
    persistenceTables: ['market_identity_master', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Market identity source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Official ticker/CIK/legal-title identity only. No exchange, sector, industry, ETF weights, fuzzy merge, or trading signal inferred.',
  }),
  connector({
    id: 'sec-company-facts',
    label: 'SEC Company Facts',
    domain: 'reported fundamentals',
    sourceIds: ['sec_company_facts_public'],
    access: 'user-agent-gated',
    cadence: 'periodic',
    sourceIdentity: 'SEC companyfacts XBRL API',
    officialUrl: 'https://data.sec.gov/api/xbrl/companyfacts/',
    requiredEnv: ['ATLASZ_SEC_USER_AGENT'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC Company Facts source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Historical SEC-reported XBRL facts attached to canonical CIK/ticker identity. No estimates, valuation, or trading signal; CIK from Market Reference Master.',
  }),
  connector({
    id: 'sec-form4',
    label: 'SEC Form 4',
    domain: 'insider transactions',
    sourceIds: ['sec_form4_public'],
    access: 'user-agent-gated',
    cadence: 'periodic',
    sourceIdentity: 'SEC Form 4 ownership filings',
    officialUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=4',
    requiredEnv: ['ATLASZ_SEC_USER_AGENT'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC Form 4 source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Source-reported insider ownership transactions attached to canonical issuer identity. No sentiment, valuation, or trading advice; issuer CIK from Market Reference Master.',
  }),
  connector({
    id: 'sec-form13f',
    label: 'SEC Form 13F',
    domain: 'institutional holdings',
    sourceIds: ['sec_form13f_public'],
    access: 'user-agent-gated',
    cadence: 'periodic',
    sourceIdentity: 'SEC Form 13F-HR filings',
    officialUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=13F',
    requiredEnv: ['ATLASZ_SEC_USER_AGENT'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC Form 13F source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Quarterly DELAYED institutional holding snapshots. Issuer exposure only via exact CUSIP->ticker mapping; no conviction, sentiment, valuation, or trading advice. Bounded manager allowlist; filer source-bounded.',
  }),
  connector({
    id: 'etf-holdings',
    label: 'ETF Holdings',
    domain: 'ETF basket exposure',
    sourceIds: ['etf_holdings_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Official issuer-published ETF holdings files',
    officialUrl: 'https://www.ssga.com/us/en/intermediary/fund-finder',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'ETF holdings source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Dated ETF holdings snapshots from allowlisted issuer files. Source date required; weights/shares/market value only when source-provided. No current-position guarantee, recommendation, price signal, prediction, or trading advice.',
  }),
  connector({
    id: 'fred',
    label: 'FRED',
    domain: 'macro time series',
    sourceIds: ['macro_calendar_fred'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'Federal Reserve Bank of St. Louis FRED',
    officialUrl: 'https://fred.stlouisfed.org/docs/api/fred/',
    requiredEnv: ['ATLASZ_FRED_API_KEY'],
    persistenceTables: ['fred_macro_observations', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official macro observations; no synthetic macro charts or commentary.',
  }),
  connector({
    id: 'treasury-fiscal',
    label: 'Treasury Fiscal Data',
    domain: 'government finance',
    sourceIds: ['treasury_fiscal_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Treasury Fiscal Data',
    officialUrl: 'https://fiscaldata.treasury.gov/api-documentation/',
    requiredEnv: [],
    persistenceTables: ['treasury_fiscal_records', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Fiscal source trail cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official fiscal/debt records; market impact is not inferred.',
  }),
  connector({
    id: 'bls',
    label: 'BLS',
    domain: 'labor and prices',
    sourceIds: ['bls_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Bureau of Labor Statistics',
    officialUrl: 'https://www.bls.gov/developers/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official labor/price series; optional key only raises limits.',
  }),
  connector({
    id: 'fed-press-rss',
    label: 'Federal Reserve Press RSS',
    domain: 'central bank policy releases',
    sourceIds: ['fed_press_rss'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Board of Governors of the Federal Reserve System press releases RSS',
    officialUrl: 'https://www.federalreserve.gov/feeds/press_all.xml',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Federal Reserve RSS source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'rss-public',
    notes: 'Official Federal Reserve release headlines only. Policy-release context, not a macro time-series observation, forecast, or rate prediction.',
  }),
  connector({
    id: 'ecb-press-rss',
    label: 'ECB Press RSS',
    domain: 'central bank policy releases',
    sourceIds: ['ecb_press_rss'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'European Central Bank press releases RSS',
    officialUrl: 'https://www.ecb.europa.eu/rss/press.xml',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'ECB RSS source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'rss-public',
    notes: 'Official ECB release headlines only. Euro-area policy context, not a structured macro series or market forecast.',
  }),
  connector({
    id: 'bea',
    label: 'BEA',
    domain: 'national accounts',
    sourceIds: ['bea_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Bureau of Economic Analysis',
    officialUrl: 'https://www.bea.gov/resources/for-developers',
    requiredEnv: ['ATLASZ_BEA_API_KEY'],
    persistenceTables: ['bea_observations', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'BEA macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official GDP/NIPA observations; key never appears in source trails.',
  }),
  connector({
    id: 'eia',
    label: 'EIA',
    domain: 'energy and commodities',
    sourceIds: ['eia_energy_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Energy Information Administration',
    officialUrl: 'https://www.eia.gov/opendata/',
    requiredEnv: ['ATLASZ_EIA_API_KEY'],
    persistenceTables: ['eia_energy_records', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Energy source trail cards',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Official energy series; no fake commodity alerts.',
  }),
  connector({
    id: 'noaa-alerts',
    label: 'NOAA/NWS Alerts',
    domain: 'weather disruption',
    sourceIds: ['noaa_alerts_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'National Weather Service alerts API',
    officialUrl: 'https://api.weather.gov/alerts/active',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'NOAA weather source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Real alerts only; severity/urgency/certainty come from NWS.',
  }),
  connector({
    id: 'federal-register',
    label: 'Federal Register',
    domain: 'regulatory documents',
    sourceIds: ['federal_register_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Office of the Federal Register / FederalRegister.gov API',
    officialUrl: 'https://www.federalregister.gov/reader-aids/developer-resources/rest-api',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Regulatory document source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official public regulatory document metadata; govinfo PDF is preserved when available. No invented legal impact or ticker exposure.',
  }),
  connector({
    id: 'ofac-sdn',
    label: 'OFAC SDN',
    domain: 'sanctions enforcement',
    sourceIds: ['ofac_sdn_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Treasury OFAC Sanctions List Service',
    officialUrl: 'https://ofac.treasury.gov/sanctions-list-service',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'OFAC sanctions source trail',
    resolverSupport: 'identifier-only',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official SDN list records only. No sanctions screening, fuzzy matching, guilt/risk labels, person enrichment, or ticker exposure.',
  }),
  connector({
    id: 'congress-gov',
    label: 'Congress.gov',
    domain: 'legislative pipeline',
    sourceIds: ['congress_gov_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'Library of Congress / Congress.gov API',
    officialUrl: 'https://api.congress.gov/',
    requiredEnv: ['ATLASZ_CONGRESS_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Congress bill/action source trail',
    resolverSupport: 'identifier-only',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official bill/action metadata only. No fake bills, political interpretation, person enrichment, or inferred company exposure.',
  }),
  connector({
    id: 'usgs-earthquakes',
    label: 'USGS Earthquakes',
    domain: 'physical-world events',
    sourceIds: ['usgs_significant_quakes'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'USGS Earthquake Hazards Program',
    officialUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Timeline/event source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Observed earthquake data; no inferred ticker exposure.',
  }),
  connector({
    id: 'un-comtrade',
    label: 'UN Comtrade',
    domain: 'trade flows',
    sourceIds: ['un_comtrade_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'United Nations Comtrade',
    officialUrl: 'https://comtradeplus.un.org/',
    requiredEnv: ['ATLASZ_UN_COMTRADE_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'UN Comtrade trade-flow source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Catalog-driven, bounded pulls only. Country/partner/commodity trade-flow evidence; no company-level claims or inferred supply chains.',
  }),
  connector({
    id: 'openalex-works',
    label: 'OpenAlex',
    domain: 'research metadata',
    sourceIds: ['openalex_works_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'OpenAlex Works API',
    officialUrl: 'https://docs.openalex.org/api-entities/works',
    requiredEnv: ['ATLASZ_OPENALEX_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'OpenAlex research source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Research metadata only; not validation of technical claims. No company exposure inferred; authors kept minimal.',
  }),
  connector({
    id: 'crossref-works',
    label: 'Crossref',
    domain: 'DOI metadata',
    sourceIds: ['crossref_works_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Crossref REST API',
    officialUrl: 'https://www.crossref.org/documentation/retrieve-metadata/rest-api/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Crossref DOI metadata source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'DOI registry metadata only. No full-text scraping, claim validation, citation-quality claim, or company/market exposure inference.',
  }),
  connector({
    id: 'uspto',
    label: 'USPTO PatentsView',
    domain: 'patent intelligence',
    sourceIds: ['uspto_patentsview_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'USPTO PatentsView API',
    officialUrl: 'https://developer.uspto.gov/api-catalog',
    requiredEnv: ['ATLASZ_PATENTSVIEW_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Patent source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Official patent metadata; person data is not collected by default.',
  }),
  connector({
    id: 'github-releases',
    label: 'GitHub Releases',
    domain: 'open-source activity',
    sourceIds: ['github_releases_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'GitHub REST Releases API',
    officialUrl: 'https://docs.github.com/en/rest/releases/releases',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Timeline/source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-unauthenticated',
    notes: 'Public release metadata; optional token raises rate limits only.',
  }),
  connector({
    id: 'arxiv-ai',
    label: 'arXiv AI',
    domain: 'AI research metadata',
    sourceIds: ['arxiv_cs_ai'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'arXiv public API',
    officialUrl: 'https://export.arxiv.org/api/query',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'arXiv research source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Public arXiv Atom metadata for cs.AI. Metadata only; not peer-review status, claim validation, company exposure, or investment signal.',
  }),
  connector({
    id: 'github-high-signal-repos',
    label: 'GitHub Public Repository Search',
    domain: 'open-source repository metadata',
    sourceIds: ['github_trending_repos'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'GitHub REST Search API',
    officialUrl: 'https://docs.github.com/en/rest/search/search',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'GitHub public repository source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Unauthenticated public repository metadata, rate-limited by GitHub. Popularity context only; no technology quality, company exposure, or market signal.',
  }),
  connector({
    id: 'nasa-news',
    label: 'NASA News RSS',
    domain: 'space and science releases',
    sourceIds: ['nasa_news'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'NASA news-release RSS',
    officialUrl: 'https://www.nasa.gov/news-release/feed/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'NASA RSS source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'rss-public',
    notes: 'Official NASA release headlines only. Space/science context, not a company, defense, launch-success, or market-impact claim.',
  }),
  connector({
    id: 'space-launch-library',
    label: 'Launch Library 2',
    domain: 'space launch schedule',
    sourceIds: ['space_launch_library'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'The Space Devs Launch Library 2 public API',
    officialUrl: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Launch Library source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'public-unauthenticated',
    notes: 'Public upcoming launch schedule metadata. Schedule context only; no launch outcome, payload valuation, company exposure, or disruption claim.',
  }),
  connector({
    id: 'cisa-kev',
    label: 'CISA KEV',
    domain: 'defensive security',
    sourceIds: ['cisa_kev_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'CISA Known Exploited Vulnerabilities catalog',
    officialUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Defensive reference only; no scanning, exploit logic, or target collection.',
  }),
  connector({
    id: 'nvd',
    label: 'NVD CVEs',
    domain: 'defensive security',
    sourceIds: ['nvd_cve_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'NIST National Vulnerability Database',
    officialUrl: 'https://nvd.nist.gov/developers/vulnerabilities',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official CVE metadata; optional API key raises rate limits.',
  }),
  connector({
    id: 'ghsa',
    label: 'GitHub Advisories',
    domain: 'defensive security',
    sourceIds: ['github_ghsa_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'GitHub Security Advisory Database',
    officialUrl: 'https://docs.github.com/en/rest/security-advisories/global-advisories',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'public-unauthenticated',
    notes: 'Reviewed advisory metadata; no repo scraping or person enrichment.',
  }),
  connector({
    id: 'osv',
    label: 'OSV.dev',
    domain: 'defensive security',
    sourceIds: ['osv_dev_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'OSV.dev public API',
    officialUrl: 'https://osv.dev/docs/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Open vulnerability records; no private package inventory collection.',
  }),
  connector({
    id: 'cisa-advisories',
    label: 'CISA Advisories',
    domain: 'defensive security',
    sourceIds: ['cisa_advisories_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'CISA Cybersecurity Advisories RSS',
    officialUrl: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Defensive advisory timeline; no scanning or offensive workflows.',
  }),
  connector({
    id: 'eia-power-plants',
    label: 'EIA Power Plants',
    domain: 'energy facilities',
    sourceIds: ['eia_power_plants_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'EIA-860M operating generator capacity',
    officialUrl: 'https://www.eia.gov/electricity/data/eia860m/',
    requiredEnv: ['ATLASZ_EIA_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'EIA facility source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Plant-level facility/geospatial context. Location context only — never an outage/disruption/vulnerability claim. Operator->market identity only on exact match.',
  }),
  connector({
    id: 'eia-refineries',
    label: 'EIA Refineries',
    domain: 'energy facilities',
    sourceIds: ['eia_refineries_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'EIA U.S. Energy Atlas Petroleum Refineries (EIA-820)',
    officialUrl: 'https://atlas.eia.gov/datasets/petroleum-refineries',
    requiredEnv: ['ATLASZ_EIA_REFINERIES_URL'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'EIA refinery source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Petroleum refinery location/capacity context only. Configured-only until a current official EIA/ArcGIS refinery FeatureServer is pinned; no stale default or third-party mirror.',
  }),
  connector({
    id: 'lng-terminals',
    label: 'LNG Terminals',
    domain: 'energy facilities',
    sourceIds: ['lng_terminals_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'EIA Atlas / FERC LNG terminals',
    officialUrl: 'https://atlas.eia.gov/datasets/liquefied-natural-gas-lng-import-and-export-terminals',
    requiredEnv: ['ATLASZ_LNG_TERMINALS_URL'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'LNG terminal source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'FAIL-CLOSED with no default endpoint: requires an official EIA/FERC/DOE URL. Location/capacity context only — never outage/export-flow/disruption.',
  }),
  connector({
    id: 'eia-nuclear',
    label: 'EIA Nuclear Plants',
    domain: 'energy facilities',
    sourceIds: ['eia_nuclear_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'EIA-860M filtered to nuclear',
    officialUrl: 'https://www.eia.gov/electricity/data/eia860m/',
    requiredEnv: ['ATLASZ_EIA_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Nuclear plant source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Nuclear facility/geospatial layer (separate from NRC reactor status). Never a safety/outage/emergency claim.',
  }),
  connector({
    id: 'nrc-reactor-status',
    label: 'NRC Reactor Status',
    domain: 'energy operations',
    sourceIds: ['nrc_reactor_status_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'NRC Power Reactor Status Report',
    officialUrl: 'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'NRC reactor status source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Daily reactor power level as the regulator publishes it — never an Atlasz safety/outage/disruption assessment. Separate from EIA facility geography.',
  }),
  connector({
    id: 'eia-balancing-authorities',
    label: 'EIA Grid Regions',
    domain: 'grid geography',
    sourceIds: ['eia_balancing_authorities_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'EIA electricity/rto respondent facet',
    officialUrl: 'https://www.eia.gov/opendata/browser/electricity/rto/region-data',
    requiredEnv: ['ATLASZ_EIA_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Grid region source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Balancing-authority reference (region-only). Plant->BA link rides on plant BA codes. Never an outage/grid-stress/reliability claim.',
  }),
  connector({
    id: 'un-locode',
    label: 'UN/LOCODE',
    domain: 'trade/logistics location codes',
    sourceIds: ['un_locode_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'UNECE UN/LOCODE code list',
    officialUrl: 'https://unece.org/trade/cefact/UNLOCODE-Download',
    requiredEnv: ['ATLASZ_UNLOCODE_URL'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Port / UN/LOCODE source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'FAIL-CLOSED: requires an official unece.org CSV. Location-code registry only — never live port activity, vessel traffic, congestion, or disruption.',
  }),
  connector({
    id: 'world-port-index',
    label: 'World Port Index',
    domain: 'physical ports',
    sourceIds: ['world_port_index_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'NGA World Port Index (Pub 150)',
    officialUrl: 'https://msi.nga.mil/Publications/WPI',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'World Port Index source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'official-api',
    notes: 'Physical port reference (location/harbor attributes). Links to UN/LOCODE only on exact code match. Never live traffic, congestion, or disruption. NGA may block non-browser fetches.',
  }),
  connector({
    id: 'usgs-minerals',
    label: 'USGS Minerals',
    domain: 'materials',
    sourceIds: ['usgs_minerals_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'USGS Mineral Resources (USMIN + MRDS)',
    officialUrl: 'https://mrdata.usgs.gov/',
    requiredEnv: ['ATLASZ_USGS_USMIN_URL'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'USGS mineral site source trail',
    resolverSupport: 'partial',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'FAIL-CLOSED: requires official usgs.gov export(s). USMIN authoritative + MRDS legacy (not updated since 2011). Reference only — never production/reserves/ownership/investment.',
  }),
  connector({
    id: 'crypto-public-realtime',
    label: 'Public Crypto Realtime',
    domain: 'crypto market data',
    sourceIds: ['coingecko_public_rest', 'coinbase_public_ws', 'binance_public_ws'],
    access: 'public',
    cadence: 'realtime',
    sourceIdentity: 'CoinGecko public REST plus Coinbase/Binance public WebSocket market data',
    officialUrl: 'https://www.coingecko.com/en/api',
    requiredEnv: [],
    persistenceTables: ['market_ticks_daily'],
    sourceTrailUi: 'Realtime widgets / sampled market tick source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'public-unauthenticated',
    notes: 'No-key public crypto ticks only. Used for price display/liquidity sampling; no trading advice, no prediction, no company exposure, and no equity/ETF coverage claim.',
  }),
  connector({
    id: 'equities-prices',
    label: 'Equity/ETF Quotes',
    domain: 'market price data',
    sourceIds: ['alpaca_equity_quotes'],
    access: 'key-gated',
    cadence: 'realtime',
    sourceIdentity: 'Alpaca Market Data (IEX) latest trades',
    officialUrl: 'https://alpaca.markets/data',
    requiredEnv: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY'],
    persistenceTables: [],
    sourceTrailUi: 'Market Quote source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    unresolvedByDesign: true,
    trust: 'auth-gated',
    notes: 'Key-gated real equity/ETF quotes (last trade). FAIL-CLOSED without keys -> PRICE_UNAVAILABLE; no random-walk fallback, no seeded/default price rendered as real. Keys travel only in request headers. No trading advice, prediction, or signal score.',
  }),
  connector({
    id: 'options-oi',
    label: 'Options chain / open interest',
    domain: 'options market data',
    sourceIds: ['alpaca_options'],
    access: 'key-gated',
    cadence: 'realtime',
    sourceIdentity: 'Alpaca Market Data options snapshots',
    officialUrl: 'https://alpaca.markets/options',
    requiredEnv: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY', 'ATLASZ_OPTIONS_UNDERLYINGS'],
    persistenceTables: [],
    sourceTrailUi: 'Options source trail',
    resolverSupport: 'no',
    exposureSupport: 'none',
    liveWiringDeferred: true,
    unresolvedByDesign: true,
    trust: 'auth-gated',
    notes: 'Key-gated option contracts (last trade/quote, IV, greeks, open interest when source-provided). Identity decoded from OCC symbol. FAIL-CLOSED without keys + underlyings allowlist. NO flow/unusual-activity inference, no trading advice or signal score.',
  }),
]

export function buildConnectorAudit(input: {
  sources: OsintSourceSnapshot[]
  events: WorldIntelEvent[]
  now?: number
}): ConnectorAuditRow[] {
  const now = input.now ?? Date.now()
  return CONNECTOR_AUDIT_DEFINITIONS.map((definition) => {
    const matchedSources = input.sources.filter((source) => definition.sourceIds.includes(source.sourceId))
    const matchedEvents = input.events.filter((event) => definition.sourceIds.includes(event.sourceId))
    const status = connectorStatus(definition, matchedSources, now)
    const lastSuccessfulFetch = latestNumber(matchedSources.map((source) => source.lastSuccessAt))
    const lastErrorSource = matchedSources
      .filter((source) => source.lastError)
      .sort((a, b) => (b.lastErrorAt ?? 0) - (a.lastErrorAt ?? 0))[0]

    return {
      ...definition,
      status,
      lastSuccessfulFetch,
      recordCount: Math.max(sum(matchedSources.map((source) => source.itemCount)), matchedEvents.length),
      lastError: lastErrorSource?.lastError,
      activeSourceCount: matchedSources.length,
      missingReason: missingReason(definition, matchedSources),
    }
  })
}

export function summarizeExposure(input: {
  events: WorldIntelEvent[]
  now?: number
  windowMs?: number
  limit?: number
}): ExposureSummary {
  const now = input.now ?? Date.now()
  const windowMs = input.windowMs ?? DAY_MS
  const limit = input.limit ?? 6
  const considered = input.events
    .filter((event) => !event.marketIdentity && Number.isFinite(event.timestamp) && event.timestamp >= now - windowMs && event.timestamp <= now + 60_000)
    .sort((a, b) => b.timestamp - a.timestamp)

  const counts = new Map<string, ExposureCount>()
  const recentResolvedEvents: ResolvedExposureEvent[] = []
  let curatedReferenceOnlyCount = 0
  // Low-trust media observations are tracked separately and NEVER enter the ranks.
  let mediaObservationCount = 0

  for (const event of considered) {
    if (event.provenance === 'media-observation') {
      mediaObservationCount += 1
      continue // media observation: context only, excluded from exposure ranking
    }
    const exposed = eventStructuralExposure(event, { maxDepth: 3 })
    if (exposed.length === 0) continue
    curatedReferenceOnlyCount += 1
    // Fresh, source-backed evidence outranks stale; an exact (depth-1, high
    // path-confidence) exposure outranks an indirect, decayed one. Unknown
    // freshness is neutral (0.5) — never zero, never boosted.
    const freshness = freshnessLabel({ now, retrievedAt: event.timestamp })
    const eventWeight = freshnessWeight(freshness) ?? 0.5
    const resolvedEntityIds = exposed.map(({ resolution }) => resolution.canonicalSeedEntityId)
    let exposedEntityCount = 0
    let exposureScore = 0
    for (const item of exposed) {
      for (const path of item.exposure) {
        exposedEntityCount += 1
        const contribution = eventWeight * path.pathConfidence
        exposureScore += contribution
        bump(counts, path.entity.id, path.entity.label, path.entity.kind, contribution)
      }
    }
    recentResolvedEvents.push({
      eventId: event.id,
      title: event.title,
      sourceId: event.sourceId,
      observedAt: event.timestamp,
      resolvedEntityIds,
      exposedEntityCount,
      exposureTrust: 'curated-reference',
      freshness,
      exposureScore,
    })
  }
  recentResolvedEvents.sort((a, b) => b.exposureScore - a.exposureScore || b.observedAt - a.observedAt)

  const resolvedEventIds = new Set(recentResolvedEvents.map((event) => event.eventId))
  return {
    generatedAt: now,
    windowMs,
    consideredEventCount: considered.length,
    resolvedEventCount: resolvedEventIds.size,
    unresolvedEventCount: Math.max(0, considered.length - resolvedEventIds.size),
    curatedReferenceOnlyCount,
    mediaObservationCount,
    topCountries: topKind(counts, 'country', limit),
    topCompanies: topKind(counts, 'company', limit),
    topCommodities: topKind(counts, 'commodity', limit),
    topSectors: topKind(counts, 'sector', limit),
    recentResolvedEvents: recentResolvedEvents.slice(0, limit),
  }
}

function connector(input: ConnectorAuditDefinitionInput): ConnectorAuditDefinition {
  return {
    ...input,
    implemented: input.implemented ?? true,
    staleAfterMs: input.staleAfterMs ?? DEFAULT_STALE_AFTER_MS,
  }
}

function connectorStatus(
  definition: ConnectorAuditDefinition,
  sources: OsintSourceSnapshot[],
  now: number,
): ConnectorRuntimeStatus {
  // `not-wired` is reserved for connectors with no runtime adapter at all.
  if (!definition.implemented) return 'not-wired'
  // Built + tested but live runtime wiring intentionally deferred (honest, not a failure).
  if (definition.liveWiringDeferred) return 'deferred'
  // Implemented but no source snapshot yet: key-gated -> missing-key; otherwise the
  // connector is configured and simply hasn't completed its first poll -> pending-first-fetch.
  if (sources.length === 0) return definition.requiredEnv.length > 0 ? 'missing-key' : 'pending-first-fetch'
  if (sources.every((source) => source.status === 'disabled' || !source.enabled)) return 'disabled'
  if (sources.some((source) => source.status === 'failed')) return 'failed'
  if (sources.some((source) => source.status === 'rate-limited')) return 'rate-limited'
  if (sources.some((source) => source.configured === false)) return 'missing-key'
  if (sources.some((source) => source.status === 'offline')) return 'unavailable'

  const lastSuccess = latestNumber(sources.map((source) => source.lastSuccessAt))
  const staleAfterMs = Math.max(definition.staleAfterMs ?? DEFAULT_STALE_AFTER_MS, ...sources.map((source) => source.pollIntervalMs * 3))
  if (lastSuccess !== undefined && now - lastSuccess > staleAfterMs) return 'stale'
  if (sources.some((source) => source.status === 'online')) return 'online'
  return 'configured'
}

function missingReason(definition: ConnectorAuditDefinition, sources: OsintSourceSnapshot[]): string | undefined {
  if (!definition.implemented) return 'No runtime adapter/persistence/UI slice is wired in this checkpoint.'
  const unconfigured = sources.find((source) => source.configured === false)
  if (unconfigured?.configHint) return unconfigured.configHint
  if (sources.length === 0 && definition.requiredEnv.length > 0) return `Missing ${definition.requiredEnv.join(', ')}`
  if (sources.length === 0) return 'Configured; waiting for first poll/manual run.'
  return undefined
}

function latestNumber(values: Array<number | undefined>): number | undefined {
  const finite = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return finite.length > 0 ? Math.max(...finite) : undefined
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

function bump(counts: Map<string, ExposureCount>, id: string, label: string, kind: string, weight: number) {
  const current = counts.get(id)
  if (current) {
    current.count += 1
    current.score += weight
    return
  }
  counts.set(id, { id, label, kind, count: 1, score: weight })
}

function topKind(counts: Map<string, ExposureCount>, kind: string, limit: number): ExposureCount[] {
  return [...counts.values()]
    .filter((item) => item.kind === kind)
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}
