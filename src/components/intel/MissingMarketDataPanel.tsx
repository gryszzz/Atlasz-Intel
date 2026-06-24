/*
 * Missing Market Data panel (Market Data Reality Pass).
 *
 * Honestly shows the market-data layers that have NO real provider yet
 * (source-needed / key-required), plus a self-audit of any simulated/seeded
 * surface still rendered in production. Production never shows a simulated
 * stand-in for a missing feed — it shows "source-needed".
 */
import { useMemo } from 'react'
import { marketDataRealityReport, type MarketDataSurface } from '../../engine/marketDataReality'
import './MarketCoverageDashboard.css'

export function MissingMarketDataPanel() {
  const report = useMemo(() => marketDataRealityReport(), [])
  return (
    <section className="cov-dash world-panel">
      <header className="cov-head">
        <div>
          <span className="cov-eyebrow">Market Data Reality</span>
          <h2>Missing Market Data</h2>
        </div>
        <p className="cov-sub">No simulated stand-ins in production. Missing price/market feeds are shown as source-needed.</p>
      </header>

      <div className="cov-sections">
        <div className="cov-section cov-tone-bad">
          <div className="cov-section-head">
            <strong>Source needed / key required</strong>
            <span>{report.sourceNeeded.length}</span>
          </div>
          <ul className="cov-list">
            {report.sourceNeeded
              .slice()
              .sort((a, b) => rel(a) - rel(b) || a.label.localeCompare(b.label))
              .map((surface) => (
                <SurfaceRow key={surface.id} surface={surface} statusLabel="source-needed" />
              ))}
          </ul>
        </div>

        {report.productionViolations.length > 0 && (
          <div className="cov-section cov-tone-bad">
            <div className="cov-section-head">
              <strong>Simulated/seeded — still in production (gate or remove)</strong>
              <span>{report.productionViolations.length}</span>
            </div>
            <ul className="cov-list">
              {report.productionViolations.map((surface) => (
                <SurfaceRow key={surface.id} surface={surface} statusLabel="simulated-dev" />
              ))}
            </ul>
          </div>
        )}

        <div className="cov-section cov-tone-curated">
          <div className="cov-section-head">
            <strong>Simulated surfaces (dev-only, excluded from ranking/exposure)</strong>
            <span>{report.simulatedDevOnly.length}</span>
          </div>
          <ul className="cov-list">
            {report.simulatedDevOnly.map((surface) => (
              <SurfaceRow key={surface.id} surface={surface} statusLabel="simulated-dev" />
            ))}
          </ul>
        </div>

        <div className="cov-section cov-tone-live">
          <div className="cov-section-head">
            <strong>Real, source-backed market data</strong>
            <span>{report.real.length}</span>
          </div>
          <ul className="cov-list">
            {report.real.map((surface) => (
              <SurfaceRow key={surface.id} surface={surface} statusLabel="real" />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function SurfaceRow({ surface, statusLabel }: { surface: MarketDataSurface; statusLabel: string }) {
  return (
    <li className="cov-row">
      <div className="cov-row-main">
        <span className="cov-row-label">{surface.label}</span>
        <code className="cov-row-layer">{surface.kind}</code>
        <span className="cov-cadence">{statusLabel}</span>
        <span className={`cov-rel cov-rel-${surface.marketRelevance}`}>{surface.marketRelevance}</span>
      </div>
      <div className="cov-row-detail">
        {surface.missingReason ? <em className="cov-missing">{surface.missingReason}</em> : <span className="cov-note">{surface.note}</span>}
      </div>
    </li>
  )
}

function rel(surface: MarketDataSurface): number {
  return surface.marketRelevance === 'high' ? 0 : surface.marketRelevance === 'medium' ? 1 : 2
}
