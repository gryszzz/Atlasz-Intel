/**
 * Renderer-side client for the Decision Layer and local persistence.
 *
 * Local-first by design: when running in the Electron desktop shell it talks to
 * the SQLite/WAL store over the preload bridge; in the browser preview it
 * transparently falls back to localStorage, so the journal works everywhere
 * without any backend. The UI imports this and never touches `window` directly.
 */
import type {
  DecisionJournalDraft,
  DecisionJournalEntry,
  DecisionStatus,
} from './types/decision'

type DesktopDb = {
  status: () => Promise<{ mode: 'node:sqlite' | 'better-sqlite3' | 'json-fallback' }>
  listDecisions: () => Promise<DecisionJournalEntry[]>
  getDecision: (id: string) => Promise<DecisionJournalEntry | null>
  saveDecision: (record: DecisionJournalEntry) => Promise<{ ok: boolean }>
  deleteDecision: (id: string) => Promise<{ ok: boolean }>
  decisionsDueForReview: (now: number) => Promise<DecisionJournalEntry[]>
}

type DesktopBridgeWithDb = {
  db?: DesktopDb
}

const STORAGE_KEY = 'atlasz:intel:decision-journal'

function desktopDb(): DesktopDb | null {
  if (typeof window === 'undefined') {
    return null
  }
  const bridge = (window as unknown as { atlaszDesktop?: DesktopBridgeWithDb }).atlaszDesktop
  return bridge?.db ?? null
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `dec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readLocal(): DecisionJournalEntry[] {
  if (typeof window === 'undefined') {
    return []
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DecisionJournalEntry[]) : []
  } catch {
    return []
  }
}

function writeLocal(entries: DecisionJournalEntry[]): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

/** Build a complete entry from a draft, filling ids/timestamps/defaults. */
export function entryFromDraft(draft: DecisionJournalDraft): DecisionJournalEntry {
  const now = Date.now()
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    title: draft.title,
    thesis: draft.thesis,
    direction: draft.direction,
    tickers: draft.tickers,
    conviction: clampConviction(draft.conviction),
    emotionalState: draft.emotionalState,
    evidenceIds: draft.evidenceIds,
    context: draft.context ?? '',
    reviewDate: draft.reviewDate,
    status: 'open',
    postMortem: '',
  }
}

function clampConviction(value: number): number {
  if (!Number.isFinite(value)) {
    return 50
  }
  return Math.min(100, Math.max(0, Math.round(value)))
}

export type PersistenceInfo = { mode: 'node:sqlite' | 'better-sqlite3' | 'json-fallback' | 'localstorage' }

export const decisionJournal = {
  async status(): Promise<PersistenceInfo> {
    const db = desktopDb()
    if (db) {
      try {
        return await db.status()
      } catch {
        return { mode: 'localstorage' }
      }
    }
    return { mode: 'localstorage' }
  },

  async list(): Promise<DecisionJournalEntry[]> {
    const db = desktopDb()
    if (db) {
      return db.listDecisions()
    }
    return [...readLocal()].sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async get(id: string): Promise<DecisionJournalEntry | null> {
    const db = desktopDb()
    if (db) {
      return db.getDecision(id)
    }
    return readLocal().find((entry) => entry.id === id) ?? null
  },

  async create(draft: DecisionJournalDraft): Promise<DecisionJournalEntry> {
    const entry = entryFromDraft(draft)
    await this.save(entry)
    return entry
  },

  async save(entry: DecisionJournalEntry): Promise<void> {
    const next = { ...entry, updatedAt: Date.now() }
    const db = desktopDb()
    if (db) {
      await db.saveDecision(next)
      return
    }
    const entries = readLocal()
    const index = entries.findIndex((item) => item.id === next.id)
    if (index === -1) {
      entries.push(next)
    } else {
      entries[index] = next
    }
    writeLocal(entries)
  },

  async review(
    id: string,
    update: { status: DecisionStatus; postMortem: string; outcome?: DecisionJournalEntry['outcome'] },
  ): Promise<DecisionJournalEntry | null> {
    const existing = await this.get(id)
    if (!existing) {
      return null
    }
    const reviewed: DecisionJournalEntry = {
      ...existing,
      status: update.status,
      postMortem: update.postMortem,
      outcome: update.outcome,
      updatedAt: Date.now(),
    }
    await this.save(reviewed)
    return reviewed
  },

  async remove(id: string): Promise<void> {
    const db = desktopDb()
    if (db) {
      await db.deleteDecision(id)
      return
    }
    writeLocal(readLocal().filter((entry) => entry.id !== id))
  },

  async dueForReview(now: number = Date.now()): Promise<DecisionJournalEntry[]> {
    const db = desktopDb()
    if (db) {
      return db.decisionsDueForReview(now)
    }
    return readLocal()
      .filter((entry) => entry.status === 'open' && entry.reviewDate <= now)
      .sort((a, b) => a.reviewDate - b.reviewDate)
  },
}
