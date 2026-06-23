import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  USPTO_PATENTS_SOURCE_ID,
  fetchUsptoPatents,
  normalizeUsptoPatents,
  parseUsptoPatents,
  readUsptoPatentConfig,
} from '../electron/osint/adapters/usptoPatentAdapter'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { createPersistence } from '../electron/persistence'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FIXTURE = {
  patents: [
    {
      patent_id: '12345678',
      patent_title: 'GPU memory subsystem for AI accelerators',
      patent_date: '2026-05-20',
      patent_abstract: 'A   memory   subsystem...',
      assignees: [{ assignee_organization: 'NVIDIA Corporation' }, { assignee_inventor: 'should be ignored' }],
      cpc_current: [{ cpc_group_id: 'G06F12/00' }],
    },
    {
      patent_id: '12345679',
      patent_title: 'Advanced packaging interposer',
      patent_date: '2026-05-10',
      assignees: [{ assignee_organization: 'Taiwan Semiconductor Manufacturing Company, Ltd.' }],
      cpc_current: [{ cpc_group_id: 'H01L23/00' }],
    },
    {
      // Malformed: no title, bad date -> dropped, not repaired.
      patent_id: 'bad',
      patent_title: '',
      patent_date: 'nope',
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

describe('USPTO patents adapter', () => {
  it('is config-gated on the API key and fails closed without it', () => {
    expect(readUsptoPatentConfig({})).toBeNull()
    expect(readUsptoPatentConfig({ ATLASZ_PATENTSVIEW_API_KEY: 'k' })).not.toBeNull()
    expect(readUsptoPatentConfig({ ATLASZ_PATENTSVIEW_API_KEY: 'k', ATLASZ_PATENTSVIEW_BASE_URL: 'http://insecure' })).toBeNull()
  })

  it('normalizes patents with official-api provenance, assignees (orgs only), and source trail', () => {
    const records = parseUsptoPatents(FIXTURE, { retrievedAt: NOW })
    const events = normalizeUsptoPatents(records)
    const gpu = events.find((e) => e.patentRecord?.patentId === '12345678')
    expect(gpu?.category).toBe('patent')
    expect(gpu?.provenance).toBe('official-api')
    expect(gpu?.confidence).toBe(96)
    expect(gpu?.sourceId).toBe(USPTO_PATENTS_SOURCE_ID)
    expect(gpu?.sourceUrl).toBe('https://patents.google.com/patent/US12345678')
    expect(gpu?.patentRecord?.assignees).toEqual(['NVIDIA Corporation']) // organizations only, no person data
    expect(gpu?.patentRecord?.cpcCodes).toEqual(['G06F12/00'])
    expect(gpu?.patentRecord?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(gpu?.affectedAssets).toEqual([])
  })

  it('never persists the API key in the source trail', () => {
    const records = parseUsptoPatents(FIXTURE, { retrievedAt: NOW, sourceApiUrl: 'https://search.patentsview.org/api/v1/patent/' })
    for (const record of records) {
      expect(record.sourceApiUrl).not.toMatch(/api[_-]?key|x-api-key/i)
      expect(record.rawPayloadJson ?? '').not.toMatch(/secretkey/)
    }
  })

  it('drops malformed patents (no title / bad date), never repairs them', () => {
    const records = parseUsptoPatents(FIXTURE, { retrievedAt: NOW })
    expect(records.find((r) => r.patentId === 'bad')).toBeUndefined()
  })

  it('links patent -> assignee company in the Evidence Graph', () => {
    const events = normalizeUsptoPatents(parseUsptoPatents(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    const graph = buildEntityGraph(events, { now: NOW })
    const patent = graph.nodes.find((n) => n.id === 'patent:12345678')!
    expect(patent.kind).toBe('patent')
    expect(neighborsOf(graph, patent.id).map((n) => `${n.relation}:${n.entity.kind}`)).toContain('filed_by:company')
  })

  it('resolves a patent assignee to the seed company and lights up structural exposure', () => {
    const event = normalizeUsptoPatents(parseUsptoPatents(FIXTURE, { retrievedAt: NOW }))[0]
    expect(isEventResolvable(event)).toBe(true) // NVIDIA Corporation -> company:nvidia
    const exposed = eventStructuralExposure(event)
    const nvidia = exposed.find((e) => e.resolution.canonicalSeedEntityId === 'company:nvidia')
    expect(nvidia).toBeDefined()
    expect(nvidia!.exposure.map((p) => p.entity.id)).toContain('company:tsmc')
  })

  it('round-trips the patent sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-uspto-'))
    dirs.push(dir)
    const event = normalizeUsptoPatents(parseUsptoPatents(FIXTURE, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.patentRecord)
    expect(restored?.patentRecord?.patentId).toBe(event.patentRecord?.patentId)
    expect(restored?.patentRecord?.assignees).toEqual(event.patentRecord?.assignees)
    expect(restored?.patentRecord?.rawPayloadHash).toBe(event.patentRecord?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseUsptoPatents(null)).toEqual([])
    expect(parseUsptoPatents({ patents: [] })).toEqual([])
    expect(normalizeUsptoPatents([])).toEqual([])

    let apiKeyHeader: string | undefined
    vi.stubGlobal('fetch', async (_url: string, init: { headers?: Record<string, string> }) => {
      apiKeyHeader = init?.headers?.['x-api-key']
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }
    })
    await expect(
      fetchUsptoPatents(new AbortController().signal, { apiBase: 'https://search.patentsview.org/api/v1/patent/', apiKey: 'secretkey', assignees: ['NVIDIA Corporation'], lookbackDays: 30, maxRecords: 10 }),
    ).rejects.toMatchObject({ status: 429 })
    expect(apiKeyHeader).toBe('secretkey') // key sent as header, not in URL
  })
})
