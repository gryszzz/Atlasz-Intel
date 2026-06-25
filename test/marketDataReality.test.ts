import { describe, expect, it } from 'vitest'
import {
  MARKET_DATA_SURFACES,
  marketDataRealityReport,
  marketSimEnabled,
} from '../src/engine/marketDataReality'
import { gateSeed, devTopSignals, devRadarEvents, devMarketMovers, devWatchlist } from '../src/devMarketData'

describe('market data reality pass', () => {
  it('never marks a simulated-dev surface as production-allowed', () => {
    for (const surface of MARKET_DATA_SURFACES) {
      if (surface.classification === 'simulated-dev-only') {
        expect(surface.productionAllowed).toBe(false)
      }
    }
  })

  it('every production-allowed price/chart surface declares full proof fields', () => {
    for (const surface of MARKET_DATA_SURFACES) {
      if (surface.productionAllowed && (surface.kind === 'price' || surface.kind === 'chart')) {
        for (const field of ['ticker', 'price', 'timestamp', 'source', 'retrievedAt', 'rawPayloadHash']) {
          expect(surface.proofFields).toContain(field)
        }
      }
    }
  })

  it('source-needed surfaces carry a reason and are never production-allowed', () => {
    const report = marketDataRealityReport()
    expect(report.sourceNeeded.length).toBeGreaterThan(0)
    for (const surface of report.sourceNeeded) {
      expect(surface.productionAllowed).toBe(false)
      expect(surface.missingReason && surface.missingReason.length).toBeTruthy()
    }
    const ids = new Set(report.sourceNeeded.map((s) => s.id))
    for (const id of ['forex', 'commodity-futures', 'short-interest', 'earnings-transcripts']) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('equities/ETFs are now key-gated (provider exists, key required), not source-needed', () => {
    const report = marketDataRealityReport()
    const keyGatedIds = new Set(report.keyGated.map((s) => s.id))
    expect(keyGatedIds.has('realtime-equities')).toBe(true)
    expect(keyGatedIds.has('etf-prices')).toBe(true)
    expect(keyGatedIds.has('options-oi')).toBe(true)
    const sourceNeededIds = new Set(report.sourceNeeded.map((s) => s.id))
    expect(sourceNeededIds.has('realtime-equities')).toBe(false)
    for (const surface of report.keyGated) {
      expect(surface.classification).toBe('key-gated')
      expect(surface.missingReason && surface.missingReason.length).toBeTruthy() // key required
    }
  })

  it('has zero production violations after enforcement (no seeded market data in prod)', () => {
    // After the enforcement refactor every seeded surface is gated; nothing
    // simulated renders in production.
    expect(marketDataRealityReport().productionViolations).toHaveLength(0)
    for (const surface of MARKET_DATA_SURFACES) {
      if (surface.classification === 'simulated-dev-only') {
        expect(surface.currentlyRenderedInProduction).toBe(false)
      }
    }
  })

  it('the dev simulator is off by default and impossible in a production build', () => {
    expect(marketSimEnabled({ prod: true, flag: '1' })).toBe(false) // never in prod
    expect(marketSimEnabled({ prod: false })).toBe(false) // off by default in dev
    expect(marketSimEnabled({ prod: false, flag: '0' })).toBe(false)
    expect(marketSimEnabled({ prod: false, flag: '1' })).toBe(true) // explicit dev opt-in only
  })

  it('gates seeded market data: empty unless the dev simulator is explicitly on', () => {
    const seed = [{ id: 'a' }, { id: 'b' }]
    expect(gateSeed(seed, false)).toEqual([])
    expect(gateSeed(seed, true)).toBe(seed)
    // In the test/production env the flag is off, so all seeded exports are empty.
    expect(devTopSignals).toEqual([])
    expect(devRadarEvents).toEqual([])
    expect(devMarketMovers).toEqual([])
    expect(devWatchlist).toEqual([])
  })

  it('real and key-gated surfaces declare proof fields', () => {
    const report = marketDataRealityReport()
    for (const surface of report.real) {
      expect(surface.classification).toBe('real-public')
      expect(surface.proofFields.length).toBeGreaterThan(0)
    }
    for (const surface of report.keyGated) {
      expect(surface.classification).toBe('key-gated')
      expect(surface.proofFields.length).toBeGreaterThan(0)
    }
  })
})
