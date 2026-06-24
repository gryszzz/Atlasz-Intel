import { describe, expect, it } from 'vitest'
import {
  coordinatesAgreeWithPrecision,
  coordinatesAreValid,
  haversineKm,
  isStale,
  isValidPrecision,
  precisionForCoordinates,
} from '../src/engine/geo/geoCore'
import { buildGeoContext, hasGeoContext } from '../src/engine/geo/geoContext'
import type { GeoSubject } from '../src/engine/geo/geoCore'
import type { WorldIntelEvent } from '../src/worldIntel'

describe('geospatial core primitives', () => {
  it('validates coordinates and rejects out-of-range and null island', () => {
    expect(coordinatesAreValid(35.1, -119.2)).toBe(true)
    expect(coordinatesAreValid(0, 0)).toBe(false)
    expect(coordinatesAreValid(91, 0)).toBe(false)
    expect(coordinatesAreValid(0, 181)).toBe(false)
    expect(coordinatesAreValid(undefined, undefined)).toBe(false)
    expect(coordinatesAreValid('35', '-119')).toBe(false)
  })

  it('derives precision from what the source actually provides', () => {
    expect(precisionForCoordinates(35.1, -119.2, true)).toBe('exact')
    expect(precisionForCoordinates(undefined, undefined, true)).toBe('region-only')
    expect(precisionForCoordinates(undefined, undefined, false)).toBe('unknown')
    // Invalid coordinates never count as exact.
    expect(precisionForCoordinates(0, 0, true)).toBe('region-only')
  })

  it('enforces coordinates-present IFF exact', () => {
    expect(coordinatesAgreeWithPrecision('exact', 35.1, -119.2)).toBe(true)
    expect(coordinatesAgreeWithPrecision('exact', undefined, undefined)).toBe(false)
    expect(coordinatesAgreeWithPrecision('region-only', undefined, undefined)).toBe(true)
    expect(coordinatesAgreeWithPrecision('region-only', 35.1, -119.2)).toBe(false)
    expect(coordinatesAgreeWithPrecision('unknown', undefined, undefined)).toBe(true)
  })

  it('validates the precision union and measures distance', () => {
    expect(isValidPrecision('exact')).toBe(true)
    expect(isValidPrecision('bogus')).toBe(false)
    const km = haversineKm(31.0, -100.0, 31.5, -100.5)
    expect(km).toBeGreaterThan(50)
    expect(km).toBeLessThan(100)
    expect(haversineKm(0, 0, 0, 0)).toBe(0)
  })

  it('reports staleness honestly', () => {
    const now = Date.parse('2026-06-18T00:00:00Z')
    expect(isStale(now - 1, now)).toBe(true)
    expect(isStale(now + 1, now)).toBe(false)
    expect(isStale(Number.NaN, now)).toBe(true)
  })
})

describe('generic geo context reuse (non-facility subject)', () => {
  // Proves the core works for ANY located subject — here a port, not a power plant.
  const port: GeoSubject = { id: 'uslax', name: 'Port of Los Angeles', latitude: 33.74, longitude: -118.27, state: 'CA', stateName: 'California' }

  const quakeNear = { id: 'eq', earthquakeEvent: { lat: 33.9, lon: -118.4, place: 'Los Angeles, CA', magnitude: 4.0 } } as WorldIntelEvent
  const alertInState = { id: 'wx', weatherAlert: { ugcCodes: ['CAZ041'], areaDesc: 'Los Angeles County, CA', event: 'Flood Warning', severity: 'Severe' } } as WorldIntelEvent
  const gdelt = { id: 'g', gdeltArticle: { url: 'https://x', title: 'port news' } } as WorldIntelEvent

  it('produces region + proximity context for a port, never from GDELT', () => {
    const ctx = buildGeoContext(port, [quakeNear, alertInState, gdelt])
    expect(ctx.subjectId).toBe('uslax')
    expect(ctx.weatherRegionMatches).toHaveLength(1)
    expect(ctx.seismicProximities).toHaveLength(1)
    expect(ctx.seismicProximities[0].note).toMatch(/not a verified damage/i)
    expect(hasGeoContext(buildGeoContext(port, [gdelt]))).toBe(false)
  })
})
