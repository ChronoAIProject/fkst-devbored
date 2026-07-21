export type SnapshotMode = 'fixture' | 'live'
export type Availability = 'available' | 'unavailable' | 'unknown'
export type WorkStage = 'design' | 'build' | 'review' | 'ship' | 'complete' | 'attention'
export type PullRequestLane = 'open' | 'review' | 'gate' | 'held' | 'merged'

export interface SourceMeta {
  authority: string
  artifact: string
  generatedAt: string | null
  ageMs: number | null
  availability: Availability
  partial: boolean
}

export interface EvidenceMarker {
  schema: 'state:v1' | 'review-result:v1' | 'merge-ready:v1' | 'unknown'
  state: string | null
  decision: string | null
  version: string | null
  stageRank: number | null
  createdAt: string | null
  author: string | null
  trusted: boolean | null
  summary: string | null
}

export interface MergeGate {
  ci: 'pass' | 'fail' | 'pending' | 'unknown'
  review: 'approve' | 'reject' | 'pending' | 'unknown'
  headBound: boolean | null
  mergeable: boolean | null
  target: string | null
  posture: string | null
}

export interface CouncilSummary {
  phase: string | null
  outcome: string | null
  round: number | null
  approvals: number | null
  total: number | null
  summary: string | null
}

export interface IssueSnapshot {
  number: number
  title: string
  repository: string | null
  url: string | null
  body: string | null
  state: string
  stage: WorkStage
  stageRank: number | null
  updatedAt: string | null
  ageMs: number | null
  labels: readonly string[]
  pullRequestNumber: number | null
  pullRequestUrl: string | null
  ci: string | null
  evidence: readonly EvidenceMarker[]
  council: CouncilSummary | null
  mergeGate: MergeGate | null
}

export interface PullRequestSnapshot {
  number: number
  title: string
  repository: string | null
  url: string | null
  issueNumber: number | null
  state: string
  lane: PullRequestLane
  headSha: string | null
  ci: string | null
  reviewDecision: string | null
  updatedAt: string | null
  ageMs: number | null
}

export interface CouncilSeat {
  id: string
  name: string
  lens: string | null
  model: string | null
  effort: string | null
  role: string | null
  decision: string | null
  rationale: string | null
  active: boolean | null
}

export interface CouncilDecision {
  id: string
  issueNumber: number | null
  title: string
  phase: string | null
  outcome: string | null
  round: number | null
  approvals: number | null
  total: number | null
  summary: string | null
  decidedAt: string | null
  url: string | null
}

export interface CouncilContribution {
  seatId: string
  executionStatus: string | null
  verdict: string | null
  evidenceRef: string | null
}

export interface CouncilRound {
  number: number | null
  decision: string | null
  stageComplete: boolean | null
  dissent: readonly string[] | null
  contributions: readonly CouncilContribution[] | null
}

export interface CouncilSnapshot {
  seats: readonly CouncilSeat[] | null
  decisions: readonly CouncilDecision[] | null
  round: CouncilRound | null
  source: SourceMeta
}

export interface RuntimeDelivery {
  id: string
  queue: string | null
  state: string | null
  attempts: number | null
  updatedAt: string | null
}

export interface RuntimeSnapshot {
  healthVerdict: string | null
  healthVerbatim: string | null
  subscriberStatus: string | null
  queueDepth: number | null
  deadLetterCount: number | null
  deliveries: readonly RuntimeDelivery[] | null
  historySemantics: string | null
  deliverySemantics: string | null
  source: SourceMeta
}

export interface WritePosture {
  label: string
  writesEnabled: boolean | null
  issueCreationEnabled: boolean | null
  actor: string | null
  repository: string | null
  reason: string | null
}

export interface SnapshotV1 {
  schema: string
  mode: SnapshotMode
  generatedAt: string | null
  capturedAt: string | null
  ageMs: number | null
  issues: readonly IssueSnapshot[] | null
  pullRequests: readonly PullRequestSnapshot[] | null
  githubSource: SourceMeta
  council: CouncilSnapshot | null
  runtime: RuntimeSnapshot | null
  posture: WritePosture
}

export interface SnapshotParseResult {
  ok: boolean
  snapshot: SnapshotV1 | null
  error: string | null
}
