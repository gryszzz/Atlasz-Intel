import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GITHUB_RELEASES_SOURCE_ID,
  fetchGithubReleases,
  normalizeGithubReleases,
  parseGithubReleases,
  readGithubReleaseConfig,
} from '../electron/osint/adapters/githubReleaseAdapter'
import { buildEntityGraph, neighborsOf } from '../src/engine/entityModel'
import { EntityDossierPanel } from '../src/components/intel/EntityDossierPanel'
import { createPersistence } from '../electron/persistence'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const NOW = Date.parse('2026-06-01T00:00:00Z')

const FIXTURE = [
  {
    id: 12345,
    html_url: 'https://github.com/sigstore/cosign/releases/tag/v2.4.0',
    tag_name: 'v2.4.0',
    name: 'cosign v2.4.0',
    draft: false,
    prerelease: false,
    created_at: '2026-05-20T09:00:00Z',
    published_at: '2026-05-20T10:00:00Z',
    author: { login: 'someuser' },
  },
  {
    id: 999,
    html_url: 'https://github.com/sigstore/cosign/releases/tag/v2.5.0-rc1',
    tag_name: 'v2.5.0-rc1',
    name: '',
    draft: false,
    prerelease: true,
    published_at: '2026-05-28T10:00:00Z',
    created_at: '2026-05-28T09:00:00Z',
  },
  {
    // Draft -> dropped.
    id: 7,
    html_url: 'https://github.com/sigstore/cosign/releases/tag/draft',
    tag_name: 'draft',
    draft: true,
    published_at: '2026-05-30T10:00:00Z',
  },
  {
    // Malformed: non-GitHub URL -> dropped, never repaired.
    id: 8,
    html_url: 'https://evil.example/x',
    tag_name: 'v1',
    draft: false,
    published_at: '2026-05-01T10:00:00Z',
  },
]

const ORIGINAL_ENV = { ...process.env }
const dirs: string[] = []
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('GitHub Releases adapter', () => {
  it('is public by default, supports an optional token, and DATA_UNAVAILABLE on empty repos', () => {
    expect(readGithubReleaseConfig({})).not.toBeNull()
    expect(readGithubReleaseConfig({})?.token).toBeUndefined()
    expect(readGithubReleaseConfig({ ATLASZ_GITHUB_TOKEN: 'ghp_secret' })?.token).toBe('ghp_secret')
    expect(readGithubReleaseConfig({ ATLASZ_GITHUB_RELEASES_DISABLE: '1' })).toBeNull()
    expect(readGithubReleaseConfig({ ATLASZ_GITHUB_RELEASE_REPOS: 'owner/repo,bad,other/thing' })?.repos).toEqual(['owner/repo', 'other/thing'])
  })

  it('parses releases, derives repo from URL, drops drafts and malformed records', () => {
    const records = parseGithubReleases(FIXTURE, { retrievedAt: NOW })
    expect(records.map((r) => r.tagName)).toEqual(['v2.5.0-rc1', 'v2.4.0']) // newest first, draft + malformed dropped
    const rel = records.find((r) => r.tagName === 'v2.4.0')!
    expect(rel.repoFullName).toBe('sigstore/cosign')
    expect(rel.confidence).toBe(96)
    expect(rel.sourceUrl).toBe('https://github.com/sigstore/cosign/releases/tag/v2.4.0')
  })

  it('never persists the token in the source trail (token redaction)', () => {
    const records = parseGithubReleases(FIXTURE, { retrievedAt: NOW })
    for (const record of records) {
      expect(record.sourceApiUrl).not.toMatch(/ghp_|token|authorization/i)
      expect(record.rawPayloadJson ?? '').not.toMatch(/ghp_secret/)
    }
  })

  it('normalizes into open-source-release events with full source trail', () => {
    const events = normalizeGithubReleases(parseGithubReleases(FIXTURE, { retrievedAt: NOW }))
    const rel = events.find((e) => e.githubRelease?.tagName === 'v2.4.0')
    expect(rel?.category).toBe('open-source-release')
    expect(rel?.provenance).toBe('official-api')
    expect(rel?.sourceId).toBe(GITHUB_RELEASES_SOURCE_ID)
    expect(rel?.githubRelease?.rawPayloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(rel?.affectedAssets).toEqual([])
  })

  it('links repository -> release event and repository -> technology in the graph', () => {
    const events = normalizeGithubReleases(parseGithubReleases(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    const graph = buildEntityGraph(events, { now: NOW })
    const repo = graph.nodes.find((n) => n.id === 'repository:sigstore/cosign')!
    expect(repo).toBeDefined()
    const rels = neighborsOf(graph, repo.id).map((n) => `${n.relation}:${n.entity.kind}`)
    expect(rels).toContain('released:event')
    expect(rels).toContain('represents:technology')
  })

  it('renders the repository dossier with source trail', () => {
    const events = normalizeGithubReleases(parseGithubReleases(FIXTURE, { retrievedAt: NOW })).map((e) => ({ ...e, timestamp: NOW - 60 * 60 * 1000 }))
    const graph = buildEntityGraph(events, { now: NOW })
    const markup = renderToStaticMarkup(createElement(EntityDossierPanel, { graph, entityId: 'repository:sigstore/cosign' }))
    expect(markup).toContain('sigstore/cosign')
    expect(markup).toContain('represents')
    expect(markup).toContain('source trail')
    expect(markup).toContain('GitHub Releases')
  })

  it('round-trips the release sub-record through persistence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlasz-ghrel-'))
    dirs.push(dir)
    const event = normalizeGithubReleases(parseGithubReleases(FIXTURE, { retrievedAt: NOW }))[0]
    createPersistence(dir).saveWorldIntelEvent(event)
    const restored = createPersistence(dir).listWorldIntelEvents().find((e) => e.githubRelease)
    expect(restored?.githubRelease?.repoFullName).toBe(event.githubRelease?.repoFullName)
    expect(restored?.githubRelease?.tagName).toBe(event.githubRelease?.tagName)
    expect(restored?.githubRelease?.rawPayloadHash).toBe(event.githubRelease?.rawPayloadHash)
  })

  it('fails closed on empty payloads and surfaces HttpError via fetchPolicy', async () => {
    expect(parseGithubReleases(null)).toEqual([])
    expect(parseGithubReleases([])).toEqual([])
    expect(normalizeGithubReleases([])).toEqual([])
    expect(await fetchGithubReleases(new AbortController().signal, { apiBase: 'https://api.github.com', repos: [], token: undefined, perPage: 5 })).toEqual([])

    let authHeader: string | undefined
    vi.stubGlobal('fetch', async (_url: string, init: { headers?: Record<string, string> }) => {
      authHeader = init?.headers?.authorization
      return { ok: false, status: 429, headers: { get: (n: string) => (n.toLowerCase() === 'retry-after' ? '2' : null) }, json: async () => [] }
    })
    await expect(
      fetchGithubReleases(new AbortController().signal, { apiBase: 'https://api.github.com', repos: ['sigstore/cosign'], token: 'ghp_secret', perPage: 5 }),
    ).rejects.toMatchObject({ status: 429 })
    // Token was sent as a header (not in the URL).
    expect(authHeader).toBe('Bearer ghp_secret')
  })
})
