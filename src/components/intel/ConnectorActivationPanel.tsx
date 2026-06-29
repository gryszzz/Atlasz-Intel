import { useMemo } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import {
  buildConnectorAudit,
  type ConnectorAuditRow,
  type ConnectorRuntimeStatus,
} from '../../engine/runtimeAudit'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../../worldIntel'
import './ConnectorActivationPanel.css'

type OptionalEndpoint = {
  id: string
  envName: string
  label: string
  unlocks: string
  expectedState: string
  officialHosts: string
}

const OPTIONAL_ENDPOINTS: OptionalEndpoint[] = [
  {
    id: 'eia-refinery-override',
    envName: 'ATLASZ_EIA_REFINERIES_URL',
    label: 'EIA refinery override',
    unlocks: 'Refinery facility context if the default EIA/ArcGIS route changes.',
    expectedState: 'optional override',
    officialHosts: 'eia.gov or ArcGIS refinery FeatureServer',
  },
  {
    id: 'wpi-override',
    envName: 'ATLASZ_WPI_URL',
    label: 'World Port Index override',
    unlocks: 'NGA physical port reference if the default WPI CSV key changes.',
    expectedState: 'optional override',
    officialHosts: 'nga.mil',
  },
  {
    id: 'crossref-mailto',
    envName: 'ATLASZ_CROSSREF_MAILTO',
    label: 'Crossref polite mailto',
    unlocks: 'Crossref polite pool for DOI metadata requests.',
    expectedState: 'optional',
    officialHosts: 'email address; stripped from source trails',
  },
]

export function ConnectorActivationPanel({
  sources,
  events,
  now,
  showTechnicalNames = false,
}: {
  sources: OsintSourceSnapshot[]
  events: WorldIntelEvent[]
  now?: number
  showTechnicalNames?: boolean
}) {
  const rows = useMemo(() => buildConnectorAudit({ sources, events, now }), [events, now, sources])
  const activationRows = useMemo(
    () =>
      rows.filter((row) =>
        row.requiredEnv.length > 0 ||
        row.access === 'key-gated' ||
        row.access === 'user-agent-gated' ||
        row.status === 'missing-key' ||
        row.status === 'deferred',
      ),
    [rows],
  )
  const summary = useMemo(() => summarizeActivation(activationRows), [activationRows])

  return (
    <section className="activation-panel">
      <header className="activation-head">
        <div>
          <span className="activation-eyebrow">API Activation</span>
          <h2>Connector Activation Panel</h2>
        </div>
        <div className="activation-summary" aria-label="Connector activation summary">
          <ActivationPill label="online" value={summary.online} tone="ok" />
          <ActivationPill label="configured" value={summary.configured} tone="neutral" />
          <ActivationPill label="needs setup" value={summary.missing} tone="warn" />
          <ActivationPill label="failing" value={summary.failing} tone="bad" />
        </div>
      </header>

      <div className="activation-rule">
        <ShieldCheck size={14} />
        <span>Keys stay local. This panel shows connector state only; values are never displayed.</span>
      </div>

      <div className="activation-grid">
        {activationRows.map((row) => (
          <ActivationRow key={row.id} row={row} showTechnicalNames={showTechnicalNames} />
        ))}
      </div>

      <div className="activation-optional">
        <h3>Optional source overrides</h3>
        <div className="activation-grid">
          {OPTIONAL_ENDPOINTS.map((item) => (
            <article className="activation-row activation-row-optional" key={item.id}>
              <header>
                <strong>{item.label}</strong>
                <span>{item.expectedState}</span>
              </header>
              <div className="activation-env-list">
                <code>{showTechnicalNames ? item.envName : 'optional local source'}</code>
              </div>
              <p>{item.unlocks}</p>
              <small>Accepted source: {item.officialHosts}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ActivationRow({
  row,
  showTechnicalNames,
}: {
  row: ConnectorAuditRow
  showTechnicalNames: boolean
}) {
  const keyLabels = showTechnicalNames
    ? row.requiredEnv
    : row.requiredEnv.map((_, index) => `local key ${index + 1}`)

  return (
    <article className={`activation-row activation-status-${row.status}`}>
      <header>
        <div>
          <strong>{row.label}</strong>
          <span>{row.domain}</span>
        </div>
        <em>{statusLabel(row.status, row.requiredEnv)}</em>
      </header>
      <div className="activation-env-list">
        {keyLabels.length > 0 ? keyLabels.map((label) => <code key={label}>{label}</code>) : <code>no key required</code>}
      </div>
      <p>{row.notes}</p>
      <footer>
        <span>
          <KeyRound size={12} />
          {accessLabel(row)}
        </span>
        <span>{row.sourceTrailUi}</span>
        <span>{row.recordCount} records</span>
      </footer>
      {row.missingReason ? <small>{showTechnicalNames ? row.missingReason : operatorActivationText(row.missingReason)}</small> : null}
    </article>
  )
}

function ActivationPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'ok' | 'neutral' | 'warn' | 'bad'
}) {
  return (
    <span className={`activation-pill activation-tone-${tone}`}>
      <strong>{value}</strong>
      {label}
    </span>
  )
}

function summarizeActivation(rows: ConnectorAuditRow[]) {
  return {
    online: rows.filter((row) => row.status === 'online').length,
    configured: rows.filter((row) => row.status === 'configured' || row.status === 'pending-first-fetch').length,
    missing: rows.filter((row) => row.status === 'missing-key' || row.status === 'disabled' || row.status === 'deferred').length,
    failing: rows.filter((row) => row.status === 'failed' || row.status === 'rate-limited' || row.status === 'unavailable' || row.status === 'stale').length,
  }
}

function statusLabel(status: ConnectorRuntimeStatus, requiredEnv: string[]): string {
  if (status === 'missing-key') return requiredEnv.some((envName) => envName.endsWith('_URL')) ? 'needs source URL' : 'needs key'
  if (status === 'pending-first-fetch') return 'configured'
  if (status === 'rate-limited') return 'rate-limited'
  if (status === 'not-wired') return 'not connected'
  return status
}

function accessLabel(row: ConnectorAuditRow): string {
  if (row.access === 'user-agent-gated') return 'requires contact identity'
  if (row.access === 'key-gated') return 'requires local setup'
  if (row.access === 'optional-key') return 'optional key'
  return 'public'
}

function operatorActivationText(value: string): string {
  return value
    .replace(/ATLASZ_[A-Z0-9_]+(?:,\s*ATLASZ_[A-Z0-9_]+)*/g, 'local provider keys')
    .replace(/ATLASZ_[A-Z0-9_]+/g, 'local provider key')
    .replace(/\bconfig\b/gi, 'setup')
}
