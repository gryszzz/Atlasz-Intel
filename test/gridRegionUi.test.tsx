import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GridRegionSourceTrail } from '../src/components/intel/GridRegionSourceTrail'
import { selectRenderableGridRegions, statesForBa } from '../src/components/intel/gridRegionTrailSelect'
import { normalizeBalancingAuthorities, parseBalancingAuthorities } from '../electron/osint/adapters/eiaBalancingAuthorityAdapter'
import { normalizeEiaFacilities, parseEiaFacilities } from '../electron/osint/adapters/eiaFacilityAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const FACET_API = 'https://api.eia.gov/v2/electricity/rto/region-data/facet/respondent'
const PLANT_API = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw'

const BA_FIXTURE = { response: { facets: [{ id: 'CISO', name: 'California Independent System Operator' }] } }
const PLANT_FIXTURE = {
  response: {
    data: [
      { period: '2026-04', plantid: '55555', plantName: 'Sunrise Solar', entityName: 'NextEra Energy', stateid: 'CA', stateName: 'California', county: 'Kern', technology: 'Solar Photovoltaic', 'energy-source-code': 'SUN', statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '250', 'balancing-authority-code': 'CISO', latitude: '35.1', longitude: '-119.2' },
    ],
  },
}

const baEvents = normalizeBalancingAuthorities(parseBalancingAuthorities(BA_FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API }))
const plantEvents = normalizeEiaFacilities(parseEiaFacilities(PLANT_FIXTURE, { retrievedAt: NOW, sourceApiUrl: PLANT_API }))
const wxCalifornia = { id: 'wx', weatherAlert: { ugcCodes: ['CAZ041'], areaDesc: 'Kern County, CA', event: 'Excessive Heat Warning', severity: 'Severe' } } as WorldIntelEvent

describe('Grid region UI', () => {
  it('renders BA reference with region-only precision and the reference disclaimer', () => {
    const html = renderToStaticMarkup(<GridRegionSourceTrail events={[...baEvents, ...plantEvents]} now={NOW} />)
    expect(html).toContain('CISO')
    expect(html).toContain('California Independent System Operator')
    expect(html).toContain('region only')
    expect(html).toMatch(/not an outage, reliability, or grid-stress condition/i)
    expect(html).not.toMatch(/\b(blackout|grid failure|overloaded|emergency)\b/i)
  })

  it('derives states with EIA-listed plants from source-backed plant BA codes', () => {
    expect(statesForBa(plantEvents, 'CISO')).toEqual(['CA'])
    const html = renderToStaticMarkup(<GridRegionSourceTrail events={[...baEvents, ...plantEvents]} now={NOW} />)
    expect(html).toContain('States w/ EIA plants')
  })

  it('shows same-state weather context as region match only (never outage)', () => {
    const html = renderToStaticMarkup(<GridRegionSourceTrail events={[...baEvents, ...plantEvents, wxCalifornia]} now={NOW} />)
    expect(html).toContain('same state/region as alert')
    expect(html).toMatch(/region match only, not a verified outage or disruption/i)
  })

  it('shows DATA_UNAVAILABLE when empty and proof-gates a leaked api_key', () => {
    expect(renderToStaticMarkup(<GridRegionSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
    const tampered: WorldIntelEvent[] = baEvents.map((e) =>
      e.gridRegion ? { ...e, gridRegion: { ...e.gridRegion, sourceApiUrl: `${e.gridRegion.sourceApiUrl}?api_key=leak` } } : e,
    )
    expect(selectRenderableGridRegions(tampered)).toHaveLength(0)
  })
})
