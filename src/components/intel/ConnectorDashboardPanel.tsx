import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  buildConnectorAudit,
  type ConnectorAuditRow,
  type ConnectorRuntimeStatus,
} from '../../engine/runtimeAudit'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../../worldIntel'
import './ConnectorDashboardPanel.css'

export function ConnectorDashboardPanel({
  sources,
  events,
  now,
}: {
  sources: OsintSourceSnapshot[]
  events: WorldIntelEvent[]
  now?: number
}) {
  const rows = useMemo(() => buildConnectorAudit({ sources, events, now }), [sources, events, now])
  const summary = useMemo(() => summarize(rows), [rows])

  return (
    <section className="connector-dashboard">
      <header className="connector-dashboard-head">
        <div>
          <span className="connector-eyebrow">Runtime Audit</span>
          <h2>Connector Dashboard</h2>
        </div>
        <div className="connector-summary" aria-label="Connector status summary">
          <SummaryPill label="online" value={summary.online} tone="ok" />
          <SummaryPill label="configured" value={summary.configured} tone="neutral" />
          <SummaryPill label="pending poll" value={summary.pending} tone="neutral" />
          <SummaryPill label="needs key" value={summary.missingKey} tone="warn" />
          <SummaryPill label="stale/fail" value={summary.staleOrFailed} tone="bad" />
          <SummaryPill label="not wired" value={summary.notWired} tone="muted" />
        </div>
      </header>

      <div className="connector-table" role="table" aria-label="Atlasz runtime connector dashboard">
        <div className="connector-table-row connector-table-head" role="row">
          <span role="columnheader">Source</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Records</span>
          <span role="columnheader">Persistence</span>
          <span role="columnheader">Resolver / Exposure</span>
          <span role="columnheader">Trail</span>
        </div>
        {rows.map((row) => (
          <ConnectorRow key={row.id} row={row} />
        ))}
      </div>
    </section>
  )
}

function ConnectorRow({ row }: { row: ConnectorAuditRow }) {
  return (
    <article className={`connector-table-row connector-status-${row.status}`} role="row">
      <div className="connector-source" role="cell">
        <strong>{row.label}</strong>
        <span>{row.domain}</span>
        <div className="connector-badges">
          {row.trust === 'catalog-only' ? (
            <span className="connector-catalog-only">catalog only</span>
          ) : (
            <ProvenanceBadge value={row.trust} size="sm" />
          )}
          <span>{accessLabel(row.access)}</span>
          {row.requiredEnv.length > 0 && <code>{row.requiredEnv.join(' · ')}</code>}
        </div>
      </div>
      <div className="connector-state" role="cell">
        <span className="connector-state-chip">{statusLabel(row.status)}</span>
        <small>{row.lastSuccessfulFetch ? `last ${formatAge(row.lastSuccessfulFetch)}` : row.missingReason ?? 'no successful fetch yet'}</small>
        {row.lastError && <em title={row.lastError}>{row.lastError}</em>}
      </div>
      <div className="connector-count" role="cell">
        <strong>{row.recordCount}</strong>
        <small>{row.activeSourceCount} source snapshot{row.activeSourceCount === 1 ? '' : 's'}</small>
      </div>
      <div className="connector-list" role="cell">
        {row.persistenceTables.map((table) => (
          <code key={table}>{table}</code>
        ))}
      </div>
      <div className="connector-list" role="cell">
        <span>{row.resolverSupport}</span>
        <span>{row.exposureSupport}</span>
      </div>
      <div className="connector-trail" role="cell">
        <a href={row.officialUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={12} />
          official source
        </a>
        <span>{row.sourceTrailUi}</span>
      </div>
    </article>
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'ok' | 'neutral' | 'warn' | 'bad' | 'muted'
}) {
  return (
    <span className={`connector-pill tone-${tone}`}>
      <strong>{value}</strong>
      {label}
    </span>
  )
}

function summarize(rows: ConnectorAuditRow[]) {
  return {
    online: rows.filter((row) => row.status === 'online').length,
    configured: rows.filter((row) => row.status === 'configured').length,
    pending: rows.filter((row) => row.status === 'pending-first-fetch').length,
    missingKey: rows.filter((row) => row.status === 'missing-key').length,
    staleOrFailed: rows.filter((row) => ['stale', 'failed', 'rate-limited', 'unavailable'].includes(row.status)).length,
    notWired: rows.filter((row) => row.status === 'not-wired').length,
  }
}

function statusLabel(status: ConnectorRuntimeStatus): string {
  if (status === 'missing-key') return 'missing key'
  if (status === 'not-wired') return 'not wired'
  if (status === 'pending-first-fetch') return 'pending poll'
  if (status === 'rate-limited') return 'rate limited'
  return status
}

function accessLabel(access: ConnectorAuditRow['access']): string {
  if (access === 'user-agent-gated') return 'requires user-agent'
  if (access === 'key-gated') return 'requires key'
  if (access === 'optional-key') return 'optional key'
  if (access === 'candidate') return 'candidate'
  return 'public'
}

function formatAge(timestamp: number): string {
  const delta = Date.now() - timestamp
  if (!Number.isFinite(delta)) return 'unknown'
  if (delta < 60_000) return 'just now'
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`
  return `${Math.round(delta / 86_400_000)}d ago`
}
