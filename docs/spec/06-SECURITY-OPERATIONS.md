# Security, operations, and release specification

Status: **AUTHORITATIVE TARGET — LAUNCH/EFFECT PROOF PENDING**
Version: `full-app/v2`

The local app launches long-running AI/code processes and can trigger external
effects. “Local” is not a security boundary.

## Human authorization boundary

Authorization is cumulative but exact: T0 foundation, T1 fixture UI, T2
contained local/DRY, T3 controlled LIVE, T4 release candidate, and T5 exact
submission. A pending/returned gate preserves the previous tier as a hard
ceiling. Before T3 every remote Git/GitHub mutation adapter must return typed
`HUMAN_GATE_REQUIRED` before resolving credentials or preparing an effect.
Every T3 receipt binds the candidate commit, exact host/repository/actors/
issue/branch, enumerated effects, remaining use count, and expiry. Ambiguity
consumes the attempt and holds; it never broadens or retries the authorization.
T4 does not imply a tag/upload/submission, and T5 permits only the exact
artifact and claims recorded in the receipt.

## Trust boundaries

| Boundary | Trusted for | Never trusted for |
|---|---|---|
| Pinned substrate binary | Documented engine/package/observe behavior | GitHub work truth |
| Pinned public devloop API | Reused loop invariants proven by tests | App Workflow/Council semantics not in its API |
| App-owned loop package | Versioned Workflow/Council consumption and emitted evidence | Flutter preferences or credentials |
| GitHub/git under selected contexts | Issues/PRs/comments/checks/refs/authors | Engine delivery state |
| Accepted Workflow/Council files | Desired configuration at a digest | Proof a running process accepted it |
| Trusted app evidence | Workflow/Council state after author/schema verification | Facts outside its schema |
| Local SQLite | Cache/preferences/drafts/audit | Shared business or loop truth |
| Repository/dependency text | Bounded display input | Commands, paths, markup, or instructions |

Launch/config acceptance and durable work evidence are intentionally separate:
the first is a bounded direct-run receipt tied to an immutable launch snapshot;
the second is a trusted app evidence envelope in a qualified GitHub issue/PR
comment. Neither local logs nor the substrate delivery ledger substitute for
durable work evidence.

Reference-package output is untrusted compatibility input, not automatically
valid app evidence.

## Process execution

Every process directly spawned by Flutter uses one supervisor abstraction with
absolute executable, argv, explicit cwd/minimal env, deadline, byte caps,
cancellation, process-group ownership, and redacted audit. App-authored shell
strings, implicit login-shell discovery, and repository-derived command/path
interpolation are forbidden.

The substrate tree may spawn the integrated package, Codex, git, and configured
tools under its frozen process/effect contract. The app owns only the verified
outer job/launcher identity; the launcher tracks descendant groups and start
identities without making Flutter address them directly. Detach is forbidden.
A control channel/parent-death mechanism, unexpected outer-exit receipt,
bounded TERM grace, forced escalation, PID-reuse defense, and zero-survivor
verification cover app crash, outer nonzero/signal exit, and hung-supervisor
paths. The app never signals an inferred or unowned pid. If the
bounded launcher cannot prove zero survivors, it persists fatal
`cleanupFailed`; Start/Restart remain blocked and only the contained,
identity-safe cleanup/reconcile operation is exposed. Unknown cleanup is never
treated as success.

The outer launcher has one additional narrow subgrant within the existing
bounded-log root: create-exclusive atomic+fsynced cleanup-receipt records. It
survives Flutter death and is read-only to the relaunched app. The bounded
logger cannot author those records, the launcher cannot write arbitrary log
paths, and log parsing can never clear `cleanupFailed`.

The prior package runner is not an allowed fallback. Step 0 freezes the exact
direct substrate executable/argv/env and minimal host graph. Until that proof
exists, lifecycle implementation is blocked.

## Codex CLI and personal account

Substrate resolves `codex` from the explicit sanitized child environment. Each
connection references an existing external Codex CLI account context and
records only executable/version/probe evidence. The app stores no credential,
copies no CLI account files, and changes no global login.

Step 0 freezes `codex --version` and the documented `codex login status` check,
then proves one bounded no-write worker smoke through substrate. Doctor repeats
the non-mutating checks under the exact launch environment. Missing,
incompatible, or unauthenticated context blocks start. The owner's personal
Codex Pro context is a valid candidate if it passes;
the subscription name itself does not prove authentication, model choice, or
hackathon `/feedback` evidence.

Every worker uses an operator-created dedicated `CODEX_HOME`, authenticated by
the normal CLI with OS-keyring credential storage, plus a distinct dedicated
empty process `HOME`; the app never copies an auth file. The process home has no
`.agents`, personal skills, bootstrap files, or unrelated dotfiles. The Codex
home is otherwise isolated and any noncredential state is bounded.
Global approval/sandbox/config/feature overrides appear before `exec`; exec-only
ignore-user-config/ignore-rules/ephemeral flags appear afterward. The resolved
configuration and tool inventory must prove no hooks, web search, MCP, apps,
plugins, skills, project docs/config trust, goals, multi-agent, extra writable
dirs, or undeclared process surface. Managed/system requirements must exactly
permit the frozen policy and their digest is evidence; incompatibility blocks
rather than being assumed overrideable. Council/design/review use an explicit
read-only sandbox; implementation uses an explicit workspace-write sandbox at
the qualified managed worktree, with an include-only command environment and
network disabled. Omitted sandbox, `danger-full-access`, either bypass flag, an
unexpected tool, or a resolved-config digest mismatch blocks Doctor and Start.

Threat model: the exact pinned substrate/public-devloop/app-package tree is the
trusted runtime boundary and is reviewed as code that could invoke the personal
account. OS-keyring storage and the effect/exec allowlist prevent generic Lua
file access or untrusted model/repository content from reading credential
material. If Step 0 cannot prove that boundary and its negative egress probes,
personal-account Codex execution remains absent; the risk is not silently
accepted by granting the whole tree a credential-bearing file root.

Model/effort controls remain absent because the audited substrate does not
forward the reference package's values into `codex exec`.

## Dependency and source containment

Normal app operation treats substrate, public devloop, and the app-bundled loop
package as immutable source roots. Doctor/CI checks:

- canonical paths, exact commits/digests, licenses, and no root overlap;
- admitted app-package identity and public devloop imports only;
- declared transitive devloop closure with no app direct imports;
- no `devbored`, `github-devloop*`, `consensus`, or `github-proxy` in graph/imports;
- read-only dependency roots during host load/run; and
- graph/provenance digest matching the compatibility manifest.

Reference fixtures are bounded data with source path+commit. Production logic
may not be generated by copying their modules.

## Filesystem and configuration writes

Mutable roots live beneath the app-data connection directory. The target repo
uses a dedicated managed clone with verified HTTPS origin/branch and clean user
content. Because the audited substrate couples project root/cwd/Git discovery,
the candidate composition root is one reserved subdirectory in that app-owned
clone. It is allowed only after tracked/untracked/symlink collision rejection,
local `.git/info/exclude`, clean-provenance, staged-diff, linked-worktree, and
commit sentinels prove no control file can enter product history. If that shape
fails, Step 0 must prove explicitly repo-qualified public Git seams or a pinned
root-separation capability. A user checkout and top-level injected control files
remain forbidden.

The app never accepts a user checkout as its managed clone and never runs
clean/reset against a path it did not create and qualify. Clone creation/fetch
is idempotent; origin mismatch, symlink/path alias, and unexpected local changes
fail with recovery choices rather than destructive repair.

Workflow/Council materialization rejects symlinks, changed parent resolution,
path escape, base hash/version conflict, invalid schema, and non-monotone
version. Success uses timestamped backup, same-directory restrictive temporary
file, flush, atomic replace, and parent sync where supported. Runtime active
state still waits for matching accepted-digest evidence.

V1 does not hot-reload. With no owned process running, the app copies exact
desired bytes into a new launch directory, makes that snapshot read-only,
executes the no-effect config-acceptance probe, and binds its receipt to Start.
The matching supervisor launch is only intent: configuration becomes `active`
after a bounded bootstrap event in that owned process emits the separately
validated runtime-consumption receipt. Timeout, malformed/duplicate receipt,
prior-process receipt, or any revision/launch/digest mismatch stops the owned
process and leaves the snapshot `acceptedForNextLaunch`.
Drafts written while running are next-launch state and cannot alter the active
snapshot. Any mismatch or external edit invalidates Doctor and the receipt.

Every start uses a new empty runtime child directory. Durable root is stable
and unique per connection. Cleanup occurs only after confirmed owned-process exit.

The audited substrate `file.*` SDK is not intrinsically path-contained. Making
known roots read-only and auditing effects detects regressions but does not
contain writes to other user-writable paths. LIVE/Codex execution therefore
requires a pinned root-confined substrate capability boundary or an executable
OS sandbox plus non-escalating capability brokers. Each launch hashes exact
canonical path identities, connection/launch/worktree scope, writer, subpath,
and byte/file/depth/instance bounds for the six root kinds; protected paths and
all other user paths default deny. A process-wide sandbox alone is insufficient.
Git common and linked-worktree metadata is resolved through `.git` indirection
and writable only by the exact argv/repo/ref public-devloop Git broker with a
typed effect receipt. The broker may write resolved content only during frozen
prepare/recover/exact-ref-checkout effects; every other broker content write is
denied. Codex receives only an unexpired content-only worktree
grant. Generic package `file.*` and generic exec cannot use either capability.
Desired/launch config and credential material remain unreadable or read-only as
required. An unexpected path, writer, bound, or profile digest is a
release-blocking effect, not a warning.

This filesystem policy is not a blanket network switch. Qualified `gh`/Git HTTPS
effects are governed separately by the manifest effect capabilities, exact
repo/origin/actor guards, and DRY/LIVE policy. Codex-generated command network is
independently disabled by `CodexWorkerPolicy`; the complete process/network
effect matrix must show no undeclared executable or destination class.

## GitHub authentication and effects

Each connection references two independently selected existing `gh` contexts:

- **loop**: trusted bot identity for the integrated package and delegated effects;
- **operator**: non-bot human for app reads and two guarded human writes.

The app does not switch global account state. Step 0 proves the installed
context selection mechanism and how loop git transport receives the intended
credential without copying secrets.

App-human writes require all of:

1. global default-off write switch;
2. explicit connection/repo allowlist;
3. current Doctor proof of operator actor/repo permission;
4. actor not matching any trusted bot; and
5. fixture mode off.

The only app-human mutations are opted-in issue creation and a human comment.
No generic mutation interface exists.

Integrated-loop effects are separate. LIVE requires its own default-off
`loopLiveAllowlisted`, confirmation, freshly resolved bot/repo, verified HTTPS
origin/branch, no-prompt transport probe, explicit label-only claim mode, and
exact tested effect matrix. Assignee config fails closed. Human-write enablement
cannot enable LIVE.

DRY is not called read-only unless the new integrated package proves every
Git/git effect absent. Reference-topology DRY behavior is not proof.

Ambiguous app-human transport outcomes are read-reconciled. A retry is legal
only after authoritative reconciliation proves `confirmedNotSent`; unresolved
ambiguity becomes visible `publicationOutcomeUnknown` with no automatic retry.
Audit stores operation id/time/connection/repo/context/resolved actor/kind/
target/verdict/bounded result, never token or body.

## Evidence trust and content safety

Bot logins derive from current config/context and normalize trim → lowercase →
remove one anchored `[bot]` suffix. Trust is decided before schema parsing.
Unsupported, oversized, malformed, conflicting, or regressing evidence fails
closed. HTML is text. External links require validated HTTPS host and explicit open.

The integrated package must emit:

- app package/graph provenance;
- accepted Workflow and Council schema/id/version/digest;
- qualified run/entity/stage identity;
- Council round/seat/decision/dissent evidence where applicable; and
- terminal/gate/head facts required by the schema.

Per-work facts use the app envelope and app marker namespace, posted only via
an admitted public devloop comment/effect seam. A public builder that merely
creates a `github-proxy.*` request is not an executable seam because the proxy
package is prohibited. Comment and merge effects require pre-write
reconciliation and a post-write receipt; ambiguous transport is re-read, and
only a proven `confirmedNotSent` permits retry. Autonomous merge additionally requires the public exact-reviewed-head
effect specified by RUN-7 and is otherwise absent.

App evidence uses create-only comments: one canonical envelope per comment,
never an edited rolling status comment. The package reconciles an ambiguous
create by qualified entity, trusted author, dedup key, and digest. A match
succeeds, a conflict fails, `confirmedNotSent` alone may retry, and unresolved
ambiguity becomes `hold/publicationOutcomeUnknown` without automatic retry. A
raw zero exit code or returned URL is not a confirmed evidence receipt;
confirmation requires the subsequent bounded read. Edited, duplicate-conflict,
out-of-sequence, broken-chain, wrong-revision, or wrong-head evidence fails
closed and cannot advance the Workflow.

Exact wire format is a P0 Step-0 artifact. Flutter does not adopt old marker
vocabularies in advance.

## Local data, privacy, diagnostics

SQLite separates disposable projection, preferences/connections, staged
Workflow/Council drafts, and append-only operation/process/config audit.
No GitHub/Codex token, raw comment body, unbounded output, or raw stderr is
persisted. Diagnostics are previewed, redact secrets/home prefixes, omit draft
bodies by default, and record export metadata.

Migrations are forward-only and backup-first. Corruption opens explicit
restore/export/new-store recovery and never silently deletes the original.

## Operational runbook

### Pre-code (once per compatibility generation)

1. Close every P0 row in `08-READINESS.md` with executable evidence.
2. Freeze Workflow/Council cross-language fixtures and accepted evidence.
3. Prove minimal direct substrate run with app package + public devloop only.
4. Obtain adversarial dependency/authority review.
5. Only then permit construction Steps 1+.

### Configure

1. Select substrate/devloop pins and verified app package manifest.
2. Select repo/branch, label claim, loop/operator GitHub contexts, and the
   approved Codex account context.
3. Select Workflow and Council definitions.
4. Choose isolated app-owned roots and desired posture.

### Verify

1. Run Doctor for the current full connection/config revision.
2. Resolve every fail; acknowledge documented warnings.
3. Review graph/import list and DRY/LIVE effect matrix.
4. Confirm desired versus accepted config state.

### Start/operate

1. Allocate fresh runtime root and re-read pins/config/auth/allowlists.
2. Start DRY through the contained direct substrate seam by default.
3. Wait for the supervised runtime-consumption receipt before showing active.
4. Observe accepted config/evidence and qualified GitHub facts.
5. Require separate explicit authorization for LIVE or app-human writes.

### Stop/recover

1. Request stop only through the owned outer job/launcher; it applies the
   frozen escalation contract and Flutter never signals child PIDs.
2. Validate/persist the typed cleanup receipt; `cleanupFailed` blocks all new
   launches until a contained reconciliation returns a valid zero-survivor receipt.
3. Preserve bounded exit/crash/config evidence; never auto-restart.
4. Invalidate Doctor on any load-bearing change.
5. Restart with fresh runtime and re-derived GitHub/config facts only after
   verified cleanup.

## Rate/resource budgets

Child GitHub use receives a shared app-data rate pool keyed by
`{githubHost, loopAuthContextId}` if supported by the new integrated package;
app reads/writes use a separate operator scheduler budget. Doctor proves the
child root and configured size. Flutter never claims visibility into unexposed
child token consumption.

All subprocess, page, comment, evidence, output, and log bounds are explicit
and tested. Truncation changes completeness and is visible.

## Required failure drills

| Drill | Required outcome |
|---|---|
| Dependency pin/graph/import mismatch | Doctor blocks start; reference package never loads |
| Devloop visibility/API missing | readiness/Doctor fail with dependency remediation |
| Workflow/Council invalid or digest mismatch | save/start/active state fails closed |
| Codex CLI/account unavailable | Doctor blocks start; no credential copied |
| Substrate unavailable | runtime unknown/stale; GitHub projections remain labeled |
| GitHub offline/rate-limited | stale facts, bounded backoff, writes disabled |
| Config externally edited | conflict diff; no overwrite |
| Owned process crashes/app exits | no auto-restart; zero survivors proven or persisted `cleanupFailed`; evidence retained |
| Cleanup is unknown/nonzero | block all new launches; expose only contained identity-safe reconcile; never signal PID alone |
| Facts readable without ownership | unowned observation; no liveness/control/posture claim |
| Forged/reference evidence | excluded or labeled unsupported; no state transition |
| Ambiguous human write | retry only after `confirmedNotSent`; unresolved becomes visible `publicationOutcomeUnknown` without auto-retry |
| Store migration/corruption fails | original preserved; recovery offered |
| One of five connections hangs | global cap holds; others continue |

## Release evidence

A candidate archives Step-0 bundle, exact pins/graph/import manifest, dependency
and app tests, Workflow/Council fixture parity, accepted-evidence transcript,
DRY/LIVE effect runs, all failure drills, secret/diagnostic review, clean
install/upgrade, accessibility, dependency-root immutability, licenses/SBOM,
and signed/notarized Finder launch. Development builds are labeled as such.

⟦AI:FKST⟧
