import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FredMacroContextCards } from '../src/components/quant/QuantTerminalView'
import type { FredMacroObservation } from '../src/worldIntel'

const observation: FredMacroObservation = {
  id: 'macro_calendar_fred:CPIAUCSL:2026-05-01',
  seriesId: 'CPIAUCSL',
  title: 'Consumer Price Index for All Urban Consumers',
  units: 'Index 1982-1984=100',
  frequency: 'Monthly',
  seasonalAdjustment: 'Seasonally Adjusted',
  observationDate: '2026-05-01',
  observationTimestamp: Date.parse('2026-05-01T00:00:00Z'),
  value: 320.1,
  rawValue: '320.1',
  sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
  sourceApiUrl: 'https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&file_type=json&limit=1',
  sourceName: 'FRED (Federal Reserve Economic Data)',
  retrievedAt: Date.parse('2026-06-01T12:00:00Z'),
  provenance: 'official-api',
  confidence: 96,
  rawPayloadHash: 'hash',
  rawPayloadJson: '{"seriesId":"CPIAUCSL"}',
}

describe('FRED macro context UI slice', () => {
  it('renders official macro cards with source, freshness, series ID, confidence, and last observation date', () => {
    const html = renderToStaticMarkup(<FredMacroContextCards observations={[observation]} />)

    expect(html).toContain('FRED Source Trail')
    expect(html).toContain('CPIAUCSL')
    expect(html).toContain('Consumer Price Index for All Urban Consumers')
    expect(html).toContain('FRED (Federal Reserve Economic Data)')
    expect(html).toContain('Freshness')
    expect(html).toContain('Series ID')
    expect(html).toContain('96%')
    expect(html).toContain('2026-05-01')
    expect(html).toContain('FRED source trail')
    expect(html).toContain('https://fred.stlouisfed.org/series/CPIAUCSL')
  })

  it('renders an explicit unavailable state when no FRED records are persisted', () => {
    const html = renderToStaticMarkup(<FredMacroContextCards observations={[]} />)

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('FRED macro observations unavailable')
    expect(html).toContain('ATLASZ_FRED_API_KEY')
  })
})
