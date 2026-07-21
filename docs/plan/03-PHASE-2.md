# P2 — Read plane

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md).

**Entry:** G1 closed. **Exit gate: G2.**

The projection layer is the highest-value correctness surface in the product:
it is pure, fully fixture-testable, and everything downstream inherits its
mistakes. It gets the most adversarial testing of any stream.

---

## Stream C — Projection & evidence *(pure — no process, network, or store)*

### P2-C-01 — Trust normalisation · S
Author → trusted set membership with `[bot]` suffix normalisation;
`unverifiable` ⇒ everything untrusted.
**Done:** adversarial fixtures (untrusted author, near-miss login, bot-suffix
variants) resolve correctly.

### P2-C-02 — State resolution · M
Version-ordered marker resolution to `MarkerState?` + `parseStatus`.
**Done:** unknown schema ⇒ `unsupportedSchema` and **never** a guessed state;
out-of-order versions resolve to the highest; no marker ⇒ `noMarker`, not a
default state.

### P2-C-03 — Claim resolution · M
Branch on `claimMode`: assignee lease vs read-only `fkst-dev:claimed`. Age only
from timeline events, else `ageUnknown`.
**Done:** label-mode fixtures never read assignees as authority; missing
timeline ⇒ *unknown*, never a computed age.

### P2-C-04 — GitHub metadata vs marker facts · S
Per P0C-08: lifecycle from markers, ordinary metadata from GitHub with separate
provenance.
**Done:** every `Entity` field cites which of the two it came from.

### P2-C-05 — Discovery union · M
Opt-in label ∪ bot-assigned ∪ bot-authored PRs. Dedupe by `EntityRef`. Per-cycle
caps **logged**, never silent.
**Done:** no state-label filter exists; a capped cycle reports what it dropped.

### P2-C-06 — Debate assembly · L · *scope set by P0A-02*
Rounds, messages, verdicts, and only those fields P0A-02 proved derivable.
Unsupported fields are null or absent — **not inferred**.
**Done:** every debate field traces to a marker in the derivability matrix.

### P2-C-07 — Voice identity mapping · M
Platform-derived `VoiceKey` → persona metadata, per P0C-06, without rewriting
historical evidence.
**Done:** renaming or retiring a persona leaves historical debates intact.

### P2-C-08 — Completeness & partial fetch · M
Nullable comment counts with completeness status; `DebateHeat` only from a
complete population.
**Done:** a capped fetch never presents as complete; heat is absent rather than
wrong.

### P2-C-09 — Differential + hand audit · L
Compare projection output against platform behaviour on a live sample;
hand-audit the diff.
**Done:** a documented audit of ≥20 real entities with zero unexplained
divergences. **This is the G2 evidence.**

---

## Stream D2 — Scheduler

### P2-D2-01 — Poll loop with fake clock · L
One global loop, adaptive cadence, jitter, bounded concurrency, per-connection
fairness. Deterministic tests — **no wall-clock sleeps**.
**Done:** 1/5/10-connection simulations show no starvation and a bounded
subprocess count.

### P2-D2-02 — Lifecycle handling · M
Sleep/wake, hidden-window suspension, network transitions, connection removal
mid-poll, manual refresh during backoff, pause/resume.
**Done:** each transition has a test; none leaks a process or a stale
generation.

### P2-D2-03 — Generation swap · S
Snapshots replace by generation; never merged.
**Done:** a partial failure cannot leave rows from two generations visible
together.

---

## Stream D3 — Rate & auth coordinator

### P2-D3-01 — Budget per {host, auth-context} · L
One budget per key, using the mechanism from P0A-05. Dedupe identical in-flight
queries. Reset-aware backoff from response metadata, not a fixed timer.
**Done:** two connections sharing an actor provably share one budget.

### P2-D3-02 — Budget surfacing · S
Remaining budget and reset time available to the UI.
**Done:** the rate-limited degraded state shows a real reset time.

---

## Stream E — Work views

### P2-E-01 — List view · M
Grouped rows per `docs/03` §5.1.
**Done (fixture)**: renders every group including empty and terminal.

### P2-E-02 — Board + four groupings · L
One card component; grouping key varies: status | stage | connection | claim.
Cards are **multi-line** (ADR-004).
**Done (fixture)**: all four groupings render from one fixture set; a review
check rejects single-line cards.

### P2-E-03 — Drill-in · M
Marker timeline, consensus digest, merge-gate table, blockers, CI, links.
**Done:** every fact shows its provenance; absent facts render *unknown*.

### P2-E-04 — Live integration · L
Replace fixtures with live snapshots; handle partial failure, pagination,
cache-first paint, stale escalation.
**Done (live)**: `E-live-complete` — distinct from fixture-complete, per Sol's
finding. Cache-first paint <1s on a warm store.

### P2-E-05 — Virtualisation · M
Row/card virtualisation and pagination for large fleets.
**Done:** 1000-entity board scrolls without frame drops; grouping stays stable
across pages.

---

## Stream (runtime panel)

### P2-R-01 — Runtime view · M
Queues, deliveries, DLQ from `ObserveSnapshot`; `healthLine` verbatim.
Codex-activity panel **absent** unless a current-runtime pointer resolves.
**Done:** a stale runtime root produces absence, not stale content.

---

## G2 exit checklist

- [ ] List + at least one board render live from a real connection
- [ ] All six view states reachable in real conditions
- [ ] Projection hand-audit passed (P2-C-09)
- [ ] Unknown schema fails closed end-to-end, visible in the UI
- [ ] Scheduler fairness + concurrency bounds proven with a fake clock
- [ ] Shared-budget behaviour proven for two connections on one actor
- [ ] No `0` rendered for any absent value
- [ ] Advisor review passed

⟦AI:FKST⟧
