# 07 — Parallel workstreams

Status: **LEGACY PLAN** — superseded by
[`plans/full-app-construction.md`](../plans/full-app-construction.md).
Date: 2026-07-20

## The premise

Parallel work is only possible because the seam is frozen first. Every stream
builds against `docs/05-DATA-CONTRACTS.md` and fixtures — not against another
stream's half-finished code. If a stream finds the contract insufficient, it
**raises an ADR**; it does not reach around the seam.

## Phase 0 — Contract freeze (blocks everything)

Nobody writes implementation code until:

- [ ] `docs/05` freeze checklist complete, version `contracts/v1` frozen
- [ ] Fixture corpus captured from a real deployment, sanitised (R2.2/R2.3)
- [ ] ADR-012 resolved — target stack confirmed (`docs/08`)
- [ ] Stream owners assigned

**Phase 0 is not a formality.** Every serialisation risk in this project lives
here: if contracts move after streams start, all of them stall together.

## Streams

| # | Stream | Owns | Depends on | Can start |
|---|---|---|---|---|
| **A** | Shell + design system | app skeleton, theme, tokens, nav, shared components (`docs/03` §4), the 6 view states | ADR-012 | Phase 0 |
| **B** | Adapters + supervisor | process supervisor, observe/gh/git/health adapters, typed errors | — | **Phase 0 (parallel)** |
| **C** | Projection + fixtures | marker parse, discovery, claim resolution, debate assembly — pure | fixtures | **Phase 0 (parallel)** |
| **D** | Store + scheduler | drift schema, migrations, 4 data classes, global scheduler, rate coordinator | B | after B's adapter signatures land |
| **E** | Work views | list, 4 board groupings, drill-in | A, contracts | after A's components |
| **F** | Council | personas, flows, scores, debate reader | A, contracts | after A's components |
| **G** | Writes | identity guard, write pipeline, audit, composers | B, D | after D |
| **H** | Config materialiser | guarded host-profile write, three-way diff | D | after D |
| **I** | Doctor + fleet | connection validation, fleet overview | B, D | after D |
| **J** | Packaging | signing, notarisation, GUI PATH, native deps | A | **early — see below** |

**B and C start immediately alongside A.** They are pure or near-pure and need
no UI. C in particular is the highest-value early work: it is fully testable
from fixtures and everything downstream depends on its correctness.

**J (packaging) must produce a signed smoke build early**, not at the end.
macOS notarisation, restricted GUI `PATH`, native SQLite packaging, and
filesystem permissions can each invalidate architectural assumptions. A build
that launches from Finder and successfully shells `observe`, `health`, `gh`,
and `git` is a Phase-1 exit gate, not a release task.

## Dependency graph

```
Phase 0 ── contracts frozen ── fixtures captured
   │
   ├── A shell/design ─┬─ E work views ──┐
   │                   ├─ F council ─────┤
   │                   └─ I fleet UI ────┤
   ├── B adapters ──┬── D store/sched ───┼── G writes ──┐
   │                └── I doctor ────────┤              ├── integration
   ├── C projection ───────────────────── ┤              │
   │                                      └── H config ──┘
   └── J packaging (continuous, gates Phase 1)
```

## Integration gates

**Gate 1 — Read plane green.** A real connection renders list + one board from
live sources, with all six view states reachable and the doctor passing.
*Exit criteria: B+C+D+A+E complete; signed smoke build launches from Finder.*

**Gate 2 — Council read-only.** Personas, flows, and scores render from real
config and real merged outcomes. No writes yet.
*Exit criteria: F complete; scoring validated against a hand-audited sample.*

**Gate 3 — Writes.** Comment + create-issue behind the identity guard, with
audit. Config materialisation with three-way diff.
*Exit criteria: G+H complete; failure-path tests pass (dirty tree, path
traversal, concurrent edit, protected branch, partial failure, bot actor).*

**Gate 4 — Fleet.** Multi-connection with global scheduling, shared rate
budget, repo-qualified identity throughout.
*Exit criteria: I complete; 5-connection load test respects one budget.*

**Gate 5 — Release candidate.** Accessibility pass, notification UX,
performance, fixture demo mode, full doc/reality reconciliation.

## Working rules

1. **Contracts before code.** A stream needing a new field opens an ADR and a
   contract PR first. No local type extensions that "we'll unify later".
2. **Fixtures are shared.** One corpus in `fixtures/`, owned by C, consumed by
   everyone. A stream that needs a new scenario adds a fixture, not a mock.
3. **Purity is enforced.** `projection` and `scoring` must not import process,
   network, or store. This is a review gate.
4. **No stream ships a raw `0` for absent data.** Use `UnknownValue` / `null`.
5. **Every PR states which requirement ID it satisfies** and which acceptance
   criterion it meets. A PR that satisfies none is scope creep.
6. **Docs are updated in the same PR** as the behaviour they describe. A doc
   that drifts from reality is worse than no doc.
7. **The merge gate's checks are never made configurable** — recurring review
   check, because it will be proposed.

## Definition of done (per stream)

- Requirement IDs satisfied and acceptance criteria demonstrably met
- Fixtures round-trip
- All six view states implemented (UI streams) or all typed errors emitted
  (service streams)
- No new authority: nothing the stream added makes local state a source of truth
- Docs updated in the same change

## Deliberately not scheduled

Topology/DAG panel (gated on the upstream `graph_json` invocation spike),
self-host mode, mobile, staged R6.5 mutations, and any engine control surface.
These are recorded so they are not silently reintroduced as "small additions".

⟦AI:FKST⟧
