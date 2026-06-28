import { describe, expect, it } from 'vitest'
import {
  WorldwatchLayerRegistry,
  adaptWorldwatchEventsToEntities,
  buildWorldwatchSelectionDossier,
  resolveWorldwatchRenderMode,
} from '../src/engine/worldwatchLayerRegistry'
import { WorldwatchAgentBus, WorldwatchDataBus, WorldwatchSelectionStore } from '../src/engine/worldwatchDataBus'
import type { OsintSourceSnapshot, WorldIntelEvent, WorldIntelSnapshot } from '../src/worldIntel'

const NOW = Date.parse('2026-06-27T12:00:00Z')

let seq = 0
function ev(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `ww-layer-${seq}`,
    timestamp: partial.timestamp ?? NOW,
    title: partial.title ?? 'Worldwatch event',
    summary: partial.summary ?? 'Source-backed event',
    countryCodes: partial.countryCodes ?? ['US'],
    region: partial.region ?? 'United States',
    lat: partial.lat,
    lon: partial.lon,
    category: partial.category ?? 'infrastructure',
    severity: partial.severity ?? 'watch',
    confidence: partial.confidence ?? 92,
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl,
    provenance: partial.provenance ?? 'official-api',
    affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: partial.affectedSectors ?? [],
    affectedCommodities: partial.affectedCommodities ?? [],
    affectedCurrencies: partial.affectedCurrencies ?? [],
    extractedEntities: partial.extractedEntities ?? [],
    narrativeTags: partial.narrativeTags ?? [],
    rawPayloadHash: partial.rawPayloadHash ?? `hash-${seq}`,
    dedupeHash: partial.dedupeHash ?? `dedupe-${seq}`,
    eiaFacility: partial.eiaFacility,
    gdeltArticle: partial.gdeltArticle,
    etfHolding: partial.etfHolding,
    marketIdentity: partial.marketIdentity,
  } as WorldIntelEvent
}

function powerPlant(partial: Partial<NonNullable<WorldIntelEvent['eiaFacility']>> = {}): NonNullable<WorldIntelEvent['eiaFacility']> {
  return {
    id: partial.id ?? 'plant-1',
    facilityId: partial.facilityId ?? '100',
    facilityName: partial.facilityName ?? 'Proof Plant',
    facilityKind: 'power-plant',
    latitude: partial.latitude ?? 29.76,
    longitude: partial.longitude ?? -95.36,
    geospatialPrecision: partial.geospatialPrecision ?? 'exact',
    sourceDataset: 'EIA generator inventory',
    sourceUrl: 'https://www.eia.gov/electricity/data/eia860m/',
    sourceApiUrl: 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/',
    sourceName: 'EIA',
    retrievedAt: partial.retrievedAt ?? NOW,
    staleAt: partial.staleAt ?? NOW + 24 * 60 * 60 * 1000,
    provenance: 'official-api',
    confidence: 94,
    rawPayloadHash: partial.rawPayloadHash ?? 'facility-hash',
  }
}

function source(partial: Partial<OsintSourceSnapshot> & { sourceId: string }): OsintSourceSnapshot {
  return {
    sourceId: partial.sourceId,
    sourceName: partial.sourceName ?? partial.sourceId,
    sourceType: partial.sourceType ?? 'official',
    endpointType: partial.endpointType ?? 'rest',
    endpoint: partial.endpoint ?? 'https://example.com',
    pollIntervalMs: 60_000,
    rateLimitMs: 1_000,
    timeoutMs: 10_000,
    enabled: partial.enabled ?? true,
    status: partial.status ?? 'online',
    provenance: partial.provenance ?? 'official-api',
    itemCount: partial.itemCount ?? 0,
    sourceReliabilityScore: partial.sourceReliabilityScore ?? 0.9,
    legalSafetyNote: partial.legalSafetyNote ?? 'public official source',
    parserAdapter: partial.parserAdapter ?? 'managed-ingest',
    configured: partial.configured,
    configHint: partial.configHint,
  }
}

function snapshot(events: WorldIntelEvent[], sources: OsintSourceSnapshot[]): WorldIntelSnapshot {
  return {
    updatedAt: NOW,
    worldEvents: events,
    sources,
    countries: [],
    assetIdentities: [],
    marketIdentities: [],
    secFilings: [],
    fredObservations: [],
    treasuryFiscalRecords: [],
    beaObservations: [],
    eiaEnergyRecords: [],
    favorites: [],
  } as WorldIntelSnapshot
}

describe('Worldwatch layer registry', () => {
  it('accepts only proof-backed records', () => {
    const good = ev({ id: 'good', sourceId: 'eia-power-plants', eiaFacility: powerPlant(), sourceUrl: undefined })
    const noProof = ev({
      id: 'no-proof',
      sourceId: 'eia-power-plants',
      rawPayloadHash: '',
      eiaFacility: powerPlant({ rawPayloadHash: '' }),
      sourceUrl: undefined,
    })

    const entities = adaptWorldwatchEventsToEntities([noProof, good], { now: NOW })

    expect(entities).toHaveLength(1)
    expect(entities[0].eventId).toBe('good')
    expect(entities[0].proof.sourceUrl).toMatch(/^https:\/\/www\.eia\.gov\//)
  })

  it('marks stale entities stale without hiding them', () => {
    const stale = ev({
      id: 'stale',
      sourceId: 'eia-power-plants',
      eiaFacility: powerPlant({ staleAt: NOW - 1 }),
      sourceUrl: undefined,
    })

    const [entity] = adaptWorldwatchEventsToEntities([stale], { now: NOW })

    expect(entity.stale).toBe(true)
    expect(entity.layerId).toBe('power-plants')
  })

  it('disables missing-key layers with an explicit reason', () => {
    const registry = new WorldwatchLayerRegistry()
    const layers = registry.materialize(
      snapshot([], [
        source({
          sourceId: 'lng-terminals',
          status: 'disabled',
          configured: false,
          configHint: 'missing ATLASZ_LNG_TERMINALS_URL',
        }),
      ]),
      { now: NOW },
    ).layers

    const lng = layers.find((layer) => layer.id === 'lng-terminals')
    expect(lng?.status).toBe('missing-config')
    expect(lng?.disabledReason).toContain('ATLASZ_LNG_TERMINALS_URL')
  })

  it('keeps media observations visually low-trust', () => {
    const media = ev({
      id: 'media',
      sourceId: 'gdelt-doc',
      provenance: 'media-observation',
      gdeltArticle: {
        id: 'article-1',
        title: 'Article mentions port disruption',
        url: 'https://news.example.com/article',
        domain: 'news.example.com',
        queryBucket: 'ports',
        seenDate: '20260627',
        seenTimestamp: NOW,
        sourceApiUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
        sourceName: 'GDELT',
        retrievedAt: NOW,
        provenance: 'media-observation',
        confidence: 94,
        rawPayloadHash: 'gdelt-hash',
      },
    })

    const [entity] = adaptWorldwatchEventsToEntities([media], { now: NOW })

    expect(entity.layerId).toBe('media-observations')
    expect(entity.visualTrust).toBe('media')
    expect(entity.proof.provenance).toBe('media-observation')
    expect(entity.nonClaims.join(' ')).toMatch(/not verified fact/i)
  })

  it('keeps curated exposure structural and never labels it verified', () => {
    const structural = ev({
      id: 'etf',
      sourceId: 'etf-holdings',
      provenance: 'local-derived',
      etfHolding: {
        id: 'holding-1',
        fundTicker: 'SOXX',
        fundName: 'Semiconductor ETF',
        issuer: 'Issuer',
        sourceDate: '2026-06-27',
        sourceTimestamp: NOW,
        holdingName: 'NVIDIA',
        holdingTicker: 'NVDA',
        sourceUrl: 'https://issuer.example.com/holdings.csv',
        sourceName: 'ETF issuer',
        retrievedAt: NOW,
        staleAt: NOW + 24 * 60 * 60 * 1000,
        provenance: 'local-derived',
        confidence: 90,
        changeType: 'unchanged',
        rawPayloadHash: 'etf-hash',
      },
    })

    const [entity] = adaptWorldwatchEventsToEntities([structural], { now: NOW })

    expect(entity.layerId).toBe('etf-holdings')
    expect(entity.visualTrust).toBe('structural')
    expect(JSON.stringify(entity).toLowerCase()).not.toContain('verified')
  })

  it('opens a selected facility dossier with source proof and non-claims', () => {
    const event = ev({ id: 'facility', sourceId: 'eia-power-plants', eiaFacility: powerPlant(), sourceUrl: undefined })
    const [entity] = adaptWorldwatchEventsToEntities([event], { now: NOW })
    const dossier = buildWorldwatchSelectionDossier(entity)

    expect(dossier.sourceTrail.sourceUrl).toMatch(/^https:\/\//)
    expect(dossier.nonClaims.join(' ')).toMatch(/no outage/i)
  })

  it('supports local agent bus selection without network claims', () => {
    const event = ev({ id: 'facility-agent', sourceId: 'eia-power-plants', eiaFacility: powerPlant(), sourceUrl: undefined })
    const [entity] = adaptWorldwatchEventsToEntities([event], { now: NOW })
    const dossier = buildWorldwatchSelectionDossier(entity)
    const dataBus = new WorldwatchDataBus()
    const selectionStore = new WorldwatchSelectionStore()
    const agentBus = new WorldwatchAgentBus(dataBus, selectionStore)
    let selected = ''
    const unsubscribe = dataBus.on('select', (selection) => {
      selected = selection?.entity.id ?? ''
    })

    agentBus.dispatch({ type: 'select-entity', dossier })

    expect(selectionStore.getSnapshot()?.entity.id).toBe(entity.id)
    expect(selected).toBe(entity.id)
    unsubscribe()
  })

  it('opens selected companies as exposure context, not map facts', () => {
    const company = ev({
      id: 'company',
      sourceId: 'market-reference-master',
      provenance: 'public-disclosure',
      marketIdentity: {
        id: 'nvda',
        ticker: 'NVDA',
        cik: '1045810',
        cikPadded: '0001045810',
        legalName: 'NVIDIA CORP',
        aliases: [],
        sourceUrl: 'https://www.sec.gov/files/company_tickers.json',
        sourceName: 'SEC',
        retrievedAt: NOW,
        staleAt: NOW + 24 * 60 * 60 * 1000,
        provenance: 'public-disclosure',
        confidence: 92,
        rawPayloadHash: 'identity-hash',
      },
    })

    const [entity] = adaptWorldwatchEventsToEntities([company], { now: NOW })

    expect(entity.layerId).toBe('market-evidence')
    expect(entity.geometry).toBe('context')
    expect(entity.exposureContext).toContain('NVIDIA CORP')
  })

  it('keeps unavailable layers visible instead of returning a blank registry', () => {
    const layers = new WorldwatchLayerRegistry().materialize(snapshot([], []), { now: NOW }).layers

    expect(layers.length).toBeGreaterThan(5)
    expect(layers.every((layer) => layer.disabledReason)).toBe(true)
  })

  it('reports the WebGL-unavailable fallback mode honestly', () => {
    expect(resolveWorldwatchRenderMode({ webglAvailable: false })).toBe('webgl-unavailable-fallback')
    expect(resolveWorldwatchRenderMode({ webglAvailable: true })).toBe('atlasz-2d-fallback')
  })
})
