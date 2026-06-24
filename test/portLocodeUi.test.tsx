import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PortLocodeSourceTrail } from '../src/components/intel/PortLocodeSourceTrail'
import { selectRenderableLocodes } from '../src/components/intel/portLocodeTrailSelect'
import { normalizeUnLocodes, parseUnLocodes } from '../electron/osint/adapters/unLocodeAdapter'
import { buildGeoContext } from '../src/engine/geo/geoContext'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const URL_OK = 'https://unece.org/trade/cefact/unlocode/loc251.csv'
const CSV = [
  ',US,LAX,Los Angeles,Los Angeles,CA,AI,1-3-----,0601,,3343N 11815W,',
  ',NL,RTM,Rotterdam,Rotterdam,ZH,AI,1-3-----,0601,,5155N 00429E,',
].join('\n')

const events = normalizeUnLocodes(parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
const wxCalifornia = { id: 'wx', weatherAlert: { ugcCodes: ['CAZ041'], areaDesc: 'Los Angeles County, CA', event: 'High Wind Warning', severity: 'Severe' } } as WorldIntelEvent
const gdelt = { id: 'g', gdeltArticle: { url: 'https://x', title: 'port news' } } as WorldIntelEvent

describe('Port / UN/LOCODE UI', () => {
  it('renders locations with the registry disclaimer and precision labels', () => {
    const html = renderToStaticMarkup(<PortLocodeSourceTrail events={events} now={NOW} />)
    expect(html).toContain('USLAX')
    expect(html).toContain('Los Angeles')
    expect(html).toContain('Trade/location registry context, not live port activity or disruption.')
    expect(html).toContain('exact coordinates')
    expect(html).not.toMatch(/\b(congested|backlog|gridlock|vessels waiting|disrupted operations)\b/i)
  })

  it('shows same-region NOAA context for a US port as region match only', () => {
    const html = renderToStaticMarkup(<PortLocodeSourceTrail events={[...events, wxCalifornia]} now={NOW} />)
    expect(html).toContain('same region as alert')
    expect(html).toMatch(/region match only, not a verified outage or disruption/i)
  })

  it('GDELT never creates port geo context', () => {
    const lax = events.find((e) => e.unLocode?.locode === 'USLAX')!.unLocode!
    const subject = { id: lax.locode, name: lax.locationName, latitude: lax.latitude, longitude: lax.longitude, state: 'CA' }
    const ctx = buildGeoContext(subject, [gdelt])
    expect(ctx.weatherRegionMatches).toHaveLength(0)
    expect(ctx.seismicProximities).toHaveLength(0)
  })

  it('shows DATA_UNAVAILABLE when empty and proof-gates a non-UNECE source URL', () => {
    expect(renderToStaticMarkup(<PortLocodeSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.unLocode ? { ...e, unLocode: { ...e.unLocode, sourceUrl: 'https://evil.com/loc' } } : e,
    )
    expect(selectRenderableLocodes(tampered)).toHaveLength(0)
  })
})
