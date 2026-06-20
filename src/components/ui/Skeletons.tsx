/*
 * Reusable premium loading skeletons for Suspense fallbacks.
 * Composed from the fx-skeleton / fx-pulse primitives + design tokens.
 */
import './Skeletons.css'

export function GlobeSkeleton() {
  return (
    <div className="skeleton-globe" role="status" aria-label="Loading live map">
      <div className="skeleton-globe-sweep" aria-hidden="true" />
      <div className="skeleton-globe-ring" aria-hidden="true" />
      <span className="skeleton-caption">
        <span className="dot" aria-hidden="true" />
        Acquiring world layer
      </span>
    </div>
  )
}

export function PanelSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div className="skeleton-block" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="fx-skeleton skeleton-bar lg" key={index} style={{ height: 46 }} />
      ))}
    </div>
  )
}

export function SourceHealthSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-heartbeat" role="status" aria-label="Loading source health">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-heartbeat-row" key={index}>
          <span className="pulse" aria-hidden="true" />
          <span className="fx-skeleton skeleton-bar md" />
          <span className="fx-skeleton skeleton-bar sm" style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  )
}

export function QuantStripSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div className="skeleton-quant" role="status" aria-label="Loading metrics">
      {Array.from({ length: tiles }).map((_, index) => (
        <div className="fx-skeleton skeleton-quant-tile" key={index} />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return <div className="skeleton-chart" role="status" aria-label="Loading chart" />
}

export function GraphSkeleton() {
  return (
    <div className="skeleton-globe" role="status" aria-label="Loading relationship graph">
      <div className="skeleton-globe-sweep" aria-hidden="true" />
      <div className="skeleton-globe-ring" aria-hidden="true" />
      <span className="skeleton-caption">
        <span className="dot" aria-hidden="true" />
        Resolving entity graph
      </span>
    </div>
  )
}
