/*
 * EIA nuclear power-plant adapter — Energy Infra Pack slice 3, LAYER 1 (EIA).
 *
 * The facility/geospatial + generator-identity layer for nuclear plants. Reuses
 * the official EIA generator inventory (EIA-860M operating-generator-capacity,
 * already proven by the power-plant slice) and filters it to nuclear fuel
 * (energy-source-code NUC). NOT mashed with NRC reactor status — that is a
 * separate honest layer (nrcReactorStatusAdapter).
 *
 * Facility/geospatial + capacity context only — never a safety, outage,
 * emergency, or vulnerability claim. Coordinates source-backed only; operator
 * links to a market identity ONLY on an exact curated match.
 *
 * provenance: official-api   category: energy-facility
 */
import { adapterEventId, buildAdapterEvent, unique } from './adapterShared'
import {
  fetchEiaFacilityRecords,
  parseEiaFacilities,
  readEiaFacilityConfig,
  type EiaFacilityConfig,
} from './eiaFacilityAdapter'
import type { EiaPowerPlantFacility, NuclearPlantFacility, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'eia_nuclear_public'

export function readEiaNuclearConfig(env: NodeJS.ProcessEnv = process.env): EiaFacilityConfig | null {
  if (env.ATLASZ_EIA_NUCLEAR_DISABLE === '1') return null
  // Reuses the EIA key/base/limits gate from the facility slice (same official API).
  return readEiaFacilityConfig(env)
}

export async function fetchEiaNuclearPlants(
  signal: AbortSignal,
  config = readEiaNuclearConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) return []
  const facilities = await fetchEiaFacilityRecords(signal, config)
  return normalizeEiaNuclearPlants(nuclearFrom(facilities))
}

/** Pure normalizer — parse the EIA inventory then keep only nuclear plants. */
export function parseEiaNuclearPlants(
  payload: unknown,
  options: { retrievedAt?: number; sourceApiUrl?: string; maxFacilities?: number } = {},
): NuclearPlantFacility[] {
  return nuclearFrom(parseEiaFacilities(payload, options))
}

function nuclearFrom(facilities: EiaPowerPlantFacility[]): NuclearPlantFacility[] {
  return facilities.filter(isNuclear).map(toNuclearFacility)
}

function isNuclear(facility: EiaPowerPlantFacility): boolean {
  return facility.energySource === 'NUC' || /nuclear/i.test(facility.primaryFuel ?? '') || /nuclear/i.test(facility.plantType ?? '')
}

function toNuclearFacility(f: EiaPowerPlantFacility): NuclearPlantFacility {
  return {
    id: `${SOURCE_ID}:${f.facilityId.toLowerCase()}`,
    facilityId: f.facilityId,
    facilityName: f.facilityName,
    facilityKind: 'nuclear-plant',
    operatorName: f.operatorName,
    operatorId: f.operatorId,
    operatorTicker: f.operatorTicker,
    eiaPlantId: f.facilityId,
    state: f.state,
    stateName: f.stateName,
    county: f.county,
    balancingAuthority: f.balancingAuthority,
    latitude: f.latitude,
    longitude: f.longitude,
    geospatialPrecision: f.geospatialPrecision,
    capacityMw: f.capacityMw,
    status: f.status,
    energySource: f.energySource ?? 'NUC',
    sourceDataset: f.sourceDataset,
    sourceUrl: f.sourceUrl,
    sourceApiUrl: f.sourceApiUrl,
    sourceName: f.sourceName,
    retrievedAt: f.retrievedAt,
    staleAt: f.staleAt,
    provenance: f.provenance,
    confidence: f.confidence,
    rawPayloadHash: f.rawPayloadHash,
    rawPayloadJson: f.rawPayloadJson,
  }
}

export function normalizeEiaNuclearPlants(plants: NuclearPlantFacility[]): WorldIntelEvent[] {
  return plants.filter(hasValidNuclearPlant).map(toEvent)
}

function toEvent(plant: NuclearPlantFacility): WorldIntelEvent {
  const dedupeKey = `eia-nuclear|${plant.facilityId}`.toLowerCase()
  const where = [plant.county, plant.stateName ?? plant.state].filter(Boolean).join(', ')
  const cap = plant.capacityMw !== undefined ? `${plant.capacityMw} MW nameplate` : 'capacity unavailable'
  const loc = plant.geospatialPrecision === 'exact' ? `coordinates ${plant.latitude}, ${plant.longitude}` : `location ${plant.geospatialPrecision}`
  const summary =
    `EIA published nuclear power plant ${plant.facilityName} (plant ${plant.facilityId})${where ? ` in ${where}` : ''}: ${cap}, ${loc}. ` +
    'Facility location and capacity context only — not a verified outage, safety condition, or disruption.'

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `Nuclear plant: ${plant.facilityName}${plant.state ? ` (${plant.state})` : ''}`.slice(0, 180),
    summary,
    source: plant.sourceName,
    url: plant.sourceUrl,
    observedAt: plant.retrievedAt,
    category: 'energy-facility',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: plant,
    affectedAssets: plant.operatorTicker ? [plant.operatorTicker] : [],
    narrativeTags: unique(['EIA nuclear plant', 'nuclear', 'electric generation', plant.status ?? '']),
    extractedEntities: unique([plant.facilityName, plant.operatorName ?? '', plant.county ?? '', plant.stateName ?? plant.state ?? '']),
  })

  return {
    ...event,
    countryCodes: unique(['US', ...event.countryCodes]),
    affectedSectors: unique(['Energy', 'Electric Power', 'Nuclear', ...event.affectedSectors]),
    affectedCommodities: unique(['Electricity', 'Nuclear', ...event.affectedCommodities]),
    lat: plant.latitude,
    lon: plant.longitude,
    confidence: plant.confidence,
    nuclearPlant: plant,
  }
}

export function hasValidNuclearPlant(plant: NuclearPlantFacility): boolean {
  const coordsPresent = Number.isFinite(plant.latitude) && Number.isFinite(plant.longitude)
  return (
    Boolean(plant.facilityId) &&
    Boolean(plant.facilityName) &&
    plant.facilityKind === 'nuclear-plant' &&
    (plant.geospatialPrecision === 'exact' ? coordsPresent : !coordsPresent) &&
    plant.sourceDataset.length > 0 &&
    /^https:\/\/www\.eia\.gov\//.test(plant.sourceUrl) &&
    /^https:\/\/api\.eia\.gov\/v2\/electricity\/operating-generator-capacity\//.test(plant.sourceApiUrl) &&
    !/[?&]api_key=/i.test(plant.sourceApiUrl) &&
    plant.sourceName === 'U.S. Energy Information Administration' &&
    plant.provenance === 'official-api' &&
    Number.isFinite(plant.retrievedAt) &&
    Number.isFinite(plant.staleAt) &&
    plant.rawPayloadHash.length > 0 &&
    !(plant.rawPayloadJson ?? '').includes('api_key') &&
    plant.confidence >= 90
  )
}

export const EIA_NUCLEAR_SOURCE_ID = SOURCE_ID
