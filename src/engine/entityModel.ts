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

export type EntityKind =
  | 'company'
  | 'ticker'
  | 'index'
  | 'sector'
  | 'country'
  | 'port'
  | 'chokepoint'
  | 'trade-route'
  | 'infrastructure'
  | 'commodity'
  | 'technology'
  | 'vulnerability'
  | 'repository'
  | 'patent'
  | 'regulatory-document'
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
  if ((event.confidence ?? 0) < 90) unknowns.push('Below high-confidence threshold')
  if (provenanceTrust(event.provenance) < 0.5) unknowns.push('Source is unverified/low-trust')
  if (touched.length === 0) unknowns.push('No entities linked yet')
  return unknowns
}
