/**
 * In-memory entity relationship graph for Atlasz Intel.
 *
 * Kept in RAM as an adjacency list so downstream risk traversal is non-blocking
 * and runs in O(V + E): when a risk node fires (e.g. "Red Sea Delay") we walk
 * the directed relationship chain (Event -> Commodity -> Sector -> Ticker) and
 * surface the exposed assets instantly, ranked by cumulative path strength.
 *
 * This is intentionally dependency-free and framework-agnostic so it can be
 * shared by the UI, the realtime engine, and any background worker.
 */

export type IntelNodeKind =
  | 'event'
  | 'country'
  | 'commodity'
  | 'sector'
  | 'company'
  | 'ticker'
  | 'etf'
  | 'macro'
  | 'risk'
  | 'narrative'

export type IntelNode = {
  id: string
  label: string
  kind: IntelNodeKind
  /** Optional tradeable symbol for ticker/etf nodes — the actionable leaf. */
  symbol?: string
}

export type IntelEdge = {
  source: string
  target: string
  relation: string
  /** Relationship strength in [0, 1]; multiplied along a path. */
  weight: number
}

export type RiskPathHop = {
  nodeId: string
  relation: string
}

export type ExposedAsset = {
  node: IntelNode
  /** Product of edge weights from the origin to this node, in [0, 1]. */
  strength: number
  /** Number of hops from the origin. */
  depth: number
  /** Ordered relation chain from origin to this node. */
  path: RiskPathHop[]
}

export type TraversalOptions = {
  /** Stop expanding once a path's cumulative strength drops below this. */
  minStrength?: number
  /** Hard cap on traversal depth. */
  maxDepth?: number
  /** When set, only assets of these kinds are returned (traversal still spans all). */
  leafKinds?: IntelNodeKind[]
}

type AdjacencyEntry = {
  target: string
  relation: string
  weight: number
}

export class IntelGraph {
  private readonly nodes = new Map<string, IntelNode>()
  private readonly adjacency = new Map<string, AdjacencyEntry[]>()
  private edgeCount = 0

  get nodeCount(): number {
    return this.nodes.size
  }

  get edgeTotal(): number {
    return this.edgeCount
  }

  addNode(node: IntelNode): this {
    this.nodes.set(node.id, node)
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, [])
    }
    return this
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id)
  }

  getNode(id: string): IntelNode | undefined {
    return this.nodes.get(id)
  }

  /**
   * Add a directed, weighted edge. Unknown endpoints are auto-registered as
   * bare risk nodes so partial/imperfect source data never throws — the graph
   * degrades gracefully rather than rejecting the relationship.
   */
  addEdge(edge: IntelEdge): this {
    if (!this.nodes.has(edge.source)) {
      this.addNode({ id: edge.source, label: edge.source, kind: 'risk' })
    }
    if (!this.nodes.has(edge.target)) {
      this.addNode({ id: edge.target, label: edge.target, kind: 'risk' })
    }
    const weight = clamp01(edge.weight)
    const list = this.adjacency.get(edge.source)
    if (list) {
      list.push({ target: edge.target, relation: edge.relation, weight })
      this.edgeCount += 1
    }
    return this
  }

  /** Add an undirected relationship as two directed edges. */
  addBidirectionalEdge(edge: IntelEdge): this {
    this.addEdge(edge)
    this.addEdge({ source: edge.target, target: edge.source, relation: edge.relation, weight: edge.weight })
    return this
  }

  /**
   * Breadth-first risk traversal from `originId`. O(V + E): every node and edge
   * reachable under the strength/depth thresholds is examined at most once.
   * Returns exposed assets ordered by descending cumulative strength.
   */
  traverseRisk(originId: string, options: TraversalOptions = {}): ExposedAsset[] {
    const minStrength = options.minStrength ?? 0.05
    const maxDepth = options.maxDepth ?? 8
    const leafKinds = options.leafKinds ? new Set(options.leafKinds) : null

    const origin = this.nodes.get(originId)
    if (!origin) {
      return []
    }

    // Best strength seen per node, so we keep the strongest path and avoid
    // re-expanding weaker revisits (handles cycles safely).
    const bestStrength = new Map<string, number>()
    const results = new Map<string, ExposedAsset>()

    type Frame = { nodeId: string; strength: number; depth: number; path: RiskPathHop[] }
    const queue: Frame[] = [{ nodeId: originId, strength: 1, depth: 0, path: [] }]
    bestStrength.set(originId, 1)

    while (queue.length > 0) {
      const frame = queue.shift() as Frame

      if (frame.depth > 0) {
        const node = this.nodes.get(frame.nodeId)
        if (node && (!leafKinds || leafKinds.has(node.kind))) {
          const existing = results.get(node.id)
          if (!existing || frame.strength > existing.strength) {
            results.set(node.id, {
              node,
              strength: frame.strength,
              depth: frame.depth,
              path: frame.path,
            })
          }
        }
      }

      if (frame.depth >= maxDepth) {
        continue
      }

      const neighbors = this.adjacency.get(frame.nodeId)
      if (!neighbors) {
        continue
      }

      for (const neighbor of neighbors) {
        const nextStrength = frame.strength * neighbor.weight
        if (nextStrength < minStrength) {
          continue
        }
        const prior = bestStrength.get(neighbor.target)
        if (prior !== undefined && prior >= nextStrength) {
          continue
        }
        bestStrength.set(neighbor.target, nextStrength)
        queue.push({
          nodeId: neighbor.target,
          strength: nextStrength,
          depth: frame.depth + 1,
          path: [...frame.path, { nodeId: neighbor.target, relation: neighbor.relation }],
        })
      }
    }

    return Array.from(results.values()).sort((a, b) => b.strength - a.strength)
  }

  /** Convenience: tradeable symbols exposed to a risk origin, strongest first. */
  exposedSymbols(originId: string, options: TraversalOptions = {}): string[] {
    return this.traverseRisk(originId, { ...options, leafKinds: ['ticker', 'etf', 'company'] })
      .map((asset) => asset.node.symbol ?? asset.node.label)
  }

  /** Direct outbound relationships of a node (no traversal). */
  neighbors(id: string): AdjacencyEntry[] {
    return this.adjacency.get(id) ?? []
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

export type IntelGraphSeed = {
  nodes: IntelNode[]
  edges: IntelEdge[]
}

/** Build a graph from a flat seed definition. */
export function buildIntelGraph(seed: IntelGraphSeed): IntelGraph {
  const graph = new IntelGraph()
  for (const node of seed.nodes) {
    graph.addNode(node)
  }
  for (const edge of seed.edges) {
    graph.addEdge(edge)
  }
  return graph
}
