import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Atom,
  Building2,
  ChevronDown,
  CircleDot,
  Clock3,
  Database,
  Globe2,
  Layers3,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react'
import { useWorldIntelSnapshot } from '../worldIntelStore'
import type { WorldIntelEvent } from '../worldIntel'
import type { WorldMode } from './model'
import { WorldRenderer } from './WorldRenderer'
import { worldEventFromLegacy } from './legacyBridge'
import { clusterWorldEvents } from './eventClustering'
import { scoreConvergence } from './convergence'
import { buildWorldBrief } from './briefing'
import './WorldShell.css'

type ModeSpec = {
  id: WorldMode
  label: string
  icon: typeof Globe2
  match: (event: WorldIntelEvent) => boolean
}

const MODES: ModeSpec[] = [
  { id: 'world', label: 'World', icon: Globe2, match: () => true },
  {
    id: 'capital',
    label: 'Capital',
    icon: TrendingUp,
    match: (event) =>
      event.category === 'markets' ||
      event.affectedAssets.length > 0 ||
      Boolean(event.form13fHolding || event.form4Transaction || event.etfHolding),
  },
  {
    id: 'trade',
    label: 'Trade',
    icon: Route,
    match: (event) =>
      Boolean(event.comtradeRecord || event.unLocode || event.worldPort) ||
      /trade|tariff|port|shipping|export|import/i.test(event.title + ' ' + event.summary),
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: Zap,
    match: (event) =>
      Boolean(
        event.eiaEnergyRecord ||
          event.eiaFacility ||
          event.eiaRefinery ||
          event.lngTerminal ||
          event.nuclearPlant ||
          event.nrcReactorStatus ||
          event.gridRegion,
      ) ||
      event.affectedCommodities.some((item) => /oil|gas|uranium|power|energy/i.test(item)),
  },
  {
    id: 'policy',
    label: 'Policy',
    icon: Building2,
    match: (event) =>
      Boolean(event.regulatoryDocument || event.ofacSanctionsRecord || event.congressBillAction) ||
      /policy|sanction|tariff|regulat|congress|government|central bank/i.test(event.title + ' ' + event.summary),
  },
  {
    id: 'chain',
    label: 'Chain',
    icon: Atom,
    match: (event) => /crypto|bitcoin|ethereum|solana|kaspa|blockchain|wallet|stablecoin/i.test(
      event.title + ' ' + event.summary + ' ' + event.affectedAssets.join(' '),
    ),
  },
  {
    id: 'risk',
    label: 'Risk',
    icon: ShieldCheck,
    match: (event) =>
      event.severity === 'critical' ||
      event.severity === 'elevated' ||
      Boolean(event.weatherAlert || event.earthquakeEvent || event.kevVulnerability || event.nvdCve),
  },
]

const TIME_WINDOWS = ['24H', '7D', '30D', '1Y'] as const

function relativeTime(timestamp: number) {
  const delta = Date.now() - timestamp
  const minutes = Math.max(0, Math.round(delta / 60000))
  if (minutes < 60) return minutes + 'm'
  const hours = Math.round(minutes / 60)
  if (hours < 48) return hours + 'h'
  return Math.round(hours / 24) + 'd'
}

function severityLabel(event: WorldIntelEvent) {
  return event.severity
}

function severityRank(event: WorldIntelEvent) {
  if (event.severity === 'critical') return 4
  if (event.severity === 'elevated') return 3
  if (event.severity === 'watch') return 2
  return 1
}

function eventMatchesWindow(event: WorldIntelEvent, window: (typeof TIME_WINDOWS)[number]) {
  const duration =
    window === '24H'
      ? 24 * 60 * 60 * 1000
      : window === '7D'
        ? 7 * 24 * 60 * 60 * 1000
        : window === '30D'
          ? 30 * 24 * 60 * 60 * 1000
          : 365 * 24 * 60 * 60 * 1000
  return Date.now() - event.timestamp <= duration
}

export default function WorldShell() {
  const { snapshot, refresh, loading } = useWorldIntelSnapshot()
  const [mode, setMode] = useState<WorldMode>('world')
  const [timeWindow, setTimeWindow] = useState<(typeof TIME_WINDOWS)[number]>('24H')
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()
  const [sheetExpanded, setSheetExpanded] = useState(false)

  const modeSpec = MODES.find((item) => item.id === mode) ?? MODES[0]
  const filteredEvents = useMemo(
    () =>
      snapshot.worldEvents
        .filter((event) => eventMatchesWindow(event, timeWindow))
        .filter(modeSpec.match)
        .sort((left, right) => {
          const severityDelta = severityRank(right) - severityRank(left)
          if (severityDelta !== 0) return severityDelta
          return right.timestamp - left.timestamp
        }),
    [modeSpec, snapshot.worldEvents, timeWindow],
  )

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0]

  const worldEvents = useMemo(
    () => filteredEvents.map(worldEventFromLegacy),
    [filteredEvents],
  )
  const clusters = useMemo(
    () => clusterWorldEvents(worldEvents),
    [worldEvents],
  )
  const worldEventMap = useMemo(
    () => new Map(worldEvents.map((event) => [event.id, event])),
    [worldEvents],
  )
  const brief = useMemo(
    () => buildWorldBrief(worldEvents, clusters, 5),
    [clusters, worldEvents],
  )
  const selectedCluster = selectedEvent
    ? clusters.find((cluster) => cluster.eventIds.includes(selectedEvent.id))
    : undefined
  const selectedConvergence =
    selectedCluster && selectedCluster.eventIds.length > 1
      ? scoreConvergence(selectedCluster, worldEventMap)
      : undefined

  const geocodedCount = filteredEvents.filter(
    (event) => Number.isFinite(event.lat) && Number.isFinite(event.lon),
  ).length

  const elevatedCount = filteredEvents.filter(
    (event) => event.severity === 'critical' || event.severity === 'elevated',
  ).length

  const sourceCount = new Set(filteredEvents.map((event) => event.sourceId)).size

  return (
    <main className="atlasz-world-shell">
      <div className="atlasz-world-backdrop" />

      <header className="atlasz-world-header">
        <div className="atlasz-world-brand">
          <div className="atlasz-world-mark">A</div>
          <div>
            <div className="atlasz-world-wordmark">YSZ</div>
            <div className="atlasz-world-subtitle">WORLDSTATE</div>
          </div>
        </div>

        <div className="atlasz-world-header-actions">
          <button className="atlasz-icon-button" type="button" aria-label="Search">
            <Search size={17} />
          </button>
          <button
            className="atlasz-icon-button"
            type="button"
            aria-label="Refresh world state"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'atlasz-spin' : undefined} />
          </button>
          <a className="atlasz-legacy-link" href="?legacy=1" aria-label="Open legacy interface">
            <ArrowLeft size={14} />
            Legacy
          </a>
        </div>
      </header>

      <section className="atlasz-world-status" aria-label="World state summary">
        <div>
          <strong>{filteredEvents.length}</strong>
          <span>meaningful changes</span>
        </div>
        <i />
        <div>
          <strong>{elevatedCount}</strong>
          <span>elevated systems</span>
        </div>
        <i />
        <div>
          <strong>{sourceCount}</strong>
          <span>active sources</span>
        </div>
        <i />
        <div>
          <strong>{clusters.length}</strong>
          <span>event clusters</span>
        </div>
      </section>

      <nav className="atlasz-mode-rail" aria-label="World modes">
        {MODES.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={item.id === mode ? 'active' : undefined}
              type="button"
              onClick={() => {
                setMode(item.id)
                setSelectedEventId(undefined)
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <section className="atlasz-world-stage">
        <WorldRenderer
          events={filteredEvents}
          selectedEventId={selectedEvent?.id}
          onSelectEvent={(id) => {
            setSelectedEventId(id)
            setSheetExpanded(true)
          }}
        />

        <div className="atlasz-world-stage-label">
          <span>{modeSpec.label.toUpperCase()}</span>
          <small>
            {geocodedCount > 0
              ? geocodedCount + ' source-backed spatial events'
              : 'No source-backed spatial events in view'}
          </small>
        </div>

        <div className="atlasz-time-control">
          <Clock3 size={14} />
          {TIME_WINDOWS.map((item) => (
            <button
              type="button"
              key={item}
              className={item === timeWindow ? 'active' : undefined}
              onClick={() => setTimeWindow(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="atlasz-world-legend">
          <span><b className="critical" />Critical</span>
          <span><b className="elevated" />Elevated</span>
          <span><b className="watch" />Watch</span>
        </div>
      </section>

      <aside className={'atlasz-intel-sheet' + (sheetExpanded ? ' expanded' : '')}>
        <button
          className="atlasz-sheet-handle"
          type="button"
          aria-label={sheetExpanded ? 'Collapse intelligence sheet' : 'Expand intelligence sheet'}
          onClick={() => setSheetExpanded((current) => !current)}
        >
          <span />
          <ChevronDown size={15} />
        </button>

        <div className="atlasz-intel-sheet-header">
          <div>
            <span className="atlasz-eyebrow">
              <Sparkles size={13} />
              {selectedEvent ? 'CURRENT FOCUS' : 'WORLD BRIEF'}
              {brief.items.length > 0 && <b>{brief.items.length}</b>}
            </span>
            <h1>{selectedEvent?.title ?? 'No material event selected'}</h1>
          </div>
          {selectedEvent && (
            <span className={'atlasz-severity-chip ' + severityLabel(selectedEvent)}>
              {severityLabel(selectedEvent)}
            </span>
          )}
        </div>

        {selectedEvent ? (
          <>
            <p className="atlasz-intel-summary">{selectedEvent.summary}</p>

            <div className="atlasz-intel-metadata">
              <span><CircleDot size={13} />{selectedEvent.region || 'Global'}</span>
              <span><Activity size={13} />{selectedEvent.confidence}% confidence</span>
              <span><Database size={13} />{selectedEvent.sourceId}</span>
              <span><Clock3 size={13} />{relativeTime(selectedEvent.timestamp)} ago</span>
              {selectedConvergence && selectedCluster && (
                <span className="atlasz-convergence-meta">
                  <Layers3 size={13} />
                  {selectedCluster.eventIds.length} linked changes · {selectedConvergence.domains.length} domains
                </span>
              )}
            </div>

            <div className="atlasz-intel-grid">
              <section>
                <div className="atlasz-section-label">CONNECTED SYSTEMS</div>
                <div className="atlasz-chip-row">
                  {[...selectedEvent.affectedSectors, ...selectedEvent.affectedCommodities]
                    .slice(0, 6)
                    .map((item) => <span key={item}>{item}</span>)}
                  {selectedEvent.affectedSectors.length === 0 &&
                    selectedEvent.affectedCommodities.length === 0 && <em>Unknown</em>}
                </div>
              </section>

              <section>
                <div className="atlasz-section-label">MARKET / ASSET LINKS</div>
                <div className="atlasz-chip-row">
                  {selectedEvent.affectedAssets.slice(0, 6).map((item) => <span key={item}>{item}</span>)}
                  {selectedEvent.affectedAssets.length === 0 && <em>No source-backed asset link</em>}
                </div>
              </section>

              {selectedConvergence && selectedCluster && (
                <section>
                  <div className="atlasz-section-label">CONVERGENCE</div>
                  <div className="atlasz-convergence-block">
                    <strong>{Math.round(selectedConvergence.score * 100)}</strong>
                    <div>
                      <span>{selectedConvergence.domains.join(' · ')}</span>
                      <small>
                        local-derived ranking · {selectedConvergence.independentSourceCount} source group(s)
                      </small>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <div className="atlasz-section-label">EVIDENCE STATE</div>
                <div className="atlasz-evidence-line">
                  <ShieldCheck size={15} />
                  <div>
                    <strong>{selectedEvent.provenance}</strong>
                    <small>Source-backed event · inference must remain separately labeled</small>
                  </div>
                </div>
              </section>

              <section>
                <div className="atlasz-section-label">ENTITIES</div>
                <div className="atlasz-chip-row">
                  {selectedEvent.extractedEntities.slice(0, 8).map((item) => <span key={item}>{item}</span>)}
                  {selectedEvent.extractedEntities.length === 0 && <em>No resolved entities</em>}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="atlasz-empty-state">
            <Globe2 size={28} />
            <strong>Atlasz is allowed to be quiet.</strong>
            <p>No source-backed event currently satisfies this mode and time window.</p>
          </div>
        )}

        <div className="atlasz-event-strip">
          {(brief.items.length > 0
            ? brief.items
                .map((item) => filteredEvents.find((event) => event.id === item.primaryEventId))
                .filter((event): event is WorldIntelEvent => Boolean(event))
            : filteredEvents.slice(0, 8)
          ).map((event) => (
            <button
              type="button"
              key={event.id}
              className={event.id === selectedEvent?.id ? 'active' : undefined}
              onClick={() => {
                setSelectedEventId(event.id)
                setSheetExpanded(true)
              }}
            >
              <span className={'atlasz-event-dot ' + severityLabel(event)} />
              <div>
                <strong>{event.title}</strong>
                <small>{event.region || 'Global'} · {relativeTime(event.timestamp)}</small>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="atlasz-corner-system">
        <Layers3 size={13} />
        <span>{snapshot.status}</span>
        <i />
        <Waves size={13} />
        <span>{snapshot.sourceTrust}</span>
      </div>
    </main>
  )
}
