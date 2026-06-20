---
name: financial-data-engineering
description: >-
  Acquire and engineer public market data — exchange APIs (CCXT), Yahoo/CoinGecko,
  OHLCV bars, indicators, and backtesting hygiene. Use for market feeds, quant
  metrics, and historical analysis. NOT financial advice. Triggers: "market data",
  "CCXT", "OHLCV", "backtest", "technical indicator", "price history".
---

# Financial data engineering (public, not advice)

Clean, honest market data + math. Analysis tooling, **never advice or
execution**.

## Acquisition

- **CCXT** (JS/Python) — unified public REST/WS across 100+ exchanges (tickers,
  OHLCV, order books). The breadth win for crypto.
- **Yahoo / CoinGecko** public REST for equities/crypto prices.
- Label freshness honestly: `delayed` / `stale-cache` / `public-unauthenticated` /
  `PRICE_UNAVAILABLE`. Public endpoints rate-limit — respect them.

## Engineering

OHLCV bars are the substrate. Derive **math-derived** metrics: returns, realized
vol, z-score, VWAP deviation, drawdown, rolling correlation, relative strength vs
benchmark (SPY/BTC). Null on insufficient history — never fabricate a number.

## Backtesting hygiene (where most people lie to themselves)

- **No look-ahead** — only data available at decision time.
- **Survivorship bias** — include delisted names.
- Account for fees/slippage; out-of-sample + walk-forward; beware overfitting to
  one regime. A backtest is a hypothesis, not a promise.

## Honesty

Provenance on every series (`math-derived`/`public-unauthenticated`); missing
data → unavailable state. This is observation/research, not a recommendation, not
a guarantee, not execution. See [[lawful-intel-acquisition]].
