/**
 * RealTimeDataEngine — local-first ingestion core for Atlasz Intel.
 *
 * Pipeline:
 *   feed (public connector | explicit dev simulator) --ingest--> back-buffer (pending ticks)
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
  LiveAttentionSnapshot,
  LiveAttentionTick,
  LiveAssetConfig,
  LiveAssetSnapshot,
  LiveDataFrame,
  LiveEngineSnapshot,
  LiveEngineStatus,
  LiveEntityEdge,
  RealtimeHealth,
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
  /** Targets tracked by the attention-pressure stream. Defaults to asset symbols. */
  attentionTargets?: string[]
  /** Optional starting prices for explicit dev/test simulator runs. Default 0/unavailable. */
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

type AttentionState = {
  target: string
  samples: RingBuffer<LiveAttentionTick>
  latestPressure: number
  latestMentionVelocity: number
  latestSentimentDivergenceIndex: number
  lastTimestamp: number
  sampleCount: number
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
  private readonly attention = new Map<string, AttentionState>()
  private readonly attentionOrder: string[] = []
  private readonly entityEdges: LiveEntityEdge[]
  private readonly bufferSize: number
  private readonly syncIntervalMs: number
  private readonly now: () => number

  /** Double back-buffer: producers append to `pending`; flush drains the other buffer. */
  private readonly backBufferA: LiveTick[] = []
  private readonly backBufferB: LiveTick[] = []
  private pending: LiveTick[] = this.backBufferA
  private readonly attentionBackBufferA: LiveAttentionTick[] = []
  private readonly attentionBackBufferB: LiveAttentionTick[] = []
  private pendingAttention: LiveAttentionTick[] = this.attentionBackBufferA
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
      const open = seedPrices[config.symbol] ?? 0
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

    const attentionTargets = options.attentionTargets ?? options.assets.map((asset) => asset.symbol)
    for (const target of attentionTargets) {
      this.ensureAttentionTarget(target)
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

  addAsset(config: LiveAssetConfig, seedPrice = 0): void {
    if (!config.symbol || this.assets.has(config.symbol)) {
      return
    }
    this.assets.set(config.symbol, {
      config,
      ticks: new RingBuffer<LiveTick>(this.bufferSize),
      sessionOpen: seedPrice,
      lastPrice: seedPrice,
      lastTimestamp: 0,
      tickCount: 0,
      previousMinuteVolume: 0,
      previousMinuteStamp: 0,
    })
    this.order.push(config.symbol)
    this.ensureAttentionTarget(config.symbol)
    this.emit()
  }

  /** Accept a social/attention tick into its own hot back-buffer. */
  ingestAttention(tick: LiveAttentionTick): void {
    if (!this.attention.has(tick.target)) {
      return
    }
    if (!Number.isFinite(tick.pressure) || !Number.isFinite(tick.mentionVelocity)) {
      return
    }
    this.pendingAttention.push({
      ...tick,
      pressure: clamp(tick.pressure, 0, 100),
      sentimentDivergenceIndex: clamp(tick.sentimentDivergenceIndex, -1, 1),
    })
  }

  registerFeed(feed: Feed): void {
    this.feeds.push(feed)
  }

  /** Start the flush loop and any registered feeds. The simulator is explicit dev/test only. */
  start(options: { simulate?: boolean; external?: boolean } = {}): void {
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

    const simulate = options.simulate === true
    if (simulate) {
      this.startSimulator()
      connectedFeeds.push('simulator')
    }

    this.status = {
      ...this.status,
      running: true,
      mode: simulate ? (this.feeds.length > 0 ? 'hybrid' : 'simulated') : 'live',
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

    const cancelRaf = animationCancel()
    if (this.rafHandle !== null && cancelRaf) {
      cancelRaf(this.rafHandle)
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

  setHealth(health: RealtimeHealth): void {
    const mode: LiveEngineStatus['mode'] = health.replay.active
      ? 'replay'
      : health.sourceTrust === 'simulated'
        ? 'simulated'
        : 'live'
    this.status = {
      ...this.status,
      mode,
      sqliteMode: health.sqliteMode,
      connectedFeeds: [health.activeConnectorId],
      reconnectingFeeds: health.ingestionStatus === 'reconnecting' ? [health.activeConnectorId] : [],
      health,
      error: health.ingestionStatus === 'failed' ? health.connectors.find((item) => item.id === health.activeConnectorId)?.lastError : undefined,
    }
    if (this.frontFrame) {
      this.frontFrame = {
        ...this.frontFrame,
        status: this.status,
      }
    }
    this.emit()
  }

  // ---- flush loop (double buffer swap) -----------------------------------

  private scheduleNextFlush(): void {
    if (!this.running) {
      return
    }
    const raf = animationFrame()
    if (raf) {
      this.rafHandle = raf(() => this.tick())
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
      if (this.pending.length > 0 || this.pendingAttention.length > 0) {
        this.flush(now)
      }
    }
    this.scheduleNextFlush()
  }

  /** Drain the back-buffer into history, rebuild the immutable front frame. */
  private flush(now: number): void {
    const batch = this.pending
    this.pending = batch === this.backBufferA ? this.backBufferB : this.backBufferA
    this.pending.length = 0
    const attentionBatch = this.pendingAttention
    this.pendingAttention =
      attentionBatch === this.attentionBackBufferA ? this.attentionBackBufferB : this.attentionBackBufferA
    this.pendingAttention.length = 0

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
    batch.length = 0

    for (const tick of attentionBatch) {
      const state = this.attention.get(tick.target)
      if (!state) {
        continue
      }
      state.samples.push(tick)
      state.latestPressure = tick.pressure
      state.latestMentionVelocity = tick.mentionVelocity
      state.latestSentimentDivergenceIndex = tick.sentimentDivergenceIndex
      state.lastTimestamp = tick.timestamp
      state.sampleCount += 1
    }
    attentionBatch.length = 0

    const snapshots: LiveAssetSnapshot[] = this.order.map((symbol) => {
      const state = this.assets.get(symbol) as AssetState
      return this.snapshotFor(state, now)
    })
    const attentionSnapshots: LiveAttentionSnapshot[] = this.attentionOrder.map((target) => {
      const state = this.attention.get(target) as AttentionState
      return {
        target: state.target,
        pressure: round(state.latestPressure, 2),
        mentionVelocity: round(state.latestMentionVelocity, 2),
        sentimentDivergenceIndex: round(state.latestSentimentDivergenceIndex, 3),
        sampleCount: state.sampleCount,
        lastUpdated: state.lastTimestamp,
        samples: state.samples.slice(120),
      }
    })

    this.sequence += 1
    this.frontFrame = {
      sequence: this.sequence,
      emittedAt: now,
      assets: snapshots,
      attention: attentionSnapshots,
      entityEdges: this.entityEdges,
      signals: [],
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

  private ensureAttentionTarget(target: string): void {
    if (this.attention.has(target)) {
      return
    }
    this.attention.set(target, {
      target,
      samples: new RingBuffer<LiveAttentionTick>(this.bufferSize),
      latestPressure: 0,
      latestMentionVelocity: 0,
      latestSentimentDivergenceIndex: 0,
      lastTimestamp: 0,
      sampleCount: 0,
    })
    this.attentionOrder.push(target)
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
        this.ingestAttention({
          target: symbol,
          pressure: round(clamp(38 + Math.abs(ret) * 12_000 + (attentionSpike - 1) * 5, 0, 100), 2),
          mentionVelocity: round(Math.max(0, attentionSpike - 0.8 + Math.abs(ret) * 1_000), 2),
          sentimentDivergenceIndex: round(clamp(ret * 280 + (Math.random() - 0.5) * 0.18, -1, 1), 3),
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
  return Date.now()
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function animationFrame(): ((callback: () => void) => number) | null {
  const candidate = (globalThis as { requestAnimationFrame?: (callback: () => void) => number }).requestAnimationFrame
  return typeof candidate === 'function' ? candidate.bind(globalThis) : null
}

function animationCancel(): ((handle: number) => void) | null {
  const candidate = (globalThis as { cancelAnimationFrame?: (handle: number) => void }).cancelAnimationFrame
  return typeof candidate === 'function' ? candidate.bind(globalThis) : null
}
