/*
 * Phase 3.5 historical precedent contract (shared by the Node playbook service
 * and the React panel). Types only.
 *
 * Honesty: embeddings + similarity are LOCAL-COMPUTED, never verified truth.
 * Return profiles are MATH-DERIVED and only present when real local price
 * history exists; otherwise RETURN_PROFILE_UNAVAILABLE. When no embedding path
 * or no prior events exist, the playbook is HISTORICAL_PLAYBOOK_UNAVAILABLE.
 */
import type { ProvenanceId } from './provenance'

export const PLAYBOOK_UNAVAILABLE = 'HISTORICAL_PLAYBOOK_UNAVAILABLE'
export const RETURN_PROFILE_UNAVAILABLE = 'RETURN_PROFILE_UNAVAILABLE'

export type ReturnProfile = {
  symbol: string
  oneDayPct: number | null
  fiveDayPct: number | null
  sevenDayPct: number | null
  provenance: ProvenanceId // math-derived
  unavailableReason?: string
}

export type PrecedentMatch = {
  eventId: string
  title: string
  timestamp: number
  category: string
  similarity: number // 0..1 cosine, local-computed
  linkedAssets: string[]
  matchReason: string
  provenance: ProvenanceId // local-computed
  returnProfile: ReturnProfile | null
}

export type HistoricalPlaybook = {
  queryEventId: string
  generatedAt: number
  embeddingModel: string
  available: boolean
  unavailableReason?: string
  matches: PrecedentMatch[]
}

export function unavailablePlaybook(queryEventId: string, reason: string, now = Date.now()): HistoricalPlaybook {
  return {
    queryEventId,
    generatedAt: now,
    embeddingModel: 'none',
    available: false,
    unavailableReason: reason,
    matches: [],
  }
}
