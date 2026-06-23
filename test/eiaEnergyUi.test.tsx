import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EiaEnergyContextCards } from '../src/components/quant/QuantTerminalView'
import type { EiaEnergyRecord } from '../src/worldIntel'

const record: EiaEnergyRecord = {
  id: 'eia_energy_public:PET.RWTC.D:2026-06-17',
  seriesId: 'PET.RWTC.D',
  title: 'Cushing, OK WTI spot price FOB',
  energyCategory: 'Petroleum',
  commodity: 'Crude Oil',
  region: 'United States',
  countryCode: 'US',
  period: '2026-06-17',
  observationDate: '2026-06-17',
  observationTimestamp: Date.parse('2026-06-17T00:00:00Z'),
  value: 78.42,
  rawValue: '78.42',
  units: 'Dollars per Barrel',
  sourceUrl: 'https://www.eia.gov/opendata/browser/petroleum/pri/spt',
  sourceApiUrl: 'https://api.eia.gov/v2/seriesid/PET.RWTC.D?length=1',
  sourceName: 'U.S. Energy Information Administration',
  retrievedAt: Date.parse('2026-06-18T12:00:00Z'),
  provenance: 'official-api',
  confidence: 96,
  rawPayloadHash: 'hash',
  rawPayloadJson: '{"seriesId":"PET.RWTC.D"}',
}

describe('EIA energy context UI slice', () => {
  it('renders official EIA records with source trail, freshness, commodity, date, and confidence', () => {
    const html = renderToStaticMarkup(<EiaEnergyContextCards records={[record]} />)

    expect(html).toContain('EIA Energy Source Trail')
    expect(html).toContain('PET.RWTC.D')
    expect(html).toContain('Cushing, OK WTI spot price FOB')
    expect(html).toContain('U.S. Energy Information Administration')
    expect(html).toContain('Freshness')
    expect(html).toContain('Commodity')
    expect(html).toContain('Crude Oil')
    expect(html).toContain('Observation')
    expect(html).toContain('2026-06-17')
    expect(html).toContain('96%')
    expect(html).toContain('EIA source trail')
    expect(html).toContain('Official API URL')
    expect(html).toContain('https://www.eia.gov/opendata/browser/petroleum/pri/spt')
    expect(html).toContain('https://api.eia.gov/v2/seriesid/PET.RWTC.D?length=1')
    expect(html).not.toContain('api_key=')
  })

  it('renders explicit unavailable state with no synthetic energy values', () => {
    const html = renderToStaticMarkup(<EiaEnergyContextCards records={[]} />)

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('EIA energy records unavailable')
    expect(html).toContain('no energy data or commodity alerts are simulated')
  })
})
