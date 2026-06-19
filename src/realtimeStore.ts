/**
 * Singleton realtime store for the HUD.
 *
 * One RealTimeDataEngine instance is shared across the app. Components opt into
 * live updates via the hooks below, so only those leaf components re-render on
 * the ~100ms frame cadence — the rest of the app stays still.
 *
 * There is no live market feed in the demo build, so this runs the engine's
 * offline simulator. The UI must label it honestly (see PULSE_MODE_LABEL).
 */
import { useEffect, useState } from 'react'
import { RealTimeDataEngine } from './engine/realtimeEngine'
import type { LiveAssetConfig, LiveAssetSnapshot, LiveEngineSnapshot, LiveEngineStatus } from './realtime'
import { defaultLiveEngineStatus } from './realtime'
import { marketMovers, watchlist } from './data/intel'

export const PULSE_MODE_LABEL: Record<LiveEngineStatus['mode'], string> = {
  live: 'Live feed',
  hybrid: 'Hybrid feed',
  simulated: 'Offline simulator',
  stopped: 'Pulse paused',
}

function inferKind(ticker: string): LiveAssetConfig['kind'] {
  if (ticker === 'BTC') return 'crypto'
  if (ticker === 'CL') return 'commodity'
  if (['QQQ', 'SOXX', 'GLD', 'XLE'].includes(ticker)) return 'etf'
  return 'equity'
}

function parsePrice(price: string): number {
  const value = Number.parseFloat(price.replace(/,/g, ''))
  return Number.isFinite(value) && value > 0 ? value : 100
}

const sourceMarkets = [...marketMovers, ...watchlist]

const assetConfigs: LiveAssetConfig[] = sourceMarkets.map((market) => ({
  symbol: market.ticker,
  label: market.name,
  kind: inferKind(market.ticker),
  source: 'simulator',
  feedSymbol: market.ticker.toLowerCase(),
}))

const seedPrices: Record<string, number> = Object.fromEntries(
  sourceMarkets.map((market) => [market.ticker, parsePrice(market.price)]),
)

let engine: RealTimeDataEngine | null = null

export function getEngine(): RealTimeDataEngine {
  if (!engine) {
    engine = new RealTimeDataEngine({
      assets: assetConfigs,
      seedPrices,
      syncIntervalMs: 100,
      bufferSize: 1000,
    })
  }
  return engine
}

/** Start or stop the offline simulator pulse. */
export function setPulseEnabled(enabled: boolean): void {
  const instance = getEngine()
  if (enabled) {
    instance.start({ simulate: true })
  } else {
    instance.stop()
  }
}

/** Subscribe to the latest engine snapshot. Re-renders the caller per frame. */
export function useEngineSnapshot(): LiveEngineSnapshot {
  const [snapshot, setSnapshot] = useState<LiveEngineSnapshot>(() => getEngine().getSnapshot())
  useEffect(() => getEngine().subscribe(setSnapshot), [])
  return snapshot
}

export function useEngineStatus(): LiveEngineStatus {
  const snapshot = useEngineSnapshot()
  return snapshot.status ?? defaultLiveEngineStatus
}

/** Live snapshot for a single symbol, or null if the symbol is not tracked. */
export function useLiveAsset(symbol: string): LiveAssetSnapshot | null {
  const snapshot = useEngineSnapshot()
  return snapshot.frame?.assets.find((asset) => asset.symbol === symbol) ?? null
}
