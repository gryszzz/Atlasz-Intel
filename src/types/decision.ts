/**
 * Research Notes — the 7th Atlasz Intel intelligence layer.
 *
 * Atlasz is explicitly NOT a trading bot and does NOT give financial advice;
 * Research Notes are personal, local-first context records. They capture the
 * user's observation, the evidence it rests on, the emotional state it was made
 * in, and a scheduled follow-up so reasoning can be reviewed after the fact.
 */

export type DecisionDirection = 'positive' | 'negative' | 'neutral' | 'avoid' | 'watch' | 'long' | 'short'

export type DecisionStatus = 'open' | 'reviewing' | 'validated' | 'invalidated' | 'closed'

/**
 * Emotional state at the time of the note. Tracking this surfaces when
 * confidence was driven by feeling rather than evidence.
 */
export type EmotionalState =
  | 'calm'
  | 'confident'
  | 'uncertain'
  | 'fomo'
  | 'fearful'
  | 'greedy'
  | 'frustrated'
  | 'detached'

export type DecisionJournalEntry = {
  id: string
  createdAt: number
  updatedAt: number
  /** Short title for the note, e.g. "Energy stress persists on Red Sea risk". */
  title: string
  /** The full observation: what the user believes is happening and why. */
  thesis: string
  direction: DecisionDirection
  /** Symbols or entities the note concerns. */
  tickers: string[]
  /** Self-rated confidence 0-100 (not a probability). */
  conviction: number
  emotionalState: EmotionalState
  /** IDs of Evidence Layer items / signals / events backing the note. */
  evidenceIds: string[]
  /** Free-form notes on supporting / contradicting context. */
  context: string
  /** Unix ms when this note should be followed up. */
  reviewDate: number
  status: DecisionStatus
  /** Follow-up written at review time. Empty until reviewed. */
  postMortem: string
  /** Optional descriptive outcome label written at follow-up/close. */
  outcome?: 'correct' | 'partly-correct' | 'incorrect' | 'inconclusive'
}

/** Payload for creating an entry — server fills ids/timestamps/derived fields. */
export type DecisionJournalDraft = {
  title: string
  thesis: string
  direction: DecisionDirection
  tickers: string[]
  conviction: number
  emotionalState: EmotionalState
  evidenceIds: string[]
  context?: string
  reviewDate: number
}

export const emotionalStateLabels: Record<EmotionalState, string> = {
  calm: 'Calm',
  confident: 'Confident',
  uncertain: 'Uncertain',
  fomo: 'FOMO',
  fearful: 'Fearful',
  greedy: 'Greedy',
  frustrated: 'Frustrated',
  detached: 'Detached',
}

export const decisionStatusLabels: Record<DecisionStatus, string> = {
  open: 'Open',
  reviewing: 'Reviewing',
  validated: 'Followed through',
  invalidated: 'Did not follow through',
  closed: 'Closed',
}

export const decisionDirectionLabels: Record<DecisionDirection, string> = {
  positive: 'Positive context',
  negative: 'Negative context',
  neutral: 'Neutral',
  avoid: 'Avoid',
  watch: 'Watch',
  long: 'Positive context',
  short: 'Negative context',
}

/** True when an open note has reached its scheduled follow-up date. */
export function isDueForReview(entry: DecisionJournalEntry, now: number = Date.now()): boolean {
  return entry.status === 'open' && entry.reviewDate <= now
}
