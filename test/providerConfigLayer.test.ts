import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BUILTIN_PROVIDERS,
  isProviderConfigured,
  loadProviderConfig,
  type ProviderDefinition,
} from '../electron/providers/providerConfig'
import { resolveAdapter } from '../electron/osint/adapterRegistry'
import {
  discoverBinanceSymbols,
  discoverCoinbaseProducts,
  resolveKasMapping,
  toUpperSet,
  type FetchLike,
} from '../electron/providers/symbolDiscovery'

function find(providers: ProviderDefinition[], id: string): ProviderDefinition {
  const provider = providers.find((entry) => entry.providerId === id)
  if (!provider) throw new Error(`missing provider ${id}`)
  return provider
}

describe('provider config layer', () => {
  it('loads built-ins and detects configuration honestly (fail-closed)', () => {
    const { providers } = loadProviderConfig()
    expect(providers.length).toBe(BUILTIN_PROVIDERS.length)
    expect(isProviderConfigured(find(providers, 'gdelt_doc_public'), {})).toBe(true)
    expect(isProviderConfigured(find(providers, 'macro_calendar_fred'), {})).toBe(false)
    expect(isProviderConfigured(find(providers, 'macro_calendar_fred'), { ATLASZ_FRED_API_KEY: 'x' })).toBe(true)
    expect(isProviderConfigured(find(providers, 'x_explore_placeholder'), { ATLASZ_X_AUTH_TOKEN: 'x' })).toBe(false)
  })

  it('merges a valid custom RSS provider and rejects unsafe entries', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-cfg-'))
    try {
      const path = join(dir, 'atlasz.providers.json')
      writeFileSync(
        path,
        JSON.stringify([
          { providerId: 'custom-defense-rss', providerName: 'Defense RSS', category: 'world-news', adapter: 'rss', enabled: true, endpoint: 'https://example.gov/rss', authType: 'none', provenance: 'official-api' },
          { providerId: 'bad-adapter', providerName: 'Bad', category: 'world-news', adapter: 'webscrape', endpoint: 'https://x.test', provenance: 'official-api' },
          { providerId: 'bad-url', providerName: 'Bad URL', category: 'world-news', adapter: 'rss', endpoint: 'file:///etc/passwd', provenance: 'official-api' },
        ]),
      )
      const { providers, errors } = loadProviderConfig({ configPath: path })
      expect(providers.some((p) => p.providerId === 'custom-defense-rss')).toBe(true)
      expect(providers.some((p) => p.providerId === 'bad-adapter')).toBe(false)
      expect(providers.some((p) => p.providerId === 'bad-url')).toBe(false)
      expect(errors.length).toBeGreaterThanOrEqual(2)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('adapter registry', () => {
  it('resolves reusable fetchers and fails closed on missing credentials', () => {
    const providers = loadProviderConfig().providers
    expect(resolveAdapter(find(providers, 'gdelt_doc_public'), {}).fetcher).toBeTypeOf('function')
    expect(resolveAdapter(find(providers, 'sec_edgar_public'), {}).fetcher).toBeUndefined()
    expect(resolveAdapter(find(providers, 'sec_edgar_public'), { ATLASZ_SEC_USER_AGENT: 'a@b.com' }).fetcher).toBeTypeOf('function')
    expect(resolveAdapter(find(providers, 'rss_public_radar'), {}).managed).toBe(true)
    expect(resolveAdapter(find(providers, 'x_explore_placeholder'), {}).configured).toBe(false)
  })
})

describe('market symbol + KAS discovery', () => {
  const coinbaseFetch: FetchLike = async () => ({ ok: true, status: 200, json: async () => [{ id: 'BTC-USD' }, { id: 'KAS-USD' }] })
  const binanceFetch: FetchLike = async () => ({ ok: true, status: 200, json: async () => ({ symbols: [{ symbol: 'KASUSDT', status: 'TRADING' }] }) })

  it('discovers exchange symbols and propagates failure (no invented symbols)', async () => {
    expect(await discoverCoinbaseProducts(coinbaseFetch)).toContain('KAS-USD')
    expect(await discoverBinanceSymbols(binanceFetch)).toContain('KASUSDT')
    const failing: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) })
    await expect(discoverCoinbaseProducts(failing)).rejects.toThrow()
  })

  it('wires KAS only when a provider really lists it, else PRICE_UNAVAILABLE', () => {
    const withKas = resolveKasMapping([{ providerId: 'coinbase_public_ws', feedType: 'WebSocket', symbols: toUpperSet(['BTC-USD', 'KAS-USD']) }])
    expect(withKas.status).toBe('available')
    expect(withKas.resolutions[0].providerSymbol).toBe('KAS-USD')

    const withoutKas = resolveKasMapping([{ providerId: 'coinbase_public_ws', feedType: 'WebSocket', symbols: toUpperSet(['BTC-USD']) }])
    expect(withoutKas.status).toBe('PRICE_UNAVAILABLE')
    expect(withoutKas.resolutions).toEqual([])
  })
})
