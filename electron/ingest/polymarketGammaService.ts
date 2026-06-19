import { EventEmitter } from 'node:events'
import type { ProbabilitySignal } from './types'
import { numberValue, stableHash } from './types'

type GammaMarket = {
  id?: unknown
  question?: unknown
  title?: unknown
  slug?: unknown
  active?: unknown
  closed?: unknown
  volume?: unknown
  liquidity?: unknown
  outcomes?: unknown
  outcomePrices?: unknown
  tags?: unknown
}

export type PolymarketGammaOptions = {
  intervalMs?: number
  requestTimeoutMs?: number
  query?: string
  limit?: number
}

export type PolymarketGammaEvents = {
  probability: [ProbabilitySignal]
  error: [Error]
}

const macroQuery = 'inflation OR fed OR election OR tariffs OR Taiwan OR oil OR recession'

export class PolymarketGammaService extends EventEmitter {
  private readonly intervalMs: number
  private readonly requestTimeoutMs: number
  private readonly query: string
  private readonly limit: number
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false
  private readonly seen = new Map<string, number>()

  constructor(options: PolymarketGammaOptions = {}) {
    super()
    this.on('error', () => undefined)
    this.intervalMs = options.intervalMs ?? 5 * 60_000
    this.requestTimeoutMs = options.requestTimeoutMs ?? 12_000
    this.query = options.query ?? macroQuery
    this.limit = options.limit ?? 40
  }

  override on<K extends keyof PolymarketGammaEvents>(
    eventName: K,
    listener: (...args: PolymarketGammaEvents[K]) => void,
  ): this {
    return super.on(eventName, listener)
  }

  start(): void {
    if (this.running) {
      return
    }
    this.running = true
    void this.poll()
    this.timer = setInterval(() => void this.poll(), this.intervalMs)
  }

  stop(): void {
    this.running = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async poll(): Promise<void> {
    const url = new URL('https://gamma-api.polymarket.com/markets')
    url.searchParams.set('active', 'true')
    url.searchParams.set('closed', 'false')
    url.searchParams.set('limit', String(this.limit))
    url.searchParams.set('q', this.query)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'AtlaszIntel/0.3 local-first polymarket connector',
        },
      })
      if (!response.ok) {
        throw new Error(`Polymarket Gamma HTTP ${response.status}`)
      }
      const payload = await response.json()
      const markets = Array.isArray(payload) ? payload : []
      for (const market of markets) {
        const probability = normalizeMarket(market as GammaMarket)
        if (!probability || this.wasSeenRecently(probability.id, probability.probability)) {
          continue
        }
        this.seen.set(probability.id, probability.probability)
        this.emit('probability', probability)
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    } finally {
      clearTimeout(timer)
    }
  }

  private wasSeenRecently(id: string, probability: number): boolean {
    const prior = this.seen.get(id)
    return prior !== undefined && Math.abs(prior - probability) < 0.01
  }
}

function normalizeMarket(market: GammaMarket): ProbabilitySignal | null {
  const title = stringValue(market.question) || stringValue(market.title)
  if (!title) {
    return null
  }
  const probability = extractProbability(market)
  if (probability === null) {
    return null
  }
  const slug = stringValue(market.slug)
  const id = stringValue(market.id) || stableHash(title)
  return {
    id: `polymarket-${id}`,
    title,
    probability,
    sourceUrl: slug ? `https://polymarket.com/event/${slug}` : 'https://polymarket.com/',
    observedAt: Date.now(),
    tags: normalizeTags(market.tags),
  }
}

function extractProbability(market: GammaMarket): number | null {
  const prices = parseNumberList(market.outcomePrices)
  if (prices.length === 0) {
    return null
  }
  const bounded = prices.filter((price) => price >= 0.01 && price <= 0.99)
  if (bounded.length === 0) {
    return null
  }
  return Math.max(...bounded)
}

function parseNumberList(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(numberValue).filter((item): item is number => item !== null)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parseNumberList(parsed)
    } catch {
      return value
        .split(',')
        .map((part) => numberValue(part.trim()))
        .filter((item): item is number => item !== null)
    }
  }
  return []
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag
      }
      if (tag && typeof tag === 'object') {
        const record = tag as Record<string, unknown>
        return stringValue(record.label) || stringValue(record.name)
      }
      return ''
    })
    .filter((tag) => tag.length > 0)
    .slice(0, 5)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
