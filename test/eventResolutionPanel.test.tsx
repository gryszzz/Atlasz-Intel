import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EventResolutionPanel } from '../src/components/intel/EventResolutionPanel'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  return {
    id: partial.id ?? 'evt-1',
    timestamp: NOW,
    title: partial.title ?? 'Untitled',
    summary: '',
    countryCodes: [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: 'watch' as Severity,
    confidence: 96,
    sourceId: partial.sourceId,
    sourceUrl: 'https://example.com/1',
    provenance: partial.provenance ?? 'public-disclosure',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: 'h',
    dedupeHash: partial.dedupeHash ?? 'd',
    secFiling: partial.secFiling,
    eiaEnergyRecord: partial.eiaEnergyRecord,
    githubRelease: partial.githubRelease,
  } as WorldIntelEvent
}

function render(event: WorldIntelEvent): string {
  return renderToStaticMarkup(createElement(EventResolutionPanel, { event }))
}

describe('EventResolutionPanel (resolver + exposure in the dossier)', () => {
  it('renders the resolver trail and curated exposure chains for a live SEC NVIDIA event', () => {
    const markup = render(
      ev({
        sourceId: 'sec_edgar_public',
        affectedAssets: ['NVDA'],
        secFiling: { cik: '1045810', companyName: 'NVIDIA Corporation', accessionNumber: '0001045810-26-000001', formType: '8-K', ticker: 'NVDA' } as WorldIntelEvent['secFiling'],
      }),
    )
    expect(markup).toContain('Resolved Structural Context')
    expect(markup).toContain('company:nvidia') // canonical seed id
    expect(markup).toMatch(/Matched by:\s*(cik|ticker)/) // matchType visible
    expect(markup).toContain('confidence')
    expect(markup).toContain('resolver-rule') // resolver source visible
    expect(markup).toContain('curated-reference') // seed trust visible
    // Structural exposure rendered with hop chain + source note + path confidence.
    expect(markup).toContain('TSMC')
    expect(markup).toMatch(/fabricated by|located in/)
    expect(markup).toMatch(/\d+%/)
    // No verified badge on resolver/seed sections.
    expect(markup).not.toContain('prov-verified')
    expect(markup).not.toMatch(/>\s*verified\s*</i)
  })

  it('resolves an EIA crude oil event and exposes refineries + chokepoints (cross-seed)', () => {
    const markup = render(
      ev({
        sourceId: 'eia_energy_public',
        provenance: 'official-api',
        eiaEnergyRecord: { commodity: 'Crude oil', seriesId: 'PET.RWTC.D' } as WorldIntelEvent['eiaEnergyRecord'],
      }),
    )
    expect(markup).toContain('commodity:crude-oil')
    expect(markup).toMatch(/Refineries|refines/) // energy seed
    expect(markup).toContain('Strait of Malacca') // ports/trade seed (cross-seed)
  })

  it('resolves an allowlisted GitHub repo; a random repo stays unresolved', () => {
    const resolved = render(
      ev({ sourceId: 'github_releases_public', githubRelease: { repoFullName: 'NVIDIA/cutlass' } as WorldIntelEvent['githubRelease'] }),
    )
    expect(resolved).toContain('company:nvidia')

    const random = render(
      ev({ sourceId: 'github_releases_public', githubRelease: { repoFullName: 'someuser/random-repo' } as WorldIntelEvent['githubRelease'] }),
    )
    expect(random).toContain('No curated structural match for this live event')
  })

  it('shows an honest unresolved state for an event with no resolvable identifiers', () => {
    const markup = render(ev({ sourceId: 'cisa_kev_public' }))
    expect(markup).toContain('Resolved Structural Context')
    expect(markup).toContain('No curated structural match for this live event')
    expect(markup).toContain('Live evidence is still shown')
    expect(markup).not.toContain('TSMC')
  })

  it('renders nothing in hideWhenUnresolved (inline) mode when the event does not resolve', () => {
    const unresolved = renderToStaticMarkup(
      createElement(EventResolutionPanel, { event: ev({ sourceId: 'cisa_kev_public' }), hideWhenUnresolved: true }),
    )
    expect(unresolved).toBe('')
    // But a resolvable event still renders inline.
    const resolved = renderToStaticMarkup(
      createElement(EventResolutionPanel, {
        event: ev({ sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'] }),
        hideWhenUnresolved: true,
      }),
    )
    expect(resolved).toContain('company:nvidia')
  })
})
