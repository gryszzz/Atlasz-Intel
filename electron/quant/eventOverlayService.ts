/*
 * Event overlay service (Phase 3). Pure: given world events + an asset + a time
 * range, return the markers that belong on that asset's chart, each tagged with
 * how it was linked (linkType) and the underlying event's own provenance.
 *
 * Linking is local-computed reasoning. Model-inferred links are included only
 * when explicitly enabled and are always visibly labeled as such.
 */
import type { WorldIntelEvent } from '../../src/worldIntel'
import type { EventOverlayLinkType, EventOverlayMarker } from '../../src/quant'

export function buildEventOverlay(params: {
  events: WorldIntelEvent[]
  assetSymbol: string
  from: number
  to: number
  allowModelInferred?: boolean
  maxMarkers?: number
}): EventOverlayMarker[] {
  const symbol = params.assetSymbol.toUpperCase()
  const allowModelInferred = params.allowModelInferred ?? false
  const maxMarkers = params.maxMarkers ?? 50
  const markers: EventOverlayMarker[] = []

  for (const event of params.events) {
    if (event.timestamp < params.from || event.timestamp > params.to) {
      continue
    }
    const linkType = linkFor(event, symbol)
    if (!linkType) {
      continue
    }
    if (linkType === 'model-inferred' && !allowModelInferred) {
      continue
    }
    markers.push({
      eventId: event.id,
      timestamp: event.timestamp,
      title: event.title,
      category: String(event.category),
      severity: event.severity,
      provenance: event.provenance,
      linkType,
    })
  }

  return markers.sort((left, right) => left.timestamp - right.timestamp).slice(0, maxMarkers)
}

function linkFor(event: WorldIntelEvent, symbol: string): EventOverlayLinkType | null {
  const affected = event.affectedAssets.map((asset) => asset.toUpperCase())
  if (affected.includes(symbol)) {
    if (event.category === 'macro-event') {
      return 'macro-proxy'
    }
    if (event.provenance === 'model-inferred') {
      return 'model-inferred'
    }
    return 'direct-asset'
  }
  return null
}
