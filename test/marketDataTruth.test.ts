import { describe, expect, it } from 'vitest'
import { resolveAssetQuery } from '../src/assetUniverse'
import { PRICE_UNAVAILABLE, freshnessForTimestamp, priceTruthFromAsset } from '../src/marketDataTruth'
import type { LiveAssetSnapshot } from '../src/realtime'

describe('market data truth and broad public mappings', () => {
  it('maps KAS quote variants to the same real public crypto identity without a hardcoded price', () => {
    for (const query of ['KAS', 'KASUSDT', 'KAS-USD', 'KAS/USD', 'KAS/USDT']) {
      const asset = resolveAssetQuery(query)

      expect(asset.symbol).toBe('KAS')
      expect(asset.source).toBe('coingecko')
      expect(asset.feedSymbol).toBe('kaspa')
      expect(asset.defaultPrice).toBe(0)
    }
  })

  it('maps broad exchange-like searches to public Yahoo chart symbols', () => {
    expect(resolveAssetQuery('NVDA')).toMatchObject({ symbol: 'NVDA', source: 'yahoo', feedSymbol: 'NVDA' })
    expect(resolveAssetQuery('SPX')).toMatchObject({ symbol: 'SPX', source: 'yahoo', feedSymbol: '^GSPC' })
    expect(resolveAssetQuery('EUR/USD')).toMatchObject({ symbol: 'EUR/USD', source: 'yahoo', feedSymbol: 'EURUSD=X' })
    expect(resolveAssetQuery('CL')).toMatchObject({ symbol: 'CL', source: 'yahoo', feedSymbol: 'CL=F' })
    expect(resolveAssetQuery('BRK-B')).toMatchObject({ symbol: 'BRK-B', source: 'yahoo', feedSymbol: 'BRK-B' })
    expect(resolveAssetQuery('XYZQ')).toMatchObject({ symbol: 'XYZQ', source: 'yahoo', feedSymbol: 'XYZQ' })
  })

  it('labels missing prices unavailable and classifies freshness by TTL', () => {
    expect(priceTruthFromAsset(null, 'KAS').label).toBe(PRICE_UNAVAILABLE)

    const now = 1_700_000_000_000
    const asset: LiveAssetSnapshot = {
      symbol: 'KAS',
      label: 'Kaspa',
      kind: 'crypto',
      source: 'coingecko',
      price: 0.12345,
      changePct: 0,
      volume: 1,
      tickCount: 1,
      lastUpdated: now - 20_000,
      metrics: {
        volatilityVelocity: 0,
        volumeAcceleration: 0,
        oneMinuteVolume: 1,
        thirtyMinuteAverageVolume: 1,
      },
      ticks: [],
    }

    expect(priceTruthFromAsset(asset, 'KAS', { now }).status).toBe('live')
    expect(freshnessForTimestamp(now - 5 * 60_000, { now })).toBe('delayed')
    expect(freshnessForTimestamp(now - 60 * 60_000, { now })).toBe('stale-cache')
    expect(freshnessForTimestamp(now - 48 * 60 * 60_000, { now })).toBe('offline-cache')
  })
})
