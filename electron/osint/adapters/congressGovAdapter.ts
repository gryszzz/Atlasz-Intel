/*
 * Congress.gov legislative events adapter.
 *
 * Uses the official Congress.gov API:
 * https://api.congress.gov/
 *
 * Real bills/actions only. Uses the official api.data.gov DEMO_KEY by default;
 * ATLASZ_CONGRESS_API_KEY is an optional quota upgrade. The key is used only on
 * the request URL and is never persisted in source trails or raw payload JSON.
 * No political interpretation, no inferred company exposure, and no person
 * enrichment beyond source-published sponsor names retained for bill provenance
 * context.
 *
 * provenance: official-api   category: legislation
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { CongressBillAction, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'congress_gov_public'
const SOURCE_NAME = 'Congress.gov API'
const DEFAULT_BILL_URL = 'https://api.congress.gov/v3/bill'
const DEFAULT_MAX_RECORDS = 20
const MAX_RECORDS_CAP = 100
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_API_KEY = 'DEMO_KEY'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const OFFICIAL_API_PATTERN = /^https:\/\/api\.congress\.gov\/v3\/bill\//
const OFFICIAL_WEB_PATTERN = /^https:\/\/www\.congress\.gov\/bill\//

export type CongressGovConfig = {
  billUrl: string
  apiKey: string
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readCongressGovConfig(env: NodeJS.ProcessEnv = process.env): CongressGovConfig | null {
  if (env.ATLASZ_CONGRESS_DISABLE === '1') {
    return null
  }
  const apiKey = asString(env.ATLASZ_CONGRESS_API_KEY) || DEFAULT_API_KEY
  const billUrl = asString(env.ATLASZ_CONGRESS_BILL_URL) || DEFAULT_BILL_URL
  if (!/^https:\/\//i.test(billUrl)) {
    return null
  }
  return {
    billUrl,
    apiKey,
    maxRecords: clampInteger(Number(env.ATLASZ_CONGRESS_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_CONGRESS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_CONGRESS_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_CONGRESS_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchCongressGovBills(
  signal: AbortSignal,
  config = readCongressGovConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const retrievedAt = Date.now()
  const requestUrl = buildRequestUrl(config)
  const sourceApiUrl = sanitizeUrl(requestUrl)
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchCongressJson(requestUrl, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseCongressGovBills(payload, { retrievedAt, sourceApiUrl })
  return normalizeCongressGovBills(records)
}

async function fetchCongressJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  })
  assertOk(response, 'Congress.gov')
  return response.json() as Promise<unknown>
}

/** Pure normalizer — testable with official Congress.gov API response fixtures. */
export function parseCongressGovBills(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string } = {},
): CongressBillAction[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { bills?: unknown }).bills
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const requestSourceUrl = sanitizeUrl(options.sourceApiUrl ?? DEFAULT_BILL_URL)
  const out: CongressBillAction[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const record = row as Record<string, unknown>
    const congress = numberValue(record.congress)
    const billType = normalizeBillType(asString(record.type))
    const billNumber = asString(record.number)
    const title = collapse(asString(record.title)).slice(0, 500)
    const latestAction = asRecord(record.latestAction)
    const latestActionDate = asString(latestAction?.actionDate)
    const latestActionText = collapse(asString(latestAction?.text)).slice(0, 800)
    const latestActionTimestamp = Date.parse(`${latestActionDate}T00:00:00Z`)
    const introducedDate = validDate(asString(record.introducedDate))
    const introducedTimestamp = introducedDate ? Date.parse(`${introducedDate}T00:00:00Z`) : undefined
    const policyArea = extractPolicyArea(record.policyArea)
    const sponsors = extractSponsors(record.sponsors)
    const committees = extractCommittees(record.committees)
    const sourceApiUrl = detailApiUrl(congress, billType, billNumber, requestSourceUrl)
    const officialUrl = officialBillUrl(congress, billType, billNumber)
    const actionHashPayload = {
      congress,
      billType,
      billNumber,
      latestActionDate,
      latestActionText,
    }
    const rawPayloadHash = sha256(stableStringify(actionHashPayload))
    const rawPayloadJson = stableStringify({
      congress,
      billType,
      billNumber,
      title,
      introducedDate,
      latestActionDate,
      latestActionText,
      policyArea,
      sponsors,
      committees,
      sourceApiUrl,
      officialUrl,
      updateDate: asString(record.updateDate),
      updateDateIncludingText: asString(record.updateDateIncludingText),
    })

    if (
      !hasValidBillAction({
        congress,
        billType,
        billNumber,
        title,
        latestActionDate,
        latestActionTimestamp,
        latestActionText,
        sourceApiUrl,
        officialUrl,
        retrievedAt,
        rawPayloadHash,
      })
    ) {
      continue
    }

    const validCongress = congress as number
    out.push({
      id: congressBillId(validCongress, billType, billNumber),
      congress: validCongress,
      billType,
      billNumber,
      title,
      introducedDate,
      introducedTimestamp,
      latestActionDate,
      latestActionTimestamp,
      latestActionText,
      policyArea,
      sponsors,
      committees,
      officialUrl,
      sourceApiUrl,
      sourceName: SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForBillAction({
        congress,
        billType,
        billNumber,
        title,
        latestActionDate,
        latestActionTimestamp,
        latestActionText,
        sourceApiUrl,
        officialUrl,
        retrievedAt,
        rawPayloadHash,
      }),
      changeType: 'observed',
      rawPayloadHash,
      rawPayloadJson,
    })
  }

  out.sort((left, right) => right.latestActionTimestamp - left.latestActionTimestamp || left.id.localeCompare(right.id))
  return out
}

export function normalizeCongressGovBills(records: CongressBillAction[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

export function applyCongressBillChangeStatus(event: WorldIntelEvent, previous?: WorldIntelEvent): WorldIntelEvent {
  if (!event.congressBillAction) {
    return event
  }
  const prior = previous?.congressBillAction
  const changeType = !prior ? 'new' : prior.rawPayloadHash === event.congressBillAction.rawPayloadHash ? 'unchanged' : 'updated'
  const timestamp = changeType === 'unchanged' && previous ? previous.timestamp : event.timestamp
  return {
    ...event,
    timestamp,
    congressBillAction: { ...event.congressBillAction, changeType },
  }
}

function toEvent(record: CongressBillAction): WorldIntelEvent {
  const dedupeKey = `congress|${record.congress}|${record.billType}|${record.billNumber}`.toLowerCase()
  const policyNote = record.policyArea ? ` Policy area: ${record.policyArea}.` : ''
  const committeeNote = record.committees.length > 0 ? ` Committee: ${record.committees.slice(0, 2).join(', ')}.` : ''
  const summary = `${record.billType} ${record.billNumber} latest action on ${record.latestActionDate}: ${record.latestActionText}.${policyNote}${committeeNote} This is source-published legislative action metadata, not political interpretation or inferred company exposure.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.billType} ${record.billNumber} — ${record.title}`.slice(0, 160),
    summary,
    source: record.sourceName,
    url: record.officialUrl,
    observedAt: record.latestActionTimestamp,
    category: 'legislation',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: { congress: record.congress, billType: record.billType, billNumber: record.billNumber, rawPayloadHash: record.rawPayloadHash },
    affectedAssets: [],
    narrativeTags: unique(['Congress.gov', 'legislation', record.billType, record.policyArea ?? '', ...record.committees]),
    extractedEntities: unique([`${record.billType} ${record.billNumber}`, record.policyArea ?? '', ...record.committees, ...record.sponsors]),
  })

  return {
    ...event,
    countryCodes: ['US'],
    region: 'United States',
    severity: 'watch',
    confidence: record.confidence,
    rawPayloadHash: record.rawPayloadHash,
    congressBillAction: record,
  }
}

function buildRequestUrl(config: CongressGovConfig): string {
  const url = new URL(config.billUrl)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(config.maxRecords))
  url.searchParams.set('api_key', config.apiKey)
  return url.toString()
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value)
    url.searchParams.delete('api_key')
    return url.toString()
  } catch {
    return value
  }
}

function detailApiUrl(congress: number | undefined, billType: string, billNumber: string, fallback: string): string {
  if (!Number.isFinite(congress) || !billType || !billNumber) return sanitizeUrl(fallback)
  const url = new URL(`${DEFAULT_BILL_URL}/${congress}/${billType.toLowerCase()}/${encodeURIComponent(billNumber)}`)
  url.searchParams.set('format', 'json')
  return url.toString()
}

function officialBillUrl(congress: number | undefined, billType: string, billNumber: string): string {
  if (typeof congress !== 'number' || !Number.isFinite(congress) || !billType || !billNumber) return ''
  const validCongress = congress
  return `https://www.congress.gov/bill/${validCongress}${ordinalSuffix(validCongress)}-congress/${billPathSegment(billType)}/${encodeURIComponent(billNumber)}`
}

function billPathSegment(billType: string): string {
  const map: Record<string, string> = {
    HR: 'house-bill',
    S: 'senate-bill',
    HJRES: 'house-joint-resolution',
    SJRES: 'senate-joint-resolution',
    HCONRES: 'house-concurrent-resolution',
    SCONRES: 'senate-concurrent-resolution',
    HRES: 'house-resolution',
    SRES: 'senate-resolution',
  }
  return map[billType] ?? `${billType.toLowerCase()}-bill`
}

function ordinalSuffix(value: number): string {
  const abs = Math.abs(Math.trunc(value))
  const v = abs % 100
  if (v >= 11 && v <= 13) return 'th'
  switch (abs % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

function extractPolicyArea(value: unknown): string | undefined {
  const record = asRecord(value)
  const name = asString(record?.name) || asString(value)
  return name || undefined
}

function extractSponsors(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names: string[] = []
  for (const item of value) {
    const record = asRecord(item)
    const name = asString(record?.fullName)
    if (name) names.push(name)
  }
  return unique(names).slice(0, 5)
}

function extractCommittees(value: unknown): string[] {
  const out: string[] = []
  const collect = (entry: unknown) => {
    const record = asRecord(entry)
    const name = asString(record?.name)
    if (name) out.push(name)
  }
  if (Array.isArray(value)) {
    value.forEach(collect)
  } else {
    const record = asRecord(value)
    if (Array.isArray(record?.items)) record.items.forEach(collect)
  }
  return unique(out).slice(0, 8)
}

function hasValidBillAction(input: {
  congress: number | undefined
  billType: string
  billNumber: string
  title: string
  latestActionDate: string
  latestActionTimestamp: number
  latestActionText: string
  sourceApiUrl: string
  officialUrl: string
  retrievedAt: number
  rawPayloadHash: string
}): boolean {
  return Boolean(
    Number.isInteger(input.congress) &&
      (input.congress ?? 0) >= 1 &&
      input.billType &&
      input.billNumber &&
      input.title &&
      ISO_DATE_PATTERN.test(input.latestActionDate) &&
      Number.isFinite(input.latestActionTimestamp) &&
      input.latestActionText &&
      OFFICIAL_API_PATTERN.test(input.sourceApiUrl) &&
      !/api_key=/i.test(input.sourceApiUrl) &&
      OFFICIAL_WEB_PATTERN.test(input.officialUrl) &&
      Number.isFinite(input.retrievedAt) &&
      /^[a-f0-9]{64}$/.test(input.rawPayloadHash),
  )
}

function confidenceForBillAction(input: Parameters<typeof hasValidBillAction>[0]): number {
  return hasValidBillAction(input) ? 96 : 60
}

function numberValue(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function normalizeBillType(value: string): string {
  return value.replace(/\./g, '').replace(/\s+/g, '').toUpperCase()
}

function validDate(value: string): string | undefined {
  return ISO_DATE_PATTERN.test(value) ? value : undefined
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function congressBillId(congress: number | undefined, billType: string, billNumber: string): string {
  return `${SOURCE_ID}:${congress}:${billType.toLowerCase()}:${billNumber.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, child: AbortSignal): AbortSignal {
  if (parent.aborted) return parent
  if (child.aborted) return child
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  child.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export const CONGRESS_GOV_SOURCE_ID = SOURCE_ID
