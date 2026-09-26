import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createResearchRequest, exportBlockReason, readEvidenceReview, sha256 } from '../src/world/noemaBridge'
import { NoemaResearchPanel } from '../src/world/NoemaResearchPanel'
import type { EvidenceReview } from '../src/world/noemaBridge'
import type { WorldIntelEvent } from '../src/worldIntel'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/meridian-request.json', import.meta.url), 'utf8'))
const body = JSON.parse(fixture.payload)
const event: WorldIntelEvent = {
  id: 'fixture-event', timestamp: Date.parse(body.evidence.eventAt), title: body.evidence.title,
  summary: body.evidence.summary, sourceId: 'fixture-source', sourceUrl: 'https://example.com/fixture',
  rawPayloadHash: 'upstream-reference', dedupeHash: 'fixture', provenance: 'media-observation',
  category: 'other', confidence: 50, severity: 'watch', region: 'unknown', countryCodes: [],
  affectedAssets: [], affectedSectors: [], affectedCommodities: [], affectedCurrencies: [],
  extractedEntities: [], narrativeTags: [],
}

async function review(change: Partial<EvidenceReview> = {}) {
  const payload = JSON.stringify({
    requestId: body.requestId, requestSha256: fixture.sha256, eventId: body.evidence.eventId,
    generatedAt: '2026-01-03T00:00:00Z', method: 'deterministic-evidence-review-v1',
    basis: 'analysis', status: 'needs-more-evidence',
    findings: [{ text: 'An attributed excerpt.', evidenceIds: ['fixture-event'] }],
    unknowns: ['Source freshness is unknown.'], nextChecks: ['Inspect the primary source.'],
    nonClaims: ['Not a forecast.'], ...change,
  })
  return JSON.stringify({ schema: 'meridian.noema.review.v1', payload, sha256: await sha256(payload) })
}

describe('Meridian / NOEMA evidence transfer', () => {
  it('agrees on Unicode UTF-8 hashing with the shared Python fixture', async () => {
    expect(await sha256(fixture.payload)).toBe(fixture.sha256)
  })
  it('exports only an excerpt and never invents a retrieval timestamp', async () => {
    const packet = await createResearchRequest(event, 'What evidence is missing?')
    const request = JSON.parse(packet.payload)
    expect(request.evidence.sourceProvenance).toBe('media-observation')
    expect(request.evidence.sourceRetrievedAt).toBeNull()
    expect(request.evidence.freshness).toBe('unassessed')
    expect(request.evidence.upstreamPayloadHash).toBe('upstream-reference')
    expect(await sha256(packet.payload)).toBe(packet.sha256)
    expect(request.evidence).not.toHaveProperty('affectedAssets')
  })
  it.each(['simulated', 'model-inferred', 'local-derived', 'unavailable'] as const)(
    'blocks %s from becoming source evidence', (provenance) => {
      expect(exportBlockReason({ ...event, provenance })).not.toBeNull()
    },
  )
  it.each(['https://user:secret@example.com', 'https://example.com/?key=secret',
    'https://example.com/#secret', 'https://example.com/?', 'file:///tmp/source',
    'https://example.com/\nsecret', 'https://example.com/\\secret'])(
    'blocks unsafe URL %s', (sourceUrl) => {
      expect(exportBlockReason({ ...event, sourceUrl })).not.toBeNull()
    },
  )
  it('requires source proof and a past event timestamp', async () => {
    expect(exportBlockReason({ ...event, rawPayloadHash: '' })).not.toBeNull()
    expect(exportBlockReason({ ...event, timestamp: Date.now() + 100000 })).not.toBeNull()
    await expect(createResearchRequest(event, '')).rejects.toThrow()
  })
  it('imports a bounded, matching review as analysis', async () => {
    const result = await readEvidenceReview(await review(), fixture)
    expect(result.basis).toBe('analysis')
    expect(result.status).toBe('needs-more-evidence')
  })
  it('rejects another request, unsupported methods, future dates and missing citations', async () => {
    for (const change of [
      { requestSha256: 'f'.repeat(64) }, { eventId: 'other' },
      { generatedAt: '2999-01-01T00:00:00Z' },
      { findings: [{ text: 'Unsupported claim', evidenceIds: ['other'] }] },
      { unknowns: [] },
    ]) {
      await expect(readEvidenceReview(await review(change), fixture)).rejects.toThrow()
    }
    const encoded = JSON.parse(await review())
    encoded.payload += ' '
    await expect(readEvidenceReview(JSON.stringify(encoded), fixture)).rejects.toThrow(/integrity/)
  })
  it('makes the offline checklist boundary and blocked export visible', () => {
    const html = renderToStaticMarkup(createElement(NoemaResearchPanel, { event: { ...event, provenance: 'simulated' } }))
    expect(html).toContain('does not perform new research')
    expect(html).toContain('disabled=""')
    expect(html).toContain('not an eligible source excerpt')
  })
})
