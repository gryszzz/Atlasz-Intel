/*
 * Pure proof gate for EIA nuclear power-plant source-trail rendering (Layer 1).
 *
 * Renders only with facilityId, facilityName, nuclear-plant kind, an official EIA
 * source URL + API URL (no api_key), retrievedAt, staleAt, payload hash,
 * official-api provenance, valid precision (coords iff exact), confidence >= 90.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { NuclearPlantFacility, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableNuclearPlants(events: WorldIntelEvent[], limit = 40): NuclearPlantFacility[] {
  const out: NuclearPlantFacility[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const plant = event.nuclearPlant
    if (!plant) continue
    const coordsPresent = coordinatesAreValid(plant.latitude, plant.longitude)
    const proof =
      Boolean(plant.facilityId) &&
      Boolean(plant.facilityName) &&
      plant.facilityKind === 'nuclear-plant' &&
      isValidPrecision(plant.geospatialPrecision) &&
      (plant.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(plant.sourceDataset) &&
      /^https:\/\/www\.eia\.gov\//.test(plant.sourceUrl) &&
      /^https:\/\/api\.eia\.gov\/v2\/electricity\/operating-generator-capacity\//.test(plant.sourceApiUrl) &&
      !/[?&]api_key=/i.test(plant.sourceApiUrl) &&
      Boolean(plant.rawPayloadHash) &&
      Number.isFinite(plant.retrievedAt) &&
      Number.isFinite(plant.staleAt) &&
      plant.provenance === 'official-api' &&
      plant.confidence >= 90
    if (!proof || seen.has(plant.id)) continue
    seen.add(plant.id)
    out.push(plant)
  }
  return out
    .sort((a, b) => (b.capacityMw ?? 0) - (a.capacityMw ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, limit)
}
