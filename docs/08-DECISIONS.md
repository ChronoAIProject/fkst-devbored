# 08 — Decision log

Status: **HISTORICAL ADR LOG** — still binding only where an entry is not
superseded by [`docs/spec/README.md`](spec/README.md). Append; never rewrite.
Date: 2026-07-20

Format: decision · context · consequence. A decision here is binding on all
streams until superseded by a later ADR.

---

**ADR-001 — GitHub is the business-state authority; the console holds no truth.**
The engine owns only its durable delivery ledger; host config is an explicit
file fact; everything the console stores is a disposable projection.
*Consequence:* no design may make the local DB the reason something is true.
Trusted-bot sets are derived per cycle, never stored as editable prefs.

**ADR-002 — Engine reads go through `observe --json` only.**
The live observe socket is transient and engine-owned; `delivery.redb` holds an
exclusive lock while supervise runs.
*Consequence:* no socket path is ever computed; no direct DB read. Offline
fallback is the CLI's job, not ours.

**ADR-003 — The old FKST design language is dropped for this product; keep only
the oklch palette and the K-node mark.** *(user, 2026-07-20)*
The product should read as Linear: Inter, icon status language, quiet chrome.
*Consequence:* `fe-blueprint/DESIGN.md` does not govern here. It still governs
the hosted FE — the exemption is scoped to fkst-devbored.

**ADR-004 — Single-line "pill" cards are rejected.** *(user, 2026-07-20)*
A rounded box with one row of text reads as a tag, not an openable object.
Tried on the stage board, cut.
*Consequence:* every card is multi-line with internal hierarchy (`docs/06` §6).
Standing review check.

**ADR-005 — "Responsibility" is renamed **Council**.** *(user, 2026-07-20)*
These are seats that deliberate, not a permissions matrix.
*Consequence:* the name is used in UI, docs, and contracts. `Persona` is the
type; "seat" is the role a persona plays in a flow step.

**ADR-006 — Council is a configurator, not only a reader.** *(user, 2026-07-20)*
It sets personas per loop and the flows work moves through, and scores personas
over time.
*Consequence:* Personas / Flows / Scores are first-class; the debate reader is
demoted to *evidence behind the scores*.

**ADR-007 — Persona scores derive from merged outcomes, never self-report.**
A model asked to grade itself will not grade honestly; independent seats exist
precisely because self-assessment is unreliable.
*Consequence:* upheld = the merged diff reflects the objection. `upheldRate` is
`null` (not `0`) when a persona never objected.

**ADR-008 — Merge-gate checks are not persona-configurable.**
Head-bound approval, CI, mergeability, and posture are machine facts.
*Consequence:* the merge-gate flow step exposes no seat controls. Expect this
to be re-proposed; refuse it.

**ADR-009 — Labels are hints; discovery never filters by state label.**
`fkst-dev:*` labels drift, and `dependency_wait` deliberately shares
`fkst-dev:ready`.
*Consequence:* discovery unions opt-in surfaces; label/marker disagreement
surfaces as `labelDrift`, not as state.

**ADR-010 — Claims branch on the connection's claim mode.**
Assignees are not the authority in `label` mode.
*Consequence:* `assignee` → assignee lease; `label` → read-only
`fkst-dev:claimed`. Claim age only from timeline events, else *unknown*.

**ADR-011 — TS/Dart marker parsing is a compatibility consumer, not a schema
authority.**
Duplicating the platform's parser risks silent divergence on a schema bump.
*Consequence:* fixtures pinned to a platform commit; unknown schema fails
closed. A platform-owned versioned marker projection is proposed upstream as
the durable fix. Same posture for the `forge` egress doctrine: one argv-only
adapter now, a narrow platform CLI proposed upstream.

**ADR-012 — Target stack: Flutter desktop. FLAGGED FOR RECONFIRMATION.**
Inherited from `SPEC-CONSOLE-V2-FLUTTER` and the skeleton at `FKST/desktop`.
The mocks are HTML, and a web or Tauri target is a live alternative.
*Consequence:* **blocks Stream A, B, and J.** Corrected by advisory round 4:
Stream B is **not** stack-independent (process-tree termination, GUI `PATH`,
child env, and signing are all Dart/macOS concerns). Only Stream C is genuinely
stack-independent. Tracked as task P0A-07.

**ADR-013 — No implementation until contracts freeze.** *(user, 2026-07-20)*
Parallel streams are only possible against a stable seam.
*Consequence:* `docs/05` freeze is a hard gate; see `docs/07` Phase 0.

**ADR-014 — This repo is authoritative for the product; the Build Week plan and
the platform contracts are not duplicated here.**
Two sources of truth is the failure mode the platform's own doctrine warns
about.
*Consequence:* `FKST/PM-PLAN-DEVLOOP-UI.md` remains authoritative for the
time-boxed submission; substrate/packages remain authoritative for engine and
devloop behaviour. This repo cites, never restates as owner.

**ADR-015 — Packaging is a Phase-1 gate, not a release task.**
Notarisation, restricted GUI `PATH`, native SQLite packaging, and filesystem
permissions can invalidate architectural assumptions.
*Consequence:* a signed smoke build that shells `observe`/`health`/`gh`/`git`
is required to exit Gate 1.

**ADR-016 — No engine control surface, ever.**
No supervise lifecycle, no redb mutation, no queue requeue, no per-goal pause,
no setting `FKST_GITHUB_WRITE`.
*Consequence:* these controls are **absent**, not disabled. Re-proposals are
refused by default.

**ADR-017 — Council v1 is read-only; authoring is contingent on an upstream
platform seam.** *(advisory round 4, verified against platform source)*
`packages/consensus/core.lua:9` defines `default_angles` as a hardcoded local,
`core.lua:11` caps `max_angles = 4`, and `libraries/devloop/config.lua` exposes
no angle/seat/persona/roster key. The only seam is `proposal.angles`, set
per-proposal by the raising package — not writable by a console.
*Consequence:* Council-as-configurator would write configuration nothing reads.
Council v1 observes the seats that actually ran. Authoring ships only if
P0A-01 lands a host-owned config loader. `docs/01` R4.1/R4.2 are amended
accordingly at G0.

**ADR-018 — Contracts do not freeze until every field is proven derivable.**
*(advisory round 4, finding 44)*
Freezing against unproven interfaces would formalise invented seams and let
several streams build "conformant" but incompatible things.
*Consequence:* G0 is the field-by-field derivability matrix (P0A-06), backed by
raw captures from a real deployment. Supersedes the freeze timing implied by
ADR-013 — the gate itself stands.

**ADR-019 — No LLM grader may be introduced to make a metric derivable.**
*(advisory round 4, finding 32)*
"Objection upheld" requires semantic judgment unless markers link an objection
to a disposition. The seats exist because self-assessment is unreliable;
grading them with another ungrounded model reintroduces the exact failure.
*Consequence:* if P0A-03 finds no structured evidence, `objectionsUpheld`,
`upheldRate`, and `trend` are **cut from v1**. Standing prohibition.

**ADR-020 — Lifecycle state comes from markers; ordinary metadata comes from
GitHub with separate provenance.** *(advisory round 4, finding 34)*
R5.3 as written was overbroad — titles, comment counts, labels, CI, and links
are GitHub facts, not trusted-marker facts.
*Consequence:* `docs/01` R5.3 amended; every `Entity` field cites which source
it came from.

**ADR-021 — Opus 4.8 is PM; codex GPT-5.6-Sol is standing tech advisor.**
*(user, 2026-07-20)*
*Consequence:* every phase gets an advisory review before it starts and every
gate before it closes. Findings are logged in `docs/plan/08-ADVISORY-LOG.md`
with a disposition; a finding closes by evidence, by an ADR, or by doing the
work — never by disagreement alone.

**ADR-022 — The console is the local host that runs the loop. Supersedes
ADR-016's lifecycle prohibition.** *(user, 2026-07-20)*
The product must be able to perform a complete local run, not only observe one.
*Consequence:* the console composes the platform, launches/stops/restarts
`supervise`, and owns per-connection durable + runtime roots. **The authority
invariant is unchanged** — the loop still writes truth to GitHub; the console
gains a lifecycle role, not an authority role. ADR-016 remains in force for
everything else: no redb mutation, no queue requeue, no marker writes, no
merge/approve. Owning the process does not mean voting.

**ADR-023 — `substrate` and `packages` are referenced by path, never cloned or
vendored.** *(user, 2026-07-20)*
*Consequence:* the console is a host repo referencing sibling checkouts;
`BIN` points at `../substrate/target/debug/fkst-framework` and
`--platform-root` at `../packages`. The console **never writes** into either.
Launch goes through the platform's own `run.sh supervise` host entrypoint so
BIN resolution and package-root assembly stay owned upstream.

**ADR-024 — ~~Council authoring unblocked via host-owned package~~ — WRONG,
superseded by ADR-026.** *(verified in platform source, 2026-07-20)*
`consensus/core.lua:251` `normalized_angles(proposal)` reads `proposal.angles`
and only falls back to `default_angles` when absent — so a host-owned package
under `.fkst/local-packages/` can seat a custom roster with **no upstream
change**. Platform internals stay untouched, honouring the customization
contract.
*Consequence:* Council authoring ships. **Constraint:** `core.lua:11` sets
`max_angles = 4` and `normalized_angles` returns nil above it, while the
built-in default list has five entries — so custom rosters are limited to
**4 seats**. The editor enforces this with the reason shown; runtime failure is
not an acceptable way to discover it. Raising the cap is an optional upstream
proposal (PE-N-04), not a blocker.

**ADR-025 — No decorative UI; every surface is load-bearing and demonstrably
working.** *(user, 2026-07-20)*
*Consequence:* every surface must serve a numbered step of the complete run
(`docs/10 §3`), render from a real source with provenance, and be driven by a
live loop before release. A surface that cannot be demonstrated is **cut, not
shipped disabled**. Verified by `P5-X-05` against `docs/11`.

**ADR-026 — ~~Council authoring needs a ~10-line upstream change~~ — no longer
needed, superseded by ADR-027. Its analysis of why a *host* package cannot work
remains correct.** *(verified 2026-07-20)*
ADR-024 was based on an incomplete check: `consensus/core.lua:251`
`normalized_angles` does read `proposal.angles` — and the comment at line 258
(*"angle is untrusted (event-overridable)"*) shows the seam is **deliberate**.
But the check stopped there. The proposal is built by
`libraries/devloop/payloads/builders.lua:390` `C.build_proposal(issue)`, which
returns a fixed table and **never sets `angles`**, and it is raised by
`github-devloop` departments (`observe_issue:292`, `execute_start:68`,
`loop:194`). A host-owned package is not in that path, so it cannot inject
angles without replacing the issue-side lifecycle (~9,430 lines).
*Consequence:* three options, recorded in `docs/10 §4`. Recommended: a small
upstream change to `build_proposal` reading a config key — roughly ten lines
plus a `config.lua` allowlist entry. Council authoring is **not** available
without it; Council read-only is unaffected and ships regardless.

**ADR-027 — We write our own `devbored-loop` package; the upstream patch in
ADR-026 becomes unnecessary.** *(user, 2026-07-20)*
Composing `github-devloop` gives no control over seats, labels, or flow shape —
all hardcoded. Our own orchestration package reusing the platform **kernel**
(`libraries/devloop`, 75 modules, declared by `archaudit` and
`fkst-substrate-ref-maintainer` already) costs ~1,000 lines instead of ~4,000,
and injects seats directly:
`local p = builders.build_proposal(issue); p.angles = cfg.seats; raise(...)`.
`is_valid_proposal` accepts it (`core.lua:316`).
*Consequence:* ADR-026's ~10-line upstream change is **no longer required**.
The 4-seat cap (`core.lua:11`) still applies.

**ADR-028 — `devbored-loop` lives in `fkst-packages`, not in the console.**
*(verified constraint, 2026-07-20)*
`CLAUDE.md` forbids host repos cross-requiring library-B libraries — a package
under `fkst-devbored/.fkst/local-packages/` cannot `lib_deps` the devloop
kernel and would have to reimplement markers, claims, gates, and convergence.
*Consequence:* the package is a **contribution to your own repo**, gaining its
CI, conformance, and saga guards. ADR-023 is intact: `fkst-devbored` still
references and never vendors — it composes `devbored-loop` by name.

**ADR-029 — Workflow parameters are dynamic; workflow topology is static.**
*(engine constraint, 2026-07-20)*
The engine graph-scans `M.spec` at load and validates the composed graph before
anything runs, so queues, departments, and the set of possible states cannot be
dynamic. Labels, seats, agreement rules, budgets, intake criteria, model/effort,
and stage enablement **can** be.
*Consequence:* declare the **superset** of states statically; config enables,
disables, and re-parameterises paths within it. Config is read via
`file.read` + `json.decode` on **every pipeline invocation**, so parameter edits
apply on the next run with no restart; composition edits need a restart. The UI
must distinguish the two. Config **fails closed** on unreadable, malformed, or
unknown-schema input — a silent fallback to defaults would make the console lie
about what the loop is doing.

**ADR-030 — devbored may additively extend shared platform packages
(consensus, github-proxy), reviewed per-change.** *(user, 2026-07-20)*
Making agreement-rules and intake-filtering config-driven required optional new
fields in `consensus` and `github-proxy`, beyond the devbored-only boundary.
*Consequence:* such extensions are allowed when (a) purely additive / gated on
new optional fields, (b) behavior-preserving for existing consumers — proven by
the extended package's own suite passing identical to clean baseline, and (c)
landed as their OWN reviewed commit separate from devbored, with the
preservation evidence in the message. This narrows ADR-023/028: the console
still never edits platform packages, but devbored (which lives in fkst-packages)
may contribute additive platform capability under this bar. github-devloop and
other consumers must be unaffected — verified, not assumed.

**ADR-031 — The only primary dependencies are substrate and public devloop;
Workflow/Council live in a thin app-integrated package. Supersedes ADR-023's
packages-platform/runner conclusion (while retaining read-only pinned paths),
ADR-027, ADR-028, ADR-029's ownership conclusion, and ADR-030 for the full app.**
*(user, 2026-07-20)*
The full product must not make the whole `fkst-packages`/`devbored` composition
its second product dependency. The current `devbored`, workflow, consensus,
GitHub-proxy, and github-devloop packages are behavioral guides and fixture
sources only. A thin FKST package owned by this app consumes public `devloop`
APIs and adapts app-owned Workflow and Council contracts to substrate.
*Consequence:* no production coding proceeds until the app package identity is
permitted by the devloop integration boundary, its minimal graph loads under
substrate, Workflow/Council schemas and emitted evidence are frozen, and a
machine check proves reference packages are absent from the shipped graph.
Copying/reimplementing devloop internals is forbidden. Static-topology limits
remain facts to verify against substrate, but the old `devbored.config.v1` and
package topology no longer define the app.

**ADR-032 — GPT-5.6 Sol is the main PM and implementation-agent class; Fable
advises; Opus independently reviews every engineering piece. Supersedes
ADR-021 for `full-app/v2`.** *(user, 2026-07-20)*
The main PM owns specification compliance, task admission, integration, and
final acceptance. Each small engineering task is assigned to a separate
GPT-5.6 Sol implementation agent that implements and self-verifies it. A
different Opus agent reviews the resulting commit/evidence against the frozen
task brief and authoritative specs. Fable is the standing technical advisor
for architecture, dependency boundaries, task-graph changes, and wave gates.
*Consequence:* an implementation never self-approves. Opus `changes requested`
or PM rejection returns the task to its implementation agent until the same
acceptance criteria pass. Parallel branches/worktrees are maximized only when
their file/contract ownership does not overlap. Provider/model identities must
be proven before dispatch; an unavailable named route blocks execution rather
than silently substituting another model. No engineering agent starts while
the applicable readiness/contract gate is red.
The exact provider/model IDs are frozen by the G-007 execution-governance
record. Route unavailability, drift, or mismatched session metadata invalidates
the affected governance status and pauses dispatch until the named smoke is
rerun. Every initial and post-rework independent review uses a fresh Opus
session; it may read prior findings but inherits neither authorship nor
approval.

**ADR-033 — Full-app v2 uses immutable launch config, two explicit evidence
channels, strict Flutter layers, and public-only merge. Supersedes ADR-029's
hot-parameter-edit conclusion for this app.** *(workability audit, 2026-07-21)*
The first v2 pass left a compatibility manifest undefined, did not name a
config-acceptance transport, had no managed-clone provisioning task, and could
have allowed desired files to change beneath a running loop. It also described
automatic merge although the audited public devloop exports contain PR create/
comment and Git seams but no public exact-head merge effect; the observed merge
executor is in the prohibited reference `github-devloop-pr` package.
*Consequence:* desired Workflow/Council files are copied into an immutable
per-launch snapshot only while stopped. A direct no-effect substrate `run`
probe emits a bounded acceptance receipt; Start binds the same snapshot,
connection revision, package, and graph. Durable work evidence is a bounded
app-owned envelope in a qualified trusted GitHub issue/PR comment, never local
runtime/delivery state or a `github-proxy.*` request queue. Automatic merge
requires a separately reviewed public devloop exact-reviewed-head recheck/
merge/reconcile/receipt capability; until then the only admissible terminal is
an explicit operator hold. The dedicated managed clone never adopts or
destructively repairs a user checkout. Flutter enforces Views → ViewModels →
application use cases → domain ports, with infrastructure adapters wired only
at one composition root. Council v1 decisions are mechanical over bounded
structured seat verdicts rather than semantic scores.

**ADR-034 — New delivery uses cohesive packages, mechanical integration, and
five human authorization tiers. Supersedes ADR-032's per-engineering-piece PM
acceptance and ordinary-package Fable stations for work dispatched after the
R3 cutover; ADR-032 remains authoritative append-only history for already-open
v1 records and immutable history for closed records.** *(user, 2026-07-21)*

The 211-node plan was a valuable completeness proof but made each small
requirement pay a separate PM/reviewer orchestration cost. That process spent
more time proving process than moving an executable critical path. The user
directed the GPT-5.6 Sol main PM to replan for fastest safe completion, trim the
PM loop, preserve independent Opus review, use Fable as a technical advisor,
maximize parallel work, and stop for human decisions at meaningful milestones.

*Consequence:* all 211 identifiers remain the authoritative traceability and
acceptance vocabulary, but exactly one of 35 cohesive packages owns each one.
Each new package has one fresh GPT-5.6 Sol owner, focused/package tests, one
fresh independent Opus review of the exact commit, same-owner rework, and a
closed mechanical staged-integration gate. A material correction always gets a
fresh Opus session. The main PM schedules, protects boundaries, runs the
mechanical gate, integrates candidate work, and assembles milestone dossiers;
the PM does not perform a second full package acceptance review and cannot
waive a red check. Fable advises only on architecture, dependency/authority or
plan mutations, live-effect boundaries, milestone reconciliation, and release.

Human authorization is tiered and fail-closed:

1. HG-01 grants only T1 fixture/fake-backed Flutter and pure layers after the
   app-owned contract and dependency/authority foundation is executable.
2. HG-02 grants T2 contained local/DRY runtime only after the complete Step-0
   readiness proof, R-039, Fable disposition, and fresh Opus audit.
3. HG-03 grants T3 only for an exact, count/expiry-bound controlled LIVE target
   and effect envelope after a zero-remote-mutation DRY slice.
4. HG-04 grants T4 release-candidate packaging/audit work after reconciled LIVE
   evidence; it does not permit public submission.
5. HG-05 grants T5 only for the exact artifact and Hackathon claims bound in
   the human receipt.

While a gate is pending or returned, the previous tier remains the hard
ceiling and lower-tier parallel work continues. Human approval cannot waive a
test failure, dependency/reference-only violation, reviewer authorship,
containment failure, missing receipt, or unsafe effect. Silence and ambiguity
are not approval. Exactly two primary dependencies (`fkst-substrate`, public
`devloop`), app-owned Workflow/Council authority, reference-only packages, and
the prohibition on app-local devloop reimplementation are unchanged.

The append-only v2 execution contract, package map, human-gate schema, and
accelerated plan are the executable interpretation. Historical v1 contracts,
R1/R2 dispatches, reviews, task states, and integrations are never rewritten.

---

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | Target stack — **resolved as Flutter desktop by `full-app/v2`**; Build Week web cut remains separate | — | closed |
| Q2 | Repo name — `fkst-devbored` as typed, or `fkst-devboard` | repo rename | user |
| Q3 | Remote — stays local-only, or pushed to ChronoAIProject | publishing | user |
| Q4 | `DebateHeat.contested` threshold — removed from v2; no evidence-backed metric contract | — | closed/gated |
| Q7 | Public-devloop/app-owned Council execution seam and exact roster/policy bounds — reopened by ADR-031; reference consensus and its 4-seat cap are not authority | Step 0 / RDY-05, RDY-07 | dependency + app contract owner |
| Q8 | Is objection-disposition structured evidence available? (P0A-03) | scoring scope | Stream C |
| Q5 | Debate heat ordering — removed with the unsupported heat metric | — | closed/gated |
| Q6 | Exact integrated-package posture/effect evidence | Step 0 / RDY-05 | app contract owner |

⟦AI:FKST⟧
