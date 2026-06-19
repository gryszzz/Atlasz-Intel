import { classifyHeadlineText, deriveWorldIntelSnapshot, type PublicWorldHeadline, type WorldIntelSnapshot } from '../src/worldIntel'
import type { IntelPersistence, WorldHeadlineRecord } from './persistence'

type GdeltArticle = {
  url?: unknown
  title?: unknown
  seendate?: unknown
  domain?: unknown
  sourceCommonName?: unknown
  sourceCountry?: unknown
  language?: unknown
}

type GdeltResponse = {
  articles?: GdeltArticle[]
}

const gdeltEndpoint = 'https://api.gdeltproject.org/api/v2/doc/doc'
const gdeltQuery = [
  '"Red Sea"',
  'semiconductor',
  'Taiwan',
  'tariffs',
  'sanctions',
  '"rare earth"',
  '"central bank"',
  'inflation',
  '"natural gas"',
  'oil',
].join(' OR ')

export class WorldIntelService {
  private readonly persistence: IntelPersistence
  private readonly enabled = process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== '0'
  private status: WorldIntelSnapshot['status'] = this.enabled ? 'stale' : 'disabled'
  private lastError: string | undefined
  private updatedAt: number | undefined
  private inFlight: Promise<WorldIntelSnapshot> | null = null

  constructor(persistence: IntelPersistence) {
    this.persistence = persistence
  }

  snapshot(): WorldIntelSnapshot {
    return this.buildSnapshot()
  }

  refresh(): Promise<WorldIntelSnapshot> {
    if (!this.enabled) {
      this.status = 'disabled'
      return Promise.resolve(this.buildSnapshot())
    }
    if (this.inFlight) {
      return this.inFlight
    }
    this.status = 'fetching'
    this.inFlight = this.fetchGdelt()
      .then((headlines) => {
        for (const headline of headlines) {
          this.persistence.saveHeadline(toHeadlineRecord(headline))
        }
        this.status = headlines.length > 0 ? 'ready' : 'stale'
        this.lastError = undefined
        this.updatedAt = Date.now()
        const snapshot = this.buildSnapshot()
        if (snapshot.rawSourceItems.some((source) => source.connector === 'gdelt-doc-public')) {
          persistDailyBrief(this.persistence, snapshot)
        }
        return snapshot
      })
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error)
        this.status = this.persistence.listHeadlines(1).length > 0 ? 'stale' : 'failed'
        return this.buildSnapshot()
      })
      .finally(() => {
        this.inFlight = null
      })
    return this.inFlight
  }

  private async fetchGdelt(): Promise<PublicWorldHeadline[]> {
    const url = new URL(gdeltEndpoint)
    url.searchParams.set('query', gdeltQuery)
    url.searchParams.set('mode', 'ArtList')
    url.searchParams.set('format', 'json')
    url.searchParams.set('maxrecords', '35')
    url.searchParams.set('sort', 'DateDesc')

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'AtlaszIntel/0.2 local-first world-intel connector',
      },
    })
    if (!response.ok) {
      throw new Error(`GDELT HTTP ${response.status}`)
    }
    const text = await response.text()
    if (!text.trim().startsWith('{')) {
      throw new Error(text.trim().slice(0, 160) || 'GDELT returned a non-JSON response')
    }
    const payload = JSON.parse(text) as GdeltResponse
    const articles = Array.isArray(payload.articles) ? payload.articles : []
    return articles.map(articleToHeadline).filter((headline): headline is PublicWorldHeadline => headline !== null)
  }

  private buildSnapshot(): WorldIntelSnapshot {
    const headlines = this.persistence.listHeadlines(80).map(fromHeadlineRecord)
    return deriveWorldIntelSnapshot({
      enabled: this.enabled,
      status: this.status,
      sourceTrust: this.status === 'failed' ? 'failed' : this.status === 'stale' ? 'stale' : 'public unauthenticated',
      connectorId: this.enabled ? 'gdelt_doc_public' : 'seeded',
      connectorLabel: this.enabled ? 'GDELT DOC public news' : 'Seeded local world layer',
      updatedAt: this.updatedAt,
      lastError: this.lastError,
      headlines,
    })
  }
}

function persistDailyBrief(persistence: IntelPersistence, snapshot: WorldIntelSnapshot): void {
  const createdAt = snapshot.updatedAt ?? Date.now()
  const date = new Date(createdAt).toISOString().slice(0, 10)
  for (const item of snapshot.dailyBrief.slice(0, 5)) {
    persistence.saveBrief({
      id: `world-${date}-${item.id}`,
      date,
      headline: item.headline,
      body: [
        item.whyItMatters,
        `Trust: ${snapshot.sourceTrust}`,
        `Markets: ${item.relatedMarkets.join(', ')}`,
        `Uncertainty: ${item.uncertainty}`,
      ].join('\n'),
      severity: item.severity,
      confidence: item.confidence,
      createdAt,
    })
  }
}

function articleToHeadline(article: GdeltArticle): PublicWorldHeadline | null {
  const title = stringValue(article.title)
  const url = stringValue(article.url)
  if (!title || !url) {
    return null
  }
  const source = stringValue(article.sourceCommonName) || stringValue(article.domain) || 'GDELT public source'
  const observedAt = parseGdeltDate(stringValue(article.seendate)) ?? Date.now()
  const classification = classifyHeadlineText(title)
  return {
    id: stableId(url),
    title,
    source,
    url,
    sector: classification.sector,
    impact: classification.impact,
    observedAt,
  }
}

function toHeadlineRecord(headline: PublicWorldHeadline): WorldHeadlineRecord {
  return {
    id: headline.id,
    title: headline.title,
    source: headline.source,
    url: headline.url,
    sector: headline.sector,
    impact: headline.impact,
    observedAt: headline.observedAt,
  }
}

function fromHeadlineRecord(record: WorldHeadlineRecord): PublicWorldHeadline {
  return {
    id: record.id,
    title: record.title,
    source: record.source,
    url: record.url,
    sector: record.sector,
    impact: record.impact,
    observedAt: record.observedAt,
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseGdeltDate(value: string): number | null {
  if (!/^\d{14}$/.test(value)) {
    return null
  }
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`
  const timestamp = Date.parse(iso)
  return Number.isFinite(timestamp) ? timestamp : null
}

function stableId(input: string): string {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return `gdelt-${hash.toString(36)}`
}
