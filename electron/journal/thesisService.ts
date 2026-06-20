/*
 * Decision Journal thesis service (Phase 4). A research/observation journal —
 * NOT execution. On log, it authoritatively captures the current math-derived
 * system snapshot for the asset (via the quant engine) so the renderer never
 * fabricates metrics. On read, it marks theses to market and computes a
 * follow-through dashboard. Fail-closed: returns are null when no real local
 * price history exists.
 */
import { QuantComputeService } from '../quant/quantComputeService'
import type { IntelPersistence } from '../persistence'
import {
  emptyThesisDashboard,
  type ThesisDashboard,
  type ThesisDraft,
  type ThesisProvenancePerformance,
  type ThesisSnapshotMetrics,
  type UserThesis,
} from '../../src/engine/decisionJournal'
import type { QuantSnapshot } from '../../src/quant'

const DAY = 86_400_000

export class ThesisService {
  private readonly persistence: IntelPersistence
  private readonly quant: QuantComputeService

  constructor(persistence: IntelPersistence) {
    this.persistence = persistence
    this.quant = new QuantComputeService(persistence)
  }

  save(draft: ThesisDraft): ThesisDashboard {
    const now = Date.now()
    const symbol = String(draft.assetSymbol || '').toUpperCase().trim()
    if (!symbol) {
      return this.dashboard(now)
    }
    const events = this.persistence.listWorldIntelEvents(300)
    const snapshot = this.quant.computeAssetSnapshot(symbol, { events, now })
    const snapshotMetrics = extractMetrics(snapshot)
    const thesis: UserThesis = {
      id: `thesis-${now}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: now,
      assetSymbol: symbol,
      thesisType: draft.thesisType,
      triggerEventId: draft.triggerEventId ?? null,
      snapshotMetrics,
      userNotes: String(draft.userNotes ?? ''),
      targetHorizonDays: clampInt(draft.targetHorizonDays, 1, 3650, 30),
      isClosed: false,
      performanceGrade: null,
      entryPrice: snapshotMetrics.price,
      currentReturn: null,
      oneDayReturn: null,
      sevenDayReturn: null,
      thirtyDayReturn: null,
      createdAt: now,
      updatedAt: now,
    }
    this.persistence.saveUserThesis(thesis)
    return this.dashboard(now)
  }

  dashboard(now = Date.now()): ThesisDashboard {
    const stored = this.persistence.listUserTheses(500)
    if (stored.length === 0) {
      return emptyThesisDashboard(now)
    }
    const theses = stored.map((thesis) => this.markToMarket(thesis, now))
    const evaluable = theses.filter((thesis) => thesis.currentReturn !== null)
    const followed = evaluable.filter((thesis) => isFollowThrough(thesis.thesisType, thesis.currentReturn as number))
    const followThroughRate = evaluable.length > 0 ? followed.length / evaluable.length : null

    return {
      generatedAt: now,
      theses,
      openCount: theses.filter((thesis) => !thesis.isClosed).length,
      closedCount: theses.filter((thesis) => thesis.isClosed).length,
      followThroughRate,
      evaluableCount: evaluable.length,
      byProvenance: groupByProvenance(theses),
      priceDataAvailable: evaluable.length > 0,
    }
  }

  private markToMarket(thesis: UserThesis, now: number): UserThesis {
    const bars = this.persistence
      .listMarketTicks(thesis.assetSymbol, 800)
      .map((row) => ({ price: row.price, time: row.observedAt }))
      .filter((bar) => Number.isFinite(bar.price) && Number.isFinite(bar.time))
      .sort((left, right) => left.time - right.time)
    const entry = thesis.entryPrice
    const latest = bars.length > 0 ? bars[bars.length - 1].price : null
    const currentReturn = entry && entry !== 0 && latest !== null ? round(((latest - entry) / entry) * 100) : null
    const horizon = (days: number) => {
      if (!entry || entry === 0) return null
      const price = nearestPrice(bars, thesis.timestamp + days * DAY, 2 * DAY)
      return price === null ? null : round(((price - entry) / entry) * 100)
    }
    return {
      ...thesis,
      currentReturn,
      oneDayReturn: horizon(1),
      sevenDayReturn: horizon(7),
      thirtyDayReturn: horizon(30),
      performanceGrade: currentReturn === null ? null : gradeFor(thesis.thesisType, currentReturn),
      updatedAt: now,
    }
  }
}

function extractMetrics(snapshot: QuantSnapshot): ThesisSnapshotMetrics {
  const get = (name: string): number | null => {
    const metric = snapshot.metrics.find((entry) => entry.metricName === name)
    return metric && metric.status !== 'unavailable' ? metric.metricValue : null
  }
  const price = snapshot.bars.length > 0 ? snapshot.bars[snapshot.bars.length - 1].price : null
  const badges = new Set<string>(snapshot.metrics.filter((m) => m.status !== 'unavailable').map((m) => m.provenance))
  if (snapshot.markers.length > 0) {
    badges.add('local-computed')
  }
  const coverages = snapshot.metrics.filter((m) => m.status !== 'unavailable').map((m) => m.dataCoverage)
  const sourceCoverage = coverages.length > 0 ? round(coverages.reduce((s, v) => s + v, 0) / coverages.length, 3) : null
  return {
    price,
    volumeVelocity: get('Volume velocity'),
    zScore: get('Price z-score'),
    vwapDeviation: get('VWAP deviation'),
    realizedVolatility: get('Realized volatility'),
    drawdown: get('Current drawdown'),
    relativeStrength: get('Relative strength'),
    rollingCorrelation: get('Rolling correlation'),
    narrativePressure: null, // not computed in the quant layer; honestly null
    activeProvenanceBadges: [...badges],
    linkedEventIds: snapshot.markers.map((marker) => marker.eventId),
    sourceCoverage,
  }
}

function groupByProvenance(theses: UserThesis[]): ThesisProvenancePerformance[] {
  const groups = new Map<string, { count: number; returns: number[] }>()
  for (const thesis of theses) {
    const key = thesis.snapshotMetrics.activeProvenanceBadges[0] ?? 'local-computed'
    const group = groups.get(key) ?? { count: 0, returns: [] }
    group.count += 1
    if (thesis.currentReturn !== null) {
      group.returns.push(thesis.currentReturn)
    }
    groups.set(key, group)
  }
  return [...groups.entries()].map(([provenance, group]) => ({
    provenance,
    count: group.count,
    avgReturn: group.returns.length > 0 ? round(group.returns.reduce((s, v) => s + v, 0) / group.returns.length) : null,
  }))
}

function isFollowThrough(thesisType: UserThesis['thesisType'], currentReturn: number): boolean {
  if (thesisType === 'Positive') return currentReturn > 0
  if (thesisType === 'Negative') return currentReturn < 0
  return Math.abs(currentReturn) < 2
}

function gradeFor(thesisType: UserThesis['thesisType'], currentReturn: number): string {
  if (isFollowThrough(thesisType, currentReturn)) {
    return Math.abs(currentReturn) >= 5 ? 'strong follow-through' : 'follow-through'
  }
  return Math.abs(currentReturn) >= 5 ? 'counter-move' : 'inline'
}

function nearestPrice(bars: Array<{ price: number; time: number }>, target: number, toleranceMs: number): number | null {
  let best: { price: number; time: number } | null = null
  let bestDelta = Number.POSITIVE_INFINITY
  for (const bar of bars) {
    const delta = Math.abs(bar.time - target)
    if (delta < bestDelta) {
      best = bar
      bestDelta = delta
    }
  }
  return best && bestDelta <= toleranceMs ? best.price : null
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
