# FKST Console — Live E2E Recovery Blueprint

Status: execution-authoritative from 2026-07-22 07:35 SGT. Reconciled read-only by Fable PM with verdict `FABLE_PM_RECONCILIATION=PASS`. This supersedes the expired deadlines in `BUILD-WEEK-2H.md`; it does not retroactively change that plan's acceptance record.

## Objective and claim boundary

Turn the verified recorded-data console into an honestly demonstrated local end-to-end application while preserving the existing fixture judge path. Exactly two FKST product dependencies remain:

1. `fkst-substrate`, observed through its public `fkst-framework` CLI contract; and
2. the public devloop in `ChronoAIProject/fkst-packages`, used as guidance and an external Workflow evidence/health source rather than copied or reimplemented as a third engine.

Workflow and Council remain the application's product mechanisms and authority. Devbored remains provenance-bound reference material only. Node, pnpm, React, Vite, `gh`, and a browser are implementation toolchain/runtime dependencies, not additional FKST product dependencies.

The current maximum truthful live claim is:

> An authenticated, read-only BFF served a real populated snapshot containing five open issues and one open pull request from `ChronoAIProject/fkst-packages`, and the Vite `/api` proxy returned that snapshot to the app origin. A separate deterministic Chrome/CDP test proves the controlled fake-backed Vite+BFF browser topology. Real-GitHub-backed browser rendering, Council acquisition, Workflow execution, successful devloop health, substrate observation, and a full end-to-end run have not yet been demonstrated.

No real mutation is authorized by this plan. The guarded issue-admission route stays disabled unless a human separately approves the exact sandbox repository and single write attempt.

## Verified baseline

- Direct integration target: `main`, preserving the unrelated prior lineage through an unrelated-history merge.
- Published 07:44 recovery checkpoint: `562a675750deecf54da747daf0f6242aaaac2754`.
- Fixture path: `pnpm demo` on `127.0.0.1:4173`; verified and intentionally disconnected from live services.
- Populated read source: `ChronoAIProject/fkst-packages`, trusted marker author `ElonSG`.
- Read-only BFF probe on a non-conflicting port returned `posture=read-only`, `write.available=false`, five issues, one PR, and complete trusted-marker filtering.
- The same snapshot was returned through Vite's same-origin `/api/v1/snapshot` proxy.
- Council returned `council_source_not_configured`.
- Runtime returned `observe_not_configured`.
- Devloop health returned `health_not_configured` in that BFF run.
- A direct public-devloop health attempt found the pinned substrate source but returned unavailable because no `delivery.redb` durable root exists.
- Two real-GitHub browser attempts failed and remain failure evidence. A later controlled fake-backed Chrome/CDP run passed the browser-topology contract; it is not real-GitHub or browser E2E proof.
- The unrelated process already occupying port 8472 and pre-existing untracked files in the packages checkout are outside this plan and must not be modified.

## Dependency graph and parallel waves

```text
E0 truth + no-write gates ──────────────────────────────────────────────┐
├── E1 configurable live startup ── E4 browser live-DOM proof ─────────┤
├── E2 GitHub preflight ─────────── E3 populated live Workflow read ───┤
├── E5 durable-root lifecycle ───── E6 substrate/runtime observation ──┤
├── E7 public-devloop health/Workflow observation ─────────────────────┤
└── E8 Council source decision ───── Council acquisition ──────────────┤
                                                                        ├── E9 one-run E2E
Packaging, CI, README, and evidence run alongside every wave ──────────┘
```

Work that touches disjoint paths may run in parallel. Integration is serial: each stream supplies a focused commit, exact tests, and remaining limitations; the main PM reviews and cherry-picks it, runs the aggregate gate, and returns failures to the owning stream.

## Work packages

### E0 — Truth, security, and dependency invariants

Owner: main PM. Status: continuous gate.

Acceptance criteria:

- Fixture, proxy-level live, browser-live, and full-E2E evidence are named separately.
- Default and test posture stays read-only; test execution performs no external mutation.
- Only the guarded `POST /api/v1/issues` route can mutate, and it remains unavailable without every existing guard.
- No browser token, permissive CORS, shell-string execution, symlinked dependency, vendored devloop engine, or Council/runtime fabrication is introduced.
- All absolute local paths stay in operator examples/evidence only and never become shipped defaults.

Verification: `pnpm check`, targeted negative-write tests, `git diff --check`, and manual review of README/evidence wording.

Rollback: reject or revert the focused stream commit; never weaken a guard to make a demo pass.

### E1 — Configurable one-command live startup

Owner paths: `scripts/dev.mjs`, root scripts/config documentation, and focused tests. **Status: complete and contract-tested.**

Context: the current launcher removes `FKST_CONSOLE_PORT` and hard-codes BFF port 8472, so it cannot avoid an existing local service.

Acceptance criteria:

- Operators can select non-conflicting BFF and Vite loopback ports without editing source.
- The selected BFF target is passed to Vite's same-origin proxy and survives child-process startup.
- Defaults remain backward compatible and loopback-only.
- Invalid/non-loopback targets fail closed.
- Startup and cleanup are covered by tests; no existing process is killed.

Verification: targeted launcher tests plus a real read-only launch on alternate ports and `curl` of the app-origin session/snapshot routes.

Rollback: revert only the launcher/config commit; manual two-terminal startup remains available.

### E2 — Read-only live preflight

Owner paths: one focused script/CLI entry, tests, and operator documentation. **Status: partially complete.** GitHub actor/projection, substrate-observe, and public-health source probes are implemented; BFF-configuration and Council-source checks are not represented and remain acceptance work.

Acceptance criteria:

- A single command ultimately reports GitHub auth/repository/marker access, BFF configuration, substrate binary/durable-root readiness, public-devloop health readiness, and Council-source readiness. The current report contains only `github`, `observe`, and `health`.
- It uses the application's real adapters or exact commands rather than an invented second implementation.
- Expected unavailable sources are structured and non-zero only when they prevent the requested live profile.
- Output contains no credentials and performs no GitHub/FKST product mutation, service start, durable-root initialization, or repository mutation. A configured public health script may retain its documented bootstrap/build/cache side effects.
- Tests use local fakes; one real run can be recorded separately as evidence.

Verification: focused unit/black-box tests, `pnpm preflight:live -- --help`, a read-only real run, and repository scrub.

Rollback: remove the command without changing adapter behavior.

### E3 — Populated live GitHub Workflow read

Owner: GitHub adapter/UI integration stream. Status: proxy-level proof complete; browser proof remains in E4.

Acceptance criteria:

- Authenticated read of the configured repository returns a bounded current-open set.
- Trusted-author filtering precedes marker parsing; unknown/malformed markers fail closed.
- UI model reports five issues and one PR for the recorded July 22 probe without presenting polling as history.
- Session shows read-only posture and unavailable writes.
- Evidence records repository, normalized actor, command shape, counts, timestamp, and limitations—but no token.

Verification: existing adapter contracts plus the BFF and same-origin proxy probes. Counts are evidence for that timestamp, not a permanent test expectation.

Rollback: retain synthetic contracts and report live acquisition unavailable.

### E4 — Browser-rendered live UI proof

Owner paths: app integration/browser tests and minimal fixes required by the live path. **Status: partial.** Controlled fake-backed browser topology is contract-tested; the separate real read-only GitHub browser evidence run has not passed.

Acceptance criteria:

- A clean browser session opens the live Vite origin and visibly leaves the loading state.
- Workflow renders at least one real issue and one real PR from the BFF snapshot.
- The page visibly identifies local live/read-only posture and truthfully shows Council and Runtime as unavailable.
- Network evidence shows `/api/v1/session`, `/snapshot`, and `/events` use the same-origin proxy; fixture JSON is not the selected source.
- Console contains no uncaught application error; browser process and temporary profile are reaped.

Verification: automated browser test with a controlled fake for CI, followed by a separate real read-only browser evidence run. A `curl` proxy response alone cannot pass E4.

Rollback: keep E3's proxy-level claim and document browser proof as blocked.

### E5 — Durable-root lifecycle and human gate

Owner: substrate/operator stream. **Status: partial.** Lifecycle/human gating and precise missing/invalid/inaccessible classifications are implemented and tested. No initialization was authorized; stopped-engine and successful real-observe acceptance remain unproved. This is an external-state prerequisite, not permission to initialize or mutate a durable root.

Acceptance criteria:

- Document the exact supported command that creates/locates a disposable durable root and which action is state-changing.
- Preflight distinguishes missing root, invalid root, engine stopped, and successful observation.
- Human approval is requested before initializing, replacing, or running an engine against a durable root.
- No code directly opens `delivery.redb`; observation remains through `fkst-framework observe --json`.

Verification: read-only CLI help/contract inspection first; disposable-root execution only after approval.

Rollback: remove disposable artifacts using the substrate's supported lifecycle and leave user roots untouched.

### E6 — Live substrate Runtime observation

Depends on E5. **Status: blocked on a human-approved initialized disposable root; no live Runtime evidence exists.**

Acceptance criteria:

- The configured release binary and approved disposable durable root produce a real `fkst.delivery.observe.v1` response.
- The BFF and browser render source age, queue depth, dead letters, subscriber state, and delivery rows without turning absence into zero.
- Stopped/unavailable states degrade honestly and never start, retry, requeue, or control the engine.

Verification: adapter contract, real read-only CLI capture, BFF snapshot, browser rendering, and cleanup proof.

Rollback: remove Runtime configuration and return to explicit unavailable state.

### E7 — Public-devloop health and Workflow observation

Owner: devloop adapter/operator stream. **Status: partial.** Fake contracts and real missing-state failure evidence exist; no successful public health result against an approved initialized root exists.

Acceptance criteria:

- Integration invokes the public checkout's documented interface; it does not copy or hard-reimplement its loop.
- Health stdout is preserved verbatim and the recognized verdict comes only from the documented first-line contract.
- Workflow remains the console mechanism/authority; public devloop behavior is guidance and external evidence.
- Missing durable state or non-zero exit becomes explicit unavailable/error evidence.

Verification: fake contract tests, then an approved real invocation using the pinned checkout and the E5 disposable root.

Rollback: omit health configuration; GitHub Workflow read remains independently usable.

### E8 — Council source decision and acquisition

Owner: main PM. **Architecture decision complete; acquisition incomplete.** The required fresh Codex GPT-5.6 Sol reconciliation completed with `SOL_COUNCIL_DECISION=PASS`; [`docs/COUNCIL-AUTHORITY.md`](../docs/COUNCIL-AUTHORITY.md) is the binding implementation decision. No `github-markers` Council adapter, live producer record, complete seat roster, or real dissent evidence has been implemented or demonstrated.

Context: no live Council module/source currently exists. Trusted GitHub producer records are canonical, substrate is corroborating delivery evidence only, and the console remains a read-only projection. Producer schema/deployment and real marker emission stay human-gated.

Acceptance criteria:

- Record a small decision specifying Council evidence producer, schema, admission/identity rules, repository/runtime ownership, failure semantics, and why it preserves exactly two primary dependencies.
- Council remains a first-class app mechanism and decision authority, not a decorative prompt/persona panel.
- Acquisition is read-only, independently attributable, admits dissent, and reports unavailable rather than synthesizing a decision.
- Contract tests cover admitted decision, dissent, malformed/untrusted evidence, and unavailable source.

Verification: decision audit, contracts, BFF snapshot, browser Council view, and aggregate checks.

Rollback: keep recorded Council fixtures and explicit live-unavailable state.

### E9 — One-run local E2E and release checkpoint

Depends on E1–E8. **Status: not met.** A read-only rehearsal can precede any separately approved write.

Acceptance criteria:

- One documented command (or one command plus explicit preflight) starts the app on loopback with the approved live sources.
- Browser shows a real Workflow item, Council evidence, and substrate Runtime evidence for one coherent run.
- Every source has visible timestamp/posture/availability; no layer silently substitutes fixture data.
- If a real issue admission is requested, the human approves the exact repository and payload immediately before the one guarded operation; receipt URL/actor are recorded and no other mutation occurs.
- `pnpm check`, clean-checkout instructions, repository scrub, browser smoke, and GitHub CI pass.
- README states only behavior reproduced from the accepted commit and lists external Devpost/hosting/video/eligibility gates separately.

Rollback: preserve the last green candidate branch and publish blockers instead of rewriting the claim.

## Historical deadline checkpoint for 07:45–08:00 SGT

At 07:45 the active implementation streams stopped exploration and returned one of:

- a focused commit plus exact passing/failing tests and limitations; or
- `BLOCKED` with reproducible evidence and no speculative partial patch.

The main PM reviewed the first-wave diffs and tests, integrated only accepted commits, updated truth documentation, and published the green `562a675750deecf54da747daf0f6242aaaac2754` checkpoint at 07:44 SGT. Post-08:00 recovery work started from that remote checkpoint in new focused streams; later integration never rewrites the historical checkpoint.

## Plan mutation protocol

- New evidence may change task status, ordering, or the truthful claim ceiling; it cannot remove E0 security/truth gates.
- A task that discovers a cross-cutting authority decision returns to the main PM before coding it.
- Any new product dependency requires explicit user approval and an update to the two-dependency invariant; toolchain packages do not count as product integrations.
- Failed real-path probes are retained as unavailable/blocker evidence and are never rewritten as synthetic success.
- When parallel streams overlap a file, the main PM chooses one owner and has the other return findings instead of competing edits.
- A fresh reviewer is required for security/authority changes and the final E9 claim, but routine focused commits may use main-PM review to preserve velocity.

## Anti-patterns

- Calling port 4173 live or E2E.
- Calling an API `curl` a browser proof.
- Starting or mutating substrate state while claiming observation-only behavior.
- Treating GitHub labels as authoritative Workflow state.
- Turning an unavailable Council/runtime/health source into zeros or fixture values.
- Adding a third service, vendoring public devloop code, or cloning devbored as an engine.
- Weakening write guards, using a real mutation in tests, or accepting repository-wide credentials.
- Hiding failing probes or absolute developer paths in shipped configuration.
