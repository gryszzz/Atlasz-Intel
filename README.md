# Atlasz Intel

Atlasz Intel is a private, local-first intelligence terminal for connecting markets, world news, politics, trade, macro events, and global risk into one signal map.

## Current Version

`v0.2.0` is the Evidence Layer. It is still powered by seeded local intelligence, but the data model and UI now treat evidence, source trails, timestamps, confidence, uncertainty, entity extraction, and market-linking reasons as first-class objects.

## What Is Included

- Command Center with evidence-backed movers, risk map, signals, radar, and ingestion pipeline status
- Market Terminal with connected chart context and auditable market explanations
- World Radar with normalized events, observed/published timestamps, detected entities, linked markets, uncertainty, and source trails
- Entity Graph using React Flow for relationship mapping
- AI Analyst interface that answers from the local evidence layer instead of free-floating summaries
- Daily Brief with headline, why it matters, confidence, source count, uncertainty, watch-next items, and source trail
- Local notes and analyst thread persisted in `localStorage`
- Electron shell with context-isolated preload bridge

## Evidence Model

Atlasz Intel v0.2 structures intelligence around:

- Raw source items
- Normalized events
- Entity extraction
- Market linking
- Signal generation
- Evidence notes
- Source trail items

Each source trail item includes a source name, source URL placeholder, source type, observed timestamp, published timestamp, title, and note. This makes the seeded system auditable now and gives future real connectors a clear place to plug in.

## Local Development

```bash
npm install
npm run dev
```

The Electron app opens from the Vite dev server. For a browser-only preview:

```bash
npm run web:dev
```

## Build

```bash
npm run build
```

Desktop packaging is configured through `electron-builder`:

```bash
npm run desktop:build
```

## Data Status

The current market/news/event information is seeded mock intelligence, not live data and not financial advice. The next major layer should be one real connector, with GDELT as the best first candidate for giving World Radar live global event coverage without needing expensive market feeds.
