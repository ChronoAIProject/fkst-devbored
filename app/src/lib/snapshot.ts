import type {
  Availability,
  CouncilDecision,
  CouncilContribution,
  CouncilRound,
  CouncilSeat,
  CouncilSnapshot,
  CouncilSummary,
  EvidenceMarker,
  IssueSnapshot,
  MergeGate,
  PullRequestLane,
  PullRequestSnapshot,
  RuntimeDelivery,
  RuntimeSnapshot,
  SnapshotMode,
  SnapshotParseResult,
  SnapshotV1,
  SourceMeta,
  WorkStage,
  WritePosture,
} from '../types/snapshot'

type UnknownRecord = Record<string, unknown>

const KNOWN_SCHEMAS = new Set([
  'snapshot.v1',
  'fkst-console.snapshot.v1',
  'fkst.console.snapshot.v1',
  'fkst.console.snapshot.v1.json',
])

const STATE_STAGE_RANK: Readonly<Record<string, number>> = {
  thinking: 100,
  ready: 400,
  dependency_wait: 450,
  implementing: 600,
  'awaiting-pr': 625,
  'pr-open': 650,
  reviewing: 700,
  'review-meta': 725,
  'merge-ready': 800,
  merged: 1000,
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pick(record: UnknownRecord | null, keys: readonly string[]): unknown {
  if (!record) return undefined
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key]
  }
  return undefined
}

function recordAt(record: UnknownRecord | null, keys: readonly string[]): UnknownRecord | null {
  const value = pick(record, keys)
  return isRecord(value) ? value : null
}

function stringAt(record: UnknownRecord | null, keys: readonly string[]): string | null {
  const value = pick(record, keys)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function rawStringAt(record: UnknownRecord | null, keys: readonly string[]): string | null {
  const value = pick(record, keys)
  return typeof value === 'string' ? value : null
}

function numberAt(record: UnknownRecord | null, keys: readonly string[]): number | null {
  const value = pick(record, keys)
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function integerAt(record: UnknownRecord | null, keys: readonly string[]): number | null {
  const value = numberAt(record, keys)
  return value !== null && Number.isSafeInteger(value) ? value : null
}

function booleanAt(record: UnknownRecord | null, keys: readonly string[]): boolean | null {
  const value = pick(record, keys)
  return typeof value === 'boolean' ? value : null
}

function arrayAt(record: UnknownRecord | null, keys: readonly string[]): readonly unknown[] | null {
  const value = pick(record, keys)
  return Array.isArray(value) ? value : null
}

function partialFlag(record: UnknownRecord | null): boolean {
  if (!record) return false
  if (booleanAt(record, ['partial', 'is_partial']) === true) return true
  const truncation = pick(record, ['truncated', 'truncation'])
  if (truncation === true) return true
  if (isRecord(truncation) && Object.values(truncation).some((value) => value === true)) return true
  const completeness = recordAt(record, ['completeness'])
  return completeness !== null && Object.values(completeness).some((value) => value === 'partial')
}

interface ProjectionCollectionInput {
  values: readonly unknown[] | null
  source: UnknownRecord | null
  malformed: boolean
}

function projectionCollectionAt(
  payload: UnknownRecord,
  keys: readonly string[],
  boardKeys: readonly string[],
): ProjectionCollectionInput {
  const direct = pick(payload, keys)
  const boardValue = direct === undefined ? pick(recordAt(payload, ['board']), boardKeys) : undefined
  const value = direct ?? boardValue
  if (value === undefined || value === null) return { values: null, source: null, malformed: false }
  if (Array.isArray(value)) return { values: value, source: null, malformed: false }
  if (!isRecord(value)) return { values: null, source: null, malformed: true }

  const items = pick(value, ['items'])
  const availability = stringAt(value, ['availability'])
  const count = pick(value, ['count'])
  const values = Array.isArray(items) ? items : null
  const malformedItems = items !== undefined && items !== null && !Array.isArray(items)
  const missingAvailableItems = availability === 'available' && values === null
  const malformedCount = count !== undefined
    && count !== null
    && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)
  const mismatchedCount = typeof count === 'number' && values !== null && count !== values.length
  return {
    values,
    source: value,
    malformed: malformedItems || missingAvailableItems || malformedCount || mismatchedCount,
  }
}

interface ParsedCollection<T> {
  items: readonly T[] | null
  malformed: boolean
}

function parseStrictCollection<T>(
  values: readonly unknown[] | null,
  parser: (value: unknown, index: number) => T | null,
): ParsedCollection<T> {
  if (values === null) return { items: null, malformed: false }
  const parsed = values.map(parser)
  const items = parsed.filter((item): item is T => item !== null)
  return items.length === parsed.length
    ? { items, malformed: false }
    : { items: null, malformed: true }
}

function aggregateAvailability(
  records: readonly (UnknownRecord | null)[],
  fallback: Availability,
): Availability {
  const declarations = records
    .map((record) => stringAt(record, ['availability']))
    .filter((value): value is Availability => value === 'available' || value === 'unavailable' || value === 'unknown')
  if (declarations.length === 0) return fallback
  if (declarations.every((value) => value === 'available')) return 'available'
  if (declarations.every((value) => value === 'unavailable')) return 'unavailable'
  return 'unknown'
}

function parseDateMs(value: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function deriveAgeMs(
  explicitAge: number | null,
  generatedAt: string | null,
  capturedAt: string | null,
  nowMs: number,
): number | null {
  if (explicitAge !== null) return explicitAge
  const sourceMs = parseDateMs(generatedAt) ?? parseDateMs(capturedAt)
  return sourceMs === null ? null : Math.max(0, nowMs - sourceMs)
}

function normalizeMode(value: string | null, fallbackMode?: SnapshotMode): SnapshotMode {
  if (value === 'fixture' || value === 'demo' || value === 'recorded') return 'fixture'
  if (value === 'live') return 'live'
  return fallbackMode ?? 'live'
}

function normalizeAvailability(value: string | null, hasData: boolean): Availability {
  if (value === 'available' || value === 'unavailable' || value === 'unknown') return value
  return hasData ? 'available' : 'unknown'
}

export function stageForState(stateValue: string | null): WorkStage {
  const state = (stateValue ?? '').toLowerCase()
  if (['thinking', 'ready', 'dependency_wait', 'design', 'intake'].includes(state)) return 'design'
  if (['implementing', 'awaiting-pr', 'build'].includes(state)) return 'build'
  if (['pr-open', 'reviewing', 'review-meta', 'fixing', 'review'].includes(state)) return 'review'
  if (['merge-ready', 'ship'].includes(state)) return 'ship'
  if (['merged', 'complete', 'completed'].includes(state)) return 'complete'
  return 'attention'
}

function normalizeStage(value: string | null, state: string): WorkStage {
  const normalized = value?.toLowerCase()
  if (normalized && ['design', 'build', 'review', 'ship', 'complete', 'attention'].includes(normalized)) {
    return normalized as WorkStage
  }
  return stageForState(state)
}

function normalizePullRequestLane(value: string | null, stateValue: string | null): PullRequestLane {
  const state = (value ?? stateValue ?? '').toLowerCase()
  if (['review', 'reviewing', 'changes-requested'].includes(state)) return 'review'
  if (['gate', 'merge-ready', 'ready'].includes(state)) return 'gate'
  if (['held', 'blocked', 'closed-unmerged', 'checks-failed'].includes(state)) return 'held'
  if (['merged', 'complete'].includes(state)) return 'merged'
  return 'open'
}

function parseSourceMeta(
  sourceRecord: UnknownRecord | null,
  defaults: Pick<SourceMeta, 'authority' | 'artifact'>,
  snapshotAgeMs: number | null,
  hasData: boolean,
): SourceMeta {
  return {
    authority: stringAt(sourceRecord, ['authority']) ?? defaults.authority,
    artifact: stringAt(sourceRecord, ['artifact', 'source', 'schema']) ?? defaults.artifact,
    generatedAt: stringAt(sourceRecord, ['generated_at', 'generatedAt', 'as_of', 'asOf', 'acquired_at']),
    ageMs: numberAt(sourceRecord, ['age_ms', 'ageMs', 'snapshot_age_ms']) ?? snapshotAgeMs,
    availability: normalizeAvailability(stringAt(sourceRecord, ['availability']), hasData),
    partial: booleanAt(sourceRecord, ['partial', 'is_partial']) ?? false,
  }
}

function parseEvidence(value: unknown): EvidenceMarker | null {
  if (!isRecord(value)) return null
  const schemaValue = stringAt(value, ['schema', 'kind', 'type']) ?? 'unknown'
  const schema = schemaValue.includes('state:v1')
    ? 'state:v1'
    : schemaValue.includes('review-result:v1')
      ? 'review-result:v1'
      : schemaValue.includes('merge-ready:v1')
        ? 'merge-ready:v1'
        : 'unknown'
  return {
    schema,
    state: stringAt(value, ['state']),
    decision: stringAt(value, ['decision', 'outcome']),
    version: stringAt(value, ['version']),
    stageRank: integerAt(value, ['stage_rank', 'stageRank']),
    createdAt: stringAt(value, ['created_at', 'createdAt', 'comment_created_at', 'updated_at']),
    author: stringAt(value, ['author', 'author_login', 'login']),
    trusted: booleanAt(value, ['trusted', 'is_trusted']),
    summary: rawStringAt(value, ['summary', 'gap', 'detail']),
  }
}

function normalizedLogin(value: string): string {
  return value.trim().toLowerCase().replace(/\[bot\]$/u, '')
}

function parseTrustedMarkerEvidence(payload: UnknownRecord): ReadonlyMap<number, readonly EvidenceMarker[]> {
  const markers = recordAt(payload, ['markers'])
  const comments = arrayAt(markers, ['comments'])
  const trustedAuthorValues = arrayAt(markers, ['trusted_authors'])
  if (!comments || !trustedAuthorValues) return new Map()
  const trustedAuthors = new Set(
    trustedAuthorValues
      .filter((author): author is string => typeof author === 'string')
      .map(normalizedLogin),
  )
  const byIssue = new Map<number, EvidenceMarker[]>()
  const markerPattern = /<!-- fkst:github-devloop:(state|review-result|merge-ready):v1 ([^\r\n]*?)-->/gu
  const attributePattern = /([\w.-]+)="([^"]*)"/gu

  for (const candidate of comments) {
    if (!isRecord(candidate)) continue
    const author = stringAt(candidate, ['author_login', 'author', 'login'])
    const body = rawStringAt(candidate, ['body'])
    if (!author || body === null || !trustedAuthors.has(normalizedLogin(author))) continue
    for (const markerMatch of body.matchAll(markerPattern)) {
      const kind = markerMatch[1]
      const source = markerMatch[2]
      if (!kind || source === undefined) continue
      const attributes = new Map<string, string>()
      for (const attributeMatch of source.matchAll(attributePattern)) {
        const key = attributeMatch[1]
        const value = attributeMatch[2]
        if (key && value !== undefined) attributes.set(key, value)
      }
      const proposal = kind === 'review-result' ? attributes.get('issue_proposal') : attributes.get('proposal')
      const issueMatch = proposal?.match(/\/issue\/(\d+)(?:\/|$)/u)
      const issueNumber = issueMatch?.[1] ? Number(issueMatch[1]) : Number.NaN
      if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) continue
      const stageRankValue = attributes.get('stage_rank')
      const stageRank = stageRankValue && /^\d+$/u.test(stageRankValue) ? Number(stageRankValue) : null
      const summary = kind === 'review-result'
        ? `Review result: ${attributes.get('decision') ?? 'unknown'}${attributes.get('gap') ? ` · ${attributes.get('gap')}` : ''}`
        : kind === 'merge-ready'
          ? `Head ${(attributes.get('head_sha') ?? 'unknown').slice(0, 8)} bound to PR #${attributes.get('pr') ?? 'unknown'}`
          : `State projection · stage rank ${stageRank ?? 'unknown'}`
      const marker: EvidenceMarker = {
        schema: `${kind}:v1` as EvidenceMarker['schema'],
        state: attributes.get('state') ?? null,
        decision: attributes.get('decision') ?? null,
        version: attributes.get('version') ?? null,
        stageRank,
        createdAt: stringAt(candidate, ['created_at', 'createdAt']),
        author,
        trusted: true,
        summary,
      }
      const existing = byIssue.get(issueNumber) ?? []
      byIssue.set(issueNumber, [...existing, marker])
    }
  }
  return byIssue
}

function parseMergeGate(value: unknown): MergeGate | null {
  if (!isRecord(value)) return null
  const normalizeCheck = (input: string | null): MergeGate['ci'] => {
    const normalized = input?.toLowerCase()
    if (normalized && ['pass', 'passed', 'success', 'green'].includes(normalized)) return 'pass'
    if (normalized && ['fail', 'failed', 'failure', 'red'].includes(normalized)) return 'fail'
    if (normalized && ['pending', 'running', 'queued'].includes(normalized)) return 'pending'
    return 'unknown'
  }
  const normalizeReview = (input: string | null): MergeGate['review'] => {
    const normalized = input?.toLowerCase()
    if (normalized && ['approve', 'approved'].includes(normalized)) return 'approve'
    if (normalized && ['reject', 'rejected', 'changes-requested'].includes(normalized)) return 'reject'
    if (normalized && ['pending', 'reviewing'].includes(normalized)) return 'pending'
    return 'unknown'
  }
  return {
    ci: normalizeCheck(stringAt(value, ['ci', 'ci_status', 'checks'])),
    review: normalizeReview(stringAt(value, ['review', 'review_decision', 'decision'])),
    headBound: booleanAt(value, ['head_bound', 'headBound']),
    mergeable: booleanAt(value, ['mergeable']),
    target: stringAt(value, ['target', 'base', 'integration_branch']),
    posture: stringAt(value, ['posture', 'write_posture']),
  }
}

function parseCouncilSummary(value: unknown): CouncilSummary | null {
  if (!isRecord(value)) return null
  return {
    phase: stringAt(value, ['phase', 'stage']),
    outcome: stringAt(value, ['outcome', 'decision']),
    round: integerAt(value, ['round']),
    approvals: integerAt(value, ['approvals', 'approve_count', 'seats_for']),
    total: integerAt(value, ['total', 'seat_count', 'seats_total']),
    summary: rawStringAt(value, ['summary', 'rationale']),
  }
}

function parseIssue(value: unknown, nowMs: number): IssueSnapshot | null {
  if (!isRecord(value)) return null
  const number = integerAt(value, ['number', 'issue_number', 'id'])
  const title = stringAt(value, ['title'])
  const stateRecord = recordAt(value, ['state'])
  const state = stringAt(value, ['state', 'marker_state', 'status']) ?? stringAt(stateRecord, ['name', 'state'])
  if (number === null || number < 1 || !title || !state) return null
  const updatedAt = stringAt(value, ['updated_at', 'updatedAt', 'state_updated_at'])
  const labelsValue = arrayAt(value, ['labels'])
  const labels = labelsValue
    ? labelsValue.flatMap((label) => {
        if (typeof label === 'string') return [label]
        if (isRecord(label)) return stringAt(label, ['name']) ? [stringAt(label, ['name']) as string] : []
        return []
      })
    : []
  const evidenceValue = arrayAt(value, ['evidence', 'markers', 'timeline'])
  const evidence = evidenceValue ? evidenceValue.map(parseEvidence).filter((item): item is EvidenceMarker => item !== null) : []
  const explicitRank = integerAt(value, ['stage_rank', 'stageRank']) ?? integerAt(stateRecord, ['stage_rank', 'stageRank'])
  return {
    number,
    title,
    repository: stringAt(value, ['repository', 'repo']),
    url: stringAt(value, ['url', 'html_url', 'issue_url']),
    body: rawStringAt(value, ['body', 'description']),
    state,
    stage: normalizeStage(stringAt(value, ['stage', 'lane']) ?? stringAt(stateRecord, ['stage']), state),
    stageRank: explicitRank ?? STATE_STAGE_RANK[state] ?? null,
    updatedAt,
    ageMs: deriveAgeMs(numberAt(value, ['age_ms', 'ageMs']), updatedAt, null, nowMs),
    labels,
    pullRequestNumber: integerAt(value, ['pull_request_number', 'pr_number', 'pr']),
    pullRequestUrl: stringAt(value, ['pull_request_url', 'pr_url']),
    ci: stringAt(value, ['ci', 'ci_status', 'checks']),
    evidence,
    council: parseCouncilSummary(pick(value, ['council', 'decision', 'consensus'])),
    mergeGate: parseMergeGate(pick(value, ['merge_gate', 'mergeGate'])),
  }
}

function parsePullRequest(value: unknown, nowMs: number): PullRequestSnapshot | null {
  if (!isRecord(value)) return null
  const number = integerAt(value, ['number', 'pr_number', 'id'])
  const title = stringAt(value, ['title'])
  const state = stringAt(value, ['state', 'status'])
  if (number === null || number < 1 || !title || !state) return null
  const updatedAt = stringAt(value, ['updated_at', 'updatedAt'])
  const reviewRecord = recordAt(value, ['review'])
  const mergeReady = booleanAt(value, ['merge_ready', 'mergeReady'])
  return {
    number,
    title,
    repository: stringAt(value, ['repository', 'repo']),
    url: stringAt(value, ['url', 'html_url', 'pr_url']),
    issueNumber: integerAt(value, ['issue_number', 'issue']),
    state,
    lane: mergeReady === true ? 'gate' : normalizePullRequestLane(stringAt(value, ['lane', 'stage']), state),
    headSha: stringAt(value, ['head_sha', 'headSha', 'sha']),
    ci: stringAt(value, ['ci', 'ci_status', 'checks']),
    reviewDecision: stringAt(value, ['review_decision', 'decision']) ?? stringAt(reviewRecord, ['decision', 'outcome']),
    updatedAt,
    ageMs: deriveAgeMs(numberAt(value, ['age_ms', 'ageMs']), updatedAt, null, nowMs),
  }
}

function parseCouncilSeat(value: unknown, index: number): CouncilSeat | null {
  if (!isRecord(value)) return null
  const name = stringAt(value, ['name', 'display_name', 'seat', 'persona', 'id'])
  if (!name) return null
  return {
    id: stringAt(value, ['id', 'slug']) ?? `${name}-${index}`,
    name,
    lens: rawStringAt(value, ['lens', 'prompt', 'description']),
    model: stringAt(value, ['model']),
    effort: stringAt(value, ['effort', 'reasoning_effort']),
    role: stringAt(value, ['role', 'phase']),
    decision: stringAt(value, ['decision', 'vote', 'outcome']),
    rationale: rawStringAt(value, ['rationale', 'summary', 'comment']),
    active: booleanAt(value, ['active', 'seated']),
  }
}

function parseCouncilContribution(value: unknown): CouncilContribution | null {
  if (!isRecord(value)) return null
  const seatId = stringAt(value, ['seat_id', 'seatId'])
  if (!seatId) return null
  return {
    seatId,
    executionStatus: stringAt(value, ['execution_status', 'executionStatus', 'status']),
    verdict: stringAt(value, ['verdict', 'decision']),
    evidenceRef: stringAt(value, ['evidence_ref', 'evidenceRef']),
  }
}

function parseCouncilRound(value: unknown): CouncilRound | null {
  if (!isRecord(value)) return null
  const dissentValue = arrayAt(value, ['dissent'])
  const contributionsValue = arrayAt(value, ['contributions'])
  return {
    number: integerAt(value, ['number', 'round']),
    decision: stringAt(value, ['decision', 'outcome']),
    stageComplete: booleanAt(value, ['stage_complete', 'stageComplete']),
    dissent: dissentValue ? dissentValue.filter((item): item is string => typeof item === 'string') : null,
    contributions: contributionsValue
      ? contributionsValue.map(parseCouncilContribution).filter((item): item is CouncilContribution => item !== null)
      : null,
  }
}

function parseCouncilDecision(value: unknown, index: number): CouncilDecision | null {
  if (!isRecord(value)) return null
  const title = stringAt(value, ['title', 'issue_title', 'proposal'])
  if (!title) return null
  return {
    id: stringAt(value, ['id', 'proposal']) ?? `decision-${index}`,
    issueNumber: integerAt(value, ['issue_number', 'issue']),
    title,
    phase: stringAt(value, ['phase', 'stage']),
    outcome: stringAt(value, ['outcome', 'decision']),
    round: integerAt(value, ['round']),
    approvals: integerAt(value, ['approvals', 'approve_count', 'seats_for']),
    total: integerAt(value, ['total', 'seat_count', 'seats_total']),
    summary: rawStringAt(value, ['summary', 'rationale']),
    decidedAt: stringAt(value, ['decided_at', 'created_at', 'updated_at']),
    url: stringAt(value, ['url', 'issue_url']),
  }
}

function parseCouncil(
  value: unknown,
  sources: UnknownRecord | null,
  snapshotAgeMs: number | null,
): CouncilSnapshot | null {
  if (!isRecord(value)) return null
  const definition = recordAt(value, ['definition'])
  const round = parseCouncilRound(pick(value, ['round', 'current_round']))
  const seatsValue = arrayAt(value, ['seats', 'personas']) ?? arrayAt(definition, ['seats', 'personas'])
  const decisionsValue = arrayAt(value, ['decisions', 'recent_decisions', 'results'])
  const parsedSeats = seatsValue
    ? seatsValue.map(parseCouncilSeat).filter((seat): seat is CouncilSeat => seat !== null)
    : null
  const contributionBySeat = new Map(round?.contributions?.map((contribution) => [contribution.seatId, contribution]) ?? [])
  const seats = parsedSeats?.map((seat) => {
    const contribution = contributionBySeat.get(seat.id)
    return contribution ? { ...seat, decision: contribution.verdict, active: true } : seat
  }) ?? null
  const parsedDecisions = decisionsValue
    ? decisionsValue.map(parseCouncilDecision).filter((decision): decision is CouncilDecision => decision !== null)
    : null
  const syntheticDecision: CouncilDecision | null = round
    ? {
        id: `${stringAt(definition, ['id']) ?? 'council'}-round-${round.number ?? 'unknown'}`,
        issueNumber: null,
        title: `${stringAt(definition, ['name']) ?? 'Council'} · round ${round.number ?? 'unknown'}`,
        phase: stringAt(recordAt(definition, ['policy']), ['id']) ?? 'Council',
        outcome: round.decision,
        round: round.number,
        approvals: round.contributions?.filter((contribution) => contribution.verdict?.toLowerCase() === 'approve').length ?? null,
        total: round.contributions?.length ?? seats?.length ?? null,
        summary: round.dissent?.length ? `Recorded dissent: ${round.dissent.join(', ')}` : 'No recorded dissent.',
        decidedAt: null,
        url: null,
      }
    : null
  const decisions = parsedDecisions ?? (syntheticDecision ? [syntheticDecision] : null)
  const sourceRecord = recordAt(value, ['source', 'provenance']) ?? value ?? recordAt(sources, ['council'])
  return {
    seats,
    decisions,
    round,
    source: parseSourceMeta(
      sourceRecord,
      { authority: 'GitHub trusted comments', artifact: 'Council decision evidence' },
      snapshotAgeMs,
      seats !== null || decisions !== null,
    ),
  }
}

function parseRuntimeDelivery(value: unknown, index: number): RuntimeDelivery | null {
  if (!isRecord(value)) return null
  const id = stringAt(value, ['id', 'delivery_id'])
  if (!id) return null
  return {
    id: id || `delivery-${index}`,
    queue: stringAt(value, ['queue', 'queue_name']),
    state: stringAt(value, ['state', 'status']),
    attempts: integerAt(value, ['attempts', 'attempt_count', 'attempt']),
    updatedAt: stringAt(value, ['updated_at', 'created_at', 'available_at']),
  }
}

function parseRuntime(
  value: unknown,
  root: UnknownRecord,
  sources: UnknownRecord | null,
  snapshotAgeMs: number | null,
): RuntimeSnapshot | null {
  const runtime = isRecord(value) ? value : null
  const runtimeMalformed = value !== undefined && value !== null && runtime === null
  const healthValue = pick(runtime, ['health']) ?? pick(root, ['health'])
  const healthRecord = isRecord(healthValue) ? healthValue : null
  const healthString = typeof healthValue === 'string' ? healthValue : null
  const runtimeAvailability = stringAt(runtime, ['availability'])
  const runtimeAvailable = runtimeAvailability === 'available'
  const truncatedValue = pick(runtime, ['truncated'])
  const truncated = isRecord(truncatedValue) ? truncatedValue : null
  const deliveriesTruncatedValue = pick(truncated, ['deliveries'])
  const deadLettersTruncatedValue = pick(truncated, ['dead_letters', 'deadLetters'])
  const deliveriesTruncated = deliveriesTruncatedValue === true
  const deadLettersTruncated = deadLettersTruncatedValue === true
  const truncationMalformed = (truncatedValue !== undefined && truncatedValue !== null && truncated === null)
    || (deliveriesTruncatedValue !== undefined && typeof deliveriesTruncatedValue !== 'boolean')
    || (deadLettersTruncatedValue !== undefined && typeof deadLettersTruncatedValue !== 'boolean')

  const deliveriesRaw = pick(runtime, ['deliveries', 'current_deliveries'])
  const deliveriesValue = Array.isArray(deliveriesRaw) ? deliveriesRaw : null
  const parsedDeliveries = parseStrictCollection(deliveriesValue, parseRuntimeDelivery)
  const deliveriesMalformed = (deliveriesRaw !== undefined && deliveriesRaw !== null && deliveriesValue === null)
    || (runtimeAvailable && deliveriesValue === null)
    || parsedDeliveries.malformed
  const deliveries = deliveriesTruncated || deliveriesMalformed ? null : parsedDeliveries.items

  const hasRuntimeData = value !== undefined || healthValue !== undefined
  if (!hasRuntimeData) return null

  const queuesRaw = pick(runtime, ['queues'])
  const queues = Array.isArray(queuesRaw) ? queuesRaw : null
  const queueRecords = queues?.filter(isRecord) ?? null
  const queuesMalformed = (queuesRaw !== undefined && queuesRaw !== null && queues === null)
    || (runtimeAvailable && queues === null)
    || (queues !== null && queueRecords?.length !== queues.length)
  const queueDepths = queueRecords?.map((queue) => integerAt(queue, ['depth'])) ?? null
  const queueDepthsMalformed = queueDepths?.some((depth) => depth === null) ?? false

  const deadLettersRaw = pick(runtime, ['dead_letters', 'deadLetters'])
  const deadLetters = Array.isArray(deadLettersRaw) ? deadLettersRaw : null
  const malformedDeadLetterItems = deadLetters?.some((deadLetter) => !isRecord(deadLetter)) ?? false
  const deadLettersMalformed = (deadLettersRaw !== undefined && deadLettersRaw !== null && deadLetters === null)
    || (runtimeAvailable && deadLetters === null)
    || malformedDeadLetterItems
  const counts = recordAt(runtime, ['counts'])
  const declaredDeadLetterCountValue = pick(runtime, ['dead_letter_count', 'deadLetterCount', 'dlq_count'])
    ?? pick(counts, ['dead_letters', 'deadLetterCount'])
  const declaredDeadLetterCount = typeof declaredDeadLetterCountValue === 'number'
    && Number.isSafeInteger(declaredDeadLetterCountValue)
    && declaredDeadLetterCountValue >= 0
    ? declaredDeadLetterCountValue
    : null
  const deadLetterCountMalformed = declaredDeadLetterCountValue !== undefined
    && declaredDeadLetterCountValue !== null
    && declaredDeadLetterCount === null
  const deadLetterCountMismatch = declaredDeadLetterCount !== null
    && deadLetters !== null
    && declaredDeadLetterCount !== deadLetters.length
  const deadLetterResultsDamaged = deadLettersTruncated
    || deadLettersMalformed
    || deadLetterCountMalformed
    || deadLetterCountMismatch

  const subscriberStatuses = queueRecords
    ?.map((queue) => stringAt(queue, ['subscriber_status', 'subscriberStatus']))
    .filter((status): status is string => status !== null) ?? null
  const subscriberStatus = subscriberStatuses && subscriberStatuses.length > 0
    ? [...new Set(subscriberStatuses)].join(', ')
    : null
  const sourceRecord = runtime ?? recordAt(sources, ['runtime', 'engine'])
  const parsedSource = parseSourceMeta(
    sourceRecord,
    { authority: 'substrate', artifact: 'observe --json + health (verbatim)' },
    snapshotAgeMs,
    hasRuntimeData,
  )
  const source: SourceMeta = {
    ...parsedSource,
    availability: runtimeMalformed ? 'unknown' : parsedSource.availability,
    partial: parsedSource.partial
      || runtimeMalformed
      || truncationMalformed
      || deliveriesTruncated
      || deadLettersTruncated
      || deliveriesMalformed
      || queuesMalformed
      || queueDepthsMalformed
      || deadLettersMalformed
      || deadLetterCountMalformed
      || deadLetterCountMismatch,
  }
  return {
    healthVerdict: healthString ?? stringAt(healthRecord, ['verdict', 'status', 'health']),
    healthVerbatim: healthString ?? rawStringAt(healthRecord, ['verbatim', 'raw', 'output', 'text']),
    subscriberStatus: stringAt(runtime, ['subscriber_status', 'subscriberStatus']) ?? subscriberStatus,
    queueDepth: queuesMalformed || queueDepthsMalformed
      ? null
      : integerAt(runtime, ['queue_depth', 'queueDepth', 'delivery_count'])
        ?? (queueDepths && queueRecords && queueDepths.length === queueRecords.length
          ? queueDepths.reduce<number>((total, depth) => total + (depth ?? 0), 0)
          : null),
    deadLetterCount: deadLetterResultsDamaged
      ? null
      : declaredDeadLetterCount ?? deadLetters?.length ?? null,
    deliveries,
    historySemantics: rawStringAt(runtime, ['history_semantics', 'historySemantics']),
    deliverySemantics: rawStringAt(runtime, ['delivery_semantics', 'deliverySemantics']),
    source,
  }
}

function parsePosture(value: unknown, root: UnknownRecord, mode: SnapshotMode): WritePosture {
  const posture = isRecord(value) ? value : null
  const postureString = typeof value === 'string' ? value : null
  const writesEnabled = booleanAt(posture, ['writes_enabled', 'writesEnabled', 'enable_writes'])
  const issueCreationEnabled = booleanAt(posture, ['issue_creation_enabled', 'issueCreationEnabled', 'can_create_issue'])
  const explicitLabel = stringAt(posture, ['label', 'mode', 'posture']) ?? postureString
  const label = mode === 'fixture'
    ? 'READ-ONLY'
    : explicitLabel ?? (writesEnabled === true ? 'LIVE' : writesEnabled === false ? 'DRY-RUN' : 'READ-ONLY')
  return {
    label: label.toUpperCase(),
    writesEnabled: mode === 'fixture' ? false : writesEnabled,
    issueCreationEnabled: mode === 'fixture' ? false : issueCreationEnabled,
    actor: stringAt(posture, ['actor', 'resolved_actor']) ?? stringAt(root, ['actor']),
    repository: stringAt(posture, ['repository', 'repo', 'target_repository']) ?? stringAt(root, ['repository', 'repo']),
    reason: rawStringAt(posture, ['reason', 'message']),
  }
}

function unwrapRoot(input: UnknownRecord): { envelope: UnknownRecord; payload: UnknownRecord } {
  const data = recordAt(input, ['data'])
  const snapshot = recordAt(data, ['snapshot']) ?? recordAt(input, ['snapshot'])
  return { envelope: input, payload: snapshot ?? data ?? input }
}

export function parseSnapshotV1(
  input: unknown,
  options: { nowMs?: number; fallbackMode?: SnapshotMode } = {},
): SnapshotParseResult {
  if (!isRecord(input)) return { ok: false, snapshot: null, error: 'Snapshot root must be an object.' }
  const { envelope, payload } = unwrapRoot(input)
  const schema = stringAt(payload, ['schema', 'schema_version']) ?? stringAt(envelope, ['schema', 'schema_version'])
  const numericVersion = numberAt(payload, ['schema_version']) ?? numberAt(envelope, ['schema_version'])
  if (!schema && numericVersion !== 1) {
    return { ok: false, snapshot: null, error: 'Snapshot schema is missing.' }
  }
  if (schema && !KNOWN_SCHEMAS.has(schema) && !schema.endsWith('snapshot.v1')) {
    return { ok: false, snapshot: null, error: `Unsupported snapshot schema: ${schema}` }
  }

  const nowMs = options.nowMs ?? Date.now()
  const mode = normalizeMode(
    stringAt(payload, ['mode', 'data_mode']) ?? stringAt(envelope, ['mode', 'data_mode']),
    options.fallbackMode,
  )
  const capture = recordAt(envelope, ['capture']) ?? recordAt(payload, ['capture'])
  const generatedAt = stringAt(payload, ['generated_at', 'generatedAt', 'as_of', 'asOf'])
  const capturedAt = stringAt(payload, ['captured_at', 'capturedAt']) ?? stringAt(capture, ['captured_at', 'capturedAt'])
  const snapshotAgeMs = deriveAgeMs(
    numberAt(payload, ['snapshot_age_ms', 'age_ms', 'ageMs']),
    generatedAt,
    capturedAt,
    nowMs,
  )
  const sources = recordAt(payload, ['sources', 'provenance'])

  const issueCollection = projectionCollectionAt(payload, ['issues', 'goals'], ['issues', 'goals'])
  const pullRequestCollection = projectionCollectionAt(
    payload,
    ['pull_requests', 'pullRequests', 'prs'],
    ['pull_requests', 'pullRequests', 'prs'],
  )
  const markerProjection = recordAt(payload, ['markers'])
  const parsedIssueCollection = parseStrictCollection(
    issueCollection.values,
    (value) => parseIssue(value, nowMs),
  )
  const parsedPullRequestCollection = parseStrictCollection(
    pullRequestCollection.values,
    (value) => parsePullRequest(value, nowMs),
  )
  const issueCollectionPartial = partialFlag(issueCollection.source)
  const pullRequestCollectionPartial = partialFlag(pullRequestCollection.source)
  const issueCollectionMalformed = issueCollection.malformed || parsedIssueCollection.malformed
  const pullRequestCollectionMalformed = pullRequestCollection.malformed || parsedPullRequestCollection.malformed
  const parsedIssues = issueCollectionMalformed
    || (issueCollectionPartial && parsedIssueCollection.items?.length === 0)
    ? null
    : parsedIssueCollection.items
  const pullRequests = pullRequestCollectionMalformed
    || (pullRequestCollectionPartial && parsedPullRequestCollection.items?.length === 0)
    ? null
    : parsedPullRequestCollection.items
  const evidenceByIssue = parseTrustedMarkerEvidence(payload)
  const issues = parsedIssues?.map((issue) => {
    const evidence = issue.evidence.length > 0 ? issue.evidence : (evidenceByIssue.get(issue.number) ?? [])
    const linkedPullRequest = pullRequests?.find((pullRequest) => pullRequest.issueNumber === issue.number) ?? null
    const latestEvidenceAt = evidence.at(-1)?.createdAt ?? null
    const updatedAt = issue.updatedAt ?? latestEvidenceAt
    return {
      ...issue,
      updatedAt,
      ageMs: issue.ageMs ?? deriveAgeMs(null, updatedAt, null, nowMs),
      evidence,
      pullRequestNumber: issue.pullRequestNumber ?? linkedPullRequest?.number ?? null,
      pullRequestUrl: issue.pullRequestUrl ?? linkedPullRequest?.url ?? null,
      ci: issue.ci ?? linkedPullRequest?.ci ?? null,
      mergeGate: issue.mergeGate ?? (linkedPullRequest
        ? {
            ci: 'unknown',
            review: linkedPullRequest.reviewDecision?.toLowerCase() === 'approve' ? 'approve' : 'unknown',
            headBound: evidence.some((marker) => marker.schema === 'merge-ready:v1') ? true : null,
            mergeable: null,
            target: null,
            posture: null,
          }
        : null),
    } satisfies IssueSnapshot
  }) ?? null

  const explicitGithubSource = recordAt(payload, ['github_source'])
  const githubSourceRecord = explicitGithubSource
    ?? issueCollection.source
    ?? pullRequestCollection.source
    ?? markerProjection
    ?? recordAt(sources, ['github', 'board'])
  const parsedGithubSource = parseSourceMeta(
    githubSourceRecord,
    { authority: 'GitHub trusted comments', artifact: 'state:v1 · review-result:v1 · merge-ready:v1' },
    snapshotAgeMs,
    issues !== null || pullRequests !== null,
  )
  const githubSourceRecords = [
    explicitGithubSource,
    issueCollection.source,
    pullRequestCollection.source,
    markerProjection,
  ]
  const githubSource: SourceMeta = {
    ...parsedGithubSource,
    availability: issueCollectionMalformed || pullRequestCollectionMalformed
      ? 'unknown'
      : aggregateAvailability(githubSourceRecords, parsedGithubSource.availability),
    partial: parsedGithubSource.partial
      || githubSourceRecords.some(partialFlag)
      || issueCollectionMalformed
      || pullRequestCollectionMalformed,
  }
  const council = parseCouncil(pick(payload, ['council']), sources, snapshotAgeMs)
  const runtime = parseRuntime(pick(payload, ['runtime', 'engine']), payload, sources, snapshotAgeMs)
  const posture = parsePosture(pick(payload, ['posture', 'write_posture']), payload, mode)

  const snapshot: SnapshotV1 = {
    schema: schema ?? 'snapshot.v1',
    mode,
    generatedAt,
    capturedAt,
    ageMs: snapshotAgeMs,
    issues,
    pullRequests,
    githubSource,
    council,
    runtime,
    posture,
  }
  return { ok: true, snapshot, error: null }
}

export function effectiveAgeMs(source: SourceMeta, snapshot: SnapshotV1, nowMs: number): number | null {
  const baseAge = source.ageMs ?? snapshot.ageMs
  const generatedMs = parseDateMs(source.generatedAt ?? snapshot.generatedAt ?? snapshot.capturedAt)
  if (generatedMs !== null) return Math.max(0, nowMs - generatedMs)
  return baseAge
}

export function isSnapshotStale(snapshot: SnapshotV1, nowMs: number, staleAfterMs = 300_000): boolean {
  const age = effectiveAgeMs(snapshot.githubSource, snapshot, nowMs)
  return age !== null && age > staleAfterMs
}

export function sortIssuesByRank(issues: readonly IssueSnapshot[]): readonly IssueSnapshot[] {
  return [...issues].sort((left, right) => {
    const rankDelta = (right.stageRank ?? -1) - (left.stageRank ?? -1)
    if (rankDelta !== 0) return rankDelta
    return (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '')
  })
}
