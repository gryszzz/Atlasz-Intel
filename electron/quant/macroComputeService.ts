/*
 * Macro compute service (Phase 3). Computes the yield curve, DXY momentum, a
 * labelled liquidity PROXY, and a macro risk regime from official rate/series
 * data. Fail-closed: without a FRED key (or with missing series) the regime is
 * `unavailable` and metrics carry explicit reasons — never fabricated levels.
 *
 * Honesty rules enforced here:
 *  - True 10Y-2Y uses FRED T10Y2Y, or DGS10 - DGS2. We never approximate it
 *    with ^TNX - ^IRX (that is 10Y - 13W, a different spread).
 *  - DXY / rates composites are labelled "liquidity-proxy", never "global
 *    liquidity" (which would require central-bank balance-sheet data).
 */
import { pctChange } from './quantMath'
import { asString } from '../osint/adapters/adapterShared'
import {
  emptyMacroSnapshot,
  type MacroQuantMetric,
  type MacroQuantSnapshot,
  type MacroRegime,
} from '../../src/quant'

export type MacroSeriesInputs = {
  t10y2y?: number
  dgs10?: number
  dgs2?: number
  dgs3mo?: number
  dxySeries?: number[]
}

/** Pure regime/metric computation — testable with fixture series. */
export function computeMacroSnapshot(inputs: MacroSeriesInputs, now = Date.now()): MacroQuantSnapshot {
  const metrics: MacroQuantMetric[] = []

  // True 10Y-2Y yield curve.
  const curve = resolveCurve(inputs)
  metrics.push(
    macroMetric({
      id: 'yield-curve-10y2y',
      metricName: '10Y-2Y yield curve',
      metricValue: curve.value,
      unit: 'pp',
      inputSources: curve.sources,
      explanation: curve.value === null ? curve.reason : `${curve.value.toFixed(2)}pp (${curve.value < 0 ? 'inverted' : 'positive'}).`,
      status: curve.value === null ? 'unavailable' : curve.value < 0 ? 'anomaly' : 'normal',
      unavailableReason: curve.value === null ? curve.reason : undefined,
    }),
  )

  // 10Y-3M where available.
  const tenMinus3m = inputs.dgs10 !== undefined && inputs.dgs3mo !== undefined ? round(inputs.dgs10 - inputs.dgs3mo) : null
  metrics.push(
    macroMetric({
      id: 'yield-curve-10y3m',
      metricName: '10Y-3M yield curve',
      metricValue: tenMinus3m,
      unit: 'pp',
      inputSources: ['FRED:DGS10', 'FRED:DGS3MO'],
      explanation: tenMinus3m === null ? '10Y-3M unavailable from current sources.' : `${tenMinus3m.toFixed(2)}pp.`,
      status: tenMinus3m === null ? 'unavailable' : tenMinus3m < 0 ? 'anomaly' : 'normal',
      unavailableReason: tenMinus3m === null ? '10Y-3M unavailable from current sources.' : undefined,
    }),
  )

  // DXY momentum.
  const dxyMomentum = inputs.dxySeries && inputs.dxySeries.length >= 2 ? pctChange(inputs.dxySeries) : null
  metrics.push(
    macroMetric({
      id: 'dxy-momentum',
      metricName: 'DXY momentum (liquidity-proxy)',
      metricValue: dxyMomentum,
      unit: '%',
      inputSources: ['FRED:DTWEXBGS'],
      explanation:
        dxyMomentum === null
          ? 'Dollar-index history unavailable from current sources.'
          : `Broad dollar index ${dxyMomentum >= 0 ? 'up' : 'down'} ${Math.abs(dxyMomentum).toFixed(2)}% over the window. Proxy only.`,
      status: dxyMomentum === null ? 'unavailable' : Math.abs(dxyMomentum) >= 2 ? 'elevated' : 'normal',
      unavailableReason: dxyMomentum === null ? 'Dollar-index history unavailable from current sources.' : undefined,
    }),
  )

  const { regime, explanation } = deriveRegime(curve.value, dxyMomentum)
  if (regime === 'unavailable') {
    const snapshot = emptyMacroSnapshot(explanation, now)
    return { ...snapshot, metrics }
  }
  return {
    generatedAt: now,
    regime,
    regimeProvenance: 'math-derived',
    regimeExplanation: explanation,
    metrics,
    fredObservations: [],
    treasuryFiscalRecords: [],
    beaObservations: [],
    eiaEnergyRecords: [],
  }
}

function resolveCurve(inputs: MacroSeriesInputs): { value: number | null; sources: string[]; reason: string } {
  if (inputs.t10y2y !== undefined && Number.isFinite(inputs.t10y2y)) {
    return { value: round(inputs.t10y2y), sources: ['FRED:T10Y2Y'], reason: '' }
  }
  if (inputs.dgs10 !== undefined && inputs.dgs2 !== undefined) {
    return { value: round(inputs.dgs10 - inputs.dgs2), sources: ['FRED:DGS10', 'FRED:DGS2'], reason: '' }
  }
  return { value: null, sources: [], reason: 'Yield-curve series unavailable from current public sources.' }
}

function deriveRegime(curve: number | null, dxyMomentum: number | null): { regime: MacroRegime; explanation: string } {
  if (curve === null && dxyMomentum === null) {
    return { regime: 'unavailable', explanation: 'Insufficient macro series to classify a regime.' }
  }
  let score = 0
  const parts: string[] = []
  if (curve !== null) {
    if (curve < 0) {
      score -= 1
      parts.push('inverted curve (risk-off)')
    } else {
      score += 1
      parts.push('positive curve (risk-on)')
    }
  }
  if (dxyMomentum !== null) {
    if (dxyMomentum > 1) {
      score -= 1
      parts.push('rising dollar (risk-off)')
    } else if (dxyMomentum < -1) {
      score += 1
      parts.push('falling dollar (risk-on)')
    } else {
      parts.push('flat dollar')
    }
  }
  const regime: MacroRegime = score > 0 ? 'risk-on' : score < 0 ? 'risk-off' : 'mixed'
  return { regime, explanation: `Signals: ${parts.join(', ')}.` }
}

function macroMetric(spec: Omit<MacroQuantMetric, 'provenance'>): MacroQuantMetric {
  return { ...spec, provenance: 'math-derived' }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

// --- Fail-closed FRED fetch (used by IPC; pure compute above is the tested core) ---

const FRED_BASE = 'https://api.stlouisfed.org/fred'

export async function fetchMacroSeriesInputs(
  signal: AbortSignal,
  env: NodeJS.ProcessEnv = process.env,
): Promise<MacroSeriesInputs | null> {
  const apiKey = asString(env.ATLASZ_FRED_API_KEY)
  if (!apiKey) {
    return null // fail closed
  }
  const base = asString(env.ATLASZ_FRED_BASE_URL) || FRED_BASE
  const [t10y2y, dgs10, dgs2, dgs3mo] = await Promise.all([
    latest(base, apiKey, 'T10Y2Y', signal),
    latest(base, apiKey, 'DGS10', signal),
    latest(base, apiKey, 'DGS2', signal),
    latest(base, apiKey, 'DGS3MO', signal),
  ])
  const dxySeries = await recent(base, apiKey, 'DTWEXBGS', 30, signal)
  return { t10y2y, dgs10, dgs2, dgs3mo, dxySeries }
}

async function latest(base: string, apiKey: string, seriesId: string, signal: AbortSignal): Promise<number | undefined> {
  const values = await recent(base, apiKey, seriesId, 1, signal)
  return values[values.length - 1]
}

async function recent(base: string, apiKey: string, seriesId: string, limit: number, signal: AbortSignal): Promise<number[]> {
  const url = new URL(`${base}/series/observations`)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', String(limit))
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`FRED ${seriesId} HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { observations?: Array<{ value: string }> }
  const values = (payload.observations ?? [])
    .map((observation) => Number(observation.value))
    .filter((value) => Number.isFinite(value))
    .reverse() // ascending
  return values
}
