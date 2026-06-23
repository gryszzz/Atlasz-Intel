import { describe, expect, it } from 'vitest'
import {
  buildEntityGraph,
  evidenceChainFor,
  freshnessState,
  summarizeEntityGraph,
} from '../src/engine/entityModel'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `evt-${seq}`,
    timestamp: partial.timestamp ?? NOW - 2 * 60 * 60 * 1000,
    title: partial.title ?? 'Untitled',
    summary: partial.summary ?? '',
    countryCodes: partial.countryCodes ?? [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'watch') as Severity,
    confidence: partial.confidence ?? 96,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: partial.affectedCurrencies ?? [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: partial.rawPayloadHash ?? 'a'.repeat(64),
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    secFiling: partial.secFiling,
    fredObservation: partial.fredObservation,
    treasuryFiscalRecord: partial.treasuryFiscalRecord,
    kevVulnerability: partial.kevVulnerability,
    nvdCve: partial.nvdCve,
    ghsaAdvisory: partial.ghsaAdvisory,
  } as WorldIntelEvent
}

function cyberSet(): WorldIntelEvent[] {
  return [
    ev({ sourceId: 'cisa_kev_public', title: 'KEV: CVE-2026-1001', category: 'cyber-advisory', kevVulnerability: { cveId: 'CVE-2026-1001', vendorProject: 'microsoft', product: 'windows' } as WorldIntelEvent['kevVulnerability'] }),
    ev({ sourceId: 'nvd_cve_public', title: 'NVD: CVE-2026-1001', category: 'cyber-advisory', nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['microsoft:windows'], inKnownExploitedCatalog: true } as WorldIntelEvent['nvdCve'] }),
    ev({ sourceId: 'github_ghsa_public', title: 'GHSA: CVE-2026-1001', category: 'cyber-advisory', ghsaAdvisory: { ghsaId: 'GHSA-aaaa-bbbb-cccc', cveId: 'CVE-2026-1001', packages: [{ ecosystem: 'nuget', name: 'win-shim' }] } as WorldIntelEvent['ghsaAdvisory'] }),
  ]
}

describe('entity-relationship model', () => {
  it('returns DATA_UNAVAILABLE for an empty event stream', () => {
    const graph = buildEntityGraph([], { now: NOW })
    expect(graph.status).toBe('DATA_UNAVAILABLE')
    expect(graph.nodes).toEqual([])
    expect(graph.relationships).toEqual([])
  })

  it('collapses one CVE into a single vulnerability node carrying KEV + NVD + GHSA evidence', () => {
    const graph = buildEntityGraph(cyberSet(), { now: NOW })
    const vuln = graph.nodes.find((node) => node.id === 'vulnerability:cve-2026-1001')
    expect(vuln).toBeDefined()
    expect(vuln!.kind).toBe('vulnerability')
    // Three independent sources prove the same vulnerability.
    const sources = new Set(vuln!.evidence.map((e) => e.sourceId))
    expect(sources).toEqual(new Set(['cisa_kev_public', 'nvd_cve_public', 'github_ghsa_public']))
    // The affected technology is linked, so no "unknown vendor" flag.
    expect(vuln!.unknowns).not.toContain('Affected vendor/product unknown')
    const techNodes = graph.nodes.filter((node) => node.kind === 'technology')
    expect(techNodes.length).toBeGreaterThan(0)
  })

  it('never emits an edge without evidence, and never marks anything verified', () => {
    const graph = buildEntityGraph(cyberSet(), { now: NOW })
    for (const rel of graph.relationships) {
      expect(rel.evidence.length).toBeGreaterThan(0)
      expect(rel.provenance).not.toBe('verified')
    }
    for (const node of graph.nodes) {
      expect(node.evidence.length).toBeGreaterThan(0)
      expect(node.provenance).not.toBe('verified')
    }
  })

  it('links SEC filing -> company -> ticker -> sector and flags a missing ticker', () => {
    const withTicker = ev({
      sourceId: 'sec_edgar_public',
      title: '8-K — Apple',
      category: 'filing',
      affectedSectors: ['technology'],
      secFiling: { accessionNumber: '0000320193-26-000050', cik: '320193', companyName: 'Apple Inc', ticker: 'AAPL', formType: '8-K' } as WorldIntelEvent['secFiling'],
    })
    const noTicker = ev({
      sourceId: 'sec_edgar_public',
      title: '8-K — Private Co',
      category: 'filing',
      secFiling: { accessionNumber: '0000999999-26-000001', cik: '999999', companyName: 'Private Co', formType: '8-K' } as WorldIntelEvent['secFiling'],
    })
    const graph = buildEntityGraph([withTicker, noTicker], { now: NOW })

    expect(graph.relationships.some((r) => r.relation === 'filed_by')).toBe(true)
    expect(graph.relationships.some((r) => r.relation === 'trades_as' && r.to === 'ticker:aapl')).toBe(true)
    const privateCo = graph.nodes.find((node) => node.id === 'company:999999')
    expect(privateCo!.unknowns).toContain('No ticker mapping')
  })

  it('answers the seven questions for an event via evidenceChainFor', () => {
    const filing = ev({
      sourceId: 'sec_edgar_public',
      title: '8-K — Private Co',
      category: 'filing',
      confidence: 96,
      secFiling: { accessionNumber: '0000999999-26-000001', cik: '999999', companyName: 'Private Co', formType: '8-K' } as WorldIntelEvent['secFiling'],
    })
    const chain = evidenceChainFor(filing, { now: NOW })
    expect(chain.whatHappened).toBe('8-K — Private Co') // what happened
    expect(chain.whoIsConnected.length).toBeGreaterThan(0) // who is connected
    expect(chain.whatSourceProves.sourceUrl).toMatch(/^https:\/\//) // what source proves it
    expect(chain.whatSourceProves.provenance).toBe('official-api')
    expect(chain.whatSourceProves.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(chain.whenHappened).toBe(filing.timestamp) // when
    expect(chain.freshness).toBe('fresh') // how fresh (2h old, <= 6h)
    expect(chain.entitiesTouched.some((e) => e.kind === 'company')).toBe(true) // what entities
    expect(chain.unknowns).toContain('Filing has no mapped ticker') // what is unknown
  })

  it('computes monotonic freshness states and surfaces stale evidence', () => {
    expect(freshnessState(NOW - 1 * 60 * 60 * 1000, NOW)).toBe('fresh')
    expect(freshnessState(NOW - 12 * 60 * 60 * 1000, NOW)).toBe('recent')
    expect(freshnessState(NOW - 3 * 24 * 60 * 60 * 1000, NOW)).toBe('aging')
    expect(freshnessState(NOW - 20 * 24 * 60 * 60 * 1000, NOW)).toBe('stale')
    expect(freshnessState(NOW - 90 * 24 * 60 * 60 * 1000, NOW)).toBe('unavailable')

    const old = ev({ sourceId: 'macro_calendar_fred', timestamp: NOW - 20 * 24 * 60 * 60 * 1000, fredObservation: { seriesId: 'CPIAUCSL', title: 'CPI' } as WorldIntelEvent['fredObservation'] })
    const graph = buildEntityGraph([old], { now: NOW })
    const series = graph.nodes.find((node) => node.kind === 'macro-series')
    expect(series!.freshness).toBe('stale')
    expect(series!.unknowns).toContain('Evidence may be stale')
  })

  it('links Treasury fiscal records into fiscal series, Treasury, and United States entities', () => {
    const fiscal = ev({
      sourceId: 'treasury_fiscal_public',
      title: 'Debt to the Penny — Total Public Debt Outstanding',
      category: 'fiscal-event',
      countryCodes: ['US'],
      treasuryFiscalRecord: {
        datasetId: 'debt_to_penny',
        datasetName: 'Debt to the Penny',
        tableId: 'debt_to_penny',
        tableName: 'Debt to the Penny',
        recordDate: '2026-06-17',
        metricName: 'Total Public Debt Outstanding',
        metricValue: 39283052266270.91,
      } as WorldIntelEvent['treasuryFiscalRecord'],
    })
    const graph = buildEntityGraph([fiscal], { now: NOW })

    expect(graph.nodes.some((node) => node.kind === 'fiscal-series' && node.label.includes('Total Public Debt Outstanding'))).toBe(true)
    expect(graph.nodes.some((node) => node.kind === 'institution' && node.label === 'U.S. Treasury')).toBe(true)
    expect(graph.nodes.some((node) => node.kind === 'country' && node.label === 'United States')).toBe(true)
    expect(graph.relationships.some((rel) => rel.relation === 'observes' && rel.to.startsWith('fiscal-series:'))).toBe(true)
    expect(graph.relationships.some((rel) => rel.relation === 'issued_by' && rel.to === 'institution:u.s.-treasury')).toBe(true)
  })

  it('summarizes the graph by entity kind', () => {
    const graph = buildEntityGraph(cyberSet(), { now: NOW })
    const summary = summarizeEntityGraph(graph)
    expect(summary.nodeCount).toBe(graph.nodes.length)
    expect(summary.edgeCount).toBe(graph.relationships.length)
    expect(summary.byKind.vulnerability).toBe(1)
    expect(summary.byKind.source).toBe(3)
  })
})
