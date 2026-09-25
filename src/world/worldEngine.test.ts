import { describe, expect, it } from 'vitest'
import type { WorldEvent } from './model'
import { clusterWorldEvents } from './eventClustering'
import { buildSpatialCells, haversineKm } from './spatial'

function event(overrides: Partial<WorldEvent> & Pick<WorldEvent, 'id'>): WorldEvent {
  return {
    id: overrides.id,
    title: overrides.title ?? overrides.id,
    summary: overrides.summary ?? '',
    basis: overrides.basis ?? 'observed',
    mode: overrides.mode ?? 'world',
    firstObservedAt: overrides.firstObservedAt ?? '2026-09-25T12:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-09-25T12:00:00Z',
    location: overrides.location,
    entityIds: overrides.entityIds ?? [],
    observationIds: overrides.observationIds ?? [overrides.id],
    materiality: overrides.materiality ?? {
      impact: 0.5,
      confidence: 0.8,
      novelty: 0.5,
      exposure: 0.4,
      velocity: 0.3,
      persistence: 0.3,
      centrality: 0.3,
      geographicRelevance: 0.5,
      profileRelevance: 0,
    },
    tags: overrides.tags ?? [],
  }
}

describe('Atlasz World spatial engine', () => {
  it('computes realistic great-circle distance', () => {
    const distance = haversineKm(
      { lat: 40.7128, lon: -74.006 },
      { lat: 51.5074, lon: -0.1278 },
    )
    expect(distance).toBeGreaterThan(5500)
    expect(distance).toBeLessThan(5700)
  })

  it('buckets real geospatial events and preserves quiet unknowns', () => {
    const cells = buildSpatialCells([
      event({ id: 'a', location: { lat: 40.7, lon: -74 } }),
      event({ id: 'b', location: { lat: 41, lon: -73.8 } }),
      event({ id: 'unknown' }),
    ])

    expect(cells).toHaveLength(1)
    expect(cells[0].eventCount).toBe(2)
    expect(cells[0].eventIds).not.toContain('unknown')
  })
})

describe('Atlasz World event clustering', () => {
  it('clusters temporally related events sharing an entity across domains', () => {
    const clusters = clusterWorldEvents([
      event({
        id: 'policy',
        mode: 'policy',
        entityIds: ['TSMC'],
        firstObservedAt: '2026-09-25T12:00:00Z',
      }),
      event({
        id: 'capital',
        mode: 'capital',
        entityIds: ['TSMC'],
        firstObservedAt: '2026-09-25T13:00:00Z',
      }),
      event({
        id: 'unrelated',
        mode: 'risk',
        entityIds: ['Other'],
        firstObservedAt: '2026-09-20T13:00:00Z',
      }),
    ])

    expect(clusters).toHaveLength(2)
    const tsmc = clusters.find((cluster) => cluster.entityIds.includes('TSMC'))
    expect(tsmc?.eventIds).toHaveLength(2)
    expect(tsmc?.convergenceDomains).toEqual(expect.arrayContaining(['policy', 'capital']))
  })

  it('does not inflate independence for explicit syndicated lineage', () => {
    const clusters = clusterWorldEvents([
      event({ id: 'a', entityIds: ['X'], observationIds: ['lineage:wire-a:1'] }),
      event({ id: 'b', entityIds: ['X'], observationIds: ['lineage:wire-a:2'] }),
    ])

    expect(clusters[0].independentSourceCount).toBe(1)
  })
})
