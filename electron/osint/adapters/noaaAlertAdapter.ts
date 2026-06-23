/*
 * NOAA / National Weather Service active alerts adapter.
 *
 * Uses the official NWS API (https://api.weather.gov/alerts/active). Real alerts
 * only: severity/urgency/certainty come straight from NWS — never inflated, never
 * AI-derived. No model forecasts. Malformed alerts are dropped, never repaired.
 * HTTP/rate-limit failures surface via the shared fetchPolicy (assertOk ->
 * HttpError -> fetchWithRetry) so the ingest layer shows DATA_UNAVAILABLE.
 *
 * NWS requests a descriptive User-Agent; configurable via ATLASZ_NWS_USER_AGENT.
 * Alerts are US-region; events carry countryCodes ['US'] so they link to the
 * country entity (and, where an area later maps to a curated seed region, expose
 * through it). Unresolved is acceptable and honest.
 *
 * provenance: official-api   category: weather-alert
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
import type { Severity } from '../../../src/data/intel'
import type { WeatherAlert, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'noaa_alerts_public'
const NOAA_SOURCE_NAME = 'NOAA / National Weather Service'
const DEFAULT_ALERTS_URL = 'https://api.weather.gov/alerts/active'
const ALERT_URL_PATTERN = /^https:\/\/api\.weather\.gov\/alerts\//
const DEFAULT_USER_AGENT = 'Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)'
const DEFAULT_MAX_RECORDS = 30
const MAX_RECORDS_CAP = 200
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_BACKOFF_MS = 1_000
const KNOWN_SEVERITIES = new Set(['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'])
const SEVERITY_RANK: Record<string, number> = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 }

export type NoaaAlertConfig = {
  alertsUrl: string
  userAgent: string
  maxRecords: number
  timeoutMs: number
  maxRetries: number
  backoffMs: number
}

export function readNoaaAlertConfig(env: NodeJS.ProcessEnv = process.env): NoaaAlertConfig | null {
  if (env.ATLASZ_NOAA_DISABLE === '1') {
    return null
  }
  const alertsUrl = asString(env.ATLASZ_NOAA_ALERTS_URL) || DEFAULT_ALERTS_URL
  if (!/^https:\/\//i.test(alertsUrl)) {
    return null
  }
  const userAgent = asString(env.ATLASZ_NWS_USER_AGENT) || DEFAULT_USER_AGENT
  const maxRecords = clampInteger(Number(env.ATLASZ_NOAA_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP)
  return {
    alertsUrl,
    userAgent,
    maxRecords,
    timeoutMs: clampInteger(Number(env.ATLASZ_NOAA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS), 1_000, 60_000),
    maxRetries: clampInteger(Number(env.ATLASZ_NOAA_MAX_RETRIES ?? DEFAULT_MAX_RETRIES), 0, 5),
    backoffMs: clampInteger(Number(env.ATLASZ_NOAA_BACKOFF_MS ?? DEFAULT_BACKOFF_MS), 0, 60_000),
  }
}

export async function fetchNoaaAlerts(
  signal: AbortSignal,
  config = readNoaaAlertConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const payload = await fetchWithRetry(
    (attemptSignal) => fetchNoaaJson(config.alertsUrl, config.userAgent, linkedSignal(signal, attemptSignal)),
    { maxRetries: config.maxRetries, backoffMs: config.backoffMs, timeoutMs: config.timeoutMs },
  )
  const records = parseNoaaAlerts(payload, { retrievedAt: Date.now(), config })
  return normalizeNoaaAlerts(records)
}

async function fetchNoaaJson(url: string, userAgent: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/geo+json', 'user-agent': userAgent },
  })
  assertOk(response, 'NOAA alerts')
  return response.json() as Promise<unknown>
}

/** Pure normalizer — testable with fixture GeoJSON alert collections. */
export function parseNoaaAlerts(
  payload: unknown,
  options: { retrievedAt?: number; config?: Partial<NoaaAlertConfig> } = {},
): WeatherAlert[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const features = (payload as { features?: unknown }).features
  if (!Array.isArray(features) || features.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxRecords = options.config?.maxRecords ?? DEFAULT_MAX_RECORDS
  const sourceApiUrl = options.config?.alertsUrl ?? DEFAULT_ALERTS_URL
  const out: WeatherAlert[] = []

  for (const feature of features) {
    const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined
    if (!props) {
      continue
    }
    const alertId = asString(props.id)
    const sourceUrl = asString(props['@id']) || asString((feature as Record<string, unknown>).id)
    const eventType = asString(props.event)
    const severity = asString(props.severity)
    const effective = asString(props.effective)
    const onset = asString(props.onset)
    const expires = asString(props.expires)
    const effectiveTimestamp = Date.parse(effective)
    const onsetTimestamp = Date.parse(onset)
    const expiresTimestamp = Date.parse(expires)

    if (
      !hasValidAlert({ alertId, eventType, severity, sourceUrl, effectiveTimestamp, onsetTimestamp, expiresTimestamp, retrievedAt })
    ) {
      continue // Drop malformed alerts; never repair.
    }

    const geocode = (props.geocode ?? {}) as Record<string, unknown>
    const observedTimestamp = firstFinite([effectiveTimestamp, onsetTimestamp, Date.parse(asString(props.sent))]) ?? retrievedAt
    const record: WeatherAlert = {
      id: alertRecordId(alertId),
      alertId,
      event: eventType,
      headline: asString(props.headline),
      description: asString(props.description).replace(/\s+/g, ' ').slice(0, 600),
      severity,
      urgency: asString(props.urgency) || 'Unknown',
      certainty: asString(props.certainty) || 'Unknown',
      areaDesc: asString(props.areaDesc),
      sameCodes: stringArray(geocode.SAME),
      ugcCodes: stringArray(geocode.UGC),
      effective,
      effectiveTimestamp: Number.isFinite(effectiveTimestamp) ? effectiveTimestamp : undefined,
      onset,
      onsetTimestamp: Number.isFinite(onsetTimestamp) ? onsetTimestamp : undefined,
      expires,
      expiresTimestamp: Number.isFinite(expiresTimestamp) ? expiresTimestamp : undefined,
      observedTimestamp,
      senderName: asString(props.senderName),
      sourceUrl,
      sourceApiUrl,
      sourceName: NOAA_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForAlert({ alertId, eventType, severity, sourceUrl, effectiveTimestamp, onsetTimestamp, expiresTimestamp, retrievedAt }),
      rawPayloadHash: '',
      rawPayloadJson: undefined,
    }
    const rawPayloadJson = stableStringify({ ...record, rawPayloadHash: undefined, rawPayloadJson: undefined })
    record.rawPayloadHash = sha256(rawPayloadJson)
    record.rawPayloadJson = rawPayloadJson
    out.push(record)
  }

  // Most severe + most recent first (display ordering only — severity never changed).
  out.sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || b.observedTimestamp - a.observedTimestamp)
  return out.slice(0, maxRecords)
}

export function normalizeNoaaAlerts(records: WeatherAlert[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: WeatherAlert): WorldIntelEvent {
  const dedupeKey = `noaa|${record.alertId}`.toLowerCase()
  const summary =
    `${record.event} (${record.severity}/${record.urgency}/${record.certainty}) for ${record.areaDesc}.` +
    `${record.expires ? ` Expires ${record.expires.slice(0, 16)}.` : ''} ${record.headline} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: (record.headline || `${record.event} — ${record.areaDesc}`).slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observedTimestamp,
    category: 'weather-alert',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['NWS alert', record.event, record.severity, record.urgency]),
    extractedEntities: unique([record.event, record.areaDesc]),
  })

  return {
    ...event,
    // NWS covers the US and its territories.
    countryCodes: ['US'],
    severity: mapAlertSeverity(record.severity),
    confidence: record.confidence,
    weatherAlert: record,
  }
}

function mapAlertSeverity(severity: string): Severity {
  switch (severity) {
    case 'Extreme':
      return 'critical'
    case 'Severe':
      return 'elevated'
    case 'Moderate':
      return 'watch'
    case 'Minor':
      return 'stable'
    default:
      return 'watch'
  }
}

function hasValidAlert(input: {
  alertId: string
  eventType: string
  severity: string
  sourceUrl: string
  effectiveTimestamp: number
  onsetTimestamp: number
  expiresTimestamp: number
  retrievedAt: number
}): boolean {
  return Boolean(
    input.alertId &&
      input.eventType &&
      KNOWN_SEVERITIES.has(input.severity) &&
      ALERT_URL_PATTERN.test(input.sourceUrl) &&
      (Number.isFinite(input.effectiveTimestamp) || Number.isFinite(input.onsetTimestamp) || Number.isFinite(input.expiresTimestamp)) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForAlert(input: Parameters<typeof hasValidAlert>[0]): number {
  return hasValidAlert(input) ? 96 : 60
}

function firstFinite(values: number[]): number | undefined {
  return values.find((value) => Number.isFinite(value))
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []
}

function alertRecordId(alertId: string): string {
  return `${SOURCE_ID}:${alertId.toLowerCase()}`
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

export const NOAA_ALERTS_SOURCE_ID = SOURCE_ID
