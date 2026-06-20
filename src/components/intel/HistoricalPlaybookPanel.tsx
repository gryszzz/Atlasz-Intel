/*
 * HistoricalPlaybookPanel (Phase 3.5). Mounted in the world event/entity detail
 * surface. Lets the user pick a recent event and shows the top local-computed
 * precedents + how linked assets reacted. Renders computed state only; all
 * matching/embedding runs in the Node playbook service.
 */
import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  PLAYBOOK_UNAVAILABLE,
  RETURN_PROFILE_UNAVAILABLE,
  unavailablePlaybook,
  type HistoricalPlaybook,
  type PrecedentMatch,
  type ReturnProfile,
} from '../../intel'
import type { WorldIntelEvent } from '../../worldIntel'
import './HistoricalPlaybookPanel.css'

export function HistoricalPlaybookPanel({ events }: { events: WorldIntelEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playbook, setPlaybook] = useState<HistoricalPlaybook | null>(null)

  const activeId = selectedId && events.some((event) => event.id === selectedId) ? selectedId : events[0]?.id ?? null

  useEffect(() => {
    if (!activeId) {
      return
    }
    const intel = typeof window !== 'undefined' ? window.atlaszDesktop?.intel : null
    let mounted = true
    if (!intel) {
      void Promise.resolve().then(() => {
        if (mounted) {
          setPlaybook(unavailablePlaybook(activeId, 'Historical precedent runs in the desktop app (Node embeddings).'))
        }
      })
      return () => {
        mounted = false
      }
    }
    void intel
      .playbook(activeId)
      .then((result) => {
        if (mounted) {
          setPlaybook(result)
        }
      })
      .catch(() => {
        if (mounted) {
          setPlaybook(unavailablePlaybook(activeId, 'Playbook failed to compute from current data.'))
        }
      })
    return () => {
      mounted = false
    }
  }, [activeId])

  const loading = activeId !== null && (!playbook || playbook.queryEventId !== activeId)

  return (
    <article className="world-panel playbook-panel">
      <header className="world-panel-header">
        <div>
          <History size={15} />
          <span>Historical Precedent</span>
        </div>
        <strong>{playbook?.available ? `${playbook.matches.length} precedents` : 'local-computed'}</strong>
      </header>

      <select
        className="playbook-picker"
        aria-label="Select event for precedent search"
        value={activeId ?? ''}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        {events.slice(0, 30).map((event) => (
          <option key={event.id} value={event.id}>
            {truncate(event.title, 72)}
          </option>
        ))}
      </select>

      {!activeId && <p className="playbook-empty">No events available to search for precedents.</p>}

      {activeId && loading && (
        <div className="playbook-loading">
          <span className="fx-skeleton" style={{ height: 54 }} />
          <span className="fx-skeleton" style={{ height: 54 }} />
        </div>
      )}

      {activeId && !loading && playbook && !playbook.available && (
        <div className="playbook-unavailable">
          <strong>{PLAYBOOK_UNAVAILABLE}</strong>
          <p>{playbook.unavailableReason}</p>
        </div>
      )}

      {activeId && !loading && playbook?.available && (
        <div className="playbook-matches">
          {playbook.matches.map((match) => (
            <PrecedentCard key={match.eventId} match={match} />
          ))}
          <p className="playbook-disclaimer">
            Lexical similarity ({playbook.embeddingModel}), local-computed — not verified causation.
          </p>
        </div>
      )}
    </article>
  )
}

function PrecedentCard({ match }: { match: PrecedentMatch }) {
  return (
    <article className="precedent-card">
      <header>
        <strong>{match.title}</strong>
        <span className="precedent-sim">{Math.round(match.similarity * 100)}%</span>
      </header>
      <div className="precedent-meta">
        <time>{new Date(match.timestamp).toLocaleDateString()}</time>
        <span>{match.category}</span>
        <ProvenanceBadge value={match.provenance} size="sm" />
      </div>
      <p className="precedent-reason">{match.matchReason}</p>
      {match.linkedAssets.length > 0 && (
        <div className="precedent-assets">
          {match.linkedAssets.slice(0, 6).map((asset) => (
            <span key={asset}>{asset}</span>
          ))}
        </div>
      )}
      <ReturnProfileRow profile={match.returnProfile} />
    </article>
  )
}

function ReturnProfileRow({ profile }: { profile: ReturnProfile | null }) {
  if (!profile || (profile.oneDayPct === null && profile.fiveDayPct === null && profile.sevenDayPct === null)) {
    return <p className="precedent-return-na">{RETURN_PROFILE_UNAVAILABLE}</p>
  }
  return (
    <div className="precedent-returns">
      <span className="precedent-return-symbol">{profile.symbol}</span>
      <ReturnCell label="1D" value={profile.oneDayPct} />
      <ReturnCell label="5D" value={profile.fiveDayPct} />
      <ReturnCell label="7D" value={profile.sevenDayPct} />
      <ProvenanceBadge value={profile.provenance} size="sm" />
    </div>
  )
}

function ReturnCell({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <span className="return-cell">
        <em>{label}</em>
        <strong className="return-na">n/a</strong>
      </span>
    )
  }
  return (
    <span className="return-cell">
      <em>{label}</em>
      <strong className={value >= 0 ? 'return-up' : 'return-down'}>
        {value >= 0 ? '+' : ''}
        {value.toFixed(1)}%
      </strong>
    </span>
  )
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
