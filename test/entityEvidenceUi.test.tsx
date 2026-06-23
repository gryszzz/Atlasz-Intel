import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EntityEvidenceGraphPanel } from '../src/components/intel/EntityEvidenceGraphPanel'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
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
    summary: '',
    countryCodes: [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'watch') as Severity,
    confidence: partial.confidence ?? 96,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
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

function render(events: WorldIntelEvent[]): string {
  return renderToStaticMarkup(createElement(EntityEvidenceGraphPanel, { events, now: NOW }))
}

const cyberSet = (): WorldIntelEvent[] => [
  ev({ sourceId: 'cisa_kev_public', title: 'KEV CVE-2026-1001', category: 'cyber-advisory', kevVulnerability: { cveId: 'CVE-2026-1001', vendorProject: 'microsoft', product: 'windows' } as WorldIntelEvent['kevVulnerability'] }),
  ev({ sourceId: 'nvd_cve_public', title: 'NVD CVE-2026-1001', category: 'cyber-advisory', nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['microsoft:windows'], inKnownExploitedCatalog: true } as WorldIntelEvent['nvdCve'] }),
  ev({ sourceId: 'github_ghsa_public', title: 'GHSA CVE-2026-1001', category: 'cyber-advisory', ghsaAdvisory: { ghsaId: 'GHSA-aaaa-bbbb-cccc', cveId: 'CVE-2026-1001', packages: [{ ecosystem: 'nuget', name: 'win-shim' }] } as WorldIntelEvent['ghsaAdvisory'] }),
]

describe('Evidence Graph UI (Graph view mount)', () => {
  it('renders DATA_UNAVAILABLE for an empty event stream (no fake nodes)', () => {
    const markup = render([])
    expect(markup).toContain('Evidence Graph')
    expect(markup).toContain('DATA_UNAVAILABLE')
    expect(markup).not.toContain('vulnerability')
  })

  it('collapses KEV + NVD + GHSA into one CVE dossier with three proving sources', () => {
    const markup = render(cyberSet())
    // The default-selected (most-corroborated) entity is the CVE; its dossier lists 3 proving events.
    expect(markup).toContain('CVE-2026-1001')
    expect(markup).toContain('Proving events (3)')
    expect(markup).toContain('CISA KEV')
    expect(markup).toContain('NVD')
    expect(markup).toContain('GitHub')
    // No fabricated "verified" trust label.
    expect(markup).not.toContain('>verified<')
  })

  it('renders a company filing -> ticker -> sector chain in the dossier', () => {
    const events = [
      ev({
        sourceId: 'sec_edgar_public',
        title: '8-K — Apple',
        category: 'filing',
        affectedSectors: ['technology'],
        secFiling: { accessionNumber: '0000320193-26-000050', cik: '320193', companyName: 'Apple Inc', ticker: 'AAPL', formType: '8-K' } as WorldIntelEvent['secFiling'],
      }),
    ]
    const graph = buildEntityGraph(events, { now: NOW })
    const company = graph.nodes.find((node) => node.id === 'company:320193')!
    const relations = neighborsOf(graph, company.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(relations).toContain('trades_as:ticker')
    // Render the company dossier directly and confirm the filing->ticker chain is visible.
    const markup = renderToStaticMarkup(
      createElement(EntityDossierPanel, { graph, entityId: company.id }),
    )
    expect(markup).toContain('Apple Inc')
    expect(markup).toContain('AAPL')
    expect(markup).toContain('trades as')
    expect(markup).toContain('filed by')
  })

  it('shows a stale freshness badge and surfaces unknowns', () => {
    const events = [
      ev({
        sourceId: 'macro_calendar_fred',
        title: 'CPI',
        timestamp: NOW - 20 * 24 * 60 * 60 * 1000,
        fredObservation: { seriesId: 'CPIAUCSL', title: 'CPI' } as WorldIntelEvent['fredObservation'],
      }),
    ]
    const markup = render(events)
    expect(markup).toContain('fresh-stale') // stale freshness badge class
    expect(markup).toContain('What is unknown')
    expect(markup).toContain('Evidence may be stale')
  })

  it('renders the source trail with a clickable link and a payload hash', () => {
    const markup = render(cyberSet())
    expect(markup).toContain('source trail')
    expect(markup).toContain('href="https://example.com/') // evidence source URL
    expect(markup).toContain('Proving events')
    expect(markup).toMatch(/[a-f0-9]{12}…/) // truncated raw payload hash
  })

  it('renders a Treasury fiscal-series dossier with source proof', () => {
    const events = [
      ev({
        sourceId: 'treasury_fiscal_public',
        title: 'Debt to the Penny — Total Public Debt Outstanding',
        category: 'fiscal-event',
        countryCodes: ['US'],
        sourceUrl: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
        treasuryFiscalRecord: {
          datasetId: 'debt_to_penny',
          datasetName: 'Debt to the Penny',
          tableId: 'debt_to_penny',
          tableName: 'Debt to the Penny',
          recordDate: '2026-06-17',
          metricName: 'Total Public Debt Outstanding',
          metricValue: 39283052266270.91,
        } as WorldIntelEvent['treasuryFiscalRecord'],
      }),
    ]
    const graph = buildEntityGraph(events, { now: NOW })
    const series = graph.nodes.find((node) => node.kind === 'fiscal-series')!
    const markup = renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: series.id }))

    expect(markup).toContain('Debt to the Penny')
    expect(markup).toContain('Total Public Debt Outstanding')
    expect(markup).toContain('U.S. Treasury')
    expect(markup).toContain('issued by')
    expect(markup).toContain('Treasury Fiscal Data')
    expect(markup).toContain('source trail')
  })
})
