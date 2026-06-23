import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PatentSourceTrail } from '../src/components/intel/PatentSourceTrail'
import { selectRenderablePatents } from '../src/components/intel/patentTrailSelect'
import type { PatentRecord, WorldIntelEvent } from '../src/worldIntel'

function patentEvent(overrides: Partial<PatentRecord>): WorldIntelEvent {
  const patent: PatentRecord = {
    id: 'uspto_patentsview_public:12345678',
    patentId: '12345678',
    title: 'GPU memory subsystem for AI accelerators',
    abstract: '',
    patentDate: '2026-05-20',
    grantTimestamp: Date.parse('2026-05-20T00:00:00Z'),
    assignees: ['NVIDIA Corporation'],
    cpcCodes: ['G06F12/00'],
    sourceUrl: 'https://patents.google.com/patent/US12345678',
    sourceApiUrl: 'https://search.patentsview.org/api/v1/patent/',
    sourceName: 'USPTO (PatentsView)',
    retrievedAt: Date.now(),
    provenance: 'official-api',
    confidence: 96,
    rawPayloadHash: 'a'.repeat(64),
    ...overrides,
  }
  return { patentRecord: patent } as unknown as WorldIntelEvent
}

describe('PatentSourceTrail', () => {
  it('renders patent source-trail cards with assignees and a source link', () => {
    const markup = renderToStaticMarkup(createElement(PatentSourceTrail, { events: [patentEvent({})] }))
    expect(markup).toContain('USPTO Patents')
    expect(markup).toContain('12345678')
    expect(markup).toContain('NVIDIA Corporation')
    expect(markup).toContain('patent source trail')
    expect(markup).toContain('href="https://patents.google.com/patent/US12345678"')
    expect(markup).not.toContain('DATA_UNAVAILABLE')
  })

  it('shows DATA_UNAVAILABLE when there are no patents', () => {
    const markup = renderToStaticMarkup(createElement(PatentSourceTrail, { events: [] }))
    expect(markup).toContain('DATA_UNAVAILABLE')
  })

  it('proof-gates: drops patents missing source trail or below confidence', () => {
    expect(selectRenderablePatents([patentEvent({ confidence: 60 })])).toHaveLength(0)
    expect(selectRenderablePatents([patentEvent({ rawPayloadHash: '' })])).toHaveLength(0)
    expect(selectRenderablePatents([patentEvent({ sourceUrl: 'https://evil.example/x' })])).toHaveLength(0)
    expect(selectRenderablePatents([patentEvent({})])).toHaveLength(1)
  })
})
