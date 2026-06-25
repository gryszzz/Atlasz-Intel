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
import { evidenceChainFor, type EntityModelOptions } from './entityModel'
import { eventStructuralExposure } from './entityResolver'
import { sourceLabel } from './materialityEngine'
import type { EntityRef, FreshnessState } from './entityModel'
import type { WorldIntelEvent } from '../worldIntel'

export type ClaimBasis = 'live-evidence' | 'curated-reference' | 'inference-rule' | 'unknown'

export type WatchItem = {
  id: string
  label: string
  basis: ClaimBasis
  /** Why this is worth watching — traces to evidence/structure, not a forecast. */
  rationale: string
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
  watchNext: WatchItem[]
  unknowns: string[]
  doesNotProve: string[]
}

export type WatchSynthesisOptions = EntityModelOptions & { maxDepth?: number; maxWatch?: number }

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
    watchNext: buildWatchItems(event, chain.unknowns, systems).slice(0, options.maxWatch ?? 6),
    unknowns: chain.unknowns,
    doesNotProve: buildDoesNotProve(event, systems.length > 0),
  }
}

/** Synthesize briefs for a set of events (most recent first). */
export function synthesizeBriefs(events: WorldIntelEvent[], options: WatchSynthesisOptions & { limit?: number } = {}): IntelligenceBrief[] {
  const limit = options.limit ?? 12
  return [...events]
    .filter((event) => Number.isFinite(event.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((event) => synthesizeBrief(event, options))
}

function buildWatchItems(event: WorldIntelEvent, unknowns: string[], systems: EntityRef[]): WatchItem[] {
  const items: WatchItem[] = []
  const add = (id: string, label: string, rationale: string) => items.push({ id, label, basis: 'inference-rule', rationale })

  // Confirmation discipline: low-trust / single-source / low-confidence changes.
  if (event.provenance === 'media-observation') {
    add('confirm-official', 'Watch for an official source to confirm this', 'Media observation is not verified fact; seek an official/source-backed corroboration.')
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
