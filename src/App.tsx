import { Component, Suspense, lazy, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleDotDashed,
  Crosshair,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
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
import type { Edge, Node } from '@xyflow/react'
import './App.css'
import { CommandMenuButton, CommandPalette } from './CommandPalette'
import { buildNavActions, type CommandAction } from './commandActions'
import { DecisionJournal } from './DecisionJournal'
import { decisionJournal } from './intelClient'
import { riskChainFor } from './intelGraphData'
import { DataCorePanel, LiveMarketReadout, PulseIndicator, RealtimePulsePanel } from './RealtimeWidgets'
import { ChartSkeleton, GraphSkeleton, GlobeSkeleton, PanelSkeleton } from './components/ui/Skeletons'
import { ProvenanceBadge } from './components/ui/ProvenanceBadge'

// Heavy visual libraries (recharts, @xyflow/react) and the World Intelligence
// view are loaded lazily so they stay out of the app startup chunk.
const WorldIntelligenceView = lazy(() =>
  import('./WorldIntelligenceView').then((m) => ({ default: m.WorldIntelligenceView })),
)
const MarketPriceChart = lazy(() =>
  import('./components/quant/MarketCharts').then((m) => ({ default: m.MarketPriceChart })),
)
const MarketVolumeChart = lazy(() =>
  import('./components/quant/MarketCharts').then((m) => ({ default: m.MarketVolumeChart })),
)
const SocialVelocityChart = lazy(() =>
  import('./components/quant/MarketCharts').then((m) => ({ default: m.SocialVelocityChart })),
)
const RelationshipGraph = lazy(() =>
  import('./components/graph/RelationshipGraph').then((m) => ({ default: m.RelationshipGraph })),
)
const QuantTerminalView = lazy(() =>
  import('./components/quant/QuantTerminalView').then((m) => ({ default: m.QuantTerminalView })),
)
const SourceHealthView = lazy(() =>
  import('./components/status/SourceHealthView').then((m) => ({ default: m.SourceHealthView })),
)
const ResearchNotePanel = lazy(() =>
  import('./components/journal/ResearchNotePanel').then((m) => ({ default: m.ResearchNotePanel })),
)
import { addUniverseAsset, setPulseEnabled as setEnginePulse, useEngineSnapshot } from './realtimeStore'
import { resolveAssetQuery, type AssetUniverseItem } from './assetUniverse'
import { CANDLE_HISTORY_UNAVAILABLE, PRICE_UNAVAILABLE, priceTruthFromAsset } from './marketDataTruth'
import type { LiveAssetSnapshot, SourceTrust } from './realtime'
import { useWorldIntelSnapshot } from './worldIntelStore'
import { WhatChangedTodayPanel } from './components/intel/WhatChangedTodayPanel'
import { EntityEvidenceGraphPanel } from './components/intel/EntityEvidenceGraphPanel'
import { EventResolutionPanel } from './components/intel/EventResolutionPanel'
import { ConnectorDashboardPanel } from './components/intel/ConnectorDashboardPanel'
import { MarketCoverageDashboard } from './components/intel/MarketCoverageDashboard'
import { MissingMarketDataPanel } from './components/intel/MissingMarketDataPanel'
import { MarketQuoteSourceTrail } from './components/intel/MarketQuoteSourceTrail'
import { OptionsSourceTrail } from './components/intel/OptionsSourceTrail'
import { ExposureDashboardPanel } from './components/intel/ExposureDashboardPanel'
import { findWorldIntelEvent } from './engine/entityResolver'
import type { WorldIntelSnapshot } from './worldIntel'
import {
  graphEdges,
  graphNodes,
  ingestionPipeline,
  riskMap,
  type BriefItem,
  type EvidenceNote,
  type GraphNodeSeed,
  type MarketExplanation,
  type MarketMover,
  type RadarEvent,
  type Severity,
  type Signal,
  type SourceTrailItem,
} from './data/intel'

type ViewId =
  | 'command'
  | 'world'
  | 'terminal'
  | 'quant'
  | 'radar'
  | 'social'
  | 'graph'
  | 'cyber'
  | 'analyst'
  | 'brief'
  | 'decision'
  | 'sources'
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

type DefensiveRuntimePolicy =
  | 'study-only'
  | 'allowed-library'
  | 'manual-review'
  | 'auth-required'
  | 'authorized-lab-only'
  | 'blocked'

type DefensiveReferenceEntry = {
  id: string
  label: string
  domain: string
  runtimePolicy: DefensiveRuntimePolicy
  riskTags: string[]
  capabilities: string[]
  engineeringLesson: string
}

const views: Array<{ id: ViewId; label: string; icon: typeof MonitorDot }> = [
  { id: 'command', label: 'Global Overview', icon: MonitorDot },
  { id: 'world', label: 'World Intel', icon: Globe2 },
  { id: 'graph', label: 'Intelligence Graph', icon: Network },
  { id: 'radar', label: 'Event Timelines', icon: RadioTower },
  { id: 'terminal', label: 'Market / Infra', icon: LineChart },
  { id: 'cyber', label: 'Cyber / OPSEC', icon: ShieldAlert },
  { id: 'sources', label: 'Source Trails', icon: Database },
  { id: 'quant', label: 'Quant Context', icon: Crosshair },
  { id: 'social', label: 'Attention Pulse', icon: Activity },
  { id: 'analyst', label: 'Analysis Desk', icon: BrainCircuit },
  { id: 'brief', label: 'Daily Brief', icon: FileText },
  { id: 'decision', label: 'Decision Journal', icon: BookOpen },
]

const defensiveReferenceEntries: DefensiveReferenceEntry[] = [
  {
    id: 'sigma-style-detections',
    label: 'Sigma-style detection references',
    domain: 'detection-engineering',
    runtimePolicy: 'allowed-library',
    riskTags: ['detection-rule', 'source-validation'],
    capabilities: ['portable rule shape', 'ATT&CK mapping', 'test data requirement'],
    engineeringLesson: 'Detection rules are versioned references until the required telemetry source is present.',
  },
  {
    id: 'elastic-splunk-detection-content',
    label: 'Elastic / Splunk detection content',
    domain: 'detection-engineering',
    runtimePolicy: 'study-only',
    riskTags: ['detection-rule', 'observability'],
    capabilities: ['rule metadata', 'false-positive notes', 'data-source requirements'],
    engineeringLesson: 'Every alert should declare data requirements, blind spots, confidence, and validation evidence.',
  },
  {
    id: 'yara-signature-references',
    label: 'YARA signature references',
    domain: 'malware-reverse-engineering',
    runtimePolicy: 'authorized-lab-only',
    riskTags: ['malware-handling', 'detection-rule'],
    capabilities: ['pattern matching', 'metadata discipline', 'sample triage boundary'],
    engineeringLesson: 'Malware signatures are useful references, but sample handling stays inside an authorized lab.',
  },
  {
    id: 'opencti-misp-style-cti',
    label: 'OpenCTI / MISP style CTI',
    domain: 'cti-platform',
    runtimePolicy: 'auth-required',
    riskTags: ['cti-data', 'source-trust'],
    capabilities: ['typed objects', 'confidence scores', 'TLP and sharing scope'],
    engineeringLesson: 'Threat intelligence imports need credentials, sharing rules, confidence, and provenance before use.',
  },
  {
    id: 'zeek-suricata-security-onion',
    label: 'Zeek / Suricata / Security Onion telemetry',
    domain: 'soc-siem',
    runtimePolicy: 'manual-review',
    riskTags: ['defensive-sensor', 'telemetry'],
    capabilities: ['network metadata', 'IDS events', 'SOC correlation'],
    engineeringLesson: 'Network telemetry is powerful only when deployed with authorization, retention, and source context.',
  },
  {
    id: 'projectdiscovery-recon-suite',
    label: 'ProjectDiscovery / Amass recon tools',
    domain: 'internet-mapping',
    runtimePolicy: 'authorized-lab-only',
    riskTags: ['active-scan', 'infrastructure-exposure'],
    capabilities: ['asset discovery', 'DNS and HTTP observation', 'template checks'],
    engineeringLesson: 'Active recon is never background behavior; it requires explicit scope and operator authorization.',
  },
  {
    id: 'sbom-signing-provenance',
    label: 'SBOM, signing, and provenance controls',
    domain: 'supply-chain-integrity',
    runtimePolicy: 'allowed-library',
    riskTags: ['supply-chain', 'provenance'],
    capabilities: ['SBOM inventory', 'artifact signing', 'attestation chains'],
    engineeringLesson: 'Verified labels should be earned through auditable provenance, signatures, or first-party proof.',
  },
  {
    id: 'person-enrichment-tools',
    label: 'Person-enrichment OSINT tooling',
    domain: 'privacy-opsec',
    runtimePolicy: 'blocked',
    riskTags: ['person-enrichment', 'privacy'],
    capabilities: ['boundary awareness', 'privacy risk modeling'],
    engineeringLesson: 'Person enrichment and account enumeration are blocked from Atlasz runtime by default.',
  },
]

function summarizeDefensiveReferences(entries: DefensiveReferenceEntry[]) {
  const byPolicy = entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.runtimePolicy] = (counts[entry.runtimePolicy] ?? 0) + 1
    return counts
  }, {})
  const byDomain = entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.domain] = (counts[entry.domain] ?? 0) + 1
    return counts
  }, {})
  const defaultSafeCount = entries.filter((entry) => ['allowed-library', 'study-only'].includes(entry.runtimePolicy)).length

  return {
    entryCount: entries.length,
    defaultSafeCount,
    byPolicy,
    byDomain,
  }
}

function defensiveEntriesByRiskTag(tag: string) {
  return defensiveReferenceEntries.filter((entry) => entry.riskTags.includes(tag))
}

function defensiveReferenceIsDefaultSafe(entry: DefensiveReferenceEntry) {
  return entry.runtimePolicy === 'allowed-library' || entry.runtimePolicy === 'study-only'
}

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

const unavailableEvent: RadarEvent = {
  id: 'world-data-unavailable',
  time: '—',
  category: 'World data',
  region: 'Unavailable',
  severity: 'stable',
  confidence: 0,
  sourceCount: 0,
  title: 'World radar unavailable',
  summary: 'No real public world events are available in the current local snapshot.',
  relationshipReason: 'Atlasz is not using seeded world events as a runtime fallback.',
  uncertainty: 'Refresh public sources or inspect Data Core for connector status.',
  detectedEntities: [],
  linkedMarkets: [],
  riskChannels: [],
  evidenceNotes: [],
  sourceTrail: [],
}

const unavailableSignal: Signal = {
  id: 'signal-data-unavailable',
  title: 'No source-backed signal available',
  explanation: 'Signal Engine has no real sourced evidence in the current local snapshot.',
  status: 'stable',
  confidence: 0,
  timeframe: 'Unavailable',
  chain: 'DATA_UNAVAILABLE',
  linkedEventIds: [unavailableEvent.id],
  linkedEntities: [],
  linkedMarkets: [],
  repeatedThemes: [],
  relationshipStrength: 0,
  sourceCount: 0,
  recencyScore: 0,
  uncertainty: 'No simulated or seeded signal is substituted.',
  evidenceTrail: [],
  sourceTrail: [],
}

const unavailableBriefItem: BriefItem = {
  id: 'brief-data-unavailable',
  headline: 'Daily brief unavailable',
  whyItMatters: 'No real public world event batch has been ingested for this local snapshot.',
  severity: 'stable',
  relatedEntities: [],
  relatedMarkets: [],
  confidence: 0,
  sourceCount: 0,
  uncertainty: 'Atlasz does not generate a fake daily brief when sources are empty or unavailable.',
  watchNext: ['Refresh public world sources', 'Check Data Core source health'],
  evidenceTrail: [],
  sourceTrail: [],
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
    text: 'Local structural sample: AIXR contract language is being referenced, but no production revenue impact is confirmed.',
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
    text: 'Local structural sample: AIXR relative volume, basket movement, and price context would be separated from source-backed facts.',
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
    text: 'Uncertainty: account quality is uneven, several posts recycle the same image, and there is no confirmed customer-size data.',
    observedAt: '09:10 ET',
    minutesAgo: 5,
    reachScore: 54,
    engagement: 67,
    credibility: 71,
    keywords: ['duplicate image', 'account quality', 'customer size'],
    linkedMarkets: ['AIXR'],
    sourceUrl: 'local://social/aixr-uncertainty',
  },
  {
    id: 'social-btc-attention',
    topicId: 'btc-liquidity',
    tier: 'attention',
    handle: '@crypto-flow-local',
    accountType: 'operator',
    text: 'Local structural sample: BTC attention rises with liquidity keywords while ETF-flow claims remain unverified.',
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
    handle: '@local-crypto-tape',
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

function getSignalForEvent(eventId: string, signals: Signal[] = []) {
  return signals.find((signal) => signal.linkedEventIds.includes(eventId))
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

function marketMoverFromLiveAsset(item: AssetUniverseItem, asset: LiveAssetSnapshot | null | undefined): MarketMover {
  const truth = priceTruthFromAsset(asset, item.symbol)
  return {
    ticker: item.symbol,
    name: item.label,
    price: truth.label,
    change: asset?.tickCount ? asset.changePct : 0,
    volume: asset?.tickCount ? asset.metrics.oneMinuteVolume.toFixed(0) : 'unavailable',
    catalyst:
      truth.value === null
        ? `${item.description}; ${PRICE_UNAVAILABLE}`
        : `${truth.status}; ${truth.provider}; ${item.description}`,
    connectedEvents: [item.kind, item.source, item.feedSymbol, truth.status],
    confidence: truth.value === null ? 0 : 55,
  }
}

function marketSeriesFromAsset(asset: LiveAssetSnapshot | null | undefined): Array<{ time: string; price: number; volume: number }> {
  if (!asset || asset.tickCount <= 0) {
    return []
  }
  return asset.ticks.map((tick) => ({
    time: new Date(tick.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: tick.price,
    volume: tick.volume,
  }))
}

function unavailableMarketExplanation(market: MarketMover): MarketExplanation {
  return {
    symbol: market.ticker,
    priceMove: `${market.ticker}: ${market.price}`,
    relatedEventIds: [],
    relatedEntities: [],
    linkedMarkets: [market.ticker],
    possibleCause: market.catalyst,
    relationshipReason: 'No real source-backed event or market explanation is currently attached to this asset.',
    confidence: market.confidence,
    uncertainty: 'Atlasz does not use seeded explanations as a runtime fallback in real-only mode.',
    sourceTrail: [],
    evidenceTrail: [],
  }
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
  void events
  return [] as Signal[]
}

function canonicalSourceTrust(value: string | SourceTrust | undefined) {
  if (!value) {
    return 'unavailable'
  }
  return value === 'public unauthenticated' ? 'public-unauthenticated' : value
}

function sourceTrustIsReal(value: string | SourceTrust | undefined) {
  const trust = canonicalSourceTrust(value)
  return trust !== 'unavailable' && trust !== 'simulated'
}

function externalSocialConnectorIsEnabled() {
  // The top-level Attention Pulse has no real external social connector today.
  // Keep the surface unavailable instead of promoting local structural samples.
  return false
}

function formatFreshness(value: number | string | undefined) {
  if (!value) {
    return 'not observed'
  }
  const timestamp = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    return 'unknown'
  }
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (minutes < 1) {
    return 'just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `${hours}h ago`
  }
  return `${Math.round(hours / 24)}d ago`
}

function countSourceStatuses(snapshot: WorldIntelSnapshot) {
  const stale = snapshot.sources.filter((source) => source.status === 'offline' || source.status === 'rate-limited').length
  const failed = snapshot.sources.filter((source) => source.status === 'failed').length
  const disabled = snapshot.sources.filter((source) => source.status === 'disabled').length
  const online = snapshot.sources.filter((source) => source.status === 'online').length

  return { stale, failed, disabled, online, total: snapshot.sources.length }
}

function confidenceWeightedAlertCount(signals: Signal[]) {
  return signals.filter((signal) => signal.confidence >= 50 && signal.sourceCount > 0).length
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
  return buildAnalystAnswer({
    summary:
      `Atlasz cannot answer "${question}" from real source-backed evidence yet because the current world snapshot is empty or unavailable.`,
    relatedEvents: [],
    entities: [],
    tickers: [],
    confidence: 0,
    uncertainty: 'No seeded analyst context is substituted in real-only mode.',
    watchNext: ['Refresh public world sources', 'Check Data Core source health', 'Add a real connector for the asset or topic'],
  })
}

function App() {
  const [activeView, setActiveView] = useState<ViewId>('command')
  const [selectedTicker, setSelectedTicker] = useState('KAS')
  const [selectedEventId, setSelectedEventId] = useState(unavailableEvent.id)
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null)
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindowId>('today')
  const [selectedSocialTopicId, setSelectedSocialTopicId] = useState('aixr-ai')
  const [selectedSocialTier, setSelectedSocialTier] = useState<SocialTier | 'all'>('all')
  const [universeSymbols, setUniverseSymbols] = useLocalStorageState<string[]>('atlasz:intel:universe-symbols', [
    'KAS',
    'EUR/USD',
    'SPX',
    'XLK',
  ])
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
      text: 'Ask about a market move, event, ticker, country, commodity, or exposure chain. The Analysis Desk answers only when local evidence is available.',
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

  const {
    snapshot: worldSnapshot,
    refresh: refreshWorldIntel,
    toggleFavorite: toggleWorldFavorite,
    loading: worldIntelLoading,
  } = useWorldIntelSnapshot()
  const engineSnapshot = useEngineSnapshot()
  const liveAssetBySymbol = useMemo(
    () => new Map((engineSnapshot.frame?.assets ?? []).map((asset) => [asset.symbol, asset])),
    [engineSnapshot.frame?.assets],
  )
  const worldEvents = worldSnapshot.events
  const worldSignals = worldSnapshot.signals
  const worldBrief = worldSnapshot.dailyBrief
  const worldRawSourceItems = worldSnapshot.rawSourceItems

  const selectedMarket = useMemo(() => {
    const item = resolveAssetQuery(selectedTicker)
    return marketMoverFromLiveAsset(item, liveAssetBySymbol.get(item.symbol))
  }, [liveAssetBySymbol, selectedTicker])

  const selectedMarketExplanation = useMemo(() => unavailableMarketExplanation(selectedMarket), [selectedMarket])

  const chartData = useMemo(() => marketSeriesFromAsset(liveAssetBySymbol.get(selectedMarket.ticker)), [liveAssetBySymbol, selectedMarket.ticker])
  const tickerTapeItems = useMemo(() => {
    return universeSymbols
      .map((symbol) => {
        const item = resolveAssetQuery(symbol)
        return marketMoverFromLiveAsset(item, liveAssetBySymbol.get(item.symbol))
      })
      .slice(0, 24)
  }, [liveAssetBySymbol, universeSymbols])
  const selectedEvent = worldEvents.find((event) => event.id === selectedEventId) ?? worldEvents[0] ?? unavailableEvent
  // Resolver bridge: only when the selection maps back to a real WorldIntelEvent
  // (exact id). Derived RadarEvents don't map, so this stays undefined (no inferred exposure).
  const selectedWorldEvent = findWorldIntelEvent(selectedEventId, worldSnapshot.worldEvents)
  const selectedSignal =
    worldSignals.find((signal) => signal.linkedEventIds.includes(selectedEvent.id)) ?? worldSignals[0] ?? unavailableSignal
  const selectedGraphNode = getGraphNodeById(selectedGraphNodeId)
  const pinnedSignals = worldSignals.filter((signal) => pinnedSignalIds.includes(signal.id))
  const selectedSocialTopic =
    socialPulseTopics.find((topic) => topic.id === selectedSocialTopicId) ?? socialPulseTopics[0]
  const selectedSocialPosts = socialPulsePosts.filter((post) => post.topicId === selectedSocialTopic.id)
  const socialPressure = calculateAttentionPressure(selectedSocialTopic, selectedSocialPosts)
  const socialVelocity = calculateSocialVelocity(selectedSocialTopic)
  const sourceStatusCounts = useMemo(() => countSourceStatuses(worldSnapshot), [worldSnapshot])
  const realtimeTrust = canonicalSourceTrust(engineSnapshot.status.health?.sourceTrust)
  const worldTrust = canonicalSourceTrust(worldSnapshot.sourceTrust)
  const externalSocialConnectorEnabled = externalSocialConnectorIsEnabled()
  const hasRealtimeAttentionSource =
    externalSocialConnectorEnabled &&
    (engineSnapshot.frame?.attention.length ?? 0) > 0 && sourceTrustIsReal(engineSnapshot.status.health?.sourceTrust)
  const defensiveSummary = useMemo(() => summarizeDefensiveReferences(defensiveReferenceEntries), [])

  const filteredEvents = useMemo(() => {
    if (radarFilter === 'All') {
      return worldEvents
    }

    return worldEvents.filter((event) => event.region === radarFilter || event.category === radarFilter)
  }, [radarFilter, worldEvents])

  const radarFilters = useMemo(
    () => ['All', ...Array.from(new Set(worldEvents.flatMap((event) => [event.region, event.category])))],
    [worldEvents],
  )

  const filteredPulseEvents = useMemo(() => {
    const timeWindow = timeWindows.find((window) => window.id === selectedTimeWindow)
    const activeLayerSet = new Set(activeLayerIds)

    return worldEvents.filter((event) => {
      const isInsideTime =
        !timeWindow?.minutes || selectedTimeWindow === 'custom' || (eventAgeMinutes[event.id] ?? 0) <= timeWindow.minutes
      const matchesLayer = getEventLayers(event).some((layerId) => activeLayerSet.has(layerId))

      return isInsideTime && matchesLayer
    })
  }, [activeLayerIds, selectedTimeWindow, worldEvents])

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

  const addUniverseSymbol = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }
    const item = await addUniverseAsset(trimmed)
    setUniverseSymbols((current) => [item.symbol, ...current.filter((symbol) => symbol !== item.symbol)].slice(0, 16))
    selectTicker(item.symbol, 'terminal')
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
      if (worldSnapshot.worldEvents.length === 0) {
        return []
      }
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
    [activeGraphKinds, worldSnapshot.worldEvents.length],
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
      { id: `${Date.now()}-analyst`, role: 'analyst', text: 'Evidence-constrained response', answer },
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
    ...worldSnapshot.worldEvents.slice(0, 24).map((event): CommandAction => ({
      id: `world-event:${event.id}`,
      label: event.title,
      group: 'World Events',
      hint: `${event.region} / ${event.provenance}`,
      keywords: [event.summary, event.category, event.region, ...event.affectedAssets, ...event.narrativeTags].join(' '),
      icon: RadioTower,
      perform: () => selectEvent(event.id, 'world'),
    })),
    ...worldSnapshot.countries.slice(0, 18).map((country): CommandAction => ({
      id: `country:${country.countryCode}`,
      label: country.countryName,
      group: 'Countries',
      hint: `${country.currency} / risk ${country.riskScore}`,
      keywords: [country.countryCode, country.currency, ...country.affectedTickers, ...country.topCurrentHeadlines].join(' '),
      icon: Globe2,
      perform: () => setActiveView('world'),
    })),
    ...worldSnapshot.assetIdentities.slice(0, 28).map((asset): CommandAction => ({
      id: `asset:${asset.symbol}`,
      label: asset.symbol,
      group: 'Assets',
      hint: `${asset.type} / ${asset.exchangeOrSource}`,
      keywords: [asset.name, asset.type, asset.exchangeOrSource, ...asset.aliases, ...asset.watchlistTags].join(' '),
      icon: LineChart,
      perform: () => selectTicker(asset.symbol, 'world'),
    })),
    {
      id: 'act:create-decision',
      label: 'Save Research Note',
      group: 'Intelligence',
      hint: 'Context note',
      icon: BookOpen,
      perform: () => setActiveView('decision'),
    },
    {
      id: 'act:search-entity',
      label: 'Inspect Entity Relationships',
      group: 'Intelligence',
      hint: 'Entity graph',
      icon: Network,
      perform: () => setActiveView('graph'),
    },
    {
      id: 'act:search-market',
      label: 'Open Market / Infrastructure View',
      group: 'Intelligence',
      hint: 'Market terminal',
      icon: LineChart,
      perform: () => setActiveView('terminal'),
    },
    {
      id: 'act:inspect-sources',
      label: 'Inspect Source Trails',
      group: 'Intelligence',
      hint: 'Freshness and lineage',
      icon: Database,
      perform: () => setActiveView('sources'),
    },
    {
      id: 'act:cyber-opsec',
      label: 'Open Cyber / OPSEC Panel',
      group: 'Defensive Security',
      hint: 'Reference controls',
      icon: ShieldAlert,
      perform: () => setActiveView('cyber'),
    },
    {
      id: 'act:stale-sources',
      label: 'View Stale or Failed Sources',
      group: 'Source Control',
      hint: `${sourceStatusCounts.stale + sourceStatusCounts.failed} attention needed`,
      icon: AlertTriangle,
      perform: () => setActiveView('sources'),
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
      label: 'Reset Local Workspace',
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
        <div className="brand-lockup brand-lockup-banner">
          <img className="brand-banner" src="/atlasz-logo.png" alt="Atlasz Intel" />
          <span className="eyebrow">Local-first terminal</span>
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
          <p>Local evidence ledger, watchlists, decision notes, source status, and replay state stay on this machine.</p>
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
          <span className="module-label">Evidence Health</span>
          <div className="status-row">
            <span>Entity map</span>
            <strong>{graphNodes.length} nodes</strong>
          </div>
          <div className="status-row">
            <span>Risk events</span>
            <strong>{worldEvents.length}</strong>
          </div>
          <div className="status-row">
            <span>Source items</span>
            <strong>{worldRawSourceItems.length}</strong>
          </div>
          <div className="status-row">
            <span>Stale/failed</span>
            <strong>{sourceStatusCounts.stale + sourceStatusCounts.failed}</strong>
          </div>
          <div className="status-row">
            <span>World source</span>
            <strong>{worldTrust}</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Evidence-first local intelligence terminal</span>
            <h2>Understand what changed, why it matters, what proves it, and which entities connect.</h2>
          </div>
          <div className="topbar-actions">
            <CommandMenuButton />
            <span className="source-badge">
              <CircleDotDashed size={14} />
              No source, no signal
            </span>
            <ProvenanceBadge value={worldTrust} />
            <ProvenanceBadge value={realtimeTrust} />
            <PulseIndicator />
            <button className="ghost-button" type="button" onClick={() => setActiveView('brief')}>
              <NotebookPen size={16} />
              Daily brief
            </button>
          </div>
        </header>

        <section className="ticker-tape" aria-label="Market tape">
          {tickerTapeItems.map((item) => (
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
            {/* First impression: what matters, above raw feeds and evidence cards. */}
            <article className="wct-panel">
              <WhatChangedTodayPanel events={worldSnapshot.worldEvents} />
            </article>

            <article className="panel command-status-panel">
              <GlobalOverview
                activeLayerCount={activeLayerIds.length}
                briefItems={worldBrief}
                defensiveSummary={defensiveSummary}
                engineSnapshot={engineSnapshot}
                hasRealtimeAttentionSource={hasRealtimeAttentionSource}
                pinnedSignals={pinnedSignals}
                selectedEvent={selectedEvent}
                selectedMarket={selectedMarket}
                selectedSignal={selectedSignal}
                sourceStatusCounts={sourceStatusCounts}
                sourceItemCount={worldRawSourceItems.length}
                socialPressure={socialPressure}
                socialVelocity={socialVelocity.velocity}
                worldSnapshot={worldSnapshot}
              />
            </article>

            <article className="panel connector-dashboard-panel">
              <ConnectorDashboardPanel sources={worldSnapshot.sources} events={worldSnapshot.worldEvents} />
            </article>

            <article className="panel market-coverage-panel wide-panel">
              <MarketCoverageDashboard sources={worldSnapshot.sources} events={worldSnapshot.worldEvents} />
            </article>

            <article className="panel missing-market-data-panel wide-panel">
              <MissingMarketDataPanel />
            </article>

            <article className="panel market-quote-panel wide-panel">
              <MarketQuoteSourceTrail />
            </article>

            <article className="panel options-panel wide-panel">
              <OptionsSourceTrail />
            </article>

            <article className="panel exposure-dashboard-panel wide-panel">
              <ExposureDashboardPanel events={worldSnapshot.worldEvents} />
            </article>

            <article className="panel pulse-panel">
              <PanelHeader icon={Globe2} label="Event Matrix" title="World events, exposures, and source trails" />
              <GlobalPulseScene
                activeLayerIds={activeLayerIds}
                events={filteredPulseEvents}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                onSelectTicker={(ticker) => selectTicker(ticker, 'command')}
                selectedEventId={selectedEvent.id}
                signals={worldSignals}
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
              {selectedWorldEvent && <EventResolutionPanel event={selectedWorldEvent} />}
            </article>

            <article className="panel">
              <PanelHeader icon={LineChart} label="Markets" title="Watchlist coverage" />
              <MarketMoverList
                movers={tickerTapeItems}
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

            <article className="panel wide-panel">
              <PanelHeader icon={NotebookPen} label="Research Journal" title="Research notes + follow-through" />
              <Suspense fallback={<PanelSkeleton rows={2} label="Loading research journal" />}>
                <ResearchNotePanel defaultSymbol={selectedTicker} />
              </Suspense>
            </article>

            <article className="panel">
              <PanelHeader icon={ShieldAlert} label="Local Risk Reference" title="Risk appears only when source-backed" />
              <div className="panel-source-row">
                <ProvenanceBadge value="local-derived" />
                <span>Reference map; not a live verified alert feed.</span>
              </div>
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
                {worldSignals.length === 0 && <div className="empty-state">No source-backed signals are active.</div>}
                {worldSignals.map((signal) => (
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
              <WorldIntelStatusStrip
                loading={worldIntelLoading}
                onRefresh={refreshWorldIntel}
                snapshot={worldSnapshot}
              />
              <EventFeed
                compact
                events={worldEvents.slice(0, 3)}
                onSelectEvent={(eventId) => selectEvent(eventId)}
                selectedEventId={selectedEvent.id}
                signals={worldSignals}
              />
            </article>

            <article className="panel wide-panel social-preview-panel">
              <PanelHeader icon={Activity} label="Attention Pulse" title="Social pressure requires a real source" />
              <SocialPulseModule
                compact
                onSelectTier={setSelectedSocialTier}
                onSelectTicker={(ticker) => selectTicker(ticker, 'command')}
                onSelectTopic={setSelectedSocialTopicId}
                selectedTier={selectedSocialTier}
                selectedTopicId={selectedSocialTopic.id}
                sourceAvailable={hasRealtimeAttentionSource}
                velocity={socialVelocity}
              />
            </article>

            <article className="panel">
              <PanelHeader icon={ShieldAlert} label="Cyber / OPSEC" title="Defensive intelligence control plane" />
              <CyberOpsecPreview defensiveSummary={defensiveSummary} onOpen={() => setActiveView('cyber')} />
            </article>

            <article className="panel">
              <PanelHeader icon={Database} label="Ingestion" title="Evidence pipeline" />
              <IngestionPipeline />
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={Layers3} label="Layers" title="Evidence layer matrix" />
              <EvidenceLayerMap
                events={filteredPulseEvents}
                signals={worldSignals}
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

        {activeView === 'world' && (
          <Suspense fallback={<div className="world-panel world-map-panel"><GlobeSkeleton /></div>}>
            <WorldIntelligenceView
              loading={worldIntelLoading}
              onRefresh={refreshWorldIntel}
              onSelectEvent={(eventId) => selectEvent(eventId)}
              onSelectTicker={(ticker) => selectTicker(ticker, 'terminal')}
              onToggleFavorite={toggleWorldFavorite}
              snapshot={worldSnapshot}
            />
          </Suspense>
        )}

        {activeView === 'terminal' && (
          <section className="dashboard-grid terminal-grid">
            <article className="panel terminal-chart-panel">
              <PanelHeader icon={LineChart} label="Market / Infrastructure" title={`${selectedMarket.ticker} source-backed movement context`} />
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
                {chartData.length > 0 ? (
                  <Suspense fallback={<ChartSkeleton />}>
                    <MarketPriceChart data={chartData} />
                  </Suspense>
                ) : (
                  <div className="empty-state">{CANDLE_HISTORY_UNAVAILABLE}</div>
                )}
              </div>
            </article>

            <article className="panel">
              <PanelHeader icon={Crosshair} label="Evidence" title="No trading advice, only source context" />
              <MarketExplanationPanel explanation={selectedMarketExplanation} />
            </article>

            <article className="panel">
              <PanelHeader icon={Layers3} label="Watchlist" title="Tracked markets" />
              <UniverseSearchPanel
                symbols={universeSymbols}
                onAdd={addUniverseSymbol}
                onSelect={(ticker) => selectTicker(ticker, 'terminal')}
              />
              <MarketMoverList
                movers={tickerTapeItems}
                onSelect={(ticker) => selectTicker(ticker, 'terminal')}
                selectedTicker={selectedTicker}
              />
            </article>

            <article className="panel wide-panel">
              <PanelHeader icon={Activity} label="Participation" title="Volume is unavailable unless real ticks exist" />
              <div className="bar-frame">
                {chartData.length > 0 ? (
                  <Suspense fallback={<ChartSkeleton />}>
                    <MarketVolumeChart data={chartData} />
                  </Suspense>
                ) : (
                  <div className="empty-state">{CANDLE_HISTORY_UNAVAILABLE}</div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === 'quant' && (
          <Suspense fallback={<div className="panel"><ChartSkeleton /></div>}>
            <QuantTerminalView />
          </Suspense>
        )}

        {activeView === 'sources' && (
          <Suspense fallback={<div className="panel"><PanelSkeleton rows={4} label="Loading source health" /></div>}>
            <SourceHealthView
              sources={worldSnapshot.sources}
              worldStatus={worldSnapshot.status}
              onRefresh={refreshWorldIntel}
            />
          </Suspense>
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
                signals={worldSignals}
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
              <WorldIntelStatusStrip
                loading={worldIntelLoading}
                onRefresh={refreshWorldIntel}
                snapshot={worldSnapshot}
              />
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
                signals={worldSignals}
              />
            </article>
          </section>
        )}

        {activeView === 'social' && (
          <section className="dashboard-grid social-grid">
            <article className="panel social-main-panel">
              <PanelHeader icon={Activity} label="Attention Pulse" title="Social pressure requires source-backed attention data" />
              <SocialPulseModule
                onSelectTier={setSelectedSocialTier}
                onSelectTicker={(ticker) => selectTicker(ticker, 'social')}
                onSelectTopic={setSelectedSocialTopicId}
                selectedTier={selectedSocialTier}
                selectedTopicId={selectedSocialTopic.id}
                sourceAvailable={hasRealtimeAttentionSource}
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
            {/* Evidence graph: clickable entity nodes with proving events, separate
                from the risk-BFS RelationshipGraph below. */}
            <article className="panel wide-panel evidence-graph-panel">
              <PanelHeader icon={Fingerprint} label="Evidence Graph" title="Entities proven by connector evidence" />
              <EntityEvidenceGraphPanel events={worldSnapshot.worldEvents} />
            </article>

            <article className="panel graph-panel">
              <PanelHeader icon={Network} label="Intelligence Graph" title="Entities, dependencies, provenance, and exposed paths" />
              <div className="graph-frame">
                <Suspense fallback={<GraphSkeleton />}>
                  <RelationshipGraph
                    nodes={flowNodes}
                    edges={flowEdges}
                    onNodeClick={(nodeId) => {
                      setSelectedGraphNodeId(nodeId)
                      if (worldEvents.some((event) => event.id === nodeId)) {
                        setSelectedEventId(nodeId)
                      }
                    }}
                  />
                </Suspense>
              </div>
            </article>
            <article className="panel">
              <PanelHeader icon={Fingerprint} label="Entity Profile" title="Node metadata, evidence, and downstream exposure" />
              <EntityTypeFilters
                activeGraphKinds={activeGraphKinds}
                graphKinds={graphKindOptions}
                onToggleGraphKind={toggleGraphKind}
              />
              <GraphInspector graphNode={selectedGraphNode} worldSnapshot={worldSnapshot} />
              <div className="signal-stack">
                {worldSignals.slice(0, 3).map((signal) => (
                  <SignalCard key={signal.id} signal={signal} compact />
                ))}
              </div>
            </article>
          </section>
        )}

        {activeView === 'cyber' && (
          <section className="dashboard-grid cyber-grid">
            <article className="panel wide-panel">
              <PanelHeader icon={ShieldAlert} label="Cyber / OPSEC" title="Defensive intelligence, source trust, and gated capabilities" />
              <CyberOpsecPanel defensiveSummary={defensiveSummary} sourceStatusCounts={sourceStatusCounts} />
            </article>
            <article className="panel">
              <PanelHeader icon={GitBranch} label="Detection References" title="Rules are references until telemetry exists" />
              <DefensiveReferenceList entries={defensiveEntriesByRiskTag('detection-rule').slice(0, 6)} />
            </article>
            <article className="panel">
              <PanelHeader icon={Database} label="Supply Chain" title="SBOM and provenance controls" />
              <DefensiveReferenceList entries={defensiveEntriesByRiskTag('supply-chain').slice(0, 6)} />
            </article>
          </section>
        )}

        {activeView === 'analyst' && (
          <section className="dashboard-grid analyst-grid">
            <article className="panel analyst-panel">
              <PanelHeader icon={BrainCircuit} label="Analysis Desk" title="Evidence-constrained local reasoning surface" />
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
                    <span>{message.role === 'user' ? 'You' : 'Atlasz Analysis Desk'}</span>
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
                  aria-label="Ask the Atlasz analysis desk"
                  placeholder="Ask only against available evidence: source, entity, ticker, event, or dependency..."
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <button type="submit">Inspect</button>
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
              <WorldIntelStatusStrip
                loading={worldIntelLoading}
                onRefresh={refreshWorldIntel}
                snapshot={worldSnapshot}
              />
              <div className="daily-brief">
                {worldBrief.length === 0 && (
                  <div className="empty-state">Daily brief unavailable until a real public world-event batch is ingested.</div>
                )}
                {worldBrief.map((item) => (
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
                {worldSignals.map((signal) => (
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
              <PanelHeader icon={BookOpen} label="Research Notes" title="Observation, evidence, follow-up, and outcome context" />
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

function GlobalOverview({
  activeLayerCount,
  briefItems,
  defensiveSummary,
  engineSnapshot,
  hasRealtimeAttentionSource,
  pinnedSignals,
  selectedEvent,
  selectedMarket,
  selectedSignal,
  sourceStatusCounts,
  sourceItemCount,
  socialPressure,
  socialVelocity,
  worldSnapshot,
}: {
  activeLayerCount: number
  briefItems: BriefItem[]
  defensiveSummary: ReturnType<typeof summarizeDefensiveReferences>
  engineSnapshot: ReturnType<typeof useEngineSnapshot>
  hasRealtimeAttentionSource: boolean
  pinnedSignals: Signal[]
  selectedEvent: RadarEvent
  selectedMarket: MarketMover
  selectedSignal: Signal
  sourceStatusCounts: ReturnType<typeof countSourceStatuses>
  sourceItemCount: number
  socialPressure: number
  socialVelocity: number
  worldSnapshot: WorldIntelSnapshot
}) {
  const dominantTheme = briefItems[0] ?? unavailableBriefItem
  const confidenceAlerts = confidenceWeightedAlertCount(worldSnapshot.signals)
  const latestEvent = worldSnapshot.events[0]
  const lastFrame = engineSnapshot.status.health?.lastFrameTimestamp ?? engineSnapshot.frame?.emittedAt
  const sourceDebt = sourceStatusCounts.stale + sourceStatusCounts.failed + sourceStatusCounts.disabled
  const verifiedEventCount = worldSnapshot.sourceTrust === 'verified' ? worldSnapshot.events.length : 0

  return (
    <div className="global-overview">
      <div className="overview-lead">
        <div>
          <span>Global overview</span>
          <strong>{dominantTheme.headline}</strong>
          <p>{dominantTheme.whyItMatters}</p>
        </div>
        <div className="overview-trust-stack">
          <ProvenanceBadge value={worldSnapshot.sourceTrust} />
          <ProvenanceBadge value={engineSnapshot.status.health?.sourceTrust ?? 'unavailable'} />
          <span>{formatFreshness(worldSnapshot.updatedAt)} world freshness</span>
        </div>
      </div>
      <div className="status-kicker">
        <span>Verified events</span>
        <strong>{verifiedEventCount > 0 ? `${verifiedEventCount} verified` : 'DATA_UNAVAILABLE'}</strong>
        <em>
          {verifiedEventCount > 0
            ? 'Verified provenance is present in this snapshot.'
            : 'Public or local-derived data is not displayed as verified.'}
        </em>
      </div>
      <div className="status-tile">
        <span>Latest source-backed event</span>
        <strong>{latestEvent ? severityLabels[latestEvent.severity] : 'Unavailable'}</strong>
        <em>{latestEvent ? `${latestEvent.region} · ${latestEvent.sourceCount} sources` : 'No event batch ingested'}</em>
      </div>
      <div className="status-tile">
        <span>Confidence-weighted alerts</span>
        <strong>{confidenceAlerts}</strong>
        <em>{confidenceAlerts > 0 ? `${pinnedSignals.length} pinned for follow-up` : 'No sourced alerts active'}</em>
      </div>
      <div className="status-tile">
        <span>Watchlist movement</span>
        <strong>{selectedMarket.ticker}</strong>
        <em>{selectedMarket.catalyst}</em>
      </div>
      <div className="status-tile">
        <span>Entity graph</span>
        <strong>{graphNodes.length} nodes / {graphEdges.length} edges</strong>
        <em>{selectedSignal.relationshipStrength}% selected relationship strength</em>
      </div>
      <div className="status-tile">
        <span>Realtime core</span>
        <strong>{engineSnapshot.status.mode.toUpperCase()}</strong>
        <em>{formatFreshness(lastFrame)} last frame · {engineSnapshot.frame?.assets.length ?? 0} assets</em>
      </div>
      <div className="status-tile">
        <span>Attention pulse</span>
        <strong>{hasRealtimeAttentionSource ? `${socialPressure}/100` : 'DATA_UNAVAILABLE'}</strong>
        <em>
          {hasRealtimeAttentionSource
            ? `dV/dt ${socialVelocity.toFixed(2)} mentions/min`
            : 'No real social source connected'}
        </em>
      </div>
      <div className="status-tile">
        <span>Cyber / OPSEC corpus</span>
        <strong>{defensiveSummary.entryCount} references</strong>
        <em>{defensiveSummary.byPolicy.blocked ?? 0} blocked · {defensiveSummary.byPolicy['auth-required'] ?? 0} auth-gated</em>
      </div>
      <div className="status-tile">
        <span>Stale/offline sources</span>
        <strong>{sourceDebt}</strong>
        <em>{sourceStatusCounts.online}/{sourceStatusCounts.total} online · {sourceItemCount} raw source items</em>
      </div>
      <div className="status-tile">
        <span>Selected risk object</span>
        <strong>{severityLabels[selectedEvent.severity]}</strong>
        <em>{selectedEvent.title}</em>
      </div>
      <div className="status-tile">
        <span>Active controls</span>
        <strong>{activeLayerCount} layers</strong>
        <em>{selectedSignal.chain}</em>
      </div>
    </div>
  )
}

function WorldIntelStatusStrip({
  loading,
  onRefresh,
  snapshot,
}: {
  loading: boolean
  onRefresh: () => Promise<void>
  snapshot: WorldIntelSnapshot
}) {
  const updatedAt = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'not refreshed'
  const statusTone =
    snapshot.status === 'ready'
      ? 'ready'
      : snapshot.status === 'stale'
        ? 'stale'
        : snapshot.status === 'failed'
          ? 'failed'
          : 'disabled'

  return (
    <div className={`world-intel-strip world-intel-${statusTone}`}>
      <div>
        <span>World source</span>
        <strong>{snapshot.connectorLabel}</strong>
      </div>
      <div>
        <span>Trust</span>
        <strong>
          <ProvenanceBadge value={snapshot.sourceTrust} size="sm" />
        </strong>
      </div>
      <div>
        <span>Status</span>
        <strong>{snapshot.status}</strong>
      </div>
      <div>
        <span>Headlines</span>
        <strong>{snapshot.headlines.length}</strong>
      </div>
      <div>
        <span>Updated</span>
        <strong>{updatedAt}</strong>
      </div>
      <button type="button" onClick={() => void onRefresh()} disabled={loading}>
        {loading ? 'Refreshing' : 'Refresh'}
      </button>
      {snapshot.lastError && <p>{snapshot.lastError}</p>}
      <p className="world-intel-lineage">
        Source chain: {snapshot.connectorLabel} {'>'} {snapshot.headlines.length} headlines {'>'}{' '}
        {snapshot.events.length} normalized events {'>'} {snapshot.signals.length} signals
      </p>
    </div>
  )
}

function GlobalPulseScene({
  activeLayerIds,
  events,
  onSelectEvent,
  onSelectTicker,
  selectedEventId,
  signals,
}: {
  activeLayerIds: LayerId[]
  events: RadarEvent[]
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
  selectedEventId: string
  signals: Signal[]
}) {
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? unavailableEvent
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
        {events.length === 0 && (
          <div className="empty-state">World radar unavailable. Refresh public sources to populate the globe.</div>
        )}
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
              <code>{selectedVisual?.chain ?? getSignalForEvent(selectedEvent.id, signals)?.chain}</code>
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
  sourceAvailable,
  velocity,
}: {
  compact?: boolean
  onSelectTier: (tier: SocialTier | 'all') => void
  onSelectTicker: (ticker: string) => void
  onSelectTopic: (topicId: string) => void
  selectedTier: SocialTier | 'all'
  selectedTopicId: string
  sourceAvailable: boolean
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

  if (!sourceAvailable) {
    return (
      <div className={compact ? 'social-pulse-module compact-social' : 'social-pulse-module'}>
        <div className="source-unavailable-panel">
          <ProvenanceBadge value="unavailable" />
          <h3>Attention data unavailable</h3>
          <p>
            No real source-backed social or attention connector is active. Atlasz is not rendering local samples,
            unverified sentiment, or synthetic narrative velocity as intelligence.
          </p>
          <div className="social-tier-board">
            {socialTierDefinitions.map((tier) => (
              <article className={`tier-summary tier-${tier.id}`} key={tier.id}>
                <header>
                  <strong>{tier.label}</strong>
                  <span>0</span>
                </header>
                <p>{tier.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
          <Suspense fallback={<ChartSkeleton />}>
            <SocialVelocityChart data={velocityChartData} />
          </Suspense>
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

function CyberOpsecPreview({
  defensiveSummary,
  onOpen,
}: {
  defensiveSummary: ReturnType<typeof summarizeDefensiveReferences>
  onOpen: () => void
}) {
  return (
    <div className="cyber-preview">
      <div className="panel-source-row">
        <ProvenanceBadge value="local-derived" />
        <span>Defensive reference corpus only. No scanning or person enrichment runs by default.</span>
      </div>
      <div className="cyber-mini-grid">
        <div>
          <span>References</span>
          <strong>{defensiveSummary.entryCount}</strong>
        </div>
        <div>
          <span>Default-safe</span>
          <strong>{defensiveSummary.defaultSafeCount}</strong>
        </div>
        <div>
          <span>Auth-gated</span>
          <strong>{defensiveSummary.byPolicy['auth-required'] ?? 0}</strong>
        </div>
        <div>
          <span>Blocked</span>
          <strong>{defensiveSummary.byPolicy.blocked ?? 0}</strong>
        </div>
      </div>
      <button className="inspect-button" type="button" onClick={onOpen}>
        Open defensive panel
      </button>
    </div>
  )
}

function CyberOpsecPanel({
  defensiveSummary,
  sourceStatusCounts,
}: {
  defensiveSummary: ReturnType<typeof summarizeDefensiveReferences>
  sourceStatusCounts: ReturnType<typeof countSourceStatuses>
}) {
  const policyRows = Object.entries(defensiveSummary.byPolicy).sort(([left], [right]) => left.localeCompare(right))
  const domainRows = Object.entries(defensiveSummary.byDomain)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
  const gated = defensiveReferenceEntries.filter((entry) => !defensiveReferenceIsDefaultSafe(entry)).slice(0, 8)

  return (
    <div className="cyber-panel">
      <div className="cyber-doctrine">
        <div>
          <span>Defensive boundary</span>
          <h3>Lawful, source-aware security intelligence only.</h3>
          <p>
            CVEs, CTI platforms, Sigma/YARA-style rules, endpoint agents, internet mapping, malware analysis, and
            cloud posture tooling are modeled as gated capabilities unless Atlasz has an explicit authorized connector.
          </p>
        </div>
        <div className="cyber-source-stack">
          <ProvenanceBadge value="local-derived" />
          <ProvenanceBadge value="auth-gated" />
          <ProvenanceBadge value="unavailable" />
        </div>
      </div>

      <div className="cyber-state-grid">
        <div>
          <span>Live CVE feed</span>
          <strong>DATA_UNAVAILABLE</strong>
          <em>No NVD/CVE connector is active.</em>
        </div>
        <div>
          <span>Threat intel feeds</span>
          <strong>AUTH-GATED</strong>
          <em>OpenCTI/MISP style feeds require configured credentials and TLP rules.</em>
        </div>
        <div>
          <span>Infrastructure exposure</span>
          <strong>MANUAL REVIEW</strong>
          <em>Active scanning is never a default Atlasz runtime behavior.</em>
        </div>
        <div>
          <span>Source debt</span>
          <strong>{sourceStatusCounts.stale + sourceStatusCounts.failed}</strong>
          <em>Stale or failed sources must remain visible.</em>
        </div>
      </div>

      <div className="cyber-columns">
        <section>
          <h3>Policy posture</h3>
          <div className="cyber-policy-list">
            {policyRows.map(([policy, count]) => (
              <div key={policy}>
                <span>{policy}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Highest-density domains</h3>
          <div className="cyber-policy-list">
            {domainRows.map(([domain, count]) => (
              <div key={domain}>
                <span>{domain}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="cyber-gated-list">
        <h3>Gated or blocked capabilities</h3>
        {gated.map((entry) => (
          <article key={entry.id}>
            <header>
              <strong>{entry.label}</strong>
              <span>{entry.runtimePolicy}</span>
            </header>
            <p>{entry.engineeringLesson}</p>
            <footer>
              {entry.riskTags.slice(0, 4).map((tag) => (
                <em key={tag}>{tag}</em>
              ))}
            </footer>
          </article>
        ))}
      </section>
    </div>
  )
}

function DefensiveReferenceList({ entries }: { entries: DefensiveReferenceEntry[] }) {
  if (entries.length === 0) {
    return <div className="empty-state">No defensive references are loaded for this category.</div>
  }

  return (
    <div className="defensive-reference-list">
      <div className="panel-source-row">
        <ProvenanceBadge value="local-derived" />
        <span>Reference material, not active alerts.</span>
      </div>
      {entries.map((entry) => (
        <article key={entry.id}>
          <header>
            <CheckCircle2 size={14} />
            <strong>{entry.label}</strong>
            <span>{entry.runtimePolicy}</span>
          </header>
          <p>{entry.engineeringLesson}</p>
          <footer>
            {entry.capabilities.slice(0, 3).map((capability) => (
              <em key={capability}>{capability}</em>
            ))}
          </footer>
        </article>
      ))}
    </div>
  )
}

function GraphInspector({
  graphNode,
  worldSnapshot,
}: {
  graphNode: GraphNodeSeed | null
  worldSnapshot: WorldIntelSnapshot
}) {
  if (!graphNode) {
    return (
      <div className="graph-inspector empty-state">
        <span>Selected entity</span>
        <p>Select a node to inspect type, source coverage, confidence, relationship strength, and adjacent exposure.</p>
      </div>
    )
  }

  const directEdges = graphEdges.filter((edge) => edge.source === graphNode.id || edge.target === graphNode.id)
  const adjacentNodeIds = directEdges.map((edge) => (edge.source === graphNode.id ? edge.target : edge.source))
  const adjacentNodes = graphNodes.filter((node) => adjacentNodeIds.includes(node.id))
  const relatedEvents = worldSnapshot.events.filter((event) =>
    [event.id, ...event.detectedEntities.map((entity) => entity.toLowerCase())].some((value) =>
      value.includes(graphNode.id.toLowerCase()) || graphNode.label.toLowerCase().includes(value),
    ),
  )
  const chain = riskChainFor(graphNode.id)
  const matchingEvent = worldSnapshot.events.find((event) => event.id === graphNode.id)
  const sourceCount = matchingEvent?.sourceCount ?? relatedEvents.reduce((total, event) => total + event.sourceCount, 0)
  const confidence = matchingEvent?.confidence ?? (relatedEvents.length > 0 ? Math.round(relatedEvents.reduce((total, event) => total + event.confidence, 0) / relatedEvents.length) : 0)
  const lastUpdated = matchingEvent?.sourceTrail[0]?.observedAt ?? worldSnapshot.updatedAt

  return (
    <div className="graph-inspector">
      <div className="entity-profile-head">
        <div>
          <span>Selected entity</span>
          <strong>{graphNode.label}</strong>
          <em>{graphNode.kind}</em>
        </div>
        <ProvenanceBadge value={sourceCount > 0 ? worldSnapshot.sourceTrust : 'local-derived'} />
      </div>
      <div className="entity-profile-grid">
        <div>
          <span>Type</span>
          <strong>{graphNode.kind}</strong>
        </div>
        <div>
          <span>Sources</span>
          <strong>{sourceCount}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{confidence}%</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{formatFreshness(lastUpdated)}</strong>
        </div>
      </div>
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
      {sourceCount === 0 && (
        <div className="source-unavailable-panel compact-source-unavailable">
          <ProvenanceBadge value="local-derived" />
          <p>This node is part of the local reference graph. It has no live source trail attached in the current snapshot.</p>
        </div>
      )}
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

function UniverseSearchPanel({
  symbols,
  onAdd,
  onSelect,
}: {
  symbols: string[]
  onAdd: (query: string) => Promise<void>
  onSelect: (symbol: string) => void
}) {
  const [query, setQuery] = useState('')
  const preview = query.trim() ? resolveAssetQuery(query) : null
  const resolvedItems = symbols.map((symbol) => resolveAssetQuery(symbol))

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onAdd(query)
    setQuery('')
  }

  return (
    <div className="universe-panel">
      <form className="universe-search" onSubmit={submit}>
        <Search size={15} />
        <input
          aria-label="Add asset to Atlasz universe"
          placeholder="Type KAS, EUR/USD, SPX, XLK, NVDA..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {preview && (
        <div className="universe-preview">
          <span>{preview.kind}</span>
          <strong>{preview.symbol}</strong>
          <em>
            {preview.source === 'coingecko' || preview.source === 'coincap' || preview.source === 'coinbase' || preview.source === 'binance' || preview.source === 'yahoo'
              ? 'public unauthenticated capable'
              : preview.source === 'alpaca'
                ? 'auth-gated'
                : 'DATA_UNAVAILABLE until a real provider is configured'}
          </em>
        </div>
      )}
      <div className="universe-chip-row">
        {resolvedItems.map((item) => (
          <button key={item.symbol} type="button" onClick={() => onSelect(item.symbol)}>
            <strong>{item.symbol}</strong>
            <span>{item.kind}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function EventFeed({
  events,
  compact = false,
  onSelectEvent,
  selectedEventId,
  signals = [],
}: {
  events: RadarEvent[]
  compact?: boolean
  onSelectEvent?: (eventId: string) => void
  selectedEventId?: string
  signals?: Signal[]
}) {
  return (
    <div className={compact ? 'event-feed compact-feed' : 'event-feed'}>
      {events.length === 0 && <div className="empty-state">No real source-backed events in this view.</div>}
      {events.map((event) => {
        const signal = getSignalForEvent(event.id, signals)

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
  const relatedEvents: RadarEvent[] = []
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
  signals,
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
  signals: Signal[]
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
        {signals.map((signal) => (
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
          const signal = getSignalForEvent(event.id, signals)
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
