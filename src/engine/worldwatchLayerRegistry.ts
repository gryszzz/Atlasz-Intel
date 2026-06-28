import type { ProvenanceId } from '../provenance'
import type { OsintSourceSnapshot, WorldIntelEvent, WorldIntelSnapshot } from '../worldIntel'

export type WorldwatchLayerId =
  | 'weather-alerts'
  | 'earthquakes'
  | 'power-plants'
  | 'refineries'
  | 'lng-terminals'
  | 'nuclear-plants'
  | 'reactor-status'
  | 'grid-regions'
  | 'ports-locode'
  | 'ports-world-index'
  | 'minerals'
  | 'sanctions'
  | 'policy'
  | 'market-evidence'
  | 'etf-holdings'
  | 'trade-flows'
  | 'vulnerabilities'
  | 'media-observations'

export type WorldwatchLayerKind = 'hazard' | 'facility' | 'policy' | 'market' | 'trade' | 'cyber' | 'media'
export type WorldwatchLayerStatus = 'online' | 'attention' | 'missing-config' | 'inactive'
export type WorldwatchGeometryKind = 'point' | 'region' | 'arc' | 'context'
export type WorldwatchVisualTrust = 'official' | 'public' | 'media' | 'structural' | 'unavailable'
export type WorldwatchRenderMode = 'cesium-3d' | 'webgl-unavailable-fallback' | 'atlasz-2d-fallback'
export type WorldwatchLayerCadence =
  | 'near-realtime'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'static-reference'
  | 'configured-only'
export type WorldwatchMarkerRenderer = 'point-marker' | 'region-overlay' | 'arc-path' | 'context-row'
export type WorldwatchStaleRenderer = 'dimmed-marker' | 'dashed-region' | 'stale-context-row'

export type WorldwatchLayerDefinition = {
  id: WorldwatchLayerId
  label: string
  kind: WorldwatchLayerKind
  description: string
  sourceIds: string[]
  trustTier: ProvenanceId | 'mixed' | 'curated-reference'
  cadence: WorldwatchLayerCadence
  proofRequirements: string[]
  geometry: WorldwatchGeometryKind
  markerRenderer: WorldwatchMarkerRenderer
  staleRenderer: WorldwatchStaleRenderer
  sourceTrailHandler: string
  defaultEnabled: boolean
  maxEntities: number
  nonClaims: string[]
}

type WorldwatchLayerDefinitionInput = Omit<
  WorldwatchLayerDefinition,
  'trustTier' | 'cadence' | 'proofRequirements' | 'markerRenderer' | 'staleRenderer' | 'sourceTrailHandler'
>

type WorldwatchLayerMetadata = Pick<
  WorldwatchLayerDefinition,
  'trustTier' | 'cadence' | 'proofRequirements' | 'markerRenderer' | 'staleRenderer' | 'sourceTrailHandler'
>

export type WorldwatchLayerState = WorldwatchLayerDefinition & {
  status: WorldwatchLayerStatus
  disabledReason?: string
  entityCount: number
  sourceCount: number
  onlineSourceCount: number
  staleEntityCount: number
  freshnessHeat: 'fresh' | 'mixed' | 'stale' | 'empty'
}

export type WorldwatchProofTrail = {
  sourceId: string
  sourceUrl: string
  rawPayloadHash: string
  retrievedAt: number
  staleAt?: number
  provenance: ProvenanceId
  confidence: number
}

export type WorldwatchEntity = {
  id: string
  layerId: WorldwatchLayerId
  eventId: string
  kind: WorldwatchLayerKind
  geometry: WorldwatchGeometryKind
  label: string
  summary: string
  region: string
  countryCodes: string[]
  lat?: number
  lon?: number
  sourceId: string
  timestamp: number
  proof: WorldwatchProofTrail
  visualTrust: WorldwatchVisualTrust
  stale: boolean
  unknowns: string[]
  nonClaims: string[]
  exposureContext: string[]
}

export type WorldwatchProjectedEntity = WorldwatchEntity & {
  x: number
  y: number
}

export type WorldwatchSelectionDossier = {
  entity: WorldwatchEntity
  title: string
  sourceTrail: WorldwatchProofTrail
  unknowns: string[]
  nonClaims: string[]
  exposureContext: string[]
}

export type WorldwatchLayerSnapshot = {
  layers: WorldwatchLayerState[]
  entities: WorldwatchEntity[]
  entitiesByLayer: Record<WorldwatchLayerId, WorldwatchEntity[]>
  updatedAt?: number
}

export type BuildWorldwatchLayersOptions = {
  now?: number
  events?: WorldIntelEvent[]
}

const DEFAULT_PROOF_REQUIREMENTS = ['sourceUrl', 'retrievedAt', 'rawPayloadHash', 'confidence', 'provenance']

function metadata(
  trustTier: WorldwatchLayerMetadata['trustTier'],
  cadence: WorldwatchLayerCadence,
  markerRenderer: WorldwatchMarkerRenderer,
  staleRenderer: WorldwatchStaleRenderer,
  sourceTrailHandler: string,
): WorldwatchLayerMetadata {
  return {
    trustTier,
    cadence,
    proofRequirements: DEFAULT_PROOF_REQUIREMENTS,
    markerRenderer,
    staleRenderer,
    sourceTrailHandler,
  }
}

const LAYER_METADATA: Record<WorldwatchLayerId, WorldwatchLayerMetadata> = {
  'weather-alerts': metadata('official-api', 'near-realtime', 'region-overlay', 'dashed-region', 'WeatherAlertSourceTrail'),
  earthquakes: metadata('official-api', 'near-realtime', 'point-marker', 'dimmed-marker', 'WorldEventTimeline'),
  'power-plants': metadata('official-api', 'monthly', 'point-marker', 'dimmed-marker', 'EiaFacilitySourceTrail'),
  refineries: metadata('official-api', 'static-reference', 'point-marker', 'dimmed-marker', 'EiaRefinerySourceTrail'),
  'lng-terminals': metadata('official-api', 'static-reference', 'point-marker', 'dimmed-marker', 'LngTerminalSourceTrail'),
  'nuclear-plants': metadata('official-api', 'monthly', 'point-marker', 'dimmed-marker', 'NuclearPlantSourceTrail'),
  'reactor-status': metadata('official-api', 'daily', 'context-row', 'stale-context-row', 'NrcReactorStatusSourceTrail'),
  'grid-regions': metadata('official-api', 'static-reference', 'region-overlay', 'dashed-region', 'GridRegionSourceTrail'),
  'ports-locode': metadata('official-api', 'static-reference', 'point-marker', 'dimmed-marker', 'PortLocodeSourceTrail'),
  'ports-world-index': metadata('official-api', 'static-reference', 'point-marker', 'dimmed-marker', 'WorldPortIndexSourceTrail'),
  minerals: metadata('official-api', 'static-reference', 'point-marker', 'dimmed-marker', 'MineralSiteSourceTrail'),
  sanctions: metadata('official-api', 'daily', 'region-overlay', 'dashed-region', 'OfacSourceTrail'),
  policy: metadata('official-api', 'daily', 'region-overlay', 'dashed-region', 'RegulatorySourceTrail/CongressSourceTrail'),
  'market-evidence': metadata('public-disclosure', 'daily', 'context-row', 'stale-context-row', 'MarketIdentitySourceTrail/SECSourceTrails'),
  'etf-holdings': metadata('public-disclosure', 'daily', 'context-row', 'stale-context-row', 'EtfHoldingsSourceTrail'),
  'trade-flows': metadata('official-api', 'annual', 'arc-path', 'stale-context-row', 'ComtradeSourceTrail'),
  vulnerabilities: metadata('mixed', 'daily', 'context-row', 'stale-context-row', 'CveSourceTrailPanel'),
  'media-observations': metadata('media-observation', 'near-realtime', 'region-overlay', 'dashed-region', 'GdeltSourceTrail'),
}

const WORLDWATCH_LAYER_BASE_DEFINITIONS: WorldwatchLayerDefinitionInput[] = [
  {
    id: 'weather-alerts',
    label: 'NOAA alerts',
    kind: 'hazard',
    description: 'Live weather hazard context from NOAA/NWS alerts.',
    sourceIds: ['noaa-alerts'],
    geometry: 'region',
    defaultEnabled: true,
    maxEntities: 40,
    nonClaims: ['Does not prove asset damage, facility impact, outage, or disruption.'],
  },
  {
    id: 'earthquakes',
    label: 'USGS quakes',
    kind: 'hazard',
    description: 'USGS earthquake observations with source-backed coordinates.',
    sourceIds: ['usgs-earthquakes'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Does not prove infrastructure damage, casualty impact, or market impact.'],
  },
  {
    id: 'power-plants',
    label: 'Power plants',
    kind: 'facility',
    description: 'Official EIA generation facility context.',
    sourceIds: ['eia-power-plants'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 120,
    nonClaims: ['Facility location only; no outage, attack, damage, or reliability claim.'],
  },
  {
    id: 'refineries',
    label: 'Refineries',
    kind: 'facility',
    description: 'Official EIA refinery facility context.',
    sourceIds: ['eia-refineries'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Facility and capacity context only; no outage, disruption, or flow claim.'],
  },
  {
    id: 'lng-terminals',
    label: 'LNG terminals',
    kind: 'facility',
    description: 'Official LNG terminal location/capacity context.',
    sourceIds: ['lng-terminals'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Terminal context only; no cargo, export-flow, outage, or disruption claim.'],
  },
  {
    id: 'nuclear-plants',
    label: 'Nuclear plants',
    kind: 'facility',
    description: 'Official EIA nuclear plant geospatial context.',
    sourceIds: ['eia-nuclear'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Plant context only; no safety, emergency, outage, or vulnerability claim.'],
  },
  {
    id: 'reactor-status',
    label: 'NRC status',
    kind: 'facility',
    description: 'NRC reactor power status observations.',
    sourceIds: ['nrc-reactor-status'],
    geometry: 'region',
    defaultEnabled: false,
    maxEntities: 120,
    nonClaims: ['Regulatory power-status row only; not an Atlasz safety assessment.'],
  },
  {
    id: 'grid-regions',
    label: 'Grid regions',
    kind: 'facility',
    description: 'EIA balancing authority and grid region reference context.',
    sourceIds: ['eia-balancing-authorities'],
    geometry: 'region',
    defaultEnabled: false,
    maxEntities: 100,
    nonClaims: ['Region context only; no grid stress, outage, emergency, or reliability claim.'],
  },
  {
    id: 'ports-locode',
    label: 'UN/LOCODE',
    kind: 'trade',
    description: 'Official UNECE transport location registry.',
    sourceIds: ['un-locode'],
    geometry: 'point',
    defaultEnabled: false,
    maxEntities: 120,
    nonClaims: ['Registry location only; no live port traffic, congestion, or disruption claim.'],
  },
  {
    id: 'ports-world-index',
    label: 'World Port Index',
    kind: 'trade',
    description: 'NGA World Port Index physical port records.',
    sourceIds: ['world-port-index'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 160,
    nonClaims: ['Physical port context only; no vessel traffic, congestion, or company exposure claim.'],
  },
  {
    id: 'minerals',
    label: 'USGS minerals',
    kind: 'facility',
    description: 'USGS mineral site reference context.',
    sourceIds: ['usgs-minerals'],
    geometry: 'point',
    defaultEnabled: true,
    maxEntities: 100,
    nonClaims: ['Site context only; no reserve, production, ownership, or trading signal claim.'],
  },
  {
    id: 'sanctions',
    label: 'OFAC sanctions',
    kind: 'policy',
    description: 'OFAC sanctions records and jurisdiction overlays.',
    sourceIds: ['ofac-sdn'],
    geometry: 'region',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Sanctions record only; no inferred supplier, customer, or market exposure.'],
  },
  {
    id: 'policy',
    label: 'Policy',
    kind: 'policy',
    description: 'Federal Register and Congress.gov policy events.',
    sourceIds: ['federal-register', 'congress-gov'],
    geometry: 'region',
    defaultEnabled: true,
    maxEntities: 80,
    nonClaims: ['Policy record only; no prediction of passage, enforcement outcome, or price impact.'],
  },
  {
    id: 'market-evidence',
    label: 'Companies',
    kind: 'market',
    description: 'SEC and market-reference evidence as exposure context.',
    sourceIds: ['sec-edgar', 'market-reference-master', 'sec-company-facts', 'sec-form4', 'sec-form13f'],
    geometry: 'context',
    defaultEnabled: true,
    maxEntities: 120,
    nonClaims: ['Company context only; no trading advice, recommendation, valuation, or price prediction.'],
  },
  {
    id: 'etf-holdings',
    label: 'ETF holdings',
    kind: 'market',
    description: 'Issuer-published ETF holdings as source-bounded exposure context.',
    sourceIds: ['etf-holdings'],
    geometry: 'context',
    defaultEnabled: false,
    maxEntities: 120,
    nonClaims: ['Basket membership only; no current-position guarantee, advice, or prediction.'],
  },
  {
    id: 'trade-flows',
    label: 'Comtrade flows',
    kind: 'trade',
    description: 'UN Comtrade country and commodity flow observations.',
    sourceIds: ['un-comtrade'],
    geometry: 'arc',
    defaultEnabled: false,
    maxEntities: 80,
    nonClaims: ['Country/commodity flow only; no company-level exposure or supply-chain claim.'],
  },
  {
    id: 'vulnerabilities',
    label: 'Vulnerabilities',
    kind: 'cyber',
    description: 'CVE, KEV, GHSA, OSV, and CISA advisory evidence.',
    sourceIds: ['nvd', 'cisa-kev', 'ghsa', 'osv', 'cisa-advisories'],
    geometry: 'context',
    defaultEnabled: true,
    maxEntities: 100,
    nonClaims: ['Defensive metadata only; no exploit guidance or exploitation claim.'],
  },
  {
    id: 'media-observations',
    label: 'GDELT media',
    kind: 'media',
    description: 'GDELT article observations rendered as low-trust attention context.',
    sourceIds: ['gdelt-doc'],
    geometry: 'region',
    defaultEnabled: false,
    maxEntities: 60,
    nonClaims: ['Media observation only; not verified fact, corroboration, or official evidence.'],
  },
]

export const WORLDWATCH_LAYER_DEFINITIONS: WorldwatchLayerDefinition[] = WORLDWATCH_LAYER_BASE_DEFINITIONS.map((layer) => ({
  ...layer,
  ...LAYER_METADATA[layer.id],
}))

export const DEFAULT_WORLDWATCH_LAYER_IDS = WORLDWATCH_LAYER_DEFINITIONS.filter((layer) => layer.defaultEnabled).map(
  (layer) => layer.id,
)

const EMPTY_ENTITIES_BY_LAYER = WORLDWATCH_LAYER_DEFINITIONS.reduce(
  (acc, layer) => {
    acc[layer.id] = []
    return acc
  },
  {} as Record<WorldwatchLayerId, WorldwatchEntity[]>,
)

const OFFICIAL_PROVENANCE = new Set<ProvenanceId>(['official-api', 'public-disclosure'])
const STRUCTURAL_PROVENANCE = new Set<ProvenanceId>(['local-derived', 'local-computed', 'math-derived', 'model-inferred'])

export class WorldwatchLayerRegistry {
  private readonly definitions: WorldwatchLayerDefinition[]

  constructor(definitions: WorldwatchLayerDefinition[] = WORLDWATCH_LAYER_DEFINITIONS) {
    this.definitions = definitions
  }

  materialize(snapshot: WorldIntelSnapshot, options: BuildWorldwatchLayersOptions = {}): WorldwatchLayerSnapshot {
    return buildWorldwatchLayerSnapshot(snapshot, options, this.definitions)
  }
}

export class WorldwatchEntityRenderer {
  static project(entity: WorldwatchEntity): WorldwatchProjectedEntity {
    return { ...entity, ...projectWorldwatchEntity(entity) }
  }
}

export function buildWorldwatchLayerSnapshot(
  snapshot: WorldIntelSnapshot,
  options: BuildWorldwatchLayersOptions = {},
  definitions: WorldwatchLayerDefinition[] = WORLDWATCH_LAYER_DEFINITIONS,
): WorldwatchLayerSnapshot {
  const now = options.now ?? Date.now()
  const sourceById = new Map(snapshot.sources.map((source) => [source.sourceId, source]))
  const entities = adaptWorldwatchEventsToEntities(options.events ?? snapshot.worldEvents, { now, definitions })
  const entitiesByLayer = definitions.reduce(
    (acc, layer) => {
      acc[layer.id] = []
      return acc
    },
    { ...EMPTY_ENTITIES_BY_LAYER } as Record<WorldwatchLayerId, WorldwatchEntity[]>,
  )

  for (const entity of entities) {
    entitiesByLayer[entity.layerId].push(entity)
  }

  const layers = definitions.map((definition) => buildLayerState(definition, sourceById, entitiesByLayer[definition.id] ?? []))

  return {
    layers,
    entities,
    entitiesByLayer,
    updatedAt: snapshot.updatedAt,
  }
}

export function adaptWorldwatchEventsToEntities(
  events: WorldIntelEvent[],
  options: { now?: number; definitions?: WorldwatchLayerDefinition[] } = {},
): WorldwatchEntity[] {
  const now = options.now ?? Date.now()
  const definitions = options.definitions ?? WORLDWATCH_LAYER_DEFINITIONS
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]))
  const byLayer = new Map<WorldwatchLayerId, WorldwatchEntity[]>()

  for (const event of events) {
    const proof = buildProofTrail(event)
    if (!proof) continue

    for (const layerId of classifyEventLayers(event)) {
      const definition = definitionById.get(layerId)
      if (!definition) continue
      const current = byLayer.get(layerId) ?? []
      if (current.length >= definition.maxEntities) continue
      const entity = buildEntity(event, definition, proof, now)
      if (!entity) continue
      current.push(entity)
      byLayer.set(layerId, current)
    }
  }

  return [...byLayer.values()]
    .flat()
    .sort((left, right) => Number(left.stale) - Number(right.stale) || right.timestamp - left.timestamp)
}

export function buildWorldwatchSelectionDossier(entity: WorldwatchEntity): WorldwatchSelectionDossier {
  return {
    entity,
    title: entity.label,
    sourceTrail: entity.proof,
    unknowns: entity.unknowns,
    nonClaims: entity.nonClaims,
    exposureContext: entity.exposureContext,
  }
}

export function projectWorldwatchEntity(entity: WorldwatchEntity): { x: number; y: number } {
  const lon = Number.isFinite(entity.lon) ? entity.lon! : 0
  const lat = Number.isFinite(entity.lat) ? entity.lat! : 12
  return {
    x: Math.min(94, Math.max(6, ((lon + 180) / 360) * 100)),
    y: Math.min(88, Math.max(12, ((90 - lat) / 180) * 100)),
  }
}

export function resolveWorldwatchRenderMode({
  webglAvailable,
  cesiumAvailable,
}: {
  webglAvailable: boolean
  cesiumAvailable?: boolean
}): WorldwatchRenderMode {
  if (!webglAvailable) return 'webgl-unavailable-fallback'
  return cesiumAvailable ? 'cesium-3d' : 'atlasz-2d-fallback'
}

function buildLayerState(
  definition: WorldwatchLayerDefinition,
  sourceById: Map<string, OsintSourceSnapshot>,
  entities: WorldwatchEntity[],
): WorldwatchLayerState {
  const sources = definition.sourceIds.map((sourceId) => sourceById.get(sourceId)).filter((source): source is OsintSourceSnapshot => Boolean(source))
  const onlineSourceCount = sources.filter((source) => source.status === 'online').length
  const entityCount = entities.length
  const staleEntityCount = entities.filter((entity) => entity.stale).length
  const missingConfig = sources.some((source) => source.configured === false || source.status === 'disabled')
  const attention = sources.some((source) => source.status === 'failed' || source.status === 'rate-limited' || source.status === 'offline')
  const status: WorldwatchLayerStatus =
    onlineSourceCount > 0 || entityCount > 0 ? 'online' : missingConfig ? 'missing-config' : attention ? 'attention' : 'inactive'

  return {
    ...definition,
    status,
    disabledReason: disabledReason(status, sources, definition),
    entityCount,
    sourceCount: sources.length,
    onlineSourceCount,
    staleEntityCount,
    freshnessHeat: freshnessHeat(entityCount, staleEntityCount),
  }
}

function freshnessHeat(entityCount: number, staleEntityCount: number): WorldwatchLayerState['freshnessHeat'] {
  if (entityCount === 0) return 'empty'
  if (staleEntityCount === 0) return 'fresh'
  if (staleEntityCount === entityCount) return 'stale'
  return 'mixed'
}

function disabledReason(
  status: WorldwatchLayerStatus,
  sources: OsintSourceSnapshot[],
  definition: WorldwatchLayerDefinition,
): string | undefined {
  if (status === 'online') return undefined
  if (status === 'missing-config') {
    const configuredOnly = sources.find((source) => source.configured === false || source.status === 'disabled')
    return configuredOnly?.configHint ?? `${definition.label} connector is inactive or missing config.`
  }
  if (status === 'attention') {
    return sources.find((source) => source.lastError)?.lastError ?? `${definition.label} source needs attention.`
  }
  return sources.length === 0 ? `${definition.label} source is not present in the runtime registry.` : `${definition.label} has no proof-backed records in view.`
}

function classifyEventLayers(event: WorldIntelEvent): WorldwatchLayerId[] {
  const layerIds: WorldwatchLayerId[] = []
  if (event.weatherAlert) layerIds.push('weather-alerts')
  if (event.earthquakeEvent) layerIds.push('earthquakes')
  if (event.eiaFacility) layerIds.push('power-plants')
  if (event.eiaRefinery) layerIds.push('refineries')
  if (event.lngTerminal) layerIds.push('lng-terminals')
  if (event.nuclearPlant) layerIds.push('nuclear-plants')
  if (event.nrcReactorStatus) layerIds.push('reactor-status')
  if (event.gridRegion) layerIds.push('grid-regions')
  if (event.unLocode) layerIds.push('ports-locode')
  if (event.worldPort) layerIds.push('ports-world-index')
  if (event.mineralSite) layerIds.push('minerals')
  if (event.ofacSanctionsRecord) layerIds.push('sanctions')
  if (event.regulatoryDocument || event.congressBillAction) layerIds.push('policy')
  if (event.marketIdentity || event.companyFact || event.form4Transaction || event.form13fHolding || event.secFiling) {
    layerIds.push('market-evidence')
  }
  if (event.etfHolding) layerIds.push('etf-holdings')
  if (event.comtradeRecord) layerIds.push('trade-flows')
  if (event.kevVulnerability || event.nvdCve || event.ghsaAdvisory || event.osvVulnerability || event.cisaAdvisory) {
    layerIds.push('vulnerabilities')
  }
  if (event.gdeltArticle) layerIds.push('media-observations')
  return layerIds
}

function buildEntity(
  event: WorldIntelEvent,
  definition: WorldwatchLayerDefinition,
  proof: WorldwatchProofTrail,
  now: number,
): WorldwatchEntity | null {
  const label = entityLabel(event, definition.id)
  if (!label) return null
  const coords = coordinatesForEvent(event)
  const geometry = geometryForEntity(definition, event, coords)
  return {
    id: `${definition.id}:${event.id}`,
    layerId: definition.id,
    eventId: event.id,
    kind: definition.kind,
    geometry,
    label,
    summary: entitySummary(event, definition.id),
    region: event.region,
    countryCodes: event.countryCodes,
    lat: geometry === 'point' ? coords?.lat : undefined,
    lon: geometry === 'point' ? coords?.lon : undefined,
    sourceId: event.sourceId,
    timestamp: event.timestamp,
    proof,
    visualTrust: visualTrustFor(event.provenance),
    stale: isEntityStale(proof, now),
    unknowns: buildUnknowns(event, definition, proof, geometry),
    nonClaims: definition.nonClaims,
    exposureContext: exposureContextFor(event, definition.id),
  }
}

function buildProofTrail(event: WorldIntelEvent): WorldwatchProofTrail | null {
  if (event.provenance === 'simulated') return null
  const records = proofRecords(event)
  for (const record of records) {
    const sourceUrl = firstUrl(record)
    const rawPayloadHash = stringValue(record.rawPayloadHash) ?? event.rawPayloadHash
    const retrievedAt = numberValue(record.retrievedAt) ?? event.timestamp
    const confidence = numberValue(record.confidence) ?? event.confidence
    const provenance = (stringValue(record.provenance) ?? event.provenance) as ProvenanceId
    if (!sourceUrl || !rawPayloadHash || !Number.isFinite(retrievedAt) || confidence <= 0) continue
    return {
      sourceId: event.sourceId,
      sourceUrl,
      rawPayloadHash,
      retrievedAt,
      staleAt: numberValue(record.staleAt),
      provenance,
      confidence,
    }
  }
  return null
}

function proofRecords(event: WorldIntelEvent): Array<Record<string, unknown>> {
  return [
    event as unknown as Record<string, unknown>,
    event.weatherAlert,
    event.secFiling,
    event.fredObservation,
    event.treasuryFiscalRecord,
    event.beaObservation,
    event.blsObservation,
    event.eiaEnergyRecord,
    event.eiaFacility,
    event.eiaRefinery,
    event.lngTerminal,
    event.nuclearPlant,
    event.nrcReactorStatus,
    event.gridRegion,
    event.unLocode,
    event.worldPort,
    event.mineralSite,
    event.kevVulnerability,
    event.nvdCve,
    event.ghsaAdvisory,
    event.osvVulnerability,
    event.cisaAdvisory,
    event.githubRelease,
    event.earthquakeEvent,
    event.patentRecord,
    event.regulatoryDocument,
    event.ofacSanctionsRecord,
    event.congressBillAction,
    event.gdeltArticle,
    event.comtradeRecord,
    event.openAlexWork,
    event.crossrefWork,
    event.marketIdentity,
    event.companyFact,
    event.form4Transaction,
    event.form13fHolding,
    event.etfHolding,
  ].filter((record): record is Record<string, unknown> => Boolean(record))
}

function firstUrl(record: Record<string, unknown>): string | undefined {
  const keys = [
    'sourceUrl',
    'sourceApiUrl',
    'sourceDataUrl',
    'sourceFeedUrl',
    'officialUrl',
    'htmlUrl',
    'pdfUrl',
    'url',
    'openAlexUrl',
    'doiUrl',
    'sourceFilingUrl',
    'sourceInfoTableUrl',
  ]
  for (const key of keys) {
    const value = stringValue(record[key])
    if (value && /^https:\/\//i.test(value)) return value
  }
  return undefined
}

function entityLabel(event: WorldIntelEvent, layerId: WorldwatchLayerId): string | undefined {
  switch (layerId) {
    case 'weather-alerts':
      return event.weatherAlert?.headline ?? event.weatherAlert?.event ?? event.title
    case 'earthquakes':
      return event.earthquakeEvent ? `M${event.earthquakeEvent.magnitude} ${event.earthquakeEvent.place}` : event.title
    case 'power-plants':
      return event.eiaFacility?.facilityName
    case 'refineries':
      return event.eiaRefinery?.facilityName
    case 'lng-terminals':
      return event.lngTerminal?.facilityName
    case 'nuclear-plants':
      return event.nuclearPlant?.facilityName
    case 'reactor-status':
      return event.nrcReactorStatus?.unitName
    case 'grid-regions':
      return event.gridRegion?.baName
    case 'ports-locode':
      return event.unLocode ? `${event.unLocode.locode} ${event.unLocode.locationName}` : undefined
    case 'ports-world-index':
      return event.worldPort?.portName
    case 'minerals':
      return event.mineralSite?.siteName
    case 'sanctions':
      return event.ofacSanctionsRecord?.name
    case 'policy':
      return event.regulatoryDocument?.title ?? event.congressBillAction?.title
    case 'market-evidence':
      return event.marketIdentity?.ticker ?? event.companyFact?.ticker ?? event.form4Transaction?.issuerTicker ?? event.form13fHolding?.issuerTicker ?? event.secFiling?.ticker ?? event.title
    case 'etf-holdings':
      return event.etfHolding ? `${event.etfHolding.fundTicker} -> ${event.etfHolding.holdingTicker ?? event.etfHolding.holdingName}` : undefined
    case 'trade-flows':
      return event.comtradeRecord ? `${event.comtradeRecord.reporterDesc} -> ${event.comtradeRecord.partnerDesc}` : undefined
    case 'vulnerabilities':
      return (
        event.nvdCve?.cveId ??
        event.kevVulnerability?.cveId ??
        event.ghsaAdvisory?.ghsaId ??
        event.osvVulnerability?.osvId ??
        event.cisaAdvisory?.advisoryId
      )
    case 'media-observations':
      return event.gdeltArticle?.title
  }
}

function entitySummary(event: WorldIntelEvent, layerId: WorldwatchLayerId): string {
  if (layerId === 'trade-flows' && event.comtradeRecord) {
    return `${event.comtradeRecord.commodityDescription} ${event.comtradeRecord.flowDesc} value ${event.comtradeRecord.tradeValue}.`
  }
  if (layerId === 'reactor-status' && event.nrcReactorStatus) {
    return `NRC reports ${event.nrcReactorStatus.powerPercent}% power for ${event.nrcReactorStatus.reportDate}.`
  }
  if (layerId === 'etf-holdings' && event.etfHolding) {
    return `${event.etfHolding.holdingName} appears in ${event.etfHolding.fundName} source holdings dated ${event.etfHolding.sourceDate}.`
  }
  return event.summary || event.title
}

function coordinatesForEvent(event: WorldIntelEvent): { lat: number; lon: number } | undefined {
  const pairs = [
    { lat: event.lat, lon: event.lon },
    { lat: event.earthquakeEvent?.lat, lon: event.earthquakeEvent?.lon },
    { lat: event.eiaFacility?.latitude, lon: event.eiaFacility?.longitude },
    { lat: event.eiaRefinery?.latitude, lon: event.eiaRefinery?.longitude },
    { lat: event.lngTerminal?.latitude, lon: event.lngTerminal?.longitude },
    { lat: event.nuclearPlant?.latitude, lon: event.nuclearPlant?.longitude },
    { lat: event.unLocode?.latitude, lon: event.unLocode?.longitude },
    { lat: event.worldPort?.latitude, lon: event.worldPort?.longitude },
    { lat: event.mineralSite?.latitude, lon: event.mineralSite?.longitude },
  ]
  return pairs.find((pair): pair is { lat: number; lon: number } => Number.isFinite(pair.lat) && Number.isFinite(pair.lon))
}

function geometryForEntity(
  definition: WorldwatchLayerDefinition,
  event: WorldIntelEvent,
  coords: { lat: number; lon: number } | undefined,
): WorldwatchGeometryKind {
  if (definition.geometry === 'context') return 'context'
  if (definition.geometry === 'arc' && event.comtradeRecord?.reporterIso3 && event.comtradeRecord.partnerIso3) return 'arc'
  if (definition.geometry === 'point' && coords) return 'point'
  return definition.geometry === 'point' ? 'region' : definition.geometry
}

function visualTrustFor(provenance: ProvenanceId): WorldwatchVisualTrust {
  if (provenance === 'media-observation') return 'media'
  if (STRUCTURAL_PROVENANCE.has(provenance)) return 'structural'
  if (OFFICIAL_PROVENANCE.has(provenance)) return 'official'
  if (provenance === 'unavailable' || provenance === 'auth-gated') return 'unavailable'
  return 'public'
}

function isEntityStale(proof: WorldwatchProofTrail, now: number): boolean {
  if (proof.staleAt && proof.staleAt <= now) return true
  return now - proof.retrievedAt > 14 * 24 * 60 * 60 * 1000
}

function buildUnknowns(
  event: WorldIntelEvent,
  definition: WorldwatchLayerDefinition,
  proof: WorldwatchProofTrail,
  geometry: WorldwatchGeometryKind,
): string[] {
  const unknowns: string[] = []
  if (geometry !== 'point' && (definition.geometry === 'point' || definition.kind === 'facility')) {
    unknowns.push('Exact coordinates are unavailable from this source record.')
  }
  if (proof.staleAt) unknowns.push('Freshness is bounded by the source staleAt timestamp.')
  if (event.provenance === 'media-observation') unknowns.push('The article observation does not verify the underlying claim.')
  if (event.comtradeRecord) unknowns.push('Comtrade records do not identify companies or supply-chain counterparties.')
  if (event.etfHolding) unknowns.push('ETF holdings can lag and may not describe current portfolio exposure.')
  if (event.form13fHolding) unknowns.push('13F holdings are delayed quarterly disclosures, not current positions.')
  return unknowns.length > 0 ? unknowns : ['No additional source-backed detail is available until the entity source trail is opened.']
}

function exposureContextFor(event: WorldIntelEvent, layerId: WorldwatchLayerId): string[] {
  if (layerId === 'market-evidence') {
    return [
      event.marketIdentity?.legalName,
      event.companyFact?.companyName,
      event.form4Transaction?.issuerTicker,
      event.form13fHolding?.issuerTicker,
      event.secFiling?.ticker,
    ].filter((value): value is string => Boolean(value))
  }
  if (layerId === 'etf-holdings' && event.etfHolding) {
    return [`${event.etfHolding.fundTicker} holding`, event.etfHolding.holdingTicker, event.etfHolding.sector].filter(
      (value): value is string => Boolean(value),
    )
  }
  if (layerId === 'trade-flows' && event.comtradeRecord) {
    return [event.comtradeRecord.commodityDescription, event.comtradeRecord.reporterIso3, event.comtradeRecord.partnerIso3].filter(
      (value): value is string => Boolean(value),
    )
  }
  return event.affectedAssets.slice(0, 6)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
