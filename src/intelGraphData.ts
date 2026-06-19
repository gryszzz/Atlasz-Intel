/**
 * Adapts the seeded entity graph (data/intel.ts) into the in-memory IntelGraph
 * so the HUD can run real O(V+E) risk traversal — e.g. selecting "Red Sea"
 * surfaces Crude -> Energy -> XLE with cumulative path strength.
 */
import { buildIntelGraph, type ExposedAsset, type IntelGraph, type IntelNodeKind } from './engine/intelGraph'
import { graphEdges, graphNodes } from './data/intel'

const KIND_MAP: Record<string, IntelNodeKind> = {
  'Trade route': 'event',
  Risk: 'risk',
  Commodity: 'commodity',
  ETF: 'etf',
  Macro: 'macro',
  Country: 'country',
  Company: 'company',
  Sector: 'sector',
}

/** Graph node ids that map to an actual tradeable symbol. */
const NODE_SYMBOL: Record<string, string> = {
  xle: 'XLE',
  qqq: 'QQQ',
  nvda: 'NVDA',
  tesla: 'TSLA',
  tsmc: 'TSM',
  oil: 'CL',
  gold: 'GLD',
}

let cached: IntelGraph | null = null

export function getIntelGraph(): IntelGraph {
  if (!cached) {
    cached = buildIntelGraph({
      nodes: graphNodes.map((node) => ({
        id: node.id,
        label: node.label,
        kind: KIND_MAP[node.kind] ?? 'risk',
        symbol: NODE_SYMBOL[node.id],
      })),
      edges: graphEdges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        relation: edge.label,
        weight: edge.strength / 100,
      })),
    })
  }
  return cached
}

/** Downstream exposed assets/entities for a graph node, strongest path first. */
export function riskChainFor(nodeId: string | null): ExposedAsset[] {
  if (!nodeId) {
    return []
  }
  return getIntelGraph().traverseRisk(nodeId, { minStrength: 0.05, maxDepth: 8 })
}
