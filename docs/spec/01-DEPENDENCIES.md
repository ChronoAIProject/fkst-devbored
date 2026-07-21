# Dependency contracts

Status: **AUTHORITATIVE — RUNTIME BLOCKED UNTIL P0 PROOF**
Version: `full-app/v2`

## Boundary rule

There are exactly two primary FKST dependencies:

| # | Dependency | App contract |
|---:|---|---|
| 1 | `fkst-substrate` | Execute the app-integrated FKST package, supervise its process tree, expose bounded observation, and provide documented Codex worker primitives |
| 2 | `devloop` | Reusable public loop invariants/APIs consumed by the app-integrated package |

This is a product boundary, not a claim that the machine contains only two
software artifacts. GitHub/git are external authorities. `gh`, `git`, `codex`,
Flutter/Dart, SQLite, and OS APIs are required tools/services. The `devloop`
source distribution has declared transitive libraries (`contract`,
`workflow_internal`, and `forge` at the audited pin); those are its internal
closure, not separate product integrations. The app must not import them
directly merely because they are reachable.

The following are **reference-only** for this product:

- `packages/packages/devbored`;
- `packages/packages/github-devloop*`;
- `packages/packages/consensus`;
- `packages/packages/github-proxy`; and
- the package repository's product-specific runner/health/UI assumptions.

They may supply test cases, failure lessons, and behavioral comparisons. They
must not appear in the shipped composition graph, become required checkouts at
runtime, define the app's Workflow/Council schema, or be copied module-for-module.

## 1. `fkst-substrate`

### Verified role

The checked-out substrate contains the framework engine, package graph and
conformance machinery, durable delivery ledger, supervision/observation
behavior, and Codex-process primitives. Exact source paths, commit, binary
digest, supported command syntax, observe schema, and process-detach behavior
must be frozen in the compatibility manifest before implementation.

### Allowed app interactions

- launch one verified substrate entrypoint against an app-owned host/composition;
- pass explicit host, runtime, durable, config, credential-context, and posture inputs;
- observe through the documented CLI JSON contract;
- consume structured provenance and bounded logs; and
- stop/restart only through the verified outer job/launcher identity the app
  initiated; never signal inferred supervisor/descendant PIDs directly.

### Forbidden app interactions

- opening the engine ledger or deriving/connecting to internal sockets;
- modifying/building substrate silently;
- claiming a binary version from a nonexistent command;
- signaling a pid not proven app-owned; or
- treating delivery state as GitHub/workflow truth.

Pre-launch identity is SHA-256 against an explicit build/compatibility
manifest plus self-test. Post-launch identity includes the exact structured
code-provenance record. Missing or mismatched evidence blocks start.

## 2. `devloop`

### Integration model

`devloop` is integrated by a thin app-owned FKST package, provisionally named
`fkst-devbored-loop`, stored and versioned in this repository. That package:

- imports only documented public `devloop` modules;
- translates the app's versioned Workflow and Council contracts into loop
  requests/events understood by those APIs and substrate;
- declares only the smallest static department/event graph needed for the
  app's bounded workflow families;
- emits versioned evidence that the Flutter projection can verify; and
- contains app-specific orchestration only.

It must not duplicate devloop marker parsing/building, claims, gates,
convergence, restart/replay, Git mechanics, or safety logic. If a required
operation is not public, the dependency must gain a narrow public capability
with tests before the app uses it. Copying an internal implementation is not a
fallback.

### Current verified limitation

At the audited checkout, `libraries/devloop/fkst.toml` exists and declares an
exact public export list, but its visibility allowlist does not include the
provisional app package identity. This means the intended integration is not
currently loadable under its own name. The app also contains no FKST package
yet. Both facts are P0 red in `08-READINESS.md`.

The source audit also found two effect-boundary facts that the original v2
draft left too implicit:

- public `devloop.commands.prs` exposes PR create and issue/PR comment commands,
  and public Git modules expose bounded worktree/push operations, but no public
  exact-head autonomous merge effect was found; the observed merge executor is
  inside the forbidden `github-devloop-pr` reference package; and
- several public request builders produce `github-proxy.*` request schemas/
  queues. Those builders cannot be treated as executable effects when
  `github-proxy` is absent from the shipped graph.

Therefore exact-head merge needs a narrow, tested public-devloop capability
before it can ship. The existing raw direct comment command is not sufficient
for durable app evidence. Public devloop must first expose and test a reusable
create-only publish/reconcile/read-back/typed-receipt capability with stable
dedup identity, bounded pre-read, ambiguous-outcome reconciliation, posture
enforcement, trusted target/author confirmation, and duplicate/conflict
classification. The app may not locally recreate that generic safety or copy
the reference proxy or merge executor.

### Reference implementations, not authority

The current `devbored` package is evidence that a package can reuse devloop
and configure seats/stages. The current workflow package is evidence for
bounded workflow lessons. Consensus and GitHub-proxy demonstrate failure and
idempotency patterns. None defines what the app must ship.

Step 0 may extract differential fixtures only for stable invariants such as
trust-before-parse, claim-mode behavior, monotone/CAS markers, head-bound
review, restart derivation, and posture effects. A fixture must cite source
path and commit and must be rewritten as an app-owned expected behavior, not
copied production code.

## Workflow and Council ownership

Workflow and Council are app contracts, not hidden aliases for the existing
`devbored.config.v1` file.

- A **Workflow** is a versioned, bounded definition selecting ordered stages,
  Council participation, budgets, gates, and activation semantics supported by
  the app-integrated package.
- A **Council** is a versioned set of named seats plus stage-specific decision
  policy and evidence requirements.
- The Flutter app authors these through CAS/backup/atomic materialization.
- The integrated package is the only runtime consumer and must emit its
  accepted schema/version/digest in provenance.

The schemas must be frozen with valid/invalid portable fixtures before HG-01
may authorize fixture-only UI. A real substrate load/run proof remains required
before HG-02 runtime-connected coding. Existing `devbored.config.v1`,
`fkst.workflow.v1`, and consensus payloads may inform design but are not
silently adopted.

Static graph constraints still apply: if the verified substrate scans topology
at load, v1 may parameterize only a declared bounded graph. Arbitrary topology
editing remains absent until an executable substrate contract supports it.

V1 configuration is snapshot-at-launch. Desired files live in app data; a
direct no-effect substrate `run` probe must consume an immutable launch copy
and emit the accepted digests before the supervisor starts. There is no hot
reload. Durable per-work Workflow/Council evidence is carried by qualified
GitHub issue/PR comments, while the config receipt is local launch/process
evidence. Substrate deliveries and runtime cache are neither channel.

## Required tools and external contexts

| Tool/service | Required proof | Classification |
|---|---|---|
| GitHub/git | Qualified repo, refs, issue/PR/comment/check authority | External business authority |
| `gh` | Absolute/versioned command and independent loop/operator auth contexts | Required tool |
| `git` | Absolute/versioned command, verified HTTPS origin/branch, no-prompt transport | Required tool |
| `codex` | Absolute executable plus `codex --version` and `codex login status` under the exact child environment, followed by a bounded no-write worker smoke | Required substrate worker tool |
| Flutter/Dart | Pinned SDK and desktop target | App toolchain |
| SQLite/drift | Pinned local projection/draft/audit store | App library/runtime |

No credential is copied into app config or SQLite. Official CLI behavior lets
Doctor inspect the active authentication method with `codex login status`
without changing login. A personal Codex Pro
account is a valid candidate context but must pass the exact sanitized launch
probe; the plan name alone proves neither authentication nor model selection.

## Launch and host seam

The prior spec assumed `packages/scripts/run.sh` and the existing `devbored`
package. That assumption is withdrawn. Step 0 must prove the supported direct
substrate host/composition command for:

1. the app-owned `fkst-devbored-loop` package;
2. the pinned public `devloop` library and declared transitive closure;
3. an app-owned dedicated clone of the configured GitHub repository;
4. fresh launch-specific runtime and stable durable roots; and
5. explicit DRY/LIVE, claim-mode, GitHub auth, Codex auth, branch, trust, and
   rate-pool inputs.

Until a recorded host fixture loads and runs under read-only dependency roots,
the exact CLI argv/environment is **unfrozen** and lifecycle coding is blocked.
The app may not fall back to the reference package runner because that would
reintroduce the broader packages/devbored dependency.

At the audited pin, substrate's Lua `file.*` functions accept arbitrary paths;
the primitive itself does not enforce a root. The compatibility proof must
therefore include an executable OS process sandbox or a pinned root-confined
substrate capability around substrate and every descendant. Fresh roots,
read-only known paths, an allowlist, and a write-effect audit remain defense/
evidence but are not containment. Each launch must resolve and hash the six
manifest templates—fresh runtime, connection durable, bounded log, loop-rate
pool, bounded noncredential Codex state, and the complete managed Git tree—into
canonical path identities, scopes, writer/subpath capabilities, and byte/file/
depth/instance quotas. Dependency, app, desired/launch-config, credential,
app-control, and unrelated paths are protected/default-denied. Git `.git`
indirection is resolved to common and linked-worktree metadata; only a
non-escalating exact-argv public-devloop Git broker may write it with authority
guard, audit, and receipt; that broker may populate/recover/checkout content
only during the corresponding frozen effects. Codex receives only a bounded content-subpath
worktree grant. Generic package file/exec cannot borrow either. A process-wide
sandbox alone is insufficient. Package-authored, engine-managed, broker, and
Codex effects are distinguished; the package may not mutate desired config or
persist authoritative local work state.

## Dependency admission gates

Before a feature or construction step can claim support:

1. its substrate or public-devloop interface is named;
2. the interface exists at the pinned commit and is visible to the app package;
3. valid, invalid, replay, and failure fixtures exist;
4. a minimal app package loads under substrate with dependency roots read-only;
5. Doctor can identify incompatible pins/tool contexts; and
6. unavailable behavior is absent or explicitly gated.

Current `model`/`effort` values seen in the reference `devbored` config fail
this test: the package passes them toward the substrate SDK, but the audited
substrate does not forward them to `codex exec`. The full app must not expose
those as effective controls until a separately pinned capability and
cross-dependency conformance test exist. The same rule applies to persona
prompts, semantic scores, arbitrary topology, and package-health prose.

## Ownership and licensing

- App code, its integrated loop package, Workflow/Council schemas, and their
  tests carry the app's own license.
- Substrate and devloop are pinned/attributed under their actual licenses.
- Reference-only package code is not copied into the app.
- Redistribution of any binary/source closure requires explicit license and
  notice review; a path reference does not grant relicensing.

⟦AI:FKST⟧
