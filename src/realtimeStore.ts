/**
 * Singleton realtime store for the HUD.
 *
 * One RealTimeDataEngine instance is shared across the app. Components opt into
 * live updates via the hooks below, so only those leaf components re-render on
 * the ~100ms frame cadence — the rest of the app stays still.
 *
 * In the browser preview this runs the offline simulator. In Electron, the
 * worker-backed data core may use the simulator or an explicitly enabled public
 * feed. The UI must label source trust honestly (see PULSE_MODE_LABEL).
 */
import { useEffect, useState } from 'react'
import { buildDefaultAssetUniverse, buildSeedPrices, resolveAssetQuery, type AssetUniverseItem } from './assetUniverse'
import { RealTimeDataEngine } from './engine/realtimeEngine'
import type { LiveEngineSnapshot, LiveEngineStatus } from './realtime'
import { defaultLiveEngineStatus } from './realtime'

export const PULSE_MODE_LABEL: Record<LiveEngineStatus['mode'], string> = {
  live: 'External feed',
  hybrid: 'Hybrid feed',
  simulated: 'Offline simulator',
  replay: 'Replay mode',
  stopped: 'Pulse paused',
}

const assetConfigs = buildDefaultAssetUniverse(false)
const seedPrices = buildSeedPrices(assetConfigs)

let engine: RealTimeDataEngine | null = null

function desktopRealtime() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.atlaszDesktop?.realtime ?? null
}

export function getEngine(): RealTimeDataEngine {
  if (!engine) {
    engine = new RealTimeDataEngine({
      assets: assetConfigs,
      seedPrices,
      syncIntervalMs: 100,
      bufferSize: 1000,
      attentionTargets: [...new Set([...assetConfigs.map((asset) => asset.symbol), 'AIXR', 'LIT'])],
    })
  }
  return engine
}

export async function addUniverseAsset(query: string): Promise<AssetUniverseItem> {
  const realtime = desktopRealtime()
  const item = resolveAssetQuery(query)
  if (realtime) {
    await realtime.addAsset(query)
    return item
  }

  const instance = getEngine()
  instance.addAsset(item, item.defaultPrice)
  return item
}

/** Start or stop the offline simulator pulse. */
export function setPulseEnabled(enabled: boolean): void {
  const realtime = desktopRealtime()
  if (realtime) {
    void (enabled ? realtime.start() : realtime.stop())
    return
  }

  const instance = getEngine()
  if (enabled) {
    instance.start({ simulate: true })
  } else {
    instance.stop()
  }
}

/** Subscribe to the latest engine snapshot. Re-renders the caller per frame. */
export function useEngineSnapshot(): LiveEngineSnapshot {
  const [snapshot, setSnapshot] = useState<LiveEngineSnapshot>(() => ({
    frame: null,
    status: defaultLiveEngineStatus,
  }))

  useEffect(() => {
    const realtime = desktopRealtime()
    if (realtime) {
      let mounted = true
      void realtime.snapshot().then((nextSnapshot) => {
        if (mounted) {
          setSnapshot(nextSnapshot)
        }
      })
      const unsubscribe = realtime.onFrame((nextSnapshot) => setSnapshot(nextSnapshot))
      return () => {
        mounted = false
        unsubscribe()
      }
    }

    const instance = getEngine()
    return instance.subscribe(setSnapshot)
  }, [])
  return snapshot
}

export function useEngineStatus(): LiveEngineStatus {
  const snapshot = useEngineSnapshot()
  return snapshot.status ?? defaultLiveEngineStatus
}
