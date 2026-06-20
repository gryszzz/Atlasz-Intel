import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderDiscoveryService } from '../electron/providers/providerDiscoveryService'
import type { IntelPersistence, SourceAuditRecord } from '../electron/persistence'
import type { OsintSourceSnapshot } from '../src/worldIntel'

type FetchResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

const now = 1_770_000_000_000
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true })
  }
  vi.restoreAllMocks()
})

describe('provider auto-discovery', () => {
  it('discovers safe public providers, local services, and KAS symbol wiring', async () => {
    const { service, savedSources, auditEvents } = makeService(successfulDiscoveryFetch())

    const snapshot = await service.discover()

    expect(snapshot.status).toBe('partial')
    expect(snapshot.providers.find((provider) => provider.providerId === 'public_market_rest')).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'public-unauthenticated',
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'coinbase_public_ws')?.supportedSymbols).toContain('KAS-USD')
    expect(snapshot.providers.find((provider) => provider.providerId === 'binance_public_ws')?.supportedSymbols).toContain('KASUSDT')
    expect(snapshot.assetAvailability).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetSymbol: 'KAS', providerId: 'public_market_rest', status: 'available' }),
        expect.objectContaining({ assetSymbol: 'KAS', providerId: 'coinbase_public_ws', providerSymbol: 'KAS-USD' }),
        expect.objectContaining({ assetSymbol: 'KAS', providerId: 'binance_public_ws', providerSymbol: 'KASUSDT' }),
      ]),
    )
    expect(savedSources.some((source) => source.sourceId === 'provider:public_market_rest')).toBe(true)
    expect(auditEvents.some((event) => event.eventType === 'provider_discovered')).toBe(true)
  })

  it('labels configured boundaries honestly when credentials are missing or auth-gated', async () => {
    const { service } = makeService(successfulDiscoveryFetch())

    const snapshot = await service.discover()

    expect(snapshot.providers.find((provider) => provider.providerId === 'macro_calendar_fred')).toMatchObject({
      status: 'missing-config',
      autoWired: false,
      envKeysRequired: ['ATLASZ_FRED_API_KEY'],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'x_explore_placeholder')).toMatchObject({
      status: 'auth-gated',
      autoWired: false,
      provenance: 'auth-gated',
    })
  })

  it('fails closed and does not report KAS availability when public discovery endpoints fail', async () => {
    const { service } = makeService(async () => response({}, false, 503))

    const snapshot = await service.discover()

    expect(snapshot.providers.find((provider) => provider.providerId === 'public_market_rest')).toMatchObject({
      status: 'unavailable',
      autoWired: false,
    })
    expect(snapshot.assetAvailability).toEqual([
      {
        assetSymbol: 'KAS',
        providerId: 'unavailable',
        providerSymbol: 'KAS',
        feedType: 'REST',
        status: 'PRICE_UNAVAILABLE',
      },
    ])
  })

  it('caches the latest discovery snapshot for startup source health', async () => {
    const { service, userDataPath } = makeService(successfulDiscoveryFetch())
    const snapshot = await service.discover()

    const restored = new ProviderDiscoveryService({
      userDataPath,
      persistence: makePersistence().persistence,
      fetchImpl: successfulDiscoveryFetch(),
      now: () => now,
      env: {},
    })

    expect(restored.snapshot()).toEqual(snapshot)
  })
})

function makeService(fetchImpl: (url: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>) {
  const userDataPath = mkdtempSync(join(tmpdir(), 'atlasz-provider-discovery-'))
  tempDirs.push(userDataPath)
  const { persistence, savedSources, auditEvents } = makePersistence()
  return {
    userDataPath,
    savedSources,
    auditEvents,
    service: new ProviderDiscoveryService({
      userDataPath,
      persistence,
      fetchImpl,
      now: () => now,
      env: {},
    }),
  }
}

function makePersistence() {
  const savedSources: OsintSourceSnapshot[] = []
  const auditEvents: SourceAuditRecord[] = []
  const persistence = {
    mode: 'node:sqlite',
    saveOsintSource: vi.fn((record: OsintSourceSnapshot) => savedSources.push(record)),
    audit: vi.fn((record: SourceAuditRecord) => auditEvents.push(record)),
  } as unknown as IntelPersistence
  return { persistence, savedSources, auditEvents }
}

function successfulDiscoveryFetch() {
  return vi.fn(async (url: string): Promise<FetchResponse> => {
    if (url.includes('api.exchange.coinbase.com/products')) {
      return response([{ id: 'BTC-USD' }, { id: 'ETH-USD' }, { id: 'KAS-USD' }])
    }
    if (url.includes('api.binance.com/api/v3/exchangeInfo')) {
      return response({
        symbols: [
          { symbol: 'BTCUSDT', status: 'TRADING' },
          { symbol: 'KASUSDT', status: 'TRADING' },
          { symbol: 'KASOLD', status: 'BREAK' },
        ],
      })
    }
    return response({ ok: true })
  })
}

function response(payload: unknown, ok = true, status = 200): FetchResponse {
  return {
    ok,
    status,
    json: async () => payload,
  }
}
