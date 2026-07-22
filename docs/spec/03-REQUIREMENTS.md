# Full-app requirements

Status: **AUTHORITATIVE — TIERED AUTHORIZATION ACTIVE**
Version: `full-app/v2`

`MUST`, `MUST NOT`, and `SHOULD` are normative. The current authorization tier
is fail-closed: T1 permits fixture/fake-backed Flutter and pure layers only;
runtime-connected production code requires every admitted P0 item green plus
HG-02; remote effects, release work, and submission require HG-03..HG-05.

## DEP — exact dependency boundary

**DEP-1** The shipped FKST composition MUST have exactly two primary
dependencies: `fkst-substrate` and public `devloop`.

Accept: a machine-readable manifest and graph/import test show the app-owned
loop package plus public devloop closure running on the pinned substrate; no
reference event package is in the graph.

**DEP-2** `devbored`, `github-devloop*`, `consensus`, and `github-proxy` MUST be
reference-only. Production code MUST NOT import, compose, vendor, or copy them.

Accept: source/graph lint fails on those package/event/import identities;
reference fixtures cite path+commit and contain data only, not copied logic.

**DEP-3** The app-integrated FKST package MUST use only admitted public devloop
APIs. Missing APIs MUST become explicit dependency gates, not local clones of
devloop internals.

Accept: chosen app-package identity passes devloop visibility/conformance;
import lint rejects undeclared/internal modules; differential tests cover every
reused invariant.

**DEP-4** Neither dependency checkout may be modified, silently built, or
silently updated by normal app operation.

Accept: integration runs with both roots read-only and exact pins/digests;
attempted writes/build/bootstrap paths fail with typed remediation.

## RDY — before production coding

**RDY-1** Step 0 MUST freeze exact dependency commits/licenses, substrate
binary/provenance/observe/process contracts, public devloop exports/visibility,
direct host graph/argv/env, and tool/auth probes.

Accept: every RDY-01..25 ledger row has cited executable evidence or an intentionally
gated feature that is absent from the admitted product; no P0 row for admitted
scope is partial/fail.

**RDY-2** The app-owned Workflow and Council schemas MUST have valid/invalid
fixtures, deterministic digests, activation semantics, and frozen consumer/
evidence contracts before HG-01 fixture UI begins. A minimal real substrate
consumer and emitted provenance are additionally mandatory before HG-02
runtime-connected app work begins.

Accept T1: the portable Dart/Lua corpus accepts both contracts, prints their
ids/versions/digests, resolves every Workflow→Council assignment, reduces the
bounded policies deterministically, and rejects hostile/reference imports.
Accept T2: a headless fixture loads the thin app package, accepts the same
contracts, emits their ids/versions/digests, executes one contained no-write
transition, and shuts down with dependency roots unchanged.

**RDY-3** Passing tests from a reference topology MUST NOT close a readiness
gate for the app topology.

Accept: every readiness artifact names the app package graph; the old
`devbored` test run remains contextual evidence only.

## APP — platform and process shape

**APP-1** The app MUST be Flutter desktop, macOS primary, with no embedded web
server or app-owned listener.

Accept: packaged launch from Finder succeeds and listener inspection finds none.

**APP-2** Linux is best-effort. Windows, mobile, App Store sandboxing, and
hosted multi-user operation MUST NOT be claimed without separate evidence.

**APP-3** Every process spawned directly by Flutter MUST use the typed bounded
executor/launcher seam with an absolute executable, argv list, explicit
cwd/include-only env, deadline, bounded output, and cancellation. Any owned run
or command capable of descendants MUST execute inside the verified outer
job/launcher and its typed cleanup-receipt contract; a leaf probe must be proven
non-descending and bounded.

Accept: no app-authored shell command string exists; timeout/app-exit tests
produce a matching valid zero-survivor receipt or fatal `cleanupFailed`; no
undocumented child survives or is controlled by inferred PID.

## ARC — separation of concerns

**ARC-1** Flutter dependency direction MUST be Views → ViewModels → application
use cases → domain ports/models, with infrastructure implementing ports and one
composition root wiring dependencies.

**ARC-2** Domain MUST import neither Flutter nor infrastructure and MUST perform
no I/O. Application MUST contain no widget, process, GitHub/git, file, database,
or serialized-wire implementation.

**ARC-3** Views MUST contain only presentation/routing/accessibility logic.
ViewModels MUST expose immutable state and invoke use cases, never concrete
services/repositories or the loop runtime.

**ARC-4** Infrastructure MUST not import presentation. The app-integrated Lua
package is a separate runtime boundary and MUST NOT be imported or reproduced
inside Flutter.

Accept ARC-1..4: architecture/import tests enforce every direction; dependency
injection has one composition root; a hostile fixture that imports an adapter
from a ViewModel or Flutter from domain fails CI.

## CON — connection and Doctor

**CON-1** A connection MUST contain stable id/name, substrate and devloop pins,
app-package compatibility id plus exact manifest selection, qualified GitHub host/repo, dedicated clone,
runtime-base/durable/log/config roots, target branch, explicit claim mode,
separate loop/operator GitHub context references, Codex CLI/account context,
rate-pool derivation, Workflow/Council selection, posture, and allowlists.

Accept: all entity/config keys are connection-qualified; two repos or same
numbers never collide.

**CON-2** Doctor MUST validate the exact two-dependency graph, app-package
visibility/import closure, binary/tool versions, Codex authentication, both
GitHub actors, repo/origin/branch/transport, claim mode, Workflow/Council
schemas/digests, roots, effect posture, and compatibility evidence.

Accept: every broken input has a typed check/remediation and blocks start;
changing any load-bearing input invalidates the report.

**CON-3** Multiple connections MUST be isolated and fairly polled.

Accept: a five-connection test keeps unique durable/runtime/config/clone roots,
shares child rate pools only for the same loop identity/host, and isolates failure.

**CON-4** The app MUST provision and maintain only a dedicated managed clone
inside its connection root. It MUST NOT adopt, clean, reset, or write a user's
existing checkout.

Accept: create/fetch/reopen/origin-mismatch/dirty-managed-clone/path-with-spaces/
auth-failure fixtures are idempotent and typed; a user-checkout sentinel is
unchanged. The reserved in-clone substrate composition subdirectory passes
collision/local-exclude/provenance/index/commit/linked-worktree sentinels, or an
explicit repo-root-separated public seam is proven instead.

**CON-5** The target v1 manifest MUST admit label claim mode only. Assignee mode
and its UI/config are gated until public devloop can complete every admitted
assignee path without a `github-proxy.*` fork request.

Accept: label claim/admission/restart/effect fixtures pass; hostile assignee
config fails compatibility validation and Doctor with explicit remediation.

## WFL — Workflow as the primary operating mechanism

**WFL-1** Every admitted work item MUST identify the accepted Workflow schema,
id, version, digest, and stage; absence/mismatch fails closed.

Accept: trusted emitted evidence agrees with the active file; a mismatched or
unknown workflow never appears active.

**WFL-2** Workflow v1 MUST be bounded and deterministic: stable ids, declared
manifest-family id, stage kinds/order, Council assignments where permitted,
complete outcome routes, attempt/transition/implementation-cycle budgets, gates,
effect summary, and explicit activation timing.

Accept: canonical fixtures hash identically across Dart and integrated-package
implementations; duplicates, cycles/unsupported topology, unknown keys, and
over-bound values fail closed. Every deliberative stage resolves an explicit
`{councilId, policyId}` pair; missing/mismatched ids fail validation and affect
the Workflow digest. Every admitted runtime outcome resolves to exactly one
manifest-frozen next stage or terminal; review/CI rework decrements a bounded
cycle budget and total transitions can never exceed the manifest cap. Attempt,
Council-round, implementation-cycle, and transition exhaustion each atomically
route to an explicit `hold` reason without invoking another stage or exceeding
a counter; under-sized caps fail validation.

**WFL-3** Workflow authoring MUST use base-hash CAS, monotone versioning,
schema validation, symlink/path rejection, semantic diff, timestamped backup,
atomic replace, and runtime accepted-digest reconciliation.

Accept: external-edit conflict cannot be overwritten; disk-written and
runtime-active are distinct states. V1 has no hot reload: a running process
keeps an immutable per-launch Workflow/Council snapshot, while edits are
clearly `pendingStop`/next-launch and invalidate Doctor.

**WFL-4** The UI MUST NOT offer arbitrary topology beyond the graph families
proven by the pinned substrate/app package.

Accept: unsupported topology is absent, not stored as local-only aspiration.

## COU — Council as the primary deliberation mechanism

**COU-1** Council v1 MUST define stable seat identities, bounded stage-specific
rosters, decision policy, budgets, and evidence requirements using a versioned
app-owned schema consumed by the integrated package.

Accept: valid/invalid fixtures and a real no-write run prove every editable
field is consumed; no field comes solely from an old mock/reference config.

**COU-2** Every displayed round, seat contribution, decision, dissent, and
terminal reason MUST have trusted versioned evidence and a GitHub permalink or
engine provenance reference.

Accept: evidence-free values render absent/unknown, never invented or scored by
another LLM.

**COU-3** Council authoring MUST use the same CAS/backup/atomic/accepted-digest
discipline as Workflow authoring and state exact activation timing.

**COU-4** Persona prompts, per-seat model selection, semantic scores, and
unbounded roster/topology controls MUST remain gated until public dependency
and emitted-evidence contracts exist.

Accept: no shipped control writes an unconsumed or unverifiable field.

**COU-5** V1 Council decisions MUST be mechanical over bounded structured seat
verdicts. Malformed, missing, timed-out, or failed seats MUST never count as
approval; dissent MUST be derived from explicit `changesRequested` verdicts.

Accept: unanimous/simple-majority, abstain, failure, timeout, tie, round-cap,
and replay fixtures produce byte-identical decisions in package and Dart code.
Approved/changes-requested ends the stage; only inconclusive advances a round,
and never beyond `maxRounds`. An accepted replay never invokes the seat again.

## RUN — direct substrate host and lifecycle

**RUN-1** The app MUST launch only through the Step-0-proven direct substrate
host seam with the app package and public devloop closure. It MUST NOT fall back
to the reference package runner/topology.

Accept: graph provenance names the app package and excludes all reference
packages; read-only dependency roots remain unchanged.

**RUN-2** The app MAY control only the verified outer job/launcher it initiated;
that launcher owns the supervisor/descendant lifecycle. Readable facts without
owned identity are `unownedObservation`, with no pid/posture/control claim.
Flutter never directly signals inferred child PIDs.

**RUN-3** Every start/restart MUST require current Doctor evidence, allocate a
fresh empty runtime root, retain the connection's durable root, and re-derive
work/config truth. It MUST first bind an immutable launch config snapshot and a
no-effect config-acceptance receipt to the same connection revision, package
digest, graph digest, Workflow digest, Council digest, and launch id. It MUST
also resolve the canonical six-root filesystem profile; the snapshot and every
direct/runtime/process/cleanup receipt bind its digest, and path-identity or
grant drift invalidates Start. After supervisor launch, config is not `active`
until a real supervised app-package
event emits a separate bounded runtime-consumption receipt bound to those exact
values and the owned process instance.

**RUN-4** Crash MUST retain bounded evidence and MUST NOT auto-restart.

**RUN-5** DRY and LIVE MUST be integrated-package postures with a tested effect
matrix. “DRY” MUST NOT mean read-only unless every Git/git effect is proven absent.

**RUN-6** LIVE MUST have a separate default-off loop/repository allowlist and
confirmation, independent of app-human write enablement.

**RUN-7** Autonomous merge MUST be absent unless the pinned public devloop API
provides an exact-reviewed-head merge effect with fresh machine-gate recheck,
idempotency/reconciliation, effect receipt, and replay tests. A raw local `gh pr
merge` wrapper or copied reference merge executor is forbidden.

**RUN-8** Every substrate Codex call MUST pass an explicit sandbox supported by
the pinned SDK: `read-only` for Council/design/review and `workspace-write` for
implementation in the qualified managed worktree. The legacy `context` field,
omitted sandbox, and `danger-full-access` are forbidden. Workers run under a
dedicated keyring-backed Codex account home and a distinct empty process HOME
with no `.agents`/personal dotfiles, using installed-CLI-compatible global-
before-`exec` argv, ignore user config and rules, use strict configuration with
the project untrusted and project-doc bytes zero, and disable personal skills,
hooks, web, MCP, apps, plugins, goals, and multi-agent. Managed requirements
MUST exactly permit the frozen policy or block execution; their digest,
resolved configuration, role-specific tool-surface digests, and negative
`.agents`/unavailable-tool/process probes MUST match the compatibility manifest. Sessions are ephemeral; approval and
command-network policy fail closed. The app copies or stores no credential.

Accept for RUN-2..8: ownership, stale-Doctor, immutable snapshot, direct
acceptance receipt, launch-intent versus supervised runtime receipt,
fresh-runtime, crash, exact ordered Codex argv/resolved effective surfaces/
sandbox/account and negative-tool probes, exact-head merge/hold
fallback, effect, dual-allowlist, and restart/cache-loss drills all pass.

## OBS — observation and authority

**OBS-1** Substrate delivery facts MUST come only from the documented observe
CLI JSON seam and preserve exact casing, omissions, truncation, and unknowns.

**OBS-2** Work, Workflow, and Council state MUST come from qualified GitHub/git
facts plus trusted app-package evidence. Durable work evidence MUST use bounded
app-owned envelopes carried by qualified loop-bot-authored GitHub issue/PR
comments through an admitted public devloop effect seam. Trust filtering
precedes parsing. One immutable comment carries one envelope; its permalink and
author/time are external transport metadata, while canonical digest, sequence,
previous digest, and dedup key are inside the envelope. Ambiguous creates are
read-reconciled: a match succeeds, a conflict fails, confirmed-not-sent may
retry, and unresolved ambiguity becomes `hold/publicationOutcomeUnknown` with
no automatic retry. Public `github-proxy.*` queues are forbidden.

**OBS-3** Every observed aggregate MUST carry source, as-of, and completeness;
unknown MUST NOT render as zero/empty/green.

**OBS-4** The app MUST NOT manufacture package health or an authoritative
timeline by copying reference-runner parsing/polling behavior.

Accept: raw fixtures cover malformed/untrusted/unknown schema, offline,
truncated, same-numbered cross-repo, and label/evidence disagreement.

## WRK — work and evidence views

**WRK-1** List and board MUST use one canonical qualified entity collection,
groupable by Workflow, workflow stage, Council status, connection, and claim.

**WRK-2** Detail MUST connect issue/PR/head/CI facts to accepted Workflow and
Council evidence without treating delivery facts as progress.

**WRK-3** Every evidence row MUST expose provenance and authoritative links;
reference-topology markers are unsupported unless the app compatibility
manifest explicitly admits them as migration input.

Accept: group totals agree; a sandbox hand audit matches every displayed fact.

## HIN — human and delegated writes

**HIN-1** The app-human adapter MUST expose only opted-in issue creation and
human comments. It MUST have no generic mutation, marker, claim, approval,
merge, label-state, ref, or close method.

**HIN-2** Each write MUST re-resolve the distinct operator context, reject bot
identity without override, require default-off global plus repo allowlists,
audit bounded metadata, and reconcile ambiguous outcomes. Only a proven
not-sent outcome may retry automatically; unresolved create ambiguity remains a
visible hold/reconciliation state requiring authoritative resolution.

**HIN-3** Fixture mode MUST make all writes and lifecycle adapters unreachable.

**HIN-4** Integrated-loop Git/GitHub effects are a separate surface controlled
by posture, loop context, exact repo/origin/branch, LIVE allowlist, public seam,
idempotency/reconciliation contract, and effect receipt.

Accept: actor/repo/disabled/rate/timeout/ambiguous and separation matrices pass.

## SAF — runtime containment

**SAF-1** The substrate process tree MUST have an executable filesystem boundary,
not only an effect audit. It may write only the exact fresh runtime root,
connection-owned durable/bounded-log/loop-rate-pool roots, bounded noncredential
Codex worker state, and qualified managed clone/worktrees. Dependency,
app-package, desired/launch-config, credential material, app-owned control
subpaths, and unrelated user paths are read-only or unreachable. Git metadata
inside a qualified managed clone/worktree may change only through an exact
declared argv-only Git effect with authority guard, audit, and typed receipt;
generic package/file access is denied.

Accept: a pinned substrate capability boundary or platform sandbox with
non-escalating capability brokers enforces a canonical per-launch profile with
exactly six bounded root templates, resolved canonical path identities/scopes/
writers/quotas, protected paths, and default deny. A process-wide sandbox alone
is insufficient. Tests reject absolute escape, traversal, symlink/path-identity
swap, alternate writable home, quota overflow, and unexpected executable
effects. Git common/linked-worktree metadata changes only through the exact
qualified argv-only public-devloop broker and receipt. That broker may write
resolved worktree content only during frozen prepare/recover/exact-ref-checkout
effects; all other broker content writes fail. Codex writes only an issued
worktree-content grant; generic package file/exec cannot borrow either.
Linux is explicitly proven or labeled unsupported for LIVE/Codex.

**SAF-2** Owned-process lifetime containment MUST survive app crash, unexpected
outer/supervisor nonzero or signal exit, supervisor hang, and forced escalation. The app MUST use a Step-0-proven launcher/job
mechanism that tracks process-group plus start identity, forbids detach, reacts
to control-channel/parent death, and leaves zero owned descendants without
signaling a reused or unowned pid.

Accept: normal exit, unexpected outer nonzero/signal exit, app EOF/crash/kill,
supervisor hang, TERM grace, KILL
escalation, nested/new-group grandchildren, detach attempt, and PID-reuse
fixtures all reach a bounded zero-survivor result or an explicit fatal recovery
state that blocks a new run. The mechanism is proven before R-039, not invented
inside product lifecycle code. App-death receipts use a create-exclusive,
atomic+fsynced, outer-launcher-only structured subpath inside the existing
bounded-log root and are read on relaunch; raw log inference, a seventh root,
wrong-writer receipt, or partial carrier write fails closed.

## UX — experience and accessibility

**UX-1** Onboarding MUST proceed dependency proof → connection → Workflow →
Council → Doctor → start. Workflows and Council MUST not be buried as secondary
settings.

After onboarding, persistent navigation MUST be grouped by user concern rather
than exposing every implementation surface at one level: Operate (Overview,
Work), Design (Workflows, Council), System (Runtime, Setup), and Settings.
Readiness, Dependencies, Connections, and Doctor are steps within Setup.

**UX-2** Every primary view MUST implement loading, empty, stale, degraded,
unverified, and fixture states.

**UX-3** Status MUST use text and shape, every action must be keyboard reachable
with visible focus/WCAG AA contrast, and reduced motion must be respected.

**UX-4** Every surface/control MUST map to an operating-loop step, a real
source/effect, and live acceptance evidence; decorative or dependency-fiction
surfaces are removed.

## DAT — local data and recovery

**DAT-1** SQLite MUST separate disposable cache, preferences, staged
Workflow/Council drafts, and durable audit mechanically.

**DAT-2** No token, Codex/GitHub credential, raw comment body, unbounded log, or
raw command stderr may be persisted.

**DAT-3** Migrations MUST be versioned with pre-migration backup and explicit
recovery; corruption MUST NOT cause silent deletion.

Accept: cache-drop, secret-scan, migration-failure, corruption, restore, and
explicit destructive-flow tests pass.

## REL — verification and release

**REL-1** Contract/projection/digest logic MUST be pure and fixture-testable.

The compatibility manifest, connection revision, Council decision policy,
config-acceptance receipt, and app evidence envelope are included in this rule.

**REL-2** Release requires Step-0 evidence, dependency/app suites, graph/import
lint, Workflow/Council cross-language fixtures, DRY/LIVE sandbox runs, all
failure drills, accessibility, clean install/upgrade, diagnostics review, and
dependency-root immutability proof.

**REL-3** A macOS artifact MUST be signed/notarized before being called a
release; development artifacts must be labeled.

Accept: every traceability/readiness row is green or its feature is absent;
clean Finder launch resolves exact substrate/devloop/tool contexts.

⟦AI:FKST⟧
