import electron from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import { buildDefaultAssetUniverse, buildSeedPrices, resolveAssetQuery } from '../src/assetUniverse'
import { RealTimeDataEngine } from '../src/engine/realtimeEngine'
import { detectRealtimeSignals } from '../src/engine/signalEngine'
import { graphEdges } from '../src/data/intel'
import { riskChainFor } from '../src/intelGraphData'
import type { ExposedAsset } from '../src/engine/intelGraph'
import { LiquidityTickSampler } from './liquiditySampler'
import type {
  ConnectorId,
  LiveAttentionTick,
  LiveDataFrame,
  LiveEngineSnapshot,
  LiveEngineStatus,
  LiveEntityEdge,
  LiveSignalEvent,
  LiveTick,
  RealtimeHealth,
  ReplayState,
} from '../src/realtime'
import type {
  IntelPersistence,
  RealtimeFrameRecord,
  SourceAuditEventType,
  SourceAuditRecord,
} from './persistence'

const { BrowserWindow } = electron
const __dirname = dirname(fileURLToPath(import.meta.url))

type RealtimeServiceOptions = {
  persistence: IntelPersistence
}

type WorkerAuditEvent = {
  id: string
  eventType: SourceAuditEventType
  connectorId?: string
  severity: 'info' | 'watch' | 'error'
  message: string
  createdAt: number
  metadata?: Record<string, unknown>
}

type WorkerBatchMessage = {
  type: 'batch'
  ticks: LiveTick[]
  attention: LiveAttentionTick[]
  health: RealtimeHealth
  audits: WorkerAuditEvent[]
}

type WorkerHealthMessage = {
  type: 'health' | 'status'
  health: RealtimeHealth
}

type WorkerMessage = WorkerBatchMessage | WorkerHealthMessage

type ReplayOptions = {
  from?: number
  to?: number
  speed?: ReplayState['speed']
}

const replayWindowMs = 5 * 60_000

const entityEdges: LiveEntityEdge[] = graphEdges.map((edge) => ({
  id: edge.id,
  headlineId: `seed:${edge.source}`,
  source: edge.source,
  target: edge.target,
  relation: edge.label,
  confidence: edge.strength,
  createdAt: Date.now(),
}))

export class RealtimeService {
  private readonly engine: RealTimeDataEngine
  private readonly persistence: IntelPersistence
  private readonly enablePublicWs = process.env.ATLASZ_ENABLE_PUBLIC_WS === '1'
  private readonly defaultConnectorId: ConnectorId =
    (process.env.ATLASZ_CONNECTOR as ConnectorId | undefined) ??
    (process.env.ATLASZ_ENABLE_PUBLIC_WS === '1' ? 'coincap_public_ws' : 'simulated')
  private readonly seenSignalIds = new Set<string>()
  private readonly universe = buildDefaultAssetUniverse(this.enablePublicWs)
  private readonly seedPrices = buildSeedPrices(this.universe)
  private readonly knownSymbols = new Set(this.universe.map((asset) => asset.symbol))
  private worker: Worker | null = null
  private unsubscribe: (() => void) | null = null
  private healthState: RealtimeHealth
  private previousLiveFrame: LiveDataFrame | null = null
  private latestLiveSnapshot: LiveEngineSnapshot = {
    frame: null,
    status: {
      running: false,
      mode: 'stopped',
      sqliteMode: 'unknown',
      connectedFeeds: [],
      reconnectingFeeds: [],
    },
  }
  private readonly liquiditySampler = new LiquidityTickSampler({
    sampleMs: integerEnv('ATLASZ_MARKET_TICK_SAMPLE_MS', 1_000),
    maxPerBatch: integerEnv('ATLASZ_MARKET_TICK_MAX_PER_BATCH', 96),
  })
  private readonly persistedMarketSymbols = new Set<string>()
  private persistedMarketTickCount = 0
  private lastMarketPersistAt: number | undefined
  private lastAttentionPersistAt = 0
  private lastFramePersistAt = 0
  private lastFrameAuditAt = 0
  private replayFrames: RealtimeFrameRecord[] = []
  private replayIndex = 0
  private replayTimer: ReturnType<typeof setTimeout> | null = null
  private replaySnapshot: LiveEngineSnapshot | null = null
  private replayState: ReplayState = {
    active: false,
    playing: false,
    speed: 1,
    frameCount: 0,
  }

  constructor(options: RealtimeServiceOptions) {
    this.persistence = options.persistence
    this.healthState = defaultHealth(this.defaultConnectorId, this.persistence.mode)
    this.engine = new RealTimeDataEngine({
      assets: this.universe,
      seedPrices: this.seedPrices,
      syncIntervalMs: 100,
      bufferSize: 1000,
      entityEdges,
      attentionTargets: [...new Set([...this.universe.map((market) => market.symbol), 'AIXR', 'LIT'])],
      sqliteMode: this.persistence.mode,
      now: () => Date.now(),
    })
    for (const edge of entityEdges) {
      this.safePersist(() =>
        this.persistence.saveEntityEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
          confidence: edge.confidence,
          createdAt: edge.createdAt,
        }),
      )
    }
  }

  start(): LiveEngineSnapshot {
    this.ensureBroadcast()
    this.ensureEngine()
    this.startWorker(this.defaultConnectorId)
    return this.snapshot()
  }

  stop(): LiveEngineSnapshot {
    this.stopReplay()
    this.worker?.postMessage({ type: 'stop' })
    this.engine.stop()
    this.healthState = {
      ...this.health(),
      ingestionStatus: 'stopped',
      workerStatus: 'stopped',
      replay: this.replayState,
    }
    this.engine.setHealth(this.healthState)
    return this.snapshot()
  }

  restart(connectorId?: ConnectorId): LiveEngineSnapshot {
    this.stopReplay()
    this.ensureEngine()
    if (!this.worker) {
      this.startWorker(connectorId ?? this.defaultConnectorId)
    } else {
      this.worker.postMessage({ type: 'restart', connectorId: connectorId ?? this.defaultConnectorId })
    }
    return this.snapshot()
  }

  snapshot(): LiveEngineSnapshot {
    if (this.replayState.active && this.replaySnapshot) {
      return this.replaySnapshot
    }
    return this.latestLiveSnapshot.frame ? this.latestLiveSnapshot : this.engine.getSnapshot()
  }

  status(): LiveEngineStatus {
    return this.snapshot().status
  }

  health(): RealtimeHealth {
    return {
      ...this.healthState,
      sqliteMode: this.persistence.mode,
      replay: this.replayState,
      liquidityHistory: this.liquidityHistoryHealth(),
    }
  }

  addAsset(query: string): LiveEngineSnapshot {
    const item = resolveAssetQuery(query, { enablePublicCrypto: this.enablePublicWs })
    this.engine.addAsset(item, item.defaultPrice)
    this.seedPrices[item.symbol] = item.defaultPrice
    this.knownSymbols.add(item.symbol)
    this.worker?.postMessage({ type: 'addAsset', asset: item, seedPrice: item.defaultPrice })
    this.audit('connector_started', 'info', `Watchlist asset ${item.symbol} added`, {
      symbol: item.symbol,
      kind: item.kind,
      source: item.source,
      query,
    })
    return this.snapshot()
  }

  ingestExternalBatch(ticks: LiveTick[], attention: LiveAttentionTick[]): void {
    this.ensureEngine()
    for (const tick of ticks) {
      this.ensureAsset(tick.symbol)
      this.engine.ingest(tick)
    }
    for (const item of attention) {
      this.ensureAsset(item.target)
      this.engine.ingestAttention(item)
    }
    this.persistSampledBatch(ticks, attention)
  }

  setSqliteMode(mode: LiveEngineStatus['sqliteMode']): void {
    this.engine.setSqliteMode(mode)
    this.healthState = { ...this.healthState, sqliteMode: mode }
    this.engine.setHealth(this.health())
  }

  traverseRisk(nodeId: string): ExposedAsset[] {
    const result = riskChainFor(nodeId)
    this.audit('graph_traversal_triggered', 'info', `Graph traversal triggered from ${nodeId}`, {
      nodeId,
      exposedAssets: result.map((asset) => asset.node.symbol ?? asset.node.label),
    })
    return result
  }

  replayStart(options: ReplayOptions = {}): LiveEngineSnapshot {
    const to = options.to ?? Date.now()
    const from = options.from ?? to - replayWindowMs
    const speed = options.speed ?? this.replayState.speed
    this.replayFrames = this.persistence.listRealtimeFrames(from, to, 3_000)
    this.replayIndex = 0
    this.replayState = {
      active: true,
      playing: this.replayFrames.length > 0,
      speed,
      windowStart: from,
      windowEnd: to,
      cursor: this.replayFrames[0]?.emittedAt ?? from,
      frameCount: this.replayFrames.length,
    }
    this.engine.setHealth(this.health())
    this.publishReplayFrame()
    this.scheduleReplay()
    return this.snapshot()
  }

  replayPause(): LiveEngineSnapshot {
    this.replayState = { ...this.replayState, playing: false }
    this.clearReplayTimer()
    this.engine.setHealth(this.health())
    this.publishReplayFrame()
    return this.snapshot()
  }

  replayResume(): LiveEngineSnapshot {
    if (!this.replayState.active) {
      return this.replayStart()
    }
    this.replayState = { ...this.replayState, playing: this.replayFrames.length > 0 }
    this.engine.setHealth(this.health())
    this.publishReplayFrame()
    this.scheduleReplay()
    return this.snapshot()
  }

  replaySetSpeed(speed: ReplayState['speed']): LiveEngineSnapshot {
    this.replayState = { ...this.replayState, speed }
    this.engine.setHealth(this.health())
    this.scheduleReplay()
    return this.snapshot()
  }

  replaySeek(cursor: number): LiveEngineSnapshot {
    if (!this.replayState.active || this.replayFrames.length === 0) {
      return this.snapshot()
    }
    const nextIndex = this.replayFrames.findIndex((record) => record.emittedAt >= cursor)
    this.replayIndex = nextIndex === -1 ? this.replayFrames.length - 1 : Math.max(0, nextIndex)
    this.replayState = {
      ...this.replayState,
      cursor: this.replayFrames[this.replayIndex]?.emittedAt ?? cursor,
    }
    this.publishReplayFrame()
    this.scheduleReplay()
    return this.snapshot()
  }

  replayStop(): LiveEngineSnapshot {
    this.stopReplay()
    this.engine.setHealth(this.health())
    this.broadcast(this.latestLiveSnapshot)
    return this.snapshot()
  }

  close(): void {
    this.stopReplay()
    this.unsubscribe?.()
    this.unsubscribe = null
    this.worker?.postMessage({ type: 'stop' })
    this.worker?.terminate().catch(() => undefined)
    this.worker = null
    this.engine.stop()
  }

  private ensureEngine(): void {
    if (!this.engine.getSnapshot().status.running) {
      this.engine.start({ simulate: false, external: true })
      this.engine.setHealth(this.health())
    }
  }

  private ensureAsset(symbol: string): void {
    if (!symbol || this.knownSymbols.has(symbol)) {
      return
    }
    const item = resolveAssetQuery(symbol, { enablePublicCrypto: this.enablePublicWs })
    this.engine.addAsset(item, item.defaultPrice)
    this.seedPrices[item.symbol] = item.defaultPrice
    this.knownSymbols.add(item.symbol)
    this.worker?.postMessage({ type: 'addAsset', asset: item, seedPrice: item.defaultPrice })
  }

  private startWorker(connectorId: ConnectorId): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'start', connectorId })
      return
    }

    this.healthState = {
      ...this.health(),
      activeConnectorId: connectorId,
      ingestionStatus: 'connecting',
      workerStatus: 'starting',
    }
    this.engine.setHealth(this.healthState)

    const worker = new Worker(join(__dirname, 'marketIngestionWorker.js'), {
      workerData: {
        assets: this.universe,
        seedPrices: this.seedPrices,
        attentionTargets: [...new Set([...this.universe.map((market) => market.symbol), 'AIXR', 'LIT'])],
        enablePublicWs: this.enablePublicWs,
        connectorId,
        sqliteMode: this.persistence.mode,
        syncIntervalMs: 100,
      },
    })
    this.worker = worker
    worker.on('message', (message: WorkerMessage) => this.handleWorkerMessage(message))
    worker.on('error', (error) => {
      this.healthState = {
        ...this.health(),
        ingestionStatus: 'failed',
        workerStatus: 'failed',
      }
      this.audit('connector_failed', 'error', `Ingestion worker failed: ${error.message}`)
      this.engine.setHealth(this.health())
    })
    worker.on('exit', (code) => {
      this.worker = null
      this.healthState = {
        ...this.health(),
        ingestionStatus: code === 0 ? 'stopped' : 'failed',
        workerStatus: code === 0 ? 'stopped' : 'failed',
      }
      if (code !== 0) {
        this.audit('connector_failed', 'error', `Ingestion worker exited with code ${code}`)
      }
      this.engine.setHealth(this.health())
    })
    worker.postMessage({ type: 'start', connectorId })
  }

  private handleWorkerMessage(message: WorkerMessage): void {
    if (message.type === 'batch') {
      this.healthState = this.mergeHealth(message.health)
      for (const audit of message.audits) {
        this.safePersist(() => this.persistence.audit(audit))
      }
      for (const tick of message.ticks) {
        this.engine.ingest(tick)
      }
      for (const attention of message.attention) {
        this.engine.ingestAttention(attention)
      }
      this.persistSampledBatch(message.ticks, message.attention)
      this.engine.setHealth(this.health())
      return
    }

    this.healthState = this.mergeHealth(message.health)
    this.engine.setHealth(this.health())
  }

  private mergeHealth(workerHealth: RealtimeHealth): RealtimeHealth {
    return {
      ...workerHealth,
      sqliteMode: this.persistence.mode,
      replay: this.replayState,
      liquidityHistory: this.liquidityHistoryHealth(),
    }
  }

  private ensureBroadcast(): void {
    if (this.unsubscribe) {
      return
    }
    this.unsubscribe = this.engine.subscribe((snapshot) => this.handleEngineSnapshot(snapshot))
  }

  private handleEngineSnapshot(snapshot: LiveEngineSnapshot): void {
    if (!snapshot.frame) {
      this.latestLiveSnapshot = { ...snapshot, status: { ...snapshot.status, health: this.health() } }
      if (!this.replayState.active) {
        this.broadcast(this.latestLiveSnapshot)
      }
      return
    }

    const signals = detectRealtimeSignals(snapshot.frame, this.previousLiveFrame)
    const health = {
      ...this.health(),
      lastFrameTimestamp: snapshot.frame.emittedAt,
    }
    this.healthState = health
    const status: LiveEngineStatus = {
      ...snapshot.status,
      sqliteMode: this.persistence.mode,
      health,
      mode: health.sourceTrust === 'simulated' ? 'simulated' : 'live',
      connectedFeeds: [health.activeConnectorId],
      reconnectingFeeds: health.ingestionStatus === 'reconnecting' ? [health.activeConnectorId] : [],
    }
    const frame: LiveDataFrame = {
      ...snapshot.frame,
      signals,
      status,
    }
    this.previousLiveFrame = frame
    this.latestLiveSnapshot = { frame, status }
    this.persistSignals(signals)
    this.persistSampledFrame(frame)

    if (!this.replayState.active) {
      this.broadcast(this.latestLiveSnapshot)
    }
  }

  private persistSampledBatch(ticks: LiveTick[], attention: LiveAttentionTick[]): void {
    const now = Date.now()
    for (const tick of this.liquiditySampler.select(ticks, now)) {
      const tradeDate = new Date(tick.timestamp).toISOString().slice(0, 10)
      const persisted = this.safePersist(() =>
        this.persistence.saveMarketTick({
          id: `tick:${tick.symbol}:${tick.timestamp}`,
          symbol: tick.symbol,
          price: tick.price,
          volume: tick.volume,
          source: tick.source,
          observedAt: tick.timestamp,
          tradeDate,
        }),
      )
      if (persisted) {
        this.persistedMarketTickCount += 1
        this.persistedMarketSymbols.add(tick.symbol.toUpperCase())
        this.lastMarketPersistAt = Math.max(this.lastMarketPersistAt ?? 0, tick.timestamp)
      }
    }

    if (now - this.lastAttentionPersistAt < 1_000) {
      return
    }
    this.lastAttentionPersistAt = now
    for (const item of attention.slice(0, 24)) {
      this.safePersist(() =>
        this.persistence.saveAttentionBatch({
          id: `attention:${item.target}:${item.timestamp}`,
          target: item.target,
          pressure: item.pressure,
          mentionVelocity: item.mentionVelocity,
          sentimentDivergenceIndex: item.sentimentDivergenceIndex,
          source: item.source,
          observedAt: item.timestamp,
          sampleCount: 1,
        }),
      )
    }
  }

  private persistSampledFrame(frame: LiveDataFrame): void {
    if (frame.emittedAt - this.lastFramePersistAt < 1_000) {
      return
    }
    this.lastFramePersistAt = frame.emittedAt
    this.safePersist(() =>
      this.persistence.saveRealtimeFrame({
        id: `frame:${frame.emittedAt}:${frame.sequence}`,
        sequence: frame.sequence,
        emittedAt: frame.emittedAt,
        frame,
      }),
    )
    if (frame.emittedAt - this.lastFrameAuditAt >= 1_000) {
      this.lastFrameAuditAt = frame.emittedAt
      this.audit('frame_published', 'info', `Realtime frame ${frame.sequence} published`, {
        sequence: frame.sequence,
        assetCount: frame.assets.length,
        attentionCount: frame.attention.length,
      })
    }
  }

  private liquidityHistoryHealth(): RealtimeHealth['liquidityHistory'] {
    const sampler = this.liquiditySampler.snapshot()
    return {
      persistedTicks: this.persistedMarketTickCount,
      persistedSymbols: this.persistedMarketSymbols.size,
      lastPersistedAt: this.lastMarketPersistAt,
      sampleMs: sampler.sampleMs,
      maxPerBatch: sampler.maxPerBatch,
      note:
        'Sampled liquidity history written to market_ticks_daily. One tick per symbol per interval; raw firehose remains in memory.',
    }
  }

  private persistSignals(signals: LiveSignalEvent[]): void {
    for (const signal of signals) {
      if (this.seenSignalIds.has(signal.id)) {
        continue
      }
      this.seenSignalIds.add(signal.id)
      this.safePersist(() => this.persistence.saveSignalEvent(signal))
      this.audit('signal_generated', signal.severity === 'critical' ? 'watch' : 'info', signal.explanation, {
        signalId: signal.id,
        type: signal.type,
        assetOrTopicId: signal.assetOrTopicId,
      })
    }
  }

  private publishReplayFrame(): void {
    const record = this.replayFrames[this.replayIndex]
    if (!record) {
      const emptyStatus: LiveEngineStatus = {
        ...this.latestLiveSnapshot.status,
        mode: 'replay',
        health: this.health(),
      }
      this.replaySnapshot = { frame: this.latestLiveSnapshot.frame, status: emptyStatus }
      this.broadcast(this.replaySnapshot)
      return
    }

    const health = {
      ...this.health(),
      replay: {
        ...this.replayState,
        cursor: record.emittedAt,
        frameCount: this.replayFrames.length,
      },
    }
    this.replayState = health.replay
    const status: LiveEngineStatus = {
      ...record.frame.status,
      running: true,
      mode: 'replay',
      sqliteMode: this.persistence.mode,
      health,
    }
    const frame: LiveDataFrame = {
      ...record.frame,
      status,
      signals: record.frame.signals ?? [],
    }
    this.replaySnapshot = { frame, status }
    this.broadcast(this.replaySnapshot)
  }

  private scheduleReplay(): void {
    this.clearReplayTimer()
    if (!this.replayState.active || !this.replayState.playing || this.replayFrames.length <= 1) {
      return
    }
    const current = this.replayFrames[this.replayIndex]
    const next = this.replayFrames[this.replayIndex + 1]
    if (!current || !next) {
      this.replayState = { ...this.replayState, playing: false }
      this.publishReplayFrame()
      return
    }
    const delay = Math.max(40, Math.min(1_000, (next.emittedAt - current.emittedAt) / this.replayState.speed))
    this.replayTimer = setTimeout(() => {
      this.replayIndex = Math.min(this.replayIndex + 1, this.replayFrames.length - 1)
      this.publishReplayFrame()
      this.scheduleReplay()
    }, delay)
  }

  private stopReplay(): void {
    this.clearReplayTimer()
    this.replayFrames = []
    this.replayIndex = 0
    this.replaySnapshot = null
    this.replayState = {
      active: false,
      playing: false,
      speed: this.replayState.speed,
      frameCount: 0,
    }
  }

  private clearReplayTimer(): void {
    if (this.replayTimer) {
      clearTimeout(this.replayTimer)
      this.replayTimer = null
    }
  }

  private broadcast(snapshot: LiveEngineSnapshot): void {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send('atlasz:realtime:frame', snapshot)
      }
    }
  }

  private audit(
    eventType: SourceAuditEventType,
    severity: SourceAuditRecord['severity'],
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.safePersist(() =>
      this.persistence.audit({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        eventType,
        connectorId: this.healthState.activeConnectorId,
        severity,
        message,
        createdAt: Date.now(),
        metadata,
      }),
    )
  }

  private safePersist(operation: () => void): boolean {
    try {
      operation()
      return true
    } catch (error) {
      console.warn('[atlasz] realtime persistence failed:', error instanceof Error ? error.message : error)
      try {
        this.persistence.audit({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          eventType: 'persistence_failed',
          connectorId: this.healthState.activeConnectorId,
          severity: 'error',
          message: error instanceof Error ? error.message : String(error),
          createdAt: Date.now(),
          metadata: {},
        })
      } catch {
        // If persistence itself is unavailable, do not recursively fail.
      }
      return false
    }
  }
}

function defaultHealth(activeConnectorId: ConnectorId, sqliteMode: RealtimeHealth['sqliteMode']): RealtimeHealth {
  return {
    activeConnectorId,
    ingestionStatus: 'stopped',
    packetsPerSecond: 0,
    framesPerSecond: 0,
    droppedPackets: 0,
    reconnectCount: 0,
    sqliteMode,
    sourceTrust: activeConnectorId === 'simulated' ? 'simulated' : 'public unauthenticated',
    workerStatus: 'stopped',
    connectors: [
      {
        id: 'simulated',
        label: 'Local simulator',
        assetClasses: ['crypto', 'equity', 'etf', 'commodity', 'index', 'forex', 'sector'],
        requiresAuth: false,
        status: activeConnectorId === 'simulated' ? 'stopped' : 'idle',
        reconnectCount: 0,
        sourceTrust: 'simulated',
        packetsPerSecond: 0,
        droppedPackets: 0,
      },
      {
        id: 'coincap_public_ws',
        label: 'CoinCap public WebSocket',
        assetClasses: ['crypto'],
        requiresAuth: false,
        status: activeConnectorId === 'coincap_public_ws' ? 'stopped' : 'idle',
        reconnectCount: 0,
        sourceTrust: 'public unauthenticated',
        packetsPerSecond: 0,
        droppedPackets: 0,
      },
      {
        id: 'binance_public_ws',
        label: 'Binance public trades',
        assetClasses: ['crypto'],
        requiresAuth: false,
        status: 'idle',
        reconnectCount: 0,
        sourceTrust: 'public unauthenticated',
        packetsPerSecond: 0,
        droppedPackets: 0,
      },
      {
        id: 'coinbase_public_ws',
        label: 'Coinbase public ticker',
        assetClasses: ['crypto'],
        requiresAuth: false,
        status: 'idle',
        reconnectCount: 0,
        sourceTrust: 'public unauthenticated',
        packetsPerSecond: 0,
        droppedPackets: 0,
      },
      {
        id: 'alpaca_iex_placeholder',
        label: 'Alpaca IEX placeholder',
        assetClasses: ['equity', 'etf'],
        requiresAuth: true,
        status: 'idle',
        reconnectCount: 0,
        sourceTrust: 'authenticated',
        packetsPerSecond: 0,
        droppedPackets: 0,
      },
    ],
    replay: {
      active: false,
      playing: false,
      speed: 1,
      frameCount: 0,
    },
    liquidityHistory: {
      persistedTicks: 0,
      persistedSymbols: 0,
      sampleMs: 1_000,
      maxPerBatch: 96,
      note: 'Sampled liquidity history has not started.',
    },
  }
}

function integerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

export function assetsFromFrame(frame: LiveDataFrame | null): string[] {
  return frame?.assets.map((asset) => asset.symbol) ?? []
}
