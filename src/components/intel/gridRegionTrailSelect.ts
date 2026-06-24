/*
 * Pure proof gate + grid-context derivation for balancing-authority rendering.
 *
 * A grid region renders only with baCode, baName, a grid region kind, an official
 * EIA source URL + API URL (no api_key), region-only precision, hash, official-api
 * provenance, retrievedAt/staleAt, and confidence >= 90.
 *
 * `statesForBa` derives, from the SOURCE-BACKED balancing-authority codes already
 * on ingested EIA plant records, the set of states with EIA-listed plants in a BA
 * — honest grid context, never an official "service territory" claim.
 */
import type { GridRegion, WorldIntelEvent } from '../../worldIntel'

export function selectRenderableGridRegions(events: WorldIntelEvent[], limit = 80): GridRegion[] {
  const out: GridRegion[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const region = event.gridRegion
    if (!region) continue
    const proof =
      Boolean(region.baCode) &&
      Boolean(region.baName) &&
      (region.regionKind === 'balancing-authority' || region.regionKind === 'grid-region') &&
      region.geospatialPrecision !== 'exact' &&
      Boolean(region.sourceDataset) &&
      /^https:\/\/www\.eia\.gov\//.test(region.sourceUrl) &&
      /^https:\/\/api\.eia\.gov\/v2\/electricity\/rto\//.test(region.sourceApiUrl) &&
      !/[?&]api_key=/i.test(region.sourceApiUrl) &&
      Boolean(region.rawPayloadHash) &&
      Number.isFinite(region.retrievedAt) &&
      Number.isFinite(region.staleAt) &&
      region.provenance === 'official-api' &&
      region.confidence >= 90
    if (!proof || seen.has(region.id)) continue
    seen.add(region.id)
    out.push(region)
  }
  return out.sort((a, b) => a.baCode.localeCompare(b.baCode)).slice(0, limit)
}

/** States with EIA-listed plants in a given BA, derived from ingested facilities. */
export function statesForBa(events: WorldIntelEvent[], baCode: string): string[] {
  const code = baCode.trim().toUpperCase()
  const states = new Set<string>()
  for (const event of events) {
    const plantBa = (event.eiaFacility?.balancingAuthority ?? event.nuclearPlant?.balancingAuthority ?? '').trim().toUpperCase()
    if (plantBa !== code) continue
    const state = event.eiaFacility?.state ?? event.nuclearPlant?.state
    if (state) states.add(state)
  }
  return [...states].sort()
}
