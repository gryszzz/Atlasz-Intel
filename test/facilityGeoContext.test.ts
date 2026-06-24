import { describe, expect, it } from 'vitest'
import { buildFacilityGeoContext, hasGeoContext } from '../src/engine/facilityGeoContext'
import type { EiaPowerPlantFacility, WorldIntelEvent } from '../src/worldIntel'

const facility: EiaPowerPlantFacility = {
  id: 'eia_power_plants_public:42',
  facilityId: '42',
  facilityName: 'Lone Star Generating',
  facilityKind: 'power-plant',
  state: 'TX',
  stateName: 'Texas',
  county: 'Nolan',
  latitude: 31.0,
  longitude: -100.0,
  geospatialPrecision: 'exact',
  sourceDataset: 'EIA-860M operating generator capacity',
  sourceUrl: 'https://www.eia.gov/electricity/data/eia860m/',
  sourceApiUrl: 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/',
  sourceName: 'U.S. Energy Information Administration',
  retrievedAt: Date.parse('2026-06-18T00:00:00Z'),
  staleAt: Date.parse('2026-08-01T00:00:00Z'),
  provenance: 'official-api',
  confidence: 95,
  rawPayloadHash: 'hash',
}

function event(partial: Partial<WorldIntelEvent>): WorldIntelEvent {
  return { id: 'evt', ...partial } as WorldIntelEvent
}

const weatherInState = event({
  id: 'wx-tx',
  weatherAlert: { ugcCodes: ['TXZ211'], areaDesc: 'Nolan, TX', event: 'Severe Thunderstorm Warning', severity: 'Severe' } as WorldIntelEvent['weatherAlert'],
})
const weatherOtherState = event({
  id: 'wx-fl',
  weatherAlert: { ugcCodes: ['FLZ050'], areaDesc: 'Miami-Dade, FL', event: 'Heat Advisory', severity: 'Minor' } as WorldIntelEvent['weatherAlert'],
})
const quakeNear = event({
  id: 'eq-near',
  earthquakeEvent: { lat: 31.5, lon: -100.5, place: '50km N of Sweetwater, Texas', magnitude: 4.2 } as WorldIntelEvent['earthquakeEvent'],
})
const quakeFar = event({
  id: 'eq-far',
  earthquakeEvent: { lat: 10, lon: 10, place: 'Atlantic Ocean', magnitude: 6.1 } as WorldIntelEvent['earthquakeEvent'],
})

describe('facility geospatial context', () => {
  it('NOAA region match reports "same region as alert", not an outage', () => {
    const ctx = buildFacilityGeoContext(facility, [weatherInState, weatherOtherState])
    expect(ctx.weatherRegionMatches).toHaveLength(1)
    const match = ctx.weatherRegionMatches[0]
    expect(match.eventId).toBe('wx-tx')
    expect(match.kind).toBe('weather-region')
    // It is framed as a region match with an explicit disclaimer — never an outage claim.
    expect(match.note).toMatch(/region match only/i)
    expect(match.note).toMatch(/not a verified outage or disruption/i)
    expect(JSON.stringify(match)).not.toMatch(/\b(offline|knocked out|caused an outage|disrupted)\b/i)
  })

  it('USGS proximity reports distance only, never damage', () => {
    const ctx = buildFacilityGeoContext(facility, [quakeNear, quakeFar])
    expect(ctx.seismicProximities).toHaveLength(1)
    const prox = ctx.seismicProximities[0]
    expect(prox.eventId).toBe('eq-near')
    expect(prox.distanceKm).toBeGreaterThan(0)
    expect(prox.distanceKm).toBeLessThanOrEqual(250)
    expect(prox.note).toMatch(/distance\/proximity .* only/i)
    expect(prox.note).toMatch(/not a verified damage/i)
    expect(JSON.stringify(prox)).not.toMatch(/\b(damaged|destroyed|knocked out|disrupted)\b/i)
  })

  it('does not claim proximity when the facility has no source coordinates', () => {
    const noCoords = { ...facility, latitude: undefined, longitude: undefined, geospatialPrecision: 'region-only' as const }
    const ctx = buildFacilityGeoContext(noCoords, [quakeNear])
    expect(ctx.seismicProximities).toHaveLength(0)
  })

  it('GDELT never creates facility context/exposure', () => {
    const gdelt = event({
      id: 'gdelt-1',
      lat: 31.0,
      lon: -100.0,
      gdeltArticle: { url: 'https://example.com', title: 'Texas power news' } as WorldIntelEvent['gdeltArticle'],
    })
    const ctx = buildFacilityGeoContext(facility, [gdelt])
    expect(hasGeoContext(ctx)).toBe(false)
    expect(ctx.weatherRegionMatches).toHaveLength(0)
    expect(ctx.seismicProximities).toHaveLength(0)
  })
})
