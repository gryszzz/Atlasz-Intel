import { useEffect, useState } from 'react'
import { buildSeedWorldIntelSnapshot, type WorldIntelSnapshot } from './worldIntel'

function desktopWorld() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.atlaszDesktop?.world ?? null
}

export function useWorldIntelSnapshot(): {
  snapshot: WorldIntelSnapshot
  refresh: () => Promise<void>
  toggleFavorite: (kind: 'asset' | 'country' | 'event' | 'narrative', targetId: string, label: string) => Promise<void>
  loading: boolean
} {
  const [snapshot, setSnapshot] = useState<WorldIntelSnapshot>(() => buildSeedWorldIntelSnapshot())
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const world = desktopWorld()
    if (!world) {
      return
    }
    setLoading(true)
    try {
      setSnapshot(await world.refresh())
    } finally {
      setLoading(false)
    }
  }

  async function toggleFavorite(kind: 'asset' | 'country' | 'event' | 'narrative', targetId: string, label: string) {
    const world = desktopWorld()
    if (!world?.favorite) {
      return
    }
    setSnapshot(await world.favorite(kind, targetId, label))
  }

  useEffect(() => {
    const world = desktopWorld()
    if (!world) {
      return
    }
    let mounted = true
    void world
      .snapshot()
      .then((next) => {
        if (mounted) {
          setSnapshot(next)
        }
        return world.refresh()
      })
      .then((next) => {
        if (mounted) {
          setSnapshot(next)
        }
      })
      .catch(() => {
        if (mounted) {
          setSnapshot(buildSeedWorldIntelSnapshot())
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return { snapshot, refresh, toggleFavorite, loading }
}
