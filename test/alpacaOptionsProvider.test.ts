import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ALPACA_OPTIONS_SOURCE_ID,
  createAlpacaOptionsProvider,
  parseAlpacaOptionSnapshots,
  readAlpacaOptionsConfig,
  resolveOptionsProvider,
} from '../electron/osint/quotes/alpacaOptionsProvider'
import { isRenderableOption, parseOccSymbol } from '../src/optionsData'

const NOW = Date.parse('2026-06-18T16:00:00Z')
const API_URL = 'https://data.alpaca.markets/v1beta1/options/snapshots/AAPL?feed=indicative'
const ENV_OK = { ATLASZ_ALPACA_API_KEY: 'k', ATLASZ_ALPACA_SECRET_KEY: 's', ATLASZ_OPTIONS_UNDERLYINGS: 'AAPL' }

const FIXTURE = {
  snapshots: {
    AAPL250117C00150000: {
      latestTrade: { p: 12.35, s: 3, t: '2026-06-18T15:59:50Z' },
      latestQuote: { bp: 12.3, ap: 12.4, t: '2026-06-18T15:59:55Z' },
      impliedVolatility: 0.284,
      openInterest: 15432,
    },
    NOTANOPTION: { latestTrade: { p: 1, t: '2026-06-18T15:59:50Z' } }, // bad symbol -> dropped
    AAPL250117P00150000: { latestQuote: {} }, // no timestamp / no data point -> dropped
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('Alpaca options provider (key-gated)', () => {
  it('decodes OCC contract symbols deterministically', () => {
    expect(parseOccSymbol('AAPL250117C00150000')).toEqual({ underlying: 'AAPL', expiration: '2025-01-17', optionType: 'call', strike: 150 })
    expect(parseOccSymbol('SPY241220P00595000')?.optionType).toBe('put')
    expect(parseOccSymbol('not-an-option')).toBeNull()
  })

  it('fails closed without keys or underlyings', () => {
    expect(readAlpacaOptionsConfig({})).toBeNull()
    expect(readAlpacaOptionsConfig({ ATLASZ_ALPACA_API_KEY: 'k', ATLASZ_ALPACA_SECRET_KEY: 's' })).toBeNull() // no underlyings
    expect(readAlpacaOptionsConfig(ENV_OK)?.underlyings).toEqual(['AAPL'])
    expect(resolveOptionsProvider({})).toBeNull()
    expect(resolveOptionsProvider({ ...ENV_OK, ATLASZ_OPTIONS_PROVIDER: 'polygon' })).toBeNull()
    expect(resolveOptionsProvider(ENV_OK)?.id).toBe(ALPACA_OPTIONS_SOURCE_ID)
  })

  it('parses real option snapshots (chain + open interest) with proof fields', () => {
    const contracts = parseAlpacaOptionSnapshots(FIXTURE, { underlying: 'AAPL', retrievedAt: NOW, sourceApiUrl: API_URL })
    expect(contracts).toHaveLength(1) // bad symbol + no-data dropped
    const c = contracts[0]
    expect(c).toMatchObject({
      underlying: 'AAPL',
      optionType: 'call',
      strike: 150,
      expiration: '2025-01-17',
      lastPrice: 12.35,
      bid: 12.3,
      ask: 12.4,
      openInterest: 15432,
      impliedVolatility: 0.284,
      provenance: 'auth-gated',
      marketDataClass: 'key-gated-market-data',
    })
    expect(isRenderableOption(c)).toBe(true)
    expect(JSON.stringify(c)).not.toMatch(/\b(flow|unusual|sweep|whale)\b/i) // no flow inference
  })

  it('renders an OI-only contract but drops a contract with no data point', () => {
    const oiOnly = { snapshots: { AAPL250117C00150000: { latestTrade: { t: '2026-06-18T15:59:50Z' }, openInterest: 100 } } }
    expect(parseAlpacaOptionSnapshots(oiOnly, { retrievedAt: NOW, sourceApiUrl: API_URL })).toHaveLength(1)
    const empty = { snapshots: { AAPL250117C00150000: { latestTrade: { t: '2026-06-18T15:59:50Z' } } } }
    expect(parseAlpacaOptionSnapshots(empty, { retrievedAt: NOW, sourceApiUrl: API_URL })).toHaveLength(0)
  })

  it('refuses a key-leaking URL and never embeds keys', () => {
    expect(parseAlpacaOptionSnapshots(FIXTURE, { sourceApiUrl: 'https://data.alpaca.markets/v1beta1/x?apca-api-key-id=leak' })).toEqual([])
    const c = parseAlpacaOptionSnapshots(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })[0]
    expect(c.sourceApiUrl).not.toMatch(/apca|secret|api-key/i)
    expect(c.rawPayloadJson ?? '').not.toMatch(/apca|secret/i)
  })

  it('sends keys only in headers and fails closed on rate-limit', async () => {
    let headers: Record<string, string> = {}
    vi.stubGlobal('fetch', async (_url: URL, init: { headers: Record<string, string> }) => {
      headers = init.headers
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FIXTURE }
    })
    const provider = createAlpacaOptionsProvider({ apiBase: 'https://data.alpaca.markets/v1beta1', apiKey: 'secret-key', secretKey: 'secret-secret', underlyings: ['AAPL'], maxContracts: 50, timeoutMs: 1_000, maxRetries: 0, backoffMs: 0 })
    const contracts = await provider.fetchOptions(new AbortController().signal)
    expect(contracts[0].underlying).toBe('AAPL')
    expect(headers['APCA-API-KEY-ID']).toBe('secret-key')
    expect(contracts[0].sourceApiUrl).not.toMatch(/secret-key|secret-secret/)

    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => ({}) }))
    await expect(provider.fetchOptions(new AbortController().signal)).rejects.toMatchObject({ status: 429 })
  })
})
