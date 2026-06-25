import { useMemo } from 'react'
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { sourceLabel } from '../../engine/materialityEngine'
import { summarizeExposure, type ExposureCount } from '../../engine/runtimeAudit'
import type { WorldIntelEvent } from '../../worldIntel'
import './ExposureDashboardPanel.css'

export function ExposureDashboardPanel({
  events,
  now,
}: {
  events: WorldIntelEvent[]
  now?: number
}) {
  const summary = useMemo(() => summarizeExposure({ events, now }), [events, now])

  return (
    <section className="exposure-dashboard">
      <header className="exposure-head">
        <div>
          <span className="exposure-eyebrow">Exposure Surface</span>
          <h2>Resolved Today</h2>
        </div>
        <div className="exposure-trust-row">
          <ProvenanceBadge value="local-derived" size="sm" />
          <span>resolver-rule · curated-reference</span>
        </div>
      </header>

      <div className="exposure-kpis">
        <Kpi label="events considered" value={summary.consideredEventCount} />
        <Kpi label="official resolved" value={summary.resolvedEventCount} tone="ok" />
        <Kpi label="curated context" value={summary.curatedReferenceOnlyCount} tone="muted" />
        <Kpi label="unresolved" value={summary.unresolvedEventCount} tone="warn" />
        <Kpi label="media observed" value={summary.mediaObservationCount} tone="observed" />
      </div>

      {summary.consideredEventCount === 0 ? (
        <div className="exposure-empty">
          <strong>DATA_UNAVAILABLE</strong>
          <p>No source-backed events are available in the current window. Atlasz does not invent exposure.</p>
        </div>
      ) : (
        <>
          <div className="exposure-rank-grid">
            <ExposureRank title="Countries" items={summary.topCountries} />
            <ExposureRank title="Companies" items={summary.topCompanies} />
            <ExposureRank title="Commodities" items={summary.topCommodities} />
            <ExposureRank title="Sectors" items={summary.topSectors} />
          </div>

          <div className="exposure-events">
            <span className="exposure-section-label">Recent resolved events</span>
            {summary.recentResolvedEvents.length > 0 ? (
              <ol>
                {summary.recentResolvedEvents.map((event) => (
                  <li key={event.eventId}>
                    <div>
                      <strong>{event.title}</strong>
                      <small>
                        {sourceLabel(event.sourceId)} · {event.exposedEntityCount} exposed nodes · {formatAge(event.observedAt)} · {event.freshness}
                      </small>
                    </div>
                    <span>{event.resolvedEntityIds.slice(0, 2).join(' · ')}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="exposure-empty compact">
                <strong>No resolved events</strong>
                <p>
                  Live evidence is present, but no explicit resolver-rule matched the curated reference graph.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="exposure-footnote">
        <Link2 size={12} />
        Three separate tiers: official/resolved events, curated-reference structural context, and media observations.
        Media observations (e.g. GDELT) are context only — never resolved into exposure and never ranked. Exposure paths
        are local resolver output over curated reference relationships, not verified live causality.
      </footer>
    </section>
  )
}

function Kpi({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'ok' | 'warn' | 'muted' | 'observed'
}) {
  return (
    <div className={`exposure-kpi tone-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ExposureRank({ title, items }: { title: string; items: ExposureCount[] }) {
  return (
    <section className="exposure-rank">
      <header>
        <span>{title}</span>
        <em>{items.length}</em>
      </header>
      {items.length > 0 ? (
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p>DATA_UNAVAILABLE</p>
      )}
    </section>
  )
}

function formatAge(timestamp: number): string {
  const delta = Date.now() - timestamp
  if (!Number.isFinite(delta)) return 'unknown'
  if (delta < 60_000) return 'just now'
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`
  return `${Math.round(delta / 86_400_000)}d ago`
}
