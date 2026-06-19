import { EventEmitter } from 'node:events'
import type { LiveAttentionTick } from '../../src/realtime'
import type { SocialPulseBatch } from './types'
import { clamp } from './types'

type StocktwitsMessage = {
  id?: unknown
  created_at?: unknown
  body?: unknown
  user?: { username?: unknown }
  entities?: {
    sentiment?: {
      basic?: unknown
    } | null
  }
}

type StocktwitsResponse = {
  messages?: StocktwitsMessage[]
}

type SymbolState = {
  seenIds: Set<string>
  seenQueue: string[]
  lastPollAt?: number
  lastNewMessageCount: number
}

export type StocktwitsTarget = {
  symbol: string
  stocktwitsSymbol: string
}

export type StocktwitsPulseServiceOptions = {
  targets?: StocktwitsTarget[]
  intervalMs?: number
  requestTimeoutMs?: number
  maxSeenIdsPerSymbol?: number
}

export type StocktwitsPulseEvents = {
  pulse: [SocialPulseBatch]
  error: [Error]
}

export const defaultStocktwitsTargets: StocktwitsTarget[] = [
  { symbol: 'SPY', stocktwitsSymbol: 'SPY' },
  { symbol: 'QQQ', stocktwitsSymbol: 'QQQ' },
  { symbol: 'NVDA', stocktwitsSymbol: 'NVDA' },
  { symbol: 'AAPL', stocktwitsSymbol: 'AAPL' },
  { symbol: 'TSLA', stocktwitsSymbol: 'TSLA' },
  { symbol: 'BTC', stocktwitsSymbol: 'BTC.X' },
  { symbol: 'ETH', stocktwitsSymbol: 'ETH.X' },
  { symbol: 'KAS', stocktwitsSymbol: 'KAS.X' },
]

export class StocktwitsPulseService extends EventEmitter {
  private readonly targets: StocktwitsTarget[]
  private readonly intervalMs: number
  private readonly requestTimeoutMs: number
  private readonly maxSeenIdsPerSymbol: number
  private readonly state = new Map<string, SymbolState>()
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(options: StocktwitsPulseServiceOptions = {}) {
    super()
    this.on('error', () => undefined)
    this.targets = options.targets ?? defaultStocktwitsTargets
    this.intervalMs = options.intervalMs ?? 60_000
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000
    this.maxSeenIdsPerSymbol = options.maxSeenIdsPerSymbol ?? 1_000
  }

  override on<K extends keyof StocktwitsPulseEvents>(
    eventName: K,
    listener: (...args: StocktwitsPulseEvents[K]) => void,
  ): this {
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
    for (const target of this.targets) {
      await this.pollTarget(target)
    }
  }

  private async pollTarget(target: StocktwitsTarget): Promise<void> {
    const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(target.stocktwitsSymbol)}.json`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'AtlaszIntel/0.3 local-first public stocktwits connector',
        },
      })
      if (!response.ok) {
        throw new Error(`Stocktwits ${target.stocktwitsSymbol} HTTP ${response.status}`)
      }
      const payload = (await response.json()) as StocktwitsResponse
      const messages = Array.isArray(payload.messages) ? payload.messages : []
      const batch = this.normalizeBatch(target, url, messages)
      this.emit('pulse', batch)
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    } finally {
      clearTimeout(timer)
    }
  }

  private normalizeBatch(target: StocktwitsTarget, sourceUrl: string, messages: StocktwitsMessage[]): SocialPulseBatch {
    const now = Date.now()
    const state = this.getState(target.symbol)
    const elapsedMinutes = state.lastPollAt ? Math.max((now - state.lastPollAt) / 60_000, 1 / 60) : this.intervalMs / 60_000
    let newMessageCount = 0
    let bullishCount = 0
    let bearishCount = 0

    for (const message of messages) {
      const id = message.id === undefined ? '' : String(message.id)
      if (id && !state.seenIds.has(id)) {
        this.markSeen(state, id)
        newMessageCount += 1
      }
      const sentiment = String(message.entities?.sentiment?.basic ?? '').toLowerCase()
      if (sentiment === 'bullish') {
        bullishCount += 1
      } else if (sentiment === 'bearish') {
        bearishCount += 1
      }
    }

    const velocityPerMinute = newMessageCount / elapsedMinutes
    const sentimentTotal = bullishCount + bearishCount
    const mutedSentimentIndex = sentimentTotal === 0 ? 0 : (bullishCount - bearishCount) / sentimentTotal
    const acceleration = velocityPerMinute - state.lastNewMessageCount / elapsedMinutes
    state.lastPollAt = now
    state.lastNewMessageCount = newMessageCount

    const pressure = clamp(38 + velocityPerMinute * 8 + Math.max(0, acceleration) * 3 + Math.abs(mutedSentimentIndex) * 16, 0, 100)
    const attentionTick: LiveAttentionTick = {
      target: target.symbol,
      pressure: round(pressure, 2),
      mentionVelocity: round(velocityPerMinute, 3),
      sentimentDivergenceIndex: round(mutedSentimentIndex, 3),
      timestamp: now,
      source: 'stocktwits_public_stream',
    }

    return {
      symbol: target.symbol,
      sourceSymbol: target.stocktwitsSymbol,
      sourceUrl,
      messageCount: messages.length,
      newMessageCount,
      velocityPerMinute: round(velocityPerMinute, 3),
      mutedSentimentIndex: round(mutedSentimentIndex, 3),
      bullishCount,
      bearishCount,
      observedAt: now,
      attentionTick,
    }
  }

  private getState(symbol: string): SymbolState {
    let state = this.state.get(symbol)
    if (!state) {
      state = { seenIds: new Set(), seenQueue: [], lastNewMessageCount: 0 }
      this.state.set(symbol, state)
    }
    return state
  }

  private markSeen(state: SymbolState, id: string): void {
    state.seenIds.add(id)
    state.seenQueue.push(id)
    while (state.seenQueue.length > this.maxSeenIdsPerSymbol) {
      const oldest = state.seenQueue.shift()
      if (oldest) {
        state.seenIds.delete(oldest)
      }
    }
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
