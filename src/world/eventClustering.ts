import type { WorldEvent } from './model'
import { haversineKm } from './spatial'

export type EventCluster = {
  id: string
  primaryEventId: string
  eventIds: string[]
  title: string
  modes: string[]
  entityIds: string[]
  sourceObservationIds: string[]
  firstObservedAt: string
  updatedAt: string
  sourceIndependenceGroups: string[]
  independentSourceCount: number
  convergenceDomains: string[]
}

export type ClusterOptions = {
  maxDistanceKm?: number
  maxTimeGapMs?: number
}

const DEFAULT_DISTANCE_KM = 350
const DEFAULT_TIME_GAP_MS = 18 * 60 * 60 * 1000

function eventTime(event: WorldEvent) {
  return Date.parse(event.occurredAt ?? event.firstObservedAt)
}

function sharesEntity(a: WorldEvent, b: WorldEvent) {
  const right = new Set(b.entityIds)
  return a.entityIds.some((entity) => right.has(entity))
}

function sharesTag(a: WorldEvent, b: WorldEvent) {
  const right = new Set((b.tags ?? []).map((tag) => tag.toLowerCase()))
  return (a.tags ?? []).some((tag) => right.has(tag.toLowerCase()))
}

function spatiallyClose(a: WorldEvent, b: WorldEvent, maxDistanceKm: number) {
  if (!a.location || !b.location) return false
  return haversineKm(a.location, b.location) <= maxDistanceKm
}

function temporallyClose(a: WorldEvent, b: WorldEvent, maxTimeGapMs: number) {
  const left = eventTime(a)
  const right = eventTime(b)
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false
  return Math.abs(left - right) <= maxTimeGapMs
}

function related(a: WorldEvent, b: WorldEvent, options: Required<ClusterOptions>) {
  if (!temporallyClose(a, b, options.maxTimeGapMs)) return false

  const semanticBridge = sharesEntity(a, b) || sharesTag(a, b)
  const geographicBridge = spatiallyClose(a, b, options.maxDistanceKm)

  return semanticBridge || (geographicBridge && a.mode === b.mode)
}

/**
 * Groups related world-state changes without using article volume as truth.
 * This intentionally clusters derived WorldEvents, not raw headlines.
 */
export function clusterWorldEvents(
  events: WorldEvent[],
  options: ClusterOptions = {},
): EventCluster[] {
  const resolved: Required<ClusterOptions> = {
    maxDistanceKm: options.maxDistanceKm ?? DEFAULT_DISTANCE_KM,
    maxTimeGapMs: options.maxTimeGapMs ?? DEFAULT_TIME_GAP_MS,
  }

  const unassigned = [...events].sort((a, b) => eventTime(b) - eventTime(a))
  const clusters: EventCluster[] = []

  while (unassigned.length > 0) {
    const seed = unassigned.shift()
    if (!seed) break

    const members = [seed]
    let changed = true

    while (changed) {
      changed = false
      for (let index = unassigned.length - 1; index >= 0; index -= 1) {
        const candidate = unassigned[index]
        if (members.some((member) => related(member, candidate, resolved))) {
          members.push(candidate)
          unassigned.splice(index, 1)
          changed = true
        }
      }
    }

    const sorted = members.sort((a, b) => eventTime(b) - eventTime(a))
    const entities = unique(sorted.flatMap((event) => event.entityIds))
    const observations = unique(sorted.flatMap((event) => event.observationIds))
    const modes = unique(sorted.map((event) => event.mode))
    const independence = sourceIndependenceGroups(sorted)

    clusters.push({
      id: `cluster:${sorted.map((event) => event.id).sort().join('|')}`,
      primaryEventId: sorted[0].id,
      eventIds: sorted.map((event) => event.id),
      title: sorted[0].title,
      modes,
      entityIds: entities,
      sourceObservationIds: observations,
      firstObservedAt: sorted
        .map((event) => event.firstObservedAt)
        .sort()[0],
      updatedAt: sorted
        .map((event) => event.updatedAt)
        .sort()
        .at(-1) ?? sorted[0].updatedAt,
      sourceIndependenceGroups: independence,
      independentSourceCount: independence.length,
      convergenceDomains: modes.length > 1 ? modes : [],
    })
  }

  return clusters
}

/**
 * Until full source-lineage metadata exists, each observation id is treated as
 * its own independence group. Callers may prefix observation ids with
 * "lineage:<group>:" to explicitly collapse syndicated/derived observations.
 */
export function sourceIndependenceGroups(events: WorldEvent[]): string[] {
  return unique(
    events.flatMap((event) =>
      event.observationIds.map((id) => {
        if (!id.startsWith('lineage:')) return id
        const [, group] = id.split(':')
        return group || id
      }),
    ),
  )
}

function unique(values: string[]) {
  return [...new Set(values)]
}
