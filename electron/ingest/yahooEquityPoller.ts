import { EventEmitter } from 'node:events'
import type { LiveTick } from '../../src/realtime'
import type { MarketTickBatch } from './types'

type YahooQuote = {
  date?: Date | string | number
  close?: number
  regularMarketPrice?: number
  volume?: number
}

type YahooChartResult = {
  quotes?: YahooQuote[]
}

type YahooFinanceClient = {
  chart: (symbol: string, options: { period1: Date; interval: '1m' }) => Promise<YahooChartResult>
}

type YahooFinanceModule = {
  default: YahooFinanceClient
}

export type YahooEquityPollerOptions = {
  symbols?: string[]
  intervalMs?: number
  lookbackMinutes?: number
}

export type YahooEquityPollerEvents = {
  ticks: [MarketTickBatch]
  error: [Error]
}

export const defaultYahooSymbols = ['NVDA', 'SPY', 'QQQ', 'XLE', 'GLD', 'TSM']

export class YahooEquityPoller extends EventEmitter {
  private readonly symbols: string[]
  private readonly intervalMs: number
  private readonly lookbackMinutes: number
  private timer: ReturnType<typeof setInterval> | null = null
  private client: YahooFinanceClient | null = null
  private running = false

  constructor(options: YahooEquityPollerOptions = {}) {
    super()
    this.on('error', () => undefined)
    this.symbols = options.symbols ?? defaultYahooSymbols
    this.intervalMs = options.intervalMs ?? 60_000
    this.lookbackMinutes = options.lookbackMinutes ?? 8
  }

  override on<K extends keyof YahooEquityPollerEvents>(
    eventName: K,
    listener: (...args: YahooEquityPollerEvents[K]) => void,
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
    try {
      const client = await this.getClient()
      const period1 = new Date(Date.now() - this.lookbackMinutes * 60_000)
      const settled = await Promise.allSettled(
        this.symbols.map(async (symbol) => normalizeQuote(symbol, await client.chart(symbol, { period1, interval: '1m' }))),
      )
      const ticks = settled
        .map((result): LiveTick | null => (result.status === 'fulfilled' ? result.value : null))
        .filter((tick): tick is LiveTick => tick !== null)
      for (const result of settled) {
        if (result.status === 'rejected') {
          this.emit('error', result.reason instanceof Error ? result.reason : new Error(String(result.reason)))
        }
      }
      if (ticks.length > 0) {
        this.emit('ticks', {
          source: 'yahoo_finance_1m_public',
          observedAt: Date.now(),
          ticks,
        })
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async getClient(): Promise<YahooFinanceClient> {
    if (!this.client) {
      const module = (await import('yahoo-finance2')) as unknown as YahooFinanceModule
      this.client = module.default
    }
    return this.client
  }
}

function normalizeQuote(symbol: string, result: YahooChartResult): LiveTick | null {
  const latest = [...(result.quotes ?? [])].reverse().find((quote) => {
    const price = quote.close ?? quote.regularMarketPrice
    return typeof price === 'number' && Number.isFinite(price) && price > 0
  })
  if (!latest) {
    return null
  }
  const price = latest.close ?? latest.regularMarketPrice
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return null
  }
  return {
    symbol,
    price,
    volume: Number.isFinite(latest.volume) && latest.volume && latest.volume > 0 ? latest.volume : 1,
    timestamp: parseQuoteDate(latest.date) ?? Date.now(),
    source: 'yahoo_finance_1m_public',
  }
}

function parseQuoteDate(value: YahooQuote['date']): number | null {
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    return Number.isFinite(timestamp) ? timestamp : null
  }
  return null
}
