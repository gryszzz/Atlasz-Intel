import { describe, expect, it } from 'vitest'
import { summarizeExposure } from '../src/engine/runtimeAudit'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function nvidiaEvent(id: string, timestamp: number): WorldIntelEvent {
  return {
    id,
    timestamp,
    title: 'NVIDIA 8-K',
    summary: '',
    countryCodes: [],
    region: 'global',
    category: 'other',
    severity: 'elevated',
    confidence: 96,
    sourceId: 'sec_edgar_public',
    sourceUrl: 'https://example.com/source',
    provenance: 'official-api',
    affectedAssets: ['NVDA'],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'a'.repeat(64),
    dedupeHash: id,
    secFiling: {
      cik: '1045810',
      companyName: 'NVIDIA Corporation',
      accessionNumber: `0001045810-26-${id}`,
      formType: '8-K',
      ticker: 'NVDA',
    } as WorldIntelEvent['secFiling'],
  } as WorldIntelEvent
}

describe('exposure ranking with source-freshness weighting', () => {
  it('ranks a fresh exposure above a stale one for the same exposure path', () => {
    const fresh = nvidiaEvent('fresh', NOW - HOUR)
    const stale = nvidiaEvent('stale', NOW - 20 * DAY)
    const summary = summarizeExposure({ events: [stale, fresh], now: NOW, windowMs: 40 * DAY })

    expect(summary.recentResolvedEvents).toHaveLength(2)
    // Fresh evidence ranks first; stale still present (visible), just lower.
    expect(summary.recentResolvedEvents[0].eventId).toBe('fresh')
    expect(summary.recentResolvedEvents[0].freshness).toBe('fresh')
    expect(summary.recentResolvedEvents[1].eventId).toBe('stale')
    expect(summary.recentResolvedEvents[1].freshness).toBe('stale')
    expect(summary.recentResolvedEvents[0].exposureScore).toBeGreaterThan(summary.recentResolvedEvents[1].exposureScore)
  })

  it('carries a freshness-weighted score on the ranked entities (not just a raw count)', () => {
    const fresh = nvidiaEvent('f', NOW - HOUR)
    const summary = summarizeExposure({ events: [fresh], now: NOW, windowMs: 40 * DAY })
    const company = summary.topCompanies[0]
    expect(company).toBeDefined()
    expect(company.count).toBeGreaterThan(0)
    // fresh (0.9) × direct path-confidence (≤1) ⇒ score is positive and ≤ count.
    expect(company.score).toBeGreaterThan(0)
    expect(company.score).toBeLessThanOrEqual(company.count)
  })
})
