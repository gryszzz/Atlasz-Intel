/*
 * GitHub Security Advisories (GHSA) adapter.
 *
 * Uses the official GitHub REST global advisory database
 * (https://api.github.com/advisories). Defensive vulnerability intelligence only:
 * no repo scraping, no person data, no exploitation logic.
 *
 * The API is public; an optional token (ATLASZ_GITHUB_TOKEN) raises rate limits
 * and is sent ONLY as an Authorization header, never placed in any persisted URL
 * or source trail. Malformed advisories are dropped, never repaired. Withdrawn
 * advisories are parsed (so the field is preserved) but never emitted as active
 * intelligence. On HTTP failure / rate limiting / disabled config the fetch
 * throws or returns [] so the ingest layer surfaces DATA_UNAVAILABLE.
 *
 * Each advisory is cross-linked to its CVE; when that CVE is in CISA KEV the
 * record is flagged so the UI can imply exploitation — from KEV membership only,
 * never from severity.
 *
 * provenance: official-api   category: cyber-advisory
 */
import {
  adapterEventId,
  asString,
  buildAdapterEvent,
  sha256,
  stableStringify,
  unique,
} from './adapterShared'
import { fetchKevCveIdSet, readKevConfig } from './cisaKevAdapter'
import { assertOk } from '../fetchPolicy'
import type { GhsaAdvisory, GhsaPackageRef, WorldIntelEvent } from '../../../src/worldIntel'
import type { Severity } from '../../../src/data/intel'

const SOURCE_ID = 'github_ghsa_public'
const GHSA_SOURCE_NAME = 'GitHub Advisory Database'
const ADVISORIES_API = 'https://api.github.com/advisories'
const ADVISORY_WEB_BASE = 'https://github.com/advisories'
const USER_AGENT = 'Atlasz-Intel'
const DEFAULT_PER_PAGE = 30
const MAX_PER_PAGE = 100
const GHSA_PATTERN = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/
const CWE_PATTERN = /^CWE-\d+$/

export type GithubAdvisoryConfig = {
  apiUrl: string
  token?: string
  perPage: number
  advisoryType: 'reviewed' | 'unreviewed' | 'malware'
  linkKev: boolean
}

export function readGithubAdvisoryConfig(env: NodeJS.ProcessEnv = process.env): GithubAdvisoryConfig | null {
  if (env.ATLASZ_GITHUB_GHSA_DISABLE === '1') {
    return null
  }
  const apiUrl = asString(env.ATLASZ_GITHUB_ADVISORIES_URL) || ADVISORIES_API
  if (!/^https:\/\//i.test(apiUrl)) {
    return null
  }
  const token = asString(env.ATLASZ_GITHUB_TOKEN) || undefined
  const perPage = clampInteger(Number(env.ATLASZ_GITHUB_GHSA_PER_PAGE ?? DEFAULT_PER_PAGE), 1, MAX_PER_PAGE)
  const advisoryType = parseAdvisoryType(env.ATLASZ_GITHUB_GHSA_TYPE)
  const linkKev = env.ATLASZ_GITHUB_GHSA_LINK_KEV !== '0'
  return { apiUrl, token, perPage, advisoryType, linkKev }
}

export async function fetchGithubAdvisories(
  signal: AbortSignal,
  config = readGithubAdvisoryConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const now = Date.now()
  const requestUrl = buildRequestUrl(config)
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': USER_AGENT,
    'x-github-api-version': '2022-11-28',
  }
  // Token travels ONLY in the Authorization header; never persisted in a trail.
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`
  }

  const response = await fetch(requestUrl, { signal, headers })
  assertOk(response, 'GitHub advisories')
  const payload = (await response.json()) as unknown

  let knownExploitedCveIds = new Set<string>()
  if (config.linkKev) {
    knownExploitedCveIds = await fetchKevCveIdSet(signal, readKevConfig())
  }

  const records = parseGhsaAdvisories(payload, {
    retrievedAt: now,
    sourceApiUrl: sanitizedApiUrl(config),
    knownExploitedCveIds,
  })
  return normalizeGhsaAdvisories(records)
}

/** Pure normalizer — testable with fixture advisory arrays. */
export function parseGhsaAdvisories(
  payload: unknown,
  options: {
    retrievedAt?: number
    sourceApiUrl?: string
    knownExploitedCveIds?: Set<string>
  } = {},
): GhsaAdvisory[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { advisories?: unknown })?.advisories)
      ? ((payload as { advisories: unknown[] }).advisories)
      : []
  if (rows.length === 0) {
    return []
  }

  const retrievedAt = options.retrievedAt ?? Date.now()
  const sourceApiUrl = options.sourceApiUrl ?? ADVISORIES_API
  const kevIds = options.knownExploitedCveIds ?? new Set<string>()
  const records: GhsaAdvisory[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const advisory = row as Record<string, unknown>
    const ghsaId = asString(advisory.ghsa_id)
    const cveId = resolveCveId(advisory)
    const summary = asString(advisory.summary)
    const severity = asString(advisory.severity).toLowerCase()
    const type = asString(advisory.type) || 'reviewed'
    const publishedAt = asString(advisory.published_at)
    const updatedAt = asString(advisory.updated_at)
    const withdrawnAt = asString(advisory.withdrawn_at) || undefined
    const sourceUrl = asString(advisory.html_url) || `${ADVISORY_WEB_BASE}/${ghsaId}`
    const publishedTimestamp = Date.parse(publishedAt)
    const updatedTimestamp = Date.parse(updatedAt)

    if (
      !hasValidGhsaRecord({
        ghsaId,
        sourceUrl,
        publishedTimestamp,
        updatedTimestamp,
        severity,
        sourceIdentifier: GHSA_SOURCE_NAME,
        retrievedAt,
      })
    ) {
      continue // Drop malformed advisories; never repair.
    }

    const packages = extractPackages(advisory.vulnerabilities)
    const cweIds = extractCweIds(advisory.cwes)
    const references = extractReferences(advisory.references)
    const inKnownExploitedCatalog = Boolean(cveId && kevIds.has(cveId))

    const rawRecord = {
      ghsaId,
      cveId,
      type,
      summary,
      severity,
      packages,
      cweIds,
      references,
      publishedAt,
      updatedAt,
      withdrawnAt,
      sourceUrl,
      sourceApiUrl,
      inKnownExploitedCatalog,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    records.push({
      id: ghsaRecordId(ghsaId),
      ghsaId,
      cveId,
      type,
      summary,
      severity,
      packages,
      cweIds,
      references,
      publishedAt,
      publishedTimestamp,
      updatedAt,
      updatedTimestamp,
      withdrawnAt,
      sourceUrl,
      sourceApiUrl,
      sourceIdentifier: GHSA_SOURCE_NAME,
      sourceName: GHSA_SOURCE_NAME,
      retrievedAt,
      inKnownExploitedCatalog,
      provenance: 'official-api',
      confidence: confidenceForGhsaRecord({
        ghsaId,
        sourceUrl,
        publishedTimestamp,
        updatedTimestamp,
        severity,
        sourceIdentifier: GHSA_SOURCE_NAME,
        retrievedAt,
      }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  records.sort((a, b) => b.publishedTimestamp - a.publishedTimestamp)
  return records
}

export function normalizeGhsaAdvisories(records: GhsaAdvisory[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    // Withdrawn advisories are no longer active intelligence.
    if (record.withdrawnAt) {
      continue
    }
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: GhsaAdvisory): WorldIntelEvent {
  const dedupeKey = `ghsa|${record.ghsaId}`.toLowerCase()
  const cveNote = record.cveId ? ` Linked ${record.cveId}.` : ''
  const kevNote = record.inKnownExploitedCatalog
    ? ' Listed in the CISA Known Exploited Vulnerabilities catalog (active exploitation confirmed).'
    : ''
  const pkgNote =
    record.packages.length > 0
      ? ` Affected: ${record.packages.slice(0, 4).map((pkg) => `${pkg.ecosystem}:${pkg.name}`).join(', ')}.`
      : ''
  const summary =
    `${record.ghsaId} (${record.severity || 'unknown'} severity) published ${record.publishedAt.slice(0, 10)}.` +
    `${cveNote}${pkgNote}${kevNote} ${record.summary} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.ghsaId} — ${record.summary || record.severity}`.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.publishedTimestamp,
    category: 'cyber-advisory',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    // Advisories map to software packages, never tradable tickers.
    affectedAssets: [],
    narrativeTags: unique([
      'GitHub Security Advisory',
      'GHSA',
      record.severity,
      ...record.packages.map((pkg) => pkg.ecosystem),
      record.inKnownExploitedCatalog ? 'CISA KEV' : '',
      ...record.cweIds,
    ]),
    extractedEntities: unique([
      record.ghsaId,
      record.cveId ?? '',
      ...record.packages.map((pkg) => `${pkg.ecosystem}:${pkg.name}`),
      ...record.cweIds,
    ]),
  })

  return {
    ...event,
    // Use the advisory's OFFICIAL stated severity (not inferred exploitability).
    severity: mapGhsaSeverity(record.severity),
    confidence: record.confidence,
    ghsaAdvisory: record,
  }
}

/** Resolve the CVE id from `cve_id` or the identifiers list. */
function resolveCveId(advisory: Record<string, unknown>): string | undefined {
  const direct = asString(advisory.cve_id).toUpperCase()
  if (CVE_PATTERN.test(direct)) {
    return direct
  }
  const identifiers = advisory.identifiers
  if (Array.isArray(identifiers)) {
    for (const identifier of identifiers) {
      const obj = identifier as Record<string, unknown>
      if (asString(obj.type).toUpperCase() === 'CVE') {
        const value = asString(obj.value).toUpperCase()
        if (CVE_PATTERN.test(value)) {
          return value
        }
      }
    }
  }
  return undefined
}

function extractPackages(vulnerabilities: unknown): GhsaPackageRef[] {
  if (!Array.isArray(vulnerabilities)) {
    return []
  }
  const out: GhsaPackageRef[] = []
  for (const vuln of vulnerabilities) {
    const pkg = (vuln as Record<string, unknown>)?.package as Record<string, unknown> | undefined
    const ecosystem = asString(pkg?.ecosystem)
    const name = asString(pkg?.name)
    if (!ecosystem || !name) {
      continue // Only emit package refs when safely available.
    }
    out.push({
      ecosystem,
      name,
      vulnerableRange: asString((vuln as Record<string, unknown>).vulnerable_version_range) || undefined,
      firstPatched: firstPatchedVersion((vuln as Record<string, unknown>).first_patched_version) || undefined,
    })
  }
  return out.slice(0, 20)
}

function firstPatchedVersion(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  // GitHub sometimes nests as { identifier: "1.2.3" }.
  return asString((value as Record<string, unknown>)?.identifier)
}

export function extractCweIds(cwes: unknown): string[] {
  if (!Array.isArray(cwes)) {
    return []
  }
  const ids: string[] = []
  for (const cwe of cwes) {
    const value = asString((cwe as Record<string, unknown>)?.cwe_id).toUpperCase()
    if (CWE_PATTERN.test(value)) {
      ids.push(value)
    }
  }
  return unique(ids)
}

function extractReferences(references: unknown): string[] {
  if (!Array.isArray(references)) {
    return []
  }
  const out: string[] = []
  for (const reference of references) {
    const url = typeof reference === 'string' ? reference : asString((reference as Record<string, unknown>)?.url)
    if (/^https?:\/\//i.test(url)) {
      out.push(url)
    }
  }
  return unique(out).slice(0, 12)
}

function mapGhsaSeverity(severity: string): Severity {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'elevated'
    case 'moderate':
    case 'medium':
      return 'watch'
    case 'low':
      return 'stable'
    default:
      return 'stable'
  }
}

function hasValidGhsaRecord(input: {
  ghsaId: string
  sourceUrl: string
  publishedTimestamp: number
  updatedTimestamp: number
  severity: string
  sourceIdentifier: string
  retrievedAt: number
}): boolean {
  return Boolean(
    GHSA_PATTERN.test(input.ghsaId) &&
      /^https:\/\/github\.com\/advisories\/GHSA-/i.test(input.sourceUrl) &&
      Number.isFinite(input.publishedTimestamp) &&
      Number.isFinite(input.updatedTimestamp) &&
      input.severity &&
      input.sourceIdentifier &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForGhsaRecord(input: {
  ghsaId: string
  sourceUrl: string
  publishedTimestamp: number
  updatedTimestamp: number
  severity: string
  sourceIdentifier: string
  retrievedAt: number
}): number {
  return hasValidGhsaRecord(input) ? 96 : 60
}

function buildRequestUrl(config: GithubAdvisoryConfig): string {
  const url = new URL(config.apiUrl)
  url.searchParams.set('type', config.advisoryType)
  url.searchParams.set('sort', 'published')
  url.searchParams.set('direction', 'desc')
  url.searchParams.set('per_page', String(config.perPage))
  return url.toString()
}

/** API URL retained in the source trail — never contains the token. */
function sanitizedApiUrl(config: GithubAdvisoryConfig): string {
  const url = new URL(config.apiUrl)
  url.searchParams.set('type', config.advisoryType)
  url.searchParams.set('per_page', String(config.perPage))
  return url.toString()
}

function parseAdvisoryType(value: unknown): 'reviewed' | 'unreviewed' | 'malware' {
  const normalized = asString(value).toLowerCase()
  return normalized === 'unreviewed' || normalized === 'malware' ? normalized : 'reviewed'
}

function ghsaRecordId(ghsaId: string): string {
  return `${SOURCE_ID}:${ghsaId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const GHSA_SOURCE_ID = SOURCE_ID
