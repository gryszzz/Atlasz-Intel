import { Anchor, CircleDollarSign, GitBranch, Landmark, PackageOpen, ShieldAlert } from 'lucide-react'
import { buildWorldTradeMarketOverview, type TradeSignalRow } from '../../engine/worldTradeMarketOverview'
import type { OsintSourceSnapshot, WorldIntelEvent } from '../../worldIntel'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldTradeMarketOverview({
  events,
  sources,
  now,
}: {
  events: WorldIntelEvent[]
  sources: OsintSourceSnapshot[]
  now: number
}) {
  const overview = buildWorldTradeMarketOverview({ events, sources })
  return (
    <article className="world-panel world-trade-overview">
      <WorldPanelHeader icon={GitBranch} label="World Trade Market Overview" value="proof gated" />

      <div className="trade-overview-hero">
        <div>
          <span>OpenBB discipline + Worldwatch layers + Atlasz proof</span>
          <h4>Trade, ports, policy, infrastructure, hazards, and market evidence on one screen.</h4>
        </div>
        <ProvenanceBadge value="local-derived" size="sm" />
      </div>

      <div className="trade-metric-grid">
        {overview.metrics.map((metric) => (
          <div className="trade-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.sub}</em>
          </div>
        ))}
      </div>

      <div className="trade-layer-grid">
        {overview.layers.map((layer) => (
          <section className={`trade-layer trade-layer-${layer.status}`} key={layer.id}>
            <header>
              <strong>{layer.label}</strong>
              <span>{layer.status}</span>
            </header>
            <div>
              <ProvenanceBadge value={layer.trustTier} size="sm" />
              <em>{layer.recordCount} records</em>
              <em>{layer.onlineSourceCount}/{layer.sourceIds.length} sources online</em>
            </div>
            <p>{layer.status === 'online' ? layer.nonClaim : layer.disabledReason}</p>
          </section>
        ))}
      </div>

      <div className="trade-overview-layout">
        <section className="trade-route-board">
          <header>
            <div>
              <PackageOpen size={14} />
              <span>Trade Flow Board</span>
            </div>
            <strong>{overview.corridors.length} proof rows</strong>
          </header>
          {overview.corridors.length > 0 ? (
            <div className="trade-corridor-stack">
              {overview.corridors.map((corridor) => (
                <article className="trade-corridor-row" key={corridor.id}>
                  <div>
                    <strong>{corridor.reporter}</strong>
                    <span>to</span>
                    <strong>{corridor.partner}</strong>
                  </div>
                  <p>{corridor.commodity}</p>
                  <footer>
                    <em>{corridor.flow}</em>
                    <em>{corridor.period}</em>
                    <em>{corridor.valueLabel}</em>
                    <FreshnessBadge size="sm" now={now} retrievedAt={corridor.retrievedAt} />
                    <a href={corridor.sourceUrl} target="_blank" rel="noreferrer">proof</a>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <EmptyTradeState text="No UN Comtrade rows are in this view. Atlasz will not infer trade corridors from ports, media, or market symbols." />
          )}
        </section>

        <section className="trade-route-board">
          <header>
            <div>
              <Anchor size={14} />
              <span>Port / Location Context</span>
            </div>
            <strong>{overview.ports.length} records</strong>
          </header>
          {overview.ports.length > 0 ? (
            <div className="trade-port-grid">
              {overview.ports.map((port) => (
                <article className="trade-port-card" key={port.id}>
                  <strong>{port.name}</strong>
                  <span>{port.country}</span>
                  <p>{port.kind} | {port.detail}</p>
                  <footer>
                    <FreshnessBadge size="sm" now={now} retrievedAt={port.retrievedAt} />
                    <a href={port.sourceUrl} target="_blank" rel="noreferrer">proof</a>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <EmptyTradeState text="No source-backed port records are in this window. No synthetic ports are drawn." />
          )}
        </section>
      </div>

      <div className="trade-signal-grid">
        <SignalColumn icon={Landmark} title="Policy / Sanctions" rows={overview.policySignals} now={now} />
        <SignalColumn icon={CircleDollarSign} title="Market Evidence" rows={overview.marketSignals} now={now} />
        <SignalColumn icon={GitBranch} title="Infrastructure" rows={overview.infrastructureSignals} now={now} />
        <SignalColumn icon={ShieldAlert} title="Hazards" rows={overview.hazardSignals} now={now} />
      </div>

      <div className="trade-boundary-grid">
        <section>
          <strong>Unknowns</strong>
          {overview.unknowns.map((item) => <p key={item}>{item}</p>)}
        </section>
        <section>
          <strong>Does not prove</strong>
          {overview.nonClaims.map((item) => <p key={item}>{item}</p>)}
        </section>
      </div>
    </article>
  )
}

function SignalColumn({
  icon: Icon,
  title,
  rows,
  now,
}: {
  icon: typeof Landmark
  title: string
  rows: TradeSignalRow[]
  now: number
}) {
  return (
    <section className="trade-signal-column">
      <header>
        <Icon size={14} />
        <span>{title}</span>
      </header>
      {rows.length > 0 ? rows.map((row) => <SignalRow key={row.id} row={row} now={now} />) : <EmptyTradeState text="No proof-backed rows in this view." />}
    </section>
  )
}

function SignalRow({ row, now }: { row: TradeSignalRow; now: number }) {
  return (
    <article className="trade-signal-row">
      <strong>{row.label}</strong>
      <div>
        <span>{row.category}</span>
        <span>{row.sourceId}</span>
        <span>{Math.round(row.confidence * 100)} conf</span>
        <FreshnessBadge size="sm" now={now} retrievedAt={row.observedAt} />
      </div>
      {row.proofUrl ? <a href={row.proofUrl} target="_blank" rel="noreferrer">source trail</a> : null}
    </article>
  )
}

function EmptyTradeState({ text }: { text: string }) {
  return (
    <div className="trade-empty">
      <p>{text}</p>
    </div>
  )
}
