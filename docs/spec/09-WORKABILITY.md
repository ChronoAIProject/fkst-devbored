# End-to-end workability ledger

Status: **AUTHORITATIVE FEATURE TRACE — TIERED DELIVERY AT T0**
Version: `full-app/v2`
Audited: 2026-07-21

This ledger prevents a screen, task, or passing unit test from being mistaken
for a working feature. A feature is workable only when its user intent reaches
a real application use case, admitted external/runtime seam, authoritative
effect or fact, trusted evidence, recovery path, and end-to-end acceptance.

Legend:

- **SPECIFIED**: the complete target path and failure behavior are defined.
- **PARTIAL**: some real dependency seams exist, but the app seam/proof is absent.
- **BLOCKED**: a required seam, contract, or executable proof is missing.
- **GATED**: the feature must be absent until its named dependency gate passes.
- **PASS**: reserved for executable accepted evidence, not source inspection.

## Feature paths

| Feature/user intent | Presentation → application path | Runtime/infrastructure path | Authoritative result/evidence | Current status and closure |
|---|---|---|---|---|
| Create/select a connection | Setup ViewModel → connection use cases | preferences repo + compatibility parser | canonical connection revision | SPECIFIED; C/B/P tasks, Step-0 manifest absent |
| Provision repository | Setup ViewModel → provision-clone use case | argv-only managed-clone adapter + proven composition/Git-root seam | qualified HTTPS origin/branch/head with clean control-file sentinels | BLOCKED; A-016/R-044/R-046/R-056 absent; never use a user checkout |
| Prove dependencies/tools | Doctor ViewModel → Doctor use case | substrate/devloop/git/gh/Codex probes | revision-bound Doctor report | PARTIAL; source/auth inventory exists, complete child/host proof absent |
| Browse Workflow catalog | Workflow ViewModel → catalog query | typed definition repository | source/schema/id/version/digest/validation | SPECIFIED; C-019 and frozen corpus absent |
| Edit/save Workflow | Workflow editor ViewModel → draft/diff/save commands | draft repo + CAS file service | desired next-launch file + audit | SPECIFIED; schema/corpus/consumer absent |
| Browse/edit Council | Council ViewModel → catalog/draft/diff/save commands | definition/draft repo + CAS file service | deterministic seats/policy/digest | SPECIFIED; schema/corpus/consumer absent |
| Validate Council decision | Council policy/domain functions | structured seat verdict reducer | approved/changesRequested/inconclusive + dissent | SPECIFIED; Dart/Lua parity and real Codex round absent |
| Route Council/rework outcomes | Workflow detail → read-only route explanation | manifest-frozen `issueCouncilDelivery` transition family | chained transition envelope + monotone attempt/transition/cycle counters | SPECIFIED; family fixtures and integrated consumer absent |
| Accept configuration | Workflow/Council ViewModels → accept command | immutable launch snapshot → direct no-effect substrate `run` | bounded direct receipt binding revision/package/graph/config/launch; `acceptedForNextLaunch` only | BLOCKED; R-043/R-024/R-025/A-017/L-020 absent |
| Start loop | Runtime ViewModel → runtime lifecycle port/use case | canonical six-root profile + non-escalating Git/Codex grants → contained outer job using accepted snapshot → bootstrap | launch intent + same snapshot/profile supervised receipt before `active`; prior cleanup verified zero | BLOCKED; R-043/R-047/R-048/R-054/R-057/R-058/R-052/D-004/A-018/C-021/C-022/L-006 proof absent |
| Stop/restart | Runtime ViewModel → runtime lifecycle port/use case | proven outer job + public proxy-free restart seam; fresh runtime, stable durable | identity-safe zero-survivor + bounded exit/crash/replay receipts; unknown/nonzero cleanup becomes fatal `cleanupFailed` and blocks new launch | BLOCKED; R-050/R-055/R-057/R-058/C-022 and executable lifetime proof absent |
| Discover/admit work | Work query + loop intake | qualified GitHub reads + public devloop identity/validation/claim | trusted admission envelope + GitHub facts | PARTIAL; public modules exist, app graph/probe absent |
| Claim work | loop package only | public devloop label claim API; assignee config rejected | fresh qualified label fact + effect audit | PARTIAL; label source exists, label-only app proof absent |
| Run Council stage | Council-run query + loop Council orchestration | substrate Codex primitive + fixed lens prompts | trusted comment envelope with per-seat execution/verdict/provenance | BLOCKED; app package/evidence carrier/real round absent |
| Implement | Work detail + loop implementation stage | public worktree/Git seams + substrate Codex | app envelope + Codex provenance + qualified commit/head | PARTIAL; primitives exist, integrated seam proof absent |
| Commit/push/open PR | Work detail projection; no Flutter mutation | public devloop Git/PR command seams under LIVE guard | qualified branch/head/PR link + effect receipts | PARTIAL; public primitives found, idempotent app flow not proven |
| Review exact head | Council run/Work detail | Council review + public head/CI/gate seams | head-bound seat verdicts/decision/gate envelope | PARTIAL; public facts/gates exist, app integration absent |
| Post durable loop evidence | projections parse after trust | admitted public direct comment effect; no proxy queue | app marker/envelope permalink, digest chain, effect receipt | BLOCKED; direct command exists, envelope/reconcile/replay proof absent |
| Automatic merge | Runtime/Detail only when compatibility admits it | optional public exact-head recheck/merge/reconcile API | GitHub merged fact + public effect receipt + terminal envelope | GATED; R-042/R-053 must resolve to an admitted pin; not required for hold-only v1 |
| Operator merge fallback | Detail shows Ready for operator merge | no app merge effect | exact-head gate evidence + explicit `hold` terminal | SPECIFIED; shippable fallback if automatic merge remains gated |
| Human create issue/comment | guarded composer → human-write use case | separate operator-context adapter | GitHub URL/actor + bounded local audit | SPECIFIED; W/B/P tasks and sandbox proof absent |
| Observe work | Work/Council/Overview queries | bounded GitHub/git + trusted envelope adapters | atomic qualified generation with source/as-of/completeness | SPECIFIED; adapters/projections absent |
| Observe runtime | Runtime ViewModel → application runtime query/refresh use case → D-004 port | documented substrate observe JSON adapter only | acquisition/freshness/completeness + delivery snapshot, never work progress | PARTIAL; source fixture exists, but D-004/A-007/B-005 port-to-use-case path and frozen compatibility adapter are absent |
| Operate several connections | Fleet ViewModel → fleet use cases | fair scheduler, isolated roots/contexts/rate pools | per-connection freshness/degradation | SPECIFIED; implementation/failure drill absent |
| Recover local store | Recovery ViewModel → explicit recovery commands | backup-first SQLite repository | preserved original + restore/export/new-store result | SPECIFIED; implementation/drills absent |
| Export diagnostics | Settings ViewModel → preview/export command | redaction/size/path-safe exporter | preview + bounded export audit, no secrets/bodies | SPECIFIED; implementation/secret scan absent |
| Install/release | documented operator flow | signed/notarized app + external exact dependency/tool discovery | clean Finder launch and release dossier | BLOCKED; application/artifact/remote/submission evidence absent |

## Resolved design gaps

The 2026-07-21 workability pass changed the design rather than leaving these as
implementation guesses:

1. Defined the compatibility-manifest contract that every layer had referenced.
2. Replaced hot reload with stopped-only immutable launch snapshots.
3. Defined a no-effect direct-run configuration acceptance receipt.
4. Chose qualified GitHub comments as durable per-work app evidence and kept
   launch/config acceptance as a separate local process fact.
5. Added dedicated managed-clone provisioning and a user-checkout prohibition.
6. Made Council decisions deterministic over structured bounded seat verdicts.
7. Gated automatic merge on a missing public exact-head devloop capability;
   the honest fallback is an operator-merge hold.
8. Enforced presentation → application → domain-port dependency direction with
   infrastructure wired only at one composition root.
9. Grouped the UI around Operate, Design, System, and Settings, with readiness/
   dependencies/connections/Doctor inside one Setup flow.
10. Replaced the underspecified ordered-stage list with a manifest-frozen,
    exhaustive outcome-route family and bounded Council/review/CI rework.
11. Defined the concrete evidence-fact union and removed the impossible
    pre-create permalink from canonical evidence; carrier confirmation now
    requires an immutable qualified comment read-back.
12. Split configuration activation into direct preflight, launch intent, and a
    supervised runtime-consumption receipt from the same process/snapshot.
13. Froze v1 claim to label-only and rejected the proxy-coupled assignee path.
14. Added exact safe-current-Codex and executable filesystem-containment gates.
15. Added an executable proxy-free restart gate and a collision-safe
    composition/Git-root disposition.
16. Added a Step-0-proven outer job/lifetime gate, identity-safe zero-survivor
    receipts, and fatal `cleanupFailed` UI/recovery semantics for uncertain or
    nonzero cleanup.
17. Split eight domain-port contracts so presentation reaches external/runtime
    behavior only through application use cases; Runtime now has an explicit
    query/refresh path rather than importing its observation adapter.

## Remaining release blockers

No row may move to PASS from documentation alone. The current blocking chain is:

```text
provider/worktree governance
  → required public devloop visibility + immutable evidence capability
  → required proxy-free restart capability
  → optional merge disposition (admitted pin or hold-only)
  → safe Codex + project-root + filesystem-containment capabilities
  → outer-job/process-lifetime proof + zero-survivor/fatal-state contract
  → compatibility/contracts/evidence corpus
  → minimal app package + direct/supervised host/config acceptance
  → complete seam/effect probes
  → HG-01 fixture-only Flutter/pure-layer authorization
  → R-039 complete Step-0 proof + HG-02 local/DRY authorization
  → layered runtime implementation and deterministic DRY slice
  → HG-03 one controlled LIVE canary
  → HG-04 release-candidate audit/package
  → HG-05 exact Hackathon submission
```

The executable 35-package graph and human gates are in
[`accelerated-human-gated-delivery.md`](../../plans/accelerated-human-gated-delivery.md);
the detailed criteria remain in
[`parallel-engineering-task-map.md`](../../plans/parallel-engineering-task-map.md).

⟦AI:FKST⟧
