import {
  dailyBrief,
  radarEvents,
  rawSourceItems,
  topSignals,
  type BriefItem,
  type EvidenceNote,
  type RadarEvent,
  type RawSourceItem,
  type Severity,
  type Signal,
  type SourceTrailItem,
} from './data/intel'

export type WorldSourceTrust =
  | 'public unauthenticated'
  | 'local derived'
  | 'simulated'
  | 'verified'
  | 'stale'
  | 'failed'

export type WorldIntelStatus = 'disabled' | 'fetching' | 'ready' | 'stale' | 'failed'

export type PublicWorldHeadline = {
  id: string
  title: string
  source: string
  url: string
  sector: string
  impact: string
  observedAt: number
}

export type WorldIntelConnectorSnapshot = {
  enabled: boolean
  status: WorldIntelStatus
  sourceTrust: WorldSourceTrust
  connectorId: 'gdelt_doc_public' | 'seeded'
  connectorLabel: string
  updatedAt?: number
  lastError?: string
  headlines: PublicWorldHeadline[]
}

export type DerivedWorldIntel = {
  events: RadarEvent[]
  signals: Signal[]
  dailyBrief: BriefItem[]
  rawSourceItems: RawSourceItem[]
}

export type WorldIntelSnapshot = WorldIntelConnectorSnapshot & DerivedWorldIntel

type TopicRule = {
  id: string
  label: string
  category: string
  region: string
  severity: Severity
  keywords: string[]
  entities: string[]
  markets: string[]
  riskChannels: string[]
  narrative: string
  uncertainty: string
  watchNext: string[]
}

type ClassifiedHeadline = PublicWorldHeadline & {
  topic: TopicRule
  matchedKeywords: string[]
}

const topicRules: TopicRule[] = [
  {
    id: 'red-sea',
    label: 'Shipping and Red Sea route risk',
    category: 'Trade route',
    region: 'Middle East',
    severity: 'elevated',
    keywords: ['red sea', 'suez', 'houthi', 'shipping', 'freight', 'tanker', 'route', 'vessel'],
    entities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'Freight', 'Airlines'],
    markets: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
    riskChannels: ['Freight cost', 'Oil premium', 'Inflation risk', 'Airline margins'],
    narrative: 'Public coverage is clustering around shipping route friction and energy-sensitive exposure.',
    uncertainty: 'Public unauthenticated news coverage is not direct proof of supply disruption or market causality.',
    watchNext: ['Primary shipping notices', 'Freight and insurance language', 'WTI/XLE breadth'],
  },
  {
    id: 'taiwan',
    label: 'Taiwan and semiconductor concentration',
    category: 'Geopolitics',
    region: 'Asia Pacific',
    severity: 'critical',
    keywords: ['taiwan', 'tsmc', 'semiconductor', 'chip', 'chips', 'export control', 'advanced node'],
    entities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple', 'Nasdaq 100'],
    markets: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
    riskChannels: ['Supply-chain concentration', 'Export controls', 'AI hardware availability'],
    narrative: 'Fresh public coverage maps into semiconductor concentration and advanced-node supply-chain exposure.',
    uncertainty: 'Coverage can reflect commentary or positioning without confirming a new policy or security event.',
    watchNext: ['Primary policy language', 'SOXX breadth', 'TSMC/Nvidia supplier mentions'],
  },
  {
    id: 'rare-earths',
    label: 'Rare earth and strategic input policy',
    category: 'Industrial policy',
    region: 'China',
    severity: 'elevated',
    keywords: ['rare earth', 'rare earths', 'lithium', 'battery', 'magnet', 'ev supply', 'critical minerals'],
    entities: ['China', 'Rare Earths', 'Lithium', 'EV Supply Chain', 'Defense Electronics'],
    markets: ['TSLA', 'LIT', 'XAR', 'GM'],
    riskChannels: ['Input scarcity', 'Policy retaliation', 'Strategic inventory rebuild'],
    narrative: 'Public coverage is touching strategic inputs that can flow into EV, battery, and defense supply chains.',
    uncertainty: 'The connector only observes public article metadata; formal rule text or primary filings still need verification.',
    watchNext: ['Policy documents', 'Battery material pricing', 'Defense electronics language'],
  },
  {
    id: 'central-bank',
    label: 'Rates, inflation, and central bank language',
    category: 'Macro',
    region: 'Global Macro',
    severity: 'watch',
    keywords: ['central bank', 'federal reserve', 'fed', 'inflation', 'rates', 'rate cut', 'bond yield', 'real yield'],
    entities: ['Federal Reserve', 'Inflation', 'Real Yields', 'Gold', 'Bitcoin', 'Nasdaq 100'],
    markets: ['QQQ', 'TLT', 'GLD', 'BTC'],
    riskChannels: ['Discount rates', 'Liquidity expectations', 'Dollar pressure'],
    narrative: 'Coverage is touching rate-sensitive assets through inflation, real-yield, and liquidity language.',
    uncertainty: 'Macro headlines are often indirect and should not be read as a single-cause market signal.',
    watchNext: ['Central bank transcripts', 'Real yields', 'Dollar and gold confirmation'],
  },
  {
    id: 'trade-policy',
    label: 'Tariffs, sanctions, and trade policy',
    category: 'Trade policy',
    region: 'Global',
    severity: 'elevated',
    keywords: ['tariff', 'tariffs', 'sanction', 'sanctions', 'export ban', 'trade restriction', 'trade war'],
    entities: ['Tariffs', 'Sanctions', 'Trade Policy', 'Supply Chains', 'China', 'United States'],
    markets: ['QQQ', 'AAPL', 'SOXX', 'XLI'],
    riskChannels: ['Margin pressure', 'Supply-chain rerouting', 'Policy retaliation'],
    narrative: 'Public coverage is clustering around trade-policy restrictions and supply-chain exposure.',
    uncertainty: 'Article metadata alone does not confirm implementation details, exemptions, or timing.',
    watchNext: ['Official notices', 'Affected sector lists', 'Company guidance language'],
  },
  {
    id: 'europe-energy',
    label: 'European energy security',
    category: 'Energy security',
    region: 'Europe',
    severity: 'watch',
    keywords: ['europe gas', 'natural gas', 'lng', 'pipeline', 'gas storage', 'energy security', 'ukraine energy'],
    entities: ['Europe', 'Natural Gas', 'LNG', 'Industrial Margins', 'Chemicals'],
    markets: ['UNG', 'VGK', 'XLB'],
    riskChannels: ['Energy cost', 'Manufacturing margin', 'Weather volatility'],
    narrative: 'Coverage maps into European energy buffers, industrial costs, and weather or pipeline sensitivity.',
    uncertainty: 'Storage and weather context require primary data confirmation before assigning stronger severity.',
    watchNext: ['Storage data', 'Pipeline notices', 'Industrial margin commentary'],
  },
]

export function buildSeedWorldIntelSnapshot(): WorldIntelSnapshot {
  return {
    enabled: false,
    status: 'disabled',
    sourceTrust: 'simulated',
    connectorId: 'seeded',
    connectorLabel: 'Seeded local world layer',
    updatedAt: undefined,
    lastError: undefined,
    headlines: [],
    events: radarEvents,
    signals: topSignals,
    dailyBrief,
    rawSourceItems,
  }
}

export function deriveWorldIntelSnapshot(connector: WorldIntelConnectorSnapshot): WorldIntelSnapshot {
  const derived = deriveWorldIntel(connector.headlines, connector.sourceTrust)
  return {
    ...connector,
    ...derived,
  }
}

export function deriveWorldIntel(
  headlines: PublicWorldHeadline[],
  sourceTrust: WorldSourceTrust,
): DerivedWorldIntel {
  const classified = headlines
    .map((headline) => classifyWorldHeadline(headline))
    .filter((item): item is ClassifiedHeadline => item !== null)

  if (classified.length === 0) {
    return {
      events: radarEvents,
      signals: topSignals,
      dailyBrief,
      rawSourceItems,
    }
  }

  const groups = groupBy(classified, (item) => item.topic.id)
  const dynamicEvents = [...groups.values()].map((items) => buildRadarEvent(items, sourceTrust))
  const dynamicSignals = dynamicEvents.map((event) => buildSignal(event, sourceTrust))
  const dynamicBrief = dynamicEvents.slice(0, 4).map((event) => buildBriefItem(event, sourceTrust))
  const dynamicRaw = classified.slice(0, 25).map((item) => buildRawSourceItem(item))

  return {
    events: mergeById(dynamicEvents, radarEvents),
    signals: mergeById(dynamicSignals, topSignals),
    dailyBrief: [...dynamicBrief, ...dailyBrief].slice(0, 7),
    rawSourceItems: [...dynamicRaw, ...rawSourceItems],
  }
}

export function classifyWorldHeadline(headline: PublicWorldHeadline): ClassifiedHeadline | null {
  const haystack = `${headline.title} ${headline.sector} ${headline.impact}`.toLowerCase()
  let best: { topic: TopicRule; matchedKeywords: string[] } | null = null

  for (const topic of topicRules) {
    const matchedKeywords = topic.keywords.filter((keyword) => haystack.includes(keyword))
    if (matchedKeywords.length === 0) {
      continue
    }
    if (!best || matchedKeywords.length > best.matchedKeywords.length) {
      best = { topic, matchedKeywords }
    }
  }

  return best ? { ...headline, topic: best.topic, matchedKeywords: best.matchedKeywords } : null
}

export function classifyHeadlineText(title: string): { sector: string; impact: string } {
  const headline: PublicWorldHeadline = {
    id: 'classification-probe',
    title,
    source: 'classification',
    url: '',
    sector: '',
    impact: '',
    observedAt: Date.now(),
  }
  const classified = classifyWorldHeadline(headline)
  if (!classified) {
    return {
      sector: 'World news',
      impact: 'Public headline retained without a strong Atlasz keyword/entity mapping.',
    }
  }
  return {
    sector: classified.topic.category,
    impact: `${classified.topic.label}; matched ${classified.matchedKeywords.join(', ')}`,
  }
}

function buildRadarEvent(items: ClassifiedHeadline[], sourceTrust: WorldSourceTrust): RadarEvent {
  const topic = items[0].topic
  const observedAt = Math.max(...items.map((item) => item.observedAt))
  const sourceTrail = items.slice(0, 5).map((item) => buildSourceTrail(item, sourceTrust))
  const evidenceNotes = buildEvidenceNotes(topic, items.length, sourceTrust)

  return {
    id: topic.id,
    time: formatEventTime(observedAt),
    category: topic.category,
    region: topic.region,
    severity: topic.severity,
    confidence: confidenceFor(items.length, sourceTrust),
    sourceCount: items.length,
    title: `${topic.label} appears in public coverage`,
    summary: `${topic.narrative} Latest matched headline: ${items[0].title}`,
    relationshipReason: `Keyword/entity evidence matched ${unique(items.flatMap((item) => item.matchedKeywords)).join(', ')} and maps to ${topic.markets.join(', ')}.`,
    uncertainty: topic.uncertainty,
    detectedEntities: topic.entities,
    linkedMarkets: topic.markets,
    riskChannels: topic.riskChannels,
    evidenceNotes,
    sourceTrail,
  }
}

function buildSignal(event: RadarEvent, sourceTrust: WorldSourceTrust): Signal {
  return {
    id: `world-${event.id}`,
    title: `${event.title} · source-backed watch`,
    explanation:
      `${event.relationshipReason} This is local derived routing from public unauthenticated headline metadata, not a prediction or recommendation.`,
    status: event.severity,
    confidence: Math.max(45, event.confidence - 4),
    timeframe: 'Today',
    chain: `${event.region} -> ${event.category} -> ${event.riskChannels[0] ?? 'Risk channel'} -> ${event.linkedMarkets[0] ?? 'Watchlist'}`,
    linkedEventIds: [event.id],
    linkedEntities: event.detectedEntities,
    linkedMarkets: event.linkedMarkets,
    repeatedThemes: event.riskChannels,
    relationshipStrength: Math.min(88, 42 + event.sourceCount * 8),
    sourceCount: event.sourceCount,
    recencyScore: 76,
    uncertainty: sourceTrust === 'public unauthenticated' ? event.uncertainty : 'Derived from cached or local world context.',
    evidenceTrail: event.evidenceNotes,
    sourceTrail: event.sourceTrail,
  }
}

function buildBriefItem(event: RadarEvent, sourceTrust: WorldSourceTrust): BriefItem {
  return {
    id: `brief-${event.id}`,
    headline: event.title,
    whyItMatters: event.relationshipReason,
    severity: event.severity,
    relatedEntities: event.detectedEntities,
    relatedMarkets: event.linkedMarkets,
    confidence: event.confidence,
    sourceCount: event.sourceCount,
    uncertainty:
      sourceTrust === 'public unauthenticated'
        ? 'Public unauthenticated article metadata can be stale, duplicated, or incomplete; verify with primary sources.'
        : event.uncertainty,
    watchNext: [
      'Confirm through primary or official sources',
      'Watch whether coverage broadens across independent outlets',
      ...event.riskChannels.slice(0, 2),
    ],
    evidenceTrail: event.evidenceNotes,
    sourceTrail: event.sourceTrail,
  }
}

function buildSourceTrail(item: ClassifiedHeadline, sourceTrust: WorldSourceTrust): SourceTrailItem {
  return {
    id: `src-${item.id}`,
    sourceName: item.source,
    sourceType: 'news',
    sourceUrl: item.url,
    title: item.title,
    observedAt: new Date(item.observedAt).toISOString(),
    publishedAt: new Date(item.observedAt).toISOString(),
    note: `${sourceTrust}; matched ${item.matchedKeywords.join(', ')} for ${item.topic.label}.`,
  }
}

function buildEvidenceNotes(topic: TopicRule, sourceCount: number, sourceTrust: WorldSourceTrust): EvidenceNote[] {
  return [
    {
      id: `ev-${topic.id}-public-source-count`,
      note: `${sourceCount} public headline${sourceCount === 1 ? '' : 's'} matched the ${topic.label} routing rule.`,
      supports: 'Recency and source-count relevance',
      confidenceImpact: sourceCount > 1 ? 'raises' : 'neutral',
    },
    {
      id: `ev-${topic.id}-keyword-map`,
      note: `Matched keywords are routed locally into ${topic.entities.slice(0, 4).join(', ')} and ${topic.markets.join(', ')}.`,
      supports: 'Entity, sector, and market linkage',
      confidenceImpact: 'neutral',
    },
    {
      id: `ev-${topic.id}-trust-boundary`,
      note:
        sourceTrust === 'public unauthenticated'
          ? 'GDELT article metadata is public and unauthenticated inside Atlasz; it is evidence of coverage, not verification of claims.'
          : `Source trust is ${sourceTrust}.`,
      supports: 'Uncertainty and source-trust boundary',
      confidenceImpact: 'limits',
    },
  ]
}

function buildRawSourceItem(item: ClassifiedHeadline): RawSourceItem {
  return {
    id: `raw-${item.id}`,
    connector: 'gdelt-doc-public',
    sourceName: item.source,
    sourceUrl: item.url,
    rawTitle: item.title,
    rawExcerpt: `${item.topic.label}; matched ${item.matchedKeywords.join(', ')}`,
    ingestedAt: new Date(Date.now()).toISOString(),
    publishedAt: new Date(item.observedAt).toISOString(),
    normalizedEventId: item.topic.id,
  }
}

function confidenceFor(sourceCount: number, sourceTrust: WorldSourceTrust): number {
  const trustPenalty = sourceTrust === 'public unauthenticated' ? 8 : sourceTrust === 'stale' ? 18 : 12
  return Math.min(72, Math.max(48, 45 + sourceCount * 7 - trustPenalty))
}

function formatEventTime(observedAt: number): string {
  return new Date(observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]): T[] {
  return [...new Map([...primary, ...fallback].map((item) => [item.id, item])).values()]
}

function groupBy<T>(items: T[], keyFor: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFor(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

function unique(items: string[]): string[] {
  return [...new Set(items)]
}
