import { parentPort, workerData } from 'node:worker_threads'
import type {
  ConnectorDescriptor,
  ConnectorHealth,
  ConnectorId,
  ConnectorStatus,
  LiveAssetConfig,
  LiveAttentionTick,
  LiveTick,
  RealtimeHealth,
  SourceTrust,
} from '../../src/realtime'
import type { MicrostructureBookUpdate } from '../../src/microstructure'
import { StreamingScreener } from '../microstructure/streamingScreener'

type WorkerConfig = {
  assets: LiveAssetConfig[]
  seedPrices: Record<string, number>
  attentionTargets: string[]
  enablePublicWs: boolean
  connectorId?: ConnectorId
  sqliteMode?: RealtimeHealth['sqliteMode']
  syncIntervalMs?: number
}

type WorkerCommand =
  | { type: 'start'; connectorId?: ConnectorId }
  | { type: 'stop' }
  | { type: 'restart'; connectorId?: ConnectorId }
  | { type: 'addAsset'; asset: LiveAssetConfig; seedPrice: number }
  | { type: 'status' }
  | { type: 'health' }

type AuditEventType =
  | 'connector_started'
  | 'connector_failed'
  | 'reconnect_attempted'
  | 'reconnect_succeeded'
  | 'frame_published'
  | 'persistence_failed'
  | 'graph_traversal_triggered'
  | 'signal_generated'

type WorkerAuditEvent = {
  id: string
  eventType: AuditEventType
  connectorId?: string
  severity: 'info' | 'watch' | 'error'
  message: string
  createdAt: number
  metadata?: Record<string, unknown>
}

type NormalizedPayload = {
  ticks: LiveTick[]
  attention: LiveAttentionTick[]
  bookUpdates?: MicrostructureBookUpdate[]
}

type WorkerBatchMessage = {
  type: 'batch'
  ticks: LiveTick[]
  attention: LiveAttentionTick[]
  health: RealtimeHealth
  audits: WorkerAuditEvent[]
}

type WorkerHealthMessage = {
  type: 'health'
  health: RealtimeHealth
}

type WorkerStatusMessage = {
  type: 'status'
  health: RealtimeHealth
}

type WorkerWebSocket = {
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: (() => void) | null
  onerror: ((event?: unknown) => void) | null
  send: (data: string) => void
  close: () => void
}

type WorkerWebSocketConstructor = new (url: string) => WorkerWebSocket

type ConnectorEmit = (payload: NormalizedPayload) => void

type WorkerConnector = ConnectorDescriptor & {
  start: (emit: ConnectorEmit) => void
  stop: () => void
  addAsset?: (asset: LiveAssetConfig, seedPrice: number) => void
  normalizeMessage: (message: unknown) => NormalizedPayload
}

const config = normalizeConfig(workerData as Partial<WorkerConfig>)
const packetBacklogLimit = 20_000
const syncIntervalMs = config.syncIntervalMs ?? 100
const pendingTicks: LiveTick[] = []
const pendingAttention: LiveAttentionTick[] = []
const auditQueue: WorkerAuditEvent[] = []
const connectors = createConnectorRegistry(config)
const microstructure = new StreamingScreener({
  capacity: integerEnv('ATLASZ_MICROSTRUCTURE_BUFFER_SIZE', 10_000),
  zScoreThreshold: numberEnv('ATLASZ_MICROSTRUCTURE_ZSCORE', 2.5),
})
const proxyLastPrices = new Map<string, number>()

let activeConnectorId: ConnectorId = config.connectorId ?? (config.enablePublicWs ? 'coincap_public_ws' : 'simulated')
let workerStatus: RealtimeHealth['workerStatus'] = 'stopped'
let batchTimer: ReturnType<typeof setInterval> | null = null
let droppedPackets = 0
let packetCounter = 0
let packetRate = 0
let frameCounter = 0
let frameRate = 0
let lastRateAt = Date.now()
let lastFrameTimestamp: number | undefined

if (!parentPort) {
  throw new Error('Atlasz market ingestion worker requires parentPort')
}

parentPort.on('message', (message: WorkerCommand) => {
  if (!message || typeof message !== 'object') {
    return
  }
  if (message.type === 'start') {
    start(message.connectorId)
  } else if (message.type === 'stop') {
    stop()
  } else if (message.type === 'restart') {
    restart(message.connectorId)
  } else if (message.type === 'addAsset') {
    addAssetToWorker(message.asset, message.seedPrice)
  } else if (message.type === 'status') {
    postStatus()
  } else if (message.type === 'health') {
    postHealth()
  }
})

postHealth()

function normalizeConfig(input: Partial<WorkerConfig>): WorkerConfig {
  return {
    assets: input.assets ?? [],
    seedPrices: input.seedPrices ?? {},
    attentionTargets: input.attentionTargets ?? [],
    enablePublicWs: input.enablePublicWs === true,
    connectorId: input.connectorId,
    sqliteMode: input.sqliteMode ?? 'unknown',
    syncIntervalMs: input.syncIntervalMs,
  }
}

function start(connectorId?: ConnectorId): void {
  const requested = connectorId ?? activeConnectorId
  const connector = connectors.get(requested) ?? connectors.get('simulated')
  if (!connector) {
    workerStatus = 'failed'
    enqueueAudit('connector_failed', requested, 'error', `Connector ${requested} is not registered`)
    postHealth()
    return
  }

  stopActiveConnector()
  activeConnectorId = connector.id
  workerStatus = 'starting'
  resetBacklog()
  connector.start(acceptNormalized)
  workerStatus = connector.status === 'failed' ? 'failed' : 'running'
  ensureBatchTimer()
  postHealth()

  if (connector.status === 'failed' && connector.id !== 'simulated') {
    start('simulated')
  }
}

function stop(): void {
  stopActiveConnector()
  if (batchTimer) {
    clearInterval(batchTimer)
    batchTimer = null
  }
  resetBacklog()
  workerStatus = 'stopped'
  postHealth()
}

function restart(connectorId?: ConnectorId): void {
  stop()
  start(connectorId)
}

function addAssetToWorker(asset: LiveAssetConfig, seedPrice: number): void {
  if (!asset.symbol || config.assets.some((item) => item.symbol === asset.symbol)) {
    return
  }
  config.assets.push(asset)
  config.seedPrices[asset.symbol] = seedPrice
  if (!config.attentionTargets.includes(asset.symbol)) {
    config.attentionTargets.push(asset.symbol)
  }
  for (const connector of connectors.values()) {
    connector.addAsset?.(asset, seedPrice)
  }
  enqueueAudit('connector_started', activeConnectorId, 'info', `Watchlist asset ${asset.symbol} added to ingestion universe`, {
    symbol: asset.symbol,
    kind: asset.kind,
    source: asset.source,
  })
}

function stopActiveConnector(): void {
  const connector = connectors.get(activeConnectorId)
  connector?.stop()
}

function ensureBatchTimer(): void {
  if (batchTimer) {
    return
  }
  batchTimer = setInterval(flushBatch, syncIntervalMs)
}

function acceptNormalized(payload: NormalizedPayload): void {
  const acceptedTicks = appendWithDropAccounting(pendingTicks, payload.ticks)
  const acceptedAttention = appendWithDropAccounting(pendingAttention, payload.attention)
  const bookUpdates =
    payload.bookUpdates && payload.bookUpdates.length > 0
      ? payload.bookUpdates
      : proxyBookUpdatesFromTicks(payload.ticks, payload.ticks[0]?.source ?? activeConnectorId)
  microstructure.ingestMany(bookUpdates)
  for (const shock of microstructure.drainShocks()) {
    enqueueAudit('signal_generated', activeConnectorId, shock.severity === 'high' ? 'watch' : 'info', shock.explanation, {
      signalType: 'microstructure_market_shock',
      symbol: shock.symbol,
      obi: shock.obi,
      ofi: shock.ofi,
      ofiZScore: shock.ofiZScore,
      provenance: shock.provenance,
    })
  }
  packetCounter += acceptedTicks + acceptedAttention
}

function appendWithDropAccounting<T>(target: T[], items: T[]): number {
  let accepted = 0
  for (const item of items) {
    if (target.length >= packetBacklogLimit) {
      droppedPackets += 1
      continue
    }
    target.push(item)
    accepted += 1
  }
  return accepted
}

function flushBatch(): void {
  refreshRates()
  const ticks = pendingTicks.splice(0, pendingTicks.length)
  const attention = pendingAttention.splice(0, pendingAttention.length)
  const audits = auditQueue.splice(0, auditQueue.length)
  lastFrameTimestamp = Date.now()
  frameCounter += 1

  const message: WorkerBatchMessage = {
    type: 'batch',
    ticks,
    attention,
    audits,
    health: buildHealth(),
  }
  parentPort?.postMessage(message)
}

function resetBacklog(): void {
  pendingTicks.length = 0
  pendingAttention.length = 0
  auditQueue.length = 0
}

function refreshRates(): void {
  const now = Date.now()
  const elapsed = now - lastRateAt
  if (elapsed < 1_000) {
    return
  }
  packetRate = (packetCounter * 1_000) / elapsed
  frameRate = (frameCounter * 1_000) / elapsed
  packetCounter = 0
  frameCounter = 0
  lastRateAt = now
}

function postHealth(): void {
  const message: WorkerHealthMessage = { type: 'health', health: buildHealth() }
  parentPort?.postMessage(message)
}

function postStatus(): void {
  const message: WorkerStatusMessage = { type: 'status', health: buildHealth() }
  parentPort?.postMessage(message)
}

function buildHealth(): RealtimeHealth {
  refreshRates()
  const active = connectors.get(activeConnectorId)
  const connectorHealth = [...connectors.values()].map((connector): ConnectorHealth => ({
    id: connector.id,
    label: connector.label,
    assetClasses: connector.assetClasses,
    requiresAuth: connector.requiresAuth,
    status: connector.status,
    lastError: connector.lastError,
    reconnectCount: connector.reconnectCount,
    sourceTrust: connector.sourceTrust,
    packetsPerSecond: connector.id === activeConnectorId ? round(packetRate, 2) : 0,
    droppedPackets,
    lastPacketAt: lastFrameTimestamp,
  }))
  return {
    activeConnectorId,
    ingestionStatus: active?.status ?? 'stopped',
    packetsPerSecond: round(packetRate, 2),
    framesPerSecond: round(frameRate, 2),
    droppedPackets,
    reconnectCount: active?.reconnectCount ?? 0,
    lastFrameTimestamp,
    sqliteMode: config.sqliteMode ?? 'unknown',
    sourceTrust: active?.sourceTrust ?? 'simulated',
    workerStatus,
    connectors: connectorHealth,
    replay: {
      active: false,
      playing: false,
      speed: 1,
      frameCount: 0,
    },
    microstructure: microstructure.snapshot(),
  }
}

function enqueueAudit(
  eventType: AuditEventType,
  connectorId: string | undefined,
  severity: WorkerAuditEvent['severity'],
  message: string,
  metadata?: Record<string, unknown>,
): void {
  auditQueue.push({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    eventType,
    connectorId,
    severity,
    message,
    createdAt: Date.now(),
    metadata,
  })
}

function createConnectorRegistry(workerConfig: WorkerConfig): Map<ConnectorId, WorkerConnector> {
  const registry = new Map<ConnectorId, WorkerConnector>()
  const simulated = createSimulatedConnector(workerConfig)
  const coincap = createCoinCapConnector(workerConfig)
  const binance = createBinanceConnector()
  const coinbase = createCoinbaseConnector()
  const alpaca = createAlpacaPlaceholderConnector()
  for (const connector of [simulated, coincap, binance, coinbase, alpaca]) {
    registry.set(connector.id, connector)
  }
  return registry
}

function createSimulatedConnector(workerConfig: WorkerConfig): WorkerConnector {
  let status: ConnectorStatus = 'idle'
  let timer: ReturnType<typeof setInterval> | null = null
  const drift = new Map<string, number>()
  const prices = new Map<string, number>()
  const assets = workerConfig.assets
  const attentionTargets = new Set(workerConfig.attentionTargets)
  for (const asset of assets) {
    prices.set(asset.symbol, workerConfig.seedPrices[asset.symbol] ?? 100)
    drift.set(asset.symbol, 0)
    attentionTargets.add(asset.symbol)
  }

  const connector: WorkerConnector = {
    id: 'simulated',
    label: 'Local simulator',
    assetClasses: ['crypto', 'equity', 'etf', 'commodity', 'index', 'forex', 'sector'],
    requiresAuth: false,
    get status() {
      return status
    },
    lastError: undefined,
    reconnectCount: 0,
    sourceTrust: 'simulated',
    start(emit) {
      if (timer) {
        return
      }
      status = 'connected'
      enqueueAudit('connector_started', connector.id, 'info', 'Local simulator connector started')
      timer = setInterval(() => {
        const now = Date.now()
        const marketShock = (Math.random() - 0.5) * 0.0009
        const ticks: LiveTick[] = []
        const attention: LiveAttentionTick[] = []
        const bookUpdates: MicrostructureBookUpdate[] = []

        for (const asset of assets) {
          const previous = prices.get(asset.symbol) ?? 100
          const idiosyncratic = (Math.random() - 0.5) * 0.0022
          const momentum = (drift.get(asset.symbol) ?? 0) * 0.6
          const ret = marketShock + idiosyncratic + momentum
          drift.set(asset.symbol, ret)
          const nextPrice = Math.max(0.0001, previous * (1 + ret))
          prices.set(asset.symbol, nextPrice)
          const attentionSpike = Math.random() < 0.06 ? 4 + Math.random() * 8 : 1
          ticks.push({
            symbol: asset.symbol,
            price: round(nextPrice, 6),
            volume: round((20 + Math.random() * 60) * attentionSpike, 2),
            timestamp: now,
            source: connector.id,
          })
          bookUpdates.push(syntheticBookUpdate(asset.symbol, nextPrice, ret, attentionSpike, now, connector.id, 'simulated'))
          attention.push({
            target: asset.symbol,
            pressure: round(clamp(38 + Math.abs(ret) * 12_000 + (attentionSpike - 1) * 5, 0, 100), 2),
            mentionVelocity: round(Math.max(0, attentionSpike - 0.8 + Math.abs(ret) * 1_000), 2),
            sentimentDivergenceIndex: round(clamp(ret * 280 + (Math.random() - 0.5) * 0.18, -1, 1), 3),
            timestamp: now,
            source: connector.id,
          })
        }

        for (const target of attentionTargets) {
          if (prices.has(target)) {
            continue
          }
          const pressure = clamp(35 + Math.random() * 30 + (Math.random() < 0.04 ? 35 : 0), 0, 100)
          attention.push({
            target,
            pressure: round(pressure, 2),
            mentionVelocity: round(Math.max(0, pressure / 18 + (Math.random() - 0.4) * 3), 2),
            sentimentDivergenceIndex: round(clamp((Math.random() - 0.5) * 0.7, -1, 1), 3),
            timestamp: now,
            source: connector.id,
          })
        }

        emit({ ticks, attention, bookUpdates })
      }, Math.min(syncIntervalMs, 120))
    },
    stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      status = 'stopped'
    },
    addAsset(asset, seedPrice) {
      if (!prices.has(asset.symbol)) {
        prices.set(asset.symbol, seedPrice)
        drift.set(asset.symbol, 0)
      }
      attentionTargets.add(asset.symbol)
    },
    normalizeMessage() {
      return { ticks: [], attention: [] }
    },
  }
  return connector
}

function createCoinCapConnector(workerConfig: WorkerConfig): WorkerConnector {
  const assetByCoinCapId: Record<string, string> = Object.fromEntries(
    workerConfig.assets
      .filter((asset) => asset.kind === 'crypto' && asset.source === 'coincap')
      .map((asset) => [asset.feedSymbol, asset.symbol]),
  )
  if (Object.keys(assetByCoinCapId).length === 0) {
    assetByCoinCapId.bitcoin = 'BTC'
    assetByCoinCapId.ethereum = 'ETH'
  }
  const assetQuery = Object.keys(assetByCoinCapId).join(',')
  return createJsonWebSocketConnector({
    id: 'coincap_public_ws',
    label: 'CoinCap public WebSocket',
    url: `wss://ws.coincap.io/prices?assets=${assetQuery}`,
    assetClasses: ['crypto'],
    sourceTrust: 'public unauthenticated',
    normalizeMessage(message) {
      if (!message || typeof message !== 'object') {
        return { ticks: [], attention: [] }
      }
      const now = Date.now()
      const ticks = Object.entries(message as Record<string, unknown>)
        .map(([assetId, price]): LiveTick | null => {
          const symbol = assetByCoinCapId[assetId]
          const numericPrice = Number(price)
          if (!symbol || !Number.isFinite(numericPrice) || numericPrice <= 0) {
            return null
          }
          return { symbol, price: numericPrice, volume: 1, timestamp: now, source: 'coincap_public_ws' }
        })
        .filter((tick): tick is LiveTick => tick !== null)
      return { ticks, attention: attentionFromTicks(ticks, 'coincap_public_ws') }
    },
  })
}

function createBinanceConnector(): WorkerConnector {
  return createJsonWebSocketConnector({
    id: 'binance_public_ws',
    label: 'Binance public trades',
    url: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
    assetClasses: ['crypto'],
    sourceTrust: 'public unauthenticated',
    normalizeMessage(message) {
      if (!message || typeof message !== 'object') {
        return { ticks: [], attention: [] }
      }
      const payload = message as Record<string, unknown>
      const price = Number(payload.p)
      const volume = Number(payload.q)
      const timestamp = Number(payload.T) || Date.now()
      if (!Number.isFinite(price) || price <= 0) {
        return { ticks: [], attention: [] }
      }
      const ticks: LiveTick[] = [
        {
          symbol: 'BTC',
          price,
          volume: Number.isFinite(volume) && volume > 0 ? volume : 1,
          timestamp,
          source: 'binance_public_ws',
        },
      ]
      return { ticks, attention: attentionFromTicks(ticks, 'binance_public_ws') }
    },
  })
}

function createCoinbaseConnector(): WorkerConnector {
  const productMap = buildCoinbaseProductMap()
  return createJsonWebSocketConnector({
    id: 'coinbase_public_ws',
    label: 'Coinbase public ticker',
    url: 'wss://ws-feed.exchange.coinbase.com',
    subscribeMessage: {
      type: 'subscribe',
      product_ids: Object.keys(productMap),
      channels: ['ticker'],
    },
    assetClasses: ['crypto'],
    sourceTrust: 'public unauthenticated',
    normalizeMessage(message) {
      if (!message || typeof message !== 'object') {
        return { ticks: [], attention: [] }
      }
      const payload = message as Record<string, unknown>
      if (payload.type !== 'ticker') {
        return { ticks: [], attention: [] }
      }
      const product = String(payload.product_id ?? '')
      const symbol = productMap[product] ?? ''
      const price = Number(payload.price)
      const volume = Number(payload.last_size)
      const timestamp = typeof payload.time === 'string' ? Date.parse(payload.time) : NaN
      if (!symbol || !Number.isFinite(price) || price <= 0) {
        return { ticks: [], attention: [] }
      }
      const ticks: LiveTick[] = [
        {
          symbol,
          price,
          volume: Number.isFinite(volume) && volume > 0 ? volume : 1,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
          source: 'coinbase_public_ws',
        },
      ]
      return { ticks, attention: attentionFromTicks(ticks, 'coinbase_public_ws') }
    },
  })
}

function buildCoinbaseProductMap(): Record<string, string> {
  const productIds = (process.env.ATLASZ_COINBASE_PRODUCTS ?? 'BTC-USD,ETH-USD,SOL-USD,LINK-USD,KAS-USD,KAS-USDT')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0)
  return Object.fromEntries(
    productIds.map((productId) => {
      const base = productId.split('-')[0]
      return [productId, base]
    }),
  )
}

function createAlpacaPlaceholderConnector(): WorkerConnector {
  let status: ConnectorStatus = 'idle'
  const connector: WorkerConnector = {
    id: 'alpaca_iex_placeholder',
    label: 'Alpaca IEX placeholder',
    assetClasses: ['equity', 'etf'],
    requiresAuth: true,
    get status() {
      return status
    },
    lastError: undefined,
    reconnectCount: 0,
    sourceTrust: 'authenticated',
    start() {
      status = 'failed'
      connector.lastError = 'Alpaca IEX requires an API key and is intentionally disabled in the default local path.'
      enqueueAudit('connector_failed', connector.id, 'watch', connector.lastError)
    },
    stop() {
      status = 'stopped'
    },
    normalizeMessage() {
      return { ticks: [], attention: [] }
    },
  }
  return connector
}

function createJsonWebSocketConnector(options: {
  id: ConnectorId
  label: string
  url: string
  subscribeMessage?: unknown
  assetClasses: LiveAssetConfig['kind'][]
  sourceTrust: SourceTrust
  normalizeMessage: (message: unknown) => NormalizedPayload
}): WorkerConnector {
  let status: ConnectorStatus = 'idle'
  let socket: WorkerWebSocket | null = null
  let stopped = true
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let emitRef: ConnectorEmit | null = null

  const connector: WorkerConnector = {
    id: options.id,
    label: options.label,
    assetClasses: options.assetClasses,
    requiresAuth: false,
    get status() {
      return status
    },
    lastError: undefined,
    reconnectCount: 0,
    sourceTrust: options.sourceTrust,
    start(emit) {
      emitRef = emit
      stopped = false
      connect()
    },
    stop() {
      stopped = true
      status = 'stopped'
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
      socket = null
    },
    normalizeMessage: options.normalizeMessage,
  }

  function connect(): void {
    if (stopped) {
      return
    }
    const WebSocketCtor = (globalThis as { WebSocket?: WorkerWebSocketConstructor }).WebSocket
    if (!WebSocketCtor) {
      status = 'failed'
      connector.lastError = 'WebSocket is unavailable in this runtime.'
      enqueueAudit('connector_failed', connector.id, 'error', connector.lastError)
      return
    }

    status = connector.reconnectCount > 0 ? 'reconnecting' : 'connecting'
    try {
      socket = new WebSocketCtor(options.url)
    } catch (error) {
      status = 'failed'
      connector.lastError = error instanceof Error ? error.message : String(error)
      enqueueAudit('connector_failed', connector.id, 'error', connector.lastError)
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      status = 'connected'
      connector.lastError = undefined
      if (options.subscribeMessage) {
        socket?.send(JSON.stringify(options.subscribeMessage))
      }
      enqueueAudit(
        connector.reconnectCount > 0 ? 'reconnect_succeeded' : 'connector_started',
        connector.id,
        'info',
        `${connector.label} connected`,
      )
    }
    socket.onmessage = (event) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        emitRef?.(connector.normalizeMessage(payload))
      } catch (error) {
        droppedPackets += 1
        connector.lastError = error instanceof Error ? error.message : String(error)
      }
    }
    socket.onerror = (event) => {
      connector.lastError = event instanceof Error ? event.message : `${connector.label} socket error`
      enqueueAudit('connector_failed', connector.id, 'watch', connector.lastError)
      socket?.close()
    }
    socket.onclose = () => {
      socket = null
      if (stopped) {
        return
      }
      scheduleReconnect()
    }
  }

  function scheduleReconnect(): void {
    if (stopped) {
      return
    }
    status = 'reconnecting'
    connector.reconnectCount += 1
    const delay = Math.min(30_000, 500 * 2 ** Math.min(connector.reconnectCount, 8))
    enqueueAudit('reconnect_attempted', connector.id, 'watch', `${connector.label} reconnect in ${delay}ms`, {
      reconnectCount: connector.reconnectCount,
      delay,
    })
    reconnectTimer = setTimeout(connect, delay)
  }

  return connector
}

function attentionFromTicks(ticks: LiveTick[], source: string): LiveAttentionTick[] {
  return ticks.map((tick) => ({
    target: tick.symbol,
    pressure: 45,
    mentionVelocity: Math.min(18, Math.max(0.5, tick.volume * 0.4)),
    sentimentDivergenceIndex: 0,
    timestamp: tick.timestamp,
    source,
  }))
}

function proxyBookUpdatesFromTicks(ticks: LiveTick[], source: string): MicrostructureBookUpdate[] {
  return ticks.map((tick) => {
    const previous = proxyLastPrices.get(tick.symbol) ?? tick.price
    proxyLastPrices.set(tick.symbol, tick.price)
    const signedReturn = previous > 0 ? (tick.price - previous) / previous : 0
    const pressure = Math.tanh((tick.volume || 1) / 10)
    return syntheticBookUpdate(
      tick.symbol,
      tick.price,
      signedReturn * pressure,
      Math.max(1, tick.volume),
      tick.timestamp,
      source,
      'local-computed',
    )
  })
}

function syntheticBookUpdate(
  symbol: string,
  midPrice: number,
  signedReturn: number,
  intensity: number,
  timestamp: number,
  source: string,
  provenance: MicrostructureBookUpdate['provenance'],
): MicrostructureBookUpdate {
  const packetReceivedAt = Date.now()
  const spreadBps = Math.max(1, Math.min(18, 4 + Math.abs(signedReturn) * 12_000))
  const halfSpread = midPrice * (spreadBps / 20_000)
  const baseVolume = Math.max(1, 60 * intensity)
  const skew = clamp(signedReturn * 3_500, -0.82, 0.82)
  return {
    symbol,
    bidPrice: round(Math.max(0.000001, midPrice - halfSpread), 8),
    askPrice: round(midPrice + halfSpread, 8),
    bidVolume: round(baseVolume * (1 + skew), 6),
    askVolume: round(baseVolume * (1 - skew), 6),
    timestamp,
    source,
    provenance,
    dataMode: 'PROXY_TRADE_FLOW_PRESSURE',
    packetReceivedAt,
    normalizedAt: Date.now(),
  }
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function integerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function numberEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])
  return Number.isFinite(value) && value > 0 ? value : fallback
}
