import { useMemo, useState } from 'react'

import { effectiveAgeMs, sortIssuesByRank } from '../lib/snapshot'
import { formatAge, safeExternalUrl, shortSha } from '../lib/format'
import type { SnapshotV1, IssueSnapshot, WorkStage, PullRequestLane, SnapshotMode, WritePosture } from '../types/snapshot'
import type { TransportState } from '../hooks/useSnapshot'
import { IssueIcon, PullRequestIcon, ExternalIcon } from '../components/Icons'
import { IssueModal } from '../components/IssueModal'
import { PanelFooter } from '../components/PanelFooter'
import { StatusSurface } from '../components/StatusSurface'

interface OverviewProps {
  snapshot: SnapshotV1 | null
  mode: SnapshotMode
  posture: WritePosture
  transport: TransportState
  error: string | null
  nowMs: number
  onRetry: () => void
}

const ISSUE_STAGES: readonly { key: WorkStage; label: string; description: string }[] = [
  { key: 'design', label: 'Design', description: 'Intake + consensus' },
  { key: 'build', label: 'Build', description: 'Implementation' },
  { key: 'review', label: 'Review', description: 'PR + adversarial gate' },
  { key: 'ship', label: 'Ship', description: 'Merge-ready holds' },
  { key: 'complete', label: 'Complete', description: 'Terminal good' },
  { key: 'attention', label: 'Attention', description: 'Unknown or terminal bad' },
]

const PR_LANES: readonly { key: PullRequestLane; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'review', label: 'In review' },
  { key: 'gate', label: 'At gate' },
  { key: 'held', label: 'Held' },
  { key: 'merged', label: 'Merged' },
]

function IssueCard({ issue, onOpen }: { issue: IssueSnapshot; onOpen: () => void }) {
  return (
    <button className="work-card" type="button" onClick={onOpen} aria-label={`Open issue ${issue.number}: ${issue.title}`}>
      <span className="work-card__top">
        <span className="mono-id"><IssueIcon /> #{issue.number}</span>
        <span className={`state-chip state-chip--${issue.stage}`}>{issue.state}</span>
      </span>
      <strong>{issue.title}</strong>
      <span className="work-card__meta">
        <span>{issue.repository ?? 'repo unknown'}</span>
        <span>{issue.pullRequestNumber ? `PR #${issue.pullRequestNumber}` : 'PR unknown'}</span>
        <span>{formatAge(issue.ageMs)}</span>
      </span>
      {issue.labels.length > 0 && <span className="hint-chip">label hint · {issue.labels[0]}</span>}
    </button>
  )
}

function disconnectedSurface(error: string | null, onRetry: () => void) {
  return <StatusSurface kind="disconnected" title="Source disconnected" detail={error ?? 'No validated snapshot is available. Counts and states remain unknown.'} onRetry={onRetry} />
}

export function Overview({ snapshot, mode, posture, transport, error, nowMs, onRetry }: OverviewProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueSnapshot | null>(null)
  const sortedIssues = useMemo(() => snapshot?.issues ? sortIssuesByRank(snapshot.issues) : null, [snapshot])
  const githubAge = snapshot ? effectiveAgeMs(snapshot.githubSource, snapshot, nowMs) : null

  return (
    <div className="page page--overview">
      <header className="page-intro">
        <div>
          <span className="eyebrow">Primary mechanism · Workflow</span>
          <h1>Observe the development loop</h1>
          <p>Follow trusted GitHub work state through Council decisions and into Runtime delivery evidence. This console observes the loop; it does not control it.</p>
          <ol className="loop-explainer" aria-label="How the observed development loop fits together">
            <li className="loop-explainer__item loop-explainer__item--primary"><span>01</span><div><strong>Workflow</strong><small>Business state</small></div></li>
            <li className="loop-explainer__item"><span>02</span><div><strong>Council</strong><small>Decision evidence</small></div></li>
            <li className="loop-explainer__item"><span>03</span><div><strong>Runtime</strong><small>Delivery evidence</small></div></li>
          </ol>
        </div>
        <div className="page-intro__facts" aria-label="Snapshot context">
          <span><b>Data</b> {mode === 'fixture' ? 'Recorded fixture' : 'Live local'}</span>
          <span><b>Writes</b> {posture.label}</span>
          <span><b>Work</b> {snapshot?.issues === null || !snapshot ? 'unknown' : `${snapshot.issues.length} issues`} · {snapshot?.pullRequests === null || !snapshot ? 'unknown' : `${snapshot.pullRequests.length} PRs`}</span>
          <span><b>As of</b> {formatAge(githubAge)}</span>
        </div>
      </header>

      {transport === 'disconnected' && snapshot && (
        <div className="inline-alert" role="alert"><span>Event stream disconnected</span><p>{error} Last admitted snapshot remains visible at its original age.</p></div>
      )}

      <section className="panel board-panel" aria-labelledby="issue-board-heading">
        <header className="panel-heading">
          <div>
            <span className="eyebrow">Issue lanes</span>
            <h2 id="issue-board-heading">Evidence-gated work</h2>
          </div>
          <span className="panel-heading__note">Ordered by <code>state_stage_rank</code>, never label order</span>
        </header>

        {transport === 'loading' && !snapshot && <StatusSurface kind="loading" title="Reading trusted projections" detail="Loading /fixtures/snapshot.v1.json or GET /api/v1/snapshot." />}
        {transport === 'disconnected' && !snapshot && disconnectedSurface(error, onRetry)}
        {snapshot && sortedIssues === null && <StatusSurface kind="unavailable" title="Issue authority unknown" detail="The snapshot did not include a validated GitHub issue collection. Unknown is not rendered as zero." />}
        {snapshot && sortedIssues?.length === 0 && <StatusSurface kind="empty" title="No admitted work" detail="The authoritative read completed and proved the current issue collection empty." />}
        {snapshot && sortedIssues && sortedIssues.length > 0 && (
          <div className="board-scroll" tabIndex={0} aria-label="Issue board; scroll horizontally on narrow screens">
            <div className="issue-board">
              {ISSUE_STAGES.map((stage) => {
                const issues = sortedIssues.filter((issue) => issue.stage === stage.key)
                return (
                  <section className={`board-column board-column--${stage.key}`} key={stage.key} aria-labelledby={`stage-${stage.key}`}>
                    <header className="board-column__heading">
                      <div><h3 id={`stage-${stage.key}`}>{stage.label}</h3><span>{stage.description}</span></div>
                      <strong>{issues.length}</strong>
                    </header>
                    <div className="board-column__cards">
                      {issues.map((issue) => <IssueCard issue={issue} onOpen={() => setSelectedIssue(issue)} key={issue.number} />)}
                      {issues.length === 0 && <div className="column-empty">No current work</div>}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
        {snapshot && <PanelFooter source={snapshot.githubSource} effectiveAgeMs={githubAge} note="Current state only · labels shown as hints" />}
      </section>

      <section className="panel pr-panel" aria-labelledby="pr-lane-heading">
        <header className="panel-heading">
          <div>
            <span className="eyebrow">Pull request lane</span>
            <h2 id="pr-lane-heading">Review and merge evidence</h2>
          </div>
          <span className="panel-heading__note">No approve, merge, close, or retry controls</span>
        </header>
        {transport === 'loading' && !snapshot && <StatusSurface kind="loading" title="Reading pull requests" detail="Waiting for the shared snapshot." />}
        {transport === 'disconnected' && !snapshot && disconnectedSurface(error, onRetry)}
        {snapshot && snapshot.pullRequests === null && <StatusSurface kind="unavailable" title="Pull request authority unknown" detail="No complete PR collection was admitted into this snapshot." />}
        {snapshot?.pullRequests?.length === 0 && <StatusSurface kind="empty" title="No pull requests" detail="The authoritative read completed and proved the current PR collection empty." />}
        {snapshot?.pullRequests && snapshot.pullRequests.length > 0 && (
          <div className="pr-lanes">
            {PR_LANES.map((lane) => {
              const pulls = snapshot.pullRequests?.filter((pull) => pull.lane === lane.key) ?? []
              return (
                <section className={`pr-lane pr-lane--${lane.key}`} key={lane.key}>
                  <header><span>{lane.label}</span><strong>{pulls.length}</strong></header>
                  <div className="pr-lane__rows">
                    {pulls.map((pull) => {
                      const url = safeExternalUrl(pull.url)
                      const content = <><span className="mono-id"><PullRequestIcon /> #{pull.number}</span><strong>{pull.title}</strong><span className="pr-row__meta">{pull.ci ?? 'CI unknown'} · {shortSha(pull.headSha)} · {formatAge(pull.ageMs)}</span>{url && <ExternalIcon className="pr-row__external" />}</>
                      return url
                        ? <a className="pr-row" href={url} target="_blank" rel="noreferrer" key={pull.number}>{content}</a>
                        : <div className="pr-row" key={pull.number}>{content}</div>
                    })}
                    {pulls.length === 0 && <span className="pr-lane__empty">No current PRs</span>}
                  </div>
                </section>
              )
            })}
          </div>
        )}
        {snapshot && <PanelFooter source={snapshot.githubSource} effectiveAgeMs={githubAge} note="review-result:v1 + merge-ready:v1 evidence" />}
      </section>

      <section className="truth-strip" aria-label="Authority model">
        <div><span className="eyebrow">Business truth</span><strong>Trusted GitHub markers</strong><p><code>state:v1</code> decides stage. Labels are lossy self-heal hints.</p></div>
        <div><span className="eyebrow">Decision truth</span><strong>Council evidence</strong><p>Independent seats deliberate. Review rejects require the reader-valid fix round.</p></div>
        <div><span className="eyebrow">Delivery truth</span><strong>Substrate ledger</strong><p>Queue and DLQ facts describe engine delivery, never work progress.</p></div>
      </section>

      {selectedIssue && snapshot && <IssueModal issue={selectedIssue} source={snapshot.githubSource} onClose={() => setSelectedIssue(null)} />}
    </div>
  )
}
