import type { Severity } from '../data/intel'
import type { WorldIntelEvent } from '../worldIntel'
import type { EvidenceBasis, MaterialityVector, WorldEvent, WorldMode } from './model'

function severityImpact(severity: Severity) {
  if (severity === 'critical') return 1
  if (severity === 'elevated') return 0.72
  if (severity === 'watch') return 0.42
  return 0.18
}

function categoryMode(event: WorldIntelEvent): WorldMode {
  const text = [
    event.category,
    event.title,
    event.summary,
    ...event.affectedSectors,
    ...event.affectedCommodities,
  ].join(' ').toLowerCase()

  if (event.weatherAlert || event.earthquakeEvent || event.kevVulnerability || event.nvdCve) return 'risk'
  if (event.regulatoryDocument || event.ofacSanctionsRecord || event.congressBillAction) return 'policy'
  if (event.comtradeRecord || event.unLocode || event.worldPort || /shipping|trade|port|tariff/.test(text)) return 'trade'
  if (
    event.eiaEnergyRecord ||
    event.eiaFacility ||
    event.eiaRefinery ||
    event.lngTerminal ||
    event.nuclearPlant ||
    event.nrcReactorStatus ||
    event.gridRegion
  ) return 'energy'
  if (/crypto|blockchain|wallet|stablecoin|bitcoin|ethereum|solana|kaspa/.test(text)) return 'chain'
  if (event.category === 'markets' || event.affectedAssets.length > 0) return 'capital'
  return 'world'
}

function basisFor(event: WorldIntelEvent): EvidenceBasis {
  if (event.provenance === 'verified' || event.provenance === 'official-api' || event.provenance === 'public-disclosure') {
    return 'observed'
  }
  if (event.provenance === 'model-inferred' || event.provenance === 'local-model') return 'inferred'
  return 'observed'
}

function localMateriality(event: WorldIntelEvent): MaterialityVector {
  const confidence = Math.max(0, Math.min(1, event.confidence / 100))
  const impact = severityImpact(event.severity)
  const exposureDensity = Math.min(
    1,
    (event.affectedAssets.length +
      event.affectedSectors.length +
      event.affectedCommodities.length +
      event.affectedCurrencies.length) /
      12,
  )

  return {
    impact,
    confidence,
    novelty: 0,
    exposure: exposureDensity,
    velocity: 0,
    persistence: 0,
    centrality: 0,
    geographicRelevance: event.lat !== undefined && event.lon !== undefined ? 0.5 : 0,
    profileRelevance: 0,
  }
}

/**
 * Compatibility adapter from the existing runtime evidence shape into the new
 * Atlasz World contract. Missing dimensions stay zero/unknown rather than being
 * fabricated. These materiality components are local ranking context only.
 */
export function worldEventFromLegacy(event: WorldIntelEvent): WorldEvent {
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    basis: basisFor(event),
    mode: categoryMode(event),
    occurredAt: new Date(event.timestamp).toISOString(),
    firstObservedAt: new Date(event.timestamp).toISOString(),
    updatedAt: new Date(event.timestamp).toISOString(),
    location:
      event.lat !== undefined && event.lon !== undefined
        ? { lat: event.lat, lon: event.lon }
        : undefined,
    entityIds: event.extractedEntities,
    observationIds: [event.id],
    materiality: localMateriality(event),
    tags: event.narrativeTags,
  }
}
