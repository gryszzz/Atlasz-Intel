import { EventEmitter } from 'node:events'
import {
  COGNITIVE_JSON_SCHEMA,
  validateCognitiveExtraction,
  type CognitiveExtraction,
} from '../../src/engine/cognitiveSchema'
import type { NormalizedNewsEvent } from './types'
import { clamp, stableHash } from './types'

type OllamaChatResponse = {
  message?: {
    content?: unknown
  }
}

export type CognitiveTaskManagerOptions = {
  enabled?: boolean
  endpoint?: string
  model?: string
  requestTimeoutMs?: number
  minTimeoutMs?: number
  maxTimeoutMs?: number
  latencyWindowSize?: number
  timeoutScale?: number
  maxQueueSize?: number
}

export type CognitiveRouteMode = 'deep' | 'keyword-priority' | 'batch-summary'

export type CognitiveExtractionMeta = {
  durationMs: number
  timeoutMs: number
  sourcePenalty: number
  validationIssueCount: number
  routeMode: CognitiveRouteMode
}

export type SourceReliabilityState = {
  attempts: number
  successes: number
  validationFailures: number
  structuralIssues: number
  penalty: number
}

export type CognitiveTaskStatus = {
  enabled: boolean
  queueLength: number
  rollingAverageLatencyMs?: number
  timeoutMs: number
  successfulExtractions: number
  failedExtractions: number
  validationFailures: number
  sourceReliability: Record<string, SourceReliabilityState>
}

type CognitiveQueueItem = {
  event: NormalizedNewsEvent
  mode: CognitiveRouteMode
}

export type CognitiveTaskEvents = {
  extraction: [NormalizedNewsEvent, CognitiveExtraction, CognitiveExtractionMeta]
  error: [Error]
}

export class CognitiveTaskManager extends EventEmitter {
  private readonly enabled: boolean
  private readonly endpoint: string
  private readonly model: string
  private readonly initialTimeoutMs: number
  private readonly minTimeoutMs: number
  private readonly maxTimeoutMs: number
  private readonly latencyWindowSize: number
  private readonly timeoutScale: number
  private readonly maxQueueSize: number
  private readonly queue: CognitiveQueueItem[] = []
  private readonly successfulDurationsMs: number[] = []
  private readonly sourceReliability = new Map<string, SourceReliabilityState>()
  private successfulExtractions = 0
  private failedExtractions = 0
  private validationFailures = 0
  private processing = false

  constructor(options: CognitiveTaskManagerOptions = {}) {
    super()
    this.on('error', () => undefined)
    this.enabled = options.enabled ?? process.env.ATLASZ_ENABLE_OLLAMA === '1'
    this.endpoint = options.endpoint ?? process.env.ATLASZ_OLLAMA_ENDPOINT ?? 'http://localhost:11434/api/chat'
    this.model = options.model ?? process.env.ATLASZ_OLLAMA_MODEL ?? 'qwen2.5:7b'
    this.initialTimeoutMs = options.requestTimeoutMs ?? 18_000
    this.minTimeoutMs = options.minTimeoutMs ?? 3_000
    this.maxTimeoutMs = options.maxTimeoutMs ?? 30_000
    this.latencyWindowSize = options.latencyWindowSize ?? 8
    this.timeoutScale = options.timeoutScale ?? 1.5
    this.maxQueueSize = options.maxQueueSize ?? 250
  }

  override on<K extends keyof CognitiveTaskEvents>(
    eventName: K,
    listener: (...args: CognitiveTaskEvents[K]) => void,
  ): this {
    return super.on(eventName, listener)
  }

  enqueue(event: NormalizedNewsEvent, mode: CognitiveRouteMode = 'deep'): void {
    if (!this.enabled) {
      return
    }
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift()
    }
    this.queue.push({ event, mode })
    void this.drain()
  }

  enqueueBatch(events: NormalizedNewsEvent[]): void {
    if (!this.enabled || events.length === 0) {
      return
    }
    const observedAt = Math.max(...events.map((event) => event.observedAt))
    const sourceNames = [...new Set(events.map((event) => event.sourceName))]
    const event: NormalizedNewsEvent = {
      id: `batch-${stableHash(events.map((item) => item.id).join('|'))}`,
      title: `Batch summary of ${events.length} public market narratives`,
      sourceName: sourceNames.length === 1 ? sourceNames[0] : 'Atlasz public narrative batch',
      sourceUrl: events[0].sourceUrl,
      sourceTrust: 'local derived',
      publishedAt: observedAt,
      observedAt,
      sector: 'Batch macro narrative',
      summary: events.map((item) => item.title).slice(0, 8).join(' | '),
      rawText: events
        .map((item) => `${item.title}\n${item.summary}`)
        .join('\n---\n')
        .slice(0, 3_600),
    }
    this.enqueue(event, 'batch-summary')
  }

  clear(): void {
    this.queue.length = 0
  }

  status(): CognitiveTaskStatus {
    return {
      enabled: this.enabled,
      queueLength: this.queue.length,
      rollingAverageLatencyMs: this.rollingAverageLatencyMs(),
      timeoutMs: this.currentTimeoutMs(),
      successfulExtractions: this.successfulExtractions,
      failedExtractions: this.failedExtractions,
      validationFailures: this.validationFailures,
      sourceReliability: Object.fromEntries([...this.sourceReliability.entries()]),
    }
  }

  sourcePenalty(sourceName: string): number {
    return this.getSourceReliability(sourceName).penalty
  }

  sourcePenaltyCount(): number {
    return [...this.sourceReliability.values()].filter((state) => state.penalty < 0.9).length
  }

  totalValidationFailures(): number {
    return this.validationFailures
  }

  queueLength(): number {
    return this.queue.length
  }

  currentTimeoutMs(): number {
    const average = this.rollingAverageLatencyMs()
    if (!average) {
      return this.initialTimeoutMs
    }
    return Math.round(clamp(average * this.timeoutScale, this.minTimeoutMs, this.maxTimeoutMs))
  }

  rollingAverageLatencyMs(): number | undefined {
    if (this.successfulDurationsMs.length === 0) {
      return undefined
    }
    const total = this.successfulDurationsMs.reduce((sum, value) => sum + value, 0)
    return Math.round(total / this.successfulDurationsMs.length)
  }

  private async drain(): Promise<void> {
    if (this.processing) {
      return
    }
    this.processing = true
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()
        if (!item) {
          continue
        }
        const extraction = await this.extract(item)
        if (extraction) {
          this.emit('extraction', item.event, extraction.extraction, extraction.meta)
        }
      }
    } finally {
      this.processing = false
    }
  }

  private async extract(item: CognitiveQueueItem): Promise<{
    extraction: CognitiveExtraction
    meta: CognitiveExtractionMeta
  } | null> {
    const { event, mode } = item
    const timeoutMs = this.currentTimeoutMs()
    const startedAt = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    this.markAttempt(event.sourceName)
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: COGNITIVE_JSON_SCHEMA,
          options: { temperature: 0 },
          messages: [
            {
              role: 'system',
              content: systemPromptFor(mode),
            },
            {
              role: 'user',
              content: `Headline: ${event.title}\nSource summary: ${event.summary}\nRaw text: ${event.rawText.slice(0, 1800)}`,
            },
          ],
        }),
      })
      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`)
      }
      const payload = (await response.json()) as OllamaChatResponse
      const content = typeof payload.message?.content === 'string' ? payload.message.content : ''
      const parsed = JSON.parse(content) as unknown
      const validationIssueCount = countValidationIssues(parsed)
      const extraction = validateCognitiveExtraction(parsed)
      if (!extraction) {
        this.markFailure(event.sourceName, 1)
        return null
      }
      if (validationIssueCount > 0) {
        this.markFailure(event.sourceName, validationIssueCount)
      } else {
        this.markSuccess(event.sourceName)
      }
      const durationMs = Date.now() - startedAt
      this.recordSuccessfulDuration(durationMs)
      const sourcePenalty = this.sourcePenalty(event.sourceName)
      this.successfulExtractions += 1
      return {
        extraction: applySourcePenalty(extraction, sourcePenalty),
        meta: {
          durationMs,
          timeoutMs,
          sourcePenalty,
          validationIssueCount,
          routeMode: mode,
        },
      }
    } catch (error) {
      this.failedExtractions += 1
      this.markFailure(event.sourceName, 1)
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  private recordSuccessfulDuration(durationMs: number): void {
    this.successfulDurationsMs.push(durationMs)
    while (this.successfulDurationsMs.length > this.latencyWindowSize) {
      this.successfulDurationsMs.shift()
    }
  }

  private markAttempt(sourceName: string): void {
    const state = this.getSourceReliability(sourceName)
    state.attempts += 1
    this.recomputePenalty(state)
  }

  private markSuccess(sourceName: string): void {
    const state = this.getSourceReliability(sourceName)
    state.successes += 1
    this.recomputePenalty(state)
  }

  private markFailure(sourceName: string, issueCount: number): void {
    const state = this.getSourceReliability(sourceName)
    state.validationFailures += 1
    state.structuralIssues += Math.max(1, issueCount)
    this.validationFailures += 1
    this.recomputePenalty(state)
  }

  private getSourceReliability(sourceName: string): SourceReliabilityState {
    const key = sourceName || 'unknown-source'
    let state = this.sourceReliability.get(key)
    if (!state) {
      state = { attempts: 0, successes: 0, validationFailures: 0, structuralIssues: 0, penalty: 1 }
      this.sourceReliability.set(key, state)
    }
    return state
  }

  private recomputePenalty(state: SourceReliabilityState): void {
    const attempts = Math.max(1, state.attempts)
    const failureRate = state.validationFailures / attempts
    const structuralPressure = Math.min(0.35, state.structuralIssues * 0.035)
    state.penalty = Number(clamp(1 - failureRate * 0.65 - structuralPressure, 0.25, 1).toFixed(3))
  }
}

function systemPromptFor(mode: CognitiveRouteMode): string {
  const base =
    'You convert public market/news text into strictly structured, non-predictive exposure mapping. Do not give trading advice. Return only JSON matching the schema.'
  if (mode === 'batch-summary') {
    return `${base} This input is a high-velocity batch; summarize only the dominant shared macro theme and the strongest exposure chains.`
  }
  if (mode === 'keyword-priority') {
    return `${base} This input was selected during elevated narrative velocity; ignore weak tangential references and extract only high-conviction exposure links.`
  }
  return base
}

function applySourcePenalty(extraction: CognitiveExtraction, penalty: number): CognitiveExtraction {
  return {
    ...extraction,
    confidence_metrics: {
      ...extraction.confidence_metrics,
      score: clamp(extraction.confidence_metrics.score * penalty, 0, 1),
      primary_uncertainty:
        penalty < 0.95
          ? `${extraction.confidence_metrics.primary_uncertainty} Source reliability penalty applied: ${penalty.toFixed(2)}.`
          : extraction.confidence_metrics.primary_uncertainty,
    },
    downstream_exposure_chain: extraction.downstream_exposure_chain.map((item) => ({
      ...item,
      exposure_weight: clamp(item.exposure_weight * penalty, 0, 1),
    })),
  }
}

function countValidationIssues(input: unknown): number {
  if (!input || typeof input !== 'object') {
    return 1
  }
  const record = input as Record<string, unknown>
  let issues = 0
  if (typeof record.event_summary !== 'string' || record.event_summary.trim() === '') {
    issues += 1
  }
  if (!Array.isArray(record.extracted_entities)) {
    issues += 1
  }
  if (!Array.isArray(record.downstream_exposure_chain)) {
    issues += 1
  } else {
    for (const item of record.downstream_exposure_chain) {
      if (!item || typeof item !== 'object') {
        issues += 1
        continue
      }
      const chain = item as Record<string, unknown>
      const weight = typeof chain.exposure_weight === 'number' ? chain.exposure_weight : Number(chain.exposure_weight)
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
        issues += 1
      }
    }
  }
  if (!record.confidence_metrics || typeof record.confidence_metrics !== 'object') {
    issues += 1
  }
  return issues
}
