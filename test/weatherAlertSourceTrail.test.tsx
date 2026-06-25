import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WeatherAlertSourceTrail } from '../src/components/intel/WeatherAlertSourceTrail'
import { selectRenderableAlerts } from '../src/components/intel/weatherTrailSelect'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

const event: WorldIntelEvent = {
  id: 'world:noaa:flood',
  timestamp: NOW,
  title: 'Flood Warning issued for Harris County',
  summary: 'Flood Warning for Harris County, TX.',
  countryCodes: ['US'],
  region: 'Harris County, TX',
  category: 'weather-alert',
  severity: 'elevated',
  confidence: 96,
  sourceId: 'noaa_alerts_public',
  sourceUrl: 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.aaa',
  provenance: 'official-api',
  affectedAssets: [],
  affectedSectors: [],
  affectedCommodities: [],
  affectedCurrencies: [],
  extractedEntities: ['Flood Warning', 'Harris County, TX'],
  narrativeTags: ['NWS alert', 'Flood Warning', 'Severe'],
  rawPayloadHash: 'abc',
  dedupeHash: 'def',
  weatherAlert: {
    id: 'noaa_alerts_public:urn:oid:2.49.0.1.840.0.aaa',
    alertId: 'urn:oid:2.49.0.1.840.0.aaa',
    event: 'Flood Warning',
    headline: 'Flood Warning issued for Harris County',
    description: 'Heavy rainfall causing river flooding.',
    severity: 'Severe',
    urgency: 'Immediate',
    certainty: 'Observed',
    areaDesc: 'Harris County, TX',
    sameCodes: ['048201'],
    ugcCodes: ['TXZ213'],
    effective: '2026-06-22T08:00:00-05:00',
    effectiveTimestamp: Date.parse('2026-06-22T08:00:00-05:00'),
    onset: '2026-06-22T08:30:00-05:00',
    onsetTimestamp: Date.parse('2026-06-22T08:30:00-05:00'),
    expires: '2026-06-22T20:00:00-05:00',
    expiresTimestamp: Date.parse('2026-06-22T20:00:00-05:00'),
    observedTimestamp: NOW,
    senderName: 'NWS Houston TX',
    sourceUrl: 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.aaa',
    sourceApiUrl: 'https://api.weather.gov/alerts/active',
    sourceName: 'NOAA / National Weather Service',
    retrievedAt: NOW,
    provenance: 'official-api',
    confidence: 96,
    rawPayloadHash: 'a'.repeat(64),
    rawPayloadJson: '{"alertId":"urn:oid:2.49.0.1.840.0.aaa"}',
  },
}

describe('NOAA weather alert source-trail UI', () => {
  it('renders only weather alerts with complete proof fields', () => {
    const html = renderToStaticMarkup(<WeatherAlertSourceTrail events={[event]} now={NOW} />)

    expect(selectRenderableAlerts([event])).toHaveLength(1)
    expect(html).toContain('NOAA Weather Alerts')
    expect(html).toContain('Flood Warning')
    expect(html).toContain('Harris County, TX')
    expect(html).toContain('Severe')
    expect(html).toContain('Immediate')
    expect(html).toContain('Observed')
    expect(html).toContain('96% confidence')
    expect(html).toContain('Alert ID')
    expect(html).toContain('urn:oid:2.49.0.1.840.0.aaa')
    expect(html).toContain('NOAA / National Weather Service')
    expect(html).toContain('Retrieved')
    expect(html).toContain('Payload hash')
    expect(html).toContain('NWS source trail')
    expect(html).toContain('Official API URL')
    expect(html).toContain('https://api.weather.gov/alerts/active')
  })

  it('shows DATA_UNAVAILABLE instead of fabricated weather alerts', () => {
    const html = renderToStaticMarkup(<WeatherAlertSourceTrail events={[]} now={NOW} />)

    expect(html).toContain('DATA_UNAVAILABLE')
    expect(html).toContain('No active NWS alerts available')
    expect(html).toContain('Nothing is fabricated')
  })

  it('rejects alerts without official NOAA/NWS API proof fields', () => {
    const broken: WorldIntelEvent = {
      ...event,
      weatherAlert: event.weatherAlert
        ? {
            ...event.weatherAlert,
            sourceApiUrl: 'https://example.test/not-noaa',
          }
        : undefined,
    }

    expect(selectRenderableAlerts([broken])).toEqual([])
  })
})
