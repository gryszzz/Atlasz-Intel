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

  return { snapshot, refresh, loading }
}
