import { useEffect, useState } from 'react'
import { buildSeedWorldIntelSnapshot, type WorldIntelSnapshot } from './worldIntel'
import { devRealDataEnabled, fetchDevWorldSnapshot } from './devWorldDataBridge'

function desktopWorld() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.atlaszDesktop?.world ?? null
}

export function useWorldIntelSnapshot(): {
  snapshot: WorldIntelSnapshot
  refresh: () => Promise<void>
  pauseRefresh: () => Promise<void>
  resumeRefresh: () => Promise<void>
  toggleFavorite: (kind: 'asset' | 'country' | 'event' | 'narrative', targetId: string, label: string) => Promise<void>
  loading: boolean
} {
  const [snapshot, setSnapshot] = useState<WorldIntelSnapshot>(() => buildSeedWorldIntelSnapshot())
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const world = desktopWorld()
    if (!world) {
      // Dev preview: no desktop bridge — pull real public USGS data in-browser.
      if (devRealDataEnabled()) {
        setLoading(true)
        try {
          setSnapshot(await fetchDevWorldSnapshot())
        } finally {
          setLoading(false)
        }
      }
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

  async function pauseRefresh() {
    const world = desktopWorld()
    if (!world?.pauseRefresh) {
      return
    }
    setSnapshot(await world.pauseRefresh())
  }

  async function resumeRefresh() {
    const world = desktopWorld()
    if (!world?.resumeRefresh) {
      return
    }
    setSnapshot(await world.resumeRefresh())
  }

  useEffect(() => {
    const world = desktopWorld()
    if (!world) {
      // Dev preview: hydrate from real public USGS data when there is no desktop bridge.
      if (devRealDataEnabled()) {
        let active = true
        void fetchDevWorldSnapshot().then((next) => {
          if (active) setSnapshot(next)
        })
        return () => {
          active = false
        }
      }
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

  return { snapshot, refresh, pauseRefresh, resumeRefresh, toggleFavorite, loading }
}
