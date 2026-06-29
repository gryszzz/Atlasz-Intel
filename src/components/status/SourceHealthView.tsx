/*
 * Source Health — honest connector audit surface (UI revamp item 5/6).
 * Surfaces every ingestion connector + core system service with its real
 * status: enabled/disabled, configured/missing, last success/error, item count,
 * and provenance. Broken or unconfigured connectors are shown, never hidden.
 * Renders state only — all status comes from Node services via bridges.
 */
import { useMemo } from 'react'
import { Activity, Clock, Copy, Database, FolderOpen, Pause, Play, RefreshCw, Server, Signal, Waves } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { useSystemHealth } from './useSystemHealth'
import type { OsintSourceSnapshot, SourceRefreshState, WorldRefreshControlSnapshot } from '../../worldIntel'
import type { ProviderCapability, ProviderCapabilityStatus } from '../../providerDiscovery'
import './SourceHealthView.css'

const STATUS_LABEL: Record<string, string> = {
  idle: 'idle',
  online: 'online',
  offline: 'offline',
  'rate-limited': 'rate-limited',
  failed: 'failed',
  disabled: 'disabled',
}

const REFRESH_LABEL: Record<SourceRefreshState, string> = {
  'due-now': 'due now',
  'not-due': 'not due',
  'backed-off': 'backed off',
  stale: 'stale',
  expired: 'expired',
  'missing-key': 'missing key',
  disabled: 'disabled',
}

const PROVIDER_STATUS_LABEL: Record<ProviderCapabilityStatus, string> = {
  available: 'available',
  unavailable: 'unavailable',
  'auth-gated': 'auth-gated',
  'missing-config': 'needs setup',
  'rate-limited': 'rate-limited',
  unsupported: 'unsupported',
}

export function SourceHealthView({
  sources,
  refreshControl,
  onRefresh,
  onPauseRefresh,
  onResumeRefresh,
  worldStatus,
}: {
  sources: OsintSourceSnapshot[]
  refreshControl: WorldRefreshControlSnapshot
  onRefresh: () => Promise<void>
  onPauseRefresh: () => Promise<void>
  onResumeRefresh: () => Promise<void>
  worldStatus: string
}) {
  const { health, refresh } = useSystemHealth()

  const grouped = useMemo(() => groupSources(sources), [sources])
  const refreshSummary = useMemo(() => summarizeRefresh(sources), [sources])
  const online = sources.filter((source) => source.status === 'online').length
  const configured = sources.filter((source) => source.enabled).length
  const providerSnapshot = health.providers
  const providerCount = providerSnapshot?.providers.length ?? 0
  const availableProviderCount = providerSnapshot?.providers.filter((provider) => provider.status === 'available').length ?? 0

  async function handleRefresh() {
    await onRefresh()
    await refresh()
  }

  async function handleProviderDiscover() {
    await window.atlaszDesktop?.providers?.discover()
    await refresh()
  }

  async function handlePauseRefresh() {
    await onPauseRefresh()
    await refresh()
  }

  async function handleResumeRefresh() {
    await onResumeRefresh()
    await refresh()
  }

  async function handleOpenConfig() {
    await window.atlaszDesktop?.providers?.openConfig()
    await refresh()
  }

  async function handleCopyMissingEnv() {
    const missing = missingEnvKeys(providerSnapshot?.providers ?? [])
    const template = missing.length > 0
      ? missing.map((key) => `${key}=`).join('\n')
      : '# No missing Atlasz provider env keys discovered.'
    await navigator.clipboard?.writeText(template)
  }

  return (
    <div className="source-health">
      <header className="sh-header">
        <div>
          <span className="eyebrow">Source Health</span>
          <h2>Connector audit — honest status for every ingestion source and service.</h2>
        </div>
        <div className="sh-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              void handleRefresh()
            }}
          >
            <RefreshCw size={15} />
            Refresh Now
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              void handleProviderDiscover()
            }}
          >
            <Signal size={15} />
            Check Providers
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={!refreshControl.autoRefreshEnabled}
            onClick={() => {
              void (refreshControl.autoRefreshPaused ? handleResumeRefresh() : handlePauseRefresh())
            }}
          >
            {refreshControl.autoRefreshPaused ? <Play size={15} /> : <Pause size={15} />}
            {refreshControl.autoRefreshPaused ? 'Resume Refresh' : 'Pause Refresh'}
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={!window.atlaszDesktop?.providers?.openConfig}
            onClick={() => {
              void handleOpenConfig()
            }}
          >
            <FolderOpen size={15} />
            Open Local Keys
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              void handleCopyMissingEnv()
            }}
          >
            <Copy size={15} />
            Copy Required Keys
          </button>
        </div>
      </header>

      <RefreshControlPanel control={refreshControl} summary={refreshSummary} />

      <section className="sh-system">
        <SystemTile
          icon={Database}
          label="Local Data"
          value={health.persistenceMode ? 'available' : health.desktop ? 'unavailable' : 'desktop only'}
          detail={health.persistenceMode ? 'Source history saved on this device' : 'Runs in the desktop app'}
          tone={health.persistenceMode ? 'ok' : 'muted'}
        />
        <SystemTile
          icon={Signal}
          label="Realtime stream"
          value={health.realtime ? health.realtime.mode : health.desktop ? 'unavailable' : 'desktop only'}
          detail={health.realtime ? `${health.realtime.connectedFeeds.length} feeds connected` : 'Public market connector'}
          tone={health.realtime?.mode === 'live' ? 'ok' : health.realtime?.running ? 'warn' : 'muted'}
        />
        <SystemTile
          icon={Activity}
          label="Public ingest"
          value={health.ingest ? (health.ingest.running ? 'running' : health.ingest.enabled ? 'idle' : 'disabled') : health.desktop ? 'unavailable' : 'desktop only'}
          detail={health.ingest ? `${health.ingest.rssHeadlineCount} news · ${health.ingest.yahooTickCount} ticks` : 'OSINT coordinator'}
          tone={health.ingest?.running ? 'ok' : 'muted'}
        />
        <SystemTile
          icon={Server}
          label="Provider discovery"
          value={providerSnapshot ? `${availableProviderCount}/${providerCount} available` : health.desktop ? 'unavailable' : 'desktop only'}
          detail={
            providerSnapshot
              ? `${providerSnapshot.status} · ${providerSnapshot.lastDiscoveryAt ? formatAge(providerSnapshot.lastDiscoveryAt) : 'not checked'}`
              : 'Provider catalog'
          }
          tone={availableProviderCount > 0 ? 'ok' : 'muted'}
        />
        <SystemTile
          icon={Server}
          label="World registry"
          value={`${online}/${sources.length} online`}
          detail={`${configured} enabled · status ${worldStatus}`}
          tone={online > 0 ? 'ok' : 'muted'}
        />
        <SystemTile
          icon={Waves}
          label="Microstructure context"
          value={health.microstructure?.enabled ? `${health.microstructure.trackedSymbols} symbols` : health.desktop ? 'unavailable' : 'desktop only'}
          detail={
            health.microstructure?.enabled
              ? `${health.microstructure.shockCount} shocks · ${health.microstructure.zScoreThreshold}σ`
              : 'Local-computed trade-flow stress only; no verified L2 depth'
          }
          tone={health.microstructure?.enabled ? 'ok' : 'muted'}
        />
      </section>

      {providerSnapshot && (
        <section className="sh-group">
          <div className="sh-group-row">
            <h3 className="sh-group-title">Provider discovery</h3>
            <span className="sh-group-meta">
              {providerSnapshot.configPath ? 'local provider catalog' : 'built-in catalog'}
            </span>
          </div>
          {providerSnapshot.configErrors.length > 0 && (
            <div className="sh-warning">
              {providerSnapshot.configErrors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          )}
          <div className="sh-grid">
            {providerSnapshot.providers.map((provider) => (
              <ProviderTile key={provider.providerId} provider={provider} />
            ))}
          </div>
          <div className="sh-asset-availability">
            <strong>Symbol coverage</strong>
            {providerSnapshot.assetAvailability.length === 0 ? (
              <span>No discovered symbol mappings yet.</span>
            ) : (
              providerSnapshot.assetAvailability.map((asset) => (
                <span
                  className={`sh-asset-pill ${asset.status === 'available' ? 'available' : 'unavailable'}`}
                  key={`${asset.assetSymbol}-${asset.providerId}-${asset.providerSymbol}`}
                >
                  {asset.assetSymbol} · {asset.providerId} · {asset.providerSymbol} · {asset.status}
                </span>
              ))
            )}
          </div>
        </section>
      )}

      {grouped.map((group) => (
        <section className="sh-group" key={group.label}>
          <h3 className="sh-group-title">{group.label}</h3>
          <div className="sh-grid">
            {group.sources.map((source) => (
              <ConnectorTile key={source.sourceId} source={source} />
            ))}
          </div>
        </section>
      ))}

      {sources.length === 0 && (
        <div className="sh-empty">
          <p>No connectors registered. The world source registry is unavailable from current sources.</p>
        </div>
      )}
    </div>
  )
}

function RefreshControlPanel({
  control,
  summary,
}: {
  control: WorldRefreshControlSnapshot
  summary: RefreshSummary
}) {
  const duePreview = summary.dueNow.slice(0, 4)
  const backedOffPreview = summary.backedOff.slice(0, 4)
  const stalePreview = [...summary.stale, ...summary.expired].slice(0, 4)
  return (
    <section className="sh-refresh-panel" aria-label="Worldwatch refresh control">
      <div className="sh-refresh-head">
        <div>
          <span className="eyebrow">Refresh Control</span>
          <h3>Worldwatch freshness loop</h3>
        </div>
        <span className={`sh-loop-state ${control.autoRefreshPaused ? 'paused' : control.autoRefreshEnabled ? 'running' : 'disabled'}`}>
          {control.autoRefreshEnabled ? control.autoRefreshPaused ? 'paused' : 'running' : 'disabled'}
        </span>
      </div>
      <div className="sh-refresh-grid">
        <RefreshMetric icon={Clock} label="Global cadence" value={formatDuration(control.cadenceMs)} detail="Checks due providers only" />
        <RefreshMetric icon={Clock} label="Next loop" value={formatFuture(control.nextScheduledRefreshAt)} detail="Background schedule" />
        <RefreshMetric icon={RefreshCw} label="Last started" value={formatAgeOptional(control.lastRefreshStartedAt)} detail="Manual or background" />
        <RefreshMetric icon={RefreshCw} label="Last completed" value={formatAgeOptional(control.lastRefreshCompletedAt)} detail="No substitute data" />
        <RefreshMetric icon={Signal} label="Due now" value={String(summary.dueNow.length)} detail={previewNames(duePreview)} tone={summary.dueNow.length > 0 ? 'warn' : 'ok'} />
        <RefreshMetric icon={Pause} label="Backed off" value={String(summary.backedOff.length)} detail={previewNames(backedOffPreview)} tone={summary.backedOff.length > 0 ? 'warn' : 'ok'} />
        <RefreshMetric icon={Clock} label="Not due" value={String(summary.notDue.length)} detail="Fresh within cadence/rate guard" />
        <RefreshMetric icon={Activity} label="Stale / expired" value={`${summary.stale.length}/${summary.expired.length}`} detail={previewNames(stalePreview)} tone={stalePreview.length > 0 ? 'warn' : 'ok'} />
        <RefreshMetric icon={Server} label="Failed / limited" value={`${summary.failed.length}/${summary.rateLimited.length}`} detail="Visible, never hidden" tone={summary.failed.length + summary.rateLimited.length > 0 ? 'warn' : 'ok'} />
        <RefreshMetric icon={FolderOpen} label="Locked" value={String(summary.missingKey.length)} detail="Keys or setup required" tone={summary.missingKey.length > 0 ? 'muted' : 'ok'} />
      </div>
    </section>
  )
}

function RefreshMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'muted',
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
  tone?: 'ok' | 'warn' | 'muted'
}) {
  return (
    <article className={`sh-refresh-metric tone-${tone}`}>
      <header>
        <Icon size={14} />
        <span>{label}</span>
      </header>
      <strong>{value}</strong>
      <p>{detail || '—'}</p>
    </article>
  )
}

function ProviderTile({ provider }: { provider: ProviderCapability }) {
  const envDetail =
    provider.envKeysRequired.length === 0
      ? 'no key required'
      : `${provider.envKeysPresent.length}/${provider.envKeysRequired.length} keys present`
  const symbolPreview = provider.supportedSymbols.slice(0, 8)

  return (
    <article className={`sh-connector status-${provider.status}`}>
      <header>
        <strong>{provider.providerName}</strong>
        <span className={`sh-status sh-status-${provider.status}`}>
          {PROVIDER_STATUS_LABEL[provider.status]}
        </span>
      </header>
      <div className="sh-connector-badges">
        <ProvenanceBadge value={provider.provenance} size="sm" />
        {provider.feedTypes.map((feedType) => (
          <span className="sh-endpoint" key={feedType}>
            {feedType}
          </span>
        ))}
        <span className={provider.autoWired ? 'sh-auto-wired' : 'sh-config-missing'}>
          {provider.autoWired ? 'ready' : envDetail}
        </span>
      </div>
      <dl className="sh-connector-meta">
        <div>
          <dt>Symbols</dt>
          <dd>{provider.supportedSymbols.length}</dd>
        </div>
        <div>
          <dt>Regions</dt>
          <dd>{provider.supportedRegions.length || '—'}</dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>{formatAge(provider.lastDiscoveryAt)}</dd>
        </div>
      </dl>
      {symbolPreview.length > 0 && (
        <div className="sh-provider-symbols">
          {symbolPreview.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
          {provider.supportedSymbols.length > symbolPreview.length && <span>+{provider.supportedSymbols.length - symbolPreview.length}</span>}
        </div>
      )}
      {provider.endpointsChecked.length > 0 && <p className="sh-endpoint-line">{provider.endpointsChecked[0]}</p>}
      {provider.discoveryError && <p className="sh-error">{provider.discoveryError}</p>}
      <p className="sh-note">{provider.legalSafetyNote}</p>
    </article>
  )
}

function SystemTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
  tone: 'ok' | 'warn' | 'muted'
}) {
  return (
    <article className={`sh-system-tile tone-${tone}`}>
      <header>
        <Icon size={15} />
        <span>{label}</span>
      </header>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function ConnectorTile({ source }: { source: OsintSourceSnapshot }) {
  const status = source.enabled ? source.status : 'disabled'
  const refreshState = source.refreshState ?? (source.enabled ? 'due-now' : 'disabled')
  return (
    <article className={`sh-connector status-${status}`}>
      <header>
        <strong>{source.sourceName}</strong>
        <span className={`sh-status sh-status-${status}`}>{STATUS_LABEL[status] ?? status}</span>
      </header>
      <div className="sh-connector-badges">
        <ProvenanceBadge value={source.provenance} size="sm" />
        <span className="sh-endpoint">{source.endpointType}</span>
        <span className={`sh-refresh-pill refresh-${refreshState}`}>{REFRESH_LABEL[refreshState]}</span>
        {!source.enabled && <span className="sh-config-missing">locked / fail-closed</span>}
      </div>
      <dl className="sh-connector-meta">
        <div>
          <dt>Items</dt>
          <dd>{source.itemCount}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{Math.round(source.sourceReliabilityScore * 100)}</dd>
        </div>
        <div>
          <dt>Last ok</dt>
          <dd>{source.lastSuccessAt ? formatAge(source.lastSuccessAt) : '—'}</dd>
        </div>
        <div>
          <dt>Next</dt>
          <dd>{formatFuture(source.nextAttemptAt)}</dd>
        </div>
      </dl>
      {source.lastError && <p className="sh-error">{source.lastError}</p>}
      {source.refreshReason && <p className="sh-refresh-reason">{source.refreshReason}</p>}
      <p className="sh-note">{source.legalSafetyNote}</p>
    </article>
  )
}

type SourceGroup = { label: string; sources: OsintSourceSnapshot[] }
type RefreshSummary = {
  dueNow: OsintSourceSnapshot[]
  notDue: OsintSourceSnapshot[]
  backedOff: OsintSourceSnapshot[]
  stale: OsintSourceSnapshot[]
  expired: OsintSourceSnapshot[]
  missingKey: OsintSourceSnapshot[]
  failed: OsintSourceSnapshot[]
  rateLimited: OsintSourceSnapshot[]
}

function summarizeRefresh(sources: OsintSourceSnapshot[]): RefreshSummary {
  return {
    dueNow: sources.filter((source) => source.refreshState === 'due-now'),
    notDue: sources.filter((source) => source.refreshState === 'not-due'),
    backedOff: sources.filter((source) => source.refreshState === 'backed-off'),
    stale: sources.filter((source) => source.refreshState === 'stale'),
    expired: sources.filter((source) => source.refreshState === 'expired'),
    missingKey: sources.filter((source) => source.refreshState === 'missing-key'),
    failed: sources.filter((source) => source.status === 'failed'),
    rateLimited: sources.filter((source) => source.status === 'rate-limited'),
  }
}

function previewNames(sources: OsintSourceSnapshot[]): string {
  if (sources.length === 0) return 'none'
  return sources.map((source) => source.sourceName).join(' · ')
}

function groupSources(sources: OsintSourceSnapshot[]): SourceGroup[] {
  const order = ['global-news-events', 'macro-economic', 'regulatory-filings', 'public-disclosure', 'markets', 'markets-crypto', 'markets-probability', 'social-attention']
  const labels: Record<string, string> = {
    'global-news-events': 'World news & events',
    'macro-economic': 'Macro',
    'regulatory-filings': 'Regulatory filings',
    'public-disclosure': 'Public disclosure',
    markets: 'Market data',
    'markets-crypto': 'Crypto market data',
    'markets-probability': 'Probability markets',
    'social-attention': 'Social attention',
  }
  const byType = new Map<string, OsintSourceSnapshot[]>()
  for (const source of sources) {
    const key = source.sourceType
    byType.set(key, [...(byType.get(key) ?? []), source])
  }
  const keys = [...byType.keys()].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return keys.map((key) => ({ label: labels[key] ?? key, sources: byType.get(key) ?? [] }))
}

function missingEnvKeys(providers: ProviderCapability[]): string[] {
  return [
    ...new Set(
      providers.flatMap((provider) =>
        provider.envKeysRequired.filter((key) => !provider.envKeysPresent.includes(key)),
      ),
    ),
  ].sort()
}

function formatAge(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function formatAgeOptional(timestamp: number | undefined): string {
  return timestamp ? `${formatAge(timestamp)} ago` : '—'
}

function formatFuture(timestamp: number | undefined): string {
  if (!timestamp) return '—'
  const diff = timestamp - Date.now()
  if (diff <= 0) return 'due'
  return `in ${formatDuration(diff)}`
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}
