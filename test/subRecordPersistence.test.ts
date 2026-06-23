import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createPersistence, parseSubRecords, serializeSubRecords } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')
const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})
function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), 'atlasz-subrec-'))
  dirs.push(dir)
  return { dir, store: createPersistence(dir) }
}

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `evt-${seq}`,
    timestamp: partial.timestamp ?? NOW - 60 * 60 * 1000,
    title: partial.title ?? 'Untitled',
    summary: '',
    countryCodes: [],
    region: 'global',
    category: partial.category ?? 'cyber-advisory',
    severity: (partial.severity ?? 'critical') as Severity,
    confidence: partial.confidence ?? 96,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: partial.rawPayloadHash ?? 'a'.repeat(64),
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    kevVulnerability: partial.kevVulnerability,
    nvdCve: partial.nvdCve,
    ghsaAdvisory: partial.ghsaAdvisory,
  } as WorldIntelEvent
}

const kev = { cveId: 'CVE-2026-1001', vendorProject: 'microsoft', product: 'windows', rawPayloadHash: 'k'.repeat(64), sourceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1001', provenance: 'official-api', confidence: 96 } as unknown as WorldIntelEvent['kevVulnerability']
const nvd = { cveId: 'CVE-2026-1001', vendorProducts: ['microsoft:windows'], inKnownExploitedCatalog: true, rawPayloadHash: 'n'.repeat(64), sourceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1001', provenance: 'official-api', confidence: 96, rawPayloadJson: '{"cveId":"CVE-2026-1001"}' } as unknown as WorldIntelEvent['nvdCve']
const ghsa = { ghsaId: 'GHSA-aaaa-bbbb-cccc', cveId: 'CVE-2026-1001', packages: [{ ecosystem: 'nuget', name: 'win-shim' }], rawPayloadHash: 'g'.repeat(64), sourceUrl: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc', provenance: 'official-api', confidence: 96 } as unknown as WorldIntelEvent['ghsaAdvisory']

function reload(dir: string): WorldIntelEvent[] {
  return createPersistence(dir).listWorldIntelEvents()
}

describe('cyber sub-record persistence', () => {
  it('round-trips KEV sub-record with full fidelity', () => {
    const { dir, store } = tempStore()
    store.saveWorldIntelEvent(ev({ sourceId: 'cisa_kev_public', kevVulnerability: kev }))
    const restored = reload(dir).find((e) => e.kevVulnerability)
    expect(restored?.kevVulnerability?.cveId).toBe('CVE-2026-1001')
    expect(restored?.kevVulnerability?.rawPayloadHash).toBe('k'.repeat(64))
    expect(restored?.kevVulnerability?.sourceUrl).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-1001')
    expect(restored?.kevVulnerability?.provenance).toBe('official-api')
  })

  it('round-trips NVD sub-record with rawPayloadJson/Hash preserved', () => {
    const { dir, store } = tempStore()
    store.saveWorldIntelEvent(ev({ sourceId: 'nvd_cve_public', nvdCve: nvd }))
    const restored = reload(dir).find((e) => e.nvdCve)
    expect(restored?.nvdCve?.cveId).toBe('CVE-2026-1001')
    expect(restored?.nvdCve?.inKnownExploitedCatalog).toBe(true)
    expect(restored?.nvdCve?.rawPayloadHash).toBe('n'.repeat(64))
    expect(restored?.nvdCve?.rawPayloadJson).toBe('{"cveId":"CVE-2026-1001"}')
  })

  it('round-trips GHSA sub-record including packages and CVE link', () => {
    const { dir, store } = tempStore()
    store.saveWorldIntelEvent(ev({ sourceId: 'github_ghsa_public', ghsaAdvisory: ghsa }))
    const restored = reload(dir).find((e) => e.ghsaAdvisory)
    expect(restored?.ghsaAdvisory?.ghsaId).toBe('GHSA-aaaa-bbbb-cccc')
    expect(restored?.ghsaAdvisory?.cveId).toBe('CVE-2026-1001')
    expect(restored?.ghsaAdvisory?.packages[0]).toMatchObject({ ecosystem: 'nuget', name: 'win-shim' })
  })

  it('still collapses KEV + NVD + GHSA into one CVE dossier after rehydrate', () => {
    const { dir, store } = tempStore()
    store.saveWorldIntelEvent(ev({ id: 'kev', sourceId: 'cisa_kev_public', kevVulnerability: kev }))
    store.saveWorldIntelEvent(ev({ id: 'nvd', sourceId: 'nvd_cve_public', nvdCve: nvd }))
    store.saveWorldIntelEvent(ev({ id: 'ghsa', sourceId: 'github_ghsa_public', ghsaAdvisory: ghsa }))

    const graph = buildEntityGraph(reload(dir), { now: NOW })
    const vuln = graph.nodes.find((node) => node.id === 'vulnerability:cve-2026-1001')
    expect(vuln).toBeDefined()
    const sources = new Set(vuln!.evidence.map((e) => e.sourceId))
    expect(sources).toEqual(new Set(['cisa_kev_public', 'nvd_cve_public', 'github_ghsa_public']))
  })

  it('serializeSubRecords emits null when there are no sub-records', () => {
    expect(serializeSubRecords(ev({ sourceId: 'gdelt_doc_public' }))).toBeNull()
    expect(serializeSubRecords(ev({ sourceId: 'nvd_cve_public', nvdCve: nvd }))).toContain('CVE-2026-1001')
  })

  it('fails closed on malformed persisted sub-records (no fabrication)', () => {
    expect(parseSubRecords(null)).toEqual({})
    expect(parseSubRecords('')).toEqual({})
    expect(parseSubRecords('{not valid json')).toEqual({})
    // Missing rawPayloadHash -> dropped.
    expect(parseSubRecords(JSON.stringify({ nvdCve: { cveId: 'CVE-2026-1001' } }))).toEqual({})
    // Bad CVE id -> dropped.
    expect(parseSubRecords(JSON.stringify({ kevVulnerability: { cveId: 'BAD', rawPayloadHash: 'x' } }))).toEqual({})
    // Valid -> preserved fully.
    const ok = parseSubRecords(JSON.stringify({ ghsaAdvisory: ghsa }))
    expect(ok.ghsaAdvisory?.ghsaId).toBe('GHSA-aaaa-bbbb-cccc')
  })
})
