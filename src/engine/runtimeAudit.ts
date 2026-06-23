import type { ProvenanceId } from '../provenance'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../worldIntel'
import { eventStructuralExposure } from './entityResolver'

export type ConnectorAccessModel =
  | 'public'
  | 'key-gated'
  | 'user-agent-gated'
  | 'optional-key'
  | 'candidate'

export type ConnectorCadence = 'realtime' | 'periodic' | 'manual'

export type ConnectorRuntimeStatus =
  | 'online'
  | 'configured'
  | 'pending-first-fetch'
  | 'missing-key'
  | 'unavailable'
  | 'stale'
  | 'rate-limited'
  | 'failed'
  | 'disabled'
  | 'not-wired'

export type ConnectorAuditDefinition = {
  id: string
  label: string
  domain: string
  sourceIds: string[]
  access: ConnectorAccessModel
  cadence: ConnectorCadence
  sourceIdentity: string
  officialUrl: string
  requiredEnv: string[]
  persistenceTables: string[]
  sourceTrailUi: string
  resolverSupport: 'yes' | 'partial' | 'identifier-only' | 'no' | 'not-wired'
  exposureSupport: 'curated-reference' | 'identifier-only' | 'future' | 'none'
  trust: ProvenanceId | 'catalog-only'
  notes: string
  implemented: boolean
  staleAfterMs?: number
}

type ConnectorAuditDefinitionInput =
  Omit<ConnectorAuditDefinition, 'implemented' | 'staleAfterMs'> &
  Partial<Pick<ConnectorAuditDefinition, 'implemented' | 'staleAfterMs'>>

export type ConnectorAuditRow = ConnectorAuditDefinition & {
  status: ConnectorRuntimeStatus
  lastSuccessfulFetch?: number
  recordCount: number
  lastError?: string
  activeSourceCount: number
  missingReason?: string
}

export type ExposureSummary = {
  generatedAt: number
  windowMs: number
  consideredEventCount: number
  resolvedEventCount: number
  unresolvedEventCount: number
  curatedReferenceOnlyCount: number
  topCountries: ExposureCount[]
  topCompanies: ExposureCount[]
  topCommodities: ExposureCount[]
  topSectors: ExposureCount[]
  recentResolvedEvents: ResolvedExposureEvent[]
}

export type ExposureCount = {
  id: string
  label: string
  kind: string
  count: number
}

export type ResolvedExposureEvent = {
  eventId: string
  title: string
  sourceId: string
  observedAt: number
  resolvedEntityIds: string[]
  exposedEntityCount: number
  exposureTrust: 'curated-reference'
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const DEFAULT_STALE_AFTER_MS = 30 * HOUR_MS

export const CONNECTOR_AUDIT_DEFINITIONS: ConnectorAuditDefinition[] = [
  connector({
    id: 'sec-edgar',
    label: 'SEC EDGAR',
    domain: 'company disclosure',
    sourceIds: ['sec_edgar_public'],
    access: 'user-agent-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Securities and Exchange Commission',
    officialUrl: 'https://data.sec.gov/',
    requiredEnv: ['ATLASZ_SEC_USER_AGENT'],
    persistenceTables: ['sec_company_filings', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'SEC filing source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-disclosure',
    notes: 'Official company filings; fail-closed without a contactable User-Agent.',
  }),
  connector({
    id: 'fred',
    label: 'FRED',
    domain: 'macro time series',
    sourceIds: ['macro_calendar_fred'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'Federal Reserve Bank of St. Louis FRED',
    officialUrl: 'https://fred.stlouisfed.org/docs/api/fred/',
    requiredEnv: ['ATLASZ_FRED_API_KEY'],
    persistenceTables: ['fred_macro_observations', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official macro observations; no synthetic macro charts or commentary.',
  }),
  connector({
    id: 'treasury-fiscal',
    label: 'Treasury Fiscal Data',
    domain: 'government finance',
    sourceIds: ['treasury_fiscal_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Treasury Fiscal Data',
    officialUrl: 'https://fiscaldata.treasury.gov/api-documentation/',
    requiredEnv: [],
    persistenceTables: ['treasury_fiscal_records', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Fiscal source trail cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official fiscal/debt records; market impact is not inferred.',
  }),
  connector({
    id: 'bls',
    label: 'BLS',
    domain: 'labor and prices',
    sourceIds: ['bls_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Bureau of Labor Statistics',
    officialUrl: 'https://www.bls.gov/developers/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official labor/price series; optional key only raises limits.',
  }),
  connector({
    id: 'bea',
    label: 'BEA',
    domain: 'national accounts',
    sourceIds: ['bea_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Bureau of Economic Analysis',
    officialUrl: 'https://www.bea.gov/resources/for-developers',
    requiredEnv: ['ATLASZ_BEA_API_KEY'],
    persistenceTables: ['bea_observations', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'BEA macro context cards',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official GDP/NIPA observations; key never appears in source trails.',
  }),
  connector({
    id: 'eia',
    label: 'EIA',
    domain: 'energy and commodities',
    sourceIds: ['eia_energy_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Energy Information Administration',
    officialUrl: 'https://www.eia.gov/opendata/',
    requiredEnv: ['ATLASZ_EIA_API_KEY'],
    persistenceTables: ['eia_energy_records', 'world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Energy source trail cards',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Official energy series; no fake commodity alerts.',
  }),
  connector({
    id: 'noaa-alerts',
    label: 'NOAA/NWS Alerts',
    domain: 'weather disruption',
    sourceIds: ['noaa_alerts_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'National Weather Service alerts API',
    officialUrl: 'https://api.weather.gov/alerts/active',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'NOAA weather source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Real alerts only; severity/urgency/certainty come from NWS.',
  }),
  connector({
    id: 'federal-register',
    label: 'Federal Register',
    domain: 'regulatory documents',
    sourceIds: ['federal_register_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'Office of the Federal Register / FederalRegister.gov API',
    officialUrl: 'https://www.federalregister.gov/reader-aids/developer-resources/rest-api',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Regulatory document source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official public regulatory document metadata; govinfo PDF is preserved when available. No invented legal impact or ticker exposure.',
  }),
  connector({
    id: 'ofac-sdn',
    label: 'OFAC SDN',
    domain: 'sanctions enforcement',
    sourceIds: ['ofac_sdn_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'U.S. Treasury OFAC Sanctions List Service',
    officialUrl: 'https://ofac.treasury.gov/sanctions-list-service',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'OFAC sanctions source trail',
    resolverSupport: 'identifier-only',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official SDN list records only. No sanctions screening, fuzzy matching, guilt/risk labels, person enrichment, or ticker exposure.',
  }),
  connector({
    id: 'congress-gov',
    label: 'Congress.gov',
    domain: 'legislative pipeline',
    sourceIds: ['congress_gov_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'Library of Congress / Congress.gov API',
    officialUrl: 'https://api.congress.gov/',
    requiredEnv: ['ATLASZ_CONGRESS_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Congress bill/action source trail',
    resolverSupport: 'identifier-only',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Official bill/action metadata only. No fake bills, political interpretation, person enrichment, or inferred company exposure.',
  }),
  connector({
    id: 'usgs-earthquakes',
    label: 'USGS Earthquakes',
    domain: 'physical-world events',
    sourceIds: ['usgs_significant_quakes'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'USGS Earthquake Hazards Program',
    officialUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Timeline/event source trail',
    resolverSupport: 'partial',
    exposureSupport: 'future',
    trust: 'official-api',
    notes: 'Observed earthquake data; no inferred ticker exposure.',
  }),
  connector({
    id: 'un-comtrade',
    label: 'UN Comtrade',
    domain: 'trade flows',
    sourceIds: ['un_comtrade_public'],
    access: 'candidate',
    cadence: 'manual',
    sourceIdentity: 'United Nations Comtrade',
    officialUrl: 'https://comtradeplus.un.org/',
    requiredEnv: ['ATLASZ_UN_COMTRADE_API_KEY'],
    persistenceTables: ['not created'],
    sourceTrailUi: 'not wired',
    resolverSupport: 'not-wired',
    exposureSupport: 'future',
    trust: 'catalog-only',
    notes: 'Cataloged as the next trade-flow candidate; no runtime adapter in this checkpoint.',
    implemented: false,
  }),
  connector({
    id: 'uspto',
    label: 'USPTO PatentsView',
    domain: 'patent intelligence',
    sourceIds: ['uspto_patentsview_public'],
    access: 'key-gated',
    cadence: 'periodic',
    sourceIdentity: 'USPTO PatentsView API',
    officialUrl: 'https://developer.uspto.gov/api-catalog',
    requiredEnv: ['ATLASZ_PATENTSVIEW_API_KEY'],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Patent source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'official-api',
    notes: 'Official patent metadata; person data is not collected by default.',
  }),
  connector({
    id: 'github-releases',
    label: 'GitHub Releases',
    domain: 'open-source activity',
    sourceIds: ['github_releases_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'GitHub REST Releases API',
    officialUrl: 'https://docs.github.com/en/rest/releases/releases',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'Timeline/source trail',
    resolverSupport: 'yes',
    exposureSupport: 'curated-reference',
    trust: 'public-unauthenticated',
    notes: 'Public release metadata; optional token raises rate limits only.',
  }),
  connector({
    id: 'cisa-kev',
    label: 'CISA KEV',
    domain: 'defensive security',
    sourceIds: ['cisa_kev_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'CISA Known Exploited Vulnerabilities catalog',
    officialUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Defensive reference only; no scanning, exploit logic, or target collection.',
  }),
  connector({
    id: 'nvd',
    label: 'NVD CVEs',
    domain: 'defensive security',
    sourceIds: ['nvd_cve_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'NIST National Vulnerability Database',
    officialUrl: 'https://nvd.nist.gov/developers/vulnerabilities',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Official CVE metadata; optional API key raises rate limits.',
  }),
  connector({
    id: 'ghsa',
    label: 'GitHub Advisories',
    domain: 'defensive security',
    sourceIds: ['github_ghsa_public'],
    access: 'optional-key',
    cadence: 'periodic',
    sourceIdentity: 'GitHub Security Advisory Database',
    officialUrl: 'https://docs.github.com/en/rest/security-advisories/global-advisories',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'public-unauthenticated',
    notes: 'Reviewed advisory metadata; no repo scraping or person enrichment.',
  }),
  connector({
    id: 'osv',
    label: 'OSV.dev',
    domain: 'defensive security',
    sourceIds: ['osv_dev_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'OSV.dev public API',
    officialUrl: 'https://osv.dev/docs/',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Open vulnerability records; no private package inventory collection.',
  }),
  connector({
    id: 'cisa-advisories',
    label: 'CISA Advisories',
    domain: 'defensive security',
    sourceIds: ['cisa_advisories_public'],
    access: 'public',
    cadence: 'periodic',
    sourceIdentity: 'CISA Cybersecurity Advisories RSS',
    officialUrl: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    requiredEnv: [],
    persistenceTables: ['world_intel_events', 'source_audit_log'],
    sourceTrailUi: 'CVE source trail',
    resolverSupport: 'partial',
    exposureSupport: 'identifier-only',
    trust: 'official-api',
    notes: 'Defensive advisory timeline; no scanning or offensive workflows.',
  }),
]

export function buildConnectorAudit(input: {
  sources: OsintSourceSnapshot[]
  events: WorldIntelEvent[]
  now?: number
}): ConnectorAuditRow[] {
  const now = input.now ?? Date.now()
  return CONNECTOR_AUDIT_DEFINITIONS.map((definition) => {
    const matchedSources = input.sources.filter((source) => definition.sourceIds.includes(source.sourceId))
    const matchedEvents = input.events.filter((event) => definition.sourceIds.includes(event.sourceId))
    const status = connectorStatus(definition, matchedSources, now)
    const lastSuccessfulFetch = latestNumber(matchedSources.map((source) => source.lastSuccessAt))
    const lastErrorSource = matchedSources
      .filter((source) => source.lastError)
      .sort((a, b) => (b.lastErrorAt ?? 0) - (a.lastErrorAt ?? 0))[0]

    return {
      ...definition,
      status,
      lastSuccessfulFetch,
      recordCount: Math.max(sum(matchedSources.map((source) => source.itemCount)), matchedEvents.length),
      lastError: lastErrorSource?.lastError,
      activeSourceCount: matchedSources.length,
      missingReason: missingReason(definition, matchedSources),
    }
  })
}

export function summarizeExposure(input: {
  events: WorldIntelEvent[]
  now?: number
  windowMs?: number
  limit?: number
}): ExposureSummary {
  const now = input.now ?? Date.now()
  const windowMs = input.windowMs ?? DAY_MS
  const limit = input.limit ?? 6
  const considered = input.events
    .filter((event) => Number.isFinite(event.timestamp) && event.timestamp >= now - windowMs && event.timestamp <= now + 60_000)
    .sort((a, b) => b.timestamp - a.timestamp)

  const counts = new Map<string, ExposureCount>()
  const recentResolvedEvents: ResolvedExposureEvent[] = []
  let curatedReferenceOnlyCount = 0

  for (const event of considered) {
    const exposed = eventStructuralExposure(event, { maxDepth: 3 })
    if (exposed.length === 0) continue
    curatedReferenceOnlyCount += 1
    const resolvedEntityIds = exposed.map(({ resolution }) => resolution.canonicalSeedEntityId)
    let exposedEntityCount = 0
    for (const item of exposed) {
      for (const path of item.exposure) {
        exposedEntityCount += 1
        bump(counts, path.entity.id, path.entity.label, path.entity.kind)
      }
    }
    recentResolvedEvents.push({
      eventId: event.id,
      title: event.title,
      sourceId: event.sourceId,
      observedAt: event.timestamp,
      resolvedEntityIds,
      exposedEntityCount,
      exposureTrust: 'curated-reference',
    })
  }

  const resolvedEventIds = new Set(recentResolvedEvents.map((event) => event.eventId))
  return {
    generatedAt: now,
    windowMs,
    consideredEventCount: considered.length,
    resolvedEventCount: resolvedEventIds.size,
    unresolvedEventCount: Math.max(0, considered.length - resolvedEventIds.size),
    curatedReferenceOnlyCount,
    topCountries: topKind(counts, 'country', limit),
    topCompanies: topKind(counts, 'company', limit),
    topCommodities: topKind(counts, 'commodity', limit),
    topSectors: topKind(counts, 'sector', limit),
    recentResolvedEvents: recentResolvedEvents.slice(0, limit),
  }
}

function connector(input: ConnectorAuditDefinitionInput): ConnectorAuditDefinition {
  return {
    ...input,
    implemented: input.implemented ?? true,
    staleAfterMs: input.staleAfterMs ?? DEFAULT_STALE_AFTER_MS,
  }
}

function connectorStatus(
  definition: ConnectorAuditDefinition,
  sources: OsintSourceSnapshot[],
  now: number,
): ConnectorRuntimeStatus {
  // `not-wired` is reserved for connectors with no runtime adapter at all.
  if (!definition.implemented) return 'not-wired'
  // Implemented but no source snapshot yet: key-gated -> missing-key; otherwise the
  // connector is configured and simply hasn't completed its first poll -> pending-first-fetch.
  if (sources.length === 0) return definition.requiredEnv.length > 0 ? 'missing-key' : 'pending-first-fetch'
  if (sources.every((source) => source.status === 'disabled' || !source.enabled)) return 'disabled'
  if (sources.some((source) => source.status === 'failed')) return 'failed'
  if (sources.some((source) => source.status === 'rate-limited')) return 'rate-limited'
  if (sources.some((source) => source.configured === false)) return 'missing-key'
  if (sources.some((source) => source.status === 'offline')) return 'unavailable'

  const lastSuccess = latestNumber(sources.map((source) => source.lastSuccessAt))
  const staleAfterMs = Math.max(definition.staleAfterMs ?? DEFAULT_STALE_AFTER_MS, ...sources.map((source) => source.pollIntervalMs * 3))
  if (lastSuccess !== undefined && now - lastSuccess > staleAfterMs) return 'stale'
  if (sources.some((source) => source.status === 'online')) return 'online'
  return 'configured'
}

function missingReason(definition: ConnectorAuditDefinition, sources: OsintSourceSnapshot[]): string | undefined {
  if (!definition.implemented) return 'No runtime adapter/persistence/UI slice is wired in this checkpoint.'
  const unconfigured = sources.find((source) => source.configured === false)
  if (unconfigured?.configHint) return unconfigured.configHint
  if (sources.length === 0 && definition.requiredEnv.length > 0) return `Missing ${definition.requiredEnv.join(', ')}`
  if (sources.length === 0) return 'Configured; waiting for first poll/manual run.'
  return undefined
}

function latestNumber(values: Array<number | undefined>): number | undefined {
  const finite = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return finite.length > 0 ? Math.max(...finite) : undefined
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

function bump(counts: Map<string, ExposureCount>, id: string, label: string, kind: string) {
  const current = counts.get(id)
  if (current) {
    current.count += 1
    return
  }
  counts.set(id, { id, label, kind, count: 1 })
}

function topKind(counts: Map<string, ExposureCount>, kind: string, limit: number): ExposureCount[] {
  return [...counts.values()]
    .filter((item) => item.kind === kind)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}
