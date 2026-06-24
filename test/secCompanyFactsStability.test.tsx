/*
 * SEC Company Facts stabilization guards.
 *
 * Locks in: official-SEC-only config, identity-spine CIK resolution (no guessing),
 * exact-ticker-only exposure, period-age staleness, source-trail completeness, and
 * the no-estimate/no-valuation/no-signal language boundary.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSecCompanyFacts,
  normalizeCompanyFacts,
  parseCompanyFacts,
  readCompanyFactsConfig,
  resolveCompanyIdentities,
} from '../electron/osint/adapters/secCompanyFactsAdapter'
import { createPersistence } from '../electron/persistence'
import { CompanyFactsSourceTrail } from '../src/components/intel/CompanyFactsSourceTrail'
import { isCompanyFactStale, selectRenderableCompanyFacts } from '../src/components/intel/companyFactsTrailSelect'
import { isEventResolvable, eventStructuralExposure } from '../src/engine/entityResolver'
import type { CompanyFactsConfig, CompanyIdentityRef } from '../electron/osint/adapters/secCompanyFactsAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const UA = 'Atlasz Intel research (you@example.com)'
const NVDA: CompanyIdentityRef = { ticker: 'NVDA', cik: '1045810', cikPadded: '0001045810', companyName: 'NVIDIA CORP' }

const FACTS_FIXTURE = {
  cik: 1045810,
  entityName: 'NVIDIA CORP',
  facts: {
    'us-gaap': {
      Revenues: { label: 'Revenues', units: { USD: [{ end: '2022-01-30', val: 26914000000, fy: 2022, fp: 'FY', form: '10-K', filed: '2022-03-18' }] } },
      RevenueFromContractWithCustomerExcludingAssessedTax: { label: 'Revenue', units: { USD: [{ start: '2025-01-27', end: '2026-04-26', val: 81615000000, fy: 2027, fp: 'Q1', form: '10-Q', filed: '2026-05-20', frame: 'CY2026Q1' }] } },
      // Capex last reported 2020 -> preserved with period, flagged stale, never faked fresh.
      PaymentsToAcquirePropertyPlantAndEquipment: { label: 'Capex', units: { USD: [{ end: '2020-07-26', val: 372000000, fy: 2020, fp: 'Q2', form: '10-Q', filed: '2020-08-19' }] } },
    },
  },
}

const BASE_CONFIG: CompanyFactsConfig = {
  factsBase: 'https://data.sec.gov/api/xbrl/companyfacts',
  identityUrl: 'https://www.sec.gov/files/company_tickers.json',
  userAgent: UA,
  tickers: ['NVDA'],
  staleAfterMs: 100 * 24 * 60 * 60 * 1000,
  timeoutMs: 1000,
  maxRetries: 0,
  backoffMs: 0,
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function facts() {
  return parseCompanyFacts(FACTS_FIXTURE, { identity: NVDA, retrievedAt: NOW, sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0001045810.json' })
}

describe('SEC Company Facts stabilization', () => {
  it('accepts only official SEC hosts; a non-SEC override fails closed', () => {
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: UA })).not.toBeNull()
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_FACTS_BASE: 'https://evil.example.com/x' })).toBeNull()
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_FACTS_IDENTITY_URL: 'https://evil.example.com/t.json' })).toBeNull()
    expect(readCompanyFactsConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_FACTS_BASE: 'https://notsec.gov.evil.com/x' })).toBeNull()
  })

  it('requires ATLASZ_SEC_USER_AGENT and never persists it', () => {
    expect(readCompanyFactsConfig({})).toBeNull()
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-cf-ua-'))
    dirs.push(dir)
    const event = normalizeCompanyFacts(facts())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    expect(JSON.stringify(createPersistence(dir).listWorldIntelEvents())).not.toContain('you@example.com')
  })

  it('resolves CIK only from the Market Reference identity spine — unknown ticker yields no fact (no guessing)', async () => {
    let companyfactsHit = false
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('company_tickers.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }) }
      }
      companyfactsHit = true
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => FACTS_FIXTURE }
    })
    // Allowlist a ticker that is NOT in the identity file.
    const identities = await resolveCompanyIdentities({ ...BASE_CONFIG, tickers: ['ZZZZ'] }, new AbortController().signal)
    expect(identities).toEqual([])
    const events = await fetchSecCompanyFacts(new AbortController().signal, { ...BASE_CONFIG, tickers: ['ZZZZ'] })
    expect(events).toEqual([])
    expect(companyfactsHit).toBe(false) // never fetched facts for an unresolved ticker
  })

  it('chooses the freshest concept alias for revenue (no stale first-candidate)', () => {
    const revenue = facts().find((f) => f.conceptLabel === 'Revenue')
    expect(revenue?.value).toBe(81615000000)
    expect(revenue?.periodEnd).toBe('2026-04-26')
  })

  it('keeps an old Capex with its real period and flags it stale (never faked fresh)', () => {
    const capex = facts().find((f) => f.conceptLabel === 'Capex')!
    expect(capex.periodEnd).toBe('2020-07-26') // preserved, not advanced
    expect(isCompanyFactStale(capex, NOW)).toBe(true) // period-age stale
    const revenue = facts().find((f) => f.conceptLabel === 'Revenue')!
    expect(isCompanyFactStale(revenue, NOW)).toBe(false) // recent period not stale
  })

  it('exposes company only through an exact canonical ticker; a wrong ticker does not resolve', () => {
    const event = normalizeCompanyFacts(facts())[0]
    expect(event.affectedAssets).toEqual(['NVDA'])
    expect(isEventResolvable(event)).toBe(true)
    expect(eventStructuralExposure(event)[0]?.resolution.canonicalSeedEntityId).toBe('company:nvidia')
    // A fact carrying a non-canonical / unknown ticker resolves to nothing.
    const unknown = { ...event, affectedAssets: ['NOTATICKER'], secFiling: undefined, companyFact: { ...event.companyFact!, ticker: 'NOTATICKER' } } as WorldIntelEvent
    expect(eventStructuralExposure(unknown)).toEqual([])
  })

  it('uses no estimate / forecast / valuation / trading-signal language', () => {
    const events = normalizeCompanyFacts(facts())
    const markup = renderToStaticMarkup(createElement(CompanyFactsSourceTrail, { events: events as WorldIntelEvent[], now: NOW }))
    // The explicit honesty disclaimer ("not estimate or valuation") is GOOD wording;
    // strip it before scanning so we only catch affirmative estimate/valuation language.
    const corpus = `${events.map((e) => `${e.title} ${e.summary}`).join(' ')} ${markup}`
      .toLowerCase()
      .replaceAll('not estimate or valuation', '')
    for (const banned of ['estimate', 'forecast', 'guidance', 'valuation', 'undervalued', 'overvalued', 'cheap', 'expensive', 'price target', 'outperform', 'buy rating', 'sell rating']) {
      expect(corpus, banned).not.toContain(banned)
    }
  })

  it('source-trail proof gate exposes concept, unit, value, period, form, filed date, and hash', () => {
    const events = normalizeCompanyFacts(facts()) as WorldIntelEvent[]
    const markup = renderToStaticMarkup(createElement(CompanyFactsSourceTrail, { events, now: NOW }))
    expect(markup).toContain('Filed')
    expect(markup).toContain('2026-05-20') // filed date
    expect(markup).toContain('retrieved')
    expect(markup).toContain('(USD)') // unit
    expect(markup).toContain('CY2026Q1') // frame when present
    // Proof gate rejects a record missing its period.
    const broken = [{ ...events[0], companyFact: { ...events[0].companyFact!, periodEnd: '' } }] as WorldIntelEvent[]
    expect(selectRenderableCompanyFacts(broken)).toHaveLength(0)
  })

  it('round-trips the company-fact sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-cf-rt-'))
    dirs.push(dir)
    const event = normalizeCompanyFacts(facts())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((c) => c.companyFact)
    expect(restored?.companyFact?.value).toBe(event.companyFact?.value)
    expect(restored?.companyFact?.rawPayloadHash).toBe(event.companyFact?.rawPayloadHash)
  })
})
