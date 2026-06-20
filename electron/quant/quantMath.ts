/*
 * Pure, deterministic quant math. No I/O, no randomness — every output is a
 * math-derived function of its inputs, which keeps it trivially testable and
 * honest. Returns null when there is insufficient data (callers surface
 * DATA_UNAVAILABLE rather than fabricating a number).
 */

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Sample standard deviation (n-1). Needs >= 2 points. */
export function stddev(values: number[]): number | null {
  if (values.length < 2) return null
  const avg = mean(values)
  if (avg === null) return null
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/** Z-score of the latest value vs the prior window. */
export function zScore(series: number[]): number | null {
  if (series.length < 3) return null
  const prior = series.slice(0, -1)
  const latest = series[series.length - 1]
  const avg = mean(prior)
  const sd = stddev(prior)
  if (avg === null || sd === null || sd === 0) return null
  return (latest - avg) / sd
}

/** Simple (close-to-close) returns. */
export function simpleReturns(prices: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1]
    if (prev !== 0) {
      returns.push((prices[i] - prev) / prev)
    }
  }
  return returns
}

/** Rolling realized volatility = stddev of simple returns over the window. */
export function realizedVolatility(prices: number[]): number | null {
  const returns = simpleReturns(prices)
  return stddev(returns)
}

/** Current drawdown % from the running peak (<= 0). */
export function currentDrawdownPct(prices: number[]): number | null {
  if (prices.length === 0) return null
  let peak = prices[0]
  for (const price of prices) {
    if (price > peak) peak = price
  }
  const last = prices[prices.length - 1]
  if (peak === 0) return null
  return ((last - peak) / peak) * 100
}

/** Volume velocity = latest volume / average of the prior `lookback` volumes. */
export function volumeVelocity(volumes: number[], lookback = 10): number | null {
  if (volumes.length < 2) return null
  const latest = volumes[volumes.length - 1]
  const prior = volumes.slice(Math.max(0, volumes.length - 1 - lookback), volumes.length - 1)
  const avg = mean(prior)
  if (avg === null || avg === 0) return null
  return latest / avg
}

/** Volume-weighted average price over the bars. */
export function vwap(bars: Array<{ price: number; volume: number }>): number | null {
  let pv = 0
  let v = 0
  for (const bar of bars) {
    pv += bar.price * bar.volume
    v += bar.volume
  }
  if (v === 0) return null
  return pv / v
}

/** Deviation of the latest price from VWAP, in percent. */
export function vwapDeviationPct(bars: Array<{ price: number; volume: number }>): number | null {
  if (bars.length === 0) return null
  const reference = vwap(bars)
  if (reference === null || reference === 0) return null
  const last = bars[bars.length - 1].price
  return ((last - reference) / reference) * 100
}

/** Pearson correlation of two equal-length return series. */
export function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length)
  if (n < 3) return null
  const aa = a.slice(a.length - n)
  const bb = b.slice(b.length - n)
  const ma = mean(aa)
  const mb = mean(bb)
  if (ma === null || mb === null) return null
  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < n; i += 1) {
    const da = aa[i] - ma
    const db = bb[i] - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  if (va === 0 || vb === 0) return null
  return cov / Math.sqrt(va * vb)
}

/**
 * Relative strength vs a benchmark over the window: difference of cumulative
 * simple returns (asset - benchmark), in percent. Positive = outperformance.
 */
export function relativeStrengthPct(assetPrices: number[], benchPrices: number[]): number | null {
  if (assetPrices.length < 2 || benchPrices.length < 2) return null
  const assetRet = cumulativeReturn(assetPrices)
  const benchRet = cumulativeReturn(benchPrices)
  if (assetRet === null || benchRet === null) return null
  return (assetRet - benchRet) * 100
}

export function cumulativeReturn(prices: number[]): number | null {
  if (prices.length < 2) return null
  const first = prices[0]
  const last = prices[prices.length - 1]
  if (first === 0) return null
  return (last - first) / first
}

export function pctChange(series: number[]): number | null {
  if (series.length < 2) return null
  const first = series[0]
  const last = series[series.length - 1]
  if (first === 0) return null
  return ((last - first) / first) * 100
}
