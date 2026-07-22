# 10 — Execution model

Status: **HISTORICAL EXECUTION MODEL** — superseded by
[`plans/full-app-construction.md`](../../plans/full-app-construction.md).
Date: 2026-07-20

## Roles

| Role | Who | Does |
|---|---|---|
| **PM** | Opus 4.8 | decomposes, assigns, sequences, resolves blockers, **final review for functionality + correctness before merge to `develop`** |
| **Reviewer of PM** | Sol | reviews every PM decision — decomposition, sequencing, scope calls — to catch PM error before it propagates |
| **Implementer** | Sol | executes assigned tasks |
| **Reviewer of work** | Sol | reviews implementation before it returns to PM |

Sol holds three hats. The one that matters most is the **first**: PM decisions
have already been wrong twice in this project (ADR-024 host-package assumption,
ADR-026 upstream patch) and both were caught by Sol. That review is not
ceremonial.

## The loop

```
PM decomposes ─► Sol reviews the decomposition ─► PM adjusts
       │
       ▼
   assign task ─► Sol implements ─► Sol reviews own work against DoD
       │                                      │
       │                              fails ──┘ (fix, re-review)
       ▼
   PM reviews: does it work? is it correct? does it satisfy the req ID?
       │
   fails ─► back to Sol with specifics
       │
   passes ─► merge to develop
```

**Implementation review ≠ self-grading.** Sol reviews against the task's written
DoD and the requirement ID, not against its own intent. Where a task's DoD is
subjective, that is a PM decomposition failure — fix the DoD, not the review.

## Definition of done (every task)

1. The DoD in the kanban row is met — literally, not approximately.
2. The requirement ID it claims is satisfied.
3. Tests exist and pass; for Lua, `scripts/run.sh test` is green.
4. No new authority: nothing makes local state a source of truth.
5. No `0` rendered where the value is unknown.
6. Docs updated in the same change if behaviour differs from spec.
7. PM has exercised it — **not just read the diff**.

## PM review checklist (before merge)

- [ ] Ran it. Actually ran it.
- [ ] The claimed requirement is satisfied, not adjacent to satisfied.
- [ ] Failure paths reachable and correct, not just the happy path.
- [ ] No silent fallback where the spec says fail closed.
- [ ] No decorative UI (ADR-025).
- [ ] Contracts unchanged, or changed with an ADR.

## Branching

- `develop` is the integration branch. Nothing lands unreviewed.
- One branch per task: `task/<ID>-<slug>`.
- Parallel tasks use **git worktrees** so sessions never collide.
- Lua work lands in `fkst-packages` on its own branch and PRs there — a
  separate repo, separate review, same bar.

## Parallelism rules

1. **Contracts land first.** Wave 0 is the only serialisation point; everything
   after builds against fixed types.
2. **A task blocked on another task's *implementation* is decomposed wrong** —
   it should depend on a contract, not on code.
3. **Stub-first**: a consumer builds against the contract with a fixture; the
   producer fills it in parallel.
4. **WIP limit**: as many concurrent tasks as you can run sessions for. The
   bottleneck is PM review throughput, not task supply — so PM reviews are
   short, specific, and fast.
5. A task that grows past its size estimate is **split, not extended**.

## Escalation

- Sol finds a spec error → stop, raise to PM, PM records an ADR. Do not
  implement around a wrong spec.
- Sol finds a task cannot meet its DoD → stop, report why. Do not lower the DoD.
- Two tasks collide on the same file → PM re-decomposes; do not merge-resolve
  blindly.

## The board

`docs/plan/KANBAN.md` is the live board, updated as work is assigned and
completed. It is the single view of status — no side channels.

⟦AI:FKST⟧
