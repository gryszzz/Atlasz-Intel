/*
 * CISA cybersecurity / ICS advisories adapter.
 *
 * Uses the official CISA advisories RSS feed
 * (https://www.cisa.gov/cybersecurity-advisories/all.xml). Defensive advisory
 * intelligence only: no scanning, exploit logic, payloads, or person enrichment.
 *
 * Advisories cross-reference CVEs, so this deepens the existing vulnerability
 * graph: a CISA advisory referencing CVE-… attaches to the same CVE node as KEV,
 * NVD, GHSA, and OSV. Malformed items (no recognizable advisory ID / non-CISA
 * URL) are dropped, never repaired. HTTP/rate-limit failures surface via the
 * shared fetchPolicy (assertOk -> HttpError -> fetchWithRetry) so the ingest
 * layer shows DATA_UNAVAILABLE.
 *
 * provenance: official-api   category: cyber-advisory
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { CisaAdvisory, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'cisa_advisories_public'
const CISA_SOURCE_NAME = 'CISA Cybersecurity Advisories'
const DEFAULT_FEED_URL = 'https://www.cisa.gov/cybersecurity-advisories/all.xml'
const CISA_URL_PATTERN = /^https:\/\/(www\.)?cisa\.gov\//i
const CISA_ID_PATTERN =
  /\b(ICSA-\d{2}-\d{3}-\d{2}[A-Z]?|ICSMA-\d{2}-\d{3}-\d{2}[A-Z]?|AA\d{2}-\d{3}[A-Z]?|ICS-ALERT-\d{2}-\d{3}-\d{2}[A-Z]?)\b/i
const CVE_GLOBAL = /CVE-\d{4}-\d{4,}/gi
const DEFAULT_MAX_RECORDS = 40
const MAX_RECORDS_CAP = 100

export type CisaRawItem = {
  title: string
  link: string
  description?: string
  published?: string
  updated?: string
  cves?: string[]
  vendors?: string[]
  products?: string[]
}

export type CisaAdvisoryConfig = {
  feedUrl: string
  maxRecords: number
}

export function readCisaAdvisoryConfig(env: NodeJS.ProcessEnv = process.env): CisaAdvisoryConfig | null {
  if (env.ATLASZ_CISA_ADVISORIES_DISABLE === '1') {
    return null
  }
  const feedUrl = asString(env.ATLASZ_CISA_ADVISORIES_URL) || DEFAULT_FEED_URL
  if (!/^https:\/\//i.test(feedUrl)) {
    return null
  }
  const maxRecords = clampInteger(Number(env.ATLASZ_CISA_ADVISORIES_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP)
  return { feedUrl, maxRecords }
}

export async function fetchCisaAdvisories(
  signal: AbortSignal,
  config = readCisaAdvisoryConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const response = await fetch(config.feedUrl, { signal, headers: { accept: 'application/rss+xml, application/xml, text/xml' } })
  assertOk(response, 'CISA advisories')
  const xml = await response.text()
  const records = parseCisaAdvisories(xml, { retrievedAt: Date.now(), config })
  return normalizeCisaAdvisories(records)
}

/** Pure normalizer — accepts the feed XML string or a pre-parsed item array. */
export function parseCisaAdvisories(
  input: string | CisaRawItem[],
  options: { retrievedAt?: number; config?: Partial<CisaAdvisoryConfig> } = {},
): CisaAdvisory[] {
  const items = typeof input === 'string' ? parseCisaFeedXml(input) : input
  if (items.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxRecords = options.config?.maxRecords ?? DEFAULT_MAX_RECORDS
  const byId = new Map<string, CisaAdvisory>()

  for (const item of items) {
    const title = asString(item.title)
    const sourceUrl = asString(item.link)
    const advisoryId = extractAdvisoryId(title, sourceUrl)
    const published = asString(item.published)
    const updated = asString(item.updated)
    const publishedTimestamp = Date.parse(published)
    const updatedTimestamp = Date.parse(updated)

    if (!hasValidCisaAdvisory({ advisoryId, title, sourceUrl, publishedTimestamp, updatedTimestamp, retrievedAt })) {
      continue // Drop malformed items; never repair.
    }

    const summary = asString(item.description).replace(/\s+/g, ' ').slice(0, 600)
    const relatedCveIds = unique([
      ...extractCves(title),
      ...extractCves(item.description),
      ...(item.cves ?? []).map((cve) => cve.toUpperCase()).filter((cve) => /^CVE-\d{4}-\d{4,}$/.test(cve)),
    ])
    const vendors = unique((item.vendors ?? []).map(asString).filter(Boolean))
    const products = unique((item.products ?? []).map(asString).filter(Boolean))
    const references = unique([sourceUrl])
    const observedTimestamp = Number.isFinite(publishedTimestamp) ? publishedTimestamp : updatedTimestamp

    const rawRecord = {
      advisoryId,
      title,
      summary,
      relatedCveIds,
      vendors,
      products,
      references,
      published,
      updated,
      sourceUrl,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    byId.set(advisoryId, {
      id: cisaRecordId(advisoryId),
      advisoryId,
      title,
      summary,
      relatedCveIds,
      vendors,
      products,
      references,
      published,
      publishedTimestamp: Number.isFinite(publishedTimestamp) ? publishedTimestamp : undefined,
      updated,
      updatedTimestamp: Number.isFinite(updatedTimestamp) ? updatedTimestamp : undefined,
      observedTimestamp: Number.isFinite(observedTimestamp) ? observedTimestamp : retrievedAt,
      sourceUrl,
      sourceName: CISA_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForCisaAdvisory({ advisoryId, title, sourceUrl, publishedTimestamp, updatedTimestamp, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  return [...byId.values()].sort((a, b) => b.observedTimestamp - a.observedTimestamp).slice(0, maxRecords)
}

export function normalizeCisaAdvisories(records: CisaAdvisory[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

/** Minimal, defensive RSS 2.0 parser (handles CDATA). */
export function parseCisaFeedXml(xml: string): CisaRawItem[] {
  if (typeof xml !== 'string' || !/<item[\s>]/i.test(xml)) {
    return []
  }
  const items: CisaRawItem[] = []
  for (const chunk of xml.split(/<item[\s>]/i).slice(1)) {
    const block = chunk.split(/<\/item>/i)[0] ?? ''
    const title = tag(block, 'title')
    const link = tag(block, 'link') || tag(block, 'guid')
    if (!title || !link) continue
    items.push({
      title,
      link,
      description: tag(block, 'description'),
      published: tag(block, 'pubDate') || tag(block, 'published'),
      updated: tag(block, 'updated') || tag(block, 'lastBuildDate'),
    })
  }
  return items
}

function toEvent(record: CisaAdvisory): WorldIntelEvent {
  const dedupeKey = `cisa-advisory|${record.advisoryId}`.toLowerCase()
  const cveNote = record.relatedCveIds.length > 0 ? ` References ${record.relatedCveIds.slice(0, 6).join(', ')}.` : ''
  const summary =
    `CISA advisory ${record.advisoryId}${record.published ? ` published ${record.published.slice(0, 16)}` : ''}: ${record.title}.` +
    `${cveNote} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: record.title.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observedTimestamp,
    category: 'cyber-advisory',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique([
      'CISA Advisory',
      'CISA',
      advisoryFamily(record.advisoryId),
      ...record.relatedCveIds,
      ...record.vendors,
    ]),
    extractedEntities: unique([record.advisoryId, ...record.relatedCveIds, ...record.vendors, ...record.products]),
  })

  return {
    ...event,
    confidence: record.confidence,
    cisaAdvisory: record,
  }
}

function extractAdvisoryId(title: string, link: string): string {
  const fromTitle = title.match(CISA_ID_PATTERN)
  if (fromTitle) return fromTitle[0].toUpperCase()
  const fromLink = link.match(CISA_ID_PATTERN)
  if (fromLink) return fromLink[0].toUpperCase()
  return ''
}

function advisoryFamily(advisoryId: string): string {
  if (advisoryId.startsWith('ICSMA')) return 'ICS Medical advisory'
  if (advisoryId.startsWith('ICSA')) return 'ICS advisory'
  if (advisoryId.startsWith('ICS-ALERT')) return 'ICS alert'
  if (/^AA\d/.test(advisoryId)) return 'Cybersecurity advisory'
  return 'Advisory'
}

function extractCves(value: unknown): string[] {
  const text = asString(value)
  if (!text) return []
  return unique((text.match(CVE_GLOBAL) ?? []).map((cve) => cve.toUpperCase()))
}

function hasValidCisaAdvisory(input: {
  advisoryId: string
  title: string
  sourceUrl: string
  publishedTimestamp: number
  updatedTimestamp: number
  retrievedAt: number
}): boolean {
  return Boolean(
    input.advisoryId &&
      input.title &&
      CISA_URL_PATTERN.test(input.sourceUrl) &&
      (Number.isFinite(input.publishedTimestamp) || Number.isFinite(input.updatedTimestamp)) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForCisaAdvisory(input: {
  advisoryId: string
  title: string
  sourceUrl: string
  publishedTimestamp: number
  updatedTimestamp: number
  retrievedAt: number
}): number {
  return hasValidCisaAdvisory(input) ? 96 : 60
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))
  if (!match) return ''
  return decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim()
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function cisaRecordId(advisoryId: string): string {
  return `${SOURCE_ID}:${advisoryId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const CISA_ADVISORIES_SOURCE_ID = SOURCE_ID
