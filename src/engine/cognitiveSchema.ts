/**
 * Cognitive extraction schema for the Adaptive Cognitive Layer.
 *
 * A local LLM (e.g. Ollama qwen2.5-coder) maps an unstructured headline into a
 * structured exposure payload. `COGNITIVE_JSON_SCHEMA` is passed to Ollama's
 * `format` field to constrain decoding; `validateCognitiveExtraction` is a
 * defensive runtime guard so a malformed payload can never crash the mutation
 * loop (it clamps, filters, and returns null on irrecoverable input).
 *
 * IMPORTANT (honesty): everything produced here is *model-inferred*, i.e.
 * unverified. It must be labeled as such wherever it surfaces — it is never
 * presented as verified live intelligence.
 */

export const MACRO_THEMES = [
  'Geopolitical Choke Point',
  'Supply Chain Disruption',
  'Monetary Policy Shocks',
  'Tariff and Trade War Escalation',
  'Regulatory Constraints',
  'Resource Scarcity',
  'Commodity Shock',
] as const
export type MacroTheme = (typeof MACRO_THEMES)[number]

export const ENTITY_TYPES = ['Sovereign', 'Location', 'Commodity', 'Corporation', 'Infrastructure'] as const
export type CognitiveEntityType = (typeof ENTITY_TYPES)[number]

export const EXPOSURE_DIRECTIONS = ['Bullish_Catalyst', 'Bearish_Headwind', 'Volatility_Expansion'] as const
export type ExposureDirection = (typeof EXPOSURE_DIRECTIONS)[number]

export type CognitiveEntity = {
  name: string
  type: CognitiveEntityType
}

export type DownstreamExposure = {
  node_name: string
  exposure_direction: ExposureDirection
  /** Systemic exposure scale in [0,1]; 1.0 direct, 0.1 diluted/secondary. */
  exposure_weight: number
  transmission_mechanism: string
}

export type CognitiveExtraction = {
  event_summary: string
  primary_macro_theme: MacroTheme
  extracted_entities: CognitiveEntity[]
  downstream_exposure_chain: DownstreamExposure[]
  confidence_metrics: {
    /** Confidence in [0,1] based on verifiable facts vs speculative narrative. */
    score: number
    primary_uncertainty: string
  }
}

/** JSON Schema for Ollama's `format` parameter (constrains the decode tree). */
export const COGNITIVE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    event_summary: { type: 'string' },
    primary_macro_theme: { type: 'string', enum: [...MACRO_THEMES] },
    extracted_entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: [...ENTITY_TYPES] },
        },
        required: ['name', 'type'],
      },
    },
    downstream_exposure_chain: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          node_name: { type: 'string' },
          exposure_direction: { type: 'string', enum: [...EXPOSURE_DIRECTIONS] },
          exposure_weight: { type: 'number', minimum: 0, maximum: 1 },
          transmission_mechanism: { type: 'string' },
        },
        required: ['node_name', 'exposure_direction', 'exposure_weight', 'transmission_mechanism'],
      },
    },
    confidence_metrics: {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 1 },
        primary_uncertainty: { type: 'string' },
      },
      required: ['score', 'primary_uncertainty'],
    },
  },
  required: [
    'event_summary',
    'primary_macro_theme',
    'extracted_entities',
    'downstream_exposure_chain',
    'confidence_metrics',
  ],
} as const

function clamp01(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) {
    return 0
  }
  return Math.min(1, Math.max(0, n))
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback
}

/**
 * Defensive parse: returns a normalized extraction, or null when the core
 * fields are unusable. Tolerant of small model deviations (clamps numbers,
 * coerces enums to a safe fallback, drops malformed chain/entity items).
 */
export function validateCognitiveExtraction(input: unknown): CognitiveExtraction | null {
  if (!input || typeof input !== 'object') {
    return null
  }
  const raw = input as Record<string, unknown>

  const event_summary = asString(raw.event_summary)
  if (event_summary === '') {
    return null
  }

  const entitiesRaw = Array.isArray(raw.extracted_entities) ? raw.extracted_entities : []
  const extracted_entities: CognitiveEntity[] = entitiesRaw
    .map((item): CognitiveEntity | null => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const name = asString(record.name)
      if (name === '') {
        return null
      }
      return { name, type: oneOf(record.type, ENTITY_TYPES, 'Infrastructure') }
    })
    .filter((item): item is CognitiveEntity => item !== null)

  const chainRaw = Array.isArray(raw.downstream_exposure_chain) ? raw.downstream_exposure_chain : []
  const downstream_exposure_chain: DownstreamExposure[] = chainRaw
    .map((item): DownstreamExposure | null => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const node_name = asString(record.node_name)
      if (node_name === '') {
        return null
      }
      return {
        node_name,
        exposure_direction: oneOf(record.exposure_direction, EXPOSURE_DIRECTIONS, 'Volatility_Expansion'),
        exposure_weight: clamp01(record.exposure_weight),
        transmission_mechanism: asString(record.transmission_mechanism),
      }
    })
    .filter((item): item is DownstreamExposure => item !== null)

  const confidenceRaw =
    raw.confidence_metrics && typeof raw.confidence_metrics === 'object'
      ? (raw.confidence_metrics as Record<string, unknown>)
      : {}

  return {
    event_summary,
    primary_macro_theme: oneOf(raw.primary_macro_theme, MACRO_THEMES, 'Supply Chain Disruption'),
    extracted_entities,
    downstream_exposure_chain,
    confidence_metrics: {
      score: clamp01(confidenceRaw.score),
      primary_uncertainty: asString(confidenceRaw.primary_uncertainty),
    },
  }
}
