import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  USGS_QUAKES_SOURCE_ID,
  fetchUsgsEarthquakes,
  normalizeUsgsEarthquakes,
  parseUsgsQuakes,
  readUsgsQuakeConfig,
} from '../electron/osint/adapters/usgsQuakeAdapter'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { createPersistence } from '../electron/persistence'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FIXTURE = {
  type: 'FeatureCollection',
  metadata: { count: 3 },
  features: [
    {
      type: 'Feature',
      id: 'us7000abcd',
      properties: {
        mag: 7.1,
        place: '120 km SW of Town, Japan',
        title: 'M 7.1 - 120 km SW of Town, Japan',
        time: NOW - 2 * 60 * 60 * 1000,
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd',
        alert: 'orange',
        tsunami: 1,
        sig: 950,
        status: 'reviewed',
      },
      geometry: { type: 'Point', coordinates: [140.1, 36.2, 30.5] },
    },
    {
      type: 'Feature',
      id: 'us7000efgh',
      properties: {
        mag: 5.4,
        place: 'Offshore region',
        title: 'M 5.4 - Offshore region',
        time: NOW - 5 * 60 * 60 * 1000,
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000efgh',
        tsunami: 0,
        status: 'reviewed',
      },
      geometry: { type: 'Point', coordinates: [-120.0, 38.0, 10] },
    },
    {
      // Malformed: missing magnitude + non-USGS url -> dropped.
      type: 'Feature',
      id: 'bad1',
      properties: { place: 'Nowhere', time: NOW, url: 'https://evil.example/x' },
      geometry: { type: 'Point', coordinates: [0, 0, 0] },
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('USGS earthquakes adapter', () => {
  it('is public by default and refuses insecure overrides / opt-out', () => {
    expect(readUsgsQuakeConfig({})).not.toBeNull()
    expect(readUsgsQuakeConfig({ ATLASZ_USGS_QUAKES_DISABLE: '1' })).toBeNull()
    expect(readUsgsQuakeConfig({ ATLASZ_USGS_QUAKES_URL: 'http://insecure' })).toBeNull()
    expect(readUsgsQuakeConfig({ ATLASZ_USGS_MIN_MAGNITUDE: '6' })?.minMagnitude).toBe(6)
  })

  it('normalizes quakes with official-api provenance, geo, severity-from-magnitude, and source trail', () => {
    const records = parseUsgsQuakes(FIXTURE, { retrievedAt: NOW })
    const events = normalizeUsgsEarthquakes(records)
    const big = events.find((e) => e.earthquakeEvent?.eventId === 'us7000abcd')
    expect(big?.category).toBe('natural-disaster')
    expect(big?.provenance).toBe('official-api')
    expect(big?.confidence).toBe(96)
    expect(big?.sourceId).toBe(USGS_QUAKES_SOURCE_ID)
    expect(big?.sourceUrl).toBe('https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd')
    expect((big?.severity as Severity)).toBe('critical') // mag 7.1
    expect(big?.lat).toBe(36.2)
    expect(big?.lon).toBe(140.1)
    expect(big?.earthquakeEvent?.depthKm).toBe(30.5)
    expect(big?.earthquakeEvent?.tsunami).toBe(true)
    expect(big?.earthquakeEvent?.countryCode).toBe('JP') // from "..., Japan"
    expect(big?.affectedAssets).toEqual([])
  })

  it('drops malformed features and applies the magnitude threshold', () => {
    expect(parseUsgsQuakes(FIXTURE).find((r) => r.eventId === 'bad1')).toBeUndefined()
    const filtered = parseUsgsQuakes(FIXTURE, { config: { minMagnitude: 6 } })
    expect(filtered.map((r) => r.eventId)).toEqual(['us7000abcd'])
  })

  it('links the quake event to a country entity in the graph', () => {
    const events = normalizeUsgsEarthquakes(parseUsgsQuakes(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    const graph = buildEntityGraph(events, { now: NOW })
    const country = graph.nodes.find((n) => n.id === 'country:jp')
    expect(country).toBeDefined()
    const quakeEvent = graph.nodes.find((n) => n.kind === 'event' && n.label.includes('Japan'))!
    const rels = neighborsOf(graph, quakeEvent.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(rels).toContain('in_country:country')
  })

  it('round-trips the earthquake sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-quake-'))
    dirs.push(dir)
    const event = normalizeUsgsEarthquakes(parseUsgsQuakes(FIXTURE, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.earthquakeEvent)
    expect(restored?.earthquakeEvent?.eventId).toBe(event.earthquakeEvent?.eventId)
    expect(restored?.earthquakeEvent?.magnitude).toBe(event.earthquakeEvent?.magnitude)
    expect(restored?.earthquakeEvent?.rawPayloadHash).toBe(event.earthquakeEvent?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseUsgsQuakes(null)).toEqual([])
    expect(parseUsgsQuakes({ features: [] })).toEqual([])
    expect(normalizeUsgsEarthquakes([])).toEqual([])

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchUsgsEarthquakes(new AbortController().signal, { feedUrl: 'https://earthquake.usgs.gov/x.geojson', minMagnitude: 0, maxRecords: 10 }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
