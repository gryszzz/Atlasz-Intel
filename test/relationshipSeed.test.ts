import { describe, expect, it } from 'vitest'
import {
  SEED_TRUST,
  SEMICONDUCTOR_SEED,
  exposedCompanies,
  exposureFor,
  exposureForEntities,
  seedEntities,
  summarizeSeed,
} from '../src/engine/relationshipSeed'

describe('relationship depth — curated semiconductor seed', () => {
  it('is curated reference knowledge, never verified, and every relationship is sourced', () => {
    expect(SEED_TRUST).toBe('curated-reference')
    expect(SEMICONDUCTOR_SEED.length).toBeGreaterThan(15)
    for (const r of SEMICONDUCTOR_SEED) {
      expect(r.sourceNote.length).toBeGreaterThan(15) // no unsourced assertion
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(r.from.id).not.toBe(r.to.id)
    }
    const summary = summarizeSeed(SEMICONDUCTOR_SEED)
    expect(summary.relationshipCount).toBe(SEMICONDUCTOR_SEED.length)
    expect(summary.byRelation.fabricated_by).toBeGreaterThanOrEqual(4)
    expect(seedEntities().some((e) => e.id === 'company:tsmc')).toBe(true)
  })

  it('answers "what is exposed to a Taiwan event?" from known structure', () => {
    const exposed = exposureFor('country:tw')
    const ids = exposed.map((p) => p.entity.id)
    // TSMC is in Taiwan (depth 1); NVIDIA/AMD depend on TSMC (depth 2); ASML supplies TSMC.
    expect(ids).toContain('company:tsmc')
    expect(ids).toContain('company:nvidia')
    expect(ids).toContain('company:amd')
    expect(ids).toContain('company:asml')
    const tsmc = exposed.find((p) => p.entity.id === 'company:tsmc')!
    const nvidia = exposed.find((p) => p.entity.id === 'company:nvidia')!
    expect(tsmc.depth).toBe(1)
    expect(nvidia.depth).toBe(2)
  })

  it('returns transparent, inspectable exposure paths (not a black box)', () => {
    const nvidia = exposureFor('country:tw').find((p) => p.entity.id === 'company:nvidia')!
    // NVIDIA -> (fabricated_by) TSMC -> (located_in) Taiwan: the chain is explicit.
    const relations = nvidia.hops.map((h) => h.relation)
    expect(relations).toContain('fabricated_by')
    expect(nvidia.hops.every((h) => h.sourceNote.length > 10)).toBe(true)
    expect(nvidia.pathConfidence).toBeGreaterThan(0)
    expect(nvidia.pathConfidence).toBeLessThan(1) // decays with distance
  })

  it('filters to exposed companies — the "which companies?" answer', () => {
    const companies = exposedCompanies('country:tw')
    expect(companies.every((p) => p.entity.kind === 'company')).toBe(true)
    expect(companies.map((p) => p.entity.label)).toEqual(expect.arrayContaining(['TSMC', 'NVIDIA', 'ASML']))
  })

  it('respects maxDepth and is deterministic; unknown origin yields nothing', () => {
    const shallow = exposureFor('country:tw', { maxDepth: 1 }).map((p) => p.entity.id)
    expect(shallow).toContain('company:tsmc')
    expect(shallow).not.toContain('company:nvidia') // 2 hops away
    expect(exposureFor('country:tw').map((p) => p.entity.id)).toEqual(exposureFor('country:tw').map((p) => p.entity.id))
    expect(exposureFor('company:does-not-exist')).toEqual([])
  })

  it('unions exposure across multiple event-touched entities', () => {
    // An event touching both the Netherlands (ASML) and Taiwan (TSMC).
    const exposed = exposureForEntities(['country:nl', 'country:tw'])
    const ids = exposed.map((p) => p.entity.id)
    expect(ids).toContain('company:asml')
    expect(ids).toContain('company:tsmc')
    // Each entity appears once (best path kept).
    expect(new Set(ids).size).toBe(ids.length)
  })
})
