/**
 * Decision Layer — the 7th Atlasz Intel intelligence layer.
 *
 * Atlasz is explicitly NOT a trading bot and does NOT give financial advice;
 * the Decision Journal is a personal, local-first reasoning record. It captures
 * the user's thesis, the evidence it rests on, the emotional state it was made
 * in, and a scheduled review so theses can be honestly graded after the fact.
 */

export type DecisionDirection = 'long' | 'short' | 'neutral' | 'avoid' | 'watch'

export type DecisionStatus = 'open' | 'reviewing' | 'validated' | 'invalidated' | 'closed'

/**
 * Emotional state at the time of the decision. Tracking this is the point of a
 * decision journal — it surfaces when conviction was driven by feeling rather
 * than evidence.
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
  /** Short title for the thesis, e.g. "Energy bid persists on Red Sea risk". */
  title: string
  /** The full reasoning: what the user believes and why. */
  thesis: string
  direction: DecisionDirection
  /** Symbols the thesis concerns. */
  tickers: string[]
  /** Self-rated conviction 0-100 (not a probability, a personal confidence). */
  conviction: number
  emotionalState: EmotionalState
  /** IDs of Evidence Layer items / signals / events backing the thesis. */
  evidenceIds: string[]
  /** Free-form notes on supporting / contradicting context. */
  context: string
  /** Unix ms when this thesis should be reviewed. */
  reviewDate: number
  status: DecisionStatus
  /** Post-mortem written at review time. Empty until reviewed. */
  postMortem: string
  /** Optional realized outcome label written at review/close. */
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
  validated: 'Validated',
  invalidated: 'Invalidated',
  closed: 'Closed',
}

/** True when an open thesis has reached its scheduled review date. */
export function isDueForReview(entry: DecisionJournalEntry, now: number = Date.now()): boolean {
  return entry.status === 'open' && entry.reviewDate <= now
}
