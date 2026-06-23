import { describe, expect, it } from 'vitest'
import {
  ENERGY_SEED,
  exposedCompanies,
  exposureFor,
} from '../src/engine/relationshipSeed'

describe('energy infrastructure curated seed', () => {
  it('is curated reference knowledge — every edge sourced, confidence bounded, energy vocabulary used', () => {
    expect(ENERGY_SEED.length).toBeGreaterThan(30)
    for (const r of ENERGY_SEED) {
      expect(r.sourceNote.length).toBeGreaterThan(15)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
    const relations = new Set(ENERGY_SEED.map((r) => r.relation))
    for (const want of ['refines', 'generates', 'powers', 'regulated_by', 'transports', 'supplies', 'depends_on']) {
      expect(relations.has(want as never)).toBe(true)
    }
  })

  it('a commodity exposes infrastructure, companies, and downstream sectors', () => {
    const crude = exposureFor('commodity:crude-oil').map((p) => p.entity.id)
    expect(crude).toContain('infrastructure:refineries') // refines
    expect(crude).toContain('commodity:gasoline') // refineries supply gasoline
    expect(crude).toContain('company:exxonmobil') // refines crude
    expect(crude).toContain('sector:transportation') // gasoline -> transportation
    // Cross-seed: crude oil also reaches the maritime chokepoints from the ports seed.
    expect(crude).toContain('chokepoint:strait-of-malacca')
  })

  it('infrastructure exposes dependent companies, sectors, and regulators', () => {
    const nuclear = exposureFor('infrastructure:nuclear-power').map((p) => p.entity.id)
    expect(nuclear).toContain('commodity:electricity') // generates
    expect(nuclear).toContain('company:constellation-energy') // depends_on nuclear
    expect(nuclear).toContain('institution:nrc') // regulated_by
    expect(exposedCompanies('infrastructure:power-generation').map((p) => p.entity.label)).toEqual(
      expect.arrayContaining(['GE Vernova', 'Siemens Energy']),
    )
  })

  it('electricity → AI data centers → semiconductors composes across seeds', () => {
    const elec = exposureFor('commodity:electricity').map((p) => p.entity.id)
    expect(elec).toContain('sector:ai-data-centers') // powers
    expect(elec).toContain('sector:semiconductors') // AI data centers depend on semiconductors
    // And a Taiwan event now reaches the energy/AI layer through the semiconductor sector.
    const taiwan = exposureFor('country:tw').map((p) => p.entity.id)
    expect(taiwan).toContain('sector:semiconductors')
    expect(taiwan).toContain('sector:ai-data-centers')
  })

  it('is deterministic, respects maxDepth, and returns nothing for unknown origins', () => {
    expect(exposureFor('infrastructure:does-not-exist')).toEqual([])
    const shallow = exposureFor('infrastructure:nuclear-power', { maxDepth: 1 }).map((p) => p.entity.id)
    expect(shallow).toContain('commodity:electricity') // direct (generates)
    expect(shallow).not.toContain('sector:ai-data-centers') // multiple hops away
    expect(exposureFor('commodity:lng').map((p) => p.entity.id)).toEqual(exposureFor('commodity:lng').map((p) => p.entity.id))
  })
})
