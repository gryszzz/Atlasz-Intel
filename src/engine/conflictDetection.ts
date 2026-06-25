/*
 * Conflict / contradiction detection.
 *
 * Corroboration says "things agree." This says "things DON'T line up" — when
 * sources or identifiers disagree, Atlasz surfaces the uncertainty instead of
 * silently picking one. Detects identity ambiguity (ticker<->CIK, CIK<->name),
 * facility-coordinate disagreement across official sources, ETF ticker/CUSIP
 * mismatch, and operator-identity disagreement.
 *
 * Discipline:
 *  - NO silent merge: identity conflicts refuse-merge.
 *  - media-observation never overrides official (and never supplies values here).
 *  - curated-reference is not live evidence (not scanned as a value source).
 *  - stale sources are flagged; fresh-official wins only where a hierarchy says so.
 *  - conflicts lower confidence and appear in the brief unknowns.
 */
import { freshnessState, type FreshnessState } from './entityModel'
import { sourceLabel } from './materialityEngine'
import type { WorldIntelEvent } from '../worldIntel'

export type ConflictType =
  | 'ticker-multiple-cik'
  | 'cik-multiple-name'
  | 'facility-coordinates'
  | 'etf-ticker-cusip'
  | 'operator-identity'

export type ConflictSeverity = 'info' | 'caution' | 'blocking'
export type ResolutionBehavior = 'continue' | 'mark-uncertain' | 'refuse-merge' | 'require-operator-review'

export type ConflictObservation = {
  value: string
  source: string
  observedAt: number
  freshness: FreshnessState
}

export type ConflictSignal = {
  id: string
  conflictType: ConflictType
  subject: string
  /** Keys (e.g. ticker:nvda, facility:55555) used to attach this to events. */
  subjectKeys: string[]
  severity: ConflictSeverity
  resolutionBehavior: ResolutionBehavior
  entities: string[]
  sources: string[]
  observedValues: ConflictObservation[]
  freshness: FreshnessState
  note: string
}

// Live, value-bearing sources only (media/curated excluded from value conflicts).
const VALUE_SOURCED: ReadonlySet<WorldIntelEvent['provenance']> = new Set([
  'official-api',
  'auth-gated',
  'public-disclosure',
  'public-unauthenticated',
  'verified',
])

type Obs = { value: string; sourceId: string; observedAt: number }

export function detectConflicts(events: WorldIntelEvent[], now = Date.now()): ConflictSignal[] {
  const valueEvents = events.filter((e) => VALUE_SOURCED.has(e.provenance))
  const out: ConflictSignal[] = []

  // ticker -> CIK and CIK -> legal name (identity ambiguity).
  const tickerToCik = new Map<string, Obs[]>()
  const cikToName = new Map<string, Obs[]>()
  // ETF ticker <-> CUSIP.
  const etfTickerToCusip = new Map<string, Obs[]>()
  const etfCusipToTicker = new Map<string, Obs[]>()
  // operator name -> ticker.
  const operatorToTicker = new Map<string, Obs[]>()
  // facility key -> coordinates.
  const facilityCoords = new Map<string, Obs[]>()

  const push = (map: Map<string, Obs[]>, key: string, obs: Obs) => {
    if (!key || !obs.value) return
    map.set(key, [...(map.get(key) ?? []), obs])
  }

  for (const e of valueEvents) {
    const obs = (value: string): Obs => ({ value, sourceId: e.sourceId, observedAt: e.timestamp })

    const mi = e.marketIdentity
    if (mi) {
      if (mi.ticker && mi.cik) push(tickerToCik, `ticker:${mi.ticker.toUpperCase()}`, obs(mi.cik))
      if (mi.cik && mi.legalName) push(cikToName, `cik:${mi.cik}`, obs(normalizeName(mi.legalName)))
    }
    const f = e.secFiling
    if (f) {
      if (f.ticker && f.cik) push(tickerToCik, `ticker:${f.ticker.toUpperCase()}`, obs(f.cik))
      if (f.cik && f.companyName) push(cikToName, `cik:${f.cik}`, obs(normalizeName(f.companyName)))
    }
    const etf = e.etfHolding
    if (etf?.holdingTicker && etf.cusip) {
      push(etfTickerToCusip, `ticker:${etf.holdingTicker.toUpperCase()}`, obs(etf.cusip.toUpperCase()))
      push(etfCusipToTicker, `cusip:${etf.cusip.toUpperCase()}`, obs(etf.holdingTicker.toUpperCase()))
    }
    for (const facility of facilityRecords(e)) {
      if (facility.operatorName && facility.operatorTicker) {
        push(operatorToTicker, `operator:${normalizeName(facility.operatorName)}`, obs(facility.operatorTicker.toUpperCase()))
      }
      if (facility.id && Number.isFinite(facility.lat) && Number.isFinite(facility.lon)) {
        push(facilityCoords, `facility:${facility.id}`, obs(`${round(facility.lat)},${round(facility.lon)}`))
      }
    }
  }

  collect(out, tickerToCik, 'ticker-multiple-cik', 'blocking', 'refuse-merge', now, (k) => `Ticker ${k.slice(7).toUpperCase()} maps to multiple CIKs`)
  collect(out, cikToName, 'cik-multiple-name', 'caution', 'mark-uncertain', now, (k) => `CIK ${k.slice(4)} appears under multiple legal names`)
  collect(out, etfTickerToCusip, 'etf-ticker-cusip', 'caution', 'refuse-merge', now, (k) => `ETF holding ticker ${k.slice(7)} maps to multiple CUSIPs`)
  collect(out, etfCusipToTicker, 'etf-ticker-cusip', 'caution', 'refuse-merge', now, (k) => `CUSIP ${k.slice(6)} maps to multiple tickers`)
  collect(out, operatorToTicker, 'operator-identity', 'caution', 'mark-uncertain', now, (k) => `Operator "${k.slice(9)}" maps to multiple market tickers`)
  collect(out, facilityCoords, 'facility-coordinates', 'caution', 'mark-uncertain', now, (k) => `Facility ${k.slice(9)} has differing coordinates across sources`, coordsDiffer)

  return out.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.subject.localeCompare(b.subject))
}

/** Conflicts whose subject keys intersect this event's identity keys. */
export function conflictsForEvent(event: WorldIntelEvent, conflicts: ConflictSignal[]): ConflictSignal[] {
  const keys = new Set(eventIdentityKeys(event))
  if (keys.size === 0) return []
  return conflicts.filter((c) => c.subjectKeys.some((k) => keys.has(k)))
}

function collect(
  out: ConflictSignal[],
  map: Map<string, Obs[]>,
  conflictType: ConflictType,
  severity: ConflictSeverity,
  resolutionBehavior: ResolutionBehavior,
  now: number,
  describe: (key: string) => string,
  differ: (values: string[]) => boolean = (values) => new Set(values).size > 1,
) {
  for (const [key, observations] of map) {
    const distinctValues = [...new Set(observations.map((o) => o.value))]
    const distinctSources = new Set(observations.map((o) => o.sourceId))
    // A conflict is >=2 distinct values for the same key (within OR across sources).
    if (!differ(distinctValues)) continue
    const observedValues: ConflictObservation[] = observations.map((o) => ({
      value: o.value,
      source: sourceLabel(o.sourceId),
      observedAt: o.observedAt,
      freshness: Number.isFinite(o.observedAt) ? freshnessState(o.observedAt, now) : 'unavailable',
    }))
    const freshness = worstFreshness(observedValues.map((o) => o.freshness))
    out.push({
      id: `conflict:${conflictType}:${key}`,
      conflictType,
      subject: describe(key),
      subjectKeys: [key],
      severity,
      resolutionBehavior,
      entities: distinctValues,
      sources: [...new Set(observedValues.map((o) => o.source))],
      observedValues,
      freshness,
      note: `${describe(key)} across ${distinctSources.size} sources — surfaced as uncertainty, not silently merged.`,
    })
  }
}

function facilityRecords(e: WorldIntelEvent): Array<{ id: string; lat: number; lon: number; operatorName?: string; operatorTicker?: string }> {
  const recs: Array<{ id: string; lat: number; lon: number; operatorName?: string; operatorTicker?: string }> = []
  if (e.eiaFacility) recs.push({ id: e.eiaFacility.facilityId, lat: e.eiaFacility.latitude ?? NaN, lon: e.eiaFacility.longitude ?? NaN, operatorName: e.eiaFacility.operatorName, operatorTicker: e.eiaFacility.operatorTicker })
  if (e.eiaRefinery) recs.push({ id: e.eiaRefinery.facilityId, lat: e.eiaRefinery.latitude ?? NaN, lon: e.eiaRefinery.longitude ?? NaN, operatorName: e.eiaRefinery.operatorName, operatorTicker: e.eiaRefinery.operatorTicker })
  if (e.lngTerminal) recs.push({ id: e.lngTerminal.facilityId, lat: e.lngTerminal.latitude ?? NaN, lon: e.lngTerminal.longitude ?? NaN, operatorName: e.lngTerminal.operatorName, operatorTicker: e.lngTerminal.operatorTicker })
  if (e.nuclearPlant) recs.push({ id: e.nuclearPlant.facilityId, lat: e.nuclearPlant.latitude ?? NaN, lon: e.nuclearPlant.longitude ?? NaN, operatorName: e.nuclearPlant.operatorName, operatorTicker: e.nuclearPlant.operatorTicker })
  if (e.worldPort) recs.push({ id: e.worldPort.portNumber, lat: e.worldPort.latitude ?? NaN, lon: e.worldPort.longitude ?? NaN })
  return recs
}

function eventIdentityKeys(event: WorldIntelEvent): string[] {
  const keys: string[] = []
  const mi = event.marketIdentity
  if (mi?.ticker) keys.push(`ticker:${mi.ticker.toUpperCase()}`)
  if (mi?.cik) keys.push(`cik:${mi.cik}`)
  if (event.secFiling?.ticker) keys.push(`ticker:${event.secFiling.ticker.toUpperCase()}`)
  if (event.secFiling?.cik) keys.push(`cik:${event.secFiling.cik}`)
  if (event.etfHolding?.holdingTicker) keys.push(`ticker:${event.etfHolding.holdingTicker.toUpperCase()}`)
  if (event.etfHolding?.cusip) keys.push(`cusip:${event.etfHolding.cusip.toUpperCase()}`)
  for (const f of facilityRecords(event)) {
    keys.push(`facility:${f.id}`)
    if (f.operatorName) keys.push(`operator:${normalizeName(f.operatorName)}`)
  }
  return [...new Set(keys)]
}

function coordsDiffer(values: string[]): boolean {
  const points = values.map((v) => v.split(',').map(Number))
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (Math.abs(points[i][0] - points[j][0]) > 0.05 || Math.abs(points[i][1] - points[j][1]) > 0.05) return true
    }
  }
  return false
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[.,]/g, '').replace(/\b(inc|corp|corporation|co|llc|lp|ltd|plc|the)\b/g, '').replace(/\s+/g, ' ').trim()
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function worstFreshness(states: FreshnessState[]): FreshnessState {
  const order: FreshnessState[] = ['unavailable', 'stale', 'aging', 'recent', 'fresh']
  return states.reduce((worst, s) => (order.indexOf(s) < order.indexOf(worst) ? s : worst), 'fresh' as FreshnessState)
}

function severityRank(s: ConflictSeverity): number {
  return s === 'blocking' ? 0 : s === 'caution' ? 1 : 2
}
