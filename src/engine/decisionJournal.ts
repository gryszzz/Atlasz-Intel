/*
 * Phase 4 Research Notes contract + renderer client. This is a context and
 * follow-up system, not a trading/execution engine: no broker actions, orders,
 * routing, or advice. The snapshot of system state at log time is captured
 * authoritatively in the Node service; the renderer only sends the user's
 * observation context.
 *
 * Distinct from the legacy `decision_journal` table / DecisionJournal.tsx.
 */

export type ThesisType = 'Positive' | 'Negative' | 'Neutral'

export type ThesisSnapshotMetrics = {
  price: number | null
  volumeVelocity: number | null
  zScore: number | null
  vwapDeviation: number | null
  realizedVolatility: number | null
  drawdown: number | null
  relativeStrength: number | null
  rollingCorrelation: number | null
  narrativePressure: number | null
  activeProvenanceBadges: string[]
  linkedEventIds: string[]
  sourceCoverage: number | null
}

export type ThesisDraft = {
  assetSymbol: string
  thesisType: ThesisType
  userNotes: string
  targetHorizonDays: number
  triggerEventId?: string
}

export type UserThesis = {
  id: string
  timestamp: number
  assetSymbol: string
  thesisType: ThesisType
  triggerEventId: string | null
  snapshotMetrics: ThesisSnapshotMetrics
  userNotes: string
  targetHorizonDays: number
  isClosed: boolean
  performanceGrade: string | null
  entryPrice: number | null
  currentReturn: number | null
  oneDayReturn: number | null
  sevenDayReturn: number | null
  thirtyDayReturn: number | null
  createdAt: number
  updatedAt: number
}

export type ThesisProvenancePerformance = {
  provenance: string
  count: number
  avgReturn: number | null
}

export type ThesisDashboard = {
  generatedAt: number
  theses: UserThesis[]
  openCount: number
  closedCount: number
  followThroughRate: number | null
  evaluableCount: number
  byProvenance: ThesisProvenancePerformance[]
  priceDataAvailable: boolean
}

export function emptyThesisDashboard(now = Date.now()): ThesisDashboard {
  return {
    generatedAt: now,
    theses: [],
    openCount: 0,
    closedCount: 0,
    followThroughRate: null,
    evaluableCount: 0,
    byProvenance: [],
    priceDataAvailable: false,
  }
}

// --- renderer client -------------------------------------------------------

type ThesisDesktopBridge = {
  save: (draft: ThesisDraft) => Promise<ThesisDashboard>
  dashboard: () => Promise<ThesisDashboard>
}

function desktopThesis() {
  return (globalThis as unknown as { atlaszDesktop?: { thesis?: ThesisDesktopBridge } }).atlaszDesktop?.thesis ?? null
}

export function thesisBridgeAvailable(): boolean {
  return desktopThesis() !== null
}

export async function saveThesisDraft(draft: ThesisDraft): Promise<ThesisDashboard | null> {
  const bridge = desktopThesis()
  if (!bridge) {
    return null
  }
  return bridge.save(draft)
}

export async function fetchThesisDashboard(): Promise<ThesisDashboard | null> {
  const bridge = desktopThesis()
  if (!bridge) {
    return null
  }
  return bridge.dashboard()
}
