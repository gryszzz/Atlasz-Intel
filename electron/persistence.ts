/**
 * Local-first persistence for Atlasz Intel (Electron main process).
 *
 * Primary store is SQLite via Node's built-in `node:sqlite` DatabaseSync with
 * Write-Ahead Logging enabled,
 * which gives durable, low-latency, concurrent-read storage for daily briefs,
 * world headlines, and the personal Decision Journal.
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

export type SourceAuditEventType =
  | 'connector_started'
  | 'connector_failed'
  | 'reconnect_attempted'
  | 'reconnect_succeeded'
  | 'frame_published'
  | 'persistence_failed'
  | 'graph_traversal_triggered'
  | 'signal_generated'

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
  saveAttentionBatch(record: SocialAttentionBatchRecord): void
  saveEntityEdge(record: EntityEdgeRecord): void
  saveSignalEvent(record: SignalEventRecord): void
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
CREATE INDEX IF NOT EXISTS idx_decision_review ON decision_journal(status, review_date);
CREATE INDEX IF NOT EXISTS idx_headline_observed ON world_headlines(observed_at);
CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_time ON market_ticks_daily(symbol, observed_at);
CREATE INDEX IF NOT EXISTS idx_attention_target_time ON social_attention_batches(target, observed_at);
CREATE INDEX IF NOT EXISTS idx_signal_created ON signal_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON source_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_frames_window ON realtime_frames(emitted_at);
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

// --- JSON file fallback implementation -------------------------------------

type JsonShape = {
  briefs: DailyBriefRecord[]
  headlines: WorldHeadlineRecord[]
  decisions: DecisionRecord[]
  marketTicks: MarketTickRecord[]
  attentionBatches: SocialAttentionBatchRecord[]
  entityEdges: EntityEdgeRecord[]
  signalEvents: SignalEventRecord[]
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

function emptyJsonShape(): JsonShape {
  return {
    briefs: [],
    headlines: [],
    decisions: [],
    marketTicks: [],
    attentionBatches: [],
    entityEdges: [],
    signalEvents: [],
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
