import { describe, expect, it } from 'vitest'
import {
  MARKET_DATA_SURFACES,
  marketDataRealityReport,
  marketSimEnabled,
} from '../src/engine/marketDataReality'

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
    for (const id of ['realtime-equities', 'etf-prices', 'options-oi', 'forex', 'commodity-futures', 'short-interest', 'earnings-transcripts']) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('honestly reports simulated/seeded surfaces still rendered in production', () => {
    const report = marketDataRealityReport()
    // The audit must SURFACE these violations (seeded candles/signals/movers), not hide them.
    const violationIds = new Set(report.productionViolations.map((s) => s.id))
    expect(violationIds.has('seed-market-series')).toBe(true)
    expect(violationIds.has('seed-top-signals')).toBe(true)
    for (const surface of report.productionViolations) {
      expect(surface.classification).toBe('simulated-dev-only')
      expect(surface.productionAllowed).toBe(false)
    }
  })

  it('the dev simulator is off by default and impossible in a production build', () => {
    expect(marketSimEnabled({ prod: true, flag: '1' })).toBe(false) // never in prod
    expect(marketSimEnabled({ prod: false })).toBe(false) // off by default in dev
    expect(marketSimEnabled({ prod: false, flag: '0' })).toBe(false)
    expect(marketSimEnabled({ prod: false, flag: '1' })).toBe(true) // explicit dev opt-in only
  })

  it('real surfaces are public or key-gated with proof fields', () => {
    for (const surface of marketDataRealityReport().real) {
      expect(['real-public', 'key-gated']).toContain(surface.classification)
      expect(surface.proofFields.length).toBeGreaterThan(0)
    }
  })
})
