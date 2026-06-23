import { describe, expect, it } from 'vitest'
import {
  INTELLIGENCE_DOMAINS,
  INTELLIGENCE_SOURCES,
  lookupIntelligenceSource,
  sourceCanAutoWireWithoutCredentials,
  sourceIsRuntimeEligible,
  sourcesForDomain,
  summarizeIntelligenceCatalog,
  type IntelligenceDomainId,
} from '../src/intelligenceSourceCatalog'
import { isCanonicalProvenance } from '../src/provenance'

const requestedDomains: IntelligenceDomainId[] = [
  'financial-markets',
  'economic-data',
  'central-banks',
  'semiconductor-intelligence',
  'global-trade',
  'corporate-intelligence',
  'aviation-intelligence',
  'space-intelligence',
  'geospatial-intelligence',
  'energy-intelligence',
  'geopolitical-intelligence',
  'patent-intelligence',
  'ai-intelligence',
  'academic-research',
  'github-intelligence',
  'cryptocurrency-intelligence',
  'internet-infrastructure',
  'real-time-news-wires',
  'weather-natural-events',
  'osint-governance',
  'threat-intelligence',
  'agent-frameworks',
]

describe('intelligence source catalog', () => {
  it('covers the full Atlasz intelligence backbone beyond OSINT', () => {
    expect(INTELLIGENCE_DOMAINS.map((domain) => domain.id)).toEqual(expect.arrayContaining(requestedDomains))

    for (const domain of requestedDomains) {
      expect(sourcesForDomain(domain).length).toBeGreaterThan(0)
    }

    expect(sourcesForDomain('semiconductor-intelligence').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining([
        'tsmc-official',
        'samsung-semiconductor-official',
        'intel-foundry-official',
        'asml-official',
        'applied-materials-official',
        'lam-research-official',
        'kla-official',
      ]),
    )
    expect(sourcesForDomain('corporate-intelligence').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(['crunchbase', 'opencorporates', 'glassdoor', 'linkedin']),
    )
    expect(sourcesForDomain('aviation-intelligence').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(['adsb-exchange', 'flightradar24', 'flightaware']),
    )
    expect(sourcesForDomain('geospatial-intelligence').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(['openstreetmap', 'nasa-earthdata-geospatial', 'usgs-earth-explorer', 'esa-sentinel', 'planet', 'google-earth-engine']),
    )
    expect(sourcesForDomain('internet-infrastructure').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(['bgp-he', 'cloudflare-radar', 'shodan', 'censys', 'urlscan', 'virustotal']),
    )
    expect(sourcesForDomain('weather-natural-events').map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(['weather-gov', 'usgs-earthquake', 'national-hurricane-center', 'noaa']),
    )
  })

  it('keeps every source typed, source-trailed, and provenance-labeled', () => {
    const ids = new Set<string>()
    for (const source of INTELLIGENCE_SOURCES) {
      expect(ids.has(source.sourceId)).toBe(false)
      ids.add(source.sourceId)
      expect(source.label.length).toBeGreaterThan(2)
      expect(source.upstreamUrl).toMatch(/^(https?:\/\/|http:\/\/localhost)/)
      expect(source.feedTypes.length).toBeGreaterThan(0)
      expect(source.keySignals.length).toBeGreaterThan(0)
      expect(source.legalSafetyNote.length).toBeGreaterThan(20)
      expect(isCanonicalProvenance(source.provenance)).toBe(true)
    }
  })

  it('marks official macro, patent, AI, and space sources as candidate or gated adapters', () => {
    expect(lookupIntelligenceSource('sec-edgar-company-filings')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      provenance: 'official-api',
      envKeysRequired: ['ATLASZ_SEC_USER_AGENT'],
    })
    expect(lookupIntelligenceSource('sec-company-tickers-json')).toMatchObject({
      accessModel: 'public-no-auth',
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(lookupIntelligenceSource('fred-economic-data')).toMatchObject({
      integrationMode: 'auth-gated-adapter',
      envKeysRequired: ['ATLASZ_FRED_API_KEY'],
    })
    expect(lookupIntelligenceSource('treasury-fiscal-data')).toMatchObject({
      accessModel: 'public-no-auth',
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(lookupIntelligenceSource('eia-api')).toMatchObject({
      accessModel: 'public-requires-key',
      integrationMode: 'auth-gated-adapter',
      provenance: 'official-api',
      envKeysRequired: ['ATLASZ_EIA_API_KEY'],
    })
    expect(lookupIntelligenceSource('bls-public-data-api')).toMatchObject({
      accessModel: 'public-no-auth',
      integrationMode: 'runtime-wired',
    })
    expect(lookupIntelligenceSource('uspto-apis')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      provenance: 'official-api',
    })
    expect(lookupIntelligenceSource('congress-gov')).toMatchObject({
      accessModel: 'public-requires-key',
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
      envKeysRequired: ['ATLASZ_CONGRESS_API_KEY'],
    })
    expect(lookupIntelligenceSource('arxiv-api')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      accessModel: 'public-no-auth',
    })
    expect(lookupIntelligenceSource('celestrak-gp-data')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      accessModel: 'public-no-auth',
    })
    expect(lookupIntelligenceSource('semantic-scholar')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      accessModel: 'public-no-auth',
    })
    expect(lookupIntelligenceSource('openalex-api')).toMatchObject({
      accessModel: 'public-requires-key',
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
      envKeysRequired: ['ATLASZ_OPENALEX_API_KEY'],
    })
    expect(lookupIntelligenceSource('crossref-rest-api')).toMatchObject({
      accessModel: 'public-no-auth',
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(lookupIntelligenceSource('weather-gov')).toMatchObject({
      integrationMode: 'runtime-wired',
      provenance: 'official-api',
    })
    expect(lookupIntelligenceSource('cloudflare-radar')).toMatchObject({
      integrationMode: 'candidate-public-adapter',
      accessModel: 'public-no-auth',
    })
  })

  it('blocks or gates risky/commercial/person-enrichment sources by default', () => {
    for (const id of ['n2yo-satellites', 'opencti', 'misp', 'yeti', 'shodan', 'censys', 'urlscan', 'virustotal']) {
      const source = lookupIntelligenceSource(id)
      expect(source).toBeDefined()
      expect(sourceCanAutoWireWithoutCredentials(source!)).toBe(false)
      expect(sourceIsRuntimeEligible(source!)).toBe(true)
    }

    for (const id of ['marinetraffic', 'crunchbase', 'adsb-exchange', 'flightradar24', 'flightaware', 'planet', 'reuters', 'bloomberg', 'financial-times', 'wall-street-journal']) {
      expect(lookupIntelligenceSource(id)).toMatchObject({
        accessModel: 'commercial-gated',
        integrationMode: 'commercial-gated',
      })
      expect(sourceCanAutoWireWithoutCredentials(lookupIntelligenceSource(id)!)).toBe(false)
      expect(sourceIsRuntimeEligible(lookupIntelligenceSource(id)!)).toBe(false)
    }

    for (const id of ['holehe', 'toutatis', 'photon', 'theharvester', 'linkedin']) {
      const source = lookupIntelligenceSource(id)
      expect(source).toBeDefined()
      expect(sourceCanAutoWireWithoutCredentials(source!)).toBe(false)
    }

    expect(lookupIntelligenceSource('holehe')).toMatchObject({ integrationMode: 'blocked' })
    expect(lookupIntelligenceSource('toutatis')).toMatchObject({ integrationMode: 'blocked' })
    expect(lookupIntelligenceSource('linkedin')).toMatchObject({ integrationMode: 'blocked' })
  })

  it('summarizes coverage for future Data Core / source health surfaces', () => {
    const summary = summarizeIntelligenceCatalog()

    expect(summary.domainCount).toBeGreaterThanOrEqual(requestedDomains.length)
    expect(summary.sourceCount).toBe(INTELLIGENCE_SOURCES.length)
    expect(summary.runtimeEligibleCount).toBeGreaterThan(20)
    expect(summary.credentiallessAutoWireCount).toBeGreaterThan(10)
    expect(summary.byDomain['semiconductor-intelligence']).toBe(7)
    expect(summary.byMode.blocked).toBeGreaterThanOrEqual(2)
  })
})
