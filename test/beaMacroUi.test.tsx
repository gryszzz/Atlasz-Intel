import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BeaMacroContextCards } from '../src/components/quant/QuantTerminalView'
import type { BeaObservation } from '../src/worldIntel'

const observation: BeaObservation = {
  id: 'bea_public:nipa:t10101:1:2026q1',
  datasetName: 'NIPA',
  tableName: 'T10101',
  lineNumber: '1',
  lineDescription: 'Gross domestic product',
  seriesCode: 'A191RL',
  timePeriod: '2026Q1',
  observationDate: '2026-03-01',
  observationTimestamp: Date.parse('2026-03-01T00:00:00Z'),
  metricName: 'T10101 line 1: Gross domestic product',
  metricValue: 3.8,
  rawValue: '3.8',
  units: 'Percent change',
  unitMultiplier: '0',
  sourceUrl: 'https://www.bea.gov/data/gdp/gross-domestic-product',
  sourceApiUrl:
    'https://apps.bea.gov/api/data?method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=X&ResultFormat=JSON',
  sourceName: 'U.S. Bureau of Economic Analysis',
  retrievedAt: Date.parse('2026-06-01T12:00:00Z'),
  provenance: 'official-api',
  confidence: 96,
  rawPayloadHash: 'hash',
  rawPayloadJson: '{"datasetName":"NIPA"}',
}

describe('BEA macro context UI slice', () => {
  it('renders official BEA observations with source trail, freshness, table, period, and confidence', () => {
    const html = renderToStaticMarkup(<BeaMacroContextCards observations={[observation]} />)

    expect(html).toContain('BEA Source Trail')
    expect(html).toContain('T10101')
    expect(html).toContain('Gross domestic product')
    expect(html).toContain('U.S. Bureau of Economic Analysis')
    expect(html).toContain('Freshness')
    expect(html).toContain('Dataset')
    expect(html).toContain('Period')
    expect(html).toContain('96%')
    expect(html).toContain('2026Q1')
    expect(html).toContain('BEA source trail')
    expect(html).toContain('Official API URL')
    expect(html).toContain('https://www.bea.gov/data/gdp/gross-domestic-product')
    expect(html).toContain('https://apps.bea.gov/api/data')
    expect(html).not.toContain('UserID=')
  })

  it('renders explicit unavailable state with no synthetic GDP data', () => {
    const html = renderToStaticMarkup(<BeaMacroContextCards observations={[]} />)

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('BEA macro observations unavailable')
    expect(html).toContain('no GDP data is simulated')
  })
})
