/*
 * Materiality engine — "What Changed Today That Matters".
 *
 * Deterministic, evidence-only ranking over the unified WorldIntelEvent schema.
 * No LLM, no narratives, no guessing. Each event contributes scored signals:
 *
 *   provenance · confidence · severity · recency · delta · corroboration
 *
 * materiality = weighted_sum(signals), 0..100.
 *
 * Cross-source corroboration is the core idea: an event matters more when
 * INDEPENDENT sources converge on the same entity (NVD + CISA KEV on one CVE;
 * FRED labor weakness + an SEC disclosure on the same sector). Events that share
 * a specific entity (ticker / CVE / vendor:product) are clustered into a single
 * "what changed" item so the same fact is not listed twice.
 *
 * The ranking itself is a local computation, so it is always `local-derived` and
 * never upgraded to verified. When no event qualifies in the window the engine
 * returns DATA_UNAVAILABLE rather than an empty shell. Every item carries its
 * full evidence trail (source ids + URLs).
 */
import type { ProvenanceId } from '../provenance'
import type { Severity } from '../data/intel'
import type { WorldIntelEvent } from '../worldIntel'

export type MaterialitySignalId =
  | 'provenance'
  | 'confidence'
  | 'severity'
  | 'recency'
  | 'delta'
  | 'corroboration'

export type MaterialityScores = Record<MaterialitySignalId, number>

export type MaterialityEvidence = {
  eventId: string
  sourceId: string
  sourceLabel: string
  title: string
  provenance: ProvenanceId
  confidence: number
  sourceUrl?: string
  observedAt: number
}

export type MaterialityChangeType =
  | 'filing'
  | 'macro'
  | 'fiscal'
  | 'labor'
  | 'national-accounts'
  | 'energy'
  | 'weather'
  | 'earthquake'
  | 'regulatory'
  | 'sanctions'
  | 'legislation'
  | 'cyber'
  | 'patent'
  | 'oss-release'
  | 'trade-flow'
  | 'media-observation'
  | 'research'
  | 'doi-metadata'
  | 'market-reference'
  | 'company-fact'
  | 'insider-transaction'
  | 'world-event'

export type MaterialItem = {
  id: string
  headline: string
  whyItMatters: string
  materiality: number
  confidence: number
  scores: MaterialityScores
  category: string
  changeType: MaterialityChangeType
  entities: string[]
  evidence: MaterialityEvidence[]
  sourceIds: string[]
  provenance: 'local-derived'
  observedAt: number
}

export type WhatChangedTodayResult = {
  status: 'ok' | 'DATA_UNAVAILABLE'
  generatedAt: number
  windowMs: number
  consideredEventCount: number
  items: MaterialItem[]
}

export type MaterialityOptions = {
  now?: number
  windowMs?: number
  limit?: number
  /** dedupeHashes/ids seen BEFORE the window; drives delta (new vs continuing). */
  priorKeys?: Set<string>
  weights?: Partial<MaterialityScores>
  minConfidence?: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 12
const DEFAULT_MIN_CONFIDENCE = 50
const CORROBORATION_SATURATION = 2 // 3 distinct sources -> full corroboration score.

const DEFAULT_WEIGHTS: MaterialityScores = {
  corroboration: 0.3,
  severity: 0.2,
  delta: 0.15,
  provenance: 0.15,
  confidence: 0.12,
  recency: 0.08,
}

// Trust weight per provenance class. Verified is the only 1.0; inferred/simulated
// are near-zero so unverified noise cannot dominate the ranking.
const PROVENANCE_TRUST: Record<ProvenanceId, number> = {
  verified: 1,
  'official-api': 0.9,
  'public-disclosure': 0.85,
  'auth-gated': 0.8,
  live: 0.7,
  delayed: 0.6,
  'rss-public': 0.55,
  'public-unauthenticated': 0.5,
  // Media observation: a real published article exists, but its claim is unverified.
  // Kept low so media noise can never dominate the materiality ranking.
  'media-observation': 0.25,
  'local-computed': 0.45,
  'math-derived': 0.45,
  'local-derived': 0.4,
  'stale-cache': 0.35,
  'offline-cache': 0.3,
  'local-model': 0.3,
  'model-inferred': 0.2,
  simulated: 0,
  unavailable: 0,
}

const SOURCE_LABELS: Record<string, string> = {
  sec_edgar_public: 'SEC',
  macro_calendar_fred: 'FRED',
  treasury_fiscal_public: 'Treasury Fiscal Data',
  bls_public: 'BLS',
  bea_public: 'BEA',
  eia_energy_public: 'EIA',
  cisa_kev_public: 'CISA KEV',
  nvd_cve_public: 'NVD',
  github_ghsa_public: 'GitHub',
  osv_dev_public: 'OSV',
  cisa_advisories_public: 'CISA',
  github_releases_public: 'GitHub Releases',
  usgs_significant_quakes: 'USGS',
  noaa_alerts_public: 'NOAA/NWS',
  federal_register_public: 'Federal Register',
  ofac_sdn_public: 'OFAC SDN',
  congress_gov_public: 'Congress.gov',
  uspto_patentsview_public: 'USPTO',
  gdelt_doc_public: 'GDELT (media)',
  un_comtrade_public: 'UN Comtrade',
  openalex_works_public: 'OpenAlex',
  crossref_works_public: 'Crossref',
  sec_company_facts_public: 'SEC Company Facts',
  sec_form4_public: 'SEC Form 4',
  sec_company_tickers_public: 'SEC Company Tickers',
  politician_disclosure_public: 'Public disclosure',
}

export function sourceLabel(sourceId: string): string {
  return SOURCE_LABELS[sourceId] ?? sourceId
}

export function provenanceTrust(provenance: ProvenanceId): number {
  return PROVENANCE_TRUST[provenance] ?? 0.3
}

export function severityScore(severity: Severity): number {
  if (severity === 'critical') return 1
  if (severity === 'elevated') return 0.6
  if (severity === 'watch') return 0.3
  return 0.1
}

function recencyScore(observedAt: number, now: number, windowMs: number): number {
  const age = now - observedAt
  if (!Number.isFinite(age) || age <= 0) return 1
  return clamp01(1 - age / windowMs)
}

/** Broad keys used to detect cross-source corroboration (thematic bridges). */
function corroborationKeys(event: WorldIntelEvent): string[] {
  const keys: string[] = []
  for (const asset of event.affectedAssets ?? []) keys.push(`asset:${asset.toLowerCase()}`)
  for (const sector of event.affectedSectors ?? []) keys.push(`sector:${sector.toLowerCase()}`)
  for (const commodity of event.affectedCommodities ?? []) keys.push(`commodity:${commodity.toLowerCase()}`)
  for (const currency of event.affectedCurrencies ?? []) keys.push(`currency:${currency.toLowerCase()}`)
  if (event.ofacSanctionsRecord) keys.push(`ofac:${event.ofacSanctionsRecord.uid}`)
  if (event.congressBillAction) keys.push(`bill:${event.congressBillAction.congress}:${event.congressBillAction.billType}:${event.congressBillAction.billNumber}`.toLowerCase())
  for (const key of cyberKeys(event)) keys.push(key)
  return unique(keys)
}

/** Specific keys used to CLUSTER events into a single "what changed" item. */
function clusterKeys(event: WorldIntelEvent): string[] {
  const keys: string[] = []
  for (const asset of event.affectedAssets ?? []) keys.push(`asset:${asset.toLowerCase()}`)
  if (event.ofacSanctionsRecord) keys.push(`ofac:${event.ofacSanctionsRecord.uid}`)
  if (event.congressBillAction) keys.push(`bill:${event.congressBillAction.congress}:${event.congressBillAction.billType}:${event.congressBillAction.billNumber}`.toLowerCase())
  for (const key of cyberKeys(event)) keys.push(key)
  return unique(keys)
}

function cyberKeys(event: WorldIntelEvent): string[] {
  const keys: string[] = []
  // A CVE shared across NVD, CISA KEV, and a GitHub advisory is the same fact:
  // cluster them so corroboration (GHSA -> CVE -> NVD -> KEV) is recognized.
  const cve =
    event.nvdCve?.cveId ??
    event.kevVulnerability?.cveId ??
    event.ghsaAdvisory?.cveId ??
    event.osvVulnerability?.relatedCveIds[0] ??
    event.cisaAdvisory?.relatedCveIds[0]
  if (cve) keys.push(`cve:${cve.toLowerCase()}`)
  if (event.ghsaAdvisory?.ghsaId) keys.push(`ghsa:${event.ghsaAdvisory.ghsaId.toLowerCase()}`)
  for (const ghsa of event.osvVulnerability?.relatedGhsaIds ?? []) keys.push(`ghsa:${ghsa.toLowerCase()}`)
  if (event.osvVulnerability?.osvId) keys.push(`osv:${event.osvVulnerability.osvId.toLowerCase()}`)
  if (event.cisaAdvisory?.advisoryId) keys.push(`cisa:${event.cisaAdvisory.advisoryId.toLowerCase()}`)
  for (const cisaCve of event.cisaAdvisory?.relatedCveIds ?? []) keys.push(`cve:${cisaCve.toLowerCase()}`)
  for (const vp of event.nvdCve?.vendorProducts ?? []) keys.push(`product:${vp.toLowerCase()}`)
  return keys
}

function hasKevEvidence(event: WorldIntelEvent): boolean {
  return Boolean(
    event.kevVulnerability ||
      event.nvdCve?.inKnownExploitedCatalog ||
      event.ghsaAdvisory?.inKnownExploitedCatalog ||
      (event.narrativeTags ?? []).some((tag) => /cisa kev/i.test(tag)),
  )
}

export function assessWhatChangedToday(
  events: WorldIntelEvent[],
  options: MaterialityOptions = {},
): WhatChangedTodayResult {
  const now = options.now ?? Date.now()
  const windowMs = options.windowMs ?? DAY_MS
  const limit = options.limit ?? DEFAULT_LIMIT
  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE
  const weights = normalizeWeights({ ...DEFAULT_WEIGHTS, ...(options.weights ?? {}) })

  const considered = events.filter(
    (event) =>
      Number.isFinite(event.timestamp) &&
      !event.marketIdentity &&
      event.timestamp >= now - windowMs &&
      event.timestamp <= now + 60_000 &&
      (event.confidence ?? 0) >= minConfidence,
  )

  if (considered.length === 0) {
    return { status: 'DATA_UNAVAILABLE', generatedAt: now, windowMs, consideredEventCount: 0, items: [] }
  }

  // Index sources per corroboration key across ALL considered events.
  const sourcesByKey = new Map<string, Set<string>>()
  for (const event of considered) {
    for (const key of corroborationKeys(event)) {
      const set = sourcesByKey.get(key) ?? new Set<string>()
      set.add(event.sourceId)
      sourcesByKey.set(key, set)
    }
  }

  const clusters = clusterEvents(considered)
  const items: MaterialItem[] = []

  for (const cluster of clusters) {
    const evidenceEvents = dedupeById(cluster).sort(
      (a, b) =>
        provenanceTrust(b.provenance) - provenanceTrust(a.provenance) ||
        (b.confidence ?? 0) - (a.confidence ?? 0) ||
        severityScore(b.severity) - severityScore(a.severity),
    )
    const primary = evidenceEvents[0]

    // Distinct sources that corroborate any of this cluster's keys.
    const clusterCorroborationKeys = unique(evidenceEvents.flatMap(corroborationKeys))
    const corroboratingSources = new Set<string>()
    for (const key of clusterCorroborationKeys) {
      for (const sourceId of sourcesByKey.get(key) ?? []) corroboratingSources.add(sourceId)
    }

    const scores: MaterialityScores = {
      provenance: Math.max(...evidenceEvents.map((event) => provenanceTrust(event.provenance))),
      confidence: Math.max(...evidenceEvents.map((event) => (event.confidence ?? 0) / 100)),
      severity: Math.max(...evidenceEvents.map((event) => severityScore(event.severity))),
      recency: Math.max(...evidenceEvents.map((event) => recencyScore(event.timestamp, now, windowMs))),
      delta: deltaScore(evidenceEvents, options.priorKeys, now, windowMs),
      corroboration: clamp01((corroboratingSources.size - 1) / CORROBORATION_SATURATION),
    }

    const materiality = Math.round(
      100 *
        (scores.provenance * weights.provenance +
          scores.confidence * weights.confidence +
          scores.severity * weights.severity +
          scores.recency * weights.recency +
          scores.delta * weights.delta +
          scores.corroboration * weights.corroboration),
    )

    const sourceIds = unique(evidenceEvents.map((event) => event.sourceId))
    items.push({
      id: `material:${primary.dedupeHash || primary.id}`,
      headline: primary.title,
      whyItMatters: explain(evidenceEvents, corroboratingSources, scores, Boolean(options.priorKeys)),
      materiality,
      confidence: Math.round(Math.max(...evidenceEvents.map((event) => event.confidence ?? 0))),
      scores,
      category: String(primary.category),
      changeType: classifyChangeType(primary),
      entities: sharedEntities(clusterCorroborationKeys, sourcesByKey),
      evidence: evidenceEvents.map(toEvidence),
      sourceIds,
      provenance: 'local-derived',
      observedAt: Math.max(...evidenceEvents.map((event) => event.timestamp)),
    })
  }

  items.sort((a, b) => b.materiality - a.materiality || b.observedAt - a.observedAt || a.id.localeCompare(b.id))

  return {
    status: 'ok',
    generatedAt: now,
    windowMs,
    consideredEventCount: considered.length,
    items: items.slice(0, limit),
  }
}

function clusterEvents(events: WorldIntelEvent[]): WorldIntelEvent[][] {
  // Union-find over events that share a specific cluster key.
  const parent = new Map<number, number>()
  const find = (x: number): number => {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root) ?? root
    return root
  }
  const union = (a: number, b: number) => {
    parent.set(find(a), find(b))
  }
  events.forEach((_, index) => parent.set(index, index))

  const firstIndexByKey = new Map<string, number>()
  events.forEach((event, index) => {
    for (const key of clusterKeys(event)) {
      const seen = firstIndexByKey.get(key)
      if (seen === undefined) {
        firstIndexByKey.set(key, index)
      } else {
        union(seen, index)
      }
    }
  })

  const groups = new Map<number, WorldIntelEvent[]>()
  events.forEach((event, index) => {
    const root = find(index)
    const group = groups.get(root) ?? []
    group.push(event)
    groups.set(root, group)
  })
  return [...groups.values()]
}

function deltaScore(
  events: WorldIntelEvent[],
  priorKeys: Set<string> | undefined,
  now: number,
  windowMs: number,
): number {
  if (priorKeys && priorKeys.size > 0) {
    const newCount = events.filter(
      (event) => !priorKeys.has(event.dedupeHash) && !priorKeys.has(event.id),
    ).length
    return clamp01(newCount / events.length)
  }
  // Without history, newer events are the best available proxy for "changed".
  return Math.max(...events.map((event) => recencyScore(event.timestamp, now, windowMs)))
}

function explain(
  events: WorldIntelEvent[],
  corroboratingSources: Set<string>,
  scores: MaterialityScores,
  hasPriorKeys: boolean,
): string {
  const clauses: string[] = []
  if (corroboratingSources.size >= 2) {
    const labels = unique([...corroboratingSources].map(sourceLabel)).slice(0, 4)
    clauses.push(`Corroborated by ${corroboratingSources.size} independent sources (${labels.join(', ')}).`)
  }
  if (events.some(hasKevEvidence)) {
    clauses.push('Active exploitation confirmed (CISA KEV).')
  }
  const topSeverity = events.find((event) => event.severity === 'critical' || event.severity === 'elevated')
  if (topSeverity) {
    clauses.push(`${capitalize(topSeverity.severity)} severity.`)
  }
  if (hasPriorKeys && scores.delta >= 0.99) {
    clauses.push('New today.')
  }
  if (clauses.length === 0) {
    const primary = events[0]
    clauses.push(`${capitalize(String(primary.category))} update from ${sourceLabel(primary.sourceId)}.`)
  }
  return clauses.slice(0, 3).join(' ')
}

function sharedEntities(keys: string[], sourcesByKey: Map<string, Set<string>>): string[] {
  return unique(
    keys
      .filter((key) => (sourcesByKey.get(key)?.size ?? 0) >= 2)
      .map((key) => key.replace(/^[a-z]+:/, '')),
  ).slice(0, 6)
}

function toEvidence(event: WorldIntelEvent): MaterialityEvidence {
  return {
    eventId: event.id,
    sourceId: event.sourceId,
    sourceLabel: sourceLabel(event.sourceId),
    title: event.title,
    provenance: event.provenance,
    confidence: event.confidence ?? 0,
    sourceUrl: event.sourceUrl,
    observedAt: event.timestamp,
  }
}

export function classifyChangeType(event: WorldIntelEvent): MaterialityChangeType {
  if (event.secFiling) return 'filing'
  if (event.treasuryFiscalRecord) return 'fiscal'
  if (event.blsObservation) return 'labor'
  if (event.beaObservation) return 'national-accounts'
  if (event.fredObservation) return 'macro'
  if (event.eiaEnergyRecord) return 'energy'
  if (event.weatherAlert) return 'weather'
  if (event.earthquakeEvent) return 'earthquake'
  if (event.regulatoryDocument) return 'regulatory'
  if (event.ofacSanctionsRecord) return 'sanctions'
  if (event.congressBillAction) return 'legislation'
  if (event.kevVulnerability || event.nvdCve || event.ghsaAdvisory || event.osvVulnerability || event.cisaAdvisory) {
    return 'cyber'
  }
  if (event.patentRecord) return 'patent'
  if (event.githubRelease) return 'oss-release'
  if (event.gdeltArticle) return 'media-observation'
  if (event.form4Transaction) return 'insider-transaction'
  if (event.companyFact) return 'company-fact'
  if (event.openAlexWork) return 'research'
  if (event.crossrefWork) return 'doi-metadata'
  if (event.marketIdentity) return 'market-reference'
  if (event.comtradeRecord) return 'trade-flow'
  if (/trade|comtrade|shipping/i.test(`${event.category} ${event.sourceId}`)) return 'trade-flow'
  return 'world-event'
}

function normalizeWeights(weights: MaterialityScores): MaterialityScores {
  const total =
    weights.provenance +
    weights.confidence +
    weights.severity +
    weights.recency +
    weights.delta +
    weights.corroboration
  if (!Number.isFinite(total) || total <= 0) {
    return DEFAULT_WEIGHTS
  }
  return {
    provenance: weights.provenance / total,
    confidence: weights.confidence / total,
    severity: weights.severity / total,
    recency: weights.recency / total,
    delta: weights.delta / total,
    corroboration: weights.corroboration / total,
  }
}

function dedupeById(events: WorldIntelEvent[]): WorldIntelEvent[] {
  const seen = new Set<string>()
  const out: WorldIntelEvent[] = []
  for (const event of events) {
    if (seen.has(event.id)) continue
    seen.add(event.id)
    out.push(event)
  }
  return out
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value
}
