import { afterEach, describe, expect, it } from 'vitest'
import {
  KEV_SOURCE_ID,
  normalizeKevVulnerabilities,
  parseKevCatalog,
  readKevConfig,
} from '../electron/osint/adapters/cisaKevAdapter'

const FIXTURE = {
  title: 'CISA Catalog of Known Exploited Vulnerabilities',
  catalogVersion: '2026.06.01',
  dateReleased: '2026-06-01T12:00:00.000Z',
  count: 3,
  vulnerabilities: [
    {
      cveID: 'CVE-2026-1001',
      vendorProject: 'Acme',
      product: 'Gateway',
      vulnerabilityName: 'Acme Gateway Remote Code Execution Vulnerability',
      dateAdded: '2026-05-20',
      shortDescription: 'A flaw allows remote code execution.',
      requiredAction: 'Apply mitigations per vendor instructions.',
      dueDate: '2026-06-10',
      knownRansomwareCampaignUse: 'Known',
      notes: 'https://example.com/advisory',
      cwes: ['CWE-94'],
    },
    {
      cveID: 'CVE-2026-2002',
      vendorProject: 'Globex',
      product: 'Router OS',
      vulnerabilityName: 'Globex Router OS Authentication Bypass Vulnerability',
      dateAdded: '2026-05-28',
      shortDescription: 'An authentication bypass flaw.',
      requiredAction: 'Apply updates per vendor instructions.',
      dueDate: '2026-06-18',
      knownRansomwareCampaignUse: 'Unknown',
      cwes: ['CWE-287'],
    },
    {
      // Malformed: bad CVE id — must be dropped, never repaired.
      cveID: 'NOT-A-CVE',
      vendorProject: 'Initech',
      product: 'Mainframe',
      vulnerabilityName: 'Bogus entry',
      dateAdded: '2026-05-30',
      shortDescription: 'x',
      requiredAction: 'x',
      knownRansomwareCampaignUse: 'Unknown',
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('CISA KEV adapter', () => {
  it('is configured by default (public no-auth feed) and opts out cleanly', () => {
    expect(readKevConfig({})).not.toBeNull()
    expect(readKevConfig({ ATLASZ_CISA_KEV_DISABLE: '1' })).toBeNull()
    // Refuses insecure / malformed override rather than fetching it.
    expect(readKevConfig({ ATLASZ_CISA_KEV_URL: 'http://insecure.example/kev.json' })).toBeNull()
  })

  it('normalizes valid KEV records with official-api provenance and cyber-advisory category', () => {
    const records = parseKevCatalog(FIXTURE, { retrievedAt: Date.parse('2026-06-01T12:00:00Z') })
    const events = normalizeKevVulnerabilities(records)

    expect(events).toHaveLength(2)
    const rce = events.find((event) => event.kevVulnerability?.cveId === 'CVE-2026-1001')
    expect(rce).toBeDefined()
    expect(rce?.category).toBe('cyber-advisory')
    expect(rce?.provenance).toBe('official-api')
    expect(rce?.confidence).toBe(96)
    expect(rce?.sourceId).toBe(KEV_SOURCE_ID)
    // Per-record source trail points to official NIST NVD detail page.
    expect(rce?.sourceUrl).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-1001')
    expect(rce?.kevVulnerability?.sourceCatalogUrl).toMatch(/^https:\/\/www\.cisa\.gov\//)
    expect(rce?.kevVulnerability?.knownRansomwareCampaignUse).toBe(true)
    expect(rce?.narrativeTags).toContain('Known ransomware campaign use')
    expect(rce?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('never invents tickers from vendor/product names', () => {
    const events = normalizeKevVulnerabilities(parseKevCatalog(FIXTURE))
    for (const event of events) {
      expect(event.affectedAssets).toEqual([])
    }
  })

  it('drops malformed records instead of repairing them', () => {
    const records = parseKevCatalog(FIXTURE)
    expect(records.every((record) => /^CVE-\d{4}-\d{4,}$/.test(record.cveId))).toBe(true)
    expect(records.find((record) => record.vendorProject === 'Initech')).toBeUndefined()
  })

  it('sorts newest-added first and caps volume to surface fresh KEV additions', () => {
    const records = parseKevCatalog(FIXTURE, { config: { maxRecords: 1 } })
    expect(records).toHaveLength(1)
    expect(records[0].cveId).toBe('CVE-2026-2002') // dateAdded 2026-05-28 > 2026-05-20
  })

  it('fails closed on missing or malformed payloads (no fabrication)', () => {
    expect(parseKevCatalog(null)).toEqual([])
    expect(parseKevCatalog({ nope: true })).toEqual([])
    expect(parseKevCatalog({ vulnerabilities: [] })).toEqual([])
    expect(normalizeKevVulnerabilities([])).toEqual([])
  })
})
