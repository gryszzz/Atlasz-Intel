import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EIA_ENERGY_SOURCE_ID,
  fetchEiaEnergyRecords,
  normalizeEiaEnergyRecords,
  parseEiaEnergyResponse,
  readEiaEnergyConfig,
} from '../electron/osint/adapters/eiaEnergyAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const dirs: string[] = []

const FIXTURE = {
  response: {
    data: [
      {
        period: '2026-06-17',
        value: '78.42',
        units: 'Dollars per Barrel',
        'series-description': 'Cushing, OK WTI spot price FOB',
        'area-name': 'United States',
      },
      {
        period: '2026-06-16',
        value: '77.91',
        units: 'Dollars per Barrel',
        'series-description': 'Cushing, OK WTI spot price FOB',
      },
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('EIA energy adapter', () => {
  it('is key-gated and refuses insecure overrides', () => {
    expect(readEiaEnergyConfig({})).toBeNull()
    expect(readEiaEnergyConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readEiaEnergyConfig({ ATLASZ_EIA_DISABLE: '1', ATLASZ_EIA_API_KEY: 'secret' })).toBeNull()
    expect(readEiaEnergyConfig({ ATLASZ_EIA_API_KEY: 'secret', ATLASZ_EIA_API_BASE: 'http://insecure' })).toBeNull()
    expect(readEiaEnergyConfig({ ATLASZ_EIA_API_KEY: 'secret', ATLASZ_EIA_SERIES: 'PET.RWTC.D,bad series' })?.series).toHaveLength(1)
  })

  it('normalizes the latest official EIA energy record with proof fields', () => {
    const records = parseEiaEnergyResponse(FIXTURE, { retrievedAt: NOW })
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      seriesId: 'PET.RWTC.D',
      title: 'Cushing, OK WTI spot price FOB',
      energyCategory: 'Petroleum',
      commodity: 'Crude Oil',
      region: 'United States',
      countryCode: 'US',
      period: '2026-06-17',
      observationDate: '2026-06-17',
      value: 78.42,
      rawValue: '78.42',
      units: 'Dollars per Barrel',
      sourceName: 'U.S. Energy Information Administration',
      provenance: 'official-api',
      confidence: 96,
    })
    expect(records[0].sourceUrl).toContain('https://www.eia.gov/opendata/')
    expect(records[0].sourceApiUrl).toContain('https://api.eia.gov/v2/seriesid/PET.RWTC.D')
    expect(records[0].sourceApiUrl).not.toContain('api_key=')

    const events = normalizeEiaEnergyRecords(records)
    expect(events).toHaveLength(1)
    expect(events[0].sourceId).toBe(EIA_ENERGY_SOURCE_ID)
    expect(events[0].category).toBe('energy-event')
    expect(events[0].affectedAssets).toEqual([])
    expect(events[0].affectedCommodities).toContain('Crude Oil')
    expect(events[0].eiaEnergyRecord?.rawPayloadJson).toContain('Cushing, OK WTI')
  })

  it('drops malformed records rather than repairing them', () => {
    expect(parseEiaEnergyResponse(null)).toEqual([])
    expect(parseEiaEnergyResponse({ error: 'bad request', code: 400 })).toEqual([])
    expect(parseEiaEnergyResponse({ response: { data: [{ period: '2026-06-17', value: '(NA)' }] } })).toEqual([])
    expect(parseEiaEnergyResponse({ response: { data: [{ period: 'bad', value: '10' }] } })).toEqual([])
  })

  it('links energy records to macro-series, commodity, EIA, and country nodes', () => {
    const events = normalizeEiaEnergyRecords(parseEiaEnergyResponse(FIXTURE, { retrievedAt: NOW }))
    const graph = buildEntityGraph(events, { now: NOW })

    expect(graph.nodes.find((node) => node.id === 'macro-series:eia:pet.rwtc.d')).toBeDefined()
    expect(graph.nodes.find((node) => node.id === 'commodity:crude-oil')).toBeDefined()
    expect(graph.nodes.find((node) => node.id === 'institution:u.s.-energy-information-administration')).toBeDefined()
    expect(graph.nodes.find((node) => node.id === 'country:us')).toBeDefined()
    expect(graph.relationships.some((edge) => edge.relation === 'issued_by')).toBe(true)
  })

  it('persists dedicated EIA records and rehydrates EIA event sub-records', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-eia-'))
    dirs.push(dir)
    const persistence = createPersistence(dir)
    const event = normalizeEiaEnergyRecords(parseEiaEnergyResponse(FIXTURE, { retrievedAt: NOW }))[0]
    const record = event.eiaEnergyRecord
    if (!record) throw new Error('missing EIA fixture record')

    persistence.saveEiaEnergyRecord(record)
    persistence.saveWorldIntelEvent(event)

    const storedRecord = createPersistence(dir).listEiaEnergyRecords('PET.RWTC.D', 10)[0]
    expect(storedRecord).toMatchObject({
      seriesId: 'PET.RWTC.D',
      commodity: 'Crude Oil',
      value: 78.42,
      confidence: 96,
    })
    expect(storedRecord.sourceApiUrl).not.toContain('api_key=')
    expect(storedRecord.rawPayloadJson ?? '').not.toMatch(/secret|api_key/i)

    const storedEvent = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.eiaEnergyRecord)
    expect(storedEvent?.eiaEnergyRecord?.seriesId).toBe('PET.RWTC.D')
    expect(storedEvent?.eiaEnergyRecord?.rawPayloadHash).toBe(record.rawPayloadHash)
  })

  it('sends api_key only on the live request and fails closed on HTTP errors', async () => {
    let sentUrl = ''
    vi.stubGlobal('fetch', async (url: URL) => {
      sentUrl = url.toString()
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })

    const events = await fetchEiaEnergyRecords(new AbortController().signal, {
      apiBase: 'https://api.eia.gov/v2',
      apiKey: 'secret-eia-key',
      series: readEiaEnergyConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.series.slice(0, 1) ?? [],
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })

    expect(sentUrl).toContain('api_key=secret-eia-key')
    expect(events[0].eiaEnergyRecord?.sourceApiUrl).not.toContain('secret-eia-key')
    expect(events[0].eiaEnergyRecord?.rawPayloadJson ?? '').not.toContain('secret-eia-key')

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchEiaEnergyRecords(new AbortController().signal, {
        apiBase: 'https://api.eia.gov/v2',
        apiKey: 'secret-eia-key',
        series: readEiaEnergyConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.series.slice(0, 1) ?? [],
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
