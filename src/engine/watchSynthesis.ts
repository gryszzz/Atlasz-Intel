/*
 * Intelligence synthesis — "what changed -> ... -> what to watch next".
 *
 * Composes the existing layers (evidence chain, entity resolution, curated
 * structural exposure, unknowns) into one honest brief per change, and adds the
 * missing forward end of the chain: possible next effects framed strictly as
 * CONFIRMATION-SEEKING watch items, plus what the change does NOT prove.
 *
 * Discipline (matches the whole product):
 *  - real data only; no fabricated causality; no price prediction; no advice.
 *  - every line carries a `basis`: live-evidence | curated-reference |
 *    inference-rule | unknown. Watch items are inference-rules (labeled), never
 *    predictions ("watch for / confirm via", never "X will happen").
 *  - unresolved stays unresolved; media-observation never counts as proof.
 */
import { evidenceChainFor, freshnessState, type EntityModelOptions } from './entityModel'
import { eventStructuralExposure } from './entityResolver'
import { corroborationKeys, sourceLabel } from './materialityEngine'
import { conflictsForEvent, detectConflicts, type ConflictSignal } from './conflictDetection'
import { freshnessLabel, freshnessWeight, type FreshnessLabel } from './freshness'
import type { EntityRef, FreshnessState } from './entityModel'
import type { WorldIntelEvent } from '../worldIntel'

/** Freshness weight at/above which corroboration is fresh enough to raise confidence. */
const RAISE_FRESHNESS_FLOOR = 0.65

/** Provenance classes that are derived/inferred structure, never live-change evidence. */
const STRUCTURAL_PROVENANCE: ReadonlySet<WorldIntelEvent['provenance']> = new Set([
  'local-derived',
  'local-computed',
  'math-derived',
  'local-model',
  'model-inferred',
  'simulated',
])

export type ClaimBasis = 'live-evidence' | 'curated-reference' | 'inference-rule' | 'unknown'

export type CorroborationSummary = {
  /** Distinct source-backed connectors (NOT media, NOT same-provider dupes) on the same key. */
  independentSourceCount: number
  /** Distinct media-observation sources on the same key — tracked, never counted as corroboration. */
  mediaSourceCount: number
  sourceTypes: WorldIntelEvent['provenance'][]
  connectors: string[]
  sharedEntities: string[]
  sharedTimeWindow: { from: number; to: number } | null
  freshness: FreshnessState
  /** Canonical freshness label of the freshest corroborating source. */
  freshnessLabel: FreshnessLabel
  /** Freshness weight [0,1] of the corroboration cohort; undefined = unknown (no signal). */
  freshnessWeight: number | undefined
  confidenceEffect: 'raises' | 'neutral' | 'limits'
  caveat: string
}

export type WatchItem = {
  id: string
  label: string
  basis: ClaimBasis
  /** Why this is worth watching — traces to evidence/structure, not a forecast. */
  rationale: string
}

export type BriefConfidence = {
  /** Freshness-weighted confidence in [0,1]; undefined = unknown (not zero-risk). */
  weight: number | undefined
  basis: ClaimBasis
  freshness: FreshnessLabel
  note: string
}

export type IntelligenceBrief = {
  eventId: string
  whatChanged: string
  proof: {
    source: string
    sourceUrl?: string
    provenance: WorldIntelEvent['provenance']
    freshness: FreshnessState
    observedAt: number
    payloadHash?: string
    /** Is the proving source itself verified-grade? (official/auth/public-disclosure) */
    sourceBacked: boolean
  }
  entitiesTouched: EntityRef[]
  /** Curated-reference structural exposure (never live evidence of impact). */
  systemsConnected: EntityRef[]
  resolvedEntityIds: string[]
  /** Freshness-weighted confidence in the proving evidence (stale/expired weigh less, never hidden). */
  confidence: BriefConfidence
  corroboration: CorroborationSummary
  /** Source/identity disagreements touching this event — surfaced, never merged. */
  conflicts: ConflictSignal[]
  watchNext: WatchItem[]
  unknowns: string[]
  doesNotProve: string[]
}

export type WatchSynthesisOptions = EntityModelOptions & {
  maxDepth?: number
  maxWatch?: number
  /** Other events to scan for cross-source corroboration (independent overlap). */
  corpus?: WorldIntelEvent[]
  /** Precomputed conflicts over the corpus (avoids recomputing per brief). */
  conflicts?: ConflictSignal[]
}

const SOURCE_BACKED: ReadonlySet<WorldIntelEvent['provenance']> = new Set([
  'official-api',
  'auth-gated',
  'public-disclosure',
  'public-unauthenticated',
  'verified',
])

export function synthesizeBrief(event: WorldIntelEvent, options: WatchSynthesisOptions = {}): IntelligenceBrief {
  const chain = evidenceChainFor(event, options)
  const exposed = eventStructuralExposure(event, options.maxDepth ? { maxDepth: options.maxDepth } : {})
  const systems = dedupeRefs(exposed.flatMap((e) => e.exposure.map((p) => p.entity)))
  const resolvedEntityIds = exposed.map((e) => e.resolution.canonicalSeedEntityId)
  const now = options.now ?? Date.now()
  const corroboration = buildCorroboration(event, options.corpus ?? [event], now)
  const allConflicts = options.conflicts ?? detectConflicts(options.corpus ?? [event], now)
  const conflicts = conflictsForEvent(event, allConflicts)
  const conflictUnknowns = conflicts.map((c) => `Conflict (${c.severity}): ${c.subject}`)
  const confidence = buildConfidence(event, chain.whenHappened, corroboration, now)

  return {
    eventId: event.id,
    whatChanged: chain.whatHappened,
    proof: {
      source: sourceLabel(event.sourceId),
      sourceUrl: event.sourceUrl,
      provenance: event.provenance,
      freshness: chain.freshness,
      observedAt: chain.whenHappened,
      payloadHash: event.rawPayloadHash || undefined,
      sourceBacked: SOURCE_BACKED.has(event.provenance),
    },
    entitiesTouched: chain.entitiesTouched,
    systemsConnected: systems,
    resolvedEntityIds,
    confidence,
    corroboration,
    conflicts,
    watchNext: buildWatchItems(event, chain.unknowns, systems, corroboration, conflicts).slice(0, options.maxWatch ?? 6),
    unknowns: [...chain.unknowns, ...conflictUnknowns],
    doesNotProve: buildDoesNotProve(event, systems.length > 0),
  }
}

/**
 * Synthesize briefs for a set of events, ranked for "what to watch next":
 * blocking conflicts first, then fresh + independently-corroborated changes, then
 * freshness-weighted confidence, with recency as the tiebreak. A bounded
 * most-recent candidate pool is synthesized, then ranked, then sliced.
 */
export function synthesizeBriefs(events: WorldIntelEvent[], options: WatchSynthesisOptions & { limit?: number } = {}): IntelligenceBrief[] {
  const limit = options.limit ?? 12
  const conflicts = detectConflicts(events, options.now ?? Date.now())
  const candidates = [...events]
    .filter((event) => Number.isFinite(event.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, Math.max(limit, 24))
  return candidates
    .map((event) => synthesizeBrief(event, { ...options, corpus: events, conflicts }))
    .sort((a, b) => briefPriority(b) - briefPriority(a) || b.proof.observedAt - a.proof.observedAt)
    .slice(0, limit)
}

/**
 * Freshness-weighted confidence in the proving evidence. Fresh evidence weighs
 * more than stale/expired (which stay visible at lower weight); a source with no
 * freshness signal (missing-key/unavailable/rate-limited) is UNKNOWN, not zero;
 * media observation is capped low; derived/inferred structure is structural, not
 * recent-change evidence. Corroboration is noted but never lifts past freshness.
 */
function buildConfidence(event: WorldIntelEvent, observedAt: number, corroboration: CorroborationSummary, now: number): BriefConfidence {
  const label = Number.isFinite(observedAt) ? freshnessLabel({ now, retrievedAt: observedAt }) : 'unavailable'
  const weight = freshnessWeight(label)
  if (weight === undefined) {
    return {
      weight: undefined,
      basis: 'unknown',
      freshness: label,
      note: 'Source has no freshness signal (missing-key / unavailable / rate-limited) — treat as unknown, not zero-risk.',
    }
  }
  if (event.provenance === 'media-observation') {
    return {
      weight: Math.min(weight, 0.3),
      basis: 'live-evidence',
      freshness: label,
      note: 'Media observation — confidence capped low; media is never corroboration or verified fact.',
    }
  }
  if (STRUCTURAL_PROVENANCE.has(event.provenance)) {
    return {
      weight,
      basis: 'curated-reference',
      freshness: label,
      note: 'Derived/inferred structure — supports relationships, not recent-change evidence.',
    }
  }
  let note = `Source-backed evidence weighted by freshness (${label}).`
  if (corroboration.confidenceEffect === 'raises') note += ' Independent corroboration raises confidence (not proof of impact).'
  else if (corroboration.confidenceEffect === 'limits') note += ' Only limited/media corroboration so far.'
  else note += ' Seek independent corroboration.'
  return {
    weight,
    basis: SOURCE_BACKED.has(event.provenance) ? 'live-evidence' : 'inference-rule',
    freshness: label,
    note,
  }
}

/**
 * What-To-Watch ordering: blocking identity conflicts first, then fresh +
 * independently-corroborated changes, then freshness-weighted confidence.
 * Unknown-freshness items rank at a neutral midpoint — never buried as if zero-risk.
 */
function briefPriority(brief: IntelligenceBrief): number {
  const blocking = brief.conflicts.some((c) => c.severity === 'blocking') ? 1 : 0
  const corroborated = brief.corroboration.confidenceEffect === 'raises' ? 1 : 0
  const weight = brief.confidence.weight ?? 0.5
  return blocking * 100 + corroborated * 10 + weight
}

function buildWatchItems(event: WorldIntelEvent, unknowns: string[], systems: EntityRef[], corroboration: CorroborationSummary, conflicts: ConflictSignal[]): WatchItem[] {
  const items: WatchItem[] = []
  const add = (id: string, label: string, rationale: string) => items.push({ id, label, basis: 'inference-rule', rationale })

  // Identity/source conflicts take priority — resolve disagreement before trusting.
  if (conflicts.some((c) => c.severity === 'blocking')) {
    add('resolve-conflict', 'Resolve the identity conflict before relying on this', 'Sources disagree on identity (refuse-merge); treat the resolution as uncertain.')
  } else if (conflicts.length > 0) {
    add('review-conflict', 'Review the flagged source disagreement', 'Sources/identifiers do not fully line up; surfaced as uncertainty, not merged.')
  }

  // Confirmation discipline driven by cross-source corroboration.
  if (corroboration.independentSourceCount === 0 && corroboration.mediaSourceCount > 0) {
    add('confirm-official', 'Watch for an official source to confirm this', 'Media-only observation; media is not corroboration.')
  } else if (corroboration.independentSourceCount <= 1) {
    add('confirm-independent', 'Watch for an independent official/public source', 'Single-source so far; independent overlap would raise confidence (not prove impact).')
  }
  if (unknowns.some((u) => /below high-confidence|unverified|low-trust/i.test(u))) {
    add('confirm-confidence', 'Watch for a higher-confidence confirmation', 'This change is below the high-confidence threshold or low-trust.')
  }

  // Structural exposure -> watch the exposed entities for live confirmation.
  if (systems.length > 0) {
    const company = systems.find((s) => s.kind === 'company')
    const target = company ?? systems[0]
    add(
      'confirm-exposure',
      `Watch official disclosures from structurally exposed ${target.kind} (${target.label})`,
      'Curated structural exposure suggests where a live effect could surface — it is not evidence of impact.',
    )
  }

  // Domain-specific confirmation cues (rule-based, source-anchored).
  if (event.kevVulnerability || event.nvdCve || event.ghsaAdvisory || event.osvVulnerability || event.cisaAdvisory) {
    add('confirm-vuln', 'Watch for vendor advisory, patch availability, and KEV/EPSS updates', 'Vulnerability records mature via cross-source corroboration and exploitation signals.')
  }
  if (event.secFiling || event.form4Transaction || event.form13fHolding || event.companyFact) {
    add('confirm-filing', 'Watch for follow-on SEC filings (8-K / amendments)', 'Filings often precede or follow related disclosures from the same issuer.')
  }
  if (event.eiaFacility || event.eiaRefinery || event.lngTerminal || event.nuclearPlant || event.gridRegion) {
    add('confirm-facility', 'Watch official operator/regulator status for this facility', 'Facility/geo context is location only — operator/regulator disclosure is the confirming source.')
  }
  if (event.weatherAlert) {
    add('confirm-weather', 'Watch for NWS escalation/expiry of this alert', 'Alerts change severity and expire; an alert is not damage.')
  }
  if (event.earthquakeEvent) {
    add('confirm-quake', 'Watch USGS revisions and official facility status nearby', 'Magnitude/location are observed; impact requires a separate official source.')
  }
  if (event.eiaEnergyRecord || event.comtradeRecord || event.mineralSite) {
    add('confirm-trend', 'Watch the next official release for trend confirmation', 'A single observation is a point; trend/impact needs the next datapoint.')
  }
  if (event.regulatoryDocument || event.congressBillAction || event.ofacSanctionsRecord) {
    add('confirm-policy', 'Watch for effective date, enforcement, or follow-on action', 'A policy/regulatory step matters once it takes effect or is enforced.')
  }

  return dedupeWatch(items)
}

function buildDoesNotProve(event: WorldIntelEvent, hasExposure: boolean): string[] {
  const out: string[] = ['Does not predict price or recommend any trade.']
  if (event.provenance === 'media-observation') out.push('Does not prove the underlying event occurred (media observation).')
  if (event.form13fHolding) out.push('Does not reflect current positions (13F is quarterly-delayed).')
  if (event.eiaFacility || event.eiaRefinery || event.lngTerminal || event.nuclearPlant || event.gridRegion || event.worldPort || event.unLocode) {
    out.push('Does not prove an outage, damage, or disruption (location/registry context only).')
  }
  if (event.earthquakeEvent || event.weatherAlert) out.push('Proximity/region match does not prove impact at any specific facility.')
  if (event.mineralSite) out.push('Does not reflect current production, reserves, or ownership.')
  if (hasExposure) out.push('Structural exposure is curated reference, not evidence of live impact.')
  return out
}

const SOURCE_BACKED_CORROBORATION: ReadonlySet<WorldIntelEvent['provenance']> = new Set([
  'official-api',
  'auth-gated',
  'public-disclosure',
  'public-unauthenticated',
  'verified',
])

/**
 * Cross-source corroboration: how many INDEPENDENT source-backed connectors touch
 * the same thematic key as this event. Media is tracked separately (never counts
 * as corroboration); same-provider duplicates collapse to one; curated structure
 * is not in the corpus. Overlap raises confidence, never proves impact/causality.
 */
function buildCorroboration(event: WorldIntelEvent, corpus: WorldIntelEvent[], now: number): CorroborationSummary {
  const keys = new Set(corroborationKeys(event))
  // Events sharing at least one thematic key with this event (incl. the event itself).
  const cohort = corpus.filter((e) => e.id === event.id || corroborationKeys(e).some((k) => keys.has(k)))

  const independent = new Set<string>()
  const media = new Set<string>()
  const sourceTypes = new Set<WorldIntelEvent['provenance']>()
  const connectors = new Set<string>()
  let from = Number.POSITIVE_INFINITY
  let to = Number.NEGATIVE_INFINITY
  let mostRecent = Number.NEGATIVE_INFINITY

  for (const e of cohort) {
    if (Number.isFinite(e.timestamp)) {
      from = Math.min(from, e.timestamp)
      to = Math.max(to, e.timestamp)
      mostRecent = Math.max(mostRecent, e.timestamp)
    }
    if (e.provenance === 'media-observation') {
      media.add(e.sourceId) // tracked, never corroboration
      continue
    }
    if (SOURCE_BACKED_CORROBORATION.has(e.provenance)) {
      independent.add(e.sourceId) // distinct connector => same-provider dupes collapse
      sourceTypes.add(e.provenance)
      connectors.add(sourceLabel(e.sourceId))
    }
  }

  // Shared keys actually spanning >1 distinct connector are the real corroborators.
  const sharedEntities = sharedKeyLabels(cohort, keys)
  const freshness = mostRecent > Number.NEGATIVE_INFINITY ? freshnessState(mostRecent, now) : 'unavailable'
  const corroborationLabel: FreshnessLabel = mostRecent > Number.NEGATIVE_INFINITY ? freshnessLabel({ now, retrievedAt: mostRecent }) : 'unavailable'
  const weight = freshnessWeight(corroborationLabel)
  // Only fresh-enough corroboration (cached or better) may RAISE confidence; stale/
  // expired or unknown-freshness overlap stays visible but cannot boost.
  const freshEnoughToRaise = weight !== undefined && weight >= RAISE_FRESHNESS_FLOOR
  const lowFreshnessNote =
    weight === undefined
      ? ' Corroborating sources have no current freshness signal (unknown).'
      : !freshEnoughToRaise
        ? ' Some corroborating sources are stale/expired (counted, but not boosting).'
        : ''
  const independentSourceCount = independent.size

  let confidenceEffect: CorroborationSummary['confidenceEffect']
  let caveat: string
  if (independentSourceCount >= 2) {
    confidenceEffect = freshEnoughToRaise ? 'raises' : 'neutral'
    caveat = `Corroborated by ${independentSourceCount} independent ${[...sourceTypes].join('/')} sources — independent overlap, not proof of impact or causality.${lowFreshnessNote}`
  } else if (independentSourceCount === 1 && media.size > 0) {
    confidenceEffect = 'neutral'
    caveat = 'Single official/public source plus media mentions — media is not corroboration; seek a second independent source.'
  } else if (independentSourceCount === 1) {
    confidenceEffect = 'neutral'
    caveat = 'Single-source observation — seek independent confirmation.'
  } else if (media.size > 0) {
    confidenceEffect = 'limits'
    caveat = 'Media-only observation — seek official confirmation.'
  } else {
    confidenceEffect = 'neutral'
    caveat = 'No corroborating sources found in the current window.'
  }

  return {
    independentSourceCount,
    mediaSourceCount: media.size,
    sourceTypes: [...sourceTypes],
    connectors: [...connectors],
    sharedEntities,
    sharedTimeWindow: Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null,
    freshness,
    freshnessLabel: corroborationLabel,
    freshnessWeight: weight,
    confidenceEffect,
    caveat,
  }
}

/** Thematic keys shared across >1 distinct connector, as readable labels. */
function sharedKeyLabels(cohort: WorldIntelEvent[], keys: Set<string>): string[] {
  const connectorsByKey = new Map<string, Set<string>>()
  for (const e of cohort) {
    if (e.provenance === 'media-observation') continue
    if (!SOURCE_BACKED_CORROBORATION.has(e.provenance)) continue
    for (const k of corroborationKeys(e)) {
      if (!keys.has(k)) continue
      const set = connectorsByKey.get(k) ?? new Set<string>()
      set.add(e.sourceId)
      connectorsByKey.set(k, set)
    }
  }
  return [...connectorsByKey.entries()]
    .filter(([, sources]) => sources.size >= 2)
    .map(([key]) => key)
    .sort()
    .slice(0, 12)
}

function dedupeRefs(refs: EntityRef[]): EntityRef[] {
  const seen = new Set<string>()
  const out: EntityRef[] = []
  for (const ref of refs) {
    if (seen.has(ref.id)) continue
    seen.add(ref.id)
    out.push(ref)
  }
  return out.slice(0, 24)
}

function dedupeWatch(items: WatchItem[]): WatchItem[] {
  const seen = new Set<string>()
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
}
