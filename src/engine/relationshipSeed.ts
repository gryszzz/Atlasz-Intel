/*
 * Relationship depth — curated structural knowledge (aggregator).
 *
 * Atlasz has deep EVIDENCE (events with typed sub-records); this layer adds the
 * persistent STRUCTURE that connects companies to the real world, so the system
 * can answer "what is exposed?" from known relationships rather than a guess.
 *
 * Honesty discipline:
 *  - CURATED REFERENCE relationships (public, well-documented facts), each with a
 *    `sourceNote`. Never labeled `verified`, never presented as live evidence.
 *  - Exposure paths are transparent: every hop carries its relation + note.
 *  - Structure supplies connectivity; live connectors supply materiality.
 *
 * Domain seeds live in per-file modules (semiconductor / portsTrade / energy /
 * patentsTech / corporate); this file aggregates them and provides the exposure
 * query. Behavior is identical to the previous single-file version — entity ids
 * are deterministic from (kind, label), so cross-domain references resolve to the
 * same graph node id.
 */
import { SEMICONDUCTOR_SEED } from './relationshipSeed.semiconductor'
import { PORTS_TRADE_SEED } from './relationshipSeed.portsTrade'
import { ENERGY_SEED } from './relationshipSeed.energy'
import { PATENTS_TECH_SEED } from './relationshipSeed.patentsTech'
import { CORPORATE_SEED } from './relationshipSeed.corporate'
import type { SeedEntity, SeedRelation, SeededRelationship } from './relationshipSeed.entities'

export {
  SEED_TRUST,
  type SeedEntity,
  type SeedRelation,
  type SeededRelationship,
} from './relationshipSeed.entities'
export { SEMICONDUCTOR_SEED } from './relationshipSeed.semiconductor'
export { PORTS_TRADE_SEED } from './relationshipSeed.portsTrade'
export { ENERGY_SEED } from './relationshipSeed.energy'
export { PATENTS_TECH_SEED } from './relationshipSeed.patentsTech'
export { CORPORATE_SEED } from './relationshipSeed.corporate'

export type ExposureHop = {
  entity: SeedEntity
  relation: SeedRelation
  confidence: number
  sourceNote: string
}

export type ExposurePath = {
  entity: SeedEntity
  depth: number
  /** Product of hop confidences along the path; decays with distance. */
  pathConfidence: number
  hops: ExposureHop[]
}

/** Combined curated seed across all domains (default for exposure queries). */
export const ALL_SEED: SeededRelationship[] = [
  ...SEMICONDUCTOR_SEED,
  ...PORTS_TRADE_SEED,
  ...ENERGY_SEED,
  ...PATENTS_TECH_SEED,
  ...CORPORATE_SEED,
]

type AdjEdge = { neighbor: SeedEntity; relation: SeedRelation; confidence: number; sourceNote: string }

function buildAdjacency(seed: SeededRelationship[]): Map<string, AdjEdge[]> {
  const adjacency = new Map<string, AdjEdge[]>()
  const push = (fromId: string, edge: AdjEdge) => {
    const list = adjacency.get(fromId) ?? []
    list.push(edge)
    adjacency.set(fromId, list)
  }
  for (const r of seed) {
    // Exposure is bidirectional connectivity (a shock to either end can reach the other).
    push(r.from.id, { neighbor: r.to, relation: r.relation, confidence: r.confidence, sourceNote: r.sourceNote })
    push(r.to.id, { neighbor: r.from, relation: r.relation, confidence: r.confidence, sourceNote: r.sourceNote })
  }
  return adjacency
}

export type ExposureOptions = {
  seed?: SeededRelationship[]
  maxDepth?: number
  minPathConfidence?: number
}

/**
 * What is structurally exposed to `originId`, via curated relationships. BFS keeps
 * the shortest path to each entity; every result carries its inspectable hop chain.
 */
export function exposureFor(originId: string, options: ExposureOptions = {}): ExposurePath[] {
  const seed = options.seed ?? ALL_SEED
  const maxDepth = options.maxDepth ?? 3
  const minPathConfidence = options.minPathConfidence ?? 0
  const adjacency = buildAdjacency(seed)
  if (!adjacency.has(originId)) {
    return []
  }

  const visited = new Set<string>([originId])
  const results: ExposurePath[] = []
  let frontier: Array<{ id: string; hops: ExposureHop[]; pathConfidence: number }> = [
    { id: originId, hops: [], pathConfidence: 1 },
  ]

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const edge of adjacency.get(node.id) ?? []) {
        if (visited.has(edge.neighbor.id)) {
          continue
        }
        visited.add(edge.neighbor.id)
        const hop: ExposureHop = {
          entity: edge.neighbor,
          relation: edge.relation,
          confidence: edge.confidence,
          sourceNote: edge.sourceNote,
        }
        const hops = [...node.hops, hop]
        const pathConfidence = Number((node.pathConfidence * edge.confidence).toFixed(4))
        if (pathConfidence >= minPathConfidence) {
          results.push({ entity: edge.neighbor, depth, pathConfidence, hops })
          next.push({ id: edge.neighbor.id, hops, pathConfidence })
        }
      }
    }
    frontier = next
  }

  return results.sort((a, b) => a.depth - b.depth || b.pathConfidence - a.pathConfidence || a.entity.id.localeCompare(b.entity.id))
}

/** Exposure filtered to companies — the "what companies are exposed?" answer. */
export function exposedCompanies(originId: string, options: ExposureOptions = {}): ExposurePath[] {
  return exposureFor(originId, options).filter((path) => path.entity.kind === 'company')
}

/** Union exposure across several origins (e.g. all entities an event touches). */
export function exposureForEntities(originIds: string[], options: ExposureOptions = {}): ExposurePath[] {
  const best = new Map<string, ExposurePath>()
  for (const originId of originIds) {
    for (const path of exposureFor(originId, options)) {
      const existing = best.get(path.entity.id)
      if (!existing || path.depth < existing.depth || (path.depth === existing.depth && path.pathConfidence > existing.pathConfidence)) {
        best.set(path.entity.id, path)
      }
    }
  }
  return [...best.values()].sort((a, b) => a.depth - b.depth || b.pathConfidence - a.pathConfidence || a.entity.id.localeCompare(b.entity.id))
}

export function seedEntities(seed: SeededRelationship[] = ALL_SEED): SeedEntity[] {
  const byId = new Map<string, SeedEntity>()
  for (const r of seed) {
    byId.set(r.from.id, r.from)
    byId.set(r.to.id, r.to)
  }
  return [...byId.values()]
}

export function summarizeSeed(seed: SeededRelationship[] = ALL_SEED) {
  const byRelation: Record<string, number> = {}
  for (const r of seed) byRelation[r.relation] = (byRelation[r.relation] ?? 0) + 1
  return { entityCount: seedEntities(seed).length, relationshipCount: seed.length, byRelation }
}
