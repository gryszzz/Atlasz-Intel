/*
 * GDELT DOC public news adapter. Documented public unauthenticated API; article
 * metadata only, normalized into WorldIntelEvent. Moved out of the source
 * registry so the adapter registry can reference it without a circular import.
 */
import {
  buildWorldIntelEventFromHeadline,
  classifyHeadlineText,
  type PublicWorldHeadline,
  type WorldIntelEvent,
} from '../../../src/worldIntel'

const GDELT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
const GDELT_QUERY = [
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
  '"data center"',
  'copper',
  'uranium',
].join(' OR ')

type GdeltArticle = {
  url?: unknown
  title?: unknown
  seendate?: unknown
  domain?: unknown
  sourceCommonName?: unknown
}

export async function fetchGdeltEvents(signal: AbortSignal): Promise<WorldIntelEvent[]> {
  const url = new URL(GDELT_ENDPOINT)
  url.searchParams.set('query', GDELT_QUERY)
  url.searchParams.set('mode', 'ArtList')
  url.searchParams.set('format', 'json')
  url.searchParams.set('maxrecords', '50')
  url.searchParams.set('sort', 'DateDesc')

  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json', 'user-agent': 'AtlaszIntel/0.4 local-first world-intel connector' },
  })
  if (!response.ok) {
    throw new Error(`GDELT HTTP ${response.status}`)
  }
  const text = await response.text()
  if (!text.trim().startsWith('{')) {
    throw new Error(text.trim().slice(0, 160) || 'GDELT returned a non-JSON response')
  }
  const payload = JSON.parse(text) as { articles?: GdeltArticle[] }
  const articles = Array.isArray(payload.articles) ? payload.articles : []
  return articles
    .map(articleToHeadline)
    .filter((headline): headline is PublicWorldHeadline => headline !== null)
    .map((headline) => buildWorldIntelEventFromHeadline(headline, { sourceId: 'gdelt_doc_public', provenance: 'public-unauthenticated' }))
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
  return { id: stableId(url), title, source, url, sector: classification.sector, impact: classification.impact, observedAt }
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
  return `osint-${hash.toString(36)}`
}
