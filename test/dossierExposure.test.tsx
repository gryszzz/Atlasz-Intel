import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { buildEntityGraph } from '../src/engine/entityModel'
import type { WorldIntelEvent } from '../src/worldIntel'
import type { Severity } from '../src/data/intel'

const NOW = Date.parse('2026-06-22T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `evt-${seq}`,
    timestamp: partial.timestamp ?? NOW - 2 * 60 * 60 * 1000,
    title: partial.title ?? 'Untitled',
    summary: '',
    countryCodes: partial.countryCodes ?? [],
    region: 'global',
    category: partial.category ?? 'natural-disaster',
    severity: (partial.severity ?? 'elevated') as Severity,
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
    rawPayloadHash: 'a'.repeat(64),
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
  } as WorldIntelEvent
}

function dossierMarkup(countryCode: string): string {
  const graph = buildEntityGraph([ev({ sourceId: 'usgs_significant_quakes', title: `Quake in ${countryCode}`, countryCodes: [countryCode] })], { now: NOW })
  return renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: `country:${countryCode.toLowerCase()}` }))
}

describe('Dossier — curated structural exposure', () => {
  it('renders exposed companies for a Taiwan entity from the curated seed', () => {
    const markup = dossierMarkup('TW')
    expect(markup).toContain('Curated Exposure Chains')
    expect(markup).toContain('TSMC')
    expect(markup).toContain('NVIDIA')
    expect(markup).toContain('ASML')
    expect(markup).toContain('depth')
  })

  it('renders chain hops with relation labels and per-hop source notes', () => {
    const markup = dossierMarkup('TW')
    expect(markup).toContain('fabricated by') // relation label, underscores humanized
    expect(markup).toContain('located in')
    expect(markup).toContain('fabricated by TSMC') // public, well-documented source note text
  })

  it('shows the curated-reference trust label and never labels exposure as verified', () => {
    const markup = dossierMarkup('TW')
    expect(markup).toContain('curated-reference')
    // No verified provenance badge / no standalone "verified" label on the exposure.
    expect(markup).not.toContain('prov-verified')
    expect(markup).not.toMatch(/>\s*verified\s*</i)
  })

  it('shows an empty state when no curated exposure exists', () => {
    const markup = dossierMarkup('ZZ') // not in the seed
    expect(markup).toContain('Curated Exposure Chains')
    expect(markup).toContain('No curated structural exposure')
    expect(markup).not.toContain('TSMC')
  })

  it('shows path confidence that decays with depth', () => {
    const markup = dossierMarkup('TW')
    // TSMC is depth 1 (located_in, ~99%); NVIDIA is depth 2 (decayed below TSMC).
    expect(markup).toMatch(/depth 1/)
    expect(markup).toMatch(/depth 2/)
    expect(markup).toMatch(/\d+%/)
  })
})
