/*
 * Pure proof-gate for NOAA/NWS weather alert source-trail rendering. Kept
 * separate from the component so it stays unit-testable and fast-refresh clean.
 */
import type { WeatherAlert, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableAlerts(events: WorldIntelEvent[], limit = 8): WeatherAlert[] {
  const out: WeatherAlert[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const alert = event.weatherAlert
    if (!alert) continue
    const earns =
      Boolean(alert.alertId) &&
      Boolean(alert.event) &&
      /^https:\/\/api\.weather\.gov\/alerts\//.test(alert.sourceUrl) &&
      /^https:\/\/api\.weather\.gov\/alerts(\/active)?/.test(alert.sourceApiUrl) &&
      Boolean(alert.rawPayloadHash) &&
      Number.isFinite(alert.retrievedAt) &&
      alert.confidence >= 90
    if (!earns || seen.has(alert.alertId)) continue
    seen.add(alert.alertId)
    out.push(alert)
  }
  return out.slice(0, limit)
}
