# FKST Console — Two-Hour Demo Construction Plan

Status: historical execution record through the 07:00 SGT hard stop on 2026-07-22. The current execution authority is `LIVE-E2E-RECOVERY.md`.

## Objective

Deliver a coherent, locally runnable web console that demonstrates the FKST devloop through Workflow and Council. It must run without credentials from recorded fixtures and may connect to local `fkst-substrate` plus GitHub through a loopback BFF. It is a demo candidate, not a production-complete application.

## Governing sources

- `../HANDOFF.md`
- `../PM-PLAN-DEVLOOP-UI.md` sections 0, 3, 4, 7, and 8
- `../CONSOLE-CONTRACTS.md`
- `../SOL-BUILD-BRIEF.md`
- `../fe-blueprint/DESIGN.md`

The two primary dependencies remain `fkst-substrate` and the public devloop. Devbored is reference-only provenance. Workflow and Council are the product mechanisms and authority.

## Release boundary

Included:

1. React/Vite/TypeScript frontend with board, pull-request lane, evidence, Council decisions, runtime health, posture, work detail, and New Work.
2. Static fixture mode that works with no BFF, GitHub, or substrate and visibly identifies recorded data.
3. Loopback Node/TypeScript BFF that exposes a normalized snapshot, SSE updates, health/session information, and local substrate observation.
4. Exactly one optional mutation: create one GitHub issue and add `fkst-dev:enabled` in the same operation, behind all required guards.
5. One-command demo/dev/build/test entry points, README judge path, security posture, and known limitations.

Excluded:

- Database, engine control, topology/configuration writes, arbitrary shell execution, issue edits, PR mutations, merges, label-only mutations, and claims of complete historical truth.
- Browser-side GitHub tokens or browser-side substrate process access.
- Flutter/Dart application code.

## Dependency graph

```text
S0 contract freeze
├── S1 frontend and fixtures ─────────┐
├── S2 BFF, substrate, GitHub guard ──┼── S5 integration ── S6 PM acceptance
├── S3 packaging and runbook ─────────┤
└── S4 black-box/security/UX tests ───┘
```

S1–S4 execute concurrently. S5 begins as soon as the first runnable slices land; it does not wait for perfection.

## Streams and acceptance criteria

### S0 — PM contract freeze

Owner: main PM. Deadline: 04:35 SGT.

Acceptance:

- This plan is present and is the execution authority.
- Agents have exclusive path ownership and no per-task Opus gate.
- The final claim is limited to demonstrated behavior.

### S1 — Frontend and fixture mode

Owner paths: `app/**` only. Model: GPT-5.6 Sol.

Tasks:

- Build the cohesive responsive console and locked visual tokens.
- Add fixture/live source switching, loading/empty/stale/disconnected/error states, work detail, and accessible interaction.
- Keep fixture data in the frontend build so the static judge route has no service dependency.

Acceptance:

- `pnpm --filter app build` and typecheck pass.
- Fixture mode renders useful, internally consistent Workflow/Council data without network access.
- A persistent recorded-data banner prevents fixture/live confusion.
- Keyboard focus, dialog semantics, labels, and mobile layout are demonstrably usable.
- No secrets, direct GitHub calls, substrate process calls, gradients, glows, or Flutter/Dart code.

### S2 — BFF, substrate observation, and GitHub guard

Owner paths: `server/**` and `demo/**` only. Model: GPT-5.6 Sol.

Tasks:

- Implement loopback-only HTTP/SSE endpoints and normalized snapshot contract.
- Parse only the three allowed marker schemas after trusted-author filtering.
- Observe substrate honestly; unknown remains `null`/unknown, never fabricated zero.
- Implement exactly one GitHub issue-creation operation with the enable label and every required guard.

Acceptance:

- BFF binds `127.0.0.1`; no CORS; GET-only reads and POST-only mutation.
- Mutation requires `--enable-writes`, exact repo allowlist, per-launch token, Host/Origin checks, authenticated human actor unequal to the normalized bot actor, and safe argv-only process execution.
- Default startup is read-only, test execution never performs a live write, and the response surfaces actor plus created issue URL.
- Delivery fields preserve kebab-case and source kinds preserve PascalCase; absent `has_current_subscriber` is not converted to null.
- Unit/contract tests pass and include negative guard cases.

### S3 — Packaging and judge runbook

Owner paths: root files, `scripts/**`, `docs/**`, and `.github/**`; must not edit `app/**`, `server/**`, or `demo/**`. Model: GPT-5.6 Sol.

Tasks:

- Create deterministic workspace scripts for install, demo, dev, build, test, and start.
- Add Apache-2.0 license, configuration example, README architecture, five-minute judge path, live prerequisites, security boundary, provenance, attribution, and known limitations.
- Add non-destructive smoke and repository-scrub scripts.

Acceptance:

- A clean checkout has documented commands that match package scripts exactly.
- Fixture demo needs no GitHub/substrate credentials.
- README says local web console, not Flutter/Dart, and distinguishes implemented/live/fixture behavior.
- Required submission links may be explicit placeholders but cannot masquerade as completed.

### S4 — Black-box, UX, and security verification

Owner paths: `test/**` and findings sent to owners; no silent edits to owned paths. Models: GPT-5.6 Sol agents.

Tasks:

- Exercise fixture boot, live-disconnected behavior, BFF health/snapshot/SSE, and mutation denial paths.
- Review user-visible truthfulness, responsive/keyboard behavior, and write-boundary implementation.

Acceptance:

- Tests fail on any real network write attempt.
- At least one smoke test proves fixture mode; one proves BFF loopback; guard tests cover missing flag/token/origin/repo/actor conditions.
- Findings name file, behavior, severity, and exact acceptance criterion; owner reworks blockers.

### S5 — Integration

Owner: integration Sol, with main PM resolving overlaps. Target: first candidate by 06:15 SGT.

Acceptance:

- Fresh install, typecheck, build, unit/contract tests, smoke test, and repository scrub pass from the worktree.
- Static fixture path and BFF-backed path share one UI model.
- At least one local screenshot is inspected at desktop and mobile width.
- No uncommitted generated artifacts, credentials, absolute developer paths, or unintended writes.

### S6 — PM acceptance and hard stop

Owner: main PM; Fable may advise if available. Window: 06:15–07:00 SGT.

PM passes only if:

- The documented fixture command opens a navigable demo.
- The documented live command starts the BFF and degrades honestly when substrate/GitHub are unavailable.
- Every observed claim is supported by fixture labels or executable evidence.
- The only mutation is the guarded GitHub admission action.
- Known bugs are listed with severity and do not prevent the five-minute judge path.

At 07:00 SGT all implementation agents are stopped. The PM records the exact commit/status, passing and failing commands, runnable URLs, live prerequisites, known bugs, and recovery instructions. No completion claim is made for untested behavior.

## Plan mutation protocol

- If live substrate discovery cannot be normalized by 05:45, preserve the honest disconnected state and prioritize fixture coherence.
- If the live GitHub dry-run contract is not safe by 06:00, ship the UI disabled and retain server tests; do not weaken guards.
- If React integration misses 06:15, use the already verified static devbored demo as a recovery shell while preserving the new BFF boundary.
- Scope can be removed by the PM to protect the five-minute judge path; security/truthfulness criteria cannot be removed.

## Rollback

All work is isolated on `codex/build-week-mvp`. The source repository and prior worktrees remain unchanged. The initial commit `9308b5a018af28049c35517946aaae113e323c20` is the rollback point.
