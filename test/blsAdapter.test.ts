import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BLS_SOURCE_ID,
  fetchBlsObservations,
  normalizeBlsObservations,
  parseBlsResponse,
  readBlsConfig,
} from '../electron/osint/adapters/blsAdapter'
import { buildEntityGraph } from '../src/engine/entityModel'
import { createPersistence } from '../electron/persistence'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FIXTURE = {
  status: 'REQUEST_SUCCEEDED',
  Results: {
    series: [
      {
        seriesID: 'LNS14000000',
        catalog: { series_title: 'Unemployment Rate' },
        data: [
          { year: '2026', period: 'M13', periodName: 'Annual', value: '4.1' }, // annual avg -> skipped
          { year: '2026', period: 'M04', periodName: 'April', value: '4.2' },
          { year: '2026', period: 'M03', periodName: 'March', value: '4.0' },
        ],
      },
      {
        seriesID: 'CUUR0000SA0',
        data: [{ year: '2026', period: 'M04', periodName: 'April', value: '320.5' }],
      },
      {
        // Malformed: non-numeric value, no valid observation -> dropped.
        seriesID: 'BADSERIES01',
        data: [{ year: '2026', period: 'M04', periodName: 'April', value: '-' }],
      },
    ],
  },
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('BLS adapter', () => {
  it('is public by default, supports an optional key, and refuses insecure overrides', () => {
    expect(readBlsConfig({})).not.toBeNull()
    expect(readBlsConfig({})?.apiKey).toBeUndefined()
    expect(readBlsConfig({ ATLASZ_BLS_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readBlsConfig({ ATLASZ_BLS_DISABLE: '1' })).toBeNull()
    expect(readBlsConfig({ ATLASZ_BLS_API_BASE: 'http://insecure' })).toBeNull()
    expect(readBlsConfig({ ATLASZ_BLS_SERIES: 'LNS14000000,bad' })?.series.map((s) => s.seriesId)).toEqual(['LNS14000000'])
  })

  it('normalizes the latest periodic observation, skipping annual-average periods', () => {
    const records = parseBlsResponse(FIXTURE, { retrievedAt: NOW })
    const unrate = records.find((r) => r.seriesId === 'LNS14000000')
    expect(unrate?.period).toBe('M04') // M13 annual avg skipped, newest periodic taken
    expect(unrate?.value).toBe(4.2)
    expect(unrate?.observationDate).toBe('2026-04-01')
    expect(unrate?.title).toBe('Unemployment Rate') // from catalog
    const events = normalizeBlsObservations(records)
    const ev = events.find((e) => e.blsObservation?.seriesId === 'LNS14000000')
    expect(ev?.category).toBe('macro-event')
    expect(ev?.provenance).toBe('official-api')
    expect(ev?.confidence).toBe(96)
    expect(ev?.sourceId).toBe(BLS_SOURCE_ID)
    expect(ev?.sourceUrl).toBe('https://data.bls.gov/timeseries/LNS14000000')
    expect(ev?.affectedAssets).toEqual([])
  })

  it('drops malformed series and never persists the key in the source trail', () => {
    const records = parseBlsResponse(FIXTURE, { retrievedAt: NOW })
    expect(records.find((r) => r.seriesId === 'BADSERIES01')).toBeUndefined()
    for (const record of records) {
      expect(record.sourceApiUrl).not.toMatch(/registrationkey|secret/i)
      expect(record.rawPayloadJson ?? '').not.toMatch(/secret/)
    }
  })

  it('links the observation to a macro-series entity in the graph', () => {
    const events = normalizeBlsObservations(parseBlsResponse(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    const graph = buildEntityGraph(events, { now: NOW })
    const series = graph.nodes.find((n) => n.id === 'macro-series:lns14000000')
    expect(series).toBeDefined()
    expect(series?.kind).toBe('macro-series')
  })

  it('round-trips the BLS sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-bls-'))
    dirs.push(dir)
    const event = normalizeBlsObservations(parseBlsResponse(FIXTURE, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.blsObservation)
    expect(restored?.blsObservation?.seriesId).toBe(event.blsObservation?.seriesId)
    expect(restored?.blsObservation?.value).toBe(event.blsObservation?.value)
    expect(restored?.blsObservation?.rawPayloadHash).toBe(event.blsObservation?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseBlsResponse(null)).toEqual([])
    expect(parseBlsResponse({ Results: { series: [] } })).toEqual([])
    expect(normalizeBlsObservations([])).toEqual([])

    let sentBody: string | undefined
    vi.stubGlobal('fetch', async (_url: string, init: { body?: string }) => {
      sentBody = init?.body
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }
    })
    await expect(
      fetchBlsObservations(new AbortController().signal, { apiBase: 'https://api.bls.gov/publicAPI/v2', series: [{ seriesId: 'LNS14000000', label: 'Unemployment rate' }], apiKey: 'secret' }),
    ).rejects.toMatchObject({ status: 429 })
    // Registration key was sent in the body (not the URL).
    expect(sentBody).toContain('registrationkey')
    expect(sentBody).toContain('secret')
  })
})
