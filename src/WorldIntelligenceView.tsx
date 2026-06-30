import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Database,
  Factory,
  Globe2,
  Landmark,
  Layers3,
  Link2,
  MapPinned,
  Network,
  RadioTower,
  Route,
  Search,
  Server,
  ShieldCheck,
  Signal,
  Zap,
} from 'lucide-react'
import {
  PanelSkeleton,
  QuantStripSkeleton,
} from './components/ui/Skeletons'
import { FreshnessBadge } from './components/ui/FreshnessBadge'
import { ProvenanceBadge } from './components/ui/ProvenanceBadge'
import { WorldwatchProfilePanel } from './components/intel/WorldwatchProfilePanel'
import {
  relevantEventsForProfile,
  type WatchedEntity,
  type WorldwatchProfile,
} from './engine/worldwatchProfiles'
import {
  DEFAULT_WORLDWATCH_LAYER_IDS,
  WorldwatchLayerRegistry,
  type WorldwatchEntity,
  type WorldwatchLayerId,
  type WorldwatchLayerSnapshot,
} from './engine/worldwatchLayerRegistry'
import type { OsintSourceSnapshot, UserFavorite, WorldIntelEvent, WorldIntelSnapshot } from './worldIntel'
import './WorldIntelligenceView.css'
import type { GlobeArc, GlobePoint } from './components/world/ProofGlobe'

// Lazy child surfaces — kept out of the startup bundle and isolated so future
// heavy globe / quant libraries load only when this view is open.
// ProofGlobe pulls in three.js/globe.gl; it must stay behind this lazy boundary.
const ProofGlobe = lazy(() =>
  import('./components/world/ProofGlobe').then((m) => ({ default: m.ProofGlobe })),
)
const WorldEventTimeline = lazy(() =>
  import('./components/world/WorldEventTimeline.lazy').then((m) => ({ default: m.WorldEventTimeline })),
)
const WorldEntityDetailPanel = lazy(() =>
  import('./components/world/WorldEntityDetailPanel.lazy').then((m) => ({ default: m.WorldEntityDetailPanel })),
)
const WorldQuantStrip = lazy(() =>
  import('./components/world/WorldQuantStrip.lazy').then((m) => ({ default: m.WorldQuantStrip })),
)
const WorldTradeMarketOverview = lazy(() =>
  import('./components/world/WorldTradeMarketOverview.lazy').then((m) => ({ default: m.WorldTradeMarketOverview })),
)
const HistoricalPlaybookPanel = lazy(() =>
  import('./components/intel/HistoricalPlaybookPanel').then((m) => ({ default: m.HistoricalPlaybookPanel })),
)
const WeatherAlertSourceTrail = lazy(() =>
  import('./components/intel/WeatherAlertSourceTrail').then((m) => ({ default: m.WeatherAlertSourceTrail })),
)
const RegulatorySourceTrail = lazy(() =>
  import('./components/intel/RegulatorySourceTrail').then((m) => ({ default: m.RegulatorySourceTrail })),
)
const OfacSourceTrail = lazy(() =>
  import('./components/intel/OfacSourceTrail').then((m) => ({ default: m.OfacSourceTrail })),
)
const CongressSourceTrail = lazy(() =>
  import('./components/intel/CongressSourceTrail').then((m) => ({ default: m.CongressSourceTrail })),
)
const GdeltSourceTrail = lazy(() =>
  import('./components/intel/GdeltSourceTrail').then((m) => ({ default: m.GdeltSourceTrail })),
)
const CveSourceTrailPanel = lazy(() =>
  import('./components/intel/CveSourceTrailPanel').then((m) => ({ default: m.CveSourceTrailPanel })),
)
const ComtradeSourceTrail = lazy(() =>
  import('./components/intel/ComtradeSourceTrail').then((m) => ({ default: m.ComtradeSourceTrail })),
)
const OpenAlexSourceTrail = lazy(() =>
  import('./components/intel/OpenAlexSourceTrail').then((m) => ({ default: m.OpenAlexSourceTrail })),
)
const CrossrefSourceTrail = lazy(() =>
  import('./components/intel/CrossrefSourceTrail').then((m) => ({ default: m.CrossrefSourceTrail })),
)
const CompanyFactsSourceTrail = lazy(() =>
  import('./components/intel/CompanyFactsSourceTrail').then((m) => ({ default: m.CompanyFactsSourceTrail })),
)
const Form4SourceTrail = lazy(() =>
  import('./components/intel/Form4SourceTrail').then((m) => ({ default: m.Form4SourceTrail })),
)
const Form13FSourceTrail = lazy(() =>
  import('./components/intel/Form13FSourceTrail').then((m) => ({ default: m.Form13FSourceTrail })),
)
const EtfHoldingsSourceTrail = lazy(() =>
  import('./components/intel/EtfHoldingsSourceTrail').then((m) => ({ default: m.EtfHoldingsSourceTrail })),
)
const EiaFacilitySourceTrail = lazy(() =>
  import('./components/intel/EiaFacilitySourceTrail').then((m) => ({ default: m.EiaFacilitySourceTrail })),
)
const WhatToWatchPanel = lazy(() =>
  import('./components/intel/WhatToWatchPanel').then((m) => ({ default: m.WhatToWatchPanel })),
)
const EiaRefinerySourceTrail = lazy(() =>
  import('./components/intel/EiaRefinerySourceTrail').then((m) => ({ default: m.EiaRefinerySourceTrail })),
)
const LngTerminalSourceTrail = lazy(() =>
  import('./components/intel/LngTerminalSourceTrail').then((m) => ({ default: m.LngTerminalSourceTrail })),
)
const NuclearPlantSourceTrail = lazy(() =>
  import('./components/intel/NuclearPlantSourceTrail').then((m) => ({ default: m.NuclearPlantSourceTrail })),
)
const NrcReactorStatusSourceTrail = lazy(() =>
  import('./components/intel/NrcReactorStatusSourceTrail').then((m) => ({ default: m.NrcReactorStatusSourceTrail })),
)
const GridRegionSourceTrail = lazy(() =>
  import('./components/intel/GridRegionSourceTrail').then((m) => ({ default: m.GridRegionSourceTrail })),
)
const PortLocodeSourceTrail = lazy(() =>
  import('./components/intel/PortLocodeSourceTrail').then((m) => ({ default: m.PortLocodeSourceTrail })),
)
const WorldPortIndexSourceTrail = lazy(() =>
  import('./components/intel/WorldPortIndexSourceTrail').then((m) => ({ default: m.WorldPortIndexSourceTrail })),
)
const MineralSiteSourceTrail = lazy(() =>
  import('./components/intel/MineralSiteSourceTrail').then((m) => ({ default: m.MineralSiteSourceTrail })),
)
const MarketIdentitySourceTrail = lazy(() =>
  import('./components/intel/MarketIdentitySourceTrail').then((m) => ({ default: m.MarketIdentitySourceTrail })),
)

type WorldWindowId = 'now' | '1h' | '6h' | '24h' | '7d'
type WorldDeskMode = 'overview' | 'proof' | 'markets' | 'infrastructure'
type WorldwatchLayerGroupId =
  | 'events'
  | 'markets'
  | 'cyber'
  | 'infrastructure'
  | 'energy'
  | 'supply-chain'
  | 'research'
  | 'government'
  | 'sources'

type WorldwatchLayerGroup = {
  id: WorldwatchLayerGroupId
  label: string
  description: string
  icon: typeof ShieldCheck
  layerIds: WorldwatchLayerId[]
  sourceLayer?: boolean
}

type WorldwatchLayerGroupSummary = WorldwatchLayerGroup & {
  active: boolean
  entityCount: number
  onlineCount: number
  sourceCount: number
  staleCount: number
  status: string
  freshnessHeat: 'fresh' | 'mixed' | 'stale' | 'empty'
}

const worldWindows: Array<{ id: WorldWindowId; label: string; durationMs: number }> = [
  { id: 'now', label: 'Now', durationMs: 30 * 60_000 },
  { id: '1h', label: '1H', durationMs: 60 * 60_000 },
  { id: '6h', label: '6H', durationMs: 6 * 60 * 60_000 },
  { id: '24h', label: '24H', durationMs: 24 * 60 * 60_000 },
  { id: '7d', label: '7D', durationMs: 7 * 24 * 60 * 60_000 },
]

const worldDeskModes: Array<{ id: WorldDeskMode; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Trade, what to watch, and precedents' },
  { id: 'proof', label: 'Proof', description: 'Source trails, media boundary, policy, CVE' },
  { id: 'markets', label: 'Markets', description: 'SEC facts, Form 4, 13F, ETF exposure' },
  { id: 'infrastructure', label: 'Infrastructure', description: 'Facilities, ports, grid, minerals' },
]

const worldwatchLayerGroups: WorldwatchLayerGroup[] = [
  {
    id: 'events',
    label: 'Events',
    description: 'Live event overlays, hazards, policy changes, and media observations with trust boundaries.',
    icon: RadioTower,
    layerIds: ['weather-alerts', 'earthquakes', 'policy', 'sanctions', 'media-observations'],
  },
  {
    id: 'markets',
    label: 'Markets',
    description: 'SEC, market identity, and issuer-published holding evidence as context only.',
    icon: Activity,
    layerIds: ['market-evidence', 'etf-holdings'],
  },
  {
    id: 'cyber',
    label: 'Cyber',
    description: 'CVE, KEV, GHSA, OSV, and advisory metadata for defensive awareness.',
    icon: ShieldCheck,
    layerIds: ['vulnerabilities'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Facilities, ports, grids, refineries, terminals, and minerals from public records.',
    icon: Factory,
    layerIds: ['infrastructure', 'power-plants', 'refineries', 'lng-terminals', 'nuclear-plants', 'reactor-status', 'grid-regions', 'ports-locode', 'ports-world-index', 'minerals'],
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Power, refinery, LNG, nuclear, and grid context from source-backed records.',
    icon: Zap,
    layerIds: ['power-plants', 'refineries', 'lng-terminals', 'nuclear-plants', 'reactor-status', 'grid-regions'],
  },
  {
    id: 'supply-chain',
    label: 'Supply Chain',
    description: 'Ports, commodity flow records, and mineral-site context without company exposure invention.',
    icon: Route,
    layerIds: ['trade-flows', 'ports-locode', 'ports-world-index', 'minerals'],
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Patent, OpenAlex, and Crossref metadata as source-bounded research context.',
    icon: BookOpen,
    layerIds: ['research'],
  },
  {
    id: 'government',
    label: 'Government',
    description: 'Policy, sanctions, Congress, Federal Register, and regulator records.',
    icon: Landmark,
    layerIds: ['policy', 'sanctions', 'reactor-status'],
  },
  {
    id: 'sources',
    label: 'Sources',
    description: 'Connector health, freshness, and proof availability as an operational layer.',
    icon: Server,
    layerIds: [],
    sourceLayer: true,
  },
]

export function WorldIntelligenceView({
  loading,
  onRefresh,
  onSelectEvent,
  onSelectTicker,
  onToggleFavorite,
  onActiveWorldwatchProfileChange,
  onAddEntityToWorldwatchProfile,
  activeWorldwatchProfileId,
  worldwatchProfiles,
  snapshot,
}: {
  loading: boolean
  onRefresh: () => Promise<void>
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  onActiveWorldwatchProfileChange: (profileId: string) => void
  onAddEntityToWorldwatchProfile: (entity: WatchedEntity) => void
  activeWorldwatchProfileId: string
  worldwatchProfiles: WorldwatchProfile[]
  snapshot: WorldIntelSnapshot
}) {
  const [windowId, setWindowId] = useState<WorldWindowId>('24h')
  const [query, setQuery] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [activeLayerIds, setActiveLayerIds] = useState<WorldwatchLayerId[]>(() => DEFAULT_WORLDWATCH_LAYER_IDS)
  const [sourceLayerVisible, setSourceLayerVisible] = useState(true)
  const [deskMode, setDeskMode] = useState<WorldDeskMode>('overview')
  const [selectedCockpitEventId, setSelectedCockpitEventId] = useState<string | null>(null)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  const layerRegistry = useMemo(() => new WorldwatchLayerRegistry(), [])
  const activeWindow = worldWindows.find((item) => item.id === windowId) ?? worldWindows[3]
  const favoriteIds = useMemo(() => new Set(snapshot.favorites.map((favorite) => favorite.targetId)), [snapshot.favorites])
  const events = useMemo(
    () =>
      snapshot.worldEvents
        .filter((event) => now - event.timestamp <= activeWindow.durationMs)
        .sort((left, right) => right.timestamp - left.timestamp),
    [activeWindow.durationMs, now, snapshot.worldEvents],
  )
  const activeWorldwatchProfile = useMemo(
    () =>
      activeWorldwatchProfileId === 'all'
        ? undefined
        : worldwatchProfiles.find((profile) => profile.id === activeWorldwatchProfileId),
    [activeWorldwatchProfileId, worldwatchProfiles],
  )
  const rankedProfileEvents = useMemo(
    () =>
      activeWorldwatchProfile
        ? relevantEventsForProfile(events, activeWorldwatchProfile, { now })
        : [],
    [activeWorldwatchProfile, events, now],
  )
  const relevanceByEvent = useMemo(
    () => new Map(rankedProfileEvents.map((ranked) => [ranked.event.id, ranked] as const)),
    [rankedProfileEvents],
  )
  const profileEvents = activeWorldwatchProfile ? rankedProfileEvents.map((ranked) => ranked.event) : events
  const searchResults = useMemo(
    () => buildSearchResults(query, snapshot, profileEvents),
    [profileEvents, query, snapshot],
  )
  const visibleEvents = query.trim()
    ? profileEvents.filter((event) => searchResults.events.some((result) => result.id === event.id)).slice(0, 18)
    : profileEvents.slice(0, 18)
  const visibleCountries = query.trim()
    ? snapshot.countries.filter((country) => searchResults.countries.some((result) => result.countryCode === country.countryCode)).slice(0, 8)
    : snapshot.countries.slice(0, 8)
  const visibleAssets = query.trim()
    ? snapshot.assetIdentities.filter((asset) => searchResults.assets.some((result) => result.symbol === asset.symbol)).slice(0, 12)
    : snapshot.assetIdentities.slice(0, 12)
  const selectedCockpitEvent =
    visibleEvents.find((event) => event.id === selectedCockpitEventId) ?? visibleEvents[0]
  const layerSnapshot = useMemo(
    () => layerRegistry.materialize(snapshot, { events: visibleEvents, now }),
    [layerRegistry, now, snapshot, visibleEvents],
  )
  const timelineDensityBands = useMemo(() => buildTimelineDensityBands(visibleEvents, now), [now, visibleEvents])
  const selectedTimelineIndex = Math.max(
    0,
    visibleEvents.findIndex((event) => event.id === selectedCockpitEvent?.id),
  )
  const toggleWorldwatchLayerGroup = (group: WorldwatchLayerGroup) => {
    if (group.sourceLayer) {
      setSourceLayerVisible((current) => !current)
      return
    }
    setActiveLayerIds((current) => {
      const groupLayerIds = new Set(group.layerIds)
      const allActive = group.layerIds.every((layerId) => current.includes(layerId))
      if (allActive) return current.filter((layerId) => !groupLayerIds.has(layerId))
      return [...new Set([...current, ...group.layerIds])]
    })
  }

  const quantMetrics = useMemo(() => {
    const countries = snapshot.countries
    const avgCountryRisk = countries.length
      ? Math.round(countries.reduce((sum, country) => sum + country.riskScore, 0) / countries.length)
      : 0
    const topCountry = [...countries].sort((left, right) => right.riskScore - left.riskScore)[0]
    return {
      activeEvents: events.length,
      sourcesOnline: snapshot.sources.filter((source) => source.status === 'online').length,
      sourcesTotal: snapshot.sources.length,
      avgCountryRisk,
      topRegion: topCountry?.countryName ?? '—',
      topRegionRisk: topCountry?.riskScore ?? 0,
    }
  }, [events.length, snapshot.countries, snapshot.sources])
  const selectCockpitEvent = (eventId: string) => {
    setSelectedCockpitEventId(eventId)
    onSelectEvent(eventId)
  }

  return (
    <div className="world-intel-view atlasz-worldwatch-workstation">
      <section className="world-command-band worldwatch-command-deck slim">
        <div className="worldwatch-profile-chips" aria-label="Relevance profile (affects ranking only)">
          <button
            className={activeWorldwatchProfileId === 'all' ? 'active' : ''}
            type="button"
            onClick={() => onActiveWorldwatchProfileChange('all')}
          >
            All evidence
          </button>
          {worldwatchProfiles.map((profile) => (
            <button
              className={activeWorldwatchProfileId === profile.id ? 'active' : ''}
              key={profile.id}
              type="button"
              title={`Rank by ${profile.name} (relevance only)`}
              onClick={() => onActiveWorldwatchProfileChange(profile.id)}
            >
              {profile.name}
            </button>
          ))}
        </div>
        <div className="world-command-actions">
          <div className="world-search">
            <Search size={15} />
            <input
              aria-label="Search world intelligence"
              placeholder="Search country, ticker, facility, source, event..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button type="button" onClick={() => void onRefresh()} disabled={loading}>
            {loading ? 'Refreshing' : 'Refresh Sources'}
          </button>
        </div>
      </section>

      <section className="worldwatch-workstation-grid">
        <aside className="worldwatch-command-rail">
          <WorldwatchProfilePanel
            activeProfile={activeWorldwatchProfile}
            activeProfileId={activeWorldwatchProfileId}
            profiles={worldwatchProfiles}
            relevantEventCount={rankedProfileEvents.length}
            totalEventCount={events.length}
            onActiveProfileChange={onActiveWorldwatchProfileChange}
            onAddEntity={onAddEntityToWorldwatchProfile}
          />
          <SourceConstellation sources={snapshot.sources} status={snapshot.status} />
        </aside>

        <section className="worldwatch-map-core">
          <WorldwatchCockpit
            activeLayerIds={activeLayerIds}
            events={visibleEvents}
            layerSnapshot={layerSnapshot}
            now={now}
            selectedEvent={selectedCockpitEvent}
            sourceLayerVisible={sourceLayerVisible}
            sources={snapshot.sources}
            windowId={windowId}
            windows={worldWindows}
            onSelectEvent={selectCockpitEvent}
            onToggleLayerGroup={toggleWorldwatchLayerGroup}
            onWindowChange={(id) => setWindowId(id as WorldWindowId)}
          />
          <Suspense fallback={<div className="world-panel world-quant-strip"><QuantStripSkeleton /></div>}>
            <WorldQuantStrip metrics={quantMetrics} />
          </Suspense>
        </section>

        <aside className="worldwatch-intel-rail">
          <Suspense fallback={<div className="world-panel world-events-panel"><PanelSkeleton rows={4} label="Loading event stream" /></div>}>
            <WorldEventTimeline
              events={visibleEvents}
              favoriteIds={favoriteIds}
              now={now}
              sourceTrust={snapshot.sourceTrust}
              activeProfile={activeWorldwatchProfile}
              relevanceByEvent={relevanceByEvent}
              onToggleFavorite={onToggleFavorite}
              onSelectEvent={onSelectEvent}
              onSelectTicker={onSelectTicker}
            />
          </Suspense>
          <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading entity detail" /></div>}>
            <WorldEntityDetailPanel
              countries={visibleCountries}
              assets={visibleAssets}
              secFilings={snapshot.secFilings}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onSelectTicker={onSelectTicker}
              onAddToWatchlist={onAddEntityToWorldwatchProfile}
              watchlistEnabled={Boolean(activeWorldwatchProfile)}
            />
          </Suspense>
        </aside>
      </section>

      <section className="worldwatch-intelligence-timeline" aria-label="World intelligence timeline">
        <header>
          <div>
            <span>Intelligence Timeline</span>
            <strong>Replay cursor follows selected evidence</strong>
          </div>
          <strong>{visibleEvents.length} events in view</strong>
        </header>
        <div className="worldwatch-density-band" aria-hidden="true">
          {timelineDensityBands.map((band) => (
            <span
              className={`density-segment category-${categoryClass(band.category)}${band.count > 0 ? ' active' : ''}`}
              key={band.id}
              style={{ flexGrow: Math.max(1, band.count) }}
              title={`${band.label}: ${band.count} events`}
            />
          ))}
        </div>
        <div
          className="worldwatch-timeline-track"
          style={{
            '--cursor-count': Math.max(1, visibleEvents.slice(0, 16).length),
            '--cursor-index': Math.min(selectedTimelineIndex, 15),
          } as CSSProperties}
        >
          <span className="timeline-replay-cursor" aria-hidden="true" />
          {visibleEvents.slice(0, 16).map((event, index) => (
            <button
              className={selectedCockpitEvent?.id === event.id ? `timeline-node active severity-${event.severity} category-${categoryClass(event.category)}` : `timeline-node severity-${event.severity} category-${categoryClass(event.category)}`}
              key={event.id}
              style={{ '--timeline-index': index, '--freshness': `${timelineFreshness(event.timestamp, now)}%` } as CSSProperties}
              type="button"
              onClick={() => selectCockpitEvent(event.id)}
            >
              <span>{formatEventAge(event.timestamp, now)}</span>
              <strong>{event.region}</strong>
              <em>{event.category}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="worldwatch-desk">
        <header className="worldwatch-desk-head">
          <div>
            <span>Evidence Desk</span>
            <h4>{worldDeskModes.find((mode) => mode.id === deskMode)?.description}</h4>
          </div>
          <div className="worldwatch-desk-tabs" role="tablist" aria-label="Worldwatch evidence desk">
            {worldDeskModes.map((mode) => (
              <button
                aria-selected={deskMode === mode.id}
                className={deskMode === mode.id ? 'active' : ''}
                key={mode.id}
                role="tab"
                type="button"
                onClick={() => setDeskMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </header>

        <div className="worldwatch-desk-grid">
          {deskMode === 'overview' && (
            <>
              <Suspense fallback={<div className="world-panel world-trade-overview"><PanelSkeleton rows={5} label="Loading trade market overview" /></div>}>
                <WorldTradeMarketOverview events={visibleEvents} sources={snapshot.sources} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading what to watch next" /></div>}>
                <WhatToWatchPanel
                  events={visibleEvents}
                  now={now}
                  profile={activeWorldwatchProfile}
                  relevanceByEvent={relevanceByEvent}
                />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading precedents" /></div>}>
                <HistoricalPlaybookPanel events={visibleEvents} />
              </Suspense>
            </>
          )}

          {deskMode === 'proof' && (
            <>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading weather source trail" /></div>}>
                <WeatherAlertSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading regulatory source trail" /></div>}>
                <RegulatorySourceTrail events={visibleEvents} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading OFAC source trail" /></div>}>
                <OfacSourceTrail events={visibleEvents} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading Congress source trail" /></div>}>
                <CongressSourceTrail events={visibleEvents} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading GDELT media source trail" /></div>}>
                <GdeltSourceTrail events={visibleEvents} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading vulnerability intelligence" /></div>}>
                <CveSourceTrailPanel events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading UN Comtrade source trail" /></div>}>
                <ComtradeSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading OpenAlex source trail" /></div>}>
                <OpenAlexSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading Crossref source trail" /></div>}>
                <CrossrefSourceTrail events={visibleEvents} now={now} />
              </Suspense>
            </>
          )}

          {deskMode === 'markets' && (
            <>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading market identity source trail" /></div>}>
                <MarketIdentitySourceTrail events={visibleEvents} identities={snapshot.marketIdentities} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC company facts" /></div>}>
                <CompanyFactsSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC Form 4 insider transactions" /></div>}>
                <Form4SourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC Form 13F holdings" /></div>}>
                <Form13FSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading ETF holdings" /></div>}>
                <EtfHoldingsSourceTrail events={visibleEvents} now={now} />
              </Suspense>
            </>
          )}

          {deskMode === 'infrastructure' && (
            <>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading EIA power-plant facilities" /></div>}>
                <EiaFacilitySourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading EIA refineries" /></div>}>
                <EiaRefinerySourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading LNG terminals" /></div>}>
                <LngTerminalSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading nuclear plants" /></div>}>
                <NuclearPlantSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading NRC reactor status" /></div>}>
                <NrcReactorStatusSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading grid regions" /></div>}>
                <GridRegionSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading port locations" /></div>}>
                <PortLocodeSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading physical ports" /></div>}>
                <WorldPortIndexSourceTrail events={visibleEvents} now={now} />
              </Suspense>
              <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading mineral sites" /></div>}>
                <MineralSiteSourceTrail events={visibleEvents} now={now} />
              </Suspense>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function SourceConstellation({
  sources,
  status,
}: {
  sources: OsintSourceSnapshot[]
  status: WorldIntelSnapshot['status']
}) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState('all')
  const [sourceStatusFilter, setSourceStatusFilter] = useState('all')
  const online = sources.filter((source) => source.status === 'online').length
  const attention = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
  const locked = sources.filter((source) => source.status === 'disabled' || source.refreshState === 'missing-key').length
  const sourceCategories = useMemo(() => sourceConstellationCategories(sources), [sources])
  const filteredSources = sources.filter((source) => {
    const categoryMatch = sourceCategoryFilter === 'all' || sourceCategoryLabel(source) === sourceCategoryFilter
    const statusMatch = sourceStatusFilter === 'all' || sourceStatusGroup(source) === sourceStatusFilter
    return categoryMatch && statusMatch
  })
  const displayedSources = filteredSources.slice(0, 36)
  const selectedSource = displayedSources.find((source) => source.sourceId === selectedSourceId) ?? displayedSources[0]

  return (
    <section className="source-constellation" aria-label="Source health constellation">
      <header>
        <div>
          <span>Source Constellation</span>
          <h4>{online}/{sources.length} live sources</h4>
        </div>
        <strong className={`source-orbit-state state-${status}`}>{status}</strong>
      </header>
      <div className="source-filter-grid" aria-label="Source filters">
        <div>
          {sourceCategories.map((category) => (
            <button
              className={sourceCategoryFilter === category ? 'active' : ''}
              key={category}
              type="button"
              onClick={() => setSourceCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div>
          {['all', 'live', 'attention', 'locked'].map((filter) => (
            <button
              className={sourceStatusFilter === filter ? 'active' : ''}
              key={filter}
              type="button"
              onClick={() => setSourceStatusFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="source-orbit-field">
        <div className="source-orbit-core">
          <Signal size={18} />
          <span>Atlasz</span>
        </div>
        {displayedSources.map((source, index) => {
          const position = sourceNodePosition(source, index, displayedSources.length)
          return (
            <button
              aria-label={`${source.sourceName}: ${source.status}`}
              className={`source-node source-${source.status} refresh-${source.refreshState ?? 'unknown'}${selectedSource?.sourceId === source.sourceId ? ' active' : ''}`}
              key={source.sourceId}
              style={{ left: `${position.x}%`, top: `${position.y}%`, '--source-index': index } as CSSProperties}
              title={`${source.sourceName} · ${source.status}`}
              type="button"
              onClick={() => setSelectedSourceId(source.sourceId)}
            />
          )
        })}
      </div>
      {selectedSource ? (
        <div className="source-constellation-detail">
          <span>{selectedSource.category ?? selectedSource.sourceType}</span>
          <strong>{selectedSource.sourceName}</strong>
          <p>
            {humanSourceStatus(selectedSource)} · {selectedSource.itemCount} records · {formatOptionalTime(selectedSource.lastSuccessAt)}
          </p>
          <div className="source-detail-grid">
            <span>Last ok <strong>{formatOptionalTime(selectedSource.lastSuccessAt)}</strong></span>
            <span>Attempt <strong>{formatOptionalTime(selectedSource.lastAttemptAt)}</strong></span>
            <span>Next <strong>{formatOptionalTime(selectedSource.nextAttemptAt)}</strong></span>
            <span>Proof <strong>{selectedSource.provenance}</strong></span>
          </div>
        </div>
      ) : null}
      <div className="source-constellation-legend">
        <span><i className="source-online" /> Live {online}</span>
        <span><i className="source-rate-limited" /> Limited {attention}</span>
        <span><i className="source-disabled" /> Locked {locked}</span>
      </div>
    </section>
  )
}

const PROXIMITY_RADIUS_KM = 400

/** Great-circle distance in km. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const r = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

/**
 * Source-backed co-location: other geo events within PROXIMITY_RADIUS_KM. For a
 * hazard it surfaces nearby infrastructure (and vice-versa) — a real spatial
 * join, never a causal/impact claim. Both sides carry their own source trail.
 */
function buildProximityLinks(
  selected: WorldIntelEvent,
  events: WorldIntelEvent[],
): Array<{ event: WorldIntelEvent; km: number }> {
  const lat = selected.lat
  const lon = selected.lon
  if (typeof lat !== 'number' || typeof lon !== 'number') return []
  const selfHazard = Boolean(selected.earthquakeEvent)
  const selfInfra = Boolean(selected.infrastructureSite)
  return events
    .filter((event) => event.id !== selected.id && typeof event.lat === 'number' && typeof event.lon === 'number')
    .filter((event) =>
      selfHazard ? Boolean(event.infrastructureSite) : selfInfra ? Boolean(event.earthquakeEvent) : true,
    )
    .map((event) => ({ event, km: haversineKm(lat, lon, event.lat as number, event.lon as number) }))
    .filter((link) => link.km <= PROXIMITY_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, 6)
}

export type DailySynthesis = {
  total: number
  sourceCount: number
  hazards: number
  infrastructure: number
  nearbyFacilities: number
  topSectors: Array<[string, number]>
}

/**
 * Cross-source roll-up of the current window — the intelligence layer, not a
 * feed. Counts real events by source, and joins hazards <-> infrastructure by
 * proximity. Co-location only; never an impact/causation claim.
 */
function buildDailySynthesis(events: WorldIntelEvent[]): DailySynthesis {
  const hazards = events.filter((event) => Boolean(event.earthquakeEvent))
  const infrastructure = events.filter((event) => Boolean(event.infrastructureSite))
  const sources = new Set(events.map((event) => event.sourceId))
  const nearbyFacilityIds = new Set<string>()
  for (const hazard of hazards) {
    if (typeof hazard.lat !== 'number' || typeof hazard.lon !== 'number') continue
    for (const facility of infrastructure) {
      if (typeof facility.lat !== 'number' || typeof facility.lon !== 'number') continue
      if (haversineKm(hazard.lat, hazard.lon, facility.lat, facility.lon) <= PROXIMITY_RADIUS_KM) {
        nearbyFacilityIds.add(facility.id)
      }
    }
  }
  const sectorCounts = new Map<string, number>()
  for (const facility of infrastructure) {
    for (const sector of facility.affectedSectors) sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1)
  }
  const topSectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  return {
    total: events.length,
    sourceCount: sources.size,
    hazards: hazards.length,
    infrastructure: infrastructure.length,
    nearbyFacilities: nearbyFacilityIds.size,
    topSectors,
  }
}

/**
 * Globe arcs from REAL co-location: each hazard to its nearest facility within
 * PROXIMITY_RADIUS_KM. Honest "everything connected" — proximity links only, no
 * causal/impact claim. Capped so the globe stays readable.
 */
function buildGlobeProximityArcs(events: WorldIntelEvent[]): GlobeArc[] {
  const hazards = events.filter((e) => Boolean(e.earthquakeEvent) && typeof e.lat === 'number' && typeof e.lon === 'number')
  const facilities = events.filter((e) => Boolean(e.infrastructureSite) && typeof e.lat === 'number' && typeof e.lon === 'number')
  const arcs: GlobeArc[] = []
  for (const hazard of hazards) {
    let nearest: WorldIntelEvent | null = null
    let nearestKm = Infinity
    for (const facility of facilities) {
      const km = haversineKm(hazard.lat as number, hazard.lon as number, facility.lat as number, facility.lon as number)
      if (km <= PROXIMITY_RADIUS_KM && km < nearestKm) {
        nearestKm = km
        nearest = facility
      }
    }
    if (nearest) {
      arcs.push({
        id: `${hazard.id}:${nearest.id}`,
        startLat: hazard.lat as number,
        startLng: hazard.lon as number,
        endLat: nearest.lat as number,
        endLng: nearest.lon as number,
        color: '#fb923c',
      })
    }
    if (arcs.length >= 24) break
  }
  return arcs
}

const SEVERITY_RANK: Record<string, number> = { critical: 4, elevated: 3, watch: 2, stable: 1 }
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  elevated: 'High',
  watch: 'Watch',
  stable: 'Low',
}

function severityRank(severity: string): number {
  return SEVERITY_RANK[severity] ?? 0
}

function relativeTimeShort(timestamp: number, now: number): string {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

// Globe marker color by provenance trust — official reads brightest; media and
// structural read dimmer/cooler so an observation never looks like verified fact.
function globeTrustColor(trust: string, stale: boolean): string {
  const base =
    trust === 'official'
      ? '#38bdf8'
      : trust === 'public'
        ? '#5eead4'
        : trust === 'media'
          ? '#fb923c'
          : trust === 'structural'
            ? '#a78bfa'
            : '#687a74'
  return stale ? `${base}88` : base
}

function WorldwatchCockpit({
  activeLayerIds,
  events,
  layerSnapshot,
  now,
  selectedEvent,
  sourceLayerVisible,
  sources,
  windowId,
  windows,
  onSelectEvent,
  onToggleLayerGroup,
  onWindowChange,
}: {
  activeLayerIds: WorldwatchLayerId[]
  events: WorldIntelEvent[]
  layerSnapshot: WorldwatchLayerSnapshot
  now: number
  selectedEvent?: WorldIntelEvent
  sourceLayerVisible: boolean
  sources: OsintSourceSnapshot[]
  windowId: WorldWindowId
  windows: typeof worldWindows
  onSelectEvent: (eventId: string) => void
  onToggleLayerGroup: (group: WorldwatchLayerGroup) => void
  onWindowChange: (id: WorldWindowId) => void
}) {
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const activeLayerSet = useMemo(() => new Set(activeLayerIds), [activeLayerIds])
  const onlineSources = sources.filter((source) => source.status === 'online').length
  const attentionSources = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
  const lockedSources = sources.filter((source) => source.status === 'disabled' || source.refreshState === 'missing-key').length
  const layerEntities = useMemo(
    () =>
      layerSnapshot.entities
        .filter((entity) => activeLayerSet.has(entity.layerId))
        .slice(0, 80),
    [activeLayerSet, layerSnapshot.entities],
  )
  const eventFallbackMarkers = useMemo(
    () => (layerEntities.length === 0 ? events.slice(0, 28) : []),
    [events, layerEntities.length],
  )
  const plottedMarkers = useMemo(
    () => buildCockpitMarkers(layerEntities, eventFallbackMarkers, events, now),
    [eventFallbackMarkers, events, layerEntities, now],
  )
  const requestedSelected = selectedEvent ?? events[0]
  const selected =
    plottedMarkers.length > 0
      ? events.find((event) => event.id === requestedSelected?.id && plottedMarkers.some((marker) => marker.eventId === event.id)) ??
        events.find((event) => event.id === plottedMarkers[0]?.eventId) ??
        requestedSelected
      : requestedSelected
  const selectedMarker = plottedMarkers.find((marker) => marker.eventId === selected?.id) ?? plottedMarkers[0]
  const hoveredMarker = plottedMarkers.find((marker) => marker.id === hoveredMarkerId)
  const markerClusters = useMemo(() => buildMarkerClusters(plottedMarkers), [plottedMarkers])
  const heatRings = useMemo(() => buildRegionalHeatRings(plottedMarkers), [plottedMarkers])
  const connectionEdges = useMemo(() => buildCockpitConnections(selectedMarker, plottedMarkers), [plottedMarkers, selectedMarker])
  const selectedEntity = selected ? layerEntities.find((entity) => entity.eventId === selected.id) : undefined
  const selectedSource = selected ? sources.find((source) => source.sourceId === selected.sourceId) : undefined
  const selectedProof = selectedEntity?.proof
  const connectedChips = selected ? buildConnectedChips(selected, selectedEntity, connectionEdges) : []
  const connectedRegions = selected ? buildConnectedRegions(selected, connectionEdges) : []
  const connectedMarkets = selected ? buildConnectedMarkets(selected, selectedEntity) : []
  const exposureChain = selected ? buildExposureChain(selected) : []
  const proximityLinks = selected ? buildProximityLinks(selected, events) : []
  const whyThisMatters = selected ? buildWhyThisMatters(selected, selectedEntity) : []
  const whatChanged = selected ? buildWhatChanged(selected, selectedEntity, now) : []
  const layerGroupSummaries = useMemo(
    () => summarizeLayerGroups(layerSnapshot.layers, activeLayerSet, sourceLayerVisible, sources),
    [activeLayerSet, layerSnapshot.layers, sourceLayerVisible, sources],
  )
  const entityGraph = buildEntityGraph(events, selected, sources)
  // Real globe markers — ONLY proof-backed entities that carry source-backed
  // coordinates. No coordinates => no marker (never a synthetic pin).
  const globePoints = useMemo<GlobePoint[]>(
    () =>
      layerEntities
        .filter((entity) => typeof entity.lat === 'number' && typeof entity.lon === 'number')
        .map((entity) => ({
          id: entity.id,
          lat: entity.lat as number,
          lng: entity.lon as number,
          label: entity.label,
          color: globeTrustColor(entity.visualTrust, entity.stale),
          size: entity.stale ? 0.5 : 0.78,
          eventId: entity.eventId,
        })),
    [layerEntities],
  )
  // Left intel stack — real events, most recent first / highest severity first.
  const whatChangedEvents = useMemo(
    () => [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6),
    [events],
  )
  const synthesis = useMemo(() => buildDailySynthesis(events), [events])
  const globeArcs = useMemo(() => buildGlobeProximityArcs(events), [events])
  const whatToWatchEvents = useMemo(
    () =>
      [...events]
        .filter((event) => event.severity === 'critical' || event.severity === 'elevated')
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.timestamp - a.timestamp)
        .slice(0, 4),
    [events],
  )
  const mapStyle = {
    '--focus-x': `${selectedMarker?.x ?? 50}%`,
    '--focus-y': `${selectedMarker?.y ?? 50}%`,
  } as CSSProperties

  return (
    <article className="atlasz-cockpit" aria-label="Atlasz Worldwatch cockpit">
      <header className="cockpit-header slim">
        <div className="cockpit-metric-strip">
          <MetricPill icon={ShieldCheck} label="Proof Entities" value={String(layerEntities.length || events.length)} />
          <MetricPill icon={Database} label="Sources Online" value={`${onlineSources}/${sources.length}`} />
          <MetricPill icon={AlertTriangle} label="Attention" value={String(attentionSources)} />
        </div>
      </header>

      <div className="cockpit-body">
        <aside className="cockpit-intel-stack" aria-label="What changed and what to watch">
          <article className="synthesis-card">
            <header className="intel-card-head">
              <Network size={13} />
              <span>Today's synthesis</span>
            </header>
            <div className="synthesis-stats">
              <div><strong>{synthesis.total}</strong><em>events · {synthesis.sourceCount} sources</em></div>
              <div><strong>{synthesis.infrastructure}</strong><em>facilities</em></div>
              <div><strong>{synthesis.hazards}</strong><em>hazards</em></div>
            </div>
            {synthesis.nearbyFacilities > 0 && (
              <div className="synthesis-link">
                <strong>{synthesis.nearbyFacilities}</strong>
                <span>facilities within {PROXIMITY_RADIUS_KM} km of an active hazard</span>
              </div>
            )}
            {synthesis.topSectors.length > 0 && (
              <div className="synthesis-sectors">
                {synthesis.topSectors.map(([sector, count]) => (
                  <span key={sector}>{sector} · {count}</span>
                ))}
              </div>
            )}
            <small>Cross-source roll-up. Co-location is not impact, and counts are source-backed.</small>
          </article>
          <article className="intel-card">
            <header className="intel-card-head">
              <Activity size={13} />
              <span>What changed today</span>
              <em>{whatChangedEvents.length}</em>
            </header>
            <div className="intel-event-list">
              {whatChangedEvents.length === 0 ? (
                <p className="intel-empty">No proof-backed changes in this window.</p>
              ) : (
                whatChangedEvents.map((event) => (
                  <button
                    className={`intel-event-row sev-${event.severity}${selected?.id === event.id ? ' active' : ''}`}
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <span className={`intel-sev-dot sev-${event.severity}`} />
                    <span className="intel-event-main">
                      <strong>{event.title}</strong>
                      <em>{event.region} · {relativeTimeShort(event.timestamp, now)}</em>
                    </span>
                    <span className={`intel-sev-chip sev-${event.severity}`}>
                      {SEVERITY_LABEL[event.severity] ?? event.severity}
                    </span>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="intel-card">
            <header className="intel-card-head">
              <Zap size={13} />
              <span>What to watch</span>
            </header>
            <div className="intel-event-list">
              {whatToWatchEvents.length === 0 ? (
                <p className="intel-empty">Nothing elevated in this window.</p>
              ) : (
                whatToWatchEvents.map((event) => (
                  <button
                    className={`intel-event-row sev-${event.severity}`}
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <span className={`intel-sev-dot sev-${event.severity}`} />
                    <span className="intel-event-main">
                      <strong>{event.title}</strong>
                      <em>{SEVERITY_LABEL[event.severity] ?? event.severity} · {relativeTimeShort(event.timestamp, now)}</em>
                    </span>
                  </button>
                ))
              )}
            </div>
          </article>

          <div className="intel-window-row" aria-label="Replay window">
            {windows.map((windowItem) => (
              <button
                className={windowItem.id === windowId ? 'active' : ''}
                key={windowItem.id}
                type="button"
                onClick={() => onWindowChange(windowItem.id)}
              >
                {windowItem.label}
              </button>
            ))}
          </div>

          <div className="intel-layer-row" aria-label="Layers">
            {layerGroupSummaries.slice(0, 6).map((group) => {
              const Icon = group.icon
              return (
                <button
                  className={`intel-layer-toggle group-${group.id} layer-status-${group.status}${group.active ? ' active' : ''}`}
                  key={group.id}
                  type="button"
                  title={`${group.label} · ${group.status}`}
                  onClick={() => onToggleLayerGroup(group)}
                >
                  <Icon size={13} />
                  <span>{group.label}</span>
                  <em>{group.entityCount}</em>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="cockpit-map-stage" aria-label="Proof-backed world map">
          <div className="cockpit-map-toolbar">
            <div>
              <MapPinned size={15} />
              <span>{plottedMarkers.length} source-backed markers</span>
            </div>
            <div>
              <Layers3 size={15} />
              <span>{layerGroupSummaries.filter((group) => group.active).length} visible layers</span>
            </div>
            <div>
              <Database size={15} />
              <span>{onlineSources}/{sources.length} sources live</span>
            </div>
            <button
              aria-pressed={graphOpen}
              className={graphOpen ? 'cockpit-tool-button active' : 'cockpit-tool-button'}
              type="button"
              onClick={() => setGraphOpen((current) => !current)}
            >
              <Network size={15} />
              <span>{graphOpen ? 'Hide graph' : 'Entity graph'}</span>
            </button>
          </div>

          <div className="cockpit-map-plane cockpit-map-plane-3d" style={mapStyle}>
            <Suspense fallback={<div className="proof-globe-loading">Loading globe…</div>}>
              <ProofGlobe points={globePoints} arcs={globeArcs} onSelectPoint={onSelectEvent} />
            </Suspense>
            <span className="cockpit-earth-glow" />
            {sourceLayerVisible ? (
              <div className="cockpit-source-radar" aria-label="Source health radar">
                <span className="source-radar-live">{onlineSources} live</span>
                <span className="source-radar-attention">{attentionSources} attention</span>
                <span className="source-radar-locked">{lockedSources} locked</span>
              </div>
            ) : null}
            {plottedMarkers.length === 0 ? (
              <div className="cockpit-empty-map">
                <Globe2 size={20} />
                <p>No proof-backed entities in this window. Atlasz is not rendering filler markers.</p>
              </div>
            ) : (
              <>
                <svg className="cockpit-connection-overlay" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {connectionEdges.map((edge) => (
                    <path
                      className={`connection-strength-${edge.strength}`}
                      key={`${edge.source.id}:${edge.target.id}`}
                      d={connectionArcPath(edge)}
                    />
                  ))}
                </svg>
                {heatRings.map((ring) => (
                  <span
                    className={`cockpit-heat-ring category-${categoryClass(ring.category)}`}
                    key={ring.id}
                    style={{
                      left: `${ring.x}%`,
                      top: `${ring.y}%`,
                      '--heat-size': `${ring.size}px`,
                      '--heat-opacity': ring.opacity,
                    } as CSSProperties}
                    title={`${ring.count} source-backed markers near ${ring.region}`}
                  />
                ))}
                {markerClusters.map((cluster) => (
                  <button
                    aria-label={`Focus ${cluster.count} related markers near ${cluster.region}`}
                    className={`cockpit-cluster category-${categoryClass(cluster.category)}`}
                    key={cluster.id}
                    style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
                    title={`${cluster.count} markers · ${cluster.region}`}
                    type="button"
                    onClick={() => onSelectEvent(cluster.eventId)}
                  >
                    {cluster.count}
                  </button>
                ))}
                {plottedMarkers.map((marker, index) => (
                  <button
                    aria-label={`Select ${marker.label}`}
                    className={`cockpit-marker marker-${marker.trust} severity-${marker.severity} category-${categoryClass(marker.category)}${marker.stale ? ' stale' : ''}${selected?.id === marker.eventId ? ' active' : ''}`}
                    key={marker.id}
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      '--marker-index': index,
                      '--marker-opacity': marker.visualOpacity,
                    } as CSSProperties}
                    type="button"
                    onClick={() => onSelectEvent(marker.eventId)}
                    onMouseEnter={() => setHoveredMarkerId(marker.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                    onFocus={() => setHoveredMarkerId(marker.id)}
                    onBlur={() => setHoveredMarkerId(null)}
                  >
                    <span className="marker-core">
                      <CategoryGlyph category={marker.category} />
                    </span>
                    <i className="marker-ring" />
                    <strong>{marker.label}</strong>
                  </button>
                ))}
                {hoveredMarker ? (
                  <div
                    className={`cockpit-hover-inspector category-${categoryClass(hoveredMarker.category)}`}
                    style={{ left: `${hoveredMarker.x}%`, top: `${hoveredMarker.y}%` }}
                  >
                    <span>{hoveredMarker.region}</span>
                    <strong>{hoveredMarker.label}</strong>
                    <p>{hoveredMarker.summary}</p>
                  </div>
                ) : null}
              </>
            )}
            {graphOpen ? (
              <EntityGraphOverlay graph={entityGraph} onSelectEvent={onSelectEvent} />
            ) : null}
          </div>
        </section>

        <aside className="cockpit-dossier">
          {selected ? (
            <>
              <header>
                <span>{selected.region}</span>
                <h4>{selected.title}</h4>
              </header>
              <p>{selected.summary}</p>
              <div className="cockpit-proof-strip">
                <ProvenanceBadge value={selected.provenance} size="sm" />
                <FreshnessBadge now={now} retrievedAt={selectedProof?.retrievedAt ?? selected.timestamp} size="sm" />
                <span>{formatEventConfidence(selected.confidence)} confidence</span>
              </div>
              <div className="cockpit-proof-card">
                <span>Evidence Trail</span>
                <strong>{selectedSource?.sourceName ?? selected.sourceId}</strong>
                <div className="cockpit-proof-grid">
                  <span>Retrieved <strong>{formatOptionalTime(selectedProof?.retrievedAt ?? selected.timestamp)}</strong></span>
                  <span>Payload <strong>{shortHash(selectedProof?.rawPayloadHash ?? selected.rawPayloadHash)}</strong></span>
                  <span>Records <strong>{selectedSource?.itemCount ?? 0}</strong></span>
                  <span>State <strong>{selectedSource ? humanSourceStatus(selectedSource) : selected.provenance}</strong></span>
                </div>
              </div>
              {exposureChain.length > 0 && (
                <div className="cockpit-exposure-chain" aria-label="Exposure chain">
                  <span className="exposure-chain-label">Exposure chain</span>
                  <div className="exposure-chain-flow">
                    {exposureChain.map((step, index) => (
                      <div className={`exposure-step step-${step.kind}`} key={step.kind}>
                        <em>{step.label}</em>
                        <div className="exposure-step-values">
                          {step.values.map((value) => (
                            <span key={value}>{value}</span>
                          ))}
                        </div>
                        {index < exposureChain.length - 1 && <i className="exposure-arrow" aria-hidden="true">→</i>}
                      </div>
                    ))}
                  </div>
                  <small>Source-backed connection only — operator and fuel-derived sectors. No ticker match, price, or trading signal.</small>
                </div>
              )}
              {proximityLinks.length > 0 && (
                <div className="cockpit-proximity" aria-label="Source-backed co-location">
                  <span className="cockpit-proximity-label">
                    Within {PROXIMITY_RADIUS_KM} km — co-located, source-backed
                  </span>
                  <div className="cockpit-proximity-list">
                    {proximityLinks.map((link) => (
                      <button
                        className="cockpit-proximity-row"
                        key={link.event.id}
                        type="button"
                        onClick={() => onSelectEvent(link.event.id)}
                      >
                        <strong>{Math.round(link.km)} km</strong>
                        <span>{link.event.title}</span>
                        <em>{link.event.infrastructureSite ? 'infrastructure' : link.event.earthquakeEvent ? 'hazard' : link.event.category}</em>
                      </button>
                    ))}
                  </div>
                  <small>Co-location only — proximity is not an impact, outage, damage, or causation claim. Each item keeps its own source trail.</small>
                </div>
              )}
              <div className="cockpit-dossier-section">
                <span>What changed</span>
                <ul>
                  {whatChanged.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="cockpit-dossier-section">
                <span>Why this matters</span>
                <ul>
                  {whyThisMatters.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="cockpit-connection-grid">
                <section>
                  <span>Connected regions</span>
                  <div className="cockpit-tag-grid">
                    {connectedRegions.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <span>Connected markets</span>
                  <div className="cockpit-tag-grid">
                    {connectedMarkets.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </section>
              </div>
              <div className="cockpit-dossier-section">
                <span>Related entities</span>
                <div className="cockpit-tag-grid">
                  {connectedChips.slice(0, 12).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="cockpit-dossier-section">
                <span>Unknowns</span>
                <ul>
                  {(selectedEntity?.unknowns ?? ['Open the source trail for more source-bounded detail.']).slice(0, 3).map((unknown) => (
                    <li key={unknown}>{unknown}</li>
                  ))}
                </ul>
              </div>
              <div className="cockpit-nonclaim">
                <strong>Boundary</strong>
                <p>{(selectedEntity?.nonClaims ?? ['Source-backed context only. No outage, damage, prediction, or trading recommendation is inferred.'])[0]}</p>
              </div>
              {selected.sourceUrl ? (
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Open proof
                </a>
              ) : null}
            </>
          ) : (
            <div className="cockpit-empty-map">
              <Activity size={18} />
              <p>Select a marker to inspect proof, freshness, and non-claims.</p>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}

type CockpitVisualMarker = {
  id: string
  eventId: string
  label: string
  summary: string
  x: number
  y: number
  trust: WorldwatchEntity['visualTrust']
  severity: WorldIntelEvent['severity']
  stale: boolean
  sourceId: string
  layerId?: WorldwatchLayerId
  category: string
  region: string
  timestamp: number
  confidence: number
  freshness: number
  visualOpacity: number
}

type CockpitConnection = {
  source: CockpitVisualMarker
  target: CockpitVisualMarker
  strength: 'primary' | 'secondary'
  reason: string
}

type TimelineDensityBand = {
  id: string
  label: string
  category: string
  count: number
}

type CockpitHeatRing = {
  id: string
  x: number
  y: number
  count: number
  size: number
  opacity: number
  region: string
  category: string
}

type EntityGraphNodeKind = 'event' | 'country' | 'market' | 'source' | 'sector' | 'commodity'

type EntityGraphNode = {
  id: string
  label: string
  kind: EntityGraphNodeKind
  eventId: string
  x: number
  y: number
  active: boolean
}

type EntityGraphEdge = {
  id: string
  sourceId: string
  targetId: string
  source: EntityGraphNode
  target: EntityGraphNode
}

type EntityGraphModel = {
  nodes: EntityGraphNode[]
  edges: EntityGraphEdge[]
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
}) {
  return (
    <div className="cockpit-metric">
      <Icon size={14} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function summarizeLayerGroups(
  layers: WorldwatchLayerSnapshot['layers'],
  activeLayerSet: Set<WorldwatchLayerId>,
  sourceLayerVisible: boolean,
  sources: OsintSourceSnapshot[],
): WorldwatchLayerGroupSummary[] {
  const layerById = new Map(layers.map((layer) => [layer.id, layer]))
  return worldwatchLayerGroups.map((group) => {
    if (group.sourceLayer) {
      const onlineCount = sources.filter((source) => source.status === 'online').length
      const staleCount = sources.filter((source) => source.refreshState === 'stale' || source.refreshState === 'expired').length
      return {
        ...group,
        active: sourceLayerVisible,
        entityCount: sources.length,
        onlineCount,
        sourceCount: sources.length,
        staleCount,
        status: sourceGroupStatus(sources),
        freshnessHeat: sources.length === 0 ? 'empty' : staleCount > 0 ? 'mixed' : 'fresh',
      }
    }

    const groupLayers = group.layerIds.map((layerId) => layerById.get(layerId)).filter((layer): layer is WorldwatchLayerSnapshot['layers'][number] => Boolean(layer))
    const entityCount = groupLayers.reduce((sum, layer) => sum + layer.entityCount, 0)
    const staleCount = groupLayers.reduce((sum, layer) => sum + layer.staleEntityCount, 0)
    const sourceIds = new Set(groupLayers.flatMap((layer) => layer.sourceIds))
    const onlineCount = groupLayers.reduce((sum, layer) => sum + layer.onlineSourceCount, 0)
    return {
      ...group,
      active: group.layerIds.some((layerId) => activeLayerSet.has(layerId)),
      entityCount,
      onlineCount,
      sourceCount: sourceIds.size,
      staleCount,
      status: layerGroupStatus(groupLayers),
      freshnessHeat: layerGroupFreshness(entityCount, staleCount),
    }
  })
}

function sourceGroupStatus(sources: OsintSourceSnapshot[]) {
  if (sources.length === 0) return 'inactive'
  if (sources.some((source) => source.status === 'failed' || source.status === 'rate-limited' || source.status === 'offline')) return 'attention'
  if (sources.some((source) => source.status === 'disabled' || source.refreshState === 'missing-key')) return 'missing-config'
  return sources.some((source) => source.status === 'online') ? 'online' : 'inactive'
}

function layerGroupStatus(layers: WorldwatchLayerSnapshot['layers']) {
  if (layers.some((layer) => layer.status === 'online')) return 'online'
  if (layers.some((layer) => layer.status === 'attention')) return 'attention'
  if (layers.some((layer) => layer.status === 'missing-config')) return 'missing-config'
  return 'inactive'
}

function layerGroupFreshness(entityCount: number, staleCount: number): WorldwatchLayerGroupSummary['freshnessHeat'] {
  if (entityCount === 0) return 'empty'
  if (staleCount === 0) return 'fresh'
  if (staleCount === entityCount) return 'stale'
  return 'mixed'
}

function CategoryGlyph({ category }: { category: string }) {
  const normalized = categoryClass(category)
  if (normalized.includes('market') || normalized.includes('macro')) return <Activity aria-hidden="true" size={8} />
  if (normalized.includes('cyber') || normalized.includes('vulnerab')) return <ShieldCheck aria-hidden="true" size={8} />
  if (normalized.includes('infrastructure')) return <Factory aria-hidden="true" size={8} />
  if (normalized.includes('commodit') || normalized.includes('energy')) return <Zap aria-hidden="true" size={8} />
  if (normalized.includes('geopolitic') || normalized.includes('country') || normalized.includes('policy')) return <Landmark aria-hidden="true" size={8} />
  if (normalized.includes('research')) return <BookOpen aria-hidden="true" size={8} />
  return <RadioTower aria-hidden="true" size={8} />
}

function EntityGraphOverlay({
  graph,
  onSelectEvent,
}: {
  graph: EntityGraphModel
  onSelectEvent: (eventId: string) => void
}) {
  return (
    <div className="entity-graph-overlay" aria-label="Entity relationship graph">
      {graph.nodes.length === 0 ? (
        <div className="entity-graph-empty">
          <Network size={18} />
          <p>No connected entities in this view.</p>
        </div>
      ) : null}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {graph.edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.source.x}
            x2={edge.target.x}
            y1={edge.source.y}
            y2={edge.target.y}
          />
        ))}
      </svg>
      {graph.nodes.map((node) => (
        <button
          className={`entity-graph-node node-${node.kind}${node.active ? ' active' : ''}`}
          key={node.id}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          type="button"
          onClick={() => onSelectEvent(node.eventId)}
        >
          <span>{node.kind}</span>
          <strong>{node.label}</strong>
        </button>
      ))}
    </div>
  )
}

function buildCockpitMarkers(
  layerEntities: WorldwatchEntity[],
  eventFallbackMarkers: WorldIntelEvent[],
  events: WorldIntelEvent[],
  now: number,
): CockpitVisualMarker[] {
  const eventById = new Map(events.map((event) => [event.id, event]))
  if (layerEntities.length > 0) {
    return layerEntities.map((entity, index) => {
      const event = eventById.get(entity.eventId)
      const position = cockpitEntityPosition(entity, index)
      const confidence = normalizeConfidence(entity.proof.confidence)
      const freshness = timelineFreshness(entity.timestamp, now) / 100
      return {
        id: entity.id,
        eventId: entity.eventId,
        label: compactLabel(entity.label),
        summary: entity.summary,
        x: position.x,
        y: position.y,
        trust: entity.visualTrust,
        severity: event?.severity ?? 'watch',
        stale: entity.stale,
        sourceId: entity.sourceId,
        layerId: entity.layerId,
        category: event?.category ?? entity.kind,
        region: entity.region,
        timestamp: entity.timestamp,
        confidence,
        freshness,
        visualOpacity: visualOpacityFor(confidence, freshness, entity.stale),
      }
    })
  }

  return eventFallbackMarkers.map((event, index) => {
    const position = cockpitMarkerPosition(event, index)
    const confidence = normalizeConfidence(event.confidence)
    const freshness = timelineFreshness(event.timestamp, now) / 100
    return {
      id: event.id,
      eventId: event.id,
      label: compactLabel(event.affectedAssets[0] ?? event.extractedEntities[0] ?? event.category),
      summary: event.summary,
      x: position.x,
      y: position.y,
      trust: event.provenance === 'media-observation' ? 'media' : event.provenance === 'public-disclosure' ? 'official' : 'public',
      severity: event.severity,
      stale: false,
      sourceId: event.sourceId,
      category: event.category,
      region: event.region,
      timestamp: event.timestamp,
      confidence,
      freshness,
      visualOpacity: visualOpacityFor(confidence, freshness, false),
    }
  })
}

function buildMarkerClusters(markers: CockpitVisualMarker[]) {
  const buckets = new Map<
    string,
    {
      id: string
      xTotal: number
      yTotal: number
      count: number
      eventId: string
      region: string
      category: string
      timestamp: number
    }
  >()

  for (const marker of markers) {
    const regionKey = regionClusterKey(marker.region)
    const key = `${regionKey}:${categoryClass(marker.category)}`
    const current = buckets.get(key)
    if (!current) {
      buckets.set(key, {
        id: key,
        xTotal: marker.x,
        yTotal: marker.y,
        count: 1,
        eventId: marker.eventId,
        region: regionKey,
        category: marker.category,
        timestamp: marker.timestamp,
      })
      continue
    }
    current.xTotal += marker.x
    current.yTotal += marker.y
    current.count += 1
    if (marker.timestamp > current.timestamp) {
      current.eventId = marker.eventId
      current.timestamp = marker.timestamp
    }
  }

  return [...buckets.values()]
    .filter((bucket) => bucket.count >= 3)
    .map((bucket) => ({
      id: bucket.id,
      x: clampPercent(bucket.xTotal / bucket.count),
      y: clampPercent(bucket.yTotal / bucket.count),
      count: bucket.count,
      eventId: bucket.eventId,
      region: bucket.region,
      category: bucket.category,
    }))
    .slice(0, 12)
}

function buildRegionalHeatRings(markers: CockpitVisualMarker[]): CockpitHeatRing[] {
  const buckets = new Map<
    string,
    {
      xTotal: number
      yTotal: number
      count: number
      region: string
      category: string
      confidenceTotal: number
    }
  >()

  for (const marker of markers) {
    const region = regionClusterKey(marker.region)
    const key = `${region}:${categoryClass(marker.category)}`
    const current = buckets.get(key)
    if (!current) {
      buckets.set(key, {
        xTotal: marker.x,
        yTotal: marker.y,
        count: 1,
        region,
        category: marker.category,
        confidenceTotal: marker.confidence,
      })
      continue
    }
    current.xTotal += marker.x
    current.yTotal += marker.y
    current.count += 1
    current.confidenceTotal += marker.confidence
  }

  return [...buckets.entries()]
    .filter(([, bucket]) => bucket.count >= 2)
    .map(([id, bucket]) => {
      const confidence = bucket.confidenceTotal / bucket.count
      return {
        id,
        x: clampPercent(bucket.xTotal / bucket.count),
        y: clampPercent(bucket.yTotal / bucket.count),
        count: bucket.count,
        size: Math.min(132, 38 + bucket.count * 14),
        opacity: Number(Math.min(0.62, 0.2 + confidence * 0.32).toFixed(2)),
        region: bucket.region,
        category: bucket.category,
      }
    })
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)
}

function buildCockpitConnections(
  selected: CockpitVisualMarker | undefined,
  markers: CockpitVisualMarker[],
): CockpitConnection[] {
  if (!selected) return []
  const scored = markers
    .filter((marker) => marker.id !== selected.id)
    .map((marker) => {
      const sharedRegion = regionClusterKey(marker.region) === regionClusterKey(selected.region)
      const sharedSource = marker.sourceId === selected.sourceId
      const sharedCategory = categoryClass(marker.category) === categoryClass(selected.category)
      const sharedLayer = marker.layerId && marker.layerId === selected.layerId
      const score = Number(sharedRegion) + Number(sharedSource) + Number(sharedCategory) + Number(sharedLayer)
      const reason = sharedSource
        ? 'same source'
        : sharedLayer
          ? 'same layer'
          : sharedRegion
            ? 'same region'
            : sharedCategory
              ? 'same category'
              : ''
      return { marker, score, reason }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.marker.timestamp - left.marker.timestamp)
    .slice(0, 8)
    .map((item) => ({
      source: selected,
      target: item.marker,
      strength: (item.score >= 2 ? 'primary' : 'secondary') as CockpitConnection['strength'],
      reason: item.reason,
    }))

  if (scored.length > 0) return scored

  return markers
    .filter((marker) => marker.id !== selected.id)
    .map((marker) => ({
      marker,
      distance: Math.hypot(marker.x - selected.x, marker.y - selected.y),
    }))
    .filter((item) => item.distance <= 18)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 5)
    .map((item) => ({
      source: selected,
      target: item.marker,
      strength: 'secondary' as const,
      reason: 'nearby in view',
    }))
}

function connectionArcPath(edge: CockpitConnection) {
  const midX = (edge.source.x + edge.target.x) / 2
  const midY = (edge.source.y + edge.target.y) / 2
  const lift = Math.min(14, Math.max(5, Math.hypot(edge.source.x - edge.target.x, edge.source.y - edge.target.y) * 0.16))
  return `M ${edge.source.x} ${edge.source.y} Q ${midX} ${midY - lift} ${edge.target.x} ${edge.target.y}`
}

function buildConnectedChips(
  selected: WorldIntelEvent,
  entity: WorldwatchEntity | undefined,
  edges: CockpitConnection[],
) {
  const chips = [
    selected.region,
    ...selected.countryCodes,
    ...selected.affectedAssets,
    ...selected.affectedSectors,
    ...selected.affectedCommodities,
    ...selected.extractedEntities,
    ...(entity?.exposureContext ?? []),
    ...edges.slice(0, 3).map((edge) => `${edge.reason}: ${edge.target.label}`),
  ]
  return [...new Set(chips.filter(Boolean))].slice(0, 14)
}

function buildConnectedRegions(selected: WorldIntelEvent, edges: CockpitConnection[]) {
  const regions = [selected.region, ...selected.countryCodes, ...edges.map((edge) => edge.target.region)]
  const uniqueRegions = [...new Set(regions.filter(Boolean))]
  return uniqueRegions.length > 0 ? uniqueRegions.slice(0, 8) : ['No connected region in current window']
}

function buildConnectedMarkets(selected: WorldIntelEvent, entity: WorldwatchEntity | undefined) {
  const markets = [
    ...selected.affectedAssets,
    ...selected.affectedCurrencies,
    ...selected.affectedCommodities,
    ...selected.affectedSectors,
    ...(entity?.exposureContext ?? []),
  ]
  const uniqueMarkets = [...new Set(markets.filter(Boolean))]
  return uniqueMarkets.length > 0 ? uniqueMarkets.slice(0, 8) : ['No connected market evidence']
}

/**
 * The infrastructure -> company -> market-sector exposure chain for the dossier.
 * Built only from source-backed fields (operator + fuel-derived sectors); empty
 * when the event has no such chain. No ticker guessing, no price/trading claim.
 */
function buildExposureChain(selected: WorldIntelEvent): Array<{ kind: string; label: string; values: string[] }> {
  const site = selected.infrastructureSite
  if (!site) return []
  const steps: Array<{ kind: string; label: string; values: string[] }> = [
    { kind: 'facility', label: 'Facility', values: [site.name + (site.capacity ? ` · ${site.capacity}` : '')] },
  ]
  if (site.operator) steps.push({ kind: 'company', label: 'Operator / owner', values: [site.operator] })
  if (selected.affectedSectors.length > 0) {
    steps.push({ kind: 'sector', label: 'Market sectors', values: selected.affectedSectors.slice(0, 5) })
  }
  return steps
}

function buildWhatChanged(selected: WorldIntelEvent, entity: WorldwatchEntity | undefined, now: number) {
  const changes = [
    `${formatEventAge(selected.timestamp, now)} source-backed record entered this view.`,
    entity?.layerId ? `Source proof is present for the ${entity.layerId.replaceAll('-', ' ')} layer.` : undefined,
    entity?.stale ? 'Freshness is stale or expired; Atlasz keeps it visible as stale evidence.' : undefined,
    selected.narrativeTags.length ? `Tags in view: ${selected.narrativeTags.slice(0, 3).join(', ')}.` : undefined,
    selected.extractedEntities.length ? `Entities in the record: ${selected.extractedEntities.slice(0, 3).join(', ')}.` : undefined,
  ].filter((change): change is string => Boolean(change))
  return changes.slice(0, 4)
}

function buildEntityGraph(
  events: WorldIntelEvent[],
  selected: WorldIntelEvent | undefined,
  sources: OsintSourceSnapshot[],
): EntityGraphModel {
  const sourceNameById = new Map(sources.map((source) => [source.sourceId, source.sourceName]))
  const scopedEvents = selected
    ? [
        selected,
        ...events
          .filter((event) => event.id !== selected.id)
          .filter((event) => graphEventRelatedness(selected, event) > 0)
          .sort((left, right) => graphEventRelatedness(selected, right) - graphEventRelatedness(selected, left) || right.timestamp - left.timestamp)
          .slice(0, 8),
      ]
    : events.slice(0, 9)
  const nodes = new Map<string, EntityGraphNode>()
  const edges: EntityGraphEdge[] = []
  const kindCounts = new Map<EntityGraphNodeKind, number>()

  const addNode = (kind: EntityGraphNodeKind, id: string, label: string, eventId: string, active: boolean) => {
    const existing = nodes.get(id)
    if (existing) {
      if (active) existing.active = true
      return existing
    }
    const order = kindCounts.get(kind) ?? 0
    kindCounts.set(kind, order + 1)
    const position = entityGraphNodePosition(kind, order, active)
    const node: EntityGraphNode = {
      id,
      kind,
      label: compactLabel(label),
      eventId,
      active,
      ...position,
    }
    nodes.set(id, node)
    return node
  }

  const addEdge = (source: EntityGraphNode, target: EntityGraphNode) => {
    const id = `${source.id}->${target.id}`
    if (edges.some((edge) => edge.id === id)) return
    edges.push({ id, sourceId: source.id, targetId: target.id, source, target })
  }

  for (const event of scopedEvents) {
    const active = event.id === selected?.id
    const eventNode = addNode('event', `event:${event.id}`, event.title, event.id, active)
    const sourceNode = addNode('source', `source:${event.sourceId}`, sourceNameById.get(event.sourceId) ?? event.sourceId, event.id, active)
    addEdge(eventNode, sourceNode)

    for (const code of event.countryCodes.slice(0, 4)) {
      addEdge(eventNode, addNode('country', `country:${code}`, code, event.id, active))
    }
    for (const asset of [...event.affectedAssets, ...event.extractedEntities].slice(0, 5)) {
      addEdge(eventNode, addNode('market', `market:${asset}`, asset, event.id, active))
    }
    for (const sector of event.affectedSectors.slice(0, 3)) {
      addEdge(eventNode, addNode('sector', `sector:${sector}`, sector, event.id, active))
    }
    for (const commodity of event.affectedCommodities.slice(0, 3)) {
      addEdge(eventNode, addNode('commodity', `commodity:${commodity}`, commodity, event.id, active))
    }
  }

  const orderedNodes = [...nodes.values()]
    .sort((left, right) => Number(right.active) - Number(left.active) || graphKindOrder(left.kind) - graphKindOrder(right.kind))
    .slice(0, 34)
  const visibleNodeIds = new Set(orderedNodes.map((node) => node.id))
  return {
    nodes: orderedNodes,
    edges: edges.filter((edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)).slice(0, 48),
  }
}

function graphEventRelatedness(selected: WorldIntelEvent, event: WorldIntelEvent) {
  const selectedCountries = new Set(selected.countryCodes)
  const selectedAssets = new Set(selected.affectedAssets)
  return (
    Number(selected.sourceId === event.sourceId) +
    Number(categoryClass(selected.category) === categoryClass(event.category)) +
    Number(selected.region === event.region) +
    Number(event.countryCodes.some((code) => selectedCountries.has(code))) +
    Number(event.affectedAssets.some((asset) => selectedAssets.has(asset)))
  )
}

function entityGraphNodePosition(kind: EntityGraphNodeKind, order: number, active: boolean) {
  if (active && kind === 'event') return { x: 50, y: 50 }
  const anchors: Record<EntityGraphNodeKind, { x: number; y: number; radius: number }> = {
    event: { x: 50, y: 50, radius: 18 },
    country: { x: 28, y: 34, radius: 16 },
    market: { x: 70, y: 34, radius: 18 },
    source: { x: 50, y: 73, radius: 16 },
    sector: { x: 70, y: 63, radius: 15 },
    commodity: { x: 30, y: 63, radius: 15 },
  }
  const anchor = anchors[kind]
  const angle = order * 1.9 + graphKindOrder(kind) * 0.42
  return {
    x: clampPercent(anchor.x + Math.cos(angle) * anchor.radius),
    y: clampPercent(anchor.y + Math.sin(angle) * anchor.radius * 0.72),
  }
}

function graphKindOrder(kind: EntityGraphNodeKind) {
  const order: Record<EntityGraphNodeKind, number> = {
    event: 0,
    source: 1,
    country: 2,
    market: 3,
    sector: 4,
    commodity: 5,
  }
  return order[kind]
}

function buildWhyThisMatters(selected: WorldIntelEvent, entity: WorldwatchEntity | undefined) {
  const reasons = [
    `${selected.region} is active in the current Worldwatch window.`,
    selected.affectedAssets.length
      ? `Connected market/entity context: ${selected.affectedAssets.slice(0, 3).join(', ')}.`
      : undefined,
    selected.affectedCommodities.length
      ? `Commodity context present: ${selected.affectedCommodities.slice(0, 3).join(', ')}.`
      : undefined,
    entity?.layerId ? `Rendered through the ${entity.layerId.replaceAll('-', ' ')} layer with source proof.` : undefined,
    selected.provenance === 'media-observation'
      ? 'Media observation stays low-trust until corroborated by stronger evidence.'
      : `Provenance is ${selected.provenance}; confidence is bounded by the source trail.`,
  ].filter((reason): reason is string => Boolean(reason))
  return reasons.slice(0, 4)
}

function buildTimelineDensityBands(events: WorldIntelEvent[], now: number): TimelineDensityBand[] {
  const windows = [
    { id: '0', label: '0-1h', maxAgeMs: 60 * 60_000 },
    { id: '1', label: '1-6h', maxAgeMs: 6 * 60 * 60_000 },
    { id: '2', label: '6-24h', maxAgeMs: 24 * 60 * 60_000 },
    { id: '3', label: '1-7d', maxAgeMs: 7 * 24 * 60 * 60_000 },
  ]
  return windows.map((windowItem, index) => {
    const minAgeMs = index === 0 ? 0 : windows[index - 1].maxAgeMs
    const eventsInBand = events.filter((event) => {
      const age = now - event.timestamp
      return age >= minAgeMs && age < windowItem.maxAgeMs
    })
    return {
      id: windowItem.id,
      label: windowItem.label,
      category: dominantCategory(eventsInBand),
      count: eventsInBand.length,
    }
  })
}

function dominantCategory(events: WorldIntelEvent[]) {
  const counts = new Map<string, number>()
  for (const event of events) {
    const category = categoryClass(event.category)
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'other'
}

function timelineFreshness(timestamp: number, now: number) {
  const age = Math.max(0, now - timestamp)
  const dayMs = 24 * 60 * 60_000
  return Math.round(Math.max(8, 100 - (age / dayMs) * 92))
}

function normalizeConfidence(value: number) {
  if (!Number.isFinite(value)) return 0.35
  return Math.max(0.08, Math.min(1, value <= 1 ? value : value / 100))
}

function visualOpacityFor(confidence: number, freshness: number, stale: boolean) {
  const opacity = Math.max(0.34, Math.min(1, 0.28 + confidence * 0.52 + freshness * 0.2))
  return Number((stale ? opacity * 0.58 : opacity).toFixed(2))
}

function sourceConstellationCategories(sources: OsintSourceSnapshot[]) {
  const categories = [...new Set(sources.map(sourceCategoryLabel))]
  return ['all', ...categories.slice(0, 5)]
}

function sourceCategoryLabel(source: OsintSourceSnapshot) {
  const raw = `${source.category ?? source.sourceType}`.trim().toLowerCase()
  if (raw.includes('market') || raw.includes('sec')) return 'markets'
  if (raw.includes('cyber') || raw.includes('vulnerab') || raw.includes('cve')) return 'cyber'
  if (raw.includes('weather') || raw.includes('earth') || raw.includes('hazard')) return 'events'
  if (raw.includes('policy') || raw.includes('government') || raw.includes('regulator')) return 'government'
  if (raw.includes('trade') || raw.includes('port') || raw.includes('logistics')) return 'supply'
  if (raw.includes('research') || raw.includes('patent') || raw.includes('crossref') || raw.includes('openalex')) return 'research'
  return raw || 'other'
}

function sourceStatusGroup(source: OsintSourceSnapshot) {
  if (source.status === 'online') return 'live'
  if (source.status === 'disabled' || source.refreshState === 'missing-key') return 'locked'
  if (source.status === 'failed' || source.status === 'rate-limited' || source.status === 'offline') return 'attention'
  return 'attention'
}

function sourceNodePosition(source: OsintSourceSnapshot, index: number, total: number) {
  const category = `${source.category ?? source.sourceType}`.toLowerCase()
  const anchors = category.includes('market') || category.includes('sec')
    ? { x: 63, y: 42 }
    : category.includes('cyber') || category.includes('vulnerab')
      ? { x: 58, y: 65 }
      : category.includes('weather') || category.includes('earth') || category.includes('climate')
        ? { x: 35, y: 34 }
        : category.includes('policy') || category.includes('government')
          ? { x: 38, y: 66 }
          : category.includes('trade') || category.includes('port') || category.includes('logistics')
            ? { x: 70, y: 62 }
            : { x: 50, y: 50 }
  const angle = (index / Math.max(1, total)) * Math.PI * 2
  const radius = 10 + (index % 5) * 3.4
  return {
    x: clampPercent(anchors.x + Math.cos(angle) * radius),
    y: clampPercent(anchors.y + Math.sin(angle) * radius * 0.72),
  }
}

function humanSourceStatus(source: OsintSourceSnapshot) {
  if (source.refreshState === 'missing-key') return 'Locked until configured'
  if (source.status === 'online') return source.refreshState === 'not-due' ? 'Live, waiting for next cadence' : 'Live source'
  if (source.status === 'rate-limited') return 'Rate limited, backed off honestly'
  if (source.status === 'failed') return 'Needs attention'
  if (source.status === 'disabled') return 'Disabled or missing config'
  return source.status
}

function formatOptionalTime(timestamp?: number) {
  if (!timestamp) return 'no successful refresh yet'
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortHash(value: string) {
  return value.length <= 14 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`
}

function categoryClass(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other'
}

function regionClusterKey(region: string) {
  const normalized = region.toLowerCase()
  if (normalized.includes('asia') || normalized.includes('china') || normalized.includes('japan') || normalized.includes('taiwan') || normalized.includes('korea')) {
    return 'APAC'
  }
  if (normalized.includes('europe') || normalized.includes('africa') || normalized.includes('middle') || normalized.includes('red sea')) {
    return 'EMEA'
  }
  if (normalized.includes('global')) return 'Global'
  return 'Americas'
}

function compactLabel(label: string) {
  return label.length > 24 ? `${label.slice(0, 22)}...` : label
}

function cockpitMarkerPosition(event: WorldIntelEvent, index: number) {
  if (typeof event.lat === 'number' && typeof event.lon === 'number') {
    return {
      x: clampPercent(((event.lon + 180) / 360) * 100),
      y: clampPercent(((90 - event.lat) / 180) * 100),
    }
  }
  const region = `${event.region} ${event.countryCodes.join(' ')}`.toLowerCase()
  const base = region.includes('asia') || region.includes('china') || region.includes('japan') || region.includes('taiwan')
    ? { x: 74, y: 43 }
    : region.includes('europe') || region.includes('africa') || region.includes('middle') || region.includes('red sea')
      ? { x: 52, y: 45 }
      : { x: 27, y: 43 }
  return {
    x: clampPercent(base.x + ((index % 5) - 2) * 4),
    y: clampPercent(base.y + (Math.floor(index / 5) % 5 - 2) * 5),
  }
}

function cockpitEntityPosition(entity: WorldwatchEntity, index: number) {
  if (typeof entity.lat === 'number' && typeof entity.lon === 'number') {
    return {
      x: clampPercent(((entity.lon + 180) / 360) * 100),
      y: clampPercent(((90 - entity.lat) / 180) * 100),
    }
  }
  const region = `${entity.region} ${entity.countryCodes.join(' ')}`.toLowerCase()
  const base = region.includes('asia') || region.includes('china') || region.includes('japan') || region.includes('taiwan')
    ? { x: 74, y: 43 }
    : region.includes('europe') || region.includes('africa') || region.includes('middle') || region.includes('red sea')
      ? { x: 52, y: 45 }
      : { x: 27, y: 43 }
  return {
    x: clampPercent(base.x + ((index % 7) - 3) * 3),
    y: clampPercent(base.y + (Math.floor(index / 7) % 6 - 2) * 4),
  }
}

function formatEventConfidence(value: number) {
  return `${Math.round(value <= 1 ? value * 100 : value)}%`
}

function formatEventAge(timestamp: number, now: number) {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function clampPercent(value: number) {
  return Math.min(94, Math.max(6, value))
}

function buildSearchResults(query: string, snapshot: WorldIntelSnapshot, events: WorldIntelEvent[]) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return { events, countries: snapshot.countries, assets: snapshot.assetIdentities }
  }
  return {
    events: events.filter((event) =>
      [event.title, event.summary, event.region, event.category, ...event.narrativeTags, ...event.extractedEntities, ...event.affectedAssets]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    ),
    countries: snapshot.countries.filter((country) =>
      [country.countryCode, country.countryName, country.currency, ...country.topCurrentHeadlines, ...country.affectedTickers]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    ),
    assets: snapshot.assetIdentities.filter((asset) =>
      [asset.symbol, asset.name, asset.type, asset.exchangeOrSource, ...asset.aliases, ...asset.watchlistTags]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    ),
  }
}
