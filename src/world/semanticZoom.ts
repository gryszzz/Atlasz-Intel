export type SemanticZoomLevel =
  | 'planet'
  | 'region'
  | 'country'
  | 'metro'
  | 'local'
  | 'asset'

export type WorldLayerId =
  | 'material-events'
  | 'capital-gravity'
  | 'policy-pressure'
  | 'trade-corridors'
  | 'energy-flows'
  | 'shipping-routes'
  | 'weather-systems'
  | 'market-reactions'
  | 'ports'
  | 'power-plants'
  | 'refineries'
  | 'lng-terminals'
  | 'nuclear-plants'
  | 'grid-regions'
  | 'mines'
  | 'fabs'
  | 'data-centers'
  | 'vessels'
  | 'wallet-flows'
  | 'entity-ownership'
  | 'evidence'

export type SemanticZoomConfig = {
  level: SemanticZoomLevel
  minAltitude: number
  maxAltitude: number
  primaryLayers: WorldLayerId[]
  optionalLayers: WorldLayerId[]
  maxVisibleEntities: number
  aggregation: 'global' | 'region' | 'country' | 'cell' | 'raw'
}

export const SEMANTIC_ZOOM: SemanticZoomConfig[] = [
  {
    level: 'planet',
    minAltitude: 2.2,
    maxAltitude: Infinity,
    primaryLayers: [
      'material-events',
      'capital-gravity',
      'trade-corridors',
      'energy-flows',
      'weather-systems',
    ],
    optionalLayers: ['policy-pressure', 'market-reactions'],
    maxVisibleEntities: 80,
    aggregation: 'global',
  },
  {
    level: 'region',
    minAltitude: 1.45,
    maxAltitude: 2.2,
    primaryLayers: [
      'material-events',
      'policy-pressure',
      'trade-corridors',
      'energy-flows',
      'shipping-routes',
      'market-reactions',
    ],
    optionalLayers: ['ports', 'grid-regions', 'capital-gravity'],
    maxVisibleEntities: 180,
    aggregation: 'region',
  },
  {
    level: 'country',
    minAltitude: 0.9,
    maxAltitude: 1.45,
    primaryLayers: [
      'material-events',
      'ports',
      'grid-regions',
      'power-plants',
      'refineries',
      'lng-terminals',
      'nuclear-plants',
      'mines',
      'fabs',
    ],
    optionalLayers: [
      'shipping-routes',
      'policy-pressure',
      'entity-ownership',
      'market-reactions',
    ],
    maxVisibleEntities: 450,
    aggregation: 'country',
  },
  {
    level: 'metro',
    minAltitude: 0.5,
    maxAltitude: 0.9,
    primaryLayers: [
      'material-events',
      'ports',
      'power-plants',
      'refineries',
      'lng-terminals',
      'nuclear-plants',
      'mines',
      'fabs',
      'data-centers',
    ],
    optionalLayers: ['vessels', 'grid-regions', 'entity-ownership'],
    maxVisibleEntities: 900,
    aggregation: 'cell',
  },
  {
    level: 'local',
    minAltitude: 0.24,
    maxAltitude: 0.5,
    primaryLayers: [
      'material-events',
      'ports',
      'vessels',
      'power-plants',
      'refineries',
      'lng-terminals',
      'nuclear-plants',
      'mines',
      'fabs',
      'data-centers',
    ],
    optionalLayers: ['entity-ownership', 'evidence'],
    maxVisibleEntities: 1800,
    aggregation: 'cell',
  },
  {
    level: 'asset',
    minAltitude: 0,
    maxAltitude: 0.24,
    primaryLayers: ['material-events', 'entity-ownership', 'evidence'],
    optionalLayers: ['wallet-flows', 'vessels', 'market-reactions'],
    maxVisibleEntities: 3000,
    aggregation: 'raw',
  },
]

export function semanticZoomForAltitude(altitude: number): SemanticZoomConfig {
  const safeAltitude = Number.isFinite(altitude) ? Math.max(0, altitude) : Infinity
  return (
    SEMANTIC_ZOOM.find(
      (config) =>
        safeAltitude >= config.minAltitude &&
        safeAltitude < config.maxAltitude,
    ) ?? SEMANTIC_ZOOM[0]
  )
}
