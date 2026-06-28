import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  OPENALEX_WORKS_SOURCE_ID,
  applyOpenAlexChangeStatus,
  fetchOpenAlexWorks,
  normalizeOpenAlexWorks,
  parseOpenAlexWorks,
  readOpenAlexConfig,
  type OpenAlexConfig,
} from '../electron/osint/adapters/openAlexAdapter'
import { createPersistence } from '../electron/persistence'
import { OpenAlexSourceTrail } from '../src/components/intel/OpenAlexSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://api.openalex.org/works?search=silicon+photonics&per-page=1&api_key=SECRET-OPENALEX-KEY'

const WORKS_FIXTURE = {
  results: [
    {
      id: 'https://openalex.org/W1234567890',
      doi: 'https://doi.org/10.1234/example.2026.001',
      title: 'Silicon photonics for AI accelerator interconnects',
      publication_year: 2026,
      publication_date: '2026-06-20',
      type: 'article',
      primary_location: {
        landing_page_url: 'https://example.org/papers/silicon-photonics-ai',
        source: { display_name: 'Journal of Photonics Systems' },
      },
      authorships: [
        {
          author: { display_name: 'Ada Source' },
          institutions: [{ display_name: 'Massachusetts Institute of Technology', country_code: 'US' }],
        },
        {
          author: { display_name: 'Grace Metadata' },
          institutions: [{ display_name: 'Fraunhofer Institute', country_code: 'DE' }],
        },
      ],
      topics: [{ display_name: 'Silicon photonics' }, { display_name: 'Artificial intelligence hardware' }],
      primary_topic: { display_name: 'Integrated photonics' },
      cited_by_count: 42,
      is_retracted: false,
      ids: { openalex: 'https://openalex.org/W1234567890' },
    },
    {
      // Duplicate work -> deduped.
      id: 'https://openalex.org/W1234567890',
      title: 'Silicon photonics for AI accelerator interconnects',
      publication_date: '2026-06-20',
    },
    {
      // Malformed: missing OpenAlex work id and non-https location -> dropped.
      id: 'bad-id',
      title: 'Malformed row',
      primary_location: { landing_page_url: 'http://insecure.example/paper' },
    },
  ],
}

const CONFIG: OpenAlexConfig = {
  apiBase: 'https://api.openalex.org/works',
  apiKey: 'SECRET-OPENALEX-KEY',
  topicBuckets: ['silicon photonics'],
  perBucket: 1,
  maxAuthors: 2,
  lookbackDays: 30,
  timeoutMs: 1_000,
  maxRetries: 0,
  backoffMs: 0,
}

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function records() {
  return parseOpenAlexWorks(WORKS_FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL, queryBucket: 'silicon photonics', maxAuthors: 2 })
}

describe('OpenAlex Works adapter', () => {
  it('runs without a key and refuses non-official endpoint overrides', () => {
    expect(readOpenAlexConfig({})).not.toBeNull()
    expect(readOpenAlexConfig({ ATLASZ_OPENALEX_API_KEY: 'k', ATLASZ_OPENALEX_DISABLE: '1' })).toBeNull()
    expect(readOpenAlexConfig({ ATLASZ_OPENALEX_API_KEY: 'k', ATLASZ_OPENALEX_API_BASE: 'http://api.openalex.org/works' })).toBeNull()
    expect(readOpenAlexConfig({ ATLASZ_OPENALEX_API_KEY: 'k', ATLASZ_OPENALEX_API_BASE: 'https://example.com/works' })).toBeNull()
    expect(readOpenAlexConfig({ ATLASZ_OPENALEX_API_KEY: 'k' })).not.toBeNull()
  })

  it('normalizes official research metadata with proof fields and drops malformed rows', () => {
    const parsed = records()
    expect(parsed).toHaveLength(1)
    const record = parsed[0]
    expect(record.openAlexWorkId).toBe('W1234567890')
    expect(record.openAlexUrl).toBe('https://openalex.org/W1234567890')
    expect(record.doi).toBe('10.1234/example.2026.001')
    expect(record.doiUrl).toBe('https://doi.org/10.1234/example.2026.001')
    expect(record.institutions).toEqual(['Massachusetts Institute of Technology', 'Fraunhofer Institute'])
    expect(record.institutionCountries).toEqual(['US', 'DE'])
    expect(record.topics).toEqual(['Integrated photonics', 'Silicon photonics', 'Artificial intelligence hardware'])
    expect(record.authors).toEqual(['Ada Source', 'Grace Metadata'])
    expect(record.sourceApiUrl).toContain('api.openalex.org/works')
    expect(record.sourceApiUrl).not.toContain('SECRET-OPENALEX-KEY')
    expect(record.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(record.provenance).toBe('official-api')
    expect(record.confidence).toBe(96)
    expect(record.changeType).toBe('first_seen')
  })

  it('normalizes into world events without hype, market claims, or invented exposure', () => {
    const event = normalizeOpenAlexWorks(records())[0]
    expect(event.sourceId).toBe(OPENALEX_WORKS_SOURCE_ID)
    expect(event.sourceUrl).toBe('https://openalex.org/W1234567890')
    expect(event.provenance).toBe('official-api')
    expect(event.category).toBe('research')
    expect(event.summary).toContain('Research metadata, not validation of technical claims')
    expect(event.summary).toContain('market impact')
    expect(event.affectedAssets).toEqual([])
    expect(event.affectedSectors).toEqual([])
    expect(event.affectedCommodities).toEqual([])
    expect(event.affectedCurrencies).toEqual([])
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })

  it('classifies local change status by stable work identity + payload hash', () => {
    const event = normalizeOpenAlexWorks(records())[0]
    const first = applyOpenAlexChangeStatus(event)
    expect(first.openAlexWork?.changeType).toBe('new_today')
    expect(applyOpenAlexChangeStatus(event, first).openAlexWork?.changeType).toBe('unchanged')
    const previous = { ...first, openAlexWork: { ...first.openAlexWork!, rawPayloadHash: 'b'.repeat(64) } }
    expect(applyOpenAlexChangeStatus(event, previous).openAlexWork?.changeType).toBe('updated')
  })

  it('links work -> venue, institution, topic, institution countries, and OpenAlex source', () => {
    const event = normalizeOpenAlexWorks(records())[0]
    const graph = buildEntityGraph([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })
    const work = graph.nodes.find((node) => node.kind === 'research-work')!
    const rels = neighborsOf(graph, work.id).map((n) => `${n.relation}:${n.entity.kind}:${n.entity.label}`)
    expect(rels).toContain('references:venue:Journal of Photonics Systems')
    expect(rels).toContain('touches:institution:Massachusetts Institute of Technology')
    expect(rels).toContain('references:topic:Silicon photonics')
    expect(rels).toContain('in_country:country:US')
    expect(rels).toContain('reported_by:source:OpenAlex')
    expect(graph.nodes.some((node) => node.kind === 'company')).toBe(false)
  })

  it('round-trips the research sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-openalex-'))
    dirs.push(dir)
    const event = normalizeOpenAlexWorks(records())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.openAlexWork)
    expect(restored?.openAlexWork?.openAlexWorkId).toBe('W1234567890')
    expect(restored?.openAlexWork?.rawPayloadHash).toBe(event.openAlexWork?.rawPayloadHash)
    expect(JSON.stringify(restored)).not.toContain('SECRET-OPENALEX-KEY')
  })

  it('renders the source trail with proof fields, key-free API URL, and boundary label', () => {
    const event = normalizeOpenAlexWorks(records())[0]
    const markup = renderToStaticMarkup(createElement(OpenAlexSourceTrail, { events: [event as WorldIntelEvent], now: NOW }))
    expect(markup).toContain('OpenAlex research')
    expect(markup).toContain('Silicon photonics for AI accelerator interconnects')
    expect(markup).toContain('Research metadata, not validation')
    expect(markup).toContain('API query (key-free)')
    expect(markup).toContain('Cited by')
    expect(markup).not.toContain('SECRET-OPENALEX-KEY')
    expect(markup).not.toContain('investment')
  })

  it('renders DATA_UNAVAILABLE when no OpenAlex work proof is present', () => {
    const markup = renderToStaticMarkup(createElement(OpenAlexSourceTrail, { events: [], now: NOW }))
    expect(markup).toContain('DATA_UNAVAILABLE')
  })

  it('sends api_key only in the request URL and never normalizes it into records', async () => {
    let requestedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => WORKS_FIXTURE }
    })

    const events = await fetchOpenAlexWorks(new AbortController().signal, CONFIG)
    expect(requestedUrl).toContain('api_key=SECRET-OPENALEX-KEY')
    expect(events).toHaveLength(1)
    expect(JSON.stringify(events)).not.toContain('SECRET-OPENALEX-KEY')
    expect(events[0].openAlexWork?.sourceApiUrl).toContain('api.openalex.org/works')
  })

  it('omits api_key entirely in public no-key mode', async () => {
    let requestedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => WORKS_FIXTURE }
    })

    const config = { ...CONFIG }
    delete config.apiKey
    const events = await fetchOpenAlexWorks(new AbortController().signal, config)
    expect(requestedUrl).toContain('api.openalex.org/works')
    expect(requestedUrl).not.toContain('api_key=')
    expect(events).toHaveLength(1)
    expect(JSON.stringify(events)).not.toContain('api_key')
  })

  it('fails closed on rate limits through fetchPolicy', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '9' : null) },
      json: async () => ({}),
    }))
    await expect(fetchOpenAlexWorks(new AbortController().signal, CONFIG)).rejects.toMatchObject({ status: 429, retryAfterMs: 9_000 })
  })
})
