import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NOAA_ALERTS_SOURCE_ID,
  fetchNoaaAlerts,
  normalizeNoaaAlerts,
  parseNoaaAlerts,
  readNoaaAlertConfig,
} from '../electron/osint/adapters/noaaAlertAdapter'
import { createPersistence } from '../electron/persistence'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

const FIXTURE = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.aaa',
      type: 'Feature',
      geometry: null,
      properties: {
        '@id': 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.aaa',
        id: 'urn:oid:2.49.0.1.840.0.aaa',
        areaDesc: 'Harris County, TX',
        geocode: { SAME: ['048201'], UGC: ['TXZ213'] },
        event: 'Flood Warning',
        headline: 'Flood Warning issued for Harris County',
        description: 'Heavy rainfall   causing   river flooding.',
        severity: 'Severe',
        urgency: 'Immediate',
        certainty: 'Observed',
        sent: '2026-06-22T08:00:00-05:00',
        effective: '2026-06-22T08:00:00-05:00',
        onset: '2026-06-22T08:30:00-05:00',
        expires: '2026-06-22T20:00:00-05:00',
        senderName: 'NWS Houston TX',
      },
    },
    {
      // Malformed: unknown severity + non-NWS url -> dropped, not repaired.
      id: 'https://evil.example/x',
      type: 'Feature',
      properties: { '@id': 'https://evil.example/x', id: 'bad', event: '', severity: 'Catastrophic', effective: 'nope' },
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('NOAA / NWS alerts adapter', () => {
  it('is public by default and refuses insecure overrides', () => {
    expect(readNoaaAlertConfig({})).not.toBeNull()
    expect(readNoaaAlertConfig({})?.userAgent).toBeTruthy()
    expect(readNoaaAlertConfig({ ATLASZ_NOAA_DISABLE: '1' })).toBeNull()
    expect(readNoaaAlertConfig({ ATLASZ_NOAA_ALERTS_URL: 'http://insecure' })).toBeNull()
  })

  it('normalizes alerts with official-api provenance, NWS severity (not inflated), and source trail', () => {
    const records = parseNoaaAlerts(FIXTURE, { retrievedAt: NOW })
    const events = normalizeNoaaAlerts(records)
    const flood = events.find((e) => e.weatherAlert?.event === 'Flood Warning')
    expect(flood?.category).toBe('weather-alert')
    expect(flood?.provenance).toBe('official-api')
    expect(flood?.confidence).toBe(96)
    expect(flood?.sourceId).toBe(NOAA_ALERTS_SOURCE_ID)
    expect(flood?.sourceUrl).toMatch(/^https:\/\/api\.weather\.gov\/alerts\//)
    // Severity comes straight from NWS ("Severe" -> elevated), never inflated.
    expect((flood?.severity as Severity)).toBe('elevated')
    expect(flood?.weatherAlert?.urgency).toBe('Immediate')
    expect(flood?.weatherAlert?.certainty).toBe('Observed')
    expect(flood?.weatherAlert?.sameCodes).toEqual(['048201'])
    expect(flood?.weatherAlert?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(flood?.affectedAssets).toEqual([])
  })

  it('drops malformed alerts (unknown severity / non-NWS url), never repairs them', () => {
    const records = parseNoaaAlerts(FIXTURE, { retrievedAt: NOW })
    expect(records.find((r) => r.alertId === 'bad')).toBeUndefined()
    expect(records.every((r) => /^https:\/\/api\.weather\.gov\/alerts\//.test(r.sourceUrl))).toBe(true)
  })

  it('adds US country context without inventing ticker exposure', () => {
    const events = normalizeNoaaAlerts(parseNoaaAlerts(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    // Weather alerts carry a real country context but no ticker/cik/commodity.
    // The resolver/exposure layer can map later only through explicit curated seeds.
    expect(events[0]?.countryCodes).toEqual(['US'])
    expect(events[0]?.affectedAssets).toEqual([])
    expect(events[0]?.affectedCommodities).toEqual([])
  })

  it('round-trips the weather alert sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-noaa-'))
    dirs.push(dir)
    const event = normalizeNoaaAlerts(parseNoaaAlerts(FIXTURE, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.weatherAlert)
    expect(restored?.weatherAlert?.alertId).toBe(event.weatherAlert?.alertId)
    expect(restored?.weatherAlert?.event).toBe(event.weatherAlert?.event)
    expect(restored?.weatherAlert?.rawPayloadHash).toBe(event.weatherAlert?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseNoaaAlerts(null)).toEqual([])
    expect(parseNoaaAlerts({ features: [] })).toEqual([])
    expect(normalizeNoaaAlerts([])).toEqual([])

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '3' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchNoaaAlerts(new AbortController().signal, {
        alertsUrl: 'https://api.weather.gov/alerts/active',
        userAgent: 'Atlasz',
        maxRecords: 10,
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 3_000 })
  })
})
