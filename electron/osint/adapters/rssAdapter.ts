/*
 * Generic public RSS/Atom adapter. Fetches a configured PUBLIC feed URL and
 * normalizes items into WorldIntelEvent. No login, no scraping, no paywall
 * bypass — public feed URLs only. Pure normalizer is testable with fixtures.
 */
import { buildWorldIntelEventFromHeadline, classifyHeadlineText, type WorldIntelEvent } from '../../../src/worldIntel'
import type { ProvenanceId } from '../../../src/provenance'
import { adapterEventId, asString } from './adapterShared'

export type RssAdapterOptions = {
  url: string
  sourceId: string
  sourceName: string
  provenance: ProvenanceId
  headers?: Record<string, string>
}

export async function fetchRssFeed(signal: AbortSignal, options: RssAdapterOptions): Promise<WorldIntelEvent[]> {
  if (!/^https?:\/\//i.test(options.url)) {
    return [] // fail closed: only public http(s) feeds
  }
  const response = await fetch(options.url, {
    signal,
    headers: { accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml', ...(options.headers ?? {}) },
  })
  if (!response.ok) {
    throw new Error(`RSS ${options.sourceName} HTTP ${response.status}`)
  }
  const xml = await response.text()
  return normalizeRssFeed(xml, options)
}

/** Pure normalizer for RSS <item> and Atom <entry> feeds. */
export function normalizeRssFeed(xml: string, options: RssAdapterOptions): WorldIntelEvent[] {
  if (typeof xml !== 'string' || (!xml.includes('<item') && !xml.includes('<entry'))) {
    return []
  }
  const isAtom = xml.includes('<entry') && !xml.includes('<item')
  const blocks = splitBlocks(xml, isAtom ? 'entry' : 'item')
  const events: WorldIntelEvent[] = []
  for (const block of blocks) {
    const title = decode(tag(block, 'title'))
    const link = decode(isAtom ? attr(block, 'link', 'href') || tag(block, 'id') : tag(block, 'link'))
    if (!title || !link) {
      continue
    }
    const description = decode(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content'))
    const dateRaw = tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'published')
    const observedAt = dateRaw ? Date.parse(dateRaw) : Number.NaN
    const classification = classifyHeadlineText(`${title} ${description}`)
    events.push(
      buildWorldIntelEventFromHeadline(
        {
          id: adapterEventId(options.sourceId, link),
          title,
          source: options.sourceName,
          url: link,
          sector: classification.sector,
          impact: description || classification.impact,
          observedAt: Number.isFinite(observedAt) ? observedAt : Date.now(),
        },
        { sourceId: options.sourceId, provenance: options.provenance },
      ),
    )
  }
  return events
}

function splitBlocks(xml: string, element: 'item' | 'entry'): string[] {
  const parts = xml.split(new RegExp(`<${element}[\\s>]`, 'i')).slice(1)
  return parts.map((part) => part.split(new RegExp(`</${element}>`, 'i'))[0] ?? '')
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))
  if (!match) return ''
  return asString(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
}

function attr(block: string, element: string, attribute: string): string {
  const match = block.match(new RegExp(`<${element}[^>]*\\b${attribute}="([^"]*)"`, 'i'))
  return match ? match[1].trim() : ''
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}
