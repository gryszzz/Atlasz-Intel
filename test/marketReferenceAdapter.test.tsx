import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MARKET_REFERENCE_SOURCE_ID,
  fetchMarketReference,
  normalizeMarketIdentities,
  parseSecCompanyTickers,
  readMarketReferenceConfig,
} from '../electron/osint/adapters/marketReferenceAdapter'
import { createPersistence } from '../electron/persistence'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { MarketIdentitySourceTrail } from '../src/components/intel/MarketIdentitySourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import {
  buildMarketIdentityIndex,
  resolveByCik,
  resolveByMarketIdentity,
  resolveByTicker,
  resolveEntity,
} from '../src/engine/entityResolver'
import type { MarketIdentity, WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const SOURCE_URL = 'https://www.sec.gov/files/company_tickers.json'

const SEC_TICKERS_FIXTURE = {
  '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' },
  '1': { cik_str: 1652044, ticker: 'GOOGL', title: 'Alphabet Inc.' },
  '2': { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
  '3': { cik_str: '', ticker: 'BAD', title: 'Broken CIK' },
  '4': { cik_str: 999999, ticker: '', title: 'Broken Ticker' },
}

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function identities() {
  return parseSecCompanyTickers(SEC_TICKERS_FIXTURE, { sourceUrl: SOURCE_URL, retrievedAt: NOW, staleAfterMs: 1_000 })
}

function events(): WorldIntelEvent[] {
  return normalizeMarketIdentities(identities())
}

describe('Market Reference Master adapter', () => {
  it('is public by default, bounded, and refuses non-official SEC ticker URLs', () => {
    expect(readMarketReferenceConfig({})).not.toBeNull()
    expect(readMarketReferenceConfig({ ATLASZ_MARKET_REFERENCE_DISABLE: '1' })).toBeNull()
    expect(readMarketReferenceConfig({ ATLASZ_SEC_COMPANY_TICKERS_URL: 'https://example.com/company_tickers.json' })).toBeNull()
    expect(readMarketReferenceConfig({ ATLASZ_SEC_COMPANY_TICKERS_URL: 'http://www.sec.gov/files/company_tickers.json' })).toBeNull()
    expect(readMarketReferenceConfig({ ATLASZ_MARKET_REFERENCE_MAX_RECORDS: '2' })?.maxRecords).toBe(2)
  })

  it('parses SEC company_tickers.json with numeric CIK padding and drops malformed rows', () => {
    const parsed = identities()
    expect(parsed).toHaveLength(3)
    const nvda = parsed.find((record) => record.ticker === 'NVDA')!
    expect(nvda.cik).toBe('1045810')
    expect(nvda.cikPadded).toBe('0001045810')
    expect(nvda.legalName).toBe('NVIDIA CORP')
    expect(nvda.aliases).toEqual(['NVDA', '1045810', '0001045810', 'NVIDIA CORP'])
    expect(nvda.exchange).toBeUndefined()
    expect(nvda.sector).toBeUndefined()
    expect(nvda.industry).toBeUndefined()
    expect(nvda.sourceUrl).toBe(SOURCE_URL)
    expect(nvda.provenance).toBe('official-api')
    expect(nvda.confidence).toBe(96)
    expect(nvda.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('normalizes reference identities into source-trailed events without fake sectors or exchange data', () => {
    const event = events().find((candidate) => candidate.marketIdentity?.ticker === 'NVDA')!
    expect(event.sourceId).toBe(MARKET_REFERENCE_SOURCE_ID)
    expect(event.category).toBe('market-reference')
    expect(event.provenance).toBe('official-api')
    expect(event.affectedAssets).toEqual(['NVDA'])
    expect(event.affectedSectors).toEqual([])
    expect(event.summary).toContain('Exchange, sector, industry')
    expect(event.marketIdentity?.sector).toBeUndefined()
  })

  it('builds a preferred exact market identity resolver and refuses conflicting identities', () => {
    const index = buildMarketIdentityIndex(identities())
    expect(resolveByTicker('nvda', index)).toMatchObject({
      resolved: true,
      canonicalSeedEntityId: 'company:nvidia',
      matchType: 'ticker',
    })
    expect(resolveByCik('0001045810', index)).toMatchObject({
      resolved: true,
      canonicalSeedEntityId: 'company:nvidia',
      matchType: 'cik',
    })
    expect(resolveEntity({ ticker: 'NVDA', name: 'NVIDIA CORP' }, index)).toMatchObject({
      resolved: true,
      canonicalSeedEntityId: 'company:nvidia',
    })

    const conflictA = identities()[0]
    const conflictB: MarketIdentity = { ...conflictA, id: 'market-identity:conflict', cik: '999999', cikPadded: '0000999999', legalName: 'Different Co' }
    const conflictIndex = buildMarketIdentityIndex([conflictA, conflictB])
    const conflict = resolveByMarketIdentity({ ticker: 'NVDA' }, conflictIndex)
    expect(conflict.resolved).toBe(false)
    expect((conflict as { reason: string }).reason).toMatch(/conflict/i)
  })

  it('keeps non-curated companies unresolved even when SEC identity exists', () => {
    const [record] = parseSecCompanyTickers({ '0': { cik_str: 9999999, ticker: 'ZZZZ', title: 'Unknown Public Co' } }, { sourceUrl: SOURCE_URL, retrievedAt: NOW })
    const result = resolveByMarketIdentity({ ticker: 'ZZZZ' }, buildMarketIdentityIndex([record]))
    expect(result.resolved).toBe(false)
    expect((result as { reason: string }).reason).toMatch(/no exact curated seed alias/i)
  })

  it('round-trips the identity table and typed event sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-market-ref-'))
    dirs.push(dir)
    const persistence = createPersistence(dir)
    const event = events().find((candidate) => candidate.marketIdentity?.ticker === 'AAPL')!
    persistence.saveMarketIdentity(event.marketIdentity!)
    persistence.saveWorldIntelEvent(event)
    persistence.close()

    const restored = createPersistence(dir)
    const identity = restored.listMarketIdentities('AAPL')[0]
    const rehydratedEvent = restored.listWorldIntelEvents().find((candidate) => candidate.marketIdentity?.ticker === 'AAPL')
    expect(identity.cik).toBe('320193')
    expect(identity.cikPadded).toBe('0000320193')
    expect(rehydratedEvent?.marketIdentity?.legalName).toBe('Apple Inc.')
    restored.close()
  })

  it('links market identity -> company/ticker/CIK nodes and renders the dossier identity panel', () => {
    const event = events().find((candidate) => candidate.marketIdentity?.ticker === 'NVDA')!
    const graph = buildEntityGraph([event], { now: NOW })
    const company = graph.nodes.find((node) => node.kind === 'company' && node.label === 'NVIDIA CORP')!
    expect(company).toBeDefined()
    const rels = neighborsOf(graph, company.id).map((n) => `${n.relation}:${n.entity.kind}:${n.entity.label}`)
    expect(rels).toContain('trades_as:ticker:NVDA')
    expect(rels).toContain('represents:cik:CIK 1045810')

    const markup = renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: company.id }))
    expect(markup).toContain('Resolved by ticker/CIK from SEC company tickers')
    expect(markup).toContain('Exchange, sector, and industry are not present')
    expect(markup).toContain('SEC company_tickers.json')
  })

  it('renders source trail cards with fresh/stale labels and unavailable states', () => {
    const freshMarkup = renderToStaticMarkup(createElement(MarketIdentitySourceTrail, { events: events(), now: NOW }))
    expect(freshMarkup).toContain('Market Reference Master')
    expect(freshMarkup).toContain('NVIDIA CORP')
    expect(freshMarkup).toContain('DATA_UNAVAILABLE')
    expect(freshMarkup).toContain('data-freshness="fresh"')

    // now is past the source staleAt (NOW + 1_000) → canonical label is "expired", never styled fresh.
    const staleMarkup = renderToStaticMarkup(createElement(MarketIdentitySourceTrail, { events: events(), now: NOW + 2_000 }))
    expect(staleMarkup).toContain('data-freshness="expired"')

    const emptyMarkup = renderToStaticMarkup(createElement(MarketIdentitySourceTrail, { events: [] }))
    expect(emptyMarkup).toContain('DATA_UNAVAILABLE')
  })

  it('fetches through the official public URL and fails closed on HTTP errors', async () => {
    let requestedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => SEC_TICKERS_FIXTURE }
    })
    const fetched = await fetchMarketReference(new AbortController().signal, {
      sourceUrl: SOURCE_URL,
      userAgent: 'Atlasz Intel tests (operator@example.com)',
      staleAfterMs: 1_000,
      maxRecords: 2,
    })
    expect(requestedUrl).toBe(SOURCE_URL)
    expect(fetched).toHaveLength(2)

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '9' : null) },
      json: async () => ({}),
    }))
    await expect(fetchMarketReference(new AbortController().signal, {
      sourceUrl: SOURCE_URL,
      userAgent: 'Atlasz Intel tests (operator@example.com)',
      staleAfterMs: 1_000,
      maxRecords: 2,
    })).rejects.toMatchObject({ status: 429, retryAfterMs: 9_000 })
  })
})
