/*
 * SEC Form 4 stabilization guards.
 *
 * Locks in: Form 4 / 4-A only (no 3/5), honest amendment labeling, non-derivative
 * only, identity-spine CIK matching, no person enrichment beyond source XML, and
 * exact-ticker-only exposure.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSecForm4,
  normalizeForm4,
  parseForm4,
} from '../electron/osint/adapters/secForm4Adapter'
import { createPersistence } from '../electron/persistence'
import type { Form4Config, Form4Issuer } from '../electron/osint/adapters/secForm4Adapter'
import type { WorldIntelEvent } from '../src/worldIntel'

const NVDA: Form4Issuer = { ticker: 'NVDA', cik: '1045810', cikPadded: '0001045810', companyName: 'NVIDIA CORP' }
const NOW = Date.parse('2026-06-23T12:00:00Z')

// Includes a reporting-owner ADDRESS block (must never enter the record) and one
// non-derivative + one derivative transaction (derivative ignored this phase).
const XML = `<?xml version="1.0"?>
<ownershipDocument>
  <documentType>4</documentType>
  <issuer><issuerCik>0001045810</issuerCik><issuerName>NVIDIA CORP</issuerName><issuerTradingSymbol>NVDA</issuerTradingSymbol></issuer>
  <reportingOwner>
    <reportingOwnerId><rptOwnerCik>0001696841</rptOwnerCik><rptOwnerName>Teter Timothy S.</rptOwnerName></reportingOwnerId>
    <reportingOwnerAddress><rptOwnerStreet1>C/O NVIDIA</rptOwnerStreet1><rptOwnerCity>SANTA CLARA</rptOwnerCity><rptOwnerState>CA</rptOwnerState></reportingOwnerAddress>
    <reportingOwnerRelationship><isOfficer>1</isOfficer><officerTitle>EVP</officerTitle></reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2026-06-17</value></transactionDate>
      <transactionCoding><transactionCode>F</transactionCode></transactionCoding>
      <transactionAmounts><transactionShares><value>35742</value></transactionShares><transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts>
      <postTransactionAmounts><sharesOwnedFollowingTransaction><value>334436</value></sharesOwnedFollowingTransaction></postTransactionAmounts>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
  <derivativeTable>
    <derivativeTransaction>
      <securityTitle><value>RSU</value></securityTitle>
      <transactionDate><value>2026-06-17</value></transactionDate>
      <transactionCoding><transactionCode>M</transactionCode></transactionCoding>
      <transactionAmounts><transactionShares><value>9999</value></transactionShares></transactionAmounts>
    </derivativeTransaction>
  </derivativeTable>
</ownershipDocument>`

const DERIVATIVE_ONLY = `<?xml version="1.0"?>
<ownershipDocument><documentType>4</documentType>
  <issuer><issuerCik>0001045810</issuerCik><issuerName>NVIDIA CORP</issuerName></issuer>
  <reportingOwner><reportingOwnerId><rptOwnerName>X Y</rptOwnerName></reportingOwnerId></reportingOwner>
  <derivativeTable><derivativeTransaction><transactionDate><value>2026-06-17</value></transactionDate><transactionCoding><transactionCode>M</transactionCode></transactionCoding></derivativeTransaction></derivativeTable>
</ownershipDocument>`

const BASE_CONFIG: Form4Config = {
  submissionsBase: 'https://data.sec.gov/submissions',
  archivesBase: 'https://www.sec.gov/Archives/edgar/data',
  identityUrl: 'https://www.sec.gov/files/company_tickers.json',
  userAgent: 'Atlasz Intel research (you@example.com)',
  tickers: ['NVDA'],
  filingsPerCompany: 10,
  timeoutMs: 1000,
  maxRetries: 0,
  backoffMs: 0,
}

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function parseOne(opts: Record<string, unknown> = {}) {
  return parseForm4(XML, { issuer: NVDA, accessionNumber: '0001696841-26-000008', filingDate: '2026-06-23', retrievedAt: NOW, sourceFilingUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/x/', sourceXmlUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/x/x.xml', ...opts })
}

describe('SEC Form 4 stabilization', () => {
  it('parses non-derivative transactions only — derivative table is ignored this phase', () => {
    const records = parseOne()
    expect(records).toHaveLength(1) // only the non-derivative txn; derivative ignored
    expect(records[0].transactionCode).toBe('F')
    expect(parseForm4(DERIVATIVE_ONLY, { issuer: NVDA, accessionNumber: 'a', filingDate: '2026-06-23' })).toEqual([])
  })

  it('does not enrich the reporting owner beyond source name/title/CIK (no address)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-f4s-'))
    dirs.push(dir)
    const event = normalizeForm4(parseOne())[0]
    expect(event.form4Transaction?.ownerName).toBe('Teter Timothy S.')
    expect(event.form4Transaction?.ownerRelationship).toBe('Officer: EVP')
    expect(Object.keys(event.form4Transaction!)).not.toContain('ownerStreet')
    createPersistence(dir).saveWorldIntelEvent(event)
    const json = JSON.stringify(createPersistence(dir).listWorldIntelEvents())
    expect(json).not.toContain('SANTA CLARA') // address never persisted
    expect(json).not.toContain('you@example.com') // User-Agent never persisted
  })

  it('labels a Form 4/A amendment honestly (never as an original)', () => {
    const original = normalizeForm4(parseOne({ isAmendment: false }))[0]
    expect(original.form4Transaction?.isAmendment).toBe(false)
    expect(original.summary).toContain('SEC Form 4:')
    const amended = normalizeForm4(parseOne({ isAmendment: true }))[0]
    expect(amended.form4Transaction?.isAmendment).toBe(true)
    expect(amended.summary).toContain('Form 4/A (amendment)')
    // The amendment flag changes the payload hash (distinct evidence).
    expect(amended.form4Transaction?.rawPayloadHash).not.toBe(original.form4Transaction?.rawPayloadHash)
  })

  it('persists multiple transactions from one filing independently', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-f4m-'))
    dirs.push(dir)
    const multi = `${XML.replace('</nonDerivativeTable>', `<nonDerivativeTransaction><securityTitle><value>Common Stock</value></securityTitle><transactionDate><value>2026-06-17</value></transactionDate><transactionCoding><transactionCode>S</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>10000</value></transactionShares><transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction></nonDerivativeTable>`)}`
    const events = normalizeForm4(parseForm4(multi, { issuer: NVDA, accessionNumber: 'acc-1', filingDate: '2026-06-23' }))
    expect(events).toHaveLength(2)
    const p = createPersistence(dir)
    for (const e of events) p.saveWorldIntelEvent(e)
    const reloaded = createPersistence(dir).listWorldIntelEvents().filter((e) => e.form4Transaction)
    expect(reloaded).toHaveLength(2)
    expect(new Set(reloaded.map((e) => e.form4Transaction!.transactionCode))).toEqual(new Set(['F', 'S']))
  })

  it('drops a filing whose issuer CIK does not match the canonical identity', () => {
    expect(parseForm4(XML, { issuer: { ...NVDA, cik: '111', cikPadded: '0000000111' }, accessionNumber: 'a', filingDate: '2026-06-23' })).toEqual([])
  })

  it('fetches only Form 4 and 4/A filings — never Form 3 or Form 5', async () => {
    const fetched: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('company_tickers.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }) }
      }
      if (url.includes('/submissions/')) {
        return {
          ok: true, status: 200, headers: { get: () => null },
          json: async () => ({ filings: { recent: {
            form: ['3', '4', '5', '4/A'],
            accessionNumber: ['acc-three', 'acc-four', 'acc-five', 'acc-four-a'],
            filingDate: ['2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23'],
            primaryDocument: ['form3.xml', 'form4.xml', 'form5.xml', 'form4a.xml'],
          } } }),
        }
      }
      fetched.push(url)
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => XML }
    })
    const events = await fetchSecForm4(new AbortController().signal, BASE_CONFIG)
    expect(fetched.some((u) => u.includes('form4.xml'))).toBe(true)
    expect(fetched.some((u) => u.includes('form4a.xml'))).toBe(true)
    expect(fetched.some((u) => u.includes('form3.xml'))).toBe(false)
    expect(fetched.some((u) => u.includes('form5.xml'))).toBe(false)
    // The 4/A-sourced event is honestly flagged as an amendment.
    expect((events as WorldIntelEvent[]).some((e) => e.form4Transaction?.isAmendment)).toBe(true)
  })
})
