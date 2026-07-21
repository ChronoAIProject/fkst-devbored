# Execution-governance evidence

Status: **ACTIVE ACCELERATED V2 EXECUTION; T0 FOUNDATION; HG-01 NEXT**
Spec: `full-app/v2`

This directory records the orchestration smokes permitted by G-001..G-006 and
the accepted Step-0 wave evidence that followed G-007. It does not authorize
product code. The main PM changes ORG rows in
[the readiness ledger](../../08-READINESS.md) only
from machine-observed provider, model, session, worktree, commit, and review
evidence.

| Gate | State | Evidence |
|---|---|---|
| G-001 | PASS | [G-001-main-pm.json](G-001-main-pm.json) |
| G-002 | PASS | [G-002-sol-spawn.json](G-002-sol-spawn.json) |
| G-003 | PASS | [G-003-opus-review.json](G-003-opus-review.json) |
| G-004 | PASS | [G-004-fable-advisory.json](G-004-fable-advisory.json) |
| G-005 | PASS | [G-005-rework-loop.json](G-005-rework-loop.json); canonical [task-state template](task-state-template.json) |
| G-006 | PASS | [G-006-worktree-isolation.json](G-006-worktree-isolation.json) |
| G-007 | PASS | [G-007-pm-gate.json](G-007-pm-gate.json); Step-0 `R-*` roots open, product coding still blocked until R-039 |

Initial Step-0 dispatch is frozen in
[R1-dispatch.json](R1-dispatch.json), including the standing-Fable packet review,
PM dispositions, exclusive paths, route contract, merge order, and collision
gate. Fresh reviewers use the frozen
[Wave R1 Opus checklist](R1-opus-review-checklist.md).
The collision-free integration and every retained downstream gap are recorded
in [R1-integration.json](R1-integration.json). New waves use the closed
[task-state contract](task-state-contract.v1.json); the template remains
[task-state-template.json](task-state-template.json).
Standing Fable passed the post-wave reconciliation and required the authority
set to be committed before R2; see
[R1-addendum-fable.json](R1-addendum-fable.json).
The PM disposition and immutable authority commit are recorded in
[R1-authority-freeze.json](R1-authority-freeze.json). R2 may not dispatch from
an authority base that omits that receipt.
The R2 shared-gate observation and resulting R-059 plan mutation are tracked in
[R2-preflight.json](R2-preflight.json); its state must reach `ACCEPTED` before
R2 worktrees are created. The two-environment command evidence is pinned in the
[R2 preflight test transcript](R2-preflight-test-transcript.json).
The first post-preflight engineering packet is frozen in
[R2-dispatch.json](R2-dispatch.json). Its per-task state records live under
[`task-states/`](task-states/) and begin before worktree or owner binding; the
main PM appends bindings, reviews, decisions, and integration receipts there.
The collision-free integration of R-003, R-008, R-014, and R-016, its exact
merge order, aggregate verification, and retained downstream gates are recorded
in [R2-integration.json](R2-integration.json).

The v1 task contract and every existing G/R1/R2/task-state record are immutable
history. New dispatch is being cut over append-only to the
[v2 execution contract](execution-contract.v2.json), the
[35-package map](accelerated-package-map.v1.json), the
[package-state template](package-state-template.v2.json), and the
[human-gate template](human-gate-template.v1.json). The human-readable authority
is the [accelerated delivery plan](../../../../plans/accelerated-human-gated-delivery.md).
The R3 receipt records green Fable/Opus review and HG-00 activation. The
current tier remains T0: new v2 foundation-package dispatch is authorized, but
Flutter product/UI, runtime, external effects, release, and submission remain
unauthorized until their exact human gates.
The candidate/activation identities, closed-v1 hashes, append-only cutover
prefixes for R-041/R-051, user HG-00 directive, advisor/reviewer results, and PM disposition live in
[R3-accelerated-delivery-cutover.json](R3-accelerated-delivery-cutover.json).
The R-051 all-target clippy command was subsequently proven red on its exact
pinned substrate base. The first verification-only mutation correctly recorded
that fact but its comparator subset was later proven scheduling-sensitive and is
explicitly superseded, not rewritten, in the accepted
[R-051 clippy gate mutation v2](R2-r051-clippy-gate-mutation-v2.json). V2 pins
Cargo `--keep-going`, two runs per base/final side, the exact
[fingerprint canonicalizer](R2-r051-clippy-fingerprints.jq), structured delta
rules, the unchanged no-ADR disposition, and mandatory final-head review. The
[v1 record](R2-r051-clippy-gate-mutation.json) remains immutable history. Neither
mutation weakens a non-clippy gate or authorizes unrelated substrate cleanup.
R-051 subsequently reached `INTEGRATED` at reviewed substrate commit
`e38358a0552c4133414836bf52df6593908fe547`: fresh Opus reproduced the v2
canonical comparison, 145 managed-Codex tests, full framework and repository
verification, then the PM accepted and locally fast-forwarded `substrate/dev`.
No real Codex/network effect or external push occurred; R-029/R-052 and AP-05's
remaining containment/topology/lifetime work stay open.

Rules:

- A Heca provider-catalog entry proves selectability, not task completion.
- A display name never substitutes for provider/model/session metadata.
- Generic collaboration agents are not Sol, Opus, or Fable evidence.
- Plan/read-only reviewer status must be paired with clean pre/post Git state.
- All fixtures and worktrees created by this bootstrap are disposable and may
  not modify product or dependency files.
- Every already-dispatched v1 task begins from
  [task-state-template.json](task-state-template.json), appends rather than
  rewrites review/decision history, and may reach `INTEGRATED` only after its
  recorded fresh-Opus and PM gates pass. After the R3 cutover, new work uses one
  v2 package record, fresh Opus, and the closed mechanical integration gate;
  the PM does not add a second package acceptance verdict.
- The closed transition vocabulary, Fable advisory station, canonical
  submission core, and Wave-R1 legacy disposition are normative in
  [task-state-contract.v1.json](task-state-contract.v1.json). Fable has advice
  authority only; it never substitutes for fresh Opus or PM acceptance.
- Every `recorded_at` value ending in `Z` is true UTC. Where local operator time
  matters, add a separate ISO-8601 `recorded_at_local` with numeric offset;
  Codex rollout filenames may use the local calendar even though their
  `session_meta.timestamp` value is UTC.
- Until Heca's Codex `auto` permission queue is re-proven, engineering agents
  use the G-007-recorded full-access outer posture only in dedicated worktrees
  with exact path, trailer, diff-audit, Opus, and PM controls. This never
  weakens or proves the product worker sandbox required by RDY-20.

⟦AI:FKST⟧
