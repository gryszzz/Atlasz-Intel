import { EventEmitter } from 'node:events'
import { GraphMutator } from '../../src/engine/graphMutator'
import type { LiveAttentionTick } from '../../src/realtime'
import type {
  EntityEdgeRecord,
  IntelPersistence,
  SignalEventRecord,
  SourceAuditRecord,
  SourceAuditEventType,
  WorldHeadlineRecord,
} from '../persistence'
import type { RealtimeService } from '../realtimeService'
import { CognitiveTaskManager, type CognitiveRouteMode } from './cognitiveTaskManager'
import { analyzeHeadlineExposure } from './exposureMatrix'
import { PolymarketGammaService } from './polymarketGammaService'
import { RssRadarService } from './rssRadarService'
import { StocktwitsPulseService } from './stocktwitsPulseService'
import type { ExposureMatch, NormalizedNewsEvent, ProbabilitySignal, PublicIngestStatus, SocialPulseBatch } from './types'
import { clamp, stableHash } from './types'
import { TwitterExploreScraper } from './twitterExploreScraper'
import { YahooEquityPoller } from './yahooEquityPoller'

type DataIngestOrchestratorOptions = {
  persistence: IntelPersistence
  realtime: RealtimeService
  enabled?: boolean
}

type DataIngestEvents = {
  news: [NormalizedNewsEvent]
  exposure: [NormalizedNewsEvent, ExposureMatch]
  social: [SocialPulseBatch]
  probability: [ProbabilitySignal]
  error: [Error]
}

type CognitiveMode = CognitiveRouteMode | 'disabled'

const narrativeWindowMs = 60_000
const mediumVelocityDefault = 12
const highVelocityDefault = 35

export class DataIngestOrchestrator extends EventEmitter {
  private readonly persistence: IntelPersistence
  private readonly realtime: RealtimeService
  private readonly enabled: boolean
  private readonly rss = new RssRadarService({
    intervalMs: integerEnv('ATLASZ_RSS_POLL_MS', 30_000),
  })
  private readonly stocktwits = new StocktwitsPulseService({
    intervalMs: integerEnv('ATLASZ_STOCKTWITS_POLL_MS', 60_000),
  })
  private readonly yahoo = new YahooEquityPoller({
    intervalMs: integerEnv('ATLASZ_YAHOO_POLL_MS', 60_000),
  })
  private readonly polymarket = new PolymarketGammaService({
    intervalMs: integerEnv('ATLASZ_POLYMARKET_POLL_MS', 5 * 60_000),
  })
  private readonly cognitive = new CognitiveTaskManager()
  private readonly graphMutator = new GraphMutator({
    halfLifeMs: integerEnv('ATLASZ_GRAPH_EDGE_HALFLIFE_MS', 6 * 60 * 60_000),
    maxSilenceMs: integerEnv('ATLASZ_GRAPH_EDGE_MAX_SILENCE_MS', 24 * 60 * 60_000),
  })
  private readonly twitterExplore = new TwitterExploreScraper()
  private readonly statusState: PublicIngestStatus
  private readonly narrativeInputTimestamps: number[] = []
  private readonly cognitiveBatch: NormalizedNewsEvent[] = []
  private readonly mediumVelocityThreshold = integerEnv('ATLASZ_NARRATIVE_MEDIUM_VELOCITY', mediumVelocityDefault)
  private readonly highVelocityThreshold = integerEnv('ATLASZ_NARRATIVE_HIGH_VELOCITY', highVelocityDefault)
  private cognitiveMode: CognitiveMode = process.env.ATLASZ_ENABLE_OLLAMA === '1' ? 'deep' : 'disabled'
  private cognitiveSkippedCount = 0
  private cognitiveBatchedCount = 0
  private decayTimer: ReturnType<typeof setInterval> | null = null
  private batchTimer: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(options: DataIngestOrchestratorOptions) {
    super()
    this.on('error', () => undefined)
    this.persistence = options.persistence
    this.realtime = options.realtime
    this.enabled = options.enabled ?? process.env.ATLASZ_ENABLE_PUBLIC_OSINT !== '0'
    this.statusState = {
      running: false,
      enabled: this.enabled,
      rssHeadlineCount: 0,
      stocktwitsBatchCount: 0,
      yahooTickCount: 0,
      probabilityCount: 0,
      exposureEdgeCount: 0,
      narrativeVelocityPerMinute: 0,
      cognitiveMode: this.cognitiveMode,
      cognitiveQueueLength: 0,
      cognitiveValidationFailures: 0,
      cognitiveSkippedCount: 0,
      cognitiveBatchedCount: 0,
      cognitiveSourcePenaltyCount: 0,
    }
    this.bindServices()
  }

  override on<K extends keyof DataIngestEvents>(eventName: K, listener: (...args: DataIngestEvents[K]) => void): this {
    return super.on(eventName, listener)
  }

  start(): void {
    if (this.running || !this.enabled) {
      return
    }
    this.running = true
    this.statusState.running = true
    this.statusState.startedAt = Date.now()
    this.audit('connector_started', 'info', 'Public OSINT ingest orchestrator started', {
      rss: process.env.ATLASZ_ENABLE_RSS_RADAR !== '0',
      stocktwits: process.env.ATLASZ_ENABLE_STOCKTWITS !== '0',
      yahoo: process.env.ATLASZ_ENABLE_YAHOO_POLL !== '0',
      polymarket: process.env.ATLASZ_ENABLE_POLYMARKET !== '0',
      ollama: process.env.ATLASZ_ENABLE_OLLAMA === '1',
    })

    if (process.env.ATLASZ_ENABLE_RSS_RADAR !== '0') {
      this.rss.start()
    }
    if (process.env.ATLASZ_ENABLE_STOCKTWITS !== '0') {
      this.stocktwits.start()
    }
    if (process.env.ATLASZ_ENABLE_YAHOO_POLL !== '0') {
      this.yahoo.start()
    }
    if (process.env.ATLASZ_ENABLE_POLYMARKET !== '0') {
      this.polymarket.start()
    }
    void this.twitterExplore.extractTrendingKeywords().catch((error) => {
      this.handleError(error instanceof Error ? error : new Error(String(error)), 'x_explore_placeholder')
    })
    this.decayTimer = setInterval(() => {
      const result = this.graphMutator.applyTemporalEdgeDecay()
      if (result.decayed > 0 || result.purged > 0) {
        this.audit('graph_traversal_triggered', 'info', 'Adaptive graph edge decay pass completed', result)
      }
    }, integerEnv('ATLASZ_GRAPH_DECAY_MS', 5 * 60_000))
    this.batchTimer = setInterval(() => this.flushCognitiveBatch('timer'), integerEnv('ATLASZ_COGNITIVE_BATCH_MS', 15_000))
  }

  stop(): void {
    if (!this.running) {
      return
    }
    this.running = false
    this.statusState.running = false
    this.rss.stop()
    this.stocktwits.stop()
    this.yahoo.stop()
    this.polymarket.stop()
    this.cognitive.clear()
    this.cognitiveBatch.length = 0
    if (this.decayTimer) {
      clearInterval(this.decayTimer)
      this.decayTimer = null
    }
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
  }

  status(): PublicIngestStatus {
    this.updateAdaptiveStatus()
    return { ...this.statusState }
  }

  private bindServices(): void {
    this.rss.on('headline', (event) => this.handleNewsEvent(event))
    this.rss.on('error', (error) => this.handleError(error, 'rss_public_radar'))
    this.stocktwits.on('pulse', (batch) => this.handleSocialBatch(batch))
    this.stocktwits.on('error', (error) => this.handleError(error, 'stocktwits_public_stream'))
    this.yahoo.on('ticks', (batch) => {
      this.statusState.lastMarketPollAt = batch.observedAt
      this.statusState.yahooTickCount += batch.ticks.length
      this.realtime.ingestExternalBatch(batch.ticks, [])
    })
    this.yahoo.on('error', (error) => this.handleError(error, 'yahoo_finance_1m_public'))
    this.polymarket.on('probability', (probability) => this.handleProbability(probability))
    this.polymarket.on('error', (error) => this.handleError(error, 'polymarket_gamma_public'))
    this.cognitive.on('extraction', (event, extraction, meta) => {
      const result = this.graphMutator.upsertConnection(extraction)
      for (const edge of this.graphMutator.neighbors(result.eventId)) {
        this.saveEntityEdge({
          id: `cognitive:${edge.source}:${edge.target}`,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
          confidence: edge.weight,
          createdAt: edge.createdAt,
        })
      }
      this.audit('graph_traversal_triggered', 'info', 'Ollama cognitive extraction updated adaptive graph', {
        eventId: result.eventId,
        eventTitle: event.title,
        newEdges: result.newEdges,
        reinforcedEdges: result.reinforcedEdges,
        routeMode: meta.routeMode,
        durationMs: meta.durationMs,
        timeoutMs: meta.timeoutMs,
        sourcePenalty: meta.sourcePenalty,
        validationIssueCount: meta.validationIssueCount,
      })
      this.updateAdaptiveStatus()
    })
    this.cognitive.on('error', (error) => this.handleError(error, 'ollama_local_cognitive_layer'))
  }

  private handleNewsEvent(event: NormalizedNewsEvent): void {
    this.recordNarrativeInput(1, event.observedAt)
    this.statusState.lastNewsAt = event.observedAt
    this.statusState.rssHeadlineCount += 1
    this.saveHeadline(toHeadlineRecord(event))
    const matches = analyzeHeadlineExposure(event.rawText || event.title, event.id)
    this.persistExposureMatches(event, matches)
    this.routeCognitiveEvent(event, matches)
    this.emit('news', event)
    this.updateAdaptiveStatus()
  }

  private handleProbability(probability: ProbabilitySignal): void {
    this.recordNarrativeInput(1, probability.observedAt)
    this.statusState.lastProbabilityPollAt = probability.observedAt
    this.statusState.probabilityCount += 1
    const event: NormalizedNewsEvent = {
      id: probability.id,
      title: probability.title,
      sourceName: 'Polymarket Gamma public markets',
      sourceUrl: probability.sourceUrl,
      sourceTrust: 'public unauthenticated',
      publishedAt: probability.observedAt,
      observedAt: probability.observedAt,
      sector: 'Macro probability',
      summary: `Public market-implied probability near ${(probability.probability * 100).toFixed(1)}%.`,
      rawText: `${probability.title} ${probability.tags.join(' ')}`,
    }
    this.saveHeadline(toHeadlineRecord(event))
    const matches = analyzeHeadlineExposure(event.rawText, event.id)
    this.persistExposureMatches(event, matches)
    this.routeCognitiveEvent(event, matches)
    this.emit('probability', probability)
    this.updateAdaptiveStatus()
  }

  private handleSocialBatch(batch: SocialPulseBatch): void {
    this.recordNarrativeInput(Math.max(1, batch.newMessageCount), batch.observedAt)
    this.statusState.lastSocialPollAt = batch.observedAt
    this.statusState.stocktwitsBatchCount += 1
    this.realtime.ingestExternalBatch([], [batch.attentionTick])
    this.emit('social', batch)
    this.updateAdaptiveStatus()
  }

  private routeCognitiveEvent(event: NormalizedNewsEvent, matches: ExposureMatch[]): void {
    const mode = this.currentCognitiveMode()
    this.cognitiveMode = mode
    if (mode === 'disabled') {
      return
    }

    const bestConfidence = matches.reduce((best, match) => Math.max(best, match.confidence), 0)
    const sourcePenalty = this.cognitive.sourcePenalty(event.sourceName)
    const priorityScore = bestConfidence * sourcePenalty

    if (mode === 'deep') {
      this.cognitive.enqueue(event, 'deep')
      return
    }

    if (mode === 'keyword-priority') {
      if (priorityScore >= 0.55) {
        this.cognitive.enqueue(event, 'keyword-priority')
      } else {
        this.cognitiveSkippedCount += 1
      }
      return
    }

    if (priorityScore >= 0.66) {
      this.cognitiveBatch.push(event)
      this.cognitiveBatchedCount += 1
      if (this.cognitiveBatch.length >= integerEnv('ATLASZ_COGNITIVE_BATCH_SIZE', 5)) {
        this.flushCognitiveBatch('full')
      }
    } else {
      this.cognitiveSkippedCount += 1
    }
  }

  private flushCognitiveBatch(reason: 'full' | 'timer'): void {
    if (this.cognitiveBatch.length === 0) {
      return
    }
    const batch = this.cognitiveBatch.splice(0, this.cognitiveBatch.length)
    this.cognitive.enqueueBatch(batch)
    this.audit('graph_traversal_triggered', 'info', 'High-velocity narrative batch routed to cognitive parser', {
      reason,
      batchSize: batch.length,
      narrativeVelocityPerMinute: this.narrativeVelocityPerMinute(),
    })
    this.updateAdaptiveStatus()
  }

  private currentCognitiveMode(): CognitiveMode {
    if (process.env.ATLASZ_ENABLE_OLLAMA !== '1') {
      return 'disabled'
    }
    const velocity = this.narrativeVelocityPerMinute()
    if (velocity >= this.highVelocityThreshold) {
      return 'batch-summary'
    }
    if (velocity >= this.mediumVelocityThreshold) {
      return 'keyword-priority'
    }
    return 'deep'
  }

  private recordNarrativeInput(count: number, observedAt: number): void {
    const samples = Math.min(Math.max(Math.round(count), 1), 200)
    for (let index = 0; index < samples; index += 1) {
      this.narrativeInputTimestamps.push(observedAt)
    }
    this.pruneNarrativeWindow(observedAt)
  }

  private narrativeVelocityPerMinute(now = Date.now()): number {
    this.pruneNarrativeWindow(now)
    return this.narrativeInputTimestamps.length
  }

  private pruneNarrativeWindow(now: number): void {
    while (this.narrativeInputTimestamps.length > 0 && now - this.narrativeInputTimestamps[0] > narrativeWindowMs) {
      this.narrativeInputTimestamps.shift()
    }
  }

  private updateAdaptiveStatus(): void {
    const cognitiveStatus = this.cognitive.status()
    this.cognitiveMode = this.currentCognitiveMode()
    this.statusState.narrativeVelocityPerMinute = this.narrativeVelocityPerMinute()
    this.statusState.cognitiveMode = this.cognitiveMode
    this.statusState.cognitiveQueueLength = cognitiveStatus.queueLength
    this.statusState.cognitiveAverageLatencyMs = cognitiveStatus.rollingAverageLatencyMs
    this.statusState.cognitiveTimeoutMs = cognitiveStatus.timeoutMs
    this.statusState.cognitiveValidationFailures = cognitiveStatus.validationFailures
    this.statusState.cognitiveSkippedCount = this.cognitiveSkippedCount
    this.statusState.cognitiveBatchedCount = this.cognitiveBatchedCount
    this.statusState.cognitiveSourcePenaltyCount = this.cognitive.sourcePenaltyCount()
  }

  private persistExposureMatches(event: NormalizedNewsEvent, matches: ExposureMatch[]): void {
    const attention: LiveAttentionTick[] = []
    const signals: SignalEventRecord[] = []
    for (const match of matches) {
      this.emit('exposure', event, match)
      for (const ticker of match.affectedTickers) {
        const confidenceScore = clamp(match.confidence, 0, 1)
        this.saveEntityEdge({
          id: `exposure:${event.id}:${ticker}:${stableHash(match.keyword)}`,
          source: event.id,
          target: ticker,
          relation: match.reason,
          confidence: confidenceScore,
          createdAt: event.observedAt,
        })
        attention.push({
          target: ticker,
          pressure: Math.round(clamp(45 + confidenceScore * 45, 0, 100)),
          mentionVelocity: Number((1 + confidenceScore * 4).toFixed(3)),
          sentimentDivergenceIndex: 0,
          timestamp: event.observedAt,
          source: 'local_exposure_matrix',
        })
        signals.push({
          id: `signal:${event.id}:${ticker}:${stableHash(match.keyword)}`,
          type: 'narrative_acceleration',
          assetOrTopicId: ticker,
          severity: confidenceScore >= 0.72 ? 'high' : confidenceScore >= 0.64 ? 'elevated' : 'watch',
          evidenceIds: [event.id],
          confidence: confidenceScore >= 0.72 ? 'ELEVATED' : 'WATCH',
          createdAt: event.observedAt,
          explanation: `${ticker} linked to "${event.title}" via ${match.keyword}. ${match.reason}`,
          relatedGraphNodes: [event.id, ticker],
        })
      }
    }
    if (attention.length > 0) {
      this.realtime.ingestExternalBatch([], attention)
    }
    for (const signal of signals) {
      this.safePersist(() => this.persistence.saveSignalEvent(signal))
      this.audit('signal_generated', signal.severity === 'high' ? 'watch' : 'info', signal.explanation, {
        signalId: signal.id,
        assetOrTopicId: signal.assetOrTopicId,
      })
    }
  }

  private saveHeadline(record: WorldHeadlineRecord): void {
    this.safePersist(() => this.persistence.saveHeadline(record))
  }

  private saveEntityEdge(record: EntityEdgeRecord): void {
    this.statusState.exposureEdgeCount += 1
    this.safePersist(() => this.persistence.saveEntityEdge(record))
  }

  private handleError(error: Error, connectorId: string): void {
    this.statusState.lastError = error.message
    this.emit('error', error)
    this.audit('connector_failed', 'watch', error.message, { connectorId })
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
        connectorId: typeof metadata?.connectorId === 'string' ? metadata.connectorId : 'public_osint_orchestrator',
        severity,
        message,
        createdAt: Date.now(),
        metadata,
      }),
    )
  }

  private safePersist(operation: () => void): void {
    try {
      operation()
    } catch (error) {
      try {
        this.persistence.audit({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          eventType: 'persistence_failed',
          connectorId: 'public_osint_orchestrator',
          severity: 'error',
          message: error instanceof Error ? error.message : String(error),
          createdAt: Date.now(),
          metadata: {},
        })
      } catch {
        // Persistence failure must never crash public ingestion.
      }
    }
  }
}

function toHeadlineRecord(event: NormalizedNewsEvent): WorldHeadlineRecord {
  return {
    id: event.id,
    title: event.title,
    source: event.sourceName,
    url: event.sourceUrl,
    sector: event.sector,
    impact: `${event.summary} Trust: ${event.sourceTrust}.`,
    observedAt: event.publishedAt || event.observedAt,
  }
}

function integerEnv(key: string, fallback: number): number {
  const value = Number(process.env[key])
  return Number.isInteger(value) && value > 0 ? value : fallback
}
