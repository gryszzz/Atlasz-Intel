import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CircleDotDashed,
  Crosshair,
  Database,
  FileText,
  Globe2,
  Layers3,
  LineChart,
  MonitorDot,
  Network,
  NotebookPen,
  RadioTower,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { CommandMenuButton, CommandPalette } from './CommandPalette'
import { buildNavActions, type CommandAction } from './commandActions'
import { DecisionJournal } from './DecisionJournal'
import { decisionJournal } from './intelClient'
import { riskChainFor } from './intelGraphData'
import { DataCorePanel, LiveMarketReadout, PulseIndicator, RealtimePulsePanel } from './RealtimeWidgets'
import { setPulseEnabled as setEnginePulse } from './realtimeStore'
import {
  dailyBrief,
  graphEdges,
  graphNodes,
  ingestionPipeline,
  marketExplanations,
  marketMovers,
  marketSeries,
  radarEvents,
  rawSourceItems,
  riskMap,
  topSignals,
  watchlist,
  type EvidenceNote,
  type GraphNodeSeed,
  type MarketExplanation,
  type MarketMover,
  type RadarEvent,
  type Severity,
  type Signal,
  type SourceTrailItem,
} from './data/intel'

type ViewId = 'command' | 'terminal' | 'radar' | 'social' | 'graph' | 'analyst' | 'brief' | 'decision'
type LayerId =
  | 'market'
  | 'news'
  | 'social'
  | 'politics'
  | 'trade'
  | 'macro'
  | 'commodity'
  | 'risk'
  | 'exposure'
  | 'entities'
  | 'sources'
type TimeWindowId = '15m' | '1h' | 'today' | 'overnight' | 'week' | 'custom'
type SocialTier = 'facts' | 'movement' | 'attention' | 'narrative' | 'uncertainty'

type SocialPulseTopic = {
  id: string
  label: string
  asset: string
  theme: string
  marketMove: number
  volumeMove: string
  baselineMentions: number
  currentMentions: number
  sentiment: 'bullish' | 'bearish' | 'mixed'
  confidence: number
  linkedMarkets: string[]
  linkedEventIds: string[]
  velocitySeries: Array<{ time: string; volume: number }>
}

type SocialPulsePost = {
  id: string
  topicId: string
  tier: SocialTier
  handle: string
  accountType: 'filing' | 'market tape' | 'operator' | 'analyst' | 'influencer' | 'unknown'
  text: string
  observedAt: string
  minutesAgo: number
  reachScore: number
  engagement: number
  credibility: number
  keywords: string[]
  linkedMarkets: string[]
  sourceUrl: string
}

type AnalystAnswer = {
  summary: string
  relatedEvents: RadarEvent[]
  entities: string[]
  tickers: string[]
  confidence: number
  uncertainty: string
  watchNext: string[]
  sourceTrail?: SourceTrailItem[]
  evidenceTrail?: EvidenceNote[]
  linkedSignals?: string[]
}

type AnalystMessage = {
  id: string
  role: 'user' | 'analyst'
  text: string
  answer?: AnalystAnswer
}

const views: Array<{ id: ViewId; label: string; icon: typeof MonitorDot }> = [
  { id: 'command', label: 'Command Center', icon: MonitorDot },
  { id: 'terminal', label: 'Market Terminal', icon: LineChart },
  { id: 'radar', label: 'World Radar', icon: RadioTower },
  { id: 'social', label: 'Social Pulse', icon: Activity },
  { id: 'graph', label: 'Entity Graph', icon: Network },
  { id: 'analyst', label: 'AI Analyst', icon: BrainCircuit },
  { id: 'brief', label: 'Daily Brief', icon: FileText },
  { id: 'decision', label: 'Decision Journal', icon: BookOpen },
]

const promptChips = [
  'Why is oil moving?',
  'What companies are exposed to Taiwan risk?',
  'What news matters for Bitcoin?',
  'What countries are exposed to rare earth restrictions?',
]

const severityLabels: Record<Severity, string> = {
  critical: 'Critical',
  elevated: 'Elevated',
  watch: 'Watch',
  stable: 'Stable',
}

const layerDefinitions: Array<{
  id: LayerId
  label: string
  description: string
  tone: 'cyan' | 'green' | 'yellow' | 'red'
}> = [
  { id: 'market', label: 'Market', description: 'Prices, ETFs, sectors, and asset links', tone: 'cyan' },
  { id: 'news', label: 'News', description: 'World-event headlines and normalized sources', tone: 'green' },
  { id: 'social', label: 'Social', description: 'Attention pressure, mention velocity, and narrative drift', tone: 'cyan' },
  { id: 'politics', label: 'Politics', description: 'Sanctions, policy, elections, and regulation', tone: 'yellow' },
  { id: 'trade', label: 'Trade', description: 'Shipping lanes, tariffs, route risk, and freight', tone: 'cyan' },
  { id: 'macro', label: 'Macro', description: 'Rates, inflation, currency, and liquidity pressure', tone: 'green' },
  { id: 'commodity', label: 'Commodity', description: 'Oil, gold, gas, wheat, metals, uranium, lithium', tone: 'yellow' },
  { id: 'risk', label: 'Conflict/Risk', description: 'Geopolitical severity and risk-zone overlays', tone: 'red' },
  { id: 'exposure', label: 'Market Exposure', description: 'Tickers, ETFs, sectors, and asset classes', tone: 'cyan' },
  { id: 'entities', label: 'Entity Graph', description: 'Countries, companies, commodities, and chains', tone: 'green' },
  { id: 'sources', label: 'Sources', description: 'Evidence count, source trail, and confidence context', tone: 'yellow' },
]

const defaultLayerIds: LayerId[] = ['market', 'social', 'trade', 'commodity', 'risk', 'exposure', 'entities', 'sources']

const timeWindows: Array<{ id: TimeWindowId; label: string; minutes: number | null }> = [
  { id: '15m', label: '15M', minutes: 15 },
  { id: '1h', label: '1H', minutes: 60 },
  { id: 'today', label: 'Today', minutes: 720 },
  { id: 'overnight', label: 'Overnight', minutes: 360 },
  { id: 'week', label: 'Week', minutes: 10080 },
  { id: 'custom', label: 'Custom', minutes: null },
]

const socialTierDefinitions: Array<{ id: SocialTier; label: string; description: string; weight: number }> = [
  { id: 'facts', label: 'Facts', description: 'Verifiable filings, reports, primary claims, or source-backed items.', weight: 1.14 },
  { id: 'movement', label: 'Movement', description: 'Price, volume, volatility, relative strength, or market tape movement.', weight: 1.06 },
  { id: 'attention', label: 'Attention', description: 'Mentions, repost bursts, important accounts, and attention clusters.', weight: 0.98 },
  { id: 'narrative', label: 'Narrative', description: 'Repeated explanations, story frames, catalysts, and inferred themes.', weight: 0.86 },
  { id: 'uncertainty', label: 'Uncertainty', description: 'What is unverified, missing, conflicted, or likely to be noise.', weight: 0.52 },
]

const socialPulseTopics: SocialPulseTopic[] = [
  {
    id: 'aixr-ai',
    label: 'AIXR AI infrastructure',
    asset: 'AIXR',
    theme: 'Small-cap AI infrastructure',
    marketMove: 9.8,
    volumeMove: '4.2x',
    baselineMentions: 42,
    currentMentions: 214,
    sentiment: 'mixed',
    confidence: 62,
    linkedMarkets: ['AIXR', 'NVDA', 'QQQ', 'SOXX'],
    linkedEventIds: ['taiwan'],
    velocitySeries: [
      { time: '08:00', volume: 18 },
      { time: '08:15', volume: 25 },
      { time: '08:30', volume: 44 },
      { time: '08:45', volume: 77 },
      { time: '09:00', volume: 128 },
      { time: '09:15', volume: 214 },
    ],
  },
  {
    id: 'btc-liquidity',
    label: 'BTC liquidity chatter',
    asset: 'BTC',
    theme: 'Crypto liquidity',
    marketMove: 1.36,
    volumeMove: '0.9x',
    baselineMentions: 320,
    currentMentions: 516,
    sentiment: 'bullish',
    confidence: 58,
    linkedMarkets: ['BTC', 'QQQ', 'GLD', 'TLT'],
    linkedEventIds: ['central-bank'],
    velocitySeries: [
      { time: '08:00', volume: 296 },
      { time: '08:15', volume: 331 },
      { time: '08:30', volume: 366 },
      { time: '08:45', volume: 411 },
      { time: '09:00', volume: 468 },
      { time: '09:15', volume: 516 },
    ],
  },
  {
    id: 'rare-earths-social',
    label: 'Rare earth restriction thread',
    asset: 'LIT',
    theme: 'Rare earths and EV supply chain',
    marketMove: -0.8,
    volumeMove: '1.5x',
    baselineMentions: 58,
    currentMentions: 171,
    sentiment: 'bearish',
    confidence: 65,
    linkedMarkets: ['LIT', 'TSLA', 'XAR', 'GM'],
    linkedEventIds: ['rare-earths'],
    velocitySeries: [
      { time: '08:00', volume: 49 },
      { time: '08:15', volume: 55 },
      { time: '08:30', volume: 76 },
      { time: '08:45', volume: 96 },
      { time: '09:00', volume: 132 },
      { time: '09:15', volume: 171 },
    ],
  },
]

const socialPulsePosts: SocialPulsePost[] = [
  {
    id: 'social-aixr-fact',
    topicId: 'aixr-ai',
    tier: 'facts',
    handle: '@filing-watch-local',
    accountType: 'filing',
    text: 'Local seed item: AIXR contract language is being referenced, but no production revenue impact is confirmed in this mock source layer.',
    observedAt: '09:11 ET',
    minutesAgo: 4,
    reachScore: 72,
    engagement: 84,
    credibility: 82,
    keywords: ['contract', 'AI infrastructure', 'filing'],
    linkedMarkets: ['AIXR', 'NVDA'],
    sourceUrl: 'local://social/aixr-fact-contract-language',
  },
  {
    id: 'social-aixr-movement',
    topicId: 'aixr-ai',
    tier: 'movement',
    handle: '@market-tape-local',
    accountType: 'market tape',
    text: 'AIXR prints 4.2x relative volume while the AI infrastructure basket is mixed; price is up 9.8% in the seed tape.',
    observedAt: '09:13 ET',
    minutesAgo: 2,
    reachScore: 66,
    engagement: 112,
    credibility: 76,
    keywords: ['relative volume', 'AI basket', 'small cap'],
    linkedMarkets: ['AIXR', 'QQQ', 'SOXX'],
    sourceUrl: 'local://social/aixr-market-tape',
  },
  {
    id: 'social-aixr-attention',
    topicId: 'aixr-ai',
    tier: 'attention',
    handle: '@theme-scanner',
    accountType: 'operator',
    text: 'AIXR mentions are accelerating across AI infra lists; repeated keywords: edge compute, government contract, data center supplier.',
    observedAt: '09:14 ET',
    minutesAgo: 1,
    reachScore: 88,
    engagement: 246,
    credibility: 64,
    keywords: ['edge compute', 'government contract', 'data center'],
    linkedMarkets: ['AIXR', 'NVDA'],
    sourceUrl: 'local://social/aixr-attention-cluster',
  },
  {
    id: 'social-aixr-narrative',
    topicId: 'aixr-ai',
    tier: 'narrative',
    handle: '@macro-narratives',
    accountType: 'analyst',
    text: 'The emerging frame is small-cap AI infrastructure beta, but the story is moving faster than verified source support.',
    observedAt: '09:08 ET',
    minutesAgo: 7,
    reachScore: 74,
    engagement: 151,
    credibility: 68,
    keywords: ['small-cap AI', 'infrastructure beta', 'verified support'],
    linkedMarkets: ['AIXR', 'QQQ'],
    sourceUrl: 'local://social/aixr-narrative-frame',
  },
  {
    id: 'social-aixr-uncertainty',
    topicId: 'aixr-ai',
    tier: 'uncertainty',
    handle: '@risk-notes',
    accountType: 'unknown',
    text: 'Uncertainty: account quality is uneven, several posts recycle the same screenshot, and there is no confirmed customer-size data.',
    observedAt: '09:10 ET',
    minutesAgo: 5,
    reachScore: 54,
    engagement: 67,
    credibility: 71,
    keywords: ['duplicate screenshot', 'account quality', 'customer size'],
    linkedMarkets: ['AIXR'],
    sourceUrl: 'local://social/aixr-uncertainty',
  },
  {
    id: 'social-btc-attention',
    topicId: 'btc-liquidity',
    tier: 'attention',
    handle: '@crypto-flow-local',
    accountType: 'operator',
    text: 'BTC attention rises with liquidity keywords while ETF-flow claims remain unverified in the local seed layer.',
    observedAt: '09:12 ET',
    minutesAgo: 3,
    reachScore: 81,
    engagement: 310,
    credibility: 61,
    keywords: ['liquidity', 'ETF flows', 'risk appetite'],
    linkedMarkets: ['BTC', 'QQQ'],
    sourceUrl: 'local://social/btc-attention',
  },
  {
    id: 'social-btc-movement',
    topicId: 'btc-liquidity',
    tier: 'movement',
    handle: '@mock-crypto-tape',
    accountType: 'market tape',
    text: 'BTC is firmer while QQQ is soft; this creates a price/social divergence watch rather than a confirmed causal signal.',
    observedAt: '09:09 ET',
    minutesAgo: 6,
    reachScore: 63,
    engagement: 146,
    credibility: 74,
    keywords: ['divergence', 'risk appetite', 'QQQ'],
    linkedMarkets: ['BTC', 'QQQ', 'TLT'],
    sourceUrl: 'local://social/btc-movement-divergence',
  },
  {
    id: 'social-rare-fact',
    topicId: 'rare-earths-social',
    tier: 'facts',
    handle: '@policy-monitor-local',
    accountType: 'filing',
    text: 'Seed policy monitor references rare earth restriction chatter; no final rule text is present in the source trail.',
    observedAt: '09:02 ET',
    minutesAgo: 13,
    reachScore: 69,
    engagement: 122,
    credibility: 79,
    keywords: ['rare earths', 'restriction chatter', 'rule text'],
    linkedMarkets: ['LIT', 'TSLA', 'XAR'],
    sourceUrl: 'local://social/rare-earth-policy-source',
  },
  {
    id: 'social-rare-narrative',
    topicId: 'rare-earths-social',
    tier: 'narrative',
    handle: '@supply-chain-map',
    accountType: 'analyst',
    text: 'Narrative cluster is shifting from EV inputs to defense electronics and strategic inventories.',
    observedAt: '09:06 ET',
    minutesAgo: 9,
    reachScore: 77,
    engagement: 188,
    credibility: 70,
    keywords: ['defense electronics', 'strategic inventory', 'EV inputs'],
    linkedMarkets: ['LIT', 'XAR', 'TSLA'],
    sourceUrl: 'local://social/rare-earth-narrative',
  },
]

const eventAgeMinutes: Record<string, number> = {
  'red-sea': 12,
  taiwan: 92,
  'rare-earths': 124,
  'central-bank': 255,
  'europe-energy': 335,
}

const eventLayerMap: Record<string, LayerId[]> = {
  'red-sea': ['market', 'news', 'trade', 'commodity', 'risk', 'exposure', 'entities', 'sources'],
  taiwan: ['market', 'news', 'social', 'politics', 'risk', 'exposure', 'entities', 'sources'],
  'rare-earths': ['market', 'news', 'social', 'politics', 'commodity', 'risk', 'exposure', 'entities', 'sources'],
  'central-bank': ['market', 'social', 'macro', 'commodity', 'exposure', 'entities', 'sources'],
  'europe-energy': ['market', 'news', 'macro', 'commodity', 'risk', 'exposure', 'sources'],
}

const eventVisuals: Record<
  string,
  {
    x: number
    y: number
    orbit: number
    chain: string
    next: string[]
    changed: string
    why: string
  }
> = {
  'red-sea': {
    x: 54,
    y: 53,
    orbit: 1,
    chain: 'Red Sea -> Shipping Risk -> Oil -> XLE -> Inflation Risk -> Gold',
    next: ['Freight insurance language', 'WTI breadth', 'Airline margin pressure'],
    changed: 'Route-risk premium is appearing in crude, XLE, freight, gold, and airline weakness.',
    why: 'A shipping corridor event is being priced as an inflation and energy-risk channel.',
  },
  taiwan: {
    x: 73,
    y: 42,
    orbit: 2,
    chain: 'Taiwan -> TSMC -> Semiconductors -> Nvidia -> Nasdaq',
    next: ['SOXX breadth', 'TSM gap risk', 'Export-control wording'],
    changed: 'Advanced-node supply concentration is pulling semis, Nvidia, Apple suppliers, and QQQ into the same chain.',
    why: 'Index-level beta can reprice when the chokepoint is structural and entity links are direct.',
  },
  'rare-earths': {
    x: 66,
    y: 47,
    orbit: 3,
    chain: 'China -> Rare Earths -> EV Supply Chain -> Tesla -> QQQ',
    next: ['Policy language', 'Magnet pricing', 'Defense supply-chain commentary'],
    changed: 'Industrial-policy chatter is mapping into EV, defense, battery, and strategic input exposure.',
    why: 'Rare earth processing concentration can move from headline risk into margin and inventory behavior.',
  },
  'central-bank': {
    x: 31,
    y: 42,
    orbit: 4,
    chain: 'Federal Reserve -> Bond Yields -> Dollar -> Gold -> Bitcoin -> Growth Stocks',
    next: ['Real yields', 'Dollar direction', 'Gold/BTC divergence'],
    changed: 'Rate-sensitive assets are linked by real-yield language and liquidity expectations.',
    why: 'Macro language can transmit across duration equities, gold, Bitcoin, TLT, and dollar proxies.',
  },
  'europe-energy': {
    x: 48,
    y: 37,
    orbit: 5,
    chain: 'Europe -> Gas Storage -> Industrial Margins -> Chemicals -> VGK',
    next: ['Weather volatility', 'Pipeline headlines', 'Industrial margin commentary'],
    changed: 'Gas storage buffers immediate stress while leaving manufacturing-margin exposure visible.',
    why: 'Energy security is lower severity today, but it remains connected to industrial cost risk.',
  },
}

function getEventLayers(event: RadarEvent) {
  return eventLayerMap[event.id] ?? ['market', 'news', 'entities', 'sources']
}

function getSignalForEvent(eventId: string) {
  return topSignals.find((signal) => signal.linkedEventIds.includes(eventId))
}

function getGraphNodeById(nodeId: string | null): GraphNodeSeed | null {
  if (!nodeId) {
    return null
  }

  return graphNodes.find((node) => node.id === nodeId) ?? null
}

function normalizeGraphKind(kind: string) {
  return kind.toLowerCase().replace(/\s+/g, '-')
}

function getSocialTierDefinition(tier: SocialTier) {
  return socialTierDefinitions.find((definition) => definition.id === tier) ?? socialTierDefinitions[0]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function calculateSocialVelocity(topic: SocialPulseTopic) {
  const series = topic.velocitySeries
  const last = series.at(-1)
  const previous = series.at(-2)
  const prior = series.at(-3)
  const bucketMinutes = 15

  if (!last || !previous) {
    return { velocity: 0, previousVelocity: 0, acceleration: 0 }
  }

  const velocity = (last.volume - previous.volume) / bucketMinutes
  const previousVelocity = prior ? (previous.volume - prior.volume) / bucketMinutes : 0

  return {
    velocity,
    previousVelocity,
    acceleration: velocity - previousVelocity,
  }
}

function calculateAttentionPressure(topic: SocialPulseTopic, posts: SocialPulsePost[]) {
  const socialWeightedPressure = posts.reduce((total, post) => {
    const tierWeight = getSocialTierDefinition(post.tier).weight
    const recencyWeight = clamp(1 - post.minutesAgo / 90, 0.35, 1)
    const credibilityWeight = clamp(post.credibility / 100, 0.35, 1)
    const engagementWeight = Math.log10(post.engagement + 10) * 4

    return total + (post.reachScore * tierWeight * recencyWeight * credibilityWeight) / 9 + engagementWeight
  }, 0)
  const mentionExpansion = clamp(topic.currentMentions / Math.max(topic.baselineMentions, 1), 0, 6) * 10
  const velocity = calculateSocialVelocity(topic).velocity * 5
  const movementBoost = Math.min(Math.abs(topic.marketMove) * 1.8, 18)

  return Math.round(clamp(socialWeightedPressure + mentionExpansion + velocity + movementBoost, 0, 100))
}

function getTierCounts(posts: SocialPulsePost[]) {
  return socialTierDefinitions.reduce<Record<SocialTier, number>>(
    (counts, tier) => ({
      ...counts,
      [tier.id]: posts.filter((post) => post.tier === tier.id).length,
    }),
    {
      facts: 0,
      movement: 0,
      attention: 0,
      narrative: 0,
      uncertainty: 0,
    },
  )
}

function formatChange(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function severityClass(severity: Severity) {
  return `severity severity-${severity}`
}

function changeClass(value: number) {
  return value >= 0 ? 'positive' : 'negative'
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    const storedValue = window.localStorage.getItem(key)
    if (!storedValue) {
      return initialValue
    }

    try {
      return JSON.parse(storedValue) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

function collectSourceTrail(events: RadarEvent[]) {
  return uniqueById(events.flatMap((event) => event.sourceTrail))
}

function collectEvidence(events: RadarEvent[]) {
  return uniqueById(events.flatMap((event) => event.evidenceNotes))
}

function collectSignals(events: RadarEvent[]) {
  const eventIds = new Set(events.map((event) => event.id))
  return topSignals.filter((signal) => signal.linkedEventIds.some((eventId) => eventIds.has(eventId)))
}

function buildAnalystAnswer({
  summary,
  relatedEvents,
  entities,
  tickers,
  confidence,
  uncertainty,
  watchNext,
}: {
  summary: string
  relatedEvents: RadarEvent[]
  entities: string[]
  tickers: string[]
  confidence: number
  uncertainty: string
  watchNext: string[]
}): AnalystAnswer {
  const linkedSignals = collectSignals(relatedEvents)

  return {
    summary,
    relatedEvents,
    entities,
    tickers,
    confidence,
    uncertainty,
    watchNext,
    sourceTrail: uniqueById([...collectSourceTrail(relatedEvents), ...linkedSignals.flatMap((signal) => signal.sourceTrail)]),
    evidenceTrail: uniqueById([...collectEvidence(relatedEvents), ...linkedSignals.flatMap((signal) => signal.evidenceTrail)]),
    linkedSignals: linkedSignals.map((signal) => signal.title),
  }
}

function pickAnalystContext(question: string): AnalystAnswer {
  const normalized = question.toLowerCase()
  const eventMatches = radarEvents.filter((event) => {
    const haystack = [
      event.title,
      event.summary,
      event.region,
      event.category,
      event.detectedEntities.join(' '),
      event.linkedMarkets.join(' '),
      event.riskChannels.join(' '),
      event.relationshipReason,
      event.sourceTrail.map((source) => source.title).join(' '),
    ]
      .join(' ')
      .toLowerCase()

    return normalized
      .split(/\W+/)
      .filter((token) => token.length > 3)
      .some((token) => haystack.includes(token))
  })

  if (normalized.includes('oil') || normalized.includes('crude') || normalized.includes('red sea')) {
    const relatedEvents = radarEvents.filter((event) => event.id === 'red-sea' || event.id === 'central-bank')
    return buildAnalystAnswer({
      summary:
        'Oil is moving because the Atlasz local evidence layer links Red Sea route-risk sources to freight costs, insurance, crude premium, XLE strength, gold confirmation, and airline margin pressure. The strongest source trail is the shipping wire plus market tape snapshot; confidence is limited by the lack of direct supply-disruption data.',
      relatedEvents,
      entities: ['Red Sea', 'Shipping Risk', 'WTI Crude', 'XLE', 'Inflation Risk', 'Gold', 'Airlines'],
      tickers: ['CL', 'XLE', 'GLD', 'DAL', 'UAL'],
      confidence: 78,
      uncertainty:
        'The model cannot prove causality from price alone. Watch whether the move fades when shipping headlines calm or broadens into rates and consumer-margin names.',
      watchNext: ['Freight-rate headlines', 'Energy breadth', 'Airline relative weakness', 'Gold confirmation'],
    })
  }

  if (
    normalized.includes('taiwan') ||
    normalized.includes('tsmc') ||
    normalized.includes('semiconductor') ||
    normalized.includes('nvidia')
  ) {
    const relatedEvents = radarEvents.filter((event) => event.id === 'taiwan' || event.id === 'rare-earths')
    return buildAnalystAnswer({
      summary:
        'Taiwan risk is grounded in two local evidence paths: the regional security wire names advanced-chip concentration, and the policy-calendar item keeps export controls in view. The exposed chain is Taiwan, TSMC, semiconductors, Nvidia, Apple suppliers, SOXX, and QQQ.',
      relatedEvents,
      entities: ['Taiwan', 'TSMC', 'Semiconductors', 'Nvidia', 'Apple', 'Nasdaq 100'],
      tickers: ['TSM', 'SOXX', 'NVDA', 'AAPL', 'QQQ'],
      confidence: 73,
      uncertainty:
        'The exposure is structurally high, but the immediate market impact depends on headline severity, export-control details, and whether investors treat the event as transient.',
      watchNext: ['SOXX relative strength', 'TSM gap risk', 'Export-control language', 'Mega-cap breadth'],
    })
  }

  if (normalized.includes('bitcoin') || normalized.includes('btc') || normalized.includes('crypto')) {
    const relatedEvents = radarEvents.filter((event) => event.id === 'central-bank')
    return buildAnalystAnswer({
      summary:
        'Bitcoin is mapped less as an isolated crypto story and more as a liquidity-sensitive asset. The local source trail references central bank language, real yields, dollar pressure, ETF-flow context, and risk appetite, but the confidence is deliberately lower because flow data is mocked.',
      relatedEvents,
      entities: ['Federal Reserve', 'Real Yields', 'Dollar', 'ETF Flows', 'Bitcoin'],
      tickers: ['BTC', 'QQQ', 'TLT', 'GLD'],
      confidence: 61,
      uncertainty:
        'The signal is lower confidence because crypto can move on positioning, flow, and market-structure factors that are not represented in this local seed set.',
      watchNext: ['Dollar direction', 'Real-yield move', 'ETF flow tone', 'Nasdaq correlation'],
    })
  }

  if (normalized.includes('rare earth') || normalized.includes('china') || normalized.includes('restriction')) {
    const relatedEvents = radarEvents.filter((event) => event.id === 'rare-earths')
    return buildAnalystAnswer({
      summary:
        'Rare earth risk is grounded in the industrial-policy monitor and the local supply-chain map. The key path is China, rare earth processing, EV magnets, defense electronics, Tesla, autos, and strategic inventory behavior.',
      relatedEvents,
      entities: ['China', 'Rare Earths', 'EV Supply Chain', 'Defense Electronics', 'Tesla'],
      tickers: ['TSLA', 'LIT', 'XAR', 'GM'],
      confidence: 68,
      uncertainty:
        'The market impact depends on whether restrictions become formal policy, whether exemptions appear, and how quickly buyers can diversify supply.',
      watchNext: ['Policy language', 'Magnet supply pricing', 'EV margin pressure', 'Defense supply-chain commentary'],
    })
  }

  const relatedEvents = eventMatches.length > 0 ? eventMatches.slice(0, 2) : radarEvents.slice(0, 2)
  return buildAnalystAnswer({
    summary:
      'The closest local evidence points to a cross-asset risk map rather than a single cause. Start with the linked events, then test whether price, volume, and related entities confirm the same story.',
    relatedEvents,
    entities: Array.from(new Set(relatedEvents.flatMap((event) => event.detectedEntities))).slice(0, 8),
    tickers: Array.from(new Set(relatedEvents.flatMap((event) => event.linkedMarkets))).slice(0, 8),
    confidence: eventMatches.length > 0 ? 58 : 42,
    uncertainty:
      'This answer is generated from local seed intelligence only. Add live feeds and source ingestion before treating it as a production research result.',
    watchNext: ['Confirm with volume', 'Check related tickers', 'Review source trail', 'Update the entity graph'],
  })
}

function App() {
  const [activeView, setActiveView] = useState<ViewId>('command')
  const [selectedTicker, setSelectedTicker] = useState('CL')
  const [selectedEventId, setSelectedEventId] = useState('red-sea')
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>('red-sea')
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindowId>('today')
  const [selectedSocialTopicId, setSelectedSocialTopicId] = useState('aixr-ai')
  const [selectedSocialTier, setSelectedSocialTier] = useState<SocialTier | 'all'>('all')
  const [radarFilter, setRadarFilter] = useState('All')
  const [question, setQuestion] = useState('')
  const [activeLayerIds, setActiveLayerIds] = useLocalStorageState<LayerId[]>('atlasz:intel:layers', defaultLayerIds)
  const [activeGraphKinds, setActiveGraphKinds] = useLocalStorageState<string[]>(
    'atlasz:intel:graph-kinds',
    Array.from(new Set(graphNodes.map((node) => node.kind))),
  )
  const [pinnedSignalIds, setPinnedSignalIds] = useLocalStorageState<string[]>('atlasz:intel:pinned-signals', [
    'oil-inflation',
  ])
  const [briefNotes, setBriefNotes] = useLocalStorageState(
    'atlasz:intel:brief-notes',
    'Watch whether crude strength confirms through XLE breadth and whether SOXX weakness spreads into QQQ.',
  )
  const [desktopMeta, setDesktopMeta] = useState<AtlaszDesktopMeta | null>(null)
  const [messages, setMessages] = useLocalStorageState<AnalystMessage[]>('atlasz:intel:analyst-thread', [
    {
      id: 'welcome',
      role: 'analyst',
      text: 'Ask about a market move, event, ticker, country, commodity, or exposure chain. This first build answers from local seed intelligence.',
      answer: pickAnalystContext('oil'),
    },
  ])

  const [pulseEnabled, setPulseEnabled] = useLocalStorageState('atlasz:intel:pulse', true)
  const [persistenceMode, setPersistenceMode] = useState<
    'node:sqlite' | 'better-sqlite3' | 'json-fallback' | 'localstorage'
  >('localstorage')

  useEffect(() => {
    window.atlaszDesktop?.getAppMeta().then(setDesktopMeta).catch(() => setDesktopMeta(null))
  }, [])

  useEffect(() => {
    setEnginePulse(pulseEnabled)
  }, [pulseEnabled])

  useEffect(() => {
    decisionJournal
      .status()
      .then((info) => setPersistenceMode(info.mode))
      .catch(() => undefined)
  }, [])

  const selectedMarket = useMemo(
    () => [...marketMovers, ...watchlist].find((item) => item.ticker === selectedTicker) ?? marketMovers[0],
    [selectedTicker],
  )

  const selectedMarketExplanation = marketExplanations[selectedTicker] ?? marketExplanations.CL

  const chartData = marketSeries[selectedTicker] ?? marketSeries.CL
  const selectedEvent = radarEvents.find((event) => event.id === selectedEventId) ?? radarEvents[0]
  const selectedSignal = getSignalForEvent(selectedEvent.id) ?? topSignals[0]
  const selectedGraphNode = getGraphNodeById(selectedGraphNodeId)
  const pinnedSignals = topSignals.filter((signal) => pinnedSignalIds.includes(signal.id))
  const selectedSocialTopic =
    socialPulseTopics.find((topic) => topic.id === selectedSocialTopicId) ?? socialPulseTopics[0]
  const selectedSocialPosts = socialPulsePosts.filter((post) => post.topicId === selectedSocialTopic.id)
  const socialPressure = calculateAttentionPressure(selectedSocialTopic, selectedSocialPosts)
  const socialVelocity = calculateSocialVelocity(selectedSocialTopic)

  const filteredEvents = useMemo(() => {
    if (radarFilter === 'All') {
      return radarEvents
    }

    return radarEvents.filter((event) => event.region === radarFilter || event.category === radarFilter)
  }, [radarFilter])

  const radarFilters = useMemo(
    () => ['All', ...Array.from(new Set(radarEvents.flatMap((event) => [event.region, event.category])))],
    [],
  )

  const filteredPulseEvents = useMemo(() => {
    const timeWindow = timeWindows.find((window) => window.id === selectedTimeWindow)
    const activeLayerSet = new Set(activeLayerIds)

    return radarEvents.filter((event) => {
      const isInsideTime =
        !timeWindow?.minutes || selectedTimeWindow === 'custom' || (eventAgeMinutes[event.id] ?? 0) <= timeWindow.minutes
      const matchesLayer = getEventLayers(event).some((layerId) => activeLayerSet.has(layerId))

      return isInsideTime && matchesLayer
    })
  }, [activeLayerIds, selectedTimeWindow])

  const graphKindOptions = useMemo(() => Array.from(new Set(graphNodes.map((node) => node.kind))), [])

  const toggleLayer = (layerId: LayerId) => {
    setActiveLayerIds((currentLayerIds) =>
      currentLayerIds.includes(layerId)
        ? currentLayerIds.filter((currentLayerId) => currentLayerId !== layerId)
        : [...currentLayerIds, layerId],
    )
  }

  const toggleGraphKind = (kind: string) => {
    setActiveGraphKinds((currentKinds) =>
      currentKinds.includes(kind) ? currentKinds.filter((currentKind) => currentKind !== kind) : [...currentKinds, kind],
    )
  }

  const togglePinnedSignal = (signalId: string) => {
    setPinnedSignalIds((currentSignalIds) =>
      currentSignalIds.includes(signalId)
        ? currentSignalIds.filter((currentSignalId) => currentSignalId !== signalId)
        : [...currentSignalIds, signalId],
    )
  }

  const selectTicker = (ticker: string, nextView: ViewId = 'terminal') => {
    setSelectedTicker(ticker)
    setActiveView(nextView)
  }

  const selectEvent = (eventId: string, nextView?: ViewId) => {
    setSelectedEventId(eventId)
    setSelectedGraphNodeId(eventId)
    if (nextView) {
      setActiveView(nextView)
    }
  }

  const flowNodes = useMemo<Node[]>(
    () =>
      graphNodes
        .filter((node) => activeGraphKinds.includes(node.kind))
        .map((node) => {
          const kindClass = normalizeGraphKind(node.kind)

          return {
            id: node.id,
            position: node.position,
            data: {
              label: (
                <div
                  className={`graph-node graph-node-${node.tone} graph-kind-${kindClass}${
                    selectedGraphNodeId === node.id ? ' selected' : ''
                  }`}
                >
                  <strong>{node.label}</strong>
                  <span>{node.kind}</span>
                </div>
              ),
            },
            draggable: true,
            selectable: true,
            style: {
              background: 'transparent',
              border: 'none',
              padding: 0,
              width: 162,
            },
          }
        }),
    [activeGraphKinds, selectedGraphNodeId],
  )

  const flowEdges = useMemo<Edge[]>(
    () => {
      const visibleNodeIds = new Set(graphNodes.filter((node) => activeGraphKinds.includes(node.kind)).map((node) => node.id))

      return graphEdges
        .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
        .map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: edge.strength > 78,
          style: {
            stroke: edge.strength > 78 ? '#ef4444' : '#5eead4',
            strokeWidth: edge.strength > 75 ? 2 : 1.2,
          },
          labelStyle: { fill: '#d6efe8', fontSize: 11 },
          labelBgStyle: { fill: '#0d1110', fillOpacity: 0.88 },
        }))
    },
    [activeGraphKinds],
  )

  function submitQuestion(nextQuestion = question) {
    const trimmed = nextQuestion.trim()
    if (!trimmed) {
      return
    }

    const contextQuestion = [
      trimmed,
      selectedEvent.title,
      selectedMarket.ticker,
      selectedMarket.name,
      selectedGraphNode?.label,
      selectedSocialTopic.label,
      `attention pressure ${socialPressure}`,
      `dV/dt ${socialVelocity.velocity.toFixed(2)}`,
      selectedSignal.chain,
    ]
      .filter(Boolean)
      .join(' ')
    const answer = pickAnalystContext(contextQuestion)
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `${Date.now()}-user`, role: 'user', text: trimmed },
      { id: `${Date.now()}-analyst`, role: 'analyst', text: 'Local analyst response', answer },
    ])
    setQuestion('')
    setActiveView('analyst')
  }

  const resetWorkspace = () => {
    if (typeof window === 'undefined') {
      return
    }
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('atlasz:'))
      .forEach((key) => window.localStorage.removeItem(key))
    window.location.reload()
  }

  const paletteActions: CommandAction[] = [
    ...buildNavActions(views, setActiveView),
    {
      id: 'act:create-decision',
      label: 'Create Decision',
      group: 'Intelligence',
      hint: 'New thesis',
      icon: BookOpen,
      perform: () => setActiveView('decision'),
    },
    {
      id: 'act:search-entity',
      label: 'Search Entity',
      group: 'Intelligence',
      hint: 'Entity graph',
      icon: Network,
      perform: () => setActiveView('graph'),
    },
    {
      id: 'act:search-market',
      label: 'Search Market',
      group: 'Intelligence',
      hint: 'Market terminal',
      icon: LineChart,
      perform: () => setActiveView('terminal'),
    },
    {
      id: 'act:toggle-pulse',
      label: pulseEnabled ? 'Toggle Global Pulse · turn off' : 'Toggle Global Pulse · turn on',
      group: 'Workspace',
      icon: Activity,
      perform: () => setPulseEnabled((value) => !value),
    },
    {
      id: 'act:reset-workspace',
      label: 'Reset Demo Workspace',
      group: 'Workspace',
      hint: 'Clear local data',
      icon: Database,
      perform: resetWorkspace,
    },
  ]

  return (
    <main className="app-shell">
      <CommandPalette actions={paletteActions} />
      <aside className="sidebar" aria-label="Atlasz Intel sections">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Activity size={20} />
          </div>
          <div>
            <span className="eyebrow">Local-first terminal</span>
            <h1>Atlasz Intel</h1>
          </div>
        </div>

        <nav className="nav-stack">
          {views.map((view) => {
            const Icon = view.icon
            return (
              <button
                className={activeView === view.id ? 'nav-item active' : 'nav-item'}
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
              >
                <Icon size={17} />
                <span>{view.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-module">
          <span className="module-label">Workspace</span>
          <p>Private seed intelligence, watchlists, notes, and analyst thread are stored locally in this app.</p>
          <div className="storage-pill">
            <Database size={14} />
            <span>
              {desktopMeta ? desktopMeta.platform : 'Browser preview'} ·{' '}
              {persistenceMode === 'node:sqlite'
                ? 'node:sqlite WAL'
                : persistenceMode === 'better-sqlite3'
                  ? 'better-sqlite3 WAL'
                  : persistenceMode === 'json-fallback'
                    ? 'JSON fallback'
                    : 'localStorage'}
            </span>
          </div>
        </div>

        <div className="sidebar-module status-module">
          <span className="module-label">Signal Health</span>
          <div className="status-row">
            <span>Entity map</span>
            <strong>{graphNodes.length} nodes</strong>
          </div>
          <div className="status-row">
            <span>Risk events</span>
            <strong>{radarEvents.length}</strong>
          </div>
          <div className="status-row">
            <span>Source items</span>
            <strong>{rawSourceItems.length}</strong>
          </div>
          <div className="status-row">
            <span>Social posts</span>
            <strong>{socialPulsePosts.length}</strong>
          </div>
          <div className="status-row">
            <span>Offline mode</span>
            <strong>Ready</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">The world behind the chart</span>
            <h2>A local-first quant intelligence terminal where events become one signal map.</h2>
          </div>
          <div className="topbar-actions">
            <CommandMenuButton />
            <span className="source-badge">
              <CircleDotDashed size={14} />
              Evidence layer v0.2
            </span>
            <PulseIndicator />
            <button className="ghost-button" type="button" onClick={() => setActiveView('brief')}>
              <NotebookPen size={16} />
              Morning brief
            </button>
          </div>
        </header>

        <section className="ticker-tape" aria-label="Market tape">
          {[...marketMovers, ...watchlist].map((item) => (
            <button
              className={selectedTicker === item.ticker ? 'ticker-tile active' : 'ticker-tile'}
              key={item.ticker}
              type="button"
              onClick={() => selectTicker(item.ticker)}
            >
              <span>{item.ticker}</span>
              <strong>{item.price}</strong>
              <em className={changeClass(item.change)}>
                {item.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {formatChange(item.change)}
              </em>
            </button>
          ))}
        </section>

        <ViewErrorBoundary key={activeView}>
        {activeView === 'command' && (
          <section className="dashboard-grid command-grid">
            <article className="panel command-status-panel">
              <CommandStatus
                activeLayerCount={activeLayerIds.length}
                pinnedSignals={pinnedSignals}
                selectedEvent={selectedEvent}
                selectedMarket={selectedMarket}
                selectedSignal={selectedSignal}
                socialPressure={socialPressure}
                socialVelocity={socialVelocity.velocity}
              />
            </article>

            <article className="panel pulse-panel">
              <PanelHeader icon={Globe2} label="Global Pulse" title="World events, exposures, and source trails" />
              <GlobalPulseScene
                activeLayerIds={activeLayerIds}
                events={filteredPulseEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                onSelectTicker={(ticker) => selectTicker(ticker, 'command')}
                selectedEventId={selectedEvent.id}
              />
              <TimelineControl
                events={filteredPulseEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                selectedEventId={selectedEvent.id}
                selectedTimeWindow={selectedTimeWindow}
                setSelectedTimeWindow={setSelectedTimeWindow}
              />
            </article>

            <article className="panel dossier-panel">
              <PanelHeader icon={Crosshair} label="Dossier" title="Selected intelligence object" />
              <IntelDossier
                graphNode={selectedGraphNode}
                market={selectedMarket}
                marketExplanation={selectedMarketExplanation}
                onAskAnalyst={() => submitQuestion('Explain selected signal')}
                onSelectTicker={(ticker) => selectTicker(ticker, 'command')}
                selectedEvent={selectedEvent}
                signal={selectedSignal}
              />
            </article>

            <article className="panel">
              <PanelHeader icon={LineChart} label="Markets" title="Top movers" />
              <MarketMoverList
                movers={marketMovers}
                onSelect={(ticker) => selectTicker(ticker, 'command')}
                selectedTicker={selectedTicker}
              />
            </article>

            <article className="panel">
              <PanelHeader icon={Activity} label="Realtime" title="Live pulse" />
              <RealtimePulsePanel enabled={pulseEnabled} />
            </article>

            <article className="panel">
              <PanelHeader icon={Database} label="Data Core" title="Ingestion health + replay" />
              <DataCorePanel />
            </article>

            <article className="panel">
              <PanelHeader icon={ShieldAlert} label="Risk Map" title="Global pressure" />
              <div className="risk-map">
                {riskMap.map((risk) => (
                  <div className="risk-row" key={risk.region}>
                    <div>
                      <strong>{risk.region}</strong>
                      <span>{risk.driver}</span>
                    </div>
                    <div className="risk-meter" aria-label={`${risk.region} pressure ${risk.pressure}`}>
                      <span style={{ width: `${risk.pressure}%` }} />
                    </div>
                    <em>{risk.markets}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel tall-panel">
              <PanelHeader icon={Zap} label="Signals" title="Top signal map" />
              <div className="signal-stack">
                {topSignals.map((signal) => (
                  <SignalCard
                    isPinned={pinnedSignalIds.includes(signal.id)}
                    key={signal.id}
                    onPin={togglePinnedSignal}
                    signal={signal}
                  />
                ))}
              </div>
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={RadioTower} label="World Radar" title="Structured event feed" />
              <EventFeed
                compact
                events={radarEvents.slice(0, 3)}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                selectedEventId={selectedEvent.id}
              />
            </article>

            <article className="panel wide-panel social-preview-panel">
              <PanelHeader icon={Activity} label="Social Pulse" title="Attention pressure and narrative velocity" />
              <SocialPulseModule
                compact
                onSelectTier={setSelectedSocialTier}
                onSelectTicker={(ticker) => selectTicker(ticker, 'command')}
                onSelectTopic={setSelectedSocialTopicId}
                selectedTier={selectedSocialTier}
                selectedTopicId={selectedSocialTopic.id}
                velocity={socialVelocity}
              />
            </article>

            <article className="panel">
              <PanelHeader icon={BrainCircuit} label="AI Analyst" title="Ask the local analyst" />
              <div className="analyst-prompt-mini">
                <p>Get source-trail reasoning across events, entities, tickers, confidence, uncertainty, and what to watch next.</p>
                <div className="prompt-chip-stack">
                  {promptChips.slice(0, 3).map((prompt) => (
                    <button key={prompt} type="button" onClick={() => submitQuestion(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel">
              <PanelHeader icon={Database} label="Ingestion" title="Evidence pipeline" />
              <IngestionPipeline />
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={Layers3} label="Layers" title="Evidence layer matrix" />
              <EvidenceLayerMap
                events={filteredPulseEvents}
                selectedEventId={selectedEvent.id}
                selectedTimeWindow={selectedTimeWindow}
                activeLayerIds={activeLayerIds}
                graphKinds={graphKindOptions}
                activeGraphKinds={activeGraphKinds}
                pinnedSignals={pinnedSignals}
                onSelectEvent={selectEvent}
                onSelectTimeWindow={setSelectedTimeWindow}
                onToggleLayer={toggleLayer}
                onToggleGraphKind={toggleGraphKind}
                onTogglePinnedSignal={togglePinnedSignal}
              />
            </article>
          </section>
        )}

        {activeView === 'terminal' && (
          <section className="dashboard-grid terminal-grid">
            <article className="panel terminal-chart-panel">
              <PanelHeader icon={LineChart} label="Market Terminal" title={`${selectedMarket.ticker} connected chart`} />
              <div className="chart-stat-row">
                <div>
                  <span>{selectedMarket.name}</span>
                  <strong>{selectedMarket.price}</strong>
                </div>
                <em className={changeClass(selectedMarket.change)}>{formatChange(selectedMarket.change)}</em>
                <p>{selectedMarket.catalyst}</p>
              </div>
              <LiveMarketReadout symbol={selectedTicker} enabled={pulseEnabled} />
              <div className="chart-frame">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 18, right: 18, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="marketGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#5eead4" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#5eead4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1c2825" vertical={false} />
                    <XAxis dataKey="time" stroke="#6c7d76" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6c7d76" tickLine={false} axisLine={false} width={58} domain={['dataMin', 'dataMax']} />
                    <Tooltip contentStyle={{ background: '#0d1110', border: '1px solid #26322f', color: '#f2fff9' }} />
                    <Area type="monotone" dataKey="price" stroke="#5eead4" strokeWidth={2.5} fill="url(#marketGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel">
              <PanelHeader icon={Crosshair} label="Evidence" title="Market explanation" />
              <MarketExplanationPanel explanation={selectedMarketExplanation} />
            </article>

            <article className="panel">
              <PanelHeader icon={Layers3} label="Watchlist" title="Tracked markets" />
              <MarketMoverList
                movers={watchlist}
                onSelect={(ticker) => selectTicker(ticker, 'terminal')}
                selectedTicker={selectedTicker}
              />
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={Activity} label="Volume" title="Intraday participation" />
              <div className="bar-frame">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="#1c2825" vertical={false} />
                    <XAxis dataKey="time" stroke="#6c7d76" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6c7d76" tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={{ background: '#0d1110', border: '1px solid #26322f', color: '#f2fff9' }} />
                    <Bar dataKey="volume" fill="#facc15" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>
        )}

        {activeView === 'radar' && (
          <section className="dashboard-grid radar-grid">
            <article className="panel radar-pulse-panel wide-panel">
              <PanelHeader icon={RadioTower} label="Global Pulse" title="Mission feed mapped to markets" />
              <GlobalPulseScene
                activeLayerIds={activeLayerIds}
                events={filteredPulseEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                onSelectTicker={(ticker) => selectTicker(ticker, 'radar')}
                selectedEventId={selectedEvent.id}
              />
              <TimelineControl
                events={filteredPulseEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                selectedEventId={selectedEvent.id}
                selectedTimeWindow={selectedTimeWindow}
                setSelectedTimeWindow={setSelectedTimeWindow}
              />
            </article>

            <article className="panel dossier-panel">
              <PanelHeader icon={Crosshair} label="Dossier" title="Selected radar object" />
              <IntelDossier
                graphNode={selectedGraphNode}
                market={selectedMarket}
                marketExplanation={selectedMarketExplanation}
                onAskAnalyst={() => submitQuestion('Explain selected radar event')}
                onSelectTicker={(ticker) => selectTicker(ticker, 'radar')}
                selectedEvent={selectedEvent}
                signal={selectedSignal}
              />
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={RadioTower} label="World Radar" title="Events are structured, not just headlines" />
              <div className="filter-row">
                {radarFilters.map((filter) => (
                  <button
                    className={radarFilter === filter ? 'filter-button active' : 'filter-button'}
                    key={filter}
                    type="button"
                    onClick={() => setRadarFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <EventFeed
                events={filteredEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                selectedEventId={selectedEvent.id}
              />
            </article>
          </section>
        )}

        {activeView === 'social' && (
          <section className="dashboard-grid social-grid">
            <article className="panel social-main-panel">
              <PanelHeader icon={Activity} label="Social Pulse" title="Attention pressure radar" />
              <SocialPulseModule
                onSelectTier={setSelectedSocialTier}
                onSelectTicker={(ticker) => selectTicker(ticker, 'social')}
                onSelectTopic={setSelectedSocialTopicId}
                selectedTier={selectedSocialTier}
                selectedTopicId={selectedSocialTopic.id}
                velocity={socialVelocity}
              />
            </article>

            <article className="panel">
              <PanelHeader icon={Crosshair} label="Structural Tiers" title="Truth separation" />
              <SocialTierDossier
                posts={selectedSocialPosts}
                selectedTier={selectedSocialTier}
                topic={selectedSocialTopic}
                velocity={socialVelocity}
              />
            </article>
          </section>
        )}

        {activeView === 'graph' && (
          <section className="dashboard-grid graph-grid">
            <article className="panel graph-panel">
              <PanelHeader icon={Network} label="Entity Graph" title="Relationships between events, markets, and exposures" />
              <div className="graph-frame">
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  fitView
                  onNodeClick={(_event, node) => {
                    setSelectedGraphNodeId(node.id)
                    if (radarEvents.some((event) => event.id === node.id)) {
                      setSelectedEventId(node.id)
                    }
                  }}
                  proOptions={{ hideAttribution: true }}
                >
                  <MiniMap pannable zoomable nodeColor="#5eead4" maskColor="rgba(5, 6, 7, 0.72)" />
                  <Controls />
                  <Background color="#20302d" gap={22} />
                </ReactFlow>
              </div>
            </article>
            <article className="panel">
              <PanelHeader icon={AlertTriangle} label="Chains" title="Highest-value paths" />
              <EntityTypeFilters
                activeGraphKinds={activeGraphKinds}
                graphKinds={graphKindOptions}
                onToggleGraphKind={toggleGraphKind}
              />
              <GraphInspector graphNode={selectedGraphNode} />
              <div className="signal-stack">
                {topSignals.slice(0, 3).map((signal) => (
                  <SignalCard key={signal.id} signal={signal} compact />
                ))}
              </div>
            </article>
          </section>
        )}

        {activeView === 'analyst' && (
          <section className="dashboard-grid analyst-grid">
            <article className="panel analyst-panel">
              <PanelHeader icon={BrainCircuit} label="AI Analyst" title="Private local analyst interface" />
              <AnalystContextBanner
                graphNode={selectedGraphNode}
                market={selectedMarket}
                onAskSelected={() => submitQuestion('Explain selected view')}
                selectedEvent={selectedEvent}
                signal={selectedSignal}
              />
              <div className="analyst-thread">
                {messages.map((message) => (
                  <div className={`message message-${message.role}`} key={message.id}>
                    <span>{message.role === 'user' ? 'You' : 'Atlasz Analyst'}</span>
                    <p>{message.text}</p>
                    {message.answer && <AnalystAnswerView answer={message.answer} />}
                  </div>
                ))}
              </div>
              <form
                className="analyst-input"
                onSubmit={(event) => {
                  event.preventDefault()
                  submitQuestion()
                }}
              >
                <Search size={17} />
                <input
                  aria-label="Ask the Atlasz analyst"
                  placeholder="Ask about oil, Taiwan, Bitcoin, rare earths, QQQ, exposed companies..."
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <button type="submit">Analyze</button>
              </form>
              <div className="prompt-chip-stack inline-chips">
                {promptChips.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => submitQuestion(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeView === 'brief' && (
          <section className="dashboard-grid brief-grid">
            <article className="panel wide-panel">
              <PanelHeader icon={FileText} label="Daily Brief" title="Private morning intelligence report" />
              <div className="daily-brief">
                {dailyBrief.map((item) => (
                  <div className="brief-row" key={item.id}>
                    <span className={severityClass(item.severity)}>{severityLabels[item.severity]}</span>
                    <div>
                      <h3>{item.headline}</h3>
                      <p>{item.whyItMatters}</p>
                      <EvidenceMeta confidence={item.confidence} sourceCount={item.sourceCount} />
                      <LinkedTags title="Entities" values={item.relatedEntities} />
                      <LinkedTags title="Markets" values={item.relatedMarkets} />
                      <div className="uncertainty-block compact-uncertainty">
                        <span>Uncertainty</span>
                        <p>{item.uncertainty}</p>
                      </div>
                      <EvidenceNotes notes={item.evidenceTrail.slice(0, 2)} />
                      <SourceTrail trail={item.sourceTrail.slice(0, 3)} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <PanelHeader icon={NotebookPen} label="Local Notes" title="Saved analyst scratchpad" />
              <textarea value={briefNotes} onChange={(event) => setBriefNotes(event.target.value)} />
              <p className="note-footnote">Saved in localStorage for this workspace.</p>
            </article>
            <article className="panel wide-panel">
              <PanelHeader icon={Zap} label="Watch Next" title="Open signal checklist" />
              <div className="watch-next-grid">
                {topSignals.map((signal) => (
                  <label key={signal.id}>
                    <input type="checkbox" />
                    <span>{signal.title}</span>
                  </label>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeView === 'decision' && (
          <section className="dashboard-grid brief-grid">
            <article className="panel wide-panel">
              <PanelHeader icon={BookOpen} label="Decision Journal" title="Thesis, evidence, review, and post-mortem" />
              <DecisionJournal />
            </article>
          </section>
        )}
        </ViewErrorBoundary>
      </section>
    </main>
  )
}

function PanelHeader({
  icon: Icon,
  label,
  title,
}: {
  icon: typeof MonitorDot
  label: string
  title: string
}) {
  return (
    <header className="panel-header">
      <div>
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
    </header>
  )
}

function CommandStatus({
  activeLayerCount,
  pinnedSignals,
  selectedEvent,
  selectedMarket,
  selectedSignal,
  socialPressure,
  socialVelocity,
}: {
  activeLayerCount: number
  pinnedSignals: Signal[]
  selectedEvent: RadarEvent
  selectedMarket: MarketMover
  selectedSignal: Signal
  socialPressure: number
  socialVelocity: number
}) {
  const dominantTheme = dailyBrief[0]

  return (
    <div className="command-status-grid">
      <div className="status-kicker">
        <span>Global regime</span>
        <strong>{dominantTheme.headline}</strong>
      </div>
      <div className="status-tile">
        <span>Current risk</span>
        <strong>{severityLabels[selectedEvent.severity]}</strong>
        <em>{selectedEvent.region}</em>
      </div>
      <div className="status-tile">
        <span>Dominant chain</span>
        <strong>{selectedSignal.relationshipStrength}%</strong>
        <em>{selectedSignal.chain}</em>
      </div>
      <div className="status-tile">
        <span>Market focus</span>
        <strong>{selectedMarket.ticker}</strong>
        <em>{selectedMarket.catalyst}</em>
      </div>
      <div className="status-tile">
        <span>Attention pressure</span>
        <strong>{socialPressure}/100</strong>
        <em>dV/dt {socialVelocity.toFixed(2)} mentions/min</em>
      </div>
      <div className="status-tile">
        <span>System status</span>
        <strong>{activeLayerCount} layers</strong>
        <em>{pinnedSignals.length} pinned signals, {rawSourceItems.length} source items, {socialPulsePosts.length} social posts</em>
      </div>
    </div>
  )
}

function GlobalPulseScene({
  activeLayerIds,
  events,
  onSelectEvent,
  onSelectTicker,
  selectedEventId,
}: {
  activeLayerIds: LayerId[]
  events: RadarEvent[]
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
  selectedEventId: string
}) {
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? radarEvents.find((event) => event.id === selectedEventId) ?? events[0]
  const selectedVisual = selectedEvent ? eventVisuals[selectedEvent.id] : null
  const activeLayerSet = new Set(activeLayerIds)
  const showSources = activeLayerSet.has('sources')
  const showExposure = activeLayerSet.has('exposure') || activeLayerSet.has('market')
  const showRisk = activeLayerSet.has('risk')

  return (
    <div className="global-pulse-scene">
      <div className="pulse-toolbar">
        <div>
          <span>Active overlays</span>
          <strong>{activeLayerIds.map((layerId) => layerDefinitions.find((layer) => layer.id === layerId)?.label).join(' / ')}</strong>
        </div>
        <div>
          <span>Source coverage</span>
          <strong>{events.reduce((total, event) => total + event.sourceCount, 0)} evidence items in view</strong>
        </div>
      </div>

      <div className="pulse-stage">
        <div className="globe-viewport" aria-label="3D-style global intelligence pulse view">
          <div className="globe-sphere">
            <span className="globe-horizon" />
            <span className="globe-lat lat-1" />
            <span className="globe-lat lat-2" />
            <span className="globe-lat lat-3" />
            <span className="globe-lon lon-1" />
            <span className="globe-lon lon-2" />
            <span className="globe-lon lon-3" />
            <span className="orbit-ring orbit-1" />
            <span className="orbit-ring orbit-2" />
            <span className="orbit-ring orbit-3" />
            {showRisk && <span className="risk-zone risk-zone-red-sea" />}
            {showRisk && <span className="risk-zone risk-zone-taiwan" />}
            {showExposure && <span className="market-arc arc-energy" />}
            {showExposure && <span className="market-arc arc-semis" />}
            {showExposure && <span className="market-arc arc-macro" />}

            {events.map((event) => {
              const visual = eventVisuals[event.id]
              const layers = getEventLayers(event).filter((layerId) => activeLayerSet.has(layerId))

              return (
                <button
                  aria-label={`Inspect ${event.title}`}
                  className={`pulse-node pulse-node-${event.severity}${selectedEventId === event.id ? ' active' : ''}`}
                  key={event.id}
                  style={{ left: `${visual?.x ?? 50}%`, top: `${visual?.y ?? 50}%` }}
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                >
                  <span className="node-core" />
                  <span className="node-label">
                    <strong>{event.region}</strong>
                    <em>{event.category}</em>
                    {showSources && <small>{event.sourceCount} src</small>}
                  </span>
                  <span className="node-layer-count">{layers.length}</span>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="pulse-sidecar">
          {selectedEvent ? (
            <>
              <span className={severityClass(selectedEvent.severity)}>{severityLabels[selectedEvent.severity]}</span>
              <h3>{selectedEvent.title}</h3>
              <p>{selectedVisual?.changed ?? selectedEvent.summary}</p>
              <code>{selectedVisual?.chain ?? getSignalForEvent(selectedEvent.id)?.chain}</code>
              <div className="sidecar-metrics">
                <div>
                  <span>Confidence</span>
                  <strong>{selectedEvent.confidence}%</strong>
                </div>
                <div>
                  <span>Sources</span>
                  <strong>{selectedEvent.sourceCount}</strong>
                </div>
                <div>
                  <span>Layers</span>
                  <strong>{getEventLayers(selectedEvent).filter((layerId) => activeLayerSet.has(layerId)).length}</strong>
                </div>
              </div>
              <LinkedTags title="Detected entities" values={selectedEvent.detectedEntities.slice(0, 5)} />
              <div className="market-link-row">
                {selectedEvent.linkedMarkets.map((market) => (
                  <button key={market} type="button" onClick={() => onSelectTicker(market)}>
                    {market}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>No events match the active layer and time controls.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function SocialPulseModule({
  compact = false,
  onSelectTier,
  onSelectTicker,
  onSelectTopic,
  selectedTier,
  selectedTopicId,
  velocity,
}: {
  compact?: boolean
  onSelectTier: (tier: SocialTier | 'all') => void
  onSelectTicker: (ticker: string) => void
  onSelectTopic: (topicId: string) => void
  selectedTier: SocialTier | 'all'
  selectedTopicId: string
  velocity: ReturnType<typeof calculateSocialVelocity>
}) {
  const topic = socialPulseTopics.find((item) => item.id === selectedTopicId) ?? socialPulseTopics[0]
  const topicPosts = socialPulsePosts.filter((post) => post.topicId === topic.id)
  const pressure = calculateAttentionPressure(topic, topicPosts)
  const tierCounts = getTierCounts(topicPosts)
  const visiblePosts = (selectedTier === 'all' ? topicPosts : topicPosts.filter((post) => post.tier === selectedTier)).slice(
    0,
    compact ? 4 : topicPosts.length,
  )
  const keywordCounts = topicPosts
    .flatMap((post) => post.keywords)
    .reduce<Record<string, number>>((counts, keyword) => ({ ...counts, [keyword]: (counts[keyword] ?? 0) + 1 }), {})
  const repeatedKeywords = Object.entries(keywordCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 7)
    .map(([keyword]) => keyword)
  const velocityChartData = topic.velocitySeries.map((point, index, series) => {
    const previous = series[index - 1]

    return {
      ...point,
      velocity: previous ? Number(((point.volume - previous.volume) / 15).toFixed(2)) : 0,
    }
  })

  return (
    <div className={compact ? 'social-pulse-module compact-social' : 'social-pulse-module'}>
      <div className="social-principle">
        <span>Social attention is not evidence</span>
        <p>Atlasz treats social posts as attention pressure, then separates facts, movement, attention, narrative, and uncertainty.</p>
      </div>

      <div className="social-topic-row">
        {socialPulseTopics.map((item) => (
          <button
            className={item.id === topic.id ? 'social-topic active' : 'social-topic'}
            key={item.id}
            type="button"
            onClick={() => onSelectTopic(item.id)}
          >
            <strong>{item.asset}</strong>
            <span>{item.theme}</span>
          </button>
        ))}
      </div>

      <div className="social-pressure-grid">
        <div className="attention-gauge">
          <div
            className="pressure-ring"
            style={{
              background: `conic-gradient(var(--green) ${pressure * 3.6}deg, rgba(94, 234, 212, 0.08) 0deg)`,
            }}
          >
            <strong>{pressure}</strong>
            <span>/100</span>
          </div>
          <div>
            <span>Attention Pressure</span>
            <p>{topic.label}</p>
          </div>
        </div>

        <div className="social-metric">
          <span>dV/dt Velocity</span>
          <strong>{velocity.velocity.toFixed(2)} mentions/min</strong>
          <em>{velocity.acceleration >= 0 ? '+' : ''}{velocity.acceleration.toFixed(2)} vs prior bucket</em>
        </div>
        <div className="social-metric">
          <span>Mentions</span>
          <strong>{topic.currentMentions}</strong>
          <em>{topic.baselineMentions} baseline / {topic.volumeMove} volume</em>
        </div>
        <div className="social-metric">
          <span>Market coupling</span>
          <strong className={changeClass(topic.marketMove)}>{formatChange(topic.marketMove)}</strong>
          <em>{topic.sentiment} social tone / {topic.confidence}% confidence</em>
        </div>
      </div>

      {!compact && (
        <div className="social-velocity-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityChartData} margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
              <defs>
                <linearGradient id="socialVelocityGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1c2825" vertical={false} />
              <XAxis dataKey="time" stroke="#6c7d76" tickLine={false} axisLine={false} />
              <YAxis stroke="#6c7d76" tickLine={false} axisLine={false} width={44} />
              <Tooltip contentStyle={{ background: '#0d1110', border: '1px solid #26322f', color: '#f2fff9' }} />
              <Area type="monotone" dataKey="volume" stroke="#67e8f9" strokeWidth={2.2} fill="url(#socialVelocityGradient)" />
              <Area type="monotone" dataKey="velocity" stroke="#facc15" strokeWidth={1.7} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="social-tier-board">
        <button
          className={selectedTier === 'all' ? 'tier-filter active' : 'tier-filter'}
          type="button"
          onClick={() => onSelectTier('all')}
        >
          <strong>All</strong>
          <span>{topicPosts.length} posts</span>
        </button>
        {socialTierDefinitions.map((tier) => (
          <button
            className={selectedTier === tier.id ? `tier-filter tier-${tier.id} active` : `tier-filter tier-${tier.id}`}
            key={tier.id}
            type="button"
            onClick={() => onSelectTier(tier.id)}
          >
            <strong>{tier.label}</strong>
            <span>{tierCounts[tier.id]} posts</span>
            <em>{tier.description}</em>
          </button>
        ))}
      </div>

      <div className="social-narrative-row">
        <LinkedTags title="Repeated keywords" values={repeatedKeywords} />
        <div className="market-link-row">
          {topic.linkedMarkets.map((ticker) => (
            <button key={ticker} type="button" onClick={() => onSelectTicker(ticker)}>
              {ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="social-post-stream">
        <header>
          <span>Incoming posts separated by structural tier</span>
          <strong>{visiblePosts.length} visible</strong>
        </header>
        {visiblePosts.map((post) => (
          <article className={`social-post tier-${post.tier}`} key={post.id}>
            <header>
              <span>{getSocialTierDefinition(post.tier).label}</span>
              <strong>{post.handle}</strong>
              <em>{post.observedAt}</em>
            </header>
            <p>{post.text}</p>
            <footer>
              <span>{post.accountType}</span>
              <span>{post.reachScore} reach</span>
              <span>{post.credibility}% credibility</span>
              <span>{post.sourceUrl}</span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}

function SocialTierDossier({
  posts,
  selectedTier,
  topic,
  velocity,
}: {
  posts: SocialPulsePost[]
  selectedTier: SocialTier | 'all'
  topic: SocialPulseTopic
  velocity: ReturnType<typeof calculateSocialVelocity>
}) {
  const tierCounts = getTierCounts(posts)
  const selectedTierDefinition = selectedTier === 'all' ? null : getSocialTierDefinition(selectedTier)

  return (
    <div className="social-tier-dossier">
      <div className="relationship-block">
        <span>Module rule</span>
        <p>Social Pulse tracks what is being discussed and how fast attention is changing. It does not treat posts as facts unless they enter the Facts tier with source support.</p>
      </div>
      <div className="dossier-metric-grid">
        <div>
          <span>Topic</span>
          <strong>{topic.asset}</strong>
        </div>
        <div>
          <span>dV/dt</span>
          <strong>{velocity.velocity.toFixed(2)}</strong>
        </div>
        <div>
          <span>Acceleration</span>
          <strong>{velocity.acceleration >= 0 ? '+' : ''}{velocity.acceleration.toFixed(2)}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{topic.confidence}%</strong>
        </div>
      </div>
      <div className="social-tier-stack">
        {socialTierDefinitions.map((tier) => (
          <article className={selectedTier === tier.id ? `tier-summary tier-${tier.id} active` : `tier-summary tier-${tier.id}`} key={tier.id}>
            <header>
              <strong>{tier.label}</strong>
              <span>{tierCounts[tier.id]}</span>
            </header>
            <p>{tier.description}</p>
          </article>
        ))}
      </div>
      <div className="uncertainty-block compact-uncertainty">
        <span>{selectedTierDefinition ? `${selectedTierDefinition.label} interpretation` : 'Interpretation'}</span>
        <p>
          {selectedTierDefinition
            ? selectedTierDefinition.description
            : 'All tiers are visible. Facts should constrain the narrative; uncertainty should reduce confidence when attention is moving faster than verification.'}
        </p>
      </div>
    </div>
  )
}

function TimelineControl({
  events,
  onSelectEvent,
  selectedEventId,
  selectedTimeWindow,
  setSelectedTimeWindow,
}: {
  events: RadarEvent[]
  onSelectEvent: (eventId: string) => void
  selectedEventId: string
  selectedTimeWindow: TimeWindowId
  setSelectedTimeWindow: (windowId: TimeWindowId) => void
}) {
  return (
    <div className="timeline-control">
      <div className="time-window-row">
        {timeWindows.map((window) => (
          <button
            className={selectedTimeWindow === window.id ? 'filter-button active' : 'filter-button'}
            key={window.id}
            type="button"
            onClick={() => setSelectedTimeWindow(window.id)}
          >
            {window.label}
          </button>
        ))}
      </div>
      <div className="event-timeline">
        {events.map((event) => (
          <button
            className={selectedEventId === event.id ? 'timeline-event active' : 'timeline-event'}
            key={event.id}
            type="button"
            onClick={() => onSelectEvent(event.id)}
          >
            <span>{event.time}</span>
            <strong>{event.category}</strong>
            <em>{event.region}</em>
          </button>
        ))}
      </div>
    </div>
  )
}

function IntelDossier({
  graphNode,
  market,
  marketExplanation,
  onAskAnalyst,
  onSelectTicker,
  selectedEvent,
  signal,
}: {
  graphNode: GraphNodeSeed | null
  market: MarketMover
  marketExplanation: MarketExplanation
  onAskAnalyst: () => void
  onSelectTicker: (ticker: string) => void
  selectedEvent: RadarEvent
  signal: Signal
}) {
  const visual = eventVisuals[selectedEvent.id]
  const [dossierNote, setDossierNote] = useLocalStorageState(
    'atlasz:intel:dossier-note',
    'Pin the chain, then verify whether the next market leg confirms the source trail.',
  )

  return (
    <div className="intel-dossier">
      <div className="dossier-lead">
        <span className={severityClass(selectedEvent.severity)}>{severityLabels[selectedEvent.severity]}</span>
        <h3>{selectedEvent.title}</h3>
        <p>{selectedEvent.summary}</p>
      </div>

      <div className="dossier-metric-grid">
        <div>
          <span>Confidence</span>
          <strong>{selectedEvent.confidence}%</strong>
        </div>
        <div>
          <span>Sources</span>
          <strong>{selectedEvent.sourceCount}</strong>
        </div>
        <div>
          <span>Market</span>
          <strong>{market.ticker}</strong>
        </div>
        <div>
          <span>Move</span>
          <strong className={changeClass(market.change)}>{formatChange(market.change)}</strong>
        </div>
      </div>

      <div className="relationship-block">
        <span>Relationship chain</span>
        <p>{visual?.chain ?? signal.chain}</p>
      </div>
      <div className="relationship-block">
        <span>Why it matters</span>
        <p>{visual?.why ?? selectedEvent.relationshipReason}</p>
      </div>
      <div className="relationship-block">
        <span>What changed</span>
        <p>{visual?.changed ?? marketExplanation.possibleCause}</p>
      </div>
      <div className="uncertainty-block compact-uncertainty">
        <span>Uncertainty</span>
        <p>{selectedEvent.uncertainty}</p>
      </div>

      {graphNode && (
        <div className="selected-node-card">
          <span>Selected entity</span>
          <strong>{graphNode.label}</strong>
          <em>{graphNode.kind}</em>
        </div>
      )}

      <LinkedTags title="Related entities" values={selectedEvent.detectedEntities} />
      <div className="linked-tags">
        <span>Linked markets</span>
        <div className="market-link-row">
          {selectedEvent.linkedMarkets.map((ticker) => (
            <button key={ticker} type="button" onClick={() => onSelectTicker(ticker)}>
              {ticker}
            </button>
          ))}
        </div>
      </div>
      <LinkedTags title="What to watch next" values={visual?.next ?? signal.repeatedThemes} />
      <SourceTrail trail={selectedEvent.sourceTrail.slice(0, 3)} />

      <div className="dossier-actions">
        <button className="ghost-button" type="button" onClick={onAskAnalyst}>
          <BrainCircuit size={15} />
          Ask about this view
        </button>
      </div>

      <label className="dossier-note">
        <span>Saved note</span>
        <textarea value={dossierNote} onChange={(event) => setDossierNote(event.target.value)} />
      </label>
    </div>
  )
}

function EntityTypeFilters({
  activeGraphKinds,
  graphKinds,
  onToggleGraphKind,
}: {
  activeGraphKinds: string[]
  graphKinds: string[]
  onToggleGraphKind: (kind: string) => void
}) {
  return (
    <div className="entity-filter-grid">
      {graphKinds.map((kind) => (
        <button
          className={activeGraphKinds.includes(kind) ? 'filter-button active' : 'filter-button'}
          key={kind}
          type="button"
          onClick={() => onToggleGraphKind(kind)}
        >
          {kind}
        </button>
      ))}
    </div>
  )
}

function GraphInspector({ graphNode }: { graphNode: GraphNodeSeed | null }) {
  if (!graphNode) {
    return (
      <div className="graph-inspector empty-state">
        <span>Selected entity</span>
        <p>Select a node to inspect direct relationships, relationship strength, and adjacent market exposure.</p>
      </div>
    )
  }

  const directEdges = graphEdges.filter((edge) => edge.source === graphNode.id || edge.target === graphNode.id)
  const adjacentNodeIds = directEdges.map((edge) => (edge.source === graphNode.id ? edge.target : edge.source))
  const adjacentNodes = graphNodes.filter((node) => adjacentNodeIds.includes(node.id))
  const relatedEvents = radarEvents.filter((event) =>
    event.detectedEntities.some((entity) => entity.toLowerCase().includes(graphNode.label.toLowerCase())),
  )
  const chain = riskChainFor(graphNode.id)

  return (
    <div className="graph-inspector">
      <span>Selected entity</span>
      <strong>{graphNode.label}</strong>
      <em>{graphNode.kind}</em>
      <div className="relationship-block">
        <span>Direct connections</span>
        <p>{directEdges.map((edge) => `${edge.label} (${edge.strength}%)`).join(' / ') || 'No direct edge in filtered view'}</p>
      </div>
      <div className="relationship-block">
        <span>Risk chain · traversal</span>
        {chain.length === 0 ? (
          <p>No downstream exposure path from this node.</p>
        ) : (
          <ol className="risk-chain">
            {chain.slice(0, 6).map((exposed) => (
              <li key={exposed.node.id}>
                <strong>{exposed.node.symbol ?? exposed.node.label}</strong>
                <em>{Math.round(exposed.strength * 100)}%</em>
                <span>{exposed.path.map((hop) => hop.relation).join(' → ') || 'direct'}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <LinkedTags title="Adjacent nodes" values={adjacentNodes.map((node) => node.label)} />
      <LinkedTags title="Related events" values={relatedEvents.map((event) => event.title)} />
    </div>
  )
}

function AnalystContextBanner({
  graphNode,
  market,
  onAskSelected,
  selectedEvent,
  signal,
}: {
  graphNode: GraphNodeSeed | null
  market: MarketMover
  onAskSelected: () => void
  selectedEvent: RadarEvent
  signal: Signal
}) {
  return (
    <div className="analyst-context-banner">
      <div>
        <span>Current analyst context</span>
        <strong>{selectedEvent.title}</strong>
        <em>
          {market.ticker} / {graphNode?.label ?? selectedEvent.region} / {signal.chain}
        </em>
      </div>
      <button className="ghost-button" type="button" onClick={onAskSelected}>
        <BrainCircuit size={15} />
        Explain selected view
      </button>
    </div>
  )
}

function MarketMoverList({
  movers,
  onSelect,
  selectedTicker,
}: {
  movers: MarketMover[]
  onSelect: (ticker: string) => void
  selectedTicker: string
}) {
  return (
    <div className="market-list">
      {movers.map((mover) => (
        <button
          className={selectedTicker === mover.ticker ? 'market-row active' : 'market-row'}
          key={mover.ticker}
          type="button"
          onClick={() => onSelect(mover.ticker)}
        >
          <div>
            <strong>{mover.ticker}</strong>
            <span>{mover.name}</span>
          </div>
          <div>
            <em className={changeClass(mover.change)}>{formatChange(mover.change)}</em>
            <small>{mover.volume} vol</small>
          </div>
        </button>
      ))}
    </div>
  )
}

function EventFeed({
  events,
  compact = false,
  onSelectEvent,
  selectedEventId,
}: {
  events: RadarEvent[]
  compact?: boolean
  onSelectEvent?: (eventId: string) => void
  selectedEventId?: string
}) {
  return (
    <div className={compact ? 'event-feed compact-feed' : 'event-feed'}>
      {events.map((event) => {
        const signal = getSignalForEvent(event.id)

        return (
          <article className={selectedEventId === event.id ? 'event-card active' : 'event-card'} key={event.id}>
            <header>
              <span className={severityClass(event.severity)}>{severityLabels[event.severity]}</span>
              <time>{event.time}</time>
              <em>{event.category}</em>
              <strong>{event.sourceCount} sources</strong>
            </header>
            <h3>{event.title}</h3>
            <p>{event.summary}</p>
            <EvidenceMeta confidence={event.confidence} sourceCount={event.sourceCount} />
            {signal && <code className="chain-preview">{signal.chain}</code>}
            <div className="tag-stack">
              {event.detectedEntities.slice(0, compact ? 4 : 8).map((entity) => (
                <span key={entity}>{entity}</span>
              ))}
            </div>
            {!compact && (
              <>
                <div className="relationship-block">
                  <span>Why linked</span>
                  <p>{event.relationshipReason}</p>
                </div>
                <LinkedTags title="Linked markets" values={event.linkedMarkets} />
                <LinkedTags title="Risk channels" values={event.riskChannels} />
                <div className="uncertainty-block compact-uncertainty">
                  <span>Uncertainty</span>
                  <p>{event.uncertainty}</p>
                </div>
                <EvidenceNotes notes={event.evidenceNotes} />
                <SourceTrail trail={event.sourceTrail} />
              </>
            )}
            {onSelectEvent && (
              <button className="inspect-button" type="button" onClick={() => onSelectEvent(event.id)}>
                Inspect dossier
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}

function AnalystAnswerView({ answer }: { answer: AnalystAnswer }) {
  return (
    <div className="answer-card">
      <p>{answer.summary}</p>
      <div className="answer-grid">
        <div>
          <span>Related events</span>
          {answer.relatedEvents.map((event) => (
            <strong key={event.id}>{event.title}</strong>
          ))}
        </div>
        <div>
          <span>Entities</span>
          <strong>{answer.entities.join(', ')}</strong>
        </div>
        <div>
          <span>Tickers</span>
          <strong>{answer.tickers.join(', ')}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{answer.confidence}%</strong>
        </div>
      </div>
      <div className="uncertainty-block">
        <span>Uncertainty</span>
        <p>{answer.uncertainty}</p>
      </div>
      {answer.linkedSignals && answer.linkedSignals.length > 0 && (
        <LinkedTags title="Linked signals" values={answer.linkedSignals.slice(0, 3)} />
      )}
      <EvidenceNotes notes={answer.evidenceTrail?.slice(0, 4) ?? []} />
      <SourceTrail trail={answer.sourceTrail?.slice(0, 5) ?? []} />
      <div className="tag-stack">
        {answer.watchNext.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function EvidenceMeta({ confidence, sourceCount }: { confidence: number; sourceCount: number }) {
  return (
    <div className="evidence-meta">
      <span>{confidence}% confidence</span>
      <span>{sourceCount} sources</span>
    </div>
  )
}

function LinkedTags({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null
  }

  return (
    <div className="linked-tags">
      <span>{title}</span>
      <div className="tag-stack">
        {values.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    </div>
  )
}

function EvidenceNotes({ notes }: { notes: EvidenceNote[] }) {
  if (notes.length === 0) {
    return null
  }

  return (
    <div className="evidence-notes">
      <span>Evidence notes</span>
      {notes.map((note) => (
        <div className={`evidence-note evidence-${note.confidenceImpact}`} key={note.id}>
          <strong>{note.supports}</strong>
          <p>{note.note}</p>
        </div>
      ))}
    </div>
  )
}

function SourceTrail({ trail }: { trail: SourceTrailItem[] }) {
  if (trail.length === 0) {
    return null
  }

  return (
    <div className="source-trail">
      <span>Source trail</span>
      {trail.map((source) => (
        <article className="source-item" key={source.id}>
          <header>
            <strong>{source.sourceName}</strong>
            <em>{source.sourceType}</em>
          </header>
          <p>{source.title}</p>
          <footer>
            <time>Seen {source.observedAt.replace('T', ' ').replace('-04:00', ' ET')}</time>
            <span>{source.sourceUrl}</span>
          </footer>
          <small>{source.note}</small>
        </article>
      ))}
    </div>
  )
}

function SignalCard({
  signal,
  compact = false,
  isPinned = false,
  onPin,
}: {
  signal: Signal
  compact?: boolean
  isPinned?: boolean
  onPin?: (signalId: string) => void
}) {
  return (
    <div className={compact ? 'signal-card compact-signal' : 'signal-card'}>
      <div className="signal-title">
        <span className={severityClass(signal.status)}>{severityLabels[signal.status]}</span>
        <strong>{signal.title}</strong>
        {onPin && (
          <button className={isPinned ? 'pin-button active' : 'pin-button'} type="button" onClick={() => onPin(signal.id)}>
            {isPinned ? 'Pinned' : 'Pin'}
          </button>
        )}
      </div>
      <p>{signal.explanation}</p>
      <code>{signal.chain}</code>
      <div className="signal-score-grid">
        <span>{signal.timeframe}</span>
        <span>{signal.relationshipStrength}% relationship</span>
        <span>{signal.recencyScore}% recency</span>
      </div>
      <EvidenceMeta confidence={signal.confidence} sourceCount={signal.sourceCount} />
      {!compact && (
        <>
          <LinkedTags title="Repeated themes" values={signal.repeatedThemes} />
          <LinkedTags title="Markets" values={signal.linkedMarkets} />
          <div className="uncertainty-block compact-uncertainty">
            <span>Uncertainty</span>
            <p>{signal.uncertainty}</p>
          </div>
          <EvidenceNotes notes={signal.evidenceTrail.slice(0, 3)} />
          <SourceTrail trail={signal.sourceTrail.slice(0, 3)} />
        </>
      )}
    </div>
  )
}

function MarketExplanationPanel({ explanation }: { explanation: MarketExplanation }) {
  const relatedEvents = explanation.relatedEventIds
    .map((eventId) => radarEvents.find((event) => event.id === eventId))
    .filter((event): event is RadarEvent => Boolean(event))
  const chains = Array.from(
    new Set(
      relatedEvents
        .map((event) => eventVisuals[event.id]?.chain ?? getSignalForEvent(event.id)?.chain)
        .filter((chain): chain is string => Boolean(chain)),
    ),
  )

  return (
    <div className="market-evidence-panel">
      <div className="explanation-lead">
        <strong>{explanation.priceMove}</strong>
        <p>{explanation.possibleCause}</p>
      </div>
      <div className="relationship-block">
        <span>Why linked</span>
        <p>{explanation.relationshipReason}</p>
      </div>
      <div className="market-chain-map">
        <span>Market exposure map</span>
        {chains.map((chain) => (
          <code key={chain}>{chain}</code>
        ))}
      </div>
      <EvidenceMeta confidence={explanation.confidence} sourceCount={explanation.sourceTrail.length} />
      <LinkedTags title="Related entities" values={explanation.relatedEntities} />
      <LinkedTags title="Linked markets" values={explanation.linkedMarkets} />
      <div className="related-event-stack">
        <span>Related events</span>
        {relatedEvents.map((event) => (
          <article key={event.id}>
            <strong>{event.title}</strong>
            <p>{event.relationshipReason}</p>
          </article>
        ))}
      </div>
      <div className="uncertainty-block compact-uncertainty">
        <span>Uncertainty</span>
        <p>{explanation.uncertainty}</p>
      </div>
      <EvidenceNotes notes={explanation.evidenceTrail.slice(0, 3)} />
      <SourceTrail trail={explanation.sourceTrail.slice(0, 4)} />
    </div>
  )
}

function IngestionPipeline() {
  return (
    <div className="pipeline-stack">
      {ingestionPipeline.map((stage) => (
        <div className={`pipeline-stage pipeline-${stage.status}`} key={stage.id}>
          <div>
            <strong>{stage.label}</strong>
            <span>{stage.output}</span>
          </div>
          <p>{stage.description}</p>
        </div>
      ))}
    </div>
  )
}

function EvidenceLayerMap({
  events,
  selectedEventId,
  selectedTimeWindow,
  activeLayerIds,
  graphKinds,
  activeGraphKinds,
  pinnedSignals,
  onSelectEvent,
  onSelectTimeWindow,
  onToggleLayer,
  onToggleGraphKind,
  onTogglePinnedSignal,
}: {
  events: RadarEvent[]
  selectedEventId: string
  selectedTimeWindow: TimeWindowId
  activeLayerIds: LayerId[]
  graphKinds: string[]
  activeGraphKinds: string[]
  pinnedSignals: Signal[]
  onSelectEvent: (eventId: string, nextView?: ViewId) => void
  onSelectTimeWindow: (timeWindowId: TimeWindowId) => void
  onToggleLayer: (layerId: LayerId) => void
  onToggleGraphKind: (kind: string) => void
  onTogglePinnedSignal: (signalId: string) => void
}) {
  const activeLayers = layerDefinitions.filter((layer) => activeLayerIds.includes(layer.id))
  const activeWindow = timeWindows.find((window) => window.id === selectedTimeWindow)

  return (
    <div className="layer-matrix">
      <div className="layer-summary">
        <strong>{activeLayers.length} active layers</strong>
        <span>{activeWindow?.label ?? 'Today'} evidence window</span>
      </div>
      <div className="time-window-row">
        {timeWindows.map((window) => (
          <button
            className={selectedTimeWindow === window.id ? 'mini-toggle active' : 'mini-toggle'}
            key={window.id}
            type="button"
            onClick={() => onSelectTimeWindow(window.id)}
          >
            {window.label}
          </button>
        ))}
      </div>
      <div className="layer-chip-grid">
        {layerDefinitions.map((layer) => (
          <button
            className={`layer-chip layer-${layer.tone}${activeLayerIds.includes(layer.id) ? ' active' : ''}`}
            key={layer.id}
            type="button"
            onClick={() => onToggleLayer(layer.id)}
          >
            <strong>{layer.label}</strong>
            <span>{layer.description}</span>
          </button>
        ))}
      </div>
      <div className="time-window-row">
        {graphKinds.map((kind) => (
          <button
            className={activeGraphKinds.includes(kind) ? 'mini-toggle active' : 'mini-toggle'}
            key={kind}
            type="button"
            onClick={() => onToggleGraphKind(kind)}
          >
            {kind}
          </button>
        ))}
      </div>
      <div className="pinned-signal-row">
        <span>Pinned signals</span>
        {topSignals.map((signal) => (
          <button
            className={pinnedSignals.some((pinnedSignal) => pinnedSignal.id === signal.id) ? 'mini-toggle active' : 'mini-toggle'}
            key={signal.id}
            type="button"
            onClick={() => onTogglePinnedSignal(signal.id)}
          >
            {signal.title}
          </button>
        ))}
      </div>
      <div className="event-layer-stack">
        {events.slice(0, 4).map((event) => {
          const signal = getSignalForEvent(event.id)
          const visual = eventVisuals[event.id]
          const layers = getEventLayers(event).filter((layerId) => activeLayerIds.includes(layerId))

          return (
            <article className={selectedEventId === event.id ? 'event-layer-row active' : 'event-layer-row'} key={event.id}>
              <header>
                <strong>{event.title}</strong>
                <span>{eventAgeMinutes[event.id] ?? 0}m old</span>
              </header>
              <p>{visual?.changed ?? event.relationshipReason}</p>
              <code>{visual?.chain ?? signal?.chain ?? 'No chain mapped'}</code>
              <div className="layer-dot-row">
                {layers.map((layerId) => (
                  <span key={layerId}>{layerDefinitions.find((layer) => layer.id === layerId)?.label ?? layerId}</span>
                ))}
              </div>
              <footer>
                {signal && <em>{signal.confidence}% signal confidence</em>}
                <button type="button" onClick={() => onSelectEvent(event.id, 'radar')}>
                  Inspect event
                </button>
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}

class ViewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Atlasz view render error', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="dashboard-grid">
          <article className="panel wide-panel">
            <div className="empty-state error-state">
              <AlertTriangle size={20} />
              <h3>This view hit a render error</h3>
              <p>
                The rest of Atlasz Intel is still running. Switch to another section from the sidebar to recover, or reload
                the workspace. Your local notes, watchlist, and analyst thread are unaffected.
              </p>
            </div>
          </article>
        </section>
      )
    }

    return this.props.children
  }
}

export default App
