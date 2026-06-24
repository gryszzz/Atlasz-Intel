/*
 * Provider configuration layer. Atlasz is provider-driven: built-in providers
 * mirror the current safe sources, and users can add public providers via an
 * `atlasz.providers.json` file (merged at load). Everything is fail-closed —
 * missing credentials / unsupported adapters / malformed entries never produce
 * fake data; they surface honest disabled / auth-gated / config-missing states.
 */
import { existsSync, readFileSync } from 'node:fs'
import { PROVENANCE_VALUES, type ProvenanceId } from '../../src/provenance'

export type ProviderCategory =
  | 'world-news'
  | 'osint'
  | 'macro'
  | 'filings'
  | 'public-disclosure'
  | 'market-data'
  | 'crypto-realtime'
  | 'equities'
  | 'microstructure'
  | 'vector-memory'

export type ProviderAuthType = 'none' | 'api-key' | 'bearer-token' | 'env'

export type ProviderDefinition = {
  providerId: string
  providerName: string
  category: ProviderCategory
  adapter: string
  enabled: boolean
  endpoint?: string
  authType: ProviderAuthType
  envKey?: string
  pollIntervalMs?: number
  rateLimitGuardMs?: number
  timeoutMs?: number
  maxRetries?: number
  backoffMs?: number
  provenance: ProvenanceId
  supportedSymbols?: string[]
  legalSafetyNote: string
  custom?: boolean
}

export const PROVIDER_CATEGORIES: ProviderCategory[] = [
  'world-news',
  'osint',
  'macro',
  'filings',
  'public-disclosure',
  'market-data',
  'crypto-realtime',
  'equities',
  'microstructure',
  'vector-memory',
]

/** Adapters a user-supplied custom provider is allowed to use (safe, public). */
export const SAFE_CUSTOM_ADAPTERS = new Set(['rss', 'custom-json', 'gdelt'])

export const BUILTIN_PROVIDERS: ProviderDefinition[] = [
  {
    providerId: 'gdelt_doc_public',
    providerName: 'GDELT DOC public news/events',
    category: 'world-news',
    adapter: 'gdelt',
    enabled: true,
    endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc',
    authType: 'none',
    pollIntervalMs: 5 * 60_000,
    rateLimitGuardMs: 20_000,
    timeoutMs: 12_000,
    provenance: 'media-observation',
    legalSafetyNote: 'Documented public GDELT DOC API; article metadata is a media observation, not a verified event.',
  },
  {
    providerId: 'sec_edgar_public',
    providerName: 'SEC EDGAR company submissions (8-K/10-Q/10-K)',
    category: 'filings',
    adapter: 'sec-edgar',
    enabled: true,
    endpoint: 'https://data.sec.gov/submissions/CIK0000320193.json',
    authType: 'env',
    envKey: 'ATLASZ_SEC_USER_AGENT',
    pollIntervalMs: 10 * 60_000,
    rateLimitGuardMs: 60_000,
    timeoutMs: 15_000,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Official SEC EDGAR company submissions JSON. Requires a contactable User-Agent; fail-closed without one. No login, scraping, or simulated filings.',
  },
  {
    providerId: 'sec_company_tickers_public',
    providerName: 'SEC company ticker reference',
    category: 'market-data',
    adapter: 'market-reference-sec',
    enabled: true,
    endpoint: 'https://www.sec.gov/files/company_tickers.json',
    authType: 'none',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 6 * 60 * 60_000,
    timeoutMs: 15_000,
    maxRetries: 1,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official SEC company_tickers.json reference file. Public no-auth identity spine for CIK, ticker, and legal title only; no exchange, sector, ETF weights, prices, or fuzzy merges are inferred.',
  },
  {
    providerId: 'sec_company_facts_public',
    providerName: 'SEC Company Facts (XBRL fundamentals)',
    category: 'public-disclosure',
    adapter: 'sec-company-facts',
    enabled: true,
    endpoint: 'https://data.sec.gov/api/xbrl/companyfacts',
    authType: 'env',
    envKey: 'ATLASZ_SEC_USER_AGENT',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 6 * 60 * 60_000,
    timeoutMs: 25_000,
    maxRetries: 1,
    backoffMs: 1_500,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Official SEC companyfacts XBRL API. Public but requires a descriptive contactable User-Agent (ATLASZ_SEC_USER_AGENT); fail-closed without it. CIKs come from the Market Reference Master identity spine. Historical reported facts only — no forward estimates, valuation, AI interpretation, or trading signal.',
  },
  {
    providerId: 'sec_form4_public',
    providerName: 'SEC Form 4 insider transactions',
    category: 'public-disclosure',
    adapter: 'sec-form4',
    enabled: true,
    endpoint: 'https://data.sec.gov/submissions',
    authType: 'env',
    envKey: 'ATLASZ_SEC_USER_AGENT',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 6 * 60 * 60_000,
    timeoutMs: 20_000,
    maxRetries: 1,
    backoffMs: 1_500,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Official SEC Form 4 ownership filings. Public but requires a descriptive contactable User-Agent (ATLASZ_SEC_USER_AGENT); fail-closed without it. Issuer CIKs from the Market Reference Master identity spine. Source-reported transaction evidence only — no sentiment, valuation, price prediction, trading advice, or person enrichment beyond source-published owner name/title.',
  },
  {
    providerId: 'sec_form13f_public',
    providerName: 'SEC Form 13F institutional holdings',
    category: 'public-disclosure',
    adapter: 'sec-form13f',
    enabled: true,
    endpoint: 'https://data.sec.gov/submissions',
    authType: 'env',
    envKey: 'ATLASZ_SEC_USER_AGENT',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 6 * 60 * 60_000,
    timeoutMs: 25_000,
    maxRetries: 1,
    backoffMs: 1_500,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Official SEC Form 13F-HR filings. Public but requires a descriptive contactable User-Agent (ATLASZ_SEC_USER_AGENT); fail-closed without it. Bounded institutional-manager CIK allowlist; filer name source-bounded. Issuers identified by CUSIP, mapped to a ticker only via an exact curated table. QUARTERLY DELAYED snapshot — never a current position. No conviction, sentiment, fund-performance, valuation, price, or trading-advice claims; no person enrichment.',
  },
  {
    providerId: 'etf_holdings_public',
    providerName: 'Issuer ETF holdings snapshots',
    category: 'public-disclosure',
    adapter: 'etf-holdings',
    enabled: true,
    endpoint: 'https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-xlk.xlsx',
    authType: 'none',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 6 * 60 * 60_000,
    timeoutMs: 25_000,
    maxRetries: 1,
    backoffMs: 1_500,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Official issuer-published ETF holdings snapshots from allowlisted BlackRock/iShares and State Street/SPDR files. Source date required; weights/shares/market value only when source-provided. Snapshot only — not current-position guarantee, recommendation, price signal, prediction, or trading advice.',
  },
  {
    providerId: 'macro_calendar_fred',
    providerName: 'FRED official macro series',
    category: 'macro',
    adapter: 'fred-macro',
    enabled: true,
    endpoint: 'https://api.stlouisfed.org/fred/series/observations',
    authType: 'api-key',
    envKey: 'ATLASZ_FRED_API_KEY',
    pollIntervalMs: 60 * 60_000,
    rateLimitGuardMs: 120_000,
    timeoutMs: 20_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official FRED API for allowlisted macro series. API key from env only; fail-closed without it. Missing observations are skipped.',
  },
  {
    providerId: 'treasury_fiscal_public',
    providerName: 'U.S. Treasury Fiscal Data (Debt to the Penny)',
    category: 'macro',
    adapter: 'treasury-fiscal',
    enabled: true,
    endpoint: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 15_000,
    maxRetries: 0,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official Treasury Fiscal Data API (no auth) for Debt to the Penny. Fiscal context only; no simulated debt data or market predictions.',
  },
  {
    providerId: 'bls_public',
    providerName: 'U.S. Bureau of Labor Statistics (BLS macro series)',
    category: 'macro',
    adapter: 'bls',
    enabled: true,
    endpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official BLS Public Data API v2 (public; optional registration key only raises rate limits and is sent in the request body, never persisted). Macro labor/price series; no predictions, no tickers inferred.',
  },
  {
    providerId: 'bea_public',
    providerName: 'U.S. Bureau of Economic Analysis (BEA NIPA GDP)',
    category: 'macro',
    adapter: 'bea',
    enabled: true,
    endpoint: 'https://apps.bea.gov/api/data?method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=X&ResultFormat=JSON',
    authType: 'api-key',
    envKey: 'ATLASZ_BEA_API_KEY',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official BEA API for NIPA GDP table T10101. Requires ATLASZ_BEA_API_KEY; fail-closed without it. The UserID key is never persisted in source trails.',
  },
  {
    providerId: 'eia_energy_public',
    providerName: 'U.S. EIA official energy series',
    category: 'macro',
    adapter: 'eia-energy',
    enabled: true,
    endpoint: 'https://api.eia.gov/v2/seriesid/PET.RWTC.D?length=1',
    authType: 'api-key',
    envKey: 'ATLASZ_EIA_API_KEY',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official EIA Open Data API for allowlisted energy/commodity series. Requires ATLASZ_EIA_API_KEY; fail-closed without it. The api_key is never persisted in source trails.',
  },
  {
    providerId: 'eia_power_plants_public',
    providerName: 'U.S. EIA power-plant facility inventory',
    category: 'macro',
    adapter: 'eia-power-plants',
    enabled: true,
    endpoint: 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw&length=1',
    authType: 'api-key',
    envKey: 'ATLASZ_EIA_API_KEY',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote:
      'Official EIA Open Data API (EIA-860M operating-generator-capacity) for electric power-plant facilities. Location context only — never an outage/disruption/vulnerability claim. Requires ATLASZ_EIA_API_KEY; fail-closed without it. The api_key is never persisted in source trails.',
  },
  {
    providerId: 'eia_refineries_public',
    providerName: 'U.S. EIA petroleum refinery facilities',
    category: 'macro',
    adapter: 'eia-refineries',
    enabled: true,
    endpoint: 'https://atlas.eia.gov/datasets/petroleum-refineries',
    authType: 'none',
    pollIntervalMs: 7 * 24 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote:
      'Official EIA U.S. Energy Atlas Petroleum Refineries layer (EIA-820). Public GeoJSON, no key. Location/capacity context only — never an outage/disruption/vulnerability claim. Override the data URL via ATLASZ_EIA_REFINERIES_URL (must be an EIA/ArcGIS refinery FeatureServer).',
  },
  {
    providerId: 'lng_terminals_public',
    providerName: 'LNG import/export terminals (EIA Atlas / FERC)',
    category: 'macro',
    adapter: 'lng-terminals',
    enabled: true,
    endpoint: 'https://atlas.eia.gov/datasets/liquefied-natural-gas-lng-import-and-export-terminals',
    authType: 'env',
    envKey: 'ATLASZ_LNG_TERMINALS_URL',
    pollIntervalMs: 7 * 24 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote:
      'Official LNG terminal data. FAIL-CLOSED: requires ATLASZ_LNG_TERMINALS_URL pinned to a confirmed official source (EIA U.S. Energy Atlas LNG layer, FERC, or DOE/FECM). Location/capacity context only — never an outage/disruption/export-flow/vulnerability claim. No default endpoint; inert until configured.',
  },
  {
    providerId: 'eia_nuclear_public',
    providerName: 'U.S. EIA nuclear power plants (EIA-860M, nuclear-filtered)',
    category: 'macro',
    adapter: 'eia-nuclear',
    enabled: true,
    endpoint: 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw&length=1',
    authType: 'api-key',
    envKey: 'ATLASZ_EIA_API_KEY',
    pollIntervalMs: 24 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote:
      'Official EIA generator inventory (EIA-860M) filtered to nuclear fuel. Facility/geospatial + capacity context only — never a safety/outage/emergency/vulnerability claim. Requires ATLASZ_EIA_API_KEY; fail-closed without it. Separate from NRC reactor status.',
  },
  {
    providerId: 'nrc_reactor_status_public',
    providerName: 'NRC daily reactor power status',
    category: 'public-disclosure',
    adapter: 'nrc-reactor-status',
    enabled: true,
    endpoint: 'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt',
    authType: 'none',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 30_000,
    maxRetries: 2,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote:
      'Official public NRC Power Reactor Status Report (nrc.gov). Reports the operating power level per reactor unit as published by the regulator — never an Atlasz safety/outage/disruption/vulnerability assessment. Latest status per unit; kept separate from the EIA facility layer (no fuzzy merge).',
  },
  {
    providerId: 'cisa_kev_public',
    providerName: 'CISA Known Exploited Vulnerabilities catalog',
    category: 'public-disclosure',
    adapter: 'cisa-kev',
    enabled: true,
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official CISA KEV public catalog JSON (no auth). Confirmed actively-exploited CVEs; per-record source trail to NIST NVD. Public defensive-security data, not financial advice; no tickers are inferred.',
  },
  {
    providerId: 'nvd_cve_public',
    providerName: 'NIST NVD CVE vulnerability intelligence',
    category: 'public-disclosure',
    adapter: 'nvd-cve',
    enabled: true,
    endpoint: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official NIST NVD 2.0 API (public; optional API key only raises rate limits and is sent as a header, never persisted). Defensive vulnerability intelligence only: no scanning, exploitation, payloads, or active target collection. Cross-links to CISA KEV by CVE ID. No tickers inferred.',
  },
  {
    providerId: 'github_ghsa_public',
    providerName: 'GitHub Security Advisories (GHSA)',
    category: 'public-disclosure',
    adapter: 'github-ghsa',
    enabled: true,
    endpoint: 'https://api.github.com/advisories',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official GitHub REST global advisory database (public; optional token only raises rate limits and is sent as an Authorization header, never persisted). Reviewed advisories only; cross-links to CVE/NVD/CISA KEV. No repo scraping, no person data, no exploitation logic. No tickers inferred.',
  },
  {
    providerId: 'osv_dev_public',
    providerName: 'OSV.dev open-source vulnerabilities',
    category: 'public-disclosure',
    adapter: 'osv-dev',
    enabled: true,
    endpoint: 'https://api.osv.dev/v1/query',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official OSV.dev public API. Open-source package vulnerability context cross-linked to CVE/GHSA via aliases. No scanning, exploit logic, payloads, or private package/repo collection. No tickers inferred.',
  },
  {
    providerId: 'cisa_advisories_public',
    providerName: 'CISA cybersecurity / ICS advisories',
    category: 'public-disclosure',
    adapter: 'cisa-advisories',
    enabled: true,
    endpoint: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official CISA advisories public RSS feed. Defensive advisory intelligence cross-linked to CVEs. No scanning, exploit logic, payloads, or person enrichment. No tickers inferred.',
  },
  {
    providerId: 'github_releases_public',
    providerName: 'GitHub Releases (open-source technology layer)',
    category: 'public-disclosure',
    adapter: 'github-releases',
    enabled: true,
    endpoint: 'https://api.github.com/repos/{owner}/{repo}/releases',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official GitHub REST releases API for a configured public-repo allowlist. Optional token only raises rate limits and is sent as an Authorization header, never persisted. No fake activity, no person enrichment (release author not collected). No tickers inferred.',
  },
  {
    providerId: 'politician_disclosure_public',
    providerName: 'Public official financial disclosures (delayed)',
    category: 'public-disclosure',
    adapter: 'public-disclosure-json',
    enabled: true,
    authType: 'env',
    envKey: 'ATLASZ_POLITICIAN_DISCLOSURE_URL',
    pollIntervalMs: 30 * 60_000,
    rateLimitGuardMs: 60_000,
    timeoutMs: 15_000,
    provenance: 'public-disclosure',
    legalSafetyNote: 'Configured public/open-civic disclosure provider only. Delayed disclosures, not real-time data. Fail-closed without a provider.',
  },
  managedProvider('rss_public_radar', 'RSS public finance/geopolitics feeds', 'world-news', 'rss-public'),
  managedProvider('public_market_rest', 'Public market REST (Yahoo + CoinGecko)', 'market-data', 'public-unauthenticated'),
  managedProvider('yahoo_finance_1m_public', 'Yahoo public market bars', 'market-data', 'public-unauthenticated'),
  managedProvider('coingecko_public_rest', 'CoinGecko public crypto REST', 'market-data', 'public-unauthenticated'),
  managedProvider('stocktwits_public_stream', 'Stocktwits public symbol streams', 'osint', 'public-unauthenticated'),
  managedProvider('polymarket_gamma_public', 'Polymarket Gamma public markets', 'market-data', 'public-unauthenticated'),
  managedProvider('coinbase_public_ws', 'Coinbase public crypto websocket', 'crypto-realtime', 'public-unauthenticated'),
  managedProvider('binance_public_ws', 'Binance public crypto websocket', 'crypto-realtime', 'public-unauthenticated'),
  rssProvider('fed_press_rss', 'Federal Reserve press releases', 'macro', 'https://www.federalreserve.gov/feeds/press_all.xml', 'Official Federal Reserve public press RSS (policy/FOMC). Public headlines only; no scraping.'),
  rssProvider('sec_press_rss', 'SEC press releases', 'filings', 'https://www.sec.gov/news/pressreleases.rss', 'Official SEC public press RSS. Public headlines only; no scraping.'),
  rssProvider('ecb_press_rss', 'ECB press releases', 'macro', 'https://www.ecb.europa.eu/rss/press.xml', 'Official ECB public press RSS (global rates). Public headlines only; no scraping.'),
  rssProvider('wsj_markets_rss', 'WSJ Markets headlines', 'world-news', 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', 'Public market-news RSS headlines only; full articles may be paywalled and are not fetched.'),
  {
    providerId: 'arxiv_cs_ai',
    providerName: 'arXiv AI research (cs.AI)',
    category: 'world-news',
    adapter: 'rss',
    enabled: true,
    endpoint: 'https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=20',
    authType: 'none',
    pollIntervalMs: 30 * 60_000,
    rateLimitGuardMs: 120_000,
    timeoutMs: 15_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official arXiv public API (Atom). Research metadata; public.',
  },
  rssProvider('nasa_news', 'NASA news releases', 'world-news', 'https://www.nasa.gov/news-release/feed/', 'Official NASA public news RSS. Public headlines only.'),
  {
    providerId: 'space_launch_library',
    providerName: 'Upcoming space launches (Launch Library 2)',
    category: 'world-news',
    adapter: 'custom-json',
    enabled: true,
    endpoint: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15',
    authType: 'none',
    pollIntervalMs: 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 15_000,
    provenance: 'public-unauthenticated',
    legalSafetyNote: 'Public Launch Library 2 API. Public launch schedule; rate-limited.',
  },
  {
    providerId: 'github_trending_repos',
    providerName: 'GitHub high-signal repositories',
    category: 'world-news',
    adapter: 'custom-json',
    enabled: true,
    endpoint: 'https://api.github.com/search/repositories?q=stars:%3E5000&sort=stars&order=desc&per_page=15',
    authType: 'none',
    pollIntervalMs: 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 15_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official GitHub public Search API (unauthenticated, rate-limited). Public repo metadata.',
  },
  {
    providerId: 'usgs_significant_quakes',
    providerName: 'USGS significant earthquakes',
    category: 'world-news',
    adapter: 'usgs-quakes',
    enabled: true,
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
    authType: 'none',
    pollIntervalMs: 30 * 60_000,
    rateLimitGuardMs: 120_000,
    timeoutMs: 15_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official USGS public earthquake GeoJSON feed. Public natural-event data.',
  },
  {
    providerId: 'noaa_alerts_public',
    providerName: 'NOAA / NWS active weather alerts',
    category: 'world-news',
    adapter: 'noaa-alerts',
    enabled: true,
    endpoint: 'https://api.weather.gov/alerts/active',
    authType: 'none',
    pollIntervalMs: 15 * 60_000,
    rateLimitGuardMs: 120_000,
    timeoutMs: 20_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official NWS public alerts API (no auth; descriptive User-Agent). Real alerts only; severity/urgency/certainty from NWS, never inflated. No model forecasts.',
  },
  {
    providerId: 'federal_register_public',
    providerName: 'Federal Register public documents',
    category: 'public-disclosure',
    adapter: 'federal-register',
    enabled: true,
    endpoint: 'https://www.federalregister.gov/api/v1/documents.json',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official FederalRegister.gov documents API (no auth). Regulatory document metadata only; source trails preserve Federal Register URLs and govinfo PDF links when present. No invented exposure mapping or legal interpretation.',
  },
  {
    providerId: 'ofac_sdn_public',
    providerName: 'Treasury OFAC SDN sanctions list',
    category: 'public-disclosure',
    adapter: 'ofac-sdn',
    enabled: true,
    endpoint: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML',
    authType: 'none',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official Treasury OFAC Sanctions List Service SDN XML export (no auth). List evidence only: no sanctions screening, fuzzy matching, inferred guilt/risk labels, person enrichment, or ticker exposure.',
  },
  {
    providerId: 'congress_gov_public',
    providerName: 'Congress.gov legislative bill actions',
    category: 'public-disclosure',
    adapter: 'congress-gov',
    enabled: true,
    endpoint: 'https://api.congress.gov/v3/bill',
    authType: 'api-key',
    envKey: 'ATLASZ_CONGRESS_API_KEY',
    pollIntervalMs: 6 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    maxRetries: 1,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official Congress.gov API v3 for bill/action metadata. Requires ATLASZ_CONGRESS_API_KEY; fail-closed without it. The api_key is never persisted in source trails. No political interpretation, person enrichment, or inferred company exposure.',
  },
  {
    providerId: 'un_comtrade_public',
    providerName: 'UN Comtrade trade flows (catalog-driven)',
    category: 'public-disclosure',
    adapter: 'un-comtrade',
    enabled: true,
    endpoint: 'https://comtradeapi.un.org/data/v1/get',
    authType: 'api-key',
    envKey: 'ATLASZ_UN_COMTRADE_API_KEY',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 600_000,
    timeoutMs: 25_000,
    maxRetries: 1,
    backoffMs: 1_500,
    provenance: 'official-api',
    legalSafetyNote: 'Official UN Comtrade data API. Requires ATLASZ_UN_COMTRADE_API_KEY; fail-closed without it. The subscription key travels only in the request header and is never persisted. Catalog-driven, bounded pulls only — no uncontrolled full-world ingestion. Country/partner/commodity trade-flow evidence only; no company-level claims or inferred supply chains.',
  },
  {
    providerId: 'openalex_works_public',
    providerName: 'OpenAlex research works (topic-narrow)',
    category: 'public-disclosure',
    adapter: 'openalex-works',
    enabled: true,
    endpoint: 'https://api.openalex.org/works',
    authType: 'api-key',
    envKey: 'ATLASZ_OPENALEX_API_KEY',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    maxRetries: 1,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official OpenAlex Works API. Requires ATLASZ_OPENALEX_API_KEY; fail-closed without it. The api_key is stripped from every persisted/displayed URL. Research metadata only — not validation of technical claims, breakthroughs, or market impact. Authors kept minimal; no person enrichment or inferred company exposure.',
  },
  {
    providerId: 'crossref_works_public',
    providerName: 'Crossref DOI metadata (topic-narrow)',
    category: 'public-disclosure',
    adapter: 'crossref-works',
    enabled: true,
    endpoint: 'https://api.crossref.org/works',
    authType: 'none',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 20_000,
    maxRetries: 1,
    backoffMs: 1_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official Crossref REST API for DOI/work metadata. No key required; optional ATLASZ_CROSSREF_MAILTO uses the polite pool and is stripped from source trails. Metadata only - no full-text scraping, research-claim validation, citation-quality claim, or market inference.',
  },
  {
    providerId: 'uspto_patentsview_public',
    providerName: 'USPTO patents (PatentsView)',
    category: 'public-disclosure',
    adapter: 'uspto-patents',
    enabled: true,
    endpoint: 'https://search.patentsview.org/api/v1/patent/',
    authType: 'api-key',
    envKey: 'ATLASZ_PATENTSVIEW_API_KEY',
    pollIntervalMs: 12 * 60 * 60_000,
    rateLimitGuardMs: 300_000,
    timeoutMs: 25_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official USPTO-funded PatentsView API. API key from env only (X-Api-Key header; never persisted); fail-closed without it. Assignee organizations + classifications only — no inventor/person data. No fake patents; no inferred ownership.',
  },
  {
    providerId: 'x_explore_placeholder',
    providerName: 'X/Twitter Explore placeholder',
    category: 'osint',
    adapter: 'disabled',
    enabled: false,
    endpoint: 'disabled',
    authType: 'bearer-token',
    envKey: 'ATLASZ_X_AUTH_TOKEN',
    provenance: 'auth-gated',
    legalSafetyNote: 'Disabled scaffold only. No login, CAPTCHA, paywall, or anti-bot bypass behavior is implemented.',
  },
]

function managedProvider(
  providerId: string,
  providerName: string,
  category: ProviderCategory,
  provenance: ProvenanceId,
): ProviderDefinition {
  return {
    providerId,
    providerName,
    category,
    adapter: 'managed-ingest',
    enabled: true,
    endpoint: 'managed by existing Atlasz ingestion service',
    authType: 'none',
    provenance,
    legalSafetyNote: 'Registered source boundary only; ingestion is handled by the existing fail-closed connector.',
  }
}

/** Built-in public RSS provider (verified-live official/market feeds). */
function rssProvider(
  providerId: string,
  providerName: string,
  category: ProviderCategory,
  endpoint: string,
  legalSafetyNote: string,
): ProviderDefinition {
  return {
    providerId,
    providerName,
    category,
    adapter: 'rss',
    enabled: true,
    endpoint,
    authType: 'none',
    pollIntervalMs: 10 * 60_000,
    rateLimitGuardMs: 60_000,
    timeoutMs: 15_000,
    provenance: 'rss-public',
    legalSafetyNote,
  }
}

export type ProviderConfigResult = {
  providers: ProviderDefinition[]
  errors: string[]
  configPath: string | null
}

/**
 * Load providers: built-ins plus any valid entries from atlasz.providers.json.
 * Invalid custom entries are skipped with a recorded error (fail-closed).
 */
export function loadProviderConfig(
  options: { configPath?: string; includeBuiltins?: boolean } = {},
): ProviderConfigResult {
  const includeBuiltins = options.includeBuiltins ?? true
  const providers: ProviderDefinition[] = includeBuiltins ? BUILTIN_PROVIDERS.map((provider) => ({ ...provider })) : []
  const errors: string[] = []
  const configPath = options.configPath ?? null

  if (configPath && existsSync(configPath)) {
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as unknown
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { providers?: unknown }).providers)
          ? (parsed as { providers: unknown[] }).providers
          : []
      const ids = new Set(providers.map((provider) => provider.providerId))
      for (const entry of entries) {
        const result = validateCustomProvider(entry)
        if ('error' in result) {
          errors.push(result.error)
          continue
        }
        if (ids.has(result.provider.providerId)) {
          errors.push(`Duplicate providerId ignored: ${result.provider.providerId}`)
          continue
        }
        ids.add(result.provider.providerId)
        providers.push(result.provider)
      }
    } catch (error) {
      errors.push(`Failed to parse ${configPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { providers, errors, configPath }
}

/** A provider is "configured" when its credential requirement is satisfied. */
export function isProviderConfigured(provider: ProviderDefinition, env: NodeJS.ProcessEnv = process.env): boolean {
  if (provider.adapter === 'disabled') {
    return false
  }
  if (provider.authType === 'none') {
    return true
  }
  return Boolean(provider.envKey && asTrimmed(env[provider.envKey]))
}

export function providerConfigHint(provider: ProviderDefinition): string | undefined {
  if (isProviderConfigured(provider)) {
    return undefined
  }
  if (provider.adapter === 'disabled') {
    return 'Disabled scaffold — no public adapter available.'
  }
  return provider.envKey ? `Set ${provider.envKey} to enable this provider.` : 'Provider requires configuration.'
}

type ValidationOk = { provider: ProviderDefinition }
type ValidationErr = { error: string }

function validateCustomProvider(entry: unknown): ValidationOk | ValidationErr {
  if (!entry || typeof entry !== 'object') {
    return { error: 'Provider entry is not an object.' }
  }
  const raw = entry as Record<string, unknown>
  const providerId = asTrimmed(raw.providerId)
  const providerName = asTrimmed(raw.providerName)
  const category = asTrimmed(raw.category) as ProviderCategory
  const adapter = asTrimmed(raw.adapter)
  const provenance = asTrimmed(raw.provenance) as ProvenanceId
  const authType = (asTrimmed(raw.authType) || 'none') as ProviderAuthType

  if (!providerId) return { error: 'Custom provider missing providerId.' }
  if (!providerName) return { error: `Provider ${providerId} missing providerName.` }
  if (!PROVIDER_CATEGORIES.includes(category)) return { error: `Provider ${providerId} has invalid category "${category}".` }
  if (!SAFE_CUSTOM_ADAPTERS.has(adapter)) return { error: `Provider ${providerId} uses unsupported/unsafe adapter "${adapter}".` }
  if (!(PROVENANCE_VALUES as readonly string[]).includes(provenance)) {
    return { error: `Provider ${providerId} has invalid provenance "${provenance}".` }
  }
  const endpoint = asTrimmed(raw.endpoint)
  // Fetch adapters require a public http(s) endpoint. No private/login/paywall URLs.
  if ((adapter === 'rss' || adapter === 'custom-json' || adapter === 'gdelt') && !/^https?:\/\//i.test(endpoint)) {
    return { error: `Provider ${providerId} requires a public http(s) endpoint.` }
  }

  return {
    provider: {
      providerId,
      providerName,
      category,
      adapter,
      enabled: raw.enabled !== false,
      endpoint,
      authType: ['none', 'api-key', 'bearer-token', 'env'].includes(authType) ? authType : 'none',
      envKey: asTrimmed(raw.envKey) || undefined,
      pollIntervalMs: asPositiveInt(raw.pollIntervalMs),
      rateLimitGuardMs: asPositiveInt(raw.rateLimitGuardMs),
      timeoutMs: asPositiveInt(raw.timeoutMs),
      maxRetries: asPositiveInt(raw.maxRetries),
      backoffMs: asPositiveInt(raw.backoffMs),
      provenance,
      supportedSymbols: Array.isArray(raw.supportedSymbols)
        ? raw.supportedSymbols.map((symbol) => String(symbol)).filter(Boolean)
        : undefined,
      legalSafetyNote: asTrimmed(raw.legalSafetyNote) || 'User-provided public feed; normalized honestly.',
      custom: true,
    },
  }
}

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}
