import { afterEach, describe, expect, it, vi } from 'vitest'
import { CognitiveTaskManager } from '../electron/ingest/cognitiveTaskManager'
import { DataIngestOrchestrator } from '../electron/ingest/dataIngestOrchestrator'
import type { ExposureMatch, NormalizedNewsEvent } from '../electron/ingest/types'
import type { IntelPersistence } from '../electron/persistence'
import type { RealtimeService } from '../electron/realtimeService'
import { GraphMutator } from '../src/engine/graphMutator'
import type { CognitiveExtraction } from '../src/engine/cognitiveSchema'
import { PROVENANCE_VALUES, normalizeProvenance } from '../src/provenance'

type FetchCall = [input: RequestInfo | URL, init?: RequestInit]

const baseExtraction: CognitiveExtraction = {
  event_summary: 'Taiwan headline maps into semiconductor exposure',
  primary_macro_theme: 'Supply Chain Disruption',
  extracted_entities: [{ name: 'Taiwan', type: 'Location' }],
  downstream_exposure_chain: [
    {
      node_name: 'NVDA',
      exposure_direction: 'Volatility_Expansion',
      exposure_weight: 0.5,
      transmission_mechanism: 'Advanced node supply concentration',
    },
  ],
  confidence_metrics: {
    score: 0.8,
    primary_uncertainty: 'Public source metadata only.',
  },
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('adaptive cognitive parser', () => {
  it('uses rolling successful latency for timeout and respects min/max clamps', async () => {
    const fast = new CognitiveTaskManager({
      enabled: true,
      requestTimeoutMs: 100,
      minTimeoutMs: 50,
      maxTimeoutMs: 200,
      timeoutScale: 1.5,
    })
    stubOllamaSequence([{ extraction: baseExtraction, delayMs: 5 }])

    fast.enqueue(newsEvent('CNBC Finance RSS'))
    await waitFor(() => fast.status().successfulExtractions === 1)

    expect(fast.status().rollingAverageLatencyMs).toBeGreaterThan(0)
    expect(fast.currentTimeoutMs()).toBe(50)

    const slow = new CognitiveTaskManager({
      enabled: true,
      requestTimeoutMs: 120,
      minTimeoutMs: 5,
      maxTimeoutMs: 30,
      timeoutScale: 1.5,
    })
    stubOllamaSequence([{ extraction: baseExtraction, delayMs: 40 }])

    slow.enqueue(newsEvent('CNBC Finance RSS'))
    await waitFor(() => slow.status().successfulExtractions === 1)

    expect(slow.currentTimeoutMs()).toBe(30)
  })

  it('malformed, slow, and unavailable Ollama fail closed with no graph mutation', async () => {
    const graph = new GraphMutator()
    const manager = new CognitiveTaskManager({
      enabled: true,
      requestTimeoutMs: 20,
      minTimeoutMs: 5,
      maxTimeoutMs: 20,
    })
    manager.on('extraction', (_event, extraction) => {
      graph.upsertConnection(extraction)
    })

    stubOllamaSequence([
      { rawContent: '{}', delayMs: 0 },
      { extraction: baseExtraction, delayMs: 100 },
      { error: new Error('ollama unavailable'), delayMs: 0 },
    ])

    manager.enqueue(newsEvent('Noisy RSS'))
    manager.enqueue(newsEvent('Slow RSS'))
    manager.enqueue(newsEvent('Offline RSS'))

    await waitFor(() => manager.status().failedExtractions >= 2 && manager.status().validationFailures >= 3)

    expect(graph.snapshot().edgeCount).toBe(0)
    expect(graph.snapshot().nodeCount).toBe(0)
  })

  it('penalizes unreliable sources and scales down future confidence and exposure weights', async () => {
    const manager = new CognitiveTaskManager({ enabled: true, requestTimeoutMs: 100, minTimeoutMs: 5, maxTimeoutMs: 100 })
    const malformedWeight: CognitiveExtraction = {
      ...baseExtraction,
      downstream_exposure_chain: [{ ...baseExtraction.downstream_exposure_chain[0], exposure_weight: 2 }],
    }
    stubOllamaSequence([
      { extraction: malformedWeight, delayMs: 0 },
      { extraction: baseExtraction, delayMs: 0 },
    ])

    const emissions: CognitiveExtraction[] = []
    manager.on('extraction', (_event, extraction) => emissions.push(extraction))

    manager.enqueue(newsEvent('Low Quality RSS'))
    await waitFor(() => emissions.length === 1)
    manager.enqueue(newsEvent('Low Quality RSS'))
    await waitFor(() => emissions.length === 2)

    const second = emissions[1]
    expect(manager.sourcePenalty('Low Quality RSS')).toBeLessThan(1)
    expect(second.confidence_metrics.score).toBeLessThan(baseExtraction.confidence_metrics.score)
    expect(second.downstream_exposure_chain[0].exposure_weight).toBeLessThan(
      baseExtraction.downstream_exposure_chain[0].exposure_weight,
    )
  })
})

describe('narrative velocity routing', () => {
  it('switches low, medium, and high parser modes', () => {
    vi.stubEnv('ATLASZ_ENABLE_OLLAMA', '1')
    vi.stubEnv('ATLASZ_NARRATIVE_MEDIUM_VELOCITY', '3')
    vi.stubEnv('ATLASZ_NARRATIVE_HIGH_VELOCITY', '6')
    const orchestrator = newOrchestrator()
    const harness = orchestrator as unknown as OrchestratorHarness
    const now = Date.now()

    harness.recordNarrativeInput(1, now)
    expect(orchestrator.status().cognitiveMode).toBe('deep')

    harness.recordNarrativeInput(2, now + 1)
    expect(orchestrator.status().cognitiveMode).toBe('keyword-priority')

    harness.recordNarrativeInput(3, now + 2)
    expect(orchestrator.status().cognitiveMode).toBe('batch-summary')
  })

  it('skips high-velocity weak events and batches high-conviction events', () => {
    vi.stubEnv('ATLASZ_ENABLE_OLLAMA', '1')
    vi.stubEnv('ATLASZ_NARRATIVE_MEDIUM_VELOCITY', '2')
    vi.stubEnv('ATLASZ_NARRATIVE_HIGH_VELOCITY', '3')
    const orchestrator = newOrchestrator()
    const harness = orchestrator as unknown as OrchestratorHarness
    const now = Date.now()
    harness.recordNarrativeInput(4, now)

    harness.routeCognitiveEvent(newsEvent('Reuters Business'), [exposure(0.2)])
    expect(orchestrator.status().cognitiveSkippedCount).toBe(1)

    harness.routeCognitiveEvent(newsEvent('Reuters Business'), [exposure(0.9)])
    expect(orchestrator.status().cognitiveBatchedCount).toBe(1)
    expect(harness.cognitiveBatch.length).toBe(1)
  })
})

describe('temporal graph decay and provenance', () => {
  it('decays and purges model-inferred edges by half-life and silence rules', () => {
    const graph = new GraphMutator({
      now: () => 0,
      halfLifeMs: 1_000,
      maxSilenceMs: 5_000,
      purgeFloor: 0.01,
    })
    graph.upsertConnection({
      ...baseExtraction,
      extracted_entities: [],
      downstream_exposure_chain: [{ ...baseExtraction.downstream_exposure_chain[0], exposure_weight: 1 }],
      confidence_metrics: { ...baseExtraction.confidence_metrics, score: 1 },
    })

    graph.applyTemporalEdgeDecay(1_000)
    const decayed = graph.snapshot().edges[0]
    expect(decayed.provenance).toBe('model-inferred')
    expect(decayed.weight).toBeGreaterThan(0.49)
    expect(decayed.weight).toBeLessThan(0.51)

    graph.applyTemporalEdgeDecay(6_001)
    expect(graph.snapshot().edgeCount).toBe(0)
  })

  it('does not decay or purge verified/local-derived edges with inferred-edge logic', () => {
    const graph = new GraphMutator({
      now: () => 0,
      halfLifeMs: 1_000,
      maxSilenceMs: 1_000,
      purgeFloor: 0.9,
    })
    graph.upsertStaticEdge({
      source: { id: 'seed:event', label: 'Seed event', kind: 'event' },
      target: { id: 'asset:SPY', label: 'SPY', kind: 'asset' },
      relation: 'seeded relationship',
      weight: 0.7,
      provenance: 'local-derived',
    })
    graph.upsertStaticEdge({
      source: { id: 'verified:event', label: 'Verified event', kind: 'event' },
      target: { id: 'asset:QQQ', label: 'QQQ', kind: 'asset' },
      relation: 'verified relationship',
      weight: 0.8,
      provenance: 'verified',
    })

    graph.applyTemporalEdgeDecay(100_000)
    const edges = graph.snapshot().edges
    expect(edges).toHaveLength(2)
    expect(edges.map((edge) => edge.weight)).toEqual([0.7, 0.8])
  })

  it('exposes a canonical provenance contract and normalizes legacy labels', () => {
    expect(PROVENANCE_VALUES).toEqual([
      'simulated',
      'public-unauthenticated',
      'local-derived',
      'local-model',
      'model-inferred',
      'auth-gated',
      'verified',
    ])
    expect(normalizeProvenance('public unauthenticated')).toBe('public-unauthenticated')
    expect(normalizeProvenance('authenticated')).toBe('auth-gated')
    expect(normalizeProvenance('model_inferred')).toBe('model-inferred')
  })
})

type OrchestratorHarness = DataIngestOrchestrator & {
  recordNarrativeInput: (count: number, observedAt: number) => void
  routeCognitiveEvent: (event: NormalizedNewsEvent, matches: ExposureMatch[]) => void
  cognitiveBatch: NormalizedNewsEvent[]
}

function newsEvent(sourceName: string): NormalizedNewsEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    title: 'Taiwan semiconductor headline',
    sourceName,
    sourceUrl: 'https://example.test/news',
    sourceTrust: 'public unauthenticated',
    publishedAt: Date.now(),
    observedAt: Date.now(),
    sector: 'Macro',
    summary: 'Semiconductor supply chain headline',
    rawText: 'Taiwan semiconductor NVDA SOXX supply chain headline',
  }
}

function exposure(confidence: number): ExposureMatch {
  return {
    eventId: 'event-id',
    keyword: 'taiwan',
    affectedTickers: ['NVDA'],
    confidence,
    reason: 'test exposure',
  }
}

function newOrchestrator(): DataIngestOrchestrator {
  return new DataIngestOrchestrator({
    persistence: fakePersistence(),
    realtime: { ingestExternalBatch: () => undefined } as unknown as RealtimeService,
    enabled: true,
  })
}

function fakePersistence(): IntelPersistence {
  return {
    mode: 'json-fallback',
    listBriefs: () => [],
    saveBrief: () => undefined,
    listHeadlines: () => [],
    saveHeadline: () => undefined,
    listDecisions: () => [],
    getDecision: () => null,
    saveDecision: () => undefined,
    deleteDecision: () => undefined,
    decisionsDueForReview: () => [],
    saveMarketTick: () => undefined,
    saveAttentionBatch: () => undefined,
    saveEntityEdge: () => undefined,
    saveSignalEvent: () => undefined,
    saveRealtimeFrame: () => undefined,
    listRealtimeFrames: () => [],
    audit: () => undefined,
    close: () => undefined,
  }
}

function stubOllamaSequence(sequence: Array<{ extraction?: CognitiveExtraction; rawContent?: string; error?: Error; delayMs: number }>): void {
  let index = 0
  const fetchMock = vi.fn<FetchCall, Promise<Response>>((_input, init) => {
    const item = sequence[Math.min(index, sequence.length - 1)]
    index += 1
    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal
      const timer = setTimeout(() => {
        if (item.error) {
          reject(item.error)
          return
        }
        const content = item.rawContent ?? JSON.stringify(item.extraction ?? baseExtraction)
        resolve(new Response(JSON.stringify({ message: { content } }), { status: 200 }))
      }, item.delayMs)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('aborted'))
      })
    })
  })
  vi.stubGlobal('fetch', fetchMock)
}

async function waitFor(assertion: () => boolean, timeoutMs = 1_000): Promise<void> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (assertion()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('Timed out waiting for assertion')
}
