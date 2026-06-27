import { describe, expect, it } from 'vitest'
import {
  defaultWorldwatchProfiles,
  explainTopMatches,
  loadWorldwatchProfiles,
  rankEventsForProfile,
  relevantEventsForProfile,
  saveWorldwatchProfiles,
  type WatchedEntity,
  type WorldwatchProfile,
} from '../src/engine/worldwatchProfiles'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `worldwatch-${seq}`,
    timestamp: partial.timestamp ?? NOW - 60 * 60 * 1000,
    title: partial.title ?? 'Untitled event',
    summary: partial.summary ?? '',
    countryCodes: partial.countryCodes ?? [],
    region: partial.region ?? 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'watch') as Severity,
    confidence: partial.confidence ?? 90,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/worldwatch/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: partial.affectedCurrencies ?? [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: partial.rawPayloadHash ?? `hash-${seq}`,
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    marketIdentity: partial.marketIdentity,
    secFiling: partial.secFiling,
    etfHolding: partial.etfHolding,
  } as WorldIntelEvent
}

function profile(partial: Partial<WorldwatchProfile> = {}): WorldwatchProfile {
  return {
    id: partial.id ?? 'test-profile',
    name: partial.name ?? 'Test Profile',
    watchedEntities: partial.watchedEntities ?? [{ kind: 'ticker', value: 'NVDA', label: 'NVIDIA' }],
    watchedThemes: partial.watchedThemes ?? [],
    watchedRegions: partial.watchedRegions ?? [],
    watchedConnectors: partial.watchedConnectors ?? [],
    priorityWeights: partial.priorityWeights ?? { entity: 1, theme: 0.9, geo: 0.85, connector: 0.7 },
    ignoredEntities: partial.ignoredEntities ?? [],
    createdAt: partial.createdAt ?? NOW,
    updatedAt: partial.updatedAt ?? NOW,
  }
}

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

describe('Worldwatch relevance profiles', () => {
  it('changes ranking visibility without changing truth confidence', () => {
    const watched = profile()
    const unrelated = ev({ id: 'other', sourceId: 'sec_edgar_public', affectedAssets: ['MSFT'], confidence: 99 })
    const nvda = ev({ id: 'nvda', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], confidence: 61 })

    const ranked = relevantEventsForProfile([unrelated, nvda], watched, { now: NOW })

    expect(ranked[0].event.id).toBe('nvda')
    expect(ranked[0].event.confidence).toBe(61)
    expect(nvda.confidence).toBe(61)
    expect(ranked[0].breakdown.sourceTrust).toBeGreaterThan(0)
  })

  it('ranks exact ticker matches above indirect ETF holding paths', () => {
    const watched = profile()
    const exact = ev({
      id: 'exact',
      sourceId: 'sec_edgar_public',
      provenance: 'public-unauthenticated',
      affectedAssets: ['NVDA'],
    })
    const indirect = ev({
      id: 'indirect',
      sourceId: 'etf_holdings_public',
      provenance: 'public-unauthenticated',
      title: 'SOXX holding row includes NVIDIA',
      etfHolding: { fundTicker: 'SOXX', holdingTicker: 'NVDA', holdingName: 'NVIDIA' } as WorldIntelEvent['etfHolding'],
    })

    const ranked = rankEventsForProfile([indirect, exact], watched, { now: NOW })
    const exactRank = ranked.find((item) => item.event.id === 'exact')
    const indirectRank = ranked.find((item) => item.event.id === 'indirect')

    expect(exactRank?.relevanceScore).toBeGreaterThan(indirectRank?.relevanceScore ?? 0)
    expect(explainTopMatches(exactRank?.matches ?? [])).toMatch(/exact ticker/i)
    expect(explainTopMatches(indirectRank?.matches ?? [])).toMatch(/ETF holding/i)
  })

  it('keeps stale relevant evidence visible but downweighted', () => {
    const watched = profile()
    const fresh = ev({ id: 'fresh', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], timestamp: NOW - 60_000 })
    const stale = ev({ id: 'stale', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], timestamp: NOW - 30 * 24 * 60 * 60 * 1000 })

    const ranked = relevantEventsForProfile([stale, fresh], watched, { now: NOW })
    const freshRank = ranked.find((item) => item.event.id === 'fresh')
    const staleRank = ranked.find((item) => item.event.id === 'stale')

    expect(staleRank).toBeDefined()
    expect(staleRank!.breakdown.freshnessWeight).toBeLessThan(freshRank!.breakdown.freshnessWeight)
    expect(staleRank!.relevanceScore).toBeLessThan(freshRank!.relevanceScore)
  })

  it('does not let media observation outrank fresh official evidence solely by watchlist match', () => {
    const watched = profile()
    const media = ev({
      id: 'media',
      sourceId: 'gdelt_doc_public',
      provenance: 'media-observation',
      affectedAssets: ['NVDA'],
      title: 'Media observation mentions NVDA',
    })
    const official = ev({
      id: 'official',
      sourceId: 'sec_edgar_public',
      provenance: 'official-api',
      affectedAssets: ['NVDA'],
      title: 'Official source mentions NVDA',
    })

    const ranked = relevantEventsForProfile([media, official], watched, { now: NOW })

    expect(ranked[0].event.id).toBe('official')
    expect(ranked.find((item) => item.event.id === 'media')!.breakdown.sourceTrust).toBeLessThan(
      ranked.find((item) => item.event.id === 'official')!.breakdown.sourceTrust,
    )
  })

  it('lowers relevance when conflict detection finds a disagreeing identity', () => {
    const watched = profile({
      watchedEntities: [
        { kind: 'ticker', value: 'XYZ' },
        { kind: 'ticker', value: 'OK' },
      ],
    })
    const conflictedA = ev({
      id: 'xyz-a',
      sourceId: 'sec_company_tickers_public',
      marketIdentity: { ticker: 'XYZ', cik: '111', legalName: 'Acme Inc' } as WorldIntelEvent['marketIdentity'],
    })
    const conflictedB = ev({
      id: 'xyz-b',
      sourceId: 'sec_edgar_public',
      secFiling: { ticker: 'XYZ', cik: '222', companyName: 'Acme Inc' } as WorldIntelEvent['secFiling'],
    })
    const clean = ev({
      id: 'ok',
      sourceId: 'sec_company_tickers_public',
      marketIdentity: { ticker: 'OK', cik: '333', legalName: 'Okay Corp' } as WorldIntelEvent['marketIdentity'],
    })

    const ranked = rankEventsForProfile([conflictedA, conflictedB, clean], watched, { now: NOW })
    const conflicted = ranked.find((item) => item.event.id === 'xyz-a')
    const cleanRank = ranked.find((item) => item.event.id === 'ok')

    expect(conflicted?.breakdown.conflictPenalty).toBeLessThan(1)
    expect(cleanRank!.relevanceScore).toBeGreaterThan(conflicted!.relevanceScore)
  })

  it('suppresses ignored entities from a profile view', () => {
    const watched = profile({ ignoredEntities: [{ kind: 'ticker', value: 'NVDA' }] })
    const nvda = ev({ id: 'ignored', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'] })

    const ranked = rankEventsForProfile([nvda], watched, { now: NOW })
    const relevant = relevantEventsForProfile([nvda], watched, { now: NOW })

    expect(ranked[0].suppressed).toBe(true)
    expect(relevant).toHaveLength(0)
  })

  it('persists profiles through a storage round trip', () => {
    const storage = new MemoryStorage()
    const entity: WatchedEntity = { kind: 'commodity', value: 'copper', label: 'Copper' }
    const profiles = [profile({ id: 'round-trip', watchedEntities: [entity], watchedThemes: ['critical-minerals'] })]

    saveWorldwatchProfiles(storage, profiles)
    const restored = loadWorldwatchProfiles(storage, NOW)

    expect(restored).toHaveLength(1)
    expect(restored[0].id).toBe('round-trip')
    expect(restored[0].watchedEntities[0]).toMatchObject(entity)
    expect(restored[0].watchedThemes).toEqual(['critical-minerals'])
  })

  it('keeps default profiles and match explanations free of trading phrasing', () => {
    const watched = defaultWorldwatchProfiles(NOW)[0]
    const ranked = relevantEventsForProfile(
      [ev({ id: 'wording', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'] })],
      watched,
      { now: NOW },
    )
    const rendered = JSON.stringify({
      profiles: defaultWorldwatchProfiles(NOW),
      explanations: ranked.flatMap((item) => item.matches.map((match) => match.explanation)),
    })

    expect(rendered).not.toMatch(/\b(buy|sell|price prediction|trading advice|trade recommendation)\b/i)
  })
})
