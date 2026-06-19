/**
 * RealTimeDataEngine — local-first ingestion core for Atlasz Intel.
 *
 * Pipeline:
 *   feed (simulator | public WebSocket) --ingest--> back-buffer (pending ticks)
 *     --100ms RAF flush--> per-asset ring buffers + metrics
 *       --immutable LiveDataFrame--> front buffer --> subscribers (UI)
 *
 * Design notes:
 *  - Double buffering: producers only ever touch the pending back-buffer; the
 *    UI only ever reads the published immutable front frame. They never share
 *    mutable state, so the UI cannot observe a torn/partial update.
 *  - Throttle: flushes are paced to `syncIntervalMs` (default 100ms) on a
 *    requestAnimationFrame loop, falling back to setTimeout off-DOM (tests).
 *  - Zero-copy history: each asset keeps a fixed RingBuffer (default 1000) so
 *    steady ingestion does not allocate or stutter.
 *
 * Implements the contract declared in ../realtime.ts.
 */
import type {
  LiveAssetConfig,
  LiveAssetSnapshot,
  LiveDataFrame,
  LiveEngineSnapshot,
  LiveEngineStatus,
  LiveEntityEdge,
  LiveTick,
  LiveTickMetrics,
} from '../realtime'
import { defaultLiveEngineStatus } from '../realtime'
import { RingBuffer } from './ringBuffer'

const ONE_MINUTE_MS = 60_000
const THIRTY_MINUTES_MS = 30 * ONE_MINUTE_MS

export type EngineListener = (snapshot: LiveEngineSnapshot) => void

export type RealTimeDataEngineOptions = {
  assets: LiveAssetConfig[]
  /** Per-asset ring buffer capacity. Default 1000. */
  bufferSize?: number
  /** UI sync cadence in milliseconds. Default 100. */
  syncIntervalMs?: number
  /** Static entity edges passed through on every frame. */
  entityEdges?: LiveEntityEdge[]
  /** Starting prices per symbol for the simulator. Default 100. */
  seedPrices?: Record<string, number>
  /** Reported persistence mode (set by the SQLite layer). */
  sqliteMode?: LiveEngineStatus['sqliteMode']
  /** Injectable clock (ms). Default performance.now-style monotonic wall clock. */
  now?: () => number
}

type AssetState = {
  config: LiveAssetConfig
  ticks: RingBuffer<LiveTick>
  sessionOpen: number
  lastPrice: number
  lastTimestamp: number
  tickCount: number
  /** Volume of the minute prior to the current one, for acceleration. */
  previousMinuteVolume: number
  previousMinuteStamp: number
}

/** A pluggable data source. Returns a stop function. */
export type Feed = {
  name: string
  start: (ingest: (tick: LiveTick) => void) => void
  stop: () => void
}

export class RealTimeDataEngine {
  private readonly assets = new Map<string, AssetState>()
  private readonly order: string[] = []
  private readonly listeners = new Set<EngineListener>()
  private readonly entityEdges: LiveEntityEdge[]
  private readonly bufferSize: number
  private readonly syncIntervalMs: number
  private readonly now: () => number

  /** Back-buffer: ticks accepted since the last flush. */
  private pending: LiveTick[] = []
  private frontFrame: LiveDataFrame | null = null
  private status: LiveEngineStatus
  private sequence = 0

  private running = false
  private lastSyncAt = 0
  private rafHandle: number | null = null
  private timerHandle: ReturnType<typeof setTimeout> | null = null
  private readonly feeds: Feed[] = []
  private simulatorTimer: ReturnType<typeof setInterval> | null = null

  constructor(options: RealTimeDataEngineOptions) {
    this.bufferSize = options.bufferSize ?? 1000
    this.syncIntervalMs = options.syncIntervalMs ?? 100
    this.entityEdges = options.entityEdges ?? []
    this.now = options.now ?? defaultClock
    this.status = {
      ...defaultLiveEngineStatus,
      sqliteMode: options.sqliteMode ?? 'unknown',
    }

    const seedPrices = options.seedPrices ?? {}
    for (const config of options.assets) {
      const open = seedPrices[config.symbol] ?? 100
      this.assets.set(config.symbol, {
        config,
        ticks: new RingBuffer<LiveTick>(this.bufferSize),
        sessionOpen: open,
        lastPrice: open,
        lastTimestamp: 0,
        tickCount: 0,
        previousMinuteVolume: 0,
        previousMinuteStamp: 0,
      })
      this.order.push(config.symbol)
    }
  }

  // ---- public API --------------------------------------------------------

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener)
    // Replay current state immediately so late subscribers are never blank.
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): LiveEngineSnapshot {
    return { frame: this.frontFrame, status: this.status }
  }

  /** Accept a tick into the back-buffer. Cheap; safe to call at high frequency. */
  ingest(tick: LiveTick): void {
    if (!this.assets.has(tick.symbol)) {
      return
    }
    if (!Number.isFinite(tick.price) || tick.price <= 0) {
      return
    }
    this.pending.push(tick)
  }

  registerFeed(feed: Feed): void {
    this.feeds.push(feed)
  }

  /** Start the flush loop and any registered feeds + the built-in simulator. */
  start(options: { simulate?: boolean } = {}): void {
    if (this.running) {
      return
    }
    this.running = true
    this.lastSyncAt = this.now()

    const connectedFeeds: string[] = []
    for (const feed of this.feeds) {
      feed.start((tick) => this.ingest(tick))
      connectedFeeds.push(feed.name)
    }

    const simulate = options.simulate ?? this.feeds.length === 0
    if (simulate) {
      this.startSimulator()
      connectedFeeds.push('simulator')
    }

    this.status = {
      ...this.status,
      running: true,
      mode: this.feeds.length > 0 ? (simulate ? 'hybrid' : 'live') : 'simulated',
      connectedFeeds,
      error: undefined,
    }

    this.scheduleNextFlush()
    this.emit()
  }

  stop(): void {
    if (!this.running) {
      return
    }
    this.running = false

    if (this.rafHandle !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafHandle)
    }
    this.rafHandle = null
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle)
      this.timerHandle = null
    }
    if (this.simulatorTimer !== null) {
      clearInterval(this.simulatorTimer)
      this.simulatorTimer = null
    }
    for (const feed of this.feeds) {
      feed.stop()
    }

    this.status = { ...this.status, running: false, mode: 'stopped', connectedFeeds: [] }
    this.emit()
  }

  setSqliteMode(mode: LiveEngineStatus['sqliteMode']): void {
    this.status = { ...this.status, sqliteMode: mode }
    this.emit()
  }

  // ---- flush loop (double buffer swap) -----------------------------------

  private scheduleNextFlush(): void {
    if (!this.running) {
      return
    }
    if (typeof requestAnimationFrame === 'function') {
      this.rafHandle = requestAnimationFrame(() => this.tick())
    } else {
      this.timerHandle = setTimeout(() => this.tick(), this.syncIntervalMs)
    }
  }

  private tick(): void {
    if (!this.running) {
      return
    }
    const now = this.now()
    if (now - this.lastSyncAt >= this.syncIntervalMs) {
      this.lastSyncAt = now
      if (this.pending.length > 0) {
        this.flush(now)
      }
    }
    this.scheduleNextFlush()
  }

  /** Drain the back-buffer into history, rebuild the immutable front frame. */
  private flush(now: number): void {
    const batch = this.pending
    this.pending = []

    for (const tick of batch) {
      const state = this.assets.get(tick.symbol)
      if (!state) {
        continue
      }
      state.ticks.push(tick)
      state.lastPrice = tick.price
      state.lastTimestamp = tick.timestamp
      state.tickCount += 1
    }

    const snapshots: LiveAssetSnapshot[] = this.order.map((symbol) => {
      const state = this.assets.get(symbol) as AssetState
      return this.snapshotFor(state, now)
    })

    this.sequence += 1
    this.frontFrame = {
      sequence: this.sequence,
      emittedAt: now,
      assets: snapshots,
      entityEdges: this.entityEdges,
      status: this.status,
    }
    this.emit()
  }

  private snapshotFor(state: AssetState, now: number): LiveAssetSnapshot {
    const metrics = this.computeMetrics(state, now)
    const changePct =
      state.sessionOpen > 0 ? ((state.lastPrice - state.sessionOpen) / state.sessionOpen) * 100 : 0

    return {
      symbol: state.config.symbol,
      label: state.config.label,
      kind: state.config.kind,
      source: state.config.source,
      price: round(state.lastPrice, 4),
      changePct: round(changePct, 3),
      volume: round(metrics.oneMinuteVolume, 2),
      tickCount: state.tickCount,
      lastUpdated: state.lastTimestamp,
      metrics,
      ticks: state.ticks.slice(120),
    }
  }

  private computeMetrics(state: AssetState, now: number): LiveTickMetrics {
    let oneMinuteVolume = 0
    let thirtyMinuteVolume = 0
    let prevPrice = NaN
    let returnSum = 0
    let returnSqSum = 0
    let returnCount = 0

    state.ticks.forEachReverseWhile((tick) => {
      const age = now - tick.timestamp
      if (age > THIRTY_MINUTES_MS) {
        return false
      }
      thirtyMinuteVolume += tick.volume
      if (age <= ONE_MINUTE_MS) {
        oneMinuteVolume += tick.volume
      }
      return true
    })

    // Log-return volatility over the last minute (oldest-first for correct sign).
    const recent = state.ticks.toArray()
    for (const tick of recent) {
      if (now - tick.timestamp > ONE_MINUTE_MS) {
        prevPrice = tick.price
        continue
      }
      if (Number.isFinite(prevPrice) && prevPrice > 0) {
        const ret = Math.log(tick.price / prevPrice)
        returnSum += ret
        returnSqSum += ret * ret
        returnCount += 1
      }
      prevPrice = tick.price
    }

    let volatilityVelocity = 0
    if (returnCount > 1) {
      const mean = returnSum / returnCount
      const variance = Math.max(0, returnSqSum / returnCount - mean * mean)
      // Annualization is meaningless for intraday demo data; scale to a
      // readable basis-point velocity instead.
      volatilityVelocity = round(Math.sqrt(variance) * 10_000, 2)
    }

    // Volume acceleration: change in the current minute's volume vs the prior
    // minute's, expressed as a ratio centered on zero.
    const minuteStamp = Math.floor(now / ONE_MINUTE_MS)
    if (state.previousMinuteStamp !== 0 && minuteStamp !== state.previousMinuteStamp) {
      state.previousMinuteVolume = oneMinuteVolume
      state.previousMinuteStamp = minuteStamp
    } else if (state.previousMinuteStamp === 0) {
      state.previousMinuteStamp = minuteStamp
      state.previousMinuteVolume = oneMinuteVolume
    }
    const baseline = state.previousMinuteVolume
    const volumeAcceleration = baseline > 0 ? round((oneMinuteVolume - baseline) / baseline, 3) : 0

    return {
      volatilityVelocity,
      volumeAcceleration,
      oneMinuteVolume: round(oneMinuteVolume, 2),
      thirtyMinuteAverageVolume: round(thirtyMinuteVolume / 30, 2),
    }
  }

  private emit(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  // ---- built-in offline simulator ----------------------------------------

  /**
   * Emits correlated random-walk ticks plus occasional attention spikes, so the
   * full pipeline can be exercised offline without any network dependency. The
   * shared market "shock" nudges every asset together to mimic cross-asset
   * correlation; per-asset noise keeps them from moving in lockstep.
   */
  private startSimulator(): void {
    if (this.simulatorTimer !== null) {
      return
    }
    const drift = new Map<string, number>()
    for (const symbol of this.order) {
      drift.set(symbol, 0)
    }

    this.simulatorTimer = setInterval(() => {
      const wall = Date.now()
      const marketShock = (Math.random() - 0.5) * 0.0009
      for (const symbol of this.order) {
        const state = this.assets.get(symbol)
        if (!state) {
          continue
        }
        const idiosyncratic = (Math.random() - 0.5) * 0.0022
        const momentum = (drift.get(symbol) ?? 0) * 0.6
        const ret = marketShock + idiosyncratic + momentum
        drift.set(symbol, ret)

        const nextPrice = Math.max(0.0001, state.lastPrice * (1 + ret))
        const attentionSpike = Math.random() < 0.06 ? 4 + Math.random() * 8 : 1
        const baseVolume = 20 + Math.random() * 60
        this.ingest({
          symbol,
          price: nextPrice,
          volume: round(baseVolume * attentionSpike, 2),
          timestamp: wall,
          source: 'simulator',
        })
      }
    }, Math.min(this.syncIntervalMs, 120))
  }
}

/**
 * Generic public-WebSocket feed adapter with exponential-backoff reconnect.
 * Guarded so it is inert where `WebSocket` is unavailable (Node/tests). The
 * `parse` callback maps a raw message to zero or more ticks, keeping this
 * adapter exchange-agnostic (Coinbase/Binance/Alpaca all fit).
 */
export function createWebSocketFeed(config: {
  name: string
  url: string
  subscribeMessage?: unknown
  parse: (data: unknown) => LiveTick[]
}): Feed {
  let socket: WebSocket | null = null
  let stopped = false
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect(ingest: (tick: LiveTick) => void) {
    if (stopped || typeof WebSocket === 'undefined') {
      return
    }
    socket = new WebSocket(config.url)
    socket.onopen = () => {
      attempt = 0
      if (config.subscribeMessage !== undefined && socket) {
        socket.send(JSON.stringify(config.subscribeMessage))
      }
    }
    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        for (const tick of config.parse(data)) {
          ingest(tick)
        }
      } catch {
        // Ignore malformed frames; a bad packet must never crash the engine.
      }
    }
    socket.onclose = () => {
      if (stopped) {
        return
      }
      attempt += 1
      const delay = Math.min(30_000, 500 * 2 ** attempt)
      reconnectTimer = setTimeout(() => connect(ingest), delay)
    }
    socket.onerror = () => {
      socket?.close()
    }
  }

  return {
    name: config.name,
    start(ingest) {
      stopped = false
      connect(ingest)
    },
    stop() {
      stopped = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
      socket = null
    },
  }
}

function defaultClock(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
