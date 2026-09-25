import type { EventCluster } from './eventClustering'
import type { WorldEvent } from './model'

export type ConvergenceSignal = {
  clusterId: string
  domains: string[]
  independentSourceCount: number
  entityCount: number
  score: number
  explanation: string[]
}

/**
 * Local-derived cross-domain convergence. This is ranking context only and never
 * upgrades the truth status of any underlying event.
 */
export function scoreConvergence(
  cluster: EventCluster,
  eventsById: Map<string, WorldEvent>,
): ConvergenceSignal {
  const events = cluster.eventIds
    .map((id) => eventsById.get(id))
    .filter((event): event is WorldEvent => Boolean(event))

  const domains = [...new Set(events.map((event) => event.mode))]
  const sourceFactor = Math.min(1, cluster.independentSourceCount / 4)
  const domainFactor = Math.min(1, domains.length / 4)
  const entityFactor = Math.min(1, cluster.entityIds.length / 8)
  const confidenceFactor =
    events.length === 0
      ? 0
      : events.reduce((sum, event) => sum + event.materiality.confidence, 0) / events.length

  const score =
    sourceFactor * 0.3 +
    domainFactor * 0.3 +
    entityFactor * 0.15 +
    confidenceFactor * 0.25

  const explanation = [
    `${cluster.independentSourceCount} independent source group(s)`,
    `${domains.length} domain(s): ${domains.join(', ') || 'unknown'}`,
    `${cluster.entityIds.length} resolved entity connection(s)`,
    `mean evidence confidence ${Math.round(confidenceFactor * 100)}%`,
  ]

  return {
    clusterId: cluster.id,
    domains,
    independentSourceCount: cluster.independentSourceCount,
    entityCount: cluster.entityIds.length,
    score,
    explanation,
  }
}
