import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EiaFacilitySourceTrail } from '../src/components/intel/EiaFacilitySourceTrail'
import { selectRenderableFacilities } from '../src/components/intel/eiaFacilityTrailSelect'
import { normalizeEiaFacilities, parseEiaFacilities } from '../electron/osint/adapters/eiaFacilityAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const API_URL = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly'

const FIXTURE = {
  response: {
    data: [
      {
        period: '2026-04',
        plantid: '55555',
        plantName: 'Sunrise Solar',
        entityName: 'NextEra Energy',
        stateid: 'CA',
        stateName: 'California',
        county: 'Kern',
        technology: 'Solar Photovoltaic',
        'energy-source-code': 'SUN',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '250',
        latitude: '35.1',
        longitude: '-119.2',
      },
      {
        period: '2026-04',
        plantid: '66666',
        plantName: 'Riverbend Station',
        entityName: 'Harris County Power Authority',
        stateid: 'TX',
        stateName: 'Texas',
        county: 'Harris',
        technology: 'Natural Gas Fired Combined Cycle',
        'energy-source-code': 'NG',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '600',
      },
    ],
  },
}

const events = normalizeEiaFacilities(parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))

describe('EIA facility source-trail UI', () => {
  it('renders facilities with the required disclaimer and precision labels', () => {
    const html = renderToStaticMarkup(<EiaFacilitySourceTrail events={events} now={NOW} />)
    expect(html).toContain('Sunrise Solar')
    expect(html).toContain('Riverbend Station')
    expect(html).toContain('Facility location context, not verified outage/disruption.')
    // Precision is rendered for both the coordinate-backed and region-only facilities.
    expect(html).toContain('exact coordinates')
    expect(html).toContain('region only')
    // api_key is never present in rendered source URLs.
    expect(html).not.toMatch(/api_key=(?!REDACTED)/)
  })

  it('shows DATA_UNAVAILABLE when there are no facilities', () => {
    const html = renderToStaticMarkup(<EiaFacilitySourceTrail events={[]} now={NOW} />)
    expect(html).toContain('DATA_UNAVAILABLE')
  })

  it('proof-gate excludes facilities whose source API URL leaks an api_key', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.eiaFacility
        ? { ...e, eiaFacility: { ...e.eiaFacility, sourceApiUrl: `${e.eiaFacility.sourceApiUrl}&api_key=leak` } }
        : e,
    )
    expect(selectRenderableFacilities(tampered)).toHaveLength(0)
  })

  it('proof-gate excludes a facility that claims exact precision without coordinates', () => {
    const tampered: WorldIntelEvent[] = events.map((e) =>
      e.eiaFacility && e.eiaFacility.geospatialPrecision === 'region-only'
        ? { ...e, eiaFacility: { ...e.eiaFacility, geospatialPrecision: 'exact' as const } }
        : e,
    )
    // Riverbend (region-only, no coords) now falsely claims 'exact' -> dropped; Sunrise stays.
    const rendered = selectRenderableFacilities(tampered)
    expect(rendered.map((f) => f.facilityId)).toEqual(['55555'])
  })
})
