import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NuclearPlantSourceTrail } from '../src/components/intel/NuclearPlantSourceTrail'
import { NrcReactorStatusSourceTrail } from '../src/components/intel/NrcReactorStatusSourceTrail'
import { selectRenderableNuclearPlants } from '../src/components/intel/nuclearPlantTrailSelect'
import { normalizeEiaNuclearPlants, parseEiaNuclearPlants } from '../electron/osint/adapters/eiaNuclearAdapter'
import { normalizeNrcReactorStatus, parseNrcReactorStatus } from '../electron/osint/adapters/nrcReactorStatusAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const EIA_API = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly'
const NRC_URL = 'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt'

const EIA_FIXTURE = {
  response: {
    data: [
      { period: '2026-04', plantid: '6008', plantName: 'Vogtle', entityName: 'Southern Company', stateid: 'GA', stateName: 'Georgia', county: 'Burke', technology: 'Nuclear', 'energy-source-code': 'NUC', statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '2430', latitude: '33.14', longitude: '-81.76' },
      { period: '2026-04', plantid: '7100', plantName: 'Mystery Nuclear', entityName: 'Local Nuclear Authority', stateid: 'IL', stateName: 'Illinois', technology: 'Nuclear', 'energy-source-code': 'NUC', statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '1000' },
    ],
  },
}
const NRC_FEED = ['ReportDt|Unit|Power', '6/17/2026 12:00:00 AM|Vogtle 3|97', '6/17/2026 12:00:00 AM|Arkansas Nuclear 1|0'].join('\n')

const nukeEvents = normalizeEiaNuclearPlants(parseEiaNuclearPlants(EIA_FIXTURE, { retrievedAt: NOW, sourceApiUrl: EIA_API }))
const nrcEvents = normalizeNrcReactorStatus(parseNrcReactorStatus(NRC_FEED, { retrievedAt: NOW, sourceUrl: NRC_URL }))

describe('Nuclear plant UI (Layer 1)', () => {
  it('renders plants with the safety-careful disclaimer and precision labels', () => {
    const html = renderToStaticMarkup(<NuclearPlantSourceTrail events={nukeEvents} now={NOW} />)
    expect(html).toContain('Vogtle')
    expect(html).toContain('Facility location context, not verified outage, safety condition, or disruption.')
    expect(html).toContain('exact coordinates')
    expect(html).toContain('region only')
    expect(html).not.toMatch(/\b(unsafe|meltdown|was damaged|under attack|targeted|emergency)\b/i)
  })

  it('shows DATA_UNAVAILABLE when empty and proof-gates a leaked api_key', () => {
    expect(renderToStaticMarkup(<NuclearPlantSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
    const tampered: WorldIntelEvent[] = nukeEvents.map((e) =>
      e.nuclearPlant ? { ...e, nuclearPlant: { ...e.nuclearPlant, sourceApiUrl: `${e.nuclearPlant.sourceApiUrl}&api_key=leak` } } : e,
    )
    expect(selectRenderableNuclearPlants(tampered)).toHaveLength(0)
  })
})

describe('NRC reactor status UI (Layer 2)', () => {
  it('renders the status table with the regulator-only disclaimer', () => {
    const html = renderToStaticMarkup(<NrcReactorStatusSourceTrail events={nrcEvents} now={NOW} />)
    expect(html).toContain('Vogtle 3')
    expect(html).toContain('97%')
    expect(html).toMatch(/not a safety, outage, or disruption assessment/i)
    expect(html).not.toMatch(/\b(unsafe|meltdown|emergency|disrupted)\b/i)
  })

  it('shows DATA_UNAVAILABLE when empty', () => {
    expect(renderToStaticMarkup(<NrcReactorStatusSourceTrail events={[]} now={NOW} />)).toContain('DATA_UNAVAILABLE')
  })
})
