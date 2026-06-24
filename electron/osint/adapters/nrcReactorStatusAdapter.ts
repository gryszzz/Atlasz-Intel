/*
 * NRC reactor status adapter — Energy Infra Pack slice 3, LAYER 2 (NRC).
 *
 * The reactor/unit status + regulatory operating-context layer, kept SEPARATE
 * from the EIA facility/geospatial layer (never mashed into one "nuclear impact"
 * claim). Uses the official, public NRC Power Reactor Status Report:
 *   https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt
 * a pipe-delimited text feed: `ReportDt|Unit|Power` (e.g.
 * `4/17/2026 12:00:00 AM|Arkansas Nuclear 1|100`). Public, no key.
 *
 * Atlasz reports the operating POWER LEVEL exactly as the regulator publishes it.
 * It NEVER editorializes that as a safety, outage, emergency, disruption, or
 * vulnerability assessment. Latest status per unit only. No coordinates (this
 * feed has none) -> no geospatial proximity claims here.
 *
 * provenance: official-api   category: energy-facility
 */
import { adapterEventId, asString, buildAdapterEvent, sha256, stableStringify, unique } from './adapterShared'
import { assertOk, fetchWithRetry } from '../fetchPolicy'
import type { NrcReactorStatus, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'nrc_reactor_status_public'
const NRC_SOURCE_NAME = 'U.S. Nuclear Regulatory Commission'
const SOURCE_DATASET = 'NRC Power Reactor Status Report'
const DEFAULT_URL = 'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const DEFAULT_MAX_UNITS = 200
const MAX_UNITS_CAP = 500
const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AFTER_MS = 3 * DAY_MS // Daily report; goes stale quickly.

export type NrcReactorStatusConfig = {
  url: string
  maxUnits: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readNrcReactorStatusConfig(env: NodeJS.ProcessEnv = process.env): NrcReactorStatusConfig | null {
  if (env.ATLASZ_NRC_REACTOR_STATUS_DISABLE === '1') return null
  const url = asString(env.ATLASZ_NRC_REACTOR_STATUS_URL) || DEFAULT_URL
  if (!isOfficialNrcUrl(url)) return null
  return {
    url,
    maxUnits: clampInteger(Number(env.ATLASZ_NRC_REACTOR_STATUS_MAX ?? DEFAULT_MAX_UNITS), 1, MAX_UNITS_CAP),
    timeoutMs: clampInteger(Number(env.ATLASZ_NRC_REACTOR_STATUS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_NRC_REACTOR_STATUS_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_NRC_REACTOR_STATUS_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchNrcReactorStatus(
  signal: AbortSignal,
  config = readNrcReactorStatusConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const retrievedAt = Date.now()
  const text = await fetchWithRetry(
    (attemptSignal) => fetchNrcText(config.url, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseNrcReactorStatus(text, { retrievedAt, sourceUrl: config.url, maxUnits: config.maxUnits })
  return normalizeNrcReactorStatus(records)
}

/** Pure normalizer — testable with a small pipe-delimited fixture. */
export function parseNrcReactorStatus(
  text: unknown,
  options: { retrievedAt?: number; sourceUrl?: string; maxUnits?: number } = {},
): NrcReactorStatus[] {
  if (typeof text !== 'string' || text.trim() === '') return []
  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceUrl = options.sourceUrl ?? DEFAULT_URL
  if (!isOfficialNrcUrl(sourceUrl)) return []
  const maxUnits = options.maxUnits ?? DEFAULT_MAX_UNITS

  // Keep the LATEST report row per unit.
  const latest = new Map<string, { unitName: string; reportTimestamp: number; reportDate: string; powerPercent: number }>()
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = trimmed.split('|')
    if (parts.length < 3) continue
    const rawDate = parts[0].trim()
    const unitName = parts[1].trim()
    const power = Number(parts[2].trim())
    if (/^reportdt$/i.test(rawDate) || /^unit$/i.test(unitName)) continue // header
    const reportTimestamp = Date.parse(rawDate)
    if (!unitName || !Number.isFinite(reportTimestamp) || !Number.isFinite(power) || power < 0 || power > 100) {
      continue // drop malformed; never repair
    }
    const reportDate = new Date(reportTimestamp).toISOString().slice(0, 10)
    const existing = latest.get(unitName)
    if (!existing || reportTimestamp > existing.reportTimestamp) {
      latest.set(unitName, { unitName, reportTimestamp, reportDate, powerPercent: Math.round(power) })
    }
  }

  const out: NrcReactorStatus[] = []
  for (const row of latest.values()) {
    const rawRecord = { unitName: row.unitName, reportDate: row.reportDate, powerPercent: row.powerPercent, sourceUrl }
    const rawPayloadJson = stableStringify(rawRecord)
    const record: NrcReactorStatus = {
      id: `${SOURCE_ID}:${slug(row.unitName)}`,
      unitName: row.unitName,
      reportDate: row.reportDate,
      reportTimestamp: row.reportTimestamp,
      powerPercent: row.powerPercent,
      sourceDataset: SOURCE_DATASET,
      sourceUrl,
      sourceName: NRC_SOURCE_NAME,
      retrievedAt,
      staleAt: row.reportTimestamp + STALE_AFTER_MS,
      provenance: 'official-api',
      confidence: 95,
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    }
    if (hasValidNrcStatus(record)) out.push(record)
  }
  return out.sort((a, b) => a.unitName.localeCompare(b.unitName)).slice(0, maxUnits)
}

export function normalizeNrcReactorStatus(records: NrcReactorStatus[]): WorldIntelEvent[] {
  return records.filter(hasValidNrcStatus).map(toEvent)
}

function toEvent(record: NrcReactorStatus): WorldIntelEvent {
  const dedupeKey = `nrc-reactor-status|${slug(record.unitName)}|${record.reportDate}`.toLowerCase()
  const summary =
    `NRC published the reactor power status for ${record.unitName} on ${record.reportDate}: ${record.powerPercent}% power. ` +
    'Operating power level as reported by the regulator — not an Atlasz safety, outage, disruption, or vulnerability assessment.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `NRC reactor status: ${record.unitName} — ${record.powerPercent}%`.slice(0, 180),
    summary,
    source: NRC_SOURCE_NAME,
    url: record.sourceUrl,
    observedAt: record.reportTimestamp,
    category: 'energy-facility',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['NRC reactor status', 'nuclear', `${record.powerPercent}% power`]),
    extractedEntities: unique([record.unitName]),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Nuclear', ...event.affectedSectors]),
    affectedCommodities: unique(['Electricity', ...event.affectedCommodities]),
    confidence: record.confidence,
    nrcReactorStatus: record,
  }
}

export function hasValidNrcStatus(record: NrcReactorStatus): boolean {
  return (
    Boolean(record.unitName) &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.reportDate) &&
    Number.isFinite(record.reportTimestamp) &&
    Number.isFinite(record.powerPercent) &&
    record.powerPercent >= 0 &&
    record.powerPercent <= 100 &&
    isOfficialNrcUrl(record.sourceUrl) &&
    record.sourceName === NRC_SOURCE_NAME &&
    record.provenance === 'official-api' &&
    Number.isFinite(record.retrievedAt) &&
    Number.isFinite(record.staleAt) &&
    record.rawPayloadHash.length > 0
  )
}

function isOfficialNrcUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)nrc\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

async function fetchNrcText(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'text/plain, */*', 'user-agent': 'AtlaszIntel/0.4 (local-first energy intelligence; official NRC reactor status)' },
  })
  assertOk(response, 'NRC reactor status')
  return await response.text()
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function linkedSignal(parent: AbortSignal, attempt: AbortSignal): AbortSignal {
  if (parent.aborted || attempt.aborted) {
    const controller = new AbortController()
    controller.abort()
    return controller.signal
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  attempt.addEventListener('abort', abort, { once: true })
  return controller.signal
}

export const NRC_REACTOR_STATUS_SOURCE_ID = SOURCE_ID
