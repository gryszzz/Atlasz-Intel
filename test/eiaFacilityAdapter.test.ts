import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EIA_FACILITY_SOURCE_ID,
  fetchEiaFacilities,
  normalizeEiaFacilities,
  parseEiaFacilities,
  readEiaFacilityConfig,
} from '../electron/osint/adapters/eiaFacilityAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const API_URL = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw'
const dirs: string[] = []

const FIXTURE = {
  response: {
    data: [
      // Plant 55555 — NextEra (exact identity), two solar units, source coordinates.
      {
        period: '2026-04',
        plantid: '55555',
        plantName: 'Sunrise Solar',
        generatorid: 'SOL1',
        entityid: '1111',
        entityName: 'NextEra Energy',
        stateid: 'CA',
        stateName: 'California',
        county: 'Kern',
        technology: 'Solar Photovoltaic',
        'energy-source-code': 'SUN',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '100',
        'balancing-authority-code': 'CISO',
        latitude: '35.1',
        longitude: '-119.2',
      },
      {
        period: '2026-04',
        plantid: '55555',
        plantName: 'Sunrise Solar',
        generatorid: 'SOL2',
        entityid: '1111',
        entityName: 'NextEra Energy',
        stateid: 'CA',
        stateName: 'California',
        county: 'Kern',
        technology: 'Solar Photovoltaic',
        'energy-source-code': 'SUN',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '150',
        'balancing-authority-code': 'CISO',
        latitude: '35.1',
        longitude: '-119.2',
      },
      // Plant 66666 — local operator (no market identity), gas, NO coordinates.
      {
        period: '2026-04',
        plantid: '66666',
        plantName: 'Riverbend Station',
        generatorid: 'GT1',
        entityid: '2222',
        entityName: 'Harris County Power Authority',
        stateid: 'TX',
        stateName: 'Texas',
        county: 'Harris',
        technology: 'Natural Gas Fired Combined Cycle',
        'energy-source-code': 'NG',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '600',
      },
      // Plant 88888 — near-but-not-exact operator name (proves no fuzzy merge).
      {
        period: '2026-04',
        plantid: '88888',
        plantName: 'Windy Ridge',
        generatorid: 'WT1',
        entityid: '3333',
        entityName: 'NextEra Energy Resources, LLC',
        stateid: 'TX',
        stateName: 'Texas',
        county: 'Nolan',
        technology: 'Onshore Wind Turbine',
        'energy-source-code': 'WND',
        statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '200',
        latitude: '32.3',
        longitude: '-100.4',
      },
      // Malformed — no plant id and no plant name. Must be dropped.
      { period: '2026-04', generatorid: 'X', 'nameplate-capacity-mw': '5' },
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('EIA power-plant facility adapter', () => {
  it('is key-gated and refuses insecure overrides', () => {
    expect(readEiaFacilityConfig({})).toBeNull()
    expect(readEiaFacilityConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readEiaFacilityConfig({ ATLASZ_EIA_FACILITIES_DISABLE: '1', ATLASZ_EIA_API_KEY: 'secret' })).toBeNull()
    expect(readEiaFacilityConfig({ ATLASZ_EIA_API_KEY: 'secret', ATLASZ_EIA_API_BASE: 'http://insecure' })).toBeNull()
    expect(readEiaFacilityConfig({ ATLASZ_EIA_API_KEY: 'secret', ATLASZ_EIA_FACILITY_STATES: 'ca, bad, tx' })?.states).toEqual(['CA', 'TX'])
  })

  it('aggregates generator rows into power-plant facilities with proof fields', () => {
    const facilities = parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    const sunrise = facilities.find((f) => f.facilityId === '55555')
    expect(sunrise).toMatchObject({
      facilityName: 'Sunrise Solar',
      facilityKind: 'power-plant',
      operatorName: 'NextEra Energy',
      primaryFuel: 'Solar',
      energySource: 'SUN',
      capacityMw: 250,
      unitCount: 2,
      status: '(OP) Operating',
      state: 'CA',
      stateName: 'California',
      county: 'Kern',
      balancingAuthority: 'CISO',
      latitude: 35.1,
      longitude: -119.2,
      geospatialPrecision: 'exact',
      provenance: 'official-api',
      confidence: 95,
    })
    expect(sunrise?.sourceUrl).toMatch(/^https:\/\/www\.eia\.gov\//)
    expect(sunrise?.sourceApiUrl).not.toContain('api_key=')
    expect(sunrise?.rawPayloadHash.length).toBeGreaterThan(0)
  })

  it('labels missing lat/lon as region-only, never guessing coordinates', () => {
    const facilities = parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    const riverbend = facilities.find((f) => f.facilityId === '66666')
    expect(riverbend?.latitude).toBeUndefined()
    expect(riverbend?.longitude).toBeUndefined()
    expect(riverbend?.geospatialPrecision).toBe('region-only')
  })

  it('drops malformed rows rather than repairing them', () => {
    expect(parseEiaFacilities(null)).toEqual([])
    expect(parseEiaFacilities({ error: 'bad request', code: 400 })).toEqual([])
    const facilities = parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    // 3 valid plants; the no-id/no-name row is dropped.
    expect(facilities.map((f) => f.facilityId).sort()).toEqual(['55555', '66666', '88888'])
  })

  it('links operator to a market company ONLY on an exact identity (no fuzzy merge)', () => {
    const facilities = parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(facilities.find((f) => f.facilityId === '55555')?.operatorTicker).toBe('NEE')
    // "Harris County Power Authority" — no identity.
    expect(facilities.find((f) => f.facilityId === '66666')?.operatorTicker).toBeUndefined()
    // "NextEra Energy Resources, LLC" is NOT an exact key for NextEra Energy.
    expect(facilities.find((f) => f.facilityId === '88888')?.operatorTicker).toBeUndefined()
  })

  it('links facility -> state/county/fuel/operator/source in the evidence graph', () => {
    const events = normalizeEiaFacilities(parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))

    expect(ids.has('facility:55555')).toBe(true)
    expect(ids.has('place:state:ca')).toBe(true)
    expect(ids.has('place:county:ca:kern')).toBe(true)
    expect(ids.has('commodity:solar')).toBe(true)
    expect(ids.has('company:nextera-energy')).toBe(true)
    expect(ids.has('ticker:nee')).toBe(true)
    expect(ids.has('source:eia_power_plants_public')).toBe(true)

    const rels = graph.relationships.map((r) => r.relation)
    expect(rels).toContain('located_in')
    expect(rels).toContain('fueled_by')
    expect(rels).toContain('operated_by')

    // No fuzzy operator merge: facility 88888 has no operated_by edge.
    const windyOperatedBy = graph.relationships.some((r) => r.from === 'facility:88888' && r.relation === 'operated_by')
    expect(windyOperatedBy).toBe(false)
  })

  it('persists facility sub-records and rehydrates them (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-eia-fac-'))
    dirs.push(dir)
    const persistence = createPersistence(dir)
    const event = normalizeEiaFacilities(parseEiaFacilities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).find(
      (e) => e.eiaFacility?.facilityId === '55555',
    )
    if (!event) throw new Error('missing fixture facility event')
    persistence.saveWorldIntelEvent(event)

    const stored = createPersistence(dir)
      .listWorldIntelEvents()
      .find((candidate) => candidate.eiaFacility?.facilityId === '55555')
    expect(stored?.eiaFacility?.facilityName).toBe('Sunrise Solar')
    expect(stored?.eiaFacility?.capacityMw).toBe(250)
    expect(stored?.eiaFacility?.geospatialPrecision).toBe('exact')
    expect(stored?.eiaFacility?.rawPayloadHash).toBe(event.eiaFacility?.rawPayloadHash)
  })

  it('sends api_key only on the live request and fails closed on rate-limit', async () => {
    let sentUrl = ''
    vi.stubGlobal('fetch', async (url: URL) => {
      sentUrl = url.toString()
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })
    const events = await fetchEiaFacilities(new AbortController().signal, {
      apiBase: 'https://api.eia.gov/v2',
      apiKey: 'secret-eia-key',
      states: [],
      maxFacilities: 50,
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })
    expect(sentUrl).toContain('api_key=secret-eia-key')
    expect(events[0].sourceId).toBe(EIA_FACILITY_SOURCE_ID)
    expect(events[0].eiaFacility?.sourceApiUrl).not.toContain('secret-eia-key')
    expect(events[0].eiaFacility?.rawPayloadJson ?? '').not.toContain('secret-eia-key')

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchEiaFacilities(new AbortController().signal, {
        apiBase: 'https://api.eia.gov/v2',
        apiKey: 'secret-eia-key',
        states: [],
        maxFacilities: 50,
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
