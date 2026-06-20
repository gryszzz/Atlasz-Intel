/*
 * Research Note panel (Phase 4 / revamp item 7). A closed-loop research journal
 * — NOT execution. Logging captures the current math-derived system snapshot for
 * an asset (server-side) and tracks follow-through over time. Honest framing:
 * "research note", "observed move", "follow-through" — no buy/sell/execution.
 */
import { useEffect, useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  emptyThesisDashboard,
  fetchThesisDashboard,
  saveThesisDraft,
  thesisBridgeAvailable,
  type ThesisDashboard,
  type ThesisType,
  type UserThesis,
} from '../../engine/decisionJournal'
import './ResearchNotePanel.css'

const STANCES: Array<{ id: ThesisType; label: string }> = [
  { id: 'Positive', label: 'Positive' },
  { id: 'Neutral', label: 'Neutral' },
  { id: 'Negative', label: 'Negative' },
]

export function ResearchNotePanel({ defaultSymbol }: { defaultSymbol?: string }) {
  const available = thesisBridgeAvailable()
  const [symbol, setSymbol] = useState(defaultSymbol ?? '')
  const [stance, setStance] = useState<ThesisType>('Neutral')
  const [notes, setNotes] = useState('')
  const [horizon, setHorizon] = useState(7)
  const [saving, setSaving] = useState(false)
  const [dashboard, setDashboard] = useState<ThesisDashboard>(() => emptyThesisDashboard())

  useEffect(() => {
    let mounted = true
    async function load() {
      const result = await fetchThesisDashboard()
      if (mounted && result) {
        setDashboard(result)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  async function submit() {
    const asset = symbol.trim().toUpperCase()
    if (!asset || saving) {
      return
    }
    setSaving(true)
    try {
      const result = await saveThesisDraft({ assetSymbol: asset, thesisType: stance, userNotes: notes, targetHorizonDays: horizon })
      if (result) {
        setDashboard(result)
        setNotes('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="research-note">
      <div className="rn-form">
        <div className="rn-row">
          <input
            className="rn-symbol"
            placeholder="Asset (e.g. SPY)"
            value={symbol}
            aria-label="Asset symbol"
            onChange={(event) => setSymbol(event.target.value)}
          />
          <div className="rn-stance" role="group" aria-label="Research stance">
            {STANCES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={stance === option.id ? 'active' : ''}
                onClick={() => setStance(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="rn-notes"
          placeholder="Context note: what you observed and why it matters (not advice)."
          value={notes}
          aria-label="Research note"
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="rn-actions">
          <label className="rn-horizon">
            Horizon
            <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
              <option value={1}>1d</option>
              <option value={7}>7d</option>
              <option value={30}>30d</option>
              <option value={90}>90d</option>
            </select>
          </label>
          <button className="rn-log" type="button" onClick={() => void submit()} disabled={!available || saving || !symbol.trim()}>
            <NotebookPen size={15} />
            {saving ? 'Logging…' : 'Log research note'}
          </button>
        </div>
        {!available && <p className="rn-hint">Research notes are stored in the desktop app (local SQLite).</p>}
      </div>

      <div className="rn-dashboard">
        <div className="rn-stats">
          <Stat label="Open" value={String(dashboard.openCount)} />
          <Stat label="Closed" value={String(dashboard.closedCount)} />
          <Stat
            label="Follow-through"
            value={dashboard.followThroughRate === null ? 'n/a' : `${Math.round(dashboard.followThroughRate * 100)}%`}
            sub={`${dashboard.evaluableCount} tracked`}
          />
        </div>
        {dashboard.byProvenance.length > 0 && (
          <div className="rn-provenance">
            {dashboard.byProvenance.map((entry) => (
              <div className="rn-prov-row" key={entry.provenance}>
                <ProvenanceBadge value={entry.provenance} size="sm" />
                <span>{entry.count}</span>
                <strong>{entry.avgReturn === null ? '—' : `${entry.avgReturn >= 0 ? '+' : ''}${entry.avgReturn}%`}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="rn-list">
          {dashboard.theses.slice(0, 6).map((thesis) => (
            <NoteRow key={thesis.id} thesis={thesis} />
          ))}
          {dashboard.theses.length === 0 && <p className="rn-hint">No research notes yet.</p>}
        </div>
        {!dashboard.priceDataAvailable && dashboard.theses.length > 0 && (
          <p className="rn-hint">Follow-through unavailable: no local price history for these assets yet.</p>
        )}
      </div>
    </div>
  )
}

function NoteRow({ thesis }: { thesis: UserThesis }) {
  return (
    <article className="rn-note-row">
      <div>
        <strong>{thesis.assetSymbol}</strong>
        <span className={`rn-stance-tag stance-${thesis.thesisType.toLowerCase()}`}>{thesis.thesisType}</span>
      </div>
      <span className="rn-return">
        {thesis.currentReturn === null ? 'n/a' : `${thesis.currentReturn >= 0 ? '+' : ''}${thesis.currentReturn}%`}
      </span>
    </article>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rn-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <em>{sub}</em>}
    </div>
  )
}
