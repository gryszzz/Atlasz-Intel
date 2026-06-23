import { describe, expect, it } from 'vitest'
import {
  ALL_SEED,
  PORTS_TRADE_SEED,
  exposedCompanies,
  exposureFor,
  summarizeSeed,
} from '../src/engine/relationshipSeed'

describe('ports / trade curated seed', () => {
  it('is curated reference knowledge — every edge sourced, confidence bounded', () => {
    expect(PORTS_TRADE_SEED.length).toBeGreaterThan(20)
    for (const r of PORTS_TRADE_SEED) {
      expect(r.sourceNote.length).toBeGreaterThan(15)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
    // Uses the trade relation vocabulary.
    const relations = new Set(PORTS_TRADE_SEED.map((r) => r.relation))
    for (const want of ['located_in', 'gateway_for', 'routes_through', 'transports', 'depends_on', 'exposed_to', 'supplies']) {
      expect(relations.has(want as never)).toBe(true)
    }
    expect(ALL_SEED.length).toBe(summarizeSeed(ALL_SEED).relationshipCount)
  })

  it('exposes related countries, sectors, and companies from a port', () => {
    const exposed = exposureFor('port:port-of-los-angeles')
    const ids = exposed.map((p) => p.entity.id)
    expect(ids).toContain('country:us') // located_in / gateway_for
    expect(ids).toContain('commodity:containerized-goods') // transports
    expect(ids).toContain('sector:retail') // retail depends_on LA
    // Exposed companies (importers).
    const companies = exposedCompanies('port:port-of-los-angeles').map((p) => p.entity.label)
    expect(companies).toEqual(expect.arrayContaining(['Walmart', 'Target']))
  })

  it('exposes route/commodity/company chains from a chokepoint', () => {
    const malacca = exposureFor('chokepoint:strait-of-malacca')
    const ids = malacca.map((p) => p.entity.id)
    expect(ids).toContain('commodity:crude-oil') // transports
    expect(ids).toContain('country:cn') // China depends_on Malacca
    expect(ids).toContain('company:cosco') // COSCO exposed_to Malacca

    const suezCompanies = exposedCompanies('chokepoint:suez-canal').map((p) => p.entity.label)
    expect(suezCompanies).toEqual(expect.arrayContaining(['Maersk', 'MSC']))
    // Transparent hop chains.
    const cosco = malacca.find((p) => p.entity.id === 'company:cosco')!
    expect(cosco.hops.every((h) => h.sourceNote.length > 10)).toBe(true)
  })

  it('connects Taiwan to both chip companies and the semiconductors sector (cross-seed)', () => {
    const exposed = exposureFor('country:tw')
    const ids = exposed.map((p) => p.entity.id)
    expect(ids).toContain('company:tsmc') // from the semiconductor seed
    expect(ids).toContain('sector:semiconductors') // from the trade seed
  })

  it('is deterministic, respects maxDepth, and returns nothing for unknown origins', () => {
    expect(exposureFor('chokepoint:does-not-exist')).toEqual([])
    const shallow = exposureFor('port:port-of-los-angeles', { maxDepth: 1 }).map((p) => p.entity.id)
    expect(shallow).toContain('country:us')
    // Port of Shanghai is depth 2 (LA -> Containerized goods -> Shanghai), not depth 1.
    expect(shallow).not.toContain('port:port-of-shanghai')
    expect(exposureFor('country:cn').map((p) => p.entity.id)).toEqual(exposureFor('country:cn').map((p) => p.entity.id))
  })
})
