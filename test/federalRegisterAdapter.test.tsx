import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FEDERAL_REGISTER_SOURCE_ID,
  fetchFederalRegisterDocuments,
  normalizeFederalRegisterDocuments,
  parseFederalRegisterDocuments,
  readFederalRegisterConfig,
} from '../electron/osint/adapters/federalRegisterAdapter'
import { createPersistence } from '../electron/persistence'
import { RegulatorySourceTrail } from '../src/components/intel/RegulatorySourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const API_URL =
  'https://www.federalregister.gov/api/v1/documents.json?per_page=2&order=newest&fields%5B%5D=document_number'

const FIXTURE = {
  description: 'Search Results',
  count: 2,
  total_pages: 1,
  next_page_url: null,
  results: [
    {
      document_number: '2026-12647',
      title: 'Notice of Intent To Extend and Revise a Previously Approved Information Collection',
      type: 'Notice',
      agencies: [
        {
          raw_name: 'DEPARTMENT OF AGRICULTURE',
          name: 'Agriculture Department',
          id: 12,
          url: 'https://www.federalregister.gov/agencies/agriculture-department',
          json_url: 'https://www.federalregister.gov/api/v1/agencies/12',
          parent_id: null,
          slug: 'agriculture-department',
        },
        {
          raw_name: 'National Institute of Food and Agriculture',
          name: 'National Institute of Food and Agriculture',
          id: 350,
          parent_id: 12,
          slug: 'national-institute-of-food-and-agriculture',
        },
      ],
      publication_date: '2026-06-23',
      effective_on: null,
      comments_close_on: '2026-08-24',
      abstract: 'In accordance with the Paperwork Reduction Act, this notice invites comments.',
      html_url:
        'https://www.federalregister.gov/documents/2026/06/23/2026-12647/notice-of-intent-to-extend-and-revise-a-previously-approved-information-collection',
      pdf_url: 'https://www.govinfo.gov/content/pkg/FR-2026-06-23/pdf/2026-12647.pdf',
      raw_text_url: 'https://www.federalregister.gov/documents/full_text/text/2026/06/23/2026-12647.txt',
      body_html_url: 'https://www.federalregister.gov/documents/full_text/html/2026/06/23/2026-12647.html',
      citation: '91 FR 37379',
      action: 'Notice and request for comments.',
    },
    {
      // Malformed: no title and non-official document URL -> dropped, not repaired.
      document_number: 'bad',
      title: '',
      type: 'Rule',
      publication_date: '2026-06-23',
      html_url: 'https://example.com/not-federal-register',
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

describe('Federal Register adapter', () => {
  it('is public by default and refuses insecure overrides', () => {
    expect(readFederalRegisterConfig({})).not.toBeNull()
    expect(readFederalRegisterConfig({ ATLASZ_FEDERAL_REGISTER_DISABLE: '1' })).toBeNull()
    expect(readFederalRegisterConfig({ ATLASZ_FEDERAL_REGISTER_URL: 'http://insecure' })).toBeNull()
  })

  it('normalizes official API response shape with source trail proof fields', () => {
    const records = parseFederalRegisterDocuments(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })
    const events = normalizeFederalRegisterDocuments(records)
    const notice = events.find((event) => event.regulatoryDocument?.documentNumber === '2026-12647')

    expect(notice?.category).toBe('regulatory-document')
    expect(notice?.provenance).toBe('official-api')
    expect(notice?.confidence).toBe(96)
    expect(notice?.sourceId).toBe(FEDERAL_REGISTER_SOURCE_ID)
    expect(notice?.countryCodes).toEqual(['US'])
    expect(notice?.affectedAssets).toEqual([])
    expect(notice?.regulatoryDocument?.documentType).toBe('Notice')
    expect(notice?.regulatoryDocument?.agencies).toEqual([
      'Agriculture Department',
      'National Institute of Food and Agriculture',
    ])
    expect(notice?.regulatoryDocument?.publicationDate).toBe('2026-06-23')
    expect(notice?.regulatoryDocument?.commentEndDate).toBe('2026-08-24')
    expect(notice?.regulatoryDocument?.pdfUrl).toBe('https://www.govinfo.gov/content/pkg/FR-2026-06-23/pdf/2026-12647.pdf')
    expect(notice?.regulatoryDocument?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('drops malformed documents and fails closed on empty payloads', () => {
    expect(parseFederalRegisterDocuments(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL })).toHaveLength(1)
    expect(parseFederalRegisterDocuments(null)).toEqual([])
    expect(parseFederalRegisterDocuments({ results: [] })).toEqual([])
    expect(normalizeFederalRegisterDocuments([])).toEqual([])
  })

  it('links regulatory document -> issuing agency -> United States in the Evidence Graph', () => {
    const event = normalizeFederalRegisterDocuments(parseFederalRegisterDocuments(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    const graph = buildEntityGraph([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })
    const document = graph.nodes.find((node) => node.id === 'regulatory-document:2026-12647')!

    expect(document.kind).toBe('regulatory-document')
    expect(neighborsOf(graph, document.id).map((node) => `${node.relation}:${node.entity.kind}`)).toContain('issued_by:institution')
  })

  it('round-trips the regulatory sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-federal-register-'))
    dirs.push(dir)
    const event = normalizeFederalRegisterDocuments(parseFederalRegisterDocuments(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]

    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.regulatoryDocument)

    expect(restored?.regulatoryDocument?.documentNumber).toBe(event.regulatoryDocument?.documentNumber)
    expect(restored?.regulatoryDocument?.pdfUrl).toBe(event.regulatoryDocument?.pdfUrl)
    expect(restored?.regulatoryDocument?.rawPayloadHash).toBe(event.regulatoryDocument?.rawPayloadHash)
  })

  it('renders Federal Register source-trail cards only with proof fields', () => {
    const event = normalizeFederalRegisterDocuments(parseFederalRegisterDocuments(FIXTURE, { retrievedAt: NOW, sourceApiUrl: API_URL }))[0]
    const markup = renderToStaticMarkup(createElement(RegulatorySourceTrail, { events: [event as WorldIntelEvent] }))

    expect(markup).toContain('Federal Register')
    expect(markup).toContain('2026-12647')
    expect(markup).toContain('document source trail')
    expect(markup).toContain('official API URL')
    expect(markup).toContain('govinfo official PDF')
    expect(markup).toContain('96%')
  })

  it('surfaces HttpError via fetchPolicy on rate limits', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '4' : null) },
      json: async () => ({}),
    }))

    await expect(
      fetchFederalRegisterDocuments(new AbortController().signal, {
        documentsUrl: 'https://www.federalregister.gov/api/v1/documents.json',
        userAgent: 'Atlasz',
        lookbackDays: 14,
        maxRecords: 5,
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
        agencySlugs: ['securities-and-exchange-commission'],
        documentTypeCodes: ['RULE'],
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 4_000 })
  })

  it('starts narrow: defaults to the curated agency + document-type allowlist', () => {
    const config = readFederalRegisterConfig({})!
    expect(config.agencySlugs).toContain('securities-and-exchange-commission')
    expect(config.agencySlugs).toContain('federal-energy-regulatory-commission')
    expect(config.agencySlugs).toContain('homeland-security-department')
    // Every default slug must be a real, filterable FR agency (CISA publishes under DHS).
    expect(config.agencySlugs.every((slug) => /^[a-z0-9-]+$/.test(slug))).toBe(true)
    expect(config.documentTypeCodes).toEqual(['RULE', 'PRORULE', 'NOTICE', 'PRESDOCU'])
    // Env overrides are validated; junk is dropped, valid values kept.
    const overridden = readFederalRegisterConfig({
      ATLASZ_FEDERAL_REGISTER_AGENCIES: 'securities-and-exchange-commission, not a slug!, treasury-department',
      ATLASZ_FEDERAL_REGISTER_TYPES: 'RULE, BOGUS, presdocu',
    })!
    expect(overridden.agencySlugs).toEqual(['securities-and-exchange-commission', 'treasury-department'])
    expect(overridden.documentTypeCodes).toEqual(['RULE', 'PRESDOCU'])
  })

  it('builds a request URL that applies the agency + type narrowing', async () => {
    let capturedUrl = ''
    vi.stubGlobal('fetch', async (url: string) => {
      capturedUrl = String(url)
      return { ok: true, status: 200, json: async () => ({ results: [] }) }
    })
    await fetchFederalRegisterDocuments(new AbortController().signal, {
      documentsUrl: 'https://www.federalregister.gov/api/v1/documents.json',
      userAgent: 'Atlasz',
      lookbackDays: 7,
      maxRecords: 10,
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
      agencySlugs: ['securities-and-exchange-commission', 'energy-department'],
      documentTypeCodes: ['RULE', 'NOTICE'],
    })
    expect(capturedUrl).toContain('conditions%5Btype%5D%5B%5D=RULE')
    expect(capturedUrl).toContain('conditions%5Btype%5D%5B%5D=NOTICE')
    expect(capturedUrl).toContain('conditions%5Bagencies%5D%5B%5D=securities-and-exchange-commission')
    expect(capturedUrl).toContain('conditions%5Bagencies%5D%5B%5D=energy-department')
    expect(capturedUrl).toContain('conditions%5Bpublication_date%5D%5Bgte%5D=')
  })
})
