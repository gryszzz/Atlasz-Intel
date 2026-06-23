/*
 * UN Comtrade stabilization guards.
 *
 * Locks in: bounded/non-duplicating planning, key redaction through persistence,
 * no exposure-dashboard contamination, honest labeling, catalog staleness, and the
 * source-trail proof gate.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { normalizeComtradeRecords, parseComtradeData } from '../electron/osint/adapters/comtradeAdapter'
import { buildQueryPlan, nextRunWindow, type ComtradeQueryFilter } from '../electron/osint/adapters/comtradePlanner'
import { isCatalogStale, parseReporters } from '../electron/osint/adapters/comtradeCatalog'
import { createPersistence } from '../electron/persistence'
import { selectRenderableComtradeRecords } from '../src/components/intel/comtradeTrailSelect'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import { summarizeExposure } from '../src/engine/runtimeAudit'
import { eventStructuralExposure } from '../src/engine/entityResolver'
import type { Severity } from '../src/data/intel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')

function tradeRow(over: Record<string, unknown> = {}) {
  return {
    typeCode: 'C', freqCode: 'A', refYear: 2024, period: '2024',
    reporterCode: 842, reporterDesc: 'USA', reporterISO: 'USA',
    flowCode: 'M', flowDesc: 'Import',
    partnerCode: 36, partnerDesc: 'Australia', partnerISO: 'AUS',
    classificationCode: 'HS', cmdCode: '854231', cmdDesc: 'Integrated circuits',
    qtyUnitAbbr: 'kg', qty: 10, netWgt: 1234, primaryValue: 5_000_000,
    ...over,
  }
}

function comtradeEvent(over: Record<string, unknown> = {}): WorldIntelEvent {
  return normalizeComtradeRecords(
    parseComtradeData({ data: [tradeRow(over)] }, { config: { classification: 'HS', typeCode: 'C', freqCode: 'A' }, retrievedAt: NOW, sourceApiUrl: 'https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=842', catalogHash: 'a'.repeat(64) }),
  )[0]
}

let seq = 0
function officialEvent(partial: Partial<WorldIntelEvent> & { sourceId: string }): WorldIntelEvent {
  seq += 1
  return {
    id: partial.id ?? `off-${seq}`, timestamp: partial.timestamp ?? NOW - 30 * 60_000,
    title: partial.title ?? 'Official', summary: '', countryCodes: [], region: 'global',
    category: partial.category ?? 'other', severity: (partial.severity ?? 'watch') as Severity,
    confidence: 96, sourceId: partial.sourceId, sourceUrl: 'https://example.gov',
    provenance: partial.provenance ?? 'official-api', affectedAssets: partial.affectedAssets ?? [],
    affectedSectors: [], affectedCommodities: [], affectedCurrencies: [], extractedEntities: [],
    narrativeTags: [], rawPayloadHash: `h-${seq}`, dedupeHash: `d-${seq}`, secFiling: partial.secFiling,
  } as WorldIntelEvent
}

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const codes = Array.from({ length: 230 }, (_, i) => String(100000 + i))
function filter(): ComtradeQueryFilter {
  return { typeCode: 'C', freqCode: 'A', classification: 'HS', reporterCode: '842', partnerCode: '0', flowCode: 'M,X', period: '2024', commodityCodes: codes }
}

describe('UN Comtrade stabilization', () => {
  it('checkpoint/resume covers every batch exactly once — no skips, no duplicates', () => {
    const plan = buildQueryPlan(filter(), { batchSize: 50, maxRequestsPerRun: 2 })
    const collected: number[] = []
    let checkpoint = null as Parameters<typeof nextRunWindow>[1]
    let guard = 0
    for (;;) {
      const window = nextRunWindow(plan, checkpoint, NOW)
      collected.push(...window.batches.map((b) => b.index))
      checkpoint = window.nextCheckpoint
      if (window.done || (guard += 1) > 20) break
    }
    expect(collected).toEqual([0, 1, 2, 3, 4]) // exact, ordered, no dup/skip
    expect(new Set(collected).size).toBe(plan.totalBatches)
  })

  it('planner boundary cases: empty, exact multiple, and one-over batch size', () => {
    expect(buildQueryPlan({ ...filter(), commodityCodes: [] }).totalBatches).toBe(0)
    expect(buildQueryPlan({ ...filter(), commodityCodes: codes.slice(0, 100) }, { batchSize: 50 }).totalBatches).toBe(2)
    expect(buildQueryPlan({ ...filter(), commodityCodes: codes.slice(0, 101) }, { batchSize: 50 }).totalBatches).toBe(3)
  })

  it('a resumed checkpoint at/over the end yields no batches and stays done', () => {
    const plan = buildQueryPlan(filter(), { batchSize: 50, maxRequestsPerRun: 2 })
    let window = nextRunWindow(plan, null)
    while (!window.done) window = nextRunWindow(plan, window.nextCheckpoint)
    // window is the final (done) run; running again from its checkpoint yields nothing.
    const past = nextRunWindow(plan, window.nextCheckpoint)
    expect(past.batches).toEqual([])
    expect(past.done).toBe(true)
  })

  it('subscription key never survives into persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-comtrade-stab-'))
    dirs.push(dir)
    const event = comtradeEvent()
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents()
    expect(JSON.stringify(restored)).not.toMatch(/subscription-key|Ocp-Apim/i)
  })

  it('does not contaminate the exposure dashboard (no resolved/rank/media contribution)', () => {
    const official = officialEvent({ id: 'sec', sourceId: 'sec_edgar_public', affectedAssets: ['NVDA'], provenance: 'public-disclosure' })
    const without = summarizeExposure({ events: [official], now: NOW })
    const withComtrade = summarizeExposure({ events: [official, comtradeEvent()], now: NOW })
    expect(withComtrade.resolvedEventCount).toBe(without.resolvedEventCount)
    expect(withComtrade.topCompanies).toEqual(without.topCompanies)
    expect(withComtrade.mediaObservationCount).toBe(0) // comtrade is official-api, not media
    expect(eventStructuralExposure(comtradeEvent())).toEqual([])
  })

  // Annual trade data is timestamped at the period start, so a wide window is used
  // to include it (in production the change-tracking signal, not recency, surfaces it).
  const WIDE_WINDOW = 1200 * 24 * 60 * 60 * 1000

  it('labels Comtrade as a trade flow in What Changed Today, never company exposure', () => {
    const result = assessWhatChangedToday([comtradeEvent()], { now: NOW, windowMs: WIDE_WINDOW })
    expect(result.items[0]?.changeType).toBe('trade-flow')
  })

  it('does not outrank an urgent official alert (fixed-low severity)', () => {
    const comtrade = comtradeEvent()
    expect(comtrade.severity).toBe('stable')
    const alert = officialEvent({ id: 'noaa', sourceId: 'noaa_alerts_public', severity: 'critical', title: 'Critical alert' })
    const result = assessWhatChangedToday([comtrade, alert], { now: NOW, windowMs: WIDE_WINDOW })
    const alertIdx = result.items.findIndex((i) => i.sourceIds.includes('noaa_alerts_public'))
    const comtradeIdx = result.items.findIndex((i) => i.sourceIds.includes('un_comtrade_public'))
    expect(alertIdx).toBeLessThan(comtradeIdx)
  })

  it('numeric reporter/partner codes parse to strings (regression)', () => {
    const records = parseComtradeData({ data: [tradeRow()] }, { config: { classification: 'HS' }, retrievedAt: NOW, sourceApiUrl: 'https://comtradeapi.un.org/data/v1/get/C/A/HS?x=1' })
    expect(records[0].reporterCode).toBe('842')
    expect(records[0].partnerCode).toBe('36')
    expect(records[0].catalogHash).toBeUndefined() // not provided here
  })

  it('source-trail proof gate rejects key-leaking or low-confidence records', () => {
    const good = comtradeEvent()
    expect(selectRenderableComtradeRecords([good])).toHaveLength(1)
    const leaked = { ...good, comtradeRecord: { ...good.comtradeRecord!, sourceApiUrl: 'https://comtradeapi.un.org/data/v1/get/C/A/HS?subscription-key=SECRET' } }
    expect(selectRenderableComtradeRecords([leaked])).toHaveLength(0)
    const lowConf = { ...good, comtradeRecord: { ...good.comtradeRecord!, confidence: 60 } }
    expect(selectRenderableComtradeRecords([lowConf])).toHaveLength(0)
  })

  it('flags a stale catalog snapshot once it is old enough', () => {
    const fresh = parseReporters({ results: [{ reporterCode: 842, reporterDesc: 'USA' }] }, { retrievedAt: NOW })
    expect(isCatalogStale(fresh, NOW)).toBe(false)
    expect(isCatalogStale(fresh, NOW + 40 * 24 * 60 * 60 * 1000)).toBe(true)
  })
})
