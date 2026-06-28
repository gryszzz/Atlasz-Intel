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
import { buildConnectorAudit, type ConnectorAuditRow } from '../../engine/runtimeAudit'
import { buildCoverageAudit, type CoverageAuditItem, type CoverageBucket } from '../../engine/coverageAudit'
import { WORLDWATCH_LAYER_DEFINITIONS } from '../../engine/worldwatchLayerRegistry'
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

const QUANT_CATEGORY_MATRIX: Array<{ label: string; itemIds: string[]; nonClaim: string }> = [
  { label: 'equities / ETFs', itemIds: ['price-equities', 'ownership-etf', 'identity-master'], nonClaim: 'No recommendation, ranking, valuation, or price prediction.' },
  { label: 'crypto', itemIds: ['price-crypto'], nonClaim: 'Public unauthenticated price context only; no recommendation or signal.' },
  { label: 'forex', itemIds: ['price-forex'], nonClaim: 'No FX quote source is wired yet.' },
  { label: 'futures / commodities', itemIds: ['price-futures', 'energy-series'], nonClaim: 'Energy series are official context, not futures pricing.' },
  { label: 'options / OI', itemIds: ['price-options'], nonClaim: 'Open interest is not flow, intent, or direction.' },
  { label: 'short interest', itemIds: ['ownership-short-options'], nonClaim: 'No short-interest source is wired yet.' },
  { label: 'SEC filings', itemIds: ['fundamentals-facts', 'ownership-insiders', 'ownership-institutions'], nonClaim: 'Filings are historical disclosures, not advice.' },
  { label: 'fundamentals', itemIds: ['fundamentals-facts'], nonClaim: 'Historical reported facts only; no estimates.' },
  { label: 'ownership / 13F', itemIds: ['ownership-institutions'], nonClaim: 'Delayed quarterly snapshot, not current positioning.' },
  { label: 'ETF/index holdings', itemIds: ['ownership-etf'], nonClaim: 'Dated issuer holdings only.' },
  { label: 'macro', itemIds: ['macro-us', 'macro-central-bank-policy', 'macro-global-series'], nonClaim: 'Official observations and release feeds, not forecasts.' },
  { label: 'rates', itemIds: ['price-rates-vol', 'macro-us'], nonClaim: 'No realtime rate/vol surface yet.' },
  { label: 'policy', itemIds: ['policy-us'], nonClaim: 'No legal outcome or market impact prediction.' },
  { label: 'calendar / earnings', itemIds: ['fundamentals-earnings'], nonClaim: 'No earnings calendar/transcript source is wired yet.' },
  { label: 'sentiment / media observation', itemIds: ['media-gdelt', 'media-market-rss'], nonClaim: 'Media observation is not verified fact.' },
  { label: 'alternative data', itemIds: ['alt-sentiment-provider', 'trade-movement', 'risk-fire-drought-flood'], nonClaim: 'No unofficial scraping or fragile source is accepted.' },
  { label: 'physical infrastructure', itemIds: ['infra-power', 'infra-refineries', 'infra-lng', 'infra-nuclear', 'infra-mines'], nonClaim: 'Facility context only; no outage/damage claim.' },
  { label: 'geospatial hazards', itemIds: ['risk-weather', 'risk-quakes', 'risk-fire-drought-flood'], nonClaim: 'Hazards do not prove asset damage.' },
  { label: 'supply chain / trade', itemIds: ['trade-flows', 'trade-port-codes', 'trade-ports-physical', 'trade-movement'], nonClaim: 'Country/port context only unless a source proves a company path.' },
  { label: 'research / patents', itemIds: ['tech-research', 'tech-space-context'], nonClaim: 'Metadata only; no validation of claims or quality.' },
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
  const connectorRows = useMemo(() => buildConnectorAudit({ sources, events, now }), [sources, events, now])
  const audit = useMemo(() => buildCoverageAudit({ connectorRows, now }), [connectorRows, now])
  const matrixRows = useMemo(() => buildQuantMatrixRows(audit.items), [audit.items])
  const catalogRows = useMemo(() => buildDataCatalogRows(connectorRows, audit.items), [connectorRows, audit.items])

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

      <div className="cov-matrix" aria-label="Quant coverage matrix">
        <div className="cov-matrix-head">
          <strong>Quant Coverage Matrix</strong>
          <span>awesome-quant checklist mapped to Atlasz truth state</span>
        </div>
        {matrixRows.map((row) => (
          <article className={`cov-matrix-row cov-matrix-${row.status}`} key={row.label}>
            <strong>{row.label}</strong>
            <span>{row.status}</span>
            <em>{row.trustTiers.join(' / ')}</em>
            <p>{row.nonClaim}</p>
          </article>
        ))}
      </div>

      <div className="cov-data-catalog" aria-label="Atlasz data catalog">
        <div className="cov-matrix-head">
          <strong>Data Catalog</strong>
          <span>connect once to dossiers, globe, source trails, coverage, agents</span>
        </div>
        <div className="cov-catalog-table" role="table" aria-label="Connector data catalog">
          <div className="cov-catalog-row cov-catalog-head" role="row">
            <span role="columnheader">Connector</span>
            <span role="columnheader">Entities</span>
            <span role="columnheader">Proof</span>
            <span role="columnheader">Cadence / config</span>
            <span role="columnheader">Surfaces</span>
          </div>
          {catalogRows.map((row) => (
            <article className={`cov-catalog-row cov-catalog-${row.status}`} key={row.id} role="row">
              <strong role="cell">{row.label}</strong>
              <span role="cell">{row.entities.join(', ') || 'metadata'}</span>
              <code role="cell">{row.proofFields.join(' | ')}</code>
              <span role="cell">{row.cadence} | {row.configState}</span>
              <span role="cell">{row.surfaces.join(', ')}</span>
            </article>
          ))}
        </div>
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

type QuantMatrixRow = {
  label: string
  status: 'covered' | 'key-gated' | 'configured-only' | 'missing'
  trustTiers: string[]
  nonClaim: string
}

type DataCatalogRow = {
  id: string
  label: string
  entities: string[]
  proofFields: string[]
  cadence: string
  configState: string
  surfaces: string[]
  status: ConnectorAuditRow['status']
}

function buildQuantMatrixRows(items: CoverageAuditItem[]): QuantMatrixRow[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return QUANT_CATEGORY_MATRIX.map((category) => {
    const members = category.itemIds.map((id) => byId.get(id)).filter((item): item is CoverageAuditItem => Boolean(item))
    const status = categoryStatus(members)
    const trustTiers = unique(members.map((item) => item.trustTier)).filter((tier) => tier !== 'none')
    return {
      label: category.label,
      status,
      trustTiers: trustTiers.length > 0 ? trustTiers : ['none'],
      nonClaim: category.nonClaim,
    }
  })
}

function buildDataCatalogRows(connectorRows: ConnectorAuditRow[], items: CoverageAuditItem[]): DataCatalogRow[] {
  const layerByConnector = new Map<string, string[]>()
  for (const layer of WORLDWATCH_LAYER_DEFINITIONS) {
    for (const sourceId of layer.sourceIds) {
      layerByConnector.set(sourceId, [...(layerByConnector.get(sourceId) ?? []), `Worldwatch: ${layer.label}`])
    }
  }

  return connectorRows.map((row) => {
    const linkedItems = items.filter((item) => item.connectors.includes(row.id))
    const surfaces = unique([
      'Connector Dashboard',
      'Market Coverage Dashboard',
      row.sourceTrailUi,
      ...(layerByConnector.get(row.id) ?? []),
    ])
    return {
      id: row.id,
      label: row.label,
      entities: unique(linkedItems.flatMap((item) => item.entityKinds)),
      proofFields: unique(linkedItems.flatMap((item) => item.expectedProofFields)).slice(0, 6),
      cadence: unique(linkedItems.map((item) => item.cadence)).join('/') || row.cadence,
      configState: row.requiredEnv.length > 0 ? row.requiredEnv.join(' + ') : accessLabel(row.access),
      surfaces,
      status: row.status,
    }
  })
}

function categoryStatus(items: CoverageAuditItem[]): QuantMatrixRow['status'] {
  if (items.length === 0 || items.every((item) => item.bucket === 'missing')) return 'missing'
  if (items.every((item) => item.bucket === 'key-gated-unconfigured')) return 'key-gated'
  if (items.some((item) => item.bucket === 'configured-only')) return 'configured-only'
  if (items.some((item) => item.provider === 'connector')) return 'covered'
  return 'missing'
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values.filter((value): value is T => Boolean(value)))]
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

function accessLabel(access: ConnectorAuditRow['access']): string {
  if (access === 'user-agent-gated') return 'requires user-agent'
  if (access === 'key-gated') return 'requires key'
  if (access === 'optional-key') return 'optional key'
  if (access === 'candidate') return 'candidate'
  return 'public'
}
