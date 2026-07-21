# FKST Devbored

![FKST Devbored — a lean harness for Codex dev loops](docs/assets/banner.png)

> **Name chosen by the product's own council tooling.** A recorded 6-seat
> deliberation (product / architecture / quality lenses, argued independently
> by Codex and Fable, reduced with this repo's own validator under
> `simpleMajority`) approved **FKST-devbored 5/6**, over FKST-agora (3/6) and
> FKST-kanban (0/6). The dissent is preserved honestly: "devbored" names the
> board projection, not the harness — *agora* remains the strongest future
> rename candidate if the product outgrows its board.

**The loop is all the rage.** Engineers at Anthropic and OpenAI now describe
their day job as building the loop that builds the code. But most loop
architectures are still too basic for complex development work — the
interesting problems live in the *harness* around the loop, not the model
inside it. Inspired by OpenAI's
[Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/)
and the broader
[harness-engineering](https://openai.com/index/harness-engineering/)
conversation, we built this: **an easy way for developers to use Codex to
experiment with their own dev workflows, in a loop.**

Three design choices keep it approachable:

- **Lean, editable architecture.** Small pieces you can actually read and
  reshape — not a framework you configure from the outside.
- **GitHub is the durable layer.** Issues, comments, and labels hold the
  loop's business state — trivially readable and auditable by humans, hosted
  where your code already lives.
- **The front end is a light HTML web layer.** Static pages and vanilla JS
  that most developers can understand and edit to fit their own use case.
  No build step.

## Why a harness at all

Harness engineering is about making the loop work **the way you want**.
Something that runs 24/7 without staying aligned to your own judgment isn't
autonomy — it's loop vibing.

This architecture goes after three concrete problems in agentic coding:

1. **Context management.** Split work into smaller issues and keep process
   state in the durable layer (GitHub issues + trusted marker comments). No
   single context window has to carry the whole project.
2. **Verifiable judgment.** Every decision leaves durable evidence, so you
   can check the agent's reasoning against your own — and reformulate your
   loops and flows when you disagree. The console renders exactly this:
   *markers are facts, labels are hints, unknown is never zero.*
3. **Provider independence.** [`fkst-substrate`](https://github.com/ChronoAIProject/fkst-substrate)
   is a durable loop engine that operates independently of any model
   provider. The source is public on GitHub and can be forked and
   customized.
   <!-- TODO(owner): add a LICENSE to fkst-substrate before calling it
   "open source" — public visibility alone doesn't grant fork/reuse rights. -->

## The console (recorded demo)

A local, static demonstration rendering **real captured loop evidence** from
the public sandbox repo
[`ChronoAIProject/fkst-packages-testing`](https://github.com/ChronoAIProject/fkst-packages-testing).
See [`demo/README.md`](demo/README.md) for the honest-claims list and the
5-beat walkthrough.

```bash
python3 -m http.server 8471 -d demo --bind 127.0.0.1   # static demo
node local-bff/server.mjs                               # optional: engine snapshot (:8472)
# open http://127.0.0.1:8471/
```

| Screen | |
|---|---|
| **Board — the loop** | ![Board](docs/assets/screen-board.png) |
| **Evidence chain — markers are facts** | ![Evidence](docs/assets/screen-evidence.png) |
| **Who decided — recorded consensus** | ![Who decided](docs/assets/screen-debate.png) |
| **Council sandbox — form your review team** | ![Council sandbox](docs/assets/screen-council.png) |
| **Contract self-check — 55 cases, human-readable** | ![Self-test](docs/assets/screen-selftest.png) |
| **Engine snapshot — live-or-offline, honest** | ![Engine](docs/assets/screen-runtime.png) |

## How Codex built this

This repo is itself the product's proof: the console was built **by the kind
of loop it visualizes**, in one day (2026-07-21), on top of contract work from
the preceding week.

- **Codex implemented everything.** Every build stream ran as a Codex CLI
  session (recorded model: `gpt-5.6-sol`, cli `0.144.6`) with a written spec,
  exclusive file ownership, and a hard test gate. 52 Codex sessions ran on
  final-assembly day (25 headless `codex exec` build/review streams plus
  gateway-managed sessions for the earlier contract work).
- **Where Codex accelerated:** the entire implementation surface — fixture
  sanitization, all six screens, the contract validator + 55-case self-check,
  the faithful port of the engine's `transition_version` comparator (51-case
  engine-derived parity corpus), and the loopback BFF. Codex also served as
  an adversarial reviewer of its own plans: its reconciliation review RETURNed
  the first scope dossier with 8 blocking fixes, and its round-close review
  found 5 latent semantic faults (trust gates, CAS ordering, availability
  semantics) that were then fixed and re-verified.
- **Where key decisions were made:** a PM (Anthropic's Fable) wrote specs,
  froze seams, integrated, and re-verified; independent Opus 4.8 reviews
  verified actual files with hostile probes (attacker-comment injection,
  forged states, contract mutations) before anything was accepted; the human
  owner held the gates (scope, naming veto, publication). Decision defaults
  ran through recorded Codex+Fable deliberation — including this repo's name
  (see above).
- **Deliberately multi-session.** The workflow fans out many Codex sessions
  with frozen interfaces between them — that *is* the harness thesis this
  project explores, in the spirit of Symphony. Session rollouts live in the
  local Codex home; the submitted `/feedback` session ID accompanies the
  hackathon entry.

## Credits & inspiration

- [OpenAI — An open-source spec for Codex orchestration: Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/)
- [OpenAI — Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
- [openai/symphony](https://github.com/openai/symphony) ·
  [harness-engineering talk (Latent Space)](https://www.latent.space/p/harness-eng)
- Built with Codex workers implementing, Opus 4.8 reviewing, and a Fable PM
  integrating — the loop building its own console.

---

# Full product & governance

`fkst-devbored` is a local Flutter desktop operator app in which **Workflows**
and **Council** are the primary mechanisms for running and understanding a
GitHub-native development loop. A thin FKST package owned by this app will
adapt those contracts to public `devloop` APIs and `fkst-substrate`; existing
`devbored`/github-devloop packages are reference behavior, not the shipped loop.

> GitHub/git own business state. `fkst-substrate` owns its delivery ledger.
> The app owns process lifecycle only through the verified outer job/launcher it
> initiated; that launcher owns supervisor/descendant cleanup, and Flutter never
> directly controls inferred child PIDs. The app also owns local preferences,
> drafts, audit, and disposable projections.

The Flutter boundary is presentation → application use cases → domain ports,
with infrastructure adapters wired only at one composition root. Active
Workflow/Council config is immutable per launch; durable work evidence comes
from trusted qualified GitHub comment envelopes, not local cache or deliveries.

## Status

**Full-app v2 is executing under a candidate accelerated, human-gated plan.
Foundation/readiness work is active at T0; fixture UI begins only after HG-01.**

The one authoritative entry point is
[`docs/spec/README.md`](docs/spec/README.md). The executable accelerated build
plan is
[`plans/accelerated-human-gated-delivery.md`](plans/accelerated-human-gated-delivery.md).
The retained technical blueprint is
[`plans/full-app-construction.md`](plans/full-app-construction.md). The
mandatory stop/go ledger is
[`docs/spec/08-READINESS.md`](docs/spec/08-READINESS.md).
The 211-node requirement/evidence registry is
[`plans/parallel-engineering-task-map.md`](plans/parallel-engineering-task-map.md);
35 cohesive packages use GPT-5.6 Sol → fresh Opus → mechanical candidate
integration, with Fable and human review at milestone boundaries.

The older numbered documents, `docs/plan/`, Flutter v2 proposal, and historical
handoffs are retained as rationale. The deadline-critical OpenAI Build Week
submission cut is the external sibling file `../HANDOFF.md`, with historical
advisor context in the external sibling file `../fable_handoff.md`; neither
overrides `docs/spec/`. These umbrella-workspace references intentionally are
not repository-local links.

## Exactly two primary dependencies

1. **`../substrate` (`fkst-substrate`)** — Rust engine/runtime, durable delivery
   ledger, observation, conformance, and supervisor behavior.
2. **public `devloop`** — the reusable loop library/capability currently found
   under `../packages/libraries/devloop`, consumed through a pinned, tested
   integration boundary by this app's own thin FKST package.

The entire packages platform is not dependency 2. `devbored`,
`github-devloop*`, `consensus`, and `github-proxy` are reference-only and must
be absent from the shipped graph. GitHub/git are external business authorities;
`gh`, `git`, `codex`, Flutter/Dart, SQLite, and operating-system facilities are
services/toolchain, not extra FKST product dependencies.

## Repository layout

```text
demo/            recorded-evidence console (static HTML) + contract self-check
local-bff/       loopback read-only substrate snapshot reader for demo/runtime.html
contracts/       Dart contract types and parity tests; Workflow/Council kernel
loop-package/    thin app-owned FKST integration; absent until Step-0 proof work
docs/spec/       authoritative full-app product and engineering specification
docs/assets/     README banner + screenshots
plans/           accelerated execution plan plus retained technical registries
docs/            legacy numbered research/specification documents
docs/plan/       historical v2 investigation and phase plan
mock-artifacts/  retained design explorations
app/             Flutter desktop app; fixture-only at T1, runtime-connected at T2
```

## Start here

Read in this order:

1. [`docs/spec/00-PRODUCT.md`](docs/spec/00-PRODUCT.md)
2. [`docs/spec/01-DEPENDENCIES.md`](docs/spec/01-DEPENDENCIES.md)
3. [`docs/spec/03-REQUIREMENTS.md`](docs/spec/03-REQUIREMENTS.md)
4. [`docs/spec/08-READINESS.md`](docs/spec/08-READINESS.md)
5. [`docs/spec/04-DATA-CONTRACTS.md`](docs/spec/04-DATA-CONTRACTS.md)
6. [`docs/spec/09-WORKABILITY.md`](docs/spec/09-WORKABILITY.md)
7. [`plans/accelerated-human-gated-delivery.md`](plans/accelerated-human-gated-delivery.md)
8. [`plans/full-app-construction.md`](plans/full-app-construction.md)

The current blockers are intentional and explicit: named delivery-governance
routes are unproven; no app-integrated FKST loop package exists; its identity is
not admitted by devloop visibility; and the app-owned Workflow/Council schemas
are not yet frozen, consumed, or evidenced. Step 0 must also prove the complete
Codex personal-account argv/effective-surface policy, immutable evidence and
proxy-free restart seams, project-root topology, exact filesystem boundary,
outer-job lifetime/typed cleanup receipt, direct/runtime config receipts, and
the complete effect matrix. Automatic merge may remain absent under the
explicit hold-only disposition. HG-01 may authorize only fixture/fake-backed
Flutter and pure layers; HG-02 still requires completed R-039 readiness before
local/DRY runtime work. HG-03 through HG-05 separately control live effects,
release-candidate work, and submission.

⟦AI:FKST⟧
