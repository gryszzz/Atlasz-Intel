/*
 * Dev-only access to seeded market data (Market Data Reality enforcement).
 *
 * The seeded demo arrays in data/intel.ts (movers, watchlist, signal scores,
 * demo radar events) are SIMULATED — they must not render in production. Every
 * consumer imports them through this gate, which returns them ONLY when the dev
 * simulator flag is on (isMarketSimEnabled()); otherwise empty. In a production
 * build the flag is impossible, so these are always empty there.
 */
import { isMarketSimEnabled } from './engine/marketDataReality'
import { marketMovers, watchlist, topSignals, radarEvents } from './data/intel'

/** Returns the seed only when the dev simulator is explicitly enabled. */
export function gateSeed<T>(seed: T[], enabled: boolean = isMarketSimEnabled()): T[] {
  return enabled ? seed : []
}

export const devMarketMovers = gateSeed(marketMovers)
export const devWatchlist = gateSeed(watchlist)
export const devTopSignals = gateSeed(topSignals)
export const devRadarEvents = gateSeed(radarEvents)
