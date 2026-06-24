import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EIA_BALANCING_AUTHORITY_SOURCE_ID,
  fetchEiaBalancingAuthorities,
  normalizeBalancingAuthorities,
  parseBalancingAuthorities,
  readEiaBalancingAuthorityConfig,
} from '../electron/osint/adapters/eiaBalancingAuthorityAdapter'
import { normalizeEiaFacilities, parseEiaFacilities } from '../electron/osint/adapters/eiaFacilityAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const FACET_API = 'https://api.eia.gov/v2/electricity/rto/region-data/facet/respondent'
const PLANT_API = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw'
const dirs: string[] = []

const FIXTURE = {
  response: {
    facets: [
      { id: 'CISO', name: 'California Independent System Operator' },
      { id: 'DUK', name: 'Duke Energy Carolinas' },
      { id: '', name: 'no id -> dropped' },
      { id: 'ZZZ', name: '' }, // no name -> dropped
    ],
  },
}

// A power plant carrying a source-backed BA code, to prove the plant -> BA link.
const PLANT_FIXTURE = {
  response: {
    data: [
      {
        period: '2026-04', plantid: '55555', plantName: 'Sunrise Solar', entityName: 'NextEra Energy', stateid: 'CA', stateName: 'California',
        county: 'Kern', technology: 'Solar Photovoltaic', 'energy-source-code': 'SUN', statusDescription: '(OP) Operating',
        'nameplate-capacity-mw': '250', 'balancing-authority-code': 'CISO', latitude: '35.1', longitude: '-119.2',
      },
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('EIA balancing authority adapter', () => {
  it('is key-gated and honors disable', () => {
    expect(readEiaBalancingAuthorityConfig({})).toBeNull()
    expect(readEiaBalancingAuthorityConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readEiaBalancingAuthorityConfig({ ATLASZ_EIA_BA_DISABLE: '1', ATLASZ_EIA_API_KEY: 'secret' })).toBeNull()
  })

  it('parses the respondent facet into region-only BA records with proof fields', () => {
    const regions = parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API })
    expect(regions.map((r) => r.baCode).sort()).toEqual(['CISO', 'DUK'])
    const duke = regions.find((r) => r.baCode === 'DUK')
    expect(duke).toMatchObject({
      baName: 'Duke Energy Carolinas',
      regionKind: 'balancing-authority',
      country: 'US',
      nercRegion: 'SERC',
      operatorName: 'Duke Energy',
      operatorTicker: 'DUK',
      geospatialPrecision: 'region-only',
      provenance: 'official-api',
      confidence: 95,
    })
    expect(duke?.sourceApiUrl).not.toContain('api_key=')
    expect(duke?.sourceUrl).toMatch(/^https:\/\/www\.eia\.gov\//)
  })

  it('drops malformed facets and never claims exact geometry', () => {
    expect(parseBalancingAuthorities(null)).toEqual([])
    expect(parseBalancingAuthorities({ error: 'bad', code: 400 })).toEqual([])
    const regions = parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API })
    expect(regions.every((r) => r.geospatialPrecision !== 'exact')).toBe(true)
  })

  it('links operator only on an exact code identity (ISO codes stay unlinked)', () => {
    const regions = parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API })
    expect(regions.find((r) => r.baCode === 'DUK')?.operatorTicker).toBe('DUK')
    expect(regions.find((r) => r.baCode === 'CISO')?.operatorTicker).toBeUndefined()
  })

  it('builds the BA graph (NERC region, electricity, operator, country)', () => {
    const events = normalizeBalancingAuthorities(parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.has('balancing-authority:ciso')).toBe(true)
    expect(ids.has('balancing-authority:duk')).toBe(true)
    expect(ids.has('place:nerc:serc')).toBe(true)
    expect(ids.has('commodity:electricity')).toBe(true)
    expect(ids.has('company:duke-energy')).toBe(true)
    expect(ids.has('ticker:duk')).toBe(true)
    expect(ids.has('source:eia_balancing_authorities_public')).toBe(true)
    expect(graph.relationships.map((r) => r.relation)).toContain('located_in')
  })

  it('links a power plant to its BA from the source-backed plant BA code', () => {
    const events = normalizeEiaFacilities(parseEiaFacilities(PLANT_FIXTURE, { retrievedAt: NOW, sourceApiUrl: PLANT_API }))
    const graph = buildEntityGraph(events, { now: NOW })
    expect(graph.nodes.some((n) => n.id === 'balancing-authority:ciso')).toBe(true)
    expect(graph.relationships.some((r) => r.from === 'facility:55555' && r.to === 'balancing-authority:ciso' && r.relation === 'operates_in')).toBe(true)
    expect(graph.relationships.some((r) => r.from === 'balancing-authority:ciso' && r.to === 'place:state:ca' && r.relation === 'serves')).toBe(true)
  })

  it('persists + rehydrates BA sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-ba-'))
    dirs.push(dir)
    const event = normalizeBalancingAuthorities(parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.gridRegion)
    expect(stored?.gridRegion?.baCode).toBe(event.gridRegion?.baCode)
    expect(stored?.gridRegion?.rawPayloadHash).toBe(event.gridRegion?.rawPayloadHash)
  })

  it('emits no outage/grid-stress/vulnerability claim language', () => {
    const events = normalizeBalancingAuthorities(parseBalancingAuthorities(FIXTURE, { retrievedAt: NOW, sourceApiUrl: FACET_API }))
    for (const event of events) {
      expect(event.summary).toMatch(/not an outage, grid-stress, reliability, or vulnerability claim/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(blackout|grid failure|overloaded|emergency|under attack|targeted|rolling outage)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      expect(String(url)).toContain('api_key=secret-eia-key')
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })
    const cfg = readEiaBalancingAuthorityConfig({ ATLASZ_EIA_API_KEY: 'secret-eia-key' })!
    const ok = await fetchEiaBalancingAuthorities(new AbortController().signal, { ...cfg, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(EIA_BALANCING_AUTHORITY_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }))
    await expect(fetchEiaBalancingAuthorities(new AbortController().signal, { ...cfg, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
