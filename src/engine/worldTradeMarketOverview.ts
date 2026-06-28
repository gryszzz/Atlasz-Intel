import type { OsintSourceSnapshot, WorldIntelEvent } from '../worldIntel'

export type TradeOverviewLayerId =
  | 'trade-flows'
  | 'ports'
  | 'policy-sanctions'
  | 'market-evidence'
  | 'energy-infrastructure'
  | 'critical-minerals'
  | 'hazard-context'
  | 'media-observation'

export type TradeOverviewLayerState = {
  id: TradeOverviewLayerId
  label: string
  sourceIds: string[]
  status: 'online' | 'attention' | 'missing-config' | 'inactive'
  trustTier: string
  recordCount: number
  onlineSourceCount: number
  disabledReason?: string
  nonClaim: string
}

export type TradeCorridorRow = {
  id: string
  reporter: string
  partner: string
  commodity: string
  flow: string
  valueLabel: string
  period: string
  sourceUrl: string
  retrievedAt: number
  confidence: number
}

export type TradePortRow = {
  id: string
  name: string
  country: string
  kind: 'physical-port' | 'locode'
  detail: string
  sourceUrl: string
  retrievedAt: number
}

export type TradeSignalRow = {
  id: string
  label: string
  category: string
  sourceId: string
  proofUrl?: string
  observedAt: number
  confidence: number
}

export type WorldTradeMarketOverview = {
  metrics: Array<{ label: string; value: string; sub: string }>
  layers: TradeOverviewLayerState[]
  corridors: TradeCorridorRow[]
  ports: TradePortRow[]
  policySignals: TradeSignalRow[]
  marketSignals: TradeSignalRow[]
  infrastructureSignals: TradeSignalRow[]
  hazardSignals: TradeSignalRow[]
  unknowns: string[]
  nonClaims: string[]
}

type TradeLayerDefinition = {
  id: TradeOverviewLayerId
  label: string
  sourceIds: string[]
  trustTier: string
  eventMatch: (event: WorldIntelEvent) => boolean
  disabledReason: string
  nonClaim: string
}

const TRADE_LAYERS: TradeLayerDefinition[] = [
  {
    id: 'trade-flows',
    label: 'Trade flows',
    sourceIds: ['un-comtrade'],
    trustTier: 'official-api',
    eventMatch: (event) => Boolean(event.comtradeRecord),
    disabledReason: 'UN Comtrade key missing or connector unavailable.',
    nonClaim: 'Country and commodity trade-flow evidence only; no company supply-chain inference.',
  },
  {
    id: 'ports',
    label: 'Ports and trade locations',
    sourceIds: ['world-port-index', 'un-locode'],
    trustTier: 'official-api',
    eventMatch: (event) => Boolean(event.worldPort || event.unLocode),
    disabledReason: 'Port registry sources are unavailable or configured-only.',
    nonClaim: 'Port/location reference only; no live traffic, congestion, or disruption claim.',
  },
  {
    id: 'policy-sanctions',
    label: 'Policy and sanctions',
    sourceIds: ['ofac-sdn', 'federal-register', 'congress-gov'],
    trustTier: 'official-api',
    eventMatch: (event) => Boolean(event.ofacSanctionsRecord || event.regulatoryDocument || event.congressBillAction),
    disabledReason: 'Official policy sources are unavailable or key-gated.',
    nonClaim: 'Regulatory evidence only; no legal outcome or market impact prediction.',
  },
  {
    id: 'market-evidence',
    label: 'Market evidence',
    sourceIds: ['market-reference-master', 'sec-company-facts', 'sec-form4', 'sec-form13f', 'etf-holdings', 'sec-edgar'],
    trustTier: 'public-disclosure',
    eventMatch: (event) =>
      Boolean(event.marketIdentity || event.companyFact || event.form13fHolding || event.etfHolding || event.secFiling || event.form4Transaction),
    disabledReason: 'Market disclosure connectors are missing config or unavailable.',
    nonClaim: 'Disclosure/reference evidence only; no buy/sell/hold language or price forecast.',
  },
  {
    id: 'energy-infrastructure',
    label: 'Energy infrastructure',
    sourceIds: ['eia-power-plants', 'eia-refineries', 'lng-terminals', 'eia-nuclear', 'nrc-reactor-status', 'eia-balancing-authorities'],
    trustTier: 'official-api',
    eventMatch: (event) =>
      Boolean(event.eiaFacility || event.eiaRefinery || event.lngTerminal || event.nuclearPlant || event.nrcReactorStatus || event.gridRegion),
    disabledReason: 'Energy facility connectors are missing keys/config or unavailable.',
    nonClaim: 'Facility context only; no outage, damage, reliability, or disruption claim.',
  },
  {
    id: 'critical-minerals',
    label: 'Critical minerals',
    sourceIds: ['usgs-minerals'],
    trustTier: 'official-api',
    eventMatch: (event) => Boolean(event.mineralSite),
    disabledReason: 'USGS mineral source URL is not configured.',
    nonClaim: 'Mineral-site reference only; no reserve, ownership, production, or price signal.',
  },
  {
    id: 'hazard-context',
    label: 'Hazard context',
    sourceIds: ['noaa-alerts', 'usgs-earthquakes'],
    trustTier: 'official-api',
    eventMatch: (event) => Boolean(event.weatherAlert || event.earthquakeEvent),
    disabledReason: 'Hazard connectors are unavailable.',
    nonClaim: 'Hazards are context; they do not prove facility damage or market impact.',
  },
  {
    id: 'media-observation',
    label: 'Media observation',
    sourceIds: ['gdelt-doc'],
    trustTier: 'media-observation',
    eventMatch: (event) => Boolean(event.gdeltArticle),
    disabledReason: 'GDELT media connector unavailable or rate-limited.',
    nonClaim: 'Media observation stays low-trust and cannot verify an event by itself.',
  },
]

export function buildWorldTradeMarketOverview({
  events,
  sources,
}: {
  events: WorldIntelEvent[]
  sources: OsintSourceSnapshot[]
}): WorldTradeMarketOverview {
  const layers = TRADE_LAYERS.map((layer) => buildLayerState(layer, events, sources))
  const corridors = buildCorridors(events)
  const ports = buildPorts(events)
  const policySignals = buildSignals(events, (event) => Boolean(event.ofacSanctionsRecord || event.regulatoryDocument || event.congressBillAction)).slice(0, 5)
  const marketSignals = buildSignals(events, (event) =>
    Boolean(event.marketIdentity || event.companyFact || event.form13fHolding || event.etfHolding || event.secFiling || event.form4Transaction),
  ).slice(0, 5)
  const infrastructureSignals = buildSignals(events, (event) =>
    Boolean(event.eiaFacility || event.eiaRefinery || event.lngTerminal || event.nuclearPlant || event.gridRegion || event.mineralSite),
  ).slice(0, 5)
  const hazardSignals = buildSignals(events, (event) => Boolean(event.weatherAlert || event.earthquakeEvent)).slice(0, 5)
  const unknowns = buildUnknowns(layers, corridors)

  return {
    metrics: [
      { label: 'Trade-flow proof', value: String(corridors.length), sub: 'UN Comtrade rows in view' },
      { label: 'Ports / LOCODE', value: String(ports.length), sub: 'source-backed locations' },
      { label: 'Policy pressure', value: String(policySignals.length), sub: 'sanctions / rules / bills' },
      { label: 'Market evidence', value: String(marketSignals.length), sub: 'filings / ETF / identity' },
      { label: 'Infra context', value: String(infrastructureSignals.length), sub: 'facilities / grid / minerals' },
      { label: 'Hazard context', value: String(hazardSignals.length), sub: 'weather / earthquake only' },
    ],
    layers,
    corridors,
    ports,
    policySignals,
    marketSignals,
    infrastructureSignals,
    hazardSignals,
    unknowns,
    nonClaims: [
      'No trading advice, price prediction, or buy/sell/hold language.',
      'No outage, damage, congestion, disruption, or export-flow claim unless a source proves it.',
      'No company exposure from trade flow, ports, media, or curated reference alone.',
      'Watchlists and market relevance never increase truth confidence.',
    ],
  }
}

function buildLayerState(
  definition: TradeLayerDefinition,
  events: WorldIntelEvent[],
  sources: OsintSourceSnapshot[],
): TradeOverviewLayerState {
  const layerSources = definition.sourceIds
    .map((sourceId) => sources.find((source) => source.sourceId === sourceId))
    .filter((source): source is OsintSourceSnapshot => Boolean(source))
  const onlineSourceCount = layerSources.filter((source) => source.status === 'online').length
  const hasAttention = layerSources.some((source) => ['failed', 'rate-limited', 'offline'].includes(source.status))
  const hasMissingConfig = layerSources.some((source) => source.configured === false || source.status === 'disabled')
  const recordCount = events.filter(definition.eventMatch).length
  const status: TradeOverviewLayerState['status'] =
    onlineSourceCount > 0 ? 'online' : hasMissingConfig ? 'missing-config' : hasAttention ? 'attention' : 'inactive'
  return {
    id: definition.id,
    label: definition.label,
    sourceIds: definition.sourceIds,
    status,
    trustTier: definition.trustTier,
    recordCount,
    onlineSourceCount,
    disabledReason: status === 'online' ? undefined : definition.disabledReason,
    nonClaim: definition.nonClaim,
  }
}

function buildCorridors(events: WorldIntelEvent[]): TradeCorridorRow[] {
  return events
    .filter((event) => Boolean(event.comtradeRecord))
    .map((event) => {
      const record = event.comtradeRecord!
      return {
        id: record.id,
        reporter: record.reporterDesc,
        partner: record.partnerDesc,
        commodity: record.commodityDescription,
        flow: record.flowDesc,
        valueLabel: formatTradeValue(record.tradeValue),
        period: record.period,
        sourceUrl: record.sourceUrl,
        retrievedAt: record.retrievedAt,
        confidence: record.confidence,
      }
    })
    .sort((left, right) => numericValue(right.valueLabel) - numericValue(left.valueLabel))
    .slice(0, 6)
}

function buildPorts(events: WorldIntelEvent[]): TradePortRow[] {
  const rows: TradePortRow[] = []
  for (const event of events) {
    if (event.worldPort) {
      const port = event.worldPort
      rows.push({
        id: port.id,
        name: port.portName,
        country: port.country ?? port.countryCode ?? 'unknown country',
        kind: 'physical-port',
        detail: [port.harborSize, port.harborType, port.shelter].filter(Boolean).join(' / ') || 'physical port reference',
        sourceUrl: port.sourceUrl,
        retrievedAt: port.retrievedAt,
      })
    }
    if (event.unLocode) {
      const locode = event.unLocode
      rows.push({
        id: locode.id,
        name: `${locode.locationName} (${locode.locode})`,
        country: locode.countryCode,
        kind: 'locode',
        detail: locode.facilityKind,
        sourceUrl: locode.sourceUrl,
        retrievedAt: locode.retrievedAt,
      })
    }
  }
  return rows.slice(0, 8)
}

function buildSignals(events: WorldIntelEvent[], predicate: (event: WorldIntelEvent) => boolean): TradeSignalRow[] {
  return events
    .filter(predicate)
    .map((event) => ({
      id: event.id,
      label: event.title,
      category: String(event.category),
      sourceId: event.sourceId,
      proofUrl: event.sourceUrl,
      observedAt: event.timestamp,
      confidence: event.confidence,
    }))
    .sort((left, right) => right.observedAt - left.observedAt)
}

function buildUnknowns(layers: TradeOverviewLayerState[], corridors: TradeCorridorRow[]): string[] {
  const unknowns: string[] = []
  if (corridors.length === 0) unknowns.push('No live trade-flow rows are in the current view; do not infer corridors.')
  for (const layer of layers.filter((item) => item.status !== 'online')) {
    unknowns.push(`${layer.label}: ${layer.disabledReason}`)
  }
  return unknowns.slice(0, 8)
}

function formatTradeValue(value: number): string {
  if (!Number.isFinite(value)) return 'unknown'
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function numericValue(label: string): number {
  const value = Number(label.replace(/[$BMK]/g, ''))
  if (!Number.isFinite(value)) return 0
  if (label.endsWith('B')) return value * 1_000_000_000
  if (label.endsWith('M')) return value * 1_000_000
  if (label.endsWith('K')) return value * 1_000
  return value
}
