/*
 * Evidence Graph surface — the clickable entry point into the entity model.
 *
 * Renders the evidence-bearing entity nodes derived by `buildEntityGraph` as a
 * selectable index (grouped by kind, ranked by how much evidence connects them),
 * and opens the selected entity's dossier. This is deliberately SEPARATE from the
 * risk-BFS RelationshipGraph: this surface is about evidence and provenance, not
 * exposure propagation.
 *
 * Empty input renders DATA_UNAVAILABLE — never fabricated nodes.
 */
import { useMemo, useState } from 'react'
import { buildEntityGraph, type EntityNode } from '../../engine/entityModel'
import type { WorldIntelEvent } from '../../worldIntel'
import { EntityDossierPanel } from './EntityDossierPanel'
import './EntityEvidenceGraphPanel.css'

export function EntityEvidenceGraphPanel({ events, now }: { events: WorldIntelEvent[]; now?: number }) {
  const graph = useMemo(() => buildEntityGraph(events, now !== undefined ? { now } : {}), [events, now])
  const ranked = useMemo(() => rankNodes(graph.nodes), [graph.nodes])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (graph.status === 'DATA_UNAVAILABLE') {
    return (
      <section className="evg evg-empty">
        <header className="evg-head">
          <span>Evidence Graph</span>
          <strong>DATA_UNAVAILABLE</strong>
        </header>
        <p>No evidence-bearing entities yet. This surface only shows entities that connectors have actually proven.</p>
      </section>
    )
  }

  const activeId = selectedId && graph.nodes.some((node) => node.id === selectedId) ? selectedId : ranked[0]?.id ?? null

  return (
    <section className="evg">
      <header className="evg-head">
        <span>Evidence Graph</span>
        <strong>{graph.nodes.length} entities · {graph.relationships.length} links</strong>
      </header>
      <div className="evg-body">
        <ol className="evg-index">
          {ranked.map((node) => (
            <li key={node.id}>
              <button
                type="button"
                className={node.id === activeId ? 'evg-node active' : 'evg-node'}
                onClick={() => setSelectedId(node.id)}
              >
                <span className="evg-node-kind">{node.kind}</span>
                <span className="evg-node-label">{node.label}</span>
                <span className="evg-node-degree" title="connections">{node.degree}</span>
              </button>
            </li>
          ))}
        </ol>
        <EntityDossierPanel graph={graph} entityId={activeId} onSelectEntity={setSelectedId} />
      </div>
    </section>
  )
}

/** Rank by evidence breadth then connectivity so corroborated entities surface first. */
function rankNodes(nodes: EntityNode[]): EntityNode[] {
  return [...nodes]
    .filter((node) => node.kind !== 'event' && node.kind !== 'source')
    .sort(
      (a, b) =>
        b.evidence.length - a.evidence.length ||
        b.degree - a.degree ||
        a.label.localeCompare(b.label),
    )
}
