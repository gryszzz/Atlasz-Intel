/*
 * Pure proof gate for LNG terminal source-trail rendering.
 *
 * A terminal renders only with facilityId, facilityName, lng-terminal kind, an
 * official source URL (eia.gov / ferc.gov / energy.gov) + an official API URL,
 * retrievedAt, staleAt, payload hash, official-api provenance, a valid
 * geospatial precision (coords iff exact), and confidence >= 90. No proof ->
 * not rendered (DATA_UNAVAILABLE), never faked.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { LngTerminalFacility, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableLngTerminals(events: WorldIntelEvent[], limit = 40): LngTerminalFacility[] {
  const out: LngTerminalFacility[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const terminal = event.lngTerminal
    if (!terminal) continue
    const coordsPresent = coordinatesAreValid(terminal.latitude, terminal.longitude)
    const proof =
      Boolean(terminal.facilityId) &&
      Boolean(terminal.facilityName) &&
      terminal.facilityKind === 'lng-terminal' &&
      isValidPrecision(terminal.geospatialPrecision) &&
      (terminal.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(terminal.sourceDataset) &&
      isOfficialSourceUrl(terminal.sourceUrl) &&
      isOfficialApiUrl(terminal.sourceApiUrl) &&
      Boolean(terminal.rawPayloadHash) &&
      Number.isFinite(terminal.retrievedAt) &&
      Number.isFinite(terminal.staleAt) &&
      terminal.provenance === 'official-api' &&
      terminal.confidence >= 90
    if (!proof || seen.has(terminal.id)) continue
    seen.add(terminal.id)
    out.push(terminal)
  }
  return out
    .sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0) || a.facilityName.localeCompare(b.facilityName))
    .slice(0, limit)
}

function isOfficialSourceUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase()
    return new URL(url).protocol === 'https:' && (/(^|\.)eia\.gov$/.test(h) || /(^|\.)ferc\.gov$/.test(h) || /(^|\.)energy\.gov$/.test(h))
  } catch {
    return false
  }
}

function isOfficialApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const h = parsed.hostname.toLowerCase()
    if (/(^|\.)eia\.gov$/.test(h) || /(^|\.)ferc\.gov$/.test(h) || /(^|\.)energy\.gov$/.test(h)) return true
    const path = parsed.pathname.toLowerCase()
    return /(^|\.)arcgis\.com$/.test(h) && /lng/.test(path) && (/lng_importexportterminals_us_eia/.test(path) || h.startsWith('atlas-eia') || /\/api\/download\/v1\/items\//.test(path))
  } catch {
    return false
  }
}
