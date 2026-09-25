import { describe, expect, it } from 'vitest'
import type { EventCluster } from './eventClustering'
import type { WorldEvent } from './model'
import { buildWorldBrief } from './briefing'

function worldEvent(
  id: string,
  impact: number,
  confidence: number,
  mode: WorldEvent['mode'] = 'world',
): WorldEvent {
  return {
    id,
    title: id,
    summary: '',
    basis: 'observed',
    mode,
    firstObservedAt: '2026-09-25T12:00:00Z',
    updatedAt: '2026-09-25T12:00:00Z',
    entityIds: [id],
    observationIds: [id],
    materiality: {
      impact,
      confidence,
      novelty: 0.5,
      exposure: 0.5,
      velocity: 0.5,
      persistence: 0.5,
      centrality: 0.5,
      geographicRelevance: 0.5,
      profileRelevance: 0.5,
    },
  }
}

function cluster(id: string, eventIds: string[], modes: string[]): EventCluster {
  return {
    id,
    primaryEventId: eventIds[0],
    eventIds,
    title: id,
    modes,
    entityIds: eventIds,
    sourceObservationIds: eventIds,
    firstObservedAt: '2026-09-25T12:00:00Z',
    updatedAt: '2026-09-25T12:00:00Z',
    sourceIndependenceGroups: eventIds,
    independentSourceCount: eventIds.length,
    convergenceDomains: modes.length > 1 ? modes : [],
  }
}

describe('Atlasz World briefing', () => {
  it('keeps strong underlying materiality ahead of weak noisy clusters', () => {
    const events = [
      worldEvent('strong', 1, 1, 'policy'),
      worldEvent('weak-a', 0.1, 0.2, 'world'),
      worldEvent('weak-b', 0.1, 0.2, 'capital'),
      worldEvent('weak-c', 0.1, 0.2, 'trade'),
    ]

    const brief = buildWorldBrief(
      events,
      [
        cluster('strong-cluster', ['strong'], ['policy']),
        cluster('weak-cluster', ['weak-a', 'weak-b', 'weak-c'], ['world', 'capital', 'trade']),
      ],
      2,
    )

    expect(brief.items[0].primaryEventId).toBe('strong')
  })

  it('honors the requested brief limit', () => {
    const events = [worldEvent('a', 1, 1), worldEvent('b', 0.8, 0.8)]
    const brief = buildWorldBrief(
      events,
      [cluster('a-cluster', ['a'], ['world']), cluster('b-cluster', ['b'], ['world'])],
      1,
    )

    expect(brief.items).toHaveLength(1)
  })
})
