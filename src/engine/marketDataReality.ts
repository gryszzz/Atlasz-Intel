/*
 * Market Data Reality Pass.
 *
 * A truth inventory of every price / chart / signal / attention / tape surface,
 * so production never silently shows simulated market data. Each surface is
 * classified and carries whether it is allowed in production and whether it is
 * (still) rendered there — the audit flags violations rather than hiding them.
 *
 * Production rule (enforced in tests):
 *  - simulated-dev-only surfaces are never productionAllowed.
 *  - real surfaces must declare the proof fields a quote/candle needs
 *    (ticker, price/value, timestamp, source, retrievedAt, payload hash).
 *  - simulation is opt-in ONLY behind an explicit dev flag (off by default,
 *    impossible in a production build) and never feeds ranking/exposure/coverage.
 */
export type MarketDataClass =
  | 'real-public'
  | 'key-gated'
  | 'simulated-dev-only'
  | 'source-needed'
  | 'removed'

export type MarketDataSurfaceKind = 'price' | 'chart' | 'signal' | 'attention' | 'tape' | 'health'

export type MarketDataSurface = {
  id: string
  label: string
  kind: MarketDataSurfaceKind
  classification: MarketDataClass
  /** Where it comes from / where it's defined. */
  source: string
  /** Files that consume it (for the gating refactor). */
  usedIn: string[]
  /** Proof fields a real record must carry; empty for simulated/source-needed. */
  proofFields: string[]
  productionAllowed: boolean
  /** Honest self-audit: is this simulated/seeded surface STILL rendered in prod? */
  currentlyRenderedInProduction: boolean
  marketRelevance: 'high' | 'medium' | 'low'
  note: string
  missingReason?: string
}

const QUOTE_PROOF = ['ticker', 'price', 'timestamp', 'source', 'retrievedAt', 'rawPayloadHash']

/**
 * Inventory from the Market Data Reality Pass (audit of the current codebase).
 * Honest about what is real, what is simulated/seeded, and what is still wired
 * into production render paths and must be gated/removed.
 */
export const MARKET_DATA_SURFACES: MarketDataSurface[] = [
  // --- Real, source-backed ---
  {
    id: 'crypto-realtime',
    label: 'Crypto realtime prices',
    kind: 'price',
    classification: 'real-public',
    source: 'realtime engine: coingecko / coincap / binance / coinbase (started simulate:false, external:true)',
    usedIn: ['src/realtimeStore.ts', 'src/RealtimeWidgets.tsx'],
    proofFields: QUOTE_PROOF,
    productionAllowed: true,
    currentlyRenderedInProduction: true,
    marketRelevance: 'medium',
    note: 'Live public crypto exchanges; no key. The only realtime price source currently real.',
  },
  // --- Key-gated / fragile, needs a real provider ---
  {
    id: 'equities-yahoo-alpaca',
    label: 'Equity/ETF quotes (yahoo/alpaca, fragile)',
    kind: 'price',
    classification: 'source-needed',
    source: 'realtime engine yahoo (unofficial) / alpaca (key-gated)',
    usedIn: ['src/realtimeStore.ts', 'src/RealtimeWidgets.tsx'],
    proofFields: QUOTE_PROOF,
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'high',
    note: 'Yahoo is unofficial/fragile; needs a proper key-gated provider abstraction (Polygon/Alpaca/Tiingo/IEX). Treat as source-needed until built.',
    missingReason: 'No robust key-gated equity/ETF price provider with full proof fields yet.',
  },
  // --- Simulated / seeded (dev-only) — NOT allowed in production ---
  {
    id: 'seed-market-series',
    label: 'Hardcoded demo candles (marketSeries)',
    kind: 'chart',
    classification: 'simulated-dev-only',
    source: 'src/data/intel.ts marketSeries',
    usedIn: ['src/App.tsx', 'src/assetUniverse.ts'],
    proofFields: [],
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'high',
    note: 'Hardcoded demo OHLC/price series. No production consumer; available only behind the dev simulator flag.',
  },
  {
    id: 'seed-market-movers',
    label: 'Seeded market movers / prices (marketMovers, watchlist)',
    kind: 'price',
    classification: 'simulated-dev-only',
    source: 'src/data/intel.ts marketMovers / watchlist',
    usedIn: ['src/App.tsx', 'src/assetUniverse.ts'],
    proofFields: [],
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'high',
    note: 'Seeded prices/percent moves with no source/retrievedAt/hash. Gated via devMarketData (assetUniverse); empty in production.',
  },
  {
    id: 'seed-top-signals',
    label: 'Seeded signal scores (topSignals)',
    kind: 'signal',
    classification: 'simulated-dev-only',
    source: 'src/data/intel.ts topSignals',
    usedIn: ['src/App.tsx', 'src/DecisionJournal.tsx'],
    proofFields: [],
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'high',
    note: 'Seeded signal/conviction scores not backed by a source. Gated via devMarketData (DecisionJournal); empty in production.',
  },
  {
    id: 'seed-radar-events',
    label: 'Seeded demo radar events (radarEvents)',
    kind: 'tape',
    classification: 'simulated-dev-only',
    source: 'src/data/intel.ts radarEvents',
    usedIn: ['src/App.tsx', 'src/worldIntel.ts'],
    proofFields: [],
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'medium',
    note: 'Demo radar events. Real events come from worldSnapshot.worldEvents; seed gated via devMarketData (DecisionJournal), empty in production.',
  },
  {
    id: 'mock-market-tape',
    label: 'Mock market/shipping/policy tape (mock-* connectors)',
    kind: 'tape',
    classification: 'simulated-dev-only',
    source: 'src/data/intel.ts rawSourceItems (mock-market-tape, mock-gdelt, mock-shipping-wire, mock-policy-calendar)',
    usedIn: ['src/data/intel.ts'],
    proofFields: [],
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance: 'low',
    note: 'Mock ingestion tape used to illustrate the pipeline. Never a real source trail.',
  },
  // --- Source-needed (no provider wired) ---
  sourceNeeded('realtime-equities', 'Realtime equities', 'high', 'No robust key-gated equities price provider wired (Polygon/Alpaca/Tiingo/IEX/Nasdaq Data Link).'),
  sourceNeeded('etf-prices', 'ETF prices', 'high', 'No ETF price provider wired (same provider abstraction as equities).'),
  sourceNeeded('options-oi', 'Options chain / open interest', 'high', 'No options/OI source wired; no "flow" claims allowed without real trade prints.'),
  sourceNeeded('forex', 'Forex', 'high', 'No FX provider wired.'),
  sourceNeeded('commodity-futures', 'Commodity futures', 'high', 'No futures provider wired.'),
  sourceNeeded('short-interest', 'Short interest', 'medium', 'No FINRA/exchange short-interest source wired.'),
  sourceNeeded('earnings-transcripts', 'Earnings calendar / releases / transcripts', 'high', 'No earnings/transcript source wired (needs strict no-hype rules).'),
]

function sourceNeeded(id: string, label: string, marketRelevance: 'high' | 'medium' | 'low', missingReason: string): MarketDataSurface {
  return {
    id,
    label,
    kind: 'price',
    classification: 'source-needed',
    source: 'none',
    usedIn: [],
    proofFields: QUOTE_PROOF,
    productionAllowed: false,
    currentlyRenderedInProduction: false,
    marketRelevance,
    note: 'Not built. Production shows "source-needed", never a simulated stand-in.',
    missingReason,
  }
}

/**
 * Is the dev market simulator enabled? Pure + explicit: ONLY when not a
 * production build AND an explicit opt-in flag is set. Default off everywhere.
 */
export function marketSimEnabled(env: { prod: boolean; flag?: string | boolean }): boolean {
  if (env.prod) return false
  return env.flag === '1' || env.flag === true
}

/** Runtime wrapper reading the build env. Never true in a production build. */
export function isMarketSimEnabled(): boolean {
  const meta = (import.meta as unknown as { env?: { PROD?: boolean; VITE_ATLASZ_MARKET_SIM?: string } }).env ?? {}
  return marketSimEnabled({ prod: Boolean(meta.PROD), flag: meta.VITE_ATLASZ_MARKET_SIM })
}

export type MarketDataRealityReport = {
  real: MarketDataSurface[]
  simulatedDevOnly: MarketDataSurface[]
  sourceNeeded: MarketDataSurface[]
  /** Simulated/seeded surfaces STILL rendered in production — must be gated/removed. */
  productionViolations: MarketDataSurface[]
}

export function marketDataRealityReport(surfaces: MarketDataSurface[] = MARKET_DATA_SURFACES): MarketDataRealityReport {
  return {
    real: surfaces.filter((s) => s.classification === 'real-public' || s.classification === 'key-gated'),
    simulatedDevOnly: surfaces.filter((s) => s.classification === 'simulated-dev-only'),
    sourceNeeded: surfaces.filter((s) => s.classification === 'source-needed'),
    productionViolations: surfaces.filter((s) => !s.productionAllowed && s.currentlyRenderedInProduction),
  }
}
