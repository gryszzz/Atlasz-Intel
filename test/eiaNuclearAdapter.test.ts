import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EIA_NUCLEAR_SOURCE_ID,
  fetchEiaNuclearPlants,
  normalizeEiaNuclearPlants,
  parseEiaNuclearPlants,
  readEiaNuclearConfig,
} from '../electron/osint/adapters/eiaNuclearAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const API_URL = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?frequency=monthly&data[0]=nameplate-capacity-mw'
const dirs: string[] = []

const FIXTURE = {
  response: {
    data: [
      // Nuclear plant (exact identity operator), source coordinates.
      {
        period: '2026-04', plantid: '6008', plantName: 'Vogtle', generatorid: '1', entityid: '7140', entityName: 'Southern Company',
        stateid: 'GA', stateName: 'Georgia', county: 'Burke', technology: 'Nuclear', 'energy-source-code': 'NUC',
        statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '1215', latitude: '33.14', longitude: '-81.76',
      },
      {
        period: '2026-04', plantid: '6008', plantName: 'Vogtle', generatorid: '2', entityid: '7140', entityName: 'Southern Company',
        stateid: 'GA', stateName: 'Georgia', county: 'Burke', technology: 'Nuclear', 'energy-source-code': 'NUC',
        statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '1215', latitude: '33.14', longitude: '-81.76',
      },
      // Non-nuclear gas plant -> must be excluded by the nuclear filter.
      {
        period: '2026-04', plantid: '55555', plantName: 'Riverbend Gas', generatorid: 'GT1', entityid: '2222', entityName: 'Some Utility',
        stateid: 'TX', stateName: 'Texas', county: 'Harris', technology: 'Natural Gas Fired Combined Cycle', 'energy-source-code': 'NG',
        statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '600',
      },
      // Nuclear plant, NO coordinates -> region-only; operator not in identity map.
      {
        period: '2026-04', plantid: '7100', plantName: 'Mystery Nuclear', generatorid: '1', entityid: '9000', entityName: 'Local Nuclear Authority',
        stateid: 'IL', stateName: 'Illinois', technology: 'Nuclear', 'energy-source-code': 'NUC',
        statusDescription: '(OP) Operating', 'nameplate-capacity-mw': '1000',
      },
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('EIA nuclear adapter (Layer 1)', () => {
  it('is key-gated and honors its own disable flag', () => {
    expect(readEiaNuclearConfig({})).toBeNull()
    expect(readEiaNuclearConfig({ ATLASZ_EIA_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readEiaNuclearConfig({ ATLASZ_EIA_NUCLEAR_DISABLE: '1', ATLASZ_EIA_API_KEY: 'secret' })).toBeNull()
  })

  it('keeps only nuclear plants and drops non-nuclear generators', () => {
    const plants = parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(plants.map((p) => p.facilityId).sort()).toEqual(['6008', '7100'])
    expect(plants.every((p) => p.facilityKind === 'nuclear-plant')).toBe(true)
  })

  it('normalizes a nuclear plant with proof fields + exact precision', () => {
    const vogtle = parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }).find((p) => p.facilityId === '6008')
    expect(vogtle).toMatchObject({
      facilityName: 'Vogtle',
      facilityKind: 'nuclear-plant',
      operatorName: 'Southern Company',
      operatorTicker: 'SO',
      state: 'GA',
      capacityMw: 2430,
      energySource: 'NUC',
      geospatialPrecision: 'exact',
      provenance: 'official-api',
    })
    expect(vogtle?.sourceApiUrl).not.toContain('api_key=')
  })

  it('labels a nuclear plant without coordinates as region-only', () => {
    const mystery = parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }).find((p) => p.facilityId === '7100')
    expect(mystery?.geospatialPrecision).toBe('region-only')
    expect(mystery?.operatorTicker).toBeUndefined() // not an exact identity
  })

  it('builds the graph via shared geoAssetEdges + nuclear/electricity edges', () => {
    const events = normalizeEiaNuclearPlants(parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.has('facility:6008')).toBe(true)
    expect(ids.has('place:state:ga')).toBe(true)
    expect(ids.has('commodity:electricity')).toBe(true)
    expect(ids.has('commodity:nuclear')).toBe(true)
    expect(ids.has('company:southern-company')).toBe(true)
    expect(ids.has('ticker:so')).toBe(true)
    expect(ids.has('source:eia_nuclear_public')).toBe(true)
    const rels = graph.relationships.map((r) => r.relation)
    expect(rels).toContain('located_in')
    expect(rels).toContain('operated_by')
    expect(graph.relationships.some((r) => r.from === 'facility:7100' && r.relation === 'operated_by')).toBe(false)
  })

  it('persists + rehydrates nuclear plant sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-nuke-'))
    dirs.push(dir)
    const event = normalizeEiaNuclearPlants(parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).find((e) => e.nuclearPlant?.facilityId === '6008')
    if (!event) throw new Error('missing fixture nuclear event')
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.nuclearPlant?.facilityId === '6008')
    expect(stored?.nuclearPlant?.facilityName).toBe('Vogtle')
    expect(stored?.nuclearPlant?.rawPayloadHash).toBe(event.nuclearPlant?.rawPayloadHash)
  })

  it('emits no outage/safety/vulnerability claim language', () => {
    const events = normalizeEiaNuclearPlants(parseEiaNuclearPlants(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))
    for (const event of events) {
      expect(event.summary).toMatch(/not a verified outage, safety condition, or disruption/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(unsafe|meltdown|was damaged|under attack|targeted|emergency|leak)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async (url: URL) => {
      expect(url.toString()).toContain('api_key=secret-eia-key')
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })
    const cfg = readEiaNuclearConfig({ ATLASZ_EIA_API_KEY: 'secret-eia-key' })!
    const ok = await fetchEiaNuclearPlants(new AbortController().signal, { ...cfg, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(EIA_NUCLEAR_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }))
    await expect(fetchEiaNuclearPlants(new AbortController().signal, { ...cfg, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
