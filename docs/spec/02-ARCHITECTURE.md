# Full-app architecture

Status: **AUTHORITATIVE TARGET — DIRECT LAUNCH SEAM UNFROZEN**
Version: `full-app/v2`

## System shape

The Flutter desktop application binds no network port. It initiates a verified
outer job/launcher that supervises a separate substrate process only when
explicitly started. The loop behavior is
implemented by a thin FKST package shipped with the app and loaded by
substrate; it is not implemented in Flutter.

```text
┌──────────────────────── Flutter desktop app ────────────────────────────┐
│ Presentation: Views + immutable ViewModels                              │
│ Application: use cases + typed results + orchestration                  │
│ Domain: contracts + ports + pure policy/projection/value objects        │
│ Infrastructure: process/substrate/GitHub/git/files/SQLite adapters      │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ explicit argv/env; owned outer job/launcher
                    ┌──────────▼──────────┐
                    │   fkst-substrate    │ dependency 1
                    │ package execution   │
                    └──────────┬──────────┘
                               │ loads
       ┌───────────────────────▼───────────────────────────────────┐
       │ app-owned fkst-devbored-loop package                     │
       │ Workflow/Council adapters + app-specific orchestration   │
       │ consumes public devloop APIs (dependency 2)              │
       └───────────────────────┬───────────────────────────────────┘
                               │ qualified external effects/facts
                         GitHub + git
```

The integrated package is part of the application artifact/repository, not a
third dependency. Its behavior runs in substrate's process tree. Existing
`devbored`, `github-devloop*`, `consensus`, and `github-proxy` packages do not
appear in this graph.

## Layer rules and dependency direction

Flutter follows one compile-time dependency direction:

```text
Views -> ViewModels -> application use cases -> domain ports/models
                                             <- infrastructure adapters
composition root -----------------------------^ wires implementations
```

- `domain` imports neither Flutter nor infrastructure and performs no I/O.
- `application` imports domain only. It coordinates use cases through ports,
  but never imports a process, HTTP/GitHub, git, SQLite, file, or widget API.
- `infrastructure` implements domain/application ports. It may import platform
  and third-party adapters but never imports presentation.
- `presentation` is feature-grouped. Views contain layout, accessibility,
  animation, and routing only. ViewModels convert typed use-case results into
  immutable screen state and never call a service or repository implementation.
- One composition root wires adapters, repositories, use cases, ViewModels,
  and routes. Feature code must not use global service locators.
- The app-integrated Lua package is a separate runtime boundary, not another
  Flutter layer. Flutter code cannot import or reproduce its transition logic.

Architecture tests reject imports that point against those arrows. A feature
is not complete if its widget reaches a subprocess, file, database, GitHub,
git, substrate adapter, or loop package directly.

Recommended source shape:

```text
lib/
  domain/
    models/
    policies/
    ports/
  application/
    use_cases/
    results/
  infrastructure/
    services/
    repositories/
    adapters/
  presentation/
    core/
    features/<feature>/views/
    features/<feature>/view_models/
  composition/
    app_composition.dart
```

## Responsibility rules

### Flutter UI

- Workflows and Council are first-class navigation and setup steps.
- UI renders immutable view models and emits typed intents.
- UI does not parse markers, execute commands, or reproduce transition logic.
- A control is absent until a real integrated-package consumer/effect is proven.

### Flutter domain

- Owns immutable Workflow/Council, connection, Doctor, lifecycle, evidence,
  projection, and write-policy models.
- Validates the app-owned serialized schemas with pure functions.
- Recomputes Council decisions and validates Workflow routes as a pure verifier
  for parity, tests, and projection; it never orchestrates seats or authorizes
  the runtime transition.
- Defines ports but no concrete external adapter.
- Does not perform or authoritatively advance loop transitions/Council rounds.

### Flutter application

- Owns explicit commands/queries for onboarding, Doctor, config drafting,
  activation, refresh, lifecycle, human writes, recovery, and diagnostics.
- Coordinates repositories and ports with cancellation, deadlines, typed
  results, connection-revision checks, and append-only audit requests.
- Reconciles accepted runtime provenance with desired config; a disk write
  alone never becomes “active.”
- Contains no widget, CLI argv, database row, JSON wire, or filesystem logic.

### Flutter infrastructure

- Uses absolute executables, argv arrays, explicit cwd/env, deadlines, caps,
  redaction, and a Step-0-proven parent-death job/launcher that tracks process
  groups plus start identities through normal and forced cleanup.
- Calls only the direct substrate seam frozen in Step 0; no fallback to the
  reference packages runner.
- Acquires GitHub/git facts and performs only the two app-human write families.
- Treats all dependency/repository output as bounded hostile input.

### App-integrated FKST package

- Owns only translation between app Workflow/Council contracts and public
  devloop/substrate capabilities plus genuinely app-specific orchestration.
- Imports public `devloop` modules through the admitted package identity.
- Resolves every stage outcome through the compatibility manifest's frozen
  Workflow family, increments attempts/transitions/rework cycles, and fails
  closed at their bounds; Flutter never reproduces this transition table.
- Emits accepted config digest/version and versioned transition/Council evidence.
- Publishes each work-evidence envelope as one immutable qualified comment and
  reconciles its dedup key/digest through a subsequent bounded read.
- Must not copy or fork devloop internals. A source/import lint and differential
  tests enforce the boundary.

## Major modules

| Module | Responsibility |
|---|---|
| `connections` | Substrate/devloop pins, repo/roots, GitHub/Codex contexts, claim mode, posture |
| `compatibility` | Frozen manifest describing admitted pins, host/config/evidence seams, bounds, and effects |
| `doctor` | Two-dependency graph, binary/tool/auth/schema/host/effect preflight |
| `workflow_contract` | App Workflow schema, validation, digest, activation, fixtures |
| `council_contract` | Seats, policies, stage assignment, evidence schema, activation |
| `process_launcher` | Initiate/track/stop verified outer job, cap I/O, validate typed cleanup receipts, audit |
| `host_composition` | Direct substrate host graph with app package + public devloop closure |
| `lifecycle` | Query/refresh/start/stop/restart/cleanup-reconcile use cases over ports; unowned facts remain observation-only |
| `substrate_adapter` | Digest/self-test/provenance plus documented observe JSON only |
| `github_adapter` | Qualified issues/PRs/comments/checks and two guarded human writes |
| `git_adapter` | Origin/ref/transport facts for app-managed clone |
| `clone_repository` | Create/fetch/repair the dedicated managed clone without touching a user checkout |
| `projection` | Trusted integrated-package evidence into Workflow/Council/work views |
| `scheduler` | Bounded fair refresh and separate operator rate budget |
| `store` | Cache, preferences, staged contracts, audit, migration/backup |
| `diagnostics` | Redacted dependency/config/process evidence |

## Source and runtime layout

```text
<app-install-or-repo>/
  loop-package/                 # app-owned thin FKST package; immutable at runtime
    fkst.toml
    ...

<app-data>/
  app.sqlite
  rate-pools/<github-host-loop-auth-key>/
  connections/<connection-id>/
    host/                       # dedicated managed clone; candidate/worktree authority
      .git/
      .fkst-devbored-host/      # reserved, collision-checked, locally excluded
        composition/            # candidate substrate project-root
    config/                      # desired configuration for the next launch
      workflow.json
      council.json
    launches/<launch-id>/
      config/                    # immutable exact Workflow/Council launch snapshot
      acceptance/               # bounded direct-run acceptance receipt
    runtime/<launch-id>/        # new and empty substrate scratch for each launch
    durable/                    # stable for this connection only
    logs/
```

Dependency roots are external, canonical, pinned, and read-only. App-owned
package source is immutable during normal operation. The audited substrate
couples `--project-root`, Department cwd, and Git-root discovery. The candidate
layout therefore places a reserved composition subdirectory inside the
app-created clone so `git -C <project-root>` can resolve the enclosing repository.
Step 0 must prove this exact behavior, reject any tracked/untracked/symlink name
collision, install a local `.git/info/exclude`, keep generated files out of every
index/commit/worktree, and preserve clean provenance. If that fails, Step 0 must
instead prove explicitly repo-qualified public Git seams or a pinned root-
separation capability. Injecting top-level control files or using a user checkout
always fails.

The exact workspace/lock format and direct substrate argv remain unfrozen until
RDY-08 passes. No downstream code may encode the prior package-runner layout.
The app creates/fetches only the dedicated `host/` clone. It never adopts,
cleans, resets, or writes a user's existing checkout.

## Workflow/Council activation

1. Operator edits a typed draft based on content hash/version.
2. App validates against the frozen app schema and dependency capability manifest.
3. App shows semantic diff, effects, and activation timing.
4. CAS/backup/atomic replace writes the desired files for the next launch.
5. With no owned loop running, the app copies exact bytes into a new immutable
   launch snapshot and invokes the Step-0-frozen no-effect config-acceptance
   department through the direct substrate `run` seam.
6. The app captures one bounded structured acceptance receipt from that
   invocation and verifies package/graph/schema/id/version/digest/revision.
7. Start uses the same immutable launch snapshot. Process evidence binds the
   owned process and exact argv to its launch id and accepted receipt; this is
   launch intent, not runtime-consumption proof.
8. The app sends the Step-0-frozen bootstrap event through the supervised graph
   and waits for a bounded `RuntimeConfigAcceptanceReceipt` emitted from that
   process through the admitted acknowledgement carrier.
9. UI marks the running configuration active only when preflight receipt,
   launch evidence, and runtime receipt all match. Timeout/mismatch stops the
   owned process and leaves config accepted-for-next-launch, never active.

V1 has no hot reload. Drafting may continue while a loop runs, but materialize,
accept, and activate are next-launch operations and cannot mutate the active
snapshot. Every configuration change invalidates Doctor. Topology-affecting
changes also require a regenerated composition. This removes time-of-check/
time-of-use ambiguity even if an underlying package reads config per event.

## Evidence carriers

The app uses two explicitly different evidence channels:

1. **Launch/config acceptance:** a bounded structured receipt captured from a
   direct, no-effect substrate `run` invocation and bound to the immutable
   launch snapshot. It proves package consumption for one connection revision;
   it is not GitHub work truth.
2. **Work/Workflow/Council evidence:** bounded app-owned envelopes embedded in
   loop-bot-authored GitHub issue or PR comments through an admitted public
   devloop comment/effect seam. These facts survive cache/runtime loss and are
   re-derived after restart. Local logs and substrate deliveries never replace
   them.

Public devloop request builders that target a `github-proxy.*` queue are not a
usable carrier because that package is forbidden. Direct public command seams
may be used only when the compatibility manifest also proves trust,
idempotency/reconciliation, DRY/LIVE behavior, and effect receipts. Missing
generic safety must be added to public devloop rather than copied into the app.

The substrate `file.*` SDK is not path-contained at the audited pin. Package
discipline plus an effect audit detect unexpected writes but are not a security
boundary. Step 0 must prove a platform process sandbox or root-confined public
SDK/capability broker that makes dependency/app-package/launch-config and
unrelated user paths unwritable while permitting only the canonical resolved,
bounded runtime/durable/log/rate/noncredential-Codex-state/managed-Git grants.
The profile binds canonical path identity, scope, writer and quotas. A
process-wide sandbox alone is insufficient: Git common/linked-worktree metadata
is available only to the non-escalating exact-argv public-devloop Git broker;
its worktree-content writes are limited to frozen prepare/recover/exact-ref-
checkout effects with receipts. Codex receives only an issued content-subpath worktree grant; generic
package file/exec cannot borrow either. Credential material is keyring-backed
and unavailable to generic file operations. Until
that executable containment exists, LIVE and Codex worker
execution are blocked. The loop package never writes desired configuration or
uses a local file as durable work evidence.

## Lifecycle states

```text
unconfigured -> doctorRunning -> invalid | ready
ready -> starting -> ownedRunning
starting -> stopping -> ready | cleanupFailed
ready -> unownedObservation
ownedRunning -> stopping -> ready | cleanupFailed
ownedRunning -> crashed -> cleanupFailed | doctorRunning
cleanupFailed -> doctorRunning -> invalid | ready
```

- `invalid` cannot start.
- A start requires a current passing Doctor report for dependency, tool, auth,
  host, Workflow, Council, effect, and root generations.
- Every start allocates a fresh runtime root and retains the stable durable root.
- `unownedObservation` exposes no pid, posture claim, or control.
- App/control-channel death, hung-supervisor escalation, new descendant process
  groups, and PID reuse are handled by the proven launcher; detach is forbidden
  and every owned stop path requires zero surviving descendants.
- `cleanupFailed` is a fatal recovery state: observation and contained cleanup
  reconciliation remain available, but Start/Restart and all new owned launches
  are blocked. It clears only after the launcher produces a new, identity-safe
  `verifiedZeroSurvivors` receipt; unknown or timed-out cleanup never clears it.
- When Flutter dies first, the outer launcher persists the receipt through its
  create-exclusive atomic+fsynced structured subpath within the bounded-log
  root. Relaunch reads that record directly; raw log text never becomes cleanup
  evidence and no extra writable root is created.
- Crash never auto-restarts.
- Restart re-runs Doctor/config acceptance, re-reads GitHub and accepted
  Workflow/Council evidence, and enters `starting` only from a new `ready` fact.

## Observation and projection

The app acquires sources independently:

1. substrate observe JSON for delivery facts;
2. GitHub/git for qualified work facts;
3. trusted integrated-package markers/evidence for workflow transitions and
   Council decisions; and
4. accepted configuration provenance for active Workflow/Council versions.

Projection filters trust before parsing, constructs a complete immutable
generation, attaches source/as-of/completeness, and swaps atomically. Delivery
facts never become workflow state. A reference-package marker is not trusted
as app-loop evidence merely because its syntax looks familiar.

## Storage and concurrency

SQLite mechanically separates disposable cache, preferences, staged
Workflow/Council drafts, and durable local audit. It stores no tokens, raw
comment bodies, or unbounded output.

- One DB isolate owns SQLite.
- One global scheduler owns refresh and subprocess fairness.
- One lifecycle mutex exists per connection.
- Loop and operator GitHub contexts are distinct.
- Child rate pools share by `{githubHost, loopAuthContextId}`; app reads/writes
  use the separate operator budget.
- Writes serialize per target. Reconciliation may enable a retry only after it
  proves `confirmedNotSent`; unresolved ambiguity remains
  `publicationOutcomeUnknown` with no automatic retry.

## Failure containment

| Failure | Required behavior |
|---|---|
| Substrate unavailable | Runtime unknown/stale; cached GitHub facts remain labeled |
| Devloop pin/visibility incompatible | Doctor blocks composition/start |
| App package graph imports a reference package | CI/Doctor hard failure |
| Workflow/Council schema or digest mismatch | Activation/start fails closed |
| Codex CLI/account unavailable | Doctor blocks start with remediation |
| GitHub unavailable/rate-limited | Last facts remain stale; writes disabled/backed off |
| Unknown/untrusted evidence | Entity/config state is unsupported/degraded, never guessed |
| Owned process crashes | Retain bounded evidence; no auto-restart |
| Store migration fails | Preserve original and enter explicit recovery |

⟦AI:FKST⟧
