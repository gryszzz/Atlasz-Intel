import { afterEach, describe, expect, it } from 'vitest'
import {
  GHSA_SOURCE_ID,
  normalizeGhsaAdvisories,
  parseGhsaAdvisories,
  readGithubAdvisoryConfig,
} from '../electron/osint/adapters/githubAdvisoryAdapter'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const FIXTURE = [
  {
    ghsa_id: 'GHSA-aaaa-bbbb-cccc',
    cve_id: 'CVE-2026-1001',
    summary: 'Remote code execution in left-pad',
    severity: 'critical',
    type: 'reviewed',
    html_url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
    published_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-29T10:00:00Z',
    withdrawn_at: null,
    identifiers: [
      { type: 'GHSA', value: 'GHSA-aaaa-bbbb-cccc' },
      { type: 'CVE', value: 'CVE-2026-1001' },
    ],
    references: ['https://example.com/advisory', { url: 'https://example.com/patch' }, 'not-a-url'],
    vulnerabilities: [
      { package: { ecosystem: 'npm', name: 'left-pad' }, vulnerable_version_range: '< 1.3.0', first_patched_version: { identifier: '1.3.0' } },
      { package: { ecosystem: '', name: '' } },
    ],
    cwes: [{ cwe_id: 'CWE-94', name: 'Code Injection' }, { cwe_id: 'bogus' }],
  },
  {
    // CVE only via identifiers, no direct cve_id.
    ghsa_id: 'GHSA-dddd-eeee-ffff',
    cve_id: null,
    summary: 'SQL injection in ormlib',
    severity: 'high',
    type: 'reviewed',
    html_url: 'https://github.com/advisories/GHSA-dddd-eeee-ffff',
    published_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-05-21T10:00:00Z',
    identifiers: [{ type: 'CVE', value: 'CVE-2026-2002' }],
    vulnerabilities: [{ package: { ecosystem: 'pip', name: 'ormlib' }, vulnerable_version_range: '>= 1.0, < 1.4' }],
    cwes: [{ cwe_id: 'CWE-89' }],
  },
  {
    // Withdrawn: parsed but never emitted as active intel.
    ghsa_id: 'GHSA-1111-2222-3333',
    cve_id: 'CVE-2026-3003',
    summary: 'Withdrawn advisory',
    severity: 'moderate',
    html_url: 'https://github.com/advisories/GHSA-1111-2222-3333',
    published_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-12T10:00:00Z',
    withdrawn_at: '2026-05-15T10:00:00Z',
  },
  {
    // Malformed: bad GHSA id -> dropped, never repaired.
    ghsa_id: 'NOT-A-GHSA',
    summary: 'bogus',
    severity: 'low',
    html_url: 'https://github.com/advisories/NOT-A-GHSA',
    published_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
  },
]

const ORIGINAL_ENV = { ...process.env }
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('GitHub Security Advisories adapter', () => {
  it('is public by default, supports an optional token, and opts out cleanly', () => {
    expect(readGithubAdvisoryConfig({})).not.toBeNull()
    expect(readGithubAdvisoryConfig({})?.token).toBeUndefined()
    expect(readGithubAdvisoryConfig({ ATLASZ_GITHUB_TOKEN: 'ghp_secret' })?.token).toBe('ghp_secret')
    expect(readGithubAdvisoryConfig({ ATLASZ_GITHUB_GHSA_DISABLE: '1' })).toBeNull()
    expect(readGithubAdvisoryConfig({ ATLASZ_GITHUB_ADVISORIES_URL: 'http://insecure' })).toBeNull()
  })

  it('normalizes GHSA advisories with official-api provenance and full source trail', () => {
    const records = parseGhsaAdvisories(FIXTURE, { retrievedAt: Date.parse('2026-06-01T00:00:00Z') })
    const events = normalizeGhsaAdvisories(records)

    const rce = events.find((event) => event.ghsaAdvisory?.ghsaId === 'GHSA-aaaa-bbbb-cccc')
    expect(rce?.category).toBe('cyber-advisory')
    expect(rce?.provenance).toBe('official-api')
    expect(rce?.confidence).toBe(96)
    expect(rce?.sourceId).toBe(GHSA_SOURCE_ID)
    expect(rce?.sourceUrl).toBe('https://github.com/advisories/GHSA-aaaa-bbbb-cccc')
    expect((rce?.severity as Severity)).toBe('critical')
    expect(rce?.ghsaAdvisory?.packages[0]).toMatchObject({ ecosystem: 'npm', name: 'left-pad', firstPatched: '1.3.0' })
    expect(rce?.ghsaAdvisory?.cweIds).toEqual(['CWE-94'])
    expect(rce?.ghsaAdvisory?.references).toEqual(['https://example.com/advisory', 'https://example.com/patch'])
    expect(rce?.affectedAssets).toEqual([]) // never invents tickers
  })

  it('cross-links the CVE from cve_id or identifiers (GHSA -> CVE)', () => {
    const records = parseGhsaAdvisories(FIXTURE)
    expect(records.find((r) => r.ghsaId === 'GHSA-aaaa-bbbb-cccc')?.cveId).toBe('CVE-2026-1001')
    expect(records.find((r) => r.ghsaId === 'GHSA-dddd-eeee-ffff')?.cveId).toBe('CVE-2026-2002')
  })

  it('flags KEV membership only from the catalog, never from severity', () => {
    const records = parseGhsaAdvisories(FIXTURE, { knownExploitedCveIds: new Set(['CVE-2026-1001']) })
    const exploited = records.find((r) => r.ghsaId === 'GHSA-aaaa-bbbb-cccc')
    const notExploited = records.find((r) => r.ghsaId === 'GHSA-dddd-eeee-ffff')
    expect(exploited?.inKnownExploitedCatalog).toBe(true) // critical AND in KEV
    expect(notExploited?.inKnownExploitedCatalog).toBe(false) // high severity, not in KEV
    // Severity alone never sets exploitation.
    const withoutKev = parseGhsaAdvisories(FIXTURE, { knownExploitedCveIds: new Set() })
    expect(withoutKev.find((r) => r.ghsaId === 'GHSA-aaaa-bbbb-cccc')?.inKnownExploitedCatalog).toBe(false)
  })

  it('drops malformed advisories and excludes withdrawn ones from active intel', () => {
    const records = parseGhsaAdvisories(FIXTURE)
    expect(records.find((r) => r.ghsaId === 'NOT-A-GHSA')).toBeUndefined()
    // Withdrawn is parsed (field preserved) but not emitted.
    const withdrawn = records.find((r) => r.ghsaId === 'GHSA-1111-2222-3333')
    expect(withdrawn?.withdrawnAt).toBe('2026-05-15T10:00:00Z')
    const events = normalizeGhsaAdvisories(records)
    expect(events.find((e) => e.ghsaAdvisory?.ghsaId === 'GHSA-1111-2222-3333')).toBeUndefined()
  })

  it('fails closed on missing/malformed payloads (DATA_UNAVAILABLE upstream)', () => {
    expect(parseGhsaAdvisories(null)).toEqual([])
    expect(parseGhsaAdvisories({ nope: true })).toEqual([])
    expect(parseGhsaAdvisories([])).toEqual([])
    expect(normalizeGhsaAdvisories([])).toEqual([])
  })

  it('ranks a GHSA+NVD/KEV corroborated CVE above an isolated GHSA in What Changed Today', () => {
    const now = Date.parse('2026-06-01T12:00:00Z')
    const ghsaEvents = normalizeGhsaAdvisories(
      parseGhsaAdvisories(FIXTURE, { retrievedAt: now, knownExploitedCveIds: new Set(['CVE-2026-1001']) }),
    ).map((event) => ({ ...event, timestamp: now - 60 * 60 * 1000 }))

    // An NVD + KEV event on the same CVE as the critical GHSA.
    const nvd = {
      id: 'nvd-1',
      timestamp: now - 30 * 60 * 1000,
      title: 'CVE-2026-1001 — CRITICAL',
      summary: '',
      countryCodes: [],
      region: 'global',
      category: 'cyber-advisory',
      severity: 'critical' as Severity,
      confidence: 96,
      sourceId: 'nvd_cve_public',
      sourceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1001',
      provenance: 'official-api' as const,
      affectedAssets: [],
      affectedSectors: [],
      affectedCommodities: [],
      affectedCurrencies: [],
      extractedEntities: [],
      narrativeTags: ['CISA KEV'],
      rawPayloadHash: 'h',
      dedupeHash: 'nvd-dedupe',
      nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['acme:lib'], inKnownExploitedCatalog: true } as WorldIntelEvent['nvdCve'],
    } as WorldIntelEvent

    const result = assessWhatChangedToday([...ghsaEvents, nvd], { now })
    const top = result.items[0]
    // The corroborated CVE (GHSA + NVD + KEV) clusters into one item and ranks #1.
    expect(top.sourceIds).toEqual(expect.arrayContaining(['github_ghsa_public', 'nvd_cve_public']))
    expect(top.whyItMatters).toMatch(/independent sources/i)
    expect(top.whyItMatters).toMatch(/Active exploitation confirmed/i)
    const isolatedGhsa = result.items.find((item) =>
      item.evidence.every((e) => e.sourceId === 'github_ghsa_public') && !item.headline.includes('left-pad'),
    )
    if (isolatedGhsa) {
      expect(top.materiality).toBeGreaterThan(isolatedGhsa.materiality)
    }
  })
})
