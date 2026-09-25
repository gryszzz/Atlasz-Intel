import type { EvidenceBasis, GeoPoint, ObservationRef } from './model'

export type OwnershipKind =
  | 'institutional'
  | 'insider'
  | 'strategic'
  | 'sovereign'
  | 'fund'
  | 'etf'
  | 'subsidiary'

export interface OwnershipPosition {
  id: string
  ownerEntityId: string
  ownedEntityId: string
  kind: OwnershipKind
  asOf: string
  percentage?: number
  marketValue?: number
  shares?: number
  votingPowerPercentage?: number
  basis: EvidenceBasis
  confidence: number
  evidence: ObservationRef[]
}

export interface VesselState {
  entityId: string
  imo?: string
  mmsi?: string
  callSign?: string
  flag?: string
  vesselClass?: string
  buildYear?: number
  lengthMeters?: number
  beamMeters?: number
  grossTonnage?: number
  netTonnage?: number
  deadweightTonnage?: number
  displacementTonnes?: number
  reportedDraftMeters?: number
  position?: GeoPoint
  courseDegrees?: number
  speedKnots?: number
  destination?: string
  eta?: string
  ownerEntityId?: string
  operatorEntityId?: string
  managerEntityId?: string
  cargoClass?: string
  cargoBasis?: 'reported' | 'registry' | 'estimated' | 'unknown'
  observedAt: string
  evidence: ObservationRef[]
}

export interface BlockchainTransfer {
  id: string
  chain: string
  transactionHash: string
  blockId?: string
  blockHeight?: number
  occurredAt: string
  senderAddress: string
  recipientAddress: string
  senderEntityId?: string
  recipientEntityId?: string
  asset: string
  amount: number
  referenceValueUsd?: number
  referenceValueObservedAt?: string
  fee?: number
  feeAsset?: string
  decodedAction?: string
  senderAttributionConfidence?: number
  recipientAttributionConfidence?: number
  evidence: ObservationRef[]
}

export interface WhaleSignificance {
  transferId: string
  score: number
  sizePercentile?: number
  observedBalanceFraction?: number
  historicalRarity?: number
  dormancyScore?: number
  destinationRelevance?: number
  attributionConfidence?: number
  internalTransferPenalty?: number
  bridgeMechanicsPenalty?: number
  explanation: string[]
}

export type PolicyActionKind =
  | 'legislation'
  | 'executive-action'
  | 'sanction'
  | 'tariff'
  | 'export-control'
  | 'regulatory-enforcement'
  | 'court-decision'
  | 'central-bank'
  | 'budget'
  | 'fiscal-action'
  | 'government-contract'
  | 'subsidy'
  | 'election-result'
  | 'diplomatic-security'

export interface PolicyAction {
  id: string
  kind: PolicyActionKind
  institutionEntityIds: string[]
  jurisdictionEntityIds: string[]
  title: string
  effectiveAt?: string
  announcedAt: string
  affectedSectorEntityIds: string[]
  affectedCompanyEntityIds: string[]
  affectedCommodityEntityIds: string[]
  affectedRegionEntityIds: string[]
  basis: EvidenceBasis
  confidence: number
  evidence: ObservationRef[]
}

export type FacilityKind =
  | 'port'
  | 'airport'
  | 'rail'
  | 'pipeline'
  | 'refinery'
  | 'lng-terminal'
  | 'power-plant'
  | 'nuclear-plant'
  | 'mine'
  | 'fab'
  | 'data-center'
  | 'industrial-plant'
  | 'storage'
  | 'grid-region'

export interface FacilityState {
  entityId: string
  kind: FacilityKind
  location?: GeoPoint
  ownerEntityId?: string
  operatorEntityId?: string
  capacity?: number
  capacityUnit?: string
  operatingStatus?: string
  commodities?: string[]
  observedAt?: string
  evidence: ObservationRef[]
}

export interface QuantContext {
  entityId: string
  observedAt: string
  price?: number
  currency?: string
  return1d?: number
  volume?: number
  volumePercentile?: number
  realizedVolatility?: number
  impliedVolatility?: number
  optionOpenInterest?: number
  shortInterestPercentage?: number
  zScores?: Record<string, number>
  percentiles?: Record<string, number>
  evidence: ObservationRef[]
}

export interface SpatialUncertainty {
  precision: 'exact' | 'facility' | 'city' | 'region' | 'country' | 'corridor' | 'unknown'
  radiusMeters?: number
  note?: string
}
