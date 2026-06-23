import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BEA_SOURCE_ID,
  fetchBeaObservations,
  normalizeBeaObservations,
  parseBeaResponse,
  readBeaConfig,
} from '../electron/osint/adapters/beaAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-01T00:00:00Z')
const dirs: string[] = []

const FIXTURE = {
  BEAAPI: {
    Results: {
      Data: [
        {
          TableName: 'T10101',
          SeriesCode: 'A191RL',
          LineNumber: '1',
          LineDescription: 'Gross domestic product',
          TimePeriod: '2026Q1',
          DataValue: '3.8',
          CL_UNIT: 'Percent change',
          UNIT_MULT: '0',
        },
        {
          TableName: 'T10101',
          SeriesCode: 'A191RL',
          LineNumber: '1',
          LineDescription: 'Gross domestic product',
          TimePeriod: '2025Q4',
          DataValue: '2.4',
          CL_UNIT: 'Percent change',
          UNIT_MULT: '0',
        },
        {
          TableName: 'T10101',
          LineNumber: '2',
          LineDescription: 'Personal consumption expenditures',
          TimePeriod: '2026Q1',
          DataValue: '1.0',
          CL_UNIT: 'Percent change',
        },
      ],
    },
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('BEA adapter', () => {
  it('is key-gated and refuses insecure overrides', () => {
    expect(readBeaConfig({})).toBeNull()
    expect(readBeaConfig({ ATLASZ_BEA_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readBeaConfig({ ATLASZ_BEA_DISABLE: '1', ATLASZ_BEA_API_KEY: 'secret' })).toBeNull()
    expect(readBeaConfig({ ATLASZ_BEA_API_KEY: 'secret', ATLASZ_BEA_API_BASE: 'http://insecure' })).toBeNull()
    expect(readBeaConfig({ ATLASZ_BEA_API_KEY: 'secret', ATLASZ_BEA_SERIES: 'T10101:1,bad' })?.series).toHaveLength(1)
  })

  it('normalizes the latest BEA NIPA observation with official source fields', () => {
    const records = parseBeaResponse(FIXTURE, { retrievedAt: NOW })
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      datasetName: 'NIPA',
      tableName: 'T10101',
      lineNumber: '1',
      lineDescription: 'Gross domestic product',
      timePeriod: '2026Q1',
      observationDate: '2026-03-01',
      metricValue: 3.8,
      rawValue: '3.8',
      units: 'Percent change',
      sourceName: 'U.S. Bureau of Economic Analysis',
      provenance: 'official-api',
      confidence: 96,
    })
    expect(records[0].sourceUrl).toBe('https://www.bea.gov/data/gdp/gross-domestic-product')
    expect(records[0].sourceApiUrl).toContain('https://apps.bea.gov/api/data')
    expect(records[0].sourceApiUrl).not.toContain('UserID=')

    const events = normalizeBeaObservations(records)
    expect(events).toHaveLength(1)
    expect(events[0].sourceId).toBe(BEA_SOURCE_ID)
    expect(events[0].category).toBe('macro-event')
    expect(events[0].affectedAssets).toEqual([])
    expect(events[0].beaObservation?.rawPayloadJson).toContain('Gross domestic product')
  })

  it('drops malformed records rather than repairing them', () => {
    expect(parseBeaResponse(null)).toEqual([])
    expect(parseBeaResponse({ BEAAPI: { Results: { Error: { APIErrorCode: '1' } } } })).toEqual([])
    expect(parseBeaResponse({ BEAAPI: { Results: { Data: [{ TableName: 'T10101', LineNumber: '1', TimePeriod: '2026Q1', DataValue: '(NA)' }] } } })).toEqual([])
  })

  it('links BEA observations to a macro-series and BEA institution in the graph', () => {
    const events = normalizeBeaObservations(parseBeaResponse(FIXTURE, { retrievedAt: NOW }))
    const graph = buildEntityGraph(events, { now: NOW })
    expect(graph.nodes.find((node) => node.id === 'macro-series:bea:nipa:t10101:1')).toBeDefined()
    expect(graph.nodes.find((node) => node.id === 'institution:u.s.-bureau-of-economic-analysis')).toBeDefined()
    expect(graph.relationships.some((edge) => edge.relation === 'issued_by')).toBe(true)
  })

  it('persists dedicated BEA observations and rehydrates BEA event sub-records', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-bea-'))
    dirs.push(dir)
    const persistence = createPersistence(dir)
    const event = normalizeBeaObservations(parseBeaResponse(FIXTURE, { retrievedAt: NOW }))[0]
    const record = event.beaObservation
    if (!record) throw new Error('missing BEA fixture record')

    persistence.saveBeaObservation(record)
    persistence.saveWorldIntelEvent(event)

    const storedRecord = createPersistence(dir).listBeaObservations('NIPA:T10101:1', 10)[0]
    expect(storedRecord).toMatchObject({
      datasetName: 'NIPA',
      tableName: 'T10101',
      lineNumber: '1',
      metricValue: 3.8,
      confidence: 96,
    })
    expect(storedRecord.sourceApiUrl).not.toContain('UserID=')

    const storedEvent = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.beaObservation)
    expect(storedEvent?.beaObservation?.tableName).toBe('T10101')
    expect(storedEvent?.beaObservation?.rawPayloadHash).toBe(record.rawPayloadHash)
  })

  it('sends UserID only on the live request and fails closed on HTTP errors', async () => {
    let sentUrl = ''
    vi.stubGlobal('fetch', async (url: URL) => {
      sentUrl = url.toString()
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })

    const events = await fetchBeaObservations(new AbortController().signal, {
      apiBase: 'https://apps.bea.gov/api/data',
      apiKey: 'secret-bea-key',
      series: readBeaConfig({ ATLASZ_BEA_API_KEY: 'secret' })?.series ?? [],
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })

    expect(sentUrl).toContain('UserID=secret-bea-key')
    expect(events[0].beaObservation?.sourceApiUrl).not.toContain('secret-bea-key')

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchBeaObservations(new AbortController().signal, {
        apiBase: 'https://apps.bea.gov/api/data',
        apiKey: 'secret-bea-key',
        series: readBeaConfig({ ATLASZ_BEA_API_KEY: 'secret' })?.series ?? [],
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
