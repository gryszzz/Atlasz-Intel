/*
 * USGS earthquakes adapter — the physical-world (seismic) layer.
 *
 * Uses the official USGS earthquake GeoJSON feeds
 * (https://earthquake.usgs.gov/earthquakes/feed/v1.0/). Public, no key, official,
 * naturally event-based. Real data only: malformed features are dropped, never
 * repaired. HTTP/rate-limit failures surface via the shared fetchPolicy
 * (assertOk -> HttpError -> fetchWithRetry) so the ingest layer shows
 * DATA_UNAVAILABLE.
 *
 * Each quake links to a region/country so it can later connect to infrastructure,
 * energy, and company exposure. No predictions; magnitude is observed fact.
 *
 * provenance: official-api   category: natural-disaster
 */
import {
  adapterEventId,
  asNumber,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { assertOk } from '../fetchPolicy'
import type { EarthquakeEvent, WorldIntelEvent } from '../../../src/worldIntel'
import type { Severity } from '../../../src/data/intel'

const SOURCE_ID = 'usgs_significant_quakes'
const USGS_SOURCE_NAME = 'USGS Earthquake Hazards Program'
const DEFAULT_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
const EVENT_URL_PATTERN = /^https:\/\/earthquake\.usgs\.gov\//
const DEFAULT_MAX_RECORDS = 50
const MAX_RECORDS_CAP = 200

// Best-effort region -> ISO country/region mapping for the place string tail.
// Unmapped regions stay unknown rather than being guessed.
const REGION_TO_COUNTRY: Record<string, string> = {
  alaska: 'US',
  california: 'US',
  nevada: 'US',
  hawaii: 'US',
  oklahoma: 'US',
  washington: 'US',
  'puerto rico': 'US',
  japan: 'JP',
  indonesia: 'ID',
  chile: 'CL',
  mexico: 'MX',
  peru: 'PE',
  turkey: 'TR',
  'türkiye': 'TR',
  greece: 'GR',
  iran: 'IR',
  philippines: 'PH',
  'papua new guinea': 'PG',
  'new zealand': 'NZ',
  italy: 'IT',
  taiwan: 'TW',
  afghanistan: 'AF',
  china: 'CN',
  india: 'IN',
  nepal: 'NP',
  ecuador: 'EC',
  colombia: 'CO',
  russia: 'RU',
}

export type UsgsQuakeConfig = {
  feedUrl: string
  minMagnitude: number
  maxRecords: number
}

export function readUsgsQuakeConfig(env: NodeJS.ProcessEnv = process.env): UsgsQuakeConfig | null {
  if (env.ATLASZ_USGS_QUAKES_DISABLE === '1') {
    return null
  }
  const feedUrl = asString(env.ATLASZ_USGS_QUAKES_URL) || DEFAULT_FEED_URL
  if (!/^https:\/\//i.test(feedUrl)) {
    return null
  }
  const minMagnitude = Number.isFinite(Number(env.ATLASZ_USGS_MIN_MAGNITUDE))
    ? Math.max(0, Number(env.ATLASZ_USGS_MIN_MAGNITUDE))
    : 0
  const maxRecords = clampInteger(Number(env.ATLASZ_USGS_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP)
  return { feedUrl, minMagnitude, maxRecords }
}

export async function fetchUsgsEarthquakes(
  signal: AbortSignal,
  config = readUsgsQuakeConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const response = await fetch(config.feedUrl, { signal, headers: { accept: 'application/geo+json, application/json' } })
  assertOk(response, 'USGS earthquakes')
  const payload = (await response.json()) as unknown
  const records = parseUsgsQuakes(payload, { retrievedAt: Date.now(), config })
  return normalizeUsgsEarthquakes(records)
}

/** Pure normalizer — testable with fixture GeoJSON FeatureCollections. */
export function parseUsgsQuakes(
  payload: unknown,
  options: { retrievedAt?: number; config?: Partial<UsgsQuakeConfig> } = {},
): EarthquakeEvent[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const features = (payload as { features?: unknown }).features
  if (!Array.isArray(features) || features.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const minMagnitude = options.config?.minMagnitude ?? 0
  const maxRecords = options.config?.maxRecords ?? DEFAULT_MAX_RECORDS
  const out: EarthquakeEvent[] = []

  for (const feature of features) {
    if (!feature || typeof feature !== 'object') {
      continue
    }
    const props = (feature as Record<string, unknown>).properties as Record<string, unknown> | undefined
    const geometry = (feature as Record<string, unknown>).geometry as Record<string, unknown> | undefined
    const eventId = asString((feature as Record<string, unknown>).id)
    const magnitude = asNumber(props?.mag)
    const time = asNumber(props?.time)
    const sourceUrl = asString(props?.url)
    const coords = Array.isArray(geometry?.coordinates) ? (geometry?.coordinates as unknown[]) : []
    const lon = asNumber(coords[0])
    const lat = asNumber(coords[1])
    const depthKm = asNumber(coords[2])

    if (
      !hasValidQuake({ eventId, magnitude, time, sourceUrl, lat, lon, retrievedAt }) ||
      (magnitude as number) < minMagnitude
    ) {
      continue // Drop malformed / below-threshold features; never repair.
    }

    const place = asString(props?.place)
    const title = asString(props?.title) || `M ${magnitude} - ${place}`
    const region = regionFromPlace(place)
    const countryCode = region ? REGION_TO_COUNTRY[region.toLowerCase()] : undefined
    const alert = asString(props?.alert) || undefined
    const tsunami = asNumber(props?.tsunami) === 1
    const significance = asNumber(props?.sig)
    const status = asString(props?.status)

    const rawRecord = {
      eventId,
      magnitude,
      place,
      title,
      time,
      depthKm,
      lat,
      lon,
      region,
      countryCode,
      alert,
      tsunami,
      significance,
      status,
      sourceUrl,
      sourceFeedUrl: options.config?.feedUrl ?? DEFAULT_FEED_URL,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    out.push({
      id: quakeRecordId(eventId),
      eventId,
      magnitude: magnitude as number,
      place,
      title,
      time: time as number,
      depthKm,
      lat: lat as number,
      lon: lon as number,
      region,
      countryCode,
      alert,
      tsunami,
      significance,
      status,
      sourceUrl,
      sourceFeedUrl: options.config?.feedUrl ?? DEFAULT_FEED_URL,
      sourceName: USGS_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForQuake({ eventId, magnitude, time, sourceUrl, lat, lon, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  return out.sort((a, b) => b.time - a.time).slice(0, maxRecords)
}

export function normalizeUsgsEarthquakes(records: EarthquakeEvent[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: EarthquakeEvent): WorldIntelEvent {
  const dedupeKey = `usgs-quake|${record.eventId}`.toLowerCase()
  const tsunamiNote = record.tsunami ? ' Tsunami flag set by USGS.' : ''
  const alertNote = record.alert ? ` PAGER alert: ${record.alert}.` : ''
  const summary =
    `USGS recorded a magnitude ${record.magnitude} earthquake — ${record.place} — at depth ${record.depthKm ?? 'unknown'} km.` +
    `${alertNote}${tsunamiNote} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: record.title.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.time,
    category: 'natural-disaster',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique([
      'USGS earthquake',
      'seismic',
      record.tsunami ? 'tsunami flag' : '',
      record.alert ? `PAGER ${record.alert}` : '',
      record.region ?? '',
    ]),
    extractedEntities: unique([record.eventId, record.place, record.region ?? '', record.countryCode ?? '']),
  })

  return {
    ...event,
    severity: magnitudeSeverity(record.magnitude),
    lat: record.lat,
    lon: record.lon,
    confidence: record.confidence,
    earthquakeEvent: record,
  }
}

function regionFromPlace(place: string): string | undefined {
  // USGS place: "100km S of Town, Region" -> take the segment after the last comma.
  const parts = place.split(',')
  const tail = parts.length > 1 ? parts[parts.length - 1].trim() : ''
  return tail || undefined
}

function magnitudeSeverity(magnitude: number): Severity {
  if (magnitude >= 7) return 'critical'
  if (magnitude >= 6) return 'elevated'
  if (magnitude >= 5) return 'watch'
  return 'stable'
}

function hasValidQuake(input: {
  eventId: string
  magnitude: number | undefined
  time: number | undefined
  sourceUrl: string
  lat: number | undefined
  lon: number | undefined
  retrievedAt: number
}): boolean {
  return Boolean(
    input.eventId &&
      input.magnitude !== undefined &&
      Number.isFinite(input.magnitude) &&
      input.time !== undefined &&
      Number.isFinite(input.time) &&
      EVENT_URL_PATTERN.test(input.sourceUrl) &&
      input.lat !== undefined &&
      Number.isFinite(input.lat) &&
      input.lon !== undefined &&
      Number.isFinite(input.lon) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForQuake(input: {
  eventId: string
  magnitude: number | undefined
  time: number | undefined
  sourceUrl: string
  lat: number | undefined
  lon: number | undefined
  retrievedAt: number
}): number {
  return hasValidQuake(input) ? 96 : 60
}

function quakeRecordId(eventId: string): string {
  return `${SOURCE_ID}:${eventId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const USGS_QUAKES_SOURCE_ID = SOURCE_ID
