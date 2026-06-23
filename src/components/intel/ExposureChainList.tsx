/*
 * Reusable renderer for curated structural exposure paths. Every row shows the
 * exposed entity, depth, path confidence (decayed), and the inspectable hop chain
 * (relation + curated source note per hop). Pure structure — never verified.
 */
import type { ExposurePath } from '../../engine/relationshipSeed'
import './ExposureChainList.css'

export function ExposureChainList({ exposure, limit = 10 }: { exposure: ExposurePath[]; limit?: number }) {
  const rows = exposure.slice(0, limit)
  if (rows.length === 0) {
    return <p className="exposure-empty">No structural exposure.</p>
  }
  return (
    <ul className="exposure-list">
      {rows.map((path) => (
        <li key={path.entity.id} className="exposure-row">
          <div className="exposure-row-head">
            <span className="exposure-kind">{path.entity.kind}</span>
            <strong>{path.entity.label}</strong>
            <span className="exposure-depth">depth {path.depth}</span>
            <span className="exposure-conf" title="path confidence, decayed by depth">
              {Math.round(path.pathConfidence * 100)}%
            </span>
          </div>
          <ol className="exposure-chain">
            {path.hops.map((hop, index) => (
              <li key={`${hop.relation}-${hop.entity.id}-${index}`}>
                <span className="exposure-rel">{hop.relation.replace(/_/g, ' ')}</span>
                <span className="exposure-hop-label">{hop.entity.label}</span>
                <small title="curated rationale">{hop.sourceNote}</small>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  )
}
