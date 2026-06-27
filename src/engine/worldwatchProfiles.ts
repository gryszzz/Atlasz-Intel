/*
 * Aegis Worldwatch relevance profiles.
 *
 * Hermes delivers source events. Aegis evaluates trust/freshness/conflict.
 * Worldwatch only ranks visibility for what the user cares about. It never
 * creates evidence, raises truth confidence, predicts prices, or directs action.
 */
import { freshnessLabel, freshnessWeight } from './freshness'
import { conflictsForEvent, detectConflicts } from './conflictDetection'
import { corroborationKeys, provenanceTrust } from './materialityEngine'
import type { MaterialItem } from './materialityEngine'
import type { WorldIntelEvent } from '../worldIntel'

export const WORLDWATCH_STORAGE_KEY = 'atlasz.worldwatch.profiles.v1'

export type WatchableEntityKind =
  | 'ticker'
  | 'company'
  | 'cik'
  | 'etf'
  | 'commodity'
  | 'country'
  | 'region'
  | 'facility'
  | 'port'
  | 'grid-region'
  | 'balancing-authority'
  | 'mineral'
  | 'cyber-technology'
  | 'cve'

export type WorldwatchTheme =
  | 'semiconductors'
  | 'ai-infrastructure'
  | 'energy'
  | 'lng'
  | 'nuclear'
  | 'grid'
  | 'critical-minerals'
  | 'ports-logistics'
  | 'sanctions'
  | 'cyber'
  | 'weather-risk'

export type WatchedEntity = {
  kind: WatchableEntityKind
  value: string
  label?: string
  aliases?: string[]
  weight?: number
}

export type WorldwatchPriorityWeights = {
  entity: number
  theme: number
  geo: number
  connector: number
}

export type WorldwatchProfile = {
  id: string
  name: string
  watchedEntities: WatchedEntity[]
  watchedThemes: WorldwatchTheme[]
  watchedRegions: string[]
  watchedConnectors: string[]
  priorityWeights: WorldwatchPriorityWeights
  ignoredEntities: WatchedEntity[]
  createdAt: number
  updatedAt: number
}

export type RelevanceMatchKind = 'entity' | 'theme' | 'geo' | 'connector'

export type RelevanceMatch = {
  kind: RelevanceMatchKind
  label: string
  explanation: string
  strength: number
  exposurePathConfidence: number
}

export type RelevanceBreakdown = {
  sourceTrust: number
  freshnessWeight: number
  entityMatch: number
  themeMatch: number
  geoMatch: number
  exposurePathConfidence: number
  corroborationBoost: number
  conflictPenalty: number
}

export type RankedWorldwatchEvent = {
  event: WorldIntelEvent
  relevanceScore: number
  matches: RelevanceMatch[]
  breakdown: RelevanceBreakdown
  suppressed: boolean
  suppressedBy?: string
}

export type RankedWorldwatchMaterialItem = {
  item: MaterialItem
  relevanceScore: number
  matches: RelevanceMatch[]
  suppressed: boolean
}

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

type BuildProfileInput = Pick<
  WorldwatchProfile,
  'id' | 'name' | 'watchedEntities' | 'watchedThemes' | 'watchedRegions'
> & {
  now: number
  watchedConnectors?: string[]
  priorityWeights?: Partial<WorldwatchPriorityWeights>
  ignoredEntities?: WatchedEntity[]
}

const DEFAULT_WEIGHTS: WorldwatchPriorityWeights = {
  entity: 1,
  theme: 0.9,
  geo: 0.85,
  connector: 0.7,
}

const THEME_KEYWORDS: Record<WorldwatchTheme, string[]> = {
  semiconductors: ['semiconductor', 'chip', 'chips', 'tsmc', 'asml', 'euv', 'hbm', 'advanced packaging'],
  'ai-infrastructure': ['ai', 'artificial intelligence', 'data center', 'gpu', 'accelerator', 'hbm', 'power demand'],
  energy: ['energy', 'crude', 'oil', 'gas', 'pipeline', 'refinery', 'power'],
  lng: ['lng', 'liquefied natural gas', 'gas terminal', 'export terminal'],
  nuclear: ['nuclear', 'reactor', 'uranium', 'nrc'],
  grid: ['grid', 'balancing authority', 'electricity', 'power plant', 'transmission'],
  'critical-minerals': ['critical mineral', 'lithium', 'copper', 'nickel', 'cobalt', 'rare earth', 'graphite', 'uranium'],
  'ports-logistics': ['port', 'ports', 'shipping', 'logistics', 'suez', 'red sea', 'malacca', 'freight'],
  sanctions: ['sanction', 'sanctions', 'ofac', 'sdn', 'export control'],
  cyber: ['cve', 'vulnerability', 'kev', 'exploit', 'patch', 'advisory', 'ghsa', 'osv'],
  'weather-risk': ['weather', 'storm', 'hurricane', 'flood', 'wildfire', 'noaa', 'nws'],
}

export function defaultWorldwatchProfiles(now = Date.now()): WorldwatchProfile[] {
  return [
    buildProfile({
      id: 'ai-infrastructure',
      name: 'AI Infrastructure',
      now,
      watchedEntities: [
        ticker('NVDA', 'NVIDIA', ['NVIDIA Corporation']),
        ticker('TSM', 'TSMC', ['Taiwan Semiconductor', 'TSMC']),
        ticker('ASML', 'ASML'),
        ticker('AMD', 'AMD', ['Advanced Micro Devices']),
        ticker('AVGO', 'Broadcom', ['Broadcom']),
        etf('SOXX', 'iShares Semiconductor ETF'),
        etf('SMH', 'VanEck Semiconductor ETF'),
        etf('XLK', 'Technology Select Sector SPDR'),
        commodity('copper'),
        commodity('silicon'),
      ],
      watchedThemes: ['semiconductors', 'ai-infrastructure', 'grid', 'critical-minerals'],
      watchedRegions: ['Taiwan', 'Netherlands', 'Japan', 'South Korea'],
    }),
    buildProfile({
      id: 'energy-shock',
      name: 'Energy Shock',
      now,
      watchedEntities: [
        commodity('crude oil'),
        commodity('lng', 'LNG'),
        company('refineries'),
        company('pipelines'),
        etf('XLE'),
        etf('XLU'),
      ],
      watchedThemes: ['energy', 'lng', 'grid', 'ports-logistics', 'weather-risk', 'sanctions'],
      watchedRegions: ['Gulf Coast', 'Europe', 'Red Sea', 'Suez', 'Malacca'],
      watchedConnectors: ['eia_energy_public', 'noaa_alerts_public', 'usgs_minerals_public', 'ofac_sdn_public'],
    }),
    buildProfile({
      id: 'critical-minerals',
      name: 'Critical Minerals',
      now,
      watchedEntities: [
        commodity('lithium'),
        commodity('copper'),
        commodity('nickel'),
        commodity('cobalt'),
        commodity('rare earths'),
        commodity('graphite'),
        commodity('uranium'),
      ],
      watchedThemes: ['critical-minerals', 'energy', 'grid', 'semiconductors', 'ports-logistics'],
      watchedRegions: ['United States', 'China', 'Chile', 'Australia', 'Congo', 'Indonesia'],
      watchedConnectors: ['usgs_minerals_public', 'un_comtrade_public', 'world_port_index_public'],
    }),
  ]
}

export function rankEventsForProfile(
  events: WorldIntelEvent[],
  profile: WorldwatchProfile,
  options: { now?: number; limit?: number } = {},
): RankedWorldwatchEvent[] {
  const now = options.now ?? Date.now()
  const conflicts = detectConflicts(events, now)
  const sourcesByKey = buildSourcesByKey(events)
  const ranked = events.map((event) => rankEvent(event, profile, events, conflicts, sourcesByKey, now))
  return ranked
    .sort((left, right) => right.relevanceScore - left.relevanceScore || right.event.timestamp - left.event.timestamp)
    .slice(0, options.limit ?? ranked.length)
}

export function relevantEventsForProfile(
  events: WorldIntelEvent[],
  profile: WorldwatchProfile,
  options: { now?: number; limit?: number } = {},
): RankedWorldwatchEvent[] {
  return rankEventsForProfile(events, profile, options).filter((ranked) => !ranked.suppressed && ranked.relevanceScore > 0)
}

export function rankMaterialItemsForProfile(
  items: MaterialItem[],
  profile: WorldwatchProfile,
  events: WorldIntelEvent[],
  options: { now?: number; limit?: number } = {},
): RankedWorldwatchMaterialItem[] {
  const rankedEvents = rankEventsForProfile(events, profile, { now: options.now })
  const byEventId = new Map(rankedEvents.map((ranked) => [ranked.event.id, ranked]))
  const rankedItems = items.map((item): RankedWorldwatchMaterialItem => {
    const itemEvents = item.evidence.map((evidence) => byEventId.get(evidence.eventId)).filter((ranked): ranked is RankedWorldwatchEvent => Boolean(ranked))
    const visible = itemEvents.filter((ranked) => !ranked.suppressed)
    const strongest = visible.sort((left, right) => right.relevanceScore - left.relevanceScore)[0]
    return {
      item,
      relevanceScore: strongest?.relevanceScore ?? 0,
      matches: strongest?.matches ?? [],
      suppressed: itemEvents.length > 0 && itemEvents.every((ranked) => ranked.suppressed),
    }
  })
  return rankedItems
    .filter((ranked) => !ranked.suppressed && ranked.relevanceScore > 0)
    .sort((left, right) => right.relevanceScore - left.relevanceScore || right.item.materiality - left.item.materiality)
    .slice(0, options.limit ?? rankedItems.length)
}

export function loadWorldwatchProfiles(storage: StorageLike | undefined, now = Date.now()): WorldwatchProfile[] {
  if (!storage) return defaultWorldwatchProfiles(now)
  const raw = storage.getItem(WORLDWATCH_STORAGE_KEY)
  if (!raw) return defaultWorldwatchProfiles(now)
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return defaultWorldwatchProfiles(now)
    const profiles = parsed.map((profile) => sanitizeProfile(profile, now)).filter((profile): profile is WorldwatchProfile => Boolean(profile))
    return profiles.length > 0 ? profiles : defaultWorldwatchProfiles(now)
  } catch {
    return defaultWorldwatchProfiles(now)
  }
}

export function saveWorldwatchProfiles(storage: StorageLike | undefined, profiles: WorldwatchProfile[]): void {
  if (!storage) return
  storage.setItem(WORLDWATCH_STORAGE_KEY, JSON.stringify(profiles))
}

export function addEntityToProfile(profile: WorldwatchProfile, entity: WatchedEntity, now = Date.now()): WorldwatchProfile {
  const key = entityKey(entity)
  if (profile.watchedEntities.some((candidate) => entityKey(candidate) === key)) return { ...profile, updatedAt: now }
  return {
    ...profile,
    watchedEntities: [...profile.watchedEntities, entity],
    updatedAt: now,
  }
}

export function relevanceChipLabel(ranked: Pick<RankedWorldwatchEvent, 'relevanceScore'>): string {
  return `relevance ${Math.round(ranked.relevanceScore)}`
}

export function explainTopMatches(matches: RelevanceMatch[], limit = 2): string {
  return matches
    .slice(0, limit)
    .map((match) => match.explanation)
    .join(' · ')
}

function rankEvent(
  event: WorldIntelEvent,
  profile: WorldwatchProfile,
  corpus: WorldIntelEvent[],
  conflicts: ReturnType<typeof detectConflicts>,
  sourcesByKey: Map<string, Set<string>>,
  now: number,
): RankedWorldwatchEvent {
  const suppressedBy = ignoredEntityMatch(event, profile)
  const matches = suppressedBy ? [] : collectMatches(event, profile)
  const sourceTrust = provenanceTrust(event.provenance)
  const label = freshnessLabel({ now, retrievedAt: event.timestamp, observedAt: event.timestamp })
  const fresh = freshnessWeight(label) ?? 0.5
  const conflictSet = conflictsForEvent(event, conflicts)
  const conflictPenalty = conflictSet.some((conflict) => conflict.severity === 'blocking') ? 0.45 : conflictSet.length > 0 ? 0.7 : 1
  const corroborationBoost = corroborationBoostFor(event, sourcesByKey, corpus)
  const entityMatch = matchFactor(matches, 'entity', profile.priorityWeights.entity)
  const themeMatch = matchFactor(matches, 'theme', profile.priorityWeights.theme)
  const geoMatch = matchFactor(matches, 'geo', profile.priorityWeights.geo)
  const connectorMatch = matchFactor(matches, 'connector', profile.priorityWeights.connector)
  const exposurePathConfidence = matches.length > 0 ? Math.max(...matches.map((match) => match.exposurePathConfidence)) : 0
  const visibleMatch = matches.length > 0

  const score = suppressedBy
    ? 0
    : visibleMatch
      ? 100 *
        sourceTrust *
        fresh *
        entityMatch *
        themeMatch *
        geoMatch *
        connectorMatch *
        exposurePathConfidence *
        corroborationBoost *
        conflictPenalty
      : 0

  return {
    event,
    relevanceScore: clamp(score, 0, 100),
    matches: matches.sort((left, right) => right.strength - left.strength),
    breakdown: {
      sourceTrust,
      freshnessWeight: fresh,
      entityMatch,
      themeMatch,
      geoMatch,
      exposurePathConfidence,
      corroborationBoost,
      conflictPenalty,
    },
    suppressed: Boolean(suppressedBy),
    suppressedBy,
  }
}

function collectMatches(event: WorldIntelEvent, profile: WorldwatchProfile): RelevanceMatch[] {
  const matches: RelevanceMatch[] = []
  const text = eventText(event)
  const textNorm = normalize(text)
  const exactTickers = new Set((event.affectedAssets ?? []).map((value) => value.toUpperCase()))

  for (const entity of profile.watchedEntities) {
    const labels = entityTerms(entity)
    const found = labels.find((term) => textNorm.includes(normalize(term)) || exactTickers.has(term.toUpperCase()))
    if (!found) continue
    const base = entity.weight ?? 1
    const exactTicker = (entity.kind === 'ticker' || entity.kind === 'etf') && exactTickers.has(entity.value.toUpperCase())
    const viaEtf = Boolean(event.etfHolding && [event.etfHolding.fundTicker, event.etfHolding.holdingTicker].some((ticker) => ticker?.toUpperCase() === entity.value.toUpperCase()))
    const viaCommodity = entity.kind === 'commodity' || (event.affectedCommodities ?? []).some((commodity) => normalize(commodity) === normalize(entity.value))
    matches.push({
      kind: 'entity',
      label: entity.label ?? entity.value,
      explanation: entityExplanation(entity, exactTicker, viaEtf, viaCommodity, event),
      strength: exactTicker ? 1.35 * base : viaEtf ? 1.18 * base : viaCommodity ? 1.12 * base : 1.0 * base,
      exposurePathConfidence: exactTicker ? 1 : viaEtf ? 0.72 : viaCommodity ? 0.8 : 0.65,
    })
  }

  for (const theme of profile.watchedThemes) {
    const hit = THEME_KEYWORDS[theme].find((keyword) => textNorm.includes(normalize(keyword)))
    if (!hit) continue
    matches.push({
      kind: 'theme',
      label: theme,
      explanation: `Matched ${themeLabel(theme)} via theme keyword "${hit}"`,
      strength: 0.82,
      exposurePathConfidence: 0.72,
    })
  }

  for (const region of profile.watchedRegions) {
    const regionNorm = normalize(region)
    const matched =
      normalize(event.region) === regionNorm ||
      textNorm.includes(regionNorm) ||
      (event.countryCodes ?? []).some((code) => normalize(code) === regionNorm)
    if (!matched) continue
    matches.push({
      kind: 'geo',
      label: region,
      explanation: geoExplanation(region, event),
      strength: 0.9,
      exposurePathConfidence: 0.78,
    })
  }

  if (profile.watchedConnectors.includes(event.sourceId)) {
    matches.push({
      kind: 'connector',
      label: event.sourceId,
      explanation: `Matched ${event.sourceId} via watched connector`,
      strength: 0.75,
      exposurePathConfidence: 0.7,
    })
  }

  return matches
}

function entityExplanation(entity: WatchedEntity, exactTicker: boolean, viaEtf: boolean, viaCommodity: boolean, event: WorldIntelEvent): string {
  const label = entity.label ?? entity.value
  if (exactTicker) return `Matched ${entity.value.toUpperCase()} via exact ticker`
  if (viaEtf) return `Matched ${entity.value.toUpperCase()} via ETF holding`
  if (viaCommodity) return `Matched ${label} via commodity path`
  if (entity.kind === 'cve') return `Matched ${entity.value.toUpperCase()} via CVE`
  if (event.marketIdentity) return `Matched ${label} via market reference identity`
  return `Matched ${label} via entity text`
}

function geoExplanation(region: string, event: WorldIntelEvent): string {
  if (event.weatherAlert) return `Matched ${region} via NOAA region`
  if (event.eiaFacility || event.gridRegion) return `Matched ${region} via grid/facility region`
  return `Matched ${region} via geography`
}

function ignoredEntityMatch(event: WorldIntelEvent, profile: WorldwatchProfile): string | undefined {
  const text = normalize(eventText(event))
  for (const entity of profile.ignoredEntities) {
    if (entityTerms(entity).some((term) => text.includes(normalize(term)))) return entity.label ?? entity.value
  }
  return undefined
}

function matchFactor(matches: RelevanceMatch[], kind: RelevanceMatchKind, weight: number): number {
  const strongest = matches.filter((match) => match.kind === kind).sort((left, right) => right.strength - left.strength)[0]
  return strongest ? 1 + strongest.strength * weight : 1
}

function corroborationBoostFor(event: WorldIntelEvent, sourcesByKey: Map<string, Set<string>>, corpus: WorldIntelEvent[]): number {
  let count = 0
  for (const key of corroborationKeys(event)) {
    const sources = sourcesByKey.get(key)
    if (sources) count = Math.max(count, sources.size)
  }
  const mediaOnly = corpus.filter((candidate) => candidate.provenance === 'media-observation').some((candidate) => sharesKey(candidate, event))
  if (count <= 1 && mediaOnly) return 1
  return 1 + Math.min(0.35, Math.max(0, count - 1) * 0.15)
}

function buildSourcesByKey(events: WorldIntelEvent[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const event of events) {
    if (event.provenance === 'media-observation') continue
    for (const key of corroborationKeys(event)) {
      const sources = map.get(key) ?? new Set<string>()
      sources.add(event.sourceId)
      map.set(key, sources)
    }
  }
  return map
}

function sharesKey(left: WorldIntelEvent, right: WorldIntelEvent): boolean {
  const rightKeys = new Set(corroborationKeys(right))
  return corroborationKeys(left).some((key) => rightKeys.has(key))
}

function eventText(event: WorldIntelEvent): string {
  return [
    event.title,
    event.summary,
    event.region,
    event.category,
    ...event.countryCodes,
    ...event.affectedAssets,
    ...event.affectedSectors,
    ...event.affectedCommodities,
    ...event.affectedCurrencies,
    ...event.extractedEntities,
    ...event.narrativeTags,
    event.marketIdentity?.ticker,
    event.marketIdentity?.legalName,
    event.marketIdentity?.commonName,
    event.companyFact?.ticker,
    event.companyFact?.companyName,
    event.form4Transaction?.issuerTicker,
    event.form4Transaction?.issuerName,
    event.form13fHolding?.issuerTicker,
    event.form13fHolding?.issuerName,
    event.form13fHolding?.filerName,
    event.etfHolding?.fundTicker,
    event.etfHolding?.fundName,
    event.etfHolding?.holdingTicker,
    event.etfHolding?.holdingName,
    event.secFiling?.ticker,
    event.secFiling?.companyName,
    event.weatherAlert?.areaDesc,
    event.weatherAlert?.senderName,
    event.eiaEnergyRecord?.commodity,
    event.eiaEnergyRecord?.title,
    event.eiaFacility?.facilityName,
    event.eiaRefinery?.facilityName,
    event.lngTerminal?.facilityName,
    event.nuclearPlant?.facilityName,
    event.nrcReactorStatus?.unitName,
    event.gridRegion?.baName,
    event.gridRegion?.baCode,
    event.unLocode?.locationName,
    event.worldPort?.portName,
    event.mineralSite?.siteName,
    event.nvdCve?.cveId,
    ...(event.nvdCve?.vendorProducts ?? []),
    event.kevVulnerability?.cveId,
    event.kevVulnerability?.vendorProject,
    event.ghsaAdvisory?.ghsaId,
    event.ghsaAdvisory?.cveId,
    event.osvVulnerability?.osvId,
    ...(event.osvVulnerability?.relatedCveIds ?? []),
    event.cisaAdvisory?.advisoryId,
    ...(event.cisaAdvisory?.relatedCveIds ?? []),
    ...(event.patentRecord?.assignees ?? []),
    event.comtradeRecord?.commodityDescription,
    event.ofacSanctionsRecord?.name,
    ...(event.ofacSanctionsRecord?.countries ?? []),
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
}

function buildProfile(input: BuildProfileInput): WorldwatchProfile {
  return {
    id: input.id,
    name: input.name,
    watchedEntities: input.watchedEntities,
    watchedThemes: input.watchedThemes,
    watchedRegions: input.watchedRegions,
    watchedConnectors: input.watchedConnectors ?? [],
    priorityWeights: { ...DEFAULT_WEIGHTS, ...(input.priorityWeights ?? {}) },
    ignoredEntities: input.ignoredEntities ?? [],
    createdAt: input.now,
    updatedAt: input.now,
  }
}

function sanitizeProfile(value: unknown, now: number): WorldwatchProfile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<WorldwatchProfile>
  if (!raw.id || !raw.name) return null
  return {
    id: String(raw.id),
    name: String(raw.name),
    watchedEntities: Array.isArray(raw.watchedEntities) ? raw.watchedEntities.map(sanitizeEntity).filter((entity): entity is WatchedEntity => Boolean(entity)) : [],
    watchedThemes: Array.isArray(raw.watchedThemes) ? raw.watchedThemes.filter(isWorldwatchTheme) : [],
    watchedRegions: Array.isArray(raw.watchedRegions) ? raw.watchedRegions.map(String) : [],
    watchedConnectors: Array.isArray(raw.watchedConnectors) ? raw.watchedConnectors.map(String) : [],
    priorityWeights: { ...DEFAULT_WEIGHTS, ...(raw.priorityWeights ?? {}) },
    ignoredEntities: Array.isArray(raw.ignoredEntities) ? raw.ignoredEntities.map(sanitizeEntity).filter((entity): entity is WatchedEntity => Boolean(entity)) : [],
    createdAt: Number.isFinite(raw.createdAt) ? Number(raw.createdAt) : now,
    updatedAt: Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : now,
  }
}

function sanitizeEntity(value: unknown): WatchedEntity | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<WatchedEntity>
  if (!raw.kind || !raw.value || !isWatchableEntityKind(raw.kind)) return null
  return {
    kind: raw.kind,
    value: String(raw.value),
    label: raw.label ? String(raw.label) : undefined,
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : undefined,
    weight: typeof raw.weight === 'number' ? raw.weight : undefined,
  }
}

function isWatchableEntityKind(value: unknown): value is WatchableEntityKind {
  return (
    value === 'ticker' ||
    value === 'company' ||
    value === 'cik' ||
    value === 'etf' ||
    value === 'commodity' ||
    value === 'country' ||
    value === 'region' ||
    value === 'facility' ||
    value === 'port' ||
    value === 'grid-region' ||
    value === 'balancing-authority' ||
    value === 'mineral' ||
    value === 'cyber-technology' ||
    value === 'cve'
  )
}

function isWorldwatchTheme(value: unknown): value is WorldwatchTheme {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEME_KEYWORDS, value)
}

function ticker(value: string, label?: string, aliases?: string[]): WatchedEntity {
  return { kind: 'ticker', value, label, aliases }
}

function etf(value: string, label?: string): WatchedEntity {
  return { kind: 'etf', value, label }
}

function commodity(value: string, label?: string): WatchedEntity {
  return { kind: 'commodity', value, label }
}

function company(value: string, label?: string, aliases?: string[]): WatchedEntity {
  return { kind: 'company', value, label, aliases }
}

function entityTerms(entity: WatchedEntity): string[] {
  return [entity.value, entity.label, ...(entity.aliases ?? [])].filter((value): value is string => Boolean(value))
}

function entityKey(entity: WatchedEntity): string {
  return `${entity.kind}:${normalize(entity.value)}`
}

function themeLabel(theme: WorldwatchTheme): string {
  return theme.replace(/-/g, ' ')
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}
