/*
 * "What Changed Today" — the synthesis surface.
 *
 * Renders the deterministic materiality ranking over all connectors' events.
 * Each item leads with a headline and WHY it matters, then exposes its full
 * evidence trail (the contributing sources + links), confidence, and the signal
 * breakdown that produced its rank. The ranking is local-derived, so it carries a
 * local-derived provenance badge and is never presented as verified.
 *
 * When nothing qualifies in the window, the panel shows DATA_UNAVAILABLE instead
 * of fabricating importance.
 */
import { useMemo } from 'react'
import { Link2 } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import {
  assessWhatChangedToday,
  type MaterialItem,
  type MaterialityChangeType,
  type MaterialityOptions,
} from '../../engine/materialityEngine'
import type { WorldIntelEvent } from '../../worldIntel'
import './WhatChangedTodayPanel.css'

export function WhatChangedTodayPanel({
  events,
  options,
}: {
  events: WorldIntelEvent[]
  options?: MaterialityOptions
}) {
  const result = useMemo(() => assessWhatChangedToday(events, options), [events, options])
  const changeTypeSummary = useMemo(() => summarizeChangeTypes(result.items), [result.items])

  return (
    <section className="wct">
      <header className="wct-head">
        <h2>What Changed Today</h2>
        <span>
          {result.status === 'ok'
            ? `${result.items.length} ranked · ${result.consideredEventCount} events considered`
            : 'DATA_UNAVAILABLE'}
        </span>
      </header>

      {result.status === 'ok' && result.items.length > 0 ? (
        <>
          <div className="wct-type-strip" aria-label="Change type summary">
            {changeTypeSummary.map(({ changeType, count }) => (
              <span key={changeType}>
                {changeTypeLabel(changeType)} <strong>{count}</strong>
              </span>
            ))}
          </div>
          <ol className="wct-list">
            {result.items.map((item, index) => (
              <WhatChangedRow key={item.id} item={item} rank={index + 1} />
            ))}
          </ol>
        </>
      ) : (
        <div className="wct-empty">
          <strong>DATA_UNAVAILABLE</strong>
          <p>
            No material change detected from current evidence in the last 24 hours. Nothing is invented —
            this panel ranks only what the connectors actually returned.
          </p>
        </div>
      )}
    </section>
  )
}

function WhatChangedRow({ item, rank }: { item: MaterialItem; rank: number }) {
  return (
    <li className="wct-row">
      <div className="wct-rank">{rank}</div>
      <div className="wct-body">
        <div className="wct-row-head">
          <strong>{item.headline}</strong>
          <span className="wct-materiality" title="Materiality score (0-100)">
            {item.materiality}
          </span>
        </div>
        <span className="wct-change-type">{changeTypeLabel(item.changeType)}</span>
        <p className="wct-why">{item.whyItMatters}</p>
        <div className="wct-meta">
          <ProvenanceBadge value={item.provenance} size="sm" />
          <span>{item.confidence}% confidence</span>
          {item.entities.length > 0 && <span className="wct-entities">{item.entities.slice(0, 3).join(' · ')}</span>}
        </div>
        <div className="wct-evidence">
          <span className="wct-evidence-label">Evidence</span>
          {item.evidence.map((evidence) => (
            <a
              key={evidence.eventId}
              href={evidence.sourceUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              title={evidence.title}
            >
              <Link2 size={11} />
              {evidence.sourceLabel}
            </a>
          ))}
        </div>
      </div>
    </li>
  )
}

function summarizeChangeTypes(items: MaterialItem[]): Array<{ changeType: MaterialityChangeType; count: number }> {
  const counts = new Map<MaterialityChangeType, number>()
  for (const item of items) counts.set(item.changeType, (counts.get(item.changeType) ?? 0) + 1)
  return [...counts.entries()]
    .map(([changeType, count]) => ({ changeType, count }))
    .sort((a, b) => b.count - a.count || changeTypeLabel(a.changeType).localeCompare(changeTypeLabel(b.changeType)))
    .slice(0, 6)
}

function changeTypeLabel(changeType: MaterialityChangeType): string {
  const labels: Record<MaterialityChangeType, string> = {
    filing: 'filing',
    macro: 'macro',
    fiscal: 'fiscal',
    labor: 'labor',
    'national-accounts': 'national accounts',
    energy: 'energy',
    weather: 'weather',
    earthquake: 'earthquake',
    regulatory: 'regulatory',
    sanctions: 'sanctions',
    legislation: 'legislation',
    cyber: 'cyber',
    patent: 'patent',
    'oss-release': 'OSS release',
    'trade-flow': 'trade flow',
    'media-observation': 'media observation',
    'research': 'research metadata',
    'world-event': 'world event',
  }
  return labels[changeType]
}
