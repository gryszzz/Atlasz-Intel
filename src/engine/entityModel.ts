/*
 * Entity-relationship model — "the evidence chain of reality".
 *
 * Deterministically derives a typed entity graph from the unified WorldIntelEvent
 * stream. Every connector feeds the SAME relationship model: a CVE node
 * accumulates evidence from CISA KEV + NVD + GitHub advisories; an SEC filing
 * links company -> ticker -> sector; FRED and Treasury records anchor macro/
 * fiscal context.
 *
 * Discipline (matches the rest of Atlasz):
 *  - No edge without evidence. Every node and relationship carries the source
 *    events that prove it (id, url, provenance, confidence, raw payload hash).
 *  - The model is a local computation, so nodes/edges are `local-derived` in
 *    spirit and never upgraded to verified. Provenance shown is the BEST evidence
 *    provenance observed, never invented.
 *  - Freshness is explicit (fresh / recent / aging / stale / unavailable).
 *  - "What is unknown" is first-class: missing ticker mappings, unlinked
 *    vulnerabilities, and low-trust sources are surfaced, not hidden.
 *  - Empty input yields DATA_UNAVAILABLE, never a fabricated graph.
 *
 * Each event answers the seven questions via `evidenceChainFor`:
 *   what happened · who is connected · what source proves it · when · how fresh ·
 *   what entities it touches · what is unknown.
 */
import type { ProvenanceId } from '../provenance'
import type { WorldIntelEvent } from '../worldIntel'
import { provenanceTrust, sourceLabel } from './materialityEngine'
import type { GeoAsset } from './geo/geoCore'

export type EntityKind =
  | 'company'
  | 'ticker'
  | 'cik'
  | 'etf'
  | 'index'
  | 'sector'
  | 'country'
  | 'port'
  | 'chokepoint'
  | 'trade-route'
  | 'infrastructure'
  | 'facility'
  | 'place'
  | 'balancing-authority'
  | 'commodity'
  | 'technology'
  | 'vulnerability'
  | 'repository'
  | 'patent'
  | 'regulatory-document'
  | 'sanctions-record'
  | 'sanctions-program'
  | 'legislation'
  | 'policy-area'
  | 'committee'
  | 'trade-flow'
  | 'financial-concept'
  | 'reporting-owner'
  | 'transaction-code'
  | 'cusip'
  | 'research-work'
  | 'doi-work'
  | 'topic'
  | 'venue'
  | 'publisher'
  | 'funder'
  | 'filing'
  | 'macro-series'
  | 'fiscal-series'
  | 'institution'
  | 'event'
  | 'source'

export type RelationType =
  | 'reported_by'
  | 'about'
  | 'filed_by'
  | 'trades_as'
  | 'in_sector'
  | 'in_country'
  | 'observes'
  | 'affects'
  | 'touches'
  | 'references'
  | 'released'
  | 'represents'
  | 'issued_by'
  | 'holds'
  | 'located_in'
  | 'fueled_by'
  | 'operated_by'
  | 'processes'
  | 'produces'
  | 'operates_in'
  | 'serves'

export type FreshnessState = 'fresh' | 'recent' | 'aging' | 'stale' | 'unavailable'

export type EntityRef = {
  id: string
  kind: EntityKind
  label: string
}

export type EvidenceRef = {
  eventId: string
  sourceId: string
  sourceLabel: string
  sourceUrl?: string
  provenance: ProvenanceId
  confidence: number
  observedAt: number
  rawPayloadHash?: string
}

export type EntityNode = EntityRef & {
  evidence: EvidenceRef[]
  provenance: ProvenanceId
  confidence: number
  firstSeen: number
  lastObservedAt: number
  freshness: FreshnessState
  degree: number
  unknowns: string[]
}

export type EntityRelationship = {
  id: string
  from: string
  to: string
  relation: RelationType
  evidence: EvidenceRef[]
  provenance: ProvenanceId
  confidence: number
  firstSeen: number
  lastObservedAt: number
  freshness: FreshnessState
}

export type EntityGraph = {
  status: 'ok' | 'DATA_UNAVAILABLE'
  generatedAt: number
  nodes: EntityNode[]
  relationships: EntityRelationship[]
}

export type EvidenceChain = {
  eventId: string
  whatHappened: string
  whoIsConnected: EntityRef[]
  whatSourceProves: EvidenceRef
  whenHappened: number
  freshness: FreshnessState
  entitiesTouched: EntityRef[]
  unknowns: string[]
}

export type EntityModelOptions = {
  now?: number
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export function freshnessState(observedAt: number, now: number): FreshnessState {
  const age = now - observedAt
  if (!Number.isFinite(age)) return 'unavailable'
  if (age <= 6 * HOUR) return 'fresh'
  if (age <= DAY) return 'recent'
  if (age <= 7 * DAY) return 'aging'
  if (age <= 30 * DAY) return 'stale'
  return 'unavailable'
}

function entityId(kind: EntityKind, key: string): string {
  return `${kind}:${key.toLowerCase().trim().replace(/\s+/g, '-')}`
}

function evidenceOf(event: WorldIntelEvent): EvidenceRef {
  return {
    eventId: event.id,
    sourceId: event.sourceId,
    sourceLabel: sourceLabel(event.sourceId),
    sourceUrl: event.sourceUrl,
    provenance: event.provenance,
    confidence: event.confidence ?? 0,
    observedAt: event.timestamp,
    rawPayloadHash: event.rawPayloadHash || undefined,
  }
}

type DerivedEdge = { from: EntityRef; to: EntityRef; relation: RelationType }

/**
 * Universal location/operator edges for any physical-world `GeoAsset` (power
 * plant, refinery, port, mine, fab, ...). Shared by every geospatial connector
 * so the graph spans `event -> facility -> place(state/county) -> country` and,
 * ONLY on an exact identity, `facility -> operator company -> ticker`. Connector
 * blocks add their own domain edges (fuel, commodity, sector, route) on top.
 */
export function geoAssetEdges(eventEntity: EntityRef, asset: GeoAsset): DerivedEdge[] {
  const edges: DerivedEdge[] = []
  const facilityEntity: EntityRef = { id: entityId('facility', asset.assetId), kind: 'facility', label: asset.name }
  edges.push({ from: eventEntity, to: facilityEntity, relation: 'about' })

  const countryCode = asset.countryCode ?? 'US'
  const countryRef: EntityRef = {
    id: entityId('country', countryCode),
    kind: 'country',
    label: countryCode === 'US' ? 'United States' : countryCode,
  }

  if (asset.state) {
    const stateEntity: EntityRef = { id: entityId('place', `state:${asset.state}`), kind: 'place', label: asset.stateName ?? asset.state }
    edges.push({ from: facilityEntity, to: stateEntity, relation: 'located_in' })
    edges.push({ from: stateEntity, to: countryRef, relation: 'in_country' })
    if (asset.county) {
      const countyEntity: EntityRef = {
        id: entityId('place', `county:${asset.state}:${asset.county}`),
        kind: 'place',
        label: `${asset.county}, ${asset.state}`,
      }
      edges.push({ from: facilityEntity, to: countyEntity, relation: 'located_in' })
      edges.push({ from: countyEntity, to: stateEntity, relation: 'located_in' })
    }
  } else {
    edges.push({ from: facilityEntity, to: countryRef, relation: 'in_country' })
  }

  // Operator -> market company ONLY on an exact curated identity (no fuzzy merge).
  if (asset.operatorTicker && asset.operatorName) {
    const operatorEntity: EntityRef = { id: entityId('company', asset.operatorName), kind: 'company', label: asset.operatorName }
    const tickerEntity: EntityRef = { id: entityId('ticker', asset.operatorTicker), kind: 'ticker', label: asset.operatorTicker }
    edges.push({ from: facilityEntity, to: operatorEntity, relation: 'operated_by' })
    edges.push({ from: operatorEntity, to: tickerEntity, relation: 'trades_as' })
  }

  return edges
}

/**
 * Grid edges from a facility's SOURCE-BACKED balancing-authority code (present on
 * EIA plant records). facility -> BA ('operates_in'); BA -> state ('serves') is
 * derived from the same plant record. Grid context only — no outage/stress claim.
 */
function balancingAuthorityEdges(facility: EntityRef, baCode: string | undefined, state?: string, stateName?: string): DerivedEdge[] {
  const code = (baCode ?? '').trim().toUpperCase()
  if (!code) return []
  const ba: EntityRef = { id: entityId('balancing-authority', code), kind: 'balancing-authority', label: code }
  const edges: DerivedEdge[] = [{ from: facility, to: ba, relation: 'operates_in' }]
  if (state) edges.push({ from: ba, to: { id: entityId('place', `state:${state}`), kind: 'place', label: stateName ?? state }, relation: 'serves' })
  return edges
}

/**
 * Pure per-event extraction of typed entities + relationships. Shared by the
 * graph builder and the single-event evidence chain so they never diverge.
 */
export function deriveEventEntities(event: WorldIntelEvent): { entities: EntityRef[]; edges: DerivedEdge[] } {
  const entities: EntityRef[] = []
  const edges: DerivedEdge[] = []
  const add = (entity: EntityRef): EntityRef => {
    if (!entities.some((existing) => existing.id === entity.id)) entities.push(entity)
    return entity
  }
  const link = (from: EntityRef, to: EntityRef, relation: RelationType) => {
    add(from)
    add(to)
    edges.push({ from, to, relation })
  }

  const eventEntity: EntityRef = { id: entityId('event', event.id), kind: 'event', label: event.title }
  add(eventEntity)
  const sourceEntity: EntityRef = { id: entityId('source', event.sourceId), kind: 'source', label: sourceLabel(event.sourceId) }
  link(eventEntity, sourceEntity, 'reported_by')

  // SEC filing: filing -> company -> ticker -> sector.
  if (event.secFiling) {
    const filing = event.secFiling
    const filingEntity: EntityRef = { id: entityId('filing', filing.accessionNumber), kind: 'filing', label: `${filing.formType} ${filing.accessionNumber}` }
    const companyEntity: EntityRef = { id: entityId('company', filing.cik || filing.companyName), kind: 'company', label: filing.companyName }
    link(eventEntity, filingEntity, 'about')
    link(filingEntity, companyEntity, 'filed_by')
    if (filing.ticker) {
      const tickerEntity: EntityRef = { id: entityId('ticker', filing.ticker), kind: 'ticker', label: filing.ticker }
      link(companyEntity, tickerEntity, 'trades_as')
    }
  }

  // Market Reference Master: SEC company_tickers.json -> company/ticker/CIK.
  if (event.marketIdentity) {
    const identity = event.marketIdentity
    const companyEntity: EntityRef = { id: entityId('company', identity.cik || identity.legalName), kind: 'company', label: identity.legalName }
    const tickerEntity: EntityRef = { id: entityId('ticker', identity.ticker), kind: 'ticker', label: identity.ticker }
    const cikEntity: EntityRef = { id: entityId('cik', identity.cik), kind: 'cik', label: `CIK ${identity.cik}` }
    link(eventEntity, companyEntity, 'about')
    link(companyEntity, tickerEntity, 'trades_as')
    link(tickerEntity, companyEntity, 'represents')
    link(cikEntity, companyEntity, 'represents')
  }

  // FRED macro series.
  if (event.fredObservation) {
    const series = event.fredObservation
    const seriesEntity: EntityRef = { id: entityId('macro-series', series.seriesId), kind: 'macro-series', label: `${series.seriesId} — ${series.title}` }
    link(eventEntity, seriesEntity, 'observes')
  }

  // Treasury Fiscal Data: fiscal record -> fiscal series -> Treasury -> United States.
  if (event.treasuryFiscalRecord) {
    const record = event.treasuryFiscalRecord
    const fiscalSeries: EntityRef = {
      id: entityId('fiscal-series', `${record.datasetId}:${record.metricName}`),
      kind: 'fiscal-series',
      label: `${record.datasetName} — ${record.metricName}`,
    }
    const treasury: EntityRef = { id: entityId('institution', 'u.s. treasury'), kind: 'institution', label: 'U.S. Treasury' }
    const country: EntityRef = { id: entityId('country', 'US'), kind: 'country', label: 'United States' }
    link(eventEntity, fiscalSeries, 'observes')
    link(fiscalSeries, treasury, 'issued_by')
    link(treasury, country, 'in_country')
  }

  // BLS macro series (labor/prices) — same macro-series entity shape as FRED.
  if (event.blsObservation) {
    const series = event.blsObservation
    const seriesEntity: EntityRef = { id: entityId('macro-series', series.seriesId), kind: 'macro-series', label: `${series.seriesId} — ${series.title}` }
    link(eventEntity, seriesEntity, 'observes')
  }

  // BEA macro series: NIPA/GDP observation -> BEA -> United States.
  if (event.beaObservation) {
    const series = event.beaObservation
    const key = `${series.datasetName}:${series.tableName}:${series.lineNumber}`
    const seriesEntity: EntityRef = { id: entityId('macro-series', `bea:${key}`), kind: 'macro-series', label: `${series.tableName} line ${series.lineNumber} — ${series.lineDescription}` }
    const bea: EntityRef = { id: entityId('institution', 'u.s. bureau of economic analysis'), kind: 'institution', label: 'U.S. Bureau of Economic Analysis' }
    const country: EntityRef = { id: entityId('country', 'US'), kind: 'country', label: 'United States' }
    link(eventEntity, seriesEntity, 'observes')
    link(seriesEntity, bea, 'issued_by')
    link(bea, country, 'in_country')
  }

  // EIA energy series: energy/commodity context -> EIA -> United States/region.
  if (event.eiaEnergyRecord) {
    const record = event.eiaEnergyRecord
    const seriesEntity: EntityRef = {
      id: entityId('macro-series', `eia:${record.seriesId}`),
      kind: 'macro-series',
      label: `${record.seriesId} — ${record.title}`,
    }
    const commodity: EntityRef = { id: entityId('commodity', record.commodity), kind: 'commodity', label: record.commodity }
    const eia: EntityRef = { id: entityId('institution', 'u.s. energy information administration'), kind: 'institution', label: 'U.S. Energy Information Administration' }
    link(eventEntity, seriesEntity, 'observes')
    link(seriesEntity, commodity, 'touches')
    link(seriesEntity, eia, 'issued_by')
    if (record.countryCode) {
      link(eia, { id: entityId('country', record.countryCode), kind: 'country', label: record.countryCode === 'US' ? 'United States' : record.countryCode }, 'in_country')
    }
  }

  // EIA power-plant facility: universal location/operator edges via the Shared
  // Geospatial Core, plus the power-plant domain edge (fuel -> commodity).
  // Structural location context only — never an outage/disruption/exposure claim.
  if (event.eiaFacility) {
    const facility = event.eiaFacility
    const asset: GeoAsset = {
      assetId: facility.facilityId,
      assetKind: 'power-plant',
      name: facility.facilityName,
      latitude: facility.latitude,
      longitude: facility.longitude,
      geospatialPrecision: facility.geospatialPrecision,
      state: facility.state,
      stateName: facility.stateName,
      county: facility.county,
      countryCode: 'US',
      operatorName: facility.operatorName,
      operatorTicker: facility.operatorTicker,
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const facilityEntity: EntityRef = { id: entityId('facility', facility.facilityId), kind: 'facility', label: facility.facilityName }
    if (facility.primaryFuel) {
      link(facilityEntity, { id: entityId('commodity', facility.primaryFuel), kind: 'commodity', label: facility.primaryFuel }, 'fueled_by')
    }
    for (const edge of balancingAuthorityEdges(facilityEntity, facility.balancingAuthority, facility.state, facility.stateName)) {
      link(edge.from, edge.to, edge.relation)
    }
  }

  // EIA petroleum refinery: universal location/operator edges via the Shared
  // Geospatial Core, plus refinery domain edges (processes crude, produces refined
  // products if source-backed, in energy sector). Location/capacity context only.
  if (event.eiaRefinery) {
    const refinery = event.eiaRefinery
    const asset: GeoAsset = {
      assetId: refinery.facilityId,
      assetKind: 'refinery',
      name: refinery.facilityName,
      latitude: refinery.latitude,
      longitude: refinery.longitude,
      geospatialPrecision: refinery.geospatialPrecision,
      state: refinery.state,
      stateName: refinery.stateName,
      county: refinery.county,
      countryCode: 'US',
      operatorName: refinery.operatorName ?? refinery.companyName,
      operatorTicker: refinery.operatorTicker,
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const refineryEntity: EntityRef = { id: entityId('facility', refinery.facilityId), kind: 'facility', label: refinery.facilityName }
    link(refineryEntity, { id: entityId('commodity', 'Crude Oil'), kind: 'commodity', label: 'Crude Oil' }, 'processes')
    for (const product of refinery.products ?? []) {
      link(refineryEntity, { id: entityId('commodity', product), kind: 'commodity', label: product }, 'produces')
    }
    link(refineryEntity, { id: entityId('sector', 'Energy'), kind: 'sector', label: 'Energy' }, 'in_sector')
  }

  // LNG terminal: universal location/operator edges via the Shared Geospatial
  // Core, plus structural commodity links (LNG + natural gas) and energy sector.
  // No flow direction implied — 'touches' is neutral. Location/capacity context only.
  if (event.lngTerminal) {
    const terminal = event.lngTerminal
    const asset: GeoAsset = {
      assetId: terminal.facilityId,
      assetKind: 'lng-terminal',
      name: terminal.facilityName,
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      geospatialPrecision: terminal.geospatialPrecision,
      state: terminal.state,
      stateName: terminal.stateName,
      county: terminal.county,
      countryCode: 'US',
      operatorName: terminal.operatorName ?? terminal.ownerName,
      operatorTicker: terminal.operatorTicker,
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const terminalEntity: EntityRef = { id: entityId('facility', terminal.facilityId), kind: 'facility', label: terminal.facilityName }
    link(terminalEntity, { id: entityId('commodity', 'LNG'), kind: 'commodity', label: 'LNG' }, 'touches')
    link(terminalEntity, { id: entityId('commodity', 'Natural Gas'), kind: 'commodity', label: 'Natural Gas' }, 'touches')
    link(terminalEntity, { id: entityId('sector', 'Energy'), kind: 'sector', label: 'Energy' }, 'in_sector')
  }

  // Nuclear plant LAYER 1 (EIA, geospatial): universal location/operator edges via
  // the Shared Geospatial Core, plus electricity + nuclear commodity + energy
  // sector. Facility/capacity context only — no safety/outage/disruption claim.
  if (event.nuclearPlant) {
    const plant = event.nuclearPlant
    const asset: GeoAsset = {
      assetId: plant.facilityId,
      assetKind: 'nuclear-plant',
      name: plant.facilityName,
      latitude: plant.latitude,
      longitude: plant.longitude,
      geospatialPrecision: plant.geospatialPrecision,
      state: plant.state,
      stateName: plant.stateName,
      county: plant.county,
      countryCode: 'US',
      operatorName: plant.operatorName,
      operatorTicker: plant.operatorTicker,
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const plantEntity: EntityRef = { id: entityId('facility', plant.facilityId), kind: 'facility', label: plant.facilityName }
    link(plantEntity, { id: entityId('commodity', 'Electricity'), kind: 'commodity', label: 'Electricity' }, 'touches')
    link(plantEntity, { id: entityId('commodity', 'Nuclear'), kind: 'commodity', label: 'Nuclear' }, 'touches')
    link(plantEntity, { id: entityId('sector', 'Energy'), kind: 'sector', label: 'Energy' }, 'in_sector')
    for (const edge of balancingAuthorityEdges(plantEntity, plant.balancingAuthority, plant.state, plant.stateName)) {
      link(edge.from, edge.to, edge.relation)
    }
  }

  // Balancing authority / grid region (EIA reference): event -> BA -> NERC region
  // (place) + country + electricity + operator (exact only) + energy sector.
  // Grid-context reference only — no outage/stress/reliability/disruption claim.
  if (event.gridRegion) {
    const region = event.gridRegion
    const baEntity: EntityRef = { id: entityId('balancing-authority', region.baCode), kind: 'balancing-authority', label: `${region.baCode} — ${region.baName}` }
    link(eventEntity, baEntity, 'about')
    link(baEntity, { id: entityId('country', region.country), kind: 'country', label: region.country === 'US' ? 'United States' : region.country }, 'in_country')
    link(baEntity, { id: entityId('commodity', 'Electricity'), kind: 'commodity', label: 'Electricity' }, 'touches')
    link(baEntity, { id: entityId('sector', 'Energy'), kind: 'sector', label: 'Energy' }, 'in_sector')
    if (region.nercRegion) {
      link(baEntity, { id: entityId('place', `nerc:${region.nercRegion}`), kind: 'place', label: `${region.nercRegion} (NERC)` }, 'located_in')
    }
    for (const state of region.statesServed ?? []) {
      link(baEntity, { id: entityId('place', `state:${state}`), kind: 'place', label: state }, 'serves')
    }
    if (region.operatorTicker && region.operatorName) {
      const operatorEntity: EntityRef = { id: entityId('company', region.operatorName), kind: 'company', label: region.operatorName }
      link(baEntity, operatorEntity, 'operated_by')
      link(operatorEntity, { id: entityId('ticker', region.operatorTicker), kind: 'ticker', label: region.operatorTicker }, 'trades_as')
    }
  }

  // UN/LOCODE (trade/location registry): event -> location -> country + subdivision
  // (country-namespaced place) + trade/logistics sector. Location-code context only
  // — never live port activity, vessel traffic, congestion, or disruption.
  if (event.unLocode) {
    const loc = event.unLocode
    const asset: GeoAsset = {
      assetId: loc.locode,
      assetKind: loc.facilityKind === 'rail-terminal' ? 'rail-hub' : loc.facilityKind,
      name: loc.locationName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      geospatialPrecision: loc.geospatialPrecision,
      countryCode: loc.countryCode, // no state: subdivision is namespaced below to avoid US collisions
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const locEntity: EntityRef = { id: entityId('facility', loc.locode), kind: 'facility', label: loc.locationName }
    if (loc.subdivision) {
      link(
        locEntity,
        { id: entityId('place', `subdiv:${loc.countryCode}:${loc.subdivision}`), kind: 'place', label: `${loc.subdivision}, ${loc.countryCode}` },
        'located_in',
      )
    }
    link(locEntity, { id: entityId('sector', 'Logistics'), kind: 'sector', label: 'Logistics' }, 'in_sector')
  }

  // Nuclear plant LAYER 2 (NRC, regulatory status): reactor UNIT status, kept a
  // SEPARATE node namespace (no fuzzy merge into the EIA facility). No coordinates
  // in this feed -> location-less. Power level is source-reported, never editorial.
  if (event.nrcReactorStatus) {
    const status = event.nrcReactorStatus
    const asset: GeoAsset = {
      assetId: `nrc-unit:${status.unitName}`,
      assetKind: 'nuclear-plant',
      name: status.unitName,
      geospatialPrecision: 'unknown',
      countryCode: 'US',
    }
    for (const edge of geoAssetEdges(eventEntity, asset)) link(edge.from, edge.to, edge.relation)

    const unitEntity: EntityRef = { id: entityId('facility', `nrc-unit:${status.unitName}`), kind: 'facility', label: status.unitName }
    link(unitEntity, { id: entityId('commodity', 'Electricity'), kind: 'commodity', label: 'Electricity' }, 'touches')
    link(unitEntity, { id: entityId('sector', 'Energy'), kind: 'sector', label: 'Energy' }, 'in_sector')
  }

  // Vulnerabilities: KEV + NVD + GHSA + OSV all attach to ONE node (corroboration).
  // Identity prefers CVE, then GHSA, then the OSV id — so an OSV record whose
  // aliases include a CVE/GHSA joins the existing node instead of a new island.
  const cveId =
    event.kevVulnerability?.cveId ??
    event.nvdCve?.cveId ??
    event.ghsaAdvisory?.cveId ??
    event.osvVulnerability?.relatedCveIds[0] ??
    event.cisaAdvisory?.relatedCveIds[0]
  const ghsaId = event.ghsaAdvisory?.ghsaId ?? event.osvVulnerability?.relatedGhsaIds[0]
  const vulnKey = cveId ?? ghsaId ?? event.osvVulnerability?.osvId ?? event.cisaAdvisory?.advisoryId
  if (vulnKey) {
    const vulnEntity: EntityRef = {
      id: entityId('vulnerability', vulnKey),
      kind: 'vulnerability',
      label: cveId ?? ghsaId ?? event.osvVulnerability?.osvId ?? event.cisaAdvisory?.advisoryId ?? vulnKey,
    }
    link(eventEntity, vulnEntity, 'about')
    const affectTech = (label: string) =>
      link(vulnEntity, { id: entityId('technology', label), kind: 'technology', label }, 'affects')
    if (event.kevVulnerability) {
      affectTech(`${event.kevVulnerability.vendorProject}:${event.kevVulnerability.product}`)
    }
    for (const vp of event.nvdCve?.vendorProducts ?? []) affectTech(vp)
    for (const pkg of event.ghsaAdvisory?.packages ?? []) affectTech(`${pkg.ecosystem}:${pkg.name}`)
    for (const pkg of event.osvVulnerability?.affectedPackages ?? []) affectTech(`${pkg.ecosystem}:${pkg.name}`)
    for (const vendor of event.cisaAdvisory?.vendors ?? []) affectTech(vendor)
    for (const product of event.cisaAdvisory?.products ?? []) affectTech(product)
  }

  // GitHub release: repository -> release event + technology (open-source layer).
  if (event.githubRelease) {
    const release = event.githubRelease
    const repoEntity: EntityRef = { id: entityId('repository', release.repoFullName), kind: 'repository', label: release.repoFullName }
    link(repoEntity, eventEntity, 'released')
    const techName = release.repoFullName.split('/')[1] ?? release.repoFullName
    link(repoEntity, { id: entityId('technology', techName), kind: 'technology', label: techName }, 'represents')
  }

  // USGS earthquake: event -> country (physical-world geo layer). Region/country
  // are best-effort from the place string; infrastructure exposure comes later.
  if (event.earthquakeEvent?.countryCode) {
    const code = event.earthquakeEvent.countryCode
    link(eventEntity, { id: entityId('country', code), kind: 'country', label: code }, 'in_country')
  }

  // USPTO patent: event -> patent -> assignee company (innovation/IP layer).
  if (event.patentRecord) {
    const patent = event.patentRecord
    const patentEntity: EntityRef = { id: entityId('patent', patent.patentId), kind: 'patent', label: patent.patentId }
    link(eventEntity, patentEntity, 'about')
    for (const assignee of patent.assignees) {
      link(patentEntity, { id: entityId('company', assignee), kind: 'company', label: assignee }, 'filed_by')
    }
  }

  // Federal Register: event -> regulatory document -> issuing agency -> United States.
  if (event.regulatoryDocument) {
    const document = event.regulatoryDocument
    const documentEntity: EntityRef = {
      id: entityId('regulatory-document', document.documentNumber),
      kind: 'regulatory-document',
      label: `${document.documentType} ${document.documentNumber}`,
    }
    link(eventEntity, documentEntity, 'about')
    for (const agency of document.agencies) {
      const agencyEntity: EntityRef = { id: entityId('institution', agency), kind: 'institution', label: agency }
      link(documentEntity, agencyEntity, 'issued_by')
      link(agencyEntity, { id: entityId('country', 'US'), kind: 'country', label: 'United States' }, 'in_country')
    }
  }

  // OFAC SDN: event -> sanctions record -> issuing institution / programs /
  // listed countries. This is source-published list evidence only; no company
  // exposure or identity enrichment is inferred.
  if (event.ofacSanctionsRecord) {
    const record = event.ofacSanctionsRecord
    const sanctionsRecord: EntityRef = {
      id: entityId('sanctions-record', `ofac-sdn-${record.uid}`),
      kind: 'sanctions-record',
      label: `OFAC SDN ${record.uid}`,
    }
    const ofac: EntityRef = { id: entityId('institution', 'treasury ofac'), kind: 'institution', label: 'Treasury OFAC' }
    link(eventEntity, sanctionsRecord, 'about')
    link(sanctionsRecord, ofac, 'issued_by')
    link(ofac, { id: entityId('country', 'US'), kind: 'country', label: 'United States' }, 'in_country')
    for (const program of record.programs) {
      link(sanctionsRecord, { id: entityId('sanctions-program', program), kind: 'sanctions-program', label: program }, 'references')
    }
    for (const country of record.countries) {
      link(sanctionsRecord, { id: entityId('country', country), kind: 'country', label: country }, 'touches')
    }
  }

  // Congress.gov: event -> bill/action -> United States / policy area /
  // committees. No company exposure is inferred from policy text.
  if (event.congressBillAction) {
    const bill = event.congressBillAction
    const billEntity: EntityRef = {
      id: entityId('legislation', `${bill.congress}-${bill.billType}-${bill.billNumber}`),
      kind: 'legislation',
      label: `${bill.billType} ${bill.billNumber}`,
    }
    link(eventEntity, billEntity, 'about')
    link(billEntity, { id: entityId('country', 'US'), kind: 'country', label: 'United States' }, 'in_country')
    if (bill.policyArea) {
      link(billEntity, { id: entityId('policy-area', bill.policyArea), kind: 'policy-area', label: bill.policyArea }, 'references')
    }
    for (const committee of bill.committees) {
      link(billEntity, { id: entityId('committee', committee), kind: 'committee', label: committee }, 'references')
    }
  }

  // UN Comtrade: event -> trade-flow record -> reporter country / partner country /
  // commodity / UN Comtrade source. Country/commodity trade evidence only — no
  // company-level claim is inferred from a trade flow.
  if (event.comtradeRecord) {
    const record = event.comtradeRecord
    const tradeFlow: EntityRef = {
      id: entityId('trade-flow', record.id),
      kind: 'trade-flow',
      label: `${record.flowDesc} ${record.commodityCode} (${record.period})`,
    }
    link(eventEntity, tradeFlow, 'about')
    link(tradeFlow, { id: entityId('country', record.reporterIso3 || record.reporterCode), kind: 'country', label: record.reporterDesc }, 'touches')
    link(tradeFlow, { id: entityId('country', record.partnerIso3 || record.partnerCode), kind: 'country', label: record.partnerDesc }, 'touches')
    link(tradeFlow, { id: entityId('commodity', record.commodityCode), kind: 'commodity', label: record.commodityDescription }, 'references')
    link(tradeFlow, { id: entityId('source', 'un-comtrade'), kind: 'source', label: 'UN Comtrade' }, 'reported_by')
  }

  // OpenAlex: event -> research work -> venue / institution / topic / country /
  // OpenAlex source. Research metadata only — country comes solely from institution
  // metadata; no company exposure or breakthrough claim is inferred.
  if (event.openAlexWork) {
    const work = event.openAlexWork
    const workEntity: EntityRef = { id: entityId('research-work', work.openAlexWorkId), kind: 'research-work', label: work.title.slice(0, 80) }
    link(eventEntity, workEntity, 'about')
    if (work.doi) {
      link(workEntity, { id: entityId('doi-work', work.doi), kind: 'doi-work', label: work.doi }, 'references')
    }
    if (work.venue) link(workEntity, { id: entityId('venue', work.venue), kind: 'venue', label: work.venue }, 'references')
    for (const institution of work.institutions) {
      link(workEntity, { id: entityId('institution', institution), kind: 'institution', label: institution }, 'touches')
    }
    for (const topic of work.topics) {
      link(workEntity, { id: entityId('topic', topic), kind: 'topic', label: topic }, 'references')
    }
    for (const country of work.institutionCountries) {
      link(workEntity, { id: entityId('country', country), kind: 'country', label: country }, 'in_country')
    }
    link(workEntity, { id: entityId('source', 'openalex'), kind: 'source', label: 'OpenAlex' }, 'reported_by')
  }

  // Crossref: event -> DOI/work record -> publisher / venue / funder / Crossref
  // source. DOI registry metadata only; no full-text or research-claim validation
  // is inferred. Exact DOI nodes can corroborate OpenAlex records when both exist.
  if (event.crossrefWork) {
    const work = event.crossrefWork
    const doiEntity: EntityRef = { id: entityId('doi-work', work.doi), kind: 'doi-work', label: work.doi }
    link(eventEntity, doiEntity, 'about')
    if (work.publisher) {
      link(doiEntity, { id: entityId('publisher', work.publisher), kind: 'publisher', label: work.publisher }, 'issued_by')
    }
    if (work.containerTitle) {
      link(doiEntity, { id: entityId('venue', work.containerTitle), kind: 'venue', label: work.containerTitle }, 'references')
    }
    for (const funder of work.funders) {
      link(doiEntity, { id: entityId('funder', funder), kind: 'funder', label: funder }, 'references')
    }
    link(doiEntity, { id: entityId('source', 'crossref'), kind: 'source', label: 'Crossref' }, 'reported_by')
  }

  // SEC Company Facts: event -> company identity (CIK/ticker) -> financial concept
  // -> SEC source. The company resolves into the curated exposure graph by exact
  // ticker alias. Historical reported fact only — no valuation or signal inferred.
  if (event.companyFact) {
    const fact = event.companyFact
    const company: EntityRef = { id: entityId('company', fact.cik || fact.ticker), kind: 'company', label: fact.companyName }
    link(eventEntity, company, 'about')
    link(company, { id: entityId('ticker', fact.ticker), kind: 'ticker', label: fact.ticker }, 'trades_as')
    link(eventEntity, { id: entityId('financial-concept', fact.conceptLabel), kind: 'financial-concept', label: fact.conceptLabel }, 'references')
    link(eventEntity, { id: entityId('source', 'sec-company-facts'), kind: 'source', label: 'SEC Company Facts' }, 'reported_by')
  }

  // SEC Form 4: transaction -> issuer company (CIK/ticker) -> reporting owner ->
  // transaction code -> SEC source. The issuer resolves into the curated exposure
  // graph by exact ticker alias. Transaction evidence only — no sentiment inferred.
  if (event.form4Transaction) {
    const txn = event.form4Transaction
    const company: EntityRef = { id: entityId('company', txn.issuerCik || txn.issuerTicker), kind: 'company', label: txn.issuerName }
    link(eventEntity, company, 'about')
    link(company, { id: entityId('ticker', txn.issuerTicker), kind: 'ticker', label: txn.issuerTicker }, 'trades_as')
    if (txn.ownerName) {
      link(eventEntity, { id: entityId('reporting-owner', txn.ownerCik || txn.ownerName), kind: 'reporting-owner', label: txn.ownerName }, 'filed_by')
    }
    link(eventEntity, { id: entityId('transaction-code', txn.transactionCode), kind: 'transaction-code', label: `${txn.transactionCode} — ${txn.transactionCodeLabel}` }, 'references')
    link(eventEntity, { id: entityId('source', 'sec-form4'), kind: 'source', label: 'SEC Form 4' }, 'reported_by')
  }

  // SEC Form 13F: holding -> institutional filer -> issuer company (only via exact
  // CUSIP mapping) -> CUSIP -> SEC source. Quarterly delayed snapshot; no conviction
  // or company exposure inferred without an exact identity mapping.
  if (event.form13fHolding) {
    const h = event.form13fHolding
    link(eventEntity, { id: entityId('institution', h.filerCik || h.filerName), kind: 'institution', label: h.filerName }, 'filed_by')
    link(eventEntity, { id: entityId('cusip', h.cusip), kind: 'cusip', label: `${h.cusip} (${h.issuerName})` }, 'references')
    if (h.issuerTicker) {
      const company: EntityRef = { id: entityId('company', h.issuerTicker), kind: 'company', label: h.issuerName }
      link(eventEntity, company, 'about')
      link(company, { id: entityId('ticker', h.issuerTicker), kind: 'ticker', label: h.issuerTicker }, 'trades_as')
    }
    link(eventEntity, { id: entityId('source', 'sec-13f'), kind: 'source', label: 'SEC Form 13F' }, 'reported_by')
  }

  // ETF holdings: ETF -> issuer -> holding company/ticker/CUSIP. Dated issuer
  // snapshot only; no current-position, recommendation, ranking, or trading claim.
  if (event.etfHolding) {
    const h = event.etfHolding
    const etf: EntityRef = { id: entityId('etf', h.fundTicker), kind: 'etf', label: `${h.fundTicker} — ${h.fundName}` }
    const issuer: EntityRef = { id: entityId('institution', h.issuer), kind: 'institution', label: h.issuer }
    link(eventEntity, etf, 'about')
    link(etf, issuer, 'issued_by')
    if (h.holdingTicker) {
      const company: EntityRef = { id: entityId('company', h.holdingTicker), kind: 'company', label: h.holdingName }
      link(etf, company, 'holds')
      link(company, { id: entityId('ticker', h.holdingTicker), kind: 'ticker', label: h.holdingTicker }, 'trades_as')
      if (h.cusip) {
        const cusip: EntityRef = { id: entityId('cusip', h.cusip), kind: 'cusip', label: `${h.cusip} (${h.holdingName})` }
        link(cusip, company, 'represents')
      }
    } else if (h.cusip) {
      link(etf, { id: entityId('cusip', h.cusip), kind: 'cusip', label: `${h.cusip} (${h.holdingName})` }, 'holds')
    }
    if (h.sector) {
      link(etf, { id: entityId('sector', h.sector), kind: 'sector', label: h.sector }, 'in_sector')
    }
    link(eventEntity, { id: entityId('source', 'etf-holdings'), kind: 'source', label: 'ETF Holdings' }, 'reported_by')
  }

  // Generic normalized fields (apply to every connector).
  for (const ticker of event.affectedAssets ?? []) {
    link(eventEntity, { id: entityId('ticker', ticker), kind: 'ticker', label: ticker }, 'touches')
  }
  for (const sector of event.affectedSectors ?? []) {
    link(eventEntity, { id: entityId('sector', sector), kind: 'sector', label: sector }, 'in_sector')
  }
  for (const commodity of event.affectedCommodities ?? []) {
    link(eventEntity, { id: entityId('commodity', commodity), kind: 'commodity', label: commodity }, 'affects')
  }
  for (const country of event.countryCodes ?? []) {
    link(eventEntity, { id: entityId('country', country), kind: 'country', label: country }, 'in_country')
  }

  return { entities, edges }
}

export function buildEntityGraph(events: WorldIntelEvent[], options: EntityModelOptions = {}): EntityGraph {
  const now = options.now ?? Date.now()
  if (events.length === 0) {
    return { status: 'DATA_UNAVAILABLE', generatedAt: now, nodes: [], relationships: [] }
  }

  const nodeAcc = new Map<string, { ref: EntityRef; evidence: Map<string, EvidenceRef>; degree: number }>()
  const edgeAcc = new Map<string, { from: string; to: string; relation: RelationType; evidence: Map<string, EvidenceRef>; refs: { from: EntityRef; to: EntityRef } }>()

  const touchNode = (ref: EntityRef, evidence: EvidenceRef) => {
    const entry = nodeAcc.get(ref.id) ?? { ref, evidence: new Map(), degree: 0 }
    entry.evidence.set(`${evidence.eventId}|${evidence.sourceId}`, evidence)
    nodeAcc.set(ref.id, entry)
  }

  for (const event of events) {
    const evidence = evidenceOf(event)
    const { edges } = deriveEventEntities(event)
    for (const edge of edges) {
      touchNode(edge.from, evidence)
      touchNode(edge.to, evidence)
      const key = `${edge.from.id}|${edge.relation}|${edge.to.id}`
      const entry = edgeAcc.get(key) ?? {
        from: edge.from.id,
        to: edge.to.id,
        relation: edge.relation,
        evidence: new Map<string, EvidenceRef>(),
        refs: { from: edge.from, to: edge.to },
      }
      entry.evidence.set(`${evidence.eventId}|${evidence.sourceId}`, evidence)
      edgeAcc.set(key, entry)
      const fromEntry = nodeAcc.get(edge.from.id)
      const toEntry = nodeAcc.get(edge.to.id)
      if (fromEntry) fromEntry.degree += 1
      if (toEntry) toEntry.degree += 1
    }
  }

  const relationships: EntityRelationship[] = [...edgeAcc.entries()].map(([key, entry]) => {
    const evidence = [...entry.evidence.values()].sort((a, b) => b.observedAt - a.observedAt)
    const lastObservedAt = Math.max(...evidence.map((e) => e.observedAt))
    return {
      id: key,
      from: entry.from,
      to: entry.to,
      relation: entry.relation,
      evidence,
      provenance: bestProvenance(evidence),
      confidence: Math.max(...evidence.map((e) => e.confidence)),
      firstSeen: Math.min(...evidence.map((e) => e.observedAt)),
      lastObservedAt,
      freshness: freshnessState(lastObservedAt, now),
    }
  })

  const nodes: EntityNode[] = [...nodeAcc.values()].map((entry) => {
    const evidence = [...entry.evidence.values()].sort((a, b) => b.observedAt - a.observedAt)
    const lastObservedAt = Math.max(...evidence.map((e) => e.observedAt))
    const node: EntityNode = {
      ...entry.ref,
      evidence,
      provenance: bestProvenance(evidence),
      confidence: Math.max(...evidence.map((e) => e.confidence)),
      firstSeen: Math.min(...evidence.map((e) => e.observedAt)),
      lastObservedAt,
      freshness: freshnessState(lastObservedAt, now),
      degree: entry.degree,
      unknowns: [],
    }
    node.unknowns = unknownsForNode(node, relationships)
    return node
  })

  return { status: 'ok', generatedAt: now, nodes, relationships }
}

export function evidenceChainFor(event: WorldIntelEvent, options: EntityModelOptions = {}): EvidenceChain {
  const now = options.now ?? Date.now()
  const { entities } = deriveEventEntities(event)
  const touched = entities.filter((entity) => entity.kind !== 'event' && entity.kind !== 'source')
  return {
    eventId: event.id,
    whatHappened: event.title,
    whoIsConnected: touched,
    whatSourceProves: evidenceOf(event),
    whenHappened: event.timestamp,
    freshness: freshnessState(event.timestamp, now),
    entitiesTouched: touched,
    unknowns: unknownsForEvent(event, touched),
  }
}

export type EntityNeighbor = {
  entity: EntityRef
  relation: RelationType
  direction: 'out' | 'in'
}

/** Connected entities for a node, with the relation and direction. Pure/testable. */
export function neighborsOf(graph: EntityGraph, entityId: string): EntityNeighbor[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const seen = new Set<string>()
  const out: EntityNeighbor[] = []
  for (const rel of graph.relationships) {
    let otherId: string | undefined
    let direction: 'out' | 'in' | undefined
    if (rel.from === entityId) {
      otherId = rel.to
      direction = 'out'
    } else if (rel.to === entityId) {
      otherId = rel.from
      direction = 'in'
    }
    if (!otherId || !direction) continue
    const node = byId.get(otherId)
    if (!node) continue
    const key = `${rel.relation}|${direction}|${otherId}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ entity: { id: node.id, kind: node.kind, label: node.label }, relation: rel.relation, direction })
  }
  return out
}

export function summarizeEntityGraph(graph: EntityGraph): { nodeCount: number; edgeCount: number; byKind: Record<string, number> } {
  const byKind: Record<string, number> = {}
  for (const node of graph.nodes) byKind[node.kind] = (byKind[node.kind] ?? 0) + 1
  return { nodeCount: graph.nodes.length, edgeCount: graph.relationships.length, byKind }
}

function bestProvenance(evidence: EvidenceRef[]): ProvenanceId {
  return evidence.reduce(
    (best, current) => (provenanceTrust(current.provenance) > provenanceTrust(best) ? current.provenance : best),
    evidence[0]?.provenance ?? 'local-derived',
  )
}

function unknownsForNode(node: EntityNode, relationships: EntityRelationship[]): string[] {
  const unknowns: string[] = []
  const outgoing = relationships.filter((rel) => rel.from === node.id)
  if (node.kind === 'company') {
    if (!outgoing.some((rel) => rel.relation === 'trades_as')) unknowns.push('No ticker mapping')
    if (!relationships.some((rel) => rel.to === node.id && rel.relation === 'in_sector')) unknowns.push('Sector unknown')
  }
  if (node.kind === 'vulnerability' && !outgoing.some((rel) => rel.relation === 'affects')) {
    unknowns.push('Affected vendor/product unknown')
  }
  if (provenanceTrust(node.provenance) < 0.5) unknowns.push('Best source is unverified/low-trust')
  if (node.freshness === 'stale' || node.freshness === 'unavailable') unknowns.push('Evidence may be stale')
  return unknowns
}

function unknownsForEvent(event: WorldIntelEvent, touched: EntityRef[]): string[] {
  const unknowns: string[] = []
  if (event.secFiling && !event.secFiling.ticker) unknowns.push('Filing has no mapped ticker')
  const cveId =
    event.kevVulnerability?.cveId ??
    event.nvdCve?.cveId ??
    event.ghsaAdvisory?.cveId ??
    event.osvVulnerability?.relatedCveIds[0] ??
    event.cisaAdvisory?.relatedCveIds[0]
  if (cveId && !touched.some((entity) => entity.kind === 'technology')) {
    unknowns.push('Affected vendor/product not yet linked')
  }
  const osv = event.osvVulnerability
  if (osv) {
    if (osv.relatedCveIds.length === 0) unknowns.push('No linked CVE alias')
    if (osv.affectedPackages.length === 0) unknowns.push('No affected package')
    if (!osv.severity) unknowns.push('No severity')
  }
  const cisa = event.cisaAdvisory
  if (cisa) {
    if (cisa.relatedCveIds.length === 0) unknowns.push('No linked CVE')
    if (cisa.vendors.length === 0 && cisa.products.length === 0) unknowns.push('No affected vendor/product')
    if (!cisa.updatedTimestamp) unknowns.push('No updated timestamp')
  }
  const quake = event.earthquakeEvent
  if (quake) {
    if (!quake.countryCode) unknowns.push('No mapped country')
    if (quake.depthKm === undefined) unknowns.push('No depth reported')
  }
  const facility = event.eiaFacility
  if (facility) {
    if (facility.geospatialPrecision !== 'exact') unknowns.push(`Location ${facility.geospatialPrecision} (no source coordinates)`)
    if (!facility.operatorTicker) unknowns.push('Operator not linked to a market identity')
    if (facility.capacityMw === undefined) unknowns.push('No source-reported capacity')
    if (!facility.primaryFuel) unknowns.push('No primary fuel reported')
  }
  const refinery = event.eiaRefinery
  if (refinery) {
    if (refinery.geospatialPrecision !== 'exact') unknowns.push(`Location ${refinery.geospatialPrecision} (no source coordinates)`)
    if (!refinery.operatorTicker) unknowns.push('Operator not linked to a market identity')
    if (refinery.crudeCapacity === undefined) unknowns.push('No source-reported crude capacity')
    if (!refinery.products || refinery.products.length === 0) unknowns.push('No source-named refined products')
  }
  const lng = event.lngTerminal
  if (lng) {
    if (lng.geospatialPrecision !== 'exact') unknowns.push(`Location ${lng.geospatialPrecision} (no source coordinates)`)
    if (!lng.operatorTicker) unknowns.push('Operator not linked to a market identity')
    if (!lng.terminalType) unknowns.push('No source-backed terminal type')
    if (lng.capacity === undefined) unknowns.push('No source-reported capacity')
  }
  const nuke = event.nuclearPlant
  if (nuke) {
    if (nuke.geospatialPrecision !== 'exact') unknowns.push(`Location ${nuke.geospatialPrecision} (no source coordinates)`)
    if (!nuke.operatorTicker) unknowns.push('Operator not linked to a market identity')
    if (nuke.capacityMw === undefined) unknowns.push('No source-reported capacity')
    if (!nuke.reactorType) unknowns.push('No NRC reactor-type enrichment')
  }
  const nrc = event.nrcReactorStatus
  if (nrc) {
    unknowns.push('Reactor status has no coordinates (NRC status feed)')
    unknowns.push('Not linked to an EIA facility (no fuzzy merge)')
  }
  const grid = event.gridRegion
  if (grid) {
    unknowns.push('Region geometry unavailable (region-only)')
    if (!grid.nercRegion) unknowns.push('No NERC region mapping')
    if (!grid.statesServed || grid.statesServed.length === 0) unknowns.push('States served not enumerated from this source')
    if (!grid.operatorTicker) unknowns.push('Operator not linked to a market identity')
  }
  const loc = event.unLocode
  if (loc) {
    if (loc.geospatialPrecision !== 'exact') unknowns.push(`Location ${loc.geospatialPrecision} (no source coordinates; World Port Index enrichment pending)`)
    unknowns.push('Code registry only — not proof of live port operations')
    if (!loc.subdivision) unknowns.push('No subdivision in source row')
  }
  if ((event.confidence ?? 0) < 90) unknowns.push('Below high-confidence threshold')
  if (provenanceTrust(event.provenance) < 0.5) unknowns.push('Source is unverified/low-trust')
  if (touched.length === 0) unknowns.push('No entities linked yet')
  return unknowns
}
