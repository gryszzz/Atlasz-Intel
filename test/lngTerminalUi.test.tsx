import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LngTerminalSourceTrail } from '../src/components/intel/LngTerminalSourceTrail'
import { selectRenderableLngTerminals } from '../src/components/intel/lngTerminalTrailSelect'
import { normalizeLngTerminals, parseLngTerminals } from '../electron/osint/adapters/lngTerminalAdapter'
import { buildGeoContext } from '../src/engine/geo/geoContext'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const EIA_API = 'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/Lng_ImportExportTerminals_US_EIA/FeatureServer/0/query?f=geojson'

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { OBJECTID: 1, Terminal: 'Sabine Pass LNG Terminal', Operator: 'Cheniere', State: 'LA', Type: 'Export', Capacity: 4.5 }, geometry: { type: 'Point', coordinates: [-93.87, 29.74] } },
    { type: 'Feature', properties: { OBJECTID: 2, Terminal: 'Cameron LNG', Operator: 'Sempra Infrastructure', State: 'Louisiana', Type: 'Liquefaction' }, geometry: null },
  ],
}

const events = normalizeLngTerminals(parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API }))

describe('LNG terminal source-trail UI', () => {
  it('renders terminals with the disclaimer and precision labels', () => {
    const html = renderToStaticMarkup(<LngTerminalSourceTrail events={events} now={NOW} />)
    expect(html).toContain('Sabine Pass LNG Terminal')
    expect(html).toContain('Cameron LNG')
    expect(html).toContain('Facility location context, not verified outage/disruption/export impact.')
    expect(html).toContain('exact coordinates')
    expect(html).toContain('region only')
    expect(html).not.toMatch(/\b(is offline|was damaged|under attack|targeted|export halted|sabotage)\b/i)
  })

  it('shows DATA_UNAVAILABLE (fail-closed) when there are no terminals', () => {
    const html = renderToStaticMarkup(<LngTerminalSourceTrail events={[]} now={NOW} />)
    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toMatch(/fail-closed/i)
  })

  it('proof-gate drops a terminal whose source URL is not official', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.lngTerminal ? { ...e, lngTerminal: { ...e.lngTerminal, sourceUrl: 'https://evil.com/lng' } } : e,
    )
    expect(selectRenderableLngTerminals(tampered)).toHaveLength(0)
  })

  it('proof-gate drops a terminal claiming exact precision without coordinates', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.lngTerminal && e.lngTerminal.geospatialPrecision === 'region-only'
        ? { ...e, lngTerminal: { ...e.lngTerminal, geospatialPrecision: 'exact' as const } }
        : e,
    )
    expect(selectRenderableLngTerminals(tampered).map((t) => t.facilityId)).toEqual(['1'])
  })

  it('geospatial context: region match (not outage), proximity (not damage), no GDELT', () => {
    const t = events[0].lngTerminal!
    const subject = { id: t.facilityId, name: t.facilityName, latitude: t.latitude, longitude: t.longitude, state: t.state, stateName: t.stateName }
    const wx = { id: 'wx', weatherAlert: { ugcCodes: ['LAZ034'], areaDesc: 'Cameron, LA', event: 'Hurricane Warning', severity: 'Extreme' } } as WorldIntelEvent
    const eq = { id: 'eq', earthquakeEvent: { lat: 29.9, lon: -93.9, place: 'near Sabine, Louisiana', magnitude: 3.6 } } as WorldIntelEvent
    const gd = { id: 'g', gdeltArticle: { url: 'https://x', title: 'lng news' } } as WorldIntelEvent

    const ctx = buildGeoContext(subject, [wx, eq, gd])
    expect(ctx.weatherRegionMatches[0].note).toMatch(/region match only, not a verified outage or disruption/i)
    expect(ctx.seismicProximities[0].note).toMatch(/not a verified damage/i)
    expect(buildGeoContext(subject, [gd]).weatherRegionMatches).toHaveLength(0)
    expect(buildGeoContext(subject, [gd]).seismicProximities).toHaveLength(0)
  })
})
