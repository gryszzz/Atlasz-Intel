/**
 * Decision Journal — the discipline / edge layer.
 *
 * A serious thesis + review workflow (not a diary gimmick): every entry records
 * the thesis, the evidence it rests on, conviction, the emotional state it was
 * made in, and a scheduled review for an honest post-mortem. Persists through
 * the renderer client (desktop SQLite store when present, localStorage in the
 * browser preview).
 */
import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, BookOpen, Database, Plus, ShieldCheck } from 'lucide-react'
import { decisionJournal, type PersistenceInfo } from './intelClient'
import {
  decisionStatusLabels,
  emotionalStateLabels,
  isDueForReview,
  type DecisionDirection,
  type DecisionJournalEntry,
  type DecisionStatus,
  type EmotionalState,
} from './types/decision'
import { radarEvents, topSignals } from './data/intel'
import './DecisionJournal.css'

const DIRECTIONS: DecisionDirection[] = ['long', 'short', 'neutral', 'avoid', 'watch']
const EMOTIONS = Object.keys(emotionalStateLabels) as EmotionalState[]
const REVIEW_OUTCOMES: NonNullable<DecisionJournalEntry['outcome']>[] = [
  'correct',
  'partly-correct',
  'incorrect',
  'inconclusive',
]

const evidenceOptions = [
  ...topSignals.map((signal) => ({ id: signal.id, label: signal.title })),
  ...radarEvents.map((event) => ({ id: event.id, label: event.title })),
]

function persistenceLabel(mode: PersistenceInfo['mode']): string {
  if (mode === 'node:sqlite' || mode === 'better-sqlite3') return 'Local SQLite · WAL'
  if (mode === 'json-fallback') return 'Local file store'
  return 'Browser localStorage'
}

function toDateInput(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function defaultReviewDate(): string {
  return toDateInput(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

export function DecisionJournal() {
  const [entries, setEntries] = useState<DecisionJournalEntry[]>([])
  const [mode, setMode] = useState<PersistenceInfo['mode']>('localstorage')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null)

  async function refresh() {
    const [list, status] = await Promise.all([decisionJournal.list(), decisionJournal.status()])
    setEntries(list)
    setMode(status.mode)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([decisionJournal.list(), decisionJournal.status()])
      .then(([list, status]) => {
        if (cancelled) {
          return
        }
        setEntries(list)
        setMode(status.mode)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const dueCount = useMemo(() => entries.filter((entry) => isDueForReview(entry)).length, [entries])

  return (
    <div className="decision-journal">
      <div className="dj-toolbar">
        <div className="dj-mode">
          <Database size={13} />
          <span>{persistenceLabel(mode)}</span>
        </div>
        {dueCount > 0 && (
          <div className="dj-due-pill">
            <AlarmClock size={13} />
            {dueCount} due for review
          </div>
        )}
        <button className="dj-new" type="button" onClick={() => setShowForm((value) => !value)}>
          <Plus size={15} />
          {showForm ? 'Close' : 'New thesis'}
        </button>
      </div>

      {showForm && (
        <DecisionForm
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false)
            await refresh()
          }}
        />
      )}

      {loading ? (
        <div className="dj-empty">Loading decision journal…</div>
      ) : entries.length === 0 ? (
        <div className="dj-empty">
          <BookOpen size={18} />
          <p>No theses yet. Record your first one to start tracking reasoning, evidence, and outcomes over time.</p>
        </div>
      ) : (
        <div className="dj-list">
          {entries.map((entry) => (
            <DecisionCard
              key={entry.id}
              entry={entry}
              reviewing={reviewId === entry.id}
              onToggleReview={() => setReviewId((current) => (current === entry.id ? null : entry.id))}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DecisionCard({
  entry,
  reviewing,
  onToggleReview,
  onChanged,
}: {
  entry: DecisionJournalEntry
  reviewing: boolean
  onToggleReview: () => void
  onChanged: () => Promise<void>
}) {
  const due = isDueForReview(entry)
  return (
    <article className={due ? 'dj-card due' : 'dj-card'}>
      <header>
        <span className={`dj-dir dj-dir-${entry.direction}`}>{entry.direction}</span>
        <strong>{entry.title}</strong>
        <span className={`dj-status dj-status-${entry.status}`}>{decisionStatusLabels[entry.status]}</span>
      </header>
      <p className="dj-thesis">{entry.thesis}</p>
      <div className="dj-meta">
        <span>Conviction {entry.conviction}%</span>
        <span>{emotionalStateLabels[entry.emotionalState]}</span>
        <span>Review {toDateInput(entry.reviewDate)}</span>
        {entry.tickers.length > 0 && <span>{entry.tickers.join(', ')}</span>}
      </div>
      {entry.evidenceIds.length > 0 && (
        <div className="dj-evidence">
          <span>Evidence</span>
          <div className="dj-chips">
            {entry.evidenceIds.map((id) => (
              <span key={id}>{id}</span>
            ))}
          </div>
        </div>
      )}
      {entry.postMortem && (
        <div className="dj-postmortem">
          <span>Post-mortem{entry.outcome ? ` · ${entry.outcome}` : ''}</span>
          <p>{entry.postMortem}</p>
        </div>
      )}
      <footer>
        <button type="button" onClick={onToggleReview}>
          <ShieldCheck size={13} />
          {reviewing ? 'Cancel' : entry.status === 'open' ? 'Review thesis' : 'Update review'}
        </button>
        <button
          type="button"
          className="dj-delete"
          onClick={async () => {
            await decisionJournal.remove(entry.id)
            await onChanged()
          }}
        >
          Delete
        </button>
      </footer>
      {reviewing && <ReviewForm entry={entry} onDone={onChanged} />}
    </article>
  )
}

function ReviewForm({ entry, onDone }: { entry: DecisionJournalEntry; onDone: () => Promise<void> }) {
  const [status, setStatus] = useState<DecisionStatus>(entry.status === 'open' ? 'validated' : entry.status)
  const [outcome, setOutcome] = useState<DecisionJournalEntry['outcome']>(entry.outcome ?? 'inconclusive')
  const [postMortem, setPostMortem] = useState(entry.postMortem)

  return (
    <form
      className="dj-review"
      onSubmit={async (event) => {
        event.preventDefault()
        await decisionJournal.review(entry.id, { status, postMortem, outcome })
        await onDone()
      }}
    >
      <div className="dj-field-row">
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as DecisionStatus)}>
            {(['validated', 'invalidated', 'closed', 'reviewing'] as DecisionStatus[]).map((value) => (
              <option key={value} value={value}>
                {decisionStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Outcome</span>
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as DecisionJournalEntry['outcome'])}
          >
            {REVIEW_OUTCOMES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Post-mortem</span>
        <textarea
          value={postMortem}
          placeholder="What actually happened, and what does it say about the thesis and the evidence?"
          onChange={(event) => setPostMortem(event.target.value)}
        />
      </label>
      <button type="submit" className="dj-save">
        Save review
      </button>
    </form>
  )
}

function DecisionForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [thesis, setThesis] = useState('')
  const [direction, setDirection] = useState<DecisionDirection>('watch')
  const [tickers, setTickers] = useState('')
  const [conviction, setConviction] = useState(60)
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('calm')
  const [evidenceIds, setEvidenceIds] = useState<string[]>([])
  const [reviewDate, setReviewDate] = useState(defaultReviewDate())
  const [saving, setSaving] = useState(false)

  const canSave = title.trim() !== '' && thesis.trim() !== ''

  function toggleEvidence(id: string) {
    setEvidenceIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

  return (
    <form
      className="dj-form"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!canSave || saving) {
          return
        }
        setSaving(true)
        await decisionJournal.create({
          title: title.trim(),
          thesis: thesis.trim(),
          direction,
          tickers: tickers
            .split(',')
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean),
          conviction,
          emotionalState,
          evidenceIds,
          reviewDate: new Date(reviewDate).getTime(),
        })
        await onCreated()
      }}
    >
      <label>
        <span>Thesis title</span>
        <input value={title} placeholder="e.g. Energy stays bid while Red Sea risk persists" onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        <span>Thesis</span>
        <textarea value={thesis} placeholder="What you believe and why, in your own words." onChange={(event) => setThesis(event.target.value)} />
      </label>

      <div className="dj-field-row">
        <label>
          <span>Direction</span>
          <select value={direction} onChange={(event) => setDirection(event.target.value as DecisionDirection)}>
            {DIRECTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tickers (comma)</span>
          <input value={tickers} placeholder="CL, XLE" onChange={(event) => setTickers(event.target.value)} />
        </label>
        <label>
          <span>Emotional state</span>
          <select value={emotionalState} onChange={(event) => setEmotionalState(event.target.value as EmotionalState)}>
            {EMOTIONS.map((value) => (
              <option key={value} value={value}>
                {emotionalStateLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Conviction · {conviction}%</span>
        <input type="range" min={0} max={100} value={conviction} onChange={(event) => setConviction(Number(event.target.value))} />
      </label>

      <div className="dj-evidence-picker">
        <span>Link evidence (signals &amp; events)</span>
        <div className="dj-chips">
          {evidenceOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={evidenceIds.includes(option.id) ? 'dj-chip active' : 'dj-chip'}
              onClick={() => toggleEvidence(option.id)}
              title={option.label}
            >
              {option.id}
            </button>
          ))}
        </div>
      </div>

      <label>
        <span>Review date</span>
        <input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
      </label>

      <div className="dj-form-actions">
        <button type="button" className="dj-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="dj-save" disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Save thesis'}
        </button>
      </div>
    </form>
  )
}
