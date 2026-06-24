/*
 * Pure proof gate for USGS mineral site source-trail rendering.
 *
 * Renders only with siteId, siteName, a USMIN/MRDS database tag, a usgs.gov
 * source URL + API URL, a valid precision (coords iff exact), payload hash,
 * official-api provenance, retrievedAt/staleAt, and confidence >= 90.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { MineralSite, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableMineralSites(events: WorldIntelEvent[], limit = 60): MineralSite[] {
  const out: MineralSite[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const site = event.mineralSite
    if (!site) continue
    const coordsPresent = coordinatesAreValid(site.latitude, site.longitude)
    const proof =
      Boolean(site.siteId) &&
      Boolean(site.siteName) &&
      (site.database === 'USMIN' || site.database === 'MRDS') &&
      isValidPrecision(site.geospatialPrecision) &&
      (site.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      Boolean(site.sourceDataset) &&
      isUsgs(site.sourceUrl) &&
      isUsgs(site.sourceApiUrl) &&
      Boolean(site.rawPayloadHash) &&
      Number.isFinite(site.retrievedAt) &&
      Number.isFinite(site.staleAt) &&
      site.provenance === 'official-api' &&
      site.confidence >= 90
    if (!proof || seen.has(site.id)) continue
    seen.add(site.id)
    out.push(site)
  }
  // USMIN (authoritative) before MRDS (legacy); then by name.
  return out
    .sort((a, b) => Number(a.legacyNotMaintained) - Number(b.legacyNotMaintained) || a.siteName.localeCompare(b.siteName))
    .slice(0, limit)
}

function isUsgs(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)usgs\.gov$/i.test(parsed.hostname)
  } catch {
    return false
  }
}
