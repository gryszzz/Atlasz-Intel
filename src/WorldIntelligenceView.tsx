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
  const timelineDensityBands = useMemo(() => buildTimelineDensityBands(visibleEvents, now), [now, visibleEvents])
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
        <div className="worldwatch-timeline-track">
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
  const online = sources.filter((source) => source.status === 'online').length
  const attention = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
  const locked = sources.filter((source) => source.status === 'disabled' || source.refreshState === 'missing-key').length
  const displayedSources = sources.slice(0, 36)
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
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const activeLayerSet = useMemo(() => new Set(activeLayerIds), [activeLayerIds])
  const onlineSources = sources.filter((source) => source.status === 'online').length
  const attentionSources = sources.filter((source) => ['failed', 'rate-limited', 'offline'].includes(source.status)).length
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
    () => buildCockpitMarkers(layerEntities, eventFallbackMarkers, events),
    [eventFallbackMarkers, events, layerEntities],
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
  const connectionEdges = useMemo(() => buildCockpitConnections(selectedMarker, plottedMarkers), [plottedMarkers, selectedMarker])
  const selectedEntity = selected ? layerEntities.find((entity) => entity.eventId === selected.id) : undefined
  const selectedSource = selected ? sources.find((source) => source.sourceId === selected.sourceId) : undefined
  const connectedChips = selected ? buildConnectedChips(selected, selectedEntity, connectionEdges) : []
  const whyThisMatters = selected ? buildWhyThisMatters(selected, selectedEntity) : []
  const mapStyle = {
    '--focus-x': `${selectedMarker?.x ?? 50}%`,
    '--focus-y': `${selectedMarker?.y ?? 50}%`,
  } as CSSProperties

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
              <span>{plottedMarkers.length} source-backed markers</span>
            </div>
            <div>
              <Layers3 size={15} />
              <span>{activeLayerIds.length} active layers</span>
            </div>
          </div>

          <div className="cockpit-map-plane" style={mapStyle}>
            <span className="cockpit-starfield" />
            <span className="cockpit-earth-glow" />
            <span className="cockpit-terminator" />
            <span className="cockpit-cloud-layer cloud-a" />
            <span className="cockpit-cloud-layer cloud-b" />
            <span className="cockpit-country-lines" />
            <span className="cockpit-landmass land-americas" />
            <span className="cockpit-landmass land-emea" />
            <span className="cockpit-landmass land-apac" />
            <span className="cockpit-focus-reticle" />
            <span className="cockpit-region region-americas">Americas</span>
            <span className="cockpit-region region-emea">EMEA</span>
            <span className="cockpit-region region-apac">APAC</span>
            {plottedMarkers.length === 0 ? (
              <div className="cockpit-empty-map">
                <Globe2 size={20} />
                <p>No proof-backed entities in this window. Atlasz is not rendering filler markers.</p>
              </div>
            ) : (
              <>
                <svg className="cockpit-connection-overlay" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {connectionEdges.map((edge) => (
                    <line
                      className={`connection-strength-${edge.strength}`}
                      key={`${edge.source.id}:${edge.target.id}`}
                      x1={edge.source.x}
                      y1={edge.source.y}
                      x2={edge.target.x}
                      y2={edge.target.y}
                    />
                  ))}
                </svg>
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
                    style={{ left: `${marker.x}%`, top: `${marker.y}%`, '--marker-index': index } as CSSProperties}
                    type="button"
                    onClick={() => onSelectEvent(marker.eventId)}
                    onMouseEnter={() => setHoveredMarkerId(marker.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                    onFocus={() => setHoveredMarkerId(marker.id)}
                    onBlur={() => setHoveredMarkerId(null)}
                  >
                    <span className="marker-core" />
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
              <div className="cockpit-proof-card">
                <span>Source Trail</span>
                <strong>{selectedSource?.sourceName ?? selected.sourceId}</strong>
                <p>
                  {selected.rawPayloadHash ? `Payload ${shortHash(selected.rawPayloadHash)}` : 'Payload hash unavailable'} · {formatOptionalTime(selected.timestamp)}
                </p>
              </div>
              <div className="cockpit-dossier-section">
                <span>Why this matters</span>
                <ul>
                  {whyThisMatters.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="cockpit-tag-grid">
                {connectedChips.slice(0, 12).map((item) => (
                  <span key={item}>{item}</span>
                ))}
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

function buildCockpitMarkers(
  layerEntities: WorldwatchEntity[],
  eventFallbackMarkers: WorldIntelEvent[],
  events: WorldIntelEvent[],
): CockpitVisualMarker[] {
  const eventById = new Map(events.map((event) => [event.id, event]))
  if (layerEntities.length > 0) {
    return layerEntities.map((entity, index) => {
      const event = eventById.get(entity.eventId)
      const position = cockpitEntityPosition(entity, index)
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
      }
    })
  }

  return eventFallbackMarkers.map((event, index) => {
    const position = cockpitMarkerPosition(event, index)
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
