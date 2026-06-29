/*
 * QuantTerminalView — Phase 3 actionability surface. Lightweight orchestrator:
 * reads the computed QuantTerminalSnapshot from the Node quant service, lets the
 * user pick an asset, and renders the macro regime, chart (lazy recharts), and
 * action matrix. All heavy compute is upstream; this only renders state.
 */
import { Suspense, lazy, useMemo, useState } from 'react'
import { Activity, Link2, RefreshCw } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { ChartSkeleton } from '../ui/Skeletons'
import { AssetActionMatrix } from './AssetActionMatrix'
import { useQuantSnapshot } from '../../quantStore'
import { QUANT_UNAVAILABLE } from '../../quant'
import type { BeaObservation, EiaEnergyRecord, FredMacroObservation, TreasuryFiscalRecord } from '../../worldIntel'
import './QuantTerminalView.css'

const QuantChartPanel = lazy(() =>
  import('./QuantChartPanel').then((m) => ({ default: m.QuantChartPanel })),
)

const REGIME_LABEL: Record<string, string> = {
  'risk-on': 'Risk-On',
  'risk-off': 'Risk-Off',
  mixed: 'Mixed',
  unavailable: 'Unavailable',
}

export function QuantTerminalView() {
  const { snapshot, loading, refresh } = useQuantSnapshot()
  const [selected, setSelected] = useState<string | null>(null)

  const available = useMemo(() => snapshot.assets.filter((asset) => asset.dataAvailable), [snapshot.assets])
  const activeSymbol = selected ?? available[0]?.assetSymbol ?? snapshot.assets[0]?.assetSymbol ?? null
  const active = snapshot.assets.find((asset) => asset.assetSymbol === activeSymbol) ?? null

  return (
    <div className="quant-terminal">
      <section className="quant-macro-strip">
        <div className={`quant-regime quant-regime-${snapshot.macro.regime}`}>
          <span>Macro regime</span>
          <strong>{REGIME_LABEL[snapshot.macro.regime] ?? snapshot.macro.regime}</strong>
          <ProvenanceBadge value={snapshot.macro.regimeProvenance} size="sm" />
        </div>
        <p className="quant-regime-note">{snapshot.macro.regimeExplanation}</p>
        <div className="quant-macro-metrics">
          {snapshot.macro.metrics.map((metric) => (
            <div className={`quant-macro-tile metric-${metric.status}`} key={metric.id} title={metric.explanation}>
              <span>{metric.metricName}</span>
              <strong>
                {metric.metricValue === null ? QUANT_UNAVAILABLE : `${metric.metricValue} ${metric.unit}`}
              </strong>
            </div>
          ))}
          {snapshot.macro.metrics.length === 0 && (
            <div className="quant-macro-tile metric-unavailable">
              <span>Macro series</span>
              <strong>{QUANT_UNAVAILABLE}</strong>
            </div>
          )}
        </div>
        <FredMacroContextCards observations={snapshot.macro.fredObservations} />
        <TreasuryFiscalContextCards records={snapshot.macro.treasuryFiscalRecords ?? []} />
        <BeaMacroContextCards observations={snapshot.macro.beaObservations ?? []} />
        <EiaEnergyContextCards records={snapshot.macro.eiaEnergyRecords ?? []} />
        <button className="quant-refresh" type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={14} />
          {loading ? 'Computing' : 'Recompute'}
        </button>
      </section>

      {snapshot.assets.length === 0 ? (
        <section className="quant-empty">
          <Activity size={20} />
          <strong>{QUANT_UNAVAILABLE}</strong>
          <p>
            No computed quant snapshots yet. The quant engine runs in the desktop app over persisted market bars; with
            no local price history it fails closed rather than inventing data.
          </p>
        </section>
      ) : (
        <section className="quant-body">
          <div className="quant-asset-rail">
            {snapshot.assets.map((asset) => (
              <button
                className={asset.assetSymbol === activeSymbol ? 'quant-asset active' : 'quant-asset'}
                key={asset.assetSymbol}
                type="button"
                onClick={() => setSelected(asset.assetSymbol)}
              >
                <strong>{asset.assetSymbol}</strong>
                <span>{asset.dataAvailable ? `${asset.metrics.length} metrics` : QUANT_UNAVAILABLE}</span>
              </button>
            ))}
          </div>
          <div className="quant-detail">
            {active && (
              <>
                <Suspense fallback={<ChartSkeleton />}>
                  <QuantChartPanel snapshot={active} />
                </Suspense>
                <AssetActionMatrix snapshot={active} />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export function FredMacroContextCards({ observations }: { observations: FredMacroObservation[] }) {
  const sorted = [...observations].sort((left, right) => right.observationTimestamp - left.observationTimestamp).slice(0, 6)
  return (
    <section className="fred-context-cards" aria-label="FRED macro context">
      <header>
        <span>FRED Source Trail</span>
        <strong>{sorted.length > 0 ? `${sorted.length} official series` : QUANT_UNAVAILABLE}</strong>
      </header>
      {sorted.length > 0 ? (
        <div className="fred-context-grid">
          {sorted.map((observation) => (
            <article className="fred-context-card" key={observation.id}>
              <header>
                <strong>{observation.seriesId}</strong>
                <ProvenanceBadge value={observation.provenance} size="sm" />
              </header>
              <p>{observation.title}</p>
              <div className="fred-value-row">
                <strong>{observation.rawValue}</strong>
                <span>{observation.units}</span>
              </div>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{observation.sourceName}</dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>{formatAge(observation.retrievedAt)}</dd>
                </div>
                <div>
                  <dt>Series ID</dt>
                  <dd>{observation.seriesId}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{observation.confidence}%</dd>
                </div>
                <div>
                  <dt>Last obs</dt>
                  <dd>{observation.observationDate}</dd>
                </div>
                <div>
                  <dt>Frequency</dt>
                  <dd>{observation.frequency}</dd>
                </div>
              </dl>
              <a href={observation.sourceUrl} target="_blank" rel="noreferrer">
                <Link2 size={12} />
                FRED source trail
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="fred-context-unavailable">
          <strong>{QUANT_UNAVAILABLE}</strong>
          <p>FRED macro observations unavailable. The public FRED CSV source returned nothing, failed, or rate-limited. Optional ATLASZ_FRED_API_KEY only upgrades REST metadata.</p>
        </div>
      )}
    </section>
  )
}

export function TreasuryFiscalContextCards({ records }: { records: TreasuryFiscalRecord[] }) {
  const sorted = [...records].sort((left, right) => right.recordTimestamp - left.recordTimestamp).slice(0, 6)
  return (
    <section className="treasury-context-cards" aria-label="Treasury fiscal context">
      <header>
        <span>Treasury Source Trail</span>
        <strong>{sorted.length > 0 ? `${sorted.length} official records` : QUANT_UNAVAILABLE}</strong>
      </header>
      {sorted.length > 0 ? (
        <div className="treasury-context-grid">
          {sorted.map((record) => (
            <article className="treasury-context-card" key={record.id}>
              <header>
                <strong>{record.datasetId}</strong>
                <ProvenanceBadge value={record.provenance} size="sm" />
              </header>
              <p>{record.metricName}</p>
              <div className="treasury-value-row">
                <strong>{formatCurrency(record.metricValue)}</strong>
                <span>{record.units}</span>
              </div>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{record.sourceName}</dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>{formatAge(record.retrievedAt)}</dd>
                </div>
                <div>
                  <dt>Dataset</dt>
                  <dd>{record.datasetName}</dd>
                </div>
                <div>
                  <dt>Table</dt>
                  <dd>{record.tableName}</dd>
                </div>
                <div>
                  <dt>Record date</dt>
                  <dd>{record.recordDate}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{record.confidence}%</dd>
                </div>
              </dl>
              <div className="treasury-source-links">
                <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Treasury source trail
                </a>
                <a href={record.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Official API URL
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="treasury-context-unavailable">
          <strong>{QUANT_UNAVAILABLE}</strong>
          <p>Treasury Fiscal Data records unavailable. Refresh public world sources; no fiscal data is simulated.</p>
        </div>
      )}
    </section>
  )
}

export function BeaMacroContextCards({ observations }: { observations: BeaObservation[] }) {
  const sorted = [...observations].sort((left, right) => right.observationTimestamp - left.observationTimestamp).slice(0, 6)
  return (
    <section className="bea-context-cards" aria-label="BEA macro context">
      <header>
        <span>BEA Source Trail</span>
        <strong>{sorted.length > 0 ? `${sorted.length} official observations` : QUANT_UNAVAILABLE}</strong>
      </header>
      {sorted.length > 0 ? (
        <div className="bea-context-grid">
          {sorted.map((observation) => (
            <article className="bea-context-card" key={observation.id}>
              <header>
                <strong>{observation.tableName}</strong>
                <ProvenanceBadge value={observation.provenance} size="sm" />
              </header>
              <p>{observation.lineDescription}</p>
              <div className="bea-value-row">
                <strong>{observation.rawValue}</strong>
                <span>{observation.units}</span>
              </div>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{observation.sourceName}</dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>{formatAge(observation.retrievedAt)}</dd>
                </div>
                <div>
                  <dt>Dataset</dt>
                  <dd>{observation.datasetName}</dd>
                </div>
                <div>
                  <dt>Table</dt>
                  <dd>{observation.tableName}</dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>{observation.timePeriod}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{observation.confidence}%</dd>
                </div>
              </dl>
              <div className="bea-source-links">
                <a href={observation.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  BEA source trail
                </a>
                <a href={observation.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  Official API URL
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bea-context-unavailable">
          <strong>{QUANT_UNAVAILABLE}</strong>
          <p>BEA macro observations unavailable. Configure ATLASZ_BEA_API_KEY; no GDP data is simulated.</p>
        </div>
      )}
    </section>
  )
}

export function EiaEnergyContextCards({ records }: { records: EiaEnergyRecord[] }) {
  const sorted = [...records].sort((left, right) => right.observationTimestamp - left.observationTimestamp).slice(0, 6)
  return (
    <section className="eia-context-cards" aria-label="EIA energy context">
      <header>
        <span>EIA Energy Source Trail</span>
        <strong>{sorted.length > 0 ? `${sorted.length} official records` : QUANT_UNAVAILABLE}</strong>
      </header>
      {sorted.length > 0 ? (
        <div className="eia-context-grid">
          {sorted.map((record) => (
            <article className="eia-context-card" key={record.id}>
              <header>
                <strong>{record.seriesId}</strong>
                <ProvenanceBadge value={record.provenance} size="sm" />
              </header>
              <p>{record.title}</p>
              <div className="eia-value-row">
                <strong>{record.rawValue}</strong>
                <span>{record.units}</span>
              </div>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{record.sourceName}</dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>{formatAge(record.retrievedAt)}</dd>
                </div>
                <div>
                  <dt>Commodity</dt>
                  <dd>{record.commodity}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{record.energyCategory}</dd>
                </div>
                <div>
                  <dt>Observation</dt>
                  <dd>{record.observationDate}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{record.confidence}%</dd>
                </div>
              </dl>
              <div className="eia-source-links">
                <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  EIA source trail
                </a>
                <a href={record.sourceApiUrl} target="_blank" rel="noreferrer">
                  <Link2 size={12} />
                  {record.sourceApiUrl.includes('/opendata/bulk/') ? 'EIA public bulk URL' : 'Official API URL'}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="eia-context-unavailable">
          <strong>{QUANT_UNAVAILABLE}</strong>
          <p>EIA energy records unavailable; no energy data or commodity alerts are simulated. Public bulk reference may be bounded or stale; authenticated API coverage still requires ATLASZ_EIA_API_KEY.</p>
        </div>
      )}
    </section>
  )
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return QUANT_UNAVAILABLE
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAge(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  return `${Math.round(hours / 24)}d`
}
