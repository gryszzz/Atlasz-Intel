export type WorldMode =
  | 'world'
  | 'capital'
  | 'trade'
  | 'energy'
  | 'policy'
  | 'chain'
  | 'risk'

export type EvidenceBasis =
  | 'observed'
  | 'corroborated'
  | 'structural'
  | 'inferred'
  | 'conflicted'
  | 'unknown'

export type EntityKind =
  | 'country'
  | 'government'
  | 'agency'
  | 'policy'
  | 'company'
  | 'fund'
  | 'etf'
  | 'security'
  | 'commodity'
  | 'currency'
  | 'bond'
  | 'wallet'
  | 'protocol'
  | 'blockchain'
  | 'vessel'
  | 'port'
  | 'terminal'
  | 'refinery'
  | 'power_plant'
  | 'grid_region'
  | 'pipeline'
  | 'mine'
  | 'fab'
  | 'data_center'
  | 'airport'
  | 'rail_corridor'
  | 'weather_system'
  | 'cyber_vulnerability'
  | 'research_work'
  | 'event'

export type RelationshipBasis =
  | 'observed'
  | 'curated-reference'
  | 'derived'
  | 'inferred'

export type FlowDomain =
  | 'capital'
  | 'trade'
  | 'energy'
  | 'shipping'
  | 'blockchain'
  | 'policy'
  | 'attention'

export interface GeoPoint {
  lat: number
  lon: number
  altitudeMeters?: number
}

export interface ObservationRef {
  id: string
  sourceId: string
  observedAt?: string
  publishedAt?: string
  retrievedAt: string
  sourceUrl?: string
  payloadHash?: string
}

export interface WorldEntity {
  id: string
  kind: EntityKind
  name: string
  aliases?: string[]
  location?: GeoPoint
  countryCode?: string
  identifiers?: Record<string, string>
}

export interface WorldRelationship {
  id: string
  fromEntityId: string
  toEntityId: string
  type: string
  basis: RelationshipBasis
  confidence: number
  evidence: ObservationRef[]
  validFrom?: string
  validTo?: string
}

export interface MaterialityVector {
  impact: number
  confidence: number
  novelty: number
  exposure: number
  velocity: number
  persistence: number
  centrality: number
  geographicRelevance: number
  profileRelevance: number
}

export interface WorldEvent {
  id: string
  title: string
  summary: string
  basis: EvidenceBasis
  mode: WorldMode
  occurredAt?: string
  firstObservedAt: string
  updatedAt: string
  location?: GeoPoint
  entityIds: string[]
  observationIds: string[]
  relationshipIds?: string[]
  materiality: MaterialityVector
  tags?: string[]
  unknowns?: string[]
}

export interface WorldFlow {
  id: string
  domain: FlowDomain
  fromEntityId?: string
  toEntityId?: string
  occurredAt: string
  magnitude?: number
  unit?: string
  basis: EvidenceBasis
  confidence: number
  observationIds: string[]
  metadata?: Record<string, string | number | boolean | null>
}

export interface WorldViewState {
  mode: WorldMode
  selectedEntityId?: string
  selectedEventId?: string
  selectedFlowId?: string
  timeRange: {
    from: string
    to: string
  }
  enabledLayers: string[]
}
