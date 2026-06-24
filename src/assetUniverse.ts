import { type MarketMover } from './data/intel'
import { devMarketMovers, devWatchlist } from './devMarketData'
import type { LiveAssetConfig, LiveAssetKind } from './realtime'

export type AssetUniverseItem = LiveAssetConfig & {
  defaultPrice: number
  displaySymbol: string
  description: string
}

const knownCrypto: Record<string, { label: string; feedSymbol: string; defaultPrice: number }> = {
  BTC: { label: 'Bitcoin', feedSymbol: 'bitcoin', defaultPrice: 0 },
  ETH: { label: 'Ethereum', feedSymbol: 'ethereum', defaultPrice: 0 },
  SOL: { label: 'Solana', feedSymbol: 'solana', defaultPrice: 0 },
  KAS: { label: 'Kaspa', feedSymbol: 'kaspa', defaultPrice: 0 },
  LINK: { label: 'Chainlink', feedSymbol: 'chainlink', defaultPrice: 0 },
  AVAX: { label: 'Avalanche', feedSymbol: 'avalanche-2', defaultPrice: 0 },
}

const knownForex: Record<string, { label: string; feedSymbol: string; defaultPrice: number }> = {
  EURUSD: { label: 'Euro / US Dollar', feedSymbol: 'EURUSD=X', defaultPrice: 0 },
  GBPUSD: { label: 'British Pound / US Dollar', feedSymbol: 'GBPUSD=X', defaultPrice: 0 },
  USDJPY: { label: 'US Dollar / Japanese Yen', feedSymbol: 'JPY=X', defaultPrice: 0 },
  USDCAD: { label: 'US Dollar / Canadian Dollar', feedSymbol: 'CAD=X', defaultPrice: 0 },
  AUDUSD: { label: 'Australian Dollar / US Dollar', feedSymbol: 'AUDUSD=X', defaultPrice: 0 },
  USDCHF: { label: 'US Dollar / Swiss Franc', feedSymbol: 'CHF=X', defaultPrice: 0 },
}

const knownIndices: Record<string, { label: string; feedSymbol: string; defaultPrice: number }> = {
  SPX: { label: 'S&P 500 Index', feedSymbol: '^GSPC', defaultPrice: 0 },
  NDX: { label: 'Nasdaq 100 Index', feedSymbol: '^NDX', defaultPrice: 0 },
  DJI: { label: 'Dow Jones Industrial Average', feedSymbol: '^DJI', defaultPrice: 0 },
  RUT: { label: 'Russell 2000 Index', feedSymbol: '^RUT', defaultPrice: 0 },
  VIX: { label: 'CBOE Volatility Index', feedSymbol: '^VIX', defaultPrice: 0 },
  DXY: { label: 'US Dollar Index', feedSymbol: 'DX-Y.NYB', defaultPrice: 0 },
}

const sectorAliases: Record<string, { symbol: string; label: string; defaultPrice: number }> = {
  TECH: { symbol: 'XLK', label: 'Technology Select Sector', defaultPrice: 0 },
  TECHNOLOGY: { symbol: 'XLK', label: 'Technology Select Sector', defaultPrice: 0 },
  FINANCIALS: { symbol: 'XLF', label: 'Financial Select Sector', defaultPrice: 0 },
  ENERGY: { symbol: 'XLE', label: 'Energy Select Sector', defaultPrice: 0 },
  HEALTHCARE: { symbol: 'XLV', label: 'Health Care Select Sector', defaultPrice: 0 },
  INDUSTRIALS: { symbol: 'XLI', label: 'Industrial Select Sector', defaultPrice: 0 },
  UTILITIES: { symbol: 'XLU', label: 'Utilities Select Sector', defaultPrice: 0 },
}

const knownCommodities: Record<string, { label: string; feedSymbol: string; defaultPrice: number }> = {
  CL: { label: 'WTI Crude futures', feedSymbol: 'CL=F', defaultPrice: 0 },
  WTI: { label: 'WTI Crude futures', feedSymbol: 'CL=F', defaultPrice: 0 },
  XAUUSD: { label: 'Gold futures proxy', feedSymbol: 'GC=F', defaultPrice: 0 },
  GOLD: { label: 'Gold futures proxy', feedSymbol: 'GC=F', defaultPrice: 0 },
  XAGUSD: { label: 'Silver futures proxy', feedSymbol: 'SI=F', defaultPrice: 0 },
  SILVER: { label: 'Silver futures proxy', feedSymbol: 'SI=F', defaultPrice: 0 },
}

const knownEquities: Record<string, { label: string; defaultPrice: number }> = {
  NVDA: { label: 'Nvidia', defaultPrice: 0 },
  AAPL: { label: 'Apple', defaultPrice: 0 },
  TSLA: { label: 'Tesla', defaultPrice: 0 },
  TSM: { label: 'Taiwan Semiconductor', defaultPrice: 0 },
  COIN: { label: 'Coinbase Global', defaultPrice: 0 },
  MSFT: { label: 'Microsoft', defaultPrice: 0 },
  AMZN: { label: 'Amazon', defaultPrice: 0 },
  XOM: { label: 'Exxon Mobil', defaultPrice: 0 },
  CVX: { label: 'Chevron', defaultPrice: 0 },
  VLO: { label: 'Valero Energy', defaultPrice: 0 },
  ZIM: { label: 'ZIM Integrated Shipping', defaultPrice: 0 },
  DAL: { label: 'Delta Air Lines', defaultPrice: 0 },
  UAL: { label: 'United Airlines', defaultPrice: 0 },
  GM: { label: 'General Motors', defaultPrice: 0 },
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
  const canonicalCrypto = canonicalCryptoSymbol(normalized)
  const seeded = findSeedMarket(canonicalCrypto ?? normalized)
  if (seeded) {
    return fromSeedMarket(seeded, options.enablePublicCrypto)
  }

  const forexKey = normalized.replace(/[/-]/g, '')
  if (knownForex[forexKey]) {
    const item = knownForex[forexKey]
    const symbol = `${forexKey.slice(0, 3)}/${forexKey.slice(3)}`
    return asset(symbol, item.label, 'forex', 'yahoo', item.feedSymbol, item.defaultPrice, 'Yahoo public chart FX lookup; delayed/public unauthenticated')
  }

  const sector = sectorAliases[normalized]
  if (sector) {
    return asset(sector.symbol, sector.label, 'sector', 'yahoo', sector.symbol, sector.defaultPrice, 'Yahoo public chart sector ETF proxy; delayed/public unauthenticated')
  }

  const cryptoSymbol = canonicalCrypto ?? normalized
  const crypto = knownCrypto[cryptoSymbol]
  if (crypto) {
    return asset(
      cryptoSymbol,
      crypto.label,
      'crypto',
      options.enablePublicCrypto ? 'coincap' : 'coingecko',
      crypto.feedSymbol,
      crypto.defaultPrice,
      options.enablePublicCrypto ? 'Public CoinCap-capable crypto mapping' : 'Public CoinGecko REST mapping',
    )
  }

  const index = knownIndices[normalized]
  if (index) {
    return asset(normalized, index.label, 'index', 'yahoo', index.feedSymbol, index.defaultPrice, 'Yahoo public chart index lookup; delayed/public unauthenticated')
  }

  const commodity = knownCommodities[normalized]
  if (commodity) {
    const symbol = normalized === 'WTI' ? 'CL' : normalized === 'GOLD' ? 'XAUUSD' : normalized === 'SILVER' ? 'XAGUSD' : normalized
    return asset(symbol, commodity.label, 'commodity', 'yahoo', commodity.feedSymbol, commodity.defaultPrice, 'Yahoo public chart commodity futures proxy; delayed/public unauthenticated')
  }

  const equity = knownEquities[normalized]
  if (equity) {
    return asset(normalized, equity.label, 'equity', 'yahoo', normalized, equity.defaultPrice, 'Yahoo public chart equity lookup; delayed/public unauthenticated')
  }

  const kind: LiveAssetKind = knownEtfs.has(normalized) ? 'etf' : 'equity'
  return asset(normalized, `${normalized} watchlist asset`, kind, 'yahoo', normalized, 0, 'Yahoo public chart lookup; PRICE_UNAVAILABLE if the symbol is not found')
}

function normalizeSymbol(query: string): string {
  return query.toUpperCase().replace(/\s+/g, '')
}

function canonicalCryptoSymbol(normalized: string): string | null {
  if (knownCrypto[normalized]) {
    return normalized
  }
  const compact = normalized.replace(/[/-]/g, '')
  for (const quote of ['USDT', 'USD']) {
    if (compact.endsWith(quote)) {
      const base = compact.slice(0, -quote.length)
      if (knownCrypto[base]) {
        return base
      }
    }
  }
  return null
}

// Seeded movers/watchlist resolve a symbol's name/kind only behind the dev
// simulator flag; in production this is empty and resolveAssetQuery falls through
// to the known-symbol maps + the real public feed (no seeded prices rendered).
function findSeedMarket(symbol: string): MarketMover | undefined {
  return [...devMarketMovers, ...devWatchlist].find((item) => item.ticker === symbol)
}

function fromSeedMarket(market: MarketMover, enablePublicCrypto = false): AssetUniverseItem {
  const crypto = knownCrypto[market.ticker]
  const commodity = knownCommodities[market.ticker]
  const index = knownIndices[market.ticker]
  const kind = inferKind(market.ticker)
  const source: LiveAssetConfig['source'] = enablePublicCrypto && crypto ? 'coincap' : crypto ? 'coingecko' : 'yahoo'
  const feedSymbol = crypto?.feedSymbol ?? commodity?.feedSymbol ?? index?.feedSymbol ?? market.ticker
  return asset(
    market.ticker,
    market.name,
    kind,
    source,
    feedSymbol,
    0,
    crypto ? 'Public crypto mapping' : 'Yahoo public chart watchlist lookup; delayed/public unauthenticated',
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

function uniqueBySymbol(items: AssetUniverseItem[]): AssetUniverseItem[] {
  return [...new Map(items.map((item) => [item.symbol, item])).values()]
}
