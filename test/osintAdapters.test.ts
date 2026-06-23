import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  normalizePoliticianDisclosures,
  readPoliticianConfig,
} from '../electron/osint/adapters/politicianTradeAdapter'
import {
  buildSecFilingUrl,
  fetchSecFilings,
  normalizeSecFilings,
  parseSecAtom,
  parseSecCompanySubmissions,
  readSecConfig,
  secCompanySubmissionsUrl,
  type SecFilingRecord,
} from '../electron/osint/adapters/secEdgarAdapter'
import {
  fetchMacroCalendar,
  MACRO_SERIES,
  normalizeFredSeriesObservation,
  normalizeMacroObservation,
  readMacroConfig,
} from '../electron/osint/adapters/macroCalendarAdapter'
import {
  fetchTreasuryFiscalData,
  normalizeTreasuryDebtToPennyRecords,
  normalizeTreasuryFiscalRecords,
  readTreasuryFiscalConfig,
  TREASURY_DEBT_TO_PENNY_METRICS,
} from '../electron/osint/adapters/treasuryFiscalAdapter'
import { createPersistence } from '../electron/persistence'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
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

  it('normalizes an SEC 8-K fixture with provenance public-disclosure and category filing', () => {
    const events = normalizeSecFilings([filing], { cikTickerMap: { '320193': 'AAPL' } })
    expect(events).toHaveLength(1)
    expect(events[0].category).toBe('filing')
    expect(events[0].provenance).toBe('public-disclosure')
    expect(events[0].confidence).toBe(96)
    expect(events[0].affectedAssets).toContain('AAPL')
    expect(events[0].sourceUrl).toContain('sec.gov/Archives/edgar/data')
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

  it('parses an SEC Atom fixture entry', () => {
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

  it('parses official company submissions JSON into stable filing metadata', () => {
    const filings = parseSecCompanySubmissions(
      {
        cik: '0000320193',
        name: 'APPLE INC.',
        tickers: ['AAPL'],
        filings: {
          recent: {
            accessionNumber: ['0000320193-26-000050', '0000320193-26-000051'],
            filingDate: ['2026-06-01', '2026-06-02'],
            reportDate: ['2026-05-31', '2026-06-01'],
            acceptanceDateTime: ['20260601130000', '20260602130000'],
            form: ['8-K', 'S-1'],
            primaryDocument: ['aapl-20260601.htm', 'aapl-s1.htm'],
          },
        },
      },
      {
        observedAt: 1_780_000_000_000,
        sourceJsonUrl: secCompanySubmissionsUrl('320193'),
        config: { cikTickerMap: { '320193': 'AAPL' }, formTypes: ['8-K'] },
      },
    )

    expect(filings).toHaveLength(1)
    expect(filings[0]).toMatchObject({
      cik: '320193',
      companyName: 'APPLE INC.',
      ticker: 'AAPL',
      formType: '8-K',
      accessionNumber: '0000320193-26-000050',
      provenance: 'public-disclosure',
      confidence: 96,
    })
    expect(filings[0].sourceUrl).toBe(buildSecFilingUrl('320193', '0000320193-26-000050', 'aapl-20260601.htm'))
    expect(filings[0].sourceJsonUrl).toBe('https://data.sec.gov/submissions/CIK0000320193.json')
    expect(filings[0].acceptedAt).toBe(Date.parse('2026-06-01T13:00:00Z'))
    expect(filings[0].rawPayloadJson).toContain('0000320193-26-000050')
  })

  it('fetches the official company submissions endpoint with a configured SEC User-Agent', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        cik: '0000320193',
        name: 'APPLE INC.',
        tickers: ['AAPL'],
        filings: {
          recent: {
            accessionNumber: ['0000320193-26-000050'],
            filingDate: ['2026-06-01'],
            reportDate: ['2026-05-31'],
            acceptanceDateTime: ['20260601130000'],
            form: ['8-K'],
            primaryDocument: ['aapl-20260601.htm'],
          },
        },
      }),
    }))
    vi.stubGlobal('fetch', fetchSpy)

    const events = await fetchSecFilings(new AbortController().signal, {
      userAgent: 'Atlasz Intel QA qa@example.com',
      formTypes: ['8-K'],
      includeAmendments: true,
      cikTickerMap: { '320193': 'AAPL' },
      companyCiks: ['320193'],
      maxFilingsPerCompany: 5,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://data.sec.gov/submissions/CIK0000320193.json',
      expect.objectContaining({
        headers: expect.objectContaining({ 'user-agent': 'Atlasz Intel QA qa@example.com' }),
      }),
    )
    expect(events).toHaveLength(1)
    expect(events[0].secFiling).toMatchObject({
      ticker: 'AAPL',
      sourceJsonUrl: 'https://data.sec.gov/submissions/CIK0000320193.json',
      provenance: 'public-disclosure',
      confidence: 96,
    })
  })

  it('drops malformed company filings instead of showing low-confidence cards', () => {
    const filings = parseSecCompanySubmissions({
      cik: '0000320193',
      name: 'APPLE INC.',
      filings: {
        recent: {
          accessionNumber: ['not-an-accession'],
          filingDate: ['2026-06-01'],
          form: ['8-K'],
          primaryDocument: ['aapl.htm'],
        },
      },
    })

    expect(filings).toEqual([])
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

  it('normalizes a FRED observation fixture with macro proxies and source evidence', () => {
    const event = normalizeMacroObservation(cpi, { date: '2026-05-01', value: '320.1' })
    expect(event).not.toBeNull()
    expect(event?.category).toBe('macro-event')
    expect(event?.provenance).toBe('official-api')
    expect(event?.affectedAssets).toEqual(expect.arrayContaining(['SPY', 'DXY', 'BTC']))
    expect(event?.sourceUrl).toBe('https://fred.stlouisfed.org/series/CPIAUCSL')
    expect(event?.fredObservation).toMatchObject({
      seriesId: 'CPIAUCSL',
      observationDate: '2026-05-01',
      value: 320.1,
      confidence: 96,
      provenance: 'official-api',
    })
  })

  it('normalizes FRED metadata plus latest observation into a stable evidence record', () => {
    const record = normalizeFredSeriesObservation({
      requestedMeta: cpi,
      retrievedAt: 1_780_000_000_000,
      sourceApiUrl: 'https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&file_type=json&limit=1',
      seriesPayload: {
        seriess: [
          {
            id: 'CPIAUCSL',
            title: 'Consumer Price Index for All Urban Consumers: All Items in U.S. City Average',
            units: 'Index 1982-1984=100',
            frequency: 'Monthly',
            seasonal_adjustment: 'Seasonally Adjusted',
          },
        ],
      },
      observationsPayload: {
        observations: [{ date: '2026-05-01', value: '320.1' }],
      },
    })

    expect(record).toMatchObject({
      seriesId: 'CPIAUCSL',
      title: 'Consumer Price Index for All Urban Consumers: All Items in U.S. City Average',
      units: 'Index 1982-1984=100',
      frequency: 'Monthly',
      seasonalAdjustment: 'Seasonally Adjusted',
      observationDate: '2026-05-01',
      value: 320.1,
      sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
      sourceName: 'FRED (Federal Reserve Economic Data)',
      retrievedAt: 1_780_000_000_000,
      confidence: 96,
    })
    expect(record?.rawPayloadJson).toContain('CPIAUCSL')
    expect(record?.sourceApiUrl).not.toContain('api_key=')
  })

  it('fetches official FRED metadata and observations with the configured API key', async () => {
    const fetchSpy = vi.fn(async (url: URL) => {
      const value = url.toString()
      if (value.includes('/series?')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            seriess: [
              {
                id: 'CPIAUCSL',
                title: 'Consumer Price Index for All Urban Consumers',
                units: 'Index 1982-1984=100',
                frequency: 'Monthly',
                seasonal_adjustment: 'Seasonally Adjusted',
              },
            ],
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ observations: [{ date: '2026-05-01', value: '320.1' }] }),
      }
    })
    vi.stubGlobal('fetch', fetchSpy)

    const events = await fetchMacroCalendar(new AbortController().signal, {
      apiKey: 'test-key',
      baseUrl: 'https://api.stlouisfed.org/fred',
      series: [cpi],
      rateLimitMs: 0,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/fred/series?')
    expect(String(fetchSpy.mock.calls[0][0])).toContain('api_key=test-key')
    expect(String(fetchSpy.mock.calls[1][0])).toContain('/fred/series/observations?')
    expect(events).toHaveLength(1)
    expect(events[0].fredObservation?.sourceApiUrl).not.toContain('api_key=')
  })

  it('fails closed on missing FRED observation values', () => {
    expect(normalizeMacroObservation(cpi, { date: '2026-05-01', value: '.' })).toBeNull()
    expect(normalizeMacroObservation(cpi, undefined)).toBeNull()
    expect(
      normalizeFredSeriesObservation({
        requestedMeta: cpi,
        retrievedAt: 1,
        seriesPayload: { seriess: [{ id: 'CPIAUCSL', title: 'CPI', units: 'Index', frequency: 'Monthly', seasonal_adjustment: 'SA' }] },
        observationsPayload: { observations: [{ date: '2026-05-01', value: '.' }] },
      }),
    ).toBeNull()
    vi.stubEnv('ATLASZ_FRED_API_KEY', '')
    expect(readMacroConfig()).toBeNull()
  })
})

describe('Treasury Fiscal Data adapter', () => {
  const treasuryPayload = {
    data: [
      {
        record_date: '2026-06-17',
        debt_held_public_amt: '31643344541986.99',
        intragov_hold_amt: '7639707724283.92',
        tot_pub_debt_out_amt: '39283052266270.91',
        src_line_nbr: '1',
      },
    ],
    meta: {
      labels: {
        record_date: 'Record Date',
        debt_held_public_amt: 'Debt Held by the Public',
        intragov_hold_amt: 'Intragovernmental Holdings',
        tot_pub_debt_out_amt: 'Total Public Debt Outstanding',
      },
      dataTypes: {
        record_date: 'DATE',
        debt_held_public_amt: 'CURRENCY',
        intragov_hold_amt: 'CURRENCY',
        tot_pub_debt_out_amt: 'CURRENCY',
      },
    },
  }

  it('normalizes official Debt to the Penny records into evidence-bearing fiscal events', () => {
    const records = normalizeTreasuryDebtToPennyRecords({
      payload: treasuryPayload,
      retrievedAt: 1_780_000_000_000,
      sourceApiUrl:
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1',
      metrics: TREASURY_DEBT_TO_PENNY_METRICS,
    })
    const events = normalizeTreasuryFiscalRecords(records)

    expect(records).toHaveLength(3)
    expect(records[0]).toMatchObject({
      datasetId: 'debt_to_penny',
      tableId: 'debt_to_penny',
      recordDate: '2026-06-17',
      metricName: 'Total Public Debt Outstanding',
      metricValue: 39283052266270.91,
      units: 'USD',
      sourceName: 'U.S. Treasury Fiscal Data',
      provenance: 'official-api',
      confidence: 96,
    })
    expect(records[0].sourceUrl).toBe('https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/')
    expect(records[0].sourceApiUrl).toContain('api.fiscaldata.treasury.gov/services/api/fiscal_service')
    expect(records[0].rawPayloadJson).toContain('tot_pub_debt_out_amt')
    expect(events[0]).toMatchObject({
      category: 'fiscal-event',
      provenance: 'official-api',
      sourceId: 'treasury_fiscal_public',
      treasuryFiscalRecord: expect.objectContaining({ datasetId: 'debt_to_penny' }),
    })
    expect(events[0].countryCodes).toContain('US')
  })

  it('drops malformed Treasury rows and metrics instead of repairing them', () => {
    const records = normalizeTreasuryDebtToPennyRecords({
      payload: {
        data: [
          { record_date: 'not-a-date', tot_pub_debt_out_amt: '100' },
          { record_date: '2026-06-17', tot_pub_debt_out_amt: 'not-a-number' },
        ],
      },
      retrievedAt: 1,
      sourceApiUrl:
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1',
      metrics: [{ field: 'tot_pub_debt_out_amt', metricName: 'Total Public Debt Outstanding', units: 'USD' }],
    })

    expect(records).toEqual([])
    expect(normalizeTreasuryDebtToPennyRecords({ payload: null, retrievedAt: 1 })).toEqual([])
  })

  it('fetches Treasury with shared retry/backoff and honors Retry-After on 429', async () => {
    let calls = 0
    const fetchSpy = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return {
          ok: false,
          status: 429,
          headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '0' : null) },
          json: async () => ({}),
        }
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => treasuryPayload,
      }
    })
    vi.stubGlobal('fetch', fetchSpy)

    const events = await fetchTreasuryFiscalData(new AbortController().signal, {
      ...readTreasuryFiscalConfig(),
      recordLimit: 1,
      maxRetries: 1,
      backoffMs: 0,
      timeoutMs: 5_000,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(events).toHaveLength(3)
    expect(events[0].treasuryFiscalRecord?.sourceApiUrl).toContain('debt_to_penny')
  })
})

describe('adapter events route through persistence into world_intel_events', () => {
  it('saves SEC 8-K fixture and politician disclosure and reads them back with provenance', () => {
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
            filingUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019326000050/0000320193-26-000050-index.html',
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
      expect(storedSec?.provenance).toBe('public-disclosure')
      expect(storedPolitician?.category).toBe('public-disclosure')
      expect(storedPolitician?.provenance).toBe('public-disclosure')
      persistence.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('persists dedicated SEC filing metadata for entity pages and source trails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-sec-filings-'))
    try {
      const persistence = createPersistence(dir)
      const filingRecord = parseSecCompanySubmissions(
        {
          cik: '0000320193',
          name: 'APPLE INC.',
          tickers: ['AAPL'],
          filings: {
            recent: {
              accessionNumber: ['0000320193-26-000050'],
              filingDate: ['2026-06-01'],
              reportDate: ['2026-05-31'],
              acceptanceDateTime: ['20260601130000'],
              form: ['8-K'],
              primaryDocument: ['aapl-20260601.htm'],
            },
          },
        },
        { observedAt: 1_780_000_000_000, sourceJsonUrl: secCompanySubmissionsUrl('320193') },
      )[0]

      persistence.saveSecCompanyFiling(filingRecord)

      const stored = persistence.listSecCompanyFilings('AAPL', 10)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        ticker: 'AAPL',
        formType: '8-K',
        confidence: 96,
        provenance: 'public-disclosure',
      })
      expect(stored[0].sourceUrl).toContain('https://www.sec.gov/Archives/edgar/data/320193/')
      expect(stored[0].rawPayloadJson).toContain('0000320193-26-000050')
      persistence.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('persists dedicated FRED macro observations for macro context cards', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-fred-macro-'))
    try {
      const persistence = createPersistence(dir)
      const record = normalizeFredSeriesObservation({
        requestedMeta: MACRO_SERIES[0],
        retrievedAt: 1_780_000_000_000,
        sourceApiUrl: 'https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&file_type=json&limit=1',
        seriesPayload: {
          seriess: [
            {
              id: 'CPIAUCSL',
              title: 'Consumer Price Index for All Urban Consumers',
              units: 'Index 1982-1984=100',
              frequency: 'Monthly',
              seasonal_adjustment: 'Seasonally Adjusted',
            },
          ],
        },
        observationsPayload: { observations: [{ date: '2026-05-01', value: '320.1' }] },
      })
      if (!record) throw new Error('missing FRED fixture record')

      persistence.saveFredMacroObservation(record)

      const stored = persistence.listFredMacroObservations('CPIAUCSL', 10)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        seriesId: 'CPIAUCSL',
        title: 'Consumer Price Index for All Urban Consumers',
        observationDate: '2026-05-01',
        value: 320.1,
        confidence: 96,
        provenance: 'official-api',
      })
      expect(stored[0].sourceUrl).toBe('https://fred.stlouisfed.org/series/CPIAUCSL')
      expect(stored[0].sourceApiUrl).not.toContain('api_key=')
      expect(stored[0].rawPayloadJson).toContain('CPIAUCSL')
      persistence.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('persists dedicated Treasury fiscal records for fiscal source trails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-treasury-fiscal-'))
    try {
      const persistence = createPersistence(dir)
      const record = normalizeTreasuryDebtToPennyRecords({
        payload: {
          data: [{ record_date: '2026-06-17', tot_pub_debt_out_amt: '39283052266270.91' }],
          meta: { labels: { tot_pub_debt_out_amt: 'Total Public Debt Outstanding' } },
        },
        retrievedAt: 1_780_000_000_000,
        sourceApiUrl:
          'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1',
        metrics: [{ field: 'tot_pub_debt_out_amt', metricName: 'Total Public Debt Outstanding', units: 'USD' }],
      })[0]
      if (!record) throw new Error('missing Treasury fixture record')

      persistence.saveTreasuryFiscalRecord(record)

      const stored = persistence.listTreasuryFiscalRecords('debt_to_penny', 10)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        datasetId: 'debt_to_penny',
        tableId: 'debt_to_penny',
        metricName: 'Total Public Debt Outstanding',
        metricValue: 39283052266270.91,
        provenance: 'official-api',
        confidence: 96,
      })
      expect(stored[0].sourceUrl).toBe('https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/')
      expect(stored[0].sourceApiUrl).toContain('api.fiscaldata.treasury.gov')
      expect(stored[0].rawPayloadJson).toContain('tot_pub_debt_out_amt')
      persistence.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
