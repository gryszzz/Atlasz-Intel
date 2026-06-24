/**
 * Local-first persistence for Atlasz Intel (Electron main process).
 *
 * Primary store is SQLite via Node's built-in `node:sqlite` DatabaseSync with
 * Write-Ahead Logging enabled,
 * which gives durable, low-latency, concurrent-read storage for daily briefs,
 * world headlines, and personal Research Notes.
 *
 * If a packaged runtime does not expose node:sqlite, this layer tries the
 * better-sqlite3 shape next and finally falls back to a JSON file store
 * exposing the identical interface, so the app always runs locally.
 * The active mode is reported back to the UI (see LiveEngineStatus.sqliteMode).
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LiveDataFrame, LiveSignalEvent, PersistenceMode } from '../src/realtime'
import type {
  AssetIdentity,
  BeaObservation,
  CountryIntelState,
  EiaEnergyRecord,
  FredMacroObservation,
  MarketIdentity,
  OsintSourceSnapshot,
  SecCompanyFiling,
  TreasuryFiscalRecord,
  UserFavorite,
  WorldIntelEvent,
} from '../src/worldIntel'
import type { UserThesis } from '../src/engine/decisionJournal'

export type { PersistenceMode }

export type DailyBriefRecord = {
  id: string
  date: string
  headline: string
  body: string
  severity: string
  confidence: number
  createdAt: number
}

export type WorldHeadlineRecord = {
  id: string
  title: string
  source: string
  url: string
  sector: string
  impact: string
  observedAt: number
}

export type DecisionRecord = {
  id: string
  createdAt: number
  updatedAt: number
  title: string
  thesis: string
  direction: string
  tickers: string[]
  conviction: number
  emotionalState: string
  evidenceIds: string[]
  context: string
  reviewDate: number
  status: string
  postMortem: string
  outcome: string | null
}

export type MarketTickRecord = {
  id: string
  symbol: string
  price: number
  volume: number
  source: string
  observedAt: number
  tradeDate: string
}

export type SocialAttentionBatchRecord = {
  id: string
  target: string
  pressure: number
  mentionVelocity: number
  sentimentDivergenceIndex: number
  source: string
  observedAt: number
  sampleCount: number
}

export type EntityEdgeRecord = {
  id: string
  source: string
  target: string
  relation: string
  confidence: number
  createdAt: number
}

export type SignalEventRecord = LiveSignalEvent

export type WorldIntelEmbeddingRecord = {
  id: string
  eventId: string
  timestamp: number
  summaryHash: string
  embeddingModel: string
  embeddingVector: number[]
  sourceEventCategory: string
  provenance: string
  createdAt: number
}

export type SourceAuditEventType =
  | 'connector_started'
  | 'connector_failed'
  | 'reconnect_attempted'
  | 'reconnect_succeeded'
  | 'frame_published'
  | 'persistence_failed'
  | 'graph_traversal_triggered'
  | 'signal_generated'
  | 'provider_discovered'
  | 'provider_discovery_failed'

export type SourceAuditRecord = {
  id: string
  eventType: SourceAuditEventType
  connectorId?: string
  severity: 'info' | 'watch' | 'error'
  message: string
  createdAt: number
  metadata?: Record<string, unknown>
}

export type RealtimeFrameRecord = {
  id: string
  sequence: number
  emittedAt: number
  frame: LiveDataFrame
}

export interface IntelPersistence {
  readonly mode: PersistenceMode
  listBriefs(): DailyBriefRecord[]
  saveBrief(record: DailyBriefRecord): void
  listHeadlines(limit?: number): WorldHeadlineRecord[]
  saveHeadline(record: WorldHeadlineRecord): void
  listDecisions(): DecisionRecord[]
  getDecision(id: string): DecisionRecord | null
  saveDecision(record: DecisionRecord): void
  deleteDecision(id: string): void
  decisionsDueForReview(now: number): DecisionRecord[]
  saveMarketTick(record: MarketTickRecord): void
  listMarketTicks(symbol: string, limit?: number): MarketTickRecord[]
  saveAttentionBatch(record: SocialAttentionBatchRecord): void
  saveEntityEdge(record: EntityEdgeRecord): void
  saveSignalEvent(record: SignalEventRecord): void
  listOsintSources(): OsintSourceSnapshot[]
  saveOsintSource(record: OsintSourceSnapshot): void
  listWorldIntelEvents(limit?: number): WorldIntelEvent[]
  saveWorldIntelEvent(record: WorldIntelEvent): void
  listSecCompanyFilings(symbol?: string, limit?: number): SecCompanyFiling[]
  saveSecCompanyFiling(record: SecCompanyFiling): void
  listMarketIdentities(symbol?: string, limit?: number): MarketIdentity[]
  saveMarketIdentity(record: MarketIdentity): void
  listFredMacroObservations(seriesId?: string, limit?: number): FredMacroObservation[]
  saveFredMacroObservation(record: FredMacroObservation): void
  listTreasuryFiscalRecords(datasetId?: string, limit?: number): TreasuryFiscalRecord[]
  saveTreasuryFiscalRecord(record: TreasuryFiscalRecord): void
  listBeaObservations(seriesKey?: string, limit?: number): BeaObservation[]
  saveBeaObservation(record: BeaObservation): void
  listEiaEnergyRecords(seriesId?: string, limit?: number): EiaEnergyRecord[]
  saveEiaEnergyRecord(record: EiaEnergyRecord): void
  listWorldIntelEmbeddings(limit?: number): WorldIntelEmbeddingRecord[]
  saveWorldIntelEmbedding(record: WorldIntelEmbeddingRecord): void
  listUserTheses(limit?: number): UserThesis[]
  saveUserThesis(record: UserThesis): void
  listCountryIntelState(): CountryIntelState[]
  saveCountryIntelState(record: CountryIntelState): void
  listAssetIdentities(): AssetIdentity[]
  saveAssetIdentity(record: AssetIdentity): void
  listFavorites(): UserFavorite[]
  saveFavorite(record: UserFavorite): void
  deleteFavorite(id: string): void
  saveEventAssetLink(record: { id: string; eventId: string; assetSymbol: string; relation: string; confidence: number; createdAt: number }): void
  saveRealtimeFrame(record: RealtimeFrameRecord): void
  listRealtimeFrames(from: number, to: number, limit?: number): RealtimeFrameRecord[]
  audit(record: SourceAuditRecord): void
  close(): void
}

// --- minimal SQLite surface (node:sqlite or better-sqlite3) -----------------

type SqliteStatement = {
  run: (...params: unknown[]) => unknown
  get: (...params: unknown[]) => unknown
  all: (...params: unknown[]) => unknown[]
}

type SqliteDatabase = {
  exec: (source: string) => unknown
  prepare: (source: string) => SqliteStatement
  close: () => void
}

type SqliteConstructor = new (filename: string, options?: unknown) => SqliteDatabase
type NodeSqliteModule = { DatabaseSync: SqliteConstructor }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS daily_briefs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS world_headlines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  sector TEXT NOT NULL,
  impact TEXT NOT NULL,
  observed_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS decision_journal (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  thesis TEXT NOT NULL,
  direction TEXT NOT NULL,
  tickers TEXT NOT NULL,
  conviction INTEGER NOT NULL,
  emotional_state TEXT NOT NULL,
  evidence_ids TEXT NOT NULL,
  context TEXT NOT NULL,
  review_date INTEGER NOT NULL,
  status TEXT NOT NULL,
  post_mortem TEXT NOT NULL,
  outcome TEXT
);
CREATE TABLE IF NOT EXISTS market_ticks_daily (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  volume REAL NOT NULL,
  source TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  trade_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS social_attention_batches (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL,
  pressure REAL NOT NULL,
  mention_velocity REAL NOT NULL,
  sentiment_divergence_index REAL NOT NULL,
  source TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  sample_count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS entity_edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS signal_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  asset_or_topic_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  evidence_ids TEXT NOT NULL,
  confidence TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  related_graph_nodes TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS source_audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  connector_id TEXT,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  metadata TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS realtime_frames (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL,
  emitted_at INTEGER NOT NULL,
  frame_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS osint_sources (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  endpoint_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  poll_interval_ms INTEGER NOT NULL,
  rate_limit_ms INTEGER NOT NULL,
  timeout_ms INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  status TEXT NOT NULL,
  provenance TEXT NOT NULL,
  last_success_at INTEGER,
  last_error_at INTEGER,
  last_error TEXT,
  item_count INTEGER NOT NULL,
  source_reliability_score REAL NOT NULL,
  legal_safety_note TEXT NOT NULL,
  parser_adapter TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS world_intel_events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  country_codes TEXT NOT NULL,
  region TEXT NOT NULL,
  lat REAL,
  lon REAL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT,
  provenance TEXT NOT NULL,
  affected_assets TEXT NOT NULL,
  affected_sectors TEXT NOT NULL,
  affected_commodities TEXT NOT NULL,
  affected_currencies TEXT NOT NULL,
  extracted_entities TEXT NOT NULL,
  narrative_tags TEXT NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  dedupe_hash TEXT NOT NULL,
  sub_records_json TEXT
);
CREATE TABLE IF NOT EXISTS sec_company_filings (
  id TEXT PRIMARY KEY,
  cik TEXT NOT NULL,
  company_name TEXT NOT NULL,
  ticker TEXT,
  form_type TEXT NOT NULL,
  accession_number TEXT NOT NULL,
  filing_date TEXT NOT NULL,
  report_date TEXT,
  accepted_at INTEGER,
  observed_at INTEGER NOT NULL,
  primary_document TEXT,
  source_url TEXT NOT NULL,
  source_json_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS market_identity_master (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  cik TEXT NOT NULL,
  cik_padded TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  common_name TEXT,
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  aliases TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at INTEGER NOT NULL,
  stale_at INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fred_macro_observations (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL,
  title TEXT NOT NULL,
  units TEXT NOT NULL,
  frequency TEXT NOT NULL,
  seasonal_adjustment TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  observation_timestamp INTEGER NOT NULL,
  value REAL NOT NULL,
  raw_value TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_api_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS treasury_fiscal_records (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  table_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_date TEXT NOT NULL,
  record_timestamp INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  raw_value TEXT NOT NULL,
  units TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_api_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bea_observations (
  id TEXT PRIMARY KEY,
  dataset_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  line_number TEXT NOT NULL,
  line_description TEXT NOT NULL,
  series_code TEXT,
  time_period TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  observation_timestamp INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  raw_value TEXT NOT NULL,
  units TEXT NOT NULL,
  unit_multiplier TEXT,
  source_url TEXT NOT NULL,
  source_api_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eia_energy_records (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL,
  title TEXT NOT NULL,
  energy_category TEXT NOT NULL,
  commodity TEXT NOT NULL,
  region TEXT,
  country_code TEXT,
  period TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  observation_timestamp INTEGER NOT NULL,
  value REAL NOT NULL,
  raw_value TEXT NOT NULL,
  units TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_api_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  retrieved_at INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_theses (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  asset_symbol TEXT NOT NULL,
  thesis_type TEXT NOT NULL,
  trigger_event_id TEXT,
  snapshot_metrics TEXT NOT NULL,
  user_notes TEXT NOT NULL,
  target_horizon_days INTEGER NOT NULL,
  is_closed INTEGER NOT NULL,
  performance_grade TEXT,
  entry_price REAL,
  current_return REAL,
  one_day_return REAL,
  seven_day_return REAL,
  thirty_day_return REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS world_intel_embeddings (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  summary_hash TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_vector TEXT NOT NULL,
  source_event_category TEXT NOT NULL,
  provenance TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS country_intel_state (
  country_code TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  last_updated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS asset_identity (
  symbol TEXT PRIMARY KEY,
  identity_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_favorites (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS quant_snapshots (
  id TEXT PRIMARY KEY,
  asset_symbol TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS event_asset_links (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS source_health (
  source_id TEXT PRIMARY KEY,
  health_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS narrative_clusters (
  id TEXT PRIMARY KEY,
  cluster_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decision_review ON decision_journal(status, review_date);
CREATE INDEX IF NOT EXISTS idx_headline_observed ON world_headlines(observed_at);
CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_time ON market_ticks_daily(symbol, observed_at);
CREATE INDEX IF NOT EXISTS idx_attention_target_time ON social_attention_batches(target, observed_at);
CREATE INDEX IF NOT EXISTS idx_signal_created ON signal_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON source_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_frames_window ON realtime_frames(emitted_at);
CREATE INDEX IF NOT EXISTS idx_world_events_time ON world_intel_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_world_events_source ON world_intel_events(source_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sec_filings_ticker_time ON sec_company_filings(ticker, observed_at);
CREATE INDEX IF NOT EXISTS idx_sec_filings_cik_time ON sec_company_filings(cik, observed_at);
CREATE INDEX IF NOT EXISTS idx_sec_filings_form_time ON sec_company_filings(form_type, observed_at);
CREATE INDEX IF NOT EXISTS idx_market_identity_ticker ON market_identity_master(ticker);
CREATE INDEX IF NOT EXISTS idx_market_identity_cik ON market_identity_master(cik);
CREATE INDEX IF NOT EXISTS idx_market_identity_retrieved ON market_identity_master(retrieved_at);
CREATE INDEX IF NOT EXISTS idx_fred_observations_series_time ON fred_macro_observations(series_id, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_fred_observations_retrieved ON fred_macro_observations(retrieved_at);
CREATE INDEX IF NOT EXISTS idx_treasury_fiscal_dataset_time ON treasury_fiscal_records(dataset_id, record_timestamp);
CREATE INDEX IF NOT EXISTS idx_treasury_fiscal_retrieved ON treasury_fiscal_records(retrieved_at);
CREATE INDEX IF NOT EXISTS idx_bea_observations_series_time ON bea_observations(dataset_name, table_name, line_number, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_bea_observations_retrieved ON bea_observations(retrieved_at);
CREATE INDEX IF NOT EXISTS idx_eia_energy_series_time ON eia_energy_records(series_id, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_eia_energy_retrieved ON eia_energy_records(retrieved_at);
CREATE INDEX IF NOT EXISTS idx_eia_energy_commodity_time ON eia_energy_records(commodity, observation_timestamp);
CREATE INDEX IF NOT EXISTS idx_event_asset_links_asset ON event_asset_links(asset_symbol, created_at);
CREATE INDEX IF NOT EXISTS idx_embeddings_event ON world_intel_embeddings(event_id);
CREATE INDEX IF NOT EXISTS idx_user_theses_symbol ON user_theses(asset_symbol, timestamp);
`

/**
 * Create the persistence layer, preferring SQLite+WAL and falling back to a
 * JSON file store. Never throws on a missing native module.
 */
export function createPersistence(dataDir: string): IntelPersistence {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const databaseFile = join(dataDir, 'atlasz-intel.db')
  const require = createRequire(import.meta.url)

  try {
    const { DatabaseSync } = require('node:sqlite') as NodeSqliteModule
    const db = new DatabaseSync(databaseFile)
    configureSqlite(db)
    return new SqliteStore(db, 'node:sqlite')
  } catch (nodeSqliteError) {
    console.warn(
      '[atlasz] node:sqlite unavailable, trying better-sqlite3. Reason:',
      nodeSqliteError instanceof Error ? nodeSqliteError.message : nodeSqliteError,
    )
  }

  try {
    const Database = require('better-sqlite3') as SqliteConstructor
    const db = new Database(databaseFile)
    configureSqlite(db)
    return new SqliteStore(db, 'better-sqlite3')
  } catch (error) {
    console.warn(
      '[atlasz] SQLite unavailable, using JSON fallback store. Reason:',
      error instanceof Error ? error.message : error,
    )
    return new JsonStore(dataDir)
  }
}

function configureSqlite(db: SqliteDatabase): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    ${SCHEMA}
  `)
  // Idempotent migrations for databases created before a column existed.
  ensureColumn(db, 'world_intel_events', 'sub_records_json', 'TEXT')
}

/** Add a column if it is not already present. Safe to run on every boot. */
function ensureColumn(db: SqliteDatabase, table: string, column: string, ddlType: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name?: unknown }>
  if (!columns.some((entry) => String(entry.name) === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType}`)
  }
}

// --- SQLite (WAL) implementation -------------------------------------------

class SqliteStore implements IntelPersistence {
  readonly mode: PersistenceMode
  private readonly db: SqliteDatabase

  constructor(db: SqliteDatabase, mode: PersistenceMode) {
    this.db = db
    this.mode = mode
  }

  listBriefs(): DailyBriefRecord[] {
    const rows = this.db.prepare('SELECT * FROM daily_briefs ORDER BY created_at DESC').all() as Array<
      Record<string, unknown>
    >
    return rows.map(rowToBrief)
  }

  saveBrief(record: DailyBriefRecord): void {
    this.db
      .prepare(
        `INSERT INTO daily_briefs (id, date, headline, body, severity, confidence, created_at)
         VALUES (@id, @date, @headline, @body, @severity, @confidence, @createdAt)
         ON CONFLICT(id) DO UPDATE SET
           date=excluded.date, headline=excluded.headline, body=excluded.body,
           severity=excluded.severity, confidence=excluded.confidence`,
      )
      .run(record)
  }

  listHeadlines(limit = 200): WorldHeadlineRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM world_headlines ORDER BY observed_at DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>
    return rows.map(rowToHeadline)
  }

  saveHeadline(record: WorldHeadlineRecord): void {
    this.db
      .prepare(
        `INSERT INTO world_headlines (id, title, source, url, sector, impact, observed_at)
         VALUES (@id, @title, @source, @url, @sector, @impact, @observedAt)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, source=excluded.source, url=excluded.url,
           sector=excluded.sector, impact=excluded.impact, observed_at=excluded.observed_at`,
      )
      .run(record)
  }

  listDecisions(): DecisionRecord[] {
    const rows = this.db.prepare('SELECT * FROM decision_journal ORDER BY updated_at DESC').all() as Array<
      Record<string, unknown>
    >
    return rows.map(rowToDecision)
  }

  getDecision(id: string): DecisionRecord | null {
    const row = this.db.prepare('SELECT * FROM decision_journal WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    return row ? rowToDecision(row) : null
  }

  saveDecision(record: DecisionRecord): void {
    this.db
      .prepare(
        `INSERT INTO decision_journal
           (id, created_at, updated_at, title, thesis, direction, tickers, conviction,
            emotional_state, evidence_ids, context, review_date, status, post_mortem, outcome)
         VALUES
           (@id, @createdAt, @updatedAt, @title, @thesis, @direction, @tickers, @conviction,
            @emotionalState, @evidenceIds, @context, @reviewDate, @status, @postMortem, @outcome)
         ON CONFLICT(id) DO UPDATE SET
           updated_at=excluded.updated_at, title=excluded.title, thesis=excluded.thesis,
           direction=excluded.direction, tickers=excluded.tickers, conviction=excluded.conviction,
           emotional_state=excluded.emotional_state, evidence_ids=excluded.evidence_ids,
           context=excluded.context, review_date=excluded.review_date, status=excluded.status,
           post_mortem=excluded.post_mortem, outcome=excluded.outcome`,
      )
      .run({
        ...record,
        tickers: JSON.stringify(record.tickers),
        evidenceIds: JSON.stringify(record.evidenceIds),
      })
  }

  deleteDecision(id: string): void {
    this.db.prepare('DELETE FROM decision_journal WHERE id = ?').run(id)
  }

  decisionsDueForReview(now: number): DecisionRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM decision_journal WHERE status = 'open' AND review_date <= ? ORDER BY review_date ASC")
      .all(now) as Array<Record<string, unknown>>
    return rows.map(rowToDecision)
  }

  saveMarketTick(record: MarketTickRecord): void {
    this.db
      .prepare(
        `INSERT INTO market_ticks_daily (id, symbol, price, volume, source, observed_at, trade_date)
         VALUES (@id, @symbol, @price, @volume, @source, @observedAt, @tradeDate)
         ON CONFLICT(id) DO UPDATE SET
           price=excluded.price, volume=excluded.volume, source=excluded.source,
           observed_at=excluded.observed_at, trade_date=excluded.trade_date`,
      )
      .run(record)
  }

  listMarketTicks(symbol: string, limit = 200): MarketTickRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM market_ticks_daily WHERE symbol = ? ORDER BY observed_at DESC LIMIT ?')
      .all(symbol, limit) as Array<Record<string, unknown>>
    return rows.map(rowToMarketTick)
  }

  saveAttentionBatch(record: SocialAttentionBatchRecord): void {
    this.db
      .prepare(
        `INSERT INTO social_attention_batches
           (id, target, pressure, mention_velocity, sentiment_divergence_index, source, observed_at, sample_count)
         VALUES
           (@id, @target, @pressure, @mentionVelocity, @sentimentDivergenceIndex, @source, @observedAt, @sampleCount)
         ON CONFLICT(id) DO UPDATE SET
           pressure=excluded.pressure, mention_velocity=excluded.mention_velocity,
           sentiment_divergence_index=excluded.sentiment_divergence_index,
           source=excluded.source, observed_at=excluded.observed_at, sample_count=excluded.sample_count`,
      )
      .run(record)
  }

  saveEntityEdge(record: EntityEdgeRecord): void {
    this.db
      .prepare(
        `INSERT INTO entity_edges (id, source, target, relation, confidence, created_at)
         VALUES (@id, @source, @target, @relation, @confidence, @createdAt)
         ON CONFLICT(id) DO UPDATE SET
           source=excluded.source, target=excluded.target, relation=excluded.relation,
           confidence=excluded.confidence, created_at=excluded.created_at`,
      )
      .run(record)
  }

  saveSignalEvent(record: SignalEventRecord): void {
    this.db
      .prepare(
        `INSERT INTO signal_events
           (id, type, asset_or_topic_id, severity, evidence_ids, confidence, created_at, explanation, related_graph_nodes)
         VALUES
           (@id, @type, @assetOrTopicId, @severity, @evidenceIds, @confidence, @createdAt, @explanation, @relatedGraphNodes)
         ON CONFLICT(id) DO UPDATE SET
           severity=excluded.severity, evidence_ids=excluded.evidence_ids, confidence=excluded.confidence,
           explanation=excluded.explanation, related_graph_nodes=excluded.related_graph_nodes`,
      )
      .run({
        ...record,
        evidenceIds: JSON.stringify(record.evidenceIds),
        relatedGraphNodes: JSON.stringify(record.relatedGraphNodes),
      })
  }

  listOsintSources(): OsintSourceSnapshot[] {
    const rows = this.db.prepare('SELECT * FROM osint_sources ORDER BY source_name ASC').all() as Array<Record<string, unknown>>
    return rows.map(rowToOsintSource)
  }

  saveOsintSource(record: OsintSourceSnapshot): void {
    this.db
      .prepare(
        `INSERT INTO osint_sources
           (source_id, source_name, source_type, endpoint_type, endpoint, poll_interval_ms,
            rate_limit_ms, timeout_ms, enabled, status, provenance, last_success_at,
            last_error_at, last_error, item_count, source_reliability_score, legal_safety_note, parser_adapter)
         VALUES
           (@sourceId, @sourceName, @sourceType, @endpointType, @endpoint, @pollIntervalMs,
            @rateLimitMs, @timeoutMs, @enabled, @status, @provenance, @lastSuccessAt,
            @lastErrorAt, @lastError, @itemCount, @sourceReliabilityScore, @legalSafetyNote, @parserAdapter)
         ON CONFLICT(source_id) DO UPDATE SET
           source_name=excluded.source_name, source_type=excluded.source_type, endpoint_type=excluded.endpoint_type,
           endpoint=excluded.endpoint, poll_interval_ms=excluded.poll_interval_ms, rate_limit_ms=excluded.rate_limit_ms,
           timeout_ms=excluded.timeout_ms, enabled=excluded.enabled, status=excluded.status, provenance=excluded.provenance,
           last_success_at=excluded.last_success_at, last_error_at=excluded.last_error_at, last_error=excluded.last_error,
           item_count=excluded.item_count, source_reliability_score=excluded.source_reliability_score,
           legal_safety_note=excluded.legal_safety_note, parser_adapter=excluded.parser_adapter`,
      )
      .run({
        ...record,
        enabled: record.enabled ? 1 : 0,
        lastSuccessAt: record.lastSuccessAt ?? null,
        lastErrorAt: record.lastErrorAt ?? null,
        lastError: record.lastError ?? null,
      })
  }

  listWorldIntelEvents(limit = 300): WorldIntelEvent[] {
    const rows = this.db
      .prepare('SELECT * FROM world_intel_events ORDER BY timestamp DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>
    return rows.map(rowToWorldIntelEvent)
  }

  saveWorldIntelEvent(record: WorldIntelEvent): void {
    this.db
      .prepare(
        `INSERT INTO world_intel_events
           (id, timestamp, title, summary, country_codes, region, lat, lon, category, severity, confidence,
            source_id, source_url, provenance, affected_assets, affected_sectors, affected_commodities,
            affected_currencies, extracted_entities, narrative_tags, raw_payload_hash, dedupe_hash, sub_records_json)
         VALUES
           (@id, @timestamp, @title, @summary, @countryCodes, @region, @lat, @lon, @category, @severity, @confidence,
            @sourceId, @sourceUrl, @provenance, @affectedAssets, @affectedSectors, @affectedCommodities,
            @affectedCurrencies, @extractedEntities, @narrativeTags, @rawPayloadHash, @dedupeHash, @subRecordsJson)
         ON CONFLICT(id) DO UPDATE SET
           timestamp=excluded.timestamp, title=excluded.title, summary=excluded.summary, country_codes=excluded.country_codes,
           region=excluded.region, lat=excluded.lat, lon=excluded.lon, category=excluded.category, severity=excluded.severity,
           confidence=excluded.confidence, source_id=excluded.source_id, source_url=excluded.source_url,
           provenance=excluded.provenance, affected_assets=excluded.affected_assets, affected_sectors=excluded.affected_sectors,
           affected_commodities=excluded.affected_commodities, affected_currencies=excluded.affected_currencies,
           extracted_entities=excluded.extracted_entities, narrative_tags=excluded.narrative_tags,
           raw_payload_hash=excluded.raw_payload_hash, dedupe_hash=excluded.dedupe_hash,
           sub_records_json=excluded.sub_records_json`,
      )
      .run({
        id: record.id,
        timestamp: record.timestamp,
        title: record.title,
        summary: record.summary,
        region: record.region,
        category: record.category,
        severity: record.severity,
        confidence: record.confidence,
        sourceId: record.sourceId,
        provenance: record.provenance,
        rawPayloadHash: record.rawPayloadHash,
        dedupeHash: record.dedupeHash,
        countryCodes: JSON.stringify(record.countryCodes),
        lat: record.lat ?? null,
        lon: record.lon ?? null,
        sourceUrl: record.sourceUrl ?? null,
        affectedAssets: JSON.stringify(record.affectedAssets),
        affectedSectors: JSON.stringify(record.affectedSectors),
        affectedCommodities: JSON.stringify(record.affectedCommodities),
        affectedCurrencies: JSON.stringify(record.affectedCurrencies),
        extractedEntities: JSON.stringify(record.extractedEntities),
        narrativeTags: JSON.stringify(record.narrativeTags),
        subRecordsJson: serializeSubRecords(record),
      })
  }

  listSecCompanyFilings(symbol?: string, limit = 120): SecCompanyFiling[] {
    const normalized = symbol?.trim().toUpperCase()
    const rows = normalized
      ? (this.db
          .prepare('SELECT * FROM sec_company_filings WHERE ticker = ? ORDER BY observed_at DESC LIMIT ?')
          .all(normalized, limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM sec_company_filings ORDER BY observed_at DESC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToSecCompanyFiling)
  }

  saveSecCompanyFiling(record: SecCompanyFiling): void {
    this.db
      .prepare(
        `INSERT INTO sec_company_filings
           (id, cik, company_name, ticker, form_type, accession_number, filing_date, report_date,
            accepted_at, observed_at, primary_document, source_url, source_json_url, source_name,
            provenance, confidence, raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @cik, @companyName, @ticker, @formType, @accessionNumber, @filingDate, @reportDate,
            @acceptedAt, @observedAt, @primaryDocument, @sourceUrl, @sourceJsonUrl, @sourceName,
            @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           cik=excluded.cik, company_name=excluded.company_name, ticker=excluded.ticker,
           form_type=excluded.form_type, accession_number=excluded.accession_number,
           filing_date=excluded.filing_date, report_date=excluded.report_date,
           accepted_at=excluded.accepted_at, observed_at=excluded.observed_at,
           primary_document=excluded.primary_document, source_url=excluded.source_url,
           source_json_url=excluded.source_json_url, source_name=excluded.source_name,
           provenance=excluded.provenance, confidence=excluded.confidence,
           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json`,
      )
      .run({
        ...record,
        ticker: record.ticker ?? null,
        reportDate: record.reportDate ?? null,
        acceptedAt: record.acceptedAt ?? null,
        primaryDocument: record.primaryDocument ?? null,
        rawPayloadJson: record.rawPayloadJson ?? '{}',
      })
  }

  listMarketIdentities(symbol?: string, limit = 120): MarketIdentity[] {
    const normalized = symbol?.trim().toUpperCase()
    const rows = normalized
      ? (this.db
          .prepare('SELECT * FROM market_identity_master WHERE ticker = ? OR cik = ? OR cik_padded = ? ORDER BY retrieved_at DESC LIMIT ?')
          .all(normalized, normalized.replace(/\D/g, '').replace(/^0+/, ''), normalized.padStart(10, '0'), limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM market_identity_master ORDER BY ticker ASC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToMarketIdentity)
  }

  saveMarketIdentity(record: MarketIdentity): void {
    this.db
      .prepare(
        `INSERT INTO market_identity_master
           (id, ticker, cik, cik_padded, legal_name, common_name, exchange, sector, industry,
            aliases, source_url, source_name, retrieved_at, stale_at, provenance, confidence,
            raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @ticker, @cik, @cikPadded, @legalName, @commonName, @exchange, @sector, @industry,
            @aliases, @sourceUrl, @sourceName, @retrievedAt, @staleAt, @provenance, @confidence,
            @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           ticker=excluded.ticker, cik=excluded.cik, cik_padded=excluded.cik_padded,
           legal_name=excluded.legal_name, common_name=excluded.common_name,
           exchange=excluded.exchange, sector=excluded.sector, industry=excluded.industry,
           aliases=excluded.aliases, source_url=excluded.source_url, source_name=excluded.source_name,
           retrieved_at=excluded.retrieved_at, stale_at=excluded.stale_at,
           provenance=excluded.provenance, confidence=excluded.confidence,
           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json`,
      )
      .run({
        ...record,
        commonName: record.commonName ?? null,
        exchange: record.exchange ?? null,
        sector: record.sector ?? null,
        industry: record.industry ?? null,
        aliases: JSON.stringify(record.aliases),
        rawPayloadJson: record.rawPayloadJson ?? '{}',
      })
  }

  listFredMacroObservations(seriesId?: string, limit = 120): FredMacroObservation[] {
    const normalized = seriesId?.trim().toUpperCase()
    const rows = normalized
      ? (this.db
          .prepare('SELECT * FROM fred_macro_observations WHERE series_id = ? ORDER BY observation_timestamp DESC LIMIT ?')
          .all(normalized, limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM fred_macro_observations ORDER BY observation_timestamp DESC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToFredMacroObservation)
  }

  saveFredMacroObservation(record: FredMacroObservation): void {
    this.db
      .prepare(
        `INSERT INTO fred_macro_observations
           (id, series_id, title, units, frequency, seasonal_adjustment, observation_date,
            observation_timestamp, value, raw_value, source_url, source_api_url, source_name,
            retrieved_at, provenance, confidence, raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @seriesId, @title, @units, @frequency, @seasonalAdjustment, @observationDate,
            @observationTimestamp, @value, @rawValue, @sourceUrl, @sourceApiUrl, @sourceName,
            @retrievedAt, @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, units=excluded.units, frequency=excluded.frequency,
           seasonal_adjustment=excluded.seasonal_adjustment, observation_date=excluded.observation_date,
           observation_timestamp=excluded.observation_timestamp, value=excluded.value, raw_value=excluded.raw_value,
           source_url=excluded.source_url, source_api_url=excluded.source_api_url, source_name=excluded.source_name,
           retrieved_at=excluded.retrieved_at, provenance=excluded.provenance, confidence=excluded.confidence,
           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json`,
      )
      .run({ ...record, rawPayloadJson: record.rawPayloadJson ?? '{}' })
  }

  listTreasuryFiscalRecords(datasetId?: string, limit = 120): TreasuryFiscalRecord[] {
    const normalized = datasetId?.trim().toLowerCase()
    const rows = normalized
      ? (this.db
          .prepare('SELECT * FROM treasury_fiscal_records WHERE dataset_id = ? ORDER BY record_timestamp DESC LIMIT ?')
          .all(normalized, limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM treasury_fiscal_records ORDER BY record_timestamp DESC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToTreasuryFiscalRecord)
  }

  saveTreasuryFiscalRecord(record: TreasuryFiscalRecord): void {
    this.db
      .prepare(
        `INSERT INTO treasury_fiscal_records
           (id, dataset_id, dataset_name, table_id, table_name, record_date, record_timestamp,
            metric_name, metric_value, raw_value, units, source_url, source_api_url, source_name,
            retrieved_at, provenance, confidence, raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @datasetId, @datasetName, @tableId, @tableName, @recordDate, @recordTimestamp,
            @metricName, @metricValue, @rawValue, @units, @sourceUrl, @sourceApiUrl, @sourceName,
            @retrievedAt, @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           dataset_name=excluded.dataset_name, table_id=excluded.table_id, table_name=excluded.table_name,
           record_date=excluded.record_date, record_timestamp=excluded.record_timestamp,
           metric_name=excluded.metric_name, metric_value=excluded.metric_value, raw_value=excluded.raw_value,
           units=excluded.units, source_url=excluded.source_url, source_api_url=excluded.source_api_url,
           source_name=excluded.source_name, retrieved_at=excluded.retrieved_at, provenance=excluded.provenance,
           confidence=excluded.confidence, raw_payload_hash=excluded.raw_payload_hash,
           raw_payload_json=excluded.raw_payload_json`,
      )
      .run({ ...record, rawPayloadJson: record.rawPayloadJson ?? '{}' })
  }

  listBeaObservations(seriesKey?: string, limit = 120): BeaObservation[] {
    const normalized = seriesKey?.trim().toUpperCase()
    const rows = normalized
      ? (this.db
          .prepare(
            `SELECT * FROM bea_observations
             WHERE dataset_name || ':' || table_name || ':' || line_number = ?
             ORDER BY observation_timestamp DESC LIMIT ?`,
          )
          .all(normalized, limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM bea_observations ORDER BY observation_timestamp DESC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToBeaObservation)
  }

  saveBeaObservation(record: BeaObservation): void {
    this.db
      .prepare(
        `INSERT INTO bea_observations
           (id, dataset_name, table_name, line_number, line_description, series_code, time_period,
            observation_date, observation_timestamp, metric_name, metric_value, raw_value, units,
            unit_multiplier, source_url, source_api_url, source_name, retrieved_at, provenance,
            confidence, raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @datasetName, @tableName, @lineNumber, @lineDescription, @seriesCode, @timePeriod,
            @observationDate, @observationTimestamp, @metricName, @metricValue, @rawValue, @units,
            @unitMultiplier, @sourceUrl, @sourceApiUrl, @sourceName, @retrievedAt, @provenance,
            @confidence, @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           line_description=excluded.line_description, series_code=excluded.series_code,
           time_period=excluded.time_period, observation_date=excluded.observation_date,
           observation_timestamp=excluded.observation_timestamp, metric_name=excluded.metric_name,
           metric_value=excluded.metric_value, raw_value=excluded.raw_value, units=excluded.units,
           unit_multiplier=excluded.unit_multiplier, source_url=excluded.source_url,
           source_api_url=excluded.source_api_url, source_name=excluded.source_name,
           retrieved_at=excluded.retrieved_at, provenance=excluded.provenance,
           confidence=excluded.confidence, raw_payload_hash=excluded.raw_payload_hash,
           raw_payload_json=excluded.raw_payload_json`,
      )
      .run({
        ...record,
        seriesCode: record.seriesCode ?? null,
        unitMultiplier: record.unitMultiplier ?? null,
        rawPayloadJson: record.rawPayloadJson ?? '{}',
      })
  }

  listEiaEnergyRecords(seriesId?: string, limit = 120): EiaEnergyRecord[] {
    const normalized = seriesId?.trim().toUpperCase()
    const rows = normalized
      ? (this.db
          .prepare('SELECT * FROM eia_energy_records WHERE series_id = ? ORDER BY observation_timestamp DESC LIMIT ?')
          .all(normalized, limit) as Array<Record<string, unknown>>)
      : (this.db
          .prepare('SELECT * FROM eia_energy_records ORDER BY observation_timestamp DESC LIMIT ?')
          .all(limit) as Array<Record<string, unknown>>)
    return rows.map(rowToEiaEnergyRecord)
  }

  saveEiaEnergyRecord(record: EiaEnergyRecord): void {
    this.db
      .prepare(
        `INSERT INTO eia_energy_records
           (id, series_id, title, energy_category, commodity, region, country_code,
            period, observation_date, observation_timestamp, value, raw_value, units,
            source_url, source_api_url, source_name, retrieved_at, provenance,
            confidence, raw_payload_hash, raw_payload_json)
         VALUES
           (@id, @seriesId, @title, @energyCategory, @commodity, @region, @countryCode,
            @period, @observationDate, @observationTimestamp, @value, @rawValue, @units,
            @sourceUrl, @sourceApiUrl, @sourceName, @retrievedAt, @provenance,
            @confidence, @rawPayloadHash, @rawPayloadJson)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, energy_category=excluded.energy_category, commodity=excluded.commodity,
           region=excluded.region, country_code=excluded.country_code, period=excluded.period,
           observation_date=excluded.observation_date, observation_timestamp=excluded.observation_timestamp,
           value=excluded.value, raw_value=excluded.raw_value, units=excluded.units,
           source_url=excluded.source_url, source_api_url=excluded.source_api_url,
           source_name=excluded.source_name, retrieved_at=excluded.retrieved_at,
           provenance=excluded.provenance, confidence=excluded.confidence,
           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json`,
      )
      .run({
        ...record,
        region: record.region ?? null,
        countryCode: record.countryCode ?? null,
        rawPayloadJson: record.rawPayloadJson ?? '{}',
      })
  }

  listWorldIntelEmbeddings(limit = 500): WorldIntelEmbeddingRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM world_intel_embeddings ORDER BY timestamp DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>
    return rows.map(rowToEmbedding)
  }

  saveWorldIntelEmbedding(record: WorldIntelEmbeddingRecord): void {
    this.db
      .prepare(
        `INSERT INTO world_intel_embeddings
           (id, event_id, timestamp, summary_hash, embedding_model, embedding_vector,
            source_event_category, provenance, created_at)
         VALUES
           (@id, @eventId, @timestamp, @summaryHash, @embeddingModel, @embeddingVector,
            @sourceEventCategory, @provenance, @createdAt)
         ON CONFLICT(id) DO UPDATE SET
           summary_hash=excluded.summary_hash, embedding_model=excluded.embedding_model,
           embedding_vector=excluded.embedding_vector, source_event_category=excluded.source_event_category,
           provenance=excluded.provenance, created_at=excluded.created_at`,
      )
      .run({ ...record, embeddingVector: JSON.stringify(record.embeddingVector) })
  }

  listUserTheses(limit = 500): UserThesis[] {
    const rows = this.db
      .prepare('SELECT * FROM user_theses ORDER BY timestamp DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>
    return rows.map(rowToUserThesis)
  }

  saveUserThesis(record: UserThesis): void {
    this.db
      .prepare(
        `INSERT INTO user_theses
           (id, timestamp, asset_symbol, thesis_type, trigger_event_id, snapshot_metrics, user_notes,
            target_horizon_days, is_closed, performance_grade, entry_price, current_return,
            one_day_return, seven_day_return, thirty_day_return, created_at, updated_at)
         VALUES
           (@id, @timestamp, @assetSymbol, @thesisType, @triggerEventId, @snapshotMetrics, @userNotes,
            @targetHorizonDays, @isClosed, @performanceGrade, @entryPrice, @currentReturn,
            @oneDayReturn, @sevenDayReturn, @thirtyDayReturn, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           thesis_type=excluded.thesis_type, snapshot_metrics=excluded.snapshot_metrics,
           user_notes=excluded.user_notes, target_horizon_days=excluded.target_horizon_days,
           is_closed=excluded.is_closed, performance_grade=excluded.performance_grade,
           entry_price=excluded.entry_price, current_return=excluded.current_return,
           one_day_return=excluded.one_day_return, seven_day_return=excluded.seven_day_return,
           thirty_day_return=excluded.thirty_day_return, updated_at=excluded.updated_at`,
      )
      .run({
        ...record,
        triggerEventId: record.triggerEventId ?? null,
        snapshotMetrics: JSON.stringify(record.snapshotMetrics),
        isClosed: record.isClosed ? 1 : 0,
        performanceGrade: record.performanceGrade ?? null,
        entryPrice: record.entryPrice ?? null,
        currentReturn: record.currentReturn ?? null,
        oneDayReturn: record.oneDayReturn ?? null,
        sevenDayReturn: record.sevenDayReturn ?? null,
        thirtyDayReturn: record.thirtyDayReturn ?? null,
      })
  }

  listCountryIntelState(): CountryIntelState[] {
    const rows = this.db
      .prepare('SELECT state_json FROM country_intel_state ORDER BY last_updated DESC')
      .all() as Array<Record<string, unknown>>
    return rows.map((row) => parseJsonRecord(row.state_json) as CountryIntelState)
  }

  saveCountryIntelState(record: CountryIntelState): void {
    this.db
      .prepare(
        `INSERT INTO country_intel_state (country_code, state_json, last_updated)
         VALUES (@countryCode, @stateJson, @lastUpdated)
         ON CONFLICT(country_code) DO UPDATE SET
           state_json=excluded.state_json, last_updated=excluded.last_updated`,
      )
      .run({ countryCode: record.countryCode, stateJson: JSON.stringify(record), lastUpdated: record.lastUpdated })
  }

  listAssetIdentities(): AssetIdentity[] {
    const rows = this.db.prepare('SELECT identity_json FROM asset_identity ORDER BY symbol ASC').all() as Array<
      Record<string, unknown>
    >
    return rows.map((row) => parseJsonRecord(row.identity_json) as AssetIdentity)
  }

  saveAssetIdentity(record: AssetIdentity): void {
    this.db
      .prepare(
        `INSERT INTO asset_identity (symbol, identity_json)
         VALUES (@symbol, @identityJson)
         ON CONFLICT(symbol) DO UPDATE SET identity_json=excluded.identity_json`,
      )
      .run({ symbol: record.symbol, identityJson: JSON.stringify(record) })
  }

  listFavorites(): UserFavorite[] {
    const rows = this.db.prepare('SELECT * FROM user_favorites ORDER BY created_at DESC').all() as Array<
      Record<string, unknown>
    >
    return rows.map(rowToFavorite)
  }

  saveFavorite(record: UserFavorite): void {
    this.db
      .prepare(
        `INSERT INTO user_favorites (id, kind, target_id, label, created_at)
         VALUES (@id, @kind, @targetId, @label, @createdAt)
         ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, target_id=excluded.target_id, label=excluded.label`,
      )
      .run(record)
  }

  deleteFavorite(id: string): void {
    this.db.prepare('DELETE FROM user_favorites WHERE id = ?').run(id)
  }

  saveEventAssetLink(record: {
    id: string
    eventId: string
    assetSymbol: string
    relation: string
    confidence: number
    createdAt: number
  }): void {
    this.db
      .prepare(
        `INSERT INTO event_asset_links (id, event_id, asset_symbol, relation, confidence, created_at)
         VALUES (@id, @eventId, @assetSymbol, @relation, @confidence, @createdAt)
         ON CONFLICT(id) DO UPDATE SET relation=excluded.relation, confidence=excluded.confidence, created_at=excluded.created_at`,
      )
      .run(record)
  }

  saveRealtimeFrame(record: RealtimeFrameRecord): void {
    this.db
      .prepare(
        `INSERT INTO realtime_frames (id, sequence, emitted_at, frame_json)
         VALUES (@id, @sequence, @emittedAt, @frameJson)
         ON CONFLICT(id) DO UPDATE SET
           sequence=excluded.sequence, emitted_at=excluded.emitted_at, frame_json=excluded.frame_json`,
      )
      .run({
        id: record.id,
        sequence: record.sequence,
        emittedAt: record.emittedAt,
        frameJson: JSON.stringify(record.frame),
      })
  }

  listRealtimeFrames(from: number, to: number, limit = 2_000): RealtimeFrameRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM realtime_frames WHERE emitted_at BETWEEN ? AND ? ORDER BY emitted_at ASC LIMIT ?')
      .all(from, to, limit) as Array<Record<string, unknown>>
    return rows.map(rowToRealtimeFrame)
  }

  audit(record: SourceAuditRecord): void {
    this.db
      .prepare(
        `INSERT INTO source_audit_log
           (id, event_type, connector_id, severity, message, created_at, metadata)
         VALUES
           (@id, @eventType, @connectorId, @severity, @message, @createdAt, @metadata)`,
      )
      .run({
        ...record,
        connectorId: record.connectorId ?? null,
        metadata: JSON.stringify(record.metadata ?? {}),
      })
  }

  close(): void {
    this.db.close()
  }
}

function rowToBrief(row: Record<string, unknown>): DailyBriefRecord {
  return {
    id: String(row.id),
    date: String(row.date),
    headline: String(row.headline),
    body: String(row.body),
    severity: String(row.severity),
    confidence: Number(row.confidence),
    createdAt: Number(row.created_at),
  }
}

function rowToEmbedding(row: Record<string, unknown>): WorldIntelEmbeddingRecord {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    timestamp: Number(row.timestamp),
    summaryHash: String(row.summary_hash),
    embeddingModel: String(row.embedding_model),
    embeddingVector: parseJsonNumberArray(row.embedding_vector),
    sourceEventCategory: String(row.source_event_category),
    provenance: String(row.provenance),
    createdAt: Number(row.created_at),
  }
}

function rowToUserThesis(row: Record<string, unknown>): UserThesis {
  return {
    id: String(row.id),
    timestamp: Number(row.timestamp),
    assetSymbol: String(row.asset_symbol),
    thesisType: String(row.thesis_type) as UserThesis['thesisType'],
    triggerEventId: row.trigger_event_id === null || row.trigger_event_id === undefined ? null : String(row.trigger_event_id),
    snapshotMetrics: parseJsonRecord(row.snapshot_metrics) as UserThesis['snapshotMetrics'],
    userNotes: String(row.user_notes),
    targetHorizonDays: Number(row.target_horizon_days),
    isClosed: Number(row.is_closed) === 1,
    performanceGrade: row.performance_grade === null || row.performance_grade === undefined ? null : String(row.performance_grade),
    entryPrice: row.entry_price === null || row.entry_price === undefined ? null : Number(row.entry_price),
    currentReturn: row.current_return === null || row.current_return === undefined ? null : Number(row.current_return),
    oneDayReturn: row.one_day_return === null || row.one_day_return === undefined ? null : Number(row.one_day_return),
    sevenDayReturn: row.seven_day_return === null || row.seven_day_return === undefined ? null : Number(row.seven_day_return),
    thirtyDayReturn: row.thirty_day_return === null || row.thirty_day_return === undefined ? null : Number(row.thirty_day_return),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

function parseJsonNumberArray(value: unknown): number[] {
  if (typeof value !== 'string') {
    return []
  }
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : []
  } catch {
    return []
  }
}

function rowToMarketTick(row: Record<string, unknown>): MarketTickRecord {
  return {
    id: String(row.id),
    symbol: String(row.symbol),
    price: Number(row.price),
    volume: Number(row.volume),
    source: String(row.source),
    observedAt: Number(row.observed_at),
    tradeDate: String(row.trade_date),
  }
}

function rowToHeadline(row: Record<string, unknown>): WorldHeadlineRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    source: String(row.source),
    url: String(row.url),
    sector: String(row.sector),
    impact: String(row.impact),
    observedAt: Number(row.observed_at),
  }
}

function rowToOsintSource(row: Record<string, unknown>): OsintSourceSnapshot {
  return {
    sourceId: String(row.source_id),
    sourceName: String(row.source_name),
    sourceType: String(row.source_type),
    endpointType: String(row.endpoint_type) as OsintSourceSnapshot['endpointType'],
    endpoint: String(row.endpoint),
    pollIntervalMs: Number(row.poll_interval_ms),
    rateLimitMs: Number(row.rate_limit_ms),
    timeoutMs: Number(row.timeout_ms),
    enabled: Number(row.enabled) === 1,
    status: String(row.status) as OsintSourceSnapshot['status'],
    provenance: String(row.provenance) as OsintSourceSnapshot['provenance'],
    lastSuccessAt: row.last_success_at === null || row.last_success_at === undefined ? undefined : Number(row.last_success_at),
    lastErrorAt: row.last_error_at === null || row.last_error_at === undefined ? undefined : Number(row.last_error_at),
    lastError: row.last_error === null || row.last_error === undefined ? undefined : String(row.last_error),
    itemCount: Number(row.item_count),
    sourceReliabilityScore: Number(row.source_reliability_score),
    legalSafetyNote: String(row.legal_safety_note),
    parserAdapter: String(row.parser_adapter),
  }
}

type WorldIntelSubRecords = Pick<
  WorldIntelEvent,
  | 'secFiling'
  | 'fredObservation'
  | 'treasuryFiscalRecord'
  | 'beaObservation'
  | 'blsObservation'
  | 'eiaEnergyRecord'
  | 'kevVulnerability'
  | 'nvdCve'
  | 'ghsaAdvisory'
  | 'osvVulnerability'
  | 'cisaAdvisory'
  | 'githubRelease'
  | 'earthquakeEvent'
  | 'weatherAlert'
  | 'patentRecord'
  | 'regulatoryDocument'
  | 'ofacSanctionsRecord'
  | 'congressBillAction'
  | 'gdeltArticle'
  | 'comtradeRecord'
  | 'openAlexWork'
  | 'crossrefWork'
  | 'marketIdentity'
  | 'companyFact'
  | 'form4Transaction'
  | 'form13fHolding'
>

/** Serialize the typed sub-records present on an event; null when there are none. */
export function serializeSubRecords(record: WorldIntelEvent): string | null {
  const sub: WorldIntelSubRecords = {}
  if (record.secFiling) sub.secFiling = record.secFiling
  if (record.fredObservation) sub.fredObservation = record.fredObservation
  if (record.treasuryFiscalRecord) sub.treasuryFiscalRecord = record.treasuryFiscalRecord
  if (record.beaObservation) sub.beaObservation = record.beaObservation
  if (record.blsObservation) sub.blsObservation = record.blsObservation
  if (record.eiaEnergyRecord) sub.eiaEnergyRecord = record.eiaEnergyRecord
  if (record.kevVulnerability) sub.kevVulnerability = record.kevVulnerability
  if (record.nvdCve) sub.nvdCve = record.nvdCve
  if (record.ghsaAdvisory) sub.ghsaAdvisory = record.ghsaAdvisory
  if (record.osvVulnerability) sub.osvVulnerability = record.osvVulnerability
  if (record.cisaAdvisory) sub.cisaAdvisory = record.cisaAdvisory
  if (record.githubRelease) sub.githubRelease = record.githubRelease
  if (record.earthquakeEvent) sub.earthquakeEvent = record.earthquakeEvent
  if (record.weatherAlert) sub.weatherAlert = record.weatherAlert
  if (record.patentRecord) sub.patentRecord = record.patentRecord
  if (record.regulatoryDocument) sub.regulatoryDocument = record.regulatoryDocument
  if (record.ofacSanctionsRecord) sub.ofacSanctionsRecord = record.ofacSanctionsRecord
  if (record.congressBillAction) sub.congressBillAction = record.congressBillAction
  if (record.gdeltArticle) sub.gdeltArticle = record.gdeltArticle
  if (record.comtradeRecord) sub.comtradeRecord = record.comtradeRecord
  if (record.openAlexWork) sub.openAlexWork = record.openAlexWork
  if (record.crossrefWork) sub.crossrefWork = record.crossrefWork
  if (record.marketIdentity) sub.marketIdentity = record.marketIdentity
  if (record.companyFact) sub.companyFact = record.companyFact
  if (record.form4Transaction) sub.form4Transaction = record.form4Transaction
  if (record.form13fHolding) sub.form13fHolding = record.form13fHolding
  return Object.keys(sub).length > 0 ? JSON.stringify(sub) : null
}

/**
 * Parse persisted sub-records, validating each one. Fail-closed: a missing column,
 * unparseable JSON, or a sub-record missing its identity/hash is dropped — never
 * fabricated. Valid sub-records rehydrate fully (source URL, provenance, confidence,
 * rawPayloadJson/Hash all preserved), so there is no silent downgrade.
 */
export function parseSubRecords(value: unknown): WorldIntelSubRecords {
  const out: WorldIntelSubRecords = {}
  if (value === null || value === undefined || value === '') return out
  let parsed: unknown
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value
  } catch {
    return out // malformed JSON -> fail closed
  }
  if (!parsed || typeof parsed !== 'object') return out
  const record = parsed as Record<string, unknown>
  if (isValidSecFiling(record.secFiling)) out.secFiling = record.secFiling as WorldIntelEvent['secFiling']
  if (isValidFred(record.fredObservation)) out.fredObservation = record.fredObservation as WorldIntelEvent['fredObservation']
  if (isValidTreasuryFiscal(record.treasuryFiscalRecord)) out.treasuryFiscalRecord = record.treasuryFiscalRecord as WorldIntelEvent['treasuryFiscalRecord']
  if (isValidBea(record.beaObservation)) out.beaObservation = record.beaObservation as WorldIntelEvent['beaObservation']
  if (isValidBls(record.blsObservation)) out.blsObservation = record.blsObservation as WorldIntelEvent['blsObservation']
  if (isValidEiaEnergy(record.eiaEnergyRecord)) out.eiaEnergyRecord = record.eiaEnergyRecord as WorldIntelEvent['eiaEnergyRecord']
  if (isValidKev(record.kevVulnerability)) out.kevVulnerability = record.kevVulnerability as WorldIntelEvent['kevVulnerability']
  if (isValidNvd(record.nvdCve)) out.nvdCve = record.nvdCve as WorldIntelEvent['nvdCve']
  if (isValidGhsa(record.ghsaAdvisory)) out.ghsaAdvisory = record.ghsaAdvisory as WorldIntelEvent['ghsaAdvisory']
  if (isValidOsv(record.osvVulnerability)) out.osvVulnerability = record.osvVulnerability as WorldIntelEvent['osvVulnerability']
  if (isValidCisa(record.cisaAdvisory)) out.cisaAdvisory = record.cisaAdvisory as WorldIntelEvent['cisaAdvisory']
  if (isValidGithubRelease(record.githubRelease)) out.githubRelease = record.githubRelease as WorldIntelEvent['githubRelease']
  if (isValidEarthquake(record.earthquakeEvent)) out.earthquakeEvent = record.earthquakeEvent as WorldIntelEvent['earthquakeEvent']
  if (isValidWeatherAlert(record.weatherAlert)) out.weatherAlert = record.weatherAlert as WorldIntelEvent['weatherAlert']
  if (isValidPatent(record.patentRecord)) out.patentRecord = record.patentRecord as WorldIntelEvent['patentRecord']
  if (isValidRegulatoryDocument(record.regulatoryDocument)) out.regulatoryDocument = record.regulatoryDocument as WorldIntelEvent['regulatoryDocument']
  if (isValidOfacSanctionsRecord(record.ofacSanctionsRecord)) out.ofacSanctionsRecord = record.ofacSanctionsRecord as WorldIntelEvent['ofacSanctionsRecord']
  if (isValidCongressBillAction(record.congressBillAction)) out.congressBillAction = record.congressBillAction as WorldIntelEvent['congressBillAction']
  if (isValidGdeltArticle(record.gdeltArticle)) out.gdeltArticle = record.gdeltArticle as WorldIntelEvent['gdeltArticle']
  if (isValidComtradeRecord(record.comtradeRecord)) out.comtradeRecord = record.comtradeRecord as WorldIntelEvent['comtradeRecord']
  if (isValidOpenAlexWork(record.openAlexWork)) out.openAlexWork = record.openAlexWork as WorldIntelEvent['openAlexWork']
  if (isValidCrossrefWork(record.crossrefWork)) out.crossrefWork = record.crossrefWork as WorldIntelEvent['crossrefWork']
  if (isValidMarketIdentity(record.marketIdentity)) out.marketIdentity = record.marketIdentity as WorldIntelEvent['marketIdentity']
  if (isValidCompanyFact(record.companyFact)) out.companyFact = record.companyFact as WorldIntelEvent['companyFact']
  if (isValidForm4Transaction(record.form4Transaction)) out.form4Transaction = record.form4Transaction as WorldIntelEvent['form4Transaction']
  if (isValidForm13FHolding(record.form13fHolding)) out.form13fHolding = record.form13fHolding as WorldIntelEvent['form13fHolding']
  return out
}

function hasHash(value: Record<string, unknown>): boolean {
  return typeof value.rawPayloadHash === 'string' && value.rawPayloadHash.length > 0
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isValidKev(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.cveId === 'string' && /^CVE-\d{4}-\d{4,}$/i.test(v.cveId) && hasHash(v))
}

function isValidNvd(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.cveId === 'string' && /^CVE-\d{4}-\d{4,}$/i.test(v.cveId) && hasHash(v))
}

function isValidGhsa(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.ghsaId === 'string' && /^GHSA-/i.test(v.ghsaId) && hasHash(v))
}

function isValidOsv(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.osvId === 'string' && v.osvId.length > 0 && hasHash(v))
}

function isValidCisa(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.advisoryId === 'string' && v.advisoryId.length > 0 && hasHash(v))
}

function isValidGithubRelease(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.repoFullName === 'string' && v.repoFullName.length > 0 && hasHash(v))
}

function isValidEarthquake(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.eventId === 'string' && v.eventId.length > 0 && hasHash(v))
}

function isValidPatent(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.patentId === 'string' && v.patentId.length > 0 && hasHash(v))
}

function isValidRegulatoryDocument(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.documentNumber === 'string' && v.documentNumber.length > 0 && hasHash(v))
}

function isValidOfacSanctionsRecord(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.uid === 'string' && v.uid.length > 0 && hasHash(v))
}

function isValidCongressBillAction(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.congress === 'number' &&
      typeof v.billType === 'string' &&
      typeof v.billNumber === 'string' &&
      v.billType.length > 0 &&
      v.billNumber.length > 0 &&
      hasHash(v),
  )
}

function isValidGdeltArticle(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.url === 'string' && v.url.length > 0 && typeof v.title === 'string' && v.title.length > 0 && hasHash(v))
}

function isValidOpenAlexWork(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.openAlexWorkId === 'string' && v.openAlexWorkId.length > 0 && typeof v.title === 'string' && v.title.length > 0 && hasHash(v))
}

function isValidForm13FHolding(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.filerCik === 'string' &&
      typeof v.accessionNumber === 'string' &&
      v.accessionNumber.length > 0 &&
      typeof v.cusip === 'string' &&
      v.cusip.length > 0 &&
      typeof v.value === 'number' &&
      hasHash(v),
  )
}

function isValidForm4Transaction(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.issuerCik === 'string' &&
      typeof v.accessionNumber === 'string' &&
      v.accessionNumber.length > 0 &&
      typeof v.transactionCode === 'string' &&
      v.transactionCode.length > 0 &&
      typeof v.transactionDate === 'string' &&
      hasHash(v),
  )
}

function isValidCompanyFact(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.cik === 'string' &&
      typeof v.concept === 'string' &&
      v.concept.length > 0 &&
      typeof v.value === 'number' &&
      Number.isFinite(v.value) &&
      typeof v.periodEnd === 'string' &&
      hasHash(v),
  )
}

function isValidCrossrefWork(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.doi === 'string' && /^10\.\d{4,}\//i.test(v.doi) && typeof v.title === 'string' && v.title.length > 0 && hasHash(v))
}

function isValidMarketIdentity(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.ticker === 'string' &&
      v.ticker.length > 0 &&
      typeof v.cik === 'string' &&
      v.cik.length > 0 &&
      typeof v.legalName === 'string' &&
      v.legalName.length > 0 &&
      typeof v.sourceUrl === 'string' &&
      v.sourceUrl === 'https://www.sec.gov/files/company_tickers.json' &&
      hasHash(v),
  )
}

function isValidComtradeRecord(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(
    v &&
      typeof v.reporterCode === 'string' &&
      typeof v.partnerCode === 'string' &&
      typeof v.commodityCode === 'string' &&
      v.commodityCode.length > 0 &&
      typeof v.tradeValue === 'number' &&
      hasHash(v),
  )
}

function isValidWeatherAlert(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.alertId === 'string' && v.alertId.length > 0 && hasHash(v))
}

function isValidSecFiling(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.accessionNumber === 'string' && v.accessionNumber.length > 0 && hasHash(v))
}

function isValidFred(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.seriesId === 'string' && v.seriesId.length > 0 && hasHash(v))
}

function isValidBls(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.seriesId === 'string' && v.seriesId.length > 0 && hasHash(v))
}

function isValidTreasuryFiscal(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.datasetId === 'string' && typeof v.metricName === 'string' && v.datasetId.length > 0 && v.metricName.length > 0 && hasHash(v))
}

function isValidBea(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.datasetName === 'string' && typeof v.tableName === 'string' && v.datasetName.length > 0 && v.tableName.length > 0 && hasHash(v))
}

function isValidEiaEnergy(value: unknown): boolean {
  const v = asRecord(value)
  return Boolean(v && typeof v.seriesId === 'string' && typeof v.commodity === 'string' && v.seriesId.length > 0 && v.commodity.length > 0 && hasHash(v))
}

function rowToWorldIntelEvent(row: Record<string, unknown>): WorldIntelEvent {
  return {
    id: String(row.id),
    timestamp: Number(row.timestamp),
    title: String(row.title),
    summary: String(row.summary),
    countryCodes: parseJsonArray(row.country_codes),
    region: String(row.region),
    lat: row.lat === null || row.lat === undefined ? undefined : Number(row.lat),
    lon: row.lon === null || row.lon === undefined ? undefined : Number(row.lon),
    category: String(row.category),
    severity: String(row.severity) as WorldIntelEvent['severity'],
    confidence: Number(row.confidence),
    sourceId: String(row.source_id),
    sourceUrl: row.source_url === null || row.source_url === undefined ? undefined : String(row.source_url),
    provenance: String(row.provenance) as WorldIntelEvent['provenance'],
    affectedAssets: parseJsonArray(row.affected_assets),
    affectedSectors: parseJsonArray(row.affected_sectors),
    affectedCommodities: parseJsonArray(row.affected_commodities),
    affectedCurrencies: parseJsonArray(row.affected_currencies),
    extractedEntities: parseJsonArray(row.extracted_entities),
    narrativeTags: parseJsonArray(row.narrative_tags),
    rawPayloadHash: String(row.raw_payload_hash),
    dedupeHash: String(row.dedupe_hash),
    // Rehydrate typed sub-records (KEV/NVD/GHSA/SEC/FRED). Validated + fail-closed:
    // malformed persisted sub-records are dropped, never reconstructed.
    ...parseSubRecords(row.sub_records_json),
  }
}

function rowToSecCompanyFiling(row: Record<string, unknown>): SecCompanyFiling {
  return {
    id: String(row.id),
    cik: String(row.cik),
    companyName: String(row.company_name),
    ticker: row.ticker === null || row.ticker === undefined ? undefined : String(row.ticker),
    formType: String(row.form_type),
    accessionNumber: String(row.accession_number),
    filingDate: String(row.filing_date),
    reportDate: row.report_date === null || row.report_date === undefined ? undefined : String(row.report_date),
    acceptedAt: row.accepted_at === null || row.accepted_at === undefined ? undefined : Number(row.accepted_at),
    observedAt: Number(row.observed_at),
    primaryDocument: row.primary_document === null || row.primary_document === undefined ? undefined : String(row.primary_document),
    sourceUrl: String(row.source_url),
    sourceJsonUrl: String(row.source_json_url),
    sourceName: String(row.source_name),
    provenance: String(row.provenance) as SecCompanyFiling['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToMarketIdentity(row: Record<string, unknown>): MarketIdentity {
  return {
    id: String(row.id),
    ticker: String(row.ticker),
    cik: String(row.cik),
    cikPadded: String(row.cik_padded),
    legalName: String(row.legal_name),
    commonName: row.common_name === null || row.common_name === undefined ? undefined : String(row.common_name),
    exchange: row.exchange === null || row.exchange === undefined ? undefined : String(row.exchange),
    sector: row.sector === null || row.sector === undefined ? undefined : String(row.sector),
    industry: row.industry === null || row.industry === undefined ? undefined : String(row.industry),
    aliases: parseJsonArray(row.aliases),
    sourceUrl: String(row.source_url),
    sourceName: String(row.source_name),
    retrievedAt: Number(row.retrieved_at),
    staleAt: Number(row.stale_at),
    provenance: String(row.provenance) as MarketIdentity['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToFredMacroObservation(row: Record<string, unknown>): FredMacroObservation {
  return {
    id: String(row.id),
    seriesId: String(row.series_id),
    title: String(row.title),
    units: String(row.units),
    frequency: String(row.frequency),
    seasonalAdjustment: String(row.seasonal_adjustment),
    observationDate: String(row.observation_date),
    observationTimestamp: Number(row.observation_timestamp),
    value: Number(row.value),
    rawValue: String(row.raw_value),
    sourceUrl: String(row.source_url),
    sourceApiUrl: String(row.source_api_url),
    sourceName: String(row.source_name),
    retrievedAt: Number(row.retrieved_at),
    provenance: String(row.provenance) as FredMacroObservation['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToTreasuryFiscalRecord(row: Record<string, unknown>): TreasuryFiscalRecord {
  return {
    id: String(row.id),
    datasetId: String(row.dataset_id),
    datasetName: String(row.dataset_name),
    tableId: String(row.table_id),
    tableName: String(row.table_name),
    recordDate: String(row.record_date),
    recordTimestamp: Number(row.record_timestamp),
    metricName: String(row.metric_name),
    metricValue: Number(row.metric_value),
    rawValue: String(row.raw_value),
    units: String(row.units),
    sourceUrl: String(row.source_url),
    sourceApiUrl: String(row.source_api_url),
    sourceName: String(row.source_name),
    retrievedAt: Number(row.retrieved_at),
    provenance: String(row.provenance) as TreasuryFiscalRecord['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToBeaObservation(row: Record<string, unknown>): BeaObservation {
  return {
    id: String(row.id),
    datasetName: String(row.dataset_name),
    tableName: String(row.table_name),
    lineNumber: String(row.line_number),
    lineDescription: String(row.line_description),
    seriesCode: row.series_code === null || row.series_code === undefined ? undefined : String(row.series_code),
    timePeriod: String(row.time_period),
    observationDate: String(row.observation_date),
    observationTimestamp: Number(row.observation_timestamp),
    metricName: String(row.metric_name),
    metricValue: Number(row.metric_value),
    rawValue: String(row.raw_value),
    units: String(row.units),
    unitMultiplier: row.unit_multiplier === null || row.unit_multiplier === undefined ? undefined : String(row.unit_multiplier),
    sourceUrl: String(row.source_url),
    sourceApiUrl: String(row.source_api_url),
    sourceName: String(row.source_name),
    retrievedAt: Number(row.retrieved_at),
    provenance: String(row.provenance) as BeaObservation['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToEiaEnergyRecord(row: Record<string, unknown>): EiaEnergyRecord {
  return {
    id: String(row.id),
    seriesId: String(row.series_id),
    title: String(row.title),
    energyCategory: String(row.energy_category),
    commodity: String(row.commodity),
    region: row.region === null || row.region === undefined ? undefined : String(row.region),
    countryCode: row.country_code === null || row.country_code === undefined ? undefined : String(row.country_code),
    period: String(row.period),
    observationDate: String(row.observation_date),
    observationTimestamp: Number(row.observation_timestamp),
    value: Number(row.value),
    rawValue: String(row.raw_value),
    units: String(row.units),
    sourceUrl: String(row.source_url),
    sourceApiUrl: String(row.source_api_url),
    sourceName: String(row.source_name),
    retrievedAt: Number(row.retrieved_at),
    provenance: String(row.provenance) as EiaEnergyRecord['provenance'],
    confidence: Number(row.confidence),
    rawPayloadHash: String(row.raw_payload_hash),
    rawPayloadJson: String(row.raw_payload_json),
  }
}

function rowToFavorite(row: Record<string, unknown>): UserFavorite {
  return {
    id: String(row.id),
    kind: String(row.kind) as UserFavorite['kind'],
    targetId: String(row.target_id),
    label: String(row.label),
    createdAt: Number(row.created_at),
  }
}

function rowToDecision(row: Record<string, unknown>): DecisionRecord {
  return {
    id: String(row.id),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    title: String(row.title),
    thesis: String(row.thesis),
    direction: String(row.direction),
    tickers: parseJsonArray(row.tickers),
    conviction: Number(row.conviction),
    emotionalState: String(row.emotional_state),
    evidenceIds: parseJsonArray(row.evidence_ids),
    context: String(row.context),
    reviewDate: Number(row.review_date),
    status: String(row.status),
    postMortem: String(row.post_mortem),
    outcome: row.outcome === null || row.outcome === undefined ? null : String(row.outcome),
  }
}

function rowToRealtimeFrame(row: Record<string, unknown>): RealtimeFrameRecord {
  return {
    id: String(row.id),
    sequence: Number(row.sequence),
    emittedAt: Number(row.emitted_at),
    frame: parseFrame(row.frame_json),
  }
}

function parseFrame(value: unknown): LiveDataFrame {
  if (typeof value !== 'string') {
    throw new Error('Invalid realtime frame payload')
  }
  return JSON.parse(value) as LiveDataFrame
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string') {
    return []
  }
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

function parseJsonRecord(value: unknown): unknown {
  if (typeof value !== 'string') {
    return {}
  }
  try {
    return JSON.parse(value) as unknown
  } catch {
    return {}
  }
}

// --- JSON file fallback implementation -------------------------------------

type JsonShape = {
  briefs: DailyBriefRecord[]
  headlines: WorldHeadlineRecord[]
  decisions: DecisionRecord[]
  marketTicks: MarketTickRecord[]
  attentionBatches: SocialAttentionBatchRecord[]
  entityEdges: EntityEdgeRecord[]
  signalEvents: SignalEventRecord[]
  osintSources: OsintSourceSnapshot[]
  worldIntelEvents: WorldIntelEvent[]
  secCompanyFilings: SecCompanyFiling[]
  marketIdentities: MarketIdentity[]
  fredMacroObservations: FredMacroObservation[]
  treasuryFiscalRecords: TreasuryFiscalRecord[]
  beaObservations: BeaObservation[]
  eiaEnergyRecords: EiaEnergyRecord[]
  worldIntelEmbeddings: WorldIntelEmbeddingRecord[]
  userTheses: UserThesis[]
  countryIntelState: CountryIntelState[]
  assetIdentities: AssetIdentity[]
  favorites: UserFavorite[]
  eventAssetLinks: Array<{ id: string; eventId: string; assetSymbol: string; relation: string; confidence: number; createdAt: number }>
  realtimeFrames: RealtimeFrameRecord[]
  auditLog: SourceAuditRecord[]
}

class JsonStore implements IntelPersistence {
  readonly mode: PersistenceMode = 'json-fallback'
  private readonly file: string
  private data: JsonShape

  constructor(dataDir: string) {
    this.file = join(dataDir, 'atlasz-intel.fallback.json')
    this.data = this.read()
  }

  listBriefs(): DailyBriefRecord[] {
    return [...this.data.briefs].sort((a, b) => b.createdAt - a.createdAt)
  }

  saveBrief(record: DailyBriefRecord): void {
    this.data.briefs = upsert(this.data.briefs, record)
    this.flush()
  }

  listHeadlines(limit = 200): WorldHeadlineRecord[] {
    return [...this.data.headlines].sort((a, b) => b.observedAt - a.observedAt).slice(0, limit)
  }

  saveHeadline(record: WorldHeadlineRecord): void {
    this.data.headlines = upsert(this.data.headlines, record)
    this.flush()
  }

  listDecisions(): DecisionRecord[] {
    return [...this.data.decisions].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getDecision(id: string): DecisionRecord | null {
    return this.data.decisions.find((entry) => entry.id === id) ?? null
  }

  saveDecision(record: DecisionRecord): void {
    this.data.decisions = upsert(this.data.decisions, record)
    this.flush()
  }

  deleteDecision(id: string): void {
    this.data.decisions = this.data.decisions.filter((entry) => entry.id !== id)
    this.flush()
  }

  decisionsDueForReview(now: number): DecisionRecord[] {
    return this.data.decisions
      .filter((entry) => entry.status === 'open' && entry.reviewDate <= now)
      .sort((a, b) => a.reviewDate - b.reviewDate)
  }

  saveMarketTick(record: MarketTickRecord): void {
    this.data.marketTicks = capByTime(upsert(this.data.marketTicks, record), 'observedAt', 25_000)
    this.flush()
  }

  listMarketTicks(symbol: string, limit = 200): MarketTickRecord[] {
    return [...this.data.marketTicks]
      .filter((record) => record.symbol === symbol)
      .sort((a, b) => b.observedAt - a.observedAt)
      .slice(0, limit)
  }

  saveAttentionBatch(record: SocialAttentionBatchRecord): void {
    this.data.attentionBatches = capByTime(upsert(this.data.attentionBatches, record), 'observedAt', 25_000)
    this.flush()
  }

  saveEntityEdge(record: EntityEdgeRecord): void {
    this.data.entityEdges = upsert(this.data.entityEdges, record)
    this.flush()
  }

  saveSignalEvent(record: SignalEventRecord): void {
    this.data.signalEvents = capByTime(upsert(this.data.signalEvents, record), 'createdAt', 10_000)
    this.flush()
  }

  listOsintSources(): OsintSourceSnapshot[] {
    return [...this.data.osintSources].sort((a, b) => a.sourceName.localeCompare(b.sourceName))
  }

  saveOsintSource(record: OsintSourceSnapshot): void {
    this.data.osintSources = upsertBy(this.data.osintSources, record, 'sourceId')
    this.flush()
  }

  listWorldIntelEvents(limit = 300): WorldIntelEvent[] {
    return [...this.data.worldIntelEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  saveWorldIntelEvent(record: WorldIntelEvent): void {
    this.data.worldIntelEvents = capByTime(upsert(this.data.worldIntelEvents, record), 'timestamp', 10_000)
    this.flush()
  }

  listSecCompanyFilings(symbol?: string, limit = 120): SecCompanyFiling[] {
    const normalized = symbol?.trim().toUpperCase()
    return [...this.data.secCompanyFilings]
      .filter((record) => !normalized || record.ticker === normalized)
      .sort((a, b) => b.observedAt - a.observedAt)
      .slice(0, limit)
  }

  saveSecCompanyFiling(record: SecCompanyFiling): void {
    this.data.secCompanyFilings = capByTime(upsert(this.data.secCompanyFilings, record), 'observedAt', 10_000)
    this.flush()
  }

  listMarketIdentities(symbol?: string, limit = 120): MarketIdentity[] {
    const normalized = symbol?.trim().toUpperCase()
    const normalizedCik = normalized?.replace(/\D/g, '').replace(/^0+/, '')
    return [...this.data.marketIdentities]
      .filter((record) => !normalized || record.ticker === normalized || record.cik === normalizedCik || record.cikPadded === normalized)
      .sort((a, b) => a.ticker.localeCompare(b.ticker))
      .slice(0, limit)
  }

  saveMarketIdentity(record: MarketIdentity): void {
    this.data.marketIdentities = capByTime(upsertBy(this.data.marketIdentities, record, 'id'), 'retrievedAt', 25_000)
    this.flush()
  }

  listFredMacroObservations(seriesId?: string, limit = 120): FredMacroObservation[] {
    const normalized = seriesId?.trim().toUpperCase()
    return [...this.data.fredMacroObservations]
      .filter((record) => !normalized || record.seriesId === normalized)
      .sort((a, b) => b.observationTimestamp - a.observationTimestamp)
      .slice(0, limit)
  }

  saveFredMacroObservation(record: FredMacroObservation): void {
    this.data.fredMacroObservations = capByTime(upsert(this.data.fredMacroObservations, record), 'observationTimestamp', 10_000)
    this.flush()
  }

  listTreasuryFiscalRecords(datasetId?: string, limit = 120): TreasuryFiscalRecord[] {
    const normalized = datasetId?.trim().toLowerCase()
    return [...this.data.treasuryFiscalRecords]
      .filter((record) => !normalized || record.datasetId === normalized)
      .sort((a, b) => b.recordTimestamp - a.recordTimestamp)
      .slice(0, limit)
  }

  saveTreasuryFiscalRecord(record: TreasuryFiscalRecord): void {
    this.data.treasuryFiscalRecords = capByTime(upsert(this.data.treasuryFiscalRecords, record), 'recordTimestamp', 10_000)
    this.flush()
  }

  listBeaObservations(seriesKey?: string, limit = 120): BeaObservation[] {
    const normalized = seriesKey?.trim().toUpperCase()
    return [...this.data.beaObservations]
      .filter((record) => !normalized || `${record.datasetName}:${record.tableName}:${record.lineNumber}`.toUpperCase() === normalized)
      .sort((a, b) => b.observationTimestamp - a.observationTimestamp)
      .slice(0, limit)
  }

  saveBeaObservation(record: BeaObservation): void {
    this.data.beaObservations = capByTime(upsert(this.data.beaObservations, record), 'observationTimestamp', 10_000)
    this.flush()
  }

  listEiaEnergyRecords(seriesId?: string, limit = 120): EiaEnergyRecord[] {
    const normalized = seriesId?.trim().toUpperCase()
    return [...this.data.eiaEnergyRecords]
      .filter((record) => !normalized || record.seriesId === normalized)
      .sort((a, b) => b.observationTimestamp - a.observationTimestamp)
      .slice(0, limit)
  }

  saveEiaEnergyRecord(record: EiaEnergyRecord): void {
    this.data.eiaEnergyRecords = capByTime(upsert(this.data.eiaEnergyRecords, record), 'observationTimestamp', 10_000)
    this.flush()
  }

  listWorldIntelEmbeddings(limit = 500): WorldIntelEmbeddingRecord[] {
    return [...this.data.worldIntelEmbeddings].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  saveWorldIntelEmbedding(record: WorldIntelEmbeddingRecord): void {
    this.data.worldIntelEmbeddings = capByTime(upsert(this.data.worldIntelEmbeddings, record), 'timestamp', 10_000)
    this.flush()
  }

  listUserTheses(limit = 500): UserThesis[] {
    return [...this.data.userTheses].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  saveUserThesis(record: UserThesis): void {
    this.data.userTheses = capByTime(upsert(this.data.userTheses, record), 'timestamp', 10_000)
    this.flush()
  }

  listCountryIntelState(): CountryIntelState[] {
    return [...this.data.countryIntelState].sort((a, b) => b.riskScore - a.riskScore)
  }

  saveCountryIntelState(record: CountryIntelState): void {
    this.data.countryIntelState = upsertBy(this.data.countryIntelState, record, 'countryCode')
    this.flush()
  }

  listAssetIdentities(): AssetIdentity[] {
    return [...this.data.assetIdentities].sort((a, b) => a.symbol.localeCompare(b.symbol))
  }

  saveAssetIdentity(record: AssetIdentity): void {
    this.data.assetIdentities = upsertBy(this.data.assetIdentities, record, 'symbol')
    this.flush()
  }

  listFavorites(): UserFavorite[] {
    return [...this.data.favorites].sort((a, b) => b.createdAt - a.createdAt)
  }

  saveFavorite(record: UserFavorite): void {
    this.data.favorites = upsert(this.data.favorites, record)
    this.flush()
  }

  deleteFavorite(id: string): void {
    this.data.favorites = this.data.favorites.filter((favorite) => favorite.id !== id)
    this.flush()
  }

  saveEventAssetLink(record: {
    id: string
    eventId: string
    assetSymbol: string
    relation: string
    confidence: number
    createdAt: number
  }): void {
    this.data.eventAssetLinks = capByTime(upsert(this.data.eventAssetLinks, record), 'createdAt', 25_000)
    this.flush()
  }

  saveRealtimeFrame(record: RealtimeFrameRecord): void {
    this.data.realtimeFrames = capByTime(upsert(this.data.realtimeFrames, record), 'emittedAt', 10_000)
    this.flush()
  }

  listRealtimeFrames(from: number, to: number, limit = 2_000): RealtimeFrameRecord[] {
    return [...this.data.realtimeFrames]
      .filter((record) => record.emittedAt >= from && record.emittedAt <= to)
      .sort((a, b) => a.emittedAt - b.emittedAt)
      .slice(0, limit)
  }

  audit(record: SourceAuditRecord): void {
    this.data.auditLog = capByTime([...this.data.auditLog, record], 'createdAt', 10_000)
    this.flush()
  }

  close(): void {
    this.flush()
  }

  private read(): JsonShape {
    if (!existsSync(this.file)) {
      return emptyJsonShape()
    }
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<JsonShape>
      return {
        briefs: parsed.briefs ?? [],
        headlines: parsed.headlines ?? [],
        decisions: parsed.decisions ?? [],
        marketTicks: parsed.marketTicks ?? [],
        attentionBatches: parsed.attentionBatches ?? [],
        entityEdges: parsed.entityEdges ?? [],
        signalEvents: parsed.signalEvents ?? [],
        osintSources: parsed.osintSources ?? [],
        worldIntelEvents: parsed.worldIntelEvents ?? [],
        secCompanyFilings: parsed.secCompanyFilings ?? [],
        marketIdentities: parsed.marketIdentities ?? [],
        fredMacroObservations: parsed.fredMacroObservations ?? [],
        treasuryFiscalRecords: parsed.treasuryFiscalRecords ?? [],
        beaObservations: parsed.beaObservations ?? [],
        eiaEnergyRecords: parsed.eiaEnergyRecords ?? [],
        worldIntelEmbeddings: parsed.worldIntelEmbeddings ?? [],
        userTheses: parsed.userTheses ?? [],
        countryIntelState: parsed.countryIntelState ?? [],
        assetIdentities: parsed.assetIdentities ?? [],
        favorites: parsed.favorites ?? [],
        eventAssetLinks: parsed.eventAssetLinks ?? [],
        realtimeFrames: parsed.realtimeFrames ?? [],
        auditLog: parsed.auditLog ?? [],
      }
    } catch {
      return emptyJsonShape()
    }
  }

  private flush(): void {
    writeFileSync(this.file, JSON.stringify(this.data), 'utf8')
  }
}

function upsert<T extends { id: string }>(list: T[], record: T): T[] {
  const index = list.findIndex((item) => item.id === record.id)
  if (index === -1) {
    return [...list, record]
  }
  const next = [...list]
  next[index] = record
  return next
}

function upsertBy<T, K extends keyof T>(list: T[], record: T, key: K): T[] {
  const index = list.findIndex((item) => item[key] === record[key])
  if (index === -1) {
    return [...list, record]
  }
  const next = [...list]
  next[index] = record
  return next
}

function emptyJsonShape(): JsonShape {
  return {
    briefs: [],
    headlines: [],
    decisions: [],
    marketTicks: [],
    attentionBatches: [],
    entityEdges: [],
    signalEvents: [],
    osintSources: [],
    worldIntelEvents: [],
    secCompanyFilings: [],
    marketIdentities: [],
    fredMacroObservations: [],
    treasuryFiscalRecords: [],
    beaObservations: [],
    eiaEnergyRecords: [],
    worldIntelEmbeddings: [],
    userTheses: [],
    countryIntelState: [],
    assetIdentities: [],
    favorites: [],
    eventAssetLinks: [],
    realtimeFrames: [],
    auditLog: [],
  }
}

function capByTime<T>(list: T[], key: keyof T, max: number): T[] {
  if (list.length <= max) {
    return list
  }
  return [...list]
    .sort((a, b) => Number(b[key]) - Number(a[key]))
    .slice(0, max)
    .sort((a, b) => Number(a[key]) - Number(b[key]))
}
