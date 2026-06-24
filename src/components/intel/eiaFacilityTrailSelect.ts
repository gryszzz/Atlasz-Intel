/*
 * Pure proof gate for EIA power-plant facility source-trail rendering.
 *
 * A facility renders only with facilityId, facilityName, power-plant kind, an
 * official EIA source URL + API URL (no api_key), retrievedAt, staleAt,
 * payload hash, official-api provenance, a valid geospatial precision, and
 * confidence >= 90. No proof -> not rendered (DATA_UNAVAILABLE), never faked.
 */
import type { EiaPowerPlantFacility, GeospatialPrecision, WorldIntelEvent } from '../../worldIntel'

const PRECISIONS: GeospatialPrecision[] = ['exact', 'approximate', 'region-only', 'unknown']

export function selectRenderableFacilities(events: WorldIntelEvent[], limit = 40): EiaPowerPlantFacility[] {
  const out: EiaPowerPlantFacility[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const facility = event.eiaFacility
    if (!facility) continue
    const coordsPresent = Number.isFinite(facility.latitude) && Number.isFinite(facility.longitude)
    const proof =
      Boolean(facility.facilityId) &&
      Boolean(facility.facilityName) &&
      facility.facilityKind === 'power-plant' &&
      PRECISIONS.includes(facility.geospatialPrecision) &&
      // coordinates present iff precision is exact (no silent guessing)
      (facility.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(facility.sourceDataset) &&
      /^https:\/\/www\.eia\.gov\//.test(facility.sourceUrl) &&
      /^https:\/\/api\.eia\.gov\/v2\/electricity\/operating-generator-capacity\//.test(facility.sourceApiUrl) &&
      !/[?&]api_key=/i.test(facility.sourceApiUrl) &&
      Boolean(facility.rawPayloadHash) &&
      Number.isFinite(facility.retrievedAt) &&
      Number.isFinite(facility.staleAt) &&
      facility.provenance === 'official-api' &&
      facility.confidence >= 90
    if (!proof || seen.has(facility.id)) continue
    seen.add(facility.id)
    out.push(facility)
  }
  return out
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, limit)
}
