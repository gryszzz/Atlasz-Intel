import { describe, expect, it } from 'vitest'
import { ThesisService } from '../electron/journal/thesisService'
import type { IntelPersistence } from '../electron/persistence'
import type { UserThesis } from '../src/engine/decisionJournal'
import type { WorldIntelEvent } from '../src/worldIntel'

const T0 = 1_700_000_000_000

type Tick = { id: string; symbol: string; price: number; volume: number; source: string; observedAt: number; tradeDate: string }

/** Minimal in-memory persistence implementing only what ThesisService touches. */
function fakePersistence(ticks: Tick[], events: WorldIntelEvent[] = []): IntelPersistence {
  const theses: UserThesis[] = []
  const partial = {
    listWorldIntelEvents: () => events,
    listMarketTicks: (symbol: string) => ticks.filter((tick) => tick.symbol === symbol),
    saveUserThesis: (record: UserThesis) => {
      const index = theses.findIndex((entry) => entry.id === record.id)
      if (index === -1) theses.push(record)
      else theses[index] = record
    },
    listUserTheses: () => [...theses].sort((a, b) => b.timestamp - a.timestamp),
  }
  return partial as unknown as IntelPersistence
}

function series(symbol: string, prices: number[], start = T0): Tick[] {
  return prices.map((price, index) => ({
    id: `${symbol}-${index}`,
    symbol,
    price,
    volume: 1000 + index,
    source: 'test',
    observedAt: start + index * 60_000,
    tradeDate: '2026-01-01',
  }))
}

describe('thesis (research-note) service', () => {
  it('captures a math-derived snapshot at log time and persists the note', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i)
    const persistence = fakePersistence(series('AAPL', prices))
    const service = new ThesisService(persistence)
    const dashboard = service.save({ assetSymbol: 'aapl', thesisType: 'Positive', userNotes: 'context note', targetHorizonDays: 7 })

    expect(dashboard.theses).toHaveLength(1)
    const thesis = dashboard.theses[0]
    expect(thesis.assetSymbol).toBe('AAPL')
    expect(thesis.thesisType).toBe('Positive')
    expect(thesis.entryPrice).not.toBeNull()
    expect(thesis.snapshotMetrics.activeProvenanceBadges).toContain('math-derived')
  })

  it('marks theses to market and computes follow-through honestly', () => {
    // Entry at the last bar (price 129), then later ticks rise to 140 → positive return.
    const base = Array.from({ length: 30 }, (_, i) => 100 + i)
    const persistence = fakePersistence(series('AAPL', [...base, 140]))
    const service = new ThesisService(persistence)
    service.save({ assetSymbol: 'AAPL', thesisType: 'Positive', userNotes: '', targetHorizonDays: 7 })
    const dashboard = service.dashboard()

    expect(dashboard.priceDataAvailable).toBe(true)
    expect(dashboard.theses[0].currentReturn).not.toBeNull()
    expect(dashboard.followThroughRate).not.toBeNull()
    expect(dashboard.byProvenance.length).toBeGreaterThan(0)
  })

  it('fails closed: no price history -> null returns, no fabricated follow-through', () => {
    const persistence = fakePersistence([]) // no ticks at all
    const service = new ThesisService(persistence)
    const dashboard = service.save({ assetSymbol: 'ZZZZ', thesisType: 'Neutral', userNotes: '', targetHorizonDays: 30 })
    expect(dashboard.theses[0].entryPrice).toBeNull()
    expect(dashboard.theses[0].currentReturn).toBeNull()
    expect(dashboard.priceDataAvailable).toBe(false)
    expect(dashboard.followThroughRate).toBeNull()
  })

  it('returns an empty dashboard when no theses exist', () => {
    const dashboard = new ThesisService(fakePersistence([])).dashboard()
    expect(dashboard.theses).toEqual([])
    expect(dashboard.openCount).toBe(0)
  })
})
