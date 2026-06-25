/*
 * OSINT source registry — now provider-driven. Source definitions are derived
 * from the provider config (built-ins + atlasz.providers.json) and wired to the
 * adapter registry. Behavior is unchanged for built-in sources; custom public
 * providers are registered automatically. Everything is fail-closed.
 */
import { join } from 'node:path'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../../src/worldIntel'
import {
  loadProviderConfig,
  providerConfigHint,
  type ProviderDefinition,
} from '../providers/providerConfig'
import { capabilityMeta } from '../providers/builtinProviderCatalog'
import { resolveAdapter, type SourceFetcher } from './adapterRegistry'
import { HttpError, fetchWithRetry } from './fetchPolicy'

const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const MAX_FAILURE_BACKOFF_MS = 60 * 60 * 1000

/**
 * How long to wait before re-polling a source. Normally the source's own
 * `rateLimitMs`; once it has consecutive failures, a bounded exponential backoff
 * extends the window so a persistently-failing source is not re-hammered (and
 * re-charged its full timeout) on every refresh. Capped, deterministic, pure.
 */
export function sourcePollCooldownMs(
  rateLimitMs: number,
  consecutiveFailures: number,
  capMs = MAX_FAILURE_BACKOFF_MS,
): number {
  if (consecutiveFailures <= 0) return rateLimitMs
  const backoff = rateLimitMs * 2 ** Math.min(consecutiveFailures, 6)
  return Math.min(Math.max(rateLimitMs, backoff), capMs)
}

type SourceStatus = OsintSourceSnapshot['status']

type SourceDefinition = {
  sourceId: string
  sourceName: string
  sourceType: string
  category: string
  endpointType: OsintSourceSnapshot['endpointType']
  endpoint: string
  pollIntervalMs: number
  rateLimitMs: number
  timeoutMs: number
  backoffMs: number
  maxRetries: number
  enabled: boolean
  authType: OsintSourceSnapshot['authType']
  configured: boolean
  configHint?: string
  provenance: ProviderDefinition['provenance']
  legalSafetyNote: string
  parserAdapter: string
  fetcher?: SourceFetcher
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

export class OsintSourceRegistry {
  private readonly definitions: SourceDefinition[]
  private readonly states = new Map<string, SourceRuntimeState>()

  constructor(options: { configPath?: string; env?: NodeJS.ProcessEnv } = {}) {
    this.definitions = buildSourceDefinitions(options)
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
      const cooldownMs = sourcePollCooldownMs(definition.rateLimitMs, state.consecutiveFailures)
      if (state.lastAttemptAt && now - state.lastAttemptAt < cooldownMs) {
        // Within the cooldown window. If the source is in a failure backoff,
        // keep its honest failed/rate-limited status; otherwise it is simply
        // not due yet (reported as rate-limited, as before).
        if (state.consecutiveFailures === 0) {
          state.status = 'rate-limited'
        }
        continue
      }
      state.lastAttemptAt = now
      try {
        // Per-attempt timeout + bounded retry/backoff, honoring Retry-After.
        const result = await fetchWithRetry(definition.fetcher, {
          maxRetries: definition.maxRetries,
          backoffMs: definition.backoffMs,
          timeoutMs: definition.timeoutMs,
        })
        state.status = 'online'
        state.lastSuccessAt = Date.now()
        state.lastError = undefined
        state.itemCount += result.length
        state.consecutiveFailures = 0
        state.sourceReliabilityScore = Math.min(1, state.sourceReliabilityScore + 0.05)
        events.push(...result)
      } catch (error) {
        // A rate-limit that survives retries is reported honestly as rate-limited.
        state.status = error instanceof HttpError && error.status === 429 ? 'rate-limited' : 'failed'
        state.lastErrorAt = Date.now()
        state.lastError = error instanceof Error ? error.message : String(error)
        state.consecutiveFailures += 1
        state.sourceReliabilityScore = Math.max(0.15, Number((state.sourceReliabilityScore * 0.82).toFixed(3)))
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
      category: definition.category,
      authType: definition.authType,
      configured: definition.configured,
      configHint: definition.configHint,
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

function buildSourceDefinitions(options: { configPath?: string; env?: NodeJS.ProcessEnv }): SourceDefinition[] {
  const env = options.env ?? process.env
  const { providers } = loadProviderConfig({ configPath: options.configPath ?? providerConfigPath(env) })
  return providers.map((provider) => providerToDefinition(provider, env))
}

function providerToDefinition(provider: ProviderDefinition, env: NodeJS.ProcessEnv): SourceDefinition {
  const resolved = resolveAdapter(provider, env)
  const worldEnabled = env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0'
  const configured = resolved.managed ? true : resolved.configured
  const enabled = provider.enabled && (resolved.managed ? true : worldEnabled && configured)
  return {
    sourceId: provider.providerId,
    sourceName: provider.providerName,
    sourceType: provider.category,
    category: provider.category,
    endpointType: endpointTypeFor(provider),
    endpoint: provider.endpoint ?? 'managed by existing Atlasz ingestion service',
    pollIntervalMs: provider.pollIntervalMs ?? 0,
    rateLimitMs: provider.rateLimitGuardMs ?? 0,
    timeoutMs: provider.timeoutMs ?? 0,
    backoffMs: provider.backoffMs ?? DEFAULT_BACKOFF_MS,
    maxRetries: provider.maxRetries ?? DEFAULT_MAX_RETRIES,
    enabled,
    authType: provider.authType,
    configured,
    configHint: configured ? undefined : providerConfigHint(provider),
    provenance: provider.provenance,
    legalSafetyNote: provider.legalSafetyNote,
    parserAdapter: provider.adapter,
    fetcher: resolved.fetcher,
  }
}

function endpointTypeFor(provider: ProviderDefinition): OsintSourceSnapshot['endpointType'] {
  if (provider.adapter === 'disabled') {
    return 'placeholder'
  }
  const feed = capabilityMeta(provider.providerId).feedTypes[0]
  if (feed === 'RSS') return 'rss'
  if (feed === 'WebSocket') return 'websocket'
  if (feed === 'local' || feed === 'SQLite') return 'local'
  if (feed === 'REST') return 'rest'
  // Custom providers without catalog meta: derive from adapter/category.
  if (provider.adapter === 'rss' || provider.adapter === 'sec-edgar') return 'rss'
  if (provider.category === 'crypto-realtime') return 'websocket'
  return 'rest'
}

function providerConfigPath(env: NodeJS.ProcessEnv): string {
  // Matches ProviderDiscoveryService (ATLASZ_PROVIDER_CONFIG); plural kept as an alias.
  const configured = env.ATLASZ_PROVIDER_CONFIG ?? env.ATLASZ_PROVIDERS_CONFIG
  return configured && configured.trim() !== '' ? configured : join(process.cwd(), 'atlasz.providers.json')
}

function dedupeEvents(events: WorldIntelEvent[]): WorldIntelEvent[] {
  return [...new Map(events.map((event) => [event.dedupeHash, event])).values()]
}
