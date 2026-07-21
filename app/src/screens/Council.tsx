import { effectiveAgeMs } from '../lib/snapshot'
import { formatAge, formatTimestamp, safeExternalUrl } from '../lib/format'
import type { SnapshotV1 } from '../types/snapshot'
import type { TransportState } from '../hooks/useSnapshot'
import { ExternalIcon } from '../components/Icons'
import { PanelFooter } from '../components/PanelFooter'
import { StatusSurface } from '../components/StatusSurface'

interface CouncilProps {
  snapshot: SnapshotV1 | null
  transport: TransportState
  error: string | null
  nowMs: number
  onRetry: () => void
}

function outcomeTone(outcome: string | null): string {
  const value = outcome?.toLowerCase()
  if (value === 'approve' || value === 'approved' || value === 'converged') return 'decision-chip--approve'
  if (value === 'reject' || value === 'rejected' || value === 'blocked') return 'decision-chip--reject'
  return ''
}

export function Council({ snapshot, transport, error, nowMs, onRetry }: CouncilProps) {
  const council = snapshot?.council ?? null
  const age = snapshot && council ? effectiveAgeMs(council.source, snapshot, nowMs) : null
  const activeSeats = council?.seats?.filter((seat) => seat.active !== false) ?? null

  return (
    <div className="page page--council">
      <header className="page-intro">
        <div>
          <span className="eyebrow">Council · read only</span>
          <h1>Who earns a seat in the decision</h1>
          <p>Independent lenses deliberate in isolated context. This view reads admitted decisions; it cannot edit rosters, prompts, or flows.</p>
        </div>
        <div className="page-intro__facts">
          <span><b>Seated</b> {activeSeats === null ? 'unknown' : activeSeats.length}</span>
          <span><b>Decisions</b> {council?.decisions === null || !council ? 'unknown' : council.decisions.length}</span>
          <span><b>As of</b> {formatAge(age)}</span>
        </div>
      </header>

      <section className="panel seats-panel" aria-labelledby="seats-heading">
        <header className="panel-heading">
          <div><span className="eyebrow">Council seats</span><h2 id="seats-heading">Independent decision lenses</h2></div>
          <span className="panel-heading__note">Read-only projection · no persona controls</span>
        </header>
        {transport === 'loading' && !snapshot && <StatusSurface kind="loading" title="Reading Council evidence" detail="Waiting for the normalized snapshot." />}
        {transport === 'disconnected' && !snapshot && <StatusSurface kind="disconnected" title="Council source disconnected" detail={error ?? 'Council facts are unknown.'} onRetry={onRetry} />}
        {snapshot && (!council || council.seats === null) && <StatusSurface kind="unavailable" title="Seat roster unknown" detail="The snapshot did not include an admitted Council roster. Unknown is not rendered as zero." />}
        {council?.seats?.length === 0 && <StatusSurface kind="empty" title="No seats configured" detail="The validated Council projection proved the roster empty." />}
        {council?.seats && council.seats.length > 0 && (
          <div className="seat-grid">
            {council.seats.map((seat, index) => (
              <article className={`seat-row ${seat.active === false ? 'seat-row--inactive' : ''}`} key={seat.id}>
                <span className="seat-avatar" aria-hidden="true">{seat.name.slice(0, 1).toUpperCase()}</span>
                <div className="seat-row__identity">
                  <strong>{seat.name}</strong>
                  <span>{seat.role ?? 'Council lens'} · seat {String(index + 1).padStart(2, '0')}</span>
                </div>
                <p>{seat.lens ?? 'Lens description not included in this snapshot.'}</p>
                <div className="seat-row__meta">
                  <span>{seat.model ?? 'model unknown'}{seat.effort ? ` · ${seat.effort}` : ''}</span>
                  <span className={`decision-chip ${outcomeTone(seat.decision)}`}>{seat.decision ?? (seat.active === false ? 'not seated' : 'decision unknown')}</span>
                </div>
                {seat.rationale && <blockquote>{seat.rationale}</blockquote>}
              </article>
            ))}
          </div>
        )}
        {council && <PanelFooter source={council.source} effectiveAgeMs={age} note="Seat outputs are evidence, not self-reported product status" />}
      </section>

      <section className="panel decisions-panel" aria-labelledby="decisions-heading">
        <header className="panel-heading">
          <div><span className="eyebrow">Decision ledger</span><h2 id="decisions-heading">Recent admitted outcomes</h2></div>
          <span className="panel-heading__note">Current snapshot · not a complete historical journal</span>
        </header>
        {snapshot && (!council || council.decisions === null) && <StatusSurface kind="unavailable" title="Decision evidence unknown" detail="No complete Council decision collection was included." />}
        {council?.decisions?.length === 0 && <StatusSurface kind="empty" title="No decisions in this snapshot" detail="The authoritative collection is complete and empty." />}
        {council?.decisions && council.decisions.length > 0 && (
          <div className="decision-list">
            {council.decisions.map((decision) => {
              const url = safeExternalUrl(decision.url)
              return (
                <article className="decision-row" key={decision.id}>
                  <div className="decision-row__id">
                    <span>{decision.issueNumber ? `#${decision.issueNumber}` : 'proposal'}</span>
                    <small>{formatTimestamp(decision.decidedAt)}</small>
                  </div>
                  <div className="decision-row__main">
                    <strong>{decision.title}</strong>
                    <p>{decision.summary ?? 'No decision summary included.'}</p>
                  </div>
                  <div className="decision-row__facts">
                    <span className={`decision-chip ${outcomeTone(decision.outcome)}`}>{decision.outcome ?? 'unknown'}</span>
                    <span>{decision.phase ?? 'phase unknown'} · round {decision.round ?? 'unknown'}</span>
                    <span>agreement {decision.approvals === null || decision.total === null ? 'unknown' : `${decision.approvals}/${decision.total}`}</span>
                  </div>
                  {url && <a className="icon-button" href={url} target="_blank" rel="noreferrer" aria-label={`Open evidence for ${decision.title}`}><ExternalIcon /></a>}
                </article>
              )
            })}
          </div>
        )}
        {council && <PanelFooter source={council.source} effectiveAgeMs={age} note="Polling can miss decisions between snapshots" />}
      </section>
    </div>
  )
}
