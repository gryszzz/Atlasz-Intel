import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONGRESS_GOV_SOURCE_ID,
  applyCongressBillChangeStatus,
  fetchCongressGovBills,
  normalizeCongressGovBills,
  parseCongressGovBills,
  readCongressGovConfig,
} from '../electron/osint/adapters/congressGovAdapter'
import { createPersistence } from '../electron/persistence'
import { CongressSourceTrail } from '../src/components/intel/CongressSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { assessWhatChangedToday } from '../src/engine/materialityEngine'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL = 'https://api.congress.gov/v3/bill?format=json&limit=2'

const FIXTURE = {
  bills: [
    {
      congress: 119,
      type: 'HR',
      number: '1234',
      title: 'Supply Chain Resilience Act',
      introducedDate: '2026-01-15',
      latestAction: {
        actionDate: '2026-06-22',
        text: 'Referred to the House Committee on Energy and Commerce.',
      },
      policyArea: { name: 'Commerce' },
      sponsors: [{ fullName: 'Rep. Example, Alex [D-CA-12]', bioguideId: 'E000001' }],
      committees: {
        count: 1,
        url: 'https://api.congress.gov/v3/bill/119/hr/1234/committees?format=json',
        items: [{ name: 'Energy and Commerce Committee', chamber: 'House' }],
      },
      url: 'https://api.congress.gov/v3/bill/119/hr/1234?format=json',
    },
    {
      // Malformed: no title/latest action -> dropped, not repaired.
      congress: 119,
      type: 'S',
      number: '999',
      title: '',
      latestAction: { actionDate: '', text: '' },
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('Congress.gov adapter', () => {
  it('requires an API key and refuses insecure overrides', () => {
    expect(readCongressGovConfig({})).toBeNull()
    expect(readCongressGovConfig({ ATLASZ_CONGRESS_API_KEY: 'secret' })).not.toBeNull()
    expect(readCongressGovConfig({ ATLASZ_CONGRESS_API_KEY: 'secret', ATLASZ_CONGRESS_DISABLE: '1' })).toBeNull()
    expect(readCongressGovConfig({ ATLASZ_CONGRESS_API_KEY: 'secret', ATLASZ_CONGRESS_BILL_URL: 'http://insecure' })).toBeNull()
  })

  it('normalizes official bill/action records with proof fields and no API key leakage', () => {
    const records = parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: `${API_URL}&api_key=secret-key` })
    const events = normalizeCongressGovBills(records)
    const bill = events.find((event) => event.congressBillAction?.billNumber === '1234')

    expect(records).toHaveLength(1)
    expect(bill?.category).toBe('legislation')
    expect(bill?.provenance).toBe('official-api')
    expect(bill?.confidence).toBe(96)
    expect(bill?.sourceId).toBe(CONGRESS_GOV_SOURCE_ID)
    expect(bill?.countryCodes).toEqual(['US'])
    expect(bill?.affectedAssets).toEqual([])
    expect(bill?.congressBillAction?.congress).toBe(119)
    expect(bill?.congressBillAction?.billType).toBe('HR')
    expect(bill?.congressBillAction?.policyArea).toBe('Commerce')
    expect(bill?.congressBillAction?.committees).toEqual(['Energy and Commerce Committee'])
    expect(bill?.congressBillAction?.officialUrl).toBe('https://www.congress.gov/bill/119th-congress/house-bill/1234')
    expect(bill?.congressBillAction?.sourceApiUrl).toBe('https://api.congress.gov/v3/bill/119/hr/1234?format=json')
    expect(bill?.congressBillAction?.sourceApiUrl).not.toContain('secret-key')
    expect(bill?.congressBillAction?.rawPayloadJson).not.toContain('secret-key')
    expect(bill?.congressBillAction?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('drops malformed records and fails closed on empty payloads', () => {
    expect(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).toHaveLength(1)
    expect(parseCongressGovBills(null)).toEqual([])
    expect(parseCongressGovBills({ bills: [] })).toEqual([])
    expect(normalizeCongressGovBills([])).toEqual([])
  })

  it('classifies local daily change status by bill identity and latest action hash', () => {
    const event = normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    const firstSeen = applyCongressBillChangeStatus(event)
    expect(firstSeen.congressBillAction?.changeType).toBe('new')

    const unchanged = applyCongressBillChangeStatus(event, firstSeen)
    expect(unchanged.congressBillAction?.changeType).toBe('unchanged')
    expect(unchanged.timestamp).toBe(firstSeen.timestamp)

    const previous = {
      ...firstSeen,
      congressBillAction: { ...firstSeen.congressBillAction!, rawPayloadHash: 'b'.repeat(64) },
    }
    const updated = applyCongressBillChangeStatus(event, previous)
    expect(updated.congressBillAction?.changeType).toBe('updated')
  })

  it('links bill -> United States, policy area, and committee in the Evidence Graph', () => {
    const event = applyCongressBillChangeStatus(normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0])
    const graph = buildEntityGraph([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })
    const bill = graph.nodes.find((node) => node.id === 'legislation:119-hr-1234')!

    expect(bill.kind).toBe('legislation')
    const relations = neighborsOf(graph, bill.id).map((node) => `${node.relation}:${node.entity.kind}:${node.entity.label}`)
    expect(relations).toContain('in_country:country:United States')
    expect(relations).toContain('references:policy-area:Commerce')
    expect(relations).toContain('references:committee:Energy and Commerce Committee')
  })

  it('round-trips the Congress bill/action sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-congress-'))
    dirs.push(dir)
    const event = applyCongressBillChangeStatus(normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0])

    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.congressBillAction)

    expect(restored?.congressBillAction?.billNumber).toBe(event.congressBillAction?.billNumber)
    expect(restored?.congressBillAction?.policyArea).toBe('Commerce')
    expect(restored?.congressBillAction?.rawPayloadHash).toBe(event.congressBillAction?.rawPayloadHash)
  })

  it('renders Congress source-trail cards only with proof fields', () => {
    const event = applyCongressBillChangeStatus(normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0])
    const markup = renderToStaticMarkup(createElement(CongressSourceTrail, { events: [event as WorldIntelEvent] }))

    expect(markup).toContain('Congress.gov')
    expect(markup).toContain('HR 1234')
    expect(markup).toContain('Supply Chain Resilience Act')
    expect(markup).toContain('bill source trail')
    expect(markup).toContain('official API URL')
    expect(markup).toContain('new')
    expect(markup).toContain('96%')
    expect(markup).not.toContain('api_key')
  })

  it('appears in What Changed Today as legislation without upgrading to verified', () => {
    const event = applyCongressBillChangeStatus(normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0])
    const result = assessWhatChangedToday([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })

    expect(result.status).toBe('ok')
    expect(result.items[0]?.changeType).toBe('legislation')
    expect(result.items[0]?.provenance).toBe('local-derived')
  })

  it('uses the key for fetching but stores only sanitized URLs and surfaces rate limits', async () => {
    let requestedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => FIXTURE,
      }
    })

    const events = await fetchCongressGovBills(new AbortController().signal, {
      billUrl: 'https://api.congress.gov/v3/bill',
      apiKey: 'secret-congress-key',
      maxRecords: 2,
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })

    expect(requestedUrl).toContain('api_key=secret-congress-key')
    expect(events[0]?.congressBillAction?.sourceApiUrl).not.toContain('secret-congress-key')
    expect(events[0]?.congressBillAction?.rawPayloadJson).not.toContain('secret-congress-key')

    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '5' : null) },
      json: async () => ({}),
    }))
    await expect(
      fetchCongressGovBills(new AbortController().signal, {
        billUrl: 'https://api.congress.gov/v3/bill',
        apiKey: 'secret-congress-key',
        maxRecords: 2,
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 5_000 })
  })

  it('never resolves a bill into curated company/sector exposure (no political/exposure inference)', () => {
    const event = applyCongressBillChangeStatus(normalizeCongressGovBills(parseCongressGovBills(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0])
    expect(event.affectedAssets).toEqual([])
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })
})
