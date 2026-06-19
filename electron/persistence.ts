/**
 * Local-first persistence for Atlasz Intel (Electron main process).
 *
 * Primary store is SQLite via better-sqlite3 with Write-Ahead Logging enabled,
 * which gives durable, low-latency, concurrent-read storage for daily briefs,
 * world headlines, and the personal Decision Journal.
 *
 * better-sqlite3 is a native module. Rather than hard-failing when it is absent
 * or built for the wrong ABI, this layer transparently falls back to a JSON
 * file store exposing the identical interface, so the app always runs locally.
 * The active mode is reported back to the UI (see LiveEngineStatus.sqliteMode).
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type PersistenceMode = 'wal' | 'jsonl-fallback'

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
  close(): void
}

// --- minimal better-sqlite3 surface (no @types dependency required) ---------

type SqliteStatement = {
  run: (...params: unknown[]) => unknown
  get: (...params: unknown[]) => unknown
  all: (...params: unknown[]) => unknown[]
}

type SqliteDatabase = {
  pragma: (source: string) => unknown
  exec: (source: string) => unknown
  prepare: (source: string) => SqliteStatement
  close: () => void
}

type SqliteConstructor = new (filename: string, options?: unknown) => SqliteDatabase

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
CREATE INDEX IF NOT EXISTS idx_decision_review ON decision_journal(status, review_date);
CREATE INDEX IF NOT EXISTS idx_headline_observed ON world_headlines(observed_at);
`

/**
 * Create the persistence layer, preferring SQLite+WAL and falling back to a
 * JSON file store. Never throws on a missing native module.
 */
export function createPersistence(dataDir: string): IntelPersistence {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  try {
    const require = createRequire(import.meta.url)
    const Database = require('better-sqlite3') as SqliteConstructor
    const db = new Database(join(dataDir, 'atlasz-intel.db'))
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA)
    return new SqliteStore(db)
  } catch (error) {
    console.warn(
      '[atlasz] better-sqlite3 unavailable, using JSON fallback store. ' +
        'Run `npm install better-sqlite3` and rebuild for Electron to enable WAL persistence. Reason:',
      error instanceof Error ? error.message : error,
    )
    return new JsonStore(dataDir)
  }
}

// --- SQLite (WAL) implementation -------------------------------------------

class SqliteStore implements IntelPersistence {
  readonly mode: PersistenceMode = 'wal'
  private readonly db: SqliteDatabase

  constructor(db: SqliteDatabase) {
    this.db = db
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
}

class JsonStore implements IntelPersistence {
  readonly mode: PersistenceMode = 'jsonl-fallback'
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

  close(): void {
    this.flush()
  }

  private read(): JsonShape {
    if (!existsSync(this.file)) {
      return { briefs: [], headlines: [], decisions: [] }
    }
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<JsonShape>
      return {
        briefs: parsed.briefs ?? [],
        headlines: parsed.headlines ?? [],
        decisions: parsed.decisions ?? [],
      }
    } catch {
      return { briefs: [], headlines: [], decisions: [] }
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
