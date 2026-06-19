import { EventEmitter } from 'node:events'
import Parser from 'rss-parser'
import type { NormalizedNewsEvent } from './types'
import { stableHash } from './types'

type RssItem = {
  title?: string
  link?: string
  isoDate?: string
  pubDate?: string
  contentSnippet?: string
  content?: string
  creator?: string
}

export type RssFeedConfig = {
  id: string
  label: string
  url: string
  sector: string
}

export type RssRadarServiceOptions = {
  feeds?: RssFeedConfig[]
  intervalMs?: number
  requestTimeoutMs?: number
  maxSeenTitles?: number
}

export type RssRadarEvents = {
  headline: [NormalizedNewsEvent]
  error: [Error]
}

export const defaultRssFeeds: RssFeedConfig[] = [
  {
    id: 'cnbc-finance',
    label: 'CNBC Finance RSS',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=finance',
    sector: 'Financial news',
  },
  {
    id: 'reuters-business-google-news',
    label: 'Reuters Business via Google News RSS',
    url: 'https://news.google.com/rss/search?q=when:1d+source:Reuters+business',
    sector: 'Business news',
  },
  {
    id: 'macro-geopolitics-google-news',
    label: 'Macro Geopolitics RSS',
    url: 'https://news.google.com/rss/search?q=when:1d+(tariffs+OR+Taiwan+OR+Red+Sea+OR+inflation+OR+oil+OR+semiconductor)',
    sector: 'Macro/geopolitics',
  },
]

export class RssRadarService extends EventEmitter {
  private readonly parser = new Parser<Record<string, unknown>, RssItem>({
    timeout: 12_000,
  })
  private readonly feeds: RssFeedConfig[]
  private readonly intervalMs: number
  private readonly requestTimeoutMs: number
  private readonly maxSeenTitles: number
  private readonly seenTitleHashes: string[] = []
  private readonly seenSet = new Set<string>()
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(options: RssRadarServiceOptions = {}) {
    super()
    this.on('error', () => undefined)
    this.feeds = options.feeds ?? defaultRssFeeds
    this.intervalMs = options.intervalMs ?? 30_000
    this.requestTimeoutMs = options.requestTimeoutMs ?? 12_000
    this.maxSeenTitles = options.maxSeenTitles ?? 5_000
  }

  override on<K extends keyof RssRadarEvents>(eventName: K, listener: (...args: RssRadarEvents[K]) => void): this {
    return super.on(eventName, listener)
  }

  start(): void {
    if (this.running) {
      return
    }
    this.running = true
    void this.pollAll()
    this.timer = setInterval(() => void this.pollAll(), this.intervalMs)
  }

  stop(): void {
    this.running = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async pollAll(): Promise<void> {
    await Promise.allSettled(this.feeds.map((feed) => this.pollFeed(feed)))
  }

  private async pollFeed(feed: RssFeedConfig): Promise<void> {
    try {
      const parsed = await withTimeout(this.parser.parseURL(feed.url), this.requestTimeoutMs, `${feed.label} timed out`)
      const items = Array.isArray(parsed.items) ? parsed.items : []
      for (const item of items) {
        const event = normalizeItem(feed, item)
        if (!event || this.hasSeen(event.title)) {
          continue
        }
        this.markSeen(event.title)
        this.emit('headline', event)
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private hasSeen(title: string): boolean {
    return this.seenSet.has(stableHash(title.toLowerCase()))
  }

  private markSeen(title: string): void {
    const hash = stableHash(title.toLowerCase())
    this.seenSet.add(hash)
    this.seenTitleHashes.push(hash)
    while (this.seenTitleHashes.length > this.maxSeenTitles) {
      const oldest = this.seenTitleHashes.shift()
      if (oldest) {
        this.seenSet.delete(oldest)
      }
    }
  }
}

function normalizeItem(feed: RssFeedConfig, item: RssItem): NormalizedNewsEvent | null {
  const title = item.title?.trim()
  const sourceUrl = item.link?.trim() || feed.url
  if (!title) {
    return null
  }
  const publishedAt = parsePublishedAt(item.isoDate ?? item.pubDate) ?? Date.now()
  const rawText = [title, item.contentSnippet, item.content].filter(Boolean).join(' ')
  return {
    id: `rss-${feed.id}-${stableHash(`${title}:${sourceUrl}`)}`,
    title,
    sourceName: feed.label,
    sourceUrl,
    sourceTrust: 'public unauthenticated',
    publishedAt,
    observedAt: Date.now(),
    sector: feed.sector,
    summary: item.contentSnippet?.trim() || title,
    rawText,
  }
}

function parsePublishedAt(value: string | undefined): number | null {
  if (!value) {
    return null
  }
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })
}
