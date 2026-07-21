# fkst-devbored full-app specification

Status: **AUTHORITATIVE INDEX — TIERED HUMAN-GATED DELIVERY**
Version: `full-app/v2`
Reorganized: 2026-07-21

This directory is the single entry point for building the complete
`fkst-devbored` application. Work is authorized by the current tier in
[08-READINESS.md](08-READINESS.md): T0 foundation now, T1 fixture-only Flutter
after HG-01, T2 contained local/DRY runtime only after Step 0 and HG-02, and
separate human gates for controlled LIVE, release candidate, and submission.

## Authority order

When two statements conflict, use this order:

1. The checked-out `fkst-substrate` and `devloop` dependency code plus their
   executable tests.
2. This `docs/spec/` set.
3. `plans/accelerated-human-gated-delivery.md` and its machine package map and
   execution contract. They govern current dispatch, review, integration, and
   human tiers but may not override this specification.
4. `plans/full-app-construction.md` and
   `plans/parallel-engineering-task-map.md` as the retained technical blueprint
   and 211-node requirement/evidence registry.
5. Accepted ADRs that are not superseded by this specification.
6. The legacy numbered documents under `docs/` as research and rationale.
7. Historical plans and handoffs.

The deadline-critical Build Week submission cut remains in the external
umbrella-workspace file `../../../HANDOFF.md`, with historical Fable context in
the external file `../../../fable_handoff.md`. Those references intentionally
are not repository-local links. They do not define the full desktop product or
relax this specification's runtime gates.

The current deadline, readiness, claim ceiling, and next human decision are
summarized in [10-HACKATHON-STATUS.md](10-HACKATHON-STATUS.md).

## Exactly two primary dependencies

The app has exactly two primary FKST dependencies:

1. **`fkst-substrate`** — engine, package execution, process/runtime, delivery
   ledger, observation, and Codex worker primitive.
2. **`devloop`** — the reusable development-loop library/capability integrated
   by a thin FKST package that lives in this app repository.

The whole `fkst-packages` platform is not dependency 2. The physical source
distribution currently containing `libraries/devloop` and its declared
transitive libraries may be pinned, but the app may import only the public
`devloop` surface and its declared closure. Existing packages such as
`devbored`, `github-devloop`, `github-devloop-workflow`, `consensus`, and
`github-proxy` are reference implementations and compatibility fixtures. They
are not runtime dependencies and are not copied or hard-reimplemented.

GitHub/git are external business authorities; `gh`, `git`, `codex`,
Flutter/Dart, SQLite, and operating-system facilities are services/toolchain,
not additional FKST product dependencies.

## Product mechanism

- **Workflows** are the primary unit of operation: versioned app-owned
  definitions select and sequence bounded development work.
- **Council** is the primary deliberation/configuration mechanism: it assigns
  named seats and decision policy to workflow stages and exposes their actual
  evidence.
- The integrated loop package adapts those app-owned contracts to public
  `devloop` APIs and substrate primitives. It must remain thin; copied marker,
  claim, restart, gate, Git, or convergence logic is a failed architecture.
- Current devloop packages are used to learn invariants and build differential
  fixtures, not as the product topology or UI contract.
- Flutter enforces presentation → application → domain-port dependency
  direction; infrastructure is wired at one composition root.
- V1 uses immutable per-launch Workflow/Council snapshots and a no-effect
  config-acceptance receipt; it does not hot-reload.
- Durable work evidence uses trusted app envelopes in qualified GitHub
  comments. Automatic merge requires a public exact-reviewed-head devloop
  effect and is otherwise a truthful operator hold.

## Reading order

1. [00-PRODUCT.md](00-PRODUCT.md) — product and operating loop.
2. [01-DEPENDENCIES.md](01-DEPENDENCIES.md) — exact two-dependency boundary.
3. [08-READINESS.md](08-READINESS.md) — verified-present/missing ledger and no-code gate.
4. [02-ARCHITECTURE.md](02-ARCHITECTURE.md) — process, layer, storage, and data flow.
5. [03-REQUIREMENTS.md](03-REQUIREMENTS.md) — normative behavior and acceptance.
6. [04-DATA-CONTRACTS.md](04-DATA-CONTRACTS.md) — typed app seam and authority map.
7. [05-UX-SPEC.md](05-UX-SPEC.md) — Workflow/Council-first screens and states.
8. [06-SECURITY-OPERATIONS.md](06-SECURITY-OPERATIONS.md) — writes, lifecycle, and release.
9. [07-TRACEABILITY.md](07-TRACEABILITY.md) — requirement-to-source/test map.
10. [09-WORKABILITY.md](09-WORKABILITY.md) — every user feature traced through
    use case, real seam, evidence, recovery, and present blocker.
11. [../../plans/accelerated-human-gated-delivery.md](../../plans/accelerated-human-gated-delivery.md) —
    current 35-package execution plan and five human milestones.
12. [../../plans/full-app-construction.md](../../plans/full-app-construction.md) —
    retained technical construction blueprint.
13. [../../plans/parallel-engineering-task-map.md](../../plans/parallel-engineering-task-map.md) —
    retained 211-node requirement/evidence registry and detailed criteria.
14. [evidence/governance/README.md](evidence/governance/README.md) — machine-observed
    orchestration bootstrap evidence; never a substitute for Step-0 evidence.

## Settled decisions

- Full app: Flutter desktop, macOS primary, Linux best-effort.
- One local app process; no embedded HTTP server/listener.
- The app owns lifecycle only through the verified outer job/launcher it
  initiated; that launcher manages the supervisor/descendants, and Flutter
  never directly controls inferred child PIDs.
- GitHub/git own business state; substrate owns the delivery ledger.
- No direct redb/socket access, queue mutation, fabricated state, or unknown-to-zero.
- No runtime dependency on the existing `devbored` package or its supporting
  event packages.
- No code invents mocked Workflow/Council semantics. HG-01 fixture UI uses only
  frozen executable app-owned contract fixtures and cannot claim runtime truth.
  A loadable thin integration and complete Step-0 evidence remain mandatory
  before HG-02 can authorize runtime-connected code.

## Change protocol

A change to an authority invariant, dependency boundary, write surface, or
serialized contract requires:

1. a superseding ADR in `docs/08-DECISIONS.md`;
2. updates to the affected authoritative spec files;
3. an update to `07-TRACEABILITY.md` and `08-READINESS.md`;
4. executable evidence or a clearly red missing-capability row; and
5. a version bump for an incompatible contract change.

Historical documents preserve evidence; their banners point here and they do
not regain authority through repetition.

⟦AI:FKST⟧
