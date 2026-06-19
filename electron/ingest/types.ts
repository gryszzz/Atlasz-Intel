import type { LiveAttentionTick, LiveTick } from '../../src/realtime'

export type IngestSourceTrust = 'public unauthenticated' | 'local derived' | 'simulated' | 'verified' | 'failed'

export type NormalizedNewsEvent = {
  id: string
  title: string
  sourceName: string
  sourceUrl: string
  sourceTrust: IngestSourceTrust
  publishedAt: number
  observedAt: number
  sector: string
  summary: string
  rawText: string
}

export type ExposureMatch = {
  eventId: string
  keyword: string
  affectedTickers: string[]
  confidence: number
  reason: string
}

export type SocialPulseBatch = {
  symbol: string
  sourceSymbol: string
  sourceUrl: string
  messageCount: number
  newMessageCount: number
  velocityPerMinute: number
  mutedSentimentIndex: number
  bullishCount: number
  bearishCount: number
  observedAt: number
  attentionTick: LiveAttentionTick
}

export type ProbabilitySignal = {
  id: string
  title: string
  probability: number
  sourceUrl: string
  observedAt: number
  tags: string[]
}

export type MarketTickBatch = {
  source: string
  observedAt: number
  ticks: LiveTick[]
}

export type PublicIngestStatus = {
  running: boolean
  enabled: boolean
  startedAt?: number
  lastNewsAt?: number
  lastMarketPollAt?: number
  lastSocialPollAt?: number
  lastProbabilityPollAt?: number
  rssHeadlineCount: number
  stocktwitsBatchCount: number
  yahooTickCount: number
  probabilityCount: number
  exposureEdgeCount: number
  narrativeVelocityPerMinute: number
  cognitiveMode: 'deep' | 'keyword-priority' | 'batch-summary' | 'disabled'
  cognitiveQueueLength: number
  cognitiveAverageLatencyMs?: number
  cognitiveTimeoutMs?: number
  cognitiveValidationFailures: number
  cognitiveSkippedCount: number
  cognitiveBatchedCount: number
  cognitiveSourcePenaltyCount: number
  lastError?: string
}

export function stableHash(input: string): string {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function numberValue(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}
