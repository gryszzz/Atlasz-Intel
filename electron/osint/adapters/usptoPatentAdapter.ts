/*
 * USPTO patents adapter (via PatentsView).
 *
 * Uses the official USPTO-funded PatentsView API (https://search.patentsview.org).
 * Config-gated: requires ATLASZ_PATENTSVIEW_API_KEY, sent ONLY as an X-Api-Key
 * header — never placed in any persisted URL or source trail. Fail-closed without
 * a key.
 *
 * Patent intelligence only: assignee ORGANIZATIONS (companies) and classifications
 * — NO inventor/person data is collected. No fake patents, no invented ownership.
 * Malformed records are dropped, never repaired. HTTP/rate-limit failures surface
 * via the shared fetchPolicy (assertOk -> HttpError -> fetchWithRetry).
 *
 * Defaults to a curated assignee allowlist (the seed companies) so granted patents
 * connect to existing company/technology nodes; override with ATLASZ_PATENTSVIEW_ASSIGNEES.
 *
 * provenance: official-api   category: patent
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
import type { PatentRecord, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'uspto_patentsview_public'
const PATENT_SOURCE_NAME = 'USPTO (PatentsView)'
const API_BASE = 'https://search.patentsview.org/api/v1/patent/'
const GOOGLE_PATENTS_BASE = 'https://patents.google.com/patent'
const PATENT_URL_PATTERN = /^https:\/\/patents\.google\.com\/patent\//
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_LOOKBACK_DAYS = 60
const DEFAULT_MAX_RECORDS = 25
const MAX_RECORDS_CAP = 100

const DEFAULT_ASSIGNEES = [
  'NVIDIA Corporation',
  'Taiwan Semiconductor Manufacturing Company, Ltd.',
  'ASML Netherlands B.V.',
  'Intel Corporation',
  'Apple Inc.',
  'Advanced Micro Devices, Inc.',
  'QUALCOMM Incorporated',
  'Micron Technology, Inc.',
  'Tesla, Inc.',
]

export type UsptoPatentConfig = {
  apiBase: string
  apiKey: string
  assignees: string[]
  lookbackDays: number
  maxRecords: number
}

export function readUsptoPatentConfig(env: NodeJS.ProcessEnv = process.env): UsptoPatentConfig | null {
  const apiKey = asString(env.ATLASZ_PATENTSVIEW_API_KEY)
  if (!apiKey) {
    return null // Config-gated: PatentsView requires a key. Fail closed.
  }
  const apiBase = asString(env.ATLASZ_PATENTSVIEW_BASE_URL) || API_BASE
  if (!/^https:\/\//i.test(apiBase)) {
    return null
  }
  const assignees = parseAssignees(env.ATLASZ_PATENTSVIEW_ASSIGNEES) ?? DEFAULT_ASSIGNEES
  const lookbackDays = clampInteger(Number(env.ATLASZ_PATENTSVIEW_LOOKBACK_DAYS ?? DEFAULT_LOOKBACK_DAYS), 1, 365)
  const maxRecords = clampInteger(Number(env.ATLASZ_PATENTSVIEW_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP)
  return { apiBase, apiKey, assignees, lookbackDays, maxRecords }
}

export async function fetchUsptoPatents(
  signal: AbortSignal,
  config = readUsptoPatentConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.assignees.length === 0) {
    return []
  }
  const now = Date.now()
  const requestUrl = buildRequestUrl(config, now)
  // API key travels ONLY in the X-Api-Key header; never persisted in a trail.
  const response = await fetch(requestUrl, {
    signal,
    headers: { accept: 'application/json', 'x-api-key': config.apiKey },
  })
  assertOk(response, 'USPTO PatentsView')
  const payload = (await response.json()) as unknown
  const records = parseUsptoPatents(payload, { retrievedAt: now, sourceApiUrl: sanitizedApiUrl(config) })
  return normalizeUsptoPatents(records)
}

/** Pure normalizer — testable with fixture PatentsView payloads. */
export function parseUsptoPatents(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string } = {},
): PatentRecord[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows = (payload as { patents?: unknown }).patents
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? API_BASE
  const out: PatentRecord[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const record = row as Record<string, unknown>
    const patentId = asString(record.patent_id) || asString(record.patent_number)
    const title = asString(record.patent_title)
    const patentDate = asString(record.patent_date)
    const sourceUrl = patentSourceUrl(patentId)
    const grantTimestamp = Date.parse(`${patentDate}T00:00:00Z`)

    if (!hasValidPatent({ patentId, title, patentDate, sourceUrl, retrievedAt })) {
      continue // Drop malformed records; never repair.
    }

    const assignees = extractAssignees(record.assignees)
    const cpcCodes = extractCpc(record.cpc_current ?? record.cpcs)
    const rawRecord = {
      patentId,
      title,
      abstract: asString(record.patent_abstract).slice(0, 600),
      patentDate,
      assignees,
      cpcCodes,
      sourceUrl,
      sourceApiUrl,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    out.push({
      id: patentRecordId(patentId),
      patentId,
      title,
      abstract: asString(record.patent_abstract).slice(0, 600),
      patentDate,
      grantTimestamp: Number.isFinite(grantTimestamp) ? grantTimestamp : retrievedAt,
      assignees,
      cpcCodes,
      sourceUrl,
      sourceApiUrl,
      sourceName: PATENT_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForPatent({ patentId, title, patentDate, sourceUrl, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  out.sort((a, b) => b.grantTimestamp - a.grantTimestamp)
  return out
}

export function normalizeUsptoPatents(records: PatentRecord[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: PatentRecord): WorldIntelEvent {
  const dedupeKey = `uspto|${record.patentId}`.toLowerCase()
  const assigneeNote = record.assignees.length > 0 ? ` Assignee: ${record.assignees.slice(0, 3).join(', ')}.` : ' No assignee organization listed.'
  const summary = `USPTO patent ${record.patentId} granted ${record.patentDate}: ${record.title}.${assigneeNote} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.patentId} — ${record.title}`.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.grantTimestamp,
    category: 'patent',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['USPTO patent', ...record.assignees, ...record.cpcCodes]),
    extractedEntities: unique([record.patentId, ...record.assignees, ...record.cpcCodes]),
  })

  return {
    ...event,
    confidence: record.confidence,
    patentRecord: record,
  }
}

function extractAssignees(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    // Only organizations — never inventor/person names.
    const org = asString((entry as Record<string, unknown>)?.assignee_organization)
    if (org) out.push(org)
  }
  return unique(out).slice(0, 8)
}

function extractCpc(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    const obj = entry as Record<string, unknown>
    const code = asString(obj?.cpc_group_id) || asString(obj?.cpc_subgroup_id) || asString(obj?.cpc_subsection_id) || asString(obj?.cpc_class)
    if (code) out.push(code.toUpperCase())
  }
  return unique(out).slice(0, 8)
}

function patentSourceUrl(patentId: string): string {
  if (!patentId) return ''
  return /^\d+$/.test(patentId) ? `${GOOGLE_PATENTS_BASE}/US${patentId}` : `${GOOGLE_PATENTS_BASE}/${encodeURIComponent(patentId)}`
}

function hasValidPatent(input: { patentId: string; title: string; patentDate: string; sourceUrl: string; retrievedAt: number }): boolean {
  return Boolean(
    input.patentId &&
      input.title &&
      ISO_DATE_PATTERN.test(input.patentDate) &&
      PATENT_URL_PATTERN.test(input.sourceUrl) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForPatent(input: Parameters<typeof hasValidPatent>[0]): number {
  return hasValidPatent(input) ? 96 : 60
}

function buildRequestUrl(config: UsptoPatentConfig, now: number): string {
  const since = new Date(now - config.lookbackDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const q = {
    _and: [
      { _gte: { patent_date: since } },
      { _or: config.assignees.map((org) => ({ 'assignees.assignee_organization': org })) },
    ],
  }
  const f = ['patent_id', 'patent_title', 'patent_date', 'patent_abstract', 'assignees.assignee_organization', 'cpc_current.cpc_group_id']
  const o = { size: config.maxRecords }
  const url = new URL(config.apiBase)
  url.searchParams.set('q', JSON.stringify(q))
  url.searchParams.set('f', JSON.stringify(f))
  url.searchParams.set('o', JSON.stringify(o))
  return url.toString()
}

/** API URL retained in the source trail — never contains the API key (key is header-only). */
function sanitizedApiUrl(config: UsptoPatentConfig): string {
  return config.apiBase
}

function parseAssignees(value: unknown): string[] | null {
  const list = asString(value)
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return list.length > 0 ? list : null
}

function patentRecordId(patentId: string): string {
  return `${SOURCE_ID}:${patentId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const USPTO_PATENTS_SOURCE_ID = SOURCE_ID
