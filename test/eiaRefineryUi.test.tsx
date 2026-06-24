import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EiaRefinerySourceTrail } from '../src/components/intel/EiaRefinerySourceTrail'
import { selectRenderableRefineries } from '../src/components/intel/eiaRefineryTrailSelect'
import { normalizeEiaRefineries, parseEiaRefineries } from '../electron/osint/adapters/eiaRefineryAdapter'
import { buildGeoContext } from '../src/engine/geo/geoContext'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const API_URL =
  'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/PetroleumRefineries_US_EIA/FeatureServer/0/query?f=geojson'

const FIXTURE = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { OBJECTID: 1, Site: 'Galveston Bay Refinery', Company: 'Marathon Petroleum', State: 'TX', AD_Mbpd: 631 }, geometry: { type: 'Point', coordinates: [-94.9, 29.37] } },
    { type: 'Feature', properties: { OBJECTID: 2, Site: 'Sweeny Refinery', Company: 'Phillips 66', State: 'Texas', AD_Mbpd: 265 }, geometry: null },
  ],
}

const events = normalizeEiaRefineries(parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))

describe('EIA refinery source-trail UI', () => {
  it('renders refineries with the disclaimer and precision labels', () => {
    const html = renderToStaticMarkup(<EiaRefinerySourceTrail events={events} now={NOW} />)
    expect(html).toContain('Galveston Bay Refinery')
    expect(html).toContain('Sweeny Refinery')
    expect(html).toContain('Facility location context, not verified outage/disruption.')
    expect(html).toContain('exact coordinates')
    expect(html).toContain('region only')
    // No outage/damage/targeting positive-claim language in rendered output.
    expect(html).not.toMatch(/\b(is offline|was damaged|under attack|targeted|sabotage)\b/i)
  })

  it('shows DATA_UNAVAILABLE when there are no refineries', () => {
    expect(renderToStaticMarkup(<EiaRefinerySourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
  })

  it('proof-gate drops a refinery whose source URL is not official EIA', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.eiaRefinery ? { ...e, eiaRefinery: { ...e.eiaRefinery, sourceUrl: 'https://evil.com/refineries' } } : e,
    )
    expect(selectRenderableRefineries(tampered)).toHaveLength(0)
  })

  it('proof-gate drops a refinery claiming exact precision without coordinates', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.eiaRefinery && e.eiaRefinery.geospatialPrecision === 'region-only'
        ? { ...e, eiaRefinery: { ...e.eiaRefinery, geospatialPrecision: 'exact' as const } }
        : e,
    )
    expect(selectRenderableRefineries(tampered).map((r) => r.facilityId)).toEqual(['1'])
  })

  it('geospatial context for a refinery: region match (not outage), proximity (not damage), no GDELT', () => {
    const refinery = events[0].eiaRefinery!
    const subject = { id: refinery.facilityId, name: refinery.facilityName, latitude: refinery.latitude, longitude: refinery.longitude, state: refinery.state, stateName: refinery.stateName }
    const wx = { id: 'wx', weatherAlert: { ugcCodes: ['TXZ211'], areaDesc: 'Galveston, TX', event: 'Hurricane Warning', severity: 'Extreme' } } as WorldIntelEvent
    const eq = { id: 'eq', earthquakeEvent: { lat: 29.6, lon: -95.0, place: 'near Houston, Texas', magnitude: 3.9 } } as WorldIntelEvent
    const gd = { id: 'g', gdeltArticle: { url: 'https://x', title: 'refinery news' } } as WorldIntelEvent

    const ctx = buildGeoContext(subject, [wx, eq, gd])
    expect(ctx.weatherRegionMatches[0].note).toMatch(/region match only, not a verified outage or disruption/i)
    expect(ctx.seismicProximities[0].note).toMatch(/not a verified damage/i)
    // GDELT contributes nothing.
    expect(buildGeoContext(subject, [gd]).weatherRegionMatches).toHaveLength(0)
    expect(buildGeoContext(subject, [gd]).seismicProximities).toHaveLength(0)
  })
})
