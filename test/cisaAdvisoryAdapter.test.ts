import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CISA_ADVISORIES_SOURCE_ID,
  fetchCisaAdvisories,
  normalizeCisaAdvisories,
  parseCisaAdvisories,
  parseCisaFeedXml,
  readCisaAdvisoryConfig,
} from '../electron/osint/adapters/cisaAdvisoryAdapter'
import { buildEntityGraph } from '../src/engine/entityModel'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import { createPersistence } from '../electron/persistence'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FEED_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>ICSA-26-140-01 Siemens SIMATIC Vulnerabilities</title>
    <link>https://www.cisa.gov/news-events/ics-advisories/icsa-26-140-01</link>
    <pubDate>Tue, 20 May 2026 10:00:00 GMT</pubDate>
    <description><![CDATA[Multiple vulnerabilities including CVE-2026-1001 and CVE-2026-2002 affecting Siemens SIMATIC.]]></description>
  </item>
  <item>
    <title>AA26-145A Threat Actor Activity</title>
    <link>https://www.cisa.gov/news-events/cybersecurity-advisories/aa26-145a</link>
    <pubDate>Fri, 10 May 2026 10:00:00 GMT</pubDate>
    <description>Advisory with no CVE reference.</description>
  </item>
  <item>
    <title>Some non-advisory news item</title>
    <link>https://www.cisa.gov/news-events/news/some-news</link>
    <pubDate>Mon, 01 May 2026 10:00:00 GMT</pubDate>
    <description>No advisory id here.</description>
  </item>
</channel></rss>`

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('CISA advisories adapter', () => {
  it('is public by default and refuses insecure overrides', () => {
    expect(readCisaAdvisoryConfig({})).not.toBeNull()
    expect(readCisaAdvisoryConfig({ ATLASZ_CISA_ADVISORIES_DISABLE: '1' })).toBeNull()
    expect(readCisaAdvisoryConfig({ ATLASZ_CISA_ADVISORIES_URL: 'http://insecure' })).toBeNull()
  })

  it('parses the RSS feed into advisory items', () => {
    const items = parseCisaFeedXml(FEED_XML)
    expect(items.length).toBe(3)
    expect(items[0].title).toContain('ICSA-26-140-01')
    expect(items[0].link).toMatch(/^https:\/\/www\.cisa\.gov\//)
  })

  it('normalizes advisories with official-api provenance and full source trail', () => {
    const records = parseCisaAdvisories(FEED_XML, { retrievedAt: NOW })
    const events = normalizeCisaAdvisories(records)
    const ics = events.find((e) => e.cisaAdvisory?.advisoryId === 'ICSA-26-140-01')
    expect(ics?.category).toBe('cyber-advisory')
    expect(ics?.provenance).toBe('official-api')
    expect(ics?.confidence).toBe(96)
    expect(ics?.sourceId).toBe(CISA_ADVISORIES_SOURCE_ID)
    expect(ics?.sourceUrl).toMatch(/^https:\/\/www\.cisa\.gov\//)
    expect(ics?.cisaAdvisory?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(ics?.affectedAssets).toEqual([])
  })

  it('extracts and cross-links CVE IDs from title and description', () => {
    const records = parseCisaAdvisories(FEED_XML, { retrievedAt: NOW })
    const ics = records.find((r) => r.advisoryId === 'ICSA-26-140-01')
    expect(ics?.relatedCveIds).toEqual(['CVE-2026-1001', 'CVE-2026-2002'])
  })

  it('drops malformed items with no recognizable advisory ID (no repair)', () => {
    const records = parseCisaAdvisories(FEED_XML, { retrievedAt: NOW })
    expect(records.find((r) => r.title.includes('non-advisory'))).toBeUndefined()
    expect(records.every((r) => r.advisoryId.length > 0)).toBe(true)
  })

  it('joins the existing CVE node so a dossier shows NVD + CISA advisory together', () => {
    const cisaEvents = normalizeCisaAdvisories(parseCisaAdvisories(FEED_XML, { retrievedAt: NOW })).map((e) => ({
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
      nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['siemens:simatic'], inKnownExploitedCatalog: false } as WorldIntelEvent['nvdCve'],
    } as WorldIntelEvent

    const graph = buildEntityGraph([...cisaEvents, nvd], { now: NOW })
    const vuln = graph.nodes.find((node) => node.id === 'vulnerability:cve-2026-1001')!
    const sources = new Set(vuln.evidence.map((e) => e.sourceId))
    expect(sources.has('cisa_advisories_public')).toBe(true)
    expect(sources.has('nvd_cve_public')).toBe(true)

    const result = assessWhatChangedToday([...cisaEvents, nvd], { now: NOW })
    expect(result.items[0].sourceIds).toEqual(expect.arrayContaining(['cisa_advisories_public', 'nvd_cve_public']))
  })

  it('round-trips the advisory sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-cisa-'))
    dirs.push(dir)
    const event = normalizeCisaAdvisories(parseCisaAdvisories(FEED_XML, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.cisaAdvisory)
    expect(restored?.cisaAdvisory?.advisoryId).toBe(event.cisaAdvisory?.advisoryId)
    expect(restored?.cisaAdvisory?.relatedCveIds).toEqual(event.cisaAdvisory?.relatedCveIds)
    expect(restored?.cisaAdvisory?.rawPayloadHash).toBe(event.cisaAdvisory?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseCisaAdvisories('', { retrievedAt: NOW })).toEqual([])
    expect(parseCisaAdvisories('<rss></rss>', { retrievedAt: NOW })).toEqual([])
    expect(normalizeCisaAdvisories([])).toEqual([])

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '3' : null) },
      text: async () => '',
    }))
    await expect(
      fetchCisaAdvisories(new AbortController().signal, { feedUrl: 'https://www.cisa.gov/x.xml', maxRecords: 10 }),
    ).rejects.toMatchObject({ status: 429 })
  })
})
