# P-E2E — Local host & complete run

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md) Steps 4 and 9.

**Inserted between P1 and P2.** The console must run the loop before it can
honestly claim to observe one. Everything downstream gets a real source instead
of a fixture.
**Exit gate: G1.5.**

Task IDs: `PE-<stream>-nn`.

---

## Stream L — Host composition *(new)*

### PE-L-01 — Host root layout · M
Create the console's `.fkst/` host layout: `env`, `compose/package-roots`,
`local-packages/`. Per connection, under app-data.
**Done:** `run.sh host --host-root <console> --platform-root ../packages -- check`
passes against the referenced siblings with nothing vendored.

### PE-L-02 — Sibling reference resolution · M
Resolve `../substrate` and `../packages` from per-connection config; validate
the binary exists and is fresh; **never write into either**.
**Done:** a missing or stale binary produces a doctor failure with the build
command shown — the console does not build another repo. A write attempt into a
referenced root is rejected by construction.

### PE-L-03 — Composition control · M
Read available platform packages; let the operator choose platform + host
packages; write `.fkst/compose/package-roots`.
**Done:** a composition change alters what loads on the next start, provable
from the runtime graph.

### PE-L-04 — Per-connection roots · S
Durable and runtime roots per connection under app-data; reject a shared
durable root.
**Done:** two connections cannot be configured onto one durable root.

---

## Stream M — Run control *(new)*

### PE-M-01 — Supervise launch · L
Spawn through `run.sh supervise --project-root … --platform-root … `
`--platform-packages … --host-packages … --durable-root … --runtime-root …`
via the P1 process supervisor.
**Done:** supervise starts, queues fill, the runtime panel moves.

### PE-M-02 — Stop & restart · M
Signal, wait, escalate. **In-flight codex children are orphaned, not killed** —
the platform's crash-only contract.
**Done:** stop leaves no *console-owned* orphan; an orphaned codex child is
reported as expected, not as a leak. Restart re-derives from GitHub.

### PE-M-03 — Adopted vs owned · M
A supervise the console did not start is *external*: observable, never
controllable; its posture reads *unknown*.
**Done:** an externally-started supervise shows no stop control and an unknown
posture.

### PE-M-04 — Crash surfacing · M
Detect exit; surface code + last log lines. **Never auto-restart silently.**
**Done:** a killed supervise produces a specific crash state, not a silent
stall.

### PE-M-05 — Log stream · M
Per-connection stdout/stderr capture with bounded retention, tail, copy, jump
to error.
**Done:** logs stream live and survive a view switch; retention is bounded.

---

## Stream N — `devbored-loop` package *(ADR-027/028 — in fkst-packages; spec: docs/12)*

### PE-N-01 — Package skeleton + conformance · M · ⛔
`packages/devbored-loop/` in **fkst-packages**: `fkst.toml` with `lib_deps`
(incl. `devloop`) and `event_deps` (`github-proxy`, `consensus`), `core.lua`,
department stubs with correct `M.spec`.
**Done:** `scripts/run.sh test` green; composed conformance passes; graph-scan
accepts `raise ⊆ produces ⊆ (own ∪ sibling published_seam)`.

### PE-N-02 — Config loader · M
`file.read` + `json.decode` of `FKST_DEVBORED_CONFIG`, schema-versioned,
`pcall`-guarded, **fails closed** on unreadable/malformed/unknown-schema.
**Done:** a corrupt config produces a DLQ entry with a specific error — never a
silent fallback to defaults.

### PE-N-03 — Dynamic labels · M
Every label read from config: prefix, enabled, claimed, per-state map, priority
classes. No `devbored:` string is hardcoded anywhere.
**Done:** changing the prefix in config changes the labels the loop writes on
the next run, with no restart and no code change.

### PE-N-04 — Seat injection · S · **the point of the package**
`builders.build_proposal(issue)` then `proposal.angles = cfg.stages.<s>.seats`;
validate ≤4 and fail closed above it.
**Done:** a configured 4-seat roster provably argues the next proposal.

### PE-N-05 — Issue-side departments · L
`observe_issue`, `consensus_result`, `implement` — reusing kernel markers,
claims, gates, convergence, git mechanics.
**Done:** an issue goes intake → design → implementing → awaiting-pr with
correct markers.

### PE-N-06 — PR-side departments · L
`observe_pr`, `review_result`, `merge_gate`.
**Done:** a PR goes pr-open → reviewing → merge-ready; gates hold under DRY-RUN.

### PE-N-07 — Liveness + dead-letter · M · **conformance-required**
Every non-terminal state declares budget + watchdog; heartbeat-deferred for
codex stages; DLQ emits structured facts.
**Done:** conformance passes; a stalled state force-terminates with a WHY; a
healthy long-running codex stage is **not** killed.

### PE-N-08 — Dynamic workflow parameters · M
Agreement rules, budgets, intake criteria, stage enablement, model/effort — all
from config within the static graph.
**Done:** disabling review consensus and halving converge rounds changes
behaviour on the next run with no restart.

---

## E2E acceptance

### PE-X-01 — DRY-RUN complete run · L · **G1.5**
Steps 1–15 of `docs/10 §3` against a sandbox repo in DRY-RUN.
**Done:** recorded run; every transition visible within one poll; merge visibly
**holds** at the gate.

### PE-X-02 — LIVE run · M
Steps 1–13 in LIVE against a sandbox repo, merging to an integration branch.
**Done:** a PR authored by the loop merges; the board reaches merged; the
console never merged anything itself.

### PE-X-03 — Custom roster proof · M
Configure a 4-seat roster; seed an issue; confirm those four seats argue it.
**Done:** the debate reader shows exactly the configured seats. **This is the
single most important acceptance in the project** — it proves the console
configures the loop rather than decorating it.

### PE-X-04 — Restart mid-flight · M
Restart supervise while work is in flight.
**Done:** the loop resumes from GitHub; no duplicate PR; orphaned codex child
completes or is superseded, consistent with the crash-only contract.

### PE-X-05 — Failure drills · M
Engine binary missing · packages path wrong · durable root shared · token
absent · repo inaccessible · supervise crash-loop.
**Done:** each produces a specific, actionable state — never a spinner or a
generic error.

---

## G1.5 exit checklist

- [ ] Complete run 1–15 passes in DRY-RUN against a sandbox repo
- [ ] LIVE run merges to an integration branch
- [ ] A console-configured 4-seat roster provably seats those seats
- [ ] Restart mid-flight resumes without duplication
- [ ] Nothing was written into `../substrate` or `../packages`
- [ ] All failure drills produce specific states
- [ ] Advisor review passed

---

## Consequences for later phases

- **P2** gets a live loop instead of fixtures — `P2-C-09`'s hand audit runs
  against runs the team produced, and `P2-E-04` live integration is real.
- **P3** Council authoring is **unblocked** (ADR-024) and moves out of the
  contingent P3b track, minus the 4-seat cap. P3b now covers only what the
  host-package seam cannot reach.
- **P0A-01** downgrades from ⛔ blocking to an optional upstream nicety
  (PE-N-04).
- **P4** writes gain a second acceptance: a human comment must land in a thread
  the console's own loop is actively working.

⟦AI:FKST⟧
