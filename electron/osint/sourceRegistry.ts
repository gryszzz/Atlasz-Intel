import {
  buildWorldIntelEventFromHeadline,
  classifyHeadlineText,
  type OsintSourceSnapshot,
  type PublicWorldHeadline,
  type WorldIntelEvent,
} from '../../src/worldIntel'
import type { ProvenanceId } from '../../src/provenance'
import { POLITICIAN_SOURCE_ID, fetchPoliticianDisclosures, readPoliticianConfig } from './adapters/politicianTradeAdapter'
import { SEC_SOURCE_ID, fetchSecFilings, readSecConfig } from './adapters/secEdgarAdapter'
import { MACRO_SOURCE_ID, fetchMacroCalendar, readMacroConfig } from './adapters/macroCalendarAdapter'

type SourceStatus = OsintSourceSnapshot['status']

type SourceDefinition = {
  sourceId: string
  sourceName: string
  sourceType: string
  endpointType: OsintSourceSnapshot['endpointType']
  endpoint: string
  pollIntervalMs: number
  rateLimitMs: number
  timeoutMs: number
  enabled: boolean
  provenance: ProvenanceId
  legalSafetyNote: string
  parserAdapter: string
  fetcher?: (signal: AbortSignal) => Promise<WorldIntelEvent[]>
}

type SourceRuntimeState = {
  status: SourceStatus
  lastAttemptAt?: number
  lastSuccessAt?: number
  lastErrorAt?: number
  lastError?: string
  itemCount: number
  sourceReliabilityScore: number
  consecutiveFailures: number
}

type GdeltArticle = {
  url?: unknown
  title?: unknown
  seendate?: unknown
  domain?: unknown
  sourceCommonName?: unknown
  sourceCountry?: unknown
}

type GdeltResponse = {
  articles?: GdeltArticle[]
}

const gdeltEndpoint = 'https://api.gdeltproject.org/api/v2/doc/doc'
const gdeltQuery = [
  '"Red Sea"',
  'semiconductor',
  'Taiwan',
  'tariffs',
  'sanctions',
  '"rare earth"',
  '"central bank"',
  'inflation',
  '"natural gas"',
  'oil',
  '"data center"',
  'copper',
  'uranium',
].join(' OR ')

export class OsintSourceRegistry {
  private readonly definitions: SourceDefinition[]
  private readonly states = new Map<string, SourceRuntimeState>()

  constructor() {
    this.definitions = buildSourceDefinitions()
    for (const definition of this.definitions) {
      this.states.set(definition.sourceId, {
        status: definition.enabled ? 'idle' : 'disabled',
        itemCount: 0,
        sourceReliabilityScore: definition.enabled ? 1 : 0,
        consecutiveFailures: 0,
      })
    }
  }

  snapshots(): OsintSourceSnapshot[] {
    return this.definitions.map((definition) => this.toSnapshot(definition))
  }

  async pollEnabledSources(now = Date.now()): Promise<{ events: WorldIntelEvent[]; sources: OsintSourceSnapshot[] }> {
    const events: WorldIntelEvent[] = []
    for (const definition of this.definitions) {
      if (!definition.enabled || !definition.fetcher) {
        continue
      }
      const state = this.requireState(definition.sourceId)
      if (state.lastAttemptAt && now - state.lastAttemptAt < definition.rateLimitMs) {
        state.status = 'rate-limited'
        continue
      }
      state.lastAttemptAt = now
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), definition.timeoutMs)
      try {
        const result = await definition.fetcher(controller.signal)
        state.status = 'online'
        state.lastSuccessAt = Date.now()
        state.lastError = undefined
        state.itemCount += result.length
        state.consecutiveFailures = 0
        state.sourceReliabilityScore = Math.min(1, state.sourceReliabilityScore + 0.05)
        events.push(...result)
      } catch (error) {
        state.status = 'failed'
        state.lastErrorAt = Date.now()
        state.lastError = error instanceof Error ? error.message : String(error)
        state.consecutiveFailures += 1
        state.sourceReliabilityScore = Math.max(0.15, Number((state.sourceReliabilityScore * 0.82).toFixed(3)))
      } finally {
        clearTimeout(timeout)
      }
    }
    return { events: dedupeEvents(events), sources: this.snapshots() }
  }

  private toSnapshot(definition: SourceDefinition): OsintSourceSnapshot {
    const state = this.requireState(definition.sourceId)
    return {
      sourceId: definition.sourceId,
      sourceName: definition.sourceName,
      sourceType: definition.sourceType,
      endpointType: definition.endpointType,
      endpoint: definition.endpoint,
      pollIntervalMs: definition.pollIntervalMs,
      rateLimitMs: definition.rateLimitMs,
      timeoutMs: definition.timeoutMs,
      enabled: definition.enabled,
      status: definition.enabled ? state.status : 'disabled',
      provenance: definition.provenance,
      lastSuccessAt: state.lastSuccessAt,
      lastErrorAt: state.lastErrorAt,
      lastError: state.lastError,
      itemCount: state.itemCount,
      sourceReliabilityScore: state.sourceReliabilityScore,
      legalSafetyNote: definition.legalSafetyNote,
      parserAdapter: definition.parserAdapter,
    }
  }

  private requireState(sourceId: string): SourceRuntimeState {
    const state = this.states.get(sourceId)
    if (!state) {
      throw new Error(`OSINT source state missing for ${sourceId}`)
    }
    return state
  }
}

function buildSourceDefinitions(): SourceDefinition[] {
  return [
    {
      sourceId: 'gdelt_doc_public',
      sourceName: 'GDELT DOC public news/events',
      sourceType: 'global-news-events',
      endpointType: 'rest',
      endpoint: gdeltEndpoint,
      pollIntervalMs: integerEnv('ATLASZ_GDELT_POLL_MS', 5 * 60_000),
      rateLimitMs: integerEnv('ATLASZ_GDELT_RATE_LIMIT_MS', 20_000),
      timeoutMs: integerEnv('ATLASZ_GDELT_TIMEOUT_MS', 12_000),
      enabled: process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0',
      provenance: 'public-unauthenticated',
      legalSafetyNote: 'Documented public GDELT API; public unauthenticated article metadata, not verification.',
      parserAdapter: 'gdelt-doc-artlist-v2',
      fetcher: fetchGdeltEvents,
    },
    secEdgarSource(),
    politicianDisclosureSource(),
    macroCalendarSource(),
    registryOnlySource('rss_public_radar', 'RSS public finance/geopolitics feeds', 'global-news-events', 'rss', 'rss-public'),
    registryOnlySource('yahoo_finance_1m_public', 'Yahoo public market bars', 'markets', 'rest', 'public-unauthenticated'),
    registryOnlySource('stocktwits_public_stream', 'Stocktwits public symbol streams', 'social-attention', 'rest', 'public-unauthenticated'),
    registryOnlySource('polymarket_gamma_public', 'Polymarket Gamma public markets', 'markets-probability', 'rest', 'public-unauthenticated'),
    registryOnlySource('coinbase_public_ws', 'Coinbase public crypto websocket', 'markets-crypto', 'websocket', 'public-unauthenticated'),
    {
      sourceId: 'x_explore_placeholder',
      sourceName: 'X/Twitter Explore placeholder',
      sourceType: 'social-attention',
      endpointType: 'placeholder',
      endpoint: 'disabled',
      pollIntervalMs: 0,
      rateLimitMs: 0,
      timeoutMs: 0,
      enabled: false,
      provenance: 'auth-gated',
      legalSafetyNote: 'Disabled scaffold only. No login, CAPTCHA, paywall, or anti-bot bypass behavior is implemented.',
      parserAdapter: 'disabled-placeholder',
    },
  ]
}

function registryOnlySource(
  sourceId: string,
  sourceName: string,
  sourceType: string,
  endpointType: OsintSourceSnapshot['endpointType'],
  provenance: ProvenanceId,
): SourceDefinition {
  return {
    sourceId,
    sourceName,
    sourceType,
    endpointType,
    endpoint: 'managed by existing Atlasz ingestion service',
    pollIntervalMs: 0,
    rateLimitMs: 0,
    timeoutMs: 0,
    enabled: true,
    provenance,
    legalSafetyNote: 'Registered source boundary only; ingestion is handled by the existing fail-closed connector.',
    parserAdapter: 'existing-normalizer',
  }
}

function secEdgarSource(): SourceDefinition {
  const config = readSecConfig()
  return {
    sourceId: SEC_SOURCE_ID,
    sourceName: 'SEC EDGAR public filings (8-K/10-Q/10-K)',
    sourceType: 'regulatory-filings',
    endpointType: 'rss',
    endpoint: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent (Atom)',
    pollIntervalMs: integerEnv('ATLASZ_SEC_POLL_MS', 10 * 60_000),
    rateLimitMs: integerEnv('ATLASZ_SEC_RATE_LIMIT_MS', 60_000),
    timeoutMs: integerEnv('ATLASZ_SEC_TIMEOUT_MS', 15_000),
    enabled: config !== null && process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0',
    provenance: 'official-api',
    legalSafetyNote:
      'Official SEC EDGAR public Atom feed. Requires contactable User-Agent (ATLASZ_SEC_USER_AGENT); fail-closed without one. No login or scraping.',
    parserAdapter: 'sec-edgar-atom-v1',
    fetcher: config ? (signal) => fetchSecFilings(signal, config) : undefined,
  }
}

function politicianDisclosureSource(): SourceDefinition {
  const config = readPoliticianConfig()
  return {
    sourceId: POLITICIAN_SOURCE_ID,
    sourceName: 'Public official financial disclosures (delayed)',
    sourceType: 'public-disclosure',
    endpointType: 'rest',
    endpoint: config?.url ?? 'unconfigured (ATLASZ_POLITICIAN_DISCLOSURE_URL)',
    pollIntervalMs: integerEnv('ATLASZ_POLITICIAN_POLL_MS', 30 * 60_000),
    rateLimitMs: integerEnv('ATLASZ_POLITICIAN_RATE_LIMIT_MS', 60_000),
    timeoutMs: integerEnv('ATLASZ_POLITICIAN_TIMEOUT_MS', 15_000),
    enabled: config !== null && process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0',
    provenance: 'public-disclosure',
    legalSafetyNote:
      'Configured public/open-civic disclosure provider only. Delayed public financial disclosures, not real-time market data. Fail-closed without a configured provider.',
    parserAdapter: 'politician-disclosure-json-v1',
    fetcher: config ? (signal) => fetchPoliticianDisclosures(signal, config) : undefined,
  }
}

function macroCalendarSource(): SourceDefinition {
  const config = readMacroConfig()
  return {
    sourceId: MACRO_SOURCE_ID,
    sourceName: 'Macro calendar (FRED official API)',
    sourceType: 'macro-economic',
    endpointType: 'rest',
    endpoint: 'https://api.stlouisfed.org/fred/series/observations',
    pollIntervalMs: integerEnv('ATLASZ_FRED_POLL_MS', 60 * 60_000),
    rateLimitMs: integerEnv('ATLASZ_FRED_RATE_LIMIT_MS', 120_000),
    timeoutMs: integerEnv('ATLASZ_FRED_TIMEOUT_MS', 20_000),
    enabled: config !== null && process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0',
    provenance: 'official-api',
    legalSafetyNote:
      'Official FRED public API. API key from env only (ATLASZ_FRED_API_KEY); fail-closed without it. Missing observations are skipped, never fabricated.',
    parserAdapter: 'macro-fred-observations-v1',
    fetcher: config ? (signal) => fetchMacroCalendar(signal, config) : undefined,
  }
}

async function fetchGdeltEvents(signal: AbortSignal): Promise<WorldIntelEvent[]> {
  const url = new URL(gdeltEndpoint)
  url.searchParams.set('query', gdeltQuery)
  url.searchParams.set('mode', 'ArtList')
  url.searchParams.set('format', 'json')
  url.searchParams.set('maxrecords', '50')
  url.searchParams.set('sort', 'DateDesc')

  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'user-agent': 'AtlaszIntel/0.4 local-first world-intel connector',
    },
  })
  if (!response.ok) {
    throw new Error(`GDELT HTTP ${response.status}`)
  }
  const text = await response.text()
  if (!text.trim().startsWith('{')) {
    throw new Error(text.trim().slice(0, 160) || 'GDELT returned a non-JSON response')
  }
  const payload = JSON.parse(text) as GdeltResponse
  const articles = Array.isArray(payload.articles) ? payload.articles : []
  return articles
    .map(articleToHeadline)
    .filter((headline): headline is PublicWorldHeadline => headline !== null)
    .map((headline) =>
      buildWorldIntelEventFromHeadline(headline, {
        sourceId: 'gdelt_doc_public',
        provenance: 'public-unauthenticated',
      }),
    )
}

function articleToHeadline(article: GdeltArticle): PublicWorldHeadline | null {
  const title = stringValue(article.title)
  const url = stringValue(article.url)
  if (!title || !url) {
    return null
  }
  const source = stringValue(article.sourceCommonName) || stringValue(article.domain) || 'GDELT public source'
  const observedAt = parseGdeltDate(stringValue(article.seendate)) ?? Date.now()
  const classification = classifyHeadlineText(title)
  return {
    id: stableId(url),
    title,
    source,
    url,
    sector: classification.sector,
    impact: classification.impact,
    observedAt,
  }
}

function dedupeEvents(events: WorldIntelEvent[]): WorldIntelEvent[] {
  return [...new Map(events.map((event) => [event.dedupeHash, event])).values()]
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseGdeltDate(value: string): number | null {
  if (!/^\d{14}$/.test(value)) {
    return null
  }
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`
  const timestamp = Date.parse(iso)
  return Number.isFinite(timestamp) ? timestamp : null
}

function stableId(input: string): string {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return `osint-${hash.toString(36)}`
}

function integerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])
  return Number.isInteger(value) && value >= 0 ? value : fallback
}
