import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  UN_LOCODE_SOURCE_ID,
  fetchUnLocodes,
  isPortLocode,
  normalizeUnLocodes,
  parseUnLocodes,
  readUnLocodeConfig,
} from '../electron/osint/adapters/unLocodeAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const URL_OK = 'https://unece.org/trade/cefact/unlocode/loc251.csv'
const dirs: string[] = []

// Official 12-col layout: Change,Country,Location,Name,NameWoDiacritics,Subdivision,Status,Function,Date,IATA,Coordinates,Remarks
const CSV = [
  ',US,LAX,Los Angeles,Los Angeles,CA,AI,1-3-----,0601,,3343N 11815W,',
  ',US,HOU,Houston,Houston,TX,AI,12345---,0601,,2945N 09521W,',
  ',NL,RTM,Rotterdam,Rotterdam,ZH,AI,1-3-----,0601,,5155N 00429E,',
  ',US,DEN,Denver,Denver,CO,AI,-2345---,0601,DEN,,',
  ',US,XX,Bad Location Code,Bad,,AI,1-------,,,,', // location not 3 chars -> dropped
  ',,,,,,,,,,,', // empty -> dropped
].join('\n')

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('UN/LOCODE adapter (Layer 1)', () => {
  it('is fail-closed and guards the official UNECE host', () => {
    expect(readUnLocodeConfig({})).toBeNull()
    expect(readUnLocodeConfig({ ATLASZ_UNLOCODE_URL: 'https://evil.com/loc.csv' })).toBeNull()
    expect(readUnLocodeConfig({ ATLASZ_UNLOCODE_URL: 'http://unece.org/loc.csv' })).toBeNull()
    expect(readUnLocodeConfig({ ATLASZ_UNLOCODE_DISABLE: '1', ATLASZ_UNLOCODE_URL: URL_OK })).toBeNull()
    expect(readUnLocodeConfig({ ATLASZ_UNLOCODE_URL: URL_OK })?.portsOnly).toBe(true)
    expect(readUnLocodeConfig({ ATLASZ_UNLOCODE_URL: URL_OK, ATLASZ_UNLOCODE_PORTS_ONLY: '0' })?.portsOnly).toBe(false)
  })

  it('parses the official CSV layout into location records with function flags', () => {
    const recs = parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })
    expect(recs.map((r) => r.locode).sort()).toEqual(['NLRTM', 'USDEN', 'USHOU', 'USLAX'])
    const lax = recs.find((r) => r.locode === 'USLAX')
    expect(lax).toMatchObject({ countryCode: 'US', locationName: 'Los Angeles', subdivision: 'CA', facilityKind: 'port', geospatialPrecision: 'exact' })
    expect(lax?.functions).toMatchObject({ port: true, road: true, airport: false, rail: false })
    expect(lax?.latitude).toBeCloseTo(33.7167, 3)
    expect(lax?.longitude).toBeCloseTo(-118.25, 3)
    const hou = recs.find((r) => r.locode === 'USHOU')
    expect(hou?.functions).toMatchObject({ port: true, rail: true, road: true, airport: true, postal: true })
    expect(hou?.latitude).toBeCloseTo(29.75, 3)
  })

  it('port-only filter keeps ports and drops non-port locations', () => {
    const recs = parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })
    const ports = recs.filter(isPortLocode).map((r) => r.locode).sort()
    expect(ports).toEqual(['NLRTM', 'USHOU', 'USLAX'])
    // Denver is an airport/rail node, not a port.
    expect(recs.find((r) => r.locode === 'USDEN')?.facilityKind).toBe('airport')
  })

  it('labels missing coordinates as region-only', () => {
    const den = parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }).find((r) => r.locode === 'USDEN')
    expect(den?.latitude).toBeUndefined()
    expect(den?.geospatialPrecision).toBe('region-only')
  })

  it('drops malformed rows and refuses non-official endpoints', () => {
    expect(parseUnLocodes('', { sourceApiUrl: URL_OK })).toEqual([])
    expect(parseUnLocodes(CSV, { sourceApiUrl: 'https://evil.com/loc.csv' })).toEqual([])
    expect(parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }).some((r) => r.locode === 'USXX')).toBe(false)
  })

  it('links location to country, subdivision, and trade/logistics sector', () => {
    const events = normalizeUnLocodes(parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.has('facility:uslax')).toBe(true)
    expect(ids.has('country:us')).toBe(true)
    expect(ids.has('place:subdiv:us:ca')).toBe(true)
    expect(ids.has('place:subdiv:nl:zh')).toBe(true)
    expect(ids.has('sector:logistics')).toBe(true)
    expect(ids.has('source:un_locode_public')).toBe(true)
    const rels = graph.relationships.map((r) => r.relation)
    expect(rels).toContain('in_country')
    expect(rels).toContain('located_in')
    expect(rels).toContain('in_sector')
  })

  it('persists + rehydrates UN/LOCODE sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-locode-'))
    dirs.push(dir)
    const event = normalizeUnLocodes(parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK })).find((e) => e.unLocode?.locode === 'USLAX')
    if (!event) throw new Error('missing fixture locode event')
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.unLocode?.locode === 'USLAX')
    expect(stored?.unLocode?.locationName).toBe('Los Angeles')
    expect(stored?.unLocode?.rawPayloadHash).toBe(event.unLocode?.rawPayloadHash)
  })

  it('emits no congestion/disruption/traffic claim language', () => {
    const events = normalizeUnLocodes(parseUnLocodes(CSV, { retrievedAt: NOW, sourceApiUrl: URL_OK }))
    for (const event of events) {
      expect(event.summary).toMatch(/not live port activity, vessel traffic, congestion, or disruption/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(congested|backlog|gridlock|vessels waiting|ships queued|disrupted operations)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => CSV }))
    const ok = await fetchUnLocodes(new AbortController().signal, { url: URL_OK, portsOnly: true, maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(UN_LOCODE_SOURCE_ID)
    expect(ok.every((e) => e.unLocode?.functions.port)).toBe(true)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, text: async () => '' }))
    await expect(fetchUnLocodes(new AbortController().signal, { url: URL_OK, portsOnly: true, maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
