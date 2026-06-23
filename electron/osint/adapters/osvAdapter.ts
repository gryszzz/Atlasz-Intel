/*
 * OSV.dev open-source vulnerability adapter.
 *
 * Uses the official OSV.dev API (https://google.github.io/osv.dev/api/). OSV
 * aggregates open-source package vulnerabilities and cross-references CVE/GHSA
 * via aliases, so it deepens the existing vulnerability graph instead of creating
 * a new isolated surface.
 *
 * Defensive intelligence only: no scanning, no exploit logic, no payloads, no
 * private package/repo collection. The API is public; if a key is added later it
 * must travel only in an Authorization header, never in a persisted URL. Malformed
 * records are dropped, never repaired. HTTP/rate-limit failures surface via the
 * shared fetchPolicy (assertOk -> HttpError -> fetchWithRetry in the registry) so
 * the ingest layer shows DATA_UNAVAILABLE.
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
import { assertOk } from '../fetchPolicy'
import type { OsvAffectedPackage, OsvVulnerability, WorldIntelEvent } from '../../../src/worldIntel'
import type { Severity } from '../../../src/data/intel'

const SOURCE_ID = 'osv_dev_public'
const OSV_SOURCE_NAME = 'OSV.dev'
const OSV_API_BASE = 'https://api.osv.dev'
const OSV_WEB_BASE = 'https://osv.dev/vulnerability'
const OSV_ID_PATTERN = /^[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9][A-Za-z0-9-]*$/
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/i
const GHSA_PATTERN = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i
const DEFAULT_MAX_RECORDS = 40
const MAX_RECORDS_CAP = 100

// A small, real default set so the connector returns genuine OSV data out of the
// box. Override with ATLASZ_OSV_PACKAGES (JSON) or ATLASZ_OSV_IDS (comma list).
const DEFAULT_PACKAGES: OsvQueryPackage[] = [
  { ecosystem: 'PyPI', name: 'requests' },
  { ecosystem: 'npm', name: 'lodash' },
  { ecosystem: 'Maven', name: 'org.apache.logging.log4j:log4j-core' },
]

export type OsvQueryPackage = { ecosystem: string; name: string }

export type OsvAdapterConfig = {
  apiBase: string
  packages: OsvQueryPackage[]
  vulnIds: string[]
  maxRecords: number
}

export function readOsvConfig(env: NodeJS.ProcessEnv = process.env): OsvAdapterConfig | null {
  if (env.ATLASZ_OSV_DISABLE === '1') {
    return null
  }
  const apiBase = asString(env.ATLASZ_OSV_API_BASE) || OSV_API_BASE
  if (!/^https:\/\//i.test(apiBase)) {
    return null
  }
  const vulnIds = unique(
    asString(env.ATLASZ_OSV_IDS)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
  const packages = parsePackages(env.ATLASZ_OSV_PACKAGES) ?? (vulnIds.length > 0 ? [] : DEFAULT_PACKAGES)
  const maxRecords = clampInteger(Number(env.ATLASZ_OSV_MAX_RECORDS ?? DEFAULT_MAX_RECORDS), 1, MAX_RECORDS_CAP)
  return { apiBase, packages, vulnIds, maxRecords }
}

export async function fetchOsvVulnerabilities(
  signal: AbortSignal,
  config = readOsvConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || (config.packages.length === 0 && config.vulnIds.length === 0)) {
    return []
  }
  const now = Date.now()
  const rawRecords: unknown[] = []

  for (const id of config.vulnIds) {
    const response = await fetch(`${config.apiBase}/v1/vulns/${encodeURIComponent(id)}`, {
      signal,
      headers: { accept: 'application/json' },
    })
    assertOk(response, 'OSV.dev')
    rawRecords.push(await response.json())
  }

  for (const pkg of config.packages) {
    const response = await fetch(`${config.apiBase}/v1/query`, {
      signal,
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ package: { ecosystem: pkg.ecosystem, name: pkg.name } }),
    })
    assertOk(response, 'OSV.dev')
    const payload = (await response.json()) as { vulns?: unknown }
    if (Array.isArray(payload.vulns)) {
      rawRecords.push(...payload.vulns)
    }
  }

  const records = parseOsvVulns(rawRecords, { retrievedAt: now, config })
  return normalizeOsvVulnerabilities(records)
}

/** Pure normalizer — testable with fixture OSV records (array, {vulns}, or single). */
export function parseOsvVulns(
  payload: unknown,
  options: { retrievedAt?: number; config?: Partial<OsvAdapterConfig> } = {},
): OsvVulnerability[] {
  const rows = toRecordArray(payload)
  if (rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxRecords = options.config?.maxRecords ?? DEFAULT_MAX_RECORDS
  const byId = new Map<string, OsvVulnerability>()

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const record = row as Record<string, unknown>
    const osvId = asString(record.id)
    const published = asString(record.published)
    const modified = asString(record.modified)
    const publishedTimestamp = Date.parse(published)
    const modifiedTimestamp = Date.parse(modified)
    const sourceUrl = `${OSV_WEB_BASE}/${osvId}`

    if (!hasValidOsvRecord({ osvId, sourceUrl, publishedTimestamp, modifiedTimestamp, retrievedAt })) {
      continue // Drop malformed records; never repair.
    }

    const aliases = unique(stringArray(record.aliases))
    const relatedCveIds = unique(aliases.filter((alias) => CVE_PATTERN.test(alias)).map((alias) => alias.toUpperCase()))
    const relatedGhsaIds = unique(aliases.filter((alias) => GHSA_PATTERN.test(alias)))
    const affectedPackages = extractAffectedPackages(record.affected)
    const severity = extractSeverity(record)
    const references = extractReferences(record.references)
    const observedTimestamp = Number.isFinite(publishedTimestamp) ? publishedTimestamp : modifiedTimestamp

    const rawRecord = {
      osvId,
      aliases,
      relatedCveIds,
      relatedGhsaIds,
      summary: asString(record.summary),
      published,
      modified,
      severity,
      affectedPackages,
      references,
      sourceUrl,
      sourceApiUrl: `${OSV_API_BASE}/v1/vulns/${osvId}`,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    byId.set(osvId, {
      id: osvRecordId(osvId),
      osvId,
      aliases,
      relatedCveIds,
      relatedGhsaIds,
      summary: asString(record.summary),
      details: asString(record.details).slice(0, 600),
      published,
      publishedTimestamp: Number.isFinite(publishedTimestamp) ? publishedTimestamp : undefined,
      modified,
      modifiedTimestamp: Number.isFinite(modifiedTimestamp) ? modifiedTimestamp : undefined,
      observedTimestamp: Number.isFinite(observedTimestamp) ? observedTimestamp : retrievedAt,
      severity,
      ecosystem: affectedPackages[0]?.ecosystem,
      affectedPackages,
      references,
      sourceUrl,
      sourceApiUrl: `${OSV_API_BASE}/v1/vulns/${osvId}`,
      sourceName: OSV_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForOsvRecord({ osvId, sourceUrl, publishedTimestamp, modifiedTimestamp, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  return [...byId.values()].sort((a, b) => b.observedTimestamp - a.observedTimestamp).slice(0, maxRecords)
}

export function normalizeOsvVulnerabilities(records: OsvVulnerability[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: OsvVulnerability): WorldIntelEvent {
  const dedupeKey = `osv|${record.osvId}`.toLowerCase()
  const aliasNote = record.relatedCveIds.length > 0 ? ` Linked ${record.relatedCveIds.join(', ')}.` : ''
  const pkgNote =
    record.affectedPackages.length > 0
      ? ` Affected: ${record.affectedPackages.slice(0, 4).map((p) => `${p.ecosystem}:${p.name}`).join(', ')}.`
      : ''
  const summary =
    `${record.osvId} (${record.severity || 'unscored'})${record.published ? ` published ${record.published.slice(0, 10)}` : ''}.` +
    `${aliasNote}${pkgNote} ${record.summary} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.osvId} — ${record.summary || record.severity || 'OSV advisory'}`.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observedTimestamp,
    category: 'cyber-advisory',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique([
      'OSV.dev',
      'OSV',
      record.severity,
      ...record.affectedPackages.map((p) => p.ecosystem),
      ...record.relatedCveIds,
      ...record.relatedGhsaIds,
    ]),
    extractedEntities: unique([
      record.osvId,
      ...record.relatedCveIds,
      ...record.relatedGhsaIds,
      ...record.affectedPackages.map((p) => `${p.ecosystem}:${p.name}`),
    ]),
  })

  return {
    ...event,
    severity: mapOsvSeverity(record.severity),
    confidence: record.confidence,
    osvVulnerability: record,
  }
}

function toRecordArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (Array.isArray(body.vulns)) return body.vulns
    if (typeof body.id === 'string') return [body]
  }
  return []
}

function extractAffectedPackages(affected: unknown): OsvAffectedPackage[] {
  if (!Array.isArray(affected)) {
    return []
  }
  const out: OsvAffectedPackage[] = []
  for (const entry of affected) {
    const pkg = (entry as Record<string, unknown>)?.package as Record<string, unknown> | undefined
    const ecosystem = asString(pkg?.ecosystem)
    const name = asString(pkg?.name)
    if (!ecosystem || !name) {
      continue // Only emit a package when safely available.
    }
    out.push({ ecosystem, name, fixed: firstFixedVersion((entry as Record<string, unknown>).ranges) })
  }
  return out.slice(0, 20)
}

function firstFixedVersion(ranges: unknown): string | undefined {
  if (!Array.isArray(ranges)) return undefined
  for (const range of ranges) {
    const events = (range as Record<string, unknown>)?.events
    if (!Array.isArray(events)) continue
    for (const event of events) {
      const fixed = asString((event as Record<string, unknown>)?.fixed)
      if (fixed) return fixed
    }
  }
  return undefined
}

function extractSeverity(record: Record<string, unknown>): string {
  const dbSpecific = record.database_specific as Record<string, unknown> | undefined
  const label = asString(dbSpecific?.severity).toUpperCase()
  if (label) return label
  // Fall back to a CVSS vector type when no label is provided.
  if (Array.isArray(record.severity) && record.severity.length > 0) {
    return asString((record.severity[0] as Record<string, unknown>)?.type).toUpperCase()
  }
  return ''
}

function extractReferences(references: unknown): string[] {
  if (!Array.isArray(references)) return []
  const out: string[] = []
  for (const reference of references) {
    const url = typeof reference === 'string' ? reference : asString((reference as Record<string, unknown>)?.url)
    if (/^https?:\/\//i.test(url)) out.push(url)
  }
  return unique(out).slice(0, 12)
}

function mapOsvSeverity(severity: string): Severity {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'elevated'
    case 'MODERATE':
    case 'MEDIUM':
      return 'watch'
    case 'LOW':
      return 'stable'
    default:
      return 'watch'
  }
}

function hasValidOsvRecord(input: {
  osvId: string
  sourceUrl: string
  publishedTimestamp: number
  modifiedTimestamp: number
  retrievedAt: number
}): boolean {
  return Boolean(
    OSV_ID_PATTERN.test(input.osvId) &&
      /^https:\/\/osv\.dev\/vulnerability\//.test(input.sourceUrl) &&
      (Number.isFinite(input.publishedTimestamp) || Number.isFinite(input.modifiedTimestamp)) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForOsvRecord(input: {
  osvId: string
  sourceUrl: string
  publishedTimestamp: number
  modifiedTimestamp: number
  retrievedAt: number
}): number {
  return hasValidOsvRecord(input) ? 96 : 60
}

function parsePackages(value: unknown): OsvQueryPackage[] | null {
  const raw = asString(value)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) return null
    const packages = parsed
      .map((entry) => ({ ecosystem: asString(entry.ecosystem), name: asString(entry.name) }))
      .filter((entry) => entry.ecosystem && entry.name)
    return packages.length > 0 ? packages : null
  } catch {
    return null
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []
}

function osvRecordId(osvId: string): string {
  return `${SOURCE_ID}:${osvId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const OSV_SOURCE_ID = SOURCE_ID
