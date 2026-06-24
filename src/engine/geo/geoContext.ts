/*
 * Generic geospatial context engine (Shared Geospatial Core).
 *
 * Relates ANY located subject (facility, port, mine, terminal, fab, ...) to the
 * public event streams as LOCATION CONTEXT ONLY. It never asserts an outage,
 * disruption, or damage:
 *
 *   - NOAA/NWS weather alerts  -> "same region as alert" (region match only)
 *   - USGS earthquakes         -> distance/proximity only (km), never damage
 *   - GDELT media articles     -> NEVER produce geo context/exposure
 *
 * Seismic proximity requires source-backed coordinates on both sides. Pure +
 * deterministic so it is fully testable across every connector.
 */
import { coordinatesAreValid, haversineKm, type GeoSubject } from './geoCore'
import type { WorldIntelEvent } from '../../worldIntel'

export type GeoWeatherRegionMatch = {
  kind: 'weather-region'
  eventId: string
  alertEvent: string
  severity: string
  areaDesc: string
  /** Why the region matched (UGC state prefix or area description). */
  matchBasis: string
  /** Mandatory honesty: region match, not a disruption claim. */
  note: string
}

export type GeoSeismicProximity = {
  kind: 'seismic-proximity'
  eventId: string
  place: string
  magnitude: number
  distanceKm: number
  /** Mandatory honesty: proximity, not a damage claim. */
  note: string
}

export type GeoContextItem = GeoWeatherRegionMatch | GeoSeismicProximity

export type GeoContext = {
  subjectId: string
  subjectName: string
  weatherRegionMatches: GeoWeatherRegionMatch[]
  seismicProximities: GeoSeismicProximity[]
}

export type GeoContextOptions = {
  /** Seismic proximity radius in km (default 250). */
  seismicRadiusKm?: number
  maxItemsPerKind?: number
}

const WEATHER_NOTE = 'Same region as an active NWS alert — region match only, not a verified outage or disruption at this location.'
const SEISMIC_NOTE = 'Distance/proximity to a recorded earthquake only — not a verified damage, outage, or disruption claim.'
const DEFAULT_RADIUS_KM = 250
const DEFAULT_MAX = 8

export function buildGeoContext(subject: GeoSubject, events: WorldIntelEvent[], options: GeoContextOptions = {}): GeoContext {
  const radiusKm = options.seismicRadiusKm ?? DEFAULT_RADIUS_KM
  const max = options.maxItemsPerKind ?? DEFAULT_MAX
  const weatherRegionMatches: GeoWeatherRegionMatch[] = []
  const seismicProximities: GeoSeismicProximity[] = []

  for (const event of events) {
    // GDELT must NEVER create geo context/exposure.
    if (event.gdeltArticle) continue

    if (event.weatherAlert) {
      const match = weatherRegionMatch(subject, event)
      if (match) weatherRegionMatches.push(match)
      continue
    }

    if (event.earthquakeEvent) {
      const proximity = seismicProximity(subject, event, radiusKm)
      if (proximity) seismicProximities.push(proximity)
    }
  }

  weatherRegionMatches.sort((a, b) => a.eventId.localeCompare(b.eventId))
  seismicProximities.sort((a, b) => a.distanceKm - b.distanceKm)

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    weatherRegionMatches: weatherRegionMatches.slice(0, max),
    seismicProximities: seismicProximities.slice(0, max),
  }
}

export function hasGeoContext(context: GeoContext): boolean {
  return context.weatherRegionMatches.length > 0 || context.seismicProximities.length > 0
}

function weatherRegionMatch(subject: GeoSubject, event: WorldIntelEvent): GeoWeatherRegionMatch | null {
  const alert = event.weatherAlert
  if (!alert || !subject.state) return null

  const state = subject.state.toUpperCase()
  // UGC codes are SSFNNN — the first two characters are the state abbreviation.
  const ugcMatch = alert.ugcCodes.some((code) => code.trim().slice(0, 2).toUpperCase() === state)
  const areaName = subject.stateName ? new RegExp(`\\b${escapeRegExp(subject.stateName)}\\b`, 'i').test(alert.areaDesc) : false
  if (!ugcMatch && !areaName) return null

  return {
    kind: 'weather-region',
    eventId: event.id,
    alertEvent: alert.event,
    severity: alert.severity,
    areaDesc: alert.areaDesc,
    matchBasis: ugcMatch ? `UGC state prefix ${state}` : `area description names ${subject.stateName}`,
    note: WEATHER_NOTE,
  }
}

function seismicProximity(subject: GeoSubject, event: WorldIntelEvent, radiusKm: number): GeoSeismicProximity | null {
  const quake = event.earthquakeEvent
  // Proximity requires source-backed coordinates on BOTH sides.
  if (!quake || !coordinatesAreValid(subject.latitude, subject.longitude)) return null
  const distanceKm = haversineKm(subject.latitude as number, subject.longitude as number, quake.lat, quake.lon)
  if (!Number.isFinite(distanceKm) || distanceKm > radiusKm) return null
  return {
    kind: 'seismic-proximity',
    eventId: event.id,
    place: quake.place,
    magnitude: quake.magnitude,
    distanceKm: Math.round(distanceKm),
    note: SEISMIC_NOTE,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
