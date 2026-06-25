import { describe, expect, it } from 'vitest'
import { synthesizeBrief, synthesizeBriefs } from '../src/engine/watchSynthesis'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')

function mkEvent(partial: Partial<WorldIntelEvent> & { id: string; sourceId: string; provenance: WorldIntelEvent['provenance'] }): WorldIntelEvent {
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

describe('intelligence synthesis (what to watch next)', () => {
  it('every watch item is a labeled inference-rule, never a prediction', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'm1', sourceId: 'gdelt_doc_public', provenance: 'media-observation', gdeltArticle: { url: 'https://x', title: 'news' } as WorldIntelEvent['gdeltArticle'] }),
      { now: NOW },
    )
    expect(brief.watchNext.length).toBeGreaterThan(0)
    for (const w of brief.watchNext) {
      expect(w.basis).toBe('inference-rule')
      expect(w.label).toMatch(/^watch/i)
      expect(`${w.label} ${w.rationale}`).not.toMatch(/\b(will (rise|fall|happen|surge|crash)|guaranteed|going to|moon)\b/i)
    }
  })

  it('media observation: seek confirmation + does-not-prove caveat + not source-backed', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'm2', sourceId: 'gdelt_doc_public', provenance: 'media-observation', gdeltArticle: { url: 'https://x', title: 'news' } as WorldIntelEvent['gdeltArticle'] }),
      { now: NOW },
    )
    expect(brief.proof.sourceBacked).toBe(false)
    expect(brief.watchNext.some((w) => w.id === 'confirm-official')).toBe(true)
    expect(brief.doesNotProve.some((d) => /media observation/i.test(d))).toBe(true)
    expect(brief.doesNotProve).toContain('Does not predict price or recommend any trade.')
  })

  it('facility event: confirm via operator/regulator + outage non-claim', () => {
    const brief = synthesizeBrief(
      mkEvent({
        id: 'f1',
        sourceId: 'eia_power_plants_public',
        provenance: 'official-api',
        eiaFacility: { facilityId: '55555', facilityName: 'Sunrise Solar', facilityKind: 'power-plant', geospatialPrecision: 'exact', latitude: 35, longitude: -119, sourceDataset: 'x', sourceUrl: 'https://www.eia.gov/x', sourceApiUrl: 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/', sourceName: 'U.S. Energy Information Administration', retrievedAt: NOW, staleAt: NOW + 1, provenance: 'official-api', confidence: 95, rawPayloadHash: 'h' } as WorldIntelEvent['eiaFacility'],
      }),
      { now: NOW },
    )
    expect(brief.proof.sourceBacked).toBe(true)
    expect(brief.watchNext.some((w) => w.id === 'confirm-facility')).toBe(true)
    expect(brief.doesNotProve.some((d) => /outage, damage, or disruption/i.test(d))).toBe(true)
  })

  it('vulnerability event: watch advisory/patch/KEV-EPSS', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 'v1', sourceId: 'cisa_kev_public', provenance: 'official-api', kevVulnerability: { cveId: 'CVE-2026-1234', vendorProject: 'Acme', product: 'Widget', rawPayloadHash: 'h' } as WorldIntelEvent['kevVulnerability'] }),
      { now: NOW },
    )
    expect(brief.watchNext.some((w) => w.id === 'confirm-vuln')).toBe(true)
  })

  it('resolved company event surfaces structural exposure + exposure watch + curated caveat', () => {
    const brief = synthesizeBrief(
      mkEvent({ id: 's1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'], extractedEntities: ['NVIDIA'] }),
      { now: NOW, maxDepth: 3 },
    )
    expect(brief.resolvedEntityIds.length).toBeGreaterThan(0)
    expect(brief.systemsConnected.length).toBeGreaterThan(0)
    expect(brief.watchNext.some((w) => w.id === 'confirm-exposure')).toBe(true)
    expect(brief.doesNotProve.some((d) => /curated reference/i.test(d))).toBe(true)
  })

  it('unresolved event stays unresolved (no fabricated exposure)', () => {
    const brief = synthesizeBrief(mkEvent({ id: 'u1', sourceId: 'crossref_works_public', provenance: 'official-api' }), { now: NOW })
    expect(brief.resolvedEntityIds).toHaveLength(0)
    expect(brief.systemsConnected).toHaveLength(0)
    expect(brief.watchNext.some((w) => w.id === 'confirm-exposure')).toBe(false)
  })

  it('SEC + market identity + ETF holdings corroborate company context, not impact', () => {
    const corpus = [
      mkEvent({ id: 'c-sec', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
      mkEvent({ id: 'c-id', sourceId: 'sec_company_tickers_public', provenance: 'official-api', affectedAssets: ['NVDA'] }),
      mkEvent({ id: 'c-etf', sourceId: 'etf_holdings_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
    ]
    const brief = synthesizeBrief(corpus[0], { now: NOW, corpus })
    expect(brief.corroboration.independentSourceCount).toBe(3)
    expect(brief.corroboration.confidenceEffect).toBe('raises')
    expect(brief.corroboration.caveat).toMatch(/not proof of impact or causality/i)
    expect(brief.corroboration.connectors.length).toBe(3)
    expect(brief.watchNext.some((w) => w.id === 'confirm-independent')).toBe(false) // already corroborated
  })

  it('media stays separate: GDELT does not count as independent corroboration', () => {
    const corpus = [
      mkEvent({ id: 'off', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
      mkEvent({ id: 'gd', sourceId: 'gdelt_doc_public', provenance: 'media-observation', affectedAssets: ['NVDA'], gdeltArticle: { url: 'https://x', title: 'n' } as WorldIntelEvent['gdeltArticle'] }),
    ]
    const brief = synthesizeBrief(corpus[0], { now: NOW, corpus })
    expect(brief.corroboration.independentSourceCount).toBe(1)
    expect(brief.corroboration.mediaSourceCount).toBe(1)
    expect(brief.corroboration.caveat).toMatch(/media is not corroboration/i)
  })

  it('same-connector duplicates do not raise the independent count', () => {
    const corpus = [
      mkEvent({ id: 'd1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
      mkEvent({ id: 'd2', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
    ]
    expect(synthesizeBrief(corpus[0], { now: NOW, corpus }).corroboration.independentSourceCount).toBe(1)
  })

  it('stale corroborating sources lower the confidence effect to neutral', () => {
    const old = NOW - 40 * 24 * 60 * 60_000 // > 30 days -> unavailable/stale
    const corpus = [
      mkEvent({ id: 's-a', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'], timestamp: old }),
      mkEvent({ id: 's-b', sourceId: 'etf_holdings_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'], timestamp: old }),
    ]
    const c = synthesizeBrief(corpus[0], { now: NOW, corpus }).corroboration
    expect(c.independentSourceCount).toBe(2)
    expect(c.confidenceEffect).toBe('neutral') // stale -> not "raises"
    expect(c.caveat).toMatch(/stale/i)
  })

  it('caveat never asserts confirmed impact', () => {
    const corpus = [
      mkEvent({ id: 'i1', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
      mkEvent({ id: 'i2', sourceId: 'etf_holdings_public', provenance: 'public-disclosure', affectedAssets: ['NVDA'] }),
    ]
    const c = synthesizeBrief(corpus[0], { now: NOW, corpus }).corroboration
    expect(c.caveat).not.toMatch(/confirmed impact|proves impact|impact confirmed/i)
  })

  it('synthesizeBriefs orders by recency and is bounded', () => {
    const events = [
      mkEvent({ id: 'a', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', timestamp: NOW - 1000 }),
      mkEvent({ id: 'b', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', timestamp: NOW - 5000 }),
    ]
    const briefs = synthesizeBriefs(events, { now: NOW, limit: 5 })
    expect(briefs.map((b) => b.eventId)).toEqual(['a', 'b'])
  })
})
