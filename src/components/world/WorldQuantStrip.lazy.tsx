/*
 * World quant strip (lazy). Shows aggregate metrics DERIVED locally from the
 * live snapshot — no fabricated charts or numbers. Provenance is labelled
 * local-derived so the strip never implies verified market data.
 */
import { Activity } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { WorldPanelHeader } from './WorldPanelHeader'

export type WorldQuantMetrics = {
  activeEvents: number
  sourcesOnline: number
  sourcesTotal: number
  avgCountryRisk: number
  topRegion: string
  topRegionRisk: number
}

export function WorldQuantStrip({ metrics }: { metrics: WorldQuantMetrics }) {
  const tiles: Array<{ label: string; value: string; sub: string }> = [
    { label: 'Active events', value: String(metrics.activeEvents), sub: 'in window' },
    {
      label: 'Sources online',
      value: `${metrics.sourcesOnline}/${metrics.sourcesTotal}`,
      sub: 'live / registered',
    },
    { label: 'Avg country risk', value: String(metrics.avgCountryRisk), sub: 'index 0–100' },
    { label: 'Top risk region', value: metrics.topRegion, sub: `risk ${metrics.topRegionRisk}` },
  ]
  return (
    <article className="world-panel world-quant-strip">
      <WorldPanelHeader icon={Activity} label="Derived Aggregates" value="local compute" />
      <div className="world-quant-grid">
        {tiles.map((tile) => (
          <div className="world-quant-tile" key={tile.label}>
            <span className="world-quant-label">{tile.label}</span>
            <strong className="world-quant-value">{tile.value}</strong>
            <span className="world-quant-sub">{tile.sub}</span>
          </div>
        ))}
      </div>
      <footer className="world-quant-foot">
        <ProvenanceBadge value="local-derived" size="sm" />
        <span>Computed from the live snapshot. Macro time-series arrive in a later phase.</span>
      </footer>
    </article>
  )
}
