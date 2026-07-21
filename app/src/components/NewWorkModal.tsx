import { useState, type FormEvent } from 'react'

import { createNewWork, MAX_BODY_BYTES, MAX_TITLE_BYTES, utf8ByteLength, type NewWorkResult } from '../api'
import { safeExternalUrl } from '../lib/format'
import { resolveNewWorkAvailability } from '../lib/presentation'
import type { SnapshotMode, WritePosture } from '../types/snapshot'
import { ExternalIcon } from './Icons'
import { ModalShell } from './ModalShell'

interface NewWorkModalProps {
  mode: SnapshotMode
  posture: WritePosture
  onClose: () => void
}

export function NewWorkModal({ mode, posture, onClose }: NewWorkModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<NewWorkResult | null>(null)
  const availability = resolveNewWorkAvailability(mode, posture)
  const controlsDisabled = !availability.allowed || submitting
  const titleBytes = utf8ByteLength(title)
  const bodyBytes = utf8ByteLength(body)
  const exceedsByteLimit = titleBytes > MAX_TITLE_BYTES || bodyBytes > MAX_BODY_BYTES

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!availability.allowed || submitting || !title.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      setResult(await createNewWork({ title: title.trim(), body }))
    } catch (caught) {
      setResult({
        ok: false,
        status: 0,
        code: 'network_error',
        message: caught instanceof Error ? caught.message : 'The issue creation request could not reach the local server.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resultUrl = result?.ok ? safeExternalUrl(result.url) : null
  return (
    <ModalShell title="Admit work to the loop" label="New work · the one write" onClose={onClose}>
      <form className="new-work" onSubmit={handleSubmit}>
        <div className="write-boundary">
          <div>
            <span className="eyebrow">Target</span>
            <strong>{posture.repository ?? 'Server-configured repository'}</strong>
          </div>
          <span className={`posture-chip ${posture.label === 'LIVE' ? 'posture-chip--live' : ''}`}>{posture.label}</span>
        </div>
        <p className="form-intro">This sends one <code>POST /api/v1/issues</code>. The server must create the GitHub issue with <code>fkst-dev:enabled</code> in the same guarded operation. It does not command the engine.</p>

        <div className={`form-result form-result--availability form-result--${availability.state}`} role="status">
          <span className="result-code">New Work availability</span>
          <strong>{availability.headline}</strong>
          <span>{availability.reason}</span>
        </div>

        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={MAX_TITLE_BYTES} required disabled={controlsDisabled} aria-invalid={titleBytes > MAX_TITLE_BYTES} placeholder="Describe a concrete outcome" />
          <small>{titleBytes}/{MAX_TITLE_BYTES} bytes</small>
        </label>
        <label className="field">
          <span>Description</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={MAX_BODY_BYTES} rows={7} disabled={controlsDisabled} aria-invalid={bodyBytes > MAX_BODY_BYTES} placeholder="Context, constraints, and acceptance evidence" />
          <small>{bodyBytes}/{MAX_BODY_BYTES} bytes</small>
        </label>

        {result && !result.ok && (
          <div className="form-result form-result--error" role="alert">
            <span className="result-code">{result.status || 'network'} · {result.code}</span>
            <strong>Guard did not admit the write</strong>
            <span>{result.message}</span>
          </div>
        )}
        {result?.ok && (
          <div className="form-result form-result--success" role="status">
            <span className="result-code">GitHub receipt</span>
            <strong>Issue created by {result.actor}</strong>
            <span>{result.repository ?? posture.repository ?? 'Configured repository'}{result.number ? ` · #${result.number}` : ''}</span>
            {resultUrl && <a href={resultUrl} target="_blank" rel="noreferrer">Open resulting issue <ExternalIcon /></a>}
          </div>
        )}

        <footer className="modal__actions">
          <span className="modal__context">Actor, allowlist, mode, origin, and token are enforced by the server.</span>
          <button className="button button--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button button--primary" type="submit" disabled={!availability.allowed || submitting || !title.trim() || exceedsByteLimit}>{submitting ? 'Requesting…' : 'Create enabled issue'}</button>
        </footer>
      </form>
    </ModalShell>
  )
}
