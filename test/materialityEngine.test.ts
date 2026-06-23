import { describe, expect, it } from 'vitest'
import {
  assessWhatChangedToday,
  provenanceTrust,
  severityScore,
  type MaterialityOptions,
} from '../src/engine/materialityEngine'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `evt-${seq}`,
    timestamp: partial.timestamp ?? NOW - 60 * 60 * 1000,
    title: partial.title ?? 'Untitled',
    summary: '',
    countryCodes: partial.countryCodes ?? [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'watch') as Severity,
    confidence: partial.confidence ?? 90,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: partial.affectedCurrencies ?? [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: 'hash',
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    nvdCve: partial.nvdCve,
    kevVulnerability: partial.kevVulnerability,
  } as WorldIntelEvent
}

const opts: MaterialityOptions = { now: NOW }

describe('materiality engine', () => {
  it('returns DATA_UNAVAILABLE when no events fall in the window', () => {
    const stale = ev({ sourceId: 'nvd_cve_public', timestamp: NOW - 5 * 24 * 60 * 60 * 1000 })
    const result = assessWhatChangedToday([stale], opts)
    expect(result.status).toBe('DATA_UNAVAILABLE')
    expect(result.items).toEqual([])
  })

  it('clusters NVD + CISA KEV on the same CVE into one item and ranks it top', () => {
    const nvd = ev({
      id: 'nvd-1',
      sourceId: 'nvd_cve_public',
      title: 'CVE-2026-1001 — CRITICAL (CVSS 9.8)',
      severity: 'critical',
      confidence: 96,
      category: 'cyber-advisory',
      nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['microsoft:windows'], inKnownExploitedCatalog: true } as WorldIntelEvent['nvdCve'],
    })
    const kev = ev({
      id: 'kev-1',
      sourceId: 'cisa_kev_public',
      title: 'CVE-2026-1001 added to CISA KEV',
      severity: 'critical',
      confidence: 96,
      category: 'cyber-advisory',
      narrativeTags: ['CISA KEV'],
      kevVulnerability: { cveId: 'CVE-2026-1001' } as WorldIntelEvent['kevVulnerability'],
    })
    const quiet = ev({ sourceId: 'gdelt_doc_public', title: 'Minor news', severity: 'stable', confidence: 60, provenance: 'public-unauthenticated' })

    const result = assessWhatChangedToday([nvd, kev, quiet], opts)
    expect(result.status).toBe('ok')
    // NVD + KEV collapse into a single item (not two).
    const cyber = result.items.filter((item) => item.category === 'cyber-advisory')
    expect(cyber).toHaveLength(1)
    const top = result.items[0]
    expect(top.evidence.map((e) => e.sourceId).sort()).toEqual(['cisa_kev_public', 'nvd_cve_public'])
    expect(top.sourceIds.length).toBe(2)
    expect(top.whyItMatters).toMatch(/independent sources/i)
    expect(top.whyItMatters).toMatch(/Active exploitation confirmed/i)
    expect(top.confidence).toBe(96)
    expect(top.provenance).toBe('local-derived')
    // A corroborated, critical, exploited CVE outranks a quiet unverified headline.
    expect(top.materiality).toBeGreaterThan(result.items[result.items.length - 1].materiality)
  })

  it('boosts cross-source corroboration on a shared sector (FRED + SEC labor signal)', () => {
    const fred = ev({
      sourceId: 'macro_calendar_fred',
      title: 'Unemployment rose; payroll growth slowed',
      severity: 'elevated',
      confidence: 94,
      category: 'macro-event',
      affectedSectors: ['labor'],
    })
    const sec = ev({
      sourceId: 'sec_edgar_public',
      title: 'Regional bank disclosed workforce reduction',
      severity: 'elevated',
      confidence: 92,
      category: 'filing',
      affectedSectors: ['labor'],
    })
    const isolated = ev({
      sourceId: 'macro_calendar_fred',
      title: 'Single unrelated macro print',
      severity: 'elevated',
      confidence: 94,
      category: 'macro-event',
      affectedSectors: ['housing'],
    })

    const result = assessWhatChangedToday([fred, sec, isolated], opts)
    const corroborated = result.items.find((item) => item.entities.includes('labor'))
    const alone = result.items.find((item) => item.headline.includes('unrelated'))
    expect(corroborated).toBeDefined()
    expect(corroborated!.scores.corroboration).toBeGreaterThan(0)
    expect(alone!.scores.corroboration).toBe(0)
    expect(corroborated!.materiality).toBeGreaterThan(alone!.materiality)
  })

  it('uses priorKeys to mark genuinely new events as higher delta', () => {
    const known = ev({ sourceId: 'nvd_cve_public', dedupeHash: 'seen-before', severity: 'elevated', confidence: 90 })
    const fresh = ev({ sourceId: 'nvd_cve_public', dedupeHash: 'brand-new', severity: 'elevated', confidence: 90 })
    const withPrior: MaterialityOptions = { now: NOW, priorKeys: new Set(['seen-before']) }
    const result = assessWhatChangedToday([known, fresh], withPrior)
    const knownItem = result.items.find((item) => item.id.includes('seen-before'))
    const freshItem = result.items.find((item) => item.id.includes('brand-new'))
    expect(freshItem!.scores.delta).toBe(1)
    expect(knownItem!.scores.delta).toBe(0)
    expect(freshItem!.whyItMatters).toMatch(/New today/i)
  })

  it('keeps every item evidence-trailed and local-derived (never verified)', () => {
    const result = assessWhatChangedToday(
      [ev({ sourceId: 'sec_edgar_public', severity: 'critical', confidence: 96 })],
      opts,
    )
    for (const item of result.items) {
      expect(item.provenance).toBe('local-derived')
      expect(item.evidence.length).toBeGreaterThan(0)
      expect(item.evidence.every((e) => e.sourceUrl && e.sourceLabel)).toBe(true)
      expect(item.materiality).toBeGreaterThanOrEqual(0)
      expect(item.materiality).toBeLessThanOrEqual(100)
    }
  })

  it('is deterministic and respects the limit', () => {
    const events = Array.from({ length: 20 }, (_, i) =>
      ev({ sourceId: 'gdelt_doc_public', title: `Event ${i}`, severity: 'watch', confidence: 80, dedupeHash: `d-${i}` }),
    )
    const a = assessWhatChangedToday(events, { now: NOW, limit: 5 })
    const b = assessWhatChangedToday(events, { now: NOW, limit: 5 })
    expect(a.items).toHaveLength(5)
    expect(a.items.map((i) => i.id)).toEqual(b.items.map((i) => i.id))
  })

  it('exposes monotonic score primitives', () => {
    expect(provenanceTrust('verified')).toBeGreaterThan(provenanceTrust('official-api'))
    expect(provenanceTrust('official-api')).toBeGreaterThan(provenanceTrust('public-unauthenticated'))
    expect(provenanceTrust('public-unauthenticated')).toBeGreaterThan(provenanceTrust('model-inferred'))
    expect(severityScore('critical')).toBeGreaterThan(severityScore('elevated'))
    expect(severityScore('elevated')).toBeGreaterThan(severityScore('watch'))
    expect(severityScore('watch')).toBeGreaterThan(severityScore('stable'))
  })
})
