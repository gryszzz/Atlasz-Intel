/*
 * Phase 3 quant contract (shared by the Node compute services and the React
 * UI). Types only here — all computation runs in electron/quant/* services.
 * Provenance is strict: deterministic math is `math-derived`, locally-assembled
 * series/links are `local-computed`. Nothing here is ever `verified`.
 */
import type { ProvenanceId } from './provenance'
import type { BeaObservation, EiaEnergyRecord, FredMacroObservation, TreasuryFiscalRecord } from './worldIntel'

export type QuantMetricStatus = 'normal' | 'elevated' | 'anomaly' | 'unavailable'

export type QuantBar = { time: number; price: number; volume: number }

export type QuantMetric = {
  id: string
  assetSymbol: string
  timestamp: number
  metricName: string
  metricValue: number | null
  unit: string
  window: string
  benchmark?: string
  threshold?: number
  status: QuantMetricStatus
  explanation: string
  provenance: ProvenanceId
  inputSources: string[]
  dataCoverage: number // 0..1 — fraction of expected history actually present
  confidence: number // 0..1
  unavailableReason?: string
}

export type EventOverlayLinkType =
  | 'direct-asset'
  | 'event-asset-link'
  | 'macro-proxy'
  | 'local-derived'
  | 'model-inferred'

export type EventOverlayMarker = {
  eventId: string
  timestamp: number
  title: string
  category: string
  severity: string
  provenance: ProvenanceId
  linkType: EventOverlayLinkType
}

export type QuantSnapshot = {
  assetSymbol: string
  generatedAt: number
  benchmark?: string
  bars: QuantBar[]
  metrics: QuantMetric[]
  markers: EventOverlayMarker[]
  dataAvailable: boolean
  unavailableReason?: string
}

export type MacroRegime = 'risk-on' | 'risk-off' | 'mixed' | 'unavailable'

export type MacroQuantMetric = {
  id: string
  metricName: string
  metricValue: number | null
  unit: string
  status: QuantMetricStatus
  explanation: string
  provenance: ProvenanceId
  inputSources: string[]
  unavailableReason?: string
}

export type MacroQuantSnapshot = {
  generatedAt: number
  regime: MacroRegime
  regimeProvenance: ProvenanceId
  regimeExplanation: string
  metrics: MacroQuantMetric[]
  fredObservations: FredMacroObservation[]
  treasuryFiscalRecords: TreasuryFiscalRecord[]
  beaObservations: BeaObservation[]
  eiaEnergyRecords: EiaEnergyRecord[]
}

export type QuantTerminalSnapshot = {
  generatedAt: number
  assets: QuantSnapshot[]
  macro: MacroQuantSnapshot
}

export const QUANT_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function emptyMacroSnapshot(reason: string, now = Date.now()): MacroQuantSnapshot {
  return {
    generatedAt: now,
    regime: 'unavailable',
    regimeProvenance: 'math-derived',
    regimeExplanation: reason,
    metrics: [],
    fredObservations: [],
    treasuryFiscalRecords: [],
    beaObservations: [],
    eiaEnergyRecords: [],
  }
}

export function unavailableQuantSnapshot(assetSymbol: string, reason: string, now = Date.now()): QuantSnapshot {
  return {
    assetSymbol,
    generatedAt: now,
    bars: [],
    metrics: [],
    markers: [],
    dataAvailable: false,
    unavailableReason: reason,
  }
}
