/**
 * Live HUD widgets backed by the realtime engine. Each subscribes individually
 * so only it re-renders per frame, and source trust is always labeled
 * explicitly — simulated/public/authenticated, never implied as verified truth.
 */
import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Pause, Play, Radio, RotateCcw, StepBack } from 'lucide-react'
import { PULSE_MODE_LABEL, useEngineSnapshot } from './realtimeStore'
import type { RealtimeHealth, ReplayState } from './realtime'
import './RealtimeWidgets.css'

function signClass(value: number): string {
  return value >= 0 ? 'rt-pos' : 'rt-neg'
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatRate(value: number | undefined): string {
  return `${(value ?? 0).toFixed(1)}/s`
}

function formatTimestamp(value: number | undefined): string {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatSqliteMode(value: RealtimeHealth['sqliteMode'] | undefined): string {
  if (value === 'node:sqlite') return 'node:sqlite'
  if (value === 'better-sqlite3') return 'better-sqlite3'
  if (value === 'json-fallback') return 'json fallback'
  if (value === 'localstorage') return 'localStorage'
  return 'unknown'
}

function sourceTrustLabel(source?: string, trust?: RealtimeHealth['sourceTrust']): string {
  if (source === 'simulator' || trust === 'simulated' || !source) {
    return 'Simulated source'
  }
  if (trust === 'public unauthenticated') {
    return 'Public unauthenticated'
  }
  if (trust === 'authenticated') {
    return 'Authenticated source'
  }
  if (trust === 'verified') {
    return 'Verified source'
  }
  return source
}

function browserFallbackHealth(running: boolean, lastFrameTimestamp?: number): RealtimeHealth {
  return {
    activeConnectorId: 'simulated',
    ingestionStatus: running ? 'connected' : 'stopped',
    packetsPerSecond: 0,
    framesPerSecond: 0,
    droppedPackets: 0,
    reconnectCount: 0,
    lastFrameTimestamp,
    sqliteMode: 'localstorage',
    sourceTrust: 'simulated',
    workerStatus: running ? 'running' : 'stopped',
    connectors: [
      {
        id: 'simulated',
        label: 'Browser simulator',
        assetClasses: ['crypto', 'equity', 'etf', 'commodity', 'index'],
        requiresAuth: false,
        status: running ? 'connected' : 'stopped',
        reconnectCount: 0,
        sourceTrust: 'simulated',
        packetsPerSecond: 0,
        droppedPackets: 0,
        lastPacketAt: lastFrameTimestamp,
      },
    ],
    replay: {
      active: false,
      playing: false,
      speed: 1,
      frameCount: 0,
    },
  }
}

function desktopRealtime() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.atlaszDesktop?.realtime ?? null
}

/** Topbar pulse indicator. Subscribes individually so only it ticks. */
export function PulseIndicator() {
  const snapshot = useEngineSnapshot()
  const running = snapshot.status?.running ?? false
  const label = PULSE_MODE_LABEL[snapshot.status?.mode ?? 'stopped']
  const trust = snapshot.status.health?.sourceTrust ?? 'simulated'
  return (
    <span className="rt-indicator" title={`Realtime source trust: ${trust}. Atlasz does not verify or advise on market truth.`}>
      <span className={running ? 'rt-pulse-led live' : 'rt-pulse-led'} aria-hidden />
      {label}
    </span>
  )
}

/** A small honest banner stating the feed is simulated. */
function SimulatedBadge({ label }: { label: string }) {
  return (
    <span className="rt-sim-badge" title="Realtime source trust for this local data core.">
      <span className="rt-dot" aria-hidden />
      {label}
    </span>
  )
}

/** Command Center: realtime pulse state + top simulated movers. */
export function RealtimePulsePanel({ enabled }: { enabled: boolean }) {
  const snapshot = useEngineSnapshot()
  const status = snapshot.status
  const frame = snapshot.frame
  const running = status?.running ?? false
  const modeLabel = PULSE_MODE_LABEL[status?.mode ?? 'stopped']

  const movers = frame
    ? [...frame.assets].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5)
    : []
  const attention = frame
    ? [...frame.attention].sort((a, b) => b.pressure - a.pressure).slice(0, 3)
    : []

  return (
    <div className="rt-pulse">
      <div className="rt-pulse-head">
        <span className={running ? 'rt-pulse-led live' : 'rt-pulse-led'} aria-hidden />
        <div>
          <strong>{modeLabel}</strong>
          <em>
            {running
              ? `frame ${frame?.sequence ?? 0} · ${frame?.assets.length ?? 0} assets · ${status?.connectedFeeds.join(', ') || 'simulator'}`
              : 'Pulse paused'}
          </em>
        </div>
        <SimulatedBadge label={status?.health?.sourceTrust ?? 'Simulated feed'} />
      </div>

      {!enabled || !running ? (
        <div className="rt-empty">
          Pulse is paused. Resume it from the command palette (<span className="rt-kbd">⌘K</span> → Toggle Global Pulse).
        </div>
      ) : movers.length === 0 ? (
        <div className="rt-empty">Warming up the simulated feed…</div>
      ) : (
        <ul className="rt-mover-list">
          {movers.map((asset) => (
            <li key={asset.symbol}>
              <span className="rt-mover-symbol">{asset.symbol}</span>
              <span className="rt-mover-price">{asset.price.toLocaleString()}</span>
              <span className={`rt-mover-change ${signClass(asset.changePct)}`}>
                {asset.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {formatPct(asset.changePct)}
              </span>
              <span className="rt-mover-vel" title="1m volatility velocity (basis points)">
                v {asset.metrics.volatilityVelocity.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {attention.length > 0 && (
        <div className="rt-attention-strip">
          {attention.map((item) => (
            <div key={item.target}>
              <span>{item.target}</span>
              <strong>{item.pressure.toFixed(0)}</strong>
              <em>dV/dt {item.mentionVelocity.toFixed(1)}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Command Center: local data-core health and replay controls. */
export function DataCorePanel() {
  const snapshot = useEngineSnapshot()
  const [busy, setBusy] = useState(false)
  const hasDesktopRealtime = Boolean(desktopRealtime())
  const health =
    snapshot.status.health ??
    browserFallbackHealth(snapshot.status.running, snapshot.frame?.emittedAt)
  const replay = health?.replay
  const activeConnector = useMemo(
    () => health?.connectors.find((connector) => connector.id === health.activeConnectorId),
    [health],
  )
  const isReplay = snapshot.status.mode === 'replay' || replay?.active
  const signals = snapshot.frame?.signals ?? []

  async function runControl(action: () => Promise<unknown>) {
    const realtime = desktopRealtime()
    if (!realtime || busy) {
      return
    }
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const speed = replay?.speed ?? 1
  // No Date.now() during render (purity): these only drive the replay slider,
  // which is disabled until a replay window is active.
  const cursor = replay?.cursor ?? replay?.windowStart ?? 0
  const windowStart = replay?.windowStart ?? cursor
  const windowEnd = replay?.windowEnd ?? cursor

  return (
    <div className="rt-core">
      <div className="rt-core-head">
        <span className={isReplay ? 'rt-mode replay' : 'rt-mode live'}>{isReplay ? 'REPLAY' : 'LIVE'}</span>
        <div>
          <strong>{activeConnector?.label ?? health?.activeConnectorId ?? 'Browser simulator'}</strong>
          <em>{health?.ingestionStatus ?? snapshot.status.mode} · {health?.sourceTrust ?? 'simulated'}</em>
        </div>
      </div>

      <div className="rt-core-grid">
        <Metric label="Packets" value={formatRate(health?.packetsPerSecond)} />
        <Metric label="Frames" value={formatRate(health?.framesPerSecond)} />
        <Metric label="Dropped" value={`${health?.droppedPackets ?? 0}`} tone={(health?.droppedPackets ?? 0) > 0 ? 'warn' : undefined} />
        <Metric label="Reconnects" value={`${health?.reconnectCount ?? 0}`} />
        <Metric label="Last frame" value={formatTimestamp(health?.lastFrameTimestamp ?? snapshot.frame?.emittedAt)} />
        <Metric label="SQLite" value={formatSqliteMode(health?.sqliteMode ?? snapshot.status.sqliteMode)} />
      </div>

      <div className="rt-connector-list">
        {(health?.connectors ?? []).slice(0, 5).map((connector) => (
          <div className={connector.id === health?.activeConnectorId ? 'active' : ''} key={connector.id}>
            <span>{connector.id}</span>
            <strong>{connector.status}</strong>
            <em>{connector.requiresAuth ? 'auth' : connector.sourceTrust}</em>
          </div>
        ))}
      </div>

      <div className="rt-replay-controls">
        <button
          disabled={busy || !hasDesktopRealtime}
          type="button"
          onClick={() => runControl(() => desktopRealtime()?.replayStart({ speed }) ?? Promise.resolve())}
          title="Replay the latest sampled five-minute window."
        >
          <StepBack size={13} />
          Replay 5m
        </button>
        <button
          disabled={busy || !replay?.active}
          type="button"
          onClick={() =>
            runControl(() =>
              replay?.playing
                ? desktopRealtime()?.replayPause() ?? Promise.resolve()
                : desktopRealtime()?.replayResume() ?? Promise.resolve(),
            )
          }
        >
          {replay?.playing ? <Pause size={13} /> : <Play size={13} />}
          {replay?.playing ? 'Pause' : 'Play'}
        </button>
        <button
          disabled={busy || !replay?.active}
          type="button"
          onClick={() => runControl(() => desktopRealtime()?.replayStop() ?? Promise.resolve())}
        >
          <RotateCcw size={13} />
          Live
        </button>
      </div>

      {!hasDesktopRealtime && (
        <p className="rt-replay-note">Replay is available in the desktop shell after local frame samples are persisted.</p>
      )}

      <div className="rt-speed-row">
        {([1, 2, 5] as ReplayState['speed'][]).map((item) => (
          <button
            className={speed === item ? 'active' : ''}
            disabled={busy || !replay?.active}
            key={item}
            type="button"
            onClick={() => runControl(() => desktopRealtime()?.replaySetSpeed(item) ?? Promise.resolve())}
          >
            {item}x
          </button>
        ))}
        <input
          aria-label="Replay scrubber"
          disabled={busy || !replay?.active || windowStart === windowEnd}
          max={windowEnd}
          min={windowStart}
          type="range"
          value={cursor}
          onChange={(event) => runControl(() => desktopRealtime()?.replaySeek(Number(event.currentTarget.value)) ?? Promise.resolve())}
        />
      </div>

      <div className="rt-signal-strip">
        <span>{signals.length} {isReplay ? 'replay' : 'live'} signals</span>
        <strong>{signals[0]?.severity ?? 'clear'}</strong>
        <em>{signals[0]?.assetOrTopicId ?? 'no active anomaly'}</em>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className={tone === 'warn' ? 'rt-metric warn' : 'rt-metric'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

/** Market Terminal: live (simulated) readout for the selected symbol. */
export function LiveMarketReadout({ symbol, enabled }: { symbol: string; enabled: boolean }) {
  const snapshot = useEngineSnapshot()
  const asset = snapshot.frame?.assets.find((item) => item.symbol === symbol) ?? null
  const badge = sourceTrustLabel(asset?.source, snapshot.status.health?.sourceTrust)

  if (!enabled) {
    return (
      <div className="rt-readout paused">
        <div className="rt-readout-head">
          <Radio size={14} />
          <span>Live readout</span>
          <SimulatedBadge label="Paused" />
        </div>
        <p className="rt-empty">Pulse paused — showing seeded values only. Toggle Global Pulse to animate.</p>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="rt-readout">
        <div className="rt-readout-head">
          <Radio size={14} />
          <span>Live readout</span>
          <SimulatedBadge label={badge} />
        </div>
        <p className="rt-empty">No simulated frame yet for {symbol}.</p>
      </div>
    )
  }

  return (
    <div className="rt-readout">
      <div className="rt-readout-head">
        <Radio size={14} />
        <span>Live readout · {asset.symbol}</span>
        <SimulatedBadge label={badge} />
      </div>
      <div className="rt-readout-grid">
        <div>
          <span>Price</span>
          <strong>{asset.price.toLocaleString()}</strong>
        </div>
        <div>
          <span>Session</span>
          <strong className={signClass(asset.changePct)}>{formatPct(asset.changePct)}</strong>
        </div>
        <div>
          <span>1m volume</span>
          <strong>{asset.metrics.oneMinuteVolume.toFixed(0)}</strong>
        </div>
        <div>
          <span>Volatility v</span>
          <strong>{asset.metrics.volatilityVelocity.toFixed(1)}</strong>
        </div>
        <div>
          <span>Vol accel</span>
          <strong className={signClass(asset.metrics.volumeAcceleration)}>
            {formatPct(asset.metrics.volumeAcceleration * 100)}
          </strong>
        </div>
        <div>
          <span>Ticks</span>
          <strong>{asset.tickCount}</strong>
        </div>
      </div>
    </div>
  )
}
