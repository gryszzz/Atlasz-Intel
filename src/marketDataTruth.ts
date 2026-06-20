import type { LiveAssetSnapshot } from './realtime'

export const PRICE_UNAVAILABLE = 'PRICE_UNAVAILABLE'
export const CANDLE_HISTORY_UNAVAILABLE = 'CANDLE_HISTORY_UNAVAILABLE'

export type MarketFreshnessStatus = 'live' | 'delayed' | 'stale-cache' | 'offline-cache' | 'unavailable'

export type MarketFreshnessOptions = {
  now?: number
  liveTtlMs?: number
  delayedTtlMs?: number
  staleTtlMs?: number
}

export type MarketPriceTruth = {
  value: number | null
  label: string
  provider: string
  timestamp: number | null
  status: MarketFreshnessStatus
  mapping: string
}

const defaultLiveTtlMs = 30_000
const defaultDelayedTtlMs = 15 * 60_000
const defaultStaleTtlMs = 24 * 60 * 60_000

export function freshnessForTimestamp(
  timestamp: number | undefined,
  options: MarketFreshnessOptions = {},
): MarketFreshnessStatus {
  if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) {
    return 'unavailable'
  }
  const now = options.now ?? Date.now()
  const age = now - timestamp
  if (age < 0) {
    return 'delayed'
  }
  if (age <= (options.liveTtlMs ?? defaultLiveTtlMs)) {
    return 'live'
  }
  if (age <= (options.delayedTtlMs ?? defaultDelayedTtlMs)) {
    return 'delayed'
  }
  if (age <= (options.staleTtlMs ?? defaultStaleTtlMs)) {
    return 'stale-cache'
  }
  return 'offline-cache'
}

export function priceTruthFromAsset(
  asset: LiveAssetSnapshot | null | undefined,
  mapping: string,
  options: MarketFreshnessOptions = {},
): MarketPriceTruth {
  if (!asset || asset.tickCount <= 0 || !Number.isFinite(asset.price) || asset.price <= 0) {
    return {
      value: null,
      label: PRICE_UNAVAILABLE,
      provider: 'unavailable',
      timestamp: null,
      status: 'unavailable',
      mapping,
    }
  }
  return {
    value: asset.price,
    label: formatMarketPrice(asset.price),
    provider: asset.source,
    timestamp: asset.lastUpdated || null,
    status: freshnessForTimestamp(asset.lastUpdated, options),
    mapping,
  }
}

export function formatMarketPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return PRICE_UNAVAILABLE
  }
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  if (value >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}
