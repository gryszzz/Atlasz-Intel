import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  WORLD_PORT_INDEX_SOURCE_ID,
  fetchWorldPortIndex,
  normalizeWorldPorts,
  parseWorldPortIndex,
  readWorldPortIndexConfig,
} from '../electron/osint/adapters/worldPortIndexAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const URL_OK = 'https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv'
const dirs: string[] = []

const CSV = [
  'World Port Index Number,Main Port Name,UN/LOCODE,Country Code,Latitude,Longitude,Harbor Size,Harbor Type,Shelter Afforded,Region Name,Subdivision',
  '5970,Los Angeles,USLAX,United States,33.71667,-118.25,Large,Coastal Natural,Good,United States West Coast,CA',
  '3210,Rotterdam,NLRTM,Netherlands,51.95,4.13,Large,Coastal Tide Gate,Good,Netherlands,ZH',
  '9999,Mystery Port,,Brazil,-23.0,-43.2,Medium,Coastal Natural,Fair,Brazil,',
  '8888,Nowhere Port,,Atlantis,10.0,20.0,Small,Open Roadstead,Poor,Unknown,',
  ',No Number Port,,United States,1.0,2.0,Small,,,,', // malformed: no port number -> dropped
].join('\n')

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('World Port Index adapter (Layer 2)', () => {
  it('is host-gated with an official default and honors disable/override', () => {
    expect(readWorldPortIndexConfig({})?.apiUrl).toMatch(/nga\.mil/)
    expect(readWorldPortIndexConfig({ ATLASZ_WPI_DISABLE: '1' })).toBeNull()
    expect(readWorldPortIndexConfig({ ATLASZ_WPI_URL: 'https://evil.com/wpi.csv' })).toBeNull()
    expect(readWorldPortIndexConfig({ ATLASZ_WPI_URL: 'http://msi.nga.mil/x.csv' })).toBeNull()
    expect(readWorldPortIndexConfig({ ATLASZ_WPI_URL: URL_OK })?.apiUrl).toBe(URL_OK)
  })

  it('parses the WPI CSV with decimal coordinates and exact LOCODE field', () => {
    const ports = parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })
    expect(ports.map((p) => p.portNumber).sort()).toEqual(['3210', '5970', '8888', '9999'])
    const lax = ports.find((p) => p.portNumber === '5970')
    expect(lax).toMatchObject({
      portName: 'Los Angeles',
      countryCode: 'US',
      subdivision: 'CA',
      harborSize: 'Large',
      harborType: 'Coastal Natural',
      shelter: 'Good',
      linkedLocode: 'USLAX',
      geospatialPrecision: 'exact',
    })
    expect(lax?.latitude).toBeCloseTo(33.71667, 4)
    expect(lax?.longitude).toBeCloseTo(-118.25, 3)
    // Country derived from LOCODE prefix for Rotterdam.
    expect(ports.find((p) => p.portNumber === '3210')?.countryCode).toBe('NL')
  })

  it('keeps a port standalone when it has no exact UN/LOCODE (no fuzzy merge)', () => {
    const ports = parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })
    expect(ports.find((p) => p.portNumber === '9999')?.linkedLocode).toBeUndefined()
    expect(ports.find((p) => p.portNumber === '9999')?.countryCode).toBe('BR') // country still resolved
    // Unrecognized country stays unresolved (no guess).
    expect(ports.find((p) => p.portNumber === '8888')?.countryCode).toBeUndefined()
  })

  it('drops malformed rows and refuses non-official endpoints', () => {
    expect(parseWorldPortIndex(CSV, { sourceApiUrl: 'https://evil.com/wpi.csv' })).toEqual([])
    expect(parseWorldPortIndex('', { sourceApiUrl: URL_OK })).toEqual([])
    expect(parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }).some((p) => p.portName === 'No Number Port')).toBe(false)
  })

  it('graphs country/subdivision/sector/source and an EXACT LOCODE link only', () => {
    const events = normalizeWorldPorts(parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.has('facility:5970')).toBe(true)
    expect(ids.has('country:us')).toBe(true)
    expect(ids.has('place:subdiv:us:ca')).toBe(true)
    expect(ids.has('sector:logistics')).toBe(true)
    expect(ids.has('source:world_port_index_public')).toBe(true)
    // Exact LOCODE link: WPI port -> UN/LOCODE node.
    expect(graph.relationships.some((r) => r.from === 'facility:5970' && r.to === 'facility:uslax' && r.relation === 'references')).toBe(true)
    // No LOCODE -> no references edge.
    expect(graph.relationships.some((r) => r.from === 'facility:9999' && r.relation === 'references')).toBe(false)
    // Unresolved country -> no in_country edge from that port.
    expect(graph.relationships.some((r) => r.from === 'facility:8888' && r.relation === 'in_country')).toBe(false)
  })

  it('persists + rehydrates port sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-wpi-'))
    dirs.push(dir)
    const event = normalizeWorldPorts(parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })).find((e) => e.worldPort?.portNumber === '5970')
    if (!event) throw new Error('missing fixture port event')
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.worldPort?.portNumber === '5970')
    expect(stored?.worldPort?.portName).toBe('Los Angeles')
    expect(stored?.worldPort?.linkedLocode).toBe('USLAX')
    expect(stored?.worldPort?.rawPayloadHash).toBe(event.worldPort?.rawPayloadHash)
  })

  it('emits no traffic/congestion/disruption claim language', () => {
    const events = normalizeWorldPorts(parseWorldPortIndex(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
    for (const event of events) {
      expect(event.summary).toMatch(/not live traffic, congestion, trade volume, or disruption/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(congested|backlog|vessels waiting|ships queued|disrupted operations|blockade)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: (n: string) => (n.toLowerCase() === 'content-type' ? 'text/csv' : null) }, text: async () => CSV }))
    const ok = await fetchWorldPortIndex(new AbortController().signal, { apiUrl: URL_OK, maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(WORLD_PORT_INDEX_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, text: async () => '' }))
    await expect(fetchWorldPortIndex(new AbortController().signal, { apiUrl: URL_OK, maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
