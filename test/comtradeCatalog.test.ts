import { describe, expect, it } from 'vitest'
import {
  commodityCodesForLevel,
  flowsCatalog,
  parseCommodities,
  parsePartners,
  parseReporters,
} from '../electron/osint/adapters/comtradeCatalog'

// Real shapes: reporterCode/PartnerCode arrive as NUMBERS; commodity id is a string.
const REPORTERS = {
  results: [
    { id: 842, text: 'USA', reporterCode: 842, reporterDesc: 'USA', reporterCodeIsoAlpha3: 'USA', isGroup: false },
    { id: 4, text: 'Afghanistan', reporterCode: 4, reporterDesc: 'Afghanistan', reporterCodeIsoAlpha3: 'AFG', isGroup: false },
    { id: 0, text: '', reporterCode: 0, reporterDesc: '' }, // malformed (no desc) -> dropped
  ],
}

const PARTNERS = {
  results: [
    { id: 0, text: 'World', PartnerCode: 0, PartnerDesc: 'World', PartnerCodeIsoAlpha3: 'W00', isGroup: true },
    { id: 36, text: 'Australia', PartnerCode: 36, PartnerDesc: 'Australia', PartnerCodeIsoAlpha3: 'AUS', isGroup: false },
  ],
}

const HS = {
  classCode: 'HS',
  className: 'Harmonized System',
  results: [
    { id: 'TOTAL', text: 'Total - All commodities', parent: '#', isLeaf: '0', aggrLevel: 0 },
    { id: '0101', text: '0101 - Live horses, asses, mules', parent: 'TOTAL', isLeaf: '0', aggrLevel: 4 },
    { id: '010121', text: '010121 - Pure-bred breeding horses', parent: '0101', isLeaf: '1', aggrLevel: 6 },
    { id: '854231', text: '854231 - Electronic integrated circuits: processors', parent: '8542', isLeaf: '1', aggrLevel: 6 },
  ],
}

describe('UN Comtrade reference catalog parsers', () => {
  it('parses reporters, coercing numeric codes and dropping malformed rows', () => {
    const catalog = parseReporters(REPORTERS)
    expect(catalog.kind).toBe('reporters')
    expect(catalog.entries).toHaveLength(2) // the empty-desc row dropped
    expect(catalog.entries.find((e) => e.code === '842')).toMatchObject({ text: 'USA', iso3: 'USA' })
    expect(catalog.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(catalog.sourceUrl).toContain('comtradeapi.un.org')
  })

  it('parses partners with the capitalized PartnerCode/PartnerDesc fields', () => {
    const catalog = parsePartners(PARTNERS)
    expect(catalog.kind).toBe('partners')
    expect(catalog.entries.map((e) => e.code)).toEqual(['0', '36'])
    expect(catalog.entries.find((e) => e.code === '36')?.iso3).toBe('AUS')
  })

  it('parses the full commodity classification and exposes all codes (not a hardcoded list)', () => {
    const catalog = parseCommodities(HS, { classification: 'HS' })
    expect(catalog.classification).toBe('HS')
    // All real codes present (TOTAL excluded from ingestion helper, not from the catalog).
    expect(catalog.entries.map((e) => e.code)).toContain('854231')
    const leaves = commodityCodesForLevel(catalog, { leafOnly: true })
    expect(leaves).toContain('010121')
    expect(leaves).toContain('854231')
    expect(leaves).not.toContain('TOTAL')
    expect(leaves).not.toContain('0101') // non-leaf aggregate excluded
    const sixDigit = commodityCodesForLevel(catalog, { aggrLevel: 6, leafOnly: true })
    expect(sixDigit).toEqual(['010121', '854231'])
  })

  it('provides the canonical fixed flow reference (import/export/re-export…)', () => {
    const flows = flowsCatalog().entries.map((e) => e.code)
    expect(flows).toContain('M')
    expect(flows).toContain('X')
    expect(flows).toContain('RX')
  })

  it('fails closed on a non-results payload', () => {
    expect(parseReporters(null).entries).toEqual([])
    expect(parseCommodities({}).entries).toEqual([])
  })
})
