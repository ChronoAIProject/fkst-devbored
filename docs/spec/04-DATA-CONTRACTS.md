# Data and authority contracts

Status: **AUTHORITATIVE TARGET; WORKFLOW/COUNCIL WIRE FREEZE IS P0**
Version: `full-app/v2`

This file defines the Flutter/domain seam and the minimum app-owned runtime
contracts. Fields marked `Step0Frozen` require executable Dart/Lua fixtures
before production code may depend on their exact enum, bound, or wire spelling.

## Universal rules

- Every observed aggregate carries source, as-of, and completeness.
- Unknown is `null` or an explicit enum, never a fabricated default.
- Every entity identity includes connection, GitHub host, repo, kind, and number.
- No contract carries credentials, unbounded content/logs, or raw stderr.
- Trust filtering happens before evidence parsing.
- A desired config is not active until the direct acceptance receipt proves its
  exact schema/id/version/digest and an owned process is launched from that same
  immutable snapshot. Work-stage truth still requires trusted durable evidence.
- Reference-package wire formats are fixtures only and do not become app schema.

## Dependency and connection identity

```text
SubstratePin {
  canonicalRoot           : Path
  expectedCommit          : GitSha
  actualCommit            : GitSha?
  binaryPath              : Path
  expectedSha256          : Sha256
  actualSha256            : Sha256?
  selfTestPassed          : Bool
  launchProvenanceVersion : String?
  observeSchemaVersion    : String?
  compatible              : Bool
}

DevloopPin {
  sourceDistributionRoot  : Path
  libraryRoot             : Path
  expectedCommit          : GitSha
  actualCommit            : GitSha?
  stableId                : "fkst.library.devloop"
  publicExportsDigest     : Sha256?
  appPackageVisible       : Bool
  declaredClosure         : Set<LibraryStableId>
  compatible              : Bool
}

AppLoopPackagePin {
  stableId                : Step0Frozen<String>
  sourceRoot              : Path
  sourceDigest            : Sha256
  graphDigest             : Sha256
  importsDigest           : Sha256
  compatibilityManifestId : String
}

CompatibilityManifest {
  schema                  : "fkst.devbored.compatibility.v1"
  id                      : SafeId
  generation              : PositiveInt
  digest                  : Sha256
  substrateCommit         : GitSha
  substrateBinarySha256   : Sha256
  observeSchemaVersion    : String
  devloopCommit           : GitSha
  devloopExportsDigest    : Sha256
  devloopClosure          : Set<LibraryStableId>
  appPackageStableId      : SafeId
  appPackageSourceDigest  : Sha256
  graphDigest             : Sha256
  allowedImportsDigest    : Sha256
  directHostContract      : DirectHostContract
  projectRootContract     : ProjectRootContract
  filesystemPolicy        : FilesystemContainmentPolicy
  processLifetimePolicy   : ProcessLifetimePolicy
  configAcceptanceContract: ConfigAcceptanceContract
  runtimeAcceptanceContract: RuntimeAcceptanceContract
  codexWorkerPolicy       : CodexWorkerPolicy
  claimModes              : NonEmptySet<ClaimMode>
  workflowCapabilities    : WorkflowCapabilities
  evidenceContract        : EvidenceCarrierContract
  effects                 : List<EffectCapability>
}

DirectHostContract {
  frameworkCommand       : AbsolutePath
  supervisorCommand      : AbsolutePath
  requiredEnvironmentKeys: Set<String>
  processContractVersion : String
  detachBehavior         : none | Step0Frozen<String>
}

ProjectRootContract {
  mode                    : reservedInManagedClone | repoRootSeparated
  compositionRelativePath : RelativePath?
  localExcludeRequired    : Bool
  managedGitTopLevel      : true
  controlFilesTracked     : false
}

FilesystemContainmentPolicy {
  mode                    : substrateCapabilityBoundary
                          | sandboxWithNonEscalatingCapabilityBrokers
  supportedPlatforms      : NonEmptySet<macos | linux>
  descendantEnforced      : true
  processWideSandboxAlone : false
  grantTemplates          : NonEmptyList<RootGrantTemplate>
  profileContract         : FilesystemProfileContract
  protectedRoots          : ProtectedRootPolicy
}

RootGrantKind = runtime | durable | boundedLog | loopRatePool
              | codexWorkerState | managedGitTree

WriterCapability = substrateEngine | boundedLogger | loopRatePool
                 | codexWorker | devloopGitBroker | outerJobLauncher

RootGrantTemplate {
  kind                    : RootGrantKind
  scope                   : connection | launch | managedGitTree
  writers                 : NonEmptySet<WriterCapability>
  genericPackageFileAccess: denied | boundedToGrant
  maxInstances            : PositiveInt
  maxBytes                : PositiveInt
  maxFiles                : PositiveInt
  maxPathDepth            : PositiveInt
  effectReceiptRequired   : Bool
}

FilesystemProfileContract {
  schema                  : SafeId
  version                 : PositiveInt
  maxEncodedBytes         : PositiveInt
  canonicalDigest         : sha256
  defaultWritePolicy      : deny
}

ProtectedRootPolicy {
  dependencyRoots         : readOnly
  appPackageRoot          : readOnly
  desiredConfigRoot       : readOnly
  launchConfigRoot        : readOnly
  credentialMaterial      : unreachable
  appControlSubpaths      : readOnlyOrUnreachable
  managedGitMetadata      : exactQualifiedArgvEffectOnly
  unrelatedUserPaths      : unreachable
}

ProcessLifetimePolicy {
  ownershipMechanism      : Step0Frozen<String>
  parentDeathMechanism    : Step0Frozen<String>
  controlChannel          : Step0Frozen<String>
  cleanupReceiptSchema    : SafeId
  cleanupReceiptVersion   : PositiveInt
  maxCleanupReceiptBytes  : PositiveInt
  cleanupReceiptCarrier   : CleanupReceiptCarrier
  termGraceSeconds        : PositiveInt
  killGraceSeconds        : PositiveInt
  descendantTracking      : processGroupAndStartIdentity
  detachedDescendants     : forbidden
  zeroSurvivorsRequired   : true
}

CleanupReceiptCarrier {
  rootKind                : boundedLog
  writer                  : outerJobLauncher
  relativeSubpathContract : Step0Frozen<String>
  writeMode               : createExclusiveAtomicFsync
  relaunchReadMode        : appReadOnly
  rawLogInference         : forbidden
}

ConfigAcceptanceContract {
  departmentPath : RelativePath
  inputSchema    : String
  receiptSchema  : String
  maxStdoutBytes : PositiveInt
  noEffect       : true
}

RuntimeAcceptanceContract {
  bootstrapDepartmentPath: RelativePath
  triggerSchema          : String
  receiptSchema          : String
  carrier                : Step0Frozen<String>
  maxWaitSeconds         : PositiveInt
  maxReceiptBytes        : PositiveInt
}

CodexWorkerPolicy {
  argvContractVersion       : SafeId
  supportedCliVersions      : NonEmptySet<String>
  accountIsolation          : dedicatedHomeWithOsKeyring
  processHomeIsolation      : dedicatedEmptyHome
  credentialTrustBoundary   : pinnedRuntimeTree
  legacyContextFlag         : false
  ignoreUserConfig          : true
  ignoreRules               : true
  strictConfig              : true
  projectTrust              : untrusted
  projectDocsMaxBytes       : 0
  personalSkills            : disabled
  hooks                     : disabled
  webSearch                 : disabled
  mcp                       : none
  apps                      : disabled
  plugins                   : disabled
  goals                     : disabled
  multiAgent                : disabled
  managedRequirementsPolicy : exactPolicyOrBlock
  managedRequirementsDigest : Sha256
  resolvedConfigDigest      : Sha256
  councilToolSurfaceDigest  : Sha256
  implementationToolSurfaceDigest: Sha256
  ephemeralSession          : true
  approvalPolicy            : never
  councilSandbox            : readOnly
  implementationSandbox     : workspaceWrite
  sandboxNetworkAccess      : false
  commandEnvironmentPolicyId: SafeId
}

WorkflowCapabilities {
  families             : NonEmptyMap<SafeId,WorkflowFamily>
  stageKinds           : NonEmptySet<StageKind>
  terminalKinds        : NonEmptySet<TerminalKind>
  maxStages            : PositiveInt
  maxCouncilSeats      : PositiveInt
  maxCouncilRounds     : PositiveInt
  maxStageAttempts     : PositiveInt
  maxStageTimeoutSeconds: PositiveInt
  maxSeatTimeoutSeconds: PositiveInt
  maxTransitions       : PositiveInt
  maxImplementationCycles: PositiveInt
  configChangesNeedStop: true
}

WorkflowFamily {
  id                    : SafeId
  orderedStageKinds     : BoundedNonEmptyUniqueList<StageKind>
  outcomeRoutes         : BoundedNonEmptyList<OutcomeRoute>
  exhaustionPolicy      : WorkflowExhaustionPolicy
}

OutcomeRoute {
  from                  : StageKind
  outcome               : StageOutcome
  to                    : StageKind?
  terminal              : TerminalKind?
  consumesStageAttempt  : Bool
  consumesImplementationCycle: Bool
  onStageAttemptsExhausted: ExhaustionTerminal?
  onImplementationCyclesExhausted: ExhaustionTerminal?
}

WorkflowExhaustionPolicy {
  onTransitionsExhausted : ExhaustionTerminal
  onCouncilRoundsExhausted: ExhaustionTerminal
}

ExhaustionTerminal {
  terminal  : Step0Frozen<hold>
  reasonCode: Step0Frozen<BudgetExhaustionReason>
}

BudgetExhaustionReason = stageAttemptsExhausted | councilRoundsExhausted
                       | implementationCyclesExhausted | transitionsExhausted

EvidenceCarrierContract {
  envelopeSchema       : String
  acceptedCommentMarker: String
  trustedAuthorPolicyId: SafeId
  publishPublicSeam    : Step0Frozen<String>
  receiptSchema        : String
  targetKinds          : NonEmptySet<issue | pullRequest>
  createOnly           : true
  preReadBeforeCreate  : true
  reconcileAfterAmbiguity: true
  retryableOutcomes    : Step0Frozen<Set<confirmedNotSent>>
  ambiguousOutcome     : Step0Frozen<hold>
  ambiguousReasonCode  : Step0Frozen<publicationOutcomeUnknown>
  autoRetryAfterAmbiguous: false
  postWriteReadBack    : true
  maxEnvelopeBytes     : PositiveInt
  maxEvidencePerEntity : PositiveInt
}

EffectCapability {
  id             : SafeId
  publicSeam     : String
  posture        : none | dry | live
  idempotency    : String
  reconciliation : String
  receipt        : String
}

CodexCliContext {
  executablePath           : Path
  actualVersion            : String?
  authContextId            : String
  codexHomeRef              : String
  workerProcessHomeRef      : String
  credentialStorageMode    : osKeyring
  nonInteractiveProbePassed: Bool
  compatible               : Bool
}

CompatibilityManifestSelection {
  id        : SafeId
  generation: PositiveInt
  digest    : Sha256
  sourcePath: Path
}

Connection {
  id                    : Uuid
  name                  : String
  substrate             : SubstratePin
  devloop               : DevloopPin
  appLoopPackage        : AppLoopPackagePin
  compatibilityManifest: CompatibilityManifestSelection
  codexCli              : CodexCliContext
  githubHost            : String
  repo                  : String              // owner/name
  workingClone          : Path
  originUrl             : HttpsUrl
  targetBranch          : GitRef
  managedGitRoot        : Path
  claimMode             : ClaimMode
  loopAuthContextId     : String
  operatorAuthContextId : String
  runtimeBase           : Path
  durableRoot           : Path
  configRoot            : Path
  logRoot               : Path
  loopRatePoolRoot      : Path
  codexWorkerStateRoot  : Path
  workflowSelection     : ConfigSelection
  councilSelection      : ConfigSelection
  posture               : dry | liveRequested
  loopLiveAllowlisted       : Bool
  operatorWritesAllowlisted : Bool
  paused                : Bool
}

ConfigSelection {
  id             : SafeId
  desiredVersion : PositiveInt
  desiredDigest  : Sha256
}

ClaimMode = label | assignee
```

The two GitHub context ids are distinct and independently selected without
changing global `gh` state. Codex account selection references an
operator-created dedicated worker `CODEX_HOME` authenticated normally against
the owner's personal account with OS-keyring storage; no credential file is
copied into app storage. The worker also receives an operator-created dedicated
empty process `HOME`, not the user's normal home; it contains no `.agents`,
personal skills, project bootstrap, or unrelated dotfiles. The Codex home is
otherwise isolated and is not treated as “account state only”: any non-auth
state it creates is bounded worker state.

`managedGitRoot` is an app-created canonical parent that is never a user
checkout. `workingClone`, the reserved composition root, Git common directory,
linked worktree metadata, and all issued worktree content paths must resolve
under it without symlink/alias escape. `codexWorkerStateRoot` is a separate
bounded noncredential root; neither Codex credential material nor the dedicated
process HOME is placed inside it.

Step 0 freezes the actual installed-CLI argument grammar and its canonical
ordered argv. For CLI 0.144.6 the global approval/sandbox/config/feature
overrides precede `exec`; `--ignore-user-config`, `--ignore-rules`, and
`--ephemeral` are exec-subcommand flags. A representative shape is:

```text
codex --strict-config --ask-for-approval never --sandbox <role>
      -C <qualified-worktree>
      --disable <each denied installed feature>
      -c <keyring/project-untrusted/project-docs-zero/empty-MCP/apps/skills/
          web-search-disabled/sanitized-command-env overrides>
      exec --ignore-user-config --ignore-rules --ephemeral -
```

The frozen argv must explicitly disable hooks, cached/live web search, MCP,
apps/connectors, plugins/catalog discovery, goals, multi-agent, personal skills,
project documentation/rules/config trust, and every other installed effectful
surface not in the role allowlist. The resolved effective configuration must
equal the frozen policy; incompatible system/managed requirements block Doctor
and Start rather than being assumed overrideable. The probe hashes managed-
requirements, resolved effective-configuration, and actual available-tool digests,
then negative-tests web/MCP/app/plugin/hook/skill/subagent and undeclared process
access. Merely observing that a smoke worker did not use them is insufficient.
The implementation command environment is an explicit include-only set and
does not expose credential paths/tokens to model-generated commands.

The integrated package omits substrate `context`; `--context` must be absent.
Council/review use `read-only`; implementation uses `workspace-write` at the
qualified managed worktree. Omitted sandbox is forbidden because the audited
substrate converts it to unrestricted bypass; `danger-full-access`, both bypass
flags, extra writable dirs, and sandbox command network are never admitted.
R-051 now proves the managed substrate argv/environment/receipt portion with
fake executables and hostile probes; RDY-20 remains partial until R-052 binds
the final build and the app-specific grant plus personal-account smoke pass. The
pinned substrate/public-devloop/app-package tree is the reviewed trusted runtime
boundary; untrusted repository/model data never receives credential reads or an
unbounded egress/process surface. Model/effort controls remain absent until a
separately pinned public capability forwards and proves them. `claimMode` is always
explicit; absence never silently selects the devloop default. The target v1
manifest admits `label` only: the audited public assignee path can emit a
forbidden `github-proxy.*` fork request for other-authored work. `assignee`
remains absent from UI/config until a proxy-free public seam and its probes pass.

`connectionRevision` is the canonical SHA-256 of every load-bearing selection:
compatibility-manifest id/generation/digest; all dependency and app-package
pins; repo/branch/working-clone and canonical roots; loop/operator GitHub context
ids; Codex `authContextId`, canonical `executablePath`, and approved
`codexHomeRef` plus `workerProcessHomeRef`; claim mode; desired
Workflow/Council ids/versions/digests;
posture; and both write/effect allowlists. The manifest digest commits to the
supported CLI-version selector and worker policy. The live `actualVersion` and
login/smoke results remain current Doctor evidence rather than revision input;
an unsupported value blocks Start. Display name, paused state, window state, and
refresh preferences are excluded. Any included value change invalidates Doctor,
config acceptance, and Start. The canonical field list is fixture-tested and
cannot be extended silently.

The manifest `digest` is SHA-256 over its Step-0-frozen canonical JSON with the
`digest` field omitted. A selection is usable only when its id, generation,
digest, and canonical source path all resolve to the same immutable manifest;
silent replacement at the path invalidates Doctor and Start.

An already owned run retains its archived launch `connectionRevision`. Editing
next-launch desired state creates a new current revision and drift/pendingStop;
it does not retroactively relabel the active run or invalidate evidence whose
envelope matches the archived active receipt. Start/restart requires the new
revision to pass Doctor and acceptance.

## Doctor and readiness

```text
DoctorReport {
  connectionId       : Uuid
  connectionRevision : Sha256
  checks             : List<DoctorCheck>
  verdict            : pass | warn | fail
  asOf               : Instant
}

DoctorCheck {
  id          : String
  boundary    : substrate | devloop | appPackage | codexCli
              | github | git | host | workflow | council | app
  status      : pass | warn | fail | skip
  detail      : String?
  evidenceRef : String?
  remediation : String?
}

ReadinessItem {
  id          : String
  priority    : p0 | p1
  status      : pass | partial | fail | gated
  commit      : GitSha?
  evidenceRef : String?
}
```

`grantTemplates` contains exactly one template for each of the six
`RootGrantKind` values and no other kind. For `managedGitTree`, `codexWorker`
receives only an issued resolved worktree-content subpath.
`devloopGitBroker` owns Git metadata and may also write an exact resolved
content subpath only during the frozen qualified argv-only worktree preparation,
recovery, or exact-ref checkout effects, each with a typed receipt. It has no
general content-write grant. A generic package `file.*` or generic spawned
executable never inherits either capability. A
process-wide profile that must grant the substrate parent a path so a narrower
child can use it is insufficient by itself: Step 0 must prove a root-confined
substrate capability boundary or a broker that starts with, and cannot be
escalated beyond, its narrower grant.

The `boundedLog` template has two non-overlapping writer subgrants: the bounded
logger may write only rotating log subpaths, while `outerJobLauncher` may write
only the create-exclusive cleanup-receipt subpath. The latter remains available
after Flutter parent death, is atomically flushed before job completion, and is
read-only to the relaunched app. It is structured receipt transport inside an
existing root kind, never a seventh writable root and never evidence inferred
from raw log text.

A Doctor pass authorizes one unchanged connection revision. It cannot override
a red P0 readiness row or bless an imported reference package.

## App-owned Workflow contract

The following is the minimum semantic model. Step 0 freezes exact wire names,
bounds, allowed stage kinds, and topology families through cross-language
fixtures and one real no-write run.

```text
WorkflowDefinition {
  schema          : Step0Frozen<"fkst.devbored.workflow.v1">
  id              : SafeId
  version         : PositiveInt
  name            : NonEmptyString
  summary         : NonEmptyString
  familyId        : SafeId
  intake          : WorkflowIntake
  stages          : BoundedNonEmptyList<WorkflowStage>
  maxTransitions  : PositiveInt
  maxImplementationCycles: PositiveInt
  terminalPolicy  : WorkflowTerminalPolicy
}

WorkflowIntake {
  requireOptIn : Bool
  optInLabel   : NonEmptyString?
  milestones  : List<PositiveInt>
  authorPolicy: any | collaborator | member
}

WorkflowStage {
  id            : SafeId
  kind          : Step0Frozen<StageKind>
  council       : CouncilAssignment?
  maxAttempts   : PositiveInt?
  timeoutSeconds: PositiveInt?
  gate          : GatePolicy?
}

CouncilAssignment {
  councilId: SafeId
  policyId : SafeId
}

GatePolicy {
  requireCiGreen          : Bool
  requireHeadBoundDecision: Bool
  targetBranch            : GitRef?
}

WorkflowTerminalPolicy {
  allowed : Step0Frozen<Set<TerminalKind>>
}
```

V1 is bounded by the static graph capabilities proven for the app package.
The UI does not accept an arbitrary DAG, unknown stage kind, unbounded step
count, executable string, or hidden model option.

The target v1 vocabulary to be frozen in Step 0 is intentionally small:

```text
StageKind   = intake | councilDesign | implement | openPullRequest
            | councilReview | machineGate | terminal
TerminalKind = hold | merge
StageOutcome = admitted | rejected | approved | changesRequested
             | inconclusive | succeeded | failed | timedOut
             | gatePassed | gateFailed | gatePending | held | merged
```

`familyId` resolves a complete `WorkflowFamily` in the compatibility manifest.
Stages configure that family's bounded ordered stage instances; users do not
author edges. Every `{from,outcome}` pair admitted by the family resolves to
exactly one next stage or terminal, and every possible runtime outcome is
covered. Unknown/duplicate routes, unreachable stages, a route outside the
ordered family, a cycle with no decrementing budget, or configured bounds above
the manifest caps fail validation. `councilDesign` and `councilReview` require a
Council assignment; other kinds reject one.

V1 stage addressability is by unique kind/slot. `WorkflowDefinition.stages`
must have unique stage ids and unique kinds, and
`stages.map(kind) == family.orderedStageKinds` byte-for-byte and in order.
Duplicate, omitted, extra, or reordered kinds fail validation, so a route target
can never resolve to two stage instances.

Each retry-to-self route sets `consumesStageAttempt=true` and defines its exact
`onStageAttemptsExhausted` hold. Each review/CI route back to implementation sets
`consumesImplementationCycle=true` and defines its exact cycle-exhaustion hold.
Those exhaustion fields are forbidden when the corresponding counter is not
consumed. The family separately defines transition- and Council-round-cap holds.
Every exhaustion terminal must be admitted by `terminalKinds` and the Workflow
terminal policy; v1 fixes all four to `hold` with the reason enum above.

The target v1 family is `issueCouncilDelivery`:

| From | Outcome | Route |
|---|---|---|
| intake | admitted | councilDesign |
| intake | rejected | hold |
| councilDesign | approved | implement |
| councilDesign | changesRequested/failed/timedOut | hold |
| councilDesign | inconclusive at `maxRounds` | hold / `councilRoundsExhausted` |
| implement | succeeded | openPullRequest |
| implement | failed/timedOut | retry same stage and consume attempt; exhausted → hold / `stageAttemptsExhausted` |
| openPullRequest | succeeded | councilReview |
| openPullRequest | failed/timedOut | reconcile, then retry/consume attempt; exhausted → hold / `stageAttemptsExhausted` |
| councilReview | approved | machineGate |
| councilReview | changesRequested | implement/consume cycle; exhausted → hold / `implementationCyclesExhausted` |
| councilReview | inconclusive at `maxRounds` | hold / `councilRoundsExhausted` |
| councilReview | failed/timedOut | hold |
| machineGate | gatePassed | terminal |
| machineGate | gateFailed | implement/consume cycle; exhausted → hold / `implementationCyclesExhausted` |
| machineGate | gatePending/timedOut | hold |
| terminal | merged | merge |
| terminal | held or unavailable merge capability | hold |

The family freezes exact retry and exhaustion semantics in Step 0. The first
stage invocation has attempt 1. A retry computes `nextAttempt=current+1`; if it
exceeds the stage cap, the same atomic reducer decision emits the specified hold
without invoking the stage again. A cycle route likewise computes the next
cycle and substitutes its hold before exceeding the cap. `maxTransitions`
counts every committed route decision including terminalization: if the next
route would enter another stage at index `>= maxTransitions`, the reducer emits
the transition-exhaustion hold at that final allowed index instead. A configured
cap too small for the family's shortest stage-to-terminal route fails validation.
No counter ever exceeds its cap. This makes review/CI rework bounded and
prevents an invisible infinite loop.
`merge` is admitted only when public devloop exposes an exact-head, post-gate
merge capability with effect receipt and replay proof. Otherwise the only
shippable terminal is `hold`; the UI must say that an operator merges outside
the app.

`openPullRequest` is create-or-correlate, not create-every-time. After review or
CI routes back to `implement`, the implementation stage works on the already
qualified PR head branch. The following `openPullRequest` stage must correlate
that same PR and new head; it may create only when no qualified PR exists.
Multiple qualified matches, changed base/repo, or stale head fail closed.

An ambiguous merge effect does not emit `merged` or pretend the PR is unmerged.
The runtime stops further effects and reconciles within a frozen bound. A
confirmed merge routes to `merge`; a confirmed non-merge/denial routes to
`hold`; an unresolved cap emits `hold` with reason `mergeOutcomeUnknown` and an
unknown merge-state fact that instructs the operator to inspect GitHub. It must
not show the ordinary “Ready for operator merge” copy.

Every `CouncilAssignment` must resolve both ids against the selected/available
Council definition at validation and activation time. Missing Council or policy,
cross-connection reference, or a stage kind that cannot deliberate fails
closed and participates in the canonical Workflow digest.

## App-owned Council contract

```text
CouncilDefinition {
  schema   : Step0Frozen<"fkst.devbored.council.v1">
  id       : SafeId
  version  : PositiveInt
  name     : NonEmptyString
  seats    : BoundedNonEmptyList<CouncilSeat>
  policies : NonEmptyMap<SafeId,CouncilPolicy>
}

CouncilSeat {
  id          : SafeId
  displayName : NonEmptyString
  lens        : Step0Frozen<SeatLens>
}

CouncilPolicy {
  roster        : BoundedNonEmptyList<SafeId>  // unique seat ids
  agreement     : Step0Frozen<AgreementPolicy>
  maxRounds     : PositiveInt
  timeoutSeconds: PositiveInt
  dissentRule   : Step0Frozen<DissentRule>
}
```

`SeatLens`, `AgreementPolicy`, and `DissentRule` cannot be invented from the
old Council mock or reference consensus package. Step 0 admits only values the
new integrated package consumes and can prove through emitted evidence. Persona
prompt bodies, per-seat model/effort, and semantic scores are absent.

The target v1 policy is mechanically decidable rather than semantic scoring:

```text
SeatLens       = product | architecture | implementation | quality | security
SeatVerdict    = approve | changesRequested | abstain | failed
AgreementPolicy = unanimous | simpleMajority
CouncilDecision = approved | changesRequested | inconclusive
DissentRule     = explicitChangesRequested
```

Each lens selects an immutable, app-package-owned prompt template. The operator
edits the seat id/display name/lens, never the prompt body. Each roster seat is
invoked at most once per round and must return one bounded structured verdict;
malformed, timed-out, or missing output becomes `failed`, never approval.
`unanimous` approves only if every roster seat approves. `simpleMajority`
approves only when more than half of the full configured roster approves.
Otherwise at least one `changesRequested` yields that decision; all other
non-approvals yield `inconclusive`. Dissent is exactly the ordered set of seats
whose valid verdict is `changesRequested`. Target bounds are 1..5 unique seats,
1..3 rounds, and a per-seat timeout admitted by the compatibility manifest.
Step 0 may tighten those bounds, but may not add a new editable field without a
consumer and evidence fixture.

`WorkflowStage.maxAttempts`, stage timeout, `CouncilPolicy.maxRounds`, and seat
timeout are all bounded above by the corresponding compatibility-manifest caps.
`DissentRule` has exactly one v1 value: it records the ordered roster seats with
valid `changesRequested` verdicts. No prompt or model may reinterpret dissent.

Round progression is also mechanical. `approved` and `changesRequested` end
the Council stage immediately. Only `inconclusive` may start the next round,
and only while `round < maxRounds`; before the cap it is an internal Council
result and does not enter the Workflow reducer. At the cap it completes the
stage as `inconclusive`, and the family emits its `councilRoundsExhausted` hold.
Every later round receives the immutable task/head
context plus the preceding structured verdicts/excerpts; it cannot silently
change Workflow, Council, head, or connection revision. Replay of an already
accepted round returns the same evidence rather than invoking a seat twice.

## Config materialization and activation

```text
LaunchId = Uuid

ResolvedRootGrant {
  kind                    : RootGrantKind
  canonicalPath           : AbsolutePath
  canonicalPathIdentity   : String
  scopeKey                : String
  writer                  : WriterCapability
  allowedSubpathsDigest   : Sha256
  genericPackageFileAccess: denied | boundedToGrant
  maxBytes                : PositiveInt
  maxFiles                : PositiveInt
  maxPathDepth            : PositiveInt
  effectReceiptRequired   : Bool
}

ResolvedProtectedPath {
  kind          : dependency | appPackage | desiredConfig | launchConfig
                | appControl
  canonicalPath : AbsolutePath
  pathIdentity  : String
  access        : readOnly | unreachable
}

ManagedGitCapabilityGrant {
  canonicalManagedGitRoot : AbsolutePath
  workingCloneRoot         : AbsolutePath
  allowedWorktreeParent    : AbsolutePath
  worktreeRelativePathPolicyDigest: Sha256
  worktreeContentRoots     : Set<AbsolutePath>
  maxWorktrees             : PositiveInt
  gitCommonDir             : AbsolutePath
  linkedWorktreeGitDirs    : Set<AbsolutePath>
  repo                     : String
  allowedRefs              : NonEmptySet<GitRef>
  gitArgvContractId        : SafeId
  brokerCapabilityId       : SafeId
  brokerMetadataEffectsDigest: Sha256
  brokerContentWriteEffects: Step0Frozen<Set<prepareWorktree
                            | recoverWorktree | checkoutExactRef>>
  genericPackageFileAccess : denied
  genericExecAccess        : denied
  effectReceiptSchema      : SafeId
  worktreeGrantReceiptSchema: SafeId
  maxWorktreeGrantReceiptBytes: PositiveInt
}

ManagedWorktreeGrantReceipt {
  schema                    : SafeId
  launchId                  : LaunchId
  filesystemProfileDigest  : Sha256
  workId                    : String
  repo                      : String
  canonicalWorktreeRoot     : AbsolutePath
  canonicalPathIdentity     : String
  linkedWorktreeGitDir      : AbsolutePath
  gitCommonDir              : AbsolutePath
  branch                    : GitRef
  startingHead              : GitSha
  codexWritableSubpathsDigest: Sha256
  issuedAt                  : Instant
  expiresAt                 : Instant
  digest                    : Sha256
}

LaunchFilesystemProfile {
  schema                    : SafeId
  version                   : PositiveInt
  connectionId              : Uuid
  connectionRevision        : Sha256
  launchId                  : LaunchId
  containmentPolicyDigest   : Sha256
  rootGrants                : NonEmptyList<ResolvedRootGrant>
  protectedPaths            : NonEmptyList<ResolvedProtectedPath>
  credentialMaterial        : unreachable
  unrelatedUserPaths        : defaultDeny
  managedGitCapability      : ManagedGitCapabilityGrant
  digest                    : Sha256
}

LaunchSnapshot {
  schema                    : Step0Frozen<"fkst.devbored.launch-snapshot.v1">
  launchId                  : LaunchId
  connectionId              : Uuid
  connectionRevision        : Sha256
  compatibilityManifestId   : SafeId
  compatibilityManifestDigest: Sha256
  appPackageSourceDigest    : Sha256
  graphDigest               : Sha256
  workflowDigest            : Sha256
  councilDigest             : Sha256
  filesystemProfile         : LaunchFilesystemProfile
  immutable                 : true
  createdAt                 : Instant
  digest                    : Sha256
}

ConfigDraft<T> {
  connectionId : Uuid
  baseHash     : Sha256
  baseVersion  : PositiveInt
  desired      : T
}

ConfigMaterialization {
  kind       : workflow | council
  state      : draft | written | pendingStop | acceptancePending
             | acceptedForNextLaunch | active | conflict | failed
  path       : Path
  baseHash   : Sha256
  writtenHash: Sha256?
  backupPath : Path?
  diff       : List<FieldDiff>
  launchId   : LaunchId?
}

AcceptedConfigEvidence {
  kind       : workflow | council
  schema     : String
  id         : SafeId
  version    : PositiveInt
  digest     : Sha256
  runId      : String
  evidenceUrl: Url?
  trusted    : Bool
  asOf       : Instant
}

ConfigAcceptanceReceipt {
  schema                 : Step0Frozen<"fkst.devbored.config-accepted.v1">
  connectionRevision     : Sha256
  compatibilityManifestId: SafeId
  appPackageSourceDigest : Sha256
  graphDigest            : Sha256
  launchId               : LaunchId
  launchSnapshotDigest   : Sha256
  filesystemProfileDigest: Sha256
  workflow               : AcceptedConfigEvidence
  council                : AcceptedConfigEvidence
  noEffect               : true
  emittedAt              : Instant
}

RuntimeConfigAcceptanceReceipt {
  schema                 : Step0Frozen<"fkst.devbored.runtime-config-accepted.v1">
  connectionRevision     : Sha256
  compatibilityManifestId: SafeId
  appPackageSourceDigest : Sha256
  graphDigest            : Sha256
  launchId               : LaunchId
  launchSnapshotDigest   : Sha256
  filesystemProfileDigest: Sha256
  directAcceptanceDigest : Sha256
  workflowDigest         : Sha256
  councilDigest          : Sha256
  processInstanceId      : String
  emittedAt              : Instant
}

FieldDiff {
  path          : String
  baseJson      : JsonValue?
  currentJson   : JsonValue?
  desiredJson   : JsonValue?
  classification: unchanged | appChange | externalChange | conflict
}
```

`LaunchFilesystemProfile` is canonical immutable launch input, not a UI-derived
path list. Its digest omits only `digest`. Every resolved grant must match one
manifest template, use an absolute canonical symlink-free path and stable path
identity, remain inside the connection-qualified root for its kind, satisfy
the template's instance/byte/file/depth bounds, and name the only writer
capability that may use it. The profile resolves the fresh runtime instance,
stable durable/log/rate/noncredential-Codex-state roots, and the complete
managed Git tree; it also enumerates every known protected dependency/app/
config/app-control path and applies default-deny to everything else.

The managed Git tree contains both worktree content and Git's real metadata
topology. The `.git` indirection is resolved to `gitCommonDir` and each linked
worktree metadata directory before launch. Only the narrow public-devloop Git
broker may mutate that metadata under the frozen argv/repo/ref/effect contract
and typed receipt. It may populate/repair resolved worktree content only during
the three manifest-listed preparation/recovery/exact-ref checkout effects; all
other broker content writes fail. Generic package file access and generic exec
are denied.
Codex receives only an unexpired, bounded `ManagedWorktreeGrantReceipt` for the
exact content subpaths of one qualified worktree. A dynamically created
worktree receipt binds back to the immutable launch profile, stays below
`maxWorktrees`, resolves under `allowedWorktreeParent`, and cannot expand the
Git broker or metadata grant. The substrate parent cannot receive a broad path
permission merely so a child might need it; process-wide sandbox inheritance
without a non-escalating broker/root-confined capability does not satisfy the
policy.

`LaunchSnapshot.digest`, both config receipts, the runtime process evidence,
every issued worktree grant, and the cleanup receipt bind the same
`filesystemProfileDigest`. A mismatch, mutable/replaced path identity,
overlapping incompatible grant, out-of-profile effect, or missing protected
path invalidates Doctor/Start and cannot be reconciled as an expected effect.

`directAcceptanceDigest` is the canonical SHA-256 of the complete
`ConfigAcceptanceReceipt`. `acceptedForNextLaunch` requires a valid receipt from the Step-0-frozen direct
substrate no-effect probe over the immutable launch snapshot. `active` also
requires an owned process plus a distinct `RuntimeConfigAcceptanceReceipt`
emitted after an event executes inside that supervised process, all bound to the
same launch id, connection revision, package/graph/config digests, and process
instance. Exact argv/PID proves launch intent only; it cannot substitute for
runtime consumption acknowledgement. The acknowledgement carrier must be a
Step-0-proven public substrate seam or a bounded write-once runtime receipt
confined by an executable OS/path policy; raw logs, inferred deliveries, and
undocumented substrate files are forbidden. A file write alone reaches only
`written`; if a loop is running it becomes `pendingStop`. V1 never hot-reloads
config.

## Lifecycle and runtime observation

```text
LifecycleState = unconfigured | doctorRunning | invalid | ready | starting
               | ownedRunning | unownedObservation | stopping | crashed
               | cleanupFailed

CleanupStatus = notRequired | pending | verifiedZeroSurvivors | failed | unknown

OwnedProcessIdentity {
  pid              : PositiveInt
  startIdentity    : String
  processGroupId   : PositiveInt?
}

ProcessExitEvidence {
  kind          : clean | nonzero | signal | unknown
  exitCode      : Int?
  signal        : String?
  observedAt    : Instant
}

CleanupReceipt {
  schema                   : SafeId
  version                  : PositiveInt
  launchId                 : LaunchId
  launchSnapshotDigest     : Sha256
  filesystemProfileDigest : Sha256
  jobIdentity              : String
  outerProcess             : OwnedProcessIdentity
  outerExit                : ProcessExitEvidence
  trackedIdentitySetDigest : Sha256
  trigger                  : normalExit | stopRequested | appParentDeath
                           | controlChannelEof | supervisorHung
                           | outerProcessExitedUnexpectedly | forcedRecovery
  termOutcome              : notNeeded | exited | timedOut | failed
  killOutcome              : notNeeded | exited | timedOut | failed
  detachOutcome            : none | denied | escaped | unknown
  scanCompleteness         : complete | incomplete | unknown
  survivorStatus           : zero | nonzero | unknown
  survivorCount            : NonNegativeInt?
  completedAt              : Instant
  digest                   : Sha256
}

ProcessEvidence {
  ownership          : owned | unowned | unknown
  pid                : Int?
  startedAt          : Instant?
  exitedAt           : Instant?
  exitCode           : Int?
  connectionRevision : Sha256?
  runtimeRoot        : Path?
  posturePassed      : dry | live | unknown
  graphDigest        : Sha256?
  workflowAccepted   : AcceptedConfigEvidence?
  councilAccepted    : AcceptedConfigEvidence?
  configReceipt      : ConfigAcceptanceReceipt?
  runtimeConfigReceipt: RuntimeConfigAcceptanceReceipt?
  launchSnapshotDigest: Sha256?
  filesystemProfileDigest: Sha256?
  cleanupStatus      : CleanupStatus
  cleanupReceipt     : CleanupReceipt?
  source             : String
  asOf               : Instant
}

RuntimeSnapshot {
  connectionId  : Uuid
  schemaVersion : Int
  reachable     : Bool
  generatedAtMs : Int64
  observeSource : ObserveSource
  queues        : List<QueueStat>
  deliveries    : BoundedList<DeliveryEntry>
  deadLetters   : BoundedList<DeadLetterEntry>
  asOf          : Instant
  completeness  : complete | partial | unknown
}

ObserveSource {
  durableRoot     : String
  database        : String
  readSemantics   : String
  historySemantics: String
}

BoundedList<T> { items: List<T>, limit: PositiveInt, truncated: Bool }
SourceRef { kind: File | Cron | Git | External, reference: String }

QueueStat {
  name               : String
  depth              : Int?
  pending            : Int?
  inFlight           : Int?
  retrying           : Int?
  oldestPendingAgeMs : Int?
  subscriber         : current | absent | unknown
}

DeliveryEntry {
  deliveryId, queue, dept : String
  source                  : SourceRef?
  status                  : pending | in-flight | retrying
  observedAtMs, notBeforeMs: Int64
  attempt, redriveCount, leaseGeneration: NonNegativeInt
  leaseUntilMs            : Int64?
  fenceToken              : String
  subscriberAbsentSinceMs : Int64?
  payload                 : PayloadSummary
  lastErrorExcerpt        : String?
}

DeadLetterEntry {
  deliveryId, queue, dept : String
  source                  : SourceRef?
  observedAtMs, notBeforeMs, deadAtMs: Int64
  attempts, redriveCount  : NonNegativeInt
  replayable, permanent   : Bool
  payload                 : PayloadSummary
  errorExcerpt            : String?
}

PayloadSummary {
  schema: String?, dedupKey: String?, digest: String, bytes: NonNegativeInt
}
```

`CleanupReceipt.digest` is the canonical SHA-256 of every receipt field except
`digest`. Its schema/version and encoded size must match
`ProcessLifetimePolicy`. `verifiedZeroSurvivors` is legal only when a matching
launch snapshot/filesystem profile/job/outer start identity receipt has
`survivorStatus=zero`,
`survivorCount=0`, `scanCompleteness=complete`, `detachOutcome` of `none` or
`denied`, and a valid
digest. `unknown` requires a null count; `nonzero` requires a positive count.
An escaped/unknown detach, mismatched/stale/replayed identity, oversized
receipt, malformed escalation outcome, or incomplete scan cannot clear the
fatal state. `normalExit` requires `outerExit.kind=clean`.
`outerProcessExitedUnexpectedly` is mandatory for an unrequested nonzero or
signal exit and records that status/signal directly; it is never mislabeled as
normal exit. Unknown or contradictory exit evidence is fatal rather than a
zero-survivor success. A receipt clears state only when it was recovered from
the manifest-frozen create-exclusive carrier or returned directly by the same
owned job before app exit; arbitrary files and log parsing are rejected.

The arrays are bounded records, not totals. When truncated, item count is only
a lower bound. Delivery status and PascalCase source kind preserve substrate
wire spelling before UI mapping. `unownedObservation` never proves a process is
running or which posture produced readable facts. Any owned exit path begins
with `cleanupStatus=pending`. It may report `verifiedZeroSurvivors` only from
the Step-0-proven job/launcher's typed `CleanupReceipt`. A timeout, unknown
descendant, identity mismatch, or nonzero survivor count enters
`cleanupFailed`; unknown is never treated as zero. While `cleanupFailed`, Start
and Restart are prohibited. The only recovery command reruns contained cleanup
and identity-safe reconciliation; it may transition through `doctorRunning`
only after a new `verifiedZeroSurvivors` receipt is recorded.

## Work, Workflow, and Council evidence

```text
EntityRef {
  connectionId: Uuid, githubHost: String, repo: String,
  kind: issue | pullRequest, number: Int
}

canonical entity key = connectionId:githubHost:repo:kind:number

AppEvidenceEnvelope {
  schema             : Step0Frozen<"fkst.devbored.evidence.v1">
  kind               : workflowTransition | councilRound | implementation
                     | pullRequest | machineGate | terminal
  emitterStableId    : SafeId
  appPackageDigest   : Sha256
  graphDigest        : Sha256
  connectionRevision : Sha256
  entity             : EntityRef
  runId              : String
  sequence           : PositiveInt
  dedupKey           : String
  workflowId         : SafeId
  workflowVersion    : PositiveInt
  workflowDigest     : Sha256
  councilId          : SafeId?
  councilVersion     : PositiveInt?
  councilDigest      : Sha256?
  policyId           : SafeId?
  stageId            : SafeId
  headSha            : GitSha?
  previousDigest     : Sha256?
  fact               : Step0Frozen<EvidenceFact>
  emittedAt          : Instant
  digest             : Sha256
}

EvidenceFact =
  WorkflowTransitionFact {
    fromStageId: SafeId?, toStageId: SafeId?, outcome: StageOutcome,
    transition: NonNegativeInt, stageAttempt: PositiveInt,
    implementationCycle: NonNegativeInt,
    exhaustedBudget: BudgetExhaustionReason?, reasonCode: SafeId
  }
  | CouncilRoundFact {
      round: PositiveInt, inputHeadSha: GitSha?,
      contributions: BoundedNonEmptyList<SeatEvidence>,
      decision: CouncilDecision, dissent: List<SafeId>,
      stageComplete: Bool, reasonCode: SafeId?
    }
  | ImplementationFact {
      attempt: PositiveInt, inputHeadSha: GitSha?, outcome: succeeded | failed | timedOut,
      resultHeadSha: GitSha?, commitSha: GitSha?, codexRunRef: String,
      contributionDigest: Sha256?
    }
  | PullRequestFact {
      outcome: succeeded | failed | timedOut, issueNumber: PositiveInt,
      pullRequestNumber: PositiveInt?, headSha: GitSha?, baseRef: GitRef
    }
  | MachineGateFact {
      outcome: gatePassed | gateFailed | gatePending | timedOut,
      reviewedHeadSha: GitSha, observedHeadSha: GitSha,
      ciStatus: pending | success | failure | neutral | unknown,
      checksComplete: Bool
    }
  | TerminalFact {
      terminal: TerminalKind, outcome: held | merged,
      reviewedHeadSha: GitSha?, reasonCode: SafeId,
      mergeState: notAttempted | confirmedNotMerged | confirmedMerged | unknown,
      effectReceiptRef: String?
    }

TransportedAppEvidence {
  envelope     : AppEvidenceEnvelope
  commentId    : PositiveInt
  permalink    : Url
  authorLogin  : String
  createdAt    : Instant
  updatedAt    : Instant
  trust        : trusted | untrusted | malformed | conflict
}

WorkEntity {
  ref              : EntityRef
  title            : String
  workflow         : WorkflowRunRef?
  council          : CouncilRunSummary?
  claim            : Claim?
  labels           : List<LabelHint>
  labelDrift       : Bool
  linkedRef        : EntityRef?
  ci               : CiRollup?
  headSha          : GitSha?
  parseStatus      : parsed | unsupportedSchema | malformed | untrusted | absent
  source           : String
  asOf             : Instant
  completeness     : complete | partial | unknown
}

WorkflowRunRef {
  workflowId     : SafeId
  workflowVersion: PositiveInt
  workflowDigest : Sha256
  runId          : String
  stageId        : SafeId
  stageKind      : String
  terminal       : String?
  evidenceUrl    : Url
}

CouncilRunSummary {
  councilId      : SafeId
  councilVersion : PositiveInt
  councilDigest  : Sha256
  policyId       : SafeId
  roundCount     : NonNegativeInt
  decision       : String?
  complete       : Bool
  evidenceUrl    : Url
}

CouncilRoundEvidence {
  runId         : String
  round         : PositiveInt
  stageId       : SafeId
  contributions : List<SeatEvidence>
  decision      : CouncilDecision?
  dissent       : List<SafeId>
  evidenceUrls  : List<Url>
  completeness  : complete | partial | unknown
}

SeatEvidence {
  seatId             : SafeId
  lens               : SeatLens
  executionStatus    : completed | timeout | failed
  verdict            : SeatVerdict
  contributionDigest : Sha256?
  codexRunRef        : String?
  excerpt            : String?
  at                 : Instant
  schema             : String
}
```

Exact state/decision vocabularies come from the frozen integrated-package
schema, not the old `devbored` marker ranks. Unknown/reference evidence cannot
be force-mapped to the new schema.

`AppEvidenceEnvelope.kind` and its `EvidenceFact` variant must match exactly.
Duplicated identity/head fields are equality checks, never competing sources:
fact head values must equal the outer `headSha` wherever both apply; Council,
Workflow, config, entity, and run identity are inherited from the envelope and
cannot be overridden inside the fact. A terminal `merged` fact requires
`mergeState=confirmedMerged`; `hold` may be `notAttempted`,
`confirmedNotMerged`, or `unknown` with the corresponding frozen reason code.

Each envelope is canonical JSON encoded as unpadded base64url inside one bounded
app-owned HTML comment marker on the qualified issue or PR. Raw JSON and excerpts
never appear inside the marker delimiter, so data containing `-->`, HTML, or
Unicode cannot terminate or reshape the marker. Exact UTF-8, key ordering,
number, null, base64url, marker-prefix, and digest-self-exclusion rules are
Step-0-frozen and tested across Dart/Lua.

One immutable comment carries one envelope. Its
id/permalink/author/created/updated timestamps are transport
metadata in `TransportedAppEvidence`, not fields inside the envelope: the
permalink cannot exist before the create succeeds and therefore cannot
participate in the envelope digest. Evidence comments are never edited;
`updatedAt != createdAt` fails closed unless Step 0 proves an equivalent
immutable transport fact.

The envelope digest is SHA-256 over the frozen canonical JSON object with its
`digest` field omitted. The chain partition is the qualified entity plus
`runId`; sequence starts at 1, is gap-free within accepted evidence, and
`previousDigest` is null only at sequence 1. The exact `dedupKey` derivation is
Step-0-frozen from emitter, entity, run, kind, stage, attempt/round, and head
identity. Before create, the package reads bounded qualified comments and
reconciles by dedup key and digest. A confirmed write requires a subsequent read
that finds exactly one matching immutable comment by the trusted loop bot. A
transport result proven `confirmedNotSent` may retry; a matching read reconciles
to success; conflicting matches fail terminally. Zero matches after an ambiguous
create emits `hold/publicationOutcomeUnknown` and MUST NOT automatically retry,
because GitHub comment create has no application idempotency key and delayed
visibility could otherwise duplicate evidence. The public comment command's raw
success is not itself the effect receipt.

For every `CouncilRoundFact`, `contributions` contains exactly one entry for
every selected policy-roster seat, in roster order, with no extra/duplicate id;
each lens equals that seat's selected Council definition. Missing, timeout, or
failed seat execution is still represented once with `executionStatus` and
`verdict=failed`. Partial or lens-mismatched lists are structurally invalid, not
an alternative basis for the decision.

Trust is established first from the manifest's allowed loop actor policy and
qualified repo/entity; then immutable transport metadata, schema, bounds,
digest chain, monotone sequence, config references, head binding, fact-specific
invariants, and conflicts are checked. `SeatEvidence.executionStatus` and
`verdict` must agree: timeout/failed executions have `failed`; a completed
execution cannot. `MachineGateFact.gatePassed` requires equal reviewed/observed
head, success CI, and complete checks. `TerminalFact.merged` requires an admitted
public effect receipt. Public `github-proxy.*` request queues are not part of
this contract.

For an owned active run, envelope `connectionRevision` and package/graph/config
digests are checked against its archived launch receipt, not against a newer
next-launch draft revision. Evidence from an unknown launch/revision remains
unverified until the matching receipt is available.

## Claim, CI, and write contracts

```text
Claim {
  mode: assignee | label
  status: claimed | unclaimed | conflict | unknown
  holderLogin: String?
  source: String
  asOf: Instant
  completeness: complete | partial | unknown
}

LabelHint {
  name: String
  kind: optIn | claim | workflow | stateHint | priority | other
  mappedValue: String?
  drift: Bool
}

CiRollup {
  headSha: GitSha?, status: pending | success | failure | neutral | unknown,
  checksSeen: NonNegativeInt, complete: Bool, source: String, asOf: Instant
}

WriteRequest =
  CreateIssue { connectionId, repo, title, body, applyWorkflowOptIn: Bool }
  | CommentOn { ref: EntityRef, body: String }

WriteGuard {
  operatorAuthContextId: String
  resolvedOperatorActor: String
  botActor: Bool
  repoAllowed: Bool
  writesEnabled: Bool
}

WriteResult {
  operationId: Uuid
  outcome: confirmed | rejected | confirmedNotSent
         | publicationOutcomeUnknown | conflict | failed
  url: Url?
  actor: String
  error: WriteError?
  retryAllowed: Bool
}

WriteError {
  kind: disabled | fixture | identity | repository | permission
      | rateLimited | timeout | transport | validation | conflict
  detail: String?
  retryAfter: Instant?
}
```

The raw transport may be ambiguous, but it is never exposed as permission to
retry. Reconciliation returns `confirmedNotSent` with `retryAllowed=true` or a
terminal/held result with `retryAllowed=false`; in particular,
`publicationOutcomeUnknown` never retries automatically. The app-human adapter
has no other mutation variant. Integrated-loop effects are not represented by
`WriteRequest`; they are separately governed by the loop posture/effect
contract.

## Local store records

- `cache_*`: disposable projections and acquisition metadata.
- `prefs_*`: UI choices and nonsecret connection references.
- `staged_*`: Workflow/Council drafts plus base hashes/versions.
- `audit_*`: materialization, process, and write operation metadata.

No table contains credentials, raw bodies, raw stderr, or unbounded logs.

⟦AI:FKST⟧
