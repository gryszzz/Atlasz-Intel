import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  UN_COMTRADE_SOURCE_ID,
  applyComtradeChangeStatus,
  comtradeQueryScope,
  fetchComtradeEvents,
  normalizeComtradeRecords,
  parseComtradeData,
  readComtradeConfig,
  resetComtradeCheckpoints,
} from '../electron/osint/adapters/comtradeAdapter'
import { createPersistence } from '../electron/persistence'
import { ComtradeSourceTrail } from '../src/components/intel/ComtradeSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import type { ComtradeConfig } from '../electron/osint/adapters/comtradeAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=842&period=2024&partnerCode=0&flowCode=M&cmdCode=854231'

// Real Comtrade data-API shape: reporter/partner codes are NUMBERS.
const DATA_FIXTURE = {
  count: 2,
  data: [
    {
      typeCode: 'C', freqCode: 'A', refYear: 2024, period: '2024',
      reporterCode: 842, reporterDesc: 'USA', reporterISO: 'USA',
      flowCode: 'M', flowDesc: 'Import',
      partnerCode: 36, partnerDesc: 'Australia', partnerISO: 'AUS',
      classificationCode: 'HS', cmdCode: '854231', cmdDesc: 'Electronic integrated circuits: processors and controllers',
      qtyUnitAbbr: 'N/A', qty: 0, netWgt: 1234, primaryValue: 5_000_000,
    },
    {
      // Malformed: missing primaryValue -> dropped, not repaired.
      reporterCode: 842, partnerCode: 36, cmdCode: '999999', flowCode: 'M', period: '2024', refYear: 2024,
    },
  ],
}

const CONFIG: ComtradeConfig = {
  apiBase: 'https://comtradeapi.un.org/data/v1/get',
  apiKey: 'SECRET-COMTRADE-KEY',
  typeCode: 'C', freqCode: 'A', classification: 'HS',
  reporterCode: '842', partnerCode: '0', flowCode: 'M', period: '2024',
  batchSize: 50, maxRequestsPerRun: 5,
  timeoutMs: 1_000, maxRetries: 0, backoffMs: 0,
}

const CATALOG_FIXTURE = {
  classCode: 'HS',
  results: [
    { id: 'TOTAL', text: 'Total', isLeaf: '0', aggrLevel: 0 },
    { id: '854231', text: '854231 - Electronic integrated circuits', isLeaf: '1', aggrLevel: 6 },
  ],
}

const dirs: string[] = []
beforeEach(() => resetComtradeCheckpoints())
afterEach(() => {
  vi.unstubAllGlobals()
  resetComtradeCheckpoints()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function records() {
  return parseComtradeData(DATA_FIXTURE, { config: CONFIG, retrievedAt: NOW, sourceApiUrl: API_URL })
}

describe('UN Comtrade adapter', () => {
  it('is key-gated and fails closed without a subscription key', () => {
    expect(readComtradeConfig({})).toBeNull()
    expect(readComtradeConfig({ ATLASZ_UN_COMTRADE_API_KEY: 'k', ATLASZ_UN_COMTRADE_DISABLE: '1' })).toBeNull()
    expect(readComtradeConfig({ ATLASZ_UN_COMTRADE_API_KEY: 'k' })).not.toBeNull()
  })

  it('normalizes official trade flows with proof fields and drops malformed rows', () => {
    const parsed = records()
    expect(parsed).toHaveLength(1) // malformed dropped
    const events = normalizeComtradeRecords(parsed)
    const event = events[0]
    expect(event.sourceId).toBe(UN_COMTRADE_SOURCE_ID)
    expect(event.provenance).toBe('official-api')
    expect(event.category).toBe('trade-flow')
    expect(event.confidence).toBe(96)
    expect(event.comtradeRecord?.commodityCode).toBe('854231')
    expect(event.comtradeRecord?.reporterCode).toBe('842') // numeric coerced to string
    expect(event.comtradeRecord?.tradeValue).toBe(5_000_000)
    expect(event.comtradeRecord?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(event.countryCodes).toEqual(expect.arrayContaining(['USA', 'AUS']))
  })

  it('makes no company-level claim and never resolves into curated exposure', () => {
    const event = normalizeComtradeRecords(records())[0]
    expect(event.affectedAssets).toEqual([])
    expect(event.affectedSectors).toEqual([])
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })

  it('classifies local change status by stable trade-record identity + hash', () => {
    const event = normalizeComtradeRecords(records())[0]
    const firstSeen = applyComtradeChangeStatus(event)
    expect(firstSeen.comtradeRecord?.changeType).toBe('first_seen')
    expect(applyComtradeChangeStatus(event, firstSeen).comtradeRecord?.changeType).toBe('unchanged')
    const previous = { ...firstSeen, comtradeRecord: { ...firstSeen.comtradeRecord!, rawPayloadHash: 'b'.repeat(64) } }
    expect(applyComtradeChangeStatus(event, previous).comtradeRecord?.changeType).toBe('updated')
  })

  it('links trade record -> reporter/partner countries, commodity, and UN Comtrade source', () => {
    const event = normalizeComtradeRecords(records())[0]
    const graph = buildEntityGraph([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })
    const tradeFlow = graph.nodes.find((node) => node.kind === 'trade-flow')!
    const rels = neighborsOf(graph, tradeFlow.id).map((n) => `${n.relation}:${n.entity.kind}:${n.entity.label}`)
    expect(rels).toContain('touches:country:USA')
    expect(rels).toContain('touches:country:Australia')
    expect(rels.some((r) => r.startsWith('references:commodity:'))).toBe(true)
    expect(rels).toContain('reported_by:source:UN Comtrade')
  })

  it('round-trips the trade-flow sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-comtrade-'))
    dirs.push(dir)
    const event = normalizeComtradeRecords(records())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((c) => c.comtradeRecord)
    expect(restored?.comtradeRecord?.commodityCode).toBe('854231')
    expect(restored?.comtradeRecord?.rawPayloadHash).toBe(event.comtradeRecord?.rawPayloadHash)
  })

  it('renders the source trail with proof fields, query scope, and no company claim', () => {
    const event = normalizeComtradeRecords(records())[0]
    const markup = renderToStaticMarkup(createElement(ComtradeSourceTrail, { events: [event as WorldIntelEvent], now: NOW }))
    expect(markup).toContain('UN Comtrade')
    expect(markup).toContain('854231')
    expect(markup).toContain('not company-level supply-chain proof')
    expect(markup).toContain('API query (key-free)')
    expect(markup).toContain('Commodities') // coverage strip
    expect(markup).not.toContain('SECRET-COMTRADE-KEY')
  })

  it('computes a bounded query scope from the catalog', () => {
    const scope = comtradeQueryScope(CONFIG, Array.from({ length: 230 }, (_, i) => String(i)))
    expect(scope.totalCommodities).toBe(230)
    expect(scope.totalBatches).toBe(Math.ceil(230 / 50))
    expect(scope.maxRequestsPerRun).toBe(5)
  })

  it('uses the catalog for all commodities and sends the key only in the header (not the URL/payload)', async () => {
    let dataUrl = ''
    let dataAuthHeader = ''
    vi.stubGlobal('fetch', async (url: string, init?: { headers?: Record<string, string> }) => {
      if (url.includes('/files/v1/app/reference/')) {
        return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(CATALOG_FIXTURE), json: async () => CATALOG_FIXTURE }
      }
      dataUrl = url
      dataAuthHeader = init?.headers?.['Ocp-Apim-Subscription-Key'] ?? ''
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => DATA_FIXTURE }
    })

    const events = await fetchComtradeEvents(new AbortController().signal, CONFIG)
    expect(events.length).toBeGreaterThan(0)
    expect(dataAuthHeader).toBe('SECRET-COMTRADE-KEY') // key in header
    expect(dataUrl).not.toContain('SECRET-COMTRADE-KEY') // never in URL
    expect(dataUrl).toContain('cmdCode=854231') // commodity came from the catalog
    expect(events[0].comtradeRecord?.sourceApiUrl).not.toContain('SECRET-COMTRADE-KEY')
    expect(events[0].comtradeRecord?.rawPayloadJson ?? '').not.toContain('SECRET-COMTRADE-KEY')
  })

  it('fails closed on quota / rate limit (HTTP 429)', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/files/v1/app/reference/')) {
        return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(CATALOG_FIXTURE) }
      }
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '10' : null) }, json: async () => ({}) }
    })
    await expect(fetchComtradeEvents(new AbortController().signal, CONFIG)).rejects.toMatchObject({ status: 429, retryAfterMs: 10_000 })
  })
})
