import { marketMovers, watchlist, type MarketMover } from './data/intel'
import type { LiveAssetConfig, LiveAssetKind } from './realtime'

export type AssetUniverseItem = LiveAssetConfig & {
  defaultPrice: number
  displaySymbol: string
  description: string
}

const knownCrypto: Record<string, { label: string; feedSymbol: string; defaultPrice: number }> = {
  BTC: { label: 'Bitcoin', feedSymbol: 'bitcoin', defaultPrice: 66820 },
  ETH: { label: 'Ethereum', feedSymbol: 'ethereum', defaultPrice: 3550 },
  SOL: { label: 'Solana', feedSymbol: 'solana', defaultPrice: 142 },
  KAS: { label: 'Kaspa', feedSymbol: 'kaspa', defaultPrice: 0.16 },
  LINK: { label: 'Chainlink', feedSymbol: 'chainlink', defaultPrice: 14.2 },
  AVAX: { label: 'Avalanche', feedSymbol: 'avalanche-2', defaultPrice: 28.5 },
}

const knownForex: Record<string, { label: string; defaultPrice: number }> = {
  EURUSD: { label: 'Euro / US Dollar', defaultPrice: 1.08 },
  GBPUSD: { label: 'British Pound / US Dollar', defaultPrice: 1.27 },
  USDJPY: { label: 'US Dollar / Japanese Yen', defaultPrice: 157.4 },
  USDCAD: { label: 'US Dollar / Canadian Dollar', defaultPrice: 1.37 },
  AUDUSD: { label: 'Australian Dollar / US Dollar', defaultPrice: 0.66 },
  USDCHF: { label: 'US Dollar / Swiss Franc', defaultPrice: 0.9 },
}

const knownIndices: Record<string, { label: string; defaultPrice: number }> = {
  SPX: { label: 'S&P 500 Index', defaultPrice: 5450 },
  NDX: { label: 'Nasdaq 100 Index', defaultPrice: 19650 },
  DJI: { label: 'Dow Jones Industrial Average', defaultPrice: 39150 },
  RUT: { label: 'Russell 2000 Index', defaultPrice: 2030 },
  VIX: { label: 'CBOE Volatility Index', defaultPrice: 14.8 },
  DXY: { label: 'US Dollar Index', defaultPrice: 105.2 },
}

const sectorAliases: Record<string, { symbol: string; label: string; defaultPrice: number }> = {
  TECH: { symbol: 'XLK', label: 'Technology Select Sector', defaultPrice: 226 },
  TECHNOLOGY: { symbol: 'XLK', label: 'Technology Select Sector', defaultPrice: 226 },
  FINANCIALS: { symbol: 'XLF', label: 'Financial Select Sector', defaultPrice: 42 },
  ENERGY: { symbol: 'XLE', label: 'Energy Select Sector', defaultPrice: 94 },
  HEALTHCARE: { symbol: 'XLV', label: 'Health Care Select Sector', defaultPrice: 146 },
  INDUSTRIALS: { symbol: 'XLI', label: 'Industrial Select Sector', defaultPrice: 122 },
  UTILITIES: { symbol: 'XLU', label: 'Utilities Select Sector', defaultPrice: 70 },
}

const knownCommodities: Record<string, { label: string; defaultPrice: number }> = {
  CL: { label: 'WTI Crude', defaultPrice: 81.42 },
  WTI: { label: 'WTI Crude', defaultPrice: 81.42 },
  XAUUSD: { label: 'Gold Spot / US Dollar', defaultPrice: 2360 },
  GOLD: { label: 'Gold', defaultPrice: 2360 },
  XAGUSD: { label: 'Silver Spot / US Dollar', defaultPrice: 30 },
  SILVER: { label: 'Silver', defaultPrice: 30 },
}

const knownEquities: Record<string, { label: string; defaultPrice: number }> = {
  NVDA: { label: 'Nvidia', defaultPrice: 128.44 },
  AAPL: { label: 'Apple', defaultPrice: 196.71 },
  TSLA: { label: 'Tesla', defaultPrice: 182 },
  TSM: { label: 'Taiwan Semiconductor', defaultPrice: 171 },
  COIN: { label: 'Coinbase Global', defaultPrice: 225 },
  MSFT: { label: 'Microsoft', defaultPrice: 442 },
  AMZN: { label: 'Amazon', defaultPrice: 184 },
  XOM: { label: 'Exxon Mobil', defaultPrice: 115 },
  CVX: { label: 'Chevron', defaultPrice: 156 },
  VLO: { label: 'Valero Energy', defaultPrice: 151 },
  ZIM: { label: 'ZIM Integrated Shipping', defaultPrice: 22 },
  DAL: { label: 'Delta Air Lines', defaultPrice: 48.76 },
  UAL: { label: 'United Airlines', defaultPrice: 52 },
  GM: { label: 'General Motors', defaultPrice: 46 },
}

const knownEtfs = new Set([
  'SPY',
  'QQQ',
  'SOXX',
  'GLD',
  'XLE',
  'XLK',
  'XLF',
  'XLV',
  'XLI',
  'XLU',
  'LIT',
  'XAR',
  'TLT',
  'UNG',
  'VGK',
  'XLB',
  'FXI',
])

export const starterUniverseSymbols = [
  'BTC',
  'ETH',
  'KAS',
  'SOL',
  'EUR/USD',
  'USD/JPY',
  'SPX',
  'NDX',
  'VIX',
  'SPY',
  'QQQ',
  'SOXX',
  'XLK',
  'XLE',
  'NVDA',
  'TSM',
  'TSLA',
  'AAPL',
  'FXI',
  'ZIM',
  'VLO',
  'CL',
  'GOLD',
  ...marketMovers.map((item) => item.ticker),
  ...watchlist.map((item) => item.ticker),
]

export function buildDefaultAssetUniverse(enablePublicCrypto = false): AssetUniverseItem[] {
  return uniqueBySymbol(starterUniverseSymbols.map((symbol) => resolveAssetQuery(symbol, { enablePublicCrypto })))
}

export function buildSeedPrices(items: AssetUniverseItem[]): Record<string, number> {
  return Object.fromEntries(items.map((item) => [item.symbol, item.defaultPrice]))
}

export function resolveAssetQuery(
  query: string,
  options: { enablePublicCrypto?: boolean } = {},
): AssetUniverseItem {
  const raw = query.trim()
  const normalized = normalizeSymbol(raw)
  const seeded = findSeedMarket(normalized)
  if (seeded) {
    return fromSeedMarket(seeded, options.enablePublicCrypto)
  }

  const forexKey = normalized.replace('/', '')
  if (knownForex[forexKey]) {
    const item = knownForex[forexKey]
    const symbol = `${forexKey.slice(0, 3)}/${forexKey.slice(3)}`
    return asset(symbol, item.label, 'forex', 'simulator', forexKey.toLowerCase(), item.defaultPrice, 'FX pair simulator')
  }

  const sector = sectorAliases[normalized]
  if (sector) {
    return asset(sector.symbol, sector.label, 'sector', 'simulator', sector.symbol.toLowerCase(), sector.defaultPrice, 'Sector pressure proxy')
  }

  const crypto = knownCrypto[normalized]
  if (crypto) {
    return asset(
      normalized,
      crypto.label,
      'crypto',
      options.enablePublicCrypto ? 'coincap' : 'simulator',
      crypto.feedSymbol,
      crypto.defaultPrice,
      options.enablePublicCrypto ? 'Public CoinCap-capable crypto mapping' : 'Crypto simulator mapping',
    )
  }

  const index = knownIndices[normalized]
  if (index) {
    return asset(normalized, index.label, 'index', 'simulator', normalized.toLowerCase(), index.defaultPrice, 'Index simulator proxy')
  }

  const commodity = knownCommodities[normalized]
  if (commodity) {
    const symbol = normalized === 'WTI' ? 'CL' : normalized === 'GOLD' ? 'XAUUSD' : normalized === 'SILVER' ? 'XAGUSD' : normalized
    return asset(symbol, commodity.label, 'commodity', 'simulator', symbol.toLowerCase(), commodity.defaultPrice, 'Commodity simulator proxy')
  }

  const equity = knownEquities[normalized]
  if (equity) {
    return asset(normalized, equity.label, 'equity', 'simulator', normalized.toLowerCase(), equity.defaultPrice, 'Equity public-poll/local pressure proxy')
  }

  const kind: LiveAssetKind = knownEtfs.has(normalized) ? 'etf' : 'equity'
  return asset(normalized, `${normalized} watchlist asset`, kind, 'simulator', normalized.toLowerCase(), 100, 'User-added simulator watchlist asset')
}

function normalizeSymbol(query: string): string {
  return query.toUpperCase().replace(/\s+/g, '').replace('-', '/')
}

function findSeedMarket(symbol: string): MarketMover | undefined {
  return [...marketMovers, ...watchlist].find((item) => item.ticker === symbol)
}

function fromSeedMarket(market: MarketMover, enablePublicCrypto = false): AssetUniverseItem {
  const crypto = knownCrypto[market.ticker]
  const kind = inferKind(market.ticker)
  return asset(
    market.ticker,
    market.name,
    kind,
    enablePublicCrypto && crypto ? 'coincap' : 'simulator',
    crypto?.feedSymbol ?? market.ticker.toLowerCase(),
    parsePrice(market.price),
    'Seed watchlist asset',
  )
}

function inferKind(ticker: string): LiveAssetKind {
  if (knownCrypto[ticker]) return 'crypto'
  if (knownCommodities[ticker]) return 'commodity'
  if (knownIndices[ticker]) return 'index'
  if (knownEtfs.has(ticker)) return 'etf'
  if (knownEquities[ticker]) return 'equity'
  return 'equity'
}

function asset(
  symbol: string,
  label: string,
  kind: LiveAssetKind,
  source: LiveAssetConfig['source'],
  feedSymbol: string,
  defaultPrice: number,
  description: string,
): AssetUniverseItem {
  return {
    symbol,
    displaySymbol: symbol,
    label,
    kind,
    source,
    feedSymbol,
    defaultPrice,
    description,
  }
}

function parsePrice(price: string): number {
  const value = Number.parseFloat(price.replace(/,/g, ''))
  return Number.isFinite(value) && value > 0 ? value : 100
}

function uniqueBySymbol(items: AssetUniverseItem[]): AssetUniverseItem[] {
  return [...new Map(items.map((item) => [item.symbol, item])).values()]
}
