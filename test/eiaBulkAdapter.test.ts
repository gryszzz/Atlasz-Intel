import { describe, expect, it } from 'vitest'
import {
  EIA_BULK_SOURCE_ID,
  EIA_BULK_SERIES,
  isOfficialEiaBulkUrl,
  normalizeEiaBulkEnergyRecords,
  parseEiaBulkSeriesLine,
  readEiaBulkConfig,
  scanEiaBulkJsonLines,
} from '../electron/osint/adapters/eiaBulkAdapter'

const NOW = Date.parse('2026-06-29T00:00:00Z')
const SOURCE_API = 'https://www.eia.gov/opendata/bulk/PET.zip'

const WTI_LINE = JSON.stringify({
  series_id: 'PET.RWTC.D',
  name: 'Cushing, OK WTI Spot Price FOB, Daily',
  units: 'Dollars per Barrel',
  f: 'D',
  source: 'Thomson-Reuters',
  iso3166: 'USA-OK',
  geography: 'USA-OK',
  last_updated: '2026-06-24T17:49:42-04:00',
  data: [
    ['20260622', 78.94],
    ['20260618', 80.35],
  ],
})

describe('EIA public bulk adapter', () => {
  it('runs without an API key and rejects non-official overrides', () => {
    expect(readEiaBulkConfig({})?.manifestUrl).toBe('https://www.eia.gov/opendata/bulk/manifest.txt')
    expect(readEiaBulkConfig({ ATLASZ_EIA_BULK_MANIFEST_URL: 'https://evil.example/manifest.txt' })).toBeNull()
    expect(readEiaBulkConfig({ ATLASZ_EIA_BULK_DISABLE: '1' })).toBeNull()
    expect(isOfficialEiaBulkUrl('https://www.eia.gov/opendata/bulk/PET.zip')).toBe(true)
    expect(isOfficialEiaBulkUrl('https://api.eia.gov/opendata/bulk/PET.zip')).toBe(false)
    expect(isOfficialEiaBulkUrl('https://www.eia.gov/opendata/bulk/manifest.txt', 'manifest')).toBe(true)
  })

  it('normalizes a bounded public bulk series with proof and staleAt', () => {
    const record = parseEiaBulkSeriesLine(WTI_LINE, {
      series: EIA_BULK_SERIES,
      retrievedAt: NOW,
      sourceApiUrl: SOURCE_API,
      manifestModified: '2026-06-26T15:44:53-04:00',
      datasetTitle: 'Petroleum and other liquid fuels',
    })

    expect(record).toMatchObject({
      id: 'eia_bulk_public:pet.rwtc.d:20260622',
      seriesId: 'PET.RWTC.D',
      title: 'Cushing, OK WTI Spot Price FOB, Daily',
      energyCategory: 'Petroleum',
      commodity: 'Crude Oil',
      period: '20260622',
      observationDate: '2026-06-22',
      value: 78.94,
      rawValue: '78.94',
      sourceApiUrl: SOURCE_API,
      sourceName: 'U.S. Energy Information Administration',
      provenance: 'official-api',
      confidence: 94,
    })
    expect(record?.staleAt).toBeGreaterThan(NOW)
    expect(record?.rawPayloadHash).toHaveLength(64)
    expect(record?.rawPayloadJson).toContain('bulkReference')
    expect(record?.rawPayloadJson).not.toMatch(/api_key|secret/i)

    const events = normalizeEiaBulkEnergyRecords(record ? [record] : [])
    expect(events).toHaveLength(1)
    expect(events[0].sourceId).toBe(EIA_BULK_SOURCE_ID)
    expect(events[0].eiaEnergyRecord?.staleAt).toBe(record?.staleAt)
    expect(events[0].summary).toContain('No API key required')
  })

  it('bounds scanning and does not ingest the whole file', () => {
    const result = scanEiaBulkJsonLines([
      JSON.stringify({ series_id: 'IGNORED.ONE', data: [['20260101', 1]] }),
      WTI_LINE,
      JSON.stringify({ series_id: 'PET.WCESTUS1.W', data: [['20260620', 10]] }),
    ], {
      series: EIA_BULK_SERIES.filter((series) => series.dataset === 'PET'),
      retrievedAt: NOW,
      sourceApiUrl: SOURCE_API,
      maxLines: 2,
      maxRecords: 5,
    })

    expect(result.scannedLines).toBe(2)
    expect(result.records).toHaveLength(1)
    expect(result.stoppedBy).toBe('line-limit')
  })

  it('drops malformed rows and never fabricates fallback data', () => {
    expect(parseEiaBulkSeriesLine('not json', { series: EIA_BULK_SERIES, retrievedAt: NOW, sourceApiUrl: SOURCE_API })).toBeNull()
    expect(parseEiaBulkSeriesLine(JSON.stringify({ series_id: 'PET.RWTC.D', data: [['bad', 1]] }), { series: EIA_BULK_SERIES, retrievedAt: NOW, sourceApiUrl: SOURCE_API })).toBeNull()
    expect(parseEiaBulkSeriesLine(JSON.stringify({ series_id: 'PET.RWTC.D', data: [['20260622', null]] }), { series: EIA_BULK_SERIES, retrievedAt: NOW, sourceApiUrl: SOURCE_API })).toBeNull()

    const result = scanEiaBulkJsonLines([JSON.stringify({ series_id: 'UNKNOWN.X', data: [['20260622', 9]] })], {
      series: EIA_BULK_SERIES,
      retrievedAt: NOW,
      sourceApiUrl: SOURCE_API,
    })
    expect(result.records).toEqual([])
  })
})
