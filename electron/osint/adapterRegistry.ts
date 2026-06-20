/*
 * Adapter registry. Maps a provider's `adapter` id to a reusable fetcher that
 * normalizes into WorldIntelEvent. Credentialed adapters resolve their config
 * here and return no fetcher (fail-closed) when unconfigured. `managed-ingest`
 * providers are registered for health visibility but ingested elsewhere.
 */
import type { ProviderDefinition } from '../providers/providerConfig'
import type { WorldIntelEvent } from '../../src/worldIntel'
import { fetchGdeltEvents } from './adapters/gdeltAdapter'
import { fetchSecFilings, readSecConfig } from './adapters/secEdgarAdapter'
import { fetchMacroCalendar, readMacroConfig } from './adapters/macroCalendarAdapter'
import { fetchPoliticianDisclosures, readPoliticianConfig } from './adapters/politicianTradeAdapter'
import { fetchRssFeed } from './adapters/rssAdapter'
import { fetchCustomJson } from './adapters/customJsonAdapter'

export type SourceFetcher = (signal: AbortSignal) => Promise<WorldIntelEvent[]>

export type ResolvedAdapter = {
  fetcher?: SourceFetcher
  /** Credential/endpoint requirement satisfied. */
  configured: boolean
  /** Ingestion handled by another subsystem (no fetcher in this registry). */
  managed: boolean
}

export const KNOWN_ADAPTERS = [
  'gdelt',
  'sec-edgar',
  'fred-macro',
  'public-disclosure-json',
  'rss',
  'custom-json',
  'managed-ingest',
  'disabled',
] as const

export function resolveAdapter(provider: ProviderDefinition, env: NodeJS.ProcessEnv = process.env): ResolvedAdapter {
  switch (provider.adapter) {
    case 'gdelt':
      return { fetcher: fetchGdeltEvents, configured: true, managed: false }
    case 'sec-edgar': {
      const config = readSecConfig(env)
      return { fetcher: config ? (signal) => fetchSecFilings(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'fred-macro': {
      const config = readMacroConfig(env)
      return { fetcher: config ? (signal) => fetchMacroCalendar(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'public-disclosure-json': {
      const config = readPoliticianConfig(env)
      return { fetcher: config ? (signal) => fetchPoliticianDisclosures(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'rss': {
      const ok = isPublicUrl(provider.endpoint)
      return {
        fetcher: ok
          ? (signal) =>
              fetchRssFeed(signal, {
                url: provider.endpoint as string,
                sourceId: provider.providerId,
                sourceName: provider.providerName,
                provenance: provider.provenance,
              })
          : undefined,
        configured: ok,
        managed: false,
      }
    }
    case 'custom-json': {
      const ok = isPublicUrl(provider.endpoint)
      return {
        fetcher: ok
          ? (signal) =>
              fetchCustomJson(signal, {
                url: provider.endpoint as string,
                sourceId: provider.providerId,
                sourceName: provider.providerName,
                provenance: provider.provenance,
              })
          : undefined,
        configured: ok,
        managed: false,
      }
    }
    case 'managed-ingest':
      return { configured: true, managed: true }
    case 'disabled':
    default:
      return { configured: false, managed: false }
  }
}

function isPublicUrl(url: string | undefined): boolean {
  return Boolean(url && /^https?:\/\//i.test(url))
}
