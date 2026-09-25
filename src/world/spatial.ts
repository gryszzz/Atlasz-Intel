import type { GeoPoint, WorldEvent } from './model'

export type SpatialCell = {
  id: string
  latBand: number
  lonBand: number
  center: GeoPoint
  eventIds: string[]
  eventCount: number
  elevatedCount: number
  maxMateriality: number
}

/**
 * Lightweight dependency-free global bucketing for the first Atlasz World
 * runtime. This is intentionally NOT presented as H3. It creates deterministic
 * latitude/longitude cells so the product can aggregate and query real events
 * before a future H3/PostGIS migration.
 */
export function spatialCellId(point: GeoPoint, degrees = 5): string {
  const safeDegrees = Math.max(0.25, Math.min(30, degrees))
  const latBand = Math.floor((point.lat + 90) / safeDegrees)
  const lonBand = Math.floor((point.lon + 180) / safeDegrees)
  return `grid:${safeDegrees}:${latBand}:${lonBand}`
}

export function buildSpatialCells(events: WorldEvent[], degrees = 5): SpatialCell[] {
  const safeDegrees = Math.max(0.25, Math.min(30, degrees))
  const cells = new Map<string, SpatialCell>()

  for (const event of events) {
    if (!event.location) continue

    const latBand = Math.floor((event.location.lat + 90) / safeDegrees)
    const lonBand = Math.floor((event.location.lon + 180) / safeDegrees)
    const id = `grid:${safeDegrees}:${latBand}:${lonBand}`
    const materiality = meanMateriality(event)

    const existing = cells.get(id)
    if (existing) {
      existing.eventIds.push(event.id)
      existing.eventCount += 1
      existing.elevatedCount += event.materiality.impact >= 0.72 ? 1 : 0
      existing.maxMateriality = Math.max(existing.maxMateriality, materiality)
      continue
    }

    cells.set(id, {
      id,
      latBand,
      lonBand,
      center: {
        lat: latBand * safeDegrees - 90 + safeDegrees / 2,
        lon: lonBand * safeDegrees - 180 + safeDegrees / 2,
      },
      eventIds: [event.id],
      eventCount: 1,
      elevatedCount: event.materiality.impact >= 0.72 ? 1 : 0,
      maxMateriality: materiality,
    })
  }

  return [...cells.values()].sort((left, right) => {
    if (right.maxMateriality !== left.maxMateriality) {
      return right.maxMateriality - left.maxMateriality
    }
    return right.eventCount - left.eventCount
  })
}

function meanMateriality(event: WorldEvent): number {
  const values = Object.values(event.materiality)
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const earthRadiusKm = 6371.0088
  const toRadians = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRadians
  const dLon = (b.lon - a.lon) * toRadians
  const lat1 = a.lat * toRadians
  const lat2 = b.lat * toRadians

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)))
}
