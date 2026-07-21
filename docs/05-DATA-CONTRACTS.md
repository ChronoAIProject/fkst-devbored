# 05 — Data contracts

Status: **LEGACY FROZEN-PARTIAL SOURCE** — superseded by
[`docs/spec/04-DATA-CONTRACTS.md`](spec/04-DATA-CONTRACTS.md); retained as
contract investigation evidence.
Version: `contracts/v1` (frozen-partial)
Date: 2026-07-20

This document is the interface between the UI layer and the service layer.
Both sides build against it independently. Types are given in a
language-neutral shape; the implementing stack renders them as immutable value
objects with equality.

**Change rule:** once frozen, a change requires an ADR in `docs/08` and a
version bump. Additive optional fields are minor; anything else is major and
requires both streams to re-sync.

**Universal rules**
- Every type carrying observed data has `asOf` (instant) and `source`
  (provenance string) — R7.6 is enforced at the type level, not by convention.
- Absent ≠ zero. Unknown values are `null` and MUST render as *unknown*.
- No type carries a secret. Auth is a non-secret `authContextId`.
- No type carries a raw comment body, log tail, or stderr (R2.2).

---

## 1. Identity

```
EntityRef {
  connectionId : Uuid
  githubHost   : String        // "github.com" | enterprise host
  repo         : String        // "owner/name"
  kind         : EntityKind    // issue | pullRequest
  number       : Int
}
// canonical key: "{connectionId}:{githubHost}:{repo}:{kind}:{number}"
```
Every cache row, view key, notification, and audit entry keys on this. R3.5.

```
EntityKind = issue | pullRequest
```

---

## 2. Connection

```
Connection {
  id                  : Uuid
  name                : String
  githubHost          : String
  primaryRepo         : String
  hostRoot            : Path
  targetCheckoutRoot  : Path
  platformRoot        : Path
  effectiveProfilePath: Path
  durableRoot         : Path
  binPath             : Path
  toolPaths           : Map<String, Path>     // gh, git, run.sh
  authContextId       : String                // non-secret
  rosterId            : Uuid                  // R4.1.2
  paused              : Bool
}

ConnectionDerived {          // recomputed per cycle, never user-editable (R3.1)
  trustedBotLogins    : Set<String>           // [bot]-normalised
  trustSource         : TrustSource           // profile | unverifiable
  claimMode           : ClaimMode             // assignee | label
  managedSiblingRepos : List<String>
  upstreamBranch      : String
  integrationBranch   : String
  posture             : Posture
  asOf                : Instant
  source              : String
}

TrustSource = profile | unverifiable   // unverifiable ⇒ all markers UNTRUSTED
ClaimMode   = assignee | label
Posture     = dryRunNextLaunch | liveNextLaunch | unknown   // R7.3 — never "live now"
```

```
DoctorReport {                                              // R3.6
  connectionId : Uuid
  checks       : List<DoctorCheck>
  verdict      : pass | warn | fail
  asOf         : Instant
}
DoctorCheck { id: String, label: String, status: pass|warn|fail|skip, detail: String? }
```

---

## 3. Runtime snapshot

```
RuntimeSnapshot {
  connectionId : Uuid
  queues       : List<QueueStat>
  deliveries   : DeliveryStat
  deadLetters  : Int?
  healthLine   : String?      // run.sh health, VERBATIM, never parsed (R7.1)
  reachable    : Bool
  asOf         : Instant
  source       : String       // "observe --json @ <durableRoot>"
}
QueueStat    { name: String, depth: Int?, inFlight: Int?, oldestPendingMs: Int?, subscriber: current|absent|unknown }
DeliveryStat { pending: Int?, inFlight: Int?, retrying: Int? }
```

`healthLine` is opaque. Any code that parses it violates R7.1.

---

## 4. Work entities

```
Entity {
  ref            : EntityRef
  title          : String
  state          : MarkerState        // from trusted marker only (R5.3)
  stateVersion   : String?
  stage          : Stage?             // derived; NOT interchangeable with state (see 09)
  stateAsOf      : Instant?
  dwell          : Duration?
  claim          : Claim?
  labels         : List<Label>        // hints only
  labelDrift     : Bool               // label disagrees with marker (R5.3)
  commentCount   : Int                // R5.6
  debateHeat     : DebateHeat
  convergeRound  : Int?
  blockedBy      : List<EntityRef>
  ci             : CiRollup?
  headSha        : String?
  linkedRef      : EntityRef?         // issue ↔ PR
  parseStatus    : parsed | unparseableSchema | untrusted
  asOf           : Instant
  source         : String
}

MarkerState = thinking | dependencyWait | ready | implementing | awaitingPr
            | prOpen | reviewing | mergeReady | fixing | reviewMeta | merging
            | merged | closedUnmerged | implFailed | declined | blocked

Stage      = design | build | review | ship | merged      // presentation grouping
DebateHeat = quiet | active | contested                   // thresholds in docs/06
Label      { name: String, isStateHint: Bool }
CiRollup   { status: pass|fail|running|none, passed: Int?, total: Int? }
```

`parseStatus` is mandatory. An entity whose marker schema is unrecognised MUST
surface as `unparseableSchema` — never silently defaulted (R7 / `docs/02` §5).

```
Claim {                                                    // R5.5
  holder      : String?          // bot login or human login; null = unclaimed
  isHuman     : Bool
  mode        : ClaimMode        // which authority produced this
  since       : Instant?         // ONLY from timeline events; else null
  ageUnknown  : Bool             // true when since is null
}
```

---

## 5. Debate

```
Debate {
  ref            : EntityRef
  rounds         : List<DebateRound>
  outcome        : DebateOutcome
  totalComments  : Int
  volumeByVoice  : Map<PersonaId, Int>
  asOf           : Instant
  source         : String
}

DebateRound {
  index          : Int
  kind           : designConsensus | prReview
  question       : String?         // narrowed question, if any
  narrowedBy     : PersonaId?
  messages       : List<DebateMessage>
}

DebateMessage {
  id             : String
  personaId      : PersonaId?      // null ⇒ human
  authorLogin    : String
  isHuman        : Bool
  verdict        : Verdict
  changedFrom    : Verdict?        // R4.4.3 — position change between rounds
  excerpt        : String          // bounded, projection-produced, NOT raw body (R2.2)
  at             : Instant
  permalink      : Url
  markerSchema   : String
}

Verdict        = approve | reject | concern | converge | consensusReached
               | veto | narrows | waiting | comment
DebateOutcome  = reached | converging | stalled | vetoed | blocked | merged
```

---

## 6. Council configuration

```
Persona {
  id            : PersonaId
  name          : String
  colorToken    : String        // token name from docs/06, never a raw hex
  initials      : String
  brief         : String        // the lens paragraph
  model         : String
  effort        : low|medium|high|xhigh|max
  seatedAt      : Set<FlowStepKind>
  isVeto        : Bool
  isVoting      : Bool          // meta-judge = false
  status        : active | retired
  retiredAt     : Instant?
  retiredReason : String?
}

Roster { id: Uuid, name: String, personaIds: List<PersonaId>, connectionIds: List<Uuid> }
```

```
Flow {
  id        : Uuid
  name      : String
  routing   : FlowRouting
  steps     : List<FlowStep>
  isDefault : Bool
}

FlowRouting { byLabel: List<String>, byRiskTier: List<String> }

FlowStep {
  kind         : FlowStepKind
  label        : String
  description  : String
  seatedIds    : List<PersonaId>       // empty for machine steps
  agreement    : AgreementRule?        // null for machine steps
  budgets      : Budgets
  branches     : List<FlowBranch>      // MUST cover agree / disagree / exhausted
  isMachineGate: Bool                  // merge gate: true ⇒ no seat controls (R4.2.4)
}

FlowStepKind  = intake | designConsensus | implement | prReview | mergeGate
AgreementRule { mode: unanimous|threshold, threshold: Int?, vetoPersonaIds: List<PersonaId> }
Budgets       { convergeRounds: Int?, fixRounds: Int?, stallUnchangedRounds: Int? }
FlowBranch    { condition: String, outcome: String, destination: String, tone: good|neutral|bad }
```

**Invariant (validated, not assumed):** for every non-machine step, `branches`
covers agree, disagree, and budget-exhausted. A flow failing this is invalid and
MUST NOT be saveable.

---

## 7. Scores

```
PersonaScore {
  personaId       : PersonaId
  window          : DateRange
  debatesSeated   : Int
  spoke           : Int
  objected        : Int
  objectionsUpheld: Int
  upheldRate      : Float?         // null when objected == 0 — NOT 0.0
  changedPosition : Int
  caughtAlone     : Int
  trend           : List<Float>
  status          : active | retired
  derivation      : String         // e.g. "merged-diff reflection, 214 debates"
  asOf            : Instant
}
```

`upheldRate` is `null`, never `0`, when a persona has never objected —
"never objected" and "always overruled" are different findings (R4.3.4).

---

## 8. Writes

```
WriteRequest =
  | CreateIssue  { connectionId, repo, title, body, applyEnabledLabel: Bool }
  | CommentOn    { ref: EntityRef, body: String }
  | SetLabel     { ref, label, add: Bool }        // opt-in family only (R6.5)
  | SetMilestone { ref, milestone }               // R6.5
  | ApplyCouncilConfig { connectionId, rosterId, flowIds: List<Uuid> }

WriteGuard {                                       // evaluated before EVERY write
  resolvedActor    : String
  isBotActor       : Bool        // true ⇒ hard fail, no override
  allowlisted      : Bool
  writesEnabled    : Bool
  authContextId    : String
}

WriteResult { ok: Bool, url: Url?, error: WriteError?, auditId: Uuid, actor: String }
WriteError  = notAllowlisted | botActor | writesDisabled | authFailed
            | rateLimited | conflict | upstreamRejected | transport
```

```
ConfigMaterialisation {                            // guarded file write (docs/04 §6)
  path          : Path
  baseHash      : String        // CAS — reject if the file moved under us
  managedKeys   : List<String>
  diff          : List<KeyDiff>
  backupPath    : Path
  state         : draft | appliedOnDisk | activeRuntimeUnknown
}
KeyDiff { key: String, from: String?, to: String?, conflict: Bool }
```

`state` is a tri-state on purpose: the console can prove a file was written, and
can never prove the running process picked it up.

---

## 9. Fixtures

Every contract type MUST have at least one recorded fixture in
`fixtures/contracts/v1/`, carrying `schemaVersion` and `capturedAt`, sanitised
per R2.2/R2.3. Fixtures are the shared test data for both streams and the demo
path (R8.3).

**A stream is not "done" until its fixtures round-trip.**

---

## Freeze checklist

- [ ] UI stream confirms every view's needs are expressible
- [ ] Service stream confirms every field is derivable from real sources
- [ ] Every type has `asOf` + `source` where it carries observed data
- [ ] No type can carry a secret or a raw body
- [ ] Fixtures exist and round-trip
- [ ] ADR recorded in `docs/08`; version set to `contracts/v1` **frozen**

⟦AI:FKST⟧
