import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorldPortIndexSourceTrail } from '../src/components/intel/WorldPortIndexSourceTrail'
import { selectRenderableWorldPorts } from '../src/components/intel/worldPortTrailSelect'
import { normalizeWorldPorts, parseWorldPortIndex } from '../electron/osint/adapters/worldPortIndexAdapter'
import { buildGeoContext } from '../src/engine/geo/geoContext'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const URL_OK = 'https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv'
const CSV = [
  'World Port Index Number,Main Port Name,UN/LOCODE,Country Code,Latitude,Longitude,Harbor Size,Harbor Type,Shelter Afforded,Region Name,Subdivision',
  '5970,Los Angeles,USLAX,United States,33.71667,-118.25,Large,Coastal Natural,Good,United States West Coast,CA',
].join('\n')

const events = normalizeWorldPorts(parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
const wxCalifornia = { id: 'wx', weatherAlert: { ugcCodes: ['CAZ041'], areaDesc: 'Los Angeles County, CA', event: 'High Surf Advisory', severity: 'Moderate' } } as WorldIntelEvent
const quakeNear = { id: 'eq', earthquakeEvent: { lat: 33.9, lon: -118.4, place: 'Los Angeles, CA', magnitude: 4.1 } } as WorldIntelEvent
const gdelt = { id: 'g', gdeltArticle: { url: 'https://x', title: 'port news' } } as WorldIntelEvent

describe('World Port Index UI', () => {
  it('renders ports with the physical-reference disclaimer and exact coords', () => {
    const html = renderToStaticMarkup(<WorldPortIndexSourceTrail events={events} now={NOW} />)
    expect(html).toContain('Los Angeles')
    expect(html).toContain('USLAX')
    expect(html).toContain('Physical port reference data, not live traffic, congestion, or disruption.')
    expect(html).toContain('exact coordinates')
    expect(html).not.toMatch(/\b(congested|backlog|vessels waiting|disrupted operations|blockade)\b/i)
  })

  it('shows NOAA region (not outage) and USGS proximity (not damage) via the geo core', () => {
    const html = renderToStaticMarkup(<WorldPortIndexSourceTrail events={[...events, wxCalifornia, quakeNear]} now={NOW} />)
    expect(html).toContain('same region as alert')
    expect(html).toMatch(/region match only, not a verified outage or disruption/i)
    expect(html).toMatch(/km away/)
    expect(html).toMatch(/not a verified damage/i)
  })

  it('GDELT never creates port geo context', () => {
    const port = events[0].worldPort!
    const ctx = buildGeoContext({ id: port.portNumber, name: port.portName, latitude: port.latitude, longitude: port.longitude, state: 'CA' }, [gdelt])
    expect(ctx.weatherRegionMatches).toHaveLength(0)
    expect(ctx.seismicProximities).toHaveLength(0)
  })

  it('shows DATA_UNAVAILABLE when empty and proof-gates a non-NGA source URL', () => {
    expect(renderToStaticMarkup(<WorldPortIndexSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.worldPort ? { ...e, worldPort: { ...e.worldPort, sourceUrl: 'https://evil.com/wpi' } } : e,
    )
    expect(selectRenderableWorldPorts(tampered)).toHaveLength(0)
  })
})
