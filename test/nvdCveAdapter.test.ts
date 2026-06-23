import { afterEach, describe, expect, it } from 'vitest'
import {
  NVD_SOURCE_ID,
  extractCweIds,
  extractVendorProducts,
  normalizeNvdCves,
  parseNvdResponse,
  primaryCvssMetric,
  readNvdConfig,
} from '../electron/osint/adapters/nvdCveAdapter'
import { kevCveIdSetFromPayload } from '../electron/osint/adapters/cisaKevAdapter'

const FIXTURE = {
  resultsPerPage: 3,
  version: '2.0',
  vulnerabilities: [
    {
      cve: {
        id: 'CVE-2026-1001',
        sourceIdentifier: 'cve@mitre.org',
        published: '2026-05-20T10:00:00.000',
        lastModified: '2026-05-28T12:00:00.000',
        vulnStatus: 'Analyzed',
        descriptions: [
          { lang: 'es', value: 'descripcion' },
          { lang: 'en', value: 'A buffer overflow in Acme Gateway allows remote code execution.' },
        ],
        metrics: {
          cvssMetricV2: [{ type: 'Primary', cvssData: { version: '2.0', baseScore: 7.5 }, baseSeverity: 'HIGH' }],
          cvssMetricV31: [
            {
              source: 'nvd@nist.gov',
              type: 'Primary',
              cvssData: { version: '3.1', vectorString: 'CVSS:3.1/AV:N', baseScore: 9.8, baseSeverity: 'critical' },
            },
          ],
        },
        weaknesses: [
          { source: 'nvd@nist.gov', type: 'Primary', description: [{ lang: 'en', value: 'CWE-120' }] },
          { description: [{ lang: 'en', value: 'NVD-CWE-Other' }] },
        ],
        configurations: [
          {
            nodes: [
              {
                cpeMatch: [
                  { vulnerable: true, criteria: 'cpe:2.3:a:acme:gateway:1.0:*:*:*:*:*:*:*' },
                  { vulnerable: true, criteria: 'cpe:2.3:a:*:*:*:*:*:*:*:*:*:*' },
                ],
              },
            ],
          },
        ],
        references: [
          { url: 'https://example.com/advisory', source: 'nvd@nist.gov', tags: ['Vendor Advisory'] },
          { url: 'not-a-url' },
        ],
      },
    },
    {
      cve: {
        id: 'CVE-2026-2002',
        sourceIdentifier: 'cve@mitre.org',
        published: '2026-05-10T10:00:00.000',
        lastModified: '2026-05-12T12:00:00.000',
        vulnStatus: 'Awaiting Analysis',
        descriptions: [{ lang: 'en', value: 'An issue with no CVSS yet.' }],
      },
    },
    {
      // Malformed: invalid CVE id -> must be dropped, not repaired.
      cve: {
        id: 'NOT-A-CVE',
        sourceIdentifier: 'cve@mitre.org',
        published: '2026-05-01T10:00:00.000',
        lastModified: '2026-05-01T12:00:00.000',
        vulnStatus: 'Rejected',
        descriptions: [{ lang: 'en', value: 'bogus' }],
      },
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('NVD CVE adapter', () => {
  it('is public by default, supports an optional key, and opts out cleanly', () => {
    expect(readNvdConfig({})).not.toBeNull()
    expect(readNvdConfig({})?.apiKey).toBeUndefined()
    expect(readNvdConfig({ ATLASZ_NVD_API_KEY: 'secret' })?.apiKey).toBe('secret')
    expect(readNvdConfig({ ATLASZ_NVD_DISABLE: '1' })).toBeNull()
    expect(readNvdConfig({ ATLASZ_NVD_BASE_URL: 'http://insecure.example' })).toBeNull()
  })

  it('parses valid CVEs with official-api provenance, NVD source URL, and full source trail', () => {
    const records = parseNvdResponse(FIXTURE, { retrievedAt: Date.parse('2026-06-01T00:00:00Z') })
    const events = normalizeNvdCves(records)

    expect(events).toHaveLength(2) // malformed dropped
    const rce = events.find((event) => event.nvdCve?.cveId === 'CVE-2026-1001')
    expect(rce?.category).toBe('cyber-advisory')
    expect(rce?.provenance).toBe('official-api')
    expect(rce?.confidence).toBe(96)
    expect(rce?.sourceId).toBe(NVD_SOURCE_ID)
    expect(rce?.sourceUrl).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-1001')
    expect(rce?.nvdCve?.sourceIdentifier).toBe('cve@mitre.org')
    expect(rce?.nvdCve?.sourceApiUrl).not.toContain('apiKey')
    expect(rce?.nvdCve?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(rce?.affectedAssets).toEqual([]) // never invents tickers
  })

  it('normalizes CVSS preferring v3.1 over v2 and uppercasing severity', () => {
    const metric = primaryCvssMetric(FIXTURE.vulnerabilities[0].cve.metrics)
    expect(metric?.version).toBe('3.1')
    expect(metric?.baseScore).toBe(9.8)
    expect(metric?.baseSeverity).toBe('CRITICAL')
    // No metrics -> undefined, never fabricated.
    expect(primaryCvssMetric(undefined)).toBeUndefined()
    expect(primaryCvssMetric({})).toBeUndefined()
  })

  it('extracts CWE IDs and safe vendor/product pairs from CPE, skipping wildcards', () => {
    const cve = FIXTURE.vulnerabilities[0].cve
    expect(extractCweIds(cve.weaknesses)).toEqual(['CWE-120'])
    expect(extractVendorProducts(cve.configurations)).toEqual(['acme:gateway'])
  })

  it('cross-links a CVE to CISA KEV when the same CVE ID is in the catalog', () => {
    const kevIds = kevCveIdSetFromPayload({
      catalogVersion: '2026.06.01',
      vulnerabilities: [
        {
          cveID: 'CVE-2026-1001',
          vendorProject: 'Acme',
          product: 'Gateway',
          vulnerabilityName: 'Acme Gateway RCE',
          dateAdded: '2026-05-29',
          shortDescription: 'x',
          requiredAction: 'patch',
          knownRansomwareCampaignUse: 'Known',
        },
      ],
    })
    const records = parseNvdResponse(FIXTURE, { knownExploitedCveIds: kevIds })
    const linked = records.find((record) => record.cveId === 'CVE-2026-1001')
    const unlinked = records.find((record) => record.cveId === 'CVE-2026-2002')
    expect(linked?.inKnownExploitedCatalog).toBe(true)
    expect(unlinked?.inKnownExploitedCatalog).toBe(false)

    const event = normalizeNvdCves(records).find((item) => item.nvdCve?.cveId === 'CVE-2026-1001')
    expect(event?.narrativeTags).toContain('CISA KEV')
    expect(event?.summary).toMatch(/Known Exploited Vulnerabilities/i)
  })

  it('does not imply exploitability for CVEs absent from KEV or references', () => {
    const records = parseNvdResponse(FIXTURE, { knownExploitedCveIds: new Set() })
    const event = normalizeNvdCves(records).find((item) => item.nvdCve?.cveId === 'CVE-2026-2002')
    expect(event?.nvdCve?.inKnownExploitedCatalog).toBe(false)
    expect(event?.summary).not.toMatch(/exploitation confirmed/i)
  })

  it('fails closed on missing/malformed payloads so the UI shows DATA_UNAVAILABLE', () => {
    expect(parseNvdResponse(null)).toEqual([])
    expect(parseNvdResponse({ nope: true })).toEqual([])
    expect(parseNvdResponse({ vulnerabilities: [] })).toEqual([])
    expect(normalizeNvdCves([])).toEqual([])
  })
})
