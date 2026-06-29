import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Activity, AlertTriangle, Database, Globe2, Layers3, Link2, MapPinned, Search, ShieldCheck, Signal } from 'lucide-react'
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

// Lazy child surfaces — kept out of the startup bundle and isolated so future
// heavy globe / quant libraries load only when this view is open.
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
  const toggleWorldwatchLayer = (layerId: WorldwatchLayerId) => {
    setActiveLayerIds((current) =>
      current.includes(layerId) ? current.filter((currentLayerId) => currentLayerId !== layerId) : [...current, layerId],
    )
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
      <section className="world-command-band worldwatch-command-deck">
        <div>
          <span>Aegis Worldwatch</span>
          <h3>Living world intelligence: what changed, where it happened, what proves it, and what connects.</h3>
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
            sources={snapshot.sources}
            windowId={windowId}
            windows={worldWindows}
            onSelectEvent={selectCockpitEvent}
            onToggleLayer={toggleWorldwatchLayer}
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
          <span>Intelligence Timeline</span>
          <strong>{visibleEvents.length} events in view</strong>
        </header>
        <div className="worldwatch-timeline-track">
          {visibleEvents.slice(0, 16).map((event, index) => (
            <button
              className={selectedCockpitEvent?.id === event.id ? `timeline-node active severity-${event.severity}` : `timeline-node severity-${event.severity}`}
              key={event.id}
              style={{ '--timeline-index': index } as CSSProperties}
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
  const online = sources.filter((source) => source.status === 'online').length
  const attention = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
  const locked = sources.filter((source) => source.status === 'disabled' || source.refreshState === 'missing-key').length
  const displayedSources = sources.slice(0, 36)

  return (
    <section className="source-constellation" aria-label="Source health constellation">
      <header>
        <div>
          <span>Source Constellation</span>
          <h4>{online}/{sources.length} live sources</h4>
        </div>
        <strong className={`source-orbit-state state-${status}`}>{status}</strong>
      </header>
      <div className="source-orbit-field">
        <div className="source-orbit-core">
          <Signal size={18} />
          <span>Atlasz</span>
        </div>
        {displayedSources.map((source, index) => {
          const angle = (index / Math.max(1, displayedSources.length)) * Math.PI * 2
          const radius = 34 + (index % 4) * 12
          const x = 50 + Math.cos(angle) * radius
          const y = 50 + Math.sin(angle) * radius * 0.72
          return (
            <span
              aria-label={`${source.sourceName}: ${source.status}`}
              className={`source-node source-${source.status}`}
              key={source.sourceId}
              style={{ left: `${clampPercent(x)}%`, top: `${clampPercent(y)}%` }}
              title={`${source.sourceName} · ${source.status}`}
            />
          )
        })}
      </div>
      <div className="source-constellation-legend">
        <span><i className="source-online" /> Live {online}</span>
        <span><i className="source-rate-limited" /> Limited {attention}</span>
        <span><i className="source-disabled" /> Locked {locked}</span>
      </div>
    </section>
  )
}

function WorldwatchCockpit({
  activeLayerIds,
  events,
  layerSnapshot,
  now,
  selectedEvent,
  sources,
  windowId,
  windows,
  onSelectEvent,
  onToggleLayer,
  onWindowChange,
}: {
  activeLayerIds: WorldwatchLayerId[]
  events: WorldIntelEvent[]
  layerSnapshot: WorldwatchLayerSnapshot
  now: number
  selectedEvent?: WorldIntelEvent
  sources: OsintSourceSnapshot[]
  windowId: WorldWindowId
  windows: typeof worldWindows
  onSelectEvent: (eventId: string) => void
  onToggleLayer: (layerId: WorldwatchLayerId) => void
  onWindowChange: (id: WorldWindowId) => void
}) {
  const activeLayerSet = new Set(activeLayerIds)
  const onlineSources = sources.filter((source) => source.status === 'online').length
  const attentionSources = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
  const layerEntities = layerSnapshot.entities
    .filter((entity) => activeLayerSet.has(entity.layerId))
    .slice(0, 80)
  const eventFallbackMarkers = layerEntities.length === 0 ? events.slice(0, 28) : []
  const selected = selectedEvent ?? events[0]

  return (
    <article className="atlasz-cockpit" aria-label="Atlasz Worldwatch cockpit">
      <header className="cockpit-header">
        <div>
          <span>Aegis Worldwatch Cockpit</span>
          <h3>Evidence map, live layers, selected dossier, and source health.</h3>
        </div>
        <div className="cockpit-metric-strip">
          <MetricPill icon={ShieldCheck} label="Proof Entities" value={String(layerEntities.length || events.length)} />
          <MetricPill icon={Database} label="Sources Online" value={`${onlineSources}/${sources.length}`} />
          <MetricPill icon={AlertTriangle} label="Attention" value={String(attentionSources)} />
        </div>
      </header>

      <div className="cockpit-body">
        <aside className="cockpit-layer-console" aria-label="Worldwatch layer console">
          <div className="cockpit-window-row">
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

          <div className="cockpit-layer-stack">
            {layerSnapshot.layers.map((layer) => (
              <button
                className={activeLayerSet.has(layer.id) ? 'active' : ''}
                disabled={layer.status === 'missing-config'}
                key={layer.id}
                type="button"
                onClick={() => onToggleLayer(layer.id)}
              >
                <span>{layer.label}</span>
                <strong>{layer.entityCount}</strong>
                <em>{layer.status}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="cockpit-map-stage" aria-label="Proof-backed world map">
          <div className="cockpit-map-toolbar">
            <div>
              <MapPinned size={15} />
              <span>{layerEntities.length || eventFallbackMarkers.length} source-backed markers</span>
            </div>
            <div>
              <Layers3 size={15} />
              <span>{activeLayerIds.length} active layers</span>
            </div>
          </div>

          <div className="cockpit-map-plane">
            <span className="cockpit-region region-americas">Americas</span>
            <span className="cockpit-region region-emea">EMEA</span>
            <span className="cockpit-region region-apac">APAC</span>
            {layerEntities.length === 0 && eventFallbackMarkers.length === 0 ? (
              <div className="cockpit-empty-map">
                <Globe2 size={20} />
                <p>No proof-backed entities in this window. Atlasz is not rendering filler markers.</p>
              </div>
            ) : (
              <>
                {layerEntities.map((entity, index) => {
                  const position = cockpitEntityPosition(entity, index)
                  return (
                    <button
                      aria-label={`Select ${entity.label}`}
                      className={`cockpit-marker marker-${entity.visualTrust}${entity.stale ? ' stale' : ''}${selected?.id === entity.eventId ? ' active' : ''}`}
                      key={entity.id}
                      style={{ left: `${position.x}%`, top: `${position.y}%` }}
                      type="button"
                      onClick={() => onSelectEvent(entity.eventId)}
                    >
                      <span />
                      <strong>{entity.label}</strong>
                    </button>
                  )
                })}
                {eventFallbackMarkers.map((event, index) => {
                  const position = cockpitMarkerPosition(event, index)
                  return (
                    <button
                      aria-label={`Select ${event.title}`}
                      className={`cockpit-marker severity-${event.severity}${selected?.id === event.id ? ' active' : ''}`}
                      key={event.id}
                      style={{ left: `${position.x}%`, top: `${position.y}%` }}
                      type="button"
                      onClick={() => onSelectEvent(event.id)}
                    >
                      <span />
                      <strong>{event.affectedAssets[0] ?? event.category}</strong>
                    </button>
                  )
                })}
              </>
            )}
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
                <FreshnessBadge now={now} retrievedAt={selected.timestamp} size="sm" />
                <span>{formatEventConfidence(selected.confidence)} confidence</span>
              </div>
              <div className="cockpit-tag-grid">
                {[...selected.affectedAssets, ...selected.affectedCommodities, ...selected.extractedEntities].slice(0, 8).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="cockpit-nonclaim">
                <strong>Boundary</strong>
                <p>Source-backed context only. No outage, damage, prediction, or trading recommendation is inferred.</p>
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
