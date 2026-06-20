import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { LiquidityTickSampler } from '../electron/liquiditySampler'
import { createPersistence } from '../electron/persistence'
import { QuantComputeService } from '../electron/quant/quantComputeService'
import type { LiveTick } from '../src/realtime'

const tempDirs: string[] = []

function tempDataDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'atlasz-liquidity-'))
  tempDirs.push(dir)
  return dir
}

function tick(symbol: string, index: number): LiveTick {
  return {
    symbol,
    price: 100 + index,
    volume: 10 + index,
    timestamp: 1_700_000_000_000 + index * 1_000,
    source: 'simulated',
  }
}

describe('liquidity persistence fuel', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('turns sampled firehose ticks into market_ticks_daily bars for quant snapshots', () => {
    const persistence = createPersistence(tempDataDir())
    const sampler = new LiquidityTickSampler({ sampleMs: 1_000, maxPerBatch: 96 })

    for (let index = 0; index < 12; index += 1) {
      for (const selected of sampler.select([tick('BTC', index)], 1_700_000_000_000 + index * 1_000)) {
        persistence.saveMarketTick({
          id: `tick:${selected.symbol}:${selected.timestamp}`,
          symbol: selected.symbol,
          price: selected.price,
          volume: selected.volume,
          source: selected.source,
          observedAt: selected.timestamp,
          tradeDate: new Date(selected.timestamp).toISOString().slice(0, 10),
        })
      }
    }

    const rows = persistence.listMarketTicks('BTC', 20)
    const snapshot = new QuantComputeService(persistence).computeAssetSnapshot('BTC', {
      now: 1_700_000_020_000,
    })

    expect(rows).toHaveLength(12)
    expect(snapshot.dataAvailable).toBe(true)
    expect(snapshot.bars).toHaveLength(12)
    persistence.close()
  })
})
