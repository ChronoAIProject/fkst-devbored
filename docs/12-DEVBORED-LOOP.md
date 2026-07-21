# 12 — `devbored-loop`: our own configurable devloop package

Status: **LEGACY PACKAGE PROPOSAL — REFERENCE ONLY.** ADR-031 supersedes this
package location/topology for the full app. The checked-out `devbored` code and
this proposal may supply cited lessons/fixtures, but
[`docs/spec/01-DEPENDENCIES.md`](spec/01-DEPENDENCIES.md) requires a thin
app-owned package using public devloop and forbids this broader runtime graph.
Date: 2026-07-20
Lives in: **`fkst-packages/packages/devbored-loop/`** (a contribution to your
own repo, not a fork — see §1)

## 0. Why our own package

Composing the platform's `github-devloop` gives no control over seats, labels,
or flow shape — every one of those is hardcoded (`state_labels.lua:4`,
`builders.lua:390`). Writing our own **orchestration** package while reusing the
platform **kernel** gives full control at ~1/5 the code, and removes the
upstream dependency in ADR-026 entirely.

| Reused, not rewritten | Lines | How |
|---|---|---|
| `consensus` — multi-angle codex debate | 2,359 | `event_deps` |
| `github-proxy` — all GitHub egress | 3,702 | `event_deps` |
| `libraries/devloop` — markers, claims, gates, convergence, git mechanics | 75 modules | `lib_deps` |
| **We write** — orchestration only | **~1,000** | departments below |

## 1. Where it lives, and why

**It must live in `fkst-packages`.** Their `CLAUDE.md` is explicit: host repos
compose library-B packages *only* through `pkg.queue` qualified names — **no
cross-require of library-B libraries**. A package under
`fkst-devbored/.fkst/local-packages/` therefore cannot `lib_deps` the devloop
kernel, and would have to reimplement markers, claims, gates, and convergence.

Precedent for the reuse we want: `archaudit` and `fkst-substrate-ref-maintainer`
both declare `devloop` in `lib_deps`.

This does not break ADR-023. `fkst-devbored` still **references and never
vendors** — it composes `devbored-loop` by name. Adding a package to your own
repo is a contribution; copying platform code into the console would be a fork.

## 2. The dynamic/static boundary *(the crucial constraint)*

The engine **graph-scans `M.spec` at load**. `consumes`, `produces`, `fanout`,
and `stall_window` are static, and conformance validates the composed graph
before anything runs. **Queue topology cannot be dynamic.**

So the workflow's *shape* is static; its *parameters* are dynamic:

| Dynamic — config file, effective next pipeline run | Static — code + restart |
|---|---|
| every label string and prefix | which queues exist |
| seats (angles) per consensus stage | which departments exist |
| agreement rule + thresholds | the set of possible states |
| converge / fix / stall budgets | `M.spec` declarations |
| intake criteria (milestones, authors, labels) | package composition |
| model + effort per seat | conformance obligations |
| which optional gates are enforced | |
| whether a stage is *enabled* | |

**The technique that buys most of the dynamism:** declare the **superset** of
states and transitions statically, then let config enable, disable, or
re-parameterise paths within it. An operator can turn review consensus off,
change five labels, swap all four seats, and halve the budgets — without a code
change. They cannot invent a new state at runtime, and no honest design could
let them, because the engine validates the graph before the loop starts.

The console UI must reflect this: parameter edits say *"applies next run"*;
composition edits say *"applies on restart"*.

## 3. How substrate consumes the config

Verified mechanism, both parts already used in production packages:

- `file.read` — used by `github-ratchet-migration-slicer` and
  `integration-coverage-producer`
- `json.decode` — used by `archaudit` and `github-devloop-ops`
- Env-driven label prefixes have precedent:
  `FKST_GITHUB_PROXY_POLL_LABEL_PREFIX`

```
Flutter console                      supervise (per pipeline run)
     │ writes                                  │ reads
     ▼                                         ▼
<host>/.fkst/devbored/config.json  ──►  file.read + json.decode
     ▲                                         │
     └── one env key set at launch: ───────────┘
         FKST_DEVBORED_CONFIG=<abs path>
```

**One env key** (the path) is set when the console launches supervise.
Everything else lives in the JSON, re-read on **every pipeline invocation** —
so parameter changes take effect on the next run with **no restart**.

Rules:
- The config is a **host fact**, which the platform's doctrine permits as a
  truth source alongside git and GitHub. It is *not* business state — no entity
  status, no claims, no counters ever live here.
- Read is `pcall`-guarded and **fails closed**: unreadable, malformed, or
  schema-mismatched config ⇒ the department errors to DLQ rather than silently
  falling back to defaults. A silent fallback would make the console lie about
  what the loop is doing.
- Config carries `schema` + `version`; unknown schema fails closed.
- The console writes it atomically (temp + rename) so a pipeline never reads a
  half-written file.

## 4. Config schema (`devbored.config.v1`)

```jsonc
{
  "schema": "devbored.config.v1",
  "version": 7,                      // bumped by the console on every write
  "labels": {
    "prefix": "devbored:",
    "enabled": "devbored:enabled",   // opt-in surface
    "claimed": "devbored:claimed",   // used only when claimMode = label
    "states": {                      // full map — every state, dynamic
      "thinking": "devbored:thinking",
      "ready": "devbored:ready",
      "implementing": "devbored:implementing",
      "pr-open": "devbored:pr-open",
      "reviewing": "devbored:reviewing",
      "merge-ready": "devbored:merge-ready",
      "fixing": "devbored:fixing",
      "merged": "devbored:merged",
      "blocked": "devbored:blocked"
    },
    "priorityClasses": ["devbored:expedite"]
  },
  "intake": {
    "requireEnabledLabel": true,
    "milestones": [12, 13],
    "authorPolicy": "collaborators"
  },
  "stages": {
    "design": {
      "enabled": true,
      "seats": ["teleology", "parsimony", "fidelity", "security"],  // ≤4
      "agreement": { "mode": "unanimous", "veto": ["security"] },
      "budgets": { "convergeRounds": 3, "stallUnchangedRounds": 3 }
    },
    "implement": {
      "enabled": true,
      "model": "gpt-5.6-sol",
      "effort": "high",
      "localTestCommand": "scripts/run.sh test"
    },
    "review": {
      "enabled": true,
      "seats": ["fidelity", "parsimony", "security", "teleology"],
      "agreement": { "mode": "unanimous", "veto": ["security"] },
      "budgets": { "fixRounds": 3 }
    },
    "merge": {
      "requireCiGreen": true,
      "requireHeadBoundApproval": true,
      "targetBranch": "integration-devbored"
    }
  }
}
```

**`seats` is capped at 4** — `consensus/core.lua:11` `max_angles = 4`, and
`normalized_angles` returns nil above it. The console enforces this at edit time
with the reason shown; the package also validates and fails closed.

## 5. Departments

Namespace `devbored.*`. Eight departments, ~1,000 lines of orchestration.

| Department | Consumes | Produces | Does |
|---|---|---|---|
| `observe_issue` | `github-proxy.github_entity_changed` | `consensus.proposal`, `devbored.ready` | derive state from markers; **inject configured seats** into the proposal (§6) |
| `consensus_result` | `consensus.consensus_reached`, `consensus.consensus_converge` | `devbored.ready`, `devbored.reconcile` | advance or re-narrow within budget |
| `implement` | `devbored.ready` | `devbored.awaiting_pr` | worktree + codex; push branch |
| `observe_pr` | `github-proxy.github_entity_changed` | `consensus.proposal`, `devbored.merge_ready` | PR-side state; raise review proposal with review seats |
| `review_result` | `consensus.consensus_reached`, `consensus.consensus_converge` | `devbored.merge_ready`, `devbored.fixing` | approve → gate; reject → fix |
| `merge_gate` | `devbored.merge_ready` | `github-proxy.*` | evaluate machine gates; merge only under LIVE |
| `liveness_scan` | raiser (cron) | re-drive queues | **conformance-required** watchdog |
| `dead_letter` | DLQ | — | structured failure facts |

Terminal states carry a WHY, per the platform's saga contract.

## 6. The seat injection (what this whole package is for)

```lua
local builders = require("devloop.payloads.builders")
local cfg      = config.load()                    -- file.read + json.decode

local proposal = builders.build_proposal(issue)   -- kernel builds the payload
proposal.angles = cfg.stages.design.seats         -- OUR configured seats, ≤4
raise("consensus.proposal", proposal)
```

`is_valid_proposal` accepts it (`core.lua:316`). The kernel builds a correct
payload; we add the one field the platform never populates. **No upstream change
required** — ADR-026's patch becomes unnecessary.

## 7. `fkst.toml`

```toml
name = "devbored-loop"
kind = "package.composed"
persistence_class = "saga"

[code]
root = "."

[lib_deps]
libraries = ["contract", "workflow", "testkit_internal", "forge", "devloop"]

[event_deps]
packages = ["github-proxy", "consensus"]
```

Composed because it adapts sibling packages through their published seams.
`consensus.proposal` and `github-proxy.*` must be **published seams** of those
packages — verified at composed conformance, which fails closed if not.

## 8. Conformance obligations (non-negotiable — CI enforces)

1. **Every non-terminal state declares a budget and a watchdog.** Conformance
   fails otherwise. Reuse the kernel's liveness helpers rather than inventing.
2. **One state, one responsibility** — single receiver, single driving queue,
   single liveness class, one postcondition family.
3. **Every consumed queue is routed or fails closed** — no silent
   `skip-foreign` fallthrough.
4. **`raise ⊆ produces ⊆ (own queues ∪ sibling published_seam)`** — engine
   graph-scan enforces this.
5. **No raw `gh`/`git`** — all egress through `forge` argv adapters.
6. **Payloads carry `source_ref`**, never content. Fetch from source.
7. **Files ≤1,000 lines**; split at 900 by responsibility.
8. `scripts/run.sh test` green is the single bar.

## 9. What we deliberately do not port

Kept out of v1 to stay at ~1,000 lines; each is a real capability we are
choosing to forgo, not an oversight:

fork gates · slice gates · harvest · substrate pinning · decompose ·
integration/rollup · dependency-wait gating · external-PR intake ·
review-meta escalation.

If any turns out to be load-bearing in a real run, it gets added deliberately —
after the incident, not speculatively.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Re-treading solved incidents (false-terminal, fork storms, dark scans) | reuse kernel `gate`, `convergence`, `claims`, liveness modules — that is where those fixes live |
| Liveness declared wrong ⇒ healthy work killed | conformance forces the declaration; copy the kernel's heartbeat-deferred pattern for codex stages |
| Config drift between console and package | one schema, versioned, fails closed on mismatch |
| Two loops on one repo (platform + ours) double-claiming | distinct label prefix **and** distinct bot login per deployment; the doctor rejects an overlap |
| Config read on a hot path costs latency | small file, per-invocation read, `pcall`-guarded; measure before optimising |

⟦AI:FKST⟧
