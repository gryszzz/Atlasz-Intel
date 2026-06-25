import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ETF_HOLDINGS_SOURCE_ID,
  applyEtfHoldingChangeStatus,
  fetchEtfHoldings,
  normalizeEtfHoldings,
  parseEtfHoldingRows,
  readEtfHoldingsConfig,
  type EtfFundSource,
  type EtfHoldingsConfig,
} from '../electron/osint/adapters/etfHoldingsAdapter'
import { createPersistence } from '../electron/persistence'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { EtfHoldingsSourceTrail } from '../src/components/intel/EtfHoldingsSourceTrail'
import { selectRenderableEtfHoldings } from '../src/components/intel/etfHoldingTrailSelect'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import { classifyChangeType } from '../src/engine/materialityEngine'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')

const SSGA_SOURCE: EtfFundSource = {
  fundTicker: 'XLK',
  fundName: 'State Street® Technology Select Sector SPDR® ETF',
  issuer: 'State Street / SPDR',
  sourceName: 'State Street daily holdings XLSX',
  format: 'ssga-xlsx',
  sourceUrl: 'https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-xlk.xlsx',
}

const ISHARES_SOURCE: EtfFundSource = {
  fundTicker: 'SOXX',
  fundName: 'iShares Semiconductor ETF',
  issuer: 'BlackRock / iShares',
  sourceName: 'iShares fund data download',
  format: 'ishares-spreadsheetml',
  sourceUrl:
    'https://www.blackrock.com/varnish-api/blk-one01-product-data/product-data/api/v1/get-fund-document?appSubType=ISHARES&appType=PRODUCT_PAGE&component=fundDownload&locale=en_US&portfolioId=239705&targetSite=us-ishares&userType=individual',
}

const SSGA_ROWS = [
  ['Fund Name:', 'State Street® Technology Select Sector SPDR® ETF'],
  ['Ticker Symbol:', 'XLK'],
  ['Holdings:', 'As of 22-Jun-2026'],
  ['Name', 'Ticker', 'Identifier', 'SEDOL', 'Weight', 'Sector', 'Shares Held', 'Local Currency'],
  ['NVIDIA CORP', 'NVDA', '67066G104', '2379504', '15.147294', '-', '90784367', 'USD'],
  ['APPLE INC', 'AAPL', '037833100', '2046251', '13.075187', '-', '55051766', 'USD'],
  ['SSI US GOV MONEY MARKET CLASS', '-', '924QSGII3', '-', '0.32573', '-', '407335585.34', 'USD'],
]

const ISHARES_ROWS = [
  ['06/22/2026'],
  ['iShares Semiconductor ETF'],
  ['Fund Holdings as of', 'Jun 22, 2026'],
  ['Ticker', 'Name', 'Sector', 'Asset Class', 'Market Value', 'Weight (%)', 'Notional Value', 'Quantity', 'Price', 'Location', 'Exchange', 'Currency'],
  ['MU', 'MICRON TECHNOLOGY INC', 'Information Technology', 'Equity', '4061466408.8', '8.76691', '4061466408.8', '3352760', '1211.38', 'United States', 'NASDAQ', 'USD'],
  ['USD', 'USD CASH', 'Cash and/or Derivatives', 'Cash', '12673381.69', '0.02736', '12673381.69', '12673382', '100', 'United States', '--', 'USD'],
  ['As Of', 'NAV per Share', 'Ex-Dividends', 'Shares Outstanding'],
]

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function records() {
  return parseEtfHoldingRows(SSGA_ROWS, SSGA_SOURCE, { retrievedAt: NOW, maxRows: 10 })
}

function events(): WorldIntelEvent[] {
  return normalizeEtfHoldings(records())
}

function iSharesEvents(): WorldIntelEvent[] {
  return normalizeEtfHoldings(parseEtfHoldingRows(ISHARES_ROWS, ISHARES_SOURCE, { retrievedAt: NOW, maxRows: 10 }))
}

describe('ETF holdings adapter', () => {
  it('is public by default, source-allowlisted, and bounded', () => {
    const defaultFunds = readEtfHoldingsConfig({})?.funds.map((f) => f.fundTicker)
    expect(defaultFunds).toEqual(['SOXX', 'SPY', 'XLK', 'XLE', 'XLU'])
    expect(defaultFunds).not.toContain('SMH')
    expect(defaultFunds).not.toContain('QQQ')
    expect(readEtfHoldingsConfig({ ATLASZ_ETF_HOLDINGS_DISABLE: '1' })).toBeNull()
    expect(readEtfHoldingsConfig({ ATLASZ_ETF_HOLDINGS_FUNDS: 'XLK' })?.funds.map((f) => f.fundTicker)).toEqual(['XLK'])
    expect(readEtfHoldingsConfig({ ATLASZ_ETF_HOLDINGS_FUNDS: 'NOTREAL' })).toBeNull()
    expect(readEtfHoldingsConfig({ ATLASZ_ETF_HOLDINGS_MAX_ROWS: '2' })?.maxHoldingsPerFund).toBe(2)
  })

  it('guards official issuer domains before parsing or fetching', async () => {
    const badSource: EtfFundSource = { ...SSGA_SOURCE, sourceUrl: 'https://example.com/holdings-daily-us-en-xlk.xlsx' }
    expect(parseEtfHoldingRows(SSGA_ROWS, badSource, { retrievedAt: NOW })).toEqual([])

    const config: EtfHoldingsConfig = {
      funds: [badSource],
      timeoutMs: 1000,
      maxRetries: 0,
      backoffMs: 0,
      maxHoldingsPerFund: 10,
    }
    await expect(fetchEtfHoldings(new AbortController().signal, config)).rejects.toThrow(/approved official issuer URL/)
  })

  it('parses official State Street holdings rows with source date and source-provided weights', () => {
    const parsed = records()
    expect(parsed).toHaveLength(3)
    const nvda = parsed[0]
    expect(nvda.fundTicker).toBe('XLK')
    expect(nvda.fundName).toBe('State Street® Technology Select Sector SPDR® ETF')
    expect(nvda.issuer).toBe('State Street / SPDR')
    expect(nvda.sourceDate).toBe('2026-06-22')
    expect(nvda.holdingTicker).toBe('NVDA')
    expect(nvda.cusip).toBe('67066G104')
    expect(nvda.weight).toBeCloseTo(15.147294)
    expect(nvda.weightSource).toBe('source-provided')
    expect(nvda.shares).toBe(90784367)
    expect(nvda.sourceUrl).toBe(SSGA_SOURCE.sourceUrl)
    expect(nvda.provenance).toBe('public-disclosure')
    expect(nvda.confidence).toBe(94)
    expect(nvda.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('parses official iShares SpreadsheetML rows and keeps cash unresolved', () => {
    const parsed = parseEtfHoldingRows(ISHARES_ROWS, ISHARES_SOURCE, { retrievedAt: NOW, maxRows: 10 })
    expect(parsed).toHaveLength(2)
    expect(parsed[0]).toMatchObject({
      fundTicker: 'SOXX',
      sourceDate: '2026-06-22',
      holdingTicker: 'MU',
      sector: 'Information Technology',
      assetClass: 'Equity',
      weightSource: 'source-provided',
    })
    expect(parsed[0].marketValue).toBeCloseTo(4061466408.8)
    expect(parsed[1].holdingName).toBe('USD CASH')
    expect(parsed[1].holdingTicker).toBeUndefined()
  })

  it('drops malformed rows and refuses to fabricate source dates or weights', () => {
    expect(parseEtfHoldingRows(SSGA_ROWS.filter((row) => row[0] !== 'Holdings:'), SSGA_SOURCE, { retrievedAt: NOW })).toEqual([])
    expect(parseEtfHoldingRows([
      ['Fund Name:', 'State Street® Technology Select Sector SPDR® ETF'],
      ['Ticker Symbol:', 'XLK'],
      ['Holdings:', 'As of 22-Jun-2026'],
      ['Name', 'Ticker', 'Identifier', 'SEDOL', 'Sector', 'Shares Held'],
      ['NVIDIA CORP', 'NVDA', '67066G104', '2379504', '-', '1'],
    ], SSGA_SOURCE, { retrievedAt: NOW })).toEqual([])
  })

  it('normalizes holdings into source-trailed basket events without trading claims', () => {
    const event = events()[0]
    expect(event.sourceId).toBe(ETF_HOLDINGS_SOURCE_ID)
    expect(event.category).toBe('etf-holding')
    expect(event.provenance).toBe('public-disclosure')
    expect(event.affectedAssets).toEqual(['XLK', 'NVDA'])
    expect(event.affectedSectors).toEqual([])
    expect(event.summary).toContain('source-provided weight')
    expect(event.summary).toContain('Holdings snapshot only')
    const corpus = `${event.title} ${event.summary}`.toLowerCase()
    for (const banned of ['buy', 'sell', 'bullish', 'bearish', 'momentum', 'price target', 'should', 'top pick', 'most exposed']) {
      expect(corpus, banned).not.toContain(banned)
    }
  })

  it('classifies ETF holdings and calculates change status by stable holding identity', () => {
    const event = events()[0]
    expect(classifyChangeType(event)).toBe('etf-holding')
    expect(applyEtfHoldingChangeStatus(event).etfHolding?.changeType).toBe('first_seen')
    expect(applyEtfHoldingChangeStatus(event, event).etfHolding?.changeType).toBe('unchanged')
    const changed = {
      ...event,
      etfHolding: { ...event.etfHolding!, weight: 16, rawPayloadHash: 'different' },
    } as WorldIntelEvent
    expect(applyEtfHoldingChangeStatus(changed, event).etfHolding?.changeType).toBe('updated')
  })

  it('round-trips typed ETF holding sub-records through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-etf-holdings-'))
    dirs.push(dir)
    const persistence = createPersistence(dir)
    const event = events()[0]
    persistence.saveWorldIntelEvent(event)
    persistence.close()

    const restored = createPersistence(dir)
    const rehydrated = restored.listWorldIntelEvents().find((candidate) => candidate.etfHolding?.fundTicker === 'XLK')
    expect(rehydrated?.etfHolding?.holdingTicker).toBe('NVDA')
    expect(rehydrated?.etfHolding?.weightSource).toBe('source-provided')
    restored.close()
  })

  it('links ETF, issuer, holding company, ticker, CUSIP, and source in the evidence graph', () => {
    const graph = buildEntityGraph([events()[0]], { now: NOW })
    const etf = graph.nodes.find((node) => node.kind === 'etf' && node.label.includes('XLK'))!
    expect(etf).toBeDefined()
    const rels = neighborsOf(graph, etf.id).map((n) => `${n.relation}:${n.entity.kind}:${n.entity.label}`)
    expect(rels).toContain('issued_by:institution:State Street / SPDR')
    expect(rels).toContain('holds:company:NVIDIA CORP')

    const company = graph.nodes.find((node) => node.kind === 'company' && node.label === 'NVIDIA CORP')!
    const dossier = renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: company.id }))
    expect(dossier).toContain('Basket Exposure')
    expect(dossier).toContain('Issuer-published ETF holdings snapshot')
    expect(dossier).toContain('as of 2026-06-22')
  })

  it('keeps cash/unresolved holdings out of issuer-company exposure', () => {
    const cashEvent = normalizeEtfHoldings(records()).find((event) => event.etfHolding?.holdingName.includes('MONEY MARKET'))!
    expect(cashEvent.etfHolding?.holdingTicker).toBeUndefined()
    expect(cashEvent.affectedAssets).toEqual(['XLK'])
    const graph = buildEntityGraph([cashEvent], { now: NOW })
    expect(graph.nodes.some((node) => node.kind === 'company' && /MONEY MARKET/i.test(node.label))).toBe(false)
  })

  it('resolves exact ticker basket events through the existing resolver but leaves unknown holdings unresolved', () => {
    const event = events()[0]
    expect(isEventResolvable(event)).toBe(true)
    expect(eventStructuralExposure(event).some((item) => item.resolution.canonicalSeedEntityId === 'company:nvidia')).toBe(true)
    const cashEvent = normalizeEtfHoldings(records()).find((candidate) => candidate.etfHolding?.holdingTicker === undefined)!
    expect(eventStructuralExposure(cashEvent).some((item) => /money market/i.test(item.resolution.label ?? ''))).toBe(false)
  })

  it('renders source trail cards with stale/unavailable states and proof-gates incomplete rows', () => {
    const markup = renderToStaticMarkup(createElement(EtfHoldingsSourceTrail, { events: events(), now: NOW }))
    expect(markup).toContain('ETF Holdings · Basket Exposure')
    expect(markup).toContain('XLK')
    expect(markup).toContain('NVIDIA CORP')
    expect(markup).toContain('as of 2026-06-22')
    expect(markup).toContain('data-freshness="fresh"')
    expect(markup).toContain('stale after 2026-06-29T00:00:00.000Z')
    expect(markup).toContain('retrievedAt 2026-06-23T12:00:00.000Z')
    expect(markup).toContain('CUSIP: 67066G104')
    expect(markup).toContain('SEDOL: 2379504')
    expect(markup).toContain('15.147%')
    expect(markup).toContain('90,784,367')
    expect(markup).toContain(events()[0].rawPayloadHash.slice(0, 10))
    expect(markup).toContain('issuer holdings file')

    const iSharesMarkup = renderToStaticMarkup(createElement(EtfHoldingsSourceTrail, { events: iSharesEvents(), now: NOW }))
    expect(iSharesMarkup).toContain('SOXX')
    expect(iSharesMarkup).toContain('MICRON TECHNOLOGY INC')
    expect(iSharesMarkup).toContain('$4.06B USD')

    // now is 8 days out, past the snapshot's staleAt → canonical label is "expired".
    const staleMarkup = renderToStaticMarkup(createElement(EtfHoldingsSourceTrail, { events: events(), now: NOW + 8 * 24 * 60 * 60 * 1000 }))
    expect(staleMarkup).toContain('data-freshness="expired"')

    const broken = [{ ...events()[0], etfHolding: { ...events()[0].etfHolding!, sourceUrl: 'https://example.com/bad.xlsx' } }] as WorldIntelEvent[]
    expect(selectRenderableEtfHoldings(broken, 10, NOW)).toHaveLength(0)
    expect(renderToStaticMarkup(createElement(EtfHoldingsSourceTrail, { events: [], now: NOW }))).toContain(
      'DATA_UNAVAILABLE',
    )
  })

  it('fails closed on HTTP 429 and does not return replacement holdings', async () => {
    const config: EtfHoldingsConfig = {
      funds: [SSGA_SOURCE],
      timeoutMs: 1000,
      maxRetries: 0,
      backoffMs: 0,
      maxHoldingsPerFund: 10,
    }
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '7' : null) },
      arrayBuffer: async () => new ArrayBuffer(0),
    }))
    await expect(fetchEtfHoldings(new AbortController().signal, config)).rejects.toMatchObject({ status: 429, retryAfterMs: 7_000 })
  })
})
