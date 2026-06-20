import { describe, expect, it } from 'vitest'
import { LiquidityTickSampler } from '../electron/liquiditySampler'
import type { LiveTick } from '../src/realtime'

function tick(symbol: string, timestamp = 1_700_000_000_000): LiveTick {
  return {
    symbol,
    price: 100,
    volume: 10,
    timestamp,
    source: 'simulated',
  }
}

describe('liquidity tick sampler', () => {
  it('samples one tick per symbol instead of starving late watchlist assets', () => {
    const sampler = new LiquidityTickSampler({ sampleMs: 1_000, maxPerBatch: 96 })
    const symbols = Array.from({ length: 40 }, (_, index) => `T${index}`)

    const selected = sampler.select(symbols.map((symbol) => tick(symbol)), 1_700_000_001_000)

    expect(selected).toHaveLength(40)
    expect(selected.at(-1)?.symbol).toBe('T39')
  })

  it('respects per-symbol sample interval and batch caps', () => {
    const sampler = new LiquidityTickSampler({ sampleMs: 1_000, maxPerBatch: 2 })

    expect(sampler.select([tick('BTC'), tick('ETH'), tick('KAS')], 1_700_000_001_000).map((item) => item.symbol)).toEqual([
      'BTC',
      'ETH',
    ])
    expect(sampler.select([tick('BTC'), tick('ETH'), tick('KAS')], 1_700_000_001_500).map((item) => item.symbol)).toEqual([
      'KAS',
    ])
    expect(sampler.select([tick('BTC'), tick('ETH'), tick('KAS')], 1_700_000_002_100).map((item) => item.symbol)).toEqual([
      'BTC',
      'ETH',
    ])
  })

  it('fails closed on malformed ticks', () => {
    const sampler = new LiquidityTickSampler()
    const selected = sampler.select([
      tick('BTC'),
      { ...tick('BAD'), price: 0 },
      { ...tick('NOPE'), volume: -1 },
      { ...tick(''), symbol: '' },
    ])

    expect(selected.map((item) => item.symbol)).toEqual(['BTC'])
  })
})
