import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LNG_TERMINAL_SOURCE_ID,
  fetchLngTerminals,
  normalizeLngTerminals,
  parseLngTerminals,
  readLngTerminalConfig,
} from '../electron/osint/adapters/lngTerminalAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const EIA_API = 'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/Lng_ImportExportTerminals_US_EIA/FeatureServer/0/query?f=json'
const FERC_API = 'https://www.ferc.gov/sites/default/files/lng/terminals.json'
const dirs: string[] = []

function gj(props: Record<string, unknown>, coords?: [number, number]) {
  return { type: 'Feature', properties: props, geometry: coords ? { type: 'Point', coordinates: coords } : null }
}

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    gj({ OBJECTID: 1, Terminal: 'Sabine Pass LNG Terminal', Operator: 'Cheniere', State: 'LA', Type: 'Export', Capacity: 4.5 }, [-93.87, 29.74]),
    gj({ OBJECTID: 2, Terminal: 'Cameron LNG', Operator: 'Sempra Infrastructure', State: 'Louisiana', Type: 'Liquefaction' }),
    gj({ OBJECTID: 3, Terminal: 'Calcasieu Pass', Operator: 'Venture Global Calcasieu Pass, LLC', State: 'LA', Type: 'Export' }, [-93.34, 29.76]),
    gj({ OBJECTID: 4, State: 'TX' }), // malformed: no name/operator -> dropped
    gj({ OBJECTID: 5, Terminal: 'Mystery LNG', Operator: 'Kinder Morgan' }), // no state/coords -> unknown
  ],
}

const ESRI = {
  features: [
    { attributes: { OBJECTID: 10, Terminal: 'Elba Island LNG', Operator: 'Kinder Morgan', State: 'GA', Type: 'Export' }, geometry: { x: -81.0, y: 32.08 } },
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('LNG terminal adapter', () => {
  it('is fail-closed and guards the official source host', () => {
    expect(readLngTerminalConfig({})).toBeNull() // no URL -> inert
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_URL: 'https://evil.com/lng' })).toBeNull()
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_URL: 'http://www.ferc.gov/lng.json' })).toBeNull() // not https
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_DISABLE: '1', ATLASZ_LNG_TERMINALS_URL: FERC_API })).toBeNull()
    // Non-LNG ArcGIS path is rejected even on the EIA org.
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_URL: 'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/PetroleumRefineries_US_EIA/FeatureServer/0/query' })).toBeNull()
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_URL: FERC_API })?.apiUrl).toBe(FERC_API)
    expect(readLngTerminalConfig({ ATLASZ_LNG_TERMINALS_URL: EIA_API })?.apiUrl).toBe(EIA_API)
  })

  it('parses GeoJSON features to the GeoAsset shape with proof fields', () => {
    const terminals = parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API })
    const sabine = terminals.find((t) => t.facilityId === '1')
    expect(sabine).toMatchObject({
      facilityName: 'Sabine Pass LNG Terminal',
      facilityKind: 'lng-terminal',
      operatorName: 'Cheniere',
      operatorTicker: 'LNG',
      state: 'LA',
      stateName: 'Louisiana',
      terminalType: 'export',
      capacity: 4.5,
      latitude: 29.74,
      longitude: -93.87,
      geospatialPrecision: 'exact',
      provenance: 'official-api',
      confidence: 95,
    })
    expect(sabine?.sourceName).toBe('U.S. Energy Information Administration')
    expect(sabine?.sourceUrl).toMatch(/^https:\/\/atlas\.eia\.gov\//)
  })

  it('parses Esri JSON (attributes + geometry x/y) too', () => {
    const terminals = parseLngTerminals(ESRI, { retrievedAt: NOW, sourceApiUrl: EIA_API })
    expect(terminals).toHaveLength(1)
    expect(terminals[0]).toMatchObject({ facilityName: 'Elba Island LNG', latitude: 32.08, longitude: -81.0, geospatialPrecision: 'exact' })
  })

  it('refuses to normalize from a non-official endpoint', () => {
    expect(parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: 'https://evil.com/lng' })).toEqual([])
  })

  it('labels missing coordinates region-only (state known) or unknown (nothing known)', () => {
    const terminals = parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API })
    expect(terminals.find((t) => t.facilityId === '2')?.geospatialPrecision).toBe('region-only')
    expect(terminals.find((t) => t.facilityId === '5')?.geospatialPrecision).toBe('unknown')
  })

  it('drops malformed features rather than repairing them', () => {
    expect(parseLngTerminals(null)).toEqual([])
    expect(parseLngTerminals({ features: [] })).toEqual([])
    const ids = parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API }).map((t) => t.facilityId).sort()
    expect(ids).toEqual(['1', '2', '3', '5'])
  })

  it('links operator to a market company ONLY on an exact identity (no SPV merge)', () => {
    const terminals = parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API })
    expect(terminals.find((t) => t.facilityId === '1')?.operatorTicker).toBe('LNG')
    expect(terminals.find((t) => t.facilityId === '2')?.operatorTicker).toBe('SRE')
    // "Venture Global Calcasieu Pass, LLC" is NOT an exact key for "Venture Global".
    expect(terminals.find((t) => t.facilityId === '3')?.operatorTicker).toBeUndefined()
  })

  it('builds the evidence graph via shared geoAssetEdges + neutral commodity links', () => {
    const events = normalizeLngTerminals(parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))

    expect(ids.has('facility:1')).toBe(true)
    expect(ids.has('place:state:la')).toBe(true)
    expect(ids.has('commodity:lng')).toBe(true)
    expect(ids.has('commodity:natural-gas')).toBe(true)
    expect(ids.has('company:cheniere')).toBe(true)
    expect(ids.has('ticker:lng')).toBe(true)
    expect(ids.has('sector:energy')).toBe(true)
    expect(ids.has('source:lng_terminals_public')).toBe(true)

    const rels = graph.relationships.map((r) => r.relation)
    expect(rels).toContain('located_in')
    expect(rels).toContain('operated_by')
    expect(rels).toContain('touches')

    // No SPV merge: facility 3 has no operated_by edge.
    expect(graph.relationships.some((r) => r.from === 'facility:3' && r.relation === 'operated_by')).toBe(false)
  })

  it('persists terminal sub-records and rehydrates them (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-lng-'))
    dirs.push(dir)
    const event = normalizeLngTerminals(parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API })).find((e) => e.lngTerminal?.facilityId === '1')
    if (!event) throw new Error('missing fixture terminal event')
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.lngTerminal?.facilityId === '1')
    expect(stored?.lngTerminal?.facilityName).toBe('Sabine Pass LNG Terminal')
    expect(stored?.lngTerminal?.terminalType).toBe('export')
    expect(stored?.lngTerminal?.rawPayloadHash).toBe(event.lngTerminal?.rawPayloadHash)
  })

  it('emits no outage/export-impact/vulnerability claim language', () => {
    const events = normalizeLngTerminals(parseLngTerminals(GEOJSON, { retrievedAt: NOW, sourceApiUrl: EIA_API }))
    for (const event of events) {
      expect(event.summary).toMatch(/not a verified outage, disruption, export-flow, or vulnerability claim/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(is offline|was damaged|under attack|targeted|export halted|exports? disrupted|sabotage)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => GEOJSON }))
    const ok = await fetchLngTerminals(new AbortController().signal, { apiUrl: EIA_API, maxTerminals: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(LNG_TERMINAL_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }))
    await expect(
      fetchLngTerminals(new AbortController().signal, { apiUrl: EIA_API, maxTerminals: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
