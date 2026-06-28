/*
 * Built-in provider catalog. Capability metadata layered on the provider
 * definitions: feed type(s), required env keys, whether the provider supports
 * symbol auto-discovery, and the local services Atlasz can detect (SQLite,
 * Ollama, vector memory). Pure data — discovery probing lives in
 * providerDiscoveryService.
 */
import { BUILTIN_PROVIDERS, type ProviderDefinition } from './providerConfig'

export type FeedType = 'REST' | 'WebSocket' | 'RSS' | 'local' | 'SQLite'
export type SymbolDiscoverySource = 'coinbase' | 'binance'

export type ProviderCapabilityMeta = {
  feedTypes: FeedType[]
  envKeysRequired: string[]
  symbolDiscovery?: SymbolDiscoverySource
  realtimeFeedType?: 'REST' | 'WebSocket'
  supportedEventTypes?: string[]
  supportedRegions?: string[]
}

export const PROVIDER_CAPABILITY_META: Record<string, ProviderCapabilityMeta> = {
  gdelt_doc_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['media', 'news'], supportedRegions: ['global'] },
  sec_edgar_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_SEC_USER_AGENT'], supportedEventTypes: ['filing'], supportedRegions: ['US'] },
  sec_company_tickers_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['market-reference'], supportedRegions: ['US'] },
  sec_company_facts_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_SEC_USER_AGENT'], supportedEventTypes: ['company-fact'], supportedRegions: ['US'] },
  sec_form4_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_SEC_USER_AGENT'], supportedEventTypes: ['insider-transaction'], supportedRegions: ['US'] },
  sec_form13f_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_SEC_USER_AGENT'], supportedEventTypes: ['institutional-holding'], supportedRegions: ['US'] },
  etf_holdings_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['etf-holding'], supportedRegions: ['US'] },
  macro_calendar_fred: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_FRED_API_KEY'], supportedEventTypes: ['macro-event'], supportedRegions: ['US'] },
  treasury_fiscal_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['fiscal-event'], supportedRegions: ['US'] },
  bls_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['macro-event'], supportedRegions: ['US'] },
  bea_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_BEA_API_KEY'], supportedEventTypes: ['macro-event'], supportedRegions: ['US'] },
  eia_energy_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_EIA_API_KEY'], supportedEventTypes: ['energy-event'], supportedRegions: ['US'] },
  politician_disclosure_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_POLITICIAN_DISCLOSURE_URL'], supportedEventTypes: ['public-disclosure'], supportedRegions: ['US'] },
  rss_public_radar: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['news'] },
  public_market_rest: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  yahoo_finance_1m_public: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  coingecko_public_rest: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  stocktwits_public_stream: { feedTypes: ['REST'], envKeysRequired: [] },
  polymarket_gamma_public: { feedTypes: ['REST'], envKeysRequired: [] },
  coinbase_public_ws: { feedTypes: ['WebSocket', 'REST'], envKeysRequired: [], symbolDiscovery: 'coinbase', realtimeFeedType: 'WebSocket' },
  binance_public_ws: { feedTypes: ['WebSocket', 'REST'], envKeysRequired: [], symbolDiscovery: 'binance', realtimeFeedType: 'WebSocket' },
  alpaca_equity_quotes: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY'], realtimeFeedType: 'REST', supportedEventTypes: ['quote'], supportedRegions: ['US'] },
  alpaca_options: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY', 'ATLASZ_OPTIONS_UNDERLYINGS'], realtimeFeedType: 'REST', supportedEventTypes: ['option-snapshot'], supportedRegions: ['US'] },
  x_explore_placeholder: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_X_AUTH_TOKEN'] },
  fed_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['macro-event', 'news'], supportedRegions: ['US'] },
  sec_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['filing', 'news'], supportedRegions: ['US'] },
  ecb_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['macro-event', 'news'], supportedRegions: ['EU'] },
  wsj_markets_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['news'], supportedRegions: ['global'] },
  arxiv_cs_ai: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['research', 'ai'], supportedRegions: ['global'] },
  nasa_news: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['space', 'science'], supportedRegions: ['global'] },
  space_launch_library: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['space', 'launch'], supportedRegions: ['global'] },
  github_trending_repos: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['tech', 'ai'], supportedRegions: ['global'] },
  usgs_significant_quakes: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['natural-disaster', 'seismic'], supportedRegions: ['global'] },
  noaa_alerts_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['weather-alert'], supportedRegions: ['US'] },
  federal_register_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['regulatory-document', 'rule', 'notice', 'proposed-rule'], supportedRegions: ['US'] },
  ofac_sdn_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['sanctions-record', 'sdn-list'], supportedRegions: ['global'] },
  congress_gov_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['legislation', 'bill-action'], supportedRegions: ['US'] },
  un_comtrade_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_UN_COMTRADE_API_KEY'], supportedEventTypes: ['trade-flow'], supportedRegions: ['global'] },
  openalex_works_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['research'], supportedRegions: ['global'] },
  crossref_works_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['doi-metadata', 'research'], supportedRegions: ['global'] },
  uspto_patentsview_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_PATENTSVIEW_API_KEY'], supportedEventTypes: ['patent'], supportedRegions: ['US'] },
  cisa_kev_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['cyber-advisory'], supportedRegions: ['global'] },
  nvd_cve_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['cyber-advisory'], supportedRegions: ['global'] },
  github_ghsa_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['cyber-advisory'], supportedRegions: ['global'] },
  osv_dev_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['cyber-advisory'], supportedRegions: ['global'] },
  cisa_advisories_public: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['cyber-advisory'], supportedRegions: ['global'] },
  github_releases_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['open-source-release'], supportedRegions: ['global'] },
}

export type LocalServiceKind = 'sqlite' | 'ollama' | 'vector-memory'

export type LocalServiceDescriptor = {
  id: string
  name: string
  kind: LocalServiceKind
  /** Env flag that gates an optional local service (e.g. Ollama). */
  enableEnvKey?: string
  endpointEnvKey?: string
  defaultEndpoint?: string
  note: string
}

export const LOCAL_SERVICES: LocalServiceDescriptor[] = [
  {
    id: 'local_sqlite_wal',
    name: 'Local SQLite (WAL) persistence',
    kind: 'sqlite',
    note: 'Local-first durable store; JSON fallback if SQLite is unavailable.',
  },
  {
    id: 'local_vector_memory',
    name: 'Vector memory (historical precedent)',
    kind: 'vector-memory',
    note: 'Local-computed lexical embeddings for precedent matching; not a neural model.',
  },
  {
    id: 'local_ollama',
    name: 'Local Ollama cognitive parser',
    kind: 'ollama',
    enableEnvKey: 'ATLASZ_ENABLE_OLLAMA',
    endpointEnvKey: 'ATLASZ_OLLAMA_ENDPOINT',
    defaultEndpoint: 'http://localhost:11434',
    note: 'Optional local model; model-inferred outputs only, never verified. Disabled unless explicitly enabled.',
  },
]

export function builtinProviders(): ProviderDefinition[] {
  return BUILTIN_PROVIDERS.map((provider) => ({ ...provider }))
}

export function capabilityMeta(providerId: string): ProviderCapabilityMeta {
  return PROVIDER_CAPABILITY_META[providerId] ?? { feedTypes: ['REST'], envKeysRequired: [] }
}
