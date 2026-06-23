import { describe, expect, it } from 'vitest'
import {
  CORPORATE_SEED,
  exposedCompanies,
  exposureFor,
} from '../src/engine/relationshipSeed'

describe('corporate structure curated seed', () => {
  it('is curated reference knowledge — every edge sourced, corporate vocabulary used, no weights', () => {
    expect(CORPORATE_SEED.length).toBeGreaterThan(40)
    for (const r of CORPORATE_SEED) {
      expect(r.sourceNote.length).toBeGreaterThan(15)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      // Structural only: no fabricated percentages / weights in notes.
      expect(r.sourceNote).not.toMatch(/\d+\s?%/)
    }
    const relations = new Set(CORPORATE_SEED.map((r) => r.relation))
    for (const want of ['supplier_to', 'customer_of', 'member_of', 'tracks', 'holds_exposure_to', 'operates_in', 'parent_of', 'subsidiary_of']) {
      expect(relations.has(want as never)).toBe(true)
    }
  })

  it('a company exposes its indexes/ETFs and sectors', () => {
    const nvidia = exposureFor('company:nvidia').map((p) => p.entity.id)
    expect(nvidia).toContain('index:s&p-500')
    expect(nvidia).toContain('index:nasdaq-100')
    expect(nvidia).toContain('index:soxx')
    expect(nvidia).toContain('sector:semiconductors')
  })

  it('an ETF/index exposes its member companies', () => {
    const xle = exposedCompanies('index:xle').map((p) => p.entity.label)
    expect(xle).toEqual(expect.arrayContaining(['ExxonMobil', 'Chevron']))
    const xlu = exposedCompanies('index:xlu').map((p) => p.entity.label)
    expect(xlu).toEqual(expect.arrayContaining(['NextEra Energy', 'Duke Energy', 'Constellation Energy']))
  })

  it('renders supplier/customer chains transparently with source notes', () => {
    const tsmc = exposureFor('company:tsmc')
    const nvidiaPath = tsmc.find((p) => p.entity.id === 'company:nvidia')!
    expect(nvidiaPath.hops.every((h) => h.sourceNote.length > 10)).toBe(true)
    expect(nvidiaPath.hops.some((h) => h.relation === 'supplier_to' || h.relation === 'fabricated_by')).toBe(true)
  })

  it('composes across all seeds: an ETF reaches Taiwan; a Taiwan event reaches ETFs and big tech', () => {
    // Semiconductor ETF -> Taiwan exposure (corporate + semiconductor seeds).
    const soxx = exposureFor('index:soxx').map((p) => p.entity.id)
    expect(soxx).toContain('country:tw')
    expect(soxx).toContain('company:nvidia')

    // A Taiwan event now reaches capital-market baskets and AI-demand big tech.
    const taiwan = exposureFor('country:tw').map((p) => p.entity.id)
    expect(taiwan).toContain('index:soxx')
    expect(taiwan).toContain('company:microsoft') // via AI data centers -> AI accelerators -> chips
  })

  it('is deterministic, respects maxDepth, and returns nothing for unknown origins', () => {
    expect(exposureFor('index:does-not-exist')).toEqual([])
    const shallow = exposureFor('index:xle', { maxDepth: 1 }).map((p) => p.entity.id)
    expect(shallow).toContain('company:exxonmobil') // direct member
    expect(shallow).not.toContain('commodity:crude-oil') // several hops away
    expect(exposureFor('index:soxx').map((p) => p.entity.id)).toEqual(exposureFor('index:soxx').map((p) => p.entity.id))
  })
})
