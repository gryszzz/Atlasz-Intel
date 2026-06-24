/*
 * Pure proof gate for EIA petroleum refinery source-trail rendering.
 *
 * A refinery renders only with facilityId, facilityName, refinery kind, an
 * official EIA source URL + API URL, retrievedAt, staleAt, payload hash,
 * official-api provenance, a valid geospatial precision (coords iff exact),
 * and confidence >= 90. No proof -> not rendered (DATA_UNAVAILABLE), never faked.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { EiaRefineryFacility, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableRefineries(events: WorldIntelEvent[], limit = 40): EiaRefineryFacility[] {
  const out: EiaRefineryFacility[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const refinery = event.eiaRefinery
    if (!refinery) continue
    const coordsPresent = coordinatesAreValid(refinery.latitude, refinery.longitude)
    const proof =
      Boolean(refinery.facilityId) &&
      Boolean(refinery.facilityName) &&
      refinery.facilityKind === 'refinery' &&
      isValidPrecision(refinery.geospatialPrecision) &&
      (refinery.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(refinery.sourceDataset) &&
      /^https:\/\/([a-z0-9-]+\.)*eia\.gov\//i.test(refinery.sourceUrl) &&
      isOfficialApiUrl(refinery.sourceApiUrl) &&
      Boolean(refinery.rawPayloadHash) &&
      Number.isFinite(refinery.retrievedAt) &&
      Number.isFinite(refinery.staleAt) &&
      refinery.provenance === 'official-api' &&
      refinery.confidence >= 90
    if (!proof || seen.has(refinery.id)) continue
    seen.add(refinery.id)
    out.push(refinery)
  }
  return out
    .sort((a, b) => (b.crudeCapacity ?? 0) - (a.crudeCapacity ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, limit)
}

function isOfficialApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (/(^|\.)eia\.gov$/i.test(parsed.hostname)) return true
    return /(^|\.)arcgis\.com$/i.test(parsed.hostname) && /refiner/i.test(parsed.pathname)
  } catch {
    return false
  }
}
