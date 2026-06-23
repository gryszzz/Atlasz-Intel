import { describe, expect, it } from 'vitest'
import { cpcSubclass, cpcToSeedEntity, mapCpcCodes } from '../src/engine/cpcTechnologyMap'
import { seedEntities, ALL_SEED } from '../src/engine/relationshipSeed'

const SEED_IDS = new Set(seedEntities(ALL_SEED).map((e) => e.id))

describe('cpcTechnologyMap', () => {
  it('extracts the CPC subclass from a full symbol', () => {
    expect(cpcSubclass('H01L23/00')).toBe('H01L')
    expect(cpcSubclass('g06n 3/08')).toBe('G06N')
    expect(cpcSubclass('garbage')).toBe('')
  })

  it('maps H01L to the semiconductors sector', () => {
    const mapping = cpcToSeedEntity('H01L23/00')
    expect(mapping?.entityId).toBe('sector:semiconductors')
    expect(mapping?.subclass).toBe('H01L')
  })

  it('maps H02M (power conversion) to power semiconductors', () => {
    expect(cpcToSeedEntity('H02M3/00')?.entityId).toBe('technology:power-semiconductors')
  })

  it('maps G06N (neural-network computing) to AI accelerators', () => {
    expect(cpcToSeedEntity('G06N3/08')?.entityId).toBe('technology:ai-accelerators')
  })

  it('leaves unmapped subclasses unmapped (no guessing)', () => {
    // G06F (general computing), H04L (networking), H02S (PV), F17C (gas storage)
    // are intentionally NOT mapped — only defensible 1:1 subclasses are.
    expect(cpcToSeedEntity('G06F12/00')).toBeUndefined()
    expect(cpcToSeedEntity('H04L9/00')).toBeUndefined()
    expect(cpcToSeedEntity('H02S10/00')).toBeUndefined()
    expect(cpcToSeedEntity('F17C5/00')).toBeUndefined()
  })

  it('only maps to entity ids that exist in the curated seed', () => {
    for (const code of ['H01L1/00', 'G06N3/00', 'H02M1/00', 'H02J3/00', 'F25J1/00']) {
      const mapping = cpcToSeedEntity(code)
      expect(mapping).toBeDefined()
      expect(SEED_IDS.has(mapping!.entityId)).toBe(true)
    }
  })

  it('dedupes a list of CPC codes by mapped entity id', () => {
    const mapped = mapCpcCodes(['H01L23/00', 'H01L21/00', 'G06N3/08', 'G06F12/00'])
    const ids = mapped.map((m) => m.entityId)
    expect(ids).toContain('sector:semiconductors')
    expect(ids).toContain('technology:ai-accelerators')
    expect(new Set(ids).size).toBe(ids.length) // no duplicates
    expect(mapped).toHaveLength(2) // G06F dropped, two H01L collapsed
  })
})
