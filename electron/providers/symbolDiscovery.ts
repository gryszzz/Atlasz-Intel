/*
 * Market symbol auto-discovery. Queries official/public EXCHANGE INFO endpoints
 * (Coinbase products, Binance exchangeInfo) to learn which symbols a provider
 * actually supports — never guesses or invents a price. All network access is
 * injected so it is deterministic in tests and fail-closed in production.
 *
 * KAS rule: try the known public mappings; wire only if a provider really lists
 * it, otherwise report PRICE_UNAVAILABLE. Never fabricate a KAS price.
 */
export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export const KAS_CANDIDATES = ['KAS', 'KASUSDT', 'KAS-USD', 'KAS/USD', 'KAS/USDT', 'KAS-USDT']

export const PRICE_UNAVAILABLE = 'PRICE_UNAVAILABLE'

export async function discoverCoinbaseProducts(fetchImpl: FetchLike, signal?: AbortSignal): Promise<string[]> {
  const response = await fetchImpl('https://api.exchange.coinbase.com/products', { signal })
  if (!response.ok) {
    throw new Error(`Coinbase products HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (!Array.isArray(payload)) {
    return []
  }
  return payload
    .map((entry) => (entry && typeof entry === 'object' ? String((entry as Record<string, unknown>).id ?? '') : ''))
    .filter((id) => id.length > 0)
}

export async function discoverBinanceSymbols(fetchImpl: FetchLike, signal?: AbortSignal): Promise<string[]> {
  const response = await fetchImpl('https://api.binance.com/api/v3/exchangeInfo', { signal })
  if (!response.ok) {
    throw new Error(`Binance exchangeInfo HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { symbols?: Array<{ symbol?: unknown; status?: unknown }> }
  if (!Array.isArray(payload.symbols)) {
    return []
  }
  return payload.symbols
    .filter((entry) => entry.status === undefined || entry.status === 'TRADING')
    .map((entry) => String(entry.symbol ?? ''))
    .filter((symbol) => symbol.length > 0)
}

export type AssetProviderResolution = {
  providerId: string
  providerSymbol: string
  feedType: 'REST' | 'WebSocket'
  status: 'available'
}

export type AssetAvailability = {
  assetSymbol: string
  resolutions: AssetProviderResolution[]
  status: 'available' | typeof PRICE_UNAVAILABLE
}

/**
 * Resolve which providers support a given asset by matching candidate symbol
 * formats against each provider's discovered symbol set.
 */
export function resolveAssetAvailability(
  assetSymbol: string,
  candidates: string[],
  providerSymbolSets: Array<{ providerId: string; feedType: 'REST' | 'WebSocket'; symbols: Set<string> }>,
): AssetAvailability {
  const normalizedCandidates = candidates.map((candidate) => candidate.toUpperCase())
  const resolutions: AssetProviderResolution[] = []
  for (const provider of providerSymbolSets) {
    const match = normalizedCandidates.find((candidate) => provider.symbols.has(candidate))
    if (match) {
      resolutions.push({ providerId: provider.providerId, providerSymbol: match, feedType: provider.feedType, status: 'available' })
    }
  }
  return {
    assetSymbol,
    resolutions,
    status: resolutions.length > 0 ? 'available' : PRICE_UNAVAILABLE,
  }
}

/** KAS-specific resolution across discovered Coinbase + Binance symbol sets. */
export function resolveKasMapping(
  providerSymbolSets: Array<{ providerId: string; feedType: 'REST' | 'WebSocket'; symbols: Set<string> }>,
): AssetAvailability {
  return resolveAssetAvailability('KAS', KAS_CANDIDATES, providerSymbolSets)
}

export function toUpperSet(symbols: string[]): Set<string> {
  return new Set(symbols.map((symbol) => symbol.toUpperCase()))
}
