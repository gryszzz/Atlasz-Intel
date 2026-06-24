/*
 * Pure proof gate for UN/LOCODE source-trail rendering.
 *
 * Renders only with a valid 5-char locode, location name, a UNECE source URL +
 * official UNECE API URL, a valid precision (coords iff exact), payload hash,
 * official-api provenance, retrievedAt/staleAt, and confidence >= 90.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { UnLocode, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableLocodes(events: WorldIntelEvent[], limit = 60): UnLocode[] {
  const out: UnLocode[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const loc = event.unLocode
    if (!loc) continue
    const coordsPresent = coordinatesAreValid(loc.latitude, loc.longitude)
    const proof =
      /^[A-Z]{2}[A-Z0-9]{3}$/.test(loc.locode) &&
      Boolean(loc.locationName) &&
      isValidPrecision(loc.geospatialPrecision) &&
      (loc.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(loc.sourceDataset) &&
      isUnece(loc.sourceUrl) &&
      isUnece(loc.sourceApiUrl) &&
      Boolean(loc.rawPayloadHash) &&
      Number.isFinite(loc.retrievedAt) &&
      Number.isFinite(loc.staleAt) &&
      loc.provenance === 'official-api' &&
      loc.confidence >= 90
    if (!proof || seen.has(loc.id)) continue
    seen.add(loc.id)
    out.push(loc)
  }
  return out
    .sort((a, b) => Number(b.functions.port) - Number(a.functions.port) || a.locode.localeCompare(b.locode))
    .slice(0, limit)
}

function isUnece(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)unece\.org$/i.test(parsed.hostname)
  } catch {
    return false
  }
}
