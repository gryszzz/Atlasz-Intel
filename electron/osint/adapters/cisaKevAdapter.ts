/*
 * CISA Known Exploited Vulnerabilities (KEV) catalog adapter.
 *
 * Uses the official CISA KEV catalog JSON
 * (https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json).
 * The catalog is public and unauthenticated, so the adapter is configured by
 * default; it can be disabled with ATLASZ_CISA_KEV_DISABLE=1 or pointed at a
 * mirror with ATLASZ_CISA_KEV_URL (https only).
 *
 * Defensive-security source: each record is a confirmed, actively-exploited
 * vulnerability CISA requires remediation for. Runtime never simulates KEV
 * entries, never invents tickers, and fails closed (returns []) on missing or
 * malformed payloads. Per-record source trail points to the official NIST NVD
 * detail page; the catalog URL is retained alongside it.
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
import type { KevVulnerability, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'cisa_kev_public'
const KEV_SOURCE_NAME = 'CISA Known Exploited Vulnerabilities Catalog'
const DEFAULT_KEV_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
const NVD_DETAIL_BASE = 'https://nvd.nist.gov/vuln/detail'
const KEV_CATALOG_PAGE = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'
const DEFAULT_MAX_RECORDS = 25
const MAX_RECORDS_CAP = 100
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type KevAdapterConfig = {
  catalogUrl: string
  maxRecords: number
}

type KevCatalogPayload = {
  title?: string
  catalogVersion?: string
  dateReleased?: string
  count?: number
  vulnerabilities?: Array<Record<string, unknown>>
}

export function readKevConfig(env: NodeJS.ProcessEnv = process.env): KevAdapterConfig | null {
  // Public, unauthenticated official feed: configured by default, opt-out only.
  if (env.ATLASZ_CISA_KEV_DISABLE === '1') {
    return null
  }
  const catalogUrl = asString(env.ATLASZ_CISA_KEV_URL) || DEFAULT_KEV_URL
  if (!/^https:\/\//i.test(catalogUrl)) {
    // Refuse non-https / malformed overrides rather than fetch insecurely.
    return null
  }
  const maxRecords = clampInteger(
    Number(env.ATLASZ_CISA_KEV_MAX_RECORDS ?? DEFAULT_MAX_RECORDS),
    1,
    MAX_RECORDS_CAP,
  )
  return { catalogUrl, maxRecords }
}

export async function fetchKevVulnerabilities(
  signal: AbortSignal,
  config = readKevConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    return []
  }
  const response = await fetch(config.catalogUrl, {
    signal,
    headers: { accept: 'application/json' },
  })
  assertOk(response, 'CISA KEV')
  const payload = (await response.json()) as unknown
  const records = parseKevCatalog(payload, {
    config,
    sourceCatalogUrl: config.catalogUrl,
    retrievedAt: Date.now(),
  })
  return normalizeKevVulnerabilities(records)
}

/**
 * Best-effort set of CVE IDs currently in the CISA KEV catalog, for cross-linking
 * (e.g. NVD CVE -> KEV badge). Fails closed to an empty set: a KEV outage must
 * never block another connector. Never throws.
 */
export async function fetchKevCveIdSet(
  signal: AbortSignal,
  config = readKevConfig(),
): Promise<Set<string>> {
  if (!config) {
    return new Set()
  }
  try {
    const response = await fetch(config.catalogUrl, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      return new Set()
    }
    const payload = (await response.json()) as unknown
    return kevCveIdSetFromPayload(payload)
  } catch {
    return new Set()
  }
}

/** Pure: extract the set of valid KEV CVE IDs from a catalog payload. */
export function kevCveIdSetFromPayload(payload: unknown): Set<string> {
  const ids = new Set<string>()
  // Cross-linking needs the entire catalog, not just the recent display cap.
  for (const record of parseKevCatalog(payload, { config: { maxRecords: Number.MAX_SAFE_INTEGER } })) {
    ids.add(record.cveId)
  }
  return ids
}

/** Pure normalizer — testable with fixture catalog payloads. */
export function parseKevCatalog(
  payload: unknown,
  options: {
    config?: Partial<KevAdapterConfig>
    sourceCatalogUrl?: string
    retrievedAt?: number
  } = {},
): KevVulnerability[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload as KevCatalogPayload
  const rows = Array.isArray(body.vulnerabilities) ? body.vulnerabilities : []
  if (rows.length === 0) {
    return []
  }

  const catalogVersion = asString(body.catalogVersion) || 'unknown'
  const sourceCatalogUrl = options.sourceCatalogUrl ?? DEFAULT_KEV_URL
  const retrievedAt = options.retrievedAt ?? Date.now()
  const maxRecords = options.config?.maxRecords ?? DEFAULT_MAX_RECORDS

  const records: KevVulnerability[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const cveId = asString(row.cveID).toUpperCase()
    const vendorProject = asString(row.vendorProject)
    const product = asString(row.product)
    const vulnerabilityName = asString(row.vulnerabilityName)
    const dateAdded = asString(row.dateAdded)
    const shortDescription = asString(row.shortDescription)
    const requiredAction = asString(row.requiredAction)
    const dueDate = asString(row.dueDate)
    const knownRansomwareCampaignUse = asString(row.knownRansomwareCampaignUse).toLowerCase() === 'known'
    const cwes = unique(stringArray(row.cwes).map((value) => value.toUpperCase()))
    const sourceUrl = `${NVD_DETAIL_BASE}/${cveId}`

    if (
      !hasValidKevRecord({ cveId, vendorProject, product, vulnerabilityName, dateAdded, sourceUrl })
    ) {
      continue
    }

    const rawRecord = {
      cveId,
      vendorProject,
      product,
      vulnerabilityName,
      dateAdded,
      shortDescription,
      requiredAction,
      dueDate,
      knownRansomwareCampaignUse,
      cwes,
      catalogVersion,
      sourceUrl,
      sourceCatalogUrl,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)
    records.push({
      id: kevRecordId(cveId),
      cveId,
      vendorProject,
      product,
      vulnerabilityName,
      dateAdded,
      dateAddedTimestamp: Date.parse(`${dateAdded}T00:00:00Z`),
      shortDescription,
      requiredAction,
      dueDate: dueDate || undefined,
      knownRansomwareCampaignUse,
      cwes,
      catalogVersion,
      sourceUrl,
      sourceCatalogUrl,
      sourceName: KEV_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForKevRecord({
        cveId,
        vendorProject,
        product,
        vulnerabilityName,
        dateAdded,
        sourceUrl,
      }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  // Most recently added (newly-exploited) vulnerabilities first; cap the volume
  // so the intelligence layer surfaces fresh KEV additions, not the full catalog.
  records.sort((a, b) => b.dateAddedTimestamp - a.dateAddedTimestamp)
  return records.slice(0, maxRecords)
}

export function normalizeKevVulnerabilities(records: KevVulnerability[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: KevVulnerability): WorldIntelEvent {
  const dedupeKey = `cisa-kev|${record.cveId}`.toLowerCase()
  const ransomwareNote = record.knownRansomwareCampaignUse
    ? ' Known use in ransomware campaigns.'
    : ''
  const dueNote = record.dueDate ? ` Federal remediation due ${record.dueDate}.` : ''
  const summary =
    `CISA added ${record.cveId} (${record.vendorProject} ${record.product}) to the Known Exploited ` +
    `Vulnerabilities catalog on ${record.dateAdded}: ${record.vulnerabilityName}.${ransomwareNote}${dueNote} ` +
    `Required action: ${record.requiredAction} Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.cveId} — ${record.vendorProject} ${record.product}`,
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.dateAddedTimestamp,
    category: 'cyber-advisory',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    // Vulnerabilities map to software vendors/products, not tradable tickers.
    // Never invent an affected asset from a vendor name.
    affectedAssets: [],
    narrativeTags: unique([
      'CISA KEV',
      'Known exploited vulnerability',
      record.knownRansomwareCampaignUse ? 'Known ransomware campaign use' : '',
      ...record.cwes,
    ]),
    extractedEntities: unique([
      record.cveId,
      record.vendorProject,
      record.product,
      record.vulnerabilityName,
    ]),
  })

  return {
    ...event,
    confidence: record.confidence,
    kevVulnerability: record,
  }
}

function hasValidKevRecord(input: {
  cveId: string
  vendorProject: string
  product: string
  vulnerabilityName: string
  dateAdded: string
  sourceUrl: string
}): boolean {
  return Boolean(
    CVE_PATTERN.test(input.cveId) &&
      input.vendorProject &&
      input.product &&
      input.vulnerabilityName &&
      ISO_DATE_PATTERN.test(input.dateAdded) &&
      Number.isFinite(Date.parse(`${input.dateAdded}T00:00:00Z`)) &&
      /^https:\/\/nvd\.nist\.gov\/vuln\/detail\/CVE-\d{4}-\d{4,}$/.test(input.sourceUrl),
  )
}

function confidenceForKevRecord(input: {
  cveId: string
  vendorProject: string
  product: string
  vulnerabilityName: string
  dateAdded: string
  sourceUrl: string
}): number {
  return hasValidKevRecord(input) ? 96 : 60
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []
}

function kevRecordId(cveId: string): string {
  return `${SOURCE_ID}:${cveId.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const KEV_SOURCE_ID = SOURCE_ID
export const KEV_CATALOG_REFERENCE_URL = KEV_CATALOG_PAGE
