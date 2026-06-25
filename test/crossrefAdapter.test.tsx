import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CROSSREF_WORKS_SOURCE_ID,
  fetchCrossrefWorks,
  normalizeCrossrefWorks,
  parseCrossrefWorks,
  readCrossrefConfig,
  type CrossrefConfig,
} from '../electron/osint/adapters/crossrefAdapter'
import { normalizeOpenAlexWorks, parseOpenAlexWorks } from '../electron/osint/adapters/openAlexAdapter'
import { createPersistence } from '../electron/persistence'
import { CrossrefSourceTrail } from '../src/components/intel/CrossrefSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://api.crossref.org/works?query=silicon+photonics&rows=1&mailto=operator@example.com'

const CROSSREF_FIXTURE = {
  status: 'ok',
  'message-type': 'work-list',
  message: {
    items: [
      {
        DOI: '10.1234/Example.2026.001',
        title: ['Silicon photonics for AI accelerator interconnects'],
        type: 'journal-article',
        publisher: 'Example Academic Press',
        'container-title': ['Journal of Photonics Systems'],
        issued: { 'date-parts': [[2026, 6, 20]] },
        published: { 'date-parts': [[2026, 6, 19]] },
        URL: 'https://doi.org/10.1234/example.2026.001',
        license: [{ URL: 'https://creativecommons.org/licenses/by/4.0/' }],
        funder: [{ name: 'National Science Foundation' }],
        subject: ['Electrical and Electronic Engineering', 'Optical Physics'],
        'reference-count': 12,
        'is-referenced-by-count': 42,
        source: 'Crossref',
      },
      {
        // Duplicate DOI -> deduped.
        DOI: '10.1234/example.2026.001',
        title: ['Duplicate'],
      },
      {
        // Malformed: missing DOI -> dropped, not repaired.
        title: ['Missing DOI'],
      },
    ],
  },
}

const OPENALEX_FIXTURE = {
  results: [
    {
      id: 'https://openalex.org/W1234567890',
      doi: 'https://doi.org/10.1234/example.2026.001',
      title: 'Silicon photonics for AI accelerator interconnects',
      publication_year: 2026,
      publication_date: '2026-06-20',
      type: 'article',
      primary_location: { source: { display_name: 'Journal of Photonics Systems' } },
      topics: [{ display_name: 'Silicon photonics' }],
      ids: { openalex: 'https://openalex.org/W1234567890' },
    },
  ],
}

const CONFIG: CrossrefConfig = {
  apiBase: 'https://api.crossref.org/works',
  mailto: 'operator@example.com',
  queryBuckets: ['silicon photonics'],
  rowsPerBucket: 1,
  lookbackDays: 60,
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
  return parseCrossrefWorks(CROSSREF_FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL, queryBucket: 'silicon photonics' })
}

describe('Crossref Works adapter', () => {
  it('is public by default, supports optional polite mailto, and refuses non-official endpoints', () => {
    expect(readCrossrefConfig({})).not.toBeNull()
    expect(readCrossrefConfig({ ATLASZ_CROSSREF_DISABLE: '1' })).toBeNull()
    expect(readCrossrefConfig({ ATLASZ_CROSSREF_API_BASE: 'http://api.crossref.org/works' })).toBeNull()
    expect(readCrossrefConfig({ ATLASZ_CROSSREF_API_BASE: 'https://example.com/works' })).toBeNull()
    expect(readCrossrefConfig({ ATLASZ_CROSSREF_MAILTO: 'operator@example.com' })?.mailto).toBe('operator@example.com')
    expect(readCrossrefConfig({ ATLASZ_CROSSREF_MAILTO: 'not an email' })?.mailto).toBeUndefined()
  })

  it('normalizes official DOI metadata with proof fields and drops malformed rows', () => {
    const parsed = records()
    expect(parsed).toHaveLength(1)
    const record = parsed[0]
    expect(record.doi).toBe('10.1234/example.2026.001')
    expect(record.doiUrl).toBe('https://doi.org/10.1234/example.2026.001')
    expect(record.title).toBe('Silicon photonics for AI accelerator interconnects')
    expect(record.publisher).toBe('Example Academic Press')
    expect(record.containerTitle).toBe('Journal of Photonics Systems')
    expect(record.issuedDate).toBe('2026-06-20')
    expect(record.publishedDate).toBe('2026-06-19')
    expect(record.licenseUrls).toEqual(['https://creativecommons.org/licenses/by/4.0/'])
    expect(record.funders).toEqual(['National Science Foundation'])
    expect(record.subjects).toContain('Optical Physics')
    expect(record.referenceCount).toBe(12)
    expect(record.isReferencedByCount).toBe(42)
    expect(record.sourceApiUrl).toContain('api.crossref.org/works')
    expect(record.sourceApiUrl).not.toContain('operator@example.com')
    expect(record.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(record.provenance).toBe('official-api')
    expect(record.confidence).toBe(96)
  })

  it('normalizes into world events without full-text, claim validation, or invented exposure', () => {
    const event = normalizeCrossrefWorks(records())[0]
    expect(event.sourceId).toBe(CROSSREF_WORKS_SOURCE_ID)
    expect(event.sourceUrl).toContain('api.crossref.org/works')
    expect(event.provenance).toBe('official-api')
    expect(event.category).toBe('doi-metadata')
    expect(event.summary).toContain('DOI registry metadata, not validation')
    expect(event.summary).toContain('citation quality')
    expect(event.affectedAssets).toEqual([])
    expect(event.affectedSectors).toEqual([])
    expect(event.affectedCommodities).toEqual([])
    expect(event.affectedCurrencies).toEqual([])
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })

  it('links DOI record -> publisher, venue, funder, Crossref source, and exact OpenAlex DOI node', () => {
    const crossrefEvent = normalizeCrossrefWorks(records())[0]
    const openAlexEvent = normalizeOpenAlexWorks(
      parseOpenAlexWorks(OPENALEX_FIXTURE, {
        retrievedAt: NOW,
        sourceApiUrl: 'https://api.openalex.org/works?search=silicon+photonics',
        queryBucket: 'silicon photonics',
      }),
    )[0]
    const graph = buildEntityGraph([crossrefEvent, openAlexEvent], { now: NOW })
    const doiNode = graph.nodes.find((node) => node.kind === 'doi-work' && node.label === '10.1234/example.2026.001')!
    expect(doiNode).toBeDefined()
    const sourceIds = new Set(doiNode.evidence.map((e) => e.sourceId))
    expect(sourceIds).toEqual(new Set(['crossref_works_public', 'openalex_works_public']))

    const rels = neighborsOf(graph, doiNode.id).map((n) => `${n.relation}:${n.direction}:${n.entity.kind}:${n.entity.label}`)
    expect(rels).toContain('issued_by:out:publisher:Example Academic Press')
    expect(rels).toContain('references:out:venue:Journal of Photonics Systems')
    expect(rels).toContain('references:out:funder:National Science Foundation')
    expect(rels).toContain('reported_by:out:source:Crossref')
    expect(rels.some((r) => r.includes('research-work:Silicon photonics'))).toBe(true)
    expect(graph.nodes.some((node) => node.kind === 'company')).toBe(false)
  })

  it('round-trips the DOI metadata sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-crossref-'))
    dirs.push(dir)
    const event = normalizeCrossrefWorks(records())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.crossrefWork)
    expect(restored?.crossrefWork?.doi).toBe('10.1234/example.2026.001')
    expect(restored?.crossrefWork?.rawPayloadHash).toBe(event.crossrefWork?.rawPayloadHash)
    expect(JSON.stringify(restored)).not.toContain('operator@example.com')
  })

  it('renders the source trail with proof fields, key-free API URL, and boundary label', () => {
    const event = normalizeCrossrefWorks(records())[0]
    const markup = renderToStaticMarkup(createElement(CrossrefSourceTrail, { events: [event as WorldIntelEvent], now: NOW }))
    expect(markup).toContain('Crossref DOI metadata')
    expect(markup).toContain('Silicon photonics for AI accelerator interconnects')
    expect(markup).toContain('DOI registry metadata, not full text')
    expect(markup).toContain('Crossref API query')
    expect(markup).toContain('Referenced by')
    expect(markup).not.toContain('operator@example.com')
    expect(markup).not.toContain('investment')
  })

  it('renders DATA_UNAVAILABLE when no Crossref proof is present', () => {
    const markup = renderToStaticMarkup(createElement(CrossrefSourceTrail, { events: [], now: NOW }))
    expect(markup).toContain('DATA_UNAVAILABLE')
  })

  it('sends optional mailto only in the request URL and never normalizes it into records', async () => {
    let requestedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => CROSSREF_FIXTURE }
    })

    const events = await fetchCrossrefWorks(new AbortController().signal, CONFIG)
    expect(requestedUrl).toContain('mailto=operator%40example.com')
    expect(events).toHaveLength(1)
    expect(JSON.stringify(events)).not.toContain('operator@example.com')
    expect(events[0].crossrefWork?.sourceApiUrl).toContain('api.crossref.org/works')
  })

  it('fails closed on rate limits through fetchPolicy', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '7' : null) },
      json: async () => ({}),
    }))
    await expect(fetchCrossrefWorks(new AbortController().signal, CONFIG)).rejects.toMatchObject({ status: 429, retryAfterMs: 7_000 })
  })
})
