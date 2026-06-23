import { describe, expect, it } from 'vitest'
import {
  eventCandidateIdentifiers,
  filterEventsByResolution,
  findWorldIntelEvent,
  isEventResolvable,
  resolveByCik,
  resolveBySourceId,
  resolveByTicker,
} from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `evt-${seq}`,
    timestamp: NOW,
    title: partial.title ?? 'Untitled',
    summary: '',
    countryCodes: [],
    region: 'global',
    category: 'other',
    severity: 'watch' as Severity,
    confidence: 96,
    sourceId: partial.sourceId,
    sourceUrl: 'https://example.com/1',
    provenance: 'public-disclosure',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: `d-${seq}`,
    secFiling: partial.secFiling,
    eiaEnergyRecord: partial.eiaEnergyRecord,
    fredObservation: partial.fredObservation,
    githubRelease: partial.githubRelease,
  } as WorldIntelEvent
}

describe('resolver surface: lookup, aliases, indicator, filter', () => {
  it('finds a WorldIntelEvent by exact id, and returns undefined for non-event ids (no fuzzy)', () => {
    const events = [ev({ id: 'nvd-evt-1', sourceId: 'nvd_cve_public' }), ev({ id: 'sec-evt-2', sourceId: 'sec_edgar_public' })]
    expect(findWorldIntelEvent('sec-evt-2', events)?.id).toBe('sec-evt-2')
    expect(findWorldIntelEvent('radar-group-7', events)).toBeUndefined() // derived RadarEvent id -> no match
    expect(findWorldIntelEvent('SEC-EVT-2', events)).toBeUndefined() // case-sensitive, not fuzzy
  })

  it('resolves the expanded SEC/big-tech alias set by exact ticker and CIK only', () => {
    expect(resolveByTicker('AMZN')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:amazon' })
    expect(resolveByCik('1652044')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:alphabet', matchType: 'cik' })
    expect(resolveByCik('0001326801')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:meta' })
    // Expanded energy series resolve only as exact source ids.
    expect(resolveBySourceId('DCOILWTICO')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'commodity:crude-oil' })
    // A non-curated ticker/series stays unresolved.
    expect(resolveByTicker('ZZZZ').resolved).toBe(false)
    expect(resolveBySourceId('SOME.UNKNOWN.SERIES').resolved).toBe(false)
  })

  it('reports candidate identifiers without resolving from display text alone', () => {
    const filing = ev({ sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], secFiling: { cik: '1045810', companyName: 'NVIDIA Corporation', accessionNumber: 'a', formType: '8-K', ticker: 'NVDA' } as WorldIntelEvent['secFiling'] })
    const ids = eventCandidateIdentifiers(filing).map((i) => `${i.type}:${i.value}`)
    expect(ids).toContain('cik:1045810')
    expect(ids).toContain('ticker:NVDA')
  })

  it('indicates resolvable events and filters by resolution', () => {
    const linked = ev({ sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'] })
    const unlinked = ev({ sourceId: 'cisa_kev_public' })
    expect(isEventResolvable(linked)).toBe(true)
    expect(isEventResolvable(unlinked)).toBe(false)

    const all = [linked, unlinked]
    expect(filterEventsByResolution(all, 'all')).toHaveLength(2)
    expect(filterEventsByResolution(all, 'linked').map((e) => e.id)).toEqual([linked.id])
    expect(filterEventsByResolution(all, 'unlinked').map((e) => e.id)).toEqual([unlinked.id])
  })

  it('resolves FRED/EIA energy series via resolveEvent (official id, not display text)', () => {
    const fred = ev({ sourceId: 'macro_calendar_fred', fredObservation: { seriesId: 'DCOILWTICO', title: 'WTI' } as WorldIntelEvent['fredObservation'] })
    expect(isEventResolvable(fred)).toBe(true)
  })
})
