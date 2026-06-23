import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TreasuryFiscalContextCards } from '../src/components/quant/QuantTerminalView'
import type { TreasuryFiscalRecord } from '../src/worldIntel'

const record: TreasuryFiscalRecord = {
  id: 'treasury_fiscal_public:debt_to_penny:tot_pub_debt_out_amt:2026-06-17',
  datasetId: 'debt_to_penny',
  datasetName: 'Debt to the Penny',
  tableId: 'debt_to_penny',
  tableName: 'Debt to the Penny',
  recordDate: '2026-06-17',
  recordTimestamp: Date.parse('2026-06-17T00:00:00Z'),
  metricName: 'Total Public Debt Outstanding',
  metricValue: 39283052266270.91,
  rawValue: '39283052266270.91',
  units: 'USD',
  sourceUrl: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
  sourceApiUrl:
    'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1',
  sourceName: 'U.S. Treasury Fiscal Data',
  retrievedAt: Date.parse('2026-06-18T12:00:00Z'),
  provenance: 'official-api',
  confidence: 96,
  rawPayloadHash: 'hash',
  rawPayloadJson: '{"datasetId":"debt_to_penny"}',
}

describe('Treasury fiscal context UI slice', () => {
  it('renders official fiscal records with source trail, freshness, dataset, table, date, and confidence', () => {
    const html = renderToStaticMarkup(<TreasuryFiscalContextCards records={[record]} />)

    expect(html).toContain('Treasury Source Trail')
    expect(html).toContain('debt_to_penny')
    expect(html).toContain('Total Public Debt Outstanding')
    expect(html).toContain('U.S. Treasury Fiscal Data')
    expect(html).toContain('Freshness')
    expect(html).toContain('Dataset')
    expect(html).toContain('Table')
    expect(html).toContain('Record date')
    expect(html).toContain('96%')
    expect(html).toContain('2026-06-17')
    expect(html).toContain('Treasury source trail')
    expect(html).toContain('Official API URL')
    expect(html).toContain('https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/')
    expect(html).toContain('https://api.fiscaldata.treasury.gov/services/api/fiscal_service')
  })

  it('renders explicit unavailable state with no synthetic fiscal values', () => {
    const html = renderToStaticMarkup(<TreasuryFiscalContextCards records={[]} />)

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('Treasury Fiscal Data records unavailable')
    expect(html).toContain('no fiscal data is simulated')
  })
})
