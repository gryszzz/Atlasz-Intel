/*
 * Source registry / health panel (lazy). Provenance + honesty labels preserved.
 * Reads the OSINT source snapshot only — does not touch the source registry.
 */
import { Database } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import type { OsintSourceSnapshot } from '../../worldIntel'
import { WorldPanelHeader } from './WorldPanelHeader'

export function WorldSourceHealthPanel({
  sources,
  status,
}: {
  sources: OsintSourceSnapshot[]
  status: string
}) {
  return (
    <article className="world-panel world-status-panel">
      <WorldPanelHeader icon={Database} label="Source Registry" value={status} />
      <div className="source-registry-stack">
        {sources.map((source) => (
          <SourceRegistryRow key={source.sourceId} source={source} />
        ))}
        {sources.length === 0 && (
          <div className="world-empty inline-empty">
            <p>Source registry unavailable. No fake source-health rows are generated.</p>
          </div>
        )}
      </div>
    </article>
  )
}

function SourceRegistryRow({ source }: { source: OsintSourceSnapshot }) {
  return (
    <article className={`source-registry-row source-${source.status}`}>
      <header>
        <strong>{source.sourceName}</strong>
        <span>{source.status}</span>
      </header>
      <p>{source.legalSafetyNote}</p>
      <div>
        <ProvenanceBadge value={source.provenance} size="sm" />
        <span>{source.endpointType}</span>
        <span>{source.itemCount} items</span>
        <span>{Math.round(source.sourceReliabilityScore * 100)} trust</span>
      </div>
      {source.lastError && <em>{source.lastError}</em>}
    </article>
  )
}
