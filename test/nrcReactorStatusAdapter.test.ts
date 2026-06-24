import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NRC_REACTOR_STATUS_SOURCE_ID,
  fetchNrcReactorStatus,
  normalizeNrcReactorStatus,
  parseNrcReactorStatus,
  readNrcReactorStatusConfig,
} from '../electron/osint/adapters/nrcReactorStatusAdapter'
import { createPersistence } from '../electron/persistence'
import { buildEntityGraph } from '../src/engine/entityModel'

const NOW = Date.parse('2026-06-18T12:00:00Z')
const NRC_URL = 'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt'
const dirs: string[] = []

const FEED = [
  'ReportDt|Unit|Power',
  '6/16/2026 12:00:00 AM|Arkansas Nuclear 1|100',
  '6/17/2026 12:00:00 AM|Arkansas Nuclear 1|0', // later date -> wins
  '6/17/2026 12:00:00 AM|Vogtle 3|97',
  '6/17/2026 12:00:00 AM||50', // malformed: no unit -> dropped
  '6/17/2026 12:00:00 AM|Bad Power|abc', // malformed: non-numeric -> dropped
  '6/17/2026 12:00:00 AM|Over Range|150', // malformed: >100 -> dropped
].join('\n')

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('NRC reactor status adapter (Layer 2)', () => {
  it('guards the official source host and honors disable', () => {
    expect(readNrcReactorStatusConfig({})?.url).toContain('nrc.gov')
    expect(readNrcReactorStatusConfig({ ATLASZ_NRC_REACTOR_STATUS_DISABLE: '1' })).toBeNull()
    expect(readNrcReactorStatusConfig({ ATLASZ_NRC_REACTOR_STATUS_URL: 'https://evil.com/status.txt' })).toBeNull()
    expect(readNrcReactorStatusConfig({ ATLASZ_NRC_REACTOR_STATUS_URL: 'http://www.nrc.gov/x.txt' })).toBeNull()
  })

  it('parses pipe-delimited status, keeping the latest row per unit', () => {
    const rows = parseNrcReactorStatus(FEED, { retrievedAt: NOW, sourceUrl: NRC_URL })
    expect(rows.map((r) => r.unitName).sort()).toEqual(['Arkansas Nuclear 1', 'Vogtle 3'])
    const ark = rows.find((r) => r.unitName === 'Arkansas Nuclear 1')
    expect(ark).toMatchObject({ reportDate: '2026-06-17', powerPercent: 0, provenance: 'official-api' })
    expect(ark?.sourceName).toBe('U.S. Nuclear Regulatory Commission')
  })

  it('drops malformed rows and refuses non-official endpoints', () => {
    expect(parseNrcReactorStatus('', { sourceUrl: NRC_URL })).toEqual([])
    expect(parseNrcReactorStatus(FEED, { sourceUrl: 'https://evil.com/x.txt' })).toEqual([])
    // Only the 2 valid units survive (3 malformed rows dropped).
    expect(parseNrcReactorStatus(FEED, { retrievedAt: NOW, sourceUrl: NRC_URL })).toHaveLength(2)
  })

  it('reports power level without safety/outage editorializing', () => {
    const events = normalizeNrcReactorStatus(parseNrcReactorStatus(FEED, { retrievedAt: NOW, sourceUrl: NRC_URL }))
    for (const event of events) {
      expect(event.summary).toMatch(/not an Atlasz safety, outage, disruption, or vulnerability assessment/i)
      expect(`${event.title} ${event.summary}`).not.toMatch(/\b(unsafe|meltdown|shutdown due to|emergency|disrupted|outage at)\b/i)
    }
  })

  it('graphs the reactor unit separately from EIA facilities (no fuzzy merge)', () => {
    const events = normalizeNrcReactorStatus(parseNrcReactorStatus(FEED, { retrievedAt: NOW, sourceUrl: NRC_URL }))
    const graph = buildEntityGraph(events, { now: NOW })
    const ids = graph.nodes.map((n) => n.id)
    expect(ids.some((id) => id.startsWith('facility:nrc-unit:'))).toBe(true)
    expect(ids).toContain('source:nrc_reactor_status_public')
    // No EIA-style plant id node fabricated.
    expect(ids).not.toContain('facility:6008')
  })

  it('persists + rehydrates reactor status sub-records (round-trip)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-nrc-'))
    dirs.push(dir)
    const event = normalizeNrcReactorStatus(parseNrcReactorStatus(FEED, { retrievedAt: NOW, sourceUrl: NRC_URL }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const stored = createPersistence(dir).listWorldIntelEvents().find((c) => c.nrcReactorStatus)
    expect(stored?.nrcReactorStatus?.unitName).toBe(event.nrcReactorStatus?.unitName)
    expect(stored?.nrcReactorStatus?.rawPayloadHash).toBe(event.nrcReactorStatus?.rawPayloadHash)
  })

  it('fails closed on HTTP rate-limit', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => FEED }))
    const ok = await fetchNrcReactorStatus(new AbortController().signal, { url: NRC_URL, maxUnits: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    expect(ok[0].sourceId).toBe(NRC_REACTOR_STATUS_SOURCE_ID)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, text: async () => '' }))
    await expect(fetchNrcReactorStatus(new AbortController().signal, { url: NRC_URL, maxUnits: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })).rejects.toMatchObject({ status: 429 })
  })
})
