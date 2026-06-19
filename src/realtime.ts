export type LiveAssetKind = 'crypto' | 'equity' | 'etf' | 'commodity' | 'index' | 'forex' | 'sector'
export type ConfidenceBand = 'LOW' | 'WATCH' | 'ELEVATED' | 'HIGH'
export type ConnectorId =
  | 'simulated'
  | 'coincap_public_ws'
  | 'binance_public_ws'
  | 'coinbase_public_ws'
  | 'alpaca_iex_placeholder'
export type ConnectorStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'stopped' | 'failed'
export type SourceTrust = 'simulated' | 'public unauthenticated' | 'authenticated' | 'verified'
export type PersistenceMode = 'node:sqlite' | 'better-sqlite3' | 'json-fallback' | 'localstorage' | 'unknown'
export type WorkerRuntimeStatus = 'stopped' | 'starting' | 'running' | 'failed'
export type SignalSeverity = 'watch' | 'elevated' | 'high' | 'critical'
export type SignalType =
  | 'unusual_volume_spike'
  | 'volatility_velocity_spike'
  | 'attention_pressure_spike'
  | 'sentiment_price_divergence'
  | 'narrative_acceleration'
  | 'correlation_break'

export type ConnectorDescriptor = {
  id: ConnectorId
  label: string
  assetClasses: LiveAssetKind[]
  requiresAuth: boolean
  status: ConnectorStatus
  lastError?: string
  reconnectCount: number
  sourceTrust: SourceTrust
}

export type ConnectorHealth = ConnectorDescriptor & {
  packetsPerSecond: number
  droppedPackets: number
  lastPacketAt?: number
}

export type ReplayState = {
  active: boolean
  playing: boolean
  speed: 1 | 2 | 5
  windowStart?: number
  windowEnd?: number
  cursor?: number
  frameCount: number
}

export type RealtimeHealth = {
  activeConnectorId: ConnectorId
  ingestionStatus: ConnectorStatus
  packetsPerSecond: number
  framesPerSecond: number
  droppedPackets: number
  reconnectCount: number
  lastFrameTimestamp?: number
  sqliteMode: PersistenceMode
  sourceTrust: SourceTrust
  workerStatus: WorkerRuntimeStatus
  connectors: ConnectorHealth[]
  replay: ReplayState
}

export type MarketLayerTicker = {
  symbol: string
  name: string
  kind: LiveAssetKind
  price: number
  volume: number
  oneMinuteVolatilityWindow: number[]
  oneMinuteVolume: number
  volatilityVelocity: number
  volumeAcceleration: number
  updatedAt: number
}

export type EventLayerItem = {
  id: string
  title: string
  impactSector: string
  sourceTrailUrl: string
  region: string
  observedAt: number
  linkedEntities: string[]
  linkedMarkets: string[]
}

export type SocialLayerAttention = {
  id: string
  target: string
  attentionPressure: number
  mentionVelocity: number
  clusterKeywords: string[]
  sentimentDivergenceIndex: number
  observedAt: number
}

export type EntityLayerNode = {
  id: string
  label: string
  kind: 'event' | 'country' | 'commodity' | 'sector' | 'company' | 'ticker' | 'etf' | 'macro' | 'risk' | 'narrative'
  symbol?: string
}

export type EntityLayerEdge = {
  id: string
  source: string
  target: string
  relation: string
  weight: number
}

export type SignalLayerAnomaly = {
  id: string
  symbol: string
  type: 'quant-anomaly' | 'correlation-break' | 'unusual-volume' | 'volatility-spike' | 'attention-spike'
  magnitude: number
  explanation: string
  observedAt: number
}

export type EvidenceLayerTrail = {
  id: string
  confidence: ConfidenceBand
  score: number
  verificationTrail: Array<{
    sourceName: string
    sourceUrl: string
    observedAt: number
    note: string
  }>
}

export type DecisionLayerEntry = {
  id: string
  thesis: string
  evidenceIds: string[]
  emotionalState: string
  reviewDate: number
  postMortemNotes: string
  createdAt: number
  updatedAt: number
}

export type IntelligenceLayerFrame = {
  market: MarketLayerTicker[]
  events: EventLayerItem[]
  social: SocialLayerAttention[]
  entities: { nodes: EntityLayerNode[]; edges: EntityLayerEdge[] }
  signals: SignalLayerAnomaly[]
  evidence: EvidenceLayerTrail[]
  decisions: DecisionLayerEntry[]
}

export type LiveAssetConfig = {
  symbol: string
  label: string
  kind: LiveAssetKind
  source: 'coincap' | 'binance' | 'coinbase' | 'alpaca' | 'simulator'
  feedSymbol: string
}

export type LiveTick = {
  symbol: string
  price: number
  volume: number
  timestamp: number
  source: string
}

export type LiveAttentionTick = {
  target: string
  pressure: number
  mentionVelocity: number
  sentimentDivergenceIndex: number
  timestamp: number
  source: string
}

export type LiveTickMetrics = {
  volatilityVelocity: number
  volumeAcceleration: number
  oneMinuteVolume: number
  thirtyMinuteAverageVolume: number
}

export type LiveAssetSnapshot = {
  symbol: string
  label: string
  kind: LiveAssetKind
  source: string
  price: number
  changePct: number
  volume: number
  tickCount: number
  lastUpdated: number
  metrics: LiveTickMetrics
  ticks: LiveTick[]
}

export type LiveAttentionSnapshot = {
  target: string
  pressure: number
  mentionVelocity: number
  sentimentDivergenceIndex: number
  sampleCount: number
  lastUpdated: number
  samples: LiveAttentionTick[]
}

export type LiveEntityEdge = {
  id: string
  headlineId: string
  source: string
  target: string
  relation: string
  confidence: number
  createdAt: number
}

export type LiveSignalEvent = {
  id: string
  type: SignalType
  assetOrTopicId: string
  severity: SignalSeverity
  evidenceIds: string[]
  confidence: ConfidenceBand
  createdAt: number
  explanation: string
  relatedGraphNodes: string[]
}

export type LiveDataFrame = {
  sequence: number
  emittedAt: number
  assets: LiveAssetSnapshot[]
  attention: LiveAttentionSnapshot[]
  entityEdges: LiveEntityEdge[]
  signals: LiveSignalEvent[]
  status: LiveEngineStatus
}

export type LiveEngineStatus = {
  running: boolean
  mode: 'live' | 'hybrid' | 'simulated' | 'replay' | 'stopped'
  sqliteMode: PersistenceMode
  connectedFeeds: string[]
  reconnectingFeeds: string[]
  health?: RealtimeHealth
  error?: string
}

export type LiveEngineSnapshot = {
  frame: LiveDataFrame | null
  status: LiveEngineStatus
}

export const defaultLiveEngineStatus: LiveEngineStatus = {
  running: false,
  mode: 'stopped',
  sqliteMode: 'unknown',
  connectedFeeds: [],
  reconnectingFeeds: [],
}
