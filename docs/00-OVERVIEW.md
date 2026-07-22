# 00 — Overview

Status: **LEGACY SOURCE** — superseded for full-app authority by
[`docs/spec/README.md`](spec/README.md); retained for rationale.
Date: 2026-07-20

## What this is

**fkst-devbored** is a local-only operator console for the autonomous
`github-devloop` running on `fkst-substrate`. It does three things:

1. **Show the work** — issues and PRs the loop is driving, grouped by state,
   stage, connection, or claim; who has claimed what; how contested each
   decision was (comment volume).
2. **Set the Council** — the personas (lenses) that deliberate on a piece of
   work, the flows that route work through them, and the scores that say
   whether a persona is earning its seat.
3. **Let a human speak** — create an issue, apply the opt-in label, comment on
   an issue or PR. Nothing else.

## The authority invariant (load-bearing)

> **GitHub and git are the only authorities for business state and authored
> content. The engine owns only its durable delivery ledger, read through
> `observe`. Host configuration is an explicit host fact in one named file.
> Everything the console holds — caches, snapshots, projections — is a
> disposable projection that never drives a write and never survives as
> authority.**

Every requirement, spec, and contract in this repo is subordinate to that
sentence. If a design would make the console's local database the reason
something is true, the design is wrong.

## What it is not

- Not a control plane for the engine. No supervise start/stop, no redb access,
  no observe-socket connections, no queue mutation.
- Not a writer of program state. No state markers, no `fkst-dev:<state>`
  labels, no bot-authored comments, no merge or approve.
- Not a hosted service. No network listener, no multi-user, no telemetry out.
- Not a fork of the platform. Package internals (prompts, departments,
  libraries) are read-only inputs; the console configures its own deployment's
  roster and profile, never upstream source.

## Source-of-truth map

| Subject | Authoritative source |
|---|---|
| This product's requirements, specs, contracts | **this repo, `docs/`** |
| Visual language + view inventory | **this repo, `docs/06`, `mock-artifacts/`** |
| Engine behaviour, observe schema, `graph_json` | `fkst-substrate` (`docs/`, `SPEC.md`) |
| Devloop states, markers, seats, claim modes | `fkst-packages` (`libraries/devloop/`, `packages/consensus/`) |
| Build Week submission scope + deadline | `FKST/PM-PLAN-DEVLOOP-UI.md` (separate artifact) |
| Prior product spec (superseded by `docs/01`) | `FKST/SPEC-CONSOLE-V2-FLUTTER.md` (historical) |

Two documents outside this repo remain in force for their own scope and must
not be duplicated here: the **Build Week plan** (a time-boxed submission, not
this product) and the **platform contracts** in substrate/packages. Where this
repo restates a platform fact, it cites it — it does not own it.

## Relationship to the mockups

`mock-artifacts/` holds the design exploration that produced this spec. The
mocks are **design artifacts, not a starting codebase**: they are HTML/CSS
studies used to settle layout, density, and the status-icon language. The
implementation target is stated in `docs/03-SPEC-FRONTEND.md`. Where a mock and
a doc disagree, the doc wins — except on visual questions the mock settled,
which `docs/06-DESIGN-LANGUAGE.md` transcribes.

## Reading order

New contributor: `00` → `09` (glossary) → `01` (requirements) → your stream's
spec (`03` FE or `04` BE) → `05` (contracts, mandatory for both) → `07`
(workstreams).

## Implementation gate

**No implementation code is written until `docs/05-DATA-CONTRACTS.md` is
frozen and `docs/07-WORKSTREAMS.md` is agreed.** This is deliberate: the whole
point of the doc set is to let several streams build in parallel against a
stable seam instead of serialising behind whoever starts first.

⟦AI:FKST⟧
