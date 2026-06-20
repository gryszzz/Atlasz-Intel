/*
 * QuantTerminalView — Phase 3 actionability surface. Lightweight orchestrator:
 * reads the computed QuantTerminalSnapshot from the Node quant service, lets the
 * user pick an asset, and renders the macro regime, chart (lazy recharts), and
 * action matrix. All heavy compute is upstream; this only renders state.
 */
import { Suspense, lazy, useMemo, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { ChartSkeleton } from '../ui/Skeletons'
import { AssetActionMatrix } from './AssetActionMatrix'
import { useQuantSnapshot } from '../../quantStore'
import { QUANT_UNAVAILABLE } from '../../quant'
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
