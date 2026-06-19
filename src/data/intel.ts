export type Severity = 'critical' | 'elevated' | 'watch' | 'stable'

export type SourceType = 'news' | 'market' | 'policy' | 'shipping' | 'macro' | 'research'

export type SourceTrailItem = {
  id: string
  sourceName: string
  sourceType: SourceType
  sourceUrl: string
  title: string
  observedAt: string
  publishedAt: string
  note: string
}

export type EvidenceNote = {
  id: string
  note: string
  supports: string
  confidenceImpact: 'raises' | 'limits' | 'neutral'
}

export type RawSourceItem = {
  id: string
  connector: 'mock-gdelt' | 'mock-market-tape' | 'mock-policy-calendar' | 'mock-shipping-wire'
  sourceName: string
  sourceUrl: string
  rawTitle: string
  rawExcerpt: string
  ingestedAt: string
  publishedAt: string
  normalizedEventId: string
}

export type IngestionPipelineStage = {
  id: string
  label: string
  description: string
  output: string
  status: 'seeded' | 'ready'
}

export type MarketMover = {
  ticker: string
  name: string
  price: string
  change: number
  volume: string
  catalyst: string
  connectedEvents: string[]
  confidence: number
}

export type RadarEvent = {
  id: string
  time: string
  category: string
  region: string
  severity: Severity
  confidence: number
  sourceCount: number
  title: string
  summary: string
  relationshipReason: string
  uncertainty: string
  detectedEntities: string[]
  linkedMarkets: string[]
  riskChannels: string[]
  evidenceNotes: EvidenceNote[]
  sourceTrail: SourceTrailItem[]
}

export type Signal = {
  id: string
  title: string
  explanation: string
  status: Severity
  confidence: number
  timeframe: string
  chain: string
  linkedEventIds: string[]
  linkedEntities: string[]
  linkedMarkets: string[]
  repeatedThemes: string[]
  relationshipStrength: number
  sourceCount: number
  recencyScore: number
  uncertainty: string
  evidenceTrail: EvidenceNote[]
  sourceTrail: SourceTrailItem[]
}

export type MarketExplanation = {
  symbol: string
  priceMove: string
  relatedEventIds: string[]
  relatedEntities: string[]
  linkedMarkets: string[]
  possibleCause: string
  relationshipReason: string
  confidence: number
  uncertainty: string
  sourceTrail: SourceTrailItem[]
  evidenceTrail: EvidenceNote[]
}

export type GraphNodeSeed = {
  id: string
  label: string
  kind: string
  position: { x: number; y: number }
  tone: Severity
}

export type GraphEdgeSeed = {
  id: string
  source: string
  target: string
  label: string
  strength: number
}

export type BriefItem = {
  id: string
  headline: string
  whyItMatters: string
  severity: Severity
  relatedEntities: string[]
  relatedMarkets: string[]
  confidence: number
  sourceCount: number
  uncertainty: string
  watchNext: string[]
  sourceTrail: SourceTrailItem[]
  evidenceTrail: EvidenceNote[]
}

const sourceTrail: Record<string, SourceTrailItem> = {
  redSeaWire: {
    id: 'src-red-sea-wire',
    sourceName: 'Atlasz Shipping Wire',
    sourceType: 'shipping',
    sourceUrl: 'local://sources/red-sea-shipping-risk',
    title: 'Commercial vessels report higher route-risk premiums near Red Sea corridors',
    observedAt: '2026-06-19T07:45:00-04:00',
    publishedAt: '2026-06-19T07:31:00-04:00',
    note: 'Seeded shipping-risk item used to test route disruption extraction.',
  },
  freightTape: {
    id: 'src-freight-tape',
    sourceName: 'Mock Freight Rate Tape',
    sourceType: 'market',
    sourceUrl: 'local://sources/freight-rate-snapshot',
    title: 'Freight and insurance proxies firm as energy futures bid',
    observedAt: '2026-06-19T07:48:00-04:00',
    publishedAt: '2026-06-19T07:40:00-04:00',
    note: 'Market proxy snapshot links shipping stress to energy-sensitive assets.',
  },
  oilTape: {
    id: 'src-oil-tape',
    sourceName: 'Mock Market Tape',
    sourceType: 'market',
    sourceUrl: 'local://sources/wti-intraday-snapshot',
    title: 'WTI crude and energy equities rise while airline basket weakens',
    observedAt: '2026-06-19T08:05:00-04:00',
    publishedAt: '2026-06-19T08:00:00-04:00',
    note: 'Price confirmation is event-adjacent, not direct supply confirmation.',
  },
  taiwanWire: {
    id: 'src-taiwan-wire',
    sourceName: 'Regional Security Wire',
    sourceType: 'news',
    sourceUrl: 'local://sources/taiwan-strait-alert',
    title: 'Taiwan Strait alert mentions advanced chip supply concentration',
    observedAt: '2026-06-19T06:20:00-04:00',
    publishedAt: '2026-06-19T06:06:00-04:00',
    note: 'Seeded regional-risk item for entity extraction around Taiwan, TSMC, and semiconductors.',
  },
  chipPolicy: {
    id: 'src-chip-policy',
    sourceName: 'Mock Export Control Monitor',
    sourceType: 'policy',
    sourceUrl: 'local://sources/us-chip-controls-calendar',
    title: 'Chip-control calendar flags possible language around advanced nodes',
    observedAt: '2026-06-19T06:42:00-04:00',
    publishedAt: '2026-06-18T18:10:00-04:00',
    note: 'Policy-calendar context raises relevance but does not confirm immediate rule changes.',
  },
  rareEarthsPolicy: {
    id: 'src-rare-earths-policy',
    sourceName: 'Industrial Policy Monitor',
    sourceType: 'policy',
    sourceUrl: 'local://sources/china-rare-earths-restriction-watch',
    title: 'Rare earth restriction chatter references EV magnets and defense electronics',
    observedAt: '2026-06-19T05:55:00-04:00',
    publishedAt: '2026-06-19T05:44:00-04:00',
    note: 'Seeded policy-risk item for China rare earth leverage and downstream exposure.',
  },
  evSupplyChain: {
    id: 'src-ev-supply-chain',
    sourceName: 'Atlasz Supply Chain Map',
    sourceType: 'research',
    sourceUrl: 'local://sources/ev-defense-input-map',
    title: 'EV and defense supply-chain map flags rare earth processing concentration',
    observedAt: '2026-06-19T06:04:00-04:00',
    publishedAt: '2026-06-18T21:00:00-04:00',
    note: 'Local relationship map links rare earth inputs to EV and defense electronics exposure.',
  },
  fedCalendar: {
    id: 'src-fed-calendar',
    sourceName: 'Mock Central Bank Calendar',
    sourceType: 'macro',
    sourceUrl: 'local://sources/central-bank-language-watch',
    title: 'Central bank language keeps real-yield sensitive assets on watch',
    observedAt: '2026-06-19T04:30:00-04:00',
    publishedAt: '2026-06-19T04:16:00-04:00',
    note: 'Macro-calendar context used for gold, duration, Nasdaq, and Bitcoin sensitivity.',
  },
  cryptoFlows: {
    id: 'src-crypto-flows',
    sourceName: 'Mock Crypto Flow Snapshot',
    sourceType: 'market',
    sourceUrl: 'local://sources/bitcoin-liquidity-snapshot',
    title: 'Bitcoin firms with risk appetite while liquidity proxies remain mixed',
    observedAt: '2026-06-19T08:18:00-04:00',
    publishedAt: '2026-06-19T08:12:00-04:00',
    note: 'Flow context supports sensitivity, but does not prove a single-cause move.',
  },
  europeGas: {
    id: 'src-europe-gas',
    sourceName: 'Mock European Energy Monitor',
    sourceType: 'macro',
    sourceUrl: 'local://sources/europe-gas-storage-buffer',
    title: 'European gas storage buffers immediate energy-security stress',
    observedAt: '2026-06-19T03:10:00-04:00',
    publishedAt: '2026-06-19T02:52:00-04:00',
    note: 'Regional energy context limits immediate stress but keeps industrial margins watchlisted.',
  },
}

export const rawSourceItems: RawSourceItem[] = [
  {
    id: 'raw-red-sea-1',
    connector: 'mock-shipping-wire',
    sourceName: sourceTrail.redSeaWire.sourceName,
    sourceUrl: sourceTrail.redSeaWire.sourceUrl,
    rawTitle: sourceTrail.redSeaWire.title,
    rawExcerpt: 'Route-risk references detected: Red Sea, insurance premium, crude, freight, airline margins.',
    ingestedAt: sourceTrail.redSeaWire.observedAt,
    publishedAt: sourceTrail.redSeaWire.publishedAt,
    normalizedEventId: 'red-sea',
  },
  {
    id: 'raw-red-sea-2',
    connector: 'mock-market-tape',
    sourceName: sourceTrail.oilTape.sourceName,
    sourceUrl: sourceTrail.oilTape.sourceUrl,
    rawTitle: sourceTrail.oilTape.title,
    rawExcerpt: 'WTI, XLE, GLD, and airline basket used as market-linking confirmation.',
    ingestedAt: sourceTrail.oilTape.observedAt,
    publishedAt: sourceTrail.oilTape.publishedAt,
    normalizedEventId: 'red-sea',
  },
  {
    id: 'raw-taiwan-1',
    connector: 'mock-gdelt',
    sourceName: sourceTrail.taiwanWire.sourceName,
    sourceUrl: sourceTrail.taiwanWire.sourceUrl,
    rawTitle: sourceTrail.taiwanWire.title,
    rawExcerpt: 'Entities detected: Taiwan, TSMC, advanced chips, Nvidia, Apple suppliers, Nasdaq.',
    ingestedAt: sourceTrail.taiwanWire.observedAt,
    publishedAt: sourceTrail.taiwanWire.publishedAt,
    normalizedEventId: 'taiwan',
  },
  {
    id: 'raw-rare-earths-1',
    connector: 'mock-policy-calendar',
    sourceName: sourceTrail.rareEarthsPolicy.sourceName,
    sourceUrl: sourceTrail.rareEarthsPolicy.sourceUrl,
    rawTitle: sourceTrail.rareEarthsPolicy.title,
    rawExcerpt: 'Policy references include China, rare earths, EV magnets, defense electronics, and strategic inputs.',
    ingestedAt: sourceTrail.rareEarthsPolicy.observedAt,
    publishedAt: sourceTrail.rareEarthsPolicy.publishedAt,
    normalizedEventId: 'rare-earths',
  },
  {
    id: 'raw-fed-1',
    connector: 'mock-policy-calendar',
    sourceName: sourceTrail.fedCalendar.sourceName,
    sourceUrl: sourceTrail.fedCalendar.sourceUrl,
    rawTitle: sourceTrail.fedCalendar.title,
    rawExcerpt: 'Macro sensitivity extraction links real yields, gold, Nasdaq, Bitcoin, TLT, and dollar pressure.',
    ingestedAt: sourceTrail.fedCalendar.observedAt,
    publishedAt: sourceTrail.fedCalendar.publishedAt,
    normalizedEventId: 'central-bank',
  },
  {
    id: 'raw-europe-gas-1',
    connector: 'mock-gdelt',
    sourceName: sourceTrail.europeGas.sourceName,
    sourceUrl: sourceTrail.europeGas.sourceUrl,
    rawTitle: sourceTrail.europeGas.title,
    rawExcerpt: 'European storage buffer reduces immediate risk, but industrial margin exposure remains mapped.',
    ingestedAt: sourceTrail.europeGas.observedAt,
    publishedAt: sourceTrail.europeGas.publishedAt,
    normalizedEventId: 'europe-energy',
  },
]

export const ingestionPipeline: IngestionPipelineStage[] = [
  {
    id: 'raw',
    label: 'Raw source item',
    description: 'Mock connectors collect headline text, timestamps, source identity, and local URL placeholders.',
    output: `${rawSourceItems.length} seeded items`,
    status: 'seeded',
  },
  {
    id: 'normalize',
    label: 'Normalized event',
    description: 'Raw items are collapsed into structured events with category, region, severity, and timestamps.',
    output: '5 event objects',
    status: 'seeded',
  },
  {
    id: 'entities',
    label: 'Entity extraction',
    description: 'Detected countries, companies, commodities, sectors, routes, and macro factors are attached.',
    output: '35 detected entities',
    status: 'seeded',
  },
  {
    id: 'markets',
    label: 'Market linking',
    description: 'Events are linked to tickers, ETFs, commodities, and exposed sectors with relationship reasons.',
    output: '24 linked markets',
    status: 'seeded',
  },
  {
    id: 'signals',
    label: 'Signal generation',
    description: 'Clusters are scored by recency, severity, source count, repeated themes, and relationship strength.',
    output: '4 evidence-backed signals',
    status: 'seeded',
  },
  {
    id: 'connectors',
    label: 'Real connector slot',
    description: 'GDELT, news, macro, market, and filing connectors can replace the mock inputs without changing the UI.',
    output: 'Ready for GDELT',
    status: 'ready',
  },
]

export const marketMovers: MarketMover[] = [
  {
    ticker: 'CL',
    name: 'WTI Crude',
    price: '81.42',
    change: 2.64,
    volume: '1.4x',
    catalyst: 'Shipping-risk premium and refinery margin pressure',
    connectedEvents: ['Red Sea shipping risk', 'Middle East tension', 'Inflation impulse'],
    confidence: 78,
  },
  {
    ticker: 'SOXX',
    name: 'Semiconductors',
    price: '239.18',
    change: -1.18,
    volume: '1.2x',
    catalyst: 'Taiwan exposure and export-control watch',
    connectedEvents: ['Taiwan Strait alert', 'US chip controls', 'TSMC concentration'],
    confidence: 73,
  },
  {
    ticker: 'GLD',
    name: 'Gold ETF',
    price: '218.56',
    change: 1.04,
    volume: '1.1x',
    catalyst: 'Safe-haven bid and real-yield sensitivity',
    connectedEvents: ['Geopolitical hedge', 'Dollar drift', 'Central bank demand'],
    confidence: 69,
  },
  {
    ticker: 'DAL',
    name: 'Delta Air Lines',
    price: '48.76',
    change: -1.92,
    volume: '1.6x',
    catalyst: 'Jet-fuel sensitivity from crude move',
    connectedEvents: ['Oil pressure', 'Travel margins', 'Consumer squeeze'],
    confidence: 65,
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    price: '66,820',
    change: 1.36,
    volume: '0.9x',
    catalyst: 'Liquidity expectations and policy headline sensitivity',
    connectedEvents: ['ETF flows', 'Rate-cut expectations', 'Regulatory calendar'],
    confidence: 61,
  },
]

export const watchlist: MarketMover[] = [
  {
    ticker: 'QQQ',
    name: 'Nasdaq 100',
    price: '472.08',
    change: -0.42,
    volume: '1.0x',
    catalyst: 'Mega-cap duration and semiconductor beta',
    connectedEvents: ['Taiwan risk', 'AI capex', 'Real rates'],
    confidence: 66,
  },
  {
    ticker: 'XLE',
    name: 'Energy Select Sector',
    price: '94.23',
    change: 1.87,
    volume: '1.3x',
    catalyst: 'Crude move and energy-sector breadth',
    connectedEvents: ['WTI crude', 'Shipping costs', 'OPEC headline risk'],
    confidence: 74,
  },
  {
    ticker: 'NVDA',
    name: 'Nvidia',
    price: '128.44',
    change: -0.88,
    volume: '1.2x',
    catalyst: 'AI demand remains strong; supply-chain risk is repricing',
    connectedEvents: ['TSMC', 'China controls', 'Data-center capex'],
    confidence: 70,
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    price: '196.71',
    change: -0.31,
    volume: '0.8x',
    catalyst: 'China exposure and supplier concentration',
    connectedEvents: ['Taiwan', 'China demand', 'Tariff watch'],
    confidence: 59,
  },
]

export const marketSeries: Record<string, Array<{ time: string; price: number; volume: number }>> = {
  CL: [
    { time: '02:00', price: 78.4, volume: 48 },
    { time: '04:00', price: 78.8, volume: 52 },
    { time: '06:00', price: 79.2, volume: 61 },
    { time: '08:00', price: 80.6, volume: 74 },
    { time: '10:00', price: 81.1, volume: 82 },
    { time: '12:00', price: 81.4, volume: 87 },
  ],
  QQQ: [
    { time: '02:00', price: 475.2, volume: 41 },
    { time: '04:00', price: 474.8, volume: 39 },
    { time: '06:00', price: 473.9, volume: 46 },
    { time: '08:00', price: 471.5, volume: 58 },
    { time: '10:00', price: 472.6, volume: 64 },
    { time: '12:00', price: 472.1, volume: 62 },
  ],
  SOXX: [
    { time: '02:00', price: 244.2, volume: 45 },
    { time: '04:00', price: 243.4, volume: 48 },
    { time: '06:00', price: 241.8, volume: 59 },
    { time: '08:00', price: 238.9, volume: 79 },
    { time: '10:00', price: 239.6, volume: 76 },
    { time: '12:00', price: 239.2, volume: 73 },
  ],
  BTC: [
    { time: '02:00', price: 65600, volume: 52 },
    { time: '04:00', price: 66120, volume: 57 },
    { time: '06:00', price: 66540, volume: 61 },
    { time: '08:00', price: 67080, volume: 69 },
    { time: '10:00', price: 66840, volume: 64 },
    { time: '12:00', price: 66820, volume: 62 },
  ],
  GLD: [
    { time: '02:00', price: 216.9, volume: 37 },
    { time: '04:00', price: 217.4, volume: 41 },
    { time: '06:00', price: 217.9, volume: 45 },
    { time: '08:00', price: 218.2, volume: 51 },
    { time: '10:00', price: 218.7, volume: 55 },
    { time: '12:00', price: 218.6, volume: 54 },
  ],
  DAL: [
    { time: '02:00', price: 49.7, volume: 32 },
    { time: '04:00', price: 49.5, volume: 35 },
    { time: '06:00', price: 49.2, volume: 42 },
    { time: '08:00', price: 48.8, volume: 61 },
    { time: '10:00', price: 48.6, volume: 66 },
    { time: '12:00', price: 48.8, volume: 63 },
  ],
  XLE: [
    { time: '02:00', price: 92.8, volume: 38 },
    { time: '04:00', price: 93.1, volume: 43 },
    { time: '06:00', price: 93.5, volume: 54 },
    { time: '08:00', price: 94.1, volume: 66 },
    { time: '10:00', price: 94.4, volume: 72 },
    { time: '12:00', price: 94.2, volume: 70 },
  ],
  NVDA: [
    { time: '02:00', price: 130.1, volume: 49 },
    { time: '04:00', price: 129.7, volume: 52 },
    { time: '06:00', price: 129.1, volume: 59 },
    { time: '08:00', price: 127.9, volume: 74 },
    { time: '10:00', price: 128.6, volume: 71 },
    { time: '12:00', price: 128.4, volume: 68 },
  ],
  AAPL: [
    { time: '02:00', price: 197.5, volume: 31 },
    { time: '04:00', price: 197.1, volume: 32 },
    { time: '06:00', price: 196.8, volume: 37 },
    { time: '08:00', price: 196.2, volume: 43 },
    { time: '10:00', price: 196.9, volume: 41 },
    { time: '12:00', price: 196.7, volume: 39 },
  ],
}

export const radarEvents: RadarEvent[] = [
  {
    id: 'red-sea',
    time: '07:45 ET',
    category: 'Trade route',
    region: 'Middle East',
    severity: 'elevated',
    confidence: 78,
    sourceCount: 3,
    title: 'Red Sea shipping risk lifts energy and freight sensitivity',
    summary:
      'Longer routes and insurance pressure can push crude, refined products, shipping costs, and inflation expectations higher.',
    relationshipReason:
      'Shipping-route stress mentions Red Sea corridors, insurance costs, crude sensitivity, energy equities, gold, and airline margin pressure.',
    uncertainty:
      'Moderate confidence because the link is event-driven and market-confirmed, but not yet confirmed by direct supply disruption data.',
    detectedEntities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'XLE', 'Gold', 'Airlines'],
    linkedMarkets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    riskChannels: ['Freight cost', 'Oil premium', 'Inflation risk', 'Airline margins'],
    evidenceNotes: [
      {
        id: 'ev-red-sea-1',
        note: 'Two seeded sources mention Red Sea route risk and higher insurance or freight pressure.',
        supports: 'Event severity and shipping-risk classification',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-red-sea-2',
        note: 'WTI and XLE are bid while airline exposure is weak, giving cross-market confirmation.',
        supports: 'Market-linking logic to CL, XLE, GLD, DAL, and UAL',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-red-sea-3',
        note: 'No direct outage or barrel-supply number is present in the seeded source layer.',
        supports: 'Uncertainty note',
        confidenceImpact: 'limits',
      },
    ],
    sourceTrail: [sourceTrail.redSeaWire, sourceTrail.freightTape, sourceTrail.oilTape],
  },
  {
    id: 'taiwan',
    time: '06:20 ET',
    category: 'Geopolitics',
    region: 'Asia Pacific',
    severity: 'critical',
    confidence: 73,
    sourceCount: 2,
    title: 'Taiwan tension raises semiconductor concentration risk',
    summary:
      'The highest-exposure chain runs through TSMC, advanced-node chips, AI hardware, Apple suppliers, and Nasdaq beta.',
    relationshipReason:
      'The event mentions Taiwan and advanced-chip concentration; the local graph maps Taiwan to TSMC, SOXX, Nvidia, Apple, and QQQ.',
    uncertainty:
      'High structural exposure, but immediate market impact depends on headline severity, policy language, and whether the move broadens beyond semis.',
    detectedEntities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple', 'Nasdaq 100'],
    linkedMarkets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    riskChannels: ['Supply-chain concentration', 'Export controls', 'AI hardware availability'],
    evidenceNotes: [
      {
        id: 'ev-taiwan-1',
        note: 'The seeded regional item directly names Taiwan and advanced chip supply concentration.',
        supports: 'Entity extraction around Taiwan, TSMC, and semiconductors',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-taiwan-2',
        note: 'Export-control calendar context increases relevance for Nvidia, SOXX, and QQQ.',
        supports: 'Policy-risk linkage',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-taiwan-3',
        note: 'The source layer has policy-calendar context but no confirmed new restriction.',
        supports: 'Uncertainty note',
        confidenceImpact: 'limits',
      },
    ],
    sourceTrail: [sourceTrail.taiwanWire, sourceTrail.chipPolicy],
  },
  {
    id: 'rare-earths',
    time: '05:55 ET',
    category: 'Industrial policy',
    region: 'China',
    severity: 'elevated',
    confidence: 68,
    sourceCount: 2,
    title: 'Rare earth restriction chatter pressures EV and defense chains',
    summary:
      'Magnet and battery supply concerns can hit autos, renewables, defense electronics, and countries reliant on Chinese processing.',
    relationshipReason:
      'Policy chatter references rare earth restrictions and the local supply-chain map links those inputs to EVs, defense electronics, Tesla, and battery ETFs.',
    uncertainty:
      'Moderate confidence because the risk depends on whether chatter becomes formal policy and whether exemptions or alternate supply appear.',
    detectedEntities: ['China', 'Rare Earths', 'EV Supply Chain', 'Tesla', 'Defense Electronics'],
    linkedMarkets: ['TSLA', 'LIT', 'XAR', 'GM'],
    riskChannels: ['Input scarcity', 'Policy retaliation', 'Strategic inventory rebuild'],
    evidenceNotes: [
      {
        id: 'ev-rare-1',
        note: 'Policy monitor item mentions rare earth restrictions, EV magnets, and defense electronics.',
        supports: 'Industrial-policy event classification',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-rare-2',
        note: 'Local relationship map connects rare earth processing concentration to EV and defense exposure.',
        supports: 'Market linkage to TSLA, LIT, XAR, and GM',
        confidenceImpact: 'raises',
      },
      {
        id: 'ev-rare-3',
        note: 'No formal rule text is present in the seeded source trail.',
        supports: 'Uncertainty note',
        confidenceImpact: 'limits',
      },
    ],
    sourceTrail: [sourceTrail.rareEarthsPolicy, sourceTrail.evSupplyChain],
  },
  {
    id: 'central-bank',
    time: '04:30 ET',
    category: 'Macro',
    region: 'United States',
    severity: 'watch',
    confidence: 61,
    sourceCount: 2,
    title: 'Central bank language keeps rate-sensitive assets on watch',
    summary:
      'Duration-sensitive equities, crypto, gold, and dollar crosses remain linked to any shift in real-rate expectations.',
    relationshipReason:
      'Policy-calendar language maps to real yields and liquidity-sensitive markets; Bitcoin, gold, TLT, and QQQ are linked through rate expectations.',
    uncertainty:
      'Lower confidence because policy language is indirect and crypto can move on flows, positioning, or market-structure factors.',
    detectedEntities: ['Federal Reserve', 'Real Yields', 'Gold', 'Bitcoin', 'Nasdaq 100'],
    linkedMarkets: ['QQQ', 'TLT', 'GLD', 'BTC'],
    riskChannels: ['Discount rates', 'Liquidity expectations', 'Dollar pressure'],
    evidenceNotes: [
      {
        id: 'ev-fed-1',
        note: 'Policy calendar item references real-yield sensitive assets.',
        supports: 'Macro classification and market-linking logic',
        confidenceImpact: 'neutral',
      },
      {
        id: 'ev-fed-2',
        note: 'Crypto flow snapshot supports Bitcoin liquidity sensitivity but is not a direct cause.',
        supports: 'BTC linkage with limited confidence',
        confidenceImpact: 'limits',
      },
    ],
    sourceTrail: [sourceTrail.fedCalendar, sourceTrail.cryptoFlows],
  },
  {
    id: 'europe-energy',
    time: '03:10 ET',
    category: 'Energy security',
    region: 'Europe',
    severity: 'watch',
    confidence: 57,
    sourceCount: 1,
    title: 'European gas storage buffers energy-security headlines',
    summary:
      'Storage levels reduce immediate stress, but industrial energy costs remain sensitive to shipping and weather shocks.',
    relationshipReason:
      'Energy-storage context lowers immediate regional stress while preserving links to industrial margins, chemicals, and natural gas proxies.',
    uncertainty:
      'Limited source count and no live weather or pipeline data keep confidence moderate-low.',
    detectedEntities: ['Europe', 'Natural Gas', 'Industrial Margins', 'Chemicals'],
    linkedMarkets: ['UNG', 'VGK', 'XLB'],
    riskChannels: ['Energy cost', 'Manufacturing margin', 'Weather volatility'],
    evidenceNotes: [
      {
        id: 'ev-europe-1',
        note: 'Storage buffer reduces immediate stress but still maps to industrial cost exposure.',
        supports: 'Stable-to-watch severity rather than elevated severity',
        confidenceImpact: 'neutral',
      },
      {
        id: 'ev-europe-2',
        note: 'Only one seeded regional source is present.',
        supports: 'Uncertainty note',
        confidenceImpact: 'limits',
      },
    ],
    sourceTrail: [sourceTrail.europeGas],
  },
]

const eventById = Object.fromEntries(radarEvents.map((event) => [event.id, event]))
const sourceTrailForEvents = (eventIds: string[]) =>
  Array.from(new Map(eventIds.flatMap((id) => eventById[id]?.sourceTrail ?? []).map((source) => [source.id, source])).values())
const evidenceForEvents = (eventIds: string[]) => eventIds.flatMap((id) => eventById[id]?.evidenceNotes ?? [])

export const topSignals: Signal[] = [
  {
    id: 'oil-inflation',
    title: 'Oil-linked risk is rising across shipping, energy, gold, and airline exposure',
    explanation:
      'Multiple shipping-risk items mention Red Sea routes, freight pressure, energy exposure, and inflation-sensitive markets. Related markets include CL, XLE, GLD, and airline equities. Confidence is moderate-high because the link is event-driven and cross-market confirmed, but not backed by direct supply data.',
    status: 'elevated',
    confidence: 76,
    timeframe: '1-5 days',
    chain: 'Red Sea -> Shipping Risk -> Oil -> XLE -> Inflation Risk -> Gold',
    linkedEventIds: ['red-sea', 'central-bank'],
    linkedEntities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'XLE', 'Inflation Risk', 'Gold', 'Airlines'],
    linkedMarkets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    repeatedThemes: ['shipping risk', 'energy pressure', 'inflation hedge', 'airline margins'],
    relationshipStrength: 82,
    sourceCount: 4,
    recencyScore: 88,
    uncertainty:
      'No direct supply-disruption estimate is present; the signal could fade if shipping-risk headlines de-escalate.',
    evidenceTrail: evidenceForEvents(['red-sea', 'central-bank']),
    sourceTrail: sourceTrailForEvents(['red-sea', 'central-bank']),
  },
  {
    id: 'semi-risk',
    title: 'Semiconductor beta is absorbing Taiwan concentration risk',
    explanation:
      'Taiwan-related event extraction clusters around TSMC, advanced-node chips, Nvidia, Apple suppliers, SOXX, and QQQ. Relationship strength is high because the entity graph has a direct supply-chain path from Taiwan to index beta.',
    status: 'critical',
    confidence: 72,
    timeframe: 'Intraday to 2 weeks',
    chain: 'Taiwan -> TSMC -> Semiconductors -> Nvidia -> Nasdaq',
    linkedEventIds: ['taiwan', 'rare-earths'],
    linkedEntities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple', 'Nasdaq 100'],
    linkedMarkets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    repeatedThemes: ['supplier concentration', 'export controls', 'AI hardware availability'],
    relationshipStrength: 89,
    sourceCount: 4,
    recencyScore: 83,
    uncertainty:
      'The system has exposure evidence, not proof of disruption. Watch whether weakness spreads from SOXX into broader QQQ breadth.',
    evidenceTrail: evidenceForEvents(['taiwan', 'rare-earths']),
    sourceTrail: sourceTrailForEvents(['taiwan', 'rare-earths']),
  },
  {
    id: 'rare-earths',
    title: 'Rare earth policy risk is moving from headline to supply-chain map',
    explanation:
      'China rare earth chatter repeats across policy and local supply-chain sources, with linked entities in EV magnets, defense electronics, Tesla, battery ETFs, and strategic inputs.',
    status: 'elevated',
    confidence: 68,
    timeframe: '2-8 weeks',
    chain: 'China -> Rare Earths -> EV Supply Chain -> Tesla -> QQQ',
    linkedEventIds: ['rare-earths'],
    linkedEntities: ['China', 'Rare Earths', 'EV Supply Chain', 'Defense Electronics', 'Tesla'],
    linkedMarkets: ['TSLA', 'LIT', 'XAR', 'GM'],
    repeatedThemes: ['input scarcity', 'policy retaliation', 'strategic inventory'],
    relationshipStrength: 77,
    sourceCount: 2,
    recencyScore: 76,
    uncertainty:
      'The signal depends on formal policy action; current evidence is restriction chatter plus structural supply-chain mapping.',
    evidenceTrail: evidenceForEvents(['rare-earths']),
    sourceTrail: sourceTrailForEvents(['rare-earths']),
  },
  {
    id: 'liquidity-crypto',
    title: 'Crypto remains tied to liquidity expectations, not isolated narrative',
    explanation:
      'Bitcoin strength is linked to central bank language, real yields, dollar pressure, ETF-flow context, and Nasdaq correlation. Confidence is limited because flow and positioning data are mocked.',
    status: 'watch',
    confidence: 61,
    timeframe: 'This week',
    chain: 'Fed Language -> Real Yields -> Dollar -> Bitcoin -> Risk Appetite',
    linkedEventIds: ['central-bank'],
    linkedEntities: ['Federal Reserve', 'Real Yields', 'Dollar', 'ETF Flows', 'Bitcoin'],
    linkedMarkets: ['BTC', 'QQQ', 'TLT', 'GLD'],
    repeatedThemes: ['real yields', 'liquidity expectations', 'risk appetite'],
    relationshipStrength: 64,
    sourceCount: 2,
    recencyScore: 69,
    uncertainty:
      'Crypto can move on flows and market structure that are not yet represented by real connectors.',
    evidenceTrail: evidenceForEvents(['central-bank']),
    sourceTrail: sourceTrailForEvents(['central-bank']),
  },
]

export const marketExplanations: Record<string, MarketExplanation> = {
  CL: {
    symbol: 'CL',
    priceMove: '+2.64%',
    relatedEventIds: ['red-sea', 'central-bank'],
    relatedEntities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'Inflation Risk'],
    linkedMarkets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    possibleCause:
      'Shipping-risk premium is being priced into crude while energy equities and gold confirm a broader risk/inflation channel.',
    relationshipReason:
      'The system connected CL because Red Sea route-risk sources mention freight and insurance pressure, and the market tape shows crude and XLE moving together.',
    confidence: 78,
    uncertainty: 'No direct supply-disruption quantity is present, so the move may still be headline-premium rather than physical shortage.',
    sourceTrail: sourceTrailForEvents(['red-sea', 'central-bank']),
    evidenceTrail: evidenceForEvents(['red-sea', 'central-bank']),
  },
  SOXX: {
    symbol: 'SOXX',
    priceMove: '-1.18%',
    relatedEventIds: ['taiwan'],
    relatedEntities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple'],
    linkedMarkets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    possibleCause:
      'The semiconductor basket is repricing Taiwan and advanced-node concentration risk.',
    relationshipReason:
      'The graph path from Taiwan to TSMC to semiconductors and QQQ is direct and high strength.',
    confidence: 73,
    uncertainty: 'The source trail shows exposure risk, not confirmed supply disruption or new export-control text.',
    sourceTrail: sourceTrailForEvents(['taiwan']),
    evidenceTrail: evidenceForEvents(['taiwan']),
  },
  GLD: {
    symbol: 'GLD',
    priceMove: '+1.04%',
    relatedEventIds: ['red-sea', 'central-bank'],
    relatedEntities: ['Gold', 'Inflation Risk', 'Real Yields', 'Geopolitical Hedge'],
    linkedMarkets: ['GLD', 'CL', 'XLE', 'TLT'],
    possibleCause:
      'Gold is being linked to geopolitical hedge demand and real-yield sensitivity.',
    relationshipReason:
      'The system connects GLD to shipping-risk inflation channels and central-bank real-yield context.',
    confidence: 69,
    uncertainty: 'Gold can also move on dollar and rate factors not fully represented in this seed set.',
    sourceTrail: sourceTrailForEvents(['red-sea', 'central-bank']),
    evidenceTrail: evidenceForEvents(['red-sea', 'central-bank']),
  },
  DAL: {
    symbol: 'DAL',
    priceMove: '-1.92%',
    relatedEventIds: ['red-sea'],
    relatedEntities: ['Airlines', 'Jet Fuel', 'WTI Crude', 'Consumer Margins'],
    linkedMarkets: ['DAL', 'UAL', 'CL', 'XLE'],
    possibleCause:
      'Airline equities are pressured by the same crude and fuel-cost channel supporting energy exposure.',
    relationshipReason:
      'DAL is linked as a negative exposure to oil-driven margin pressure when crude risk premium rises.',
    confidence: 65,
    uncertainty: 'Company-specific booking, labor, or guidance factors are not represented in the source trail.',
    sourceTrail: sourceTrailForEvents(['red-sea']),
    evidenceTrail: evidenceForEvents(['red-sea']),
  },
  BTC: {
    symbol: 'BTC',
    priceMove: '+1.36%',
    relatedEventIds: ['central-bank'],
    relatedEntities: ['Bitcoin', 'ETF Flows', 'Real Yields', 'Dollar', 'Risk Appetite'],
    linkedMarkets: ['BTC', 'QQQ', 'TLT', 'GLD'],
    possibleCause:
      'Bitcoin is being treated as a liquidity-sensitive asset in the current local evidence layer.',
    relationshipReason:
      'The system links BTC through central-bank language, real yields, and mock crypto flow context.',
    confidence: 61,
    uncertainty: 'The flow snapshot is mocked and does not include exchange-level positioning or order-book data.',
    sourceTrail: sourceTrailForEvents(['central-bank']),
    evidenceTrail: evidenceForEvents(['central-bank']),
  },
  QQQ: {
    symbol: 'QQQ',
    priceMove: '-0.42%',
    relatedEventIds: ['taiwan', 'central-bank'],
    relatedEntities: ['Nasdaq 100', 'Semiconductors', 'Real Yields', 'Nvidia', 'Apple'],
    linkedMarkets: ['QQQ', 'SOXX', 'NVDA', 'AAPL', 'TLT'],
    possibleCause:
      'QQQ is exposed to semiconductor concentration and real-yield pressure at the same time.',
    relationshipReason:
      'Taiwan and macro events both map into Nasdaq leadership through semis, AI hardware, and duration-sensitive growth equities.',
    confidence: 66,
    uncertainty: 'Index-level movement could be driven by unrelated mega-cap flows not represented in the source trail.',
    sourceTrail: sourceTrailForEvents(['taiwan', 'central-bank']),
    evidenceTrail: evidenceForEvents(['taiwan', 'central-bank']),
  },
  XLE: {
    symbol: 'XLE',
    priceMove: '+1.87%',
    relatedEventIds: ['red-sea'],
    relatedEntities: ['Energy Equities', 'WTI Crude', 'Shipping Risk', 'Inflation Risk'],
    linkedMarkets: ['XLE', 'CL', 'GLD'],
    possibleCause:
      'Energy equities are confirming the crude risk-premium channel.',
    relationshipReason:
      'XLE is linked because crude and energy breadth are moving with shipping-risk evidence.',
    confidence: 74,
    uncertainty: 'The signal is weaker if crude strength fails to hold or does not broaden across energy constituents.',
    sourceTrail: sourceTrailForEvents(['red-sea']),
    evidenceTrail: evidenceForEvents(['red-sea']),
  },
  NVDA: {
    symbol: 'NVDA',
    priceMove: '-0.88%',
    relatedEventIds: ['taiwan'],
    relatedEntities: ['Nvidia', 'TSMC', 'Semiconductors', 'AI Hardware'],
    linkedMarkets: ['NVDA', 'TSM', 'SOXX', 'QQQ'],
    possibleCause:
      'Nvidia is exposed to advanced-node supply-chain concentration through TSMC.',
    relationshipReason:
      'The local graph maps Taiwan to TSMC to semiconductors to Nvidia and QQQ.',
    confidence: 70,
    uncertainty: 'AI demand remains strong; the source trail only explains supply-chain risk, not demand revisions.',
    sourceTrail: sourceTrailForEvents(['taiwan']),
    evidenceTrail: evidenceForEvents(['taiwan']),
  },
  AAPL: {
    symbol: 'AAPL',
    priceMove: '-0.31%',
    relatedEventIds: ['taiwan', 'rare-earths'],
    relatedEntities: ['Apple', 'Taiwan', 'China', 'Supplier Concentration'],
    linkedMarkets: ['AAPL', 'QQQ', 'SOXX'],
    possibleCause:
      'Apple is lightly linked through supplier concentration and China exposure.',
    relationshipReason:
      'The event graph connects Apple to Taiwan supplier risk and China industrial-policy context.',
    confidence: 59,
    uncertainty: 'The source trail does not include Apple-specific supplier guidance or demand data.',
    sourceTrail: sourceTrailForEvents(['taiwan', 'rare-earths']),
    evidenceTrail: evidenceForEvents(['taiwan', 'rare-earths']),
  },
}

export const graphNodes: GraphNodeSeed[] = [
  { id: 'red-sea', label: 'Red Sea', kind: 'Trade route', position: { x: 0, y: 80 }, tone: 'elevated' },
  { id: 'shipping', label: 'Shipping Risk', kind: 'Risk', position: { x: 190, y: 80 }, tone: 'elevated' },
  { id: 'oil', label: 'Oil', kind: 'Commodity', position: { x: 390, y: 20 }, tone: 'elevated' },
  { id: 'xle', label: 'XLE', kind: 'ETF', position: { x: 590, y: 20 }, tone: 'elevated' },
  { id: 'inflation', label: 'Inflation Risk', kind: 'Macro', position: { x: 590, y: 145 }, tone: 'watch' },
  { id: 'gold', label: 'Gold', kind: 'Commodity', position: { x: 790, y: 145 }, tone: 'watch' },
  { id: 'taiwan', label: 'Taiwan', kind: 'Country', position: { x: 20, y: 340 }, tone: 'critical' },
  { id: 'tsmc', label: 'TSMC', kind: 'Company', position: { x: 220, y: 330 }, tone: 'critical' },
  { id: 'semis', label: 'Semiconductors', kind: 'Sector', position: { x: 430, y: 330 }, tone: 'critical' },
  { id: 'nvda', label: 'Nvidia', kind: 'Company', position: { x: 650, y: 290 }, tone: 'watch' },
  { id: 'qqq', label: 'QQQ', kind: 'ETF', position: { x: 850, y: 330 }, tone: 'watch' },
  { id: 'china', label: 'China', kind: 'Country', position: { x: 30, y: 560 }, tone: 'elevated' },
  { id: 'rare-earths', label: 'Rare Earths', kind: 'Commodity', position: { x: 250, y: 560 }, tone: 'elevated' },
  { id: 'ev', label: 'EV Supply Chain', kind: 'Sector', position: { x: 500, y: 560 }, tone: 'watch' },
  { id: 'tesla', label: 'Tesla', kind: 'Company', position: { x: 740, y: 560 }, tone: 'watch' },
]

export const graphEdges: GraphEdgeSeed[] = [
  { id: 'e1', source: 'red-sea', target: 'shipping', label: 'disrupts', strength: 83 },
  { id: 'e2', source: 'shipping', target: 'oil', label: 'adds premium', strength: 78 },
  { id: 'e3', source: 'oil', target: 'xle', label: 'supports', strength: 74 },
  { id: 'e4', source: 'oil', target: 'inflation', label: 'pressures', strength: 71 },
  { id: 'e5', source: 'inflation', target: 'gold', label: 'hedge bid', strength: 63 },
  { id: 'e6', source: 'taiwan', target: 'tsmc', label: 'concentration', strength: 91 },
  { id: 'e7', source: 'tsmc', target: 'semis', label: 'advanced nodes', strength: 87 },
  { id: 'e8', source: 'semis', target: 'nvda', label: 'supply chain', strength: 79 },
  { id: 'e9', source: 'semis', target: 'qqq', label: 'index beta', strength: 76 },
  { id: 'e10', source: 'china', target: 'rare-earths', label: 'processing leverage', strength: 86 },
  { id: 'e11', source: 'rare-earths', target: 'ev', label: 'inputs', strength: 80 },
  { id: 'e12', source: 'ev', target: 'tesla', label: 'margin exposure', strength: 70 },
  { id: 'e13', source: 'tesla', target: 'qqq', label: 'mega-cap beta', strength: 58 },
]

export const dailyBrief: BriefItem[] = [
  {
    id: 'brief-changed',
    headline: 'Energy and geopolitical risk are now the dominant cross-asset cluster',
    whyItMatters:
      'The same evidence trail links Red Sea route risk, crude, XLE, gold, airline margins, and inflation-sensitive markets.',
    severity: 'elevated',
    relatedEntities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'Gold', 'Airlines'],
    relatedMarkets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    confidence: 76,
    sourceCount: 4,
    uncertainty: 'The cluster is event-driven and lacks direct supply quantity data.',
    watchNext: ['Freight insurance language', 'Crude breadth', 'Airline underperformance', 'Gold confirmation'],
    sourceTrail: topSignals[0].sourceTrail,
    evidenceTrail: topSignals[0].evidenceTrail,
  },
  {
    id: 'brief-move',
    headline: 'Crude is the cleanest market move, with energy breadth confirming',
    whyItMatters:
      'The move is connected to shipping-risk sources and confirmed by XLE strength while airline exposure weakens.',
    severity: 'elevated',
    relatedEntities: ['WTI Crude', 'XLE', 'Inflation Risk', 'Airline Margins'],
    relatedMarkets: ['CL', 'XLE', 'GLD', 'DAL'],
    confidence: 78,
    sourceCount: 3,
    uncertainty: 'A headline premium can reverse quickly if route-risk evidence cools.',
    watchNext: ['WTI holds above intraday base', 'XLE breadth', 'DAL/UAL reaction'],
    sourceTrail: marketExplanations.CL.sourceTrail,
    evidenceTrail: marketExplanations.CL.evidenceTrail,
  },
  {
    id: 'brief-taiwan',
    headline: 'Taiwan risk remains the highest-impact entity chain',
    whyItMatters:
      'The graph maps Taiwan to TSMC, semiconductors, Nvidia, Apple, SOXX, and QQQ, making the exposure index-level.',
    severity: 'critical',
    relatedEntities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple'],
    relatedMarkets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    confidence: 72,
    sourceCount: 4,
    uncertainty: 'The evidence shows exposure and policy context, not a confirmed supply interruption.',
    watchNext: ['SOXX relative weakness', 'TSM gap risk', 'Export-control language', 'QQQ breadth'],
    sourceTrail: topSignals[1].sourceTrail,
    evidenceTrail: topSignals[1].evidenceTrail,
  },
  {
    id: 'brief-policy',
    headline: 'Industrial policy risk is clustering around chips and rare earths',
    whyItMatters:
      'Chip controls and rare earth restriction chatter create linked supply-chain pressure across semis, EVs, autos, and defense electronics.',
    severity: 'watch',
    relatedEntities: ['China', 'Rare Earths', 'Export Controls', 'EV Supply Chain', 'Defense Electronics'],
    relatedMarkets: ['SOXX', 'NVDA', 'TSLA', 'LIT', 'XAR'],
    confidence: 66,
    sourceCount: 4,
    uncertainty: 'Policy chatter is not the same as final rule text.',
    watchNext: ['Formal policy language', 'Supplier commentary', 'Strategic inventory data'],
    sourceTrail: sourceTrailForEvents(['taiwan', 'rare-earths']),
    evidenceTrail: evidenceForEvents(['taiwan', 'rare-earths']),
  },
  {
    id: 'brief-watch',
    headline: 'Watch whether event risk becomes macro pressure',
    whyItMatters:
      'The key next question is whether oil and policy-risk signals spill into inflation expectations, real yields, gold, QQQ, and crypto liquidity sensitivity.',
    severity: 'watch',
    relatedEntities: ['Inflation Risk', 'Real Yields', 'Gold', 'Bitcoin', 'Nasdaq 100'],
    relatedMarkets: ['CL', 'GLD', 'TLT', 'QQQ', 'BTC'],
    confidence: 61,
    sourceCount: 3,
    uncertainty: 'Macro confirmation is incomplete without live rates, dollar, and inflation expectation feeds.',
    watchNext: ['Real yields', 'Dollar direction', 'Gold/BTC divergence', 'QQQ duration sensitivity'],
    sourceTrail: sourceTrailForEvents(['red-sea', 'central-bank']),
    evidenceTrail: evidenceForEvents(['red-sea', 'central-bank']),
  },
]

export const riskMap = [
  { region: 'Taiwan Strait', pressure: 88, driver: 'Semiconductor chokepoint', markets: 'SOXX, TSM, NVDA, QQQ' },
  { region: 'Red Sea', pressure: 79, driver: 'Shipping and insurance costs', markets: 'CL, XLE, GLD, DAL' },
  { region: 'China industrial policy', pressure: 72, driver: 'Rare earth leverage', markets: 'TSLA, LIT, XAR' },
  { region: 'US macro policy', pressure: 58, driver: 'Real-rate uncertainty', markets: 'QQQ, TLT, BTC, GLD' },
  { region: 'Europe energy', pressure: 46, driver: 'Gas and manufacturing costs', markets: 'VGK, UNG, XLB' },
]
