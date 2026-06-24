/*
 * Facility geospatial context — now a thin adapter over the Shared Geospatial
 * Core (`src/engine/geo/geoContext.ts`). Kept for the EIA power-plant slice so
 * its UI/tests have a facility-shaped result; all logic and proof boundaries
 * (region match not damage, proximity not damage, GDELT excluded) live in the
 * core and are shared by every physical-world connector.
 */
import { buildGeoContext, hasGeoContext as coreHasGeoContext } from './geo/geoContext'
import type { GeoContextOptions, GeoSeismicProximity, GeoWeatherRegionMatch } from './geo/geoContext'
import type { WorldIntelEvent, EiaPowerPlantFacility } from '../worldIntel'

// Back-compat aliases for existing importers.
export type FacilityWeatherRegionMatch = GeoWeatherRegionMatch
export type FacilitySeismicProximity = GeoSeismicProximity
export type FacilityGeoContextOptions = GeoContextOptions

export type FacilityGeoContext = {
  facilityId: string
  facilityName: string
  weatherRegionMatches: FacilityWeatherRegionMatch[]
  seismicProximities: FacilitySeismicProximity[]
}

export function buildFacilityGeoContext(
  facility: EiaPowerPlantFacility,
  events: WorldIntelEvent[],
  options: FacilityGeoContextOptions = {},
): FacilityGeoContext {
  const context = buildGeoContext(
    {
      id: facility.facilityId,
      name: facility.facilityName,
      latitude: facility.latitude,
      longitude: facility.longitude,
      state: facility.state,
      stateName: facility.stateName,
    },
    events,
    options,
  )
  return {
    facilityId: facility.facilityId,
    facilityName: facility.facilityName,
    weatherRegionMatches: context.weatherRegionMatches,
    seismicProximities: context.seismicProximities,
  }
}

export function hasGeoContext(context: FacilityGeoContext): boolean {
  return coreHasGeoContext({ subjectId: context.facilityId, subjectName: context.facilityName, ...context })
}
