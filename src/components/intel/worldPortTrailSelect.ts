/*
 * Pure proof gate for World Port Index source-trail rendering.
 *
 * Renders only with portNumber, portName, an NGA source URL + official nga.mil
 * API URL, a valid precision (coords iff exact), a valid-or-absent exact LOCODE,
 * payload hash, official-api provenance, retrievedAt/staleAt, confidence >= 90.
 */
import { coordinatesAreValid, isValidPrecision } from '../../engine/geo/geoCore'
import type { WorldIntelEvent, WorldPortIndexRecord } from '../../worldIntel'

const LOCODE_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}$/

export function selectRenderableWorldPorts(events: WorldIntelEvent[], limit = 60): WorldPortIndexRecord[] {
  const out: WorldPortIndexRecord[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const port = event.worldPort
    if (!port) continue
    const coordsPresent = coordinatesAreValid(port.latitude, port.longitude)
    const proof =
      Boolean(port.portNumber) &&
      Boolean(port.portName) &&
      isValidPrecision(port.geospatialPrecision) &&
      (port.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
      (port.linkedLocode === undefined || LOCODE_PATTERN.test(port.linkedLocode)) &&
      Boolean(port.sourceDataset) &&
      isNga(port.sourceUrl) &&
      isNga(port.sourceApiUrl) &&
      Boolean(port.rawPayloadHash) &&
      Number.isFinite(port.retrievedAt) &&
      Number.isFinite(port.staleAt) &&
      port.provenance === 'official-api' &&
      port.confidence >= 90
    if (!proof || seen.has(port.id)) continue
    seen.add(port.id)
    out.push(port)
  }
  return out.sort((a, b) => a.portName.localeCompare(b.portName)).slice(0, limit)
}

function isNga(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /(^|\.)nga\.mil$/i.test(parsed.hostname)
  } catch {
    return false
  }
}
