import { describe, expect, it } from 'vitest'
import {
  ALL_SEED,
  CRITICAL_MINERALS_SEED,
  SEED_TRUST,
  exposedCompanies,
  exposureFor,
} from '../src/engine/relationshipSeed'

const BANNED = /\b(reserve|reserves|production of|tons?|tonnes?|output of|price|per ton|invest|undervalued|dominat|world-class|bonanza)\b/i

describe('critical minerals crosswalk seed', () => {
  it('is curated-reference, never verified', () => {
    expect(SEED_TRUST).toBe('curated-reference')
    expect(SEED_TRUST).not.toBe('verified')
  })

  it('every relationship carries a sourceNote and a bounded confidence', () => {
    for (const r of CRITICAL_MINERALS_SEED) {
      expect(r.sourceNote.trim().length).toBeGreaterThan(0)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('uses no production / reserve / price / investment / dominance language', () => {
    for (const r of CRITICAL_MINERALS_SEED) {
      expect(r.sourceNote).not.toMatch(BANNED)
    }
  })

  it('a commodity opens exposure chains into technologies and sectors', () => {
    const paths = exposureFor('commodity:lithium')
    const ids = new Set(paths.map((p) => p.entity.id))
    expect(ids.has('technology:battery-technology')).toBe(true)
    expect(ids.has('sector:electric-vehicles')).toBe(true)
    // Bridges into the existing company seeds (battery technology -> Tesla/CATL...).
    expect(exposedCompanies('commodity:lithium').length).toBeGreaterThan(0)
  })

  it('a technology opens back to its commodities (bidirectional connectivity)', () => {
    const ids = new Set(exposureFor('technology:battery-technology').map((p) => p.entity.id))
    expect(ids.has('commodity:lithium')).toBe(true)
    expect(ids.has('commodity:graphite')).toBe(true)
  })

  it('copper reaches grid + a structurally exposed company/ETF', () => {
    const ids = new Set(exposureFor('commodity:copper').map((p) => p.entity.id))
    expect(ids.has('infrastructure:grid')).toBe(true)
    const exposed = exposureFor('commodity:copper')
    expect(exposed.some((p) => p.entity.kind === 'company' || p.entity.kind === 'index')).toBe(true)
  })

  it('rare earths reach magnets, EV motors, wind and defense', () => {
    const ids = new Set(exposureFor('commodity:rare-earth-elements').map((p) => p.entity.id))
    expect(ids.has('technology:permanent-magnets')).toBe(true)
    expect(ids.has('technology:ev-motors')).toBe(true)
    expect(ids.has('infrastructure:wind-power')).toBe(true)
    expect(ids.has('sector:defense-electronics')).toBe(true)
  })

  it('silicon reaches semiconductors and solar; uranium reaches nuclear', () => {
    const si = new Set(exposureFor('commodity:silicon').map((p) => p.entity.id))
    expect(si.has('sector:semiconductors')).toBe(true)
    expect(si.has('technology:solar-pv')).toBe(true)
    const u = new Set(exposureFor('commodity:uranium').map((p) => p.entity.id))
    expect(u.has('infrastructure:nuclear-power')).toBe(true)
  })

  it('respects a deterministic maxDepth', () => {
    const d1 = exposureFor('commodity:lithium', { maxDepth: 1 })
    expect(d1.every((p) => p.depth === 1)).toBe(true)
    const d3 = exposureFor('commodity:lithium', { maxDepth: 3 })
    expect(d3.length).toBeGreaterThanOrEqual(d1.length)
    // Deterministic: same query, same result ordering.
    expect(exposureFor('commodity:lithium', { maxDepth: 2 })).toEqual(exposureFor('commodity:lithium', { maxDepth: 2 }))
  })

  it('is part of ALL_SEED and shares commodity node ids with USGS mineral sites', () => {
    expect(ALL_SEED).toEqual(expect.arrayContaining(CRITICAL_MINERALS_SEED))
    // The USGS adapter emits commodity nodes like commodity:copper / commodity:gallium;
    // the crosswalk uses the SAME ids so live sites bridge into curated structure.
    const seedCommodityIds = new Set(CRITICAL_MINERALS_SEED.flatMap((r) => [r.from.id, r.to.id]).filter((id) => id.startsWith('commodity:')))
    expect(seedCommodityIds.has('commodity:copper')).toBe(true)
    expect(seedCommodityIds.has('commodity:gallium')).toBe(true)
    expect(seedCommodityIds.has('commodity:rare-earth-elements')).toBe(true)
  })
})
