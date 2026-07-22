# KANBAN — live board (v2, post-advisory)

> **ARCHIVED SNAPSHOT — not a live status view.** Execute from
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md).

**Updated as work is assigned and completed. The only status view.**
Last update: 2026-07-20 · PM: Opus 4.8 · Impl + review: Sol
v1 rebuilt after Sol's 51-finding decomposition review — see
`08-ADVISORY-LOG.md` round 5.

Status: `TODO` → `ASSIGNED` → `WIP` → `SOL-REVIEW` → `PM-REVIEW` → `DONE`
Blocked: `BLOCKED(<reason>)`

**85 tasks** · W0 8 · W1 14 · W2 40 · W3 15 · W4 8
*(v1 said 62 and miscounted W2 by 8. Corrected.)*

---

## W0 — Executable vertical contract gate 🔒 · **CLOSED 2026-07-20 — 8/8**

*v1 had three "freeze the types" tasks. Sol's decisive finding: **prove the
contract by running it end to end once**, before 40 parallel tasks build on it.
W0 now raises a configured 4-seat proposal through real consensus, gets a typed
result, emits the marker, and round-trips it into Dart.*

| ID | Task | Repo | DoD | Dep | Status |
|---|---|---|---|---|---|
| W0-1 | Package scaffold — `fkst.toml`, dirs, `core.lua`, minimal `M.spec` | packages | `run.sh check` EXIT=0 **and** `run.sh test devbored` 4/4 | — | **DONE** |
| W0-2 | **Event payload contracts** — every inter-department payload: schema, correlation key, stage discriminator, `source_ref`, `dedup_key` | packages | written + fixture per queue | W0-1 | **DONE** |
| W0-3 | **Marker contracts** — state/review/merge/failure markers: schema, author-trust, version ordering | both | Lua emits ⇄ Dart parses, round-trip fixture | W0-2 | **DONE** (Lua side; Dart round-trip in W0-8) |
| W0-4 | Config schema + **CAS/version semantics** — writer increments, reader cadence, conflict, rollback | both | two-writer conflict is defined and tested | — | **DONE** (Lua side; Dart writer types land in W0-8) |
| W0-5 | **Published-seam proof** — minimal composed graph raising `consensus.proposal` + `github-proxy.*` | packages | composed conformance passes with those exact raises | W0-1 | **DONE** (conformance 9/9 + run_graph coverage tests exercise the seams; graph-scan live-rejected an unpublished seam) |
| W0-6 | **VERTICAL SLICE** — raise a 4-seat proposal → real consensus → typed result → marker emitted | packages | four *configured* seats visibly argue; result parsed; marker written | W0-2,3,4,5 | **DONE** — seats teleology/parsimony/security/ops-cost flowed through real consensus; upstream-blocker did not occur |
| W0-7 | Fixture capture from that slice + **field-level source map** | both | every `docs/05` field cites a real source; none "expected derivable" | W0-6 | **DONE** (124 pending rows explicit) |
| W0-8 | Canonical JSON rules + Dart contract types | console | cross-language round-trip byte-identical | W0-7 | **DONE** (21 Dart tests vs sibling corpus) |

> **Nothing below starts until W0-8 is DONE.** W0 is mostly sequential by
> nature — that is the cost of proving the seam instead of assuming it.

---

## W1 — Foundations *(14 — after W0)*

### Flutter *(4)*
| ID | Task | DoD | Dep | Status |
|---|---|---|---|---|
| W1-F1 | Theme + **UI component API** (the interface leaf views build against) | one token change repaints all; API frozen | W0-8 | TODO |
| W1-F2 | Status + shared components (`StatusIcon`, `ClaimAvatar`, `CommentCount`, `LabelChip`, `PostureChip`, `ProvenanceFooter`, `PersonaDot`, `VerdictBadge`, `UnknownValue`) | `UnknownValue` is the only path to absent data | W1-F1 | TODO |
| W1-F3 | Six view states scaffolding + **fixture-source injection** | any view adopts all six; fixture mode is a bootstrap flag, not per-view code | W1-F1 | TODO |
| W1-F4 | App shell + nav | navigates from fixtures | W1-F2,F3 | TODO |

### Service *(6)*
| ID | Task | DoD | Dep | Status |
|---|---|---|---|---|
| W1-S1 | Process supervisor core (`Process.start`, deadlines, caps, sanitised env) | typed result; no shell strings | W0-8 | TODO |
| W1-S2 | **Process-tree termination** | no orphans on deadline/cancel/quit/overflow | W1-S1 | TODO |
| W1-S3 | Command context + **adapter result / typed-degradation interface** | partial failure, pagination, rate metadata, generation id all expressible | W0-8 | TODO |
| W1-S4 | Connection **domain** + derivation (pure) | hand-editing storage cannot change trust | W0-8 | TODO |
| W1-S5 | Store persistence (4 classes, migrations, WAL-safe backup) | cold start empty; dropping `cache_*` costs only latency | W1-S4 | TODO |
| W1-S6 | Auth context manager (`GH_CONFIG_DIR` isolation, token stripping) | inherited `GH_TOKEN` cannot leak across contexts | W1-S1 | TODO |

### Lua *(3)*
| ID | Task | DoD | Dep | Status |
|---|---|---|---|---|
| W1-L1 | Config loader (`file.read`+`json.decode`, fail-closed) | corrupt config → DLQ w/ specific error, never silent default | W0-4 | **DONE** (delivered in W0-2/4) |
| W1-L2 | **State + marker module** (shared by every department) | legal transitions enforced; trust checked; tests | W0-3 | **DONE** (markers.lua, W0-3) |
| W1-L3 | Seat-injection + consensus-result helpers (shared) | design vs review results distinguishable | W0-6 | **DONE** (core.lua + department_caps, W0-2/6) |

### Infra *(1)*
| ID | Task | DoD | Dep | Status |
|---|---|---|---|---|
| W1-X1 | Signed skeleton, Finder launch, GUI `PATH` | signed build shells `gh`/`git`/`fkst-framework` from Finder | W1-F4, W1-S1 | TODO |

---

## W2 — Parallel build *(40 — foundation-first per track)*

### Adapters *(5)* — dep W1-S1,S3,S6
| ID | Task | DoD | Status |
|---|---|---|---|
| W2-A1 | **gh transport foundation** (auth, rate metadata, errors, helpers) | one module owns argv + error taxonomy | TODO |
| W2-A2 | gh reads (entities, comments, checks, actor) | budget+reset per call class; caps reported | TODO |
| W2-A3 | gh writes | typed errors incl. rate/auth/conflict | TODO |
| W2-A4 | observe + health adapters | observe parses fixtures; health **verbatim, no parsing** | TODO |
| W2-A5 | git adapter + repo command context | nothing mutates the operator's tree | TODO |

### Projection *(6, pure)* — dep W0-8
| ID | Task | DoD | Status |
|---|---|---|---|
| W2-P1 | **Parser foundation** + trust normalisation | near-miss logins resolve; one parse pipeline | TODO |
| W2-P2 | State resolution + parse status | unknown schema → `unsupportedSchema`, never guessed | TODO |
| W2-P3 | Claim resolution (mode-branched) | label mode never reads assignees | TODO |
| W2-P4 | Voice identity + debate assembly | every field traces to a marker; rename preserves history | TODO |
| W2-P5 | Completeness / partial fetch | capped fetch never presents as complete | TODO |
| W2-P6 | Discovery union | no state-label filter; caps logged | TODO |

### Runtime *(5)* — dep W1-S3,S6
| ID | Task | DoD | Status |
|---|---|---|---|
| W2-R1 | **Scheduler port interface** | consumers build against it before it exists | TODO |
| W2-R2 | Rate coordinator per `{host, auth}` | two conns on one actor share one budget | TODO |
| W2-R3 | Cache generation + TTL | partial failure never mixes generations | TODO |
| W2-R4 | Scheduler implementation (fake clock, fairness) | 1/5/10-conn sims: no starvation | TODO |
| W2-R5 | Notifications | no false notifications from replay/cold start | TODO |

### Flutter views *(13)* — dep W1-F1..F4
| ID | Task | DoD | Status |
|---|---|---|---|
| W2-V1 | **Work-view controller** (filter, group, select — shared) | list + board render from one controller | TODO |
| W2-V2 | List view | all groups incl. empty + terminal | TODO |
| W2-V3 | Board + 4 groupings | one card component; **multi-line only** (ADR-004) | TODO |
| W2-V4 | **Debate components** (shared) | reusable by reader + drill-in | TODO |
| W2-V5 | Drill-in (embeds V4) | every fact shows provenance | TODO |
| W2-V6 | **Council domain + navigation** (shared) | one feature module; leaf views own rendering only | TODO |
| W2-V7 | Council · Personas | ≤4 seats enforced at edit with reason | TODO |
| W2-V8 | Council · Flows | branches cover agree/disagree/exhausted; merge gate has no seat controls | TODO |
| W2-V9 | Council · Scores | undefined renders `—` never `0%` | TODO |
| W2-V10 | Debate reader + speaker filter | multi-select; empty round headers hide | TODO |
| W2-V11 | Runtime panel | queues move; engine down → *unknown* | TODO |
| W2-V12 | Connections / settings UI | resolved actor shown; write toggle default-off | TODO |
| W2-V13 | Doctor UI + log stream | broken path → specific failure + fix hint | TODO |

### Lua departments *(11)* — dep W1-L1,L2,L3
| ID | Task | DoD | Status |
|---|---|---|---|
| W2-L1 | `observe_issue` + seat injection | configured 4 seats appear in the raised proposal | TODO |
| W2-L2 | `consensus_result` | advances or re-narrows within budget | TODO |
| W2-L3 | `implement` — worktree + claim validation | isolated worktree; claim re-verified | TODO |
| W2-L4 | `implement` — codex invoke + heartbeat | healthy long run **not** killed | **DONE** |
| W2-L5 | `implement` — local test, push, failure classification | failure → `impl-failed` w/ WHY | **DONE** (32+10 tests) |
| W2-L6 | **`pr_create`** — open the PR | PR opened w/ head/base correlation + ambiguous-outcome recovery | **DONE** (idempotent by head) |
| W2-L7 | `observe_pr` | PR state derived; review proposal carries review seats | **DONE** |
| W2-L8 | `review_result` | approve → gate; reject → fixing | **DONE** |
| W2-L9 | `merge_gate` | gates evaluated; DRY-RUN visibly holds | **DONE** (ADR-008 machine-only verified) |
| W2-L10 | `liveness_scan` (**conformance-required**) | stalled force-terminates w/ WHY; healthy codex survives | TODO |
| W2-L11 | `dead_letter` + structured facts | `error_class`/`fingerprint`/`source_ref` present | TODO |

*Dynamic labels + dynamic workflow params are **acceptance criteria on every
department above**, not separate tasks (Sol #18), plus one cross-cutting
verification in W3.*

---

## W3 — Integration *(15)*

| ID | Task | Dep | DoD | Status |
|---|---|---|---|---|
| W3-1 | Composition **domain + validator** | W2-L* | selectable packages, root serialisation, static-graph constraints | TODO |
| W3-2 | Composition UI | W3-1 | change alters next start, provable from graph | TODO |
| W3-3 | Host composition (`.fkst/` layout, sibling refs) | W3-1 | `run.sh host … -- check` passes; nothing vendored | TODO |
| W3-4 | **Supervise adapter** (argv, env, pid ownership, runtime pointer) | W1-S1 | launch diagnostics typed | TODO |
| W3-5 | Guarded config materialiser (read, base hash, validate, backup, atomic) | W0-4 | concurrent external edit cannot be silently overwritten | TODO |
| W3-6 | Supervise launch | W3-3,4,5 | starts; queues fill; runtime panel moves | TODO |
| W3-7 | Stop | W3-6 | no console-owned orphan; codex orphan reported as expected | TODO |
| W3-8 | Adopt (external process) | W3-4 | no stop control; posture *unknown* | TODO |
| W3-9 | Crash surfacing + recovery | W3-6 | exit code + last lines; never silent auto-restart | TODO |
| W3-10 | Doctor full report | W2-A*, W1-S4 | misconfig → actionable, not generic | TODO |
| W3-11 | **Entity refresh orchestration** (pagination, comment paging, continuation) | W2-A2,P5 | bounded fetch plan; completeness honest | TODO |
| W3-12 | Intake service (issue + label, partial failure, dedup) | W2-A3 | partial failure reconciles, never duplicates | TODO |
| W3-13 | Identity guard + write pipeline + audit | W2-A3, W1-S6 | bot actor hard-fails, no override | TODO |
| W3-14 | Ambiguous write outcomes | W3-13 | injected timeout reconciles | TODO |
| W3-15 | **Scoring service** (evidence acquisition + derivation) *(v1 had only UI)* | W2-P4 | figures derive from merged outcomes; unsupported → cut, no grader | TODO |

---

## W4 — E2E + release *(8)*

| ID | Task | DoD | Status |
|---|---|---|---|
| W4-1 | **Complete run, DRY-RUN** — `docs/10 §3` steps 1–15 | every transition visible within one poll; merge holds at gate | TODO |
| W4-2 | **Custom roster proof** | debate reader shows exactly the configured 4 seats | TODO |
| W4-3 | LIVE run to integration branch | loop-authored PR merges; console merged nothing | TODO |
| W4-4 | Restart mid-flight | resumes from GitHub; no duplicate PR | TODO |
| W4-5 | Failure drills | each → specific actionable state | TODO |
| W4-6 | App-exit cleanup (owned vs adopted) | no orphan supervise or log stream on quit | TODO |
| W4-7 | Notarised packaging + schema migration | clean install + in-place upgrade verified | TODO |
| W4-8 | Accessibility + 5-connection performance | AA contrast, keyboard-only, cache paint <1s | TODO |

**W4-2 remains the acceptance that matters most.**

---

## Critical path *(corrected — Sol #47/48)*

```
W0 vertical slice ─► Lua shared helpers ─► observe_issue ─► consensus_result
  ─► implement(worktree→codex→push) ─► pr_create ─► observe_pr ─► review_result
  ─► merge_gate ─► Lua integration ─► host composition ─► guarded config write
  ─► supervise launch ─► doctor/live wiring ─► intake write ─► DRY-RUN E2E
  ─► custom-roster proof ─► LIVE E2E ─► restart recovery
```

**Unlimited sessions do not shorten this.** Each Lua stage consumes the previous
stage's *real* artifact, and W4 waits on actual GitHub polling, consensus rounds,
codex execution, CI, and merge gates. **The Lua chain plus real-world latency
sets the finish time — not PM review throughput.** (v1 claimed the opposite;
that was wrong.)

Second near-critical chain: process supervisor → signed Finder smoke →
supervise adapter → stop/adopt/crash → packaged E2E. A late process-ownership
failure invalidates W3-6 through W4-6.

## Parallelism, honestly

- **W2 is genuinely ~34-wide** *after* each track's foundation task lands
  (W2-A1, W2-P1, W2-R1, W2-V1/V4/V6, W1-L1..L3).
- **Three tracks never share files** and can run start-to-finish independently:
  **Flutter UI**, **Dart service**, **Lua package**.
- The Lua track is the critical path and is **mostly sequential** — throwing
  sessions at it does not help. Put your best session there first.

---

## Blocked / escalated

**B-1 — RESOLVED 2026-07-20.** Strays moved (not deleted) to
`FKST/_stray-packages-from-fkst-packages/` with a restore README — they DIFFER
from the marketing-repo copies (newer work; user may want to merge them there).
Baseline `run.sh check` now EXIT=0. Original report:
**`fkst-packages` baseline was RED, independent of our work.** Verified by
running `run.sh check` with our package removed: the failure set is
**byte-identical**. Cause: three untracked package dirs in `packages/` —
`lark-approval`, `social-metrics`, `x-publisher` — which also exist in
`../fkst-packages-marketing/packages/`. They trip `G-PRODUCER-LIVENESS`,
`G-DEAD-LETTER` ×3, and push `G-DEVLOOP-SERVICE-LOCATOR` 52→55.
*Impact:* the DoD "`run.sh test` green" cannot be met by any task until these
are resolved. Conformance was validated directly instead (9/9).
*Needs user decision — they are untracked, so removal is irreversible. Not
touching them.*

## Decisions needed from user

| # | Question | Blocks |
|---|---|---|
| 1 | Sandbox repo name for LIVE run | W4-3 |
| 2 | Repo rename `fkst-devbored` → `devboard`? | do before branches multiply |

---

## Changelog

| When | What |
|---|---|
| 2026-07-20 | v1 board: 62 tasks. |
| 2026-07-20 | **Lua package COMPLETE.** Dynamic labels + workflow params + full-pipeline integration test (single issue→merged, ordered markers, configured design AND review seats) DONE. PM review caught Sol editing 2 shared platform packages beyond the brief → user decided accept-as-separate-commit; behavior-preservation proven (consensus 152/0, github-proxy 278/0 identical to baseline); ADR-030 records the boundary. Two clean commits: platform extension (6f8c4fb9) + devbored (f6ad297c). Next: Flutter/console (W1-F/S, W2-V) + E2E host run. |
| 2026-07-20 | **Lua pipeline COMPLETE** — review_result + merge_gate DONE (PM-verified 34+26, merge_gate confirmed machine-only per ADR-008). All 9 departments real. W2-L10/L11 assigned: dynamic-label + dynamic-param audits + the full-pipeline integration test (single issue → merged, asserting the ordered marker sequence with configured design AND review seats). |
| 2026-07-20 | W2-L6/L7 pr_create+observe_pr DONE (PM-verified 34+13, composed conformance 31/31). Sol hit a NEW gate mid-run — saga-proof-obligations (real saga states now exist) — and resolved it by declaring [conformance] function, no takeover. W2-L8/L9 (review_result + merge_gate) assigned — completes the Lua pipeline. |
| 2026-07-20 | W2-L3/4/5 implement dept DONE (PM-verified 32+10). Sol self-corrected a config-via-fkst.env dead end mid-run → github-devloop precedent; converged 6 red→0 before the 40min ceiling, no takeover needed. W2-L6/L7 (pr_create + observe_pr) assigned. |
| 2026-07-20 | **W0 CLOSED 8/8.** Vertical slice proved the premise (4 configured seats through real consensus, no upstream change). Dart side round-trips the same bytes (21 tests). W1 Lua track (L1-L3) already satisfied by W0 deliverables — marked DONE. W1 opens: Flutter F1-F4, Service S1-S6, X1; critical path continues in W2-L (implement dept next). One infra note: provider disconnect killed W0-6 attempt 1; relaunch clean. |
| 2026-07-20 | **PAUSED by user.** Resume state: W0-1/2/3/4/5 DONE and committed on `fkst-packages` branch `feat/devbored-loop-scaffold` (HEAD = marker-contracts commit). **W0-6 vertical slice was IN FLIGHT** — a detached codex run writing to `~/.gstack/tmp-codex/w06-out.log`, instructed NOT to commit; on resume, read that log's tail for its report, inspect `packages/devbored` working tree, PM-review (run both gates: `run.sh check` + `run.sh test devbored`, or with `BIN=/tmp/fkst-devbored-target/debug/fkst-framework FKST_NO_AUTOBUILD=1 FKST_CACHE_ROOT=/tmp/fkst-devbored-cache` if sandboxed), then commit or bounce. Then W0-7 (mostly captured by slice fixtures) → W0-8 (Dart types, console repo) → W1 opens (14-wide). Loop protocol in `docs/plan/10-EXECUTION.md`; re-arm the 5-min poller on resume. |
| 2026-07-20 | W0-2+W0-4 DONE (Sol impl, PM-verified 19+4 tests, both gates green). Sol decisions adopted: stage-in-proposal_id (consensus results don't echo arbitrary fields); CAS via caller-provided previous_version; brief gaps filled (agreement/budgets/authorPolicy enums) — to be reflected in docs/05 at W0-8. W0-3 assigned. |
| 2026-07-20 | W0-1 + W0-5 DONE, both repo gates green for the first time (`check` EXIT=0, `test devbored` 4/4). B-1 resolved reversibly. Loop lessons: `run_graph_*` filename prefix gates composed graph roots; guard lists live in `check_repo_std_dependency_model.py` (DEVLOOP_FAMILY) + its test fixture; top-level `source_ref` uses `reference`. W0-2 assigned. |
| 2026-07-20 | **v2 after Sol review (51 findings):** W0 replaced by an executable vertical slice; ~20 false parallelisms fixed with foundation tasks; missing tasks added (**PR creation**, scoring service, composition domain, supervise adapter, refresh orchestration, app-exit cleanup, release); count corrected 62 → **85**; critical path corrected to the Lua chain. |

⟦AI:FKST⟧
