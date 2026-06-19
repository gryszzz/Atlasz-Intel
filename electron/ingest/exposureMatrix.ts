import type { ExposureMatch } from './types'
import { stableHash } from './types'

export type ExposureRule = {
  keywords: string[]
  tickers: string[]
  theme: string
  reason: string
  confidence: number
}

export const EXPOSURE_MATRIX: ExposureRule[] = [
  {
    keywords: ['taiwan', 'tsmc', 'semiconductor', 'semiconductors', 'chip', 'chips', 'advanced node'],
    tickers: ['TSM', 'NVDA', 'SOXX', 'QQQ', 'AAPL'],
    theme: 'Semiconductor supply concentration',
    reason: 'Taiwan and advanced-chip language maps to foundry concentration, AI hardware supply, and Nasdaq beta.',
    confidence: 0.74,
  },
  {
    keywords: ['red sea', 'suez', 'houthi', 'shipping', 'freight', 'tanker', 'vessel', 'route disruption'],
    tickers: ['ZIM', 'XLE', 'VLO', 'CL', 'DAL', 'UAL'],
    theme: 'Shipping and energy route risk',
    reason: 'Shipping chokepoint language maps to freight cost, crude premium, refinery margins, and airline input costs.',
    confidence: 0.72,
  },
  {
    keywords: ['tariff', 'tariffs', 'china', 'trade war', 'export control', 'export controls', 'sanctions'],
    tickers: ['AAPL', 'TSLA', 'FXI', 'SOXX', 'NVDA', 'XLI'],
    theme: 'Tariff and trade-policy escalation',
    reason: 'Trade restriction language maps to cross-border margin pressure, supply-chain rerouting, and China demand risk.',
    confidence: 0.68,
  },
  {
    keywords: ['rare earth', 'rare earths', 'critical minerals', 'lithium', 'battery materials', 'magnets'],
    tickers: ['LIT', 'TSLA', 'GM', 'XAR', 'NVDA'],
    theme: 'Strategic input scarcity',
    reason: 'Critical-mineral language maps to EV batteries, defense electronics, and strategic inventory pressure.',
    confidence: 0.66,
  },
  {
    keywords: ['inflation', 'federal reserve', 'fed', 'rate cut', 'rate cuts', 'bond yields', 'real yields', 'cpi'],
    tickers: ['SPY', 'QQQ', 'TLT', 'GLD', 'BTC'],
    theme: 'Monetary-policy and duration sensitivity',
    reason: 'Rates and inflation language maps to duration equities, real-yield hedges, dollar pressure, and liquidity-sensitive assets.',
    confidence: 0.64,
  },
  {
    keywords: ['oil', 'crude', 'opec', 'wti', 'brent', 'refinery', 'gasoline'],
    tickers: ['CL', 'XLE', 'VLO', 'XOM', 'CVX', 'DAL'],
    theme: 'Energy price transmission',
    reason: 'Oil and refinery language maps to energy equities, refining margins, inflation impulse, and transport input costs.',
    confidence: 0.7,
  },
  {
    keywords: ['natural gas', 'lng', 'pipeline', 'gas storage', 'europe energy', 'energy security'],
    tickers: ['UNG', 'VGK', 'XLB', 'XLE'],
    theme: 'European energy security',
    reason: 'Gas-storage and LNG language maps to European industrial margins, chemicals, and energy-sensitive equities.',
    confidence: 0.6,
  },
  {
    keywords: ['ai', 'artificial intelligence', 'data center', 'datacenter', 'gpu', 'compute', 'capex'],
    tickers: ['NVDA', 'QQQ', 'SOXX', 'MSFT', 'AMZN'],
    theme: 'AI compute and capex cycle',
    reason: 'AI compute language maps to GPU demand, hyperscaler capex, semiconductor breadth, and mega-cap index exposure.',
    confidence: 0.62,
  },
  {
    keywords: ['bitcoin', 'crypto', 'ethereum', 'etf flows', 'stablecoin', 'coinbase'],
    tickers: ['BTC', 'ETH', 'COIN', 'QQQ'],
    theme: 'Crypto liquidity and market structure',
    reason: 'Crypto-flow language maps to liquidity expectations, exchange exposure, and high-beta risk appetite.',
    confidence: 0.58,
  },
]

export function analyzeHeadlineExposure(headline: string, eventId = `event:${stableHash(headline)}`): ExposureMatch[] {
  const normalized = headline.toLowerCase()
  const matches: ExposureMatch[] = []

  for (const rule of EXPOSURE_MATRIX) {
    const keyword = rule.keywords.find((candidate) => normalized.includes(candidate))
    if (!keyword) {
      continue
    }
    matches.push({
      eventId,
      keyword,
      affectedTickers: rule.tickers,
      confidence: rule.confidence,
      reason: `${rule.theme}: ${rule.reason}`,
    })
  }

  return mergeMatches(matches)
}

function mergeMatches(matches: ExposureMatch[]): ExposureMatch[] {
  const byKeyword = new Map<string, ExposureMatch>()
  for (const match of matches) {
    const existing = byKeyword.get(match.keyword)
    if (!existing) {
      byKeyword.set(match.keyword, match)
      continue
    }
    byKeyword.set(match.keyword, {
      ...existing,
      affectedTickers: [...new Set([...existing.affectedTickers, ...match.affectedTickers])],
      confidence: Math.max(existing.confidence, match.confidence),
      reason: `${existing.reason}; ${match.reason}`,
    })
  }
  return [...byKeyword.values()]
}
