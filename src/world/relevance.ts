import type { MaterialityVector } from './model'

export interface MaterialityWeights {
  impact: number
  confidence: number
  novelty: number
  exposure: number
  velocity: number
  persistence: number
  centrality: number
  geographicRelevance: number
  profileRelevance: number
}

export const DEFAULT_MATERIALITY_WEIGHTS: MaterialityWeights = {
  impact: 1.35,
  confidence: 1.5,
  novelty: 0.95,
  exposure: 1.25,
  velocity: 0.75,
  persistence: 0.65,
  centrality: 1.05,
  geographicRelevance: 0.7,
  profileRelevance: 1.15,
}

const COMPONENTS: (keyof MaterialityVector)[] = [
  'impact',
  'confidence',
  'novelty',
  'exposure',
  'velocity',
  'persistence',
  'centrality',
  'geographicRelevance',
  'profileRelevance',
]

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function normalizeMaterialityVector(
  vector: MaterialityVector,
): MaterialityVector {
  return COMPONENTS.reduce(
    (result, key) => {
      result[key] = clampUnit(vector[key])
      return result
    },
    { ...vector },
  )
}

export interface MaterialityScore {
  score: number
  components: MaterialityVector
  weightedComponents: Record<keyof MaterialityVector, number>
}

/**
 * Explainable materiality score.
 *
 * This is ranking context, never evidence. It cannot increase source confidence
 * and must not hide stale/conflicted/unknown evidence states.
 */
export function scoreMateriality(
  vector: MaterialityVector,
  weights: MaterialityWeights = DEFAULT_MATERIALITY_WEIGHTS,
): MaterialityScore {
  const components = normalizeMaterialityVector(vector)
  const weightedComponents = {} as Record<keyof MaterialityVector, number>

  let numerator = 0
  let denominator = 0

  for (const key of COMPONENTS) {
    const weight = Math.max(0, weights[key])
    const contribution = components[key] * weight
    weightedComponents[key] = contribution
    numerator += contribution
    denominator += weight
  }

  return {
    score: denominator === 0 ? 0 : numerator / denominator,
    components,
    weightedComponents,
  }
}
