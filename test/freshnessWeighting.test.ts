import { describe, expect, it } from 'vitest'
import { freshnessWeight, isUnknownFreshness } from '../src/engine/freshness'
import { synthesizeBrief, synthesizeBriefs } from '../src/engine/watchSynthesis'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

function mkEvent(
  partial: Partial<WorldIntelEvent> & { id: string; sourceId: string; provenance: WorldIntelEvent['provenance'] },
): WorldIntelEvent {
  return {
    timestamp: NOW - 60_000,
    title: 'Event',
    summary: 'Summary',
    countryCodes: [],
    region: 'Global',
    category: 'world',
    severity: 'stable',
    confidence: 95,
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'hash',
    dedupeHash: 'dh',
    ...partial,
  }
}

describe('freshnessWeight (core scale)', () => {
  it('weighs fresher evidence more, never hides stale/expired', () => {
    expect(freshnessWeight('live')).toBe(1.0)
    expect(freshnessWeight('fresh')).toBe(0.9)
    expect(freshnessWeight('cached')).toBe(0.65)
    expect(freshnessWeight('stale')).toBe(0.4)
    expect(freshnessWeight('expired')).toBe(0.2)
  })

  it('treats no-signal sources as unknown, not zero', () => {
    expect(freshnessWeight('missing-key')).toBeUndefined()
    expect(freshnessWeight('unavailable')).toBeUndefined()
    expect(freshnessWeight('rate-limited')).toBeUndefined()
    expect(isUnknownFreshness('missing-key')).toBe(true)
    expect(isUnknownFreshness('fresh')).toBe(false)
  })
})

describe('source-freshness weighting in synthesis', () => {
  const cluster = (ts: number) => [
    mkEvent({ id: 'e1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', timestamp: ts, affectedAssets: ['NVDA'] }),
    mkEvent({ id: 'e2', sourceId: 'cisa_kev_public', provenance: 'official-api', timestamp: ts - 1000, affectedAssets: ['NVDA'] }),
  ]

  it('fresh corroboration raises confidence; stale corroboration does not boost', () => {
    const fresh = cluster(NOW - 60_000)
    const freshBrief = synthesizeBrief(fresh[0], { now: NOW, corpus: fresh })
    expect(freshBrief.corroboration.independentSourceCount).toBe(2)
    expect(freshBrief.corroboration.confidenceEffect).toBe('raises')
    expect(freshBrief.corroboration.freshnessWeight).toBe(0.9)

    const stale = cluster(NOW - 20 * DAY)
    const staleBrief = synthesizeBrief(stale[0], { now: NOW, corpus: stale })
    // Still 2 independent sources — counted, visible — but too stale to boost.
    expect(staleBrief.corroboration.independentSourceCount).toBe(2)
    expect(staleBrief.corroboration.confidenceEffect).toBe('neutral')
    expect(staleBrief.corroboration.freshnessWeight).toBe(0.4)
    expect(staleBrief.corroboration.caveat).toMatch(/stale\/expired/)
  })

  it('a stale primary source lowers confidence weight but stays visible', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 's1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', timestamp: NOW - 20 * DAY }),
      { now: NOW },
    )
    expect(brief.confidence.weight).toBe(0.4)
    expect(brief.confidence.freshness).toBe('stale')
    // visible: the brief is still produced with proof
    expect(brief.proof.sourceBacked).toBe(true)
  })

  it('media-only evidence stays low confidence', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'm1', sourceId: 'gdelt_doc_public', provenance: 'media-observation', timestamp: NOW - 60_000, gdeltArticle: { url: 'https://x', title: 'news' } as WorldIntelEvent['gdeltArticle'] }),
      { now: NOW },
    )
    expect(brief.confidence.weight).toBeLessThanOrEqual(0.3)
    expect(brief.confidence.weight).toBeGreaterThan(0)
    expect(brief.confidence.note).toMatch(/media/i)
  })

  it('derived/inferred provenance is structural, not recent-change evidence', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'd1', sourceId: 'local', provenance: 'model-inferred', timestamp: NOW - 60_000 }),
      { now: NOW },
    )
    expect(brief.confidence.basis).toBe('curated-reference')
    expect(brief.confidence.note).toMatch(/structur/i)
  })

  it('a source with no freshness signal is unknown, not zero', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'u1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', timestamp: NaN }),
      { now: NOW },
    )
    expect(brief.confidence.weight).toBeUndefined()
    expect(brief.confidence.basis).toBe('unknown')
  })

  it('ranks fresh + corroborated changes above stale single-source changes', () => {
    const fresh = cluster(NOW - 60_000)
    const staleSingle = mkEvent({ id: 'old', sourceId: 'fred_public', provenance: 'official-api', timestamp: NOW - 25 * DAY, affectedAssets: ['AAPL'] })
    const briefs = synthesizeBriefs([...fresh, staleSingle], { now: NOW, limit: 5 })
    expect(briefs[briefs.length - 1].eventId).toBe('old')
    expect(briefs[0].eventId).not.toBe('old')
  })
})
