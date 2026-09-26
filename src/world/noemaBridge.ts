import type { WorldIntelEvent } from '../worldIntel'

export const BRIDGE_LIMIT = 65_536
const REQUEST_SCHEMA = 'meridian.noema.request.v1'
const REVIEW_SCHEMA = 'meridian.noema.review.v1'

export type BridgeEnvelope = { schema: string; payload: string; sha256: string }
export type ResearchRequest = {
  requestId: string
  createdAt: string
  question: string
  evidence: {
    eventId: string
    title: string
    summary: string
    sourceId: string
    sourceUrl: string
    sourceProvenance: string
    eventAt: string
    sourceRetrievedAt: null
    upstreamPayloadHash: string
    freshness: 'unassessed'
  }
}
export type EvidenceReview = {
  requestId: string
  requestSha256: string
  eventId: string
  generatedAt: string
  method: 'deterministic-evidence-review-v1'
  basis: 'analysis'
  status: 'needs-more-evidence'
  findings: { text: string; evidenceIds: string[] }[]
  unknowns: string[]
  nextChecks: string[]
  nonClaims: string[]
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

function hasKeys(value: unknown, keys: string[]): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function exportBlockReason(event: WorldIntelEvent): string | null {
  if (!['live', 'delayed', 'stale-cache', 'offline-cache', 'public-unauthenticated',
    'public-disclosure', 'official-api', 'media-observation', 'rss-public', 'verified'].includes(event.provenance)) {
    return 'This event is not an eligible source excerpt.'
  }
  if (!boundedText(event.id, 256) || !boundedText(event.title, 2000) ||
    typeof event.summary !== 'string' || event.summary.length > 12000 ||
    !boundedText(event.sourceId, 256) || !boundedText(event.rawPayloadHash, 256)) {
    return 'A bounded event excerpt, source identity, and payload reference are required.'
  }
  if (!Number.isFinite(event.timestamp) || event.timestamp < 0 || event.timestamp > Date.now()) {
    return 'The event timestamp is invalid or in the future.'
  }
  try {
    if (/[\s\\?#]/.test(event.sourceUrl ?? '') ||
      Array.from(event.sourceUrl ?? '').some((character) => character.charCodeAt(0) < 32)) {
      return 'Export requires a public HTTPS source URL without credentials, query, or fragment.'
    }
    const url = new URL(event.sourceUrl ?? '')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.href.length > 2048) return 'Export requires a public HTTPS source URL without credentials, query, or fragment.'
  } catch {
    return 'A public source URL is required.'
  }
  return null
}

export async function createResearchRequest(event: WorldIntelEvent, question: string): Promise<BridgeEnvelope> {
  const blocked = exportBlockReason(event)
  if (blocked) throw new Error(blocked)
  if (!boundedText(question, 2000)) throw new Error('Enter a research question of 1–2000 characters.')
  const body: ResearchRequest = {
    requestId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    question: question.trim(),
    evidence: {
      eventId: event.id,
      title: event.title,
      summary: event.summary,
      sourceId: event.sourceId,
      sourceUrl: event.sourceUrl!,
      sourceProvenance: event.provenance,
      eventAt: new Date(event.timestamp).toISOString(),
      // WorldIntelEvent has no universal source retrieval timestamp. Never use export time.
      sourceRetrievedAt: null,
      upstreamPayloadHash: event.rawPayloadHash,
      freshness: 'unassessed',
    },
  }
  const payload = JSON.stringify(body)
  const envelope = { schema: REQUEST_SCHEMA, payload, sha256: await sha256(payload) }
  if (new TextEncoder().encode(JSON.stringify(envelope)).length > BRIDGE_LIMIT) {
    throw new Error('Research packet exceeds the transfer limit.')
  }
  return envelope
}

export async function readEvidenceReview(text: string, request: BridgeEnvelope): Promise<EvidenceReview> {
  if (new TextEncoder().encode(text).length > BRIDGE_LIMIT) throw new Error('Review exceeds the transfer limit.')
  const envelope = JSON.parse(text)
  if (!hasKeys(envelope, ['schema', 'payload', 'sha256']) || envelope.schema !== REVIEW_SCHEMA || typeof envelope.payload !== 'string' ||
    !/^[a-f0-9]{64}$/.test(envelope.sha256) || await sha256(envelope.payload) !== envelope.sha256) {
    throw new Error('Review format or transfer integrity check failed.')
  }
  const body = JSON.parse(envelope.payload)
  const original: ResearchRequest = JSON.parse(request.payload)
  if (!hasKeys(body, ['requestId', 'requestSha256', 'eventId', 'generatedAt', 'method', 'basis',
    'status', 'findings', 'unknowns', 'nextChecks', 'nonClaims']) ||
    body.requestId !== original.requestId || body.requestSha256 !== request.sha256 ||
    body.eventId !== original.evidence.eventId || body.method !== 'deterministic-evidence-review-v1' ||
    body.basis !== 'analysis' || body.status !== 'needs-more-evidence') {
    throw new Error('Review does not match this research request or supported review method.')
  }
  const generatedAt = Date.parse(body.generatedAt)
  if (!boundedText(body.generatedAt, 64) || !/(Z|[+-]\d{2}:\d{2})$/.test(body.generatedAt) || !Number.isFinite(generatedAt) ||
    generatedAt < Date.parse(original.createdAt) || generatedAt > Date.now() + 60_000) {
    throw new Error('Review timestamp is invalid.')
  }
  if (!Array.isArray(body.findings) || body.findings.length < 1 || body.findings.length > 8 ||
    !body.findings.every((finding: EvidenceReview['findings'][number]) => hasKeys(finding, ['text', 'evidenceIds']) &&
      boundedText(finding.text, 16000) && Array.isArray(finding.evidenceIds) &&
      finding.evidenceIds.length === 1 && finding.evidenceIds[0] === original.evidence.eventId)) {
    throw new Error('Every finding must cite the exported evidence.')
  }
  for (const field of ['unknowns', 'nextChecks', 'nonClaims']) {
    if (!Array.isArray(body[field]) || body[field].length < 1 || body[field].length > 12 ||
      !body[field].every((item: unknown) => boundedText(item, 2000))) {
      throw new Error('Review is missing bounded unknowns, next checks, or non-claims.')
    }
  }
  return body as EvidenceReview
}
