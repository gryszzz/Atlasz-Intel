/*
 * AssetActionMatrix — institutional read-out of math-derived quant metrics for
 * one asset. Renders computed state only; each metric shows its value, status,
 * and provenance badge, and DATA_UNAVAILABLE when it cannot be computed.
 */
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { QUANT_UNAVAILABLE, type QuantMetric, type QuantSnapshot } from '../../quant'

export function AssetActionMatrix({ snapshot }: { snapshot: QuantSnapshot }) {
  if (!snapshot.dataAvailable) {
    return (
      <div className="action-matrix-unavailable">
        <strong>{QUANT_UNAVAILABLE}</strong>
        <p>{snapshot.unavailableReason ?? 'Not available from current public sources.'}</p>
      </div>
    )
  }

  return (
    <div className="action-matrix">
      <div className="action-matrix-head">
        <div>
          <strong>{snapshot.assetSymbol}</strong>
          {snapshot.benchmark && <span>vs {snapshot.benchmark}</span>}
        </div>
        <span className="action-matrix-markers">{snapshot.markers.length} linked events</span>
      </div>
      <div className="action-matrix-grid">
        {snapshot.metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  )
}

function MetricTile({ metric }: { metric: QuantMetric }) {
  const unavailable = metric.status === 'unavailable' || metric.metricValue === null
  return (
    <div className={`metric-tile metric-${metric.status}`} title={metric.explanation}>
      <span className="metric-name">{metric.metricName}</span>
      {unavailable ? (
        <strong className="metric-value metric-na">{QUANT_UNAVAILABLE}</strong>
      ) : (
        <strong className="metric-value">
          {formatValue(metric.metricValue as number)}
          <em>{metric.unit}</em>
        </strong>
      )}
      <div className="metric-foot">
        <span className={`metric-status status-${metric.status}`}>{metric.status}</span>
        <ProvenanceBadge value={metric.provenance} size="sm" />
      </div>
    </div>
  )
}

function formatValue(value: number): string {
  const abs = Math.abs(value)
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 3
  return `${value >= 0 ? '' : '-'}${abs.toFixed(digits)}`
}
