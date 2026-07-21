# Full-app construction blueprint

Status: **AUTHORITATIVE TECHNICAL BLUEPRINT — EXECUTION SCHEDULING SUPERSEDED BY ACCELERATED PLAN**
Spec: `full-app/v2`
Objective: build the complete Flutter app with Workflows and Council as the
primary mechanisms, running a thin app-owned package on substrate using public
devloop as the only other primary FKST dependency.

The technical dependency order and acceptance content below remain normative.
Current dispatch, review, and authorization are governed by
[`accelerated-human-gated-delivery.md`](accelerated-human-gated-delivery.md).
HG-01 may start fixture/fake-backed Flutter and pure layers before all of Step 0
is green; every runtime-connected path still requires completed Step 0 and
HG-02. HG-03..HG-05 separately guard live effects, release, and submission.

This file defines technical waves. The 211 rows in
[`parallel-engineering-task-map.md`](parallel-engineering-task-map.md) retain
detailed requirement acceptance. ADR-034 groups them into 35 packages: one
fresh GPT-5.6 Sol owner, one fresh independent Opus review, then mechanical
candidate integration. Fable and humans review milestone boundaries. Existing
v1 work remains governed by ADR-032 and its append-only records.

## Global invariants

- Primary FKST dependencies are exactly substrate and public devloop.
- Existing `devbored`, `github-devloop*`, `consensus`, and `github-proxy`
  packages are reference-only and absent from the shipped graph/imports.
- The app package uses public devloop APIs; it never copies loop internals.
- Workflow and Council are app-owned versioned contracts and the main UX.
- GitHub/git own work facts; substrate owns delivery facts.
- Flutter controls only the verified outer job/launcher it initiated; that
  launcher owns supervisor/descendant cleanup, and Flutter never directly
  signals inferred child PIDs.
- Flutter dependencies point presentation → application → domain ports;
  infrastructure implements ports and is wired only at one composition root.
- V1 config is immutable per launch; there is no hot reload.
- Durable work evidence is a trusted qualified GitHub comment envelope; local
  config activation requires a direct no-effect receipt, launch intent, and a
  supervised runtime-consumption receipt from the same process/snapshot.
- V1 claim is label-only; the proxy-coupled assignee path is rejected.
- Every Codex worker uses a dedicated keyring-backed personal-account Codex
  home, a distinct empty process HOME without `.agents`/personal dotfiles, and
  installed-CLI-compatible global-before-`exec` argv: no legacy
  context; ignored user config/rules; strict untrusted zero-project-doc mode;
  personal skills, hooks, web, MCP, apps, plugins, goals, and multi-agent
  disabled; managed requirements must exactly permit the policy or block;
  managed-requirement/resolved-configuration/tool-surface digests; negative
  home/tool/process probes; an ephemeral session; fail-closed approval/network
  policy; and an explicit role-appropriate sandbox with no bypass.
- Substrate and every descendant execute inside a proven filesystem boundary;
  read-only roots and an effect audit are additional evidence, not containment.
- Each launch embeds a canonical resolved six-root profile with path identities,
  scopes, writers and quotas. A process-wide sandbox alone is insufficient:
  managed Git metadata is reachable only through a non-escalating exact-argv
  public-devloop broker; its content writes are limited to receipted prepare/
  recover/exact-ref-checkout. Codex receives only a typed content-worktree grant.
- Every owned process executes inside the Step-0-proven outer job/launcher;
  parent/control death, hang, escalation, new process groups, detach, and PID
  reuse produce an identity-safe zero-survivor receipt or fatal
  `cleanupFailed`, which blocks every new launch until contained reconciliation.
- Automatic merge exists only through a public exact-reviewed-head devloop
  effect; a raw/copy merge implementation is forbidden.
- Every claimed capability has current executable evidence or is absent/gated.

## Dependency graph and safe waves

```text
0 Readiness + contract/integration proof
├── 1 Flutter shell/state gallery
└── 2 Core connection/Doctor/process/store
    ├── 3 Source adapters + pure projection
    └── 4 Production loop package + direct lifecycle
         ├── 5 Work/evidence/runtime UI   (also needs 1,3)
         └── 6 Workflow/Council UI       (also needs 1,2)
              └── 7 Guarded human input  (also needs 3)
                   └── 8 Fleet/hardening (also needs 5)
                        └── 9 E2E/adversarial gate
                             └── 10 Package/release
```

Safe waves:

- Wave A: Step 0 only.
- Wave B: Step 1 establishes the Flutter boundary first; after its architecture
  scaffold, remaining Step-1 UI primitives and Step-2 core streams fan out.
- Wave C: Steps 3 and 4 in parallel after Step 2.
- Wave D: Steps 5 and 6 after their dependencies; Step 7 after 3 and 6.
- Wave E: Steps 8, 9, and 10 sequentially.

Parallel branches may not edit the same frozen contracts. A seam change invokes
the mutation protocol at the end.

## Step 0 — Close the exact two-dependency readiness gate

**Review emphasis:** exhaustive contract/dependency reasoning and an independent
Opus adversarial review. Implementation ownership remains GPT-5.6 Sol under
ADR-032; “strongest” never selects a different implementation-agent class.

**Depends on:** nothing.

**Read first:** all `docs/spec/`, `docs/08-DECISIONS.md` ADR-031,
substrate host/package/observe/Codex SDK source+tests, public
`packages/libraries/devloop/fkst.toml` and only the public modules needed for
the proposed adapter. Read reference packages solely to extract cited lessons.

**Wave integration target:** `codex/full-app-v2-00-readiness`. Every `R-*` item
uses its own task branch/worktree and completes the GPT-5.6 Sol → Opus → PM
loop before integration. If dependency visibility needs a separate repository
change, land/pin it first and record its commit; do not mix it into an app task.

**Expected files:** `contracts/`, compatibility manifests/fixtures,
`loop-package/` minimal no-write proof package, Step-0 scripts/tests, and
`docs/spec/08-READINESS.md`. No Flutter feature source.

**Tasks:**

1. Record exact substrate/devloop commits, roots, licenses, public export list,
   declared closure, binary SHA/platform/self-test, observe/provenance schemas,
   and process/detach behavior.
2. Choose a stable app-package id. Obtain a narrow tested public-devloop
   visibility/integration mechanism; never impersonate/rename the reference
   `devbored` package to bypass the boundary. Add and pin the required public
   immutable evidence publish/reconcile/read-back/receipt capability and the
   required proxy-free generic restart/replay seam. Resolve the optional
   exact-head merge capability to either an admitted tested pin or a
   manifest-frozen hold-only disposition.
3. Define a machine-readable allowlist containing substrate, the app package,
   public devloop, and devloop's declared internal closure. Add graph/import
   lints that reject every reference event package and direct app import of a
   transitive/internal library.
4. Freeze the app-owned Workflow v1 semantic/wire schema, deterministic digest,
   valid/invalid/unknown/bound fixtures, CAS/version, and activation rules.
   Each deliberative stage carries an explicit `{councilId, policyId}` assignment
   whose referential validity and digest behavior are cross-language tested.
   Freeze one manifest-selected family with exhaustive outcome routes and total
   transition/implementation-cycle budgets, including review and CI rework, and
   explicit attempt/round/cycle/transition-exhaustion hold reasons.
5. Freeze the app-owned Council v1 semantic/wire/evidence schema, exact seat/
   policy bounds, valid/invalid fixtures, digest/CAS, and activation rules.
   Admit only fields the minimal package can consume and evidence it can emit;
   make unanimous/simple-majority decisions mechanical over structured seat
   verdicts and fail closed on malformed/missing/timed-out seats. Approved or
   changes-requested ends a stage; only inconclusive advances a bounded round,
   and accepted replay never invokes a seat again.
6. Freeze the machine-readable compatibility manifest, canonical connection
   revision, immutable per-launch config snapshot, no-effect config-acceptance
   receipt, supervised runtime-consumption receipt, concrete evidence-fact
   union, immutable transported comment envelope, and dedicated managed-clone
   contract. Prove the activation records and evidence channels cannot be
   confused or inferred from logs/deliveries.
7. Complete the RDY-05 capability/authority matrix for intake, label-only claim,
   every admitted Workflow stage/terminal, Council execution/decision evidence,
   Codex implementation, Git push/PR, review/exact-head gate, LIVE terminal,
   restart/replay/idempotency, and the full DRY/LIVE effect surface. Map each to
   an exact public devloop export, substrate primitive, or app-owned contract-
   translation/Workflow/Council seam. An app seam may not replace missing
   devloop marker, claim, gate, replay, restart, Git, or convergence behavior;
   push/PR requires an admitted public devloop seam or removal from v1.
   High-risk rows require executable seam probes. Remove unsupported scope now;
   do not defer seam discovery to Step 4.
8. Build the smallest no-write app package and isolated probes needed to prove
   the complete admitted matrix, Workflow/Council loading, accepted
   schema/id/version/digest provenance, exhaustive deterministic outcome
   routing, Council decision evidence, supervised runtime-config acknowledgement,
   proxy-free replay, and clean shutdown. These are integration contract probes,
   not production feature implementation.
9. Freeze the supported direct substrate host/composition command, files,
   package roots, argv, cwd, and minimal environment. Prove the collision-safe
   reserved composition-root/managed-Git-root topology or pin an explicit
   root-separation seam. Do not use the reference packages runner as a fallback.
10. Freeze exact GitHub loop/operator context selection, label-only claim,
   branch/trust/rate/posture inputs, no-prompt git transport, and exact Codex
   executable/version/personal-account invocation under the sanitized env and
   dedicated keyring-backed Codex home and separate empty process HOME without
   `.agents`/personal dotfiles. Freeze the installed global-before-
   `exec` argv order, no context, ignore-user-config, ignore-rules, strict
   untrusted zero-project-doc mode, disabled personal skills/hooks/web/MCP/apps/
   plugins/goals/multi-agent; require managed requirements to match or block;
   hash managed-requirement/resolved-configuration/tool-surface digests; run
   negative home/tool/process probes; enforce ephemeral/fail-closed approval/network
   policy, explicit read-only/workspace-write sandboxes, and no bypass.
11. Freeze substrate observe fixtures and new app evidence trust/conflict/
   digest-chain/truncation behavior. Prove the durable carrier through the
    public create-only publish/reconcile/read-back/typed-receipt capability, not
    a raw comment command or `github-proxy.*` request queue. Reference markers
    may be differential inputs only.
12. Make the contract test harness self-contained in any Git/Heca worktree.
    Default tests must never find fixtures by assuming a sibling `packages`
    checkout. Any mirrored legacy `devbored` bytes carry exact source
    commit/path/SHA provenance and are differential/reference-only; obsolete
    `devbored.config.v1` validity cannot define app Workflow/Council authority.
13. Define the new integrated package's DRY/LIVE process/Git/GitHub effect
    matrix. Reference topology effects are not proof.
14. Freeze the six bounded grant templates and build an immutable canonical
    resolved launch profile with exact path identities, connection/launch/
    worktree scopes, writer capabilities, subpaths, instance/byte/file/depth
    quotas, protected known paths, and default deny. Prove a root-confined
    substrate boundary or sandbox plus non-escalating brokers; a process-wide
    sandbox alone fails. Resolve Git common/linked metadata and allow it only to
    the exact argv/repo/ref public-devloop broker with typed receipts; limit its
    content writes to prepare/recover/exact-ref-checkout effects. Issue
    Codex only bounded content-subpath worktree grants. Deny generic file/exec,
    absolute/traversal/symlink/path-replacement/quota/descendant escapes and
    archive the profile/effect evidence.
15. Freeze and prove an outer job/launcher before product lifecycle work. Test
    normal exit, unexpected outer nonzero/signal exit, app kill/crash, control
    EOF, hung supervisor, TERM/KILL grace,
    nested and new-process-group descendants, detach, and PID/start-identity
    reuse. Freeze the bounded cleanup-receipt schema/version/size/canonical
    digest and its launch/job/start-identity, tracked-set, trigger, TERM/KILL,
    detach, scan, survivor, and completion bindings. Every bounded path must
    produce a valid zero-survivor receipt or enter fatal `cleanupFailed`;
    malformed/stale/replayed receipts fail, and a new contained reconciliation
    receipt is the only path back to Doctor. App-death receipts persist through
    a create-exclusive atomic+fsynced outer-launcher-only subpath inside the
    existing bounded-log root and are read on relaunch; never parse logs or add
    a seventh writable root.
16. Update every readiness row with exact command/artifact/commit, run an
    independent adversarial review, and stop on any unresolved P0.

**Verification:**

```sh
cd contracts
dart format --output=none --set-exit-if-changed .
dart analyze --fatal-infos
dart test

# Exact commands below are outputs of this step, not guessed in advance:
<graph-and-import-lint>
<substrate-direct-host-conformance-with-read-only-dependency-roots>
<workflow-council-cross-language-fixture-suite>
<codex-and-github-context-probes>
```

The evidence must show the app package, public devloop, declared closure, and
substrate only; accepted Workflow/Council digests; no write in no-write/DRY
probes; only the exact allowlisted isolated effects in LIVE seam probes; no
unexpected external write; no unreviewed dependency change; and no reference
package in graph/imports.

**Exit:** every P0 readiness row for admitted scope PASS with citations, every
RDY-05 capability row PASS or its product scope removed, conditional RDY-19
explicitly GATED when the manifest is hold-only, RDY-13..24 accurately
PASS/GATED, and adversarial verdict PASS. Only then may Step 1+ branches be
created.

**Rollback:** revert the app proof PR and every separately reviewed upstream
capability commit through its normal repository flow and per-repository lineage.
This includes visibility/evidence/restart/optional-merge devloop changes and
Codex/root/containment substrate changes when present. Do not retain a local
bypass, copied module, or partial schema as an alternate seam.

## Step 1 — Flutter shell and complete state gallery

**Review emphasis:** design and accessibility. Every implementation task still
uses GPT-5.6 Sol and a fresh independent Opus review under ADR-032.

**Depends on:** Step 0.

**Read first:** `00-PRODUCT.md`, `04-DATA-CONTRACTS.md`, `05-UX-SPEC.md`, frozen fixtures.

**Wave integration target:** `codex/full-app-v2-01-shell`; atomic `U-*` task branches.

**Expected files:** Flutter project with `domain/`, `application/`,
`infrastructure/`, `presentation/`, and one `composition/` root; theme/tokens,
routing, immutable fixture ViewModels, gallery/widget tests. No real process/
network/file adapter.

**Tasks:** create macOS/Linux desktop shell; enforce architecture/import rules;
implement grouped Operate/Design/System/Settings navigation and the Setup
stepper; implement acquisition and mutation states for every primary view;
create shared unknown/provenance/focus/status components; render Workflow and
Council from frozen fixtures only; keep effects disabled.

**Verify:** format/analyze/unit/widget/golden/semantics/keyboard/contrast,
responsive widths, hostile architecture imports, one composition root, no
listener, and no process/network/file/database imports in Views/ViewModels or
domain/application.

**Exit:** every frozen field/state renders accessibly; no mock-only field exists.

**Rollback:** revert shell PR; retain Step-0 fixtures unchanged.

## Step 2 — Connection, Doctor, process, filesystem, and store foundation

**Review emphasis:** security, process, and filesystem boundaries. Every
implementation task still uses GPT-5.6 Sol and a fresh independent Opus review.

**Depends on:** Step 0.

**Read first:** dependency/architecture/data/security specs and Step-0 manifest.

**Wave integration target:** `codex/full-app-v2-02-foundation`; atomic `C-*` task branches.

**Expected files:** connection/Doctor/process/files/store modules, migrations, fakes/tests.

**Tasks:** implement qualified connection/revision; exact substrate/devloop/app
package/Codex/GitHub contexts and label-only claim; root derivation/canonicalization;
argv-only sandboxed supervisor; DB classes and recovery; typed Doctor registry;
graph/import/compatibility-manifest probes; stale-report invalidation; safe
Codex-argv, project-root, containment, redaction, and read-only-root tests.
Application primitives/use cases remain separate from concrete process/file/
database adapters and are tested through ports/fakes.

**Verify:** path metacharacters/spaces, output flood, timeout/cancel/app exit,
root collision/symlink, corrupt/migration DB, incompatible graph/pins/contexts,
five-connection identity isolation, listener/process-tree scan.

**Exit:** Doctor fully represents the frozen matrix through fakes; no real start.

**Rollback:** revert foundation/migrations; preserve developer app data.

## Step 3 — Substrate, GitHub/git, evidence adapters and pure projection

**Review emphasis:** source authority, trust, and projection correctness. Every
implementation task still uses GPT-5.6 Sol and a fresh independent Opus review.

**Depends on:** Steps 0 and 2.

**Read first:** frozen raw fixtures, OBS/WRK/HIN requirements, trust rules.

**Wave integration target:** `codex/full-app-v2-03-adapters`; atomic `A-*` task branches.

**Expected files:** substrate/GitHub/git adapters, evidence parser, pure projection tests.

**Tasks:** implement digest/self-test/observe/provenance adapters; provision the
dedicated managed clone without adopting/destructively repairing a user
checkout; implement the exact no-effect config-acceptance adapter; acquire
and verify the separate supervised runtime-consumption receipt; acquire qualified
GitHub reads and git facts; trust-before-parse app evidence envelopes;
project Workflow/Council accepted-config and run facts; preserve source/as-of/
completeness/truncation; swap atomic generations; reject reference marker
schemas unless a migration manifest admits them.

**Verify:** all raw fixture classes, forged/malformed/conflict/regression,
unknown-versus-zero, same-numbered repos, comment/page limits, offline/stale,
delivery/work separation, pure-domain import boundary.

**Exit:** every displayed source field is derivable; no reference parser is copied.

**Rollback:** revert adapters; caches are disposable; do not change pins.

## Step 4 — Productionize integrated loop package and owned lifecycle

**Review emphasis:** dependency and process-lifetime boundaries. Every
implementation task still uses GPT-5.6 Sol and a fresh independent Opus review.

**Depends on:** Steps 0 and 2; may run beside Step 3.

**Read first:** thin Step-0 proof, WFL/COU/RUN requirements, direct launch/effect fixtures.

**Wave integration target:** `codex/full-app-v2-04-runtime`; atomic `L-*` task branches.

**Expected files:** `loop-package/`, host composition, lifecycle, evidence schema
implementations, direct integration tests.

**Tasks:** expand only app-specific bounded Workflow/Council orchestration;
continue using public devloop behavior; materialize exact host graph; manage
the qualified dedicated managed-Git/config/runtime/durable/log/rate/
noncredential-Codex-state roots; resolve and hash the immutable per-launch
filesystem profile plus broker/worktree grants; create a stopped-
only immutable launch config snapshot; obtain and bind its no-effect acceptance
receipt; record launch intent and require the same supervised process to emit a
matching runtime-consumption receipt before `active`; pass frozen contexts,
label claim, rate, posture, and safe Codex argv inputs; emit durable app comment
envelopes through the admitted public safe-comment seam; implement the proven
filesystem boundary and the proven outer job/lifetime launcher; make uncertain
or nonzero cleanup enter fatal `cleanupFailed`, block new launches, and expose
only contained reconciliation; preserve fresh runtime/no auto-restart; use the
public exact-head merge effect or truthful hold terminal; show the integrated
effect matrix. Treat any write outside the six manifest-qualified root kinds as
fatal, and require each expected package-authored/engine-managed LIVE effect to
match its matrix entry and typed receipt.

**Verify:** graph/import lint, reference packages absent, differential public-
devloop behavior, read-only dependencies, DRY no-write sandbox, LIVE opt-in
guard, ownership/crash/app-exit/control-EOF/supervisor-hang/TERM-KILL/new-group/
detach/PID-reuse/zero-survivor/cleanupFailed/restart/cache-loss/stale-Doctor drills.

**Exit:** headless configure → Doctor → Workflow/Council activate → DRY start →
one bounded no-write workflow/council run → observe → stop succeeds.

**Rollback:** stop verified owned processes, disable LIVE, preserve audit, revert
runtime PR; never signal unverified pids or mutate dependencies.

## Step 5 — Work, evidence, overview, and runtime UI

**Review emphasis:** final projection truthfulness, accessibility, and runtime
authority. Every implementation task still uses GPT-5.6 Sol and a fresh
independent Opus review.

**Depends on:** Steps 1, 3, and 4.

**Read first:** WRK/OBS requirements, UX work/detail/runtime sections.

**Wave integration target:** `codex/full-app-v2-05-observation-ui`; atomic `P-*` task branches.

**Expected files:** application query/lifecycle use cases plus feature-grouped
ViewModels/views/tests for overview, work, Council run, and runtime.

**Tasks:** connect the canonical entity set through application use cases; group by Workflow/stage/Council/
connection/claim; render qualified provenance, accepted config, rounds, links,
CI/head and delivery facts separately; wire refresh and owned-only lifecycle;
keep adapters out of ViewModels.

**Verify:** gallery plus live DRY fixture, grouping equality, unknown/stale/
truncation, unowned action set, keyboard/semantics/responsive tests.

**Exit:** operating-loop observation steps work without invented fields.

**Rollback:** revert UI PR; runtime/data layers remain usable headlessly.

## Step 6 — Workflow and Council authoring UI/services

**Review emphasis:** contract/file safety and widget accessibility. Every
implementation task still uses GPT-5.6 Sol and a fresh independent Opus review.

**Depends on:** Steps 0, 1, 2, and 4.

**Read first:** WFL/COU requirements, frozen schemas, activation/filesystem rules.

**Wave integration target:** `codex/full-app-v2-06-workflow-council`; relevant atomic `P-*` task branches.

**Expected files:** Workflow/Council domain/application/file services and UI/tests.

**Tasks:** implement catalog/draft/validate/diff/save/accept/activate use cases;
render every and only consumed field; bounded Workflow family and
Council roster/policy editors; semantic diff/validation; CAS/version/symlink/
backup/atomic replace; draft/written/pendingStop/acceptancePending/
acceptedForNextLaunch/active states; conflict recovery; gated capabilities
absent. Views/ViewModels import application contracts only.

**Verify:** entire frozen corpus through service/UI; property round-trip and
digest parity; external edit, invalid input, interrupted write, symlink swap,
accepted-digest mismatch, dependency-root immutability.

**Exit:** setup/config steps 4–6 pass against the real integrated consumer.

**Rollback:** restore from app backup, retain audit/conflict, revert PR.

## Step 7 — Narrow human input and dual effect guards

**Review emphasis:** write safety, authority, reconciliation, and audit. Every
implementation task still uses GPT-5.6 Sol and a fresh independent Opus review.

**Depends on:** Steps 2, 3, 4, and 6.

**Read first:** HIN requirements and GitHub/effect sections.

**Wave integration target:** `codex/full-app-v2-07-human-input`; atomic `W-*` task branches.

**Expected files:** narrow write port, guards, reconciliation/audit, issue/comment UI/tests.

**Tasks:** implement only opted-in issue and human comment; re-resolve operator;
bot/repo/global/fixture/rate guards; ambiguous reconciliation; separate LIVE
loop confirmation/allowlist and effect audit; no generic mutation client.

**Verify:** sandbox actor/repo/disabled/bot/rate/timeout/ambiguous matrix;
enabling one effect surface cannot enable the other; secret/body scans.

**Exit:** operating steps 8 and 13 pass with no unexpected mutation.

**Rollback:** disable both switches/allowlists, preserve audit, revert PR.

## Step 8 — Fleet, scheduling, diagnostics, and resilience

**Review emphasis:** fairness, rate isolation, redaction, recovery, and UI
truthfulness. Every implementation task still uses GPT-5.6 Sol and a fresh
independent Opus review.

**Depends on:** Steps 2, 3, 5, and 7.

**Read first:** CON/DAT requirements, rate/privacy/failure specs.

**Wave integration target:** `codex/full-app-v2-08-fleet`; atomic `F-*` task branches.

**Expected files:** scheduler/rate/fleet/diagnostics/performance tests.

**Tasks:** fair bounded refresh, separate child/operator budgets, jitter/backoff,
manual refresh rules, failure isolation, fleet status, rotating bounded logs,
redacted export, migration/restore UX, resource budgets.

**Verify:** five-connection hangs/rate identities/fairness, export secret scan,
large hostile data, DB recovery, performance/accessibility.

**Exit:** multi-connection operation remains truthful/responsive under failure.

**Rollback:** stop scheduler/export jobs, preserve audit, revert PR.

## Step 9 — Full E2E and adversarial acceptance

**Review emphasis:** independent adversarial system acceptance. Implementation
owners remain GPT-5.6 Sol; the separate Opus audit remains mandatory.

**Depends on:** Steps 4–8.

**Read first:** all authoritative specs, readiness ledger, failure drills.

**Wave integration target:** `codex/full-app-v2-09-e2e`; atomic `E-*` task branches.

**Expected files:** integration harnesses, opt-in sandbox templates, evidence dossier.

**Tasks:** exercise all 15 steps with the app topology; run fixture and DRY
evidence; run separate allowlisted LIVE issues for happy hold, optional happy
merge, Council-requested rework, CI-failure rework, attempt/round/cycle caps, PR
reuse, transition-cap exhaustion, and—only when merge is admitted—ambiguous merge confirmed and unresolved
merge-to-`hold/mergeOutcomeUnknown`. A hold-only manifest instead proves merge
code/control absence and the exact operator-hold evidence/copy. Exercise every
failure; relaunch/cache loss; network/process/file guards; audit sandbox for
unexpected effects; map every requirement/readiness row.

**Verify:** full suites twice (clean and upgrade); graph/import and dependency
immutability gates; no unexpected GitHub/git effects or process remains.

**Exit:** every row green or feature absent; adversarial verdict PASS.

**Rollback:** stop owned sandbox processes, disable effects, preserve dossier;
external artifact cleanup requires human confirmation.

## Step 10 — Package, sign, notarize, and release

**Review emphasis:** security, packaging, release provenance, and mechanical
reproducibility. Every implementation or fix remains owned by GPT-5.6 Sol and
receives a fresh independent Opus review.

**Depends on:** Step 9.

**Read first:** REL, release evidence, licenses, recovery docs.

**Wave integration target:** `codex/full-app-v2-10-release`; atomic `X-*` task branches.

**Expected files:** packaging/CI, entitlements, notices/SBOM, operator docs, dossier.

**Tasks:** minimal entitlements; package/sign/notarize/staple; Finder launch and
exact substrate/devloop/gh/git/codex context discovery; listener/process/secret/
accessibility/performance/install/upgrade scans; licenses/notices/SBOM; supported
platform/known limits; final independent spec-to-artifact audit.

**Verify:** Gatekeeper/staple evidence, clean-machine launch, all dossier rows
green, no undocumented dependency/surface/process/network behavior.

**Exit:** versioned artifact satisfies v2; development/Linux claims are exact.

**Rollback:** withdraw candidate through normal release flow; retain dossier;
never replace an artifact silently under the same tag.

## Global gates and anti-patterns

Every PR passes formatter/static/unit/owned tests, `git diff --check`, secret
scan, dependency/import direction, traceability/readiness updates, and review
that dependency roots/unrelated user files are untouched.

Stop immediately on:

- reference package in shipped graph/imports;
- copied devloop module or private/transitive direct import;
- Flutter-owned loop transition/Council decision logic;
- UI before real Workflow/Council consumer/evidence;
- direct ledger/socket access, package health imitation, unknown-to-zero;
- shell strings/ambient login-shell tools/repository content as commands;
- credentials/raw bodies/raw stderr/unbounded logs in storage;
- broad GitHub mutation adapter, unowned process control, or auto-restart;
- raw comment publication presented as immutable/reconciled evidence;
- launch argv/PID presented as proof that runtime consumed configuration;
- an effect audit or read-only known roots presented as filesystem containment;
- Codex context/omitted sandbox/bypass, wrong argv order, user config/rules,
  trusted project docs, or ambient personal skills/hooks/web/MCP/apps/plugins/
  goals/multi-agent;
- graceful shutdown, a PID, or a process-group signal presented as proof of
  zero surviving descendants after app/control/supervisor failure;
- proxy-coupled assignee claim or replay path in v1;
- model/effort/persona/score/topology control without pinned executable proof;
- downstream branch while Step 0/readiness is red.

## Plan mutation protocol

1. Stop affected/downstream steps.
2. Capture exact new fact, dependency commit, source/test, and compatibility.
3. Append a superseding ADR for boundary/authority/write/serialized changes.
4. Update specs, readiness, traceability, graph, affected step briefs, and tests together.
5. Re-run Step 0; rebase/discard downstream assumptions rather than add fiction.
6. Obtain adversarial review before resuming.

Scope may shrink when a source/effect cannot be proven. Expansion requires a
real public dependency/app contract and executable evidence; a mock or demo is insufficient.

⟦AI:FKST⟧
