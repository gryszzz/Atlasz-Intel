/*
 * Local lexical embedding (Phase 3.5). A deterministic hashing vectorizer over
 * the event's text — NOT a neural/semantic model. It is honestly labelled as a
 * lexical, local-computed embedding so similarity is never presented as verified
 * semantic truth. The interface is small so a real local model (e.g. an Ollama
 * embedding endpoint) could be swapped in later behind the same shape.
 */
import { createHash } from 'node:crypto'
import type { WorldIntelEvent } from '../../src/worldIntel'

export const EMBEDDING_MODEL = 'lexical-hash-v1'
export const EMBEDDING_DIM = 256

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'as', 'at', 'by', 'is', 'are',
  'was', 'were', 'be', 'from', 'that', 'this', 'it', 'its', 'into', 'over', 'after', 'new',
])

/** Text used to represent an event for similarity. */
export function eventText(event: WorldIntelEvent): string {
  return [event.title, event.summary, ...event.extractedEntities, ...event.narrativeTags, String(event.category)]
    .join(' ')
    .toLowerCase()
}

export function summaryHashFor(event: WorldIntelEvent): string {
  return createHash('sha256').update(eventText(event)).digest('hex').slice(0, 32)
}

/** Deterministic L2-normalized TF hashing vector. Returns null on empty text. */
export function embedText(text: string): number[] | null {
  const tokens = tokenize(text)
  if (tokens.length === 0) {
    return null
  }
  const vector = new Array<number>(EMBEDDING_DIM).fill(0)
  for (const token of tokens) {
    const bucket = hashToken(token) % EMBEDDING_DIM
    const sign = (hashToken(`${token}#sign`) & 1) === 0 ? 1 : -1
    vector[bucket] += sign
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) {
    return null
  }
  return vector.map((value) => value / norm)
}

export function embedEvent(event: WorldIntelEvent): number[] | null {
  return embedText(eventText(event))
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0
  }
  let dot = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
  }
  // Vectors are L2-normalized, so the dot product is the cosine similarity.
  return Math.max(-1, Math.min(1, dot))
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
}

function hashToken(token: string): number {
  let hash = 2166136261
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
