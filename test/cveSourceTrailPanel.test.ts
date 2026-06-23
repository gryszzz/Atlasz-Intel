import { describe, expect, it } from 'vitest'
import { selectRenderableNvdCves } from '../src/components/intel/cveTrailSelect'
import type { NvdCve, WorldIntelEvent } from '../src/worldIntel'

function nvdEvent(overrides: Partial<NvdCve>): WorldIntelEvent {
  const cve: NvdCve = {
    id: 'nvd_cve_public:cve-2026-1001',
    cveId: 'CVE-2026-1001',
    sourceIdentifier: 'cve@mitre.org',
    published: '2026-05-20T10:00:00.000',
    publishedTimestamp: Date.parse('2026-05-20T10:00:00.000Z'),
    lastModified: '2026-05-28T12:00:00.000',
    lastModifiedTimestamp: Date.parse('2026-05-28T12:00:00.000Z'),
    vulnStatus: 'Analyzed',
    description: 'desc',
    cvss: { version: '3.1', baseScore: 9.8, baseSeverity: 'CRITICAL' },
    cweIds: ['CWE-120'],
    vendorProducts: ['acme:gateway'],
    references: [],
    sourceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1001',
    sourceApiUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=25',
    sourceName: 'NIST National Vulnerability Database',
    retrievedAt: Date.now(),
    inKnownExploitedCatalog: false,
    provenance: 'official-api',
    confidence: 96,
    rawPayloadHash: 'a'.repeat(64),
    ...overrides,
  }
  return { nvdCve: cve } as unknown as WorldIntelEvent
}

describe('selectRenderableNvdCves (UI proof-gate)', () => {
  it('renders a fully-source-trailed, high-confidence CVE', () => {
    expect(selectRenderableNvdCves([nvdEvent({})])).toHaveLength(1)
  })

  it('drops CVEs missing any proof field or below confidence threshold', () => {
    expect(selectRenderableNvdCves([nvdEvent({ confidence: 60 })])).toHaveLength(0)
    expect(selectRenderableNvdCves([nvdEvent({ sourceIdentifier: '' })])).toHaveLength(0)
    expect(selectRenderableNvdCves([nvdEvent({ rawPayloadHash: '' })])).toHaveLength(0)
    expect(selectRenderableNvdCves([nvdEvent({ sourceUrl: 'https://evil.example/CVE-2026-1001' })])).toHaveLength(0)
    expect(selectRenderableNvdCves([nvdEvent({ retrievedAt: NaN })])).toHaveLength(0)
    expect(selectRenderableNvdCves([{} as WorldIntelEvent])).toHaveLength(0)
  })

  it('deduplicates by CVE ID and sorts newest-modified first', () => {
    const older = nvdEvent({ cveId: 'CVE-2026-2002', lastModifiedTimestamp: 1 })
    const newer = nvdEvent({ cveId: 'CVE-2026-3003', lastModifiedTimestamp: 9_999_999_999_999 })
    const dup = nvdEvent({ cveId: 'CVE-2026-3003', lastModifiedTimestamp: 9_999_999_999_999 })
    const result = selectRenderableNvdCves([older, newer, dup])
    expect(result.map((cve) => cve.cveId)).toEqual(['CVE-2026-3003', 'CVE-2026-2002'])
  })
})
