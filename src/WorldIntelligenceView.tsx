import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  GlobeSkeleton,
  PanelSkeleton,
  QuantStripSkeleton,
  SourceHealthSkeleton,
} from './components/ui/Skeletons'
import type { UserFavorite, WorldIntelEvent, WorldIntelSnapshot } from './worldIntel'
import './WorldIntelligenceView.css'

// Lazy child surfaces — kept out of the startup bundle and isolated so future
// heavy globe / quant libraries load only when this view is open.
const WorldGlobeCanvas = lazy(() =>
  import('./components/world/WorldGlobeCanvas.lazy').then((m) => ({ default: m.WorldGlobeCanvas })),
)
const WorldEventTimeline = lazy(() =>
  import('./components/world/WorldEventTimeline.lazy').then((m) => ({ default: m.WorldEventTimeline })),
)
const WorldSourceHealthPanel = lazy(() =>
  import('./components/world/WorldSourceHealthPanel.lazy').then((m) => ({ default: m.WorldSourceHealthPanel })),
)
const WorldEntityDetailPanel = lazy(() =>
  import('./components/world/WorldEntityDetailPanel.lazy').then((m) => ({ default: m.WorldEntityDetailPanel })),
)
const WorldQuantStrip = lazy(() =>
  import('./components/world/WorldQuantStrip.lazy').then((m) => ({ default: m.WorldQuantStrip })),
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

const worldWindows: Array<{ id: WorldWindowId; label: string; durationMs: number }> = [
  { id: 'now', label: 'Now', durationMs: 30 * 60_000 },
  { id: '1h', label: '1H', durationMs: 60 * 60_000 },
  { id: '6h', label: '6H', durationMs: 6 * 60 * 60_000 },
  { id: '24h', label: '24H', durationMs: 24 * 60 * 60_000 },
  { id: '7d', label: '7D', durationMs: 7 * 24 * 60 * 60_000 },
]

export function WorldIntelligenceView({
  loading,
  onRefresh,
  onSelectEvent,
  onSelectTicker,
  onToggleFavorite,
  snapshot,
}: {
  loading: boolean
  onRefresh: () => Promise<void>
  onSelectEvent: (eventId: string) => void
  onSelectTicker: (ticker: string) => void
  onToggleFavorite: (kind: UserFavorite['kind'], targetId: string, label: string) => Promise<void>
  snapshot: WorldIntelSnapshot
}) {
  const [windowId, setWindowId] = useState<WorldWindowId>('24h')
  const [query, setQuery] = useState('')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  const activeWindow = worldWindows.find((item) => item.id === windowId) ?? worldWindows[3]
  const favoriteIds = useMemo(() => new Set(snapshot.favorites.map((favorite) => favorite.targetId)), [snapshot.favorites])
  const events = useMemo(
    () =>
      snapshot.worldEvents
        .filter((event) => now - event.timestamp <= activeWindow.durationMs)
        .sort((left, right) => right.timestamp - left.timestamp),
    [activeWindow.durationMs, now, snapshot.worldEvents],
  )
  const searchResults = useMemo(
    () => buildSearchResults(query, snapshot, events),
    [events, query, snapshot],
  )
  const visibleEvents = query.trim()
    ? events.filter((event) => searchResults.events.some((result) => result.id === event.id)).slice(0, 18)
    : events.slice(0, 18)
  const visibleCountries = query.trim()
    ? snapshot.countries.filter((country) => searchResults.countries.some((result) => result.countryCode === country.countryCode)).slice(0, 8)
    : snapshot.countries.slice(0, 8)
  const visibleAssets = query.trim()
    ? snapshot.assetIdentities.filter((asset) => searchResults.assets.some((result) => result.symbol === asset.symbol)).slice(0, 12)
    : snapshot.assetIdentities.slice(0, 12)

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

  return (
    <div className="world-intel-view">
      <section className="world-command-band">
        <div>
          <span>World Intelligence Terminal</span>
          <h3>Global events, countries, markets, narratives, and source trust in one local matrix.</h3>
        </div>
        <div className="world-command-actions">
          <div className="world-search">
            <Search size={15} />
            <input
              aria-label="Search world intelligence"
              placeholder="Search ticker, country, headline, narrative, infrastructure..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button type="button" onClick={() => void onRefresh()} disabled={loading}>
            {loading ? 'Refreshing' : 'Refresh OSINT'}
          </button>
        </div>
      </section>

      <Suspense fallback={<div className="world-panel world-quant-strip"><QuantStripSkeleton /></div>}>
        <WorldQuantStrip metrics={quantMetrics} />
      </Suspense>

      <section className="world-grid">
        <Suspense fallback={<div className="world-panel world-map-panel"><GlobeSkeleton /></div>}>
          <WorldGlobeCanvas
            events={visibleEvents}
            windows={worldWindows}
            windowId={windowId}
            onWindowChange={(id) => setWindowId(id as WorldWindowId)}
            onSelectEvent={onSelectEvent}
          />
        </Suspense>

        <Suspense fallback={<div className="world-panel world-status-panel"><SourceHealthSkeleton /></div>}>
          <WorldSourceHealthPanel sources={snapshot.sources} status={snapshot.status} />
        </Suspense>

        <Suspense fallback={<div className="world-panel world-events-panel"><PanelSkeleton rows={4} label="Loading event stream" /></div>}>
          <WorldEventTimeline
            events={visibleEvents}
            favoriteIds={favoriteIds}
            now={now}
            sourceTrust={snapshot.sourceTrust}
            onToggleFavorite={onToggleFavorite}
            onSelectEvent={onSelectEvent}
            onSelectTicker={onSelectTicker}
          />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading weather source trail" /></div>}>
          <WeatherAlertSourceTrail events={visibleEvents} />
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

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading UN Comtrade source trail" /></div>}>
          <ComtradeSourceTrail events={visibleEvents} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading OpenAlex source trail" /></div>}>
          <OpenAlexSourceTrail events={visibleEvents} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading Crossref source trail" /></div>}>
          <CrossrefSourceTrail events={visibleEvents} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading market identity source trail" /></div>}>
          <MarketIdentitySourceTrail events={visibleEvents} identities={snapshot.marketIdentities} now={now} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC company facts" /></div>}>
          <CompanyFactsSourceTrail events={visibleEvents} now={now} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC Form 4 insider transactions" /></div>}>
          <Form4SourceTrail events={visibleEvents} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading what to watch next" /></div>}>
          <WhatToWatchPanel events={visibleEvents} now={now} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading SEC Form 13F holdings" /></div>}>
          <Form13FSourceTrail events={visibleEvents} />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading ETF holdings" /></div>}>
          <EtfHoldingsSourceTrail events={visibleEvents} now={now} />
        </Suspense>

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

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading entity detail" /></div>}>
          <WorldEntityDetailPanel
            countries={visibleCountries}
            assets={visibleAssets}
            secFilings={snapshot.secFilings}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onSelectTicker={onSelectTicker}
          />
        </Suspense>

        <Suspense fallback={<div className="world-panel"><PanelSkeleton rows={3} label="Loading precedents" /></div>}>
          <HistoricalPlaybookPanel events={visibleEvents} />
        </Suspense>
      </section>
    </div>
  )
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
