/*
 * GitHub Releases adapter — the open-source technology layer.
 *
 * Uses the official GitHub REST releases API
 * (GET /repos/{owner}/{repo}/releases) for a configured repo allowlist. Public
 * repos only; an optional token (ATLASZ_GITHUB_TOKEN) raises rate limits and is
 * sent ONLY as an Authorization header, never placed in any persisted URL or
 * source trail. No fake stars/releases/activity, no person enrichment (release
 * author login is deliberately not collected).
 *
 * Malformed/draft records are dropped, never repaired. HTTP/rate-limit failures
 * surface via the shared fetchPolicy (assertOk -> HttpError -> fetchWithRetry).
 * No configured repos or a closed fetch -> DATA_UNAVAILABLE.
 *
 * provenance: official-api   category: open-source-release
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
import type { GithubRelease, WorldIntelEvent } from '../../../src/worldIntel'

const SOURCE_ID = 'github_releases_public'
const RELEASES_SOURCE_NAME = 'GitHub Releases'
const GITHUB_API = 'https://api.github.com'
const USER_AGENT = 'Atlasz-Intel'
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const RELEASE_URL_PATTERN = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/releases\b/
const DEFAULT_PER_PAGE = 5
const MAX_PER_PAGE = 20

// Curated default set of high-signal OSS infra/security repos, env-overridable.
const DEFAULT_REPOS = ['sigstore/cosign', 'aquasecurity/trivy', 'OISF/suricata']

export type GithubReleaseConfig = {
  apiBase: string
  repos: string[]
  token?: string
  perPage: number
}

export function readGithubReleaseConfig(env: NodeJS.ProcessEnv = process.env): GithubReleaseConfig | null {
  if (env.ATLASZ_GITHUB_RELEASES_DISABLE === '1') {
    return null
  }
  const apiBase = asString(env.ATLASZ_GITHUB_API_BASE) || GITHUB_API
  if (!/^https:\/\//i.test(apiBase)) {
    return null
  }
  const repos = parseRepos(env.ATLASZ_GITHUB_RELEASE_REPOS) ?? DEFAULT_REPOS
  const token = asString(env.ATLASZ_GITHUB_TOKEN) || undefined
  const perPage = clampInteger(Number(env.ATLASZ_GITHUB_RELEASES_PER_PAGE ?? DEFAULT_PER_PAGE), 1, MAX_PER_PAGE)
  return { apiBase, repos, token, perPage }
}

export async function fetchGithubReleases(
  signal: AbortSignal,
  config = readGithubReleaseConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config || config.repos.length === 0) {
    return [] // No configured repos -> DATA_UNAVAILABLE upstream.
  }
  const now = Date.now()
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': USER_AGENT,
    'x-github-api-version': '2022-11-28',
  }
  // Token travels ONLY in the Authorization header; never persisted in a trail.
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`
  }

  const rawRecords: unknown[] = []
  for (const repo of config.repos) {
    const response = await fetch(`${config.apiBase}/repos/${repo}/releases?per_page=${config.perPage}`, { signal, headers })
    assertOk(response, 'GitHub releases')
    const payload = (await response.json()) as unknown
    if (Array.isArray(payload)) {
      rawRecords.push(...payload)
    }
  }

  const records = parseGithubReleases(rawRecords, { retrievedAt: now })
  return normalizeGithubReleases(records)
}

/** Pure normalizer — testable with fixture release arrays. */
export function parseGithubReleases(payload: unknown, options: { retrievedAt?: number } = {}): GithubRelease[] {
  const rows = Array.isArray(payload) ? payload : []
  if (rows.length === 0) {
    return []
  }
  const retrievedAt = options.retrievedAt ?? Date.now()
  const out: GithubRelease[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue
    }
    const release = row as Record<string, unknown>
    if (release.draft === true) {
      continue // Drafts are not published releases.
    }
    const sourceUrl = asString(release.html_url)
    const repoMatch = sourceUrl.match(RELEASE_URL_PATTERN)
    const repoFullName = repoMatch?.[1] ?? ''
    const releaseId = release.id === undefined || release.id === null ? '' : String(release.id)
    const tagName = asString(release.tag_name)
    const name = asString(release.name) || tagName
    const publishedAt = asString(release.published_at)
    const createdAt = asString(release.created_at)
    const publishedTimestamp = Date.parse(publishedAt)
    const createdTimestamp = Date.parse(createdAt)

    if (
      !hasValidRelease({ repoFullName, releaseId, tagName, sourceUrl, publishedTimestamp, createdTimestamp, retrievedAt })
    ) {
      continue // Drop malformed records; never repair.
    }

    const observedTimestamp = Number.isFinite(publishedTimestamp) ? publishedTimestamp : createdTimestamp
    const rawRecord = {
      repoFullName,
      releaseId,
      tagName,
      name,
      isPrerelease: release.prerelease === true,
      publishedAt,
      createdAt,
      sourceUrl,
      sourceApiUrl: `${GITHUB_API}/repos/${repoFullName}/releases`,
      retrievedAt,
    }
    const rawPayloadJson = stableStringify(rawRecord)

    out.push({
      id: releaseRecordId(repoFullName, releaseId || tagName),
      repoFullName,
      releaseId,
      tagName,
      name,
      isPrerelease: release.prerelease === true,
      publishedAt,
      publishedTimestamp: Number.isFinite(publishedTimestamp) ? publishedTimestamp : undefined,
      createdAt,
      createdTimestamp: Number.isFinite(createdTimestamp) ? createdTimestamp : undefined,
      observedTimestamp: Number.isFinite(observedTimestamp) ? observedTimestamp : retrievedAt,
      sourceUrl,
      // sourceApiUrl never contains the token (token is header-only).
      sourceApiUrl: `${GITHUB_API}/repos/${repoFullName}/releases`,
      sourceName: RELEASES_SOURCE_NAME,
      retrievedAt,
      provenance: 'official-api',
      confidence: confidenceForRelease({ repoFullName, releaseId, tagName, sourceUrl, publishedTimestamp, createdTimestamp, retrievedAt }),
      rawPayloadHash: sha256(rawPayloadJson),
      rawPayloadJson,
    })
  }

  return out.sort((a, b) => b.observedTimestamp - a.observedTimestamp)
}

export function normalizeGithubReleases(records: GithubRelease[]): WorldIntelEvent[] {
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    if (record.confidence < 90) {
      continue
    }
    events.push(toEvent(record))
  }
  return events
}

function toEvent(record: GithubRelease): WorldIntelEvent {
  const dedupeKey = `ghrelease|${record.repoFullName}|${record.releaseId || record.tagName}`.toLowerCase()
  const tag = record.tagName ? ` ${record.tagName}` : ''
  const pre = record.isPrerelease ? ' (prerelease)' : ''
  const summary =
    `${record.repoFullName} released ${record.name || record.tagName}${pre}` +
    `${record.publishedAt ? ` on ${record.publishedAt.slice(0, 10)}` : ''}. Source: ${record.sourceName}.`

  const event = buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title: `${record.repoFullName}${tag}`.slice(0, 140),
    summary,
    source: record.sourceName,
    url: record.sourceUrl,
    observedAt: record.observedTimestamp,
    category: 'open-source-release',
    provenance: 'official-api',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: [],
    narrativeTags: unique(['GitHub release', record.isPrerelease ? 'prerelease' : 'release', record.repoFullName]),
    extractedEntities: unique([record.repoFullName, record.tagName, repoTechnology(record.repoFullName)]),
  })

  return {
    ...event,
    confidence: record.confidence,
    githubRelease: record,
  }
}

/** Short technology name from a repo full_name (owner/name -> name). */
export function repoTechnology(repoFullName: string): string {
  return repoFullName.split('/')[1] ?? repoFullName
}

function hasValidRelease(input: {
  repoFullName: string
  releaseId: string
  tagName: string
  sourceUrl: string
  publishedTimestamp: number
  createdTimestamp: number
  retrievedAt: number
}): boolean {
  return Boolean(
    REPO_PATTERN.test(input.repoFullName) &&
      (input.releaseId || input.tagName) &&
      RELEASE_URL_PATTERN.test(input.sourceUrl) &&
      (Number.isFinite(input.publishedTimestamp) || Number.isFinite(input.createdTimestamp)) &&
      Number.isFinite(input.retrievedAt),
  )
}

function confidenceForRelease(input: {
  repoFullName: string
  releaseId: string
  tagName: string
  sourceUrl: string
  publishedTimestamp: number
  createdTimestamp: number
  retrievedAt: number
}): number {
  return hasValidRelease(input) ? 96 : 60
}

function parseRepos(value: unknown): string[] | null {
  const repos = asString(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => REPO_PATTERN.test(entry))
  return repos.length > 0 ? unique(repos) : null
}

function releaseRecordId(repoFullName: string, key: string): string {
  return `${SOURCE_ID}:${repoFullName.toLowerCase()}:${key.toLowerCase()}`
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export const GITHUB_RELEASES_SOURCE_ID = SOURCE_ID
