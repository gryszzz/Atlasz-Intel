/*
 * Treasury OFAC SDN sanctions adapter.
 *
 * Uses the official OFAC Sanctions List Service export:
 * https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML
 *
 * Real records only. No sanctions screening, fuzzy matching, guilt/risk labels,
 * person enrichment, or inferred company exposure. We retain source-published
 * entity/program/country/alias fields only, stable OFAC UIDs, a raw entry hash,
 * and local change status (new/updated/unchanged) by comparing the stable UID +
 * raw payload hash against the local persisted event.
 *
 * provenance: official-api   category: sanctions
 */
import {
  adapterEventId,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { OfacSanctionsRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'ofac_sdn_public'
const SOURCE_NAME = 'Treasury OFAC SDN List'
const DEFAULT_SDN_XML_URL = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML'
const OFAC_SDN_PAGE = 'https://sanctionslist.ofac.treas.gov/Home/SdnList'
const DEFAULT_USER_AGENT = 'Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)'
const DEFAULT_MAX_RECORDS = 40
const MAX_RECORDS_CAP = 250
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type OfacSanctionsConfig = {
  sdnXmlUrl: string
  userAgent: string
  maxRecords: number
}

type ParsedSdnXml = {
  publishDate: string
  publishTimestamp: number
  recordCount?: number
  records: OfacSanctionsRecord[]
}

export function readOfacSanctionsConfig(env: NodeJS.ProcessEnv = process.env): OfacSanctionsConfig | null {
  if (env.ATLASZ_OFAC_DISABLE === '1') {
    return null
  }
  const sdnXmlUrl = stringValue(env.ATLASZ_OFAC_SDN_XML_URL) || DEFAULT_SDN_XML_URL
  if (!/^https:\/\//i.test(sdnXmlUrl)) {
    return null
  }
  return {
    sdnXmlUrl,
    userAgent: stringValue(env.ATLASZ_OFAC_USER_AGENT) || stringValue(env.ATLASZ_HTTP_USER_AGENT) || DEFAULT_USER_AGENT,
    maxRecords: clampInteger(Number(env.ATLASZ_OFAC_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP),
  }
}

export async function fetchOfacSanctions(
  signal: AbortSignal,
  config = readOfacSanctionsConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const response = await fetch(config.sdnXmlUrl, {
    signal,
    headers: { accept: 'application/xml, text/xml', 'user-agent': config.userAgent },
  })
  assertOk(response, 'OFAC SDN')
  const xml = await response.text()
  const parsed = parseOfacSdnXml(xml, { retrievedAt: Date.now(), sourceDataUrl: config.sdnXmlUrl, maxRecords: config.maxRecords })
  return normalizeOfacSanctions(parsed.records)
}

/** Pure normalizer — testable with fixture SDN.XML payloads. */
export function parseOfacSdnXml(
  xml: string,
  options: { retrievedAt?: number; sourceDataUrl?: string; maxRecords?: number } = {},
): ParsedSdnXml {
  if (!xml || !/<sdnList\b/i.test(xml)) {
    return { publishDate: '', publishTimestamp: 0, records: [] }
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceDataUrl = options.sourceDataUrl ?? DEFAULT_SDN_XML_URL
  const maxRecords = options.maxRecords ?? DEFAULT_MAX_RECORDS
  const publishInfo = firstTag(xml, 'publshInformation')
  const publishDate = normalizeUsDate(textOf(publishInfo, 'Publish_Date'))
  const publishTimestamp = publishDate ? Date.parse(`${publishDate}T00:00:00Z`) : 0
  const recordCount = numberValue(textOf(publishInfo, 'Record_Count'))
  const out: OfacSanctionsRecord[] = []

  for (const entryXml of eachTag(xml, 'sdnEntry')) {
    const uid = textOf(entryXml, 'uid')
    const entityType = textOf(entryXml, 'sdnType')
    const name = publishedName(entryXml)
    const programs = unique(eachTag(firstTag(entryXml, 'programList'), 'program').map((program) => decodeXml(program)))
    const countries = unique(eachTag(firstTag(entryXml, 'addressList'), 'address').map((address) => textOf(address, 'country'))).slice(0, 12)
    const aliases = extractAliases(entryXml)
    const rawPayloadJson = stableStringify({ rawEntryXml: entryXml })
    const rawPayloadHash = sha256(entryXml)

    if (
      !hasValidOfacRecord({
        uid,
        name,
        entityType,
        publishDate,
        publishTimestamp,
        sourceDataUrl,
        retrievedAt,
        rawPayloadHash,
      })
    ) {
      continue
    }

    out.push({
      id: ofacRecordId(uid),
      uid,
      listType: 'SDN',
      name,
      entityType,
      programs,
      countries,
      aliases,
      publishDate,
      publishTimestamp,
      recordCount,
      sourceUrl: OFAC_SDN_PAGE,
      sourceDataUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForOfacRecord({
        uid,
        name,
        entityType,
        publishDate,
        publishTimestamp,
        sourceDataUrl,
        retrievedAt,
        rawPayloadHash,
      }),
      changeStatus: 'observed',
      rawPayloadHash,
      rawPayloadJson,
    })
  }

  out.sort((left, right) => Number(left.uid) - Number(right.uid))
  return { publishDate, publishTimestamp, recordCount, records: out.slice(0, maxRecords) }
}

export function normalizeOfacSanctions(records: OfacSanctionsRecord[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

export function applyOfacChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.ofacSanctionsRecord) {
    return event
  }
  const prior = previous?.ofacSanctionsRecord
  const changeStatus = !prior ? 'new' : prior.rawPayloadHash === event.ofacSanctionsRecord.rawPayloadHash ? 'unchanged' : 'updated'
  const timestamp = changeStatus === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return {
    ...event,
    timestamp,
    ofacSanctionsRecord: { ...event.ofacSanctionsRecord, changeStatus },
  }
}

function toEvent(record: OfacSanctionsRecord): WorldIntelEvent {
  const dedupeKey = `ofac-sdn|${record.uid}`.toLowerCase()
  const programNote = record.programs.length > 0 ? ` Programs: ${record.programs.slice(0, 5).join(', ')}.` : ''
  const countryNote = record.countries.length > 0 ? ` Countries listed: ${record.countries.slice(0, 5).join(', ')}.` : ''
  const summary = `OFAC SDN record ${record.uid} (${record.entityType}) published in the ${record.publishDate} SDN export: ${record.name}.${programNote}${countryNote} This is source-published sanctions-list evidence, not a screening match or inferred guilt label.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `OFAC SDN — ${record.name}`.slice(0, 160),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.publishTimestamp,
    category: 'sanctions',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: { uid: record.uid, rawPayloadHash: record.rawPayloadHash },
    affectedAssets: [],
    narrativeTags: unique(['OFAC', 'SDN', record.entityType, ...record.programs, ...record.countries]),
    extractedEntities: unique([record.uid, record.name, ...record.aliases, ...record.programs, ...record.countries]),
  })

  return {
    ...event,
    region: record.countries[0] ?? 'OFAC SDN',
    severity: 'watch',
    confidence: record.confidence,
    rawPayloadHash: record.rawPayloadHash,
    ofacSanctionsRecord: record,
  }
}

function publishedName(entryXml: string): string {
  return unique([textOf(entryXml, 'firstName'), textOf(entryXml, 'lastName')]).join(' ') || textOf(entryXml, 'lastName')
}

function extractAliases(entryXml: string): string[] {
  const aliasList = firstTag(entryXml, 'akaList')
  const aliases: string[] = []
  for (const akaXml of eachTag(aliasList, 'aka')) {
    const alias = unique([textOf(akaXml, 'firstName'), textOf(akaXml, 'lastName')]).join(' ') || textOf(akaXml, 'lastName')
    if (alias) aliases.push(alias)
  }
  return unique(aliases).slice(0, 12)
}

function hasValidOfacRecord(input: {
  uid: string
  name: string
  entityType: string
  publishDate: string
  publishTimestamp: number
  sourceDataUrl: string
  retrievedAt: number
  rawPayloadHash: string
}): boolean {
  return Boolean(
    /^\d+$/.test(input.uid) &&
      input.name &&
      input.entityType &&
      ISO_DATE_PATTERN.test(input.publishDate) &&
      Number.isFinite(input.publishTimestamp) &&
      /^https:\/\/sanctionslistservice\.ofac\.treas\.gov\/api\/PublicationPreview\/exports\/SDN\.XML$/i.test(input.sourceDataUrl) &&
      Number.isFinite(input.retrievedAt) &&
      /^[a-f0-9]{64}$/.test(input.rawPayloadHash),
  )
}

function confidenceForOfacRecord(input: Parameters<typeof hasValidOfacRecord>[0]): number {
  return hasValidOfacRecord(input) ? 96 : 60
}

function firstTag(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)
  return match?.[1] ?? ''
}

function eachTag(xml: string, tag: string): string[] {
  if (!xml) return []
  return [...xml.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((match) => match[1] ?? '')
}

function textOf(xml: string, tag: string): string {
  return decodeXml(firstTag(xml, tag)).trim()
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeUsDate(value: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  if (!match) return ''
  const [, month, day, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function numberValue(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function ofacRecordId(uid: string): string {
  return `${SOURCE_ID}:${uid}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const OFAC_SANCTIONS_SOURCE_ID = SOURCE_ID
