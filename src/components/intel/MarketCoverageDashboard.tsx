/*
 * Market Coverage Dashboard — the honesty brain.
 *
 * Shows what Atlasz actually covers across the market-impact universe, at what
 * cadence, with what trust, what's stale/unconfigured, what's only curated, and
 * what high-impact layers are still MISSING. Grounded in the real connector
 * runtime audit — nothing shows as "covered" unless a connector exists, and
 * nothing shows as "live" unless a realtime/near-realtime source is online.
 */
import { useMemo } from 'react'
import { buildConnectorAudit } from '../../engine/runtimeAudit'
import { buildCoverageAudit, type CoverageAuditItem, type CoverageBucket } from '../../engine/coverageAudit'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../../worldIntel'
import './MarketCoverageDashboard.css'

const SECTIONS: Array<{ title: string; buckets: CoverageBucket[]; tone: string }> = [
  { title: 'Realtime / near-realtime', buckets: ['realtime'], tone: 'live' },
  { title: 'Daily official updates', buckets: ['daily'], tone: 'daily' },
  { title: 'Periodic (monthly / quarterly / annual)', buckets: ['periodic'], tone: 'periodic' },
  { title: 'Static reference', buckets: ['static-reference'], tone: 'static' },
  { title: 'Curated-reference structure (not live evidence)', buckets: ['curated-reference'], tone: 'curated' },
  { title: 'Media observation (never counted as coverage)', buckets: ['media-observation'], tone: 'media' },
  { title: 'Key-gated but not configured', buckets: ['key-gated-unconfigured'], tone: 'warn' },
  { title: 'Configured · awaiting first poll', buckets: ['configured-only'], tone: 'warn' },
  { title: 'Stale / failing sources', buckets: ['stale-or-failed'], tone: 'bad' },
  { title: 'Missing high-impact layers', buckets: ['missing'], tone: 'bad' },
]

export function MarketCoverageDashboard({
  sources,
  events,
  now,
}: {
  sources: OsintSourceSnapshot[]
  events: WorldIntelEvent[]
  now?: number
}) {
  const audit = useMemo(() => {
    const connectorRows = buildConnectorAudit({ sources, events, now })
    return buildCoverageAudit({ connectorRows, now })
  }, [sources, events, now])

  // Fresh-weighted effective coverage: stale connectors count less, unknown is
  // neutral (not zero) — so a long "covered" list can't hide stale coverage.
  const effectiveCoverage = useMemo(() => {
    const weight = { fresh: 1, stale: 0.4, unknown: 0.5 } as const
    const total = audit.items
      .filter((item) => item.provider === 'connector')
      .reduce((sum, item) => sum + weight[item.freshness], 0)
    return Math.round(total * 10) / 10
  }, [audit])

  const s = audit.summary
  return (
    <section className="cov-dash world-panel">
      <header className="cov-head">
        <div>
          <span className="cov-eyebrow">Coverage Audit</span>
          <h2>Market Coverage Dashboard</h2>
        </div>
        <p className="cov-sub">Are we watching the things that can move markets? What is live, stale, curated, or missing.</p>
      </header>

      <div className="cov-summary" aria-label="Coverage summary">
        <Chip label="covered" value={s.covered} tone="ok" />
        <Chip label="fresh-weighted" value={effectiveCoverage} tone="ok" />
        <Chip label="missing" value={s.missing} tone="bad" />
        <Chip label="high-impact missing" value={s.highRelevanceMissing} tone="bad" />
        <Chip label="realtime/near" value={s.realtime} tone="live" />
        <Chip label="daily" value={s.daily} tone="daily" />
        <Chip label="periodic" value={s.periodic} tone="periodic" />
        <Chip label="static" value={s.staticReference} tone="static" />
        <Chip label="curated" value={s.curatedReference} tone="curated" />
        <Chip label="key-gated off" value={s.keyGatedUnconfigured} tone="warn" />
        <Chip label="stale/failing" value={s.staleOrFailed} tone="bad" />
      </div>

      <div className="cov-sections">
        {SECTIONS.map((section) => {
          const items = audit.items
            .filter((item) => section.buckets.includes(item.bucket))
            .sort((a, b) => relevanceRank(a) - relevanceRank(b) || a.label.localeCompare(b.label))
          if (items.length === 0) return null
          return (
            <div className={`cov-section cov-tone-${section.tone}`} key={section.title}>
              <div className="cov-section-head">
                <strong>{section.title}</strong>
                <span>{items.length}</span>
              </div>
              <ul className="cov-list">
                {items.map((item) => (
                  <CoverageRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CoverageRow({ item }: { item: CoverageAuditItem }) {
  return (
    <li className="cov-row">
      <div className="cov-row-main">
        <span className="cov-row-label">{item.label}</span>
        <code className="cov-row-layer">{layerLabel(item.layer)}</code>
        <span className="cov-cadence">{item.cadence}</span>
        <span className={`cov-rel cov-rel-${item.marketRelevance}`}>{item.marketRelevance}</span>
        {item.provider === 'connector' && item.liveCovered ? <span className="cov-live">live</span> : null}
        {item.provider === 'connector' && item.freshness !== 'unknown' ? (
          <span className={item.freshness === 'fresh' ? 'cov-fresh' : 'cov-stale'}>{item.freshness}</span>
        ) : null}
      </div>
      <div className="cov-row-detail">
        {item.connectors.length > 0 ? <span className="cov-conn">{item.connectors.join(', ')}</span> : null}
        {item.missingReason ? <em className="cov-missing">{item.missingReason}</em> : <span className="cov-note">{item.notes}</span>}
      </div>
    </li>
  )
}

function Chip({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`cov-chip cov-chip-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function relevanceRank(item: CoverageAuditItem): number {
  return item.marketRelevance === 'high' ? 0 : item.marketRelevance === 'medium' ? 1 : 2
}

function layerLabel(layer: string): string {
  return layer.replace(/-/g, ' ')
}
