import { describe, expect, it } from 'vitest'
import {
  PATENTS_TECH_SEED,
  exposedCompanies,
  exposureFor,
} from '../src/engine/relationshipSeed'

describe('patents / assignees / technology curated seed', () => {
  it('is curated reference knowledge — every edge sourced, confidence bounded, IP vocabulary used', () => {
    expect(PATENTS_TECH_SEED.length).toBeGreaterThan(30)
    for (const r of PATENTS_TECH_SEED) {
      expect(r.sourceNote.length).toBeGreaterThan(15)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
    const relations = new Set(PATENTS_TECH_SEED.map((r) => r.relation))
    for (const want of ['assigned_to', 'develops', 'enables', 'used_by']) {
      expect(relations.has(want as never)).toBe(true)
    }
  })

  it('a technology exposes its assignees, users, and enabled sectors (cross-seed to geography)', () => {
    const euv = exposureFor('technology:euv-lithography').map((p) => p.entity.id)
    expect(euv).toContain('company:asml') // assigned_to / develops
    expect(euv).toContain('company:tsmc') // used_by
    expect(euv).toContain('sector:semiconductors') // enables
    // Cross-seed: EUV -> TSMC -> Taiwan (semiconductor seed geography).
    expect(euv).toContain('country:tw')
  })

  it('a company exposes the technologies it depends on', () => {
    const nvidia = exposureFor('company:nvidia').map((p) => p.entity.id)
    expect(nvidia).toContain('technology:ai-accelerators')
    expect(nvidia).toContain('technology:hbm-memory') // used_by NVIDIA
  })

  it('HBM and battery chains expose the right companies', () => {
    const hbmCompanies = exposedCompanies('technology:hbm-memory').map((p) => p.entity.label)
    expect(hbmCompanies).toEqual(expect.arrayContaining(['SK hynix', 'Samsung', 'Micron', 'NVIDIA']))
    const batteryCompanies = exposedCompanies('technology:battery-technology').map((p) => p.entity.label)
    expect(batteryCompanies).toEqual(expect.arrayContaining(['CATL', 'Panasonic', 'Tesla']))
    expect(exposureFor('technology:battery-technology').map((p) => p.entity.id)).toContain('technology:grid-storage')
  })

  it('nuclear/LNG technology compose with the energy seed', () => {
    const nuclearTech = exposureFor('technology:nuclear-reactor-technology').map((p) => p.entity.id)
    expect(nuclearTech).toContain('infrastructure:nuclear-power') // enables
    expect(nuclearTech).toContain('company:ge-vernova') // develops
    expect(nuclearTech).toContain('commodity:electricity') // cross-seed: nuclear generates electricity
  })

  it('a Taiwan event now reaches the technology / IP layer', () => {
    const taiwan = exposureFor('country:tw').map((p) => p.entity.id)
    expect(taiwan).toContain('technology:euv-lithography') // via TSMC used_by EUV
    expect(taiwan).toContain('technology:hbm-memory') // via NVIDIA used_by HBM
  })

  it('is deterministic, respects maxDepth, and returns nothing for unknown origins', () => {
    expect(exposureFor('technology:does-not-exist')).toEqual([])
    const shallow = exposureFor('technology:hbm-memory', { maxDepth: 1 }).map((p) => p.entity.id)
    expect(shallow).toContain('company:sk-hynix') // direct (develops)
    expect(shallow).not.toContain('country:tw') // several hops away
    expect(exposureFor('technology:hbm-memory').map((p) => p.entity.id)).toEqual(exposureFor('technology:hbm-memory').map((p) => p.entity.id))
  })
})
