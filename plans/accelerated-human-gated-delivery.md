# Accelerated human-gated delivery plan

Status: **ACTIVE EXECUTION AUTHORITY — T0 FOUNDATION; HG-01 NEXT**
Spec: `full-app/v2`
Main PM: GPT-5.6 Sol
Technical advisor: Fable at architecture/milestone boundaries
Independent package reviewer: fresh Opus
Machine map: [`accelerated-package-map.v1.json`](../docs/spec/evidence/governance/accelerated-package-map.v1.json)
Execution contract: [`execution-contract.v2.json`](../docs/spec/evidence/governance/execution-contract.v2.json)

## Outcome

Deliver the Hackathon-ready Workflow/Council application as quickly as the
dependency and safety boundaries permit, while retaining the full production-v2
requirement registry. The former 211 review units remain exact traceability and
acceptance identifiers; they are now implemented, reviewed, and integrated as
35 cohesive engineering packages.

## Deadline control and truthful submission scope

The official [OpenAI Build Week page](https://openai.devpost.com/) sets the
submission deadline at **July 21, 2026, 5:00 PM PDT**, which is **July 22,
2026, 8:00 AM SGT**. The current repository does not yet contain a working
full-app product, so neither this plan nor existing mock artifacts may be used
to claim that it does.

The full product and any unrescoped `full-app/v2` submission claim require all
35 packages and five gates. A deadline-limited fixture demonstration may be
prepared only as a proposed alternative: it must be a genuinely working,
installable Workflow/Council experience, be represented as fixture-backed, and
must not claim substrate/devloop runtime automation or external effects. Before
that narrower path is dispatched or submitted, a human `RESCOPE` receipt must
bind the included requirements, excluded claims, artifact, demo plan, and
remaining full-product backlog. Preparing that dossier is not authorization to
cut dependencies, weaken acceptance, publish, or submit.

The final artifact also must satisfy the official submission evidence: a
working/installable build that runs as depicted; a public YouTube video under
three minutes with audio; repository access and setup/sample/test instructions; a README
describing Codex/GPT-5.6 collaboration; a `/feedback` Codex Session ID covering
the majority of core functionality; supported-platform/test-route guidance for
the developer tool; and timestamped post-July-13 extension evidence where an
existing project is used. The [official rules](https://openai.devpost.com/rules)
govern personal eligibility; project readiness does not assert the entrant's
age, conflict, ownership, or jurisdiction eligibility.

This plan removes the repeated per-requirement PM and Fable review stations.
It does not remove independent review, tests, readiness, containment, or human
control of effects. The normal package path is:

```text
fresh GPT-5.6 Sol owner
  → focused/package tests at an exact commit
  → one fresh independent Opus review
  → same Sol owner corrects blocking findings
  → fresh Opus only when the reviewed artifact materially changes
  → deterministic staged-integration checks
  → candidate integration
```

The GPT-5.6 Sol main PM schedules packages, protects boundaries, runs the
mechanical gate, integrates green work, and prepares milestone dossiers. The PM
does not repeat a full package review and cannot waive a failed check. Fable
advises only for this cutover, later architecture/dependency/authority
mutations, and the human milestone dossiers. Humans grant T1 through T5.

## Non-negotiable product boundaries

1. The only primary FKST dependencies are `fkst-substrate` and public
   `devloop`.
2. Workflow and Council are app-owned contracts, the main product mechanisms,
   and the authority for stage and deliberation semantics.
3. `devbored`, `github-devloop*`, `consensus`, and `github-proxy` are
   provenance-bound reference inputs only. They are absent from shipped
   imports, runtime graph, and copied production code.
4. The app uses public devloop as a capability guide and dependency. It does
   not hard-reimplement marker, claim, gate, restart, Git, or convergence
   behavior. A missing generic capability is added narrowly upstream or the
   product truthfully holds/cuts it.
5. No external effect is inferred from config, tests, a PM statement, or human
   presence. It requires a matching candidate-bound human receipt.
6. Automatic merge remains absent by default. The fastest credible Hackathon
   posture is `hold/readyForOperatorMerge`.

## Cutover and preserved history

- Closed G, R1, R2, and `fkst.task-state/v1` records remain hash-pinned
  immutable history. The already-open R-041/R-051 records preserve their exact
  cutover prefix and may append only normal v1 completion/closure evidence with
  a documented current-blob re-baseline.
- R-003, R-008, R-014, and R-016 are adopted from their exact integrated
  artifacts and are not reimplemented.
- R-041 and R-051 finish under their already-open v1 records. Their accepted
  artifacts are then adopted by AP-04/AP-05 at exact commits.
- No new 211-node task is dispatched as an isolated review unit after HG-00.
- Existing requirement IDs still own their detailed acceptance criteria in
  [`parallel-engineering-task-map.md`](parallel-engineering-task-map.md).
- R-059 stays a contract-harness portability repair in AP-02; its absence from
  the `RUN-*` requirement family is intentional.

HG-00 is the process cutover, not a product tier. The user's directive to
replan and activate the accelerated approach, the green machine verification,
Fable `PASS`, and fresh independent Opus `APPROVE` activated this exact
mutation. It does not grant HG-01 or any runtime/live/release authorization.

## Package dispatch packet

Every package is one cold-start-capable brief. Before dispatch the PM expands
its map row with:

1. the exact package id, owned requirement ids, outcome, and acceptance text;
2. the relevant full-app spec sections and accepted dependency/contract
   artifacts at immutable commits/digests;
3. dependency package receipts and candidate base;
4. exclusive paths and forbidden paths;
5. the current human tier and an explicit effect ceiling;
6. exact focused/package commands and required result schema;
7. provenance trailers, redaction rules, and clean-worktree requirement;
8. same-owner rework instructions; and
9. the rule to stop on a changed seam instead of inventing compatibility.

The handback contains the exact commit, changed paths, mapped criteria and
commands/results, test summary, known risks, and confirmation that unrelated
and dependency roots are clean.

## Engineering package graph

The JSON map is the machine authority. This table is its compact human view.
Every row inherits the global boundaries above and the detailed acceptance
criteria of all listed requirement IDs.

| Package | Requirements | Depends on | Minimum tier | Outcome / acceptance |
|---|---|---|---|---|
| AP-00 Governance bootstrap | G-001..G-007 | — | T0 | Named Sol, Opus, and Fable routes, rework and worktree isolation proven; no product artifact. |
| AP-01 Dependency provenance/import boundary | R-001,R-002,R-003,R-004,R-006 | AP-00 | T0 | Exact substrate/devloop pins, binary/exports/closure/host/observe/license evidence and rejecting import policy. |
| AP-02 Workflow/Council executable kernel | R-007..R-011,R-059 | AP-00 | T0 | Cross-language canonical bytes/digests, assignments, policies, bounds, hostile corpus, and worktree portability. |
| AP-03 Context/authority/effects/clone contracts | R-012..R-018,R-044,R-049 | AP-01,AP-02 | T0 | Dual actor context, personal Codex isolation, label-only claim, public capability map, Council boundary, effect matrix, managed-clone rules. |
| AP-04 Public-devloop seams | R-041,R-045,R-055,R-005,R-042,R-053 | AP-03 | T0 | Required public visibility/evidence/replay seams land and pin; optional merge is admitted or hold-only. |
| AP-05 Substrate containment/Codex/lifetime | R-046,R-048,R-051,R-056,R-054,R-057,R-058,R-052 | AP-03 | T0 | Six-root confinement, Git broker, content grant, safe Codex invocation, outer job, cleanup receipts, final binary. |
| AP-06 Compatibility and app-loop manifest | R-043,R-047,R-050,R-019,R-020 | AP-02,AP-04,AP-05 | T0 | One frozen manifest/disposition with only substrate, public devloop, and declared closure. |
| AP-07 Minimal proof package/consumers/lints | R-021..R-024,R-026..R-028 | AP-06 | T0 | Load Workflow/Council, emit bound evidence/receipts, cross-language parity, reject prohibited graph/imports. |
| AP-08 Executable host/effect seam probes | R-025,R-029..R-034 | AP-07 | T0 | Direct host, actors, intake, Council/Codex, clone/Git/PR, restart/evidence, containment, DRY/LIVE probe matrix. |
| AP-09 Integrated Step-0 audit | R-035..R-039 | AP-08 | T0 | Read-only roots and complete dossier green; Fable disposition plus fresh Opus audit; truthful readiness closure. |
| AP-10 Fixture-only Flutter shell/layers | U-001..U-006,U-023 | HG-01 | T1 | Desktop shell, strict layers, theme/navigation/state/provenance/accessibility with no adapter or effect. |
| AP-11 System fixture galleries | U-007,U-010,U-012,U-013,U-021,U-022 | AP-10 | T1 | Setup, Doctor, Runtime, recovery, Settings states are accessible/responsive and effect-free. |
| AP-12 Workflow/Council galleries | U-008,U-014..U-016 | AP-10 | T1 | Frozen supported fields, assignments, decisions, bounds, evidence, and terminals only. |
| AP-13 Work/Overview/Fleet galleries/router | U-009,U-011,U-017..U-020 | AP-11,AP-12 | T1 | Complete state galleries and goldens through a fixture-only router. |
| AP-14 Domain ports/application primitives | D-001..D-008,B-001 | AP-10 | T1 | Immutable dependency-free ports/results/commands/cancellation/freshness with exhaustive fakes. |
| AP-15 Process/path/tool/actor infrastructure | C-001..C-004,C-007,C-009,C-016..C-018 | AP-09,AP-14,HG-02 | T2 | Bounded argv/path/redaction/Doctor/actor/git/Codex checks without global account switching or secret retention. |
| AP-16 Persistence/audit/CAS/recovery | C-005,C-006,C-010..C-014 | AP-15 | T2 | Isolated SQLite/cache/config/drafts/audit/backup/CAS pass migration, corruption, and conflict tests. |
| AP-17 Admission/source adapters | C-008,C-020,A-001..A-003,A-011..A-016 | AP-06,AP-15 | T2 | Manifest-bound substrate/read-only GitHub/git/managed-tree adapters implement ports without reference imports. |
| AP-18 Evidence projections/snapshots | A-004..A-010 | AP-09,AP-16,AP-17 | T2 | Trust-first parsing, pure projections, fair acquisition/rate budgets, atomic generation truth and freshness. |
| AP-19 Workflow/Council production orchestration | L-001,L-002,L-004 | AP-09,HG-02 | T2 | Bounded app-owned Workflow/Council/review evidence executes only through substrate/public devloop. |
| AP-20 Managed implementation-to-PR runtime | L-003,L-012..L-015 | AP-09,HG-02 | T2 | Receipted worktree/Codex/commit/push/PR module; T2 proves local/default-deny paths only. |
| AP-21 Review/gate/terminal/loop graph | L-011,L-016,L-017,L-019 | AP-19,AP-20 | T2 | Exhaustive exact-head/CI/terminal graph; merge only if admitted, otherwise explicit hold. |
| AP-22 Host/config/lifecycle/recovery | A-017,A-018,C-019,C-021,C-022,L-005..L-010,L-020 | AP-08,AP-16,AP-17,AP-21 | T2 | Direct/runtime receipts, outer launcher, immutable snapshot, effect guard, replay, cleanup and headless integration. |
| AP-23 Application use cases | B-002..B-009 | AP-14 | T1 | All product behavior passes exhaustive port-fake tests without infrastructure imports. |
| AP-24 System product UI | P-001,P-002,P-010,P-013 | AP-13,AP-23 | T1 | Setup/Doctor/Runtime/Settings ViewModels and accessible views through application use cases only. |
| AP-25 Workflow/Council product UI | P-003..P-006,P-014 | AP-13,AP-23 | T1 | Exact frozen contract fields/states; no invented prompt/model/score controls. |
| AP-26 Work/Overview product UI | P-007..P-009,P-011 | AP-13,AP-23..AP-25 | T1 | Qualified, fresh, consistent list/board/detail/overview with no inferred KPI. |
| AP-27 Guarded writes/audit/diagnostics | W-001..W-005,F-003 | AP-22,AP-23 | T2 | Explicit guard/confirmation, no ambiguity retry, no body/secret retention, complete redacted audit; remote paths stay closed at T2. |
| AP-28 Fleet/recovery/data hardening | F-001,F-002,F-004,F-005,E-006,E-007 | AP-16,AP-18,AP-22,AP-24,AP-26,AP-27 | T2 | Multi-connection isolation, recovery UI, source/data hostile drills, and resource/privacy budgets. Mandatory for full-product and unrescoped full-app claims. |
| AP-29 Production composition/full CI | P-012,I-001..I-003 | AP-18,AP-22,AP-24..AP-28 | T2 | One real composition/router for every admitted port; deterministic core, adapter/runtime, product/write/fleet/security/performance CI. |
| AP-30 Deterministic DRY vertical slice | E-001,E-002 | AP-29 | T2 | Complete fixture and DRY flow with zero remote mutation. |
| AP-31 Core adversarial drills | E-004,E-005,E-008 | AP-27,AP-28,AP-29 | T2 | Lifecycle, auth/effects, accessibility/responsive/performance cases pass without a live target. |
| AP-32 Controlled-live matrix | E-003 | AP-27,AP-30,AP-31,HG-03 | T3 | Only the receipt's exact sandbox targets/effects; ambiguity holds; receipts/provenance complete. |
| AP-33 System dossier/advice/audit | E-009..E-012 | AP-32,HG-04 | T4 | Claim-scoped dossier, Fable disposition, fresh Opus system audit, mechanical system acceptance. |
| AP-34 macOS package/release audit | X-001..X-009 | AP-33 | T4 | Clean build, signing/notarization when distributed, SBOM/docs/scans/advice/audit; HG-05 alone permits submission. |

## Human milestone gates

Gate decisions are append-only receipts using
[`human-gate-template.v1.json`](../docs/spec/evidence/governance/human-gate-template.v1.json).
Pending or returned gates leave the previous tier as the hard ceiling. Work
below that ceiling continues automatically.

### HG-01 — Authorize fixture UI (T1)

Trigger: AP-01, AP-02, and AP-03 are candidate-integrated and the already-open
v1 R-041 and R-051 artifacts have exact accepted commits and review receipts.
The dossier shows the exact two-dependency/import result, executable Workflow/
Council contract report, portable hostile corpus, authority/effect map, those
two dependency artifacts, current candidate, Fable advice, and all gaps. The
allowed decisions are `APPROVE_T1_FIXTURE_UI`, `RETURN`, and `RESCOPE`.

Approval unlocks fixture/fake-backed UI and pure layers only. It does not
authorize a process, filesystem/database/network adapter, credential, runtime,
Codex worker, or external effect.

### HG-02 — Authorize contained local DRY runtime (T2)

Trigger: AP-09 completes Step 0 with the full no-write host, dependency,
containment, lifetime, and effect evidence plus Fable disposition and fresh
Opus readiness audit. The allowed decisions are `APPROVE_T2_LOCAL_DRY`,
`RETURN`, and `RESCOPE`.

Approval unlocks contained local infrastructure, production adapters, the thin
runtime, read-only sources, local managed-root effects, and a full DRY slice.
Every remote write, merge, release, and submission stays closed.

### HG-03 — Authorize one controlled LIVE canary (T3)

Trigger: AP-27, AP-30, and AP-31 are integrated; the app performs the complete
DRY path with zero unexpected remote mutation; the dossier names the exact
candidate, host, repository, actors, issue, target branch/prefix, effect list,
run count, expiry, ambiguity policy, and recovery procedure. The allowed
decisions are `APPROVE_T3_CONTROLLED_LIVE`, `RETURN`, and `RESCOPE`.

Approval is single-use by default and is consumed at start even if the outcome
is ambiguous. Anything not named remains forbidden. Merge is hold-only unless
a separately admitted public exact-head capability and the receipt both permit
it.

### HG-04 — Authorize release candidate (T4)

Trigger: AP-32's one-canary receipts reconcile with no unexpected effect. The
human sees live evidence links, replay/idempotency, ambiguity/no-retry,
secret/body scans, cleanup receipts, and the exact submission scope. Decisions:
`APPROVE_T4_RELEASE_CANDIDATE`, `RETURN`, or `RESCOPE`.

Approval unlocks the system dossier/audit and package/sign/notarize/demo work.
It does not authorize a public tag, upload, or Hackathon submission.

### HG-05 — Authorize exact Hackathon submission (T5)

Trigger: AP-34 binds the exact Git commit, artifact SHA-256, clean-profile run,
demo assets, two-dependency result, Workflow/Council digests, test/audit links,
reference-import/copy scan, SBOM/notices, supported-platform statement, known
limitations, and claim-to-evidence table. Decisions:
`APPROVE_T5_SUBMISSION`, `RETURN`, or `RESCOPE`.

Approval permits only the exact artifact and claims in the receipt. Changed
bytes or copy require a new dossier and human decision.

## Parallel execution policy

At every frontier the PM dispatches every dependency-ready package whose exact
paths are disjoint and whose effects fit the current tier. A serialized seam
owner blocks only consumers of that seam, not unrelated UI, tests, or adapters.

High-value parallelism after HG-01:

```text
AP-10 → {AP-11, AP-12, AP-14}
{AP-11, AP-12} → AP-13
AP-14 → AP-23
{AP-13, AP-23} → {AP-24, AP-25} → AP-26
```

High-value parallelism after HG-02:

```text
AP-15 → {AP-16, AP-17}
AP-09/HG-02 → {AP-19, AP-20}
{AP-16, AP-17, AP-19, AP-20} feed AP-18/AP-21/AP-22
AP-28 joins the fleet/recovery and source/data frontier, then AP-29 integrates
the complete product/write/fleet CI before AP-30 and AP-31 acceptance drills
```

No arbitrary concurrency number overrides provider capacity or collision
safety. The PM keeps the ready frontier saturated and exposes a package as
blocked only when its dependency, path, provider route, human tier, or external
state actually blocks it.

## Test and review economy

- Ordinary packages run focused and package suites once at the exact reviewed
  commit and again only after a material correction or integration-sensitive
  rebase.
- Full aggregate suites run at AP-09, AP-28, AP-29, AP-33, and AP-34—not three
  times per requirement row.
- Unchanged accepted v1 artifacts are verified by identity/digest and sampled
  evidence; they are not reimplemented or needlessly replayed.
- Opus reviews the exact package commit and mapped evidence. Fable does not sit
  in the ordinary package loop.
- Candidate integration uses a disposable staged merge first. A red merge
  never makes the shared candidate branch red.

## Mechanical integration and rollback

`execution-contract.v2.json` defines the closed package state machine and all
17 integration checks. In summary, integration requires exact Sol identity and
trailers, fresh non-author Opus approval of the exact commit, mapped passing
criteria/tests, allowed/collision-free paths, satisfied dependencies, two-
dependency/reference-only/Workflow/Council invariants, tier authorization,
staged-merge success, candidate smoke checks, and clean worktrees.

Each package is rollbackable by reverting its single candidate integration
commit before a milestone. A shared-seam regression invalidates all dependent
candidate receipts and returns the seam package to its original Sol owner.
The PM never repairs implementation while integrating.

## Plan mutation protocol

An implementation discovery that changes a serialized contract, dependency,
authority, containment boundary, live effect, package ownership, or human tier
sets the affected package to `BLOCKED`. The PM records a minimal append-only
mutation, validates full requirement coverage/DAG/path ownership, obtains Fable
advice and fresh independent Opus review, and activates it only with the
applicable human decision. Unaffected packages continue below the current tier.
If the mutation or a milestone dossier touches an active package's exclusive
path, that package is first suspended and its owner/base recorded; the PM may
not race or overwrite a live owner. Resumption requires an explicit rebase or
invalidation receipt after the mutation integrates.

## Verification and activation

HG-00 activates only after all of these are green:

```text
node tool/verify_accelerated_plan.mjs
jq -e . docs/spec/evidence/governance/execution-contract.v2.json
jq -e . docs/spec/evidence/governance/package-state-template.v2.json
jq -e . docs/spec/evidence/governance/human-gate-template.v1.json
jq -e . docs/spec/evidence/governance/accelerated-package-map.v1.json
git diff --check
```

The verifier requires 211 registry identifiers, 35 unique package owners, five
gates, zero missing/duplicate ownership, an acyclic one-root graph, preserved
transitive ownership for every registry dependency, zero conservative path-
scope overlaps, complete full-product membership, the exact dependency/
authority/reference sets, R-059 in AP-02, closed milestone/package/decision
vocabularies, and fail-closed schema negative checks.

Activation also requires:

- closed v1/R1/R2 evidence remains hash-pinned while already-open records retain
  their cutover prefix and append only documented v1 completion evidence;
- fresh Fable plan/architecture advice with every blocking finding dispositioned;
- fresh independent Opus mutation review at the exact candidate commit;
- an R3 cutover receipt binding the reviewed commit and the user's HG-00
  accelerated-process directive; and
- no product/runtime/external-effect code in the mutation diff.

After activation, the next human interruption is HG-01. Until then the current
tier is T0 and only already-authorized foundation/readiness work continues.

⟦AI:FKST⟧
