import { describe, expect, it } from 'vitest'
import { buildWorldTradeMarketOverview } from '../src/engine/worldTradeMarketOverview'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-27T12:00:00Z')

function source(partial: Partial<OsintSourceSnapshot> & { sourceId: string }): OsintSourceSnapshot {
  return {
    sourceId: partial.sourceId,
    sourceName: partial.sourceName ?? partial.sourceId,
    sourceType: 'official',
    endpointType: 'rest',
    endpoint: 'https://example.gov',
    pollIntervalMs: 60_000,
    rateLimitMs: 1_000,
    timeoutMs: 10_000,
    enabled: true,
    status: partial.status ?? 'online',
    provenance: partial.provenance ?? 'official-api',
    itemCount: partial.itemCount ?? 1,
    sourceReliabilityScore: 0.9,
    legalSafetyNote: 'source-backed only',
    parserAdapter: 'managed-ingest',
    configured: partial.configured,
    ...partial,
  }
}

function event(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  return {
    id: partial.id ?? `event-${partial.sourceId}`,
    timestamp: partial.timestamp ?? NOW,
    title: partial.title ?? 'Source-backed event',
    summary: partial.summary ?? 'Proof-backed row',
    countryCodes: partial.countryCodes ?? ['US'],
    region: partial.region ?? 'United States',
    category: partial.category ?? 'other',
    severity: partial.severity ?? 'watch',
    confidence: partial.confidence ?? 0.9,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl ?? 'https://example.gov/proof',
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: partial.affectedCurrencies ?? [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: partial.rawPayloadHash ?? 'hash',
    dedupeHash: partial.dedupeHash ?? 'dedupe',
    comtradeRecord: partial.comtradeRecord,
    worldPort: partial.worldPort,
    gdeltArticle: partial.gdeltArticle,
  } as WorldIntelEvent
}

describe('world trade market overview', () => {
  it('does not invent trade corridors when Comtrade evidence is absent', () => {
    const overview = buildWorldTradeMarketOverview({
      events: [
        event({
          sourceId: 'world-port-index',
          worldPort: {
            id: 'port-1',
            portNumber: '1',
            portName: 'Proof Port',
            country: 'United States',
            sourceDataset: 'World Port Index',
            sourceUrl: 'https://msi.nga.mil/Publications/WPI',
            sourceApiUrl: 'https://msi.nga.mil/Publications/WPI',
            sourceName: 'NGA',
            retrievedAt: NOW,
            staleAt: NOW + 86_400_000,
            provenance: 'official-api',
            confidence: 0.9,
            rawPayloadHash: 'port-hash',
            geospatialPrecision: 'exact',
          },
        }),
      ],
      sources: [source({ sourceId: 'world-port-index' })],
    })

    expect(overview.corridors).toHaveLength(0)
    expect(overview.ports).toHaveLength(1)
    expect(overview.unknowns).toContain('No live trade-flow rows are in the current view; do not infer corridors.')
  })

  it('renders Comtrade rows as official country/commodity evidence only', () => {
    const overview = buildWorldTradeMarketOverview({
      events: [
        event({
          sourceId: 'un-comtrade',
          category: 'macro',
          comtradeRecord: {
            id: 'flow-1',
            datasetCode: 'C-A-HS',
            typeCode: 'C',
            freqCode: 'A',
            classification: 'HS',
            commodityCode: '8542',
            commodityDescription: 'Electronic integrated circuits',
            reporterCode: '842',
            reporterDesc: 'United States',
            partnerCode: '156',
            partnerDesc: 'China',
            flowCode: 'M',
            flowDesc: 'Imports',
            period: '2025',
            refYear: 2025,
            tradeValue: 1_500_000_000,
            sourceUrl: 'https://comtradeplus.un.org/',
            sourceApiUrl: 'https://comtradeapi.un.org/data/v1/get/C/A/HS',
            sourceName: 'UN Comtrade',
            retrievedAt: NOW,
            provenance: 'official-api',
            confidence: 0.95,
            changeType: 'new_today',
            rawPayloadHash: 'flow-hash',
          },
        }),
      ],
      sources: [source({ sourceId: 'un-comtrade' })],
    })

    expect(overview.corridors).toMatchObject([
      {
        reporter: 'United States',
        partner: 'China',
        commodity: 'Electronic integrated circuits',
        flow: 'Imports',
        valueLabel: '$1.5B',
      },
    ])
    expect(overview.layers.find((layer) => layer.id === 'trade-flows')?.nonClaim).toMatch(/no company supply-chain inference/i)
  })

  it('keeps media observation low-trust and visible as a separate layer', () => {
    const overview = buildWorldTradeMarketOverview({
      events: [
        event({
          sourceId: 'gdelt-doc',
          provenance: 'media-observation',
          gdeltArticle: {
            id: 'article-1',
            title: 'Article mentions a shipping route',
            url: 'https://news.example.com/route',
            domain: 'news.example.com',
            queryBucket: 'trade',
            seenDate: '20260627',
            seenTimestamp: NOW,
            sourceApiUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
            sourceName: 'GDELT',
            retrievedAt: NOW,
            provenance: 'media-observation',
            confidence: 0.4,
            rawPayloadHash: 'media-hash',
          },
        }),
      ],
      sources: [source({ sourceId: 'gdelt-doc', provenance: 'media-observation' })],
    })

    const media = overview.layers.find((layer) => layer.id === 'media-observation')
    expect(media?.trustTier).toBe('media-observation')
    expect(media?.recordCount).toBe(1)
    expect(media?.nonClaim).toMatch(/cannot verify an event/i)
  })
})
