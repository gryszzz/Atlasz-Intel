import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { buildDefaultAssetUniverse } from '../../src/assetUniverse'
import type {
  AssetSourceAvailability,
  ProviderCapability,
  ProviderCapabilityStatus,
  ProviderDiscoverySnapshot,
  ProviderFeedType,
} from '../../src/providerDiscovery'
import type { OsintSourceSnapshot } from '../../src/worldIntel'
import type { IntelPersistence } from '../persistence'
import { capabilityMeta, LOCAL_SERVICES } from './builtinProviderCatalog'
import {
  isProviderConfigured,
  loadProviderConfig,
  providerConfigHint,
  type ProviderDefinition,
} from './providerConfig'
import {
  discoverBinanceSymbols,
  discoverCoinbaseProducts,
  resolveKasMapping,
  toUpperSet,
  type FetchLike,
} from './symbolDiscovery'

type DiscoveryFetch = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export type ProviderDiscoveryOptions = {
  userDataPath: string
  persistence: IntelPersistence
  fetchImpl?: DiscoveryFetch
  now?: () => number
  env?: NodeJS.ProcessEnv
}

const CACHE_FILENAME = 'atlasz.provider-discovery-cache.json'
const discoveryTimeoutMs = 2_500

export class ProviderDiscoveryService {
  private readonly userDataPath: string
  private readonly persistence: IntelPersistence
  private readonly fetchImpl: DiscoveryFetch
  private readonly now: () => number
  private readonly env: NodeJS.ProcessEnv
  private lastSnapshot: ProviderDiscoverySnapshot | null = null

  constructor(options: ProviderDiscoveryOptions) {
    this.userDataPath = options.userDataPath
    this.persistence = options.persistence
    this.fetchImpl = options.fetchImpl ?? defaultFetch
    this.now = options.now ?? (() => Date.now())
    this.env = options.env ?? process.env
    this.lastSnapshot = this.readCache()
  }

  snapshot(): ProviderDiscoverySnapshot {
    return this.lastSnapshot ?? unavailableSnapshot()
  }

  configPath(): string {
    return this.env.ATLASZ_PROVIDER_CONFIG || join(this.userDataPath, 'atlasz.providers.json')
  }

  ensureConfigTemplate(): { path: string; created: boolean } {
    const path = this.configPath()
    if (existsSync(path)) {
      return { path, created: false }
    }
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(
      path,
      JSON.stringify(
        {
          providers: [],
          note: 'Add safe public RSS/custom-json/GDELT providers here. Atlasz will fail closed on unsupported/private endpoints.',
        },
        null,
        2,
      ),
    )
    return { path, created: true }
  }

  async discover(): Promise<ProviderDiscoverySnapshot> {
    const configPath = this.configPath()
    const config = loadProviderConfig({ configPath })
    const providers: ProviderCapability[] = []
    const providerSymbolSets: Array<{ providerId: string; feedType: 'REST' | 'WebSocket'; symbols: Set<string> }> = []
    const discoveredAt = this.now()

    for (const provider of config.providers) {
      const capability = await this.discoverProvider(provider, discoveredAt)
      providers.push(capability)
      if (capability.supportedSymbols.length > 0) {
        providerSymbolSets.push({
          providerId: capability.providerId,
          feedType: capability.feedTypes.includes('WebSocket') ? 'WebSocket' : 'REST',
          symbols: toUpperSet(capability.supportedSymbols),
        })
      }
    }

    for (const local of await this.discoverLocalServices(discoveredAt)) {
      providers.push(local)
    }

    const kas = resolveKasMapping(providerSymbolSets)
    const assetAvailability: AssetSourceAvailability[] = [
      ...kas.resolutions.map((resolution) => ({
        assetSymbol: kas.assetSymbol,
        providerId: resolution.providerId,
        providerSymbol: resolution.providerSymbol,
        feedType: resolution.feedType,
        status: 'available' as const,
      })),
    ]
    if (assetAvailability.length === 0) {
      assetAvailability.push({
        assetSymbol: 'KAS',
        providerId: 'unavailable',
        providerSymbol: 'KAS',
        feedType: 'REST',
        status: 'PRICE_UNAVAILABLE',
      })
    }

    const available = providers.filter((provider) => provider.status === 'available').length
    const unavailable = providers.length - available
    const snapshot: ProviderDiscoverySnapshot = {
      status: providers.length === 0 ? 'unavailable' : available > 0 && unavailable > 0 ? 'partial' : available > 0 ? 'ready' : 'failed',
      lastDiscoveryAt: discoveredAt,
      cacheUpdatedAt: discoveredAt,
      configPath: config.configPath,
      configErrors: config.errors,
      providers,
      assetAvailability,
      lastError: config.errors[0],
    }
    this.lastSnapshot = snapshot
    this.writeCache(snapshot)
    this.persist(snapshot)
    return snapshot
  }

  private async discoverProvider(provider: ProviderDefinition, lastDiscoveryAt: number): Promise<ProviderCapability> {
    const meta = capabilityMeta(provider.providerId)
    const envKeysRequired = unique([...(provider.envKey ? [provider.envKey] : []), ...meta.envKeysRequired])
    const envKeysPresent = envKeysRequired.filter((key) => Boolean(this.env[key]))
    const authRequired = provider.authType !== 'none' || envKeysRequired.length > 0
    const endpointsChecked: string[] = []
    const supportedSymbols = new Set(provider.supportedSymbols ?? [])
    let status: ProviderCapabilityStatus
    let discoveryError = providerConfigHint(provider)

    if (provider.adapter === 'disabled') {
      status = 'auth-gated'
    } else if (!provider.enabled) {
      status = 'unsupported'
    } else if (!isProviderConfigured(provider, this.env)) {
      status = authRequired ? 'missing-config' : 'unavailable'
    } else {
      try {
        const endpoint = endpointFor(provider)
        if (endpoint) {
          endpointsChecked.push(endpoint)
          await this.checkEndpoint(endpoint)
        }
        if (meta.symbolDiscovery === 'coinbase') {
          const endpoint = 'https://api.exchange.coinbase.com/products'
          endpointsChecked.push(endpoint)
          for (const symbol of await discoverCoinbaseProducts(this.asFetchLike(), abortSignal(discoveryTimeoutMs))) {
            supportedSymbols.add(symbol)
          }
        }
        if (meta.symbolDiscovery === 'binance') {
          const endpoint = 'https://api.binance.com/api/v3/exchangeInfo'
          endpointsChecked.push(endpoint)
          for (const symbol of await discoverBinanceSymbols(this.asFetchLike(), abortSignal(discoveryTimeoutMs))) {
            supportedSymbols.add(symbol)
          }
        }
        if (provider.providerId === 'public_market_rest') {
          for (const asset of buildDefaultAssetUniverse(this.env.ATLASZ_ENABLE_PUBLIC_WS === '1')) {
            supportedSymbols.add(asset.symbol)
            supportedSymbols.add(asset.feedSymbol)
          }
        }
        if (provider.providerId === 'coingecko_public_rest') {
          for (const asset of buildDefaultAssetUniverse(false).filter((asset) => asset.source === 'coingecko')) {
            supportedSymbols.add(asset.symbol)
            supportedSymbols.add(asset.feedSymbol)
          }
        }
        status = 'available'
        discoveryError = undefined
      } catch (error) {
        status = isRateLimitError(error) ? 'rate-limited' : 'unavailable'
        discoveryError = errorMessage(error)
      }
    }

    return {
      providerId: provider.providerId,
      providerName: provider.providerName,
      category: provider.category,
      adapterId: provider.adapter,
      status,
      supportedAssets: [...supportedSymbols].filter((symbol) => /^[A-Z0-9/.-]{1,16}$/.test(symbol)).slice(0, 200),
      supportedSymbols: [...supportedSymbols].slice(0, 1_000),
      supportedRegions: meta.supportedRegions ?? [],
      supportedEventTypes: meta.supportedEventTypes ?? [],
      feedTypes: meta.feedTypes,
      authRequired,
      envKeysRequired,
      envKeysPresent,
      endpointsChecked: unique(endpointsChecked),
      lastDiscoveryAt,
      discoveryError,
      provenance: provider.provenance,
      legalSafetyNote: provider.legalSafetyNote,
      autoWired: provider.enabled && status === 'available',
    }
  }

  private async discoverLocalServices(lastDiscoveryAt: number): Promise<ProviderCapability[]> {
    const capabilities: ProviderCapability[] = []
    for (const service of LOCAL_SERVICES) {
      const endpoint = service.endpointEnvKey ? this.env[service.endpointEnvKey] || service.defaultEndpoint : undefined
      const enabled = !service.enableEnvKey || this.env[service.enableEnvKey] === '1'
      let status: ProviderCapabilityStatus = enabled ? 'available' : 'missing-config'
      let discoveryError: string | undefined
      const endpointsChecked: string[] = []

      if (service.kind === 'sqlite') {
        status = this.persistence.mode === 'unknown' ? 'unavailable' : 'available'
        discoveryError = this.persistence.mode === 'unknown' ? 'SQLite mode unknown' : undefined
      } else if (service.kind === 'ollama') {
        if (!enabled) {
          status = 'missing-config'
          discoveryError = `Set ${service.enableEnvKey}=1 to enable local Ollama discovery.`
        } else if (endpoint) {
          endpointsChecked.push(endpoint)
          try {
            await this.checkEndpoint(`${endpoint.replace(/\/$/, '')}/api/tags`)
            status = 'available'
          } catch (error) {
            status = 'unavailable'
            discoveryError = errorMessage(error)
          }
        }
      }

      capabilities.push({
        providerId: service.id,
        providerName: service.name,
        category: service.kind,
        adapterId: service.kind,
        status,
        supportedAssets: [],
        supportedSymbols: [],
        supportedRegions: [],
        supportedEventTypes: [],
        feedTypes: service.kind === 'sqlite' ? ['SQLite'] : ['local'],
        authRequired: false,
        envKeysRequired: service.enableEnvKey ? [service.enableEnvKey] : [],
        envKeysPresent: service.enableEnvKey && this.env[service.enableEnvKey] ? [service.enableEnvKey] : [],
        endpointsChecked,
        lastDiscoveryAt,
        discoveryError,
        provenance: service.kind === 'ollama' ? 'local-model' : 'local-derived',
        legalSafetyNote: service.note,
        autoWired: status === 'available',
      })
    }
    return capabilities
  }

  private asFetchLike(): FetchLike {
    return async (url, init) => this.fetchImpl(url, init)
  }

  private async checkEndpoint(url: string): Promise<void> {
    const response = await this.fetchImpl(url, {
      signal: abortSignal(discoveryTimeoutMs),
      headers: { accept: 'application/json, application/xml, text/xml, */*' },
    })
    if (!response.ok) {
      throw new Error(`${url} HTTP ${response.status}`)
    }
  }

  private persist(snapshot: ProviderDiscoverySnapshot): void {
    for (const provider of snapshot.providers) {
      try {
        this.persistence.saveOsintSource(providerToSourceSnapshot(provider))
        this.persistence.audit({
          id: `audit-provider-${provider.providerId}-${snapshot.lastDiscoveryAt ?? this.now()}`,
          eventType: provider.status === 'available' ? 'provider_discovered' : 'provider_discovery_failed',
          connectorId: provider.providerId,
          severity: provider.status === 'available' ? 'info' : provider.status === 'missing-config' ? 'watch' : 'error',
          message: `${provider.providerName}: ${provider.status}`,
          createdAt: snapshot.lastDiscoveryAt ?? this.now(),
          metadata: {
            status: provider.status,
            feedTypes: provider.feedTypes,
            supportedSymbols: provider.supportedSymbols.slice(0, 20),
            endpointsChecked: provider.endpointsChecked,
          },
        })
      } catch {
        // Discovery must never crash startup.
      }
    }
  }

  private readCache(): ProviderDiscoverySnapshot | null {
    const path = this.cachePath()
    if (!existsSync(path)) {
      return null
    }
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as ProviderDiscoverySnapshot
    } catch {
      return null
    }
  }

  private writeCache(snapshot: ProviderDiscoverySnapshot): void {
    const path = this.cachePath()
    try {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(snapshot, null, 2))
    } catch {
      // Cache writes are best-effort; source health still uses memory.
    }
  }

  private cachePath(): string {
    return join(this.userDataPath, CACHE_FILENAME)
  }
}

function providerToSourceSnapshot(provider: ProviderCapability): OsintSourceSnapshot {
  return {
    sourceId: `provider:${provider.providerId}`,
    sourceName: provider.providerName,
    sourceType: provider.category,
    endpointType: feedTypeToEndpoint(provider.feedTypes[0]),
    endpoint: provider.endpointsChecked[0] ?? 'local/provider registry',
    pollIntervalMs: 0,
    rateLimitMs: 0,
    timeoutMs: discoveryTimeoutMs,
    enabled: provider.autoWired,
    status: providerStatusToSourceStatus(provider.status),
    provenance: provider.provenance,
    lastSuccessAt: provider.status === 'available' ? provider.lastDiscoveryAt : undefined,
    lastErrorAt: provider.discoveryError ? provider.lastDiscoveryAt : undefined,
    lastError: provider.discoveryError,
    itemCount: provider.supportedSymbols.length,
    sourceReliabilityScore: provider.status === 'available' ? 1 : provider.status === 'missing-config' || provider.status === 'auth-gated' ? 0.35 : 0.15,
    legalSafetyNote: provider.legalSafetyNote,
    parserAdapter: provider.adapterId,
  }
}

function providerStatusToSourceStatus(status: ProviderCapabilityStatus): OsintSourceSnapshot['status'] {
  if (status === 'available') return 'online'
  if (status === 'rate-limited') return 'rate-limited'
  if (status === 'missing-config' || status === 'auth-gated' || status === 'unsupported') return 'disabled'
  return 'failed'
}

function feedTypeToEndpoint(feedType: ProviderFeedType | undefined): OsintSourceSnapshot['endpointType'] {
  if (feedType === 'RSS') return 'rss'
  if (feedType === 'WebSocket') return 'websocket'
  if (feedType === 'local' || feedType === 'SQLite') return 'local'
  return 'rest'
}

function endpointFor(provider: ProviderDefinition): string | null {
  if (provider.providerId === 'gdelt_doc_public') {
    return 'https://api.gdeltproject.org/api/v2/doc/doc?query=markets&mode=ArtList&format=json&maxrecords=1'
  }
  if (provider.providerId === 'public_market_rest' || provider.providerId === 'yahoo_finance_1m_public') {
    return 'https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=1d&interval=1m'
  }
  if (provider.providerId === 'coingecko_public_rest') {
    return 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
  }
  if (provider.providerId === 'stocktwits_public_stream') {
    return 'https://api.stocktwits.com/api/2/streams/symbol/SPY.json'
  }
  if (provider.providerId === 'polymarket_gamma_public') {
    return 'https://gamma-api.polymarket.com/markets?limit=1'
  }
  if (provider.endpoint && /^https?:\/\//i.test(provider.endpoint) && !provider.endpoint.includes(' ')) {
    return provider.endpoint
  }
  return null
}

function abortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs).unref?.()
  return controller.signal
}

async function defaultFetch(url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) {
  return fetch(url, init)
}

function unavailableSnapshot(): ProviderDiscoverySnapshot {
  return {
    status: 'unavailable',
    configErrors: [],
    providers: [],
    assetAvailability: [],
    lastError: 'Provider discovery has not run yet.',
  }
}

function isRateLimitError(error: unknown): boolean {
  return /429|rate/i.test(errorMessage(error))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
