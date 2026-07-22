# 00 — Implementation plan

Status: **HISTORICAL PLAN** — superseded by
[`plans/full-app-construction.md`](../../plans/full-app-construction.md).
Date: 2026-07-20
PM: **Opus 4.8** · Tech advisor: **codex GPT-5.6-Sol**

## Standing advisory arrangement

| Role | Who | Owns |
|---|---|---|
| **PM** | Opus 4.8 | scope, sequencing, gates, task decomposition, dispositioning advisories, keeping docs and reality reconciled |
| **Tech advisor** | codex `gpt-5.6-sol` | adversarial technical review of every phase before it starts and every gate before it closes; findings are logged and dispositioned, never silently dropped |

Advisory findings land in `08-ADVISORY-LOG.md` with a disposition. **A finding
is never closed by disagreement alone** — it is closed by evidence, by a
recorded ADR, or by doing the work.

## The finding that reshaped this plan

The spec set described **Council as a configurator** that writes persona /
roster / flow configuration which the loop then executes. Sol challenged
whether that seam exists. It was checked against the platform source:

- `packages/consensus/core.lua:9` — `default_angles` is a **hardcoded local**
- `core.lua:11` — `max_angles = 4` (the spec assumed 5 seats + security)
- `libraries/devloop/config.lua` — **no** angle/seat/persona/roster env knob
- The only seam is `proposal.angles`, set **per-proposal by the raising
  package** — not by any host-owned file a console could write

**Conclusion: as specified, Council would write configuration that nothing
reads.** Persona/flow *authoring* is blocked on an upstream platform change.
Persona/flow *observation* (reading what the loop actually did) is supported
today by the markers already on the GitHub thread.

Consequences, in force:

1. **Contracts do not freeze yet.** `docs/05` freezes only after every field is
   proven derivable from a real source (P0A-06).
2. **Council v1 is read-only** — it shows the seats that ran, their verdicts,
   and observable scores. Authoring is Phase 3, contingent on P0A-01.
3. **Scoring is cut back.** "Objection upheld" requires semantic judgment
   unless markers link an objection to a disposition. v1 ships only mechanically
   derivable counters. **No LLM grader is introduced to paper over this** —
   that would reintroduce exactly the self-grading the seats exist to avoid.

## Phase structure

```
P0  Reality & freeze     ── spikes prove what exists ──► contracts freeze
P1  Foundation           ── signed vertical slice: shell+supervisor+store+doctor
P2  Read plane           ── projection, work views, runtime
P3  Council              ── read-only first; authoring iff P0A-01 passed
P4  Writes               ── human inputs behind identity guard
P5  Fleet & RC           ── multi-connection, load, accessibility, release
```

Product code is blocked until P0 exits. **Disposable spike code is explicitly
allowed and expected in P0** — a spike that proves a seam is the cheapest
artifact in this project.

## Gates

| Gate | Closes when | Advisor review |
|---|---|---|
| **G0** | every `docs/05` field has a proven source; contracts frozen | required |
| **G1** | signed build launches from Finder and shells observe/health/gh/git; store migrates; doctor passes on a real connection | required |
| **G2** | list + one board render live; all six view states reachable; projection hand-audited against a live sample | required |
| **G3** | Council read-only renders real seats and verdicts from markers | required |
| **G4** | writes land behind the identity guard with audit, incl. ambiguous-outcome handling | required |
| **G5** | 5-connection load respects one shared budget; a11y pass; release mechanics | required |

Rate/fairness load testing sits at **G4, before writes ship** — not at the end.

## Corrected stream map

Sol identified four false parallelisms in the original split. Corrected:

| Stream | Owns | Notes |
|---|---|---|
| **A** shell/design | theme, nav, shared components, six view states | needs stack confirmed |
| **B** adapters | supervisor, observe/gh/git/health | **not stack-independent** — Dart/macOS process concerns |
| **C** projection + evidence | markers → entities, claims, **debates, voice identity** | absorbed debate/voice from F |
| **D1** store | drift schema, migrations, WAL-safe backup | split from scheduler |
| **D2** scheduler | global poll loop, fairness, lifecycle | depends on B |
| **D3** rate/auth | budget per {host, auth-context} | depends on I1 + gh metadata spike |
| **E** work views | list, boards, drill-in | fixture-complete ≠ live-complete |
| **F** Council UI | personas/flows/scores rendering | consumes C's evidence model |
| **G** writes | guard, pipeline, audit, ambiguous outcomes | depends on B+C+D1+D3+I1 |
| **H** config domain + materialiser | Council schema, validation, guarded write | **merged with F's domain** — one owner |
| **I1** connection + doctor | connection model, trust derivation, doctor | **moved into P1** |
| **I2** fleet UI | fleet overview | stays P5 |
| **J** packaging | signing, notarisation, native deps | continuous; gates G1 |
| **K** platform extension | upstream Council config seam | **new** — blocks Council authoring |

## Working rules

1. No product code before G0.
2. A stream needing a contract field it cannot derive raises it — it does not
   invent a source.
3. `projection` and `scoring` stay pure: no process, network, or store imports.
4. Never render `0` for absent data.
5. Every PR names its requirement ID and acceptance criterion.
6. Docs update in the same PR as the behaviour.
7. Merge-gate checks never become configurable.
8. No LLM grader is introduced to make a metric derivable.

## Files

| File | Contents |
|---|---|
| `01-PHASE-0.md` | reality spikes, fixtures, contract revision |
| `02-PHASE-1.md` | foundation vertical slice |
| `03-PHASE-2.md` | read plane |
| `04-PHASE-3.md` | Council (read-only, then contingent authoring) |
| `05-PHASE-4.md` | writes |
| `06-PHASE-5.md` | fleet, load, release |
| `07-TASK-INDEX.md` | flat index: IDs, deps, size, stream |
| `08-ADVISORY-LOG.md` | Sol's findings + dispositions |

⟦AI:FKST⟧
