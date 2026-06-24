import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MineralSiteSourceTrail } from '../src/components/intel/MineralSiteSourceTrail'
import { selectRenderableMineralSites } from '../src/components/intel/mineralSiteTrailSelect'
import { normalizeMineralSites, parseMineralSites } from '../electron/osint/adapters/usgsMineralAdapter'
import { buildGeoContext } from '../src/engine/geo/geoContext'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const MRDS_URL = 'https://mrdata.usgs.gov/mrds/mrds.csv'
const MRDS_CSV = [
  'dep_id,site_name,latitude,longitude,country,state,county,commod1,dev_stat',
  '10138596,Bingham Canyon,40.523,-112.15,United States,Utah,Salt Lake,Copper,Producer',
].join('\n')

const events = normalizeMineralSites(parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL }))
const wxUtah = { id: 'wx', weatherAlert: { ugcCodes: ['UTZ110'], areaDesc: 'Salt Lake County, UT', event: 'Winter Storm Warning', severity: 'Severe' } } as WorldIntelEvent
const gdelt = { id: 'g', gdeltArticle: { url: 'https://x', title: 'mining news' } } as WorldIntelEvent

describe('USGS mineral site UI', () => {
  it('renders sites with the reference disclaimer and legacy flag', () => {
    const html = renderToStaticMarkup(<MineralSiteSourceTrail events={events} now={NOW} />)
    expect(html).toContain('Bingham Canyon')
    expect(html).toContain('Copper')
    expect(html).toContain('Mineral resource reference data, not current production, reserves, ownership, or investment signal.')
    expect(html).toContain('exact coordinates')
    expect(html).toMatch(/not updated since 2011/i) // MRDS legacy flag
    expect(html).not.toMatch(/\b(world-class|high-grade|bonanza|invest|undervalued)\b/i)
  })

  it('shows same-region NOAA context as region match only', () => {
    const html = renderToStaticMarkup(<MineralSiteSourceTrail events={[...events, wxUtah]} now={NOW} />)
    expect(html).toContain('same region as alert')
    expect(html).toMatch(/region match only, not a verified outage or disruption/i)
  })

  it('GDELT never creates mineral-site geo context', () => {
    const site = events[0].mineralSite!
    const ctx = buildGeoContext({ id: site.siteId, name: site.siteName, latitude: site.latitude, longitude: site.longitude, state: 'UT' }, [gdelt])
    expect(ctx.weatherRegionMatches).toHaveLength(0)
    expect(ctx.seismicProximities).toHaveLength(0)
  })

  it('shows DATA_UNAVAILABLE when empty and proof-gates a non-USGS source URL', () => {
    expect(renderToStaticMarkup(<MineralSiteSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.mineralSite ? { ...e, mineralSite: { ...e.mineralSite, sourceUrl: 'https://evil.com/mrds' } } : e,
    )
    expect(selectRenderableMineralSites(tampered)).toHaveLength(0)
  })
})
