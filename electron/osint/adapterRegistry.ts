/*
 * Adapter registry. Maps a provider's `adapter` id to a reusable fetcher that
 * normalizes into WorldIntelEvent. Credentialed adapters resolve their config
 * here and return no fetcher (fail-closed) when unconfigured. `managed-ingest`
 * providers are registered for health visibility but ingested elsewhere.
 */
import type { ProviderDefinition } from '../providers/providerConfig'
import type { WorldIntelEvent } from '../../src/worldIntel'
import { fetchGdeltEvents } from './adapters/gdeltAdapter'
import { fetchSecFilings, readSecConfig } from './adapters/secEdgarAdapter'
import { fetchMacroCalendar, readMacroConfig } from './adapters/macroCalendarAdapter'
import { fetchNoaaAlerts, readNoaaAlertConfig } from './adapters/noaaAlertAdapter'
import { fetchUsptoPatents, readUsptoPatentConfig } from './adapters/usptoPatentAdapter'
import { fetchFederalRegisterDocuments, readFederalRegisterConfig } from './adapters/federalRegisterAdapter'
import { fetchOfacSanctions, readOfacSanctionsConfig } from './adapters/ofacSanctionsAdapter'
import { fetchCongressGovBills, readCongressGovConfig } from './adapters/congressGovAdapter'
import { fetchComtradeEvents, readComtradeConfig } from './adapters/comtradeAdapter'
import { fetchOpenAlexWorks, readOpenAlexConfig } from './adapters/openAlexAdapter'
import { fetchSecCompanyFacts, readCompanyFactsConfig } from './adapters/secCompanyFactsAdapter'
import { fetchSecForm4, readForm4Config } from './adapters/secForm4Adapter'
import { fetchSecForm13F, readForm13FConfig } from './adapters/secForm13FAdapter'
import { fetchEtfHoldings, readEtfHoldingsConfig } from './adapters/etfHoldingsAdapter'
import { fetchCrossrefWorks, readCrossrefConfig } from './adapters/crossrefAdapter'
import { fetchMarketReference, readMarketReferenceConfig } from './adapters/marketReferenceAdapter'
import { fetchTreasuryFiscalData, readTreasuryFiscalConfig } from './adapters/treasuryFiscalAdapter'
import { fetchBlsObservations, readBlsConfig } from './adapters/blsAdapter'
import { fetchBeaObservations, readBeaConfig } from './adapters/beaAdapter'
import { fetchEiaEnergyRecords, readEiaEnergyConfig } from './adapters/eiaEnergyAdapter'
import { fetchEiaFacilities, readEiaFacilityConfig } from './adapters/eiaFacilityAdapter'
import { fetchEiaRefineries, readEiaRefineryConfig } from './adapters/eiaRefineryAdapter'
import { fetchLngTerminals, readLngTerminalConfig } from './adapters/lngTerminalAdapter'
import { fetchEiaNuclearPlants, readEiaNuclearConfig } from './adapters/eiaNuclearAdapter'
import { fetchNrcReactorStatus, readNrcReactorStatusConfig } from './adapters/nrcReactorStatusAdapter'
import { fetchEiaBalancingAuthorities, readEiaBalancingAuthorityConfig } from './adapters/eiaBalancingAuthorityAdapter'
import { fetchUnLocodes, readUnLocodeConfig } from './adapters/unLocodeAdapter'
import { fetchWorldPortIndex, readWorldPortIndexConfig } from './adapters/worldPortIndexAdapter'
import { fetchUsgsEarthquakes, readUsgsQuakeConfig } from './adapters/usgsQuakeAdapter'
import { fetchKevVulnerabilities, readKevConfig } from './adapters/cisaKevAdapter'
import { fetchNvdCves, readNvdConfig } from './adapters/nvdCveAdapter'
import { fetchGithubAdvisories, readGithubAdvisoryConfig } from './adapters/githubAdvisoryAdapter'
import { fetchOsvVulnerabilities, readOsvConfig } from './adapters/osvAdapter'
import { fetchCisaAdvisories, readCisaAdvisoryConfig } from './adapters/cisaAdvisoryAdapter'
import { fetchGithubReleases, readGithubReleaseConfig } from './adapters/githubReleaseAdapter'
import { fetchPoliticianDisclosures, readPoliticianConfig } from './adapters/politicianTradeAdapter'
import { fetchRssFeed } from './adapters/rssAdapter'
import { fetchCustomJson } from './adapters/customJsonAdapter'

export type SourceFetcher = (signal: AbortSignal) => Promise<WorldIntelEvent[]>

export type ResolvedAdapter = {
  fetcher?: SourceFetcher
  /** Credential/endpoint requirement satisfied. */
  configured: boolean
  /** Ingestion handled by another subsystem (no fetcher in this registry). */
  managed: boolean
}

export const KNOWN_ADAPTERS = [
  'gdelt',
  'sec-edgar',
  'fred-macro',
  'noaa-alerts',
  'federal-register',
  'ofac-sdn',
  'congress-gov',
  'un-comtrade',
  'openalex-works',
  'crossref-works',
  'market-reference-sec',
  'sec-company-facts',
  'sec-form4',
  'sec-form13f',
  'etf-holdings',
  'treasury-fiscal',
  'bls',
  'bea',
  'eia-energy',
  'eia-power-plants',
  'eia-refineries',
  'lng-terminals',
  'eia-nuclear',
  'nrc-reactor-status',
  'eia-balancing-authorities',
  'un-locode',
  'world-port-index',
  'usgs-quakes',
  'uspto-patents',
  'cisa-kev',
  'nvd-cve',
  'github-ghsa',
  'osv-dev',
  'cisa-advisories',
  'github-releases',
  'public-disclosure-json',
  'rss',
  'custom-json',
  'managed-ingest',
  'disabled',
] as const

export function resolveAdapter(provider: ProviderDefinition, env: NodeJS.ProcessEnv = process.env): ResolvedAdapter {
  switch (provider.adapter) {
    case 'gdelt':
      return { fetcher: fetchGdeltEvents, configured: true, managed: false }
    case 'sec-edgar': {
      const config = readSecConfig(env)
      return { fetcher: config ? (signal) => fetchSecFilings(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'fred-macro': {
      const config = readMacroConfig(env)
      return { fetcher: config ? (signal) => fetchMacroCalendar(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'noaa-alerts': {
      const config = readNoaaAlertConfig(env)
      return { fetcher: config ? (signal) => fetchNoaaAlerts(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'federal-register': {
      const config = readFederalRegisterConfig(env)
      return { fetcher: config ? (signal) => fetchFederalRegisterDocuments(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'ofac-sdn': {
      const config = readOfacSanctionsConfig(env)
      return { fetcher: config ? (signal) => fetchOfacSanctions(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'congress-gov': {
      const config = readCongressGovConfig(env)
      return { fetcher: config ? (signal) => fetchCongressGovBills(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'un-comtrade': {
      const config = readComtradeConfig(env)
      return { fetcher: config ? (signal) => fetchComtradeEvents(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'openalex-works': {
      const config = readOpenAlexConfig(env)
      return { fetcher: config ? (signal) => fetchOpenAlexWorks(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'crossref-works': {
      const config = readCrossrefConfig(env)
      return { fetcher: config ? (signal) => fetchCrossrefWorks(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'market-reference-sec': {
      const config = readMarketReferenceConfig(env)
      return { fetcher: config ? (signal) => fetchMarketReference(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'sec-company-facts': {
      const config = readCompanyFactsConfig(env)
      return { fetcher: config ? (signal) => fetchSecCompanyFacts(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'sec-form4': {
      const config = readForm4Config(env)
      return { fetcher: config ? (signal) => fetchSecForm4(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'sec-form13f': {
      const config = readForm13FConfig(env)
      return { fetcher: config ? (signal) => fetchSecForm13F(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'etf-holdings': {
      const config = readEtfHoldingsConfig(env)
      return { fetcher: config ? (signal) => fetchEtfHoldings(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'treasury-fiscal': {
      const config = readTreasuryFiscalConfig(env)
      return { fetcher: (signal) => fetchTreasuryFiscalData(signal, config), configured: true, managed: false }
    }
    case 'bls': {
      const config = readBlsConfig(env)
      return { fetcher: config ? (signal) => fetchBlsObservations(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'bea': {
      const config = readBeaConfig(env)
      return { fetcher: config ? (signal) => fetchBeaObservations(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'eia-energy': {
      const config = readEiaEnergyConfig(env)
      return { fetcher: config ? (signal) => fetchEiaEnergyRecords(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'eia-power-plants': {
      const config = readEiaFacilityConfig(env)
      return { fetcher: config ? (signal) => fetchEiaFacilities(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'eia-refineries': {
      const config = readEiaRefineryConfig(env)
      return { fetcher: config ? (signal) => fetchEiaRefineries(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'lng-terminals': {
      const config = readLngTerminalConfig(env)
      return { fetcher: config ? (signal) => fetchLngTerminals(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'eia-nuclear': {
      const config = readEiaNuclearConfig(env)
      return { fetcher: config ? (signal) => fetchEiaNuclearPlants(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'nrc-reactor-status': {
      const config = readNrcReactorStatusConfig(env)
      return { fetcher: config ? (signal) => fetchNrcReactorStatus(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'eia-balancing-authorities': {
      const config = readEiaBalancingAuthorityConfig(env)
      return { fetcher: config ? (signal) => fetchEiaBalancingAuthorities(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'un-locode': {
      const config = readUnLocodeConfig(env)
      return { fetcher: config ? (signal) => fetchUnLocodes(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'world-port-index': {
      const config = readWorldPortIndexConfig(env)
      return { fetcher: config ? (signal) => fetchWorldPortIndex(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'usgs-quakes': {
      const config = readUsgsQuakeConfig(env)
      return { fetcher: config ? (signal) => fetchUsgsEarthquakes(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'uspto-patents': {
      const config = readUsptoPatentConfig(env)
      return { fetcher: config ? (signal) => fetchUsptoPatents(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'cisa-kev': {
      const config = readKevConfig(env)
      return { fetcher: config ? (signal) => fetchKevVulnerabilities(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'nvd-cve': {
      const config = readNvdConfig(env)
      return { fetcher: config ? (signal) => fetchNvdCves(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'github-ghsa': {
      const config = readGithubAdvisoryConfig(env)
      return { fetcher: config ? (signal) => fetchGithubAdvisories(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'osv-dev': {
      const config = readOsvConfig(env)
      return { fetcher: config ? (signal) => fetchOsvVulnerabilities(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'cisa-advisories': {
      const config = readCisaAdvisoryConfig(env)
      return { fetcher: config ? (signal) => fetchCisaAdvisories(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'github-releases': {
      const config = readGithubReleaseConfig(env)
      return { fetcher: config ? (signal) => fetchGithubReleases(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'public-disclosure-json': {
      const config = readPoliticianConfig(env)
      return { fetcher: config ? (signal) => fetchPoliticianDisclosures(signal, config) : undefined, configured: config !== null, managed: false }
    }
    case 'rss': {
      const ok = isPublicUrl(provider.endpoint)
      return {
        fetcher: ok
          ? (signal) =>
              fetchRssFeed(signal, {
                url: provider.endpoint as string,
                sourceId: provider.providerId,
                sourceName: provider.providerName,
                provenance: provider.provenance,
              })
          : undefined,
        configured: ok,
        managed: false,
      }
    }
    case 'custom-json': {
      const ok = isPublicUrl(provider.endpoint)
      return {
        fetcher: ok
          ? (signal) =>
              fetchCustomJson(signal, {
                url: provider.endpoint as string,
                sourceId: provider.providerId,
                sourceName: provider.providerName,
                provenance: provider.provenance,
              })
          : undefined,
        configured: ok,
        managed: false,
      }
    }
    case 'managed-ingest':
      return { configured: true, managed: true }
    case 'disabled':
    default:
      return { configured: false, managed: false }
  }
}

function isPublicUrl(url: string | undefined): boolean {
  return Boolean(url && /^https?:\/\//i.test(url))
}
