/*
 * Shared primitives for the curated relationship seeds.
 *
 * Entity factories produce deterministic ids from (kind, label), so the same
 * entity referenced in different domain seed files resolves to the same graph
 * node id — the graph keys everything by id. This lets each domain file define
 * the entities it needs locally without a giant shared registry.
 */
import type { EntityKind } from './entityModel'

/** Curated relationships are reference knowledge — never `verified`, never live. */
export const SEED_TRUST = 'curated-reference' as const

export type SeedRelation =
  | 'designs'
  | 'fabricated_by'
  | 'supplies_equipment'
  | 'supplies_materials'
  | 'located_in'
  | 'gateway_for'
  | 'routes_through'
  | 'transports'
  | 'depends_on'
  | 'exposed_to'
  | 'supplies'
  | 'refines'
  | 'generates'
  | 'powers'
  | 'regulated_by'
  | 'assigned_to'
  | 'develops'
  | 'enables'
  | 'used_by'
  | 'parent_of'
  | 'subsidiary_of'
  | 'supplier_to'
  | 'customer_of'
  | 'member_of'
  | 'tracks'
  | 'holds_exposure_to'
  | 'operates_in'

export type SeedEntity = {
  id: string
  kind: EntityKind
  label: string
}

export type SeededRelationship = {
  from: SeedEntity
  to: SeedEntity
  relation: SeedRelation
  /** Curated confidence in [0,1]; firm public facts high, looser links lower. */
  confidence: number
  /** Why this relationship is believed — curated rationale, not live verification. */
  sourceNote: string
}

/** Deterministic entity id from kind + label. */
export function eid(kind: EntityKind, key: string): string {
  return `${kind}:${key.toLowerCase().trim().replace(/\s+/g, '-')}`
}

export const company = (name: string): SeedEntity => ({ id: eid('company', name), kind: 'company', label: name })
export const country = (code: string, label: string): SeedEntity => ({ id: eid('country', code), kind: 'country', label })
export const tech = (name: string): SeedEntity => ({ id: eid('technology', name), kind: 'technology', label: name })
export const port = (name: string): SeedEntity => ({ id: eid('port', name), kind: 'port', label: name })
export const chokepoint = (name: string): SeedEntity => ({ id: eid('chokepoint', name), kind: 'chokepoint', label: name })
export const route = (name: string): SeedEntity => ({ id: eid('trade-route', name), kind: 'trade-route', label: name })
export const commodity = (name: string): SeedEntity => ({ id: eid('commodity', name), kind: 'commodity', label: name })
export const sector = (name: string): SeedEntity => ({ id: eid('sector', name), kind: 'sector', label: name })
export const infra = (name: string): SeedEntity => ({ id: eid('infrastructure', name), kind: 'infrastructure', label: name })
export const institution = (name: string): SeedEntity => ({ id: eid('institution', name), kind: 'institution', label: name })
export const indexFund = (name: string): SeedEntity => ({ id: eid('index', name), kind: 'index', label: name })

export function rel(
  from: SeedEntity,
  relation: SeedRelation,
  to: SeedEntity,
  confidence: number,
  sourceNote: string,
): SeededRelationship {
  return { from, to, relation, confidence, sourceNote }
}
