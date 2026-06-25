/*
 * Alpaca options chain / open-interest provider — key-gated, fail-closed.
 *
 * Official Alpaca options market data (snapshots): per-contract latest trade/
 * quote, implied volatility, greeks, and open interest WHEN present. Requires the
 * same ATLASZ_ALPACA_API_KEY + ATLASZ_ALPACA_SECRET_KEY (headers only, never
 * persisted/in URL). Identity decoded from the OCC symbol. NO "flow"/"unusual
 * activity" inference; no random fallback; HTTP/schema failures fail closed.
 */
import { createHash } from 'node:crypto'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import { parseOccSymbol, type OptionsContract } from '../../../src/optionsData'

const SOURCE_ID = 'alpaca_options'
const SOURCE_NAME = 'Alpaca Market Data (options)'
const HUMAN_SOURCE_URL = 'https://alpaca.markets/options'
const DEFAULT_DATA_BASE = 'https://data.alpaca.markets/v1beta1'
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000
const STALE_AFTER_MS = 15 * 60_000
const UNDERLYING_PATTERN = /^[A-Z]{1,6}$/

export type AlpacaOptionsConfig = {
  apiBase: string
  apiKey: string
  secretKey: string
  underlyings: string[]
  maxContracts: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

type SnapshotsPayload = {
  snapshots?: Record<string, OptionSnapshot>
  next_page_token?: string | null
}
type OptionSnapshot = {
  latestTrade?: { p?: number; s?: number; t?: string }
  latestQuote?: { bp?: number; ap?: number; bs?: number; as?: number; t?: string }
  impliedVolatility?: number
  openInterest?: number
  oi?: number
  dailyBar?: { v?: number }
}

export function readAlpacaOptionsConfig(env: NodeJS.ProcessEnv = process.env): AlpacaOptionsConfig | null {
  if (env.ATLASZ_OPTIONS_DISABLE === '1') return null
  const apiKey = text(env.ATLASZ_ALPACA_API_KEY)
  const secretKey = text(env.ATLASZ_ALPACA_SECRET_KEY)
  const apiBase = text(env.ATLASZ_ALPACA_DATA_BASE_OPTIONS) || DEFAULT_DATA_BASE
  if (!apiKey || !secretKey || !/^https:\/\//i.test(apiBase)) return null
  const underlyings = parseUnderlyings(env.ATLASZ_OPTIONS_UNDERLYINGS)
  if (underlyings.length === 0) return null
  return {
    apiBase,
    apiKey,
    secretKey,
    underlyings,
    maxContracts: clampInt(Number(env.ATLASZ_OPTIONS_MAX ?? 200), 1, 2_000),
    timeoutMs: clampInt(Number(env.ATLASZ_ALPACA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInt(Number(env.ATLASZ_ALPACA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInt(Number(env.ATLASZ_ALPACA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export function createAlpacaOptionsProvider(config: AlpacaOptionsConfig) {
  return {
    id: SOURCE_ID,
    name: SOURCE_NAME,
    trustTier: 'key-gated-market-data' as const,
    requiredEnv: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY', 'ATLASZ_OPTIONS_UNDERLYINGS'],
    async fetchOptions(signal: AbortSignal): Promise<OptionsContract[]> {
      const retrievedAt = Date.now()
      const out: OptionsContract[] = []
      for (const underlying of config.underlyings) {
        const url = new URL(`${config.apiBase.replace(/\/$/, '')}/options/snapshots/${encodeURIComponent(underlying)}`)
        url.searchParams.set('feed', 'indicative')
        const sourceApiUrl = url.toString()
        const payload = await fetchWithRetry(
          (attemptSignal) => fetchAlpacaJson(url, config, linkedSignal(signal, attemptSignal)),
          { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
        )
        out.push(...parseAlpacaOptionSnapshots(payload, { underlying, retrievedAt, sourceApiUrl, maxContracts: config.maxContracts }))
      }
      return out.slice(0, config.maxContracts)
    },
  }
}

/** Pure normalizer — testable with fixture Alpaca options snapshot payloads. */
export function parseAlpacaOptionSnapshots(
  payload: unknown,
  options: { underlying?: string; retrievedAt?: number; sourceApiUrl?: string; maxContracts?: number } = {},
): OptionsContract[] {
  if (!payload || typeof payload !== 'object') return []
  const snapshots = (payload as SnapshotsPayload).snapshots
  if (!snapshots || typeof snapshots !== 'object') return []
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? `${DEFAULT_DATA_BASE}/options/snapshots/${options.underlying ?? ''}`
  if (/[?&]?(api[_-]?key|apca|secret|token)/i.test(sourceApiUrl) && /=/.test(sourceApiUrl)) return [] // never normalize a key-leaking URL
  const maxContracts = options.maxContracts ?? 200
  const out: OptionsContract[] = []

  for (const [contractSymbol, snap] of Object.entries(snapshots)) {
    const occ = parseOccSymbol(contractSymbol)
    if (!occ || !snap || typeof snap !== 'object') continue
    const lastPrice = num(snap.latestTrade?.p)
    const bid = num(snap.latestQuote?.bp)
    const ask = num(snap.latestQuote?.ap)
    const openInterest = num(snap.openInterest) ?? num(snap.oi)
    const marketTimestamp = epoch(snap.latestTrade?.t) ?? epoch(snap.latestQuote?.t)
    if (marketTimestamp === undefined) continue // no source timestamp -> drop
    if (lastPrice === undefined && bid === undefined && ask === undefined && openInterest === undefined) continue // no data point

    const rawRecord = {
      contractSymbol,
      underlying: occ.underlying,
      optionType: occ.optionType,
      strike: occ.strike,
      expiration: occ.expiration,
      lastPrice,
      bid,
      ask,
      openInterest,
      impliedVolatility: num(snap.impliedVolatility),
      volume: num(snap.dailyBar?.v),
      marketTimestamp,
      sourceId: SOURCE_ID,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    out.push({
      id: `${SOURCE_ID}:${contractSymbol.toLowerCase()}`,
      contractSymbol: contractSymbol.toUpperCase(),
      underlying: occ.underlying,
      optionType: occ.optionType,
      strike: occ.strike,
      expiration: occ.expiration,
      lastPrice,
      bid,
      ask,
      openInterest,
      volume: num(snap.dailyBar?.v),
      impliedVolatility: num(snap.impliedVolatility),
      marketTimestamp,
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: HUMAN_SOURCE_URL,
      sourceApiUrl,
      retrievedAt,
      staleAt: marketTimestamp + STALE_AFTER_MS,
      provenance: 'auth-gated',
      marketDataClass: 'key-gated-market-data',
      confidence: 95,
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
    if (out.length >= maxContracts) break
  }
  return out
}

async function fetchAlpacaJson(url: URL, config: AlpacaOptionsConfig, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/json',
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.secretKey,
      'user-agent': 'AtlaszIntel/0.4 (local-first market intelligence; key-gated Alpaca options)',
    },
  })
  assertOk(response, 'Alpaca options')
  return (await response.json()) as unknown
}

function parseUnderlyings(value: unknown): string[] {
  return text(value)
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => UNDERLYING_PATTERN.test(s))
    .slice(0, 25)
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}
function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

function epoch(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}
function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}
function linkedSignal(parent: AbortSignal, attempt: AbortSignal): AbortSignal {
  if (parent.aborted || attempt.aborted) {
    const controller = new AbortController()
    controller.abort()
    return controller.signal
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  attempt.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export function resolveOptionsProvider(env: NodeJS.ProcessEnv = process.env) {
  if ((env.ATLASZ_OPTIONS_PROVIDER || 'alpaca').trim().toLowerCase() !== 'alpaca') return null
  const config = readAlpacaOptionsConfig(env)
  return config ? createAlpacaOptionsProvider(config) : null
}

export const ALPACA_OPTIONS_SOURCE_ID = SOURCE_ID
