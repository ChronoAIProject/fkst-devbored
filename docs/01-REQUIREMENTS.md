# 01 — Requirements

Status: **LEGACY SOURCE** — superseded by
[`docs/spec/03-REQUIREMENTS.md`](spec/03-REQUIREMENTS.md).
Date: 2026-07-20

Each requirement has an ID, a statement, a rationale where it is not obvious,
and **acceptance criteria** phrased so a stream can self-check without asking.
`MUST` / `SHOULD` / `MUST NOT` are binding.

---

## R1 — Shell and platform

**R1.1** The console MUST be a single local desktop application with **no
network listener** of any kind.
*Rationale: removes the entire CSRF / DNS-rebinding / token-handling surface a
localhost server would create.*
**Accept:** no socket is bound at any point in the process lifetime.

**R1.2** All external commands MUST run through one **process supervisor** with:
absolute executable resolution (GUI apps inherit a restricted `PATH`), argv
arrays only (never shell strings), output size limits, deadlines with tracked
child termination, bounded stderr capture, and a sanitised child environment
that sets `GH_PROMPT_DISABLED=1` and `GIT_TERMINAL_PROMPT=0`.
**Accept:** a killed/hung child is reaped within its deadline; no orphan
processes remain after app exit; no command is ever built by string
concatenation.

**R1.3** GitHub and git access MUST be confined to a single adapter module
mirroring the platform's `forge` argv doctrine.
*Note: the console sits outside Lua conformance, so this is a documented
interpretation, not claimed conformance. A narrow platform-owned CLI is the
preferred end-state and is proposed upstream (see `docs/08` ADR-011).*
**Accept:** grep finds no `gh`/`git` invocation outside the adapter.

**R1.4** Target platforms: macOS primary (signed, notarised, **not** App Store
sandboxed), Linux best-effort. Windows and mobile are out of scope.
**Accept:** a signed build launches from Finder and successfully runs
`observe`, `health`, `gh`, and `git` against user-selected paths.

**R1.5** The design language in `docs/06` MUST be implemented as a theme, not
per-widget styling.
**Accept:** changing one token changes every surface.

---

## R2 — Local database

**R2.1** Storage MUST be a single embedded relational DB on a dedicated
DB isolate, with data separated into **four classes** that are mechanically
distinguishable:

| Class | Contents | Loss semantics |
|---|---|---|
| `cache_*` | marker projections, observe snapshots, gh list results | **Disposable** — TTL'd, generation-keyed, safe to delete |
| `prefs` | UI state, view preferences, column order | **Reconstructable** |
| `staged_*` | unapplied Council/profile drafts | **Best-effort** — user is warned before discard |
| `audit_log` | every write and every profile materialisation | **Durable** — never silently deleted |

**Accept:** the app cold-starts correctly against an empty DB; deleting every
`cache_*` table changes nothing but latency; deleting `audit_log` requires an
explicit destructive action.

**R2.2** Caches MUST store only normalised fields and identifiers. Raw comment
bodies, log tails, and command stderr MUST NOT be persisted.
*Rationale: those can carry credentials or sensitive content even when the
console never intentionally stores a secret.*
**Accept:** a schema review shows no free-text body column; a secret-pattern
scan over a populated DB returns clean.

**R2.3** No credentials are intentionally persisted. Tokens come from the
`gh` auth context / OS keychain; the DB stores presence flags and a non-secret
auth-context identifier only. `FKST_GITHUB_WRITE` is displayed, never stored,
never written.
**Accept:** no column can hold a token; DB file permissions are owner-only.

**R2.4** Migrations MUST be versioned, with automatic pre-migration backup and
an export/restore path. Corruption MUST NOT be resolved by silent deletion.
**Accept:** a forced-corrupt DB produces a recoverable error state with the
backup offered, not a wipe.

---

## R3 — Connections (multi-repo)

**R3.1** The console MUST support N **connection profiles**. A profile holds:
stable UUID, display name, GitHub hostname, primary repo, host/project root,
target checkout root, platform root, workspace/lock provenance, effective
profile path, durable root, current-runtime pointer, `BIN` path, tool paths,
auth-context ID.
Managed sibling repos, trusted bot logins, branches, and posture are
**derived from authoritative files on read — never stored as editable
preferences.**
*Rationale: if a locally editable list decided which comment authors are
trusted, SQLite would be deciding what is true. Trust derives from the
effective profile on every projection; an unverifiable trust source fails
closed to "untrusted".*
**Accept:** editing the DB by hand cannot change which markers are trusted.

**R3.2** A **fleet overview** MUST show per-connection health verdict, counts
by state, DLQ count, posture, last-success and last-error, and partial-failure
status.
**Accept:** one unreachable connection does not blank or block the others.

**R3.3** Polling MUST use **one global scheduler** with bounded concurrency and
per-connection fairness — not one isolate per connection.
**Accept:** N connections do not produce N independent poll storms; total
concurrent subprocesses stay under the configured cap.

**R3.4** GitHub rate budgeting MUST be coordinated **globally per
`{hostname, auth context}`**, with deduplicated repo queries, header-driven
reset-aware backoff, and one auth probe per budget window.
*Rationale: five connections sharing one token share one real GitHub budget.
Per-connection budgets are a UI quota only, not a model of the limit.*
**Accept:** simulated 5-connection load respects a single budget and backs off
on the reset header, not on a fixed timer.

**R3.5** Entity identity MUST be globally qualified as
`{connectionId, githubHost, repo, entityKind, number}`; deliveries by their
substrate identifiers. Every card, row, and notification MUST be visibly
repo-qualified.
*Rationale: `#42` exists in every repo.*
**Accept:** two same-numbered issues in different repos never collide in cache,
state keys, audit, or notifications.

**R3.6** A **connection doctor** MUST validate a connection before its board is
trusted: canonical paths, duplicate durable-root detection, binary version,
workspace/lock vs platform HEAD, observe schema version, marker-schema support,
health command, gh actor and scopes, repo access, write allowlist, profile
provenance.
**Accept:** a board whose doctor has not passed is visibly marked unverified.

**R3.7** Fleet controls: pause/resume per connection, manual refresh,
search/filter, pagination, cache purge, redacted diagnostics export, and a
version-compatibility matrix.

---

## R4 — Council

Council is the console's configuration surface for **who deliberates, how, and
how well**. It has three parts.

### R4.1 Personas

**R4.1.1** A persona is a **lens**: a name, a colour identity, a brief
(the prompt paragraph it argues from), a model + reasoning effort, the steps it
is seated at, and flags (`veto`, `non-voting`).
**Accept:** a persona is fully described by data; no persona behaviour is
hard-coded in the UI.

**R4.1.2** Personas MUST be groupable into named **rosters**, and a roster
assigned per connection. Toggling a persona off unseats it from every flow
referencing that roster.

**R4.1.3** Retired personas MUST remain in a **library** with their history
intact, available to re-seat or to compare in Scores.
*Rationale: knowing a retired lens outperformed its replacement is only
possible if the record survives retirement.*

**R4.1.4** Editing personas MUST write only to this deployment's roster, never
to platform package internals. Changes apply at the next supervise start and
the UI MUST say so; debates in flight are unaffected.

### R4.2 Flows

**R4.2.1** A flow defines **what happens to a piece of work**: an ordered set
of steps, each with seated personas, an agreement rule, budgets, and explicit
branches for agree / disagree / exhausted.
**Accept:** every step states where work goes in all three cases; no step has
an undefined outcome.

**R4.2.2** Multiple flows MUST be definable and routed by label or risk tier,
with a `Default` flow for unrouted work.

**R4.2.3** Agreement rules MUST support: unanimity, threshold, **veto seats**,
converge-round budget, and a stall detector.

**R4.2.4** **Merge-gate checks MUST NOT be persona-configurable.** Head-bound
approval, CI status, mergeability, and write posture are machine facts.
*Rationale: no lens may vote CI green.*
**Accept:** the merge-gate step exposes no seat controls.

**R4.2.5** Flows are **routing rules the loop executes autonomously** — the
console defines shape, it does not drive execution step by step.

### R4.3 Scores

**R4.3.1** Per persona, over a selectable window: times spoke, times objected,
**objection upheld rate**, times changed position, **caught alone** count, and
trend.
**Accept:** every figure is derivable from public markers and merged diffs.

**R4.3.2** Scores MUST be derived from **merged outcomes**, never
self-reported. An objection is *upheld* when the final merged diff reflects it,
*overruled* when it merged unchanged; *caught alone* means no other seat raised
it that round.
*Rationale: self-graded confidence is worthless — the whole reason the system
uses independent seats is that a model asked to grade itself will not.*

**R4.3.3** Retired personas MUST appear alongside seated ones for comparison.

**R4.3.4** Scores MUST make the "is this seat earning its place" question
answerable at a glance: a lens that never objects, or objects and is always
overruled, MUST be visibly distinguishable from one whose objections hold.

### R4.4 Debates (evidence)

**R4.4.1** A debate reader MUST show the deliberation for one entity: messages
grouped by round, each with speaker, verdict, and timestamp.

**R4.4.2** A **speaker filter** MUST let the operator read only what a chosen
voice (or set of voices) said, across all rounds.
*Rationale: this is how you understand a debate rather than skim it.*

**R4.4.3** The reader MUST surface: the meta-judge narrowing the question,
seats that **changed position** between rounds, veto events, human comments
distinguished from persona comments, and the convergence trace.

**R4.4.4** Debates are the **evidence behind Scores** and MUST be reachable
from a persona's score row.

---

## R5 — Work views

**R5.1** Two lanes MUST be available per connection: an **issue** board and a
**PR** board. Column order is a UI presentation order and MUST be documented as
distinct from any source-side array.
*Rationale: the platform's `issue_state_order` mixes issue and PR states and is
not a chronological pipeline.*

**R5.2** The console MUST support grouping by **status**, **stage**,
**connection (swimlanes)**, and **claim**.

**R5.3** Card and row facts MUST come from **trusted bot markers only**.
`fkst-dev:*` labels are hints, rendered as such, with a **drift warning** when
label and marker disagree.

**R5.4** Entity discovery MUST use program-defined opt-in surfaces — the
enabled label ∪ bot-assigned ∪ bot-authored PRs — and MUST NOT filter by
per-state labels.
*Rationale: labels drift, and `dependency_wait` deliberately shares
`fkst-dev:ready` with `ready`; filtering by state label silently drops real
work.*

**R5.5** **Claims** MUST be rendered per the connection's authoritative claim
mode: assignee lease in `assignee` mode, read-only `fkst-dev:claimed` in
`label` mode. Claim age MUST come from assignment/label timeline events and be
omitted when no valid timestamp exists.

**R5.6** Every card and row MUST show a **comment count**, visually escalated
when the thread is contested.
*Rationale: comment volume is the honest signal of how contested a decision
was, and it is the entry point to the debate.*

**R5.7** Drill-in MUST show: marker timeline with versions, consensus digest,
review seat verdicts, converge rounds, dependency blockers, CI rollup, and
links out to GitHub.

**R5.8** Updates: adaptive polling cadence with jitter, visibility-aware
suspension, manual refresh. Notifications MUST fire only from fresh successful
polls, suppress cold-start baseline and fixture mode, and persist a
projection-versioned last-notified identity.

---

## R6 — Human inputs

**R6.1** The console MUST support exactly these writes:
1. Create issue (optionally applying the opt-in label in the same operation).
2. Comment on an issue or PR as a human.
3. Apply/remove the opt-in label; set milestone. *(staged — see R6.5)*
4. Council roster and flow configuration → the deployment's own config file.

**R6.2** **Identity guard.** Writes go through an explicit auth context. The
resolved actor MUST be re-verified before every write session, MUST differ from
every trusted bot login (after `[bot]` suffix normalisation), and MUST be
displayed next to the composer. A bot actor MUST hard-fail the write.

**R6.3** Per-connection write allowlist; global write toggle default-off; every
write appended to `audit_log` with the resulting GitHub URL.

**R6.4** The console MUST NOT: write state markers, write `fkst-dev:<state>`
labels, author comments as the bot, set `FKST_GITHUB_WRITE`, or
merge/approve/close others' work.

**R6.5** R6.1(3) ships only after each mutation is linked to its owning package
contract and tested against active, claimed, terminal, and foreign entities.

---

## R7 — Observability and honesty

**R7.1** Runtime panel per connection: queues, deliveries, DLQ from
`observe --json`; `health` verdict rendered **verbatim** with no
reclassification.

**R7.2** Codex activity MUST only be shown when a current-runtime pointer
identifies the live runtime root; otherwise the panel is **absent, not stale**.
*Rationale: a stored log path silently tails a dead process.*

**R7.3** The posture chip MUST be labelled **"configured next-launch posture"**
unless the platform exposes a live posture fact.
*Rationale: disk config cannot prove the running process's environment.*

**R7.4** Unreachable sources MUST read **unknown**, never `0`.

**R7.5** Degradation states are first-class and specified from the first
release: engine offline, gh unauthenticated, rate-limited, stale snapshot,
empty board, partial fleet failure, unverified doctor.

**R7.6** Every panel MUST cite its authoritative artifact and snapshot age.

---

## R8 — Non-functional

**R8.1 Performance:** a 5-connection fleet MUST reach first meaningful paint
from cache in <1s and complete a full refresh cycle without exceeding the
subprocess cap.
**R8.2 Accessibility:** WCAG AA contrast; status never conveyed by hue alone
(icon shape + text carry it); full keyboard navigation; visible focus.
**R8.3 Fixture mode:** every view MUST be renderable from recorded fixtures
with a visible "recorded data" marker — this is both the demo path and the
test data source.
**R8.4 Testability:** the projection layer MUST be pure and fixture-testable
with no process or network access.

---

## Traceability

| Req | Mock | FE spec | BE spec | Contract |
|---|---|---|---|---|
| R3 connections | all | §3 shell | §2 connections | `Connection` |
| R4.1 personas | `linear-council.html` | §7.1 | §6 roster | `Persona`, `Roster` |
| R4.2 flows | `linear-council.html` | §7.2 | §6 flows | `Flow`, `FlowStep` |
| R4.3 scores | `linear-council.html` | §7.3 | §7 scoring | `PersonaScore` |
| R4.4 debates | `linear-council-debate.html` | §7.4 | §5 projection | `Debate`, `DebateMessage` |
| R5 work views | `linear-list/-board*` | §5, §6 | §4 discovery | `Entity`, `Claim` |
| R6 writes | composers | §8 | §8 write pipeline | `WriteRequest` |
| R7 honesty | all footers | §9 | §3 snapshots | `Snapshot`, `Health` |

⟦AI:FKST⟧
