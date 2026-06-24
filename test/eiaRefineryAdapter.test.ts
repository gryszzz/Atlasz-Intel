import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EIA_REFINERY_SOURCE_ID,
  fetchEiaRefineries,
  normalizeEiaRefineries,
  parseEiaRefineries,
  readEiaRefineryConfig,
} from '../electron/osint/adapters/eiaRefineryAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph, geoAssetEdges } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const API_URL =
  'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/PetroleumRefineries_US_EIA/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
const dirs: string[] = []

function feature(props: Record<string, unknown>, coords?: [number, number]) {
  return { type: 'Feature', properties: props, geometry: coords ? { type: 'Point', coordinates: coords } : null }
}

const FIXTURE = {
  type: 'FeatureCollection',
  features: [
    // Marathon (exact identity), source coordinates, named products.
    feature(
      { OBJECTID: 1, Site: 'Galveston Bay Refinery', Company: 'Marathon Petroleum', Corp: 'Marathon Petroleum Corp', State: 'TX', AD_Mbpd: 631, Products: 'Gasoline;Diesel', Status: 'Operating' },
      [-94.9, 29.37],
    ),
    // Phillips 66 (exact), full state name, NO coordinates -> region-only.
    feature({ OBJECTID: 2, Site: 'Sweeny Refinery', Company: 'Phillips 66', State: 'Texas', AD_Mbpd: 265 }),
    // HF Sinclair (exact), no state + no coords -> unknown precision.
    feature({ OBJECTID: 3, Site: 'Parco Refinery', Company: 'HF Sinclair', AD_Mbpd: 80 }),
    // Non-exact operator name (subsidiary-style) -> must NOT merge to a market id.
    feature(
      { OBJECTID: 4, Site: 'Port Arthur Refinery', Company: 'Valero Refining-Texas, L.P.', State: 'TX', AD_Mbpd: 395 },
      [-93.93, 29.86],
    ),
    // Malformed: no site and no company -> dropped.
    feature({ OBJECTID: 5, State: 'TX', AD_Mbpd: 10 }),
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('EIA refinery adapter', () => {
  it('is endpoint-gated and refuses non-official hosts', () => {
    expect(readEiaRefineryConfig({ ATLASZ_EIA_REFINERIES_URL: 'http://insecure/x' })).toBeNull()
    expect(readEiaRefineryConfig({ ATLASZ_EIA_REFINERIES_URL: 'https://evil.com/refineries' })).toBeNull()
    expect(readEiaRefineryConfig({ ATLASZ_EIA_REFINERIES_DISABLE: '1' })).toBeNull()
    expect(readEiaRefineryConfig({})?.apiUrl).toMatch(/arcgis\.com/)
    expect(readEiaRefineryConfig({ ATLASZ_EIA_REFINERIES_URL: API_URL })?.apiUrl).toBe(API_URL)
  })

  it('parses refineries to the GeoAsset shape with proof fields', () => {
    const refineries = parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    const galveston = refineries.find((r) => r.facilityId === '1')
    expect(galveston).toMatchObject({
      facilityName: 'Galveston Bay Refinery',
      facilityKind: 'refinery',
      operatorName: 'Marathon Petroleum',
      companyName: 'Marathon Petroleum Corp',
      operatorTicker: 'MPC',
      state: 'TX',
      stateName: 'Texas',
      crudeCapacity: 631,
      products: ['Gasoline', 'Diesel'],
      status: 'Operating',
      latitude: 29.37,
      longitude: -94.9,
      geospatialPrecision: 'exact',
      provenance: 'official-api',
      confidence: 95,
    })
    expect(galveston?.sourceUrl).toMatch(/^https:\/\/atlas\.eia\.gov\//)
    expect(galveston?.rawPayloadHash.length).toBeGreaterThan(0)
  })

  it('labels missing coordinates region-only (state known) or unknown (nothing known)', () => {
    const refineries = parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(refineries.find((r) => r.facilityId === '2')?.geospatialPrecision).toBe('region-only')
    expect(refineries.find((r) => r.facilityId === '2')?.latitude).toBeUndefined()
    expect(refineries.find((r) => r.facilityId === '3')?.geospatialPrecision).toBe('unknown')
  })

  it('drops malformed features rather than repairing them', () => {
    expect(parseEiaRefineries(null)).toEqual([])
    expect(parseEiaRefineries({ features: [] })).toEqual([])
    const ids = parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }).map((r) => r.facilityId).sort()
    expect(ids).toEqual(['1', '2', '3', '4'])
  })

  it('links operator to a market company ONLY on an exact identity (no subsidiary merge)', () => {
    const refineries = parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(refineries.find((r) => r.facilityId === '1')?.operatorTicker).toBe('MPC')
    expect(refineries.find((r) => r.facilityId === '2')?.operatorTicker).toBe('PSX')
    // "Valero Refining-Texas, L.P." is NOT an exact key for "Valero" / "Valero Energy".
    expect(refineries.find((r) => r.facilityId === '4')?.operatorTicker).toBeUndefined()
  })

  it('builds the evidence graph via shared geoAssetEdges (location + domain edges)', () => {
    const events = normalizeEiaRefineries(parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))

    expect(ids.has('facility:1')).toBe(true)
    expect(ids.has('place:state:tx')).toBe(true)
    expect(ids.has('commodity:crude-oil')).toBe(true)
    expect(ids.has('commodity:gasoline')).toBe(true)
    expect(ids.has('company:marathon-petroleum')).toBe(true)
    expect(ids.has('ticker:mpc')).toBe(true)
    expect(ids.has('sector:energy')).toBe(true)
    expect(ids.has('source:eia_refineries_public')).toBe(true)

    const rels = graph.relationships.map((r) => r.relation)
    expect(rels).toContain('located_in')
    expect(rels).toContain('operated_by')
    expect(rels).toContain('processes')
    expect(rels).toContain('produces')

    // Non-exact operator (facility 4) has no operated_by edge.
    expect(graph.relationships.some((r) => r.from === 'facility:4' && r.relation === 'operated_by')).toBe(false)
  })

  it('reuses geoAssetEdges directly for a refinery GeoAsset', () => {
    const edges = geoAssetEdges(
      { id: 'event:x', kind: 'event', label: 'evt' },
      { assetId: '1', assetKind: 'refinery', name: 'Galveston Bay Refinery', state: 'TX', stateName: 'Texas', operatorName: 'Marathon Petroleum', operatorTicker: 'MPC', geospatialPrecision: 'region-only' },
    )
    expect(edges.some((e) => e.relation === 'located_in')).toBe(true)
    expect(edges.some((e) => e.relation === 'operated_by')).toBe(true)
  })

  it('persists refinery sub-records and rehydrates them (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-eia-ref-'))
    dirs.push(dir)
    const event = normalizeEiaRefineries(parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).find(
      (e) => e.eiaRefinery?.facilityId === '1',
    )
    if (!event) throw new Error('missing fixture refinery event')
    createPersistence(dir).saveWorldIntelEvent(event)

    const stored = createPersistence(dir)
      .listWorldIntelEvents()
      .find((candidate) => candidate.eiaRefinery?.facilityId === '1')
    expect(stored?.eiaRefinery?.facilityName).toBe('Galveston Bay Refinery')
    expect(stored?.eiaRefinery?.crudeCapacity).toBe(631)
    expect(stored?.eiaRefinery?.geospatialPrecision).toBe('exact')
    expect(stored?.eiaRefinery?.rawPayloadHash).toBe(event.eiaRefinery?.rawPayloadHash)
  })

  it('emits no outage/damage/vulnerability claim language', () => {
    const events = normalizeEiaRefineries(parseEiaRefineries(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))
    for (const event of events) {
      expect(event.summary).toMatch(/not a verified outage, disruption, or vulnerability claim/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(is offline|was damaged|under attack|targeted|knocked offline|sabotage)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }))
    const ok = await fetchEiaRefineries(new AbortController().signal, {
      apiUrl: API_URL,
      maxRefineries: 50,
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })
    expect(ok[0].sourceId).toBe(EIA_REFINERY_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchEiaRefineries(new AbortController().signal, { apiUrl: API_URL, maxRefineries: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
