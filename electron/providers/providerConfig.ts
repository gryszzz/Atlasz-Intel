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
    provenance: 'public-unauthenticated',
    legalSafetyNote: 'Documented public GDELT API; public unauthenticated article metadata, not verification.',
  },
  {
    providerId: 'sec_edgar_public',
    providerName: 'SEC EDGAR public filings (8-K/10-Q/10-K)',
    category: 'filings',
    adapter: 'sec-edgar',
    enabled: true,
    endpoint: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent (Atom)',
    authType: 'env',
    envKey: 'ATLASZ_SEC_USER_AGENT',
    pollIntervalMs: 10 * 60_000,
    rateLimitGuardMs: 60_000,
    timeoutMs: 15_000,
    provenance: 'official-api',
    legalSafetyNote: 'Official SEC EDGAR public Atom feed. Requires a contactable User-Agent; fail-closed without one. No login or scraping.',
  },
  {
    providerId: 'macro_calendar_fred',
    providerName: 'Macro calendar (FRED official API)',
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
    legalSafetyNote: 'Official FRED public API. API key from env only; fail-closed without it. Missing observations are skipped.',
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
