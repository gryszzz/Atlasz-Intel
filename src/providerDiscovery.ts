import type { ProvenanceId } from './provenance'

export type ProviderCapabilityStatus =
  | 'available'
  | 'unavailable'
  | 'auth-gated'
  | 'missing-config'
  | 'rate-limited'
  | 'unsupported'

export type ProviderFeedType = 'REST' | 'WebSocket' | 'RSS' | 'local' | 'SQLite'

export type ProviderCapability = {
  providerId: string
  providerName: string
  category: string
  adapterId: string
  status: ProviderCapabilityStatus
  supportedAssets: string[]
  supportedSymbols: string[]
  supportedRegions: string[]
  supportedEventTypes: string[]
  feedTypes: ProviderFeedType[]
  authRequired: boolean
  envKeysRequired: string[]
  envKeysPresent: string[]
  endpointsChecked: string[]
  lastDiscoveryAt: number
  discoveryError?: string
  provenance: ProvenanceId
  legalSafetyNote: string
  autoWired: boolean
}

export type AssetSourceAvailability = {
  assetSymbol: string
  providerId: string
  providerSymbol: string
  feedType: 'REST' | 'WebSocket'
  status: 'available' | 'PRICE_UNAVAILABLE'
}

export type ProviderDiscoverySnapshot = {
  status: 'ready' | 'partial' | 'failed' | 'stale-cache' | 'unavailable'
  lastDiscoveryAt?: number
  cacheUpdatedAt?: number
  configPath?: string | null
  configErrors: string[]
  providers: ProviderCapability[]
  assetAvailability: AssetSourceAvailability[]
  lastError?: string
}
