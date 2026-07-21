# Parallel engineering task map

Status: **AUTHORITATIVE 211-NODE REQUIREMENT/EVIDENCE REGISTRY — EXECUTION BUNDLED INTO 35 PACKAGES**
Spec: `full-app/v2`
Governance: ADR-034 for new packages; ADR-032 for existing v1 records

This file preserves the exact detailed acceptance vocabulary: **211 unique
task/gate nodes** in an acyclic dependency graph. New execution does not spawn
211 separate review loops. The current
[`accelerated-human-gated-delivery.md`](accelerated-human-gated-delivery.md)
and machine package map assign every node exactly once to 35 cohesive packages.
Each new package has one fresh Sol owner, one fresh independent Opus review,
and a mechanical candidate-integration gate; Fable and humans review milestone
boundaries. The existing row dependencies remain technical/traceability facts.

No v2 package is dispatched until HG-00 activates ADR-034. T0 permits only
foundation/readiness work; HG-01 permits fixture/fake-backed Flutter and pure
layers; R-039 plus HG-02 are mandatory before runtime work. Higher effects are
separately gated. Historical G/R2 work keeps its v1 state contract.

G-007 passed on 2026-07-21 SGT with the evidence in
[`G-007-pm-gate.json`](../docs/spec/evidence/governance/G-007-pm-gate.json).
Only already-authorized dependency-ready foundation work may proceed before
HG-00. R-039 remains the technical Step-0 closure for runtime, while HG-01 can
narrowly authorize fixture UI and HG-02..HG-05 control later tiers.

## Roles for already-dispatched v1 work (historical and append-only)

- **Main PM — GPT-5.6 Sol:** owns frozen specs, task readiness, dependency DAG,
  conflict resolution, acceptance, integration order, and return-to-developer loops.
- **Technical advisor — Fable:** advises on dependency boundaries, architecture,
  task-graph mutations, risky interfaces, and each wave gate. Fable does not
  implement or independently approve its own recommendation.
- **Task owner — a fresh GPT-5.6 Sol subagent:** implements exactly one task,
  maintains its worktree, runs all acceptance commands, self-reviews the diff,
  and returns commit plus evidence.
- **Independent reviewer — a fresh Opus agent:** did not author the change;
  reviews the committed diff and evidence against the task brief and full spec;
  returns `APPROVE` or `CHANGES_REQUESTED` with requirement ids.
- **Integrator — main PM:** reruns proportional checks against the integration
  base. Approval does not force acceptance; spec compliance does.

Named model/provider routing is mandatory. G-007 freezes the exact provider and
model IDs for the current execution run; the initial route contract is
`codex`/`gpt-5.6-sol` for PM and implementers,
`claude`/`claude-fable-5` for the advisor, and
`claude`/`claude-opus-4-8` for independent review. If a route is unavailable,
reports a different provider/model, or drifts mid-task or mid-wave, the task
returns to `BLOCKED`, new dispatch stops, and the affected governance smoke is
rerun. No alias, generic collaboration agent, cached label, or fallback model
may preserve a green status.

For the historical v1 dispatches, there were three non-engineering gate types
that did not recurse through the engineering-task review loop:

- **Fable advisory gates:** R-037, E-010, X-007; Fable advises, PM dispositions.
- **Opus audit gates:** R-038, E-011, X-008; the named Opus output is itself the
  independent verdict and is checked by the PM, not reviewed by another Opus.
- **Mechanical PM closure records:** G-007, R-039, E-012, X-009; the PM records
  evidence and returns red work but cannot grant a v2 human authorization tier
  or implement missing work in the gate task. ADR-034 assigns all new tier
  grants to HG-01..HG-05 and the human.

G-001..G-006 are bootstrap smokes, not engineering delivery. G-003 therefore
proves the first Opus route without recursively requiring a prior Opus review.
G-007 reviews all bootstrap evidence and opens or refuses normal dispatch.

## v1 task state machine (historical and append-only)

```text
PROPOSED
  -> READY                 main PM confirms dependencies/brief/file ownership
  -> IN_DEVELOPMENT        assigned GPT-5.6 Sol task owner
  -> DEV_VERIFIED          owner commits + supplies acceptance evidence
  -> FABLE_ADVISORY        only when the packet requires standing advice
     -> RETURNED           same task owner fixes; return to DEV_VERIFIED
     -> DEV_VERIFIED       advisory passes; Fable grants no approval authority
  -> OPUS_REVIEW           separate Opus agent, read-only review role
     -> CHANGES_REQUESTED  return to same task owner; repeat DEV_VERIFIED
     -> OPUS_APPROVED
  -> PM_REVIEW             main PM checks full spec + integration impact
     -> RETURNED           same task owner fixes; repeat Opus review
     -> ACCEPTED
  -> INTEGRATED            main PM merges in declared order and reruns gates
```

No `APPROVE` may omit exact commands/results. The PM returns a task whenever a
criterion is missing, a test is red, the diff exceeds scope, or a current spec
claim is unsupported.

Every initial review and every post-rework review is performed by a **fresh
Opus agent/session** that is distinct from the implementation owner and from
prior review sessions. The new reviewer receives the complete prior findings
and their dispositions, but does not inherit approval or authorship. This is
the meaning of “repeat Opus review” in the state machine.

Every task instantiates the canonical
[`fkst.task-state/v1` template](../docs/spec/evidence/governance/task-state-template.json).
The closed vocabulary, canonical submission core, advisory/review containers,
and Wave-R1 legacy disposition are frozen in
[`task-state-contract.v1.json`](../docs/spec/evidence/governance/task-state-contract.v1.json).
State, submissions, reviews, PM decisions, and integration evidence are
append-only; a rejection or failed review attempt remains visible. Rewriting a
rejected commit, deleting a finding, or advancing without the required actor's
machine-bound identity is a failed gate.

## Required task packet

Every dispatch prompt contains:

1. task id/title and one outcome;
2. immutable context brief and exact spec/fixture links;
3. dependencies and integration-base commit;
4. exclusive files/directories plus forbidden files;
5. implementation requirements and non-goals;
6. acceptance criteria and exact commands;
7. evidence/redaction requirements;
8. required commit/handback format, including the exact provenance trailers;
   and
9. instruction to stop on a changed contract rather than invent compatibility.

Every handback contains commit SHA, changed-file list, test output summary,
acceptance checklist, known risks, and explicit confirmation that dependency
roots/unrelated files were untouched.

Every non-bootstrap engineering commit contains exactly one of each canonical
Git trailer below, and the Opus reviewer plus PM compare them with Heca/session
metadata. A display name, Git author name, timestamp correlation, or handback
claim cannot substitute for these trailers.

```text
FKST-Task: <task-id>
FKST-Agent-ID: <heca-agent-id>
FKST-Provider: <provider-id>
FKST-Model: <exact-model-id>
FKST-Provider-Session: <provider-session-id>
```

Missing, duplicate, mismatched, or unparseable provenance trailers return the
task to its implementation owner before Opus approval or PM acceptance. The
disposable G-002/G-006 bootstrap fixtures predate this rule and remain route
evidence only; they are never integrated into product history.

## Parallel-work rules

- One task owner per worktree and branch: `codex/v2-<task-id>-<slug>`.
- A task gets exclusive ownership of its declared production files while active.
- Frozen contracts, shared barrels, migrations, routing, package manifests, and
  CI entrypoints are serial merge points; changes require a named owner task.
- Test-only tasks may run beside implementation only when they consume a frozen seam.
- Tasks in the same table wave may run together when dependencies are satisfied
  and file ownership is disjoint. The PM fills every available safe slot.
- Current built-in collaboration supports only four concurrent agents including
  the PM; higher parallelism requires the ORG provider/worktree route to be
  installed and proven. The DAG is not permission to exceed an actual safe cap.

## Wave G — orchestration preflight

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| G-001 | — | Prove the main-PM GPT-5.6 Sol provider/model/session route. | Recorded provider/model/session evidence; one durable PM thread; no proxy/API-key assumption borrowed from history. |
| G-002 | G-001 | Prove fresh GPT-5.6 Sol implementation-agent spawning. | Provider-selectable child reports expected model, works in isolated disposable test branch/worktree, commits only a harmless fixture, and hands back evidence. |
| G-003 | G-001 | Prove independent Opus reviewer spawning. | Opus reviewer sees spec+disposable committed diff, cannot be confused with author, and returns machine-recorded approve/changes-requested verdict. |
| G-004 | G-001 | Establish Fable advisor route and scope. | Named advisor session/route recorded; one architecture-review smoke returns advice without editing/approval authority. |
| G-005 | G-002,G-003 | Implement task-state/rework tracking template. | One synthetic task completes and one rejection returns to same owner, repeats Opus review, then PM accepts. |
| G-006 | G-002 | Prove worktree/file-ownership isolation. | Two child agents change disjoint fixtures concurrently; collision guard blocks declared overlap; merge order is recorded. |
| G-007 | G-001,G-002,G-003,G-004,G-005,G-006 | PM/Fable orchestration gate. | Fable advisory recorded; PM marks ORG-01..06 PASS with evidence or stops dispatch. |

Bootstrap order: G-001 alone; then G-002, G-003, and G-004 together; then
G-005/G-006. G-007 opens normal dispatch.

## Wave R1 — dependency and contract discovery

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| R-001 | G-007 | Freeze substrate checkout/binary/build manifest. | Commit/root/platform/license plus chosen binary SHA and self-test evidence recorded; no silent build. |
| R-002 | R-001 | Freeze substrate observe/provenance fixtures. | Raw success/offline/malformed/truncated fixtures cite source commit; schema mismatch fails closed. |
| R-003 | R-001 | Freeze substrate direct-host/process contract inventory. | Exact supported CLI/host/process/detach source map produced; unknown argv/env remains red, not guessed. |
| R-004 | G-007 | Freeze public devloop export/closure manifest. | Exact export digest, stable id, declared closure, license, and commit recorded; app direct-import boundary stated. |
| R-041 | R-004 | Land the narrow upstream public-devloop visibility change. | Separate dependency-repo branch/commit adds only the chosen stable app-package id or general public mechanism; dependency checks pass; Opus+PM approve; no app file changes. |
| R-005 | R-041,R-045,R-055 | Pin and verify required app-side public-devloop changes. | App compatibility manifest records exact upstream visibility, immutable-evidence, and proxy-free restart capability commits/export digest; app-package visibility/conformance fixtures pass; dependency repo remains untouched. Optional merge is not required. |
| R-006 | R-004 | Define allowed graph/import policy. | Machine-readable allowlist distinguishes public devloop from its internal closure and rejects every reference package/direct internal import. |
| R-007 | G-007 | Freeze Workflow semantic model. | Fable-reviewed stage/intake/gate/terminal semantics; every field has intended consumer/evidence; unsupported topology absent. |
| R-008 | R-007 | Freeze Workflow JSON/canonical digest corpus. | Dart/Lua canonical, invalid, unknown-key, bounds, version, and digest fixtures agree byte-semantically; stage ids and kinds are unique and map exactly one-to-one, in order, to the selected family; duplicate/reordered/missing/extra kinds fail. |
| R-009 | G-007 | Freeze Council semantic model. | Fable-reviewed seat/policy/round/decision/dissent semantics; no consensus cap/prompt/score copied as authority. |
| R-010 | R-009 | Freeze Council JSON/evidence corpus. | Dart/Lua valid/invalid/bounds/digest/evidence fixtures agree; each round contains exactly one ordered contribution per configured seat with matching lens; missing/timeout seats are explicit failed contributions; duplicate/extra/reordered/wrong-lens fixtures fail; every editable field has an emitted-evidence plan. |
| R-059 | R-008,R-010 | Make the contract fixture harness worktree-portable and provenance-bound. | Default `dart test` from the primary checkout and an isolated Heca worktree reads only repo-local fixtures; any mirrored `devbored` reference bytes have source commit/path/SHA evidence and remain tagged differential/reference-only; the obsolete `devbored.config.v1` validity case cannot define app authority; Workflow/Council corpora remain in the default suite; no dependency/runtime import is added. |
| R-011 | R-008,R-010 | Freeze Workflow→Council assignment contract. | Explicit `{councilId,policyId}` validation, cross-connection rejection, stage compatibility, and digest effects pass in both languages. |
| R-012 | G-007 | Freeze dual GitHub auth and label-only claim contract. | Independent loop/operator contexts and exact label behavior have fixtures; assignee config is hostile input and fails closed; no global account switch. |
| R-013 | G-007 | Freeze Codex CLI/account preflight contract. | Exact executable/version/login-status checks use a dedicated keyring-backed Codex home plus a distinct empty process HOME with no `.agents`/personal dotfiles; global options precede `exec`; context is absent; user config/rules ignored; strict/untrusted/zero-project-doc mode and personal skills/hooks/web/MCP/apps/plugins/goals/multi-agent disabled; managed requirements must equal policy or block; managed-requirement/resolved-config/tool-surface digests, unavailable-tool probes, ephemeral/fail-closed policy, role sandboxes, and bounded worker probes are frozen; no credential is copied. |
| R-014 | R-004 | Map intake/claim/trust behavior to public devloop. | Exact exports/source/tests named; label mode and trust-before-parse have no-write probes; proxy-coupled assignee scope is removed. |
| R-015 | R-004 | Map implementation/worktree/Git/push/PR behavior to public devloop. | Exact public exports and high-risk probes named; missing Git/PR seam removes stage rather than becoming app code. |
| R-016 | R-004 | Map review/head-gate/terminal/restart/replay behavior. | Exact public exports and idempotency probes named; private/reference-only seam is red. |
| R-042 | R-016,R-041,R-055 | Resolve the optional public exact-head merge capability. | After required devloop seams are integrated, record one reviewed outcome: a separate dependency-repo commit exposes a narrow tested gate-recheck/merge/reconcile/receipt API, or the capability is absent/gated and only `hold` is admitted; no app-local/reference implementation. |
| R-017 | R-001,R-004,R-009 | Map Council/Codex boundary. | App-owned work is only Council contract/orchestration; substrate Codex and public loop responsibilities are exact; no consensus dependency. |
| R-018 | R-012,R-014,R-015,R-016,R-017 | Define complete DRY/LIVE effect matrix. | Process/Git/GitHub effects and authorities listed for the new graph; every LIVE effect has guard/audit/probe plan. |
| R-043 | R-003,R-008,R-010,R-015,R-016,R-017,R-018,R-048,R-057 | Freeze compatibility manifest, Workflow-family routes, launch/runtime config acceptance, filesystem/lifetime receipts, and evidence-carrier contracts. | Canonical manifest/family/outcome/exhaustion/connection-revision/launch-snapshot/resolved-filesystem-profile/managed-worktree-grant/direct-receipt/runtime-receipt/cleanup-receipt/evidence-fact/app-envelope/immutable-comment fixtures agree at every consuming language boundary; six root templates, canonical path identities/scopes/writers/bounds/protected paths, managed Git indirection/broker-only metadata, profile digest binding, attempt/round/cycle/transition holds, cleanup identity/exit/escalation/detach/scan/survivor rules, public effects, kind/fact/head invariants, trust, replay, ambiguity, and path rules are exact. |
| R-044 | R-003,R-012,R-015 | Freeze dedicated managed-clone provisioning contract. | Create/fetch/reopen/origin/branch/dirty/symlink/path/auth/recovery matrix forbids adopting or destructive repair of a user checkout. |
| R-045 | R-004,R-016,R-041 | Add required public immutable evidence-comment capability. | Separate devloop commit exposes a schema-agnostic create-only transport: the app supplies bounded opaque canonical body plus dedup key/digest; devloop owns qualified target/posture, bounded pre-read/create/read-back/reconcile, canonical comment id/permalink/author receipt, ambiguous hold, replay, and duplicate/conflict rejection; no proxy/reference import or app-envelope ownership. |
| R-046 | R-003,R-015,R-044 | Freeze project-root/managed-clone topology contract. | Candidate modes, reserved path/collision/local-exclude rules, provenance/index/commit/linked-worktree sentinels, fallback seam, and executable fixture matrix are exact; no implementation is mixed into this contract task. |
| R-047 | R-003,R-043 | Freeze supervised runtime config-acknowledgement carrier. | Bootstrap trigger, supervised department consumption, bounded receipt carrier/schema, child/process association, timeout/stop behavior, and exact binding to direct receipt are testable without log/delivery inference. |
| R-048 | R-003,R-018 | Freeze filesystem-containment contract and platform support. | Exactly six bounded root-grant templates and a canonical resolved launch-profile schema bind kind, canonical path+identity, scope, writer, subpath digest, quotas, protected paths, and default deny. The managed Git tree resolves `.git` common+linked metadata; a non-escalating exact-argv public-devloop broker may write metadata and resolved content only for frozen prepare/recover/exact-ref-checkout effects with receipts, never general content. Codex receives a bounded content-only worktree grant; generic `file.*`/exec is denied. Root-confined boundary or sandbox+brokers matrices and Linux disposition are machine-readable; process-wide sandbox alone is insufficient. |
| R-057 | R-003 | Freeze owned-process lifetime contract. | Parent/control-death, outer-job ownership, escalation, identities, detach/PID reuse, and fatal state are exact. Cleanup receipt schema/bounds/digest binds snapshot/profile/job/outer/exit/scan/survivors. Its carrier is a create-exclusive atomic+fsynced outer-launcher-only subpath inside boundedLog, readable on relaunch and never inferred from logs. Hostile fixtures cover parent death/unexpected exit and reject stale/replayed/mismatched/oversized/incomplete/wrong-writer/path receipts. |
| R-049 | R-014,R-018 | Freeze label-only v1 claim disposition. | Compatibility manifest admits label only; assignee config/UI fails closed; label claim/trust/restart/effect probe plan has no proxy request. |
| R-050 | R-016,R-043,R-045,R-055 | Freeze proxy-free restart/replay disposition. | The resolved public restart seam is mapped to app transitions and safe comment receipts with bounded replay/cap/duplicate/error fixtures and no reference replayer/proxy queue. |
| R-051 | R-001,R-013 | Add safe current-Codex invocation capability to substrate. | Separate substrate commit emits installed-CLI-compatible ordered argv with global flags before `exec`, dedicated keyring-backed Codex home and empty process HOME, context absent, ignored user config/rules, strict/untrusted/zero-project-doc configuration, disabled personal skills/hooks/web/MCP/apps/plugins/goals/multi-agent, ephemeral/fail-closed policy, mandatory role sandbox, and no bypass; incompatible managed requirements block; managed-requirement/resolved-config/tool-surface digests plus negative `.agents`/tool/process probes pass. |
| R-056 | R-003,R-015,R-044,R-046,R-051 | Resolve and prove the project-root/Git-root seam. | A disposable reserved in-clone composition fixture passes every collision/exclude/provenance/index/commit/worktree/reopen/path-with-spaces sentinel; if it fails, a separately reviewed upstream root-separation capability is landed and tested without reference packages. |
| R-054 | R-003,R-048,R-056 | Implement and prove the Step-0 filesystem-containment capability. | A reviewed root-confined boundary or sandbox with non-escalating brokers enforces the canonical profile; process-wide inheritance alone fails. Escape/path-replacement/quota cases fail; generic `file.*`/exec cannot mutate Git metadata or Codex content; exact broker prepare/recover/checkout proves its narrowly timed content+metadata writes and receipts, while any other broker content write fails; issued Codex content-only grants pass; all six roots/protected paths/profile digests and Linux disposition are proven. |
| R-058 | R-003,R-054,R-057 | Implement and prove the Step-0 outer job/launcher. | Normal/unexpected outer exit, app kill/crash, control EOF, hang/escalation, nested/new groups, detach, and PID reuse produce bounded canonical receipts bound to snapshot/profile. App-death cases persist via the exclusive outer-launcher carrier and relaunch reads it; log text/wrong writer/path/partial/no-fsync fixtures fail. Only a matching complete zero-survivor receipt clears cleanup; all other results enter `cleanupFailed` until contained reconciliation returns a new valid receipt. |
| R-052 | R-051,R-054,R-058 | Build, pin, and verify the final substrate capabilities. | Chosen binary/launcher build manifest, SHA, platform, and source commits include all admitted Codex, root-containment, and lifetime changes; self-test plus sanitized personal-account no-write/escape/parent-death smoke passes with exact resolved surfaces, zero survivors, no credential copying, and no dependency-root mutation. |
| R-055 | R-004,R-016,R-045 | Resolve the required public proxy-free restart seam. | Existing public generic kernel is proven with app-envelope replay, or a narrow separately reviewed devloop adapter is landed; restart/replay is bounded, duplicate-safe, receipt-based, and emits no proxy/reference request. |
| R-053 | R-005,R-042 | Freeze autonomous-merge disposition. | Compatibility manifest records either the exact admitted public merge commit/export/effect receipt contract or an explicit hold-only terminal set; downstream code depends on this disposition, never on successful merge implementation. |
| R-019 | R-008,R-010,R-011,R-012,R-013,R-014,R-015,R-016,R-017,R-018,R-043,R-044,R-045,R-046,R-047,R-048,R-049,R-050,R-051,R-052,R-053,R-054,R-055,R-056,R-057,R-058 | Integrate contract dispositions and admit the capability probe scope. | Authoritative specs receive one coherent Workflow/Council/context/capability/lifetime update; each retained RDY-05 row is `ADMITTED/PLANNED, UNVERIFIED` with an exact executable probe, while missing seams remove scope; RDY-05 remains FAIL until R-030..R-035 pass. |
| R-020 | R-005,R-006,R-008,R-010,R-019,R-059 | Freeze app-loop package manifest/graph. | Stable id, public imports, static graph, contract versions, prohibited graph identities, and a worktree-portable default contract suite are reviewable and deterministic. |

Maximum initial parallelism: R-001, R-004, R-007, R-009, R-012, and R-013;
then source-map/corpus tasks fan out.

## Wave R2 — executable Step-0 integration proof

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| R-021 | R-020 | Scaffold minimal app-owned FKST proof package. | Package loads/conforms with only allowed imports; contains no product feature or copied devloop module. |
| R-022 | R-008,R-021,R-043 | Implement minimal Workflow loader/digest/family consumer. | Valid fixture and exhaustive manifest route/exhaustion family accepted; invalid/unknown/mismatched digest, missing outcome/exhaustion hold, unbounded cycle, or under-sized/over-cap budget rejected; accepted evidence emitted. |
| R-023 | R-010,R-011,R-021 | Implement minimal Council loader/assignment consumer. | Council/policy references resolve; roster order/lens are consumed exactly; missing/timeout maps to an explicit failed contribution; duplicate/extra/reordered/wrong-lens/invalid policy fails; no consensus package/import. |
| R-024 | R-022,R-023,R-043,R-045,R-047 | Implement config receipts and versioned proof evidence emitter. | Direct and supervised runtime receipts, including direct-receipt digest binding, plus every Workflow-transition/Council/implementation/PR/gate/terminal fact round-trip through Dart; immutable one-comment transport passes trust/conflict/digest-chain/dedup/read-back tests; retries occur only after reconciliation proves `confirmedNotSent`, while unresolved ambiguity emits `publicationOutcomeUnknown` hold with no automatic retry. |
| R-025 | R-003,R-020,R-021,R-043,R-046,R-047,R-048,R-052,R-054,R-056,R-057,R-058 | Build direct and supervised substrate host fixture. | Resolve/hashes the exact six-root launch profile, protected path identities, managed Git common/linked metadata, and non-escalating broker/worktree grants; integrate the proven project/Git-root, filesystem, and outer-job seams with exact files/argv/env. No-effect acceptance and supervised bootstrap bind the same immutable snapshot/profile; timeout, unexpected outer exit, parent/control death, zero-survivor/`cleanupFailed`, capability escape, quota, and clean-root sentinels pass without reference packages. |
| R-026 | R-006,R-021 | Implement graph allowlist lint. | Positive app graph passes; each prohibited package fixture fails with useful identity/path. |
| R-027 | R-006,R-021 | Implement source/import boundary lint. | Public devloop imports pass; copied/private/transitive direct imports and reference modules fail. |
| R-028 | R-008,R-010,R-024,R-057 | Implement contract parity suite across every consuming language boundary. | All canonical/invalid/digest/family/outcome/exhaustion/decision/resolved-filesystem-profile/managed-worktree-grant/config-receipt/cleanup-receipt/evidence/transport fixtures pass in each relevant Dart/launcher/package consumer, including exact root/path-identity/scope/writer/subpath/expiry/quota/Git-indirection/broker-effect/profile bindings, hostile out-of-effect grants, attempt/round/cycle/transition substitutions, cleanup exit/identity/size/replay hostility, and every injection string. |
| R-029 | R-012,R-013,R-025,R-049,R-052 | Prove GitHub/Codex contexts under exact child env. | Both GitHub actors, label claim, and git transport pass; Codex uses dedicated keyring-backed Codex home plus empty process HOME and exact global-before-`exec` argv; context/user config/rules/project docs/personal dotfiles and ambient features are absent; incompatible managed requirements block; managed-requirement/resolved-config/tool-surface digests, negative `.agents`/unavailable-tool/process probes, role sandboxes/no network/no bypass, version/login, and bounded workers pass without credential persistence. |
| R-030 | R-014,R-021,R-025,R-049 | Probe intake/claim/trust seams. | Label mode and forged-author/hostile-assignee rejection execute under no-write/isolated fixtures with restart replay and no proxy request. |
| R-031 | R-017,R-023,R-024,R-025,R-029,R-045 | Probe Council/Codex decision seam. | Bounded read-only-sandbox Council rounds/decision and immutable read-back-confirmed evidence execute; each round has exactly one ordered matching-lens contribution for every configured seat, with missing/timeout explicit and duplicate/extra/reordered/wrong-lens input rejected; approved/changes-requested stop, only below-cap inconclusive advances, cap exhausts to the specified hold, accepted replay invokes no seat, and no reference package loads. |
| R-032 | R-015,R-021,R-025,R-029,R-044,R-046 | Probe managed-clone/implementation/Git/push/PR seams. | Dedicated managed Git root/composition probes resolve base/common/linked paths, issue a Codex content-only grant, and prove the public-devloop Git broker's exact repo/ref/argv/receipt authority: metadata plus prepare/recover/checkout content writes pass only during those effects; all other broker/package/generic-exec content writes fail. Provenance, PR correlation, idempotency, quotas, and user-checkout/app-control sentinels pass. |
| R-033 | R-016,R-021,R-025,R-043,R-045,R-050 | Probe review/head-gate/terminal/restart/evidence seams. | Trusted immutable comment envelope, exact-head gate plus mandatory hold (and merge only if R-053 admitted), effect receipt, all rework routes, and proxy-free repeated restart/replay pass; only reconciled `confirmedNotSent` retries, unresolved `publicationOutcomeUnknown` holds with no auto-retry, and duplicate/conflict suppression is exact. |
| R-034 | R-018,R-030,R-031,R-032,R-033,R-048,R-054 | Probe complete DRY/LIVE effect and containment matrix. | Executable sandbox and secondary effect audit match the declared matrix exactly: zero unexpected delta, every expected package-authored/engine-managed effect has a typed receipt, writes stay within the exact six admitted root kinds, and LIVE requires explicit opt-in/allowlist. |
| R-035 | R-022,R-023,R-024,R-025,R-026,R-027,R-028,R-029,R-030,R-031,R-032,R-033,R-034 | Run read-only-root integrated proof. | Complete admitted seam-probe suite passes with substrate/devloop roots unchanged and no reference graph/import. |
| R-036 | R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014,R-015,R-016,R-017,R-018,R-019,R-020,R-021,R-022,R-023,R-024,R-025,R-026,R-027,R-028,R-029,R-030,R-031,R-032,R-033,R-034,R-035,R-041,R-042,R-043,R-044,R-045,R-046,R-047,R-048,R-049,R-050,R-051,R-052,R-053,R-054,R-055,R-056,R-057,R-058 | Assemble readiness dossier. | Every RDY/ORG row links exact command, artifact, commit, owner, reviewer, and disposition; RDY-19 records admitted merge evidence or an explicit gated hold-only manifest, and RDY-25 links the hostile lifetime/zero-survivor/fatal-recovery proof. |
| R-037 | R-036 | Fable architecture/wave advisory. | Advisor checks boundary, sufficiency, task graph, and removed scope; recommendations dispositioned. |
| R-038 | R-036,R-037 | Independent Opus Step-0 audit. | Separate Opus finds no unresolved P0/P1 spec/dependency/authority issue. |
| R-039 | R-038 | Record mechanical Step-0 closure dossier. | PM reruns critical gates, marks readiness PASS/gated accurately, freezes contracts, and records a green or returned dossier for HG-02; R-039 does not grant a tier or authorize feature dispatch. |

R-021..R-024 and R-026..R-028 can overlap where file ownership is disjoint;
effect probes serialize by sandbox/repo identity.

## Wave U/C — Flutter shell and core foundation

Fixture-only tasks begin only after HG-01. Runtime-connected work still requires
R-039 closure and HG-02.

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| U-001 | HG-01 | Create minimal fixture-only Flutter desktop scaffold. | Pinned SDK, macOS/Linux targets, format/analyze/test, no listener/server/dependency adapter and no runtime claim from fixtures. |
| U-023 | U-001 | Establish presentation/application/domain/infrastructure boundaries and architecture lint. | Required directories and one composition root exist; domain has no Flutter/I/O; application depends only domain; ViewModels cannot import adapters; infrastructure cannot import presentation; hostile imports fail CI. |
| U-002 | U-023 | Implement theme/tokens/typography. | Canonical oklch-derived tokens, Inter/wordmark rules, contrast tests; no approximate-hex authority. |
| U-003 | U-023 | Implement shell/router/grouped navigation. | Operate/Design/System/Settings plus Setup stepper routes work by keyboard; one context bar; route focus and Back restore heading/filter/draft/scroll context; no data/effect logic in widgets. |
| U-004 | U-023 | Implement shared acquisition/mutation-state and unknown components. | Six acquisition states plus validating/confirming/in-progress/ambiguous/conflict/success/failure and unknown renderer have widget/semantics tests; in-flight work remains visible after dialog close. |
| U-005 | U-023 | Implement provenance/status primitives. | Source/as-of/completeness/truncation and text+shape status render accessibly. |
| U-006 | U-023 | Build accessibility/responsive test harness. | Keyboard/route-focus, dual-theme contrast, text scale, 44px targets, visible form errors, reduced-motion, semantic icon, and table-to-card narrow-width checks run in CI. |
| U-007 | U-002,U-003,U-004,U-005,U-006 | Build Readiness fixture gallery. | Readiness covers all six states from frozen evidence/remediation fixtures; effects disabled; golden/semantics pass. |
| U-012 | U-002,U-003,U-004,U-005,U-006 | Build Doctor fixture gallery. | Doctor matrix/check detail covers all six states and stale revision without any live probe. |
| U-013 | U-002,U-003,U-004,U-005,U-006 | Build Connections/onboarding fixture gallery. | Dependency/repo/context/root/setup steps cover all six states; Start remains disabled. |
| U-008 | U-002,U-003,U-004,U-005,U-006 | Build Workflow catalog/detail fixture gallery. | Catalog and tightly coupled definition detail cover all six states with frozen contracts only. |
| U-014 | U-002,U-003,U-004,U-005,U-006 | Build Workflow editor fixture gallery. | All six acquisition states plus draft/diff/conflict/awaiting/active/invalid mutation states render with no file write. |
| U-015 | U-002,U-003,U-004,U-005,U-006 | Build Council editor fixture gallery. | All six acquisition states plus seats/policies/assignments/diff/conflict/activation mutation states render with gated fields absent. |
| U-016 | U-002,U-003,U-004,U-005,U-006 | Build Council-run fixture gallery. | Round/seat/decision/dissent/provenance plus all six acquisition states render without inferred metrics. |
| U-009 | U-002,U-003,U-004,U-005,U-006 | Build Work-list fixture gallery. | Qualified list rows, Workflow/Council/claim/head/freshness and all six states render. |
| U-017 | U-002,U-003,U-004,U-005,U-006 | Build Work-board fixture gallery. | Board lanes/cards/filter/grouping and all six states render from one frozen canonical set. |
| U-018 | U-002,U-003,U-004,U-005,U-006 | Build Work-detail fixture gallery. | Evidence-order/detail/human-action/runtime-separation and all six states render. |
| U-019 | U-002,U-003,U-004,U-005,U-006 | Build Overview fixture gallery. | Actionable rollups and all six states render without decorative/manufactured health. |
| U-010 | U-002,U-003,U-004,U-005,U-006 | Build Runtime/run-control fixture gallery. | Delivery/process/config provenance, all six acquisition states, ready/starting/owned/unowned/stopping/crash/`cleanupFailed` states, acknowledgement wait/timeout, zero-survivor evidence, blocked Start/Restart, and the single contained cleanup/reconcile action render with all effects disabled. |
| U-020 | U-002,U-003,U-004,U-005,U-006 | Build Fleet fixture gallery. | Multi-connection freshness/degradation/paused states and all six view states render. |
| U-021 | U-002,U-003,U-004,U-005,U-006 | Build recovery fixture gallery. | All six acquisition states plus migration/corruption/restore/export/new-store mutation states render with destructive actions disabled. |
| U-022 | U-002,U-003,U-004,U-005,U-006 | Build Settings fixture gallery. | Preferences/write guards/diagnostics/cache actions and all six states render safely. |
| U-011 | U-007,U-008,U-009,U-010,U-012,U-013,U-014,U-015,U-016,U-017,U-018,U-019,U-020,U-021,U-022 | Integrate gallery routes/goldens. | Shared router/barrels edited only here; all gallery suites run together with no duplicate fixture model or field. |
| C-001 | U-023 | Implement connection/revision domain types. | Frozen canonical field list covers every load-bearing pin/context/root/config/posture/allowlist and hashes deterministically; UI preferences excluded. |
| C-002 | U-023 | Implement canonical root/path policy. | Overlap/symlink/escape/shared-root/user-checkout cases fail; valid managed paths with spaces pass. |
| C-003 | U-023 | Implement bounded argv-only process executor. | Absolute exe/cwd/include-only env/deadline/output caps/cancel tests pass with no shell-string path; it exposes no PID-control API and makes no lifetime/zero-survivor claim—filesystem and outer-job ownership are implemented only by C-021/C-022 through typed ports. |
| C-004 | C-003 | Implement process output redaction/rotation. | Secret/home/body fixtures redacted; truncation/rotation/audit metadata exact. |
| C-005 | U-023 | Implement SQLite isolate, schema registry, and empty migration baseline. | One DB owner, table namespaces/migration versioning, and forbidden-column schema tests pass; no domain repository yet. |
| C-012 | C-005 | Implement disposable cache repository. | Snapshot/fetch metadata CRUD, TTL/generation keys, and cache-drop semantics pass. |
| C-013 | C-001,C-005,D-001,D-008 | Implement preferences/connection repository. | Implements connection/settings ports; nonsecret connection references/preferences persist with qualification/revision round-trip; credential/authoritative-state fields rejected. |
| C-014 | C-005,D-002 | Implement staged Workflow/Council draft repository. | Implements draft persistence port; typed drafts/base hash/version persist separately; explicit discard rules and body/secret exclusions pass. |
| C-011 | C-005,D-006,D-008 | Implement append-only operation/process audit repository. | Implements audit/diagnostics ports; bounded metadata only; ambiguous/result/config/process records query deterministically. |
| C-006 | C-005,C-011,C-012,C-013,C-014,D-008 | Implement backup-first migration/recovery. | Implements recovery ports; upgrade, forced failure, corruption, restore/export/new-store flows preserve all original domains. |
| C-007 | C-001,D-001 | Implement typed Doctor registry/report. | Deterministic checks/remediation/revision staleness with fake probes through the frozen ports. |
| C-008 | C-002,C-007,C-020 | Implement dependency/graph/import Doctor checks. | Manifest pin/digest/license/visibility/graph/import/root/config/effect failures map to exact readiness facts. |
| C-016 | C-003,C-007 | Implement GitHub actor/context Doctor checks. | Loop/operator contexts, actor/bot separation, repo access, and claim-mode probes have typed remediation. |
| C-017 | C-003,C-007 | Implement git executable/origin/branch/transport Doctor checks. | Exact tool/version/HTTPS origin/branch/no-prompt transport failures are distinct and credential-free. |
| C-018 | C-003,C-007,D-001 | Implement Codex CLI/account Doctor checks. | Exact executable/version/login status, dedicated keyring-backed Codex home, and distinct empty process HOME are typed; installed argv order, context/user-config/rules/project-doc/`.agents` absence, strict untrusted mode, disabled ambient surfaces, ephemeral/fail-closed policy, role sandbox/no bypass, cwd, managed-requirement/resolved-config/tool-surface digests, incompatible-managed-policy blocking, negative unavailable-tool/process probes, and bounded smoke are verified. |
| C-009 | C-016,C-017,C-018 | Integrate auth/tool Doctor checks. | One registry surface composes all checks without global account switching, credential storage, or duplicated probes. |
| C-010 | C-002,C-014,D-002 | Implement generic CAS config file service. | Hash/version/symlink/diff/backup/atomic/fsync/conflict tests pass for Workflow and Council through the frozen catalog/activation ports. |
| C-020 | U-023,R-043,R-057 | Implement compatibility-manifest parser and admission policy. | Canonical manifest validates self-digest, pins, graph/imports, host/project-root, six grant templates/profile contract/protected roots/non-escalating Git broker, process-lifetime policy, direct/runtime config acceptance, complete Codex effective-surface policy, claim modes, Workflow families/bounds, evidence publication/transport, and effects; duplicate/missing kind, invalid bounds, process-wide-only policy, or unknown seam fails closed; pure domain model has no adapter imports. |
| C-021 | C-002,C-003,C-020,R-048,R-054 | Implement the platform filesystem-containment launcher. | Typed infrastructure resolves/hashes the immutable profile and enforces all six roots/protected/default deny. A non-escalating exact-argv public-devloop Git broker alone writes common/linked metadata and may write content only during frozen prepare/recover/checkout effects; Codex receives only issued content grants; generic package/exec and out-of-effect broker writes fail; path/overlap/quota escapes fail, every expected effect has a receipt, and Linux support is exact. |
| C-022 | C-003,C-020,C-021,R-058,D-004 | Implement the production outer job/lifetime launcher. | Infrastructure uses only the proven job; caps/validates/persists cleanup receipts through the exclusive atomic+fsynced boundedLog subpath and reads them on relaunch without log inference. Normal/unexpected exit, app/control death, hang/escalation, descendants, detach/PID reuse, wrong writer/path and hostile receipt tests yield a valid zero receipt or `cleanupFailed`; unknown/nonzero blocks new launch. |
| C-019 | C-010,C-014,C-020,D-002 | Implement typed Workflow/Council definition catalog repository. | Bundled templates and connection definitions list/load with source/version/digest/validation through frozen ports; no network or reference schema; draft/base/current distinctions and external edits are explicit. |

After HG-01, U-001 then U-023 establish the fixture/pure-layer boundary.
After R-039 and HG-02, runtime-connected C/L/A work may consume it. U-002..U-006, C-001,
C-002, C-003, C-005, and C-020 may then fan out without crossing layers.

## Wave D — domain ports and application seams

These port-contract tasks start immediately after U-023 and may run in
parallel. They define immutable domain-facing interfaces and reusable fakes;
they perform no I/O and import neither Flutter nor infrastructure. Concrete
adapters implement these ports, and application use cases depend on the ports,
never on concrete task classes.

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| D-001 | U-023 | Define Setup/Connection/Doctor/provision ports. | Qualified connection CRUD, managed-clone provisioning, dependency/tool/auth/Doctor queries, cancellation, freshness, and typed remediation contracts plus fakes are exhaustive; no filesystem/process/GitHub type leaks. |
| D-002 | U-023 | Define Workflow/Council catalog, CAS, and activation ports. | Catalog/load/draft/validate/diff/save/accept/activate operations expose immutable version/digest/conflict/next-launch results and fakes; no path/file/database type crosses the boundary. |
| D-003 | U-023 | Define qualified work/evidence/acquisition ports. | One qualified entity/evidence snapshot, filters/detail/refresh, generation/completeness/truncation, cancellation, and fakes are exact; GitHub/substrate transport types are absent. |
| D-004 | U-023 | Define runtime observation, lifecycle, config-ack, and effect ports. | Runtime query/refresh and start-review/start/stop/restart/cleanup-reconcile expose immutable ownership/config/effect facts plus the typed bounded cleanup receipt, every lifecycle state including `cleanupFailed`, acquisition/mutation results, cancellation, and fakes; only a validated matching complete zero-survivor receipt may clear cleanup; no PID signaling or adapter type leaks. |
| D-005 | U-023 | Define Council evidence-query ports. | Qualified round/seat/contribution/decision/dissent/permalink/completeness filters and fakes preserve exact-roster and unknown semantics without inference. |
| D-006 | U-023 | Define guarded human-write and audit ports. | Only create-opted-in-issue, human-comment, ambiguity-reconcile, and bounded audit operations exist; typed results prohibit generic mutation and stored body/credential fields. |
| D-007 | U-023 | Define fleet, scheduler, rate, and cache ports. | Per-connection acquisition, fair scheduling, identity-keyed budgets, atomic snapshots, pause/refresh, and disposable-cache operations plus deterministic fakes preserve isolation. |
| D-008 | U-023 | Define recovery, settings, and diagnostics ports. | Migration/restore/export/new-store, preferences/write switches, redacted diagnostics preview/export, and cache actions are explicit typed commands with non-destructive defaults and fakes. |

## Wave A/L — adapters, projection, integrated runtime

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| A-001 | C-003,C-008 | Implement substrate identity/observe/provenance adapter. | Frozen raw fixtures pass; no version fiction, ledger/socket access, or unknown-to-zero. |
| A-011 | C-003,C-009 | Implement GitHub actor/repository discovery adapter. | Qualified host/repo/current actor/permissions resolve under selected context; wrong host/repo/auth fail distinctly. |
| A-012 | C-003,C-009 | Implement bounded GitHub issue read adapter. | Issue pages, labels, assignees, milestones, authors, and qualification paginate/cap/fail distinctly. |
| A-013 | C-003,C-009 | Implement bounded GitHub PR/link read adapter. | PR/head/base/linkage/author fields paginate/cap/fail distinctly with exact repo qualification. |
| A-014 | C-003,C-009 | Implement bounded GitHub comment read adapter. | Issue/PR comments preserve author/permalink/time with page/body caps and explicit incompleteness. |
| A-015 | C-003,C-009 | Implement GitHub checks/refs read adapter. | Exact-head check rollup/ref facts distinguish pending/failure/neutral/unknown and incomplete pagination. |
| A-002 | A-011,A-012,A-013,A-014,A-015 | Integrate the read-only GitHub facade. | Endpoint adapters expose one qualified bounded read port; no mutation method or duplicated pagination policy. |
| A-003 | C-003,C-009 | Implement git fact/transport adapter. | HTTPS origin/ref/head/status/no-prompt probes use argv and typed validation. |
| A-016 | C-002,C-003,C-009,C-020,A-003,D-001 | Implement dedicated managed-Git-tree repository adapter. | Implements provisioning; creates/qualifies the canonical managed root and base clone, resolves Git common/worktree metadata indirection, reserves bounded worktree parents, and emits inputs for the launch profile/worktree grants. Create/fetch/reopen/target-branch/origin/dirty/auth/path/symlink cases are idempotent; it never adopts, cleans, or resets a user checkout. |
| A-004 | R-024,R-039,D-003 | Implement trusted transported-app-evidence parser. | Trust-first author/entity/immutable-transport/schema/size/fact/digest/chain/sequence/dedup/head/revision/conflict/regression/reference-marker cases fail closed; marker delimiter, Unicode/base64url, and mutable-comment attacks pass; `confirmedNotSent` is distinct from unresolved `publicationOutcomeUnknown`, which never auto-retries; permalink remains transport metadata. |
| A-017 | A-001,C-003,C-020,R-024 | Implement direct no-effect config-acceptance adapter. | Exact substrate `run` argv/env consumes the immutable launch snapshot and resolved filesystem profile, caps/parses one preflight receipt, rejects extra/malformed/mismatched output, proves no effect, and binds revision/package/graph/config/snapshot/profile digests. |
| A-018 | A-001,C-003,C-020,R-024,R-047 | Implement supervised runtime-config receipt adapter. | Bounded admitted carrier parses only the bootstrap department's receipt, binds process instance/launch/snapshot/filesystem-profile/direct-receipt/package/graph/Workflow/Council digests, rejects log/delivery inference and mismatch, and times out with owned-stop instruction. |
| A-005 | A-002,A-004,D-003 | Implement pure Workflow/work projection. | Implements the qualified work/evidence port; state/stage/config provenance derives from fixtures with source/as-of/completeness. |
| A-006 | A-002,A-004,D-005 | Implement pure Council projection. | Implements the Council evidence-query port; every round maps exactly one ordered matching-lens contribution per configured seat, including explicit failed missing/timeout seats; duplicate/extra/reordered/wrong-lens or impossible execution/verdict pairs fail closed; mechanical decision/Dart-package parity holds and missing stays unknown. |
| A-007 | A-001,D-004 | Implement pure runtime projection. | Implements runtime observation/query; exact casing/omissions/queue aggregates/bounded lists/truncation and cleanup evidence are preserved. |
| A-008 | C-003,C-012,D-007 | Implement fair acquisition scheduler. | Implements the scheduler port; five-source deadline/concurrency/fairness/failure-isolation simulation passes. |
| A-009 | A-008,C-009,D-007 | Implement operator/child rate budgets. | Implements the rate port; identity-keyed separation, reset/backoff/jitter/manual-refresh tests pass. |
| A-010 | A-005,A-006,A-007,A-008,A-009,C-012,D-003,D-004,D-005,D-007 | Implement atomic snapshot generations/cache. | Implements acquisition/cache ports; no old/new field merge; cache loss changes latency only; stale metadata exact. |
| L-001 | R-039,R-045 | Productionize bounded Workflow orchestration in app package. | Only admitted manifest-frozen stage families/public APIs; every outcome routes exactly once, attempts/transitions/implementation cycles are monotone/capped, publication retries only after `confirmedNotSent`, unresolved ambiguity holds without auto-retry, and envelope sequence/digest/read-back/replay/idempotency tests pass; no copied/reference logic. |
| L-002 | R-039,R-045,R-051 | Productionize deterministic Council orchestration/evidence. | Frozen assignment/lens/policy/bounds; each round emits exactly one ordered matching-lens contribution per configured seat, with missing/timeout explicit; structured verdicts and unanimous/majority decision are mechanical; only below-cap inconclusive advances and cap exhaustion holds; accepted replay invokes no seat; the complete frozen read-only Codex argv/effective-surface policy and trusted immutable evidence pass; no consensus dependency. |
| L-003 | R-039,R-048,R-054 | Productionize public-devloop worktree preparation seam. | One bounded module uses only admitted public APIs through the non-escalating Git broker; exact prepare/recover/exact-ref-checkout argv may write resolved worktree content plus common/linked metadata with a typed receipt, issues the bounded Codex content grant, and rejects replay/path/quota/out-of-effect content writes; no generic Git/file replacement. |
| L-012 | L-003,R-039,R-051 | Productionize substrate Codex implementation invocation. | Bounded prompt/worktree/grant/identity/timeout and provenance pass under dedicated keyring-backed Codex home plus empty process HOME using installed global-before-`exec` argv; context/user config/rules/project docs/`.agents` and ambient surfaces are absent; managed requirements exactly match or block; managed-requirement/resolved-config/tool-surface digests and negative probes match; ephemeral/fail-closed policy and an explicit workspace-write sandbox limited to the issued content-only worktree grant pass, with no network/bypass/unsupported model-effort. |
| L-013 | L-003,R-039 | Productionize public-devloop Git commit/push seam. | Commit/push uses only admitted public APIs; exact branch/remote/idempotency/effect tests pass. |
| L-014 | L-013,R-039 | Productionize public-devloop PR creation/correlation seam. | Qualified issue/PR/head relation and duplicate/retry/effect tests pass; no app GitHub replacement. |
| L-015 | L-012,L-014 | Integrate implementation→PR runtime module. | Module-local event flow/provenance/error/replay suite passes without shared package manifest edits. |
| L-004 | R-039,R-045,R-051 | Productionize Council review-decision evidence seam. | Exact-roster read-only-sandbox review rounds, structured verdicts, mechanical decision, and dissent bind to workflow run and exact reviewed head in immutable read-back-confirmed comment envelopes; the complete frozen Codex argv/effective-surface policy and ambiguity-without-auto-retry rules pass. |
| L-016 | L-004,R-039 | Productionize exact-head/CI machine gate. | Stale head, incomplete/failed/pending checks, and approved exact head produce correct fail-closed result. |
| L-017 | L-016,R-039,R-045,R-053 | Productionize public-devloop terminal/merge-posture seam. | DRY/operator hold always works through immutable evidence; LIVE merge code/surface exists only when R-053 records an admitted merge capability, with fresh exact-head receipt/reconciliation; ambiguity becomes unknown-merge hold, never ordinary operator-merge copy; no raw wrapper. |
| L-019 | L-004,L-016,L-017 | Integrate review→gate→terminal runtime module. | Module-local event/policy/posture/replay/ambiguous-terminal suite passes without shared manifest edits. |
| L-011 | L-001,L-002,L-015,L-019 | Integrate loop package manifest/entrypoint/event graph. | Shared manifest/graph/entrypoint changed only here; every design/review/CI/failure outcome crosses modules through the frozen bounded route family, existing PR is reused on rework, and conformance/import/replay suites pass. |
| L-005 | C-002,C-008,C-021,C-022,R-025,R-046,R-048,R-057,R-058,L-011,A-016 | Implement app-owned direct host composition. | Collision-safe project-root/managed-Git-tree topology uses the resolved immutable six-root profile, non-escalating Git/worktree capability grants, and typed filesystem/lifetime launchers; reference packages are absent; protected/default-deny paths remain read-only or unreachable. |
| L-020 | C-002,C-010,C-019,A-017 | Implement immutable per-launch snapshot and acceptance service. | Stopped-only exact-byte launch snapshot embeds the canonical resolved filesystem profile and is read-only; direct receipt binds connection/package/graph/Workflow/Council/launch/snapshot/profile digests; edit/path-identity/external-change/running races become pendingStop/conflict and invalidate Doctor. |
| L-006 | C-003,C-007,C-022,D-004,L-005,L-020,A-018 | Implement lifecycle state machine. | Implements lifecycle/query ports; start binds immutable snapshot/profile and waits for matching runtime receipt before active; every normal, unexpected nonzero/signal, timeout, stop, parent/control-death exit waits for a matching cleanup receipt; unknown/nonzero/profile-mismatched cleanup enters fatal `cleanupFailed`, blocks launch, and exposes only contained reconcile; fresh runtime/stable durable/no-auto-restart/re-Doctor/unowned tests pass. |
| L-007 | C-009,L-015,L-019,L-006 | Implement integrated-loop effect guard. | DRY/LIVE matrix, separate allowlist/confirmation, fresh actor/repo/origin/branch/transport proof. |
| L-008 | C-010,C-019,L-001,L-002,L-020,A-018 | Implement desired/next-launch/active config reconciliation. | Draft/written/pendingStop/acceptancePending/acceptedForNextLaunch/active states distinguish direct receipt, launch intent, and supervised receipt; exact same process/snapshot required; no hot reload. |
| L-009 | L-001,L-002,L-015,L-019,L-006,R-050 | Implement proxy-free restart/replay recovery. | Public generic kernel plus app transition/comment receipts re-derive truth after cache deletion/relaunch/repeated events with no proxy request, repeated seat, or duplicate effect. |
| L-010 | A-001,L-005,L-006,L-007,L-008,L-009 | Headless runtime integration. | Configure→Doctor→activate→DRY run→observe→stop passes with full provenance and clean roots. |

Endpoint adapters A-011..A-015 and runtime module leaves L-001..L-004,
L-012/L-013/L-016 offer the largest safe fan-out. A-002, L-015, L-019, and
L-011 are serial integration owners; shared schema changes are forbidden after R-039.

## Wave B — application use cases

These tasks keep orchestration out of widgets and external mechanics out of the
application layer. They depend on domain ports; unit tests use fakes. Concrete
adapters are wired only at the composition root.

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| B-001 | U-023 | Implement application result, command, cancellation, and freshness primitives. | Immutable typed success/empty/stale/partial/blocked/ambiguous/conflict/failure results have exhaustive tests; package imports domain only. |
| B-002 | B-001,D-001 | Implement Setup/Connection/Doctor use cases. | Create/edit/select/provision/run-Doctor commands invalidate revisions exactly, return typed remediation, and pass exhaustive port-fake tests; application imports domain only. |
| B-003 | B-001,D-002 | Implement Workflow/Council catalog, draft, validate, diff, save, accept, and activate use cases. | Active versus next-launch states, stopped-only acceptance, conflicts, and unsupported fields are exact through port fakes; no direct file/process import. |
| B-004 | B-001,D-003 | Implement Work query/filter/group/detail/refresh use cases. | One canonical qualified set feeds list/board/detail; atomic generations and stale/partial/unknown semantics pass with port fakes. |
| B-005 | B-001,D-004 | Implement Runtime observation and lifecycle use cases. | Query/refresh preserves all six acquisition states, delivery/process separation, completeness and freshness; Start review, accepted-next-launch precondition, starting/runtime-ack deadline, active only after exact supervised receipt, timeout/mismatch owned-stop, stop/restart, ownership, posture, stale Doctor, crash, and cancellation are exhaustive; unknown/nonzero cleanup enters `cleanupFailed`, blocks Start/Restart, and exposes only contained cleanup/reconcile until a zero-survivor receipt. |
| B-006 | B-001,D-006 | Implement guarded human-write use cases. | Confirm/create/comment/reconcile flows expose no generic mutation and never retain bodies; retry is offered only for `confirmedNotSent`, while unresolved `publicationOutcomeUnknown` remains a no-auto-retry hold. |
| B-007 | B-001,D-007,D-008 | Implement Fleet, recovery, Settings, and diagnostics use cases. | Multi-connection commands, pause/cache purge, explicit restore/export/new-store, write switches, and diagnostic preview/export remain isolated and typed through fakes. |
| B-008 | B-001,D-005 | Implement Council-run evidence query use cases. | Qualified round/seat/contribution/decision/dissent/permalink filters preserve exact roster order, trust/completeness and never infer missing verdicts. |
| B-009 | B-004,B-005,B-008,D-007 | Implement Overview attention-query use case. | Rollups link to real remediation/work/runtime evidence, preserve connection/freshness, and expose no decorative KPI. |

## Wave P/W/F — product UI, human writes, fleet/resilience

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| P-001 | U-007,U-012,U-011,B-002 | Build readiness/Doctor ViewModels and views. | ViewModels import application only; all six acquisition states pass; every failed/partial check shows evidence/remediation; blocked Setup cannot start/edit fake controls. |
| P-002 | U-013,U-011,P-001,B-002 | Build dependency/connection onboarding ViewModels and views. | Setup stepper, managed-clone provisioning, contexts/roots/claim/posture fields, all six acquisition and relevant mutation states, revision invalidation, and keyboard tests pass through application use cases only. |
| P-003 | U-008,U-011,B-003 | Build Workflow catalog ViewModel and view. | Qualified definitions show schema/id/version/digest/activation and all acquisition states with no editor behavior or adapter import. |
| P-014 | P-003,B-003 | Build Workflow definition detail ViewModel and view. | All six acquisition states plus stages/Council assignments/gates/exhaustion/effects/source/running-vs-next evidence and authoritative links render exactly through application queries only. |
| P-004 | U-014,U-011,P-014,B-003 | Build Workflow authoring ViewModel and view. | Only supported fields; all six acquisition and every relevant mutation state plus validation/diff/conflict/backup/pendingStop/accepted-next/active widget+integration tests pass. |
| P-005 | U-015,U-011,B-003 | Build Council authoring ViewModel and view. | All six acquisition and relevant mutation states pass; seats/policies/bounds/assignments/deterministic decision rules and next-launch states are exact; prompt/model/score absent. |
| P-006 | U-016,U-011,B-008 | Build Council-run evidence ViewModel and view. | All six acquisition states pass; round/seat/decision/dissent/completeness/permalink filters show no inferred metric. |
| P-007 | U-009,U-011,B-004 | Build Work-list ViewModel and view. | Qualified rows, Workflow/Council/claim/head/CI/freshness fields and all six states pass. |
| P-008 | U-017,U-011,P-007,B-004 | Build Work-board/grouping ViewModel and view. | All six acquisition states pass with the same canonical membership/totals across Workflow/stage/Council/connection/claim groupings. |
| P-009 | U-018,U-011,P-006,P-007,B-004,B-008 | Build Work-detail/evidence ViewModel and view. | All six acquisition and relevant human-action mutation states pass through application use cases only, with required evidence order, authoritative links, runtime separation, and unknown/reference handling. |
| P-010 | U-010,U-011,B-005 | Build Runtime/run-control ViewModel and view. | ViewModel imports application only; all six acquisition/lifecycle mutation states pass; Start review labels preflight and binds snapshot/revision/filesystem-profile digest, summarizing six roots/protected paths/Git-broker-versus-Codex authority without credential paths; starting waits for runtime ack and never activates from PID; timeout/`cleanupFailed` remediation, zero-survivor evidence, blocked controls, delivery separation, and real posture/merge-or-hold copy pass. |
| P-011 | U-019,U-011,P-006,P-007,P-008,P-009,P-010,B-009 | Build Overview ViewModel and view. | All six acquisition states pass with only actionable real rollups; no decorative KPI or manufactured health. |
| W-001 | C-009,C-011,D-006 | Implement narrow human-write adapter and guard. | Implements the frozen interface with exactly create-issue/comment/reconcile variants; bot/repo/global/fixture guards tested. |
| W-002 | W-001,A-002 | Implement opted-in issue creation. | Correct repo/label/actor/audit; only confirmed-not-sent may retry; unresolved ambiguity remains `publicationOutcomeUnknown` without automatic retry. |
| W-003 | W-001,A-002 | Implement human comment. | Qualified target/actor/audit/body non-persistence; only confirmed-not-sent may retry; unresolved ambiguity holds without automatic retry. |
| W-004 | W-002,W-003,B-006 | Build issue/comment ViewModels and views. | All six acquisition and every mutation state pass; composers appear only when guard passes; ViewModels import application only; confirmation/error/ambiguous/reconciling/rate states are accessible. |
| W-005 | C-011,W-002,W-003,L-007 | Build bounded audit view/export source. | Human and delegated effects remain separate; bodies/tokens/raw stderr absent. |
| F-001 | A-008,A-009,A-010,L-006,D-007 | Implement fleet application model. | Implements fleet ports; five connections isolate state/failure, share only intended rate pool, and expose bounded rollups. |
| F-002 | U-020,U-011,F-001,B-007 | Build Fleet ViewModel and view. | All six acquisition and relevant pause mutation states pass; select/pause/freshness/degradation actions work through use cases; hidden connections are deprioritized not starved. |
| F-003 | C-004,C-011,W-005,D-008 | Implement redacted diagnostics export. | Implements diagnostics ports; preview/redaction/home-prefix/body/secret tests pass and export audit is recorded. |
| F-004 | C-006,U-021,U-011,B-007 | Build store-recovery/migration ViewModel and view. | All six acquisition and every recovery mutation state pass; preserve/restore/export/new-store paths are explicit, keyboard accessible, use application commands, and never silently destructive. |
| F-005 | F-001,F-002,F-003,F-004,P-011 | Enforce resource/performance budgets. | Hostile large fixtures remain responsive; caps/truncation visible; measured thresholds in CI. |
| P-013 | U-022,U-011,B-007 | Build Settings/preferences/diagnostics ViewModel and view. | Preferences, write switches, diagnostics export, and cache actions use application commands only, are guarded/accessible, and cover all six acquisition plus every relevant mutation state. |
| P-012 | I-002,P-001,P-002,P-003,P-004,P-005,P-006,P-007,P-008,P-009,P-010,P-011,P-013,P-014,W-004,F-002,F-004 | Integrate production routes/barrels/composition root. | Shared production router/barrels/composition edited only here and waits for concrete adapter/runtime integration; grouped Operate/Design/System/Settings navigation, Setup stepper, context bar, full keyboard traversal, every D-port-to-infrastructure binding, and architecture/runtime query smoke pass with no global locator or fake in production. |

## Serial CI integration tasks

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| I-001 | U-011,U-023,C-004,C-006,C-008,C-009,C-010,C-019,C-020,C-021,C-022,D-001,D-002,D-003,D-004,D-005,D-006,D-007,D-008,B-001 | Integrate shell/core/architecture suites into root CI. | Root CI entrypoint changed only here; architecture lint plus every U/C/D/base-application suite runs with pinned tools, application-to-infrastructure hostile-import fixtures, and no duplicate/omitted target. |
| I-002 | I-001,A-001,A-002,A-003,A-004,A-005,A-006,A-007,A-008,A-009,A-010,A-016,A-017,A-018,L-010,L-020,B-002,B-003,B-004,B-005,B-008,B-009 | Integrate adapter/runtime/application suites into root CI. | Root CI adds all A/L/application graph/import/runtime suites deterministically; port conformance/wiring, runtime query/refresh, direct+runtime config receipts, immutable evidence carrier, managed-clone/project-root, complete Codex effective-surface policy, filesystem containment, hostile lifetime/cleanupFailed, and dependency-root gates execute. |
| I-003 | I-002,P-012,F-005,B-006,B-007 | Integrate product UI/write/fleet suites into root CI. | Root CI adds all remaining application/P/W/F widget/integration/security/performance suites; full pre-E2E gate is one green command. |

P-001, P-003, P-005, P-006, P-007, P-010, W-001, F-001, F-003, and F-004
can begin together once their individual dependencies are green.

## Wave E — system acceptance

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| E-001 | I-003,P-012 | Automate full fixture operating loop. | All 15 steps, all six acquisition states on every primary view, and every applicable mutation state pass with effects disabled and deterministic evidence. |
| E-002 | I-003,L-010,P-012 | Run complete admitted DRY evidence flow. | Actual new-graph effects match matrix; no fictional concatenation or unexpected mutation. |
| E-003 | E-002,W-004 | Run allowlisted LIVE sandbox scenario matrix. | Separate isolated issues/runs cover happy hold, Council changes→implement, CI failure→implement, implementation-attempt cap, Council inconclusive/round cap, total transition/cycle caps, and existing-PR reuse. Comment publication retries only after `confirmedNotSent`; unresolved ambiguity produces `publicationOutcomeUnknown` hold without auto-retry. When R-053 admits merge, also cover happy merge, ambiguous then confirmed, and unresolved→`hold/mergeOutcomeUnknown`; otherwise prove merge code/control absent plus operator-hold evidence/copy. Every reached stage/terminal has Workflow/Council/Codex/head/effect provenance. |
| E-004 | R-058,C-022,L-006,L-009 | Run ownership/lifecycle drills. | Receipt/launch/ack, normal/unexpected exit, app kill/crash/relaunch, control EOF, hang/escalation, nested/new groups, detach/PID reuse, unowned/stale/restart/cache-loss are exact. Receipt identity/profile/exit/scan fields plus exclusive-carrier writer/path/atomic-fsync/relaunch recovery reject malformed/stale/replayed/partial/log-inferred cases; each path proves zero survivors or visible `cleanupFailed` and clears only through a new contained receipt. |
| E-005 | W-001,W-002,W-003,W-004,W-005,L-002,L-004,L-007,L-012 | Run auth/write/effect drills. | Wrong actor/repo/Codex-home/process-HOME/`.agents`/context/argv-order/config/rules/trust/project-docs/managed-requirements/skills/hooks/web/MCP/apps/plugins/goals/multi-agent/resolved-surface/worktree-grant/sandbox/claim/branch/origin/rate/timeout/ambiguous cases fail safely; unavailable-tool/process probes pass; assignee/bypass/proxy/automatic-ambiguous-retry paths are absent and surfaces isolated. |
| E-006 | A-001,A-002,A-003,A-004,A-005,A-006,A-007,A-008,A-009,A-010,A-011,A-012,A-013,A-014,A-015,F-001 | Run source/fleet failure drills. | Substrate/GitHub/schema/rate/hang/truncation cases preserve truthful stale/unknown and other connections. |
| E-007 | C-005,C-006,F-003,F-004 | Run data/privacy/recovery drills. | Migration/corruption/secret scan/diagnostics/cache-drop preserve rules and recovery. |
| E-008 | U-006,F-005,P-012 | Run accessibility/responsive/performance acceptance. | Keyboard/semantics/contrast/reduced motion/narrow width/large data pass across every shipped surface. |
| E-009 | E-001,E-002,E-003,E-004,E-005,E-006,E-007,E-008 | Assemble requirement/readiness evidence dossier. | Every requirement/task links commits/tests/artifacts; executable containment has no escape; the secondary audit has zero unexpected delta, and every expected DRY/LIVE package-authored or engine-managed effect matches the frozen matrix and typed receipt. |
| E-010 | E-009 | Fable integration advisory. | Architecture, scope, risk, and operational recommendations are dispositioned before final audit. |
| E-011 | E-009,E-010 | Independent Opus system audit. | No unresolved P0/P1 authority/security/spec/release finding. |
| E-012 | E-011 | Record mechanical system-acceptance dossier. | PM reruns critical gates, returns failures to owning package agents, and records only fully green admitted scope for HG-04; E-012 does not grant a tier. |

Failure drills E-004..E-008 can run in parallel against isolated fixtures;
LIVE E-003 serializes on its sandbox.

## Wave X — packaging and release

| ID | Depends | Task | Acceptance criteria |
|---|---|---|---|
| X-001 | E-012 | Configure minimal macOS packaging/entitlements. | Release artifact builds; each entitlement justified; no App Store claim. |
| X-002 | E-012 | Prove Finder tool/dependency discovery. | Clean GUI environment resolves exact substrate/devloop graph/gh/git/codex contexts without login shell. |
| X-003 | X-001 | Sign, notarize, staple, and Gatekeeper-test. | Archived Apple/notary/spctl/staple evidence; development artifacts remain labeled. |
| X-004 | E-012 | Complete licenses/notices/SBOM. | App, substrate, devloop closure, Flutter/Dart/native components correctly attributed; no reference code copied. |
| X-005 | X-001,X-002,X-004 | Prove clean install/upgrade/recovery/uninstall docs. | Fresh and prior-version installs, migration/restore, supported-platform and cleanup instructions verified. |
| X-006 | X-003,X-005 | Final listener/process/secret/accessibility scan. | Packaged artifact matches dossier with no undocumented network/process/secret/surface behavior; killing the packaged app exercises the proven outer job and leaves zero descendants or a persisted, visible `cleanupFailed` launch block. |
| X-007 | X-006 | Fable release advisory. | Operational/recovery/known-limit advice dispositioned. |
| X-008 | X-006,X-007 | Independent Opus release audit. | Reviewer approves artifact+dossier against `full-app/v2` or returns exact findings. |
| X-009 | X-008 | Record mechanical release dossier. | PM records the exact green artifact and claims for HG-05 or returns work to owning agents; only the human HG-05 receipt can authorize tag, release, or submission. |

## PM wave-gate checklist

At every wave boundary the main PM must:

1. verify all prerequisite tasks are `ACCEPTED` and integrated in dependency order;
2. rerun shared contract/graph/import/format/analyze/test gates;
3. compare delivered scope to authoritative requirements/readiness;
4. obtain Fable advice for architecture/dependency/release gates;
5. confirm every task has an independent Opus verdict and resolved findings;
6. check worktrees/branches for unintegrated or overlapping changes;
7. update task DAG when evidence changes through the mutation protocol; and
8. return nonconforming work to its original GPT-5.6 Sol owner rather than
accepting a waiver or silently repairing it in the PM branch.

## Ownership lanes and serial integration points

The dispatch packet narrows these lanes to exact files before a task becomes
READY. Parallel tasks must not edit the shared integration owner files.

| Lane | Exclusive task-owned paths | Serial integration owner |
|---|---|---|
| Workflow contract | `contracts/specs/workflow/**`, Workflow-only fixtures/tests | R-019 for authoritative spec disposition; R-020 manifest |
| Council contract | `contracts/specs/council/**`, Council-only fixtures/tests | R-011 bindings, then R-019 disposition |
| Compatibility/config/evidence contracts | `contracts/specs/compatibility/**`, `acceptance/**`, `evidence/**` | R-043, then R-019 disposition |
| GitHub/Codex context contracts | `contracts/specs/contexts/github/**` or `codex/**` respectively | R-019 disposition |
| Public devloop required seams | dependency-repo task branches only | R-041 visibility → R-045 immutable evidence → R-055 restart; R-005 pins all |
| Public devloop optional merge seam | dependency-repo task branch only when pursued | R-042 resolves capability; R-053 freezes admitted-or-hold disposition |
| Substrate capability seams | dependency-repo task branches, serialized on one integration lineage | R-051 Codex → R-056 topology fallback if needed → R-054 containment if upstream → R-052 final build/pin |
| Outer job/lifetime proof | `contracts/process-lifetime/**`, disposable launcher fixtures | R-057 contract → R-058 proof; C-022 alone productizes the frozen mechanism |
| Domain port contracts | feature-local `lib/domain/ports/**` and matching fakes | D-001..D-008 own disjoint concerns; U-023 owns only the boundary policy |
| Loop Workflow runtime | `loop-package/workflow/**` | L-011 shared package graph/entrypoint |
| Loop Council runtime | `loop-package/council/**` | L-011 |
| Implementation/PR runtime | `loop-package/implementation/**` | L-015, then L-011 |
| Review/gate runtime | `loop-package/review/**`, `gate/**`, `terminal/**` | L-019, then L-011 |
| Shared loop manifest/entrypoint/event graph | no parallel task may edit | L-011 only |
| Flutter fixture router/barrels | no leaf task edits shared integration files | U-011 only |
| Flutter production router/barrels/composition | no leaf task edits shared integration files | P-012 only |
| Flutter layer/import policy | `lib/domain/**`, `application/**`, `infrastructure/**`, `presentation/**` boundaries | U-023; P-012 wires only |
| Application use cases | feature-local `lib/application/use_cases/**` | B-001 primitives; B-002..B-009 own disjoint features |
| Managed clone adapter | `lib/infrastructure/**/managed_clone*` only | A-016; L-005 consumes port |
| SQLite schema/migration registry | no repository task edits after freeze | C-005/C-006 only |
| CI root entrypoints | leaf tasks add local test targets only | I-001, then I-002, then I-003 |

R-007, R-009, R-012, R-013, R-043, R-044, and contract-only R-046..R-050 produce lane-local artifacts and do
not edit `docs/spec/` in parallel. R-019 is the single authoritative spec
integration/disposition task. L-001..L-004 and L-012..L-017 stay in their
module lanes; L-011 alone edits the package manifest/shared graph/entrypoint.

⟦AI:FKST⟧
