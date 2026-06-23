import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WhatChangedTodayPanel } from '../src/components/intel/WhatChangedTodayPanel'
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
    countryCodes: [],
    region: 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'elevated') as Severity,
    confidence: partial.confidence ?? 92,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/${seq}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: 'hash',
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    nvdCve: partial.nvdCve,
    kevVulnerability: partial.kevVulnerability,
  } as WorldIntelEvent
}

// Given worldEvents with NVD + KEV + FRED + SEC.
function fourSourceEvents(): WorldIntelEvent[] {
  return [
    ev({
      sourceId: 'nvd_cve_public',
      title: 'CVE-2026-1001 — CRITICAL (CVSS 9.8)',
      severity: 'critical',
      confidence: 96,
      category: 'cyber-advisory',
      nvdCve: { cveId: 'CVE-2026-1001', vendorProducts: ['microsoft:windows'], inKnownExploitedCatalog: true } as WorldIntelEvent['nvdCve'],
    }),
    ev({
      sourceId: 'cisa_kev_public',
      title: 'CVE-2026-1001 added to CISA KEV',
      severity: 'critical',
      confidence: 96,
      category: 'cyber-advisory',
      narrativeTags: ['CISA KEV'],
      kevVulnerability: { cveId: 'CVE-2026-1001' } as WorldIntelEvent['kevVulnerability'],
    }),
    ev({ sourceId: 'macro_calendar_fred', title: 'Unemployment rose; payrolls slowed', category: 'macro-event', affectedSectors: ['labor'] }),
    ev({ sourceId: 'sec_edgar_public', title: 'Regional bank disclosed workforce reduction', category: 'filing', affectedSectors: ['labor'] }),
  ]
}

describe('WhatChangedTodayPanel (Command Center smoke)', () => {
  it('renders What Changed Today with ranked evidence from NVD + KEV + FRED + SEC', () => {
    const markup = renderToStaticMarkup(
      createElement(WhatChangedTodayPanel, { events: fourSourceEvents(), options: { now: NOW } }),
    )
    expect(markup).toContain('What Changed Today')
    expect(markup).toContain('ranked')
    expect(markup).toContain('Evidence')
    expect(markup).toContain('cyber')
    // Evidence trail surfaces the contributing sources.
    expect(markup).toContain('NVD')
    expect(markup).toContain('CISA KEV')
    // The cyber item leads with active-exploitation reasoning, not CVSS alone.
    expect(markup).toContain('Active exploitation confirmed')
    // Populated path must not show the empty state.
    expect(markup).not.toContain('No material change detected')
  })

  it('shows DATA_UNAVAILABLE when there are no events', () => {
    const markup = renderToStaticMarkup(
      createElement(WhatChangedTodayPanel, { events: [], options: { now: NOW } }),
    )
    expect(markup).toContain('What Changed Today')
    expect(markup).toContain('DATA_UNAVAILABLE')
    expect(markup).toContain('No material change detected')
  })
})
