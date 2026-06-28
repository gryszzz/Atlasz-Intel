import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  USGS_MINERALS_SOURCE_ID,
  fetchUsgsMinerals,
  normalizeMineralSites,
  parseMineralSites,
  readUsgsMineralConfig,
} from '../electron/osint/adapters/usgsMineralAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const MRDS_URL = 'https://mrdata.usgs.gov/mrds/mrds.csv'
const USMIN_URL = 'https://mrdata.usgs.gov/usmin/usmin.json'
const dirs: string[] = []

const MRDS_CSV = [
  'dep_id,site_name,latitude,longitude,country,state,county,commod1,commod2,dev_stat,oper_type',
  '10138596,Bingham Canyon,40.523,-112.15,United States,Utah,Salt Lake,Copper,Molybdenum,Producer,Operator',
  '10000001,Some Prospect,,,Canada,British Columbia,,Gold,,Prospect,',
  '10000002,No Status Site,38.0,-119.0,United States,Nevada,Esmeralda,Silver,,,',
  ',No Id Site,1.0,2.0,United States,Nevada,,Gold,,Producer,', // no dep_id -> dropped
].join('\n')

const USMIN_JSON = [
  { rec_id: '10183', site_name: 'Mountain Pass', latitude: 35.478, longitude: -115.53, country: 'United States', state: 'California', commodity: 'Rare earth elements', dev_status: 'Producer', operator: 'MP Materials' },
]

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('USGS minerals adapter (two-source)', () => {
  it('is fail-closed and accepts only official usgs.gov sources', () => {
    expect(readUsgsMineralConfig({})?.sources).toEqual([{ database: 'MRDS', url: MRDS_URL }])
    expect(readUsgsMineralConfig({ ATLASZ_USGS_MRDS_URL: 'https://evil.com/mrds.csv' })).toBeNull()
    expect(readUsgsMineralConfig({ ATLASZ_USGS_MINERALS_DISABLE: '1', ATLASZ_USGS_MRDS_URL: MRDS_URL })).toBeNull()
    expect(readUsgsMineralConfig({ ATLASZ_USGS_MRDS_URL: MRDS_URL })?.sources).toHaveLength(1)
    const both = readUsgsMineralConfig({ ATLASZ_USGS_USMIN_URL: USMIN_URL, ATLASZ_USGS_MRDS_URL: MRDS_URL })
    expect(both?.sources.map((s) => s.database)).toEqual(['USMIN', 'MRDS'])
  })

  it('parses MRDS CSV and flags it as legacy (not current activity)', () => {
    const sites = parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL })
    expect(sites.map((s) => s.siteId).sort()).toEqual(['10000001', '10000002', '10138596'])
    const bingham = sites.find((s) => s.siteId === '10138596')
    expect(bingham).toMatchObject({ siteName: 'Bingham Canyon', database: 'MRDS', legacyNotMaintained: true, facilityKind: 'mine', developmentStatus: 'Producer', countryCode: 'US', state: 'UT', geospatialPrecision: 'exact' })
    expect(bingham?.commodities).toEqual(['Copper', 'Molybdenum'])
    expect(bingham?.operatorName).toBeUndefined() // oper_type is a type, not a name
  })

  it('parses USMIN JSON and links an exact operator identity only', () => {
    const sites = parseMineralSites(USMIN_JSON, { database: 'USMIN', retrievedAt: NOW, sourceApiUrl: USMIN_URL })
    expect(sites).toHaveLength(1)
    expect(sites[0]).toMatchObject({ siteName: 'Mountain Pass', database: 'USMIN', legacyNotMaintained: false, operatorName: 'MP Materials', operatorTicker: 'MP', facilityKind: 'mine' })
    expect(sites[0].commodities).toEqual(['Rare earth elements'])
  })

  it('does not claim status/coords when the source lacks them', () => {
    const sites = parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL })
    const noStatus = sites.find((s) => s.siteId === '10000002')
    expect(noStatus?.developmentStatus).toBeUndefined()
    expect(noStatus?.productionStatus).toBeUndefined()
    expect(noStatus?.facilityKind).toBe('mineral-resource-site')
    const prospect = sites.find((s) => s.siteId === '10000001')
    expect(prospect?.geospatialPrecision).toBe('region-only') // no coords
    expect(prospect?.countryCode).toBe('CA')
  })

  it('drops malformed rows and refuses non-official endpoints', () => {
    expect(parseMineralSites(MRDS_CSV, { database: 'MRDS', sourceApiUrl: 'https://evil.com/x.csv' })).toEqual([])
    expect(parseMineralSites('', { database: 'MRDS', sourceApiUrl: MRDS_URL })).toEqual([])
    expect(parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL }).some((s) => s.siteName === 'No Id Site')).toBe(false)
  })

  it('graphs site -> country/commodity/materials sector/source + exact operator', () => {
    const events = normalizeMineralSites([
      ...parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL }),
      ...parseMineralSites(USMIN_JSON, { database: 'USMIN', retrievedAt: NOW, sourceApiUrl: USMIN_URL }),
    ])
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = new Set(graph.nodes.map((n) => n.id))
    expect(ids.has('facility:mrds:10138596')).toBe(true)
    expect(ids.has('commodity:copper')).toBe(true)
    expect(ids.has('commodity:rare-earth-elements')).toBe(true)
    expect(ids.has('country:us')).toBe(true)
    expect(ids.has('sector:materials')).toBe(true)
    expect(ids.has('company:mp-materials')).toBe(true)
    expect(ids.has('ticker:mp')).toBe(true)
    expect(ids.has('source:usgs_minerals_public')).toBe(true)
  })

  it('persists + rehydrates mineral sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-mineral-'))
    dirs.push(dir)
    const event = normalizeMineralSites(parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL })).find((e) => e.mineralSite?.siteId === '10138596')
    if (!event) throw new Error('missing fixture mineral event')
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.mineralSite?.siteId === '10138596')
    expect(stored?.mineralSite?.siteName).toBe('Bingham Canyon')
    expect(stored?.mineralSite?.legacyNotMaintained).toBe(true)
    expect(stored?.mineralSite?.rawPayloadHash).toBe(event.mineralSite?.rawPayloadHash)
  })

  it('emits no production-volume/reserve-hype/investment/targeting language', () => {
    const events = normalizeMineralSites([
      ...parseMineralSites(MRDS_CSV, { database: 'MRDS', retrievedAt: NOW, sourceApiUrl: MRDS_URL }),
      ...parseMineralSites(USMIN_JSON, { database: 'USMIN', retrievedAt: NOW, sourceApiUrl: USMIN_URL }),
    ])
    for (const event of events) {
      expect(event.summary).toMatch(/not current production, reserves, ownership, or an investment signal/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(world-class|high-grade|bonanza|buy now|invest|undervalued|strategic target|reserves of \d)\b/i)
    }
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: (n: string) => (n.toLowerCase() === 'content-type' ? 'text/csv' : null) }, text: async () => MRDS_CSV }))
    const ok = await fetchUsgsMinerals(new AbortController().signal, { sources: [{ database: 'MRDS', url: MRDS_URL }], maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(USGS_MINERALS_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, text: async () => '' }))
    await expect(fetchUsgsMinerals(new AbortController().signal, { sources: [{ database: 'MRDS', url: MRDS_URL }], maxRecords: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
