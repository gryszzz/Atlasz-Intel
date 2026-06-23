/*
 * GDELT / media-observation stabilization guards.
 *
 * These lock in the hard boundary: low-trust media observations cannot contaminate
 * official intelligence, exposure ranking, or "What Changed Today" ordering.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { normalizeGdeltArticles, parseGdeltArticles } from '../electron/osint/adapters/gdeltAdapter'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import { summarizeExposure } from '../src/engine/runtimeAudit'
import { ExposureDashboardPanel } from '../src/components/intel/ExposureDashboardPanel'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?query=oil&mode=ArtList&format=json'

const GDELT_FIXTURE = {
  articles: [
    {
      url: 'https://example-news.com/nvidia-and-tsmc-chip-tariffs',
      title: 'NVIDIA, AAPL and TSMC face new semiconductor and oil tariffs, sources say',
      seendate: '20260623T100000Z',
      domain: 'example-news.com',
      language: 'English',
      sourcecountry: 'United States',
    },
  ],
}

function gdeltEvent(): WorldIntelEvent {
  return normalizeGdeltArticles(parseGdeltArticles(GDELT_FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL, query: 'oil' }))[0]
}

let seq = 0
function officialEvent(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `official-${seq}`,
    timestamp: partial.timestamp ?? NOW - 30 * 60_000,
    title: partial.title ?? 'Official alert',
    summary: '',
    countryCodes: partial.countryCodes ?? [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'watch') as Severity,
    confidence: partial.confidence ?? 96,
    sourceId: partial.sourceId,
    sourceUrl: 'https://example.gov/1',
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: `h-${seq}`,
    dedupeHash: `d-${seq}`,
    secFiling: partial.secFiling,
  } as WorldIntelEvent
}

describe('media-observation stabilization', () => {
  it('a media observation cannot change exposure dashboard counts or ranks', () => {
    const official = officialEvent({
      id: 'sec-nvda',
      sourceId: 'sec_edgar_public',
      affectedAssets: ['NVDA'],
      provenance: 'public-disclosure',
    })
    const media = gdeltEvent()

    const withoutMedia = summarizeExposure({ events: [official], now: NOW })
    const withMedia = summarizeExposure({ events: [official, media], now: NOW })

    // The media observation is tracked in its OWN bucket...
    expect(withMedia.mediaObservationCount).toBe(1)
    expect(withoutMedia.mediaObservationCount).toBe(0)
    // ...but it changes nothing about resolved/curated exposure or the ranks.
    expect(withMedia.resolvedEventCount).toBe(withoutMedia.resolvedEventCount)
    expect(withMedia.curatedReferenceOnlyCount).toBe(withoutMedia.curatedReferenceOnlyCount)
    expect(withMedia.topCompanies).toEqual(withoutMedia.topCompanies)
    expect(withMedia.topCountries).toEqual(withoutMedia.topCountries)
    // It is never itself a resolved exposure event.
    expect(withMedia.recentResolvedEvents.some((event) => event.sourceId === 'gdelt_doc_public')).toBe(false)
  })

  it('does not rank a media observation above an official alert (fixed-low severity + low trust)', () => {
    const media = gdeltEvent()
    expect(media.severity).toBe('stable') // adapter fixes severity low — never inflated
    const official = officialEvent({ id: 'noaa-1', sourceId: 'noaa_alerts_public', severity: 'watch', title: 'NWS watch' })

    const result = assessWhatChangedToday([media, official], { now: NOW })
    const officialIndex = result.items.findIndex((item) => item.sourceIds.includes('noaa_alerts_public'))
    const mediaIndex = result.items.findIndex((item) => item.sourceIds.includes('gdelt_doc_public'))

    expect(officialIndex).toBeGreaterThanOrEqual(0)
    expect(mediaIndex).toBeGreaterThanOrEqual(0)
    expect(officialIndex).toBeLessThan(mediaIndex) // official ranks above media
    const mediaItem = result.items[mediaIndex]
    const officialItem = result.items[officialIndex]
    expect(mediaItem.materiality).toBeLessThan(officialItem.materiality)
  })

  it('labels a media observation as "media observation" in What Changed Today (not event fact)', () => {
    const result = assessWhatChangedToday([gdeltEvent()], { now: NOW })
    expect(result.items[0]?.changeType).toBe('media-observation')
  })

  it('keeps sourceCountry out of the event country (outlet is not an event location)', () => {
    const media = gdeltEvent()
    expect(media.gdeltArticle?.sourceCountry).toBe('United States')
    expect(media.countryCodes).toEqual([])
  })

  it('renders the Exposure Dashboard with a separate media-observed bucket and honesty note', () => {
    const official = officialEvent({ id: 'sec-nvda', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], provenance: 'public-disclosure' })
    const markup = renderToStaticMarkup(createElement(ExposureDashboardPanel, { events: [official, gdeltEvent()], now: NOW }))
    expect(markup).toContain('media observed')
    expect(markup).toContain('official resolved')
    expect(markup).toContain('curated context')
    expect(markup).toContain('Media observations')
    expect(markup).not.toContain('prov-tier-verified')
  })
})
