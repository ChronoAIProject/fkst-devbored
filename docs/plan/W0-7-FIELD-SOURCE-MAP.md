# W0-7 - Field-level source map

> **Historical Step-0 evidence.** Revalidate it against the pins and parity
> gate in [`plans/full-app-construction.md`](../../plans/full-app-construction.md).

Status: **complete for the W0 corpus; pending fields remain blocked**
Contract version: `contracts/v1` (`FROZEN-PARTIAL`)
Date: 2026-07-20

This map separates facts proved by the W0 byte corpus from fields that remain
unproved. A fixture path is evidence for the wire shape; the runtime source is
the corresponding trusted comment, config file, queue payload, or `gh api`
response. Every source claim below is backed by named evidence.

## Trust and absence rules

- **Marker rule:** parse syntax first, but establish authority only after the
  comment author matches `FKST_GITHUB_BOT_LOGIN` after `[bot]` normalization.
  Missing/empty trust configuration makes every marker untrusted. Unknown,
  malformed, non-canonical, duplicate, truncated, or ambiguous markers become
  `UnparseableMarker`; no attributes are guessed.
- **Config rule:** read the complete JSON selected by `FKST_DEVBORED_CONFIG`.
  Schema, every required field, value constraints, unknown fields, and the
  backward-version check fail closed. There are no defaults.
- **Observed-payload rule:** queue provenance supplies authority. Every known
  required field is type-checked; unknown fields are ignored so additive
  upstream observation fields do not break the console. A missing or invalid
  known field rejects the payload.
- **GitHub rule:** `gh api` fields below are **gh api — proven by tool
  contract**. Use the selected host/auth context, retain the response capture
  time, and never substitute cached or label-derived authority. A missing
  optional API field maps to `null`; a missing required identity field makes
  that response unprojectable.
- **Pending rule:** `NOT YET PROVEN - blocked on ...` is a hard boundary. The
  console must not populate that field until the named fixture or contract is
  added.

Fixture paths below are relative to the read-only reference package root
`../packages/packages/devbored/tests/fixtures/`.

## Proven marker types

The five canonical fixtures under `markers/` are single-line UTF-8 bytes with
no trailing newline. The two `slice/*-marker.txt` emission records contain the
same canonical marker followed by one LF. Attribute order, names, double
quotes, canonical decimal text, entity encoding, and surrounding spaces are
byte-significant.

### `StateMarker`

| Field | Exact source | Trust rule | When missing |
| --- | --- | --- | --- |
| `kind` | `markers/state.txt`, header kind `state` | Marker rule; kind and schema must be known | `UnparseableMarker` |
| `schema` | `markers/state.txt`, header schema `v1` | Marker rule; exact `v1` | `UnparseableMarker` |
| `workItem` | `markers/state.txt`, attribute `work_item` | Non-empty safe string | `UnparseableMarker` |
| `state` | `markers/state.txt`, attribute `state` | One of the 12 states in `marker-contracts.md` | `UnparseableMarker` |
| `version` | `markers/state.txt`, attribute `version` | Canonical non-negative decimal, typed as `int` | `UnparseableMarker` |
| `stageRank` | `markers/state.txt`, attribute `stage_rank` | Canonical non-negative decimal and exact rank for `state` | `UnparseableMarker` |
| `why` | `markers/state.txt`, attribute `why`; absent in `slice/state-marker.txt` | Required only for `merged`, `impl-failed`, `blocked`; forbidden otherwise | Terminal: `UnparseableMarker`; non-terminal: `null` |

### `ConsensusMarker`

| Field | Exact source | Trust rule | When missing |
| --- | --- | --- | --- |
| `kind` | `markers/consensus.txt`, header kind `consensus` | Marker rule | `UnparseableMarker` |
| `schema` | `markers/consensus.txt`, header schema `v1` | Marker rule; exact `v1` | `UnparseableMarker` |
| `proposalId` | `markers/consensus.txt`, attribute `proposal_id` | Non-empty safe string | `UnparseableMarker` |
| `stage` | `markers/consensus.txt`, attribute `stage` | Exact `design` or `review` | `UnparseableMarker` |
| `outcome` | `markers/consensus.txt`, attribute `outcome` | Exact `reached`, `converge`, or `stalled` | `UnparseableMarker` |
| `round` | `markers/consensus.txt`, attribute `round` | Canonical positive decimal, typed as `int` | `UnparseableMarker` |
| `seats` | `markers/consensus.txt`, attribute `seats`; four-seat case in `slice/consensus-marker.txt` | Non-empty CSV of distinct marker-safe tokens; order retained | `UnparseableMarker` |

### `ReviewMarker`

| Field | Exact source | Trust rule | When missing |
| --- | --- | --- | --- |
| `kind` | `markers/review.txt`, header kind `review` | Marker rule | `UnparseableMarker` |
| `schema` | `markers/review.txt`, header schema `v1` | Marker rule; exact `v1` | `UnparseableMarker` |
| `pullRequest` | `markers/review.txt`, attribute `pr` | Canonical positive decimal, typed as `int` | `UnparseableMarker` |
| `headSha` | `markers/review.txt`, attribute `head_sha` | Exactly 40 or 64 hexadecimal characters | `UnparseableMarker` |
| `decision` | `markers/review.txt`, attribute `decision` | Exact `approve` or `reject` | `UnparseableMarker` |
| `seats` | `markers/review.txt`, attribute `seats` | Non-empty CSV of distinct marker-safe tokens; order retained | `UnparseableMarker` |

### `MergeReadyMarker`

| Field | Exact source | Trust rule | When missing |
| --- | --- | --- | --- |
| `kind` | `markers/merge-ready.txt`, header kind `merge-ready` | Marker rule | `UnparseableMarker` |
| `schema` | `markers/merge-ready.txt`, header schema `v1` | Marker rule; exact `v1` | `UnparseableMarker` |
| `pullRequest` | `markers/merge-ready.txt`, attribute `pr` | Canonical positive decimal, typed as `int` | `UnparseableMarker` |
| `headSha` | `markers/merge-ready.txt`, attribute `head_sha` | Exactly 40 or 64 hexadecimal characters | `UnparseableMarker` |
| `version` | `markers/merge-ready.txt`, attribute `version` | Canonical non-negative decimal, typed as `int` | `UnparseableMarker` |

### `FailureMarker`

| Field | Exact source | Trust rule | When missing |
| --- | --- | --- | --- |
| `kind` | `markers/failure.txt`, header kind `failure` | Marker rule | `UnparseableMarker` |
| `schema` | `markers/failure.txt`, header schema `v1` | Marker rule; exact `v1` | `UnparseableMarker` |
| `workItem` | `markers/failure.txt`, attribute `work_item` | Non-empty safe string | `UnparseableMarker` |
| `errorClass` | `markers/failure.txt`, attribute `error_class` | Marker-safe token | `UnparseableMarker` |
| `fingerprint` | `markers/failure.txt`, attribute `fingerprint` | Non-empty key using letters, digits, `_ . : / -` | `UnparseableMarker` |
| `why` | `markers/failure.txt`, attribute `why` | Non-empty safe string | `UnparseableMarker` |

## Proven `DevboredConfig`

Every row is sourced from `valid.json`. The invalid fixtures prove failure
classes: malformed JSON, wrong/zero version, over-capacity design seats,
over-capacity review seats, and rollback below the previous accepted version.

| Field | Exact JSON path | Trust rule | When missing |
| --- | --- | --- | --- |
| `schema` | `$.schema` | Exact `devbored.config.v1` | Reject config: expected schema |
| `version` | `$.version` | Positive JSON integer; must be `>= previousVersion` | Reject config: invalid/backward version |
| `labels.prefix` | `$.labels.prefix` | Non-empty string | Reject labels contract |
| `labels.enabled` | `$.labels.enabled` | Non-empty string | Reject labels contract |
| `labels.claimed` | `$.labels.claimed` | Non-empty string | Reject labels contract |
| `labels.state` | `$.labels.state` | Non-empty string-to-non-empty-string map | Reject labels contract |
| `labels.priorityClasses` | `$.labels.priorityClasses` | Non-empty string-to-non-empty-string map | Reject labels contract |
| `intake.requireEnabledLabel` | `$.intake.requireEnabledLabel` | JSON boolean | Reject intake contract |
| `intake.milestones` | `$.intake.milestones` | Dense JSON array of positive integers; empty is explicit | Reject intake contract |
| `intake.authorPolicy` | `$.intake.authorPolicy` | Exact `any`, `collaborator`, or `member` | Reject intake contract |
| `stages.design.seats` | `$.stages.design.seats` | Dense array of 1..4 distinct marker-safe names | Reject with design-seats error |
| `stages.design.agreement` | `$.stages.design.agreement` | Exact `unanimous` or `majority` | Reject design/review contract |
| `stages.design.budgets.maxRounds` | `$.stages.design.budgets.maxRounds` | Positive JSON integer | Reject design/review contract |
| `stages.design.budgets.timeoutSeconds` | `$.stages.design.budgets.timeoutSeconds` | Positive JSON integer | Reject design/review contract |
| `stages.review.seats` | `$.stages.review.seats` | Dense array of 1..4 distinct marker-safe names | Reject with review-seats error |
| `stages.review.agreement` | `$.stages.review.agreement` | Exact `unanimous` or `majority` | Reject design/review contract |
| `stages.review.budgets.maxRounds` | `$.stages.review.budgets.maxRounds` | Positive JSON integer | Reject design/review contract |
| `stages.review.budgets.timeoutSeconds` | `$.stages.review.budgets.timeoutSeconds` | Positive JSON integer | Reject design/review contract |
| `stages.implement.model` | `$.stages.implement.model` | Non-empty string | Reject implement contract |
| `stages.implement.effort` | `$.stages.implement.effort` | Non-empty string | Reject implement contract |
| `stages.implement.localTestCommand` | `$.stages.implement.localTestCommand` | Non-empty string | Reject implement contract |
| `stages.merge.requireCiGreen` | `$.stages.merge.requireCiGreen` | JSON boolean | Reject merge contract |
| `stages.merge.requireHeadBoundApproval` | `$.stages.merge.requireHeadBoundApproval` | JSON boolean | Reject merge contract |
| `stages.merge.targetBranch` | `$.stages.merge.targetBranch` | Non-empty string | Reject merge contract |

## Proven observed payloads

### `ConsensusProposal`

All sources are `slice/proposal.json`.

| Field | Exact JSON path | Trust rule | When missing |
| --- | --- | --- | --- |
| `schema` | `$.schema` | Exact `consensus.proposal.v1` | Reject payload |
| `angles` / `seats` | `$.angles[]` | Dense array of 1..4 non-empty single-line strings; order retained | Reject payload |
| `body` | `$.body` | Observed string; never promoted to a `docs/05` raw-body field | Reject payload |
| `dedupKey` | `$.dedup_key` | Non-empty observed string | Reject payload |
| `effectVersion` | `$.effect_version` | Canonical positive decimal string on this seam, typed as `int` | Reject payload |
| `proposalId` | `$.proposal_id` | Non-empty observed string | Reject payload |
| `sourceRef.kind` | `$.source_ref.kind` | Non-empty observed string | Reject payload |
| `sourceRef.ref` | `$.source_ref.ref` | Non-empty observed string | Reject payload |
| `stage` | `$.stage` | Exact `design` or `review` | Reject payload |
| `title` | `$.title` | Observed string | Reject payload |
| `verdictMode` | `$.verdict_mode` | Non-empty observed string; fixture value is `converge` | Reject payload |
| `workItemId` | `$.work_item_id` | Non-empty observed string | Reject payload |
| `worktree` | `$.worktree` | Non-empty observed string | Reject payload |

### `ConsensusResult`

All sources are `slice/consensus-result.json`.

| Field | Exact JSON path | Trust rule | When missing |
| --- | --- | --- | --- |
| `schema` | `$.schema` | Exact `consensus.consensus_reached.v1` | Reject payload |
| `angleResults` | `$.angle_results[]` | Dense array of 1..4 typed results; distinct angles, order retained | Reject payload |
| `angleResults[].angle` / `seats` | `$.angle_results[].angle` | Non-empty observed string | Reject payload |
| `angleResults[].verdict` | `$.angle_results[].verdict` | Exact `approve` for reached result proved here | Reject payload |
| `body` | `$.body` | Observed string; never promoted to a `docs/05` raw-body field | Reject payload |
| `decision` | `$.decision` | Exact `approve` for reached result proved here | Reject payload |
| `dedupKey` | `$.dedup_key` | Non-empty observed string | Reject payload |
| `effectVersion` | `$.effect_version` | Canonical positive decimal string on this seam, typed as `int` | Reject payload |
| `proposalId` | `$.proposal_id` | Non-empty observed string | Reject payload |
| `sourceRef.kind` | `$.source_ref.kind` | Non-empty observed string | Reject payload |
| `sourceRef.ref` | `$.source_ref.ref` | Non-empty observed string | Reject payload |

## `docs/05` field inventory

This section covers every field declared in `docs/05-DATA-CONTRACTS.md` that
is not already the raw config/payload/marker field above. "Marker rule" and
"GitHub rule" refer to the rules at the top of this document.

### Identity and connection

| Type.field | Exact source or blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `EntityRef.connectionId` | NOT YET PROVEN - blocked on connection persistence fixture | Do not synthesize UUIDs during projection | Entity cannot be keyed |
| `EntityRef.githubHost` | `gh api` selected hostname (`GH_HOST`/explicit host) — **gh api — proven by tool contract** | GitHub rule | Entity cannot be keyed |
| `EntityRef.repo` | `gh api repos/{owner}/{repo}/issues/{number}` request identity and `.repository_url` — **gh api — proven by tool contract** | GitHub rule; normalize to `owner/name` | Entity cannot be keyed |
| `EntityRef.kind` | Same endpoint, `.pull_request` presence distinguishes PR from issue — **gh api — proven by tool contract** | GitHub rule | Entity cannot be keyed |
| `EntityRef.number` | Same endpoint, `.number` — **gh api — proven by tool contract** | GitHub rule; positive integer | Entity cannot be keyed |
| `Connection.id` | NOT YET PROVEN - blocked on connection persistence fixture | No generated fallback | Reject connection row |
| `Connection.name` | NOT YET PROVEN - blocked on connection persistence fixture | No default | Reject connection row |
| `Connection.githubHost` | NOT YET PROVEN - blocked on connection persistence fixture | Must bind selected `gh` host | Reject connection row |
| `Connection.primaryRepo` | NOT YET PROVEN - blocked on connection persistence fixture | Must be explicit | Reject connection row |
| `Connection.hostRoot` | NOT YET PROVEN - blocked on connection discovery fixture | Canonical-path validation required | Reject connection row |
| `Connection.targetCheckoutRoot` | NOT YET PROVEN - blocked on connection discovery fixture | Canonical-path validation required | Reject connection row |
| `Connection.platformRoot` | NOT YET PROVEN - blocked on connection discovery fixture | Canonical-path validation required | Reject connection row |
| `Connection.effectiveProfilePath` | NOT YET PROVEN - blocked on effective-profile fixture | Canonical-path validation required | Trust unverifiable |
| `Connection.durableRoot` | NOT YET PROVEN - blocked on connection discovery fixture | Canonical-path validation required | Runtime unavailable |
| `Connection.binPath` | NOT YET PROVEN - blocked on executable-discovery fixture | Absolute executable only | Adapter unavailable |
| `Connection.toolPaths` | NOT YET PROVEN - blocked on executable-discovery fixture | Absolute executable only | Affected adapter unavailable |
| `Connection.authContextId` | NOT YET PROVEN - blocked on auth-context persistence fixture | Non-secret identifier only | Reads/writes disabled |
| `Connection.rosterId` | NOT YET PROVEN - blocked on roster persistence fixture | Referential integrity required | Council unavailable |
| `Connection.paused` | NOT YET PROVEN - blocked on connection persistence fixture | No default | Reject connection row |
| `ConnectionDerived.trustedBotLogins` | Effective host profile field naming NOT YET PROVEN - blocked on recorded profile fixture | Recompute; normalize `[bot]`; never user-edit | Empty/unverifiable, all markers untrusted |
| `ConnectionDerived.trustSource` | Derived from successful profile parse NOT YET PROVEN - blocked on profile parser fixture | Fail closed | `unverifiable` |
| `ConnectionDerived.claimMode` | NOT YET PROVEN - blocked on effective-profile claim-mode fixture | Recompute; never user-edit | Claim unknown |
| `ConnectionDerived.managedSiblingRepos` | NOT YET PROVEN - blocked on effective-profile fixture | Recompute | Empty unknown, not authoritative empty |
| `ConnectionDerived.upstreamBranch` | NOT YET PROVEN - blocked on profile/git fixture | Exact configured/ref value | `null`/unknown in projection |
| `ConnectionDerived.integrationBranch` | NOT YET PROVEN - blocked on profile/git fixture | Exact configured/ref value | `null`/unknown in projection |
| `ConnectionDerived.posture` | NOT YET PROVEN - blocked on launch-config fixture | Only next-launch posture; never infer live state | `unknown` |
| `ConnectionDerived.asOf` | NOT YET PROVEN - blocked on projection clock fixture | Console capture instant | Reject observed snapshot |
| `ConnectionDerived.source` | NOT YET PROVEN - blocked on profile adapter result fixture | Exact path/adapter provenance | Reject observed snapshot |
| `DoctorReport.connectionId` | NOT YET PROVEN - blocked on doctor output fixture | Must resolve persisted connection | Reject report |
| `DoctorReport.checks` | NOT YET PROVEN - blocked on doctor output fixture | Typed adapter output only | Empty is unknown, not pass |
| `DoctorReport.verdict` | NOT YET PROVEN - blocked on doctor output fixture | Derived only from typed checks | `fail`/unavailable, never pass |
| `DoctorReport.asOf` | NOT YET PROVEN - blocked on doctor capture fixture | Console capture instant | Reject report |
| `DoctorCheck.id` | NOT YET PROVEN - blocked on doctor output fixture | Exact check identifier | Reject check |
| `DoctorCheck.label` | NOT YET PROVEN - blocked on doctor output fixture | Exact bounded adapter text | Reject check |
| `DoctorCheck.status` | NOT YET PROVEN - blocked on doctor output fixture | Exact known enum | Reject check |
| `DoctorCheck.detail` | NOT YET PROVEN - blocked on doctor output fixture | Bounded, sanitized adapter text | `null` |

### Runtime snapshot

Every runtime field is NOT YET PROVEN because no recorded
`fkst-framework observe --json` or health fixture is in the W0 corpus.

| Type.field | Exact blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `RuntimeSnapshot.connectionId` | Observe fixture plus connection fixture | Bind request to connection | Reject snapshot |
| `RuntimeSnapshot.queues` | Observe JSON fixture/schema | Observe adapter only | Unknown, not empty |
| `RuntimeSnapshot.deliveries` | Observe JSON fixture/schema | Observe adapter only | Unknown counts |
| `RuntimeSnapshot.deadLetters` | Observe JSON fixture/schema | Observe adapter only | `null` |
| `RuntimeSnapshot.healthLine` | Recorded `scripts/run.sh health` stdout fixture | Preserve verbatim; never parse | `null` |
| `RuntimeSnapshot.reachable` | Observe process-result fixture | Typed adapter result only | `false` with degraded reason |
| `RuntimeSnapshot.asOf` | Runtime capture-clock fixture | Console capture instant | Reject snapshot |
| `RuntimeSnapshot.source` | Observe adapter-result fixture | Exact command and durable-root provenance | Reject snapshot |
| `QueueStat.name` | Observe JSON fixture/schema | Exact observed string | Reject queue row |
| `QueueStat.depth` | Observe JSON fixture/schema | Integer only | `null` |
| `QueueStat.inFlight` | Observe JSON fixture/schema | Integer only | `null` |
| `QueueStat.oldestPendingMs` | Observe JSON fixture/schema | Integer only | `null` |
| `QueueStat.subscriber` | Observe JSON fixture/schema | Exact known enum | `unknown` |
| `DeliveryStat.pending` | Observe JSON fixture/schema | Integer only | `null` |
| `DeliveryStat.inFlight` | Observe JSON fixture/schema | Integer only | `null` |
| `DeliveryStat.retrying` | Observe JSON fixture/schema | Integer only | `null` |

### Work entities and claims

| Type.field | Exact source or blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `Entity.ref` | `EntityRef` sources above | GitHub rule | Reject entity |
| `Entity.title` | `gh api repos/{owner}/{repo}/issues/{number}` `.title` — **gh api — proven by tool contract** | GitHub rule | Reject entity |
| `Entity.state` | Trusted `StateMarker.state` | Marker rule; greatest `(version, stageRank)` | Unknown/unparseable, never default |
| `Entity.stateVersion` | Trusted `StateMarker.version`, canonical decimal rendered as string | Marker rule | `null` |
| `Entity.stage` | NOT YET PROVEN - blocked on state-to-presentation-stage fixture | Must not equate state and stage | `null` |
| `Entity.stateAsOf` | `gh api repos/{owner}/{repo}/issues/comments` matching comment `.created_at` — **gh api — proven by tool contract** | GitHub metadata for selected trusted marker | `null` |
| `Entity.dwell` | NOT YET PROVEN - blocked on ordered transition-history fixture | Must use durable transition history | `null` |
| `Entity.claim` | Claim fields below; mode source remains unproved | Assignee/label authority only after mode resolved | `null` |
| `Entity.labels` | Issue endpoint `.labels[].name` — **gh api — proven by tool contract** | Hints only, never state authority | Empty only when API proves empty |
| `Entity.labelDrift` | NOT YET PROVEN - blocked on label-to-marker projection fixture | Compare hints after trusted marker selection | Unknown/degraded, not `false` |
| `Entity.commentCount` | Issue endpoint `.comments` — **gh api — proven by tool contract** | Non-negative integer | Reject/degrade entity |
| `Entity.debateHeat` | NOT YET PROVEN - blocked on thresholds and debate projection fixture | Deterministic documented thresholds | `quiet` is not a valid fallback; unknown view state |
| `Entity.convergeRound` | Trusted `ConsensusMarker.round` | Marker rule; matching proposal/stage | `null` |
| `Entity.blockedBy` | NOT YET PROVEN - blocked on dependency marker/payload fixture | No title/body guessing | Unknown, not empty |
| `Entity.ci` | `gh api repos/{owner}/{repo}/commits/{sha}/check-runs` `.check_runs[].status/.conclusion` — **gh api — proven by tool contract** | Bind exact current `headSha` | `null` |
| `Entity.headSha` | `gh api repos/{owner}/{repo}/pulls/{number}` `.head.sha` — **gh api — proven by tool contract** | Exact PR response | `null` for issue; reject PR authorization |
| `Entity.linkedRef` | NOT YET PROVEN - blocked on issue-to-PR linkage fixture/contract | No branch/title heuristic | `null` |
| `Entity.parseStatus` | `parseMarker` result plus author check | Marker rule | `unparseableSchema` or `untrusted`, never parsed |
| `Entity.asOf` | NOT YET PROVEN - blocked on entity projection clock fixture | Console response capture instant | Reject observed entity |
| `Entity.source` | NOT YET PROVEN - blocked on gh adapter-result fixture | Exact endpoint/host provenance | Reject observed entity |
| `Label.name` | Issue endpoint `.labels[].name` — **gh api — proven by tool contract** | GitHub rule | Reject label row |
| `Label.isStateHint` | Config `valid.json` `$.labels.state.*` values matched to `Label.name` | Config is classification only, never state authority | `false` only if config valid and no match; otherwise unknown |
| `CiRollup.status` | Check-runs `.status/.conclusion` — **gh api — proven by tool contract** | Deterministic rollup NOT YET PROVEN - blocked on rollup fixture | `null` parent `ci` |
| `CiRollup.passed` | Check-runs `.check_runs[].conclusion` — **gh api — proven by tool contract** | Count exact successful conclusions; rollup fixture still required | `null` |
| `CiRollup.total` | Check-runs `.total_count` — **gh api — proven by tool contract** | Non-negative integer | `null` |
| `Claim.holder` | Issue endpoint `.assignee.login` / `.assignees[].login` — **gh api — proven by tool contract**; label mode pending | Use only authority selected by `claimMode` | `null` |
| `Claim.isHuman` | Compare holder with trusted bot set; trusted-set profile fixture NOT YET PROVEN | Normalized exact login comparison | Unknown; do not guess `true` |
| `Claim.mode` | NOT YET PROVEN - blocked on effective-profile claim-mode fixture | Recompute from profile | Claim unavailable |
| `Claim.since` | `gh api repos/{owner}/{repo}/issues/{number}/timeline` assignment/label event `.created_at` — **gh api — proven by tool contract** | Exact event for selected authority | `null` |
| `Claim.ageUnknown` | `Claim.since == null` | Pure derivation after authority resolution | `true` |

### Debate

| Type.field | Exact source or blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `Debate.ref` | Entity reference above; proposal source ref in slice is `$.source_ref.ref` | Cross-check proposal ID/source ref; full projection fixture pending | Reject debate |
| `Debate.rounds` | Trusted consensus/review markers contain round facts, but grouping NOT YET PROVEN - blocked on multi-comment debate fixture | Marker rule | Unknown, not empty |
| `Debate.outcome` | Trusted `ConsensusMarker.outcome`: `reached`, `converge`, `stalled` | Exact mapping `reached->reached`, `converge->converging`, `stalled->stalled`; other enum cases pending | `blocked`/unparseable view state, never guessed |
| `Debate.totalComments` | Issue endpoint `.comments` — **gh api — proven by tool contract** | GitHub rule | Reject/degrade debate |
| `Debate.volumeByVoice` | NOT YET PROVEN - blocked on authored multi-comment debate fixture | Count projected persona IDs only | Unknown, not empty |
| `Debate.asOf` | NOT YET PROVEN - blocked on debate projection clock fixture | Console capture instant | Reject debate |
| `Debate.source` | NOT YET PROVEN - blocked on debate projection provenance fixture | Exact endpoint and marker schema | Reject debate |
| `DebateRound.index` | `ConsensusMarker.round` for design; review marker has no round | Marker rule; review grouping NOT YET PROVEN | Reject round |
| `DebateRound.kind` | `ConsensusMarker.stage` (`design`/`review`) or `ReviewMarker.kind` | Marker rule; map design to `designConsensus`, review to `prReview` | Reject round |
| `DebateRound.question` | NOT YET PROVEN - blocked on bounded debate-content projection fixture | Never expose raw body | `null` |
| `DebateRound.narrowedBy` | NOT YET PROVEN - blocked on persona-verdict debate fixture | Must resolve configured persona | `null` |
| `DebateRound.messages` | NOT YET PROVEN - blocked on combined GitHub metadata + marker fixture | Marker and GitHub rules both required | Unknown, not empty |
| `DebateMessage.id` | Comment endpoint matching comment `.id` — **gh api — proven by tool contract** | GitHub rule | Reject message |
| `DebateMessage.personaId` | Marker seat plus author-to-persona mapping NOT YET PROVEN - blocked on roster/profile fixture | Exact mapping only | `null` (human/unknown) |
| `DebateMessage.authorLogin` | Comment endpoint `.user.login` — **gh api — proven by tool contract** | GitHub rule | Reject message |
| `DebateMessage.isHuman` | Author-to-trusted/persona mapping NOT YET PROVEN - blocked on profile/roster fixture | Exact normalized login mapping | Unknown; do not guess |
| `DebateMessage.verdict` | `ReviewMarker.decision`; `ConsensusMarker.outcome` | Marker rule; direct approve/reject/converge mappings only; remaining cases blocked on fixtures | `comment` only for proven ordinary projected comment; otherwise unknown |
| `DebateMessage.changedFrom` | NOT YET PROVEN - blocked on multi-round position fixture | Compare same persona across ordered rounds | `null` |
| `DebateMessage.excerpt` | NOT YET PROVEN - blocked on bounded/sanitized projection fixture | Raw body forbidden | Reject message or omit from view |
| `DebateMessage.at` | Comment endpoint `.created_at` — **gh api — proven by tool contract** | GitHub rule; ISO-8601 instant | Reject message |
| `DebateMessage.permalink` | Comment endpoint `.html_url` — **gh api — proven by tool contract** | GitHub rule | Reject message |
| `DebateMessage.markerSchema` | Parsed marker header, e.g. `state:v1`, `consensus:v1` | Marker rule | Unparseable message, never default |

### Council configuration

The raw `DevboredConfig` fields are proven above. Translation into the richer
`docs/05` council model is mostly a separate contract and is not inferred.

| Type.field | Exact source or blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `Persona.id` | Config `$.stages.design.seats[]` / `$.stages.review.seats[]` proves seat IDs only | Valid config; preserve order | Reject affected stage |
| `Persona.name` | NOT YET PROVEN - blocked on persona roster fixture | No title-casing ID fallback | Reject persona |
| `Persona.colorToken` | NOT YET PROVEN - blocked on persona roster fixture | Token name only | Reject persona |
| `Persona.initials` | NOT YET PROVEN - blocked on persona roster fixture | No generated fallback | Reject persona |
| `Persona.brief` | NOT YET PROVEN - blocked on persona roster fixture | Bounded configured text | Reject persona |
| `Persona.model` | NOT YET PROVEN - config only proves implement-stage model | Do not reuse implement model | Reject persona |
| `Persona.effort` | NOT YET PROVEN - config only proves implement-stage effort | Do not reuse implement effort | Reject persona |
| `Persona.seatedAt` | Config design/review seat arrays prove those two memberships; other step kinds NOT YET PROVEN | Valid config only | Empty only if explicitly configured elsewhere |
| `Persona.isVeto` | NOT YET PROVEN - blocked on roster/agreement fixture | No veto inference | Reject persona/flow |
| `Persona.isVoting` | NOT YET PROVEN - blocked on roster fixture | No meta-judge inference | Reject persona |
| `Persona.status` | NOT YET PROVEN - blocked on roster lifecycle fixture | No active default | Reject persona |
| `Persona.retiredAt` | NOT YET PROVEN - blocked on roster lifecycle fixture | ISO-8601 instant | `null` only for proven active persona |
| `Persona.retiredReason` | NOT YET PROVEN - blocked on roster lifecycle fixture | Bounded configured text | `null` only for proven active persona |
| `Roster.id` | NOT YET PROVEN - blocked on roster persistence fixture | Stable UUID | Reject roster |
| `Roster.name` | NOT YET PROVEN - blocked on roster persistence fixture | No default | Reject roster |
| `Roster.personaIds` | NOT YET PROVEN - config proves per-stage seats, not roster membership | Referential integrity required | Reject roster |
| `Roster.connectionIds` | NOT YET PROVEN - blocked on roster/connection persistence fixture | Referential integrity required | Reject roster |
| `Flow.id` | NOT YET PROVEN - blocked on flow persistence fixture | Stable UUID | Reject flow |
| `Flow.name` | NOT YET PROVEN - blocked on flow persistence fixture | No default | Reject flow |
| `Flow.routing` | NOT YET PROVEN - blocked on routing fixture | Explicit only | Reject flow |
| `Flow.steps` | NOT YET PROVEN - raw config stage translation requires a flow projection fixture | Validate complete branches | Reject flow |
| `Flow.isDefault` | NOT YET PROVEN - blocked on flow persistence fixture | No default | Reject flow |
| `FlowRouting.byLabel` | NOT YET PROVEN - blocked on routing fixture | Opt-in labels only | Reject routing |
| `FlowRouting.byRiskTier` | NOT YET PROVEN - blocked on routing fixture | Explicit risk taxonomy only | Reject routing |
| `FlowStep.kind` | Config has design/review/implement/merge keys, but mapping NOT YET PROVEN | No inferred intake/mergeGate semantics | Reject step |
| `FlowStep.label` | NOT YET PROVEN - blocked on flow fixture | No generated label | Reject step |
| `FlowStep.description` | NOT YET PROVEN - blocked on flow fixture | Bounded configured text | Reject step |
| `FlowStep.seatedIds` | Config design/review `seats[]` proves raw stage membership only | Translation fixture required | Reject step |
| `FlowStep.agreement` | Config `agreement` allows `unanimous/majority`; docs type uses `unanimous/threshold`; mapping NOT YET PROVEN | No semantic conversion without contract | Reject step |
| `FlowStep.budgets` | Config `maxRounds/timeoutSeconds` does not prove docs budget mapping | Translation fixture required | Reject step |
| `FlowStep.branches` | NOT YET PROVEN - blocked on branch fixture covering agree/disagree/exhausted | All three outcomes mandatory | Reject flow |
| `FlowStep.isMachineGate` | Config merge booleans do not prove this field | Machine-gate translation fixture required | Reject step |
| `AgreementRule.mode` | NOT YET PROVEN - blocked on agreement translation fixture | Exact enum only | Reject agreement |
| `AgreementRule.threshold` | NOT YET PROVEN - blocked on majority/threshold fixture | Positive bounded integer when applicable | `null` only for proven unanimous |
| `AgreementRule.vetoPersonaIds` | NOT YET PROVEN - blocked on veto roster fixture | Referenced personas must be seated | Reject agreement |
| `Budgets.convergeRounds` | NOT YET PROVEN - blocked on config-to-flow budget fixture | Integer only | `null` |
| `Budgets.fixRounds` | NOT YET PROVEN - blocked on fix budget fixture | Integer only | `null` |
| `Budgets.stallUnchangedRounds` | NOT YET PROVEN - blocked on stall budget fixture | Integer only | `null` |
| `FlowBranch.condition` | NOT YET PROVEN - blocked on flow branch fixture | Explicit known condition | Reject branch |
| `FlowBranch.outcome` | NOT YET PROVEN - blocked on flow branch fixture | Explicit known outcome | Reject branch |
| `FlowBranch.destination` | NOT YET PROVEN - blocked on flow branch fixture | Must resolve | Reject branch |
| `FlowBranch.tone` | NOT YET PROVEN - blocked on flow branch fixture | Exact enum | Reject branch |

### Scores

No merged-outcome/reflection corpus exists in W0. Every score field is
therefore blocked on a recorded multi-round debate plus merged-diff fixture.

| Type.field | Exact blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `PersonaScore.personaId` | Scoring input fixture | Resolve roster ID | Reject score |
| `PersonaScore.window` | Scoring window fixture | Explicit date range | Reject score |
| `PersonaScore.debatesSeated` | Debate history fixture | Count projected records | Unknown, not zero |
| `PersonaScore.spoke` | Debate history fixture | Count projected records | Unknown, not zero |
| `PersonaScore.objected` | Verdict history fixture | Count projected records | Unknown, not zero |
| `PersonaScore.objectionsUpheld` | Merged-diff reflection fixture | Deterministic reflection rule | Unknown, not zero |
| `PersonaScore.upheldRate` | Same scoring fixture | `null` when objected is zero | `null` |
| `PersonaScore.changedPosition` | Multi-round fixture | Count `changedFrom` transitions | Unknown, not zero |
| `PersonaScore.caughtAlone` | Per-round multi-persona fixture | Count sole objections | Unknown, not zero |
| `PersonaScore.trend` | Multi-window fixture | Fixed window derivation | Unknown, not empty |
| `PersonaScore.status` | Roster lifecycle fixture | Exact status | Reject score |
| `PersonaScore.derivation` | Scoring output fixture | Mandatory basis string | Reject score |
| `PersonaScore.asOf` | Scoring clock fixture | Console computation instant | Reject score |

### Writes and materialisation

The W0 corpus contains emitted marker strings but no console write intent,
guard, adapter response, audit, or file-materialisation fixture. GitHub response
metadata explicitly covered by the tool contract is noted.

| Type.field | Exact source or blocker | Trust rule | When missing |
| --- | --- | --- | --- |
| `CreateIssue.connectionId` | NOT YET PROVEN - blocked on write-intent fixture | Persisted connection only | Reject request |
| `CreateIssue.repo` | NOT YET PROVEN - blocked on write-intent fixture | Allowlisted `owner/name` | Reject request |
| `CreateIssue.title` | NOT YET PROVEN - blocked on write-intent fixture | Human-supplied bounded text | Reject request |
| `CreateIssue.body` | NOT YET PROVEN - blocked on write-intent fixture | Human-supplied outbound body | Reject request |
| `CreateIssue.applyEnabledLabel` | NOT YET PROVEN - blocked on write-intent fixture | Explicit boolean | Reject request |
| `CommentOn.ref` | NOT YET PROVEN - blocked on write-intent fixture | Resolved `EntityRef` | Reject request |
| `CommentOn.body` | Emitted marker bytes prove valid outbound marker bodies; console intent fixture still missing | Never accept guessed/reformatted marker | Reject request |
| `SetLabel.ref` | NOT YET PROVEN - blocked on write-intent fixture | Resolved `EntityRef` | Reject request |
| `SetLabel.label` | Config `$.labels.enabled` proves configured opt-in label; intent fixture missing | Opt-in family only | Reject request |
| `SetLabel.add` | NOT YET PROVEN - blocked on write-intent fixture | Explicit boolean | Reject request |
| `SetMilestone.ref` | NOT YET PROVEN - blocked on write-intent fixture | Resolved `EntityRef` | Reject request |
| `SetMilestone.milestone` | Config `$.intake.milestones[]` proves allowed IDs; intent fixture missing | Positive configured integer | Reject request |
| `ApplyCouncilConfig.connectionId` | NOT YET PROVEN - blocked on write-intent fixture | Persisted connection only | Reject request |
| `ApplyCouncilConfig.rosterId` | NOT YET PROVEN - blocked on roster/write fixture | Referential integrity required | Reject request |
| `ApplyCouncilConfig.flowIds` | NOT YET PROVEN - blocked on flow/write fixture | Referential integrity required | Reject request |
| `WriteGuard.resolvedActor` | `gh api user` `.login` — **gh api — proven by tool contract** | Selected auth context; normalize for comparisons | Hard fail write |
| `WriteGuard.isBotActor` | Compare resolved actor to trusted bot set; trusted-set fixture missing | Exact normalized comparison; no override | Hard fail write |
| `WriteGuard.allowlisted` | NOT YET PROVEN - blocked on allowlist persistence fixture | Explicit allowlist | `false` |
| `WriteGuard.writesEnabled` | NOT YET PROVEN - blocked on write-policy fixture | Explicit policy; fixture mode false | `false` |
| `WriteGuard.authContextId` | NOT YET PROVEN - blocked on auth-context fixture | Non-secret ID only | Hard fail write |
| `WriteResult.ok` | NOT YET PROVEN - blocked on typed gh adapter response fixture | Adapter classification only | `false` |
| `WriteResult.url` | Successful create/comment API response `.html_url` — **gh api — proven by tool contract** | Same response as performed write | `null` |
| `WriteResult.error` | NOT YET PROVEN - blocked on typed adapter-error fixtures for every enum case | Never raw stderr | `transport` only when typed as such; otherwise reject result |
| `WriteResult.auditId` | NOT YET PROVEN - blocked on audit persistence fixture | Durable UUID | Reject result |
| `WriteResult.actor` | `gh api user` `.login` — **gh api — proven by tool contract** | Must equal guard actor | Reject result |
| `ConfigMaterialisation.path` | NOT YET PROVEN - blocked on materialisation fixture | Canonical, non-symlink managed path | Reject draft |
| `ConfigMaterialisation.baseHash` | NOT YET PROVEN - blocked on byte-level materialisation fixture | Hash exact base bytes | Reject draft |
| `ConfigMaterialisation.managedKeys` | NOT YET PROVEN - blocked on managed-key grammar fixture | Restricted grammar only | Reject draft |
| `ConfigMaterialisation.diff` | NOT YET PROVEN - blocked on three-way diff fixture | Exact base/current/proposed values | Reject draft |
| `ConfigMaterialisation.backupPath` | NOT YET PROVEN - blocked on atomic-write fixture | Created backup only | Reject applied result |
| `ConfigMaterialisation.state` | NOT YET PROVEN - blocked on materialisation lifecycle fixture | Exact tri-state; never claim runtime active | `draft` only if a valid draft exists; otherwise reject |
| `KeyDiff.key` | NOT YET PROVEN - blocked on diff fixture | Managed key only | Reject diff row |
| `KeyDiff.from` | NOT YET PROVEN - blocked on diff fixture | Exact base value | `null` only if absent in base |
| `KeyDiff.to` | NOT YET PROVEN - blocked on diff fixture | Exact proposed value | `null` only if removal is supported/proven |
| `KeyDiff.conflict` | NOT YET PROVEN - blocked on three-way conflict fixture | Compare base/current/proposed bytes | Reject diff row |

## Freeze boundary

`contracts/v1` is frozen only for the five marker kinds, complete
`devbored.config.v1`, the observed consensus proposal, and the observed reached
consensus result implemented in `contracts/`. GitHub metadata fields are proven
by the `gh api` tool contract but do not yet have console projection fixtures.
Every `NOT YET PROVEN` row remains outside the frozen implementation surface.

The Dart tests read the sibling fixtures directly. They do not copy the corpus,
so the reference package remains the single byte authority and any upstream
fixture change is observed immediately by the console test run.
