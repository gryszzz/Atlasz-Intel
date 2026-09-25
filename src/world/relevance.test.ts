import { describe, expect, it } from 'vitest'
import { normalizeMaterialityVector, scoreMateriality } from './relevance'

describe('Atlasz World materiality scoring', () => {
  it('clamps components to the unit interval', () => {
    const normalized = normalizeMaterialityVector({
      impact: 2,
      confidence: -1,
      novelty: 0.5,
      exposure: Number.NaN,
      velocity: 0.25,
      persistence: 0.5,
      centrality: 0.5,
      geographicRelevance: 0.5,
      profileRelevance: 0.5,
    })

    expect(normalized.impact).toBe(1)
    expect(normalized.confidence).toBe(0)
    expect(normalized.exposure).toBe(0)
    expect(normalized.novelty).toBe(0.5)
  })

  it('keeps the score explainable through weighted components', () => {
    const result = scoreMateriality(
      {
        impact: 1,
        confidence: 1,
        novelty: 0,
        exposure: 0,
        velocity: 0,
        persistence: 0,
        centrality: 0,
        geographicRelevance: 0,
        profileRelevance: 0,
      },
      {
        impact: 1,
        confidence: 1,
        novelty: 0,
        exposure: 0,
        velocity: 0,
        persistence: 0,
        centrality: 0,
        geographicRelevance: 0,
        profileRelevance: 0,
      },
    )

    expect(result.score).toBe(1)
    expect(result.weightedComponents.impact).toBe(1)
    expect(result.weightedComponents.confidence).toBe(1)
  })

  it('returns zero when every ranking weight is disabled', () => {
    const result = scoreMateriality(
      {
        impact: 1,
        confidence: 1,
        novelty: 1,
        exposure: 1,
        velocity: 1,
        persistence: 1,
        centrality: 1,
        geographicRelevance: 1,
        profileRelevance: 1,
      },
      {
        impact: 0,
        confidence: 0,
        novelty: 0,
        exposure: 0,
        velocity: 0,
        persistence: 0,
        centrality: 0,
        geographicRelevance: 0,
        profileRelevance: 0,
      },
    )

    expect(result.score).toBe(0)
  })
})
