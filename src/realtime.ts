export type LiveAssetKind = 'crypto' | 'equity' | 'etf' | 'commodity' | 'index'

export type LiveAssetConfig = {
  symbol: string
  label: string
  kind: LiveAssetKind
  source: 'coincap' | 'alpaca' | 'simulator'
  feedSymbol: string
}

export type LiveTick = {
  symbol: string
  price: number
  volume: number
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

export type LiveEntityEdge = {
  id: string
  headlineId: string
  source: string
  target: string
  relation: string
  confidence: number
  createdAt: number
}

export type LiveDataFrame = {
  sequence: number
  emittedAt: number
  assets: LiveAssetSnapshot[]
  entityEdges: LiveEntityEdge[]
  status: LiveEngineStatus
}

export type LiveEngineStatus = {
  running: boolean
  mode: 'live' | 'hybrid' | 'simulated' | 'stopped'
  sqliteMode: 'wal' | 'jsonl-fallback' | 'unknown'
  connectedFeeds: string[]
  reconnectingFeeds: string[]
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
