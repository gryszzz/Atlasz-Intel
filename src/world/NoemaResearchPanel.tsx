import { useState } from 'react'
import type { WorldIntelEvent } from '../worldIntel'
import { BRIDGE_LIMIT, createResearchRequest, exportBlockReason, readEvidenceReview } from './noemaBridge'
import type { BridgeEnvelope, EvidenceReview } from './noemaBridge'
import './NoemaResearchPanel.css'

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function NoemaResearchPanel({ event }: { event: WorldIntelEvent }) {
  const [question, setQuestion] = useState('What does this source establish, and what evidence is still needed?')
  const [request, setRequest] = useState<BridgeEnvelope | null>(null)
  const [review, setReview] = useState<EvidenceReview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const blocked = exportBlockReason(event)

  async function exportRequest() {
    setBusy(true)
    setError('')
    try {
      const next = await createResearchRequest(event, question)
      setRequest(next)
      setReview(null)
      download('meridian-request.json', next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to export research request.')
    } finally {
      setBusy(false)
    }
  }

  async function importReview(file?: File) {
    if (!file || !request) return
    setBusy(true)
    setError('')
    try {
      if (file.size > BRIDGE_LIMIT) throw new Error('Review exceeds the transfer limit.')
      setReview(await readEvidenceReview(await file.text(), request))
    } catch {
      setReview(null)
      setError('Review rejected. Use the NOEMA review produced from this exported request.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="noema-research" aria-label="NOEMA evidence review">
    <div className="atlasz-section-label">NOEMA · EVIDENCE REVIEW</div>
    <p>Prepare a source excerpt for NOEMA. This first bridge produces a local evidence checklist; it does not perform new research.</p>
    <label htmlFor="noema-question">Research question</label>
    <textarea id="noema-question" value={question} maxLength={2000} rows={2}
      onChange={(event) => setQuestion(event.target.value)} />
    <button type="button" disabled={Boolean(blocked) || busy || !question.trim()} onClick={() => void exportRequest()}>
      Export research request
    </button>
    {blocked && <p>{blocked}</p>}
    {request && <div className="noema-transfer">
      <p>Run in your NOEMA environment with the downloaded file:</p>
      <code>noema-meridian meridian-request.json --output noema-review.json</code>
      <p>Keep this event open, then import the review. Changing event or reloading clears this session.</p>
      <label>Import NOEMA review
        <input type="file" accept="application/json,.json" disabled={busy}
          onChange={(event) => { void importReview(event.target.files?.[0]); event.target.value = '' }} />
      </label>
    </div>}
    {error && <p role="alert">{error}</p>}
    {review && <div className="noema-review" aria-live="polite">
      <strong>Needs more evidence · deterministic review</strong>
      <p>Imported analysis · {new Date(review.generatedAt).toLocaleString()}. File integrity is checked; author identity is not authenticated.</p>
      {review.findings.map((finding, index) => <blockquote key={index}>
        {finding.text}<small>Evidence: {finding.evidenceIds.join(', ')}</small>
      </blockquote>)}
      <h3>Unknowns</h3><ul>{review.unknowns.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <h3>Next checks</h3><ul>{review.nextChecks.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <h3>What this does not prove</h3><ul>{review.nonClaims.map((item, index) => <li key={index}>{item}</li>)}</ul>
    </div>}
  </section>
}
