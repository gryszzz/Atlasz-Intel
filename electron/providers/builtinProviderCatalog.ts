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
  gdelt_doc_public: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['news', 'geopolitics'], supportedRegions: ['global'] },
  sec_edgar_public: { feedTypes: ['RSS'], envKeysRequired: ['ATLASZ_SEC_USER_AGENT'], supportedEventTypes: ['filing'], supportedRegions: ['US'] },
  macro_calendar_fred: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_FRED_API_KEY'], supportedEventTypes: ['macro-event'], supportedRegions: ['US'] },
  politician_disclosure_public: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_POLITICIAN_DISCLOSURE_URL'], supportedEventTypes: ['public-disclosure'], supportedRegions: ['US'] },
  rss_public_radar: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['news'] },
  public_market_rest: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  yahoo_finance_1m_public: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  coingecko_public_rest: { feedTypes: ['REST'], envKeysRequired: [], realtimeFeedType: 'REST' },
  stocktwits_public_stream: { feedTypes: ['REST'], envKeysRequired: [] },
  polymarket_gamma_public: { feedTypes: ['REST'], envKeysRequired: [] },
  coinbase_public_ws: { feedTypes: ['WebSocket', 'REST'], envKeysRequired: [], symbolDiscovery: 'coinbase', realtimeFeedType: 'WebSocket' },
  binance_public_ws: { feedTypes: ['WebSocket', 'REST'], envKeysRequired: [], symbolDiscovery: 'binance', realtimeFeedType: 'WebSocket' },
  x_explore_placeholder: { feedTypes: ['REST'], envKeysRequired: ['ATLASZ_X_AUTH_TOKEN'] },
  fed_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['macro-event', 'news'], supportedRegions: ['US'] },
  sec_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['filing', 'news'], supportedRegions: ['US'] },
  ecb_press_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['macro-event', 'news'], supportedRegions: ['EU'] },
  wsj_markets_rss: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['news'], supportedRegions: ['global'] },
  arxiv_cs_ai: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['research', 'ai'], supportedRegions: ['global'] },
  nasa_news: { feedTypes: ['RSS'], envKeysRequired: [], supportedEventTypes: ['space', 'science'], supportedRegions: ['global'] },
  space_launch_library: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['space', 'launch'], supportedRegions: ['global'] },
  github_trending_repos: { feedTypes: ['REST'], envKeysRequired: [], supportedEventTypes: ['tech', 'ai'], supportedRegions: ['global'] },
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
