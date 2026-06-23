import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  OFAC_SANCTIONS_SOURCE_ID,
  applyOfacChangeStatus,
  fetchOfacSanctions,
  normalizeOfacSanctions,
  parseOfacSdnXml,
  readOfacSanctionsConfig,
} from '../electron/osint/adapters/ofacSanctionsAdapter'
import { createPersistence } from '../electron/persistence'
import { OfacSourceTrail } from '../src/components/intel/OfacSourceTrail'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { eventStructuralExposure, isEventResolvable } from '../src/engine/entityResolver'
import type { WorldIntelEvent } from '../src/worldIntel'

const NOW = Date.parse('2026-06-23T12:00:00Z')
const SOURCE_DATA_URL = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML'

const XML_FIXTURE = `<?xml version="1.0" standalone="yes"?>
<sdnList xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML">
  <publshInformation>
    <Publish_Date>06/22/2026</Publish_Date>
    <Record_Count>19082</Record_Count>
  </publshInformation>
  <sdnEntry>
    <uid>36</uid>
    <lastName>AEROCARIBBEAN AIRLINES</lastName>
    <sdnType>Entity</sdnType>
    <programList>
      <program>CUBA</program>
    </programList>
    <akaList>
      <aka>
        <uid>12</uid>
        <type>a.k.a.</type>
        <category>strong</category>
        <lastName>AERO-CARIBBEAN</lastName>
      </aka>
    </akaList>
    <addressList>
      <address>
        <uid>25</uid>
        <city>Havana</city>
        <country>Cuba</country>
      </address>
    </addressList>
  </sdnEntry>
  <sdnEntry>
    <uid>306</uid>
    <lastName>BANCO NACIONAL DE CUBA</lastName>
    <sdnType>Entity</sdnType>
    <programList>
      <program>CUBA</program>
    </programList>
    <addressList>
      <address>
        <uid>199</uid>
        <country>Switzerland</country>
      </address>
      <address>
        <uid>200</uid>
        <country>Spain</country>
      </address>
    </addressList>
  </sdnEntry>
  <sdnEntry>
    <uid>bad</uid>
    <lastName></lastName>
    <sdnType>Entity</sdnType>
    <programList><program>TEST</program></programList>
  </sdnEntry>
</sdnList>`

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('OFAC sanctions adapter', () => {
  it('is public by default and refuses insecure overrides', () => {
    expect(readOfacSanctionsConfig({})).not.toBeNull()
    expect(readOfacSanctionsConfig({ ATLASZ_OFAC_DISABLE: '1' })).toBeNull()
    expect(readOfacSanctionsConfig({ ATLASZ_OFAC_SDN_XML_URL: 'http://insecure' })).toBeNull()
  })

  it('parses SDN.XML records with official-api provenance, UID, programs, countries, aliases, and source proof', () => {
    const parsed = parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL })
    const records = parsed.records
    const events = normalizeOfacSanctions(records)
    const airline = events.find((event) => event.ofacSanctionsRecord?.uid === '36')

    expect(parsed.publishDate).toBe('2026-06-22')
    expect(parsed.recordCount).toBe(19082)
    expect(records).toHaveLength(2)
    expect(airline?.category).toBe('sanctions')
    expect(airline?.provenance).toBe('official-api')
    expect(airline?.confidence).toBe(96)
    expect(airline?.sourceId).toBe(OFAC_SANCTIONS_SOURCE_ID)
    expect(airline?.affectedAssets).toEqual([])
    expect(airline?.ofacSanctionsRecord?.name).toBe('AEROCARIBBEAN AIRLINES')
    expect(airline?.ofacSanctionsRecord?.entityType).toBe('Entity')
    expect(airline?.ofacSanctionsRecord?.programs).toEqual(['CUBA'])
    expect(airline?.ofacSanctionsRecord?.countries).toEqual(['Cuba'])
    expect(airline?.ofacSanctionsRecord?.aliases).toEqual(['AERO-CARIBBEAN'])
    expect(airline?.ofacSanctionsRecord?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(airline?.ofacSanctionsRecord?.rawPayloadJson ?? '').toContain('rawEntryXml')
  })

  it('drops malformed records and fails closed on empty payloads', () => {
    expect(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records.find((record) => record.uid === 'bad')).toBeUndefined()
    expect(parseOfacSdnXml('', { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records).toEqual([])
    expect(normalizeOfacSanctions([])).toEqual([])
  })

  it('classifies local daily change status using stable UID and raw entry hash', () => {
    const event = normalizeOfacSanctions(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records)[0]
    const firstSeen = applyOfacChangeStatus(event)
    expect(firstSeen.ofacSanctionsRecord?.changeStatus).toBe('new')

    const unchanged = applyOfacChangeStatus(event, firstSeen)
    expect(unchanged.ofacSanctionsRecord?.changeStatus).toBe('unchanged')
    expect(unchanged.timestamp).toBe(firstSeen.timestamp)

    const previous = {
      ...firstSeen,
      ofacSanctionsRecord: { ...firstSeen.ofacSanctionsRecord!, rawPayloadHash: 'b'.repeat(64) },
    }
    const updated = applyOfacChangeStatus(event, previous)
    expect(updated.ofacSanctionsRecord?.changeStatus).toBe('updated')
  })

  it('links sanctions record -> OFAC -> United States, program, and listed countries in the Evidence Graph', () => {
    const event = applyOfacChangeStatus(normalizeOfacSanctions(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records)[0])
    const graph = buildEntityGraph([{ ...event, timestamp: NOW - 60_000 }], { now: NOW })
    const record = graph.nodes.find((node) => node.id === 'sanctions-record:ofac-sdn-36')!

    expect(record.kind).toBe('sanctions-record')
    const relations = neighborsOf(graph, record.id).map((node) => `${node.relation}:${node.entity.kind}:${node.entity.label}`)
    expect(relations).toContain('issued_by:institution:Treasury OFAC')
    expect(relations).toContain('references:sanctions-program:CUBA')
    expect(relations).toContain('touches:country:Cuba')
  })

  it('round-trips the OFAC sanctions sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-ofac-'))
    dirs.push(dir)
    const event = applyOfacChangeStatus(normalizeOfacSanctions(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records)[0])

    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((candidate) => candidate.ofacSanctionsRecord)

    expect(restored?.ofacSanctionsRecord?.uid).toBe(event.ofacSanctionsRecord?.uid)
    expect(restored?.ofacSanctionsRecord?.programs).toEqual(['CUBA'])
    expect(restored?.ofacSanctionsRecord?.rawPayloadHash).toBe(event.ofacSanctionsRecord?.rawPayloadHash)
  })

  it('renders OFAC source-trail cards only with proof fields', () => {
    const event = applyOfacChangeStatus(normalizeOfacSanctions(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records)[0])
    const markup = renderToStaticMarkup(createElement(OfacSourceTrail, { events: [event as WorldIntelEvent] }))

    expect(markup).toContain('OFAC SDN')
    expect(markup).toContain('UID 36')
    expect(markup).toContain('AEROCARIBBEAN AIRLINES')
    expect(markup).toContain('OFAC source trail')
    expect(markup).toContain('official SDN XML')
    expect(markup).toContain('new')
    expect(markup).toContain('96%')
  })

  it('surfaces HttpError via fetchPolicy on rate limits (fail-closed when retries exhausted)', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 429,
      headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '5' : null) },
      text: async () => '',
    }))

    await expect(
      fetchOfacSanctions(new AbortController().signal, {
        sdnXmlUrl: SOURCE_DATA_URL,
        userAgent: 'Atlasz',
        maxRecords: 5,
        timeoutMs: 1_000,
        maxRetries: 0,
        backoffMs: 0,
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterMs: 5_000 })
  })

  it('honors 429 Retry-After then retries and succeeds (shared fetchWithRetry path)', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async () => {
      calls += 1
      if (calls === 1) {
        return {
          ok: false,
          status: 429,
          // Retry-After of 0s must win over the (large) backoff below — proving it is honored.
          headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? '0' : null) },
          text: async () => '',
        }
      }
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => XML_FIXTURE }
    })

    const events = await fetchOfacSanctions(new AbortController().signal, {
      sdnXmlUrl: SOURCE_DATA_URL,
      userAgent: 'Atlasz',
      maxRecords: 5,
      timeoutMs: 1_000,
      maxRetries: 1,
      backoffMs: 50_000,
    })

    expect(calls).toBe(2)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]?.ofacSanctionsRecord?.uid).toBe('36')
  })

  it('never persists the redirected/presigned S3 URL — sourceDataUrl stays the clean Treasury URL', async () => {
    // Simulate Treasury's 302 -> presigned S3: fetch (which follows redirects) returns the
    // XML body; the adapter must record only the configured Treasury URL, never the S3 one.
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => XML_FIXTURE }))

    const events = await fetchOfacSanctions(new AbortController().signal, {
      sdnXmlUrl: SOURCE_DATA_URL,
      userAgent: 'Atlasz',
      maxRecords: 5,
      timeoutMs: 1_000,
      maxRetries: 0,
      backoffMs: 0,
    })
    const record = events[0]?.ofacSanctionsRecord
    expect(record?.sourceDataUrl).toBe(SOURCE_DATA_URL)
    expect(record?.sourceDataUrl).not.toMatch(/amazonaws|X-Amz|s3/i)
    expect(record?.rawPayloadJson ?? '').not.toMatch(/amazonaws|X-Amz/i)
  })

  it('never resolves a sanctions record into curated company exposure (no inferred guilt/exposure)', () => {
    const event = applyOfacChangeStatus(normalizeOfacSanctions(parseOfacSdnXml(XML_FIXTURE, { retrievedAt: NOW, sourceDataUrl: SOURCE_DATA_URL }).records)[0])
    // A listed name must stay sanctions-list evidence — never a resolver-driven
    // exposure edge to a curated company/sector (which would imply inferred risk).
    expect(event.affectedAssets).toEqual([])
    expect(isEventResolvable(event)).toBe(false)
    expect(eventStructuralExposure(event)).toEqual([])
  })
})
