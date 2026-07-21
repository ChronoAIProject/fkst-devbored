# 09 — Glossary

Status: **LEGACY VOCABULARY SOURCE** — use `docs/spec/` when definitions differ.
Date: 2026-07-20

Words here are used precisely. Where two words look interchangeable and are
not, that is called out — those pairs are where bugs and bad UI come from.

---

**Marker** — an HTML comment written by the loop's bot on a GitHub issue or PR,
carrying versioned facts (`state:v1`, `review-result:v1`, `merge-ready:v1`,
`dependency-wait:v1`). **Markers are the truth.** Only markers authored by a
configured trusted bot login count.

**Label** (`fkst-dev:*`) — a **hint**, maintained best-effort for humans
browsing GitHub. Labels drift and several states share one label. Never a
source of state; disagreement surfaces as `labelDrift`.

**State** vs **Stage** — *not interchangeable, never map one onto the other.*
- **State** (`MarkerState`) is the loop's own vocabulary from the trusted
  marker: `thinking`, `ready`, `implementing`, `reviewing`, `mergeReady`, …
- **Stage** is a coarse presentation grouping — Design / Build / Review / Ship —
  derived for display.
One state is the machine's; the other is the operator's mental model. Rendering
one as the other loses the distinction the whole board depends on.

**Claim** — the optimistic lease showing which loop instance is working an
entity. Expressed as an **assignee** or as the `fkst-dev:claimed` label
depending on the connection's **claim mode**. Claim age comes only from
timeline events; otherwise it is *unknown*, not zero.

**Connection** — one configured deployment: a target repo plus the local paths
and identities needed to observe it. The console supports several; they may
share a GitHub token and therefore share one rate budget.

**Council** — the console's configuration surface for deliberation: who sits,
how they decide, and how well they perform. Formerly "Responsibility" (ADR-005).

**Persona** — a lens a codex worker argues from, defined by a brief, a model,
an effort setting, and where it is seated. Personas have identity colours;
those colours never encode a verdict.

**Seat** — a persona's participation in a specific flow step. A persona can be
seated at design consensus, PR review, both, or neither.

**Veto seat** — a seat whose rejection blocks regardless of the tally
(typically security).

**Meta-judge** — a non-voting persona that reads the seats' outputs, decides
whether they genuinely disagree, and **narrows the question** for the next
round.

**Flow** — the routing a piece of work moves through: ordered steps, each with
seats, an agreement rule, budgets, and explicit branches for agree / disagree /
exhausted. Flows are executed autonomously by the loop; the console defines
their shape.

**Round** — one pass of deliberation. A round that fails to reach agreement may
be re-asked with a narrowed question (a **converge** round), up to a budget.

**Converge / stall** — *converge* is productive narrowing; *stall* is the
detector for rounds that repeat without movement, ending the work at a terminal
state carrying a WHY.

**Changed position** — a seat voting differently between rounds after the
question narrowed. Evidence of genuine convergence rather than attrition, and
surfaced deliberately.

**Upheld / overruled / caught alone** — scoring outcomes. *Upheld*: the merged
diff reflects the objection. *Overruled*: it merged unchanged. *Caught alone*:
no other seat raised it that round. All derived from merged outcomes, never
self-reported.

**Merge gate** — the machine checks before merge: head-bound approval, CI,
mergeability, write posture. **No persona can override these**, and they are
not configurable.

**Posture** — whether the deployment will perform real GitHub writes
(`FKST_GITHUB_WRITE`). The console reads it from configuration, so it can only
honestly say **"configured next-launch posture"** — disk config cannot prove a
running process's environment.

**Doctor** — the per-connection validation report (paths, versions, schemas,
auth, access). A board whose doctor has not passed is rendered but marked
unverified.

**Observe** — `fkst-framework observe --json`, the only supported external read
of engine runtime state. Never the socket, never redb directly.

**Snapshot** — one immutable poll result with its `asOf` and provenance.
Snapshots replace by generation; they are never merged.

**Unknown vs zero** — an unreachable or unparseable source reads **unknown**.
Rendering `0` claims knowledge the console does not have. This is a correctness
rule, not a style preference.

**Fixture** — recorded, sanitised source output used for tests and the demo
path. Fixtures are a regression net pinned to a platform commit — **not** a
schema authority.

**Projection** — the pure transformation from raw source records to typed
contract objects. Where meaning is added; the only place markers are parsed.

**Provenance** — the artifact a panel projects plus its age. Every panel shows
it; it is a component, not per-view prose.

⟦AI:FKST⟧
