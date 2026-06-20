import type {
  MicrostructureBookUpdate,
  MicrostructureDataMode,
  MicrostructureHealth,
  MicrostructureShockEvent,
  MicrostructureSignal,
} from '../../src/microstructure'

type ScreenerOptions = {
  capacity?: number
  zScoreThreshold?: number
  minSamplesForShock?: number
  maxSignals?: number
}

const defaultCapacity = 10_000
const defaultThreshold = 2.5
const defaultMinSamples = 20

export class StreamingScreener {
  private readonly capacity: number
  private readonly zScoreThreshold: number
  private readonly minSamplesForShock: number
  private readonly maxSignals: number
  private readonly states = new Map<string, SymbolMicrostructureRing>()
  private readonly pendingShocks: MicrostructureShockEvent[] = []
  private updateCount = 0
  private droppedUpdates = 0
  private shockCount = 0

  constructor(options: ScreenerOptions = {}) {
    this.capacity = Math.max(128, Math.floor(options.capacity ?? defaultCapacity))
    this.zScoreThreshold = options.zScoreThreshold ?? defaultThreshold
    this.minSamplesForShock = Math.max(3, Math.floor(options.minSamplesForShock ?? defaultMinSamples))
    this.maxSignals = Math.max(1, Math.floor(options.maxSignals ?? 8))
  }

  ingestMany(updates: MicrostructureBookUpdate[]): void {
    for (const update of updates) {
      this.ingest(update)
    }
  }

  ingest(update: MicrostructureBookUpdate): void {
    if (!isUsableBookUpdate(update)) {
      this.droppedUpdates += 1
      return
    }
    const state = this.getState(update.symbol)
    const result = state.push(update)
    this.updateCount += 1
    if (result.shock && Math.abs(result.signal.ofiZScore) >= this.zScoreThreshold) {
      this.shockCount += 1
      this.pendingShocks.push(result.signal)
    }
  }

  snapshot(): MicrostructureHealth {
    const topSignals = [...this.states.values()]
      .map((state) => state.signal())
      .filter((signal): signal is MicrostructureSignal => signal !== null)
      .sort((left, right) => Math.abs(right.ofiZScore) - Math.abs(left.ofiZScore))
      .slice(0, this.maxSignals)
    const latencies = topSignals
      .map((signal) => signal.latencyMicros)
      .filter((value): value is number => value !== null)
    return {
      enabled: true,
      bufferCapacity: this.capacity,
      trackedSymbols: this.states.size,
      updateCount: this.updateCount,
      droppedUpdates: this.droppedUpdates,
      shockCount: this.shockCount,
      zScoreThreshold: this.zScoreThreshold,
      dataMode: topSignals[0]?.dataMode ?? 'MICROSTRUCTURE_UNAVAILABLE',
      latencyMicrosAvg: latencies.length > 0 ? round(mean(latencies)) : null,
      jitterMicros: latencies.length > 1 ? round(stddev(latencies) ?? 0) : null,
      topSignals,
      note:
        'Microstructure context only. TRUE_L2_ORDER_BOOK is required for OBI/OFI; public trade ticks are labeled PROXY_TRADE_FLOW_PRESSURE.',
    }
  }

  drainShocks(): MicrostructureShockEvent[] {
    return this.pendingShocks.splice(0, this.pendingShocks.length)
  }

  private getState(symbol: string): SymbolMicrostructureRing {
    const key = symbol.toUpperCase()
    let state = this.states.get(key)
    if (!state) {
      state = new SymbolMicrostructureRing(key, this.capacity, this.minSamplesForShock, this.zScoreThreshold)
      this.states.set(key, state)
    }
    return state
  }
}

type PushResult = {
  signal: MicrostructureSignal
  shock: boolean
}

class SymbolMicrostructureRing {
  private readonly symbol: string
  private readonly capacity: number
  private readonly minSamplesForShock: number
  private readonly zScoreThreshold: number
  private readonly timestamps: Float64Array
  private readonly bidPrices: Float64Array
  private readonly askPrices: Float64Array
  private readonly bidVolumes: Float64Array
  private readonly askVolumes: Float64Array
  private readonly obiValues: Float64Array
  private readonly ofiValues: Float64Array
  private readonly latencyMicros: Float64Array
  private readonly validLatency: Uint8Array
  private index = 0
  private count = 0
  private previousBidVolume = 0
  private previousAskVolume = 0
  private lastSignal: MicrostructureSignal | null = null

  constructor(symbol: string, capacity: number, minSamplesForShock: number, zScoreThreshold: number) {
    this.symbol = symbol
    this.capacity = capacity
    this.minSamplesForShock = minSamplesForShock
    this.zScoreThreshold = zScoreThreshold
    this.timestamps = new Float64Array(capacity)
    this.bidPrices = new Float64Array(capacity)
    this.askPrices = new Float64Array(capacity)
    this.bidVolumes = new Float64Array(capacity)
    this.askVolumes = new Float64Array(capacity)
    this.obiValues = new Float64Array(capacity)
    this.ofiValues = new Float64Array(capacity)
    this.latencyMicros = new Float64Array(capacity)
    this.validLatency = new Uint8Array(capacity)
  }

  push(update: MicrostructureBookUpdate): PushResult {
    const totalVolume = update.bidVolume + update.askVolume
    const obi = totalVolume > 0 ? (update.bidVolume - update.askVolume) / totalVolume : 0
    const previousTotal = Math.max(1, this.previousBidVolume + this.previousAskVolume)
    const ofi =
      this.count === 0
        ? 0
        : (update.bidVolume - this.previousBidVolume - (update.askVolume - this.previousAskVolume)) / previousTotal
    const latency =
      update.packetReceivedAt && update.normalizedAt && update.normalizedAt >= update.packetReceivedAt
        ? (update.normalizedAt - update.packetReceivedAt) * 1000
        : Number.NaN
    const writeIndex = this.index
    this.timestamps[writeIndex] = update.timestamp
    this.bidPrices[writeIndex] = update.bidPrice
    this.askPrices[writeIndex] = update.askPrice
    this.bidVolumes[writeIndex] = update.bidVolume
    this.askVolumes[writeIndex] = update.askVolume
    this.obiValues[writeIndex] = obi
    this.ofiValues[writeIndex] = ofi
    if (Number.isFinite(latency)) {
      this.latencyMicros[writeIndex] = latency
      this.validLatency[writeIndex] = 1
    } else {
      this.latencyMicros[writeIndex] = 0
      this.validLatency[writeIndex] = 0
    }
    this.index = (this.index + 1) % this.capacity
    this.count = Math.min(this.capacity, this.count + 1)
    this.previousBidVolume = update.bidVolume
    this.previousAskVolume = update.askVolume

    const ofiZScore = this.zScoreFor(ofi)
    const spreadBps = update.bidPrice > 0 ? ((update.askPrice - update.bidPrice) / update.bidPrice) * 10_000 : 0
    const shock = this.count >= this.minSamplesForShock && Math.abs(ofiZScore) >= this.zScoreThreshold
    const severity = Math.abs(ofiZScore) >= this.zScoreThreshold + 1.5 ? 'high' : shock ? 'elevated' : 'watch'
    const signal: MicrostructureSignal = {
      id: `microstructure:${this.symbol}:${update.timestamp}`,
      symbol: this.symbol,
      observedAt: update.timestamp,
      obi: round(obi, 4),
      ofi: round(ofi, 4),
      ofiZScore: round(ofiZScore, 3),
      spreadBps: round(spreadBps, 2),
      severity,
      source: update.source,
      provenance: update.provenance,
      dataMode: update.dataMode,
      explanation: explainMicrostructureSignal(this.symbol, update.dataMode, ofiZScore, this.zScoreThreshold, shock),
      updateCount: this.count,
      bidVolume: round(update.bidVolume, 4),
      askVolume: round(update.askVolume, 4),
      latencyMicros: this.latestLatency(),
      jitterMicros: this.jitterMicros(),
    }
    this.lastSignal = signal
    return { signal, shock }
  }

  signal(): MicrostructureSignal | null {
    return this.lastSignal
  }

  private zScoreFor(latest: number): number {
    if (this.count < 3) {
      return 0
    }
    const values = this.values(this.ofiValues)
    const prior = values.slice(0, -1)
    const avg = mean(prior)
    const sd = stddev(prior)
    if (sd === null || sd === 0) {
      return 0
    }
    return (latest - avg) / sd
  }

  private latestLatency(): number | null {
    const latestIndex = (this.index - 1 + this.capacity) % this.capacity
    return this.validLatency[latestIndex] ? round(this.latencyMicros[latestIndex]) : null
  }

  private jitterMicros(): number | null {
    const latencies: number[] = []
    for (let offset = 0; offset < this.count; offset += 1) {
      const index = (this.index - this.count + offset + this.capacity) % this.capacity
      if (this.validLatency[index]) {
        latencies.push(this.latencyMicros[index])
      }
    }
    return latencies.length > 1 ? round(stddev(latencies) ?? 0) : null
  }

  private values(array: Float64Array): number[] {
    const values: number[] = []
    for (let offset = 0; offset < this.count; offset += 1) {
      const index = (this.index - this.count + offset + this.capacity) % this.capacity
      values.push(array[index])
    }
    return values
  }
}

function isUsableBookUpdate(update: MicrostructureBookUpdate): boolean {
  return (
    typeof update.symbol === 'string' &&
    update.symbol.trim() !== '' &&
    Number.isFinite(update.bidPrice) &&
    Number.isFinite(update.askPrice) &&
    Number.isFinite(update.bidVolume) &&
    Number.isFinite(update.askVolume) &&
    Number.isFinite(update.timestamp) &&
    isMicrostructureDataMode(update.dataMode) &&
    update.bidPrice > 0 &&
    update.askPrice >= update.bidPrice &&
    update.bidVolume >= 0 &&
    update.askVolume >= 0
  )
}

function explainMicrostructureSignal(
  symbol: string,
  dataMode: MicrostructureDataMode,
  flowZScore: number,
  zScoreThreshold: number,
  shock: boolean,
): string {
  const rounded = round(flowZScore, 2)
  if (dataMode === 'TRUE_L2_ORDER_BOOK') {
    return shock
      ? `${symbol} L2 OFI z-score ${rounded} crossed ${zScoreThreshold}σ; public unauthenticated book-depth context.`
      : `${symbol} L2 OBI/OFI remains below stress threshold.`
  }
  if (dataMode === 'TOP_OF_BOOK_ONLY') {
    return shock
      ? `${symbol} top-of-book liquidity stress z-score ${rounded} crossed ${zScoreThreshold}σ; quote-only context.`
      : `${symbol} top-of-book liquidity stress remains below threshold.`
  }
  if (dataMode === 'PROXY_TRADE_FLOW_PRESSURE') {
    return shock
      ? `${symbol} proxy trade-flow pressure z-score ${rounded} crossed ${zScoreThreshold}σ; not verified order-book imbalance.`
      : `${symbol} proxy trade-flow pressure remains below threshold; no verified book-depth signal.`
  }
  return `${symbol} microstructure context unavailable.`
}

function isMicrostructureDataMode(value: unknown): value is MicrostructureDataMode {
  return (
    value === 'TRUE_L2_ORDER_BOOK' ||
    value === 'TOP_OF_BOOK_ONLY' ||
    value === 'PROXY_TRADE_FLOW_PRESSURE' ||
    value === 'MICROSTRUCTURE_UNAVAILABLE'
  )
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
}

function stddev(values: number[]): number | null {
  if (values.length < 2) {
    return null
  }
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
