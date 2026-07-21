# Full product specification

Status: **AUTHORITATIVE — TARGET PRODUCT; TIERED DELIVERY**
Version: `full-app/v2`

## Product statement

`fkst-devbored` is a local desktop host and operator environment for designing,
running, and understanding GitHub-native autonomous development through two
primary mechanisms:

1. **Workflows** define the bounded path work follows.
2. **Council** defines who deliberates at decision stages, under which policy,
   and what evidence must be emitted.

A thin loop package owned by this app adapts those versioned contracts to the
public `devloop` capability and runs them on `fkst-substrate`. Existing
devloop-based packages are guides and differential-test sources; they are not
the product runtime and are not hard-reimplemented.

The shortest accurate description is:

> Design the workflow, seat the Council, run it on FKST, and inspect the
> evidence behind every transition.

## Authority invariant

> GitHub and git own work facts and authored content. `fkst-substrate` owns its
> delivery ledger. The app's accepted Workflow and Council files own intended
> configuration. Public `devloop` contracts own reusable loop semantics.
> Everything else in the console is a projection, preference, staged edit, or
> audit record.

Consequences:

- The Flutter UI does not recreate the loop state machine.
- The integrated package uses public devloop behavior rather than copying its
  markers, claims, gates, convergence, replay, or Git mechanics.
- Trusted versioned evidence emitted by the integrated package determines the
  workflow/council projection; labels remain admission surfaces or hints.
- Engine observation describes deliveries/runtime, not issue or workflow truth.
- A Workflow/Council write is effective only after the runtime reports the
  accepted schema, version, and digest.
- Cached projections can be deleted without changing work or loop outcomes.

## Primary users

- A developer selecting or configuring a bounded workflow for a repository.
- A maintainer seating a Council and reviewing how its decisions affected work.
- An operator supervising several isolated loop connections.
- A reviewer tracing an issue/PR transition to GitHub, Council, workflow, and
  engine evidence.

## Full-app outcomes

The complete app must let an operator:

1. Prove the two dependency pins: substrate and the public devloop capability.
2. Prove the app-integrated loop package loads without reference runtime packages.
3. Connect a qualified GitHub repository and isolated GitHub/Codex contexts.
4. Select, inspect, draft, validate, diff, and activate a versioned Workflow.
5. Create/select a Council, seat named perspectives, and assign its policy to
   supported workflow decision stages.
6. Start a Doctor-authorized loop in DRY posture and explicitly authorize LIVE.
7. Admit a work item and see which workflow/version accepted it.
8. Inspect Council rounds, seats, decisions, dissent, provenance, and completeness.
9. Follow implementation, PR, review, gate, and terminal evidence without
   confusing substrate delivery facts with work state.
10. Add narrowly guarded human input as the verified operator.
11. Stop/restart only a loop process the app owns and re-derive truth after restart.
12. Operate several isolated connections and export redacted diagnostics.

Activation in v1 is deliberately next-launch, not hot reload: a running loop
keeps an immutable Workflow/Council snapshot while new drafts wait for Stop,
acceptance, and a fresh launch. This makes the configuration shown in the UI
the same configuration the process actually consumed.

## Complete operating loop

One release-grade causal run is:

1. **Pin** substrate and public devloop; verify the app package/import graph.
2. **Connect** repo, loop/operator GitHub contexts, approved Codex account context, label claim,
   roots, branches, and posture.
3. **Doctor** dependencies, tools, identities, host, contracts, and allowlists.
4. **Choose Workflow** and inspect its version, bounded stages, effects, and gates.
5. **Seat Council** and assign it to supported workflow deliberation stages.
6. **Validate/accept for next launch** both contracts using CAS and the direct
   no-effect receipt.
7. **Start/activate** the owned contained substrate supervisor through the
   verified direct seam; wait for its bound runtime-consumption receipt.
8. **Seed/admit** a GitHub issue through the workflow's configured intake rule.
9. **Deliberate** and observe trusted Council evidence.
10. **Implement** through the integrated devloop using the Doctor-verified Codex context.
11. **Open/correlate PR** and bind review evidence to the exact head.
12. **Review** with the Council policy configured for that workflow stage.
13. **Intervene** with a guarded human comment.
14. **Gate/ship** from machine facts under explicit DRY/LIVE posture. Automatic
    merge is present only through a proven public-devloop exact-head effect;
    otherwise the terminal is an explicit hold for external operator merge.
15. **Inspect/stop** with complete provenance and owned-process cleanup.

## In scope for v1 implementation of the v2 product spec

- Flutter desktop, macOS primary; Linux best-effort.
- A thin app-owned FKST loop package using only public devloop APIs.
- A bounded, versioned Workflow catalog and activation flow.
- A versioned Council roster/policy contract and evidence reader.
- Multiple connections, Doctor, direct substrate composition, owned lifecycle,
  unowned read-only observation, and bounded logs.
- Dedicated app-managed Git working clone per connection.
- GitHub issue/PR discovery, trusted evidence projection, claim/CI/head facts.
- CAS/backup/atomic writes for app-owned Workflow/Council configuration.
- Exactly two app-originated GitHub write families: opted-in issue creation and
  human comments. Integrated-loop effects use a separate posture/allowlist.
- SQLite cache/preferences/drafts/audit, fixture mode, failure drills,
  accessibility, diagnostics, packaging, and clean-machine proof.

## Explicit non-goals

- No runtime dependency on `devbored`, `github-devloop*`, `consensus`, or
  `github-proxy` packages.
- No copied or line-for-line reimplementation of devloop internals.
- No generic arbitrary workflow graph editor in the first version. Workflow
  families remain bounded by the substrate graph contract proven in Step 0.
- No claim that existing `devbored.config.v1` or `fkst.workflow.v1` is the app schema.
- No semantic persona scoring until emitted structured objection/disposition
  evidence makes the metric mechanical.
- No model/effort selector while the pinned substrate does not forward it to Codex.
- No package-runner health imitation, direct ledger/socket access, queue mutation,
  hosted control plane, Windows/mobile, or App Store sandbox claim.
- No lifecycle control over an unowned process and no silent auto-restart.

## Capability status at reorganization

| Capability | Status | Why |
|---|---|---|
| Substrate engine source and observation primitives | Present, pin proof incomplete | Exact direct-host manifest/transcript still required |
| Public devloop source/export list | Present | `libraries/devloop/fkst.toml` audited |
| App identity authorized to import devloop | Missing P0 | Visibility/integration seam not landed |
| Thin app-owned FKST loop package | Missing P0 | No app package exists |
| App-owned Workflow contract and consumer | Partial | Frozen portable contract permits T1 fixture UI; real consumer/evidence remains mandatory for T2 runtime |
| App-owned Council contract and consumer | Partial | Frozen portable reducer/assignments permit T1 fixture UI; real consumer/evidence remains mandatory for T2 runtime |
| Existing devloop packages as guides/fixtures | Present, reference-only | Must be absent from shipped graph |
| Codex CLI/personal-account launch proof | Missing P0 | Substrate resolves Codex from child environment |
| Model/effort control | Dependency-gated | Current substrate drops the reference options |

The detailed stop/go state is [08-READINESS.md](08-READINESS.md).

## Definition of complete

The app is complete only when:

- every P0 readiness row was green before downstream code merged;
- graph/import tests prove only substrate and public devloop are primary FKST
  dependencies and reference packages are absent;
- the full 15-step causal run succeeds in an explicitly allowlisted LIVE sandbox;
- Workflow and Council accepted version/digest evidence matches the UI;
- reference differential tests prove reuse without source copying;
- failure drills and clean-machine packaging pass;
- neither dependency source tree is modified by normal app operation;
- architecture tests enforce presentation → application → domain ports with
  infrastructure adapters wired only at the composition root;
- a dedicated managed clone and immutable per-launch config snapshot prevent
  mutation of user worktrees and active configuration; and
- every durable Workflow/Council work fact is re-derivable from a trusted
  qualified GitHub evidence envelope rather than local cache/runtime scratch.

⟦AI:FKST⟧
