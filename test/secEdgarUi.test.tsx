import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorldEntityDetailPanel } from '../src/components/world/WorldEntityDetailPanel.lazy'
import { buildAssetIdentity, type SecCompanyFiling } from '../src/worldIntel'

const filing: SecCompanyFiling = {
  id: 'sec_edgar_public:0000320193-26-000050',
  cik: '320193',
  companyName: 'APPLE INC.',
  ticker: 'AAPL',
  formType: '8-K',
  accessionNumber: '0000320193-26-000050',
  filingDate: '2026-06-01',
  reportDate: '2026-05-31',
  acceptedAt: Date.parse('2026-06-01T13:00:00Z'),
  observedAt: Date.parse('2026-06-01T13:00:00Z'),
  primaryDocument: 'aapl-20260601.htm',
  sourceUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019326000050/aapl-20260601.htm',
  sourceJsonUrl: 'https://data.sec.gov/submissions/CIK0000320193.json',
  sourceName: 'SEC EDGAR',
  provenance: 'public-disclosure',
  confidence: 96,
  rawPayloadHash: 'hash',
  rawPayloadJson: '{"accessionNumber":"0000320193-26-000050"}',
}

describe('SEC EDGAR entity UI slice', () => {
  it('renders latest official filings with source, freshness, confidence, and SEC trail', () => {
    const html = renderToStaticMarkup(
      <WorldEntityDetailPanel
        countries={[]}
        assets={[buildAssetIdentity('AAPL')]}
        secFilings={[filing]}
        favoriteIds={new Set()}
        onToggleFavorite={async () => undefined}
        onSelectTicker={() => undefined}
      />,
    )

    expect(html).toContain('Latest SEC Filings')
    expect(html).toContain('8-K')
    expect(html).toContain('96% confidence')
    expect(html).toContain('public disclosure')
    expect(html).toContain('SEC source trail')
    expect(html).toContain('https://www.sec.gov/Archives/edgar/data/320193/000032019326000050/aapl-20260601.htm')
  })

  it('renders an explicit SEC unavailable state when no filing metadata is persisted', () => {
    const html = renderToStaticMarkup(
      <WorldEntityDetailPanel
        countries={[]}
        assets={[buildAssetIdentity('NVDA')]}
        secFilings={[]}
        favoriteIds={new Set()}
        onToggleFavorite={async () => undefined}
        onSelectTicker={() => undefined}
      />,
    )

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('SEC filings unavailable for this entity')
  })
})
