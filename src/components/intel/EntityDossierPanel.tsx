/*
 * Entity Dossier — the evidence drawer for one entity node.
 *
 * Shows everything that proves an entity exists and matters: its type, the
 * entities it connects to, the events that prove it (full source trail with
 * links, provenance, confidence, freshness), and what is still unknown. A
 * vulnerability node collapses KEV + NVD + GHSA evidence into one CVE dossier;
 * a company shows its filing -> ticker -> sector chain.
 *
 * Provenance shown is the strongest evidence provenance and is never relabeled
 * "verified" by the UI — the badge reflects exactly what the source declared.
 */
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  freshnessState,
  neighborsOf,
  type EntityNeighbor,
  type EntityGraph,
  type EntityKind,
  type EntityNode,
  type FreshnessState,
  type RelationType,
} from '../../engine/entityModel'
import { SEED_TRUST, exposureFor, type ExposurePath } from '../../engine/relationshipSeed'
import './EntityDossierPanel.css'

// Kinds that can plausibly carry curated structural exposure.
const EXPOSURE_KINDS = new Set<EntityKind>([
  'company',
  'index',
  'country',
  'technology',
  'commodity',
  'port',
  'chokepoint',
  'trade-route',
  'infrastructure',
  'sector',
])

const RELATION_LABEL: Record<RelationType, string> = {
  reported_by: 'reported by',
  about: 'about',
  filed_by: 'filed by',
  trades_as: 'trades as',
  in_sector: 'in sector',
  in_country: 'in country',
  observes: 'observes',
  affects: 'affects',
  touches: 'touches',
  references: 'references',
  released: 'released',
  represents: 'represents',
  issued_by: 'issued by',
}

export function EntityDossierPanel({
  graph,
  entityId,
  onSelectEntity,
}: {
  graph: EntityGraph
  entityId: string | null
  onSelectEntity?: (id: string) => void
}) {
  const node = entityId ? graph.nodes.find((candidate) => candidate.id === entityId) : undefined
  if (!node) {
    return (
      <section className="dossier-evidence dossier-empty">
        <strong>No entity selected</strong>
        <p>Select an entity from the evidence graph to inspect its proving events and connections.</p>
      </section>
    )
  }

  const neighbors = neighborsOf(graph, node.id)

  return (
    <section className="dossier-evidence" data-entity-kind={node.kind}>
      <header className="dossier-head">
        <div>
          <span className="dossier-kind">{node.kind}</span>
          <strong>{node.label}</strong>
        </div>
        <div className="dossier-trust">
          <ProvenanceBadge value={node.provenance} size="sm" />
          <FreshnessBadge freshness={node.freshness} />
          <span>{node.confidence}%</span>
        </div>
      </header>

      {node.unknowns.length > 0 && (
        <div className="dossier-unknowns">
          <span className="dossier-section-label">What is unknown</span>
          <ul>
            {node.unknowns.map((unknown) => (
              <li key={unknown}>{unknown}</li>
            ))}
          </ul>
        </div>
      )}

      <MarketIdentityProof node={node} neighbors={neighbors} />
      <InstitutionalHoldingProof node={node} neighbors={neighbors} />

      <div className="dossier-connections">
        <span className="dossier-section-label">Connected entities ({neighbors.length})</span>
        {neighbors.length > 0 ? (
          <ul>
            {neighbors.map((neighbor) => (
              <li key={`${neighbor.relation}-${neighbor.direction}-${neighbor.entity.id}`}>
                <button type="button" onClick={() => onSelectEntity?.(neighbor.entity.id)}>
                  <span className="dossier-relation">{RELATION_LABEL[neighbor.relation]}</span>
                  <span className="dossier-neighbor-kind">{neighbor.entity.kind}</span>
                  <span className="dossier-neighbor-label">{neighbor.entity.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dossier-muted">No linked entities yet.</p>
        )}
      </div>

      <div className="dossier-proof">
        <span className="dossier-section-label">Proving events ({node.evidence.length})</span>
        <ul>
          {node.evidence.map((evidence) => (
            <li key={`${evidence.eventId}-${evidence.sourceId}`} className="dossier-evidence-row">
              <div className="dossier-evidence-head">
                <strong>{evidence.sourceLabel}</strong>
                <ProvenanceBadge value={evidence.provenance} size="sm" />
                <span>{evidence.confidence}%</span>
              </div>
              <div className="dossier-evidence-meta">
                <FreshnessBadge freshness={freshnessState(evidence.observedAt, graph.generatedAt)} />
                {evidence.rawPayloadHash && <code title="raw payload hash">{evidence.rawPayloadHash.slice(0, 12)}…</code>}
              </div>
              {evidence.sourceUrl && (
                <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={11} />
                  source trail
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <StructuralExposure entity={node} />
    </section>
  )
}

function MarketIdentityProof({ node, neighbors }: { node: EntityNode; neighbors: EntityNeighbor[] }) {
  const proof = node.evidence.find((item) => item.sourceId === 'sec_company_tickers_public')
  if (!proof || !['company', 'ticker', 'cik'].includes(node.kind)) {
    return null
  }
  const tickers = neighbors.filter((item) => item.entity.kind === 'ticker').map((item) => item.entity.label)
  const ciks = neighbors.filter((item) => item.entity.kind === 'cik').map((item) => item.entity.label)
  return (
    <div className="dossier-market-identity">
      <span className="dossier-section-label">Market Identity</span>
      <strong>Resolved by ticker/CIK from SEC company tickers</strong>
      <p>
        SEC company_tickers.json proves ticker, CIK, and legal title. Exchange, sector, and industry are not present
        in this source and remain unavailable unless another source provides them.
      </p>
      <div className="dossier-market-identity-grid">
        <span>{tickers.length > 0 ? tickers.join(', ') : 'ticker linked through this identity'}</span>
        <span>{ciks.length > 0 ? ciks.join(', ') : 'CIK linked through this identity'}</span>
        <span>{proof.confidence}% confidence</span>
      </div>
      {proof.sourceUrl && (
        <a href={proof.sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={11} />
          SEC company_tickers.json
        </a>
      )}
    </div>
  )
}

function InstitutionalHoldingProof({ node, neighbors }: { node: EntityNode; neighbors: EntityNeighbor[] }) {
  const proofs = node.evidence.filter((item) => item.sourceId === 'sec_form13f_public')
  if (proofs.length === 0 || !['company', 'ticker', 'cusip', 'institution'].includes(node.kind)) {
    return null
  }
  const linkedTickers = neighbors.filter((item) => item.entity.kind === 'ticker').map((item) => item.entity.label)
  const linkedCusips = neighbors.filter((item) => item.entity.kind === 'cusip').map((item) => item.entity.label)
  const latest = proofs.reduce((max, item) => Math.max(max, item.observedAt), 0)
  return (
    <div className="dossier-institutional-holdings">
      <span className="dossier-section-label">Institutional Holdings</span>
      <strong>SEC Form 13F reported holding snapshot</strong>
      <p>
        Quarterly delayed SEC-reported holding evidence. This is not a current position, conviction, performance
        claim, valuation, price prediction, or trading advice.
      </p>
      <div className="dossier-institutional-grid">
        <span>{proofs.length} proving row{proofs.length === 1 ? '' : 's'}</span>
        <span>{linkedTickers.length > 0 ? linkedTickers.join(', ') : 'issuer ticker only if exact CUSIP map exists'}</span>
        <span>{linkedCusips.length > 0 ? linkedCusips.join(', ') : 'CUSIP evidence attached'}</span>
        <span>{latest ? `latest filed ${new Date(latest).toISOString().slice(0, 10)}` : 'filing date unavailable'}</span>
      </div>
      {proofs[0]?.sourceUrl && (
        <a href={proofs[0].sourceUrl} target="_blank" rel="noreferrer">
          <Link2 size={11} />
          SEC Form 13F source trail
        </a>
      )}
    </div>
  )
}

/**
 * Curated structural exposure — what is connected to this entity via the curated
 * relationship seed. This is reference structure (curated-reference), NOT live
 * evidence and NOT verified: it answers "what is exposed?" with an inspectable
 * chain (relation + source note + confidence per hop), and decays with depth.
 */
function StructuralExposure({ entity }: { entity: EntityNode }) {
  if (!EXPOSURE_KINDS.has(entity.kind)) {
    return null
  }
  const exposure = exposureFor(entity.id, { maxDepth: 3 }).slice(0, 12)
  return (
    <div className="dossier-exposure">
      <div className="dossier-exposure-head-row">
        <span className="dossier-section-label">Curated Exposure Chains</span>
        <span className="dossier-exposure-trust" title="Curated structural reference — not live evidence, not verified">
          trust: {SEED_TRUST}
        </span>
      </div>
      {exposure.length > 0 ? (
        <ul className="dossier-exposure-list">
          {exposure.map((path) => (
            <ExposureRow key={path.entity.id} path={path} />
          ))}
        </ul>
      ) : (
        <p className="dossier-muted">No curated structural exposure for this entity.</p>
      )}
    </div>
  )
}

function ExposureRow({ path }: { path: ExposurePath }) {
  return (
    <li className="dossier-exposure-row">
      <div className="dossier-exposure-row-head">
        <span className="dossier-neighbor-kind">{path.entity.kind}</span>
        <strong>{path.entity.label}</strong>
        <span className="dossier-exposure-depth">depth {path.depth}</span>
        <span className="dossier-exposure-conf" title="path confidence, decayed by depth">
          {Math.round(path.pathConfidence * 100)}%
        </span>
      </div>
      <ol className="dossier-exposure-chain">
        {path.hops.map((hop, index) => (
          <li key={`${hop.relation}-${hop.entity.id}-${index}`}>
            <span className="dossier-relation">{hop.relation.replace(/_/g, ' ')}</span>
            <span className="dossier-neighbor-label">{hop.entity.label}</span>
            <small title="curated rationale">{hop.sourceNote}</small>
          </li>
        ))}
      </ol>
    </li>
  )
}

function FreshnessBadge({ freshness }: { freshness: FreshnessState }) {
  return <span className={`freshness-badge fresh-${freshness}`}>{freshness}</span>
}
