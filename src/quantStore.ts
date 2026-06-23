import { useCallback, useEffect, useState } from 'react'
import type { QuantTerminalSnapshot } from './quant'

function desktopQuant() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.atlaszDesktop?.quant ?? null
}

/** Honest empty snapshot — quant compute runs in the desktop (Node) process. */
function unavailableTerminalSnapshot(reason: string): QuantTerminalSnapshot {
  const now = Date.now()
  return {
    generatedAt: now,
    assets: [],
    macro: {
      generatedAt: now,
      regime: 'unavailable',
      regimeProvenance: 'math-derived',
      regimeExplanation: reason,
      metrics: [],
      fredObservations: [],
      treasuryFiscalRecords: [],
      beaObservations: [],
      eiaEnergyRecords: [],
    },
  }
}

export function useQuantSnapshot(): {
  snapshot: QuantTerminalSnapshot
  loading: boolean
  refresh: () => Promise<void>
} {
  const [snapshot, setSnapshot] = useState<QuantTerminalSnapshot>(() =>
    unavailableTerminalSnapshot('Quant engine runs in the desktop app. Not available from current public sources here.'),
  )
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const quant = desktopQuant()
    if (!quant) {
      return
    }
    setLoading(true)
    try {
      setSnapshot(await quant.snapshot())
    } catch {
      setSnapshot(unavailableTerminalSnapshot('Quant snapshot failed to compute from current data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const quant = desktopQuant()
    if (!quant) {
      return
    }
    let mounted = true
    void quant
      .snapshot()
      .then((next) => {
        if (mounted) {
          setSnapshot(next)
        }
      })
      .catch(() => {
        if (mounted) {
          setSnapshot(unavailableTerminalSnapshot('Quant snapshot failed to compute from current data.'))
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return { snapshot, loading, refresh }
}
