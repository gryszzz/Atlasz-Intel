import { describe, expect, it } from 'vitest'
import { conflictsForEvent, detectConflicts } from '../src/engine/conflictDetection'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')

function ev(partial: Partial<WorldIntelEvent> & { id: string; sourceId: string; provenance: WorldIntelEvent['provenance'] }): WorldIntelEvent {
  return {
    timestamp: NOW - 60_000,
    title: 'e',
    summary: '',
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
    rawPayloadHash: 'h',
    dedupeHash: 'dh',
    ...partial,
  }
}

describe('conflict / contradiction detection', () => {
  it('flags a ticker mapping to multiple CIKs as blocking / refuse-merge', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'mi', sourceId: 'sec_company_tickers_public', provenance: 'official-api', marketIdentity: { ticker: 'XYZ', cik: '111', legalName: 'Acme Inc' } as WorldIntelEvent['marketIdentity'] }),
        ev({ id: 'f', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', secFiling: { ticker: 'XYZ', cik: '222', companyName: 'Acme Inc' } as WorldIntelEvent['secFiling'] }),
      ],
      NOW,
    )
    const c = conflicts.find((x) => x.conflictType === 'ticker-multiple-cik')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('blocking')
    expect(c!.resolutionBehavior).toBe('refuse-merge')
    expect(c!.entities.sort()).toEqual(['111', '222'])
    expect(c!.sources.length).toBe(2)
  })

  it('flags a CIK appearing under multiple legal names (caution / mark-uncertain)', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'a', sourceId: 'sec_company_tickers_public', provenance: 'official-api', marketIdentity: { ticker: 'BB', cik: '333', legalName: 'Beta Corp' } as WorldIntelEvent['marketIdentity'] }),
        ev({ id: 'b', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', secFiling: { cik: '333', companyName: 'Gamma Industries' } as WorldIntelEvent['secFiling'] }),
      ],
      NOW,
    )
    const c = conflicts.find((x) => x.conflictType === 'cik-multiple-name')
    expect(c).toBeDefined()
    expect(c!.severity).toBe('caution')
    expect(c!.resolutionBehavior).toBe('mark-uncertain')
  })

  it('flags differing facility coordinates across sources', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'p1', sourceId: 'eia_power_plants_public', provenance: 'official-api', eiaFacility: { facilityId: '999', facilityName: 'X', facilityKind: 'power-plant', latitude: 35.0, longitude: -119.0, geospatialPrecision: 'exact' } as WorldIntelEvent['eiaFacility'] }),
        ev({ id: 'p2', sourceId: 'world_port_index_public', provenance: 'official-api', eiaFacility: { facilityId: '999', facilityName: 'X', facilityKind: 'power-plant', latitude: 36.8, longitude: -118.0, geospatialPrecision: 'exact' } as WorldIntelEvent['eiaFacility'] }),
      ],
      NOW,
    )
    expect(conflicts.some((x) => x.conflictType === 'facility-coordinates')).toBe(true)
  })

  it('flags an ETF holding ticker mapping to multiple CUSIPs (refuse-merge)', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'e1', sourceId: 'etf_holdings_public', provenance: 'public-disclosure', etfHolding: { holdingTicker: 'AAA', cusip: '111111111' } as WorldIntelEvent['etfHolding'] }),
        ev({ id: 'e2', sourceId: 'etf_holdings_public', provenance: 'public-disclosure', etfHolding: { holdingTicker: 'AAA', cusip: '222222222' } as WorldIntelEvent['etfHolding'] }),
      ],
      NOW,
    )
    const c = conflicts.find((x) => x.conflictType === 'etf-ticker-cusip')
    expect(c).toBeDefined()
    expect(c!.resolutionBehavior).toBe('refuse-merge')
  })

  it('does not invent a conflict when values agree', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'a', sourceId: 'sec_company_tickers_public', provenance: 'official-api', marketIdentity: { ticker: 'OK', cik: '500', legalName: 'Same Co' } as WorldIntelEvent['marketIdentity'] }),
        ev({ id: 'b', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', secFiling: { ticker: 'OK', cik: '500', companyName: 'Same Co' } as WorldIntelEvent['secFiling'] }),
      ],
      NOW,
    )
    expect(conflicts).toHaveLength(0)
  })

  it('media-observation never supplies conflicting values', () => {
    const conflicts = detectConflicts(
      [
        ev({ id: 'mi', sourceId: 'sec_company_tickers_public', provenance: 'official-api', marketIdentity: { ticker: 'ZZ', cik: '700', legalName: 'Real Co' } as WorldIntelEvent['marketIdentity'] }),
        ev({ id: 'gd', sourceId: 'gdelt_doc_public', provenance: 'media-observation', secFiling: { ticker: 'ZZ', cik: '999', companyName: 'Fake Co' } as WorldIntelEvent['secFiling'] }),
      ],
      NOW,
    )
    // The media event's identifiers are NOT scanned, so no ticker->cik conflict appears.
    expect(conflicts.some((x) => x.conflictType === 'ticker-multiple-cik')).toBe(false)
  })

  it('attaches conflicts to events that share the conflicting identity key', () => {
    const events = [
      ev({ id: 'mi', sourceId: 'sec_company_tickers_public', provenance: 'official-api', marketIdentity: { ticker: 'XYZ', cik: '111', legalName: 'Acme' } as WorldIntelEvent['marketIdentity'] }),
      ev({ id: 'f', sourceId: 'sec_edgar_public', provenance: 'public-disclosure', secFiling: { ticker: 'XYZ', cik: '222', companyName: 'Acme' } as WorldIntelEvent['secFiling'] }),
      ev({ id: 'unrelated', sourceId: 'noaa_alerts_public', provenance: 'official-api' }),
    ]
    const conflicts = detectConflicts(events, NOW)
    expect(conflictsForEvent(events[0], conflicts).length).toBeGreaterThan(0)
    expect(conflictsForEvent(events[2], conflicts)).toHaveLength(0)
  })
})
