import { formatAge, formatTimestamp, safeExternalUrl } from '../lib/format'
import type { IssueSnapshot, SourceMeta } from '../types/snapshot'
import { CheckIcon, ExternalIcon } from './Icons'
import { ModalShell } from './ModalShell'

interface IssueModalProps {
  issue: IssueSnapshot
  source: SourceMeta
  onClose: () => void
}

function factValue(value: string | number | boolean | null): string {
  if (value === null) return 'unknown'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

export function IssueModal({ issue, source, onClose }: IssueModalProps) {
  const issueUrl = safeExternalUrl(issue.url)
  const pullRequestUrl = safeExternalUrl(issue.pullRequestUrl)
  return (
    <ModalShell title={issue.title} label={`Work detail · #${issue.number}`} onClose={onClose} width="wide">
      <div className="issue-modal__summary">
        <span className={`state-chip state-chip--${issue.stage}`}>{issue.state}</span>
        <span>{issue.repository ?? 'repository unknown'}</span>
        <span>{issue.stage}</span>
        <span>{issue.pullRequestNumber ? `PR #${issue.pullRequestNumber}` : 'PR unknown'}</span>
        <span>CI {issue.ci ?? 'unknown'}</span>
        <span>{formatAge(issue.ageMs)}</span>
      </div>

      <div className="issue-modal__grid">
        <section className="detail-section" aria-labelledby="evidence-heading">
          <div className="section-heading">
            <span className="eyebrow">Evidence</span>
            <h3 id="evidence-heading">Trusted transition carriers</h3>
          </div>
          {issue.evidence.length > 0 ? (
            <ol className="timeline">
              {issue.evidence.map((marker, index) => (
                <li className={index === issue.evidence.length - 1 ? 'timeline__item timeline__item--current' : 'timeline__item'} key={`${marker.schema}-${marker.createdAt ?? index}`}>
                  <span className="timeline__node" aria-hidden="true" />
                  <div className="timeline__content">
                    <div className="timeline__title">
                      <code>{marker.state ?? marker.decision ?? marker.schema}</code>
                      <span>{formatTimestamp(marker.createdAt)}</span>
                    </div>
                    <p>{marker.summary ?? `${marker.schema} · version ${marker.version ?? 'unknown'} · rank ${factValue(marker.stageRank)}`}</p>
                    <small>{marker.trusted === false ? 'Not admitted as trusted fact' : `Trusted author ${marker.author ?? 'unknown'}`}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="detail-empty">No marker carriers were included in this snapshot. Current state remains the projection’s claim; history is unknown.</p>
          )}
        </section>

        <aside className="issue-modal__aside">
          <section className="detail-section detail-section--compact" aria-labelledby="council-summary-heading">
            <div className="section-heading">
              <span className="eyebrow">Council</span>
              <h3 id="council-summary-heading">Decision at this stage</h3>
            </div>
            {issue.council ? (
              <dl className="fact-list">
                <div><dt>Mechanism</dt><dd>{issue.council.phase ?? 'unknown'}</dd></div>
                <div><dt>Outcome</dt><dd>{issue.council.outcome ?? 'unknown'}</dd></div>
                <div><dt>Round</dt><dd>{factValue(issue.council.round)}</dd></div>
                <div><dt>Agreement</dt><dd>{issue.council.approvals === null || issue.council.total === null ? 'unknown' : `${issue.council.approvals}/${issue.council.total}`}</dd></div>
              </dl>
            ) : <p className="detail-empty">Council evidence not included for this work item.</p>}
          </section>

          <section className="detail-section detail-section--compact" aria-labelledby="gate-heading">
            <div className="section-heading">
              <span className="eyebrow">Merge gate</span>
              <h3 id="gate-heading">Machine facts, not a control</h3>
            </div>
            {issue.mergeGate ? (
              <dl className="gate-list">
                <div><dt><CheckIcon /> CI</dt><dd>{issue.mergeGate.ci}</dd></div>
                <div><dt><CheckIcon /> Review</dt><dd>{issue.mergeGate.review}</dd></div>
                <div><dt><CheckIcon /> Head-bound</dt><dd>{factValue(issue.mergeGate.headBound)}</dd></div>
                <div><dt><CheckIcon /> Mergeable</dt><dd>{factValue(issue.mergeGate.mergeable)}</dd></div>
                <div><dt>Target</dt><dd>{issue.mergeGate.target ?? 'unknown'}</dd></div>
                <div><dt>Posture</dt><dd>{issue.mergeGate.posture ?? 'unknown'}</dd></div>
              </dl>
            ) : <p className="detail-empty">Not at a proven merge gate, or gate facts were not included.</p>}
          </section>
        </aside>
      </div>

      <div className="provenance-callout">
        <div><span className="eyebrow">Provenance rule</span><strong>Markers are facts. Labels are hints.</strong></div>
        <p>Authority: {source.authority} · {source.artifact}. This is current projected state, not an authoritative historical timeline.</p>
      </div>

      <footer className="modal__actions">
        <span className="modal__context">No engine controls or per-goal mutation exists here.</span>
        {issueUrl && <a className="button button--secondary" href={issueUrl} target="_blank" rel="noreferrer">Open issue <ExternalIcon /></a>}
        {pullRequestUrl && <a className="button button--secondary" href={pullRequestUrl} target="_blank" rel="noreferrer">Open PR <ExternalIcon /></a>}
      </footer>
    </ModalShell>
  )
}
