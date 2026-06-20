/*
 * Quant compute service (Phase 3). Turns persisted OHLCV bars into math-derived
 * actionability metrics with strict provenance. Runs in the Electron main
 * process. Fail-closed: when history is insufficient it returns an explicit
 * `unavailable` snapshot/metric with a reason — never a fabricated number.
 */
import {
  correlation,
  currentDrawdownPct,
  realizedVolatility,
  relativeStrengthPct,
  simpleReturns,
  volumeVelocity,
  vwapDeviationPct,
  zScore,
} from './quantMath'
import { buildEventOverlay } from './eventOverlayService'
import {
  unavailableQuantSnapshot,
  type QuantBar,
  type QuantMetric,
  type QuantMetricStatus,
  type QuantSnapshot,
} from '../../src/quant'
import type { ProvenanceId } from '../../src/provenance'
import type { WorldIntelEvent } from '../../src/worldIntel'

export type MarketTickRow = { symbol: string; price: number; volume: number; observedAt: number }

export interface QuantBarSource {
  listMarketTicks(symbol: string, limit?: number): MarketTickRow[]
}

const MIN_BARS = 12
const EXPECTED_BARS = 60
const VOLUME_ANOMALY_THRESHOLD = 3.0
const CRYPTO_HINTS = /(BTC|ETH|SOL|LINK|KAS|XRP|ADA|DOGE|AVAX|USDT?$|-USD$)/i

export class QuantComputeService {
  private readonly source: QuantBarSource

  constructor(source: QuantBarSource) {
    this.source = source
  }

  /** Compute snapshots for a list of symbols. */
  computeSnapshots(
    symbols: string[],
    options: { events?: WorldIntelEvent[]; allowModelInferred?: boolean; now?: number } = {},
  ): QuantSnapshot[] {
    return symbols.map((symbol) => this.computeAssetSnapshot(symbol, options))
  }

  computeAssetSnapshot(
    symbol: string,
    options: { events?: WorldIntelEvent[]; allowModelInferred?: boolean; now?: number } = {},
  ): QuantSnapshot {
    const now = options.now ?? Date.now()
    const bars = this.loadBars(symbol)
    if (bars.length < MIN_BARS) {
      return unavailableQuantSnapshot(
        symbol,
        `Insufficient price history (${bars.length}/${MIN_BARS} bars) from current public sources.`,
        now,
      )
    }

    const benchmark = benchmarkFor(symbol)
    const prices = bars.map((bar) => bar.price)
    const volumes = bars.map((bar) => bar.volume)
    const coverage = Math.min(1, bars.length / EXPECTED_BARS)
    const lastTime = bars[bars.length - 1].time
    const metrics: QuantMetric[] = []

    metrics.push(
      metricFrom({
        symbol,
        timestamp: lastTime,
        name: 'Volume velocity',
        value: volumeVelocity(volumes),
        unit: 'x',
        window: '10-bar',
        threshold: VOLUME_ANOMALY_THRESHOLD,
        coverage,
        status: (v) => (v >= VOLUME_ANOMALY_THRESHOLD ? 'anomaly' : v >= 2 ? 'elevated' : 'normal'),
        explain: (v) => `Latest volume is ${v.toFixed(2)}× the 10-bar average.`,
        unavailable: 'Not enough volume history to compute velocity.',
      }),
    )

    metrics.push(
      metricFrom({
        symbol,
        timestamp: lastTime,
        name: 'Price z-score',
        value: zScore(prices),
        unit: 'σ',
        window: `${prices.length}-bar`,
        threshold: 3,
        coverage,
        status: (v) => (Math.abs(v) >= 3 ? 'anomaly' : Math.abs(v) >= 2 ? 'elevated' : 'normal'),
        explain: (v) => `Latest price is ${v.toFixed(2)}σ from its moving average.`,
        unavailable: 'Not enough price history to compute a z-score.',
      }),
    )

    metrics.push(
      metricFrom({
        symbol,
        timestamp: lastTime,
        name: 'VWAP deviation',
        value: vwapDeviationPct(bars),
        unit: '%',
        window: 'session',
        threshold: 5,
        coverage,
        status: (v) => (Math.abs(v) >= 5 ? 'anomaly' : Math.abs(v) >= 2 ? 'elevated' : 'normal'),
        explain: (v) => `Latest price is ${v.toFixed(2)}% from session VWAP.`,
        unavailable: 'Intraday data does not support a VWAP computation.',
      }),
    )

    metrics.push(
      metricFrom({
        symbol,
        timestamp: lastTime,
        name: 'Realized volatility',
        value: scalePct(realizedVolatility(prices)),
        unit: '%',
        window: `${prices.length}-bar`,
        coverage,
        status: () => 'normal',
        explain: (v) => `Std. dev. of per-bar returns is ${v.toFixed(2)}%.`,
        unavailable: 'Not enough returns to compute realized volatility.',
      }),
    )

    metrics.push(
      metricFrom({
        symbol,
        timestamp: lastTime,
        name: 'Current drawdown',
        value: currentDrawdownPct(prices),
        unit: '%',
        window: 'window peak',
        threshold: -20,
        coverage,
        status: (v) => (v <= -20 ? 'anomaly' : v <= -10 ? 'elevated' : 'normal'),
        explain: (v) => `Down ${Math.abs(v).toFixed(2)}% from the window peak.`,
        unavailable: 'No price history to compute drawdown.',
      }),
    )

    // Benchmark-relative metrics (require benchmark bars).
    const benchBars = benchmark && benchmark !== symbol ? this.loadBars(benchmark) : []
    const benchPrices = benchBars.map((bar) => bar.price)
    const rsValue = benchPrices.length >= MIN_BARS ? relativeStrengthPct(alignTail(prices, benchPrices), alignTail(benchPrices, prices)) : null
    metrics.push(
      benchmarkMetric({
        symbol,
        timestamp: lastTime,
        name: 'Relative strength',
        value: rsValue,
        unit: '%',
        benchmark,
        coverage,
        status: (v) => (Math.abs(v) >= 10 ? 'anomaly' : Math.abs(v) >= 5 ? 'elevated' : 'normal'),
        explain: (v) => `${v >= 0 ? 'Outperforming' : 'Underperforming'} ${benchmark} by ${Math.abs(v).toFixed(2)}% over the window.`,
        unavailable: benchmark
          ? `Benchmark ${benchmark} history unavailable from current public sources.`
          : 'No benchmark configured for this asset class.',
      }),
    )

    const corrValue =
      benchPrices.length >= MIN_BARS
        ? correlation(simpleReturns(alignTail(prices, benchPrices)), simpleReturns(alignTail(benchPrices, prices)))
        : null
    metrics.push(
      benchmarkMetric({
        symbol,
        timestamp: lastTime,
        name: 'Rolling correlation',
        value: corrValue,
        unit: 'r',
        benchmark,
        coverage,
        status: (v) => (Math.abs(v) >= 0.8 ? 'elevated' : 'normal'),
        explain: (v) => `Return correlation with ${benchmark} is ${v.toFixed(2)}.`,
        unavailable: benchmark
          ? `Benchmark ${benchmark} history unavailable from current public sources.`
          : 'No benchmark configured for this asset class.',
      }),
    )

    const markers = buildEventOverlay({
      events: options.events ?? [],
      assetSymbol: symbol,
      from: bars[0].time,
      to: lastTime,
      allowModelInferred: options.allowModelInferred,
    })

    return {
      assetSymbol: symbol,
      generatedAt: now,
      benchmark,
      bars,
      metrics,
      markers,
      dataAvailable: true,
    }
  }

  private loadBars(symbol: string): QuantBar[] {
    const rows = this.source.listMarketTicks(symbol, 200)
    return rows
      .map((row) => ({ time: row.observedAt, price: row.price, volume: row.volume }))
      .filter((bar) => Number.isFinite(bar.price) && Number.isFinite(bar.time))
      .sort((left, right) => left.time - right.time)
  }
}

type MetricSpec = {
  symbol: string
  timestamp: number
  name: string
  value: number | null
  unit: string
  window: string
  threshold?: number
  coverage: number
  status: (value: number) => QuantMetricStatus
  explain: (value: number) => string
  unavailable: string
}

function metricFrom(spec: MetricSpec): QuantMetric {
  return finalizeMetric(spec, undefined, ['market_ticks_daily'], 'math-derived')
}

function benchmarkMetric(spec: Omit<MetricSpec, 'window'> & { benchmark?: string }): QuantMetric {
  return finalizeMetric(
    { ...spec, window: 'window' },
    spec.benchmark,
    ['market_ticks_daily', spec.benchmark ? `benchmark:${spec.benchmark}` : 'benchmark:none'],
    'math-derived',
  )
}

function finalizeMetric(
  spec: MetricSpec,
  benchmark: string | undefined,
  inputSources: string[],
  provenance: ProvenanceId,
): QuantMetric {
  const id = `${spec.symbol}:${spec.name}`.toLowerCase().replace(/\s+/g, '-')
  if (spec.value === null || !Number.isFinite(spec.value)) {
    return {
      id,
      assetSymbol: spec.symbol,
      timestamp: spec.timestamp,
      metricName: spec.name,
      metricValue: null,
      unit: spec.unit,
      window: spec.window,
      benchmark,
      threshold: spec.threshold,
      status: 'unavailable',
      explanation: spec.unavailable,
      provenance,
      inputSources,
      dataCoverage: spec.coverage,
      confidence: 0,
      unavailableReason: spec.unavailable,
    }
  }
  return {
    id,
    assetSymbol: spec.symbol,
    timestamp: spec.timestamp,
    metricName: spec.name,
    metricValue: spec.value,
    unit: spec.unit,
    window: spec.window,
    benchmark,
    threshold: spec.threshold,
    status: spec.status(spec.value),
    explanation: spec.explain(spec.value),
    provenance,
    inputSources,
    dataCoverage: spec.coverage,
    confidence: Math.max(0.1, Math.min(0.95, spec.coverage)),
  }
}

function scalePct(value: number | null): number | null {
  return value === null ? null : value * 100
}

/** Tail-align `a` to the length of the shorter of (a, b). */
function alignTail(a: number[], b: number[]): number[] {
  const n = Math.min(a.length, b.length)
  return a.slice(a.length - n)
}

export function benchmarkFor(symbol: string): string | undefined {
  const upper = symbol.toUpperCase()
  if (CRYPTO_HINTS.test(upper)) {
    return 'BTC'
  }
  // Equities / ETFs benchmark to SPY. Unknown classes have no default.
  if (/^[A-Z]{1,5}$/.test(upper)) {
    return 'SPY'
  }
  return undefined
}
