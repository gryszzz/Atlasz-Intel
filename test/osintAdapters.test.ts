import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  normalizePoliticianDisclosures,
  readPoliticianConfig,
} from '../electron/osint/adapters/politicianTradeAdapter'
import {
  normalizeSecFilings,
  parseSecAtom,
  readSecConfig,
  type SecFilingRecord,
} from '../electron/osint/adapters/secEdgarAdapter'
import {
  MACRO_SERIES,
  normalizeMacroObservation,
  readMacroConfig,
} from '../electron/osint/adapters/macroCalendarAdapter'
import { createPersistence } from '../electron/persistence'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('politician disclosure adapter', () => {
  it('normalizes a simulated disclosure with provenance public-disclosure', () => {
    const events = normalizePoliticianDisclosures([
      {
        representative: 'Jane Public',
        chamber: 'House',
        ticker: 'aapl',
        transaction_type: 'Purchase',
        amount: '$1,001 - $15,000',
        transaction_date: '2026-05-01',
        disclosure_date: '2026-06-01',
        ptr_link: 'https://example.test/ptr/1',
      },
    ])
    expect(events).toHaveLength(1)
    expect(events[0].category).toBe('public-disclosure')
    expect(events[0].provenance).toBe('public-disclosure')
    expect(events[0].affectedAssets).toContain('AAPL')
    expect(events[0].title).toContain('purchase')
  })

  it('keeps disclosures with no ticker (never dropped, never invented)', () => {
    const events = normalizePoliticianDisclosures({
      data: [{ senator: 'John Public', asset: 'Private Real Estate Fund', type: 'sale' }],
    })
    expect(events).toHaveLength(1)
    expect(events[0].affectedAssets).toEqual([])
    expect(events[0].provenance).toBe('public-disclosure')
  })

  it('fails closed: malformed payload and missing config', () => {
    expect(normalizePoliticianDisclosures(null)).toEqual([])
    expect(normalizePoliticianDisclosures({ nope: true })).toEqual([])
    vi.stubEnv('ATLASZ_POLITICIAN_DISCLOSURE_URL', '')
    expect(readPoliticianConfig()).toBeNull()
  })
})

describe('SEC EDGAR adapter', () => {
  const filing: SecFilingRecord = {
    companyName: 'APPLE INC',
    cik: '320193',
    formType: '8-K',
    filedAt: Date.parse('2026-06-01T13:00:00Z'),
    accessionNumber: '0000320193-26-000050',
    filingUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019326000050-index.htm',
    sourceDomain: 'sec.gov',
  }

  it('normalizes a simulated 8-K with provenance official-api and category filing', () => {
    const events = normalizeSecFilings([filing], { cikTickerMap: { '320193': 'AAPL' } })
    expect(events).toHaveLength(1)
    expect(events[0].category).toBe('filing')
    expect(events[0].provenance).toBe('official-api')
    expect(events[0].affectedAssets).toContain('AAPL')
  })

  it('persists unmapped filings instead of inventing a ticker', () => {
    const events = normalizeSecFilings([filing], { cikTickerMap: {} })
    expect(events[0].affectedAssets).toEqual([])
    expect(events[0].summary).toMatch(/unmapped/i)
  })

  it('filters non-target forms and honors amendment toggle', () => {
    const proxy = { ...filing, formType: 'S-1' }
    expect(normalizeSecFilings([proxy], {})).toHaveLength(0)
    const amendment = { ...filing, formType: '10-K/A' }
    expect(normalizeSecFilings([amendment], { includeAmendments: false })).toHaveLength(0)
    expect(normalizeSecFilings([amendment], { includeAmendments: true })).toHaveLength(1)
  })

  it('parses a simulated SEC Atom entry', () => {
    const xml = `<?xml version="1.0"?><feed><entry>
      <title>8-K - APPLE INC (0000320193) (Filer)</title>
      <link rel="alternate" type="text/html" href="https://www.sec.gov/x-index.htm"/>
      <category scheme="https://www.sec.gov/" label="form type" term="8-K"/>
      <updated>2026-06-01T13:00:00-04:00</updated>
      <id>urn:tag:sec.gov,2008:accession-number=0000320193-26-000050</id>
    </entry></feed>`
    const parsed = parseSecAtom(xml)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].formType).toBe('8-K')
    expect(parsed[0].cik).toBe('320193')
    expect(parsed[0].accessionNumber).toBe('0000320193-26-000050')
  })

  it('fails closed without a contactable User-Agent', () => {
    vi.stubEnv('ATLASZ_SEC_USER_AGENT', '')
    expect(readSecConfig()).toBeNull()
    vi.stubEnv('ATLASZ_SEC_USER_AGENT', 'Atlasz research (you@example.com)')
    expect(readSecConfig()).not.toBeNull()
  })
})

describe('macro calendar adapter', () => {
  const cpi = MACRO_SERIES[0]

  it('normalizes a simulated FRED observation with macro proxies', () => {
    const event = normalizeMacroObservation(cpi, { date: '2026-05-01', value: '320.1' })
    expect(event).not.toBeNull()
    expect(event?.category).toBe('macro-event')
    expect(event?.provenance).toBe('official-api')
    expect(event?.affectedAssets).toEqual(expect.arrayContaining(['SPY', 'DXY', 'BTC']))
  })

  it('fails closed on missing FRED observation values', () => {
    expect(normalizeMacroObservation(cpi, { date: '2026-05-01', value: '.' })).toBeNull()
    expect(normalizeMacroObservation(cpi, undefined)).toBeNull()
    vi.stubEnv('ATLASZ_FRED_API_KEY', '')
    expect(readMacroConfig()).toBeNull()
  })
})

describe('adapter events route through persistence into world_intel_events', () => {
  it('saves simulated SEC 8-K and politician disclosure and reads them back with provenance', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-osint-'))
    try {
      const persistence = createPersistence(dir)
      const secEvent = normalizeSecFilings(
        [
          {
            companyName: 'APPLE INC',
            cik: '320193',
            formType: '8-K',
            filedAt: Date.parse('2026-06-01T13:00:00Z'),
            accessionNumber: '0000320193-26-000050',
            filingUrl: 'https://www.sec.gov/x-index.htm',
            sourceDomain: 'sec.gov',
          },
        ],
        { cikTickerMap: { '320193': 'AAPL' } },
      )[0]
      const politicianEvent = normalizePoliticianDisclosures([
        { representative: 'Jane Public', ticker: 'MSFT', type: 'purchase', disclosure_date: '2026-06-02' },
      ])[0]

      persistence.saveWorldIntelEvent(secEvent)
      persistence.saveWorldIntelEvent(politicianEvent)

      const stored = persistence.listWorldIntelEvents(50)
      const storedSec = stored.find((event) => event.id === secEvent.id)
      const storedPolitician = stored.find((event) => event.id === politicianEvent.id)

      expect(storedSec?.category).toBe('filing')
      expect(storedSec?.provenance).toBe('official-api')
      expect(storedPolitician?.category).toBe('public-disclosure')
      expect(storedPolitician?.provenance).toBe('public-disclosure')
      persistence.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
