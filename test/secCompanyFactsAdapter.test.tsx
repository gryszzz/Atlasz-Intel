import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SEC_COMPANY_FACTS_SOURCE_ID,
  applyCompanyFactChangeStatus,
  fetchSecCompanyFacts,
  normalizeCompanyFacts,
  parseCompanyFacts,
  readCompanyFactsConfig,
} from '../electron/osint/adapters/secCompanyFactsAdapter'
import { createPersistence } from '../electron/persistence'
import { CompanyFactsSourceTrail } from '../src/components/intel/CompanyFactsSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { isEventResolvable, eventStructuralExposure } from '../src/engine/entityResolver'
import { classifyChangeType } from '../src/engine/materialityEngine'
import type { CompanyIdentityRef } from '../electron/osint/adapters/secCompanyFactsAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NVDA: CompanyIdentityRef = { ticker: 'NVDA', cik: '1045810', cikPadded: '0001045810', companyName: 'NVIDIA CORP' }

// Real companyfacts shape: facts.{taxonomy}.{concept}.units.{unit} = [{start,end,val,accn,fy,fp,form,filed,frame}].
const FACTS_FIXTURE = {
  cik: 1045810,
  entityName: 'NVIDIA CORP',
  facts: {
    'us-gaap': {
      // Revenues is STALE (2022); contract revenue is FRESH (2026). Fresh must win.
      Revenues: { label: 'Revenues', units: { USD: [{ end: '2022-01-30', val: 26914000000, accn: 'a1', fy: 2022, fp: 'FY', form: '10-K', filed: '2022-03-18' }] } },
      RevenueFromContractWithCustomerExcludingAssessedTax: {
        label: 'Revenue from contract with customer',
        units: { USD: [
          { start: '2025-01-27', end: '2026-04-26', val: 81615000000, accn: 'a2', fy: 2027, fp: 'Q1', form: '10-Q', filed: '2026-05-20', frame: 'CY2026Q1' },
          { start: '2024-01-29', end: '2024-04-28', val: 26044000000, accn: 'a0', fy: 2025, fp: 'Q1', form: '10-Q', filed: '2024-05-22' },
        ] },
      },
      NetIncomeLoss: { label: 'Net income', units: { USD: [{ end: '2026-04-26', val: 58321000000, accn: 'a2', fy: 2027, fp: 'Q1', form: '10-Q', filed: '2026-05-20' }] } },
      Assets: { label: 'Assets', units: { USD: [{ end: '2026-04-26', val: 259474000000, accn: 'a2', fy: 2027, fp: 'Q1', form: '10-Q', filed: '2026-05-20' }] } },
      // Malformed: non-numeric val -> dropped, not repaired.
      Liabilities: { label: 'Liabilities', units: { USD: [{ end: '2026-04-26', val: 'not-a-number', accn: 'a2', form: '10-Q', filed: '2026-05-20' }] } },
    },
    dei: {
      EntityCommonStockSharesOutstanding: { label: 'Shares', units: { shares: [{ end: '2026-05-15', val: 24200000000, accn: 'a2', fy: 2027, fp: 'Q1', form: '10-Q', filed: '2026-05-20' }] } },
    },
  },
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function facts() {
  return parseCompanyFacts(FACTS_FIXTURE, { identity: NVDA, retrievedAt: Date.parse('2026-06-23T12:00:00Z'), sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0001045810.json' })
}

describe('SEC Company Facts adapter', () => {
  it('requires a descriptive User-Agent and fails closed without it', () => {
    expect(readCompanyFactsConfig({})).toBeNull()
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: 'nope' })).toBeNull() // no @ or url
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: 'Atlasz (you@example.com)' })).not.toBeNull()
  })

  it('parses reported facts with proof fields and picks the freshest concept candidate', () => {
    const parsed = facts()
    const revenue = parsed.find((f) => f.conceptLabel === 'Revenue')
    expect(revenue?.value).toBe(81615000000) // fresh contract-revenue beats stale Revenues
    expect(revenue?.periodEnd).toBe('2026-04-26')
    expect(revenue?.concept).toBe('RevenueFromContractWithCustomerExcludingAssessedTax')
    expect(revenue?.provenance).toBe('public-disclosure')
    expect(revenue?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(parsed.find((f) => f.conceptLabel === 'Shares outstanding')?.unit).toBe('shares')
  })

  it('drops malformed facts (non-numeric value) and never repairs', () => {
    expect(facts().find((f) => f.conceptLabel === 'Liabilities')).toBeUndefined()
    expect(parseCompanyFacts({}, { identity: NVDA })).toEqual([])
    expect(parseCompanyFacts({ facts: {} }, { identity: NVDA })).toEqual([])
  })

  it('CIK padding flows into the fact identity and URL', () => {
    const event = normalizeCompanyFacts(facts())[0]
    expect(event.companyFact?.cikPadded).toBe('0001045810')
    expect(event.companyFact?.id).toContain('0001045810')
  })

  it('carries the canonical ticker for resolver exposure but asserts no valuation/trading signal', () => {
    const event = normalizeCompanyFacts(facts())[0]
    expect(event.affectedAssets).toEqual(['NVDA'])
    expect(event.severity).toBe('stable') // never a signal
    expect(event.summary).toMatch(/not estimate or valuation/i)
    expect(event.category).toBe('company-fact')
    // The ticker resolves to the curated company (this IS the intended market layer).
    expect(isEventResolvable(event)).toBe(true)
    expect(eventStructuralExposure(event).length).toBeGreaterThan(0)
  })

  it('labels it a reported fundamental in What Changed Today', () => {
    expect(classifyChangeType(normalizeCompanyFacts(facts())[0])).toBe('company-fact')
  })

  it('links fact -> company identity, financial concept, and SEC source in the graph', () => {
    const event = normalizeCompanyFacts(facts())[0]
    const graph = buildEntityGraph([{ ...event, timestamp: Date.parse('2026-06-23T11:00:00Z') }], { now: Date.parse('2026-06-23T12:00:00Z') })
    const eventNode = graph.nodes.find((n) => n.kind === 'event')!
    const rels = neighborsOf(graph, eventNode.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(rels).toContain('about:company')
    expect(rels).toContain('references:financial-concept')
    expect(rels).toContain('reported_by:source')
  })

  it('classifies local change status by stable fact identity + hash', () => {
    const event = normalizeCompanyFacts(facts())[0]
    expect(applyCompanyFactChangeStatus(event).companyFact?.changeType).toBe('first_seen')
    const seen = applyCompanyFactChangeStatus(event)
    expect(applyCompanyFactChangeStatus(event, seen).companyFact?.changeType).toBe('unchanged')
    const prev = { ...seen, companyFact: { ...seen.companyFact!, rawPayloadHash: 'b'.repeat(64) } }
    expect(applyCompanyFactChangeStatus(event, prev).companyFact?.changeType).toBe('updated')
  })

  it('round-trips the company-fact sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-cf-'))
    dirs.push(dir)
    const event = normalizeCompanyFacts(facts())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((c) => c.companyFact)
    expect(restored?.companyFact?.concept).toBe(event.companyFact?.concept)
    expect(restored?.companyFact?.rawPayloadHash).toBe(event.companyFact?.rawPayloadHash)
  })

  it('renders the Reported Facts trail with proof fields and the historical-fact disclaimer', () => {
    const events = normalizeCompanyFacts(facts()) as WorldIntelEvent[]
    const markup = renderToStaticMarkup(createElement(CompanyFactsSourceTrail, { events, now: Date.parse('2026-06-23T12:00:00Z') }))
    expect(markup).toContain('NVDA')
    expect(markup).toContain('CIK 0001045810')
    expect(markup).toContain('Historical SEC-reported fact, not estimate or valuation')
    expect(markup).toContain('companyfacts')
    expect(markup).not.toContain('prov-tier-verified')
  })

  it('fails closed on quota / rate limit (HTTP 429) for a configured fetch', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('company_tickers.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }) }
      }
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '7' : null) }, json: async () => ({}) }
    })
    await expect(
      fetchSecCompanyFacts(new AbortController().signal, {
        factsBase: 'https://data.sec.gov/api/xbrl/companyfacts',
        identityUrl: 'https://www.sec.gov/files/company_tickers.json',
        userAgent: 'Atlasz (you@example.com)',
        tickers: ['NVDA'],
        staleAfterMs: 1000,
        timeoutMs: 1000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 7000 })
  })

  it('resolves CIK from the identity spine and sends the descriptive User-Agent', async () => {
    let factsUserAgent = ''
    vi.stubGlobal('fetch', async (url: string, init?: { headers?: Record<string, string> }) => {
      if (url.includes('company_tickers.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }) }
      }
      factsUserAgent = init?.headers?.['user-agent'] ?? ''
      expect(url).toContain('CIK0001045810.json') // padded CIK from identity spine
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FACTS_FIXTURE }
    })
    const events = await fetchSecCompanyFacts(new AbortController().signal, {
      factsBase: 'https://data.sec.gov/api/xbrl/companyfacts',
      identityUrl: 'https://www.sec.gov/files/company_tickers.json',
      userAgent: 'Atlasz Intel (you@example.com)',
      tickers: ['NVDA'],
      staleAfterMs: 1000,
      timeoutMs: 1000,
      maxRetries: 0,
      backoffMs: 0,
    })
    expect(factsUserAgent).toBe('Atlasz Intel (you@example.com)')
    expect(events.every((e) => e.sourceId === SEC_COMPANY_FACTS_SOURCE_ID)).toBe(true)
    expect(events.length).toBeGreaterThan(0)
  })
})
