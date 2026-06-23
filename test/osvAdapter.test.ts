import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  OSV_SOURCE_ID,
  fetchOsvVulnerabilities,
  normalizeOsvVulnerabilities,
  parseOsvVulns,
  readOsvConfig,
} from '../electron/osint/adapters/osvAdapter'
import { buildEntityGraph } from '../src/engine/entityModel'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FIXTURE = {
  vulns: [
    {
      id: 'GHSA-jfh8-c2jp-5v3q',
      summary: 'Remote code execution in log4j-core',
      details: 'A serialization flaw...',
      aliases: ['CVE-2026-1001', 'GHSA-aaaa-bbbb-cccc'],
      published: '2026-05-20T10:00:00Z',
      modified: '2026-05-28T10:00:00Z',
      severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' }],
      database_specific: { severity: 'CRITICAL' },
      affected: [
        {
          package: { ecosystem: 'Maven', name: 'org.apache.logging.log4j:log4j-core' },
          ranges: [{ type: 'ECOSYSTEM', events: [{ introduced: '0' }, { fixed: '2.15.0' }] }],
        },
        { package: { ecosystem: '', name: '' } },
      ],
      references: [{ type: 'WEB', url: 'https://example.com/osv' }, 'not-a-url'],
    },
    {
      id: 'PYSEC-2026-77',
      summary: 'SSRF in requests',
      aliases: ['GHSA-dddd-eeee-ffff'],
      published: '2026-05-10T10:00:00Z',
      modified: '2026-05-11T10:00:00Z',
      affected: [{ package: { ecosystem: 'PyPI', name: 'requests' } }],
    },
    {
      // Malformed: bad OSV id -> dropped, never repaired.
      id: 'x',
      summary: 'bogus',
      modified: '2026-05-01T10:00:00Z',
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('OSV.dev adapter', () => {
  it('is public by default and opts out / refuses insecure overrides', () => {
    expect(readOsvConfig({})).not.toBeNull()
    expect(readOsvConfig({ ATLASZ_OSV_DISABLE: '1' })).toBeNull()
    expect(readOsvConfig({ ATLASZ_OSV_API_BASE: 'http://insecure' })).toBeNull()
    expect(readOsvConfig({ ATLASZ_OSV_IDS: 'GHSA-1,GHSA-2' })?.vulnIds).toEqual(['GHSA-1', 'GHSA-2'])
  })

  it('parses OSV records with official-api provenance and full source trail', () => {
    const records = parseOsvVulns(FIXTURE, { retrievedAt: NOW })
    const events = normalizeOsvVulnerabilities(records)
    const rce = events.find((e) => e.osvVulnerability?.osvId === 'GHSA-jfh8-c2jp-5v3q')
    expect(rce?.category).toBe('cyber-advisory')
    expect(rce?.provenance).toBe('official-api')
    expect(rce?.confidence).toBe(96)
    expect(rce?.sourceId).toBe(OSV_SOURCE_ID)
    expect(rce?.sourceUrl).toBe('https://osv.dev/vulnerability/GHSA-jfh8-c2jp-5v3q')
    expect((rce?.severity as Severity)).toBe('critical')
    expect(rce?.osvVulnerability?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(rce?.affectedAssets).toEqual([])
  })

  it('cross-links CVE and GHSA aliases', () => {
    const records = parseOsvVulns(FIXTURE, { retrievedAt: NOW })
    const rce = records.find((r) => r.osvId === 'GHSA-jfh8-c2jp-5v3q')
    expect(rce?.relatedCveIds).toEqual(['CVE-2026-1001'])
    expect(rce?.relatedGhsaIds).toEqual(['GHSA-aaaa-bbbb-cccc'])
  })

  it('extracts affected packages with fixed version, skipping empty packages', () => {
    const records = parseOsvVulns(FIXTURE, { retrievedAt: NOW })
    const rce = records.find((r) => r.osvId === 'GHSA-jfh8-c2jp-5v3q')
    expect(rce?.affectedPackages).toEqual([
      { ecosystem: 'Maven', name: 'org.apache.logging.log4j:log4j-core', fixed: '2.15.0' },
    ])
    expect(rce?.ecosystem).toBe('Maven')
    expect(rce?.references).toEqual(['https://example.com/osv'])
  })

  it('drops malformed OSV records (no repair)', () => {
    const records = parseOsvVulns(FIXTURE, { retrievedAt: NOW })
    expect(records.find((r) => r.osvId === 'x')).toBeUndefined()
    expect(records.every((r) => /-/.test(r.osvId))).toBe(true)
  })

  it('joins the existing CVE node so a dossier shows NVD + GHSA + OSV together', () => {
    const osvEvents = normalizeOsvVulnerabilities(parseOsvVulns(FIXTURE, { retrievedAt: NOW })).map((e) => ({
      ...e,
      timestamp: NOW - 60 * 60 * 1000,
    }))
    const nvd = {
      id: 'nvd-1',
      timestamp: NOW - 30 * 60 * 1000,
      title: 'NVD CVE-2026-1001',
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
      narrativeTags: [],
      rawPayloadHash: 'h',
      dedupeHash: 'nvd-d',
      nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['apache:log4j'], inKnownExploitedCatalog: false } as WorldIntelEvent['nvdCve'],
    } as WorldIntelEvent

    const graph = buildEntityGraph([...osvEvents, nvd], { now: NOW })
    const vuln = graph.nodes.find((node) => node.id === 'vulnerability:cve-2026-1001')
    expect(vuln).toBeDefined()
    const sources = new Set(vuln!.evidence.map((e) => e.sourceId))
    expect(sources.has('osv_dev_public')).toBe(true)
    expect(sources.has('nvd_cve_public')).toBe(true)

    // And it corroborates in What Changed Today.
    const result = assessWhatChangedToday([...osvEvents, nvd], { now: NOW })
    const top = result.items[0]
    expect(top.sourceIds).toEqual(expect.arrayContaining(['osv_dev_public', 'nvd_cve_public']))
    expect(top.whyItMatters).toMatch(/independent sources/i)
  })

  it('fails closed on missing payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseOsvVulns(null)).toEqual([])
    expect(parseOsvVulns({ vulns: [] })).toEqual([])
    expect(normalizeOsvVulnerabilities([])).toEqual([])

    // 429 from OSV surfaces a typed HttpError (so the registry retries/backs off).
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) },
    }))
    await expect(
      fetchOsvVulnerabilities(new AbortController().signal, {
        apiBase: 'https://api.osv.dev',
        packages: [{ ecosystem: 'PyPI', name: 'requests' }],
        vulnIds: [],
        maxRecords: 10,
      }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
