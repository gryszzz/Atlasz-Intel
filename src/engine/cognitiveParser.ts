/**
 * CognitiveParser — the local-model parser bridge.
 *
 *   local text / headline  →  Ollama (local LLM)  →  defensive validation
 *                          →  validated CognitiveExtraction  →  GraphMutator
 *
 * Design contract:
 *  - FULLY ISOLATED: no Electron / React / UI imports. Uses built-in `fetch`
 *    (no new network dependency). The `fetch` impl is injectable for tests.
 *  - FAIL CLOSED: if Ollama is missing, down, slow, returns a non-200, an empty
 *    body, or non-JSON / schema-invalid content, `extract` resolves to `null`
 *    and the caller keeps its existing seed/simulator graph untouched. It never
 *    throws.
 *  - HONEST PROVENANCE: a successful result is wrapped in an envelope tagged
 *    `source: 'local-model'` / `provenance: 'model-inferred'` (UNVERIFIED).
 *  - VALIDATED ONLY: every payload passes `validateCognitiveExtraction()` before
 *    it can reach `GraphMutator`.
 */
import { COGNITIVE_JSON_SCHEMA, validateCognitiveExtraction, type CognitiveExtraction } from './cognitiveSchema'
import type { GraphMutator, MutationResult } from './graphMutator'

export const COGNITIVE_SYSTEM_PROMPT = `You are the primary cognitive node of Atlasz Intel, a local financial intelligence engine. Map the physical and macro plumbing hidden behind unstructured text.

Rules:
1. NO PROSE. Output must start with '{' and end with '}'. No preamble.
2. Adhere 100% to the enforced JSON schema. Every field is required. Do not invent keys.
3. Look past hype: identify structural dependencies — sectors, raw materials, shipping lanes, and corporate anchors in the blast radius.
4. Be conservative with exposure weights. A direct refinery hit is ~1.0 exposure to its equity; a secondary consumer-goods tariff is ~0.3.
5. Set confidence by verifiable facts in the text versus speculative narrative. State the biggest remaining uncertainty.`

export type IngestionPayload = {
  headline: string
  source: string
  timestamp?: number
}

/** A successful, validated extraction with honest provenance attached. */
export type ExtractionEnvelope = {
  extraction: CognitiveExtraction
  /** Always 'local-model' — produced by a local LLM, not a verified feed. */
  source: 'local-model'
  /** Always 'model-inferred' — UNVERIFIED. */
  provenance: 'model-inferred'
  model: string
  observedAt: number
  inputHeadline: string
  inputSource: string
}

export type CognitiveParserOptions = {
  /** Ollama chat endpoint. Default http://localhost:11434/api/chat */
  endpoint?: string
  /** Model tag. Default 'qwen2.5-coder:7b'. */
  model?: string
  /** Hard timeout; a slow model fails closed. Default 20000ms. */
  timeoutMs?: number
  /** Injectable fetch (defaults to global fetch). */
  fetchImpl?: typeof fetch
  /** Injectable clock for tests. */
  now?: () => number
  /** Optional logger; defaults to console.warn. Set to a no-op to silence. */
  warn?: (message: string, detail?: unknown) => void
}

type OllamaChatResponse = {
  message?: { content?: unknown }
}

export class CognitiveParser {
  private readonly endpoint: string
  private readonly model: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch | null
  private readonly now: () => number
  private readonly warn: (message: string, detail?: unknown) => void

  constructor(options: CognitiveParserOptions = {}) {
    this.endpoint = options.endpoint ?? 'http://localhost:11434/api/chat'
    this.model = options.model ?? 'qwen2.5-coder:7b'
    this.timeoutMs = options.timeoutMs ?? 20_000
    this.fetchImpl = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : null)
    this.now = options.now ?? Date.now
    this.warn = options.warn ?? ((message, detail) => console.warn(`[atlasz] cognitive parser: ${message}`, detail ?? ''))
  }

  /**
   * Run extraction on one input. Resolves to a validated envelope, or `null` on
   * ANY failure (unavailable, timeout, non-200, empty, non-JSON, schema-invalid).
   * Never throws.
   */
  async extract(payload: IngestionPayload): Promise<ExtractionEnvelope | null> {
    const text = typeof payload?.headline === 'string' ? payload.headline.trim() : ''
    if (text === '') {
      return null
    }
    if (!this.fetchImpl) {
      this.warn('fetch is unavailable in this runtime; failing closed')
      return null
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: COGNITIVE_JSON_SCHEMA,
          options: { temperature: 0, top_p: 0.1 },
          messages: [
            { role: 'system', content: COGNITIVE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Analyze the following market intelligence payload.\n\nTEXT: "${text}"\nSOURCE_TRAIL: ${payload.source ?? 'unknown'}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        this.warn(`ollama returned non-200 (${response.status}); failing closed`)
        return null
      }

      const data = (await response.json()) as OllamaChatResponse
      const content = typeof data?.message?.content === 'string' ? data.message.content.trim() : ''
      if (content === '') {
        this.warn('ollama returned an empty response; failing closed')
        return null
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        this.warn('ollama content was not valid JSON; failing closed')
        return null
      }

      const extraction = validateCognitiveExtraction(parsed)
      if (!extraction) {
        this.warn('extraction failed schema validation; failing closed')
        return null
      }

      return {
        extraction,
        source: 'local-model',
        provenance: 'model-inferred',
        model: this.model,
        observedAt: payload.timestamp ?? this.now(),
        inputHeadline: text,
        inputSource: payload.source ?? 'unknown',
      }
    } catch (error) {
      // AbortError (timeout) and network errors both land here — fail closed.
      this.warn('ollama request failed (down/timeout/network); failing closed', error instanceof Error ? error.message : error)
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Best-effort availability probe (GET /api/tags). Never throws; returns false
   * on any error. Useful for an honest "local model: available/unavailable"
   * label without blocking the app.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.fetchImpl) {
      return false
    }
    const tagsEndpoint = this.endpoint.replace(/\/api\/chat\/?$/, '/api/tags')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.min(this.timeoutMs, 2_000))
    try {
      const response = await this.fetchImpl(tagsEndpoint, { method: 'GET', signal: controller.signal })
      return response.ok
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Convenience bridge: extract and, only on a valid envelope, apply it to a
   * GraphMutator. Returns the mutation result, or `null` if nothing was applied
   * (so the existing graph is preserved untouched on any failure).
   *
   * This is the plug-in point for the closed loop; it deliberately does NOT
   * touch any UI or process wiring.
   */
  async ingestInto(mutator: GraphMutator, payload: IngestionPayload): Promise<MutationResult | null> {
    const envelope = await this.extract(payload)
    if (!envelope) {
      return null
    }
    return mutator.upsertConnection(envelope.extraction)
  }
}
