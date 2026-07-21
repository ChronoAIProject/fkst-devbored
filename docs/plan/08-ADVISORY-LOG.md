# 08 — Advisory log

> **Historical evidence.** Findings may inform the active spec, but this is
> not an execution queue; see [`docs/spec/README.md`](../spec/README.md).

Findings from the tech advisor (codex `gpt-5.6-sol`) with PM disposition.
Append-only. A finding closes by evidence, by a recorded ADR, or by doing the
work — **never by disagreement alone**.

---

## Round 4 — 2026-07-20 · spec set review before implementation planning

44 findings. Headline: **do not freeze `docs/05` yet — the Council write path
and scoring model are not proven derivable against the platform contracts.**

### Verified before acting

The central claim was checked against platform source rather than accepted:

| Claim | Verification | Result |
|---|---|---|
| Personas/rosters/flows are not loadable | `packages/consensus/core.lua:9` | `default_angles` is a **hardcoded local** — confirmed |
| Seat count is capped | `core.lua:11` | `max_angles = 4` (spec assumed 5 + security) — confirmed |
| No host config knob | `libraries/devloop/config.lua` | **no** angle/seat/persona/roster key exists — confirmed |
| A seam exists somewhere | `core.lua:251` `normalized_angles` | `proposal.angles` is settable **per proposal by the raising package** — a real seam, but not one a console can write |

**Disposition: finding upheld in full.** Council-as-configurator would have
written configuration nothing reads. Restructured: Council v1 is read-only
(P3a); authoring is contingent on an upstream seam (P0A-01 → P3b).

### Sequencing (findings 1–13)

| # | Finding | Disposition |
|---|---|---|
| 1 | Council capability must precede contract freeze | **Adopted** — P0A-01, blocks P3b |
| 2 | Phase 0 freezes before derivability is proven | **Adopted** — split into P0A/P0B/P0C |
| 3 | ADR-012 stale | **Adopted with correction** — Flutter is the *standing* decision but the user has not reconfirmed it; kept as P0A-07, still blocking |
| 4 | Stream B is not stack-independent | **Adopted** — B now depends on P0A-07 |
| 5 | Doctor sequenced too late | **Adopted** — I1 moved into P1; I2 stays P5 |
| 6 | Packaging depends on B and D, not just A | **Adopted** — P1 is one signed vertical slice |
| 7 | D combines three critical paths | **Adopted** — split D1/D2/D3 |
| 8 | F and H falsely parallel (both own Council schema) | **Adopted** — P3b-H-01 owns the domain; F consumes |
| 9 | C and F falsely independent (both need marker interpretation) | **Adopted** — C owns evidence + voice identity |
| 10 | G depends on more than B and D | **Adopted** — G blocked on B+C+D1+D3+I1 |
| 11 | E fixture-complete ≠ live-complete | **Adopted** — P2-E-04 is a separate task |
| 12 | Rate/fleet load test too late | **Adopted** — moved into G4, before writes ship |
| 13 | Gate 3 mixes unrelated criteria; git-authoring scope unused | **Adopted** — git authoring deferred; P4 splits GitHub writes from config apply |

### Missing work (findings 14–25)

All **adopted**: derivability matrix (P0A-06), Council platform extension
(stream K), raw-fixture pipeline (P0B-01/02), process-tree termination spike
(P0A-04), gh rate-metadata spike (P0A-05), auth isolation tests (P0A-08),
ambiguous-write recovery (P4-G-05), WAL-safe backup (P1-D1-02), app lifecycle
(P2-D2-02), redaction policy (P5-X-02), release mechanics (P1-J-04),
Council history authority (P0C-07).

Note on #21 (WAL): copying the DB file while WAL is active is not a valid
backup. This would have shipped as a silent data-loss path.

### Contract risks (findings 26–40)

All **adopted** as P0C-01 … P0C-13. The three that would have caused the most
damage:

- **#26** `Entity.state` mandatory — a newly-enabled or untrusted issue has no
  trustworthy state; a non-null type would have forced a laundered default.
- **#29** `Connection.rosterId` — would have let SQLite decide the active
  roster, directly violating ADR-001.
- **#32** `PersonaScore.objectionsUpheld` not mechanically derivable — and the
  advisory explicitly warns against silently introducing an LLM grader to close
  the gap. **Recorded as a standing prohibition** (plan §working rules #8): the
  seats exist precisely because self-assessment is unreliable, so grading them
  with another ungrounded model would defeat the purpose.

### Task breakdowns (41–43)

Adopted into P2-C-*, P3b-H-*, P2-D2/D3-* with the advisor's "done" criteria
carried across largely verbatim — notably: unknown schemas fail closed, capped
fetches never become zero, unknown bytes round-trip exactly, crashes leave
either the complete old or complete new file, and scheduler tests use a fake
clock with no wall-clock sleeps.

### Estimates (finding 43)

Adopted into `07-TASK-INDEX.md`. Four XL streams: B, C, H, K. Three of the four
are XL because of **external unknowns** (process semantics, marker schemas,
upstream decisions) rather than code volume — which is the honest reason and
the reason P0 exists.

### The one thing (finding 44)

> "Force a contract-reality gate before freezing anything: a field-by-field
> derivability matrix backed by raw captures from one real deployment, and one
> real supervise run consuming a host-owned Council configuration."

**Adopted as G0.** P0A-06 *is* that matrix and *is* the gate. P0A-01 is the
supervise-run half; where it fails, Council scope contracts rather than the
gate being waived.

---

## Standing prohibitions arising from advisory

1. No LLM grader to make a metric derivable (finding 32).
2. No fabricated fixture for a type not proven derivable (finding 2).
3. No field marked "expected to be derivable" survives G0 (finding 14).
4. No `0` where the value is unknown (findings 26, 35).
5. No DB-held authority for anything the platform owns (finding 29).

---

## Open advisory items

| # | Item | Owner | Blocks |
|---|---|---|---|
| A1 | P0A-01 upstream decision — does a Council config seam get built? | user + upstream | all of P3b |
| A2 | P0A-03 — is objection-disposition structured evidence available? | C | scoring scope |
| A3 | P0A-07 — stack reconfirmation | user | A, B, J |
| A4 | Does the platform expose a live posture fact? | upstream | R7.3 wording |

⟦AI:FKST⟧

---

## Round 5 — 2026-07-20 · decomposition review (hat: reviewer of PM decisions)

51 findings on the v1 board. **Board rebuilt as v2.** This is the review hat
working exactly as intended: the errors were caught before 40 "parallel" tasks
were built on a seam that had never been run.

### Adopted wholesale

| Group | Finding | Fix |
|---|---|---|
| **Arithmetic** | #1 — W2 is 39 not 31; total 70 not 62 | recounted; v2 is **85** after splits and additions |
| **False parallelism** | #2–23 — ~20 pairs collide on files, types, or hidden ordering | foundation task added per track (`W2-A1`, `W2-P1`, `W2-R1`, `W2-V1/V4/V6`, `W1-L1..L3`); leaf tasks then own rendering/behaviour only |
| **W0 insufficiency** | #24–31 — missing payload contracts, marker contracts, seat proof, seam proof, adapter/error interfaces, JSON rules, fixture ordering, config CAS | W0 rebuilt around the vertical slice; each gap is now an explicit W0 task |
| **Sizing** | #32–35 — 21 tasks too large, 4 too small | large ones split (notably `implement` → 3, lifecycle → 4); small ones merged |
| **Missing tasks** | #36–46 | added: **PR creation** (v1 ended at "branch pushed" — nothing opened the PR, breaking E2E step 10), scoring service, connection service, composition domain, supervise adapter, marker module, refresh orchestration, app-exit cleanup, release tasks |
| **Critical path** | #47–49 | corrected: the **Lua chain plus real-world latency** sets finish time, not PM review throughput |
| **Ordering risk** | #50 | event/marker contract pulled into W0 as an executable slice |

### The one thing (#51) — adopted as the new W0

> "Replace the three-task W0 with one executable vertical contract gate: a
> minimal composed `devbored-loop` raises a configured four-seat proposal
> through real consensus, receives a typed result, emits the authoritative
> marker, and the Dart contract/projection round-trips that captured artifact."

This proves published seams, payloads, config, seat injection, marker
compatibility, cross-language serialisation, and fixture reality **in one run**,
before anything parallel builds on them. W0-1…W0-8 implement it.

### PM errors recorded

1. **Count wrong** — W2 miscounted by 8. Basic; should not recur.
2. **Parallelism overstated** — ~20 pairs presented as independent shared files
   or types. The rule "a task blocked on another task's *implementation* is
   decomposed wrong" was written in `10-EXECUTION.md` and then violated.
3. **Critical path wrong** — claimed PM review throughput was the bottleneck.
   The Lua chain is inherently sequential and gated on real GitHub/CI latency.
4. **PR creation missing entirely** — the E2E could not have completed.

### Open

| # | Item | Status |
|---|---|---|
| A5 | Does W0-6's slice need a real sandbox repo, or can it run against a fixture GitHub? | PM to decide before W0-6 |
