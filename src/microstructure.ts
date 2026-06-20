import type { ProvenanceId } from './provenance'

export const MICROSTRUCTURE_DATA_MODES = [
  'TRUE_L2_ORDER_BOOK',
  'TOP_OF_BOOK_ONLY',
  'PROXY_TRADE_FLOW_PRESSURE',
  'MICROSTRUCTURE_UNAVAILABLE',
] as const

export type MicrostructureDataMode = (typeof MICROSTRUCTURE_DATA_MODES)[number]

export type MicrostructureBookUpdate = {
  symbol: string
  bidPrice: number
  bidVolume: number
  askPrice: number
  askVolume: number
  timestamp: number
  source: string
  provenance: ProvenanceId
  dataMode: MicrostructureDataMode
  packetReceivedAt?: number
  normalizedAt?: number
}

export type MicrostructureShockEvent = {
  id: string
  symbol: string
  observedAt: number
  obi: number
  ofi: number
  ofiZScore: number
  spreadBps: number
  severity: 'watch' | 'elevated' | 'high'
  source: string
  provenance: ProvenanceId
  dataMode: MicrostructureDataMode
  explanation: string
}

export type MicrostructureSignal = MicrostructureShockEvent & {
  updateCount: number
  bidVolume: number
  askVolume: number
  latencyMicros: number | null
  jitterMicros: number | null
}

export type MicrostructureHealth = {
  enabled: boolean
  bufferCapacity: number
  trackedSymbols: number
  updateCount: number
  droppedUpdates: number
  shockCount: number
  zScoreThreshold: number
  dataMode: MicrostructureDataMode
  latencyMicrosAvg: number | null
  jitterMicros: number | null
  topSignals: MicrostructureSignal[]
  note: string
}

export const emptyMicrostructureHealth: MicrostructureHealth = {
  enabled: false,
  bufferCapacity: 0,
  trackedSymbols: 0,
  updateCount: 0,
  droppedUpdates: 0,
  shockCount: 0,
  zScoreThreshold: 2.5,
  dataMode: 'MICROSTRUCTURE_UNAVAILABLE',
  latencyMicrosAvg: null,
  jitterMicros: null,
  topSignals: [],
  note: 'MICROSTRUCTURE_UNAVAILABLE: no depth, quote, or trade-flow context is available in this runtime.',
}
