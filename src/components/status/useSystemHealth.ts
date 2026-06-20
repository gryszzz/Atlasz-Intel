import { useCallback, useEffect, useState } from 'react'
import type { LiveEngineStatus } from '../../realtime'
import type { MicrostructureHealth } from '../../microstructure'
import type { ProviderDiscoverySnapshot } from '../../providerDiscovery'

export type SystemHealth = {
  desktop: boolean
  persistenceMode: string | null
  ingest: AtlaszPublicIngestStatus | null
  realtime: LiveEngineStatus | null
  microstructure: MicrostructureHealth | null
  providers: ProviderDiscoverySnapshot | null
}

const EMPTY: SystemHealth = {
  desktop: false,
  persistenceMode: null,
  ingest: null,
  realtime: null,
  microstructure: null,
  providers: null,
}

type DbNamespace = { status: () => Promise<{ mode: string }> }

/** Gather system-service health from the desktop bridges. Pure (no setState). */
async function gatherHealth(): Promise<SystemHealth | null> {
  const bridge = typeof window !== 'undefined' ? window.atlaszDesktop : undefined
  if (!bridge) {
    return null
  }
  const db = (bridge as unknown as { db?: DbNamespace }).db
  const [persistenceMode, ingest, realtime, realtimeHealth, providers] = await Promise.all([
    db ? safe(async () => (await db.status()).mode) : Promise.resolve(null),
    bridge.ingest ? safe(() => bridge.ingest!.status()) : Promise.resolve(null),
    bridge.realtime ? safe(() => bridge.realtime!.status()) : Promise.resolve(null),
    bridge.realtime ? safe(() => bridge.realtime!.health()) : Promise.resolve(null),
    bridge.providers ? safe(() => bridge.providers!.snapshot()) : Promise.resolve(null),
  ])
  return { desktop: true, persistenceMode, ingest, realtime, microstructure: realtimeHealth?.microstructure ?? null, providers }
}

/** Pulls live system-service health from the desktop bridges; honest nulls in web. */
export function useSystemHealth(): { health: SystemHealth; refresh: () => Promise<void> } {
  const [health, setHealth] = useState<SystemHealth>(EMPTY)

  const refresh = useCallback(async () => {
    const next = await gatherHealth()
    if (next) {
      setHealth(next)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      const next = await gatherHealth()
      if (mounted && next) {
        setHealth(next)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  return { health, refresh }
}

async function safe<T>(operation: () => Promise<T> | T): Promise<T | null> {
  try {
    return await operation()
  } catch {
    return null
  }
}
