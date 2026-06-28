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
    expect(snapshot.providers.find((provider) => provider.providerId === 'treasury_fiscal_public')).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
      envKeysRequired: [],
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
    expect(snapshot.providers.find((provider) => provider.providerId === 'bea_public')).toMatchObject({
      status: 'missing-config',
      autoWired: false,
      envKeysRequired: ['ATLASZ_BEA_API_KEY'],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'eia_energy_public')).toMatchObject({
      status: 'missing-config',
      autoWired: false,
      envKeysRequired: ['ATLASZ_EIA_API_KEY'],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'congress_gov_public')).toMatchObject({
      status: 'available',
      autoWired: true,
      envKeysRequired: [],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'openalex_works_public')).toMatchObject({
      status: 'available',
      autoWired: true,
      envKeysRequired: [],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'alpaca_equity_quotes')).toMatchObject({
      status: 'missing-config',
      autoWired: false,
      envKeysRequired: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY'],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'alpaca_options')).toMatchObject({
      status: 'missing-config',
      autoWired: false,
      envKeysRequired: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY', 'ATLASZ_OPTIONS_UNDERLYINGS'],
      envKeysPresent: [],
    })
    expect(snapshot.providers.find((provider) => provider.providerId === 'x_explore_placeholder')).toMatchObject({
      status: 'auth-gated',
      autoWired: false,
      provenance: 'auth-gated',
    })
  })

  it('health-checks configured FRED with the API key without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_FRED_API_KEY: 'secret-fred-key' })

    const snapshot = await service.discover()
    const fred = snapshot.providers.find((provider) => provider.providerId === 'macro_calendar_fred')

    expect(fred).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
    })
    expect(fred?.endpointsChecked[0]).toContain('/fred/series?series_id=CPIAUCSL')
    expect(fred?.endpointsChecked[0]).not.toContain('secret-fred-key')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api_key=secret-fred-key'))).toBe(true)
  })

  it('health-checks configured BEA with UserID without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_BEA_API_KEY: 'secret-bea-key' })

    const snapshot = await service.discover()
    const bea = snapshot.providers.find((provider) => provider.providerId === 'bea_public')

    expect(bea).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
    })
    expect(bea?.endpointsChecked[0]).toContain('apps.bea.gov/api/data')
    expect(bea?.endpointsChecked[0]).not.toContain('secret-bea-key')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('UserID=secret-bea-key'))).toBe(true)
  })

  it('health-checks configured EIA with api_key without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_EIA_API_KEY: 'secret-eia-key' })

    const snapshot = await service.discover()
    const eia = snapshot.providers.find((provider) => provider.providerId === 'eia_energy_public')

    expect(eia).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
    })
    expect(eia?.endpointsChecked[0]).toContain('api.eia.gov/v2/seriesid/PET.RWTC.D')
    expect(eia?.endpointsChecked[0]).not.toContain('secret-eia-key')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api_key=secret-eia-key'))).toBe(true)
  })

  it('health-checks configured Congress.gov with api_key without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_CONGRESS_API_KEY: 'secret-congress-key' })

    const snapshot = await service.discover()
    const congress = snapshot.providers.find((provider) => provider.providerId === 'congress_gov_public')

    expect(congress).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
    })
    expect(congress?.endpointsChecked[0]).toContain('api.congress.gov/v3/bill')
    expect(congress?.endpointsChecked[0]).not.toContain('secret-congress-key')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api_key=secret-congress-key'))).toBe(true)
  })

  it('health-checks Congress.gov DEMO_KEY mode without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl)

    const snapshot = await service.discover()
    const congress = snapshot.providers.find((provider) => provider.providerId === 'congress_gov_public')

    expect(congress).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(congress?.endpointsChecked[0]).toContain('api.congress.gov/v3/bill')
    expect(congress?.endpointsChecked[0]).not.toContain('DEMO_KEY')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api_key=DEMO_KEY'))).toBe(true)
  })

  it('health-checks configured OpenAlex with api_key without storing the key in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_OPENALEX_API_KEY: 'secret-openalex-key' })

    const snapshot = await service.discover()
    const openalex = snapshot.providers.find((provider) => provider.providerId === 'openalex_works_public')

    expect(openalex).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
    })
    expect(openalex?.endpointsChecked[0]).toContain('api.openalex.org/works')
    expect(openalex?.endpointsChecked[0]).not.toContain('secret-openalex-key')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api_key=secret-openalex-key'))).toBe(true)
  })

  it('health-checks OpenAlex public no-key mode without adding an api_key', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl)

    const snapshot = await service.discover()
    const openalex = snapshot.providers.find((provider) => provider.providerId === 'openalex_works_public')

    expect(openalex).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(openalex?.endpointsChecked[0]).toContain('api.openalex.org/works')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('api.openalex.org/works') && String(url).includes('api_key='))).toBe(false)
  })

  it('health-checks Crossref with optional polite mailto without storing it in endpoint trails', async () => {
    const fetchImpl = successfulDiscoveryFetch()
    const { service } = makeService(fetchImpl, { ATLASZ_CROSSREF_MAILTO: 'operator@example.com' })

    const snapshot = await service.discover()
    const crossref = snapshot.providers.find((provider) => provider.providerId === 'crossref_works_public')

    expect(crossref).toMatchObject({
      status: 'available',
      autoWired: true,
      provenance: 'official-api',
      envKeysRequired: [],
    })
    expect(crossref?.endpointsChecked[0]).toContain('api.crossref.org/works')
    expect(crossref?.endpointsChecked[0]).not.toContain('operator@example.com')
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('mailto=operator%40example.com'))).toBe(true)
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

function makeService(fetchImpl: (url: string, init?: { signal?: AbortSignal }) => Promise<FetchResponse>, env: NodeJS.ProcessEnv = {}) {
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
      env,
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
