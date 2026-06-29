import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConnectorDashboardPanel } from '../src/components/intel/ConnectorDashboardPanel'
import { ExposureDashboardPanel } from '../src/components/intel/ExposureDashboardPanel'
import { buildConnectorAudit, summarizeExposure } from '../src/engine/runtimeAudit'
import type { Severity } from '../src/data/intel'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')

function source(partial: Partial<OsintSourceSnapshot> & { sourceId: string }): OsintSourceSnapshot {
  return {
    sourceId: partial.sourceId,
    sourceName: partial.sourceName ?? partial.sourceId,
    sourceType: partial.sourceType ?? 'official-api',
    endpointType: partial.endpointType ?? 'rest',
    endpoint: partial.endpoint ?? `https://example.com/${partial.sourceId}`,
    pollIntervalMs: partial.pollIntervalMs ?? 60_000,
    rateLimitMs: partial.rateLimitMs ?? 0,
    timeoutMs: partial.timeoutMs ?? 5_000,
    enabled: partial.enabled ?? true,
    status: partial.status ?? 'online',
    provenance: partial.provenance ?? 'official-api',
    lastSuccessAt: partial.lastSuccessAt ?? NOW - 10 * 60_000,
    lastErrorAt: partial.lastErrorAt,
    lastError: partial.lastError,
    itemCount: partial.itemCount ?? 0,
    sourceReliabilityScore: partial.sourceReliabilityScore ?? 1,
    legalSafetyNote: partial.legalSafetyNote ?? 'test source',
    parserAdapter: partial.parserAdapter ?? 'test',
    category: partial.category,
    authType: partial.authType,
    configured: partial.configured,
    configHint: partial.configHint,
  }
}

function event(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  return {
    id: partial.id ?? `evt-${partial.sourceId}`,
    timestamp: partial.timestamp ?? NOW - 30 * 60_000,
    title: partial.title ?? 'Source-backed event',
    summary: '',
    countryCodes: partial.countryCodes ?? [],
    region: partial.region ?? 'global',
    category: partial.category ?? 'other',
    severity: (partial.severity ?? 'elevated') as Severity,
    confidence: partial.confidence ?? 96,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? `https://example.com/source/${partial.sourceId}`,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: [],
    extractedEntities: [],
    narrativeTags: [],
    rawPayloadHash: partial.rawPayloadHash ?? 'a'.repeat(64),
    dedupeHash: partial.dedupeHash ?? `dedupe-${partial.sourceId}`,
    secFiling: partial.secFiling,
    eiaEnergyRecord: partial.eiaEnergyRecord,
    githubRelease: partial.githubRelease,
  } as WorldIntelEvent
}

describe('runtime productization audit', () => {
  it('separates configured sources, missing keys, and stale/fail states', () => {
    const rows = buildConnectorAudit({
      now: NOW,
      sources: [
        source({ sourceId: 'sec_edgar_public', itemCount: 2, provenance: 'public-disclosure' }),
        source({
          sourceId: 'eia_energy_public',
          status: 'idle',
          configured: false,
          authType: 'api-key',
          configHint: 'Missing ATLASZ_EIA_API_KEY',
        }),
        source({
          sourceId: 'nvd_cve_public',
          status: 'online',
          lastSuccessAt: NOW - 4 * 24 * 60 * 60 * 1000,
          pollIntervalMs: 60_000,
        }),
        source({ sourceId: 'cisa_kev_public', status: 'rate-limited', lastError: '429 Too Many Requests' }),
      ],
      events: [event({ sourceId: 'sec_edgar_public' })],
    })

    expect(rows.find((row) => row.id === 'sec-edgar')?.status).toBe('online')
    expect(rows.find((row) => row.id === 'sec-edgar')?.recordCount).toBe(2)
    expect(rows.find((row) => row.id === 'eia')?.status).toBe('missing-key')
    expect(rows.find((row) => row.id === 'nvd')?.status).toBe('stale')
    expect(rows.find((row) => row.id === 'cisa-kev')?.status).toBe('rate-limited')
    // UN Comtrade is key-gated. OpenAlex is public and has no snapshot yet -> pending-first-fetch.
    expect(rows.find((row) => row.id === 'un-comtrade')?.status).toBe('missing-key')
    expect(rows.find((row) => row.id === 'openalex-works')?.status).toBe('pending-first-fetch')
  })

  it('distinguishes pending-first-fetch (public, implemented, no snapshot yet) from missing-key', () => {
    // Cold start: no source snapshots, no env keys.
    const rows = buildConnectorAudit({ now: NOW, sources: [], events: [] })

    // Public implemented connectors that simply have not polled yet -> pending-first-fetch.
    for (const id of ['fred', 'eia-bulk-public', 'usgs-earthquakes', 'cisa-kev', 'nvd', 'treasury-fiscal', 'noaa-alerts', 'federal-register', 'ofac-sdn', 'gdelt-doc', 'crossref-works', 'market-reference-master', 'un-locode', 'usgs-minerals']) {
      const row = rows.find((r) => r.id === id)
      expect(row?.status, id).toBe('pending-first-fetch')
      expect(row?.missingReason, id).toMatch(/waiting for first poll/i)
    }

    // Key-gated with no env key -> missing-key.
    for (const id of ['eia', 'eia-power-plants', 'eia-nuclear', 'eia-balancing-authorities', 'bea', 'uspto', 'un-comtrade', 'sec-form13f']) {
      expect(rows.find((r) => r.id === id)?.status, id).toBe('missing-key')
    }
    for (const id of ['congress-gov', 'openalex-works']) {
      expect(rows.find((r) => r.id === id)?.status, id).toBe('pending-first-fetch')
    }
  })

  it('a pending-first-fetch connector transitions to online after a successful fetch, and to failure states on error', () => {
    const online = buildConnectorAudit({
      now: NOW,
      sources: [source({ sourceId: 'usgs_significant_quakes', status: 'online', lastSuccessAt: NOW - 60_000, itemCount: 3 })],
      events: [],
    })
    expect(online.find((r) => r.id === 'usgs-earthquakes')?.status).toBe('online')

    const failed = buildConnectorAudit({
      now: NOW,
      sources: [source({ sourceId: 'cisa_kev_public', status: 'failed', lastError: 'HTTP 500' })],
      events: [],
    })
    expect(failed.find((r) => r.id === 'cisa-kev')?.status).toBe('failed')
  })

  it('summarizes today resolved exposure without upgrading curated-reference links to evidence', () => {
    const resolved = event({
      sourceId: 'sec_edgar_public',
      title: 'NVIDIA 8-K',
      affectedAssets: ['NVDA'],
      secFiling: {
        cik: '1045810',
        companyName: 'NVIDIA Corporation',
        accessionNumber: '0001045810-26-000001',
        formType: '8-K',
        ticker: 'NVDA',
      } as WorldIntelEvent['secFiling'],
    })
    const unresolved = event({ sourceId: 'noaa_alerts_public', title: 'Weather alert', countryCodes: ['US'] })

    const summary = summarizeExposure({ events: [resolved, unresolved], now: NOW })
    expect(summary.consideredEventCount).toBe(2)
    expect(summary.resolvedEventCount).toBe(1)
    expect(summary.unresolvedEventCount).toBe(1)
    expect(summary.curatedReferenceOnlyCount).toBe(1)
    expect(summary.recentResolvedEvents[0]?.exposureTrust).toBe('curated-reference')
    expect(summary.recentResolvedEvents[0]?.resolvedEntityIds).toContain('company:nvidia')
  })

  it('renders the connector dashboard with official source links and explicit not-wired state', () => {
    const markup = renderToStaticMarkup(
      createElement(ConnectorDashboardPanel, {
        sources: [source({ sourceId: 'sec_edgar_public', itemCount: 1, provenance: 'public-disclosure' })],
        events: [event({ sourceId: 'sec_edgar_public' })],
        now: NOW,
      }),
    )
    expect(markup).toContain('Connector Dashboard')
    expect(markup).toContain('SEC EDGAR')
    expect(markup).toContain('official source')
    expect(markup).toContain('UN Comtrade')
    expect(markup).toContain('missing key') // UN Comtrade is now key-gated, no key here
    expect(markup).toContain('OpenAlex')
    expect(markup).toContain('Crossref')
    expect(markup).toContain('Market Reference Master')
    expect(markup).toContain('SEC Form 13F')
    expect(markup).not.toContain('verified live')
  })

  it('renders the exposure dashboard with resolved/unresolved counts and honesty labels', () => {
    const markup = renderToStaticMarkup(
      createElement(ExposureDashboardPanel, {
        events: [
          event({ sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'] }),
          event({ sourceId: 'noaa_alerts_public', countryCodes: ['US'] }),
        ],
        now: NOW,
      }),
    )
    expect(markup).toContain('Resolved Today')
    expect(markup).toContain('resolver-rule')
    expect(markup).toContain('curated-reference')
    expect(markup).toContain('events considered')
    expect(markup).toContain('unresolved')
  })

  it('shows GDELT on the Connector Dashboard at the media-observation trust tier', () => {
    const markup = renderToStaticMarkup(
      createElement(ConnectorDashboardPanel, {
        sources: [source({ sourceId: 'gdelt_doc_public', status: 'online', itemCount: 3, provenance: 'media-observation' })],
        events: [event({ sourceId: 'gdelt_doc_public' })],
        now: NOW,
      }),
    )
    expect(markup).toContain('GDELT (media)')
    expect(markup).toContain('media observation')
    expect(markup).toContain('prov-tier-observed')
    expect(markup).not.toContain('prov-tier-verified')
  })

  it('renders GDELT stale and rate-limited connector states honestly', () => {
    const stale = buildConnectorAudit({
      now: NOW,
      sources: [source({ sourceId: 'gdelt_doc_public', status: 'online', lastSuccessAt: NOW - 4 * 24 * 60 * 60 * 1000, pollIntervalMs: 300_000 })],
      events: [],
    })
    expect(stale.find((row) => row.id === 'gdelt-doc')?.status).toBe('stale')

    const limited = buildConnectorAudit({
      now: NOW,
      sources: [source({ sourceId: 'gdelt_doc_public', status: 'rate-limited', lastError: 'HTTP 429' })],
      events: [],
    })
    const row = limited.find((r) => r.id === 'gdelt-doc')
    expect(row?.status).toBe('rate-limited')
    expect(row?.trust).toBe('media-observation')
  })
})
