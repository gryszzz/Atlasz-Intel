import { describe, expect, it } from 'vitest'
import { buildConnectorAudit, CONNECTOR_AUDIT_DEFINITIONS } from '../src/engine/runtimeAudit'
import { COVERAGE_REGISTRY, buildCoverageAudit } from '../src/engine/coverageAudit'
import type { OsintSourceSnapshot } from '../src/worldIntel'

const NOW = Date.parse('2026-06-18T12:00:00Z')

function source(partial: Partial<OsintSourceSnapshot> & { sourceId: string }): OsintSourceSnapshot {
  return {
    sourceName: partial.sourceId,
    sourceType: 'osint',
    endpointType: 'rest',
    endpoint: 'https://example.gov',
    pollIntervalMs: 60_000,
    rateLimitMs: 0,
    timeoutMs: 10_000,
    enabled: true,
    status: 'online',
    provenance: 'official-api',
    itemCount: 5,
    sourceReliabilityScore: 0.9,
    legalSafetyNote: '',
    parserAdapter: 'x',
    configured: true,
    lastSuccessAt: NOW - 60_000,
    ...partial,
  }
}

function audit(sources: OsintSourceSnapshot[] = []) {
  const connectorRows = buildConnectorAudit({ sources, events: [], now: NOW })
  return buildCoverageAudit({ connectorRows, now: NOW })
}

const KNOWN_CONNECTOR_IDS = new Set(CONNECTOR_AUDIT_DEFINITIONS.map((d) => d.id))

describe('market coverage audit', () => {
  it('never claims coverage without a real connector (no phantom coverage)', () => {
    for (const thing of COVERAGE_REGISTRY) {
      if (thing.provider === 'connector') {
        expect(thing.connectors.length).toBeGreaterThan(0)
        for (const id of thing.connectors) expect(KNOWN_CONNECTOR_IDS.has(id)).toBe(true)
      } else {
        expect(thing.connectors).toHaveLength(0)
      }
    }
  })

  it('every missing layer is honest: provider none + a reason', () => {
    const missing = audit().items.filter((i) => i.bucket === 'missing')
    expect(missing.length).toBeGreaterThan(0)
    for (const item of missing) {
      expect(item.provider).toBe('none')
      expect(item.missingReason && item.missingReason.length).toBeTruthy()
      expect(item.liveCovered).toBe(false)
    }
  })

  it('flags the known high-impact gaps', () => {
    const missingIds = new Set(audit().items.filter((i) => i.bucket === 'missing').map((i) => i.id))
    for (const id of ['price-forex', 'ownership-short-options', 'trade-movement', 'infra-tech-plants', 'risk-fire-drought-flood', 'macro-global-series']) {
      expect(missingIds.has(id)).toBe(true)
    }
  })

  it('promotes no-key public crypto into coverage without inventing recommendations', () => {
    const crypto = audit([source({ sourceId: 'coingecko_public_rest', status: 'online', provenance: 'public-unauthenticated' })]).items.find((i) => i.id === 'price-crypto')
    expect(crypto?.provider).toBe('connector')
    expect(crypto?.bucket).toBe('realtime')
    expect(crypto?.liveCovered).toBe(true)
    expect(crypto?.trustTier).toBe('public-unauthenticated')
    expect(crypto?.notes).toMatch(/no trading signal/i)
  })

  it('keeps public RSS market headlines in the media-observation bucket', () => {
    const media = audit([source({ sourceId: 'wsj_markets_rss', status: 'online', provenance: 'rss-public' })]).items.find((i) => i.id === 'media-market-rss')
    expect(media?.provider).toBe('connector')
    expect(media?.bucket).toBe('media-observation')
    expect(media?.liveCovered).toBe(false)
    expect(media?.notes).toMatch(/never become verified/i)
  })

  it('adds Fed/ECB release feeds without pretending global macro series are solved', () => {
    const a = audit([source({ sourceId: 'fed_press_rss', status: 'online', provenance: 'rss-public' })])
    const releases = a.items.find((i) => i.id === 'macro-central-bank-policy')
    const structuredGap = a.items.find((i) => i.id === 'macro-global-series')
    expect(releases?.bucket).toBe('daily')
    expect(releases?.trustTier).toBe('rss-public')
    expect(structuredGap?.bucket).toBe('missing')
  })

  it('is never "live" unless a realtime/near-realtime source is actually online', () => {
    // No sources at all -> nothing live.
    expect(audit().items.some((i) => i.liveCovered)).toBe(false)

    // A periodic connector online is NOT live (cadence gate).
    const periodic = audit([source({ sourceId: 'sec_form13f_public', status: 'online' })])
    expect(periodic.items.find((i) => i.id === 'ownership-institutions')?.liveCovered).toBe(false)

    // A near-realtime connector online IS live.
    const live = audit([source({ sourceId: 'noaa_alerts_public', status: 'online' })])
    const weather = live.items.find((i) => i.id === 'risk-weather')
    expect(weather?.liveCovered).toBe(true)
    expect(weather?.bucket).toBe('realtime')
  })

  it('curated structure is curated-reference, never live or counted as a connector', () => {
    const seeds = audit().items.find((i) => i.id === 'structure-seeds')
    expect(seeds?.bucket).toBe('curated-reference')
    expect(seeds?.liveCovered).toBe(false)
    expect(seeds?.provider).toBe('curated-seed')
  })

  it('media observation is its own bucket and never live coverage', () => {
    const media = audit([source({ sourceId: 'gdelt_doc_public', status: 'online' })]).items.find((i) => i.id === 'media-gdelt')
    expect(media?.bucket).toBe('media-observation')
    expect(media?.liveCovered).toBe(false)
  })

  it('key-gated connector with no snapshot is key-gated/configured, not covered-live', () => {
    // EIA power plants is key-gated; with no source snapshot the connector audit
    // reports missing-key -> coverage bucket key-gated-unconfigured.
    const a = audit()
    const power = a.items.find((i) => i.id === 'infra-power')
    expect(['key-gated-unconfigured', 'configured-only']).toContain(power?.bucket)
    expect(power?.liveCovered).toBe(false)
  })

  it('covers all 14 market layers and is deterministic', () => {
    const a = audit()
    const layers = new Set(a.items.map((i) => i.layer))
    expect(layers.size).toBe(14)
    expect(audit().items.length).toBe(audit().items.length)
    expect(a.summary.total).toBe(COVERAGE_REGISTRY.length)
    expect(a.summary.highRelevanceMissing).toBeGreaterThan(0)
  })
})
