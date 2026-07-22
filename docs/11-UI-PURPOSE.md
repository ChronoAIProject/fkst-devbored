# 11 — UI purpose matrix

Status: **LEGACY UI RESEARCH** — the surface admission rule now lives in
[`docs/spec/05-UX-SPEC.md`](spec/05-UX-SPEC.md).
Date: 2026-07-20

## The rule

> **No decorative UI.** Every view, panel, and control must (a) serve a numbered
> step of the complete run in `docs/10 §3`, (b) render from a real source with
> stated provenance, and (c) be demonstrably working — not a styled placeholder.

A surface that fails any of the three is **cut, not shipped disabled**. This
document is the checklist; `P5-X-05` verifies it against the built product.

"Working" has a specific meaning here: the surface reflects real state within
one poll, its interactive affordances produce a real effect, and its failure
modes are reachable and correct. A panel that renders beautifully from fixtures
but has never been driven by a live loop is **not working**.

---

## Matrix

| Surface | Serves step | Data source | Affordances | "Working" test |
|---|---|---|---|---|
| **Connections sidebar** | 1, 5 | `console.config` + derived | select, pause/resume, start/stop | switching scopes every view; a paused connection stops polling |
| **Doctor** | 2 | live probes | run, re-run, copy diagnostics | a broken path yields a specific failure and a fix hint; a fixed path turns it green |
| **Composition panel** | 3 | `.fkst/compose/package-roots` + platform scan | choose platform + host packages | changing composition changes what loads on next start, proven by the graph |
| **Council · Personas** | 4 | host config (host-owned pkg) | add/edit/retire/seat, ≤4 cap enforced | a roster edit provably changes the seats that argue the next proposal |
| **Council · Flows** | 4, 8, 11 | host config + observed markers | edit routing/budgets | a budget change alters observed converge behaviour |
| **Run control** | 5, 15 | owned process state | start, stop, restart | supervise starts, queues fill, stop leaves no console-owned orphan |
| **Runtime panel** | 5 | `observe --json` + verbatim `health` | refresh | queue depths move as the loop works; engine down reads *unknown* |
| **Log stream** | 5, 15 | per-connection supervise log | tail, copy, jump to error | a crash surfaces exit code + last lines |
| **New issue** | 6 | gh write | create + opt-in label | the issue exists on GitHub; the loop admits it next poll |
| **Work list / boards** | 7–13 | markers + GitHub metadata | group, filter, drill in | every transition appears within one poll; all four groupings agree on the same entity set |
| **Claim rendering** | 7–13 | assignee or claimed-label per mode | filter by holder | matches GitHub; label mode never reads assignees |
| **Comment count** | 8, 11 | GitHub comment count | click → debate | count matches the thread; capped fetch reads incomplete, never `0` |
| **Drill-in** | 7–13 | markers + CI + gates | open links, comment | timeline matches the marker history exactly |
| **Debate reader** | 8, 11, 14 | consensus/review markers | filter by voice, multi-select | filter narrows to genuinely that voice; a fresh run appears here |
| **Human comment** | 12 | gh write | compose, send | comment appears in the thread as the human actor, not the bot |
| **Merge gate view** | 13 | marker + CI + posture | none (read-only) | DRY-RUN visibly holds; LIVE merges and the board moves to merged |
| **Council · Scores** | 14 | derived counters | window, open evidence | figures change after a run; undefined renders `—` |
| **Posture chip** | 1, 13 | launch config / adopted | none | reads "configured" for adopted, actual for console-started |
| **Fleet overview** | 1 | per-connection rollup | navigate, pause | one dead connection degrades only its row |
| **Provenance footers** | all | snapshot metadata | none | age escalates visibly; stale is never silent |

---

## Surfaces cut

Removed rather than shipped as placeholders:

| Surface | Why |
|---|---|
| Topology / DAG panel | `graph_json()` invocation unproven (`docs/08` ADR + P0A backlog). Would be a picture, not a projection. |
| Codex activity panel | Only valid with a current-runtime pointer (R7.2). Ships **only** when that resolves; otherwise absent. |
| Persona score `upheldRate` | Not mechanically derivable unless P0A-03 finds structured evidence. Cut before faked (ADR-019). |
| Engine queue controls | Permanently out of scope — requeue/DLQ mutation is not ours (ADR-016 remains in force for *mutation*; ADR-022 grants *lifecycle* only). |
| Anything "coming soon" | A disabled control teaching an operator a capability exists is worse than its absence. |

---

## Anti-patterns (review checklist)

1. A panel rendering only from fixtures at release time — **not working**.
2. A control that looks live but writes nowhere.
3. A metric with no derivation (`docs/05` requires a stated basis).
4. A number rendered `0` where the truth is unknown.
5. A view with no reachable empty, stale, or degraded state.
6. A chart or tile that no decision depends on.
7. A "settings" toggle with no observable effect.

---

## Release gate

`P5-X-05` walks this matrix against the built product. For each row: exercise
the affordance, observe the effect, reach the failure state. **A row that cannot
be demonstrated is cut from the release**, not documented as known-incomplete.

⟦AI:FKST⟧
