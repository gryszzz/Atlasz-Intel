/**
 * GraphMutator — the adaptive cognitive overlay.
 *
 * Turns model-inferred CognitiveExtraction payloads into a mutable, weighted,
 * directed graph of event -> exposure relationships. Edge weights are
 * reinforced when news repeats and decayed over time, so the graph stays a
 * live picture of where systemic attention is concentrating.
 *
 * This is a SEPARATE overlay from the seeded reference graph (engine/intelGraph
 * + data/intel). Every node and edge here is provenance 'model-inferred' — i.e.
 * UNVERIFIED — and must be rendered distinctly from verified/seed relationships.
 * Atlasz never presents inferred links as verified live intelligence.
 *
 * Complexity: upsert is O(chain), decay is O(E), impact-path BFS is O(V + E).
 */
import type { CognitiveExtraction, ExposureDirection } from './cognitiveSchema'

export type CognitiveNodeKind = 'event' | 'sovereign' | 'location' | 'commodity' | 'corporation' | 'infrastructure' | 'asset'

export type CognitiveNode = {
  id: string
  label: string
  kind: CognitiveNodeKind
  firstSeen: number
  lastSeen: number
  /** Macro theme of the most recent event that touched this node, if any. */
  theme?: string
}

export type CognitiveEdge = {
  source: string
  target: string
  relation: string
  /** Operational weight in [0,1]; reinforced on repeat, decayed over time. */
  weight: number
  direction: ExposureDirection
  /** Always 'model-inferred' — unverified. */
  provenance: 'model-inferred'
  confidence: number
  createdAt: number
  lastReinforcedAt: number
  reinforcements: number
}

export type ImpactHop = {
  nodeId: string
  label: string
  relation: string
  weight: number
  direction: ExposureDirection
  depth: number
}

export type MutationResult = {
  eventId: string
  eventSummary: string
  addedNodes: string[]
  newEdges: number
  reinforcedEdges: number
}

export type GraphMutatorSnapshot = {
  nodes: CognitiveNode[]
  edges: CognitiveEdge[]
  nodeCount: number
  edgeCount: number
}

const ENTITY_KIND: Record<string, CognitiveNodeKind> = {
  Sovereign: 'sovereign',
  Location: 'location',
  Commodity: 'commodity',
  Corporation: 'corporation',
  Infrastructure: 'infrastructure',
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export type GraphMutatorOptions = {
  /** Multiplier applied to every edge per decay pass. Default 0.95. */
  decayFactor?: number
  /** Edges below this weight after decay are purged. Default 0.05. */
  purgeFloor?: number
  /** Injected clock for deterministic tests. */
  now?: () => number
}

export class GraphMutator {
  private readonly nodes = new Map<string, CognitiveNode>()
  private readonly adjacency = new Map<string, CognitiveEdge[]>()
  private readonly decayFactor: number
  private readonly purgeFloor: number
  private readonly now: () => number

  constructor(options: GraphMutatorOptions = {}) {
    this.decayFactor = options.decayFactor ?? 0.95
    this.purgeFloor = options.purgeFloor ?? 0.05
    this.now = options.now ?? Date.now
  }

  get nodeCount(): number {
    return this.nodes.size
  }

  get edgeCount(): number {
    let total = 0
    for (const edges of this.adjacency.values()) {
      total += edges.length
    }
    return total
  }

  /**
   * Ingest a validated LLM payload. Instantiates the event node, entity nodes,
   * and directed event->asset edges. Existing edges are amplified:
   *   W_new = min(1, W_old + exposure_weight * confidence_score)
   * (a brand-new edge starts from W_old = 0, i.e. exposure_weight * confidence).
   */
  upsertConnection(extraction: CognitiveExtraction): MutationResult {
    const now = this.now()
    const confidence = extraction.confidence_metrics.score
    const eventId = `event:${slug(extraction.event_summary)}`
    const addedNodes: string[] = []

    if (this.ensureNode(eventId, extraction.event_summary, 'event', now, extraction.primary_macro_theme)) {
      addedNodes.push(eventId)
    }

    for (const entity of extraction.extracted_entities) {
      const id = `entity:${slug(entity.name)}`
      if (this.ensureNode(id, entity.name, ENTITY_KIND[entity.type] ?? 'infrastructure', now, extraction.primary_macro_theme)) {
        addedNodes.push(id)
      }
      // Event involves entity (context edge, modest fixed weight).
      this.reinforceEdge(eventId, id, 'involves', 0.6, confidence, 'Volatility_Expansion', now)
    }

    let newEdges = 0
    let reinforcedEdges = 0
    for (const exposure of extraction.downstream_exposure_chain) {
      const targetId = `asset:${slug(exposure.node_name)}`
      if (this.ensureNode(targetId, exposure.node_name, 'asset', now, extraction.primary_macro_theme)) {
        addedNodes.push(targetId)
      }
      const relation = exposure.transmission_mechanism || exposure.exposure_direction
      const existed = this.hasEdge(eventId, targetId)
      this.reinforceEdge(eventId, targetId, relation, exposure.exposure_weight, confidence, exposure.exposure_direction, now)
      if (existed) {
        reinforcedEdges += 1
      } else {
        newEdges += 1
      }
    }

    return {
      eventId,
      eventSummary: extraction.event_summary,
      addedNodes,
      newEdges,
      reinforcedEdges,
    }
  }

  /**
   * Decay pass: multiply every edge weight by the decay factor and purge edges
   * that fall below the floor, eliminating graph fragmentation. Orphaned nodes
   * (no remaining in/out edges) are removed too. Returns counts.
   */
  applyGlobalEdgeDecay(): { decayed: number; purged: number } {
    let decayed = 0
    let purged = 0
    for (const [source, edges] of this.adjacency) {
      const surviving: CognitiveEdge[] = []
      for (const edge of edges) {
        edge.weight *= this.decayFactor
        decayed += 1
        if (edge.weight >= this.purgeFloor) {
          surviving.push(edge)
        } else {
          purged += 1
        }
      }
      if (surviving.length > 0) {
        this.adjacency.set(source, surviving)
      } else {
        this.adjacency.delete(source)
      }
    }
    this.pruneOrphanNodes()
    return { decayed, purged }
  }

  /**
   * BFS from an event node tracing all downstream nodes reachable via edges with
   * operational weight > minWeight. O(V + E): each node/edge visited once.
   */
  getDownstreamImpactPath(eventId: string, minWeight = 0.1): ImpactHop[] {
    if (!this.nodes.has(eventId)) {
      return []
    }
    const visited = new Set<string>([eventId])
    const queue: Array<{ id: string; depth: number }> = [{ id: eventId, depth: 0 }]
    const hops: ImpactHop[] = []

    while (queue.length > 0) {
      const current = queue.shift() as { id: string; depth: number }
      const edges = this.adjacency.get(current.id)
      if (!edges) {
        continue
      }
      for (const edge of edges) {
        if (edge.weight <= minWeight || visited.has(edge.target)) {
          continue
        }
        visited.add(edge.target)
        const node = this.nodes.get(edge.target)
        hops.push({
          nodeId: edge.target,
          label: node?.label ?? edge.target,
          relation: edge.relation,
          weight: edge.weight,
          direction: edge.direction,
          depth: current.depth + 1,
        })
        queue.push({ id: edge.target, depth: current.depth + 1 })
      }
    }

    return hops.sort((a, b) => b.weight - a.weight)
  }

  neighbors(id: string): CognitiveEdge[] {
    return this.adjacency.get(id) ?? []
  }

  getNode(id: string): CognitiveNode | undefined {
    return this.nodes.get(id)
  }

  snapshot(): GraphMutatorSnapshot {
    const edges: CognitiveEdge[] = []
    for (const list of this.adjacency.values()) {
      for (const edge of list) {
        edges.push({ ...edge })
      }
    }
    return {
      nodes: [...this.nodes.values()].map((node) => ({ ...node })),
      edges,
      nodeCount: this.nodes.size,
      edgeCount: edges.length,
    }
  }

  // --- internals ----------------------------------------------------------

  private ensureNode(id: string, label: string, kind: CognitiveNodeKind, now: number, theme?: string): boolean {
    const existing = this.nodes.get(id)
    if (existing) {
      existing.lastSeen = now
      if (theme) {
        existing.theme = theme
      }
      return false
    }
    this.nodes.set(id, { id, label, kind, firstSeen: now, lastSeen: now, theme })
    return true
  }

  private hasEdge(source: string, target: string): boolean {
    return (this.adjacency.get(source) ?? []).some((edge) => edge.target === target)
  }

  private reinforceEdge(
    source: string,
    target: string,
    relation: string,
    exposureWeight: number,
    confidence: number,
    direction: ExposureDirection,
    now: number,
  ): void {
    const list = this.adjacency.get(source) ?? []
    const increment = exposureWeight * confidence
    const existing = list.find((edge) => edge.target === target)
    if (existing) {
      existing.weight = Math.min(1, existing.weight + increment)
      existing.relation = relation
      existing.direction = direction
      existing.confidence = confidence
      existing.lastReinforcedAt = now
      existing.reinforcements += 1
      return
    }
    list.push({
      source,
      target,
      relation,
      weight: Math.min(1, increment),
      direction,
      provenance: 'model-inferred',
      confidence,
      createdAt: now,
      lastReinforcedAt: now,
      reinforcements: 0,
    })
    this.adjacency.set(source, list)
  }

  private pruneOrphanNodes(): void {
    const referenced = new Set<string>()
    for (const [source, edges] of this.adjacency) {
      referenced.add(source)
      for (const edge of edges) {
        referenced.add(edge.target)
      }
    }
    for (const id of [...this.nodes.keys()]) {
      if (!referenced.has(id)) {
        this.nodes.delete(id)
      }
    }
  }
}
