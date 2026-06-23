import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GDELT_DOC_SOURCE_ID,
  fetchGdeltEvents,
  normalizeGdeltArticles,
  parseGdeltArticles,
  readGdeltConfig,
} from '../electron/osint/adapters/gdeltAdapter'
import { createPersistence } from '../electron/persistence'
import { GdeltSourceTrail } from '../src/components/intel/GdeltSourceTrail'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import { provenanceTrust } from '../src/engine/materialityEngine'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?query=oil&mode=ArtList&format=json'

// Real GDELT DOC 2.0 ArtList shape (seendate is YYYYMMDDTHHMMSSZ).
const FIXTURE = {
  articles: [
    {
      url: 'https://example-news.com/apple-and-nvidia-chip-deal',
      url_mobile: '',
      // Title intentionally packed with company/ticker words to prove NO exposure is inferred.
      title: 'Apple, NVIDIA, AAPL and TSMC discuss a giant semiconductor and oil tariff deal',
      seendate: '20260623T044500Z',
      socialimage: 'https://example-news.com/img.jpg',
      domain: 'example-news.com',
      language: 'English',
      sourcecountry: 'United States',
    },
    {
      // Duplicate (same url|title|domain|seendate) -> deduped.
      url: 'https://example-news.com/apple-and-nvidia-chip-deal',
      title: 'Apple, NVIDIA, AAPL and TSMC discuss a giant semiconductor and oil tariff deal',
      seendate: '20260623T044500Z',
      domain: 'example-news.com',
      language: 'English',
      sourcecountry: 'United States',
    },
    {
      // Malformed: no title and non-https url -> dropped, not repaired.
      url: 'http://insecure.example/none',
      title: '',
      seendate: '20260623T040000Z',
      domain: 'insecure.example',
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

describe('GDELT DOC adapter (media observation)', () => {
  it('is public by default and refuses insecure endpoint overrides', () => {
    expect(readGdeltConfig({})).not.toBeNull()
    expect(readGdeltConfig({ ATLASZ_GDELT_DISABLE: '1' })).toBeNull()
    expect(readGdeltConfig({ ATLASZ_GDELT_ENDPOINT: 'http://insecure' })).toBeNull()
  })

  it('normalizes articles as media-observation with proof fields and the not-verified label', () => {
    const records = parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL, query: 'oil OR semiconductor' })
    const events = normalizeGdeltArticles(records)
    expect(events).toHaveLength(1) // duplicate + malformed dropped
    const event = events[0]

    expect(event.sourceId).toBe(GDELT_DOC_SOURCE_ID)
    expect(event.provenance).toBe('media-observation')
    expect(event.category).toBe('media')
    expect(event.severity).toBe('stable') // never inflated from tone
    expect(event.confidence).toBe(96)
    expect(event.summary).toContain('Observed in media, not verified event')
    expect(event.gdeltArticle?.seenDate).toBe('20260623T044500Z')
    expect(event.gdeltArticle?.queryBucket).toBe('oil OR semiconductor')
    expect(event.gdeltArticle?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(event.timestamp).toBe(Date.parse('2026-06-23T04:45:00Z'))
  })

  it('infers NO exposure, geography, or tickers from the headline text', () => {
    const event = normalizeGdeltArticles(parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    // Despite "Apple, NVIDIA, AAPL, TSMC, semiconductor, oil, tariff" in the title:
    expect(event.affectedAssets).toEqual([])
    expect(event.affectedSectors).toEqual([])
    expect(event.affectedCommodities).toEqual([])
    expect(event.affectedCurrencies).toEqual([])
    expect(event.countryCodes).toEqual([]) // sourceCountry is the outlet, not an event location
  })

  it('never resolves a media observation into curated company/sector exposure', () => {
    const event = normalizeGdeltArticles(parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })

  it('keeps media-observation at a low, distinct trust weight (below public-unauthenticated)', () => {
    expect(provenanceTrust('media-observation')).toBeLessThan(provenanceTrust('public-unauthenticated'))
    expect(provenanceTrust('media-observation')).toBeLessThan(provenanceTrust('official-api'))
  })

  it('drops malformed/duplicate rows and fails closed on empty payloads', () => {
    expect(parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).toHaveLength(1)
    expect(parseGdeltArticles(null)).toEqual([])
    expect(parseGdeltArticles({ articles: [] })).toEqual([])
    expect(normalizeGdeltArticles([])).toEqual([])
  })

  it('round-trips the GDELT sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-gdelt-'))
    dirs.push(dir)
    const event = normalizeGdeltArticles(parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]

    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.gdeltArticle)

    expect(restored?.gdeltArticle?.url).toBe(event.gdeltArticle?.url)
    expect(restored?.gdeltArticle?.provenance).toBe('media-observation')
    expect(restored?.gdeltArticle?.rawPayloadHash).toBe(event.gdeltArticle?.rawPayloadHash)
  })

  it('renders media source-trail cards with the boundary label and never a verified badge', () => {
    const event = normalizeGdeltArticles(parseGdeltArticles(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    const markup = renderToStaticMarkup(createElement(GdeltSourceTrail, { events: [event as WorldIntelEvent] }))

    expect(markup).toContain('GDELT')
    expect(markup).toContain('Observed in media, not a verified event')
    expect(markup).toContain('media observation')
    expect(markup).toContain('example-news.com')
    expect(markup).not.toContain('prov-tier-verified')
    expect(markup).not.toContain('>verified<')
  })

  it('renders DATA_UNAVAILABLE when no GDELT observations are present', () => {
    const markup = renderToStaticMarkup(createElement(GdeltSourceTrail, { events: [] }))
    expect(markup).toContain('DATA_UNAVAILABLE')
  })

  it('fails closed on a non-JSON (rate-limit) body', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => 'Please limit requests to one every 5 seconds.',
    }))
    await expect(
      fetchGdeltEvents(new AbortController().signal, {
        endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc',
        query: 'oil',
        maxRecords: 5,
        timespan: '1d',
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toThrow(/non-JSON/i)
  })

  it('surfaces HttpError via fetchPolicy on rate limits', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '5' : null) },
      text: async () => '',
    }))
    await expect(
      fetchGdeltEvents(new AbortController().signal, {
        endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc',
        query: 'oil',
        maxRecords: 5,
        timespan: '1d',
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 5_000 })
  })
})
