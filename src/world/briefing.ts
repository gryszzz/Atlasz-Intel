import type { EventCluster } from './eventClustering'
import { scoreConvergence } from './convergence'
import type { WorldEvent } from './model'
import { scoreMateriality } from './relevance'

export type WorldBriefItem = {
  clusterId: string
  primaryEventId: string
  headline: string
  score: number
  materialityScore: number
  convergenceScore: number
  modes: string[]
  entityIds: string[]
  independentSourceCount: number
  basis: WorldEvent['basis']
  updatedAt: string
}

export type WorldBrief = {
  generatedAt: string
  consideredEventCount: number
  consideredClusterCount: number
  items: WorldBriefItem[]
}

export function buildWorldBrief(
  events: WorldEvent[],
  clusters: EventCluster[],
  limit = 5,
): WorldBrief {
  const eventsById = new Map(events.map((event) => [event.id, event]))

  const items = clusters
    .map((cluster): WorldBriefItem | null => {
      const primary = eventsById.get(cluster.primaryEventId)
      if (!primary) return null

      const materialityScore = scoreMateriality(primary.materiality).score
      const convergence = scoreConvergence(cluster, eventsById)
      const score = materialityScore * 0.72 + convergence.score * 0.28

      return {
        clusterId: cluster.id,
        primaryEventId: primary.id,
        headline: primary.title,
        score,
        materialityScore,
        convergenceScore: convergence.score,
        modes: cluster.modes,
        entityIds: cluster.entityIds,
        independentSourceCount: cluster.independentSourceCount,
        basis: primary.basis,
        updatedAt: cluster.updatedAt,
      }
    })
    .filter((item): item is WorldBriefItem => Boolean(item))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
    })
    .slice(0, Math.max(0, limit))

  return {
    generatedAt: new Date().toISOString(),
    consideredEventCount: events.length,
    consideredClusterCount: clusters.length,
    items,
  }
}
