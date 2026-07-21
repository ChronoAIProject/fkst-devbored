# Tiered readiness and authorization ledger

Status: **AUTHORITATIVE — CURRENT TIER T0_FOUNDATION**
Version: `full-app/v2`
Audited: 2026-07-21

Red P0 rows continue to block runtime-connected app, lifecycle, and adapter
coding. HG-01 may separately authorize only frozen-contract fixture/fake-backed
Flutter and pure layers. HG-02 cannot authorize contained local/DRY runtime
until the admitted P0 scope and R-039 are green. HG-03..HG-05 separately guard
LIVE effects, release-candidate work, and submission.

## Verdict

**T0 FOUNDATION — NOT READY FOR FIXTURE UI OR RUNTIME CODING.**

The two intended dependencies and the app-owned Workflow/Council semantic
contracts exist, but the thin app-integrated package and executable runtime
proof do not. The previous `full-app/v1` documents incorrectly substituted the
entire `fkst-packages`/`devbored` composition for the second dependency.

The requested multi-agent delivery system is proven and active: G-001..G-007
passed, the six R1 roots completed the Sol → Fable where required → fresh Opus
→ PM loop, all 15 changed-path intersections were empty, and the wave is
integrated. This opens further Step-0 work. The accelerated HG-00 mutation is
being reviewed; until it is activated and HG-01 is approved, no Flutter
product/UI starts. R-039 remains mandatory for HG-02 and every runtime path.

## Verified inventory

| ID | Priority | Claim | Evidence checked | Status | Required closure |
|---|---:|---|---|---|---|
| RDY-01 | P0 | `fkst-substrate` checkout and engine source exist | R-001, R-002, R-003, and R-051 integrated: checkout/platform, release-binary SHA/self-test, frozen observe/provenance fixtures, pinned 20-file/54-range direct-host inventory, and the safe managed-Codex source/test path are frozen; embedded source still differs from checkout and no build manifest proves the final tie | PARTIAL | R-052 pins and proves the final binary/source build tie |
| RDY-02 | P0 | public `devloop` library exists and its exact admitted surface is frozen | R-004 integrated: commit, stable id, 118-export deterministic digest, declared closure, license posture and direct-import boundary are frozen | PARTIAL | R-041 adds chosen app visibility; R-005 pins the required public changes; R-045/R-055 close evidence/restart seams |
| RDY-03 | P0 | app package may import `devloop` under its own identity | current `devloop` visibility allowlist omits `fkst-devbored-loop` | FAIL | land/test narrow visibility for the chosen stable app-package id or another explicit public integration mechanism |
| RDY-04 | P0 | thin app-integrated FKST loop package exists | no `fkst.toml` or Lua package exists in this repo | FAIL | create only after contracts below freeze; prove its graph loads without reference packages |
| RDY-05 | P0 | public devloop APIs/substrate primitives are sufficient for the full admitted loop, and the shipped graph keeps the exact boundary | R-016 integrated a pinned 28-public-export/16-reference-object capability-and-authority map with 42 positive and two negative identity probes; it deliberately retains four RED generic-capability gaps and supplies no runtime proof | FAIL | R-042/R-045/R-055 close or explicitly cut the red public seams; executable R-033 probes and graph/import lints must keep all reference packages absent |
| RDY-06 | P0 | app-owned Workflow schema is frozen and consumed | R-007, R-008, and R-011 integrated: seven-stage semantics, exact 24-route family, shared canonical bytes/digests, nine positive/hostile Dart cases and matching pinned-substrate Lua 9/0 corpus, and the frozen Workflow→Council cross-schema seam are executable; no app-loop consumer exists | PARTIAL | R-022/R-043 execute the real loader, routes, caps, exhaustion, and reasonCode corpus |
| RDY-07 | P0 | app-owned Council schema is frozen and consumed | R-009, R-010, R-011, and R-017 integrated after same-owner precedence rework: Fable/Opus/PM-accepted seats/policies/rounds/decisions/dissent, 26 declarative fixtures, the executable canonical/reducer/hostile corpus, the Workflow→Council assignment contract, and the Council/Codex boundary map exist; no executable runtime consumer exists | PARTIAL | R-023/R-031 prove the runtime consumer and bounded rounds |
| RDY-08 | P0 | direct substrate host/launch seam works without package runner/reference package | not yet recorded | FAIL | minimal read-only-root host fixture and exact argv/env/provenance transcript |
| RDY-09 | P0 | Codex CLI personal-account context survives sanitized launch | R-013 and R-051 integrated: the installed-path policy, dedicated keyring-backed Codex home, distinct empty process HOME, include-only environment, installed global-before-`exec` grammar, ambient denials, and deterministic receipts pass 145 fake-executable tests; login status and a bounded real worker were deliberately not executed | PARTIAL | R-029 proves version/login/worker under the exact sanitized personal-account environment without credential persistence; R-052 binds the final substrate build |
| RDY-10 | P0 | target label claim mode reaches loop without proxy | R-012, R-014, and R-049 integrated: exact `fkst-dev:claimed` label-only/dual-context contract, the frozen label-only v1 claim disposition, and pinned public claim/trust export identities are frozen; assignee, proxy, and global-switch paths fail closed declaratively; runtime behavior is unproven | PARTIAL | R-029/R-030 execute sanitized label admission, claim, restart, and hostile assignee/proxy cases; R-041/R-005 must make the selected public surface importable and pinned |
| RDY-11 | P0 | app contracts match actual dependency schemas and run from isolated worktrees | R-008, R-010, R-011, and R-059 integrated: the Workflow canonical/hostile corpus, the Council executable corpus, the Workflow→Council cross-schema parity, and the provenance-bound legacy-harness disposition are reproducible from an isolated worktree against the pinned substrate | PASS | keep the default `dart test`/contract-kernel suites green from the primary and isolated worktrees; no runtime consumer is claimed |
| RDY-12 | P0 | reference behavior is guide-only | documents previously made `devbored` the runtime authority | PASS IN SPEC | enforce with graph/import lint and source-provenance review |
| RDY-13 | P1 | model/effort selection is effective | reference package forwards values; audited substrate drops them before `codex exec` | FAIL/GATED | omit controls until pinned substrate support plus cross-dependency test |
| RDY-14 | P1 | package health is safe/read-only | reference runner writes a fixed cache in packages checkout | FAIL/GATED | omit; do not copy parser/classification logic |
| RDY-15 | P1 | personal Codex Pro replaces stale proxy handoff assumptions | proxy instructions are now labeled historical; current shell is ChatGPT-authenticated | PARTIAL | verify fresh `/feedback` success/session id under current personal login |
| RDY-16 | P0 | one machine-readable compatibility manifest closes the Step-0/runtime/UI contract | manifest was referenced but not defined in the first v2 pass | FAIL | freeze schema plus canonical fixture containing pins, graph/imports, direct host/config acceptance, bounds, evidence carrier, and every effect seam |
| RDY-17 | P0 | config activation cannot change underneath a running loop | desired/preflight receipt is specified, but supervisor launch intent does not prove a real supervised department consumed the snapshot | FAIL | prove stopped-only snapshot → direct no-effect receipt → same-snapshot supervisor → bootstrap event → bounded runtime-consumption receipt bound to process instance; timeout stops and never marks active |
| RDY-18 | P0 | durable app Workflow/Council work evidence has a real carrier without `github-proxy` | public direct comment commands are raw one-call writes with no posture, immutable envelope, dedup, read-back reconciliation, or typed receipt; proxy queues remain prohibited | FAIL | add/pin narrow public devloop publish/reconcile/receipt capability; prove immutable marker, trusted author, digest chain, ambiguous hold, replay, and duplicate conflict |
| RDY-19 | P0 for autonomous merge | exact-reviewed-head merge is available through public devloop | no public merge effect found; observed executor lives in forbidden `github-devloop-pr` | FAIL/GATED | add and pin a narrow public exact-head gate/recheck/merge/reconcile/receipt capability; until then only `hold` terminal may ship |
| RDY-20 | P0 | Codex personal-account worker invocation matches the installed CLI and the complete frozen ambient-surface/effect policy | R-051 is integrated at substrate `e38358a0552c4133414836bf52df6593908fe547`: its opt-in managed profile enforces installed global-before-`exec` argv, absolute executable/worktree, dedicated keyring-backed Codex home, distinct empty process HOME, include-only environment, no context/model/effort/danger bypass, strict untrusted zero-project-doc posture, disabled ambient features, explicit non-dangerous role sandbox, deterministic managed/config/tool-surface digests, and fail-closed negative probes; fake-executable and framework suites are green, but the app-specific issued worktree grant and real personal-account smoke are unproven | PARTIAL | R-029 executes the bounded installed personal-account smoke; R-048/R-054 prove the content-only worktree grant and containment boundary; R-052 pins the final substrate build and negative probes |
| RDY-21 | P0 | substrate project root and managed Git root resolve without contaminating the target repository | substrate couples project-root/cwd/Git discovery; candidate reserved in-clone composition subdirectory is not proven | FAIL | R-046 freezes the contract; R-056 proves the disposable reserved topology or lands/pins an explicit root-separation seam |
| RDY-22 | P0 | substrate process tree is filesystem-contained | `file.*` accepts arbitrary paths; chmod on known roots plus effect audit is detection, not containment | FAIL | R-048 freezes six bounded templates plus the resolved launch profile; R-054 proves a root-confined boundary or sandbox with non-escalating brokers—a process-wide sandbox alone is insufficient. Git common/linked metadata is broker-only; broker content writes are limited to receipted prepare/recover/exact-ref-checkout; Codex gets an issued content-only grant; generic file/exec cannot borrow either; R-052 pins the result and Linux LIVE/Codex is explicit |
| RDY-23 | P0 | restart/replay is proxy-free for the app evidence schema | generic restart kernel may be reusable, but the existing full replayer emits `github-proxy.*` requests | FAIL | R-055 proves the public kernel or lands a generic adapter; R-050 freezes its app-transition/safe-comment mapping; no reference replayer assumption |
| RDY-24 | P0 | Workflow outcome routes and evidence facts are complete/non-circular | ordered stages and an undefined evidence fact previously left rework, cap exhaustion, and permalinks impossible | PASS IN SPEC | freeze exhaustive family/outcome/attempt-round-cycle-transition exhaustion fixtures plus kind/fact/head invariants, base64url marker, transport metadata, and Dart/Lua parity in R-043/R-028 |
| RDY-25 | P0 | owned process lifetime is contained across app/control/supervisor failure | the audited supervisor can group children during graceful cleanup, but no proven outer job/launcher guarantees parent-death cleanup, unexpected outer-exit handling, detach/new-group denial, PID-reuse safety, or a durable identity-safe receipt after app death | FAIL | R-057 freezes lifetime/receipt/exit and exclusive boundedLog carrier; R-058 proves exits, app crash+relaunch, EOF, hang/escalation, descendants, detach/PID reuse, atomic+fsynced recovery, wrong writer/path, and hostile receipts; C-022 productizes only that mechanism; only a matching complete zero receipt clears cleanup, while unknown/nonzero/invalid cleanup blocks every run |

## Execution-governance readiness

These are P0 for dispatching any engineering task, including Step-0 proof code.
They do not replace product readiness. A narrow bootstrap exception permits
G-001..G-006 orchestration smokes only: they may create disposable isolated
fixtures/branches but may not edit product or dependency files. G-001 proves
the PM identity first; that identified PM may then run G-002..G-006. G-007 was
required before the already-dispatched v1 task protocol began; HG-00 separately
controls the v2 package cutover.

| ID | Required governance | Current status | Acceptance |
|---|---|---|---|
| ORG-01 | Main PM is an identified GPT-5.6 Sol session | PASS — G-001 | OpenAI `gpt-5.6-sol` PM session `019f8017-5bad-7302-b7fb-e081e3d35205`, Heca-originated and preserved in one thread; see [`G-001-main-pm.json`](evidence/governance/G-001-main-pm.json) |
| ORG-02 | Each implementation task can spawn its own GPT-5.6 Sol agent in an isolated branch/worktree | PASS — G-002 | Fresh Sol agent `019f80f7-7369-7000-8b41-443684ce9e6b` committed only fixture `f36aa63a12a2ef3498fdd81a4927076fc8741def` in isolated worktree; see [`G-002-sol-spawn.json`](evidence/governance/G-002-sol-spawn.json) |
| ORG-03 | Each task can receive an independent Opus review agent with no implementation authorship | PASS — G-003 | Distinct Opus agent `019f80f9-376f-7243-bbca-9166908a1bff` returned `APPROVE` for exact committed diff with clean pre/post state; see [`G-003-opus-review.json`](evidence/governance/G-003-opus-review.json) |
| ORG-04 | Fable is reachable as the named standing technical advisor | PASS — G-004 | Standing Fable agent `019f80f4-39f6-78c3-94a4-cdd012616f7b` returned `PASS`; all six observations were dispositioned and follow-up returned `ACCEPTED`; see [`G-004-fable-advisory.json`](evidence/governance/G-004-fable-advisory.json) |
| ORG-05 | Task state/rework/merge gates are mechanically tracked | PASS — G-005 | Same Sol owner preserved rejected commit, fixed two Opus findings, received approval from a fresh second Opus session, then PM accepted; see [`G-005-rework-loop.json`](evidence/governance/G-005-rework-loop.json) and [template](evidence/governance/task-state-template.json) |
| ORG-06 | Parallel worktree ownership prevents overlapping contract/file edits | PASS — G-006 | Two concurrent Sol worktrees produced disjoint commits; real sets passed, hostile overlap failed `42`, and A→B integration was clean; see [`G-006-worktree-isolation.json`](evidence/governance/G-006-worktree-isolation.json) |
| ORG-07 | Accelerated package/human-gate cutover preserves coverage and fail-closed authority | CANDIDATE — HG-00 | 211 requirements map exactly once to 35 packages; the v2 state machine, five human tiers, mechanical integration gate, Fable advice, fresh Opus review, and exact cutover receipt must pass before new v2 dispatch |

G-007 is **PASS**. The Fable gate returned `FABLE_G007: PASS` and the identified
Sol PM accepted the complete evidence in
[`G-007-pm-gate.json`](evidence/governance/G-007-pm-gate.json). This opens only
dependency-ready Step-0 work. The top-level authorization remains
**T0 FOUNDATION**. HG-01 may later grant fixture UI only; R-039 plus HG-02 are
both required before local/DRY runtime implementation.

Wave R1 is **INTEGRATED** on `codex/full-app-v2-00-readiness` at
`cc46dd029a699d55151c22a4259e52b7c6684c7a`. All six tasks are individually
`INTEGRATED`, and the collision guard checked all 15 pairwise path
intersections with no collision. See
[`R1-integration.json`](evidence/governance/R1-integration.json). This changes
no P0 runtime row to PASS and does not open product/UI coding.

Wave R2-A is **INTEGRATED** with R-003, R-008, R-014, and R-016
collision-free and green under their v1 records; see
[`R2-integration.json`](evidence/governance/R2-integration.json). This advances
foundation evidence only and grants no higher authorization tier.

`PASS IN SPEC` means the authoritative rule is corrected; it is not runtime
evidence. RDY-12 becomes fully PASS only after the graph/import lints exist;
RDY-24 becomes fully PASS only after the exhaustive route/evidence parity suite.
RDY-25 cannot become PASS from ordinary shutdown evidence; its full hostile
lifetime matrix and zero-survivor/fatal-state proof are mandatory.

## P0 capability/authority matrix required by RDY-05

Step 0 must name the exact public devloop export, substrate primitive, or
app-owned seam for every row. An app-owned seam is admissible only for contract
translation or genuinely app-specific Workflow/Council orchestration on a
substrate primitive; it may never implement marker, claim, gate, replay, Git,
restart, or convergence behavior missing from public devloop. “Similar code
exists in a reference package” is a FAIL. High-risk rows require an executable
no-write or isolated-effect seam probe, not source inspection alone.

| Required behavior | Required Step-0 proof | Current status |
|---|---|---|
| Intake/admission | public validation/identity seam + Workflow opt-in probe | UNVERIFIED |
| Label claim/trust; assignee absent | public label claim/trust APIs; compatibility rejects assignee | UNVERIFIED |
| Workflow selection/stage progression/terminal | app schema + frozen exhaustive outcome family → thin adapter → public loop/substrate events | UNVERIFIED |
| Council execution/round/decision/dissent | explicitly sandboxed substrate Codex primitive + app evidence contract, with no consensus package | UNVERIFIED |
| Config acceptance and active-version binding | immutable snapshot + direct receipt + launch record + supervised runtime-consumption receipt | FAIL — runtime acknowledgement carrier/proof absent |
| Durable app evidence carrier | immutable app envelope in qualified trusted GitHub comment through public publish/reconcile/receipt seam | FAIL — raw command insufficient; `github-proxy.*` queues prohibited |
| Dedicated managed clone provisioning | argv-only create/fetch/reopen/origin/dirty-state contract; never adopt user checkout | UNVERIFIED |
| Composition/Git-root topology | collision-safe reserved in-clone project-root or pinned explicit root separation | FAIL — coupling not proven |
| Runtime filesystem containment | macOS process sandbox or root-confined substrate SDK | FAIL — effect audit is not containment |
| Owned-process lifetime containment | outer job/launcher with parent/control death handling, identity-safe descendant tracking, bounded TERM/KILL, detach denial, and zero-survivor receipt | FAIL — graceful supervisor cleanup is not an app-crash guarantee |
| Implementation worker | public devloop worktree/Git seam + substrate Codex invocation/provenance | UNVERIFIED |
| Push and PR correlation/creation | admitted public devloop Git/GitHub seam; otherwise remove the stage/scope | UNVERIFIED |
| Review and exact-head gate | public head/CI/review safety primitives + evidence probe | UNVERIFIED |
| Merge/terminal posture | public exact-reviewed-head merge effect + fresh machine gate + LIVE authority/reconciliation/receipt | FAIL for merge; `hold` remains admissible |
| Restart/replay/idempotency | proxy-free public restart kernel/app evidence seam + repeated-run fixture | FAIL — reference replayer is proxy-bound |
| DRY/LIVE complete effect matrix | process, Git, and GitHub effects of the new graph | UNVERIFIED |

Every row must become PASS or the corresponding Workflow stage/surface must be
removed from v1 before RDY-05 can pass. A minimal graph or one transition is
necessary but insufficient.

## Audit notes

- Substrate worktree was clean at audit. Existing binary SHA-256 values were
  `cda42823709ed5d1937a612008fc23380152816d766360441bb6261f05347163`
  (debug) and
  `4fb72bcf3f85f3543557c064e2cd683fc3187fdaed48ce1a2e48f7b850b1c830`
  (release). Neither digest is yet tied to an explicit build manifest, so it
  does not authorize release/start by itself.
- The packages source worktree contained only its pre-existing untracked
  `.DS_Store`; no dependency file was edited by this audit.
- `libraries/devloop/fkst.toml` declares `stable_id =
  "fkst.library.devloop"`, an exact public export list, declared library
  dependencies, and a visibility allowlist that omits `fkst-devbored-loop`.
- This app repo currently contains no `fkst.toml` or Lua package file. Only the
  historical Dart contracts exist; there is no integrated loop consumer.
- The historical Dart fixture harness is not worktree-portable: in the primary
  checkout it reaches sibling `packages/packages/devbored` and reports the
  known 19-pass/1-obsolete-valid-fixture result, but in the isolated R1 Heca
  worktree the sibling path does not exist and 18 tests fail before semantic
  evaluation. R-059 owns a repo-local, SHA-provenance-bound reference-fixture
  disposition; no symlink or ambient workspace-path workaround is admissible.
- Public `devloop.commands.prs` contains direct PR-create and issue/PR-comment
  commands, and public Git modules expose worktree/push operations. No public
  exact-head merge effect was found. The observed merge executor is under the
  prohibited `github-devloop-pr` package. Public request builders that emit
  `github-proxy.*` requests are builders only and cannot execute without the
  prohibited proxy package.
- The audited substrate Lua `file.*` SDK accepts arbitrary paths. Containment
  must therefore be proven through an executable OS process sandbox or a pinned
  root-confined substrate capability. Immutable/read-only roots and the effect
  audit are defense/evidence only; the app cannot assume the primitive enforces
  a boundary.
- Current official Codex CLI documentation identifies `codex --version` and
  `codex login status` as the non-mutating executable/auth checks. The latter
  confirms ChatGPT authentication, not subscription tier, sanitized child-env
  survival, model selection, or a successful worker request.
- The built-in collaboration surface does not expose provider/model selection
  and is not named-provider evidence. The current Heca nightly stores its
  bundled CLI at `/Applications/Heca.app/Contents/MacOS/heca-cli`, rather than
  the older skill-reference path, and its live daemon exposes selectable
  `gpt-5.6-sol`, `claude-opus-4-8`, and `claude-fable-5` routes. No
  `orchestration-preferences.json` exists, so every governance spawn freezes its
  provider/model explicitly. G-001..G-007 and ORG-01..06 are proven; Wave R1
  then exercised the real Sol/Fable/Opus/PM/rework/integration path under the
  [governance evidence index](evidence/governance/README.md).

## Required Step 0 evidence bundle

Step 0 closes only when one reviewable bundle contains:

1. exact commits and licenses for substrate and the devloop source distribution;
2. a machine-readable allowed dependency/import manifest;
3. the smallest app-package graph and a successful substrate load/conformance run;
4. canonical compatibility-manifest, Workflow family, Council, direct/runtime
   config-acceptance, concrete evidence-fact, and transported-app-evidence
   fixtures plus digest/version/activation rules;
5. differential tests showing reused public devloop behavior without copied logic;
6. exact direct/supervised-launch argv/environment, including label-only claim,
   isolated GitHub contexts, a dedicated keyring-backed Codex home plus distinct
   empty process HOME without `.agents`/personal dotfiles, no context, ignored
   user config/rules, strict untrusted zero-project-doc mode,
   disabled personal skills/hooks/web/MCP/apps/plugins/goals/multi-agent,
   matching managed-requirement/resolved-configuration/tool-surface digests,
   negative home/tool/process probes, ephemeral mode, fail-closed
   approval/network policy, explicit Codex sandboxes, and unavailable-tool probes;
7. observe/provenance/process fixtures;
8. DRY/LIVE effect matrix for the new integrated package, including the public
   immutable-comment evidence seam and exact-head merge-or-hold disposition,
   not the reference one;
9. executable filesystem-containment escape/allowed-effect evidence for the
   six bounded templates, canonical resolved launch profile, protected/default-
   deny paths, non-escalating broker boundary, Git common/linked metadata,
   content-only Codex worktree grants, profile/receipt binding, and every
   generic-file/exec/path/quota escape class;
10. outer job/launcher lifetime evidence for app/control/supervisor death,
    escalation, detach/new-group descendants, PID reuse, typed cleanup-receipt
    schema/version/size/digest/identity validation, zero survivors, hostile
    malformed/stale/replay cases, and the fatal `cleanupFailed` recovery path;
11. proxy-free restart/replay and managed-clone/composition-root evidence;
12. Doctor incompatibility fixtures; and
13. an independent adversarial review with no unresolved P0 finding.

## Forbidden shortcuts

- Renaming the existing `devbored` package “integrated.”
- Depending on reference event packages while describing them as transitive
  implementation details.
- Copying devloop Lua modules into this repository.
- Designing Flutter Workflow/Council screens from mocks before a real consumer
  and emitted evidence exist.
- Treating the reference package's passing tests as proof for the new graph.
- Starting later blueprint steps while Step 0 is red.
- Using a raw app-owned `gh pr merge` wrapper or copying the reference merge executor.
- Calling a `github-proxy.*` request builder an executable public effect.
- Treating a raw direct comment command as immutable, deduplicated evidence.
- Treating launch argv/PID as runtime configuration acknowledgement.
- Treating read-only known roots or an empty effect audit as containment.
- Treating graceful supervisor shutdown, a PID, or a process-group signal as
  proof that app death leaves zero descendants.
- Passing Codex `context`, omitting its sandbox, allowing the bypass flag, or
  inheriting unpinned personal config/MCP/hooks.
- Admitting the proxy-coupled assignee claim/replayer path in v1.
- Hot-reloading desired Workflow/Council files into an active run.
- Treating local runtime files/logs/deliveries as durable work evidence.

## V1 rescope note (2026-07-21, HG-V1R)

A bounded console-v1 product cut is executing per `FKST/PM-PLAN-V2-REFACTOR.md`
under ADR-035 and gate HG-V1R (`docs/spec/V1-RESCOPE-GATE.md`), using the
promoted `packages/devbored` runtime as a provisional, pinned exception to
ADR-031. This ledger, its tier, and its verdict continue to govern the
full-app/v2 track unchanged. v1 work makes no claim against any row here, and
per "How a row changes" below, a successful v1 run cannot turn any row green.
The HG-V1R.pin record (exact `packages` commit) will be appended to this note
when the pin gate closes.

## How a row changes

Every status change must cite the exact command/test artifact and dependency
commit in this file. A prose assertion, screenshot, mock, or successful run of
the old `devbored` topology cannot turn a row green.

⟦AI:FKST⟧
