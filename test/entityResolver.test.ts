import { describe, expect, it } from 'vitest'
import {
  eventStructuralExposure,
  resolveByCik,
  resolveByName,
  resolveBySourceId,
  resolveByTicker,
  resolveEntity,
  resolveEvent,
} from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

function baseEvent(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  return {
    id: 'evt-1',
    timestamp: NOW,
    title: 'Untitled',
    summary: '',
    countryCodes: [],
    region: 'global',
    category: 'other',
    severity: 'watch' as Severity,
    confidence: 96,
    sourceId: partial.sourceId,
    sourceUrl: 'https://example.com/1',
    provenance: partial.provenance ?? 'public-disclosure',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: 'd',
    secFiling: partial.secFiling,
    eiaEnergyRecord: partial.eiaEnergyRecord,
    githubRelease: partial.githubRelease,
  } as WorldIntelEvent
}

describe('entity resolver bridge', () => {
  it('resolves NVIDIA by CIK, ticker, and name — each with a reason and resolver-rule source', () => {
    const byCik = resolveByCik('0001045810')
    expect(byCik).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:nvidia', matchType: 'cik', source: 'resolver-rule' })
    expect((byCik as { reason: string }).reason).toMatch(/CIK/i)

    const byTicker = resolveByTicker('nvda')
    expect(byTicker).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:nvidia', matchType: 'ticker' })

    const byName = resolveByName('NVIDIA Corporation')
    expect(byName).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:nvidia', matchType: 'alias' })
  })

  it('resolves TSMC carefully via ADR ticker and legal name', () => {
    expect(resolveByTicker('TSM')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:tsmc', matchType: 'ticker' })
    expect(resolveByName('Taiwan Semiconductor')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:tsmc' })
    expect(resolveByName('TSMC')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:tsmc' })
  })

  it('resolves a commodity (EIA crude oil) by name and series id', () => {
    expect(resolveByName('Crude oil')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'commodity:crude-oil' })
    expect(resolveBySourceId('PET.RWTC.D')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'commodity:crude-oil', matchType: 'source-id' })
  })

  it('resolves a GitHub repo only when allowlisted, otherwise stays unresolved', () => {
    expect(resolveBySourceId('NVIDIA/cutlass')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:nvidia' })
    const random = resolveBySourceId('someuser/random-repo')
    expect(random.resolved).toBe(false)
    expect((random as { reason: string }).reason).toMatch(/allowlisted/i)
  })

  it('does not resolve ambiguous/unknown names silently (no fuzzy matching)', () => {
    const r = resolveByName('Acme Holdings')
    expect(r.resolved).toBe(false)
    expect((r as { reason: string }).reason).toMatch(/no exact alias|fuzzy/i)
    // A real seed company name fragment must not partial-match.
    expect(resolveByName('Semiconductor').resolved).toBe(false)
  })

  it('resolveEntity tries identifiers in priority order and reports attempts when unresolved', () => {
    expect(resolveEntity({ ticker: 'ZZZZ', cik: '1045810' })).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:nvidia', matchType: 'cik' })
    const none = resolveEntity({ ticker: 'ZZZZ', name: 'Nobody Inc' })
    expect(none.resolved).toBe(false)
    expect((none as { reason: string }).reason).toMatch(/tried:.*ticker=ZZZZ/)
  })

  it('a live SEC event resolves to the seed and lights up its structural exposure', () => {
    const event = baseEvent({
      sourceId: 'sec_edgar_public',
      provenance: 'public-disclosure',
      affectedAssets: ['NVDA'],
      secFiling: { cik: '1045810', companyName: 'NVIDIA Corporation', accessionNumber: '0001045810-26-000001', formType: '8-K', ticker: 'NVDA' } as WorldIntelEvent['secFiling'],
    })
    const resolutions = resolveEvent(event)
    expect(resolutions.map((r) => r.resolved && r.canonicalSeedEntityId)).toContain('company:nvidia')

    const exposed = eventStructuralExposure(event)
    const nvidia = exposed.find((e) => e.resolution.canonicalSeedEntityId === 'company:nvidia')!
    expect(nvidia.exposure.map((p) => p.entity.id)).toContain('company:tsmc') // structural chain rendered
  })

  it('keeps resolution (resolver-rule) separate from live provenance and never claims verified', () => {
    const r = resolveByCik('1045810')
    expect(r.resolved && r.source).toBe('resolver-rule')
    // The resolver result carries no provenance field and never says "verified".
    expect(JSON.stringify(r)).not.toMatch(/verified/i)
  })
})
