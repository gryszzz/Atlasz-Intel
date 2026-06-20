import { describe, expect, it } from 'vitest'
import { StreamingScreener } from '../electron/microstructure/streamingScreener'
import type { MicrostructureBookUpdate } from '../src/microstructure'

function update(partial: Partial<MicrostructureBookUpdate> = {}): MicrostructureBookUpdate {
  return {
    symbol: 'BTC',
    bidPrice: 100,
    askPrice: 100.1,
    bidVolume: 100,
    askVolume: 100,
    timestamp: 1_700_000_000_000,
    source: 'test-book',
    provenance: 'local-computed',
    dataMode: 'PROXY_TRADE_FLOW_PRESSURE',
    packetReceivedAt: 1_700_000_000_000,
    normalizedAt: 1_700_000_000_001,
    ...partial,
  }
}

describe('streaming microstructure screener', () => {
  it('computes proxy pressure and latency telemetry', () => {
    const screener = new StreamingScreener({ capacity: 128, minSamplesForShock: 3 })
    screener.ingest(update({ bidVolume: 150, askVolume: 50 }))

    const signal = screener.snapshot().topSignals[0]
    expect(signal.obi).toBe(0.5)
    expect(signal.spreadBps).toBeCloseTo(10, 1)
    expect(signal.latencyMicros).toBe(1000)
    expect(signal.dataMode).toBe('PROXY_TRADE_FLOW_PRESSURE')
  })

  it('emits a proxy stress shock when flow z-score crosses threshold', () => {
    const screener = new StreamingScreener({ capacity: 128, zScoreThreshold: 2.5, minSamplesForShock: 8 })
    for (let index = 0; index < 12; index += 1) {
      screener.ingest(update({ timestamp: 1_700_000_000_000 + index, bidVolume: 100 + (index % 2), askVolume: 100 }))
    }
    screener.ingest(update({ timestamp: 1_700_000_000_050, bidVolume: 260, askVolume: 40 }))

    const shocks = screener.drainShocks()
    expect(shocks.length).toBeGreaterThan(0)
    expect(shocks[0].symbol).toBe('BTC')
    expect(Math.abs(shocks[0].ofiZScore)).toBeGreaterThanOrEqual(2.5)
    expect(shocks[0].explanation).toContain('proxy trade-flow pressure')
    expect(shocks[0].explanation).toContain('not verified order-book imbalance')
    expect(screener.snapshot().shockCount).toBeGreaterThan(0)
  })

  it('labels true L2 data separately from proxy pressure', () => {
    const screener = new StreamingScreener({ capacity: 128, zScoreThreshold: 2.5, minSamplesForShock: 8 })
    for (let index = 0; index < 12; index += 1) {
      screener.ingest(update({ timestamp: 1_700_000_000_000 + index, bidVolume: 100 + (index % 2), askVolume: 100, dataMode: 'TRUE_L2_ORDER_BOOK' }))
    }
    screener.ingest(update({ timestamp: 1_700_000_000_050, bidVolume: 260, askVolume: 40, dataMode: 'TRUE_L2_ORDER_BOOK' }))

    const shock = screener.drainShocks()[0]
    expect(shock.dataMode).toBe('TRUE_L2_ORDER_BOOK')
    expect(shock.explanation).toContain('L2 OFI')
    expect(screener.snapshot().dataMode).toBe('TRUE_L2_ORDER_BOOK')
  })

  it('drops malformed updates without crashing or persisting raw book state', () => {
    const screener = new StreamingScreener({ capacity: 128 })
    screener.ingest(update({ bidPrice: 0 }))
    screener.ingest(update({ askPrice: 99 }))

    const health = screener.snapshot()
    expect(health.updateCount).toBe(0)
    expect(health.droppedUpdates).toBe(2)
    expect(health.topSignals).toHaveLength(0)
  })
})
