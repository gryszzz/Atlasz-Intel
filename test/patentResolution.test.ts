import { describe, expect, it } from 'vitest'
import {
  eventCandidateIdentifiers,
  eventStructuralExposure,
  resolveByName,
  resolveEvent,
} from '../src/engine/entityResolver'
import type { WorldIntelEvent, PatentRecord } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

function patentEvent(record: Partial<PatentRecord>): WorldIntelEvent {
  const patentRecord = {
    id: 'p-1',
    patentId: '12345678',
    title: 'GPU memory subsystem',
    abstract: '',
    patentDate: '2026-05-20',
    grantTimestamp: NOW,
    assignees: [],
    cpcCodes: [],
    sourceUrl: 'https://patents.google.com/patent/US12345678',
    sourceApiUrl: 'https://search.patentsview.org/api/v1/patent/',
    sourceName: 'USPTO PatentsView',
    retrievedAt: NOW,
    provenance: 'official-api',
    confidence: 96,
    rawPayloadHash: 'h',
    rawPayloadJson: '{}',
    ...record,
  } as PatentRecord
  return {
    id: 'patent-evt-1',
    timestamp: NOW,
    title: patentRecord.title,
    summary: '',
    countryCodes: [],
    region: 'global',
    category: 'patent',
    severity: 'watch' as Severity,
    confidence: 96,
    sourceId: 'uspto_patentsview_public',
    sourceUrl: patentRecord.sourceUrl,
    provenance: 'public-disclosure',
    affectedAssets: [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: 'd-1',
    patentRecord,
  } as WorldIntelEvent
}

describe('patent resolution hardening', () => {
  it('resolves a patent to its assignee company AND mapped technology when CPC rules match', () => {
    const event = patentEvent({ assignees: ['NVIDIA Corporation'], cpcCodes: ['H01L23/00', 'G06N3/08'] })
    const resolutions = resolveEvent(event)
    const ids = resolutions.map((r) => r.resolved && r.canonicalSeedEntityId)
    expect(ids).toContain('company:nvidia') // assignee -> company
    expect(ids).toContain('sector:semiconductors') // H01L -> semiconductors
    expect(ids).toContain('technology:ai-accelerators') // G06N -> AI accelerators
  })

  it('tags classification-based resolutions distinctly and marks them as rule-based, not verification', () => {
    const event = patentEvent({ assignees: ['Intel Corporation'], cpcCodes: ['H02M3/00'] })
    const classification = resolveEvent(event).find((r) => r.resolved && r.matchType === 'classification')
    expect(classification?.resolved).toBe(true)
    if (classification?.resolved) {
      expect(classification.canonicalSeedEntityId).toBe('technology:power-semiconductors')
      expect(classification.source).toBe('resolver-rule')
      expect(classification.reason).toMatch(/not verification/i)
    }
  })

  it('does not fuzzy-match assignee names — only exact curated legal names resolve', () => {
    expect(resolveByName('NVIDIA Corp')).toMatchObject({ resolved: false })
    expect(resolveByName('Nvidia Graphics Inc')).toMatchObject({ resolved: false })
    expect(resolveByName('Broadcom Inc.')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:broadcom' })
    expect(resolveByName('SK hynix Inc.')).toMatchObject({ resolved: true, canonicalSeedEntityId: 'company:sk-hynix' })
  })

  it('leaves unmapped CPC codes unmapped (no spurious technology resolution)', () => {
    const event = patentEvent({ assignees: ['Microsoft Technology Licensing, LLC'], cpcCodes: ['G06F12/00', 'H04L9/00'] })
    const ids = resolveEvent(event).map((r) => r.resolved && r.canonicalSeedEntityId)
    expect(ids).toContain('company:microsoft')
    expect(ids).not.toContain('sector:semiconductors')
    expect(ids).not.toContain('technology:ai-accelerators')
    // The only resolution is the assignee company; no classification slipped in.
    expect(resolveEvent(event).some((r) => r.resolved && r.matchType === 'classification')).toBe(false)
  })

  it('lists CPC codes as classification identifiers in the resolver trail', () => {
    const event = patentEvent({ assignees: ['Intel Corporation'], cpcCodes: ['H01L23/00'] })
    const ids = eventCandidateIdentifiers(event)
    expect(ids).toContainEqual({ type: 'classification', value: 'H01L23/00' })
    expect(ids).toContainEqual({ type: 'alias', value: 'Intel Corporation' })
  })

  it('activates curated structural exposure from a mapped technology', () => {
    const event = patentEvent({ assignees: ['NVIDIA Corporation'], cpcCodes: ['H01L23/00'] })
    const exposed = eventStructuralExposure(event)
    const seedTargets = exposed.map((e) => e.resolution.canonicalSeedEntityId)
    expect(seedTargets).toContain('sector:semiconductors')
    // Every exposure entry is curated-reference, never verified live evidence.
    expect(exposed.every((e) => e.resolution.source === 'resolver-rule')).toBe(true)
  })
})
