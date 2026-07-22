# Full-app traceability and decision map

Status: **AUTHORITATIVE**
Version: `full-app/v2`

## Requirement traceability

| Requirements | Authority | Required evidence | Step |
|---|---|---|---:|
| DEP-1..4 | `01-DEPENDENCIES.md`, substrate/devloop pins, ADR-031 | graph/import/visibility/read-only-root tests | 0 |
| RDY-1..3 | `03-REQUIREMENTS.md`, `08-READINESS.md` | complete Step-0 bundle + adversarial pass | 0 |
| APP-1..3 | Flutter target + OS job/process APIs | packaged launch, listener, hostile parent-death, and cleanup tests | 1, 2, 10 |
| ARC-1..4 | layered architecture + import rules | dependency-direction lint, composition-root and hostile-import tests | 1..10 |
| CON-1..5 | connection contract | Doctor/tool/auth/label-claim/config matrix, managed-clone/composition safety, fleet isolation | 0, 2, 8 |
| WFL-1..4 | app Workflow schema + integrated consumer | Dart/Lua fixtures, digest/CAS/activation/run tests | 0, 4, 6, 9 |
| COU-1..5 | app Council schema + integrated consumer/evidence | field-consumption, deterministic-decision, round/evidence, CAS/activation tests | 0, 4, 6, 9 |
| RUN-1..8 | direct substrate/app-package host contract | provenance/effect/ownership/launch-snapshot+filesystem-profile/preflight/runtime-ack/Codex-sandbox/exact-head/fresh-runtime/restart drills | 0, 4, 9 |
| OBS-1..4 | substrate observe + GitHub + app evidence schemas | raw fixture/trust/truncation/unknown tests | 0, 3, 5 |
| WRK-1..3 | qualified projections | grouping/provenance/sandbox hand audit | 5, 9 |
| HIN-1..4 | dual write surfaces/policies | actor/allowlist/effect/ambiguity matrix | 0, 7, 9 |
| SAF-1 | runtime filesystem containment | six bounded templates, canonical launch profile, root-confined/non-escalating broker, managed-Git/Codex grant, escape/quota and admitted-effect matrix | 0, 4, 9 |
| SAF-2 | owned-process lifetime containment | outer job/launcher parent/control-death, escalation, descendant/detach/PID-reuse, zero-survivor and fatal-state matrix | 0, 2, 4, 9, 10 |
| UX-1..4 | `05-UX-SPEC.md` | gallery, keyboard/contrast, surface-to-E2E map | 1, 5, 6, 9 |
| DAT-1..3 | local store classification | secret/cache/migration/corruption tests | 2, 10 |
| REL-1..3 | spec/readiness/release policy | dossier, signed clean launch, all rows green/absent | 0..10 |

The normative requirement family `RDY-1..3` is distinct from the readiness-
ledger row identifiers `RDY-01..25`. All 25 ledger rows in
`08-READINESS.md` are independently gated and evidenced by R-036/R-039 and
E-009; the leading zero is therefore meaningful in cross-references.

## Requirement-to-task coverage

The 211-node task DAG is the detailed requirement/evidence registry. The
machine package map assigns every node to exactly one of 35 execution packages.
A requirement family is incomplete until its package evidence and final
acceptance/release nodes are integrated; a green focused test alone cannot
close the family.

| Requirements | Primary implementation/proof nodes | Final acceptance nodes |
|---|---|---|
| DEP-1..4 | R-001..R-006, R-020..R-027, R-035, R-041,R-042,R-045,R-051,R-052,R-059, C-008, L-005 | E-002,E-006,E-009,X-004,X-006 |
| RDY-1..3 | G-001..G-007, R-001..R-059 (defined IDs), R-036..R-039 | E-009,E-010,E-011,E-012 |
| APP-1..3 | U-001,U-023,C-003,C-004,C-022,D-004,L-006 | E-004,E-008,X-001..X-006 |
| ARC-1..4 | U-023,D-001..D-008,B-001..B-009,P-012,I-001..I-003 | E-001,E-008,E-009,X-006 |
| CON-1..5 | C-001,C-002,C-007..C-009,C-013,C-016..C-020,A-016,D-001,D-007,B-002,P-001,P-002,F-001,F-002,R-049 | E-004,E-005,E-006,E-009 |
| WFL-1..4 | R-007,R-008,R-011,R-019,R-022,R-024,R-028,R-059,L-001,L-008,L-020,C-010,C-019,B-003,P-003,P-004,P-014 | E-001,E-002,E-003,E-009 |
| COU-1..5 | R-009..R-011,R-017,R-023,R-024,R-031,R-059,L-002,L-004,A-006,B-003,B-008,P-005,P-006 | E-001,E-002,E-003,E-009 |
| RUN-1..8 | R-003,R-018,R-025,R-029,R-033..R-035,R-042,R-043,R-046..R-058,D-004,C-022,A-017,A-018,L-005..L-010,L-012,L-017,L-019,L-020,B-005,P-010 | E-002..E-005,E-009,X-002,X-006 |
| OBS-1..4 | R-002,R-024,R-043,D-003..D-005,A-001,A-004..A-010,A-011..A-015,B-004,B-005,B-008 | E-002,E-006,E-009 |
| WRK-1..3 | A-005,A-006,A-010,B-004,P-007..P-009 | E-001,E-003,E-006,E-009 |
| HIN-1..4 | D-006,L-007,W-001..W-005,B-006 | E-003,E-005,E-009,X-006 |
| SAF-1 | R-028,R-032,R-043,R-048,R-054,C-020,C-021,L-003,L-005,L-006,L-012 | E-004,E-005,E-009,X-002,X-006 |
| SAF-2 | R-003,R-057,R-058,C-022,D-004,L-005,L-006,B-005,P-010 | E-004,E-009,X-006 |
| UX-1..4 | U-002..U-023 (defined IDs), D-001..D-008,B-002..B-009, P-001..P-014 (defined IDs),F-002,F-004,W-004 | E-001,E-008,E-009 |
| DAT-1..3 | C-005,C-006,C-011..C-014,D-007,D-008,F-003,F-004,B-007 | E-007,E-009,X-005,X-006 |
| REL-1..3 | I-001..I-003,E-001..E-012,X-001..X-009 | X-008,X-009 |

Ranges marked “defined IDs” exclude intentionally unused numbers. The task-map
validator resolves actual IDs and fails on duplicates, undefined dependencies,
or cycles. The evidence dossier must expand these family rows to individual
requirements and exact test/commit/artifact links before E-009 can pass.

## Delivery-governance traceability

ADR-034 and
[`plans/accelerated-human-gated-delivery.md`](../../plans/accelerated-human-gated-delivery.md)
govern new execution after HG-00. The machine map traces package → requirement
nodes → exact Sol commit/tests → fresh Opus review → candidate integration →
milestone/human receipt. The PM schedules and mechanically integrates; it does
not add a second full package verdict. Fable advises at architecture and human
milestones. ADR-032 and v1 task states remain immutable authority for already-
dispatched R2 work. Missing role/model/evidence/tier data blocks dispatch; it is
not a documentation warning.

## Two-dependency source inventory

| Contract | Dependency 1: substrate | Dependency 2: public devloop | App-owned |
|---|---|---|---|
| Process/package execution | framework/supervisor contract | — | thin loop package graph |
| Delivery observation | observe CLI/schema | — | bounded adapter/projection |
| Loop invariants | execution primitive only | public claims/markers/gates/restart/convergence/Git APIs actually admitted | Workflow/Council adapter |
| Workflow | static graph constraints to verify | only public reusable seams | schema/catalog/selection/stages |
| Council | Codex worker primitive/evidence transport to verify | only public reusable seams | seats/policy/round/decision evidence |
| Config acceptance | direct no-effect `run` seam | — | immutable launch snapshot + receipt parser |
| Durable work evidence | delivery ledger explicitly excluded | public comment/effect seam must be admitted | app envelope and projections |
| Business facts | explicitly not owned | reusable access semantics only | GitHub/git remain authority |

An entry without executable/source evidence remains a red readiness gate. The
physical devloop distribution's declared library closure is recorded, but app
code imports only `devloop` public modules.

## Reference-only inventory

| Source | Permitted use | Forbidden use |
|---|---|---|
| `packages/packages/devbored` | lessons, differential data fixtures | shipped graph, schema authority, copied orchestration |
| `packages/packages/github-devloop*` | invariant/effect/failure research | runtime dependency or silent default workflow |
| `packages/packages/consensus` | Council design lessons/fixtures | Council runtime/schema dependency |
| `packages/packages/github-proxy` | idempotency/write lessons | runtime mutation dependency |
| former Dart `devbored` contracts | migration/reference fixture evidence | app Workflow/Council wire authority |

Every retained fixture records source path+commit and why the invariant is
portable to public devloop. Production import/graph lint enforces the boundary.

## Full operating-loop coverage

| # | Outcome | Primary surface | Evidence |
|---:|---|---|---|
| 1 | Pin two dependencies and app graph | Readiness/Dependencies | commits, digests, allowed graph/imports |
| 2 | Connect repo/auth/roots/posture | Connections | qualified connection revision |
| 3 | Doctor | Doctor | dependency/tool/auth/schema/effect verdict |
| 4 | Choose Workflow | Workflows | desired schema/id/version/digest and bounded stages |
| 5 | Seat Council | Council | desired schema/id/version/digest and stage policy |
| 6 | Activate contracts | Workflow/Council | CAS materialization + immutable launch snapshot + no-effect acceptance receipt |
| 7 | Start owned substrate run | Runtime | app graph provenance, fresh runtime, owned identity |
| 8 | Seed/admit issue | Work | guarded issue + workflow admission evidence |
| 9 | Deliberate | Council run | trusted rounds/seats/decision/dissent |
| 10 | Implement | Work/Runtime | stage evidence + delivery facts kept distinct + Codex provenance |
| 11 | Correlate PR/head | Detail | qualified link and head-bound facts |
| 12 | Review | Council/Detail | configured policy and trusted review evidence |
| 13 | Add human context | Detail | operator guard and audit |
| 14 | Gate/ship | Detail/Runtime | machine facts + explicit posture + public exact-head merge receipt, or truthful external-merge hold |
| 15 | Inspect/stop | all evidence/Runtime | full provenance + owned cleanup |

## Dependency-gated roadmap

| Feature | Missing proof | Admission gate |
|---|---|---|
| Arbitrary Workflow DAG | dynamic substrate graph contract | versioned graph API/migration/runtime tests |
| Persona prompt authoring | public consumed seat-prompt contract | dependency + app schema and emitted provenance |
| Per-seat/global model/effort | substrate forwarding into Codex | pinned implementation and cross-dependency argv test |
| Semantic Council scoring | structured objection→disposition facts | versioned evidence and mechanical metric tests |
| Delivery history/timeline | substrate historical query | retention/completeness contract |
| Queue controls | substrate mutation/auth contract | safe command, idempotency, audit tests |
| Package health | safe app-owned/side-effect-free source | versioned schema and read-only-root test |
| Extra GitHub mutations | product authorization and narrow guard | explicit scope + sandbox evidence |
| Autonomous merge when exact-head seam is absent | public idempotent/reconciling merge effect | dependency implementation + sandbox replay/effect receipt |

## Legacy disposition

| Legacy source | Retained value | v2 authority |
|---|---|---|
| `docs/00..12` | rationale, UX and dependency research | this spec set |
| `docs/12-DEVBORED-LOOP.md` | reference-package history | public devloop + app package boundary in `01` |
| `docs/plan/` | historical investigations | readiness ledger + construction blueprint |
| `HANDOFF.md`, `fable_handoff.md` | session/submission history | spec index; no architecture authority |
| Build Week briefs | time-boxed submission cut | not full-app runtime architecture |

## Superseded conflicts

| Former statement | v2 resolution |
|---|---|
| Dependency 2 is the whole packages/devbored family | Dependency 2 is public devloop only |
| `devbored` is the shipped loop | It is reference-only; thin loop package is app-owned |
| Council edits `devbored.config.v1` | Council uses an app-owned schema/consumer |
| Workflow equals the `devbored` static pipeline | Workflow is a primary app contract within proven graph bounds |
| Existing package tests prove app readiness | Only new app-graph evidence closes readiness |
| Reference marker state table defines UI | New integrated evidence schema defines state after Step 0 |

## Current blockers

The app has no FKST loop package, no admitted app-package identity in devloop
visibility, no frozen Workflow/Council wire+consumer, no direct substrate host
transcript for the new graph, and no Codex personal-account Doctor probe.
Model/effort forwarding is also absent. These are explicit in
`08-READINESS.md`; no construction step may route around them.

⟦AI:FKST⟧
