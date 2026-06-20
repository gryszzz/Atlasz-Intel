import { describe, expect, it } from 'vitest'
import {
  correlation,
  currentDrawdownPct,
  volumeVelocity,
  vwapDeviationPct,
  zScore,
} from '../electron/quant/quantMath'
import { QuantComputeService, benchmarkFor, type QuantBarSource, type MarketTickRow } from '../electron/quant/quantComputeService'
import { computeMacroSnapshot } from '../electron/quant/macroComputeService'
import { buildEventOverlay } from '../electron/quant/eventOverlayService'
import type { WorldIntelEvent } from '../src/worldIntel'

function makeEvent(partial: Partial<WorldIntelEvent>): WorldIntelEvent {
  return {
    id: partial.id ?? 'evt',
    timestamp: partial.timestamp ?? 0,
    title: partial.title ?? 'Event',
    summary: '',
    countryCodes: [],
    region: 'Global',
    category: partial.category ?? 'markets',
    severity: partial.severity ?? 'moderate',
    confidence: 60,
    sourceId: 'test',
    provenance: partial.provenance ?? 'public-unauthenticated',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: 'd',
  }
}

class FakeBarSource implements QuantBarSource {
  constructor(private readonly bars: Record<string, MarketTickRow[]>) {}
  listMarketTicks(symbol: string): MarketTickRow[] {
    return this.bars[symbol] ?? []
  }
}

function series(symbol: string, prices: number[], volumes: number[], start = 1_700_000_000_000): MarketTickRow[] {
  return prices.map((price, index) => ({
    symbol,
    price,
    volume: volumes[index] ?? 1000,
    observedAt: start + index * 60_000,
  }))
}

describe('quant math', () => {
  it('computes z-score, volume velocity, drawdown, vwap deviation, correlation', () => {
    expect(zScore([1, 2, 3, 9])).toBeCloseTo(7, 5)
    expect(volumeVelocity([100, 100, 100, 400])).toBeCloseTo(4, 5)
    expect(currentDrawdownPct([100, 120, 90])).toBeCloseTo(-25, 5)
    expect(vwapDeviationPct([{ price: 10, volume: 100 }, { price: 12, volume: 100 }])).not.toBeNull()
    expect(correlation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5)
  })

  it('fails closed (null) on insufficient data', () => {
    expect(zScore([1])).toBeNull()
    expect(volumeVelocity([5])).toBeNull()
    expect(correlation([1, 2], [1, 2])).toBeNull()
  })
})

describe('benchmark resolution', () => {
  it('routes crypto to BTC and equities to SPY', () => {
    expect(benchmarkFor('BTC-USD')).toBe('BTC')
    expect(benchmarkFor('ETH')).toBe('BTC')
    expect(benchmarkFor('AAPL')).toBe('SPY')
  })
})

describe('quant compute service', () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 3) * 4 + i * 0.2)
  const volumes = Array.from({ length: 30 }, (_, i) => (i === 29 ? 9000 : 1000))
  const benchPrices = Array.from({ length: 30 }, (_, i) => 400 + i * 0.1)
  const source = new FakeBarSource({
    AAPL: series('AAPL', prices, volumes),
    SPY: series('SPY', benchPrices, Array(30).fill(1000)),
  })

  it('computes a full snapshot with math-derived metrics and event markers', () => {
    const service = new QuantComputeService(source)
    const lastTime = 1_700_000_000_000 + 29 * 60_000
    const events = [makeEvent({ id: 'e1', affectedAssets: ['AAPL'], timestamp: lastTime - 60_000 })]
    const snapshot = service.computeAssetSnapshot('AAPL', { events })

    expect(snapshot.dataAvailable).toBe(true)
    expect(snapshot.benchmark).toBe('SPY')
    const names = snapshot.metrics.map((m) => m.metricName)
    expect(names).toEqual(
      expect.arrayContaining(['Volume velocity', 'Price z-score', 'Relative strength', 'Rolling correlation']),
    )
    const vv = snapshot.metrics.find((m) => m.metricName === 'Volume velocity')
    expect(vv?.metricValue).toBeGreaterThan(3)
    expect(vv?.status).toBe('anomaly')
    expect(vv?.provenance).toBe('math-derived')
    expect(snapshot.markers).toHaveLength(1)
    expect(snapshot.markers[0].linkType).toBe('direct-asset')
  })

  it('fails closed with unavailable snapshot when history is insufficient', () => {
    const service = new QuantComputeService(new FakeBarSource({ TSLA: series('TSLA', [1, 2, 3], [1, 1, 1]) }))
    const snapshot = service.computeAssetSnapshot('TSLA')
    expect(snapshot.dataAvailable).toBe(false)
    expect(snapshot.unavailableReason).toMatch(/insufficient/i)
    expect(snapshot.metrics).toEqual([])
  })

  it('marks benchmark metrics unavailable when the benchmark has no history', () => {
    const service = new QuantComputeService(new FakeBarSource({ AAPL: series('AAPL', prices, volumes) }))
    const snapshot = service.computeAssetSnapshot('AAPL')
    const rs = snapshot.metrics.find((m) => m.metricName === 'Relative strength')
    expect(rs?.status).toBe('unavailable')
    expect(rs?.metricValue).toBeNull()
  })
})

describe('macro compute service', () => {
  it('computes a true 10Y-2Y curve from T10Y2Y and classifies risk-off when inverted', () => {
    const snapshot = computeMacroSnapshot({ t10y2y: -0.45, dxySeries: [100, 101, 103] })
    const curve = snapshot.metrics.find((m) => m.id === 'yield-curve-10y2y')
    expect(curve?.metricValue).toBeCloseTo(-0.45, 5)
    expect(curve?.status).toBe('anomaly')
    expect(snapshot.regime).toBe('risk-off')
    expect(snapshot.regimeProvenance).toBe('math-derived')
  })

  it('falls back to DGS10 - DGS2 for the curve', () => {
    const snapshot = computeMacroSnapshot({ dgs10: 4.2, dgs2: 4.0 })
    const curve = snapshot.metrics.find((m) => m.id === 'yield-curve-10y2y')
    expect(curve?.metricValue).toBeCloseTo(0.2, 5)
  })

  it('fails closed to unavailable regime with no series', () => {
    const snapshot = computeMacroSnapshot({})
    expect(snapshot.regime).toBe('unavailable')
  })
})

describe('event overlay service', () => {
  const base = 1_700_000_000_000
  const events = [
    makeEvent({ id: 'direct', affectedAssets: ['AAPL'], timestamp: base + 1000 }),
    makeEvent({ id: 'macro', affectedAssets: ['SPY', 'AAPL'], category: 'macro-event', timestamp: base + 2000 }),
    makeEvent({ id: 'inferred', affectedAssets: ['AAPL'], provenance: 'model-inferred', timestamp: base + 3000 }),
    makeEvent({ id: 'out', affectedAssets: ['AAPL'], timestamp: base + 10_000_000 }),
    makeEvent({ id: 'other', affectedAssets: ['TSLA'], timestamp: base + 1500 }),
  ]

  it('links direct + macro-proxy, drops out-of-range/unrelated, and gates model-inferred', () => {
    const markers = buildEventOverlay({ events, assetSymbol: 'AAPL', from: base, to: base + 5000 })
    const ids = markers.map((m) => m.eventId)
    expect(ids).toContain('direct')
    expect(ids).toContain('macro')
    expect(ids).not.toContain('out')
    expect(ids).not.toContain('other')
    expect(ids).not.toContain('inferred') // gated off by default
    expect(markers.find((m) => m.eventId === 'macro')?.linkType).toBe('macro-proxy')
  })

  it('includes model-inferred only when explicitly enabled', () => {
    const markers = buildEventOverlay({ events, assetSymbol: 'AAPL', from: base, to: base + 5000, allowModelInferred: true })
    expect(markers.map((m) => m.eventId)).toContain('inferred')
  })
})
