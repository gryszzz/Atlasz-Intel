import type { LiveTick } from '../src/realtime'

type LiquiditySamplerOptions = {
  sampleMs?: number
  maxPerBatch?: number
  now?: () => number
}

export type LiquiditySamplerSnapshot = {
  sampleMs: number
  maxPerBatch: number
  trackedSymbols: number
}

const defaultSampleMs = 1_000
const defaultMaxPerBatch = 96

export class LiquidityTickSampler {
  private readonly sampleMs: number
  private readonly maxPerBatch: number
  private readonly now: () => number
  private readonly lastAcceptedAtBySymbol = new Map<string, number>()

  constructor(options: LiquiditySamplerOptions = {}) {
    this.sampleMs = Math.max(100, Math.floor(options.sampleMs ?? defaultSampleMs))
    this.maxPerBatch = Math.max(1, Math.floor(options.maxPerBatch ?? defaultMaxPerBatch))
    this.now = options.now ?? (() => Date.now())
  }

  select(ticks: LiveTick[], now = this.now()): LiveTick[] {
    const selected: LiveTick[] = []
    const seenInBatch = new Set<string>()

    for (const tick of ticks) {
      if (selected.length >= this.maxPerBatch) {
        break
      }
      if (!isUsableTick(tick)) {
        continue
      }

      const symbol = tick.symbol.toUpperCase()
      if (seenInBatch.has(symbol)) {
        continue
      }
      const lastAcceptedAt = this.lastAcceptedAtBySymbol.get(symbol) ?? 0
      if (now - lastAcceptedAt < this.sampleMs) {
        continue
      }

      seenInBatch.add(symbol)
      selected.push(tick)
      this.lastAcceptedAtBySymbol.set(symbol, now)
    }

    return selected
  }

  snapshot(): LiquiditySamplerSnapshot {
    return {
      sampleMs: this.sampleMs,
      maxPerBatch: this.maxPerBatch,
      trackedSymbols: this.lastAcceptedAtBySymbol.size,
    }
  }
}

function isUsableTick(tick: LiveTick): boolean {
  return (
    typeof tick.symbol === 'string' &&
    tick.symbol.trim() !== '' &&
    Number.isFinite(tick.price) &&
    tick.price > 0 &&
    Number.isFinite(tick.volume) &&
    tick.volume >= 0 &&
    Number.isFinite(tick.timestamp)
  )
}
