/*
 * Macro calendar adapter (Phase 2).
 *
 * Uses official/public macro APIs (FRED-style) when configured. API keys come
 * ONLY from env (ATLASZ_FRED_API_KEY) — never hard-coded. Fail closed without
 * a key. Missing observations (FRED "." value) are skipped, never fabricated.
 *
 * Tracks CPI, PPI, unemployment, NFP/payrolls, GDP, Fed funds / policy rates.
 * Tags macro proxies (DXY, TLT, SPY, QQQ, GLD, BTC) on rate/inflation/jobs
 * releases.
 *
 * provenance: official-api   category: macro-event
 */
import { adapterEventId, asString, buildAdapterEvent, unique } from './adapterShared'
import type { WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'macro_calendar_fred'
const RISK_PROXIES = ['DXY', 'TLT', 'SPY', 'QQQ', 'GLD', 'BTC']
const GROWTH_PROXIES = ['SPY', 'QQQ', 'DXY']

export type MacroSeriesMeta = {
  seriesId: string
  label: string
  unit: string
  proxies: string[]
}

export const MACRO_SERIES: MacroSeriesMeta[] = [
  { seriesId: 'CPIAUCSL', label: 'CPI (headline inflation)', unit: 'index', proxies: RISK_PROXIES },
  { seriesId: 'PPIACO', label: 'PPI (producer prices)', unit: 'index', proxies: RISK_PROXIES },
  { seriesId: 'UNRATE', label: 'Unemployment rate', unit: '%', proxies: GROWTH_PROXIES },
  { seriesId: 'PAYEMS', label: 'Nonfarm payrolls (NFP)', unit: 'thousands', proxies: RISK_PROXIES },
  { seriesId: 'GDPC1', label: 'Real GDP', unit: 'bn chained $', proxies: GROWTH_PROXIES },
  { seriesId: 'FEDFUNDS', label: 'Federal funds rate (policy rate)', unit: '%', proxies: RISK_PROXIES },
]

export type MacroAdapterConfig = {
  apiKey: string
  baseUrl: string
  series: MacroSeriesMeta[]
  rateLimitMs: number
}

export function readMacroConfig(env: NodeJS.ProcessEnv = process.env): MacroAdapterConfig | null {
  const apiKey = asString(env.ATLASZ_FRED_API_KEY)
  if (!apiKey) {
    return null
  }
  const baseUrl = asString(env.ATLASZ_FRED_BASE_URL) || 'https://api.stlouisfed.org/fred'
  return { apiKey, baseUrl, series: MACRO_SERIES, rateLimitMs: 1200 }
}

export type FredObservation = { date: string; value: string }

export async function fetchMacroCalendar(
  signal: AbortSignal,
  config = readMacroConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const events: WorldIntelEvent[] = []
  for (const meta of config.series) {
    if (signal.aborted) {
      break
    }
    const url = new URL(`${config.baseUrl}/series/observations`)
    url.searchParams.set('series_id', meta.seriesId)
    url.searchParams.set('api_key', config.apiKey)
    url.searchParams.set('file_type', 'json')
    url.searchParams.set('sort_order', 'desc')
    url.searchParams.set('limit', '1')

    const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`FRED ${meta.seriesId} HTTP ${response.status}`)
    }
    const payload = (await response.json()) as { observations?: FredObservation[] }
    const observation = payload.observations?.[0]
    const event = normalizeMacroObservation(meta, observation)
    if (event) {
      events.push(event)
    }
    await delay(config.rateLimitMs, signal)
  }
  return events
}

/** Pure normalizer — testable with simulated FRED observations. */
export function normalizeMacroObservation(
  meta: MacroSeriesMeta,
  observation: FredObservation | undefined,
): WorldIntelEvent | null {
  if (!observation) {
    return null
  }
  const rawValue = asString(observation.value)
  // FRED encodes missing data as ".". Fail closed — never fabricate.
  if (!rawValue || rawValue === '.') {
    return null
  }
  const numericValue = Number(rawValue)
  if (!Number.isFinite(numericValue)) {
    return null
  }
  const observedAt = Date.parse(`${observation.date}T00:00:00Z`)
  if (!Number.isFinite(observedAt)) {
    return null
  }
  const dedupeKey = `fred|${meta.seriesId}|${observation.date}`.toLowerCase()
  return buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${meta.label}: ${rawValue} ${meta.unit}`.trim(),
    summary: `Official macro release (${meta.seriesId}) for ${observation.date}: ${rawValue} ${meta.unit}. Source: FRED official API.`,
    source: 'FRED (Federal Reserve Economic Data)',
    url: `https://fred.stlouisfed.org/series/${meta.seriesId}`,
    observedAt,
    category: 'macro-event',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: { seriesId: meta.seriesId, ...observation },
    affectedAssets: unique(meta.proxies),
    narrativeTags: unique(['Macro release', meta.label, 'Policy-sensitive']),
    extractedEntities: unique([meta.label, meta.seriesId, 'United States']),
  })
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new Error('Macro calendar fetch aborted'))
      },
      { once: true },
    )
  })
}

export const MACRO_SOURCE_ID = SOURCE_ID
