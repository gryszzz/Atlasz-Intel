import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SEC_FORM4_SOURCE_ID,
  applyForm4ChangeStatus,
  fetchSecForm4,
  normalizeForm4,
  parseForm4,
  readForm4Config,
  resolveForm4Issuers,
} from '../electron/osint/adapters/secForm4Adapter'
import { createPersistence } from '../electron/persistence'
import { Form4SourceTrail } from '../src/components/intel/Form4SourceTrail'
import { selectRenderableForm4 } from '../src/components/intel/form4TrailSelect'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { isEventResolvable, eventStructuralExposure } from '../src/engine/entityResolver'
import { classifyChangeType } from '../src/engine/materialityEngine'
import type { Form4Config, Form4Issuer } from '../electron/osint/adapters/secForm4Adapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const UA = 'Atlasz Intel research (you@example.com)'
const NVDA: Form4Issuer = { ticker: 'NVDA', cik: '1045810', cikPadded: '0001045810', companyName: 'NVIDIA CORP' }

// Real Form 4 ownership XML shape: amounts nested in <value>; two non-derivative txns.
const FORM4_XML = `<?xml version="1.0"?>
<ownershipDocument>
  <issuer>
    <issuerCik>0001045810</issuerCik>
    <issuerName>NVIDIA CORP</issuerName>
    <issuerTradingSymbol>NVDA</issuerTradingSymbol>
  </issuer>
  <reportingOwner>
    <reportingOwnerId><rptOwnerCik>0001696841</rptOwnerCik><rptOwnerName>Teter Timothy S.</rptOwnerName></reportingOwnerId>
    <reportingOwnerRelationship><isDirector>0</isDirector><isOfficer>1</isOfficer><officerTitle>EVP, General Counsel</officerTitle></reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2026-06-17</value></transactionDate>
      <transactionCoding><transactionFormType>4</transactionFormType><transactionCode>F</transactionCode></transactionCoding>
      <transactionAmounts>
        <transactionShares><value>35742</value></transactionShares>
        <transactionPricePerShare><value>207.41</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
      <postTransactionAmounts><sharesOwnedFollowingTransaction><value>334436</value></sharesOwnedFollowingTransaction></postTransactionAmounts>
      <ownershipNature><directOrIndirectOwnership><value>D</value></directOrIndirectOwnership></ownershipNature>
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2026-06-17</value></transactionDate>
      <transactionCoding><transactionFormType>4</transactionFormType><transactionCode>S</transactionCode></transactionCoding>
      <transactionAmounts>
        <transactionShares><value>10000</value></transactionShares>
        <transactionPricePerShare><value>210.00</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
      <!-- malformed: no transaction code -> dropped -->
      <transactionDate><value>2026-06-17</value></transactionDate>
      <transactionAmounts><transactionShares><value>5</value></transactionShares></transactionAmounts>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
</ownershipDocument>`

const BASE_CONFIG: Form4Config = {
  submissionsBase: 'https://data.sec.gov/submissions',
  archivesBase: 'https://www.sec.gov/Archives/edgar/data',
  identityUrl: 'https://www.sec.gov/files/company_tickers.json',
  userAgent: UA,
  tickers: ['NVDA'],
  filingsPerCompany: 5,
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

function txns() {
  return parseForm4(FORM4_XML, { issuer: NVDA, accessionNumber: '0001696841-26-000008', filingDate: '2026-06-23', sourceFilingUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/000169684126000008/', sourceXmlUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/000169684126000008/x.xml', retrievedAt: Date.parse('2026-06-23T12:00:00Z') })
}

describe('SEC Form 4 adapter', () => {
  it('requires a descriptive User-Agent and official SEC hosts; fails closed otherwise', () => {
    expect(readForm4Config({})).toBeNull()
    expect(readForm4Config({ ATLASZ_SEC_USER_AGENT: 'nope' })).toBeNull()
    expect(readForm4Config({ ATLASZ_SEC_USER_AGENT: UA })).not.toBeNull()
    expect(readForm4Config({ ATLASZ_SEC_USER_AGENT: UA, ATLASZ_SEC_FORM4_ARCHIVES_BASE: 'https://evil.example.com/x' })).toBeNull()
  })

  it('parses multiple non-derivative transactions and drops malformed ones', () => {
    const parsed = txns()
    expect(parsed).toHaveLength(2) // 2 valid, 1 malformed dropped
    const f = parsed[0]
    expect(f.ownerName).toBe('Teter Timothy S.')
    expect(f.ownerRelationship).toBe('Officer: EVP, General Counsel') // source-published only
    expect(f.transactionCode).toBe('F')
    expect(f.transactionCodeLabel).toBe('Shares withheld for tax liability') // neutral SEC definition
    expect(f.transactionShares).toBe(35742)
    expect(f.transactionPricePerShare).toBe(207.41)
    expect(f.acquiredDisposedCode).toBe('D')
    expect(f.ownershipNature).toBe('D')
    expect(f.sharesOwnedFollowing).toBe(334436)
    expect(f.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('refuses a filing whose issuer CIK does not match the canonical identity', () => {
    const wrong = parseForm4(FORM4_XML, { issuer: { ...NVDA, cik: '999999', cikPadded: '0000999999' }, accessionNumber: 'a', filingDate: '2026-06-23' })
    expect(wrong).toEqual([])
  })

  it('uses no bullish/bearish/sentiment/trading language', () => {
    const events = normalizeForm4(txns())
    const markup = renderToStaticMarkup(createElement(Form4SourceTrail, { events: events as WorldIntelEvent[], now: Date.parse('2026-06-23T12:00:00Z') }))
    // The explicit honesty disclaimer ("not sentiment, valuation, or trading advice")
    // is GOOD wording; strip it before scanning for affirmative sentiment/signal terms.
    const corpus = `${events.map((e) => `${e.title} ${e.summary}`).join(' ')} ${markup}`
      .toLowerCase()
      .replaceAll('not sentiment, valuation, or trading advice', '')
    for (const banned of ['bullish', 'bearish', 'sentiment', 'buy signal', 'sell signal', 'undervalued', 'overvalued', 'price target', 'forecast', 'should buy', 'should sell']) {
      expect(corpus, banned).not.toContain(banned)
    }
  })

  it('exposes the issuer only through an exact canonical ticker; a wrong ticker stays unresolved', () => {
    const event = normalizeForm4(txns())[0]
    expect(event.affectedAssets).toEqual(['NVDA'])
    expect(event.severity).toBe('stable')
    expect(isEventResolvable(event)).toBe(true)
    expect(eventStructuralExposure(event)[0]?.resolution.canonicalSeedEntityId).toBe('company:nvidia')
    const unknown = { ...event, affectedAssets: ['NOPE'], form4Transaction: { ...event.form4Transaction!, issuerTicker: 'NOPE' } } as WorldIntelEvent
    expect(eventStructuralExposure(unknown)).toEqual([])
  })

  it('labels it an insider transaction in What Changed Today', () => {
    expect(classifyChangeType(normalizeForm4(txns())[0])).toBe('insider-transaction')
  })

  it('links transaction -> issuer company, reporting owner, transaction code, and SEC source', () => {
    const event = normalizeForm4(txns())[0]
    const graph = buildEntityGraph([{ ...event, timestamp: Date.parse('2026-06-23T11:00:00Z') }], { now: Date.parse('2026-06-23T12:00:00Z') })
    const eventNode = graph.nodes.find((n) => n.kind === 'event')!
    const rels = neighborsOf(graph, eventNode.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(rels).toContain('about:company')
    expect(rels).toContain('filed_by:reporting-owner')
    expect(rels).toContain('references:transaction-code')
    expect(rels).toContain('reported_by:source')
  })

  it('classifies local change status by stable transaction identity + hash', () => {
    const event = normalizeForm4(txns())[0]
    const seen = applyForm4ChangeStatus(event)
    expect(seen.form4Transaction?.changeType).toBe('first_seen')
    expect(applyForm4ChangeStatus(event, seen).form4Transaction?.changeType).toBe('unchanged')
    const prev = { ...seen, form4Transaction: { ...seen.form4Transaction!, rawPayloadHash: 'b'.repeat(64) } }
    expect(applyForm4ChangeStatus(event, prev).form4Transaction?.changeType).toBe('updated')
  })

  it('round-trips the form-4 sub-record and proof-gates the source trail', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-f4-'))
    dirs.push(dir)
    const event = normalizeForm4(txns())[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((c) => c.form4Transaction)
    expect(restored?.form4Transaction?.accessionNumber).toBe(event.form4Transaction?.accessionNumber)
    expect(restored?.form4Transaction?.rawPayloadHash).toBe(event.form4Transaction?.rawPayloadHash)
    const broken = [{ ...event, form4Transaction: { ...event.form4Transaction!, transactionCode: '' } }] as WorldIntelEvent[]
    expect(selectRenderableForm4(broken)).toHaveLength(0)
  })

  it('resolves issuer CIK only from the identity spine (unknown ticker -> no fetch) and fails closed on 429', async () => {
    let filingsHit = false
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('company_tickers.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }) }
      }
      filingsHit = true
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '8' : null) }, json: async () => ({}) }
    })
    // Unknown ticker -> not in identity spine -> no issuers -> no filings fetch.
    expect(await resolveForm4Issuers({ ...BASE_CONFIG, tickers: ['ZZZZ'] }, new AbortController().signal)).toEqual([])
    expect(await fetchSecForm4(new AbortController().signal, { ...BASE_CONFIG, tickers: ['ZZZZ'] })).toEqual([])
    expect(filingsHit).toBe(false)
    // Allowlisted ticker -> resolves -> submissions 429 -> fail closed.
    await expect(fetchSecForm4(new AbortController().signal, BASE_CONFIG)).rejects.toMatchObject({ status: 429, retryAfterMs: 8000 })
    expect(SEC_FORM4_SOURCE_ID).toBe('sec_form4_public')
  })
})
