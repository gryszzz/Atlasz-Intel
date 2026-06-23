/*
 * Entity resolution bridge — link live event entities to curated seed entities.
 *
 * This is the moment a live connector event (SEC filing, market ticker, EIA
 * commodity record, GitHub release) can light up the curated Exposure Chains:
 * resolve the event's identifiers to canonical seed entity ids, then run the
 * existing exposure query.
 *
 * Discipline:
 *  - Resolution is NOT verification. The seed stays `curated-reference`; the live
 *    event keeps its own provenance. The two are never merged.
 *  - Only EXPLICIT, curated alias rules match — no fuzzy/substring guessing.
 *  - Every resolution carries a matchType + reason (why it matched).
 *  - No match -> unresolved (the entity stays separate, never force-merged).
 *  - `source: 'resolver-rule'` marks the resolution as a rule, not evidence.
 */
import type { WorldIntelEvent } from '../worldIntel'
import { ALL_SEED, exposureFor, seedEntities, type ExposurePath } from './relationshipSeed'
import { mapCpcCodes } from './cpcTechnologyMap'

export type ResolutionMatchType = 'exact' | 'alias' | 'ticker' | 'cik' | 'source-id' | 'classification'

export type ResolutionResult =
  | {
      resolved: true
      sourceEntityId: string
      canonicalSeedEntityId: string
      matchType: ResolutionMatchType
      confidence: number
      reason: string
      source: 'resolver-rule'
    }
  | {
      resolved: false
      sourceEntityId: string
      reason: string
    }

type AliasRule = {
  matchType: Exclude<ResolutionMatchType, 'exact'>
  alias: string
  canonicalSeedEntityId: string
  confidence: number
  note: string
}

/**
 * Curated alias rules. Explicit only — a ticker/CIK/name/source-id resolves to a
 * seed entity ONLY when listed here. Adding fuzzy matching is intentionally not
 * done: unknown identifiers must stay unresolved.
 */
export const ALIAS_RULES: AliasRule[] = [
  // NVIDIA
  { matchType: 'ticker', alias: 'NVDA', canonicalSeedEntityId: 'company:nvidia', confidence: 0.97, note: 'NVDA is the Nasdaq ticker for NVIDIA Corporation.' },
  { matchType: 'cik', alias: '1045810', canonicalSeedEntityId: 'company:nvidia', confidence: 0.98, note: 'SEC CIK 1045810 is NVIDIA Corporation.' },
  { matchType: 'alias', alias: 'NVIDIA', canonicalSeedEntityId: 'company:nvidia', confidence: 0.95, note: 'Common name for NVIDIA Corporation.' },
  { matchType: 'alias', alias: 'NVIDIA Corporation', canonicalSeedEntityId: 'company:nvidia', confidence: 0.97, note: 'Legal name of NVIDIA.' },
  // AMD
  { matchType: 'ticker', alias: 'AMD', canonicalSeedEntityId: 'company:amd', confidence: 0.95, note: 'AMD is the Nasdaq ticker for Advanced Micro Devices.' },
  { matchType: 'cik', alias: '2488', canonicalSeedEntityId: 'company:amd', confidence: 0.98, note: 'SEC CIK 2488 is Advanced Micro Devices.' },
  { matchType: 'alias', alias: 'Advanced Micro Devices', canonicalSeedEntityId: 'company:amd', confidence: 0.96, note: 'Legal name of AMD.' },
  // Apple
  { matchType: 'ticker', alias: 'AAPL', canonicalSeedEntityId: 'company:apple', confidence: 0.97, note: 'AAPL is the Nasdaq ticker for Apple Inc.' },
  { matchType: 'cik', alias: '320193', canonicalSeedEntityId: 'company:apple', confidence: 0.98, note: 'SEC CIK 320193 is Apple Inc.' },
  { matchType: 'alias', alias: 'Apple Inc', canonicalSeedEntityId: 'company:apple', confidence: 0.96, note: 'Legal name of Apple.' },
  // TSMC (ADR — resolve carefully)
  { matchType: 'ticker', alias: 'TSM', canonicalSeedEntityId: 'company:tsmc', confidence: 0.9, note: 'TSM is the NYSE ADR ticker for Taiwan Semiconductor Manufacturing (TSMC).' },
  { matchType: 'alias', alias: 'TSMC', canonicalSeedEntityId: 'company:tsmc', confidence: 0.95, note: 'Common name for Taiwan Semiconductor Manufacturing Company.' },
  { matchType: 'alias', alias: 'Taiwan Semiconductor', canonicalSeedEntityId: 'company:tsmc', confidence: 0.9, note: 'Short legal name for TSMC.' },
  { matchType: 'alias', alias: 'Taiwan Semiconductor Manufacturing', canonicalSeedEntityId: 'company:tsmc', confidence: 0.95, note: 'Legal name of TSMC.' },
  // ASML / Microsoft / Intel / Broadcom / Qualcomm / Micron / Exxon / Tesla
  { matchType: 'ticker', alias: 'ASML', canonicalSeedEntityId: 'company:asml', confidence: 0.93, note: 'ASML is the Nasdaq ADR ticker for ASML Holding.' },
  { matchType: 'ticker', alias: 'MSFT', canonicalSeedEntityId: 'company:microsoft', confidence: 0.97, note: 'MSFT is the Nasdaq ticker for Microsoft.' },
  { matchType: 'cik', alias: '789019', canonicalSeedEntityId: 'company:microsoft', confidence: 0.98, note: 'SEC CIK 789019 is Microsoft Corporation.' },
  { matchType: 'ticker', alias: 'INTC', canonicalSeedEntityId: 'company:intel', confidence: 0.95, note: 'INTC is the Nasdaq ticker for Intel.' },
  { matchType: 'ticker', alias: 'AVGO', canonicalSeedEntityId: 'company:broadcom', confidence: 0.95, note: 'AVGO is the Nasdaq ticker for Broadcom.' },
  { matchType: 'ticker', alias: 'QCOM', canonicalSeedEntityId: 'company:qualcomm', confidence: 0.95, note: 'QCOM is the Nasdaq ticker for Qualcomm.' },
  { matchType: 'ticker', alias: 'MU', canonicalSeedEntityId: 'company:micron', confidence: 0.93, note: 'MU is the Nasdaq ticker for Micron.' },
  { matchType: 'ticker', alias: 'XOM', canonicalSeedEntityId: 'company:exxonmobil', confidence: 0.95, note: 'XOM is the NYSE ticker for ExxonMobil.' },
  { matchType: 'alias', alias: 'Exxon Mobil', canonicalSeedEntityId: 'company:exxonmobil', confidence: 0.95, note: 'Legal name of ExxonMobil.' },
  { matchType: 'ticker', alias: 'TSLA', canonicalSeedEntityId: 'company:tesla', confidence: 0.96, note: 'TSLA is the Nasdaq ticker for Tesla.' },
  // Big tech (SEC CIKs match the SEC adapter's default map).
  { matchType: 'ticker', alias: 'AMZN', canonicalSeedEntityId: 'company:amazon', confidence: 0.96, note: 'AMZN is the Nasdaq ticker for Amazon.' },
  { matchType: 'cik', alias: '1018724', canonicalSeedEntityId: 'company:amazon', confidence: 0.98, note: 'SEC CIK 1018724 is Amazon.com, Inc.' },
  { matchType: 'ticker', alias: 'GOOGL', canonicalSeedEntityId: 'company:alphabet', confidence: 0.95, note: 'GOOGL is the Nasdaq ticker for Alphabet Inc.' },
  { matchType: 'ticker', alias: 'GOOG', canonicalSeedEntityId: 'company:alphabet', confidence: 0.95, note: 'GOOG is a Nasdaq ticker for Alphabet Inc.' },
  { matchType: 'cik', alias: '1652044', canonicalSeedEntityId: 'company:alphabet', confidence: 0.98, note: 'SEC CIK 1652044 is Alphabet Inc.' },
  { matchType: 'ticker', alias: 'META', canonicalSeedEntityId: 'company:meta', confidence: 0.96, note: 'META is the Nasdaq ticker for Meta Platforms.' },
  { matchType: 'cik', alias: '1326801', canonicalSeedEntityId: 'company:meta', confidence: 0.98, note: 'SEC CIK 1326801 is Meta Platforms, Inc.' },

  // Patent-assignee legal names (exact, curated — map to seed companies).
  { matchType: 'alias', alias: 'Intel Corporation', canonicalSeedEntityId: 'company:intel', confidence: 0.95, note: 'Legal name of Intel.' },
  { matchType: 'alias', alias: 'Advanced Micro Devices, Inc.', canonicalSeedEntityId: 'company:amd', confidence: 0.95, note: 'Legal name of AMD.' },
  { matchType: 'alias', alias: 'QUALCOMM Incorporated', canonicalSeedEntityId: 'company:qualcomm', confidence: 0.93, note: 'Legal name of Qualcomm.' },
  { matchType: 'alias', alias: 'Micron Technology, Inc.', canonicalSeedEntityId: 'company:micron', confidence: 0.93, note: 'Legal name of Micron.' },
  { matchType: 'alias', alias: 'Tesla, Inc.', canonicalSeedEntityId: 'company:tesla', confidence: 0.94, note: 'Legal name of Tesla.' },
  { matchType: 'alias', alias: 'Taiwan Semiconductor Manufacturing Company, Ltd.', canonicalSeedEntityId: 'company:tsmc', confidence: 0.95, note: 'Legal name of TSMC.' },
  { matchType: 'alias', alias: 'ASML Netherlands B.V.', canonicalSeedEntityId: 'company:asml', confidence: 0.9, note: 'A principal ASML operating entity.' },
  { matchType: 'alias', alias: 'Samsung Electronics Co., Ltd.', canonicalSeedEntityId: 'company:samsung', confidence: 0.92, note: 'Legal name of Samsung Electronics.' },
  { matchType: 'alias', alias: 'Broadcom Inc.', canonicalSeedEntityId: 'company:broadcom', confidence: 0.93, note: 'Legal name of Broadcom.' },
  { matchType: 'alias', alias: 'SK hynix Inc.', canonicalSeedEntityId: 'company:sk-hynix', confidence: 0.92, note: 'Legal name of SK hynix.' },
  { matchType: 'alias', alias: 'Microsoft Technology Licensing, LLC', canonicalSeedEntityId: 'company:microsoft', confidence: 0.9, note: 'Microsoft’s patent-holding entity.' },
  { matchType: 'alias', alias: 'Cheniere Energy, Inc.', canonicalSeedEntityId: 'company:cheniere', confidence: 0.9, note: 'Legal name of Cheniere.' },
  { matchType: 'alias', alias: 'NextEra Energy, Inc.', canonicalSeedEntityId: 'company:nextera-energy', confidence: 0.9, note: 'Legal name of NextEra Energy.' },

  // Commodities (names + EIA series ids).
  { matchType: 'alias', alias: 'crude oil', canonicalSeedEntityId: 'commodity:crude-oil', confidence: 0.85, note: 'Commodity name maps to the seed crude oil node.' },
  { matchType: 'alias', alias: 'WTI crude oil', canonicalSeedEntityId: 'commodity:crude-oil', confidence: 0.8, note: 'WTI is a crude oil benchmark.' },
  { matchType: 'source-id', alias: 'PET.RWTC.D', canonicalSeedEntityId: 'commodity:crude-oil', confidence: 0.85, note: 'EIA series PET.RWTC.D is WTI crude oil spot price.' },
  { matchType: 'alias', alias: 'natural gas', canonicalSeedEntityId: 'commodity:natural-gas', confidence: 0.85, note: 'Commodity name maps to the seed natural gas node.' },
  { matchType: 'source-id', alias: 'NG.RNGWHHD.D', canonicalSeedEntityId: 'commodity:natural-gas', confidence: 0.85, note: 'EIA series NG.RNGWHHD.D is Henry Hub natural gas spot price.' },
  { matchType: 'alias', alias: 'electricity', canonicalSeedEntityId: 'commodity:electricity', confidence: 0.8, note: 'Commodity name maps to the seed electricity node.' },
  // FRED energy series (where a seed commodity node exists).
  { matchType: 'source-id', alias: 'DCOILWTICO', canonicalSeedEntityId: 'commodity:crude-oil', confidence: 0.82, note: 'FRED series DCOILWTICO is WTI crude oil spot price.' },
  { matchType: 'source-id', alias: 'DHHNGSP', canonicalSeedEntityId: 'commodity:natural-gas', confidence: 0.82, note: 'FRED series DHHNGSP is Henry Hub natural gas spot price.' },

  // GitHub repos — allowlisted only.
  { matchType: 'source-id', alias: 'NVIDIA/cutlass', canonicalSeedEntityId: 'company:nvidia', confidence: 0.8, note: 'Allowlisted: the NVIDIA/cutlass repo is owned by NVIDIA.' },
  { matchType: 'source-id', alias: 'NVIDIA/TensorRT', canonicalSeedEntityId: 'company:nvidia', confidence: 0.8, note: 'Allowlisted: the NVIDIA/TensorRT repo is owned by NVIDIA.' },
]

const SEED_IDS = new Set(seedEntities(ALL_SEED).map((entity) => entity.id))

const byTicker = indexRules('ticker', (alias) => alias.toUpperCase().trim())
const byCik = indexRules('cik', normalizeCik)
const byName = indexRules('alias', normalizeName)
const bySourceId = indexRules('source-id', (alias) => alias.toLowerCase().trim())

function indexRules(matchType: AliasRule['matchType'], normalize: (alias: string) => string): Map<string, AliasRule> {
  const map = new Map<string, AliasRule>()
  for (const rule of ALIAS_RULES) {
    if (rule.matchType === matchType) {
      map.set(normalize(rule.alias), rule)
    }
  }
  return map
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function normalizeCik(value: string): string {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '')
  return digits || '0'
}

function resolvedFrom(sourceEntityId: string, rule: AliasRule): ResolutionResult {
  return {
    resolved: true,
    sourceEntityId,
    canonicalSeedEntityId: rule.canonicalSeedEntityId,
    matchType: rule.matchType,
    confidence: rule.confidence,
    reason: rule.note,
    source: 'resolver-rule',
  }
}

function unresolved(sourceEntityId: string, reason: string): ResolutionResult {
  return { resolved: false, sourceEntityId, reason }
}

/** An identifier that is already a canonical seed id resolves exactly. */
export function resolveSeedId(id: string): ResolutionResult {
  if (SEED_IDS.has(id)) {
    return { resolved: true, sourceEntityId: id, canonicalSeedEntityId: id, matchType: 'exact', confidence: 1, reason: 'Identifier is already a canonical seed entity id.', source: 'resolver-rule' }
  }
  return unresolved(id, 'Not a known seed entity id.')
}

export function resolveByTicker(ticker: string): ResolutionResult {
  const rule = byTicker.get(ticker.toUpperCase().trim())
  return rule ? resolvedFrom(ticker, rule) : unresolved(ticker, `No alias rule for ticker "${ticker}".`)
}

export function resolveByCik(cik: string): ResolutionResult {
  const rule = byCik.get(normalizeCik(cik))
  return rule ? resolvedFrom(cik, rule) : unresolved(cik, `No alias rule for CIK "${cik}".`)
}

export function resolveByName(name: string): ResolutionResult {
  const rule = byName.get(normalizeName(name))
  return rule ? resolvedFrom(name, rule) : unresolved(name, `No exact alias rule for name "${name}" (fuzzy matching is intentionally disabled).`)
}

export function resolveBySourceId(sourceId: string): ResolutionResult {
  const rule = bySourceId.get(sourceId.toLowerCase().trim())
  return rule ? resolvedFrom(sourceId, rule) : unresolved(sourceId, `No allowlisted alias rule for source id "${sourceId}".`)
}

/** Try identifiers in priority order: seed id, CIK, ticker, name, source id. */
export function resolveEntity(input: { seedId?: string; cik?: string; ticker?: string; name?: string; sourceId?: string }): ResolutionResult {
  const attempts: string[] = []
  if (input.seedId) {
    const r = resolveSeedId(input.seedId)
    if (r.resolved) return r
    attempts.push(`seedId=${input.seedId}`)
  }
  if (input.cik) {
    const r = resolveByCik(input.cik)
    if (r.resolved) return r
    attempts.push(`cik=${input.cik}`)
  }
  if (input.ticker) {
    const r = resolveByTicker(input.ticker)
    if (r.resolved) return r
    attempts.push(`ticker=${input.ticker}`)
  }
  if (input.name) {
    const r = resolveByName(input.name)
    if (r.resolved) return r
    attempts.push(`name=${input.name}`)
  }
  if (input.sourceId) {
    const r = resolveBySourceId(input.sourceId)
    if (r.resolved) return r
    attempts.push(`sourceId=${input.sourceId}`)
  }
  const id = input.seedId ?? input.cik ?? input.ticker ?? input.name ?? input.sourceId ?? '(none)'
  return unresolved(id, attempts.length > 0 ? `No alias rule matched (tried: ${attempts.join(', ')}).` : 'No identifiers provided.')
}

/** Resolve all identifiers an event carries; returns only resolved seed links. */
export function resolveEvent(event: WorldIntelEvent): ResolutionResult[] {
  const results = new Map<string, ResolutionResult & { resolved: true }>()
  const consider = (r: ResolutionResult) => {
    if (r.resolved) {
      const existing = results.get(r.canonicalSeedEntityId)
      if (!existing || r.confidence > existing.confidence) {
        results.set(r.canonicalSeedEntityId, r)
      }
    }
  }

  for (const ticker of event.affectedAssets ?? []) consider(resolveByTicker(ticker))
  if (event.secFiling) {
    consider(resolveByCik(event.secFiling.cik))
    if (event.secFiling.ticker) consider(resolveByTicker(event.secFiling.ticker))
    consider(resolveByName(event.secFiling.companyName))
  }
  if (event.eiaEnergyRecord?.commodity) consider(resolveByName(event.eiaEnergyRecord.commodity))
  if (event.eiaEnergyRecord?.seriesId) consider(resolveBySourceId(event.eiaEnergyRecord.seriesId))
  if (event.fredObservation?.seriesId) consider(resolveBySourceId(event.fredObservation.seriesId))
  if (event.githubRelease?.repoFullName) consider(resolveBySourceId(event.githubRelease.repoFullName))
  for (const assignee of event.patentRecord?.assignees ?? []) consider(resolveByName(assignee))
  // Patent classification -> mapped technology (rule-based, not verification).
  for (const mapping of mapCpcCodes(event.patentRecord?.cpcCodes ?? [])) {
    consider({
      resolved: true,
      sourceEntityId: mapping.cpc,
      canonicalSeedEntityId: mapping.entityId,
      matchType: 'classification',
      confidence: 0.7,
      reason: `${mapping.note} Rule-based classification — not verification of curated seed relationships.`,
      source: 'resolver-rule',
    })
  }

  return [...results.values()]
}

/**
 * Map a selected id back to a real WorldIntelEvent. Exact id only — never fuzzy,
 * never by display text. Returns undefined when the id is not a real event (e.g.
 * a derived RadarEvent group id), so callers infer no exposure.
 */
export function findWorldIntelEvent(id: string, events: WorldIntelEvent[]): WorldIntelEvent | undefined {
  return events.find((event) => event.id === id)
}

/** The official identifiers a resolver would check for an event (for trail display). */
export function eventCandidateIdentifiers(event: WorldIntelEvent): Array<{ type: ResolutionMatchType; value: string }> {
  const out: Array<{ type: ResolutionMatchType; value: string }> = []
  for (const ticker of event.affectedAssets ?? []) out.push({ type: 'ticker', value: ticker })
  if (event.secFiling) {
    out.push({ type: 'cik', value: event.secFiling.cik })
    if (event.secFiling.ticker) out.push({ type: 'ticker', value: event.secFiling.ticker })
    out.push({ type: 'alias', value: event.secFiling.companyName })
  }
  if (event.eiaEnergyRecord?.commodity) out.push({ type: 'alias', value: event.eiaEnergyRecord.commodity })
  if (event.eiaEnergyRecord?.seriesId) out.push({ type: 'source-id', value: event.eiaEnergyRecord.seriesId })
  if (event.fredObservation?.seriesId) out.push({ type: 'source-id', value: event.fredObservation.seriesId })
  if (event.githubRelease?.repoFullName) out.push({ type: 'source-id', value: event.githubRelease.repoFullName })
  for (const assignee of event.patentRecord?.assignees ?? []) out.push({ type: 'alias', value: assignee })
  for (const cpc of event.patentRecord?.cpcCodes ?? []) out.push({ type: 'classification', value: cpc })
  return out
}

/** Whether an event resolves to at least one curated seed entity (cheap check). */
export function isEventResolvable(event: WorldIntelEvent): boolean {
  return resolveEvent(event).length > 0
}

export type ResolutionFilterMode = 'all' | 'linked' | 'unlinked'

/** Filter events by whether they resolve to a curated seed entity. */
export function filterEventsByResolution(events: WorldIntelEvent[], mode: ResolutionFilterMode): WorldIntelEvent[] {
  if (mode === 'all') return events
  const wantResolvable = mode === 'linked'
  return events.filter((event) => isEventResolvable(event) === wantResolvable)
}

/** Live event -> resolved seed entities -> structural exposure chains. */
export function eventStructuralExposure(
  event: WorldIntelEvent,
  options: { maxDepth?: number } = {},
): Array<{ resolution: ResolutionResult & { resolved: true }; exposure: ExposurePath[] }> {
  return resolveEvent(event)
    .filter((r): r is ResolutionResult & { resolved: true } => r.resolved)
    .map((resolution) => ({
      resolution,
      exposure: exposureFor(resolution.canonicalSeedEntityId, options.maxDepth ? { maxDepth: options.maxDepth } : {}),
    }))
}
