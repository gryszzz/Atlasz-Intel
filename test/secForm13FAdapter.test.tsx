import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SEC_FORM13F_SOURCE_ID,
  applyForm13FChangeStatus,
  fetchSecForm13F,
  normalizeForm13F,
  parseForm13F,
  readForm13FConfig,
} from '../electron/osint/adapters/secForm13FAdapter'
import { createPersistence } from '../electron/persistence'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { Form13FSourceTrail } from '../src/components/intel/Form13FSourceTrail'
import { selectRenderableForm13F } from '../src/components/intel/form13FTrailSelect'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import { classifyChangeType } from '../src/engine/materialityEngine'
import type { Form13FConfig } from '../electron/osint/adapters/secForm13FAdapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const UA = 'Atlasz Intel research (you@example.com)'
const NOW = Date.parse('2026-06-23T12:00:00Z')
const FILING_URL = 'https://www.sec.gov/Archives/edgar/data/1067983/000095012325002701/0000950123-25-002701-index.html'
const XML_URL = 'https://www.sec.gov/Archives/edgar/data/1067983/000095012325002701/39042.xml'

const FORM13F_XML = `<?xml version="1.0"?>
<informationTable xmlns="http://www.sec.gov/edgar/document/thirteenf/informationtable">
  <infoTable>
    <nameOfIssuer>APPLE INC</nameOfIssuer>
    <titleOfClass>COM</titleOfClass>
    <cusip>037833100</cusip>
    <value>458035497</value>
    <shrsOrPrnAmt><sshPrnamt>3000000</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>
    <investmentDiscretion>DFND</investmentDiscretion>
    <votingAuthority><Sole>3000000</Sole><Shared>0</Shared><None>0</None></votingAuthority>
  </infoTable>
  <infoTable>
    <nameOfIssuer>NVIDIA CORP</nameOfIssuer>
    <titleOfClass>COM</titleOfClass>
    <cusip>67066G104</cusip>
    <value>120000000</value>
    <shrsOrPrnAmt><sshPrnamt>750000</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>
    <putCall>Put</putCall>
    <investmentDiscretion>SOLE</investmentDiscretion>
    <votingAuthority><Sole>700000</Sole><Shared>1000</Shared><None>49000</None></votingAuthority>
  </infoTable>
  <infoTable>
    <nameOfIssuer>BROKEN ROW INC</nameOfIssuer>
    <titleOfClass>COM</titleOfClass>
    <value>1</value>
  </infoTable>
</informationTable>`

const BASE_CONFIG: Form13FConfig = {
  submissionsBase: 'https://data.sec.gov/submissions',
  archivesBase: 'https://www.sec.gov/Archives/edgar/data',
  userAgent: UA,
  managerCiks: ['1067983'],
  perManagerFilings: 2,
  maxHoldingsPerFiling: 5,
  timeoutMs: 1000,
  maxRetries: 0,
  backoffMs: 0,
}

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function holdings(filingType = '13F-HR') {
  return parseForm13F(FORM13F_XML, {
    filer: { cik: '1067983', cikPadded: '0001067983', name: 'Berkshire Hathaway Inc' },
    accessionNumber: '0000950123-25-002701',
    filingType,
    reportPeriod: '2024-12-31',
    filingDate: '2025-02-14',
    sourceFilingUrl: FILING_URL,
    sourceInfoTableUrl: XML_URL,
    retrievedAt: NOW,
  })
}

function events(filingType = '13F-HR'): WorldIntelEvent[] {
  return normalizeForm13F(holdings(filingType))
}

describe('SEC Form 13F adapter', () => {
  it('requires a descriptive User-Agent and official SEC hosts; fails closed otherwise', () => {
    expect(readForm13FConfig({})).toBeNull()
    expect(readForm13FConfig({ ATLASZ_SEC_USER_AGENT: 'nope' })).toBeNull()
    expect(readForm13FConfig({ ATLASZ_SEC_USER_AGENT: UA })).not.toBeNull()
    expect(readForm13FConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_13F_ARCHIVES_BASE: 'https://evil.example.com/x' })).toBeNull()
  })

  it('enforces the bounded manager allowlist even when env requests extra CIKs', () => {
    expect(readForm13FConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_13F_CIKS: '1067983,999999999' })?.managerCiks).toEqual(['1067983'])
    expect(readForm13FConfig({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_13F_CIKS: '999999999' })?.managerCiks).toEqual([])
  })

  it('parses multiple information-table rows and drops malformed holdings', () => {
    const parsed = holdings()
    expect(parsed).toHaveLength(2)
    const apple = parsed[0]
    expect(apple.filerName).toBe('Berkshire Hathaway Inc')
    expect(apple.filerCik).toBe('1067983')
    expect(apple.issuerName).toBe('APPLE INC')
    expect(apple.issuerTicker).toBe('AAPL')
    expect(apple.cusip).toBe('037833100')
    expect(apple.value).toBe(458035497)
    expect(apple.sharesOrPrincipal).toBe(3000000)
    expect(apple.sharesPrincipalType).toBe('SH')
    expect(apple.votingSole).toBe(3000000)
    expect(apple.sourceFilingUrl).toBe(FILING_URL)
    expect(apple.sourceInfoTableUrl).toBe(XML_URL)
    expect(apple.confidence).toBe(96)
    expect(apple.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('labels amendments honestly without presenting them as original filings', () => {
    const event = events('13F-HR/A')[0]
    expect(event.form13fHolding?.isAmendment).toBe(true)
    expect(event.summary).toContain('SEC Form 13F-HR/A (amendment)')
    const markup = renderToStaticMarkup(createElement(Form13FSourceTrail, { events: [event], now: NOW }))
    expect(markup).toContain('13F-HR/A amendment')
  })

  it('renders source trail cards and proof-gates incomplete rows', () => {
    const markup = renderToStaticMarkup(createElement(Form13FSourceTrail, { events: events(), now: NOW }))
    expect(markup).toContain('SEC Form 13F · Institutional Holdings')
    expect(markup).toContain('Berkshire Hathaway Inc')
    expect(markup).toContain('APPLE INC')
    expect(markup).toContain('Quarterly SEC-reported holding snapshot')
    expect(markup).toContain('period 2024-12-31')
    expect(markup).toContain('filed 2025-02-14')
    expect(markup).toContain('retrieved 2026-06-23')
    expect(markup).toContain('037833100')
    expect(markup).toContain('458,035,497')
    expect(markup).toContain('sole 3,000,000')
    expect(markup).toContain('information table XML')

    const broken = [{ ...events()[0], form13fHolding: { ...events()[0].form13fHolding!, sourceInfoTableUrl: '', confidence: 70 } }] as WorldIntelEvent[]
    expect(selectRenderableForm13F(broken)).toHaveLength(0)
    expect(renderToStaticMarkup(createElement(Form13FSourceTrail, { events: [], now: NOW }))).toContain('DATA_UNAVAILABLE')
  })

  it('uses no bullish/bearish/conviction wording except explicit negative disclaimers', () => {
    const markup = renderToStaticMarkup(createElement(Form13FSourceTrail, { events: events(), now: NOW }))
    const corpus = `${events().map((e) => `${e.title} ${e.summary}`).join(' ')} ${markup}`
      .toLowerCase()
      .replaceAll('not current position, conviction, or trading advice', '')
      .replaceAll('not current position, conviction, performance, or trading advice', '')
    for (const banned of ['bullish', 'bearish', 'buy signal', 'sell signal', 'fund performance', 'portfolio weight', 'outperformed', 'underperformed', 'price target', 'forecast', 'should buy', 'should sell']) {
      expect(corpus, banned).not.toContain(banned)
    }
  })

  it('drops non-13F forms and missing filer names before normalization', () => {
    expect(holdings('13F-NT')).toEqual([])
    expect(parseForm13F(FORM13F_XML, {
      filer: { cik: '1067983', cikPadded: '0001067983', name: '' },
      accessionNumber: '0000950123-25-002701',
      filingType: '13F-HR',
      reportPeriod: '2024-12-31',
      filingDate: '2025-02-14',
      sourceFilingUrl: FILING_URL,
      sourceInfoTableUrl: XML_URL,
      retrievedAt: NOW,
    })).toEqual([])
  })

  it('resolves issuer exposure only when exact CUSIP mapping provides a ticker', () => {
    const event = events()[0]
    expect(event.affectedAssets).toEqual(['AAPL'])
    expect(isEventResolvable(event)).toBe(true)
    expect(eventStructuralExposure(event)[0]?.resolution.canonicalSeedEntityId).toBe('company:apple')

    const unmapped = parseForm13F(FORM13F_XML.replace('037833100', '123456789').replace('67066G104', '987654321'), {
      filer: { cik: '1067983', cikPadded: '0001067983', name: 'Berkshire Hathaway Inc' },
      accessionNumber: '0000950123-25-002701',
      filingType: '13F-HR',
      reportPeriod: '2024-12-31',
      filingDate: '2025-02-14',
      sourceFilingUrl: FILING_URL,
      sourceInfoTableUrl: XML_URL,
      retrievedAt: NOW,
    })
    const unknownEvent = normalizeForm13F(unmapped)[0]
    expect(unknownEvent.form13fHolding?.issuerTicker).toBeUndefined()
    expect(unknownEvent.affectedAssets).toEqual([])
    expect(eventStructuralExposure(unknownEvent)).toEqual([])
  })

  it('labels it an institutional holding in What Changed Today', () => {
    expect(classifyChangeType(events()[0])).toBe('institutional-holding')
  })

  it('links holding -> institutional filer, issuer company, CUSIP, and SEC source in the evidence graph', () => {
    const graph = buildEntityGraph([events()[0]], { now: NOW })
    const eventNode = graph.nodes.find((node) => node.kind === 'event')!
    const rels = neighborsOf(graph, eventNode.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(rels).toContain('filed_by:institution')
    expect(rels).toContain('about:company')
    expect(rels).toContain('references:cusip')
    expect(rels).toContain('reported_by:source')

    const company = graph.nodes.find((node) => node.kind === 'company' && node.label === 'APPLE INC')!
    const dossier = renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: company.id }))
    expect(dossier).toContain('Institutional Holdings')
    expect(dossier).toContain('SEC Form 13F reported holding snapshot')
  })

  it('classifies local change status by stable holding identity + payload hash', () => {
    const event = events()[0]
    const seen = applyForm13FChangeStatus(event)
    expect(seen.form13fHolding?.changeType).toBe('first_seen')
    expect(applyForm13FChangeStatus(event, seen).form13fHolding?.changeType).toBe('unchanged')
    const prev = { ...seen, form13fHolding: { ...seen.form13fHolding!, rawPayloadHash: 'b'.repeat(64) } }
    expect(applyForm13FChangeStatus(event, prev).form13fHolding?.changeType).toBe('updated')
  })

  it('round-trips the form-13F sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-13f-'))
    dirs.push(dir)
    const event = events()[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.form13fHolding)
    expect(restored?.form13fHolding?.accessionNumber).toBe(event.form13fHolding?.accessionNumber)
    expect(restored?.form13fHolding?.cusip).toBe('037833100')
    expect(JSON.stringify(restored)).not.toContain('you@example.com')
    expect(JSON.stringify(restored)).not.toMatch(/street|city|address/i)
  })

  it('fetches 13F-HR and 13F-HR/A information-table XML only and fails closed on 429', async () => {
    const fetched: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/submissions/')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({
            name: 'Berkshire Hathaway Inc',
            filings: {
              recent: {
                form: ['10-Q', '13F-HR', '13F-HR/A'],
                accessionNumber: ['q-1', '0000950123-25-002701', '0000950123-25-002702'],
                filingDate: ['2025-02-01', '2025-02-14', '2025-05-15'],
                reportDate: ['2024-12-31', '2024-12-31', '2025-03-31'],
              },
            },
          }),
        }
      }
      if (url.endsWith('/index.json')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ directory: { item: [{ name: 'primary_doc.xml' }, { name: '39042.xml' }] } }),
        }
      }
      fetched.push(url)
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => FORM13F_XML }
    })
    const found = await fetchSecForm13F(new AbortController().signal, BASE_CONFIG)
    expect(found.length).toBeGreaterThan(0)
    expect(fetched.some((url) => url.includes('39042.xml'))).toBe(true)
    expect(fetched.some((url) => url.includes('primary_doc.xml'))).toBe(false)
    expect(SEC_FORM13F_SOURCE_ID).toBe('sec_form13f_public')

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '9' : null) },
      json: async () => ({}),
      text: async () => '',
    }))
    await expect(fetchSecForm13F(new AbortController().signal, BASE_CONFIG)).rejects.toMatchObject({ status: 429, retryAfterMs: 9000 })
  })
})
