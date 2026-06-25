import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WhatToWatchPanel } from '../src/components/intel/WhatToWatchPanel'
import { MarketCoverageDashboard } from '../src/components/intel/MarketCoverageDashboard'
import { MissingMarketDataPanel } from '../src/components/intel/MissingMarketDataPanel'
import { MarketQuoteSourceTrail } from '../src/components/intel/MarketQuoteSourceTrail'
import { OptionsSourceTrail } from '../src/components/intel/OptionsSourceTrail'

const NOW = Date.parse('2026-06-18T12:00:00Z')

/**
 * Smoke: every intelligence/market panel renders an honest EMPTY STATE with no
 * data and no crash — no blank panels, no fabricated content, no source trail
 * without proof.
 */
describe('UI panel smoke (empty states render, no crash)', () => {
  it('WhatToWatch shows DATA_UNAVAILABLE with no events', () => {
    const html = renderToStaticMarkup(<WhatToWatchPanel events={[]} now={NOW} />)
    expect(html).toContain('What To Watch Next')
    expect(html).toContain('DATA_UNAVAILABLE')
  })

  it('Market Coverage Dashboard renders with no sources/events', () => {
    const html = renderToStaticMarkup(<MarketCoverageDashboard sources={[]} events={[]} now={NOW} />)
    expect(html).toContain('Market Coverage Dashboard')
    expect(html).toMatch(/missing/i)
  })

  it('Missing Market Data panel lists source-needed/key-gated', () => {
    const html = renderToStaticMarkup(<MissingMarketDataPanel />)
    expect(html).toContain('Missing Market Data')
    expect(html).toMatch(/source needed|key required/i)
  })

  it('Market Quote source trail shows PRICE_UNAVAILABLE with no quotes', () => {
    const html = renderToStaticMarkup(<MarketQuoteSourceTrail now={NOW} />)
    expect(html).toContain('PRICE_UNAVAILABLE')
  })

  it('Options source trail shows OPTION_DATA_UNAVAILABLE with no contracts', () => {
    const html = renderToStaticMarkup(<OptionsSourceTrail now={NOW} />)
    expect(html).toContain('OPTION_DATA_UNAVAILABLE')
  })
})
