# FKST Console — recorded UI prototype and read-only live development path

> **Honest scope:** `http://127.0.0.1:4173` is an interactive viewer for committed, sanitized fixture data. It starts no BFF and makes no connection to GitHub, Council, `fkst-substrate`, or the public devloop. Separately, the local development topology has served a real populated GitHub snapshot through its BFF and Vite `/api` proxy. A deterministic Chrome/CDP test also proves the browser-rendered Vite+BFF topology with a controlled fake GitHub projection. That browser test is not real-GitHub DOM evidence or full end-to-end proof: live Council acquisition, a successful public-devloop health run, and a deployed substrate durable root remain unavailable.

## Current runnable state

The simplest demonstrable artifact is a React/Vite/TypeScript fixture viewer. The repository also contains a loopback Node/TypeScript BFF, a same-origin live-development proxy, optional local adapters, and the preserved earlier static/specification materials; none of the live components are used by `pnpm demo`. The fixture viewer needs Node.js 22.6–26 and pnpm 10.17.1, but no GitHub account, credentials, BFF, `fkst-substrate`, devloop checkout, or engine deployment:

```bash
git clone https://github.com/ChronoAIProject/fkst-devbored.git
cd fkst-devbored
corepack enable
pnpm install --frozen-lockfile
pnpm demo
```

Open <http://127.0.0.1:4173>. This is the reproducible recorded-UI path, not a live integration; there is no hosted demo. The candidate lineage and the repository's earlier static/specification lineage are preserved together on `main`; neither history was force-replaced.

| Area | Exact status | Evidence boundary |
|---|---|---|
| Recorded UI prototype | **Implemented · fixture-only · locally and CI verified** | `pnpm demo` renders 2 issues, 1 PR, 3 Council seats with a 2/3 decision and dissent, 1 queue, 1 in-flight delivery, 0 dead letters, and recorded health output. The persistent **Recorded demo data** banner and `example.invalid` links prevent live-status confusion. It calls no BFF or external service. |
| Integrated live application | **Partially demonstrated · controlled browser topology · not end to end** | The BFF served a real populated GitHub snapshot and Vite's same-origin `/api` proxy returned it. A separate fake-backed Chrome test proves the browser leaves loading and renders the local live topology, but a real-GitHub-backed browser run has not passed. Live Council acquisition is absent, no deployed substrate durable root was available, and no real write was performed. |
| **Workflow** | **Implemented · fixture-populated · populated live read demonstrated · contract-tested** | At the July 22 checkpoint, an authenticated read-only query of `ChronoAIProject/fkst-packages` projected 5 current open issues and 1 open PR after trusted-author filtering. Those timestamped counts are live evidence, not permanent expectations or historical truth. Browser rendering is contract-proved only against a controlled fake projection; real-GitHub DOM proof remains outstanding. |
| **Council** | **Implemented · fixture-only · contract-tested** | The UI renders seats, outcomes, round, agreement, and recorded dissent from fixture evidence. Live Council acquisition is not implemented and reports unavailable. |
| **Runtime** | **Implemented · fixture-populated · contract-tested** | The adapter and UI are tested with fake/local contract data. A real binary was inspected; missing, invalid, and inaccessible durable state now degrade distinctly without leaking local paths. No root was initialized and no real substrate ledger observation is claimed. |
| Local BFF and SSE | **Implemented · contract-tested** | Loopback API, same-origin development proxy, snapshot/session/health routes, SSE, degradation, and denial paths are tested. `pnpm start` is API-only; it does not serve the frontend. |
| **New work** | **Implemented · fake-write contract-tested · no real mutation** | The sole positive write test uses a repository-local fake `gh`. Fixture and default live startup are read-only, and no real GitHub issue was created during implementation or verification. |
| Publication and eligibility | **Candidate source published · remaining gates not verified** | The public candidate branch is supplied. No hosted demo, public video, Devpost entry, `/feedback` Session ID, or personal eligibility evidence is present. |

This is an OpenAI Build Week demo candidate, not a production-complete FKST application, hosted control plane, Flutter/Dart app, Electron app, or Tauri app. Commit `9743cfe633b3415278a33fe1b3d02b7ac133a391` remains the accepted implementation baseline. The integrated tree adds the bounded quality pass and subsequent recovery tooling/evidence: configurable loopback startup, deterministic source preflight, a controlled browser-topology contract, explicit durable-state classification/redaction, and the Council authority decision. These additions do not constitute deployment or full end-to-end completion.

## What the product does

FKST Console observes a GitHub-native development loop without becoming another source of truth. It brings three kinds of evidence into one disposable projection:

- Workflow business state and pull-request gates from trusted GitHub comment markers;
- Council decision evidence showing which independent lenses participated and what they concluded; and
- Runtime delivery evidence from the substrate ledger plus opaque devloop health output.

There is no console database and no engine control plane. Unreachable evidence stays `unknown` or `unavailable`; it is never turned into a reassuring zero.

## Application structure

The top navigation names are **Workflow**, **Council**, and **Runtime**.

### Workflow — the primary mechanism

Workflow is the main product surface. Its issue lanes project current work through Design, Build, Review, Ship, Complete, and Attention. Its PR lane projects Open, In review, At gate, Held, and Merged evidence. Trusted `state:v1` markers decide business state; labels are displayed only as lossy hints. The same view carries accepted `review-result:v1` and head-bound `merge-ready:v1` evidence, but exposes no approve, merge, close, retry, or engine controls.

Opening an issue shows its current marker-derived evidence, Council summary when present, merge-gate facts, authority, and source age. The UI does not present polling deltas as an authoritative historical timeline.

### Council — decision evidence

Council is a read-only evidence view, not a persona or prompt editor. In the recorded fixture it shows three independent seats, their verdicts, an admitted round-one decision, a 2/3 agreement result, and the explicitly recorded dissent. The decision ledger is a current projection and may miss decisions between polls. In local live mode, Council remains unavailable because no live Council acquisition adapter exists in this cut.

### Runtime — delivery evidence

Runtime shows the current `fkst.delivery.observe.v1` delivery projection: queue depth, dead letters, subscriber state, and current delivery rows. Those are engine-delivery facts, not Workflow progress. Acknowledged rows can disappear between polls, and at-least-once delivery can repeat IDs. The devloop health line is shown verbatim; exit code zero is not reinterpreted as proof of `HEALTHY`. The screen cannot retry, requeue, resume, edit topology, open the ledger, or control the engine.

The detailed authority and degradation model is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 60-second fixture demo

After running `pnpm demo`, use this path:

1. **0–10 seconds — disclosure:** confirm **Recorded demo data** and **READ-ONLY** at the top. The fixture uses `example.invalid` links, so its interactions cannot target a real repository.
2. **10–30 seconds — Workflow:** scan the issue lanes and PR evidence lane. Note that `state:v1` determines stage while labels are hints.
3. **30–40 seconds — work detail:** open issue #42 and inspect the trusted evidence sequence and head-bound merge gate. Close the dialog.
4. **40–50 seconds — Council:** open **Council** and show the three seat verdicts plus the recorded 2/3 decision and dissent.
5. **50–60 seconds — Runtime:** open **Runtime** and identify queue/DLQ/subscriber values as a recorded delivery-ledger snapshot, not business progress or history.

The longer operator checklist and BFF probes are in [docs/JUDGE-RUNBOOK.md](docs/JUDGE-RUNBOOK.md).

## Fixture truth versus live truth

| Capability | Fixture mode (`pnpm demo`) | Local live mode (`pnpm dev` or `pnpm start`) |
|---|---|---|
| Browser source | Committed `demo/fixtures/snapshot.v1.json`, copied into the demo build | `GET /api/v1/snapshot` plus `GET /api/v1/events` |
| GitHub issues, PRs, markers | Sanitized recorded projection | Optional bounded `gh api graphql` read when exactly one repository and trusted bot are configured |
| Council | Sanitized app-owned evidence projection | **Unavailable:** live acquisition is not implemented |
| Substrate | Recorded `fkst.delivery.observe.v1` shape | Optional `fkst-framework observe --durable-root … --json`; missing roots/databases are specifically `UNAVAILABLE`, invalid shapes are `FAIL`, and inaccessible/unclassified failures remain `UNKNOWN`. The Console never initializes the root. |
| Devloop health | Recorded opaque output | Optional public devloop `scripts/run.sh health`; its first stdout line is the recognized verdict and the complete stdout is preserved verbatim |
| Writes | Impossible; always read-only | Read-only by default; one issue-admission write is possible only after every guard passes |
| Historical claim | Illustrative recorded sequence only | None; polling can miss acknowledged deliveries and repeated IDs are possible |

The fixture is sanitized replay data, not current repository or engine status and not a byte-for-byte capture of the linked public history. It includes one untrusted forged marker to prove author filtering occurs before parsing. Unknown marker schemas are ignored. The replacement fixture IDs and invalid URLs must not be narrated as one newly completed console-created-to-merge run.

## Exact commands

The following table covers every root script in `package.json`, plus the frozen clean-checkout install command.

| Command | Exact behavior |
|---|---|
| `pnpm install --frozen-lockfile` | Install the pinned workspace resolution without changing `pnpm-lock.yaml`. |
| `pnpm install:locked` | Run the package-script alias for the same frozen install. |
| `pnpm demo` | Start the Vite app in fixture mode on `127.0.0.1:4173`; no BFF starts. |
| `pnpm dev` | Start the live-mode BFF and Vite app with a guarded same-origin `/api` proxy. Defaults are `127.0.0.1:8472` and `127.0.0.1:5173`; `FKST_CONSOLE_PORT` and `FKST_CONSOLE_UI_PORT` select alternate loopback ports. |
| `pnpm build` | Run each workspace package's declared build serially. The BFF uses Node type stripping and has no emitted bundle. |
| `pnpm build:demo` | Build the static fixture-mode frontend into `app/dist/`. |
| `pnpm typecheck` | Run each workspace package's declared typecheck serially. |
| `pnpm test` | Run each workspace package's tests serially. Tests use local fakes and must never make a live GitHub write. |
| `pnpm start` | Start the loopback BFF from documented environment values; it does not serve `app/dist`. |
| `pnpm preflight:live` | Probe GitHub, substrate-observe, and configured public-devloop health readiness without a GitHub mutation, engine start, or durable-root initialization. A configured public health script may still bootstrap/build/cache as documented; use `pnpm --silent preflight:live -- --json` for JSON-only stdout and see [`docs/LIVE-PREFLIGHT.md`](docs/LIVE-PREFLIGHT.md). |
| `pnpm smoke` | Alias `pnpm smoke:fixture`. |
| `pnpm smoke:fixture` | Build fixture mode, preview it temporarily on `127.0.0.1:4174`, probe the schema/HTML/disclosure, and stop. |
| `pnpm scrub` | Read-only scan of current non-ignored text and the history reachable from `HEAD` for common secrets, plus current-file identity and developer-home checks. Unrelated remote branches are outside this release-tree gate. |
| `pnpm check` | Run typecheck, tests, build, fixture smoke, and scrub in that order. |

The POSIX convenience wrapper is `./scripts/run.sh <command>`, where `<command>` is `install`, `demo`, `dev`, `build`, `typecheck`, `test`, `start`, `preflight`, `smoke`, or `scrub`.

Live mode is optional. Export selected settings from [`.env.example`](.env.example) before `pnpm start` or `pnpm dev`; the project does not source `.env` or execute it as shell code. [`console.config.example.jsonc`](console.config.example.jsonc) is a reviewable mapping, not a loaded config file. A substrate/health BFF launch can use direct argv:

```bash
pnpm --filter ./server start \
  --port 8472 \
  --observe-bin /absolute/path/to/fkst-framework \
  --durable-root /absolute/path/to/durable-root \
  --health-script /absolute/path/to/fkst-packages/scripts/run.sh
```

`--observe-bin` and `--durable-root` must be supplied together. Without them, runtime data is unavailable rather than zero. The Console does not initialize durable state. If the health script is the public `scripts/run.sh`, pin `BIN`, export `FKST_NO_AUTOBUILD=1`, and review its cache behavior in [docs/DURABLE-ROOT-LIFECYCLE.md](docs/DURABLE-ROOT-LIFECYCLE.md). `pnpm start` exposes `GET /api/v1/health`, `GET /api/v1/snapshot`, `GET /api/v1/session`, and `GET /api/v1/events`; use `pnpm dev` for the integrated local UI. There is no one-command production/static live server in this cut.

For a read-only live GitHub projection, first authenticate `gh`, choose two unused loopback ports, and configure exactly one repository plus trusted marker author:

```bash
FKST_CONSOLE_PORT=18472 \
FKST_CONSOLE_UI_PORT=15173 \
FKST_SANDBOX_REPO=ChronoAIProject/fkst-packages \
FKST_BOT_LOGIN=ElonSG \
pnpm dev
```

Open <http://127.0.0.1:15173>. Do not set `FKST_ENABLE_WRITES=1`; the demonstrated run was read-only. A successful `/api/v1/snapshot` response proves acquisition and proxy stitching. The controlled Chrome contract proves browser rendering with fake upstream data; the separate real-GitHub-backed browser evidence required to complete E4 remains outstanding.

## Security and the only mutation

The BFF binds exactly `127.0.0.1`, sets no permissive CORS headers, and invokes `gh`, `fkst-framework`, and the optional health runner with `execFile` plus explicit argv arrays. It never opens `delivery.redb`, touches an observe socket, starts the engine, or sets `FKST_GITHUB_WRITE`.

The only mutation route is `POST /api/v1/issues`. It may create one issue in exactly one configured sandbox repository with `fkst-dev:enabled` attached by the same `gh issue create` invocation. Admission requires all of these independent guards:

- explicit `--enable-writes` or `FKST_ENABLE_WRITES=1`, while demo mode remains false;
- exactly one valid `OWNER/REPOSITORY` allowlist and one trusted bot login;
- exact loopback Host and Origin, POST method, and the per-launch session token;
- a bounded JSON object containing exactly `title` and `body`;
- a resolved authenticated human actor distinct from the normalized bot login; and
- a returned HTTPS GitHub URL belonging to that exact repository and a positive issue number.

No issue edits, label-only writes, markers, bot comments, PR approvals, merges, closes, engine operations, config writes, terminal-goal resume, or arbitrary command endpoints exist. Demo mode cannot enable writes. The full boundary and safe pre-write checklist are in [docs/SECURITY.md](docs/SECURITY.md). No real GitHub mutation has been performed or authorized by this README.

## Dependencies, provenance, and authorship

Exactly two pre-existing projects are primary FKST integrations:

| Primary integration | Inspected revision | Relationship |
|---|---|---|
| [`ChronoAIProject/fkst-substrate`](https://github.com/ChronoAIProject/fkst-substrate) | `e38358a0552c4133414836bf52df6593908fe547` | External local `fkst-framework observe --json` CLI; not vendored. |
| Public devloop in [`ChronoAIProject/fkst-packages`](https://github.com/ChronoAIProject/fkst-packages) | `f6ad297c672c1d9d38c82e0a0ea50c96e2843e0b` | External GitHub-native Workflow and optional opaque health source; not vendored. |

The complete devbored product/specification and older devbored, `github-devloop*`, consensus, hosted, desktop/Flutter, and proxy materials are **reference-only provenance**. They are not additional primary integrations and are absent from this cut's shipped import/runtime graph. Node.js, pnpm, React, Vite, TypeScript, `gh`, and browsers are toolchain/runtime dependencies, not FKST product integrations.

The submission period began 2026-07-13. Work attributed to it is this repository's console UI, loopback BFF, normalized snapshot contract, sanitized fixture, tests, and packaging—not the pre-existing FKST runtime or devloop. The worktree began at `9308b5a018af28049c35517946aaae113e323c20`; accepted implementation baseline `9743cfe633b3415278a33fe1b3d02b7ac133a391` added the demo candidate, followed by the bounded quality and read-only recovery work listed above.

Public historical [issue #111](https://github.com/ChronoAIProject/fkst-packages-testing/issues/111) and [PR #77](https://github.com/ChronoAIProject/fkst-packages-testing/pull/77) validated the issue-state and review/merge contracts. They are not one console-created end-to-end run. The sanitized fixture replaces their identifiers and content.

Codex sessions directed to use GPT-5.6 Sol implemented the Build Week cut and its tests/docs. Repository prose is not proof of model identity, `/feedback` upload, submission compliance, or personal eligibility. Those external proofs remain outstanding. See [docs/PROVENANCE.md](docs/PROVENANCE.md) for the detailed prior-work, dependency, asset, and authorship boundary.

### License

This repository's console code is Apache-2.0; see [LICENSE](LICENSE). That license does not relicense upstream integrations, GitHub evidence, package-manager dependencies, fonts, or third-party tools. Font notices, pins, hashes, and SIL OFL 1.1 text are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [docs/third-party/SIL-OFL-1.1.txt](docs/third-party/SIL-OFL-1.1.txt).

## Verified evidence

[docs/VERIFICATION.md](docs/VERIFICATION.md) records the settled local checkpoint without implying deployment or submission. Do not silently reinterpret its numbers:

- **127/127 tests:** React app 13/13, loopback BFF 51/51, and black-box/integration 63/63 across 16 suites;
- both production and recorded-demo builds transformed 42 modules;
- fixture smoke verified the schema, HTML mount, persistent disclosure, and loopback-only preview;
- the merged release-tree scrub examined 258 non-ignored files plus reachable history;
- read-only UX and security reviews returned their recorded PASS verdicts;
- an authenticated GitHub read against `ChronoAIProject/fkst-packages-testing` returned a complete current-open set of zero issues and zero PRs, and a later read against `ChronoAIProject/fkst-packages` returned a populated projection of five issues and one PR, both with writes disabled;
- no durable-root substrate observation was possible; and
- the positive issue-creation path used only a fake local `gh`, not GitHub.

The recorded local platform was macOS 26.5.2 arm64, Node.js 26.3.0, pnpm 10.17.1, and Chrome 150.0.7871.129. The package contract is Node.js 22.6–26. The pre-merge [`562a675` checkpoint passed GitHub Actions](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29878085596) with 98 tests. Hosted verification of the 127-test merged tree must be attributed only after the workflow for its exact pushed SHA passes. Firefox, Safari, Windows, and a clean container were not verified.

## Known limitations

- Fixture values are sanitized illustrative evidence, not live status, and fixture URLs intentionally do not navigate to real targets.
- Live GitHub reads require one repository and trusted bot. A populated read and same-origin proxy response have been demonstrated, but the current counts can change. Controlled fake-backed browser rendering is proved; real-GitHub-backed browser DOM evidence is still outstanding.
- The live GitHub command is bounded and can report a transient read failure even after actor authentication succeeds; retry evidence does not erase a failed attempt, so production reliability is not claimed.
- Live Council acquisition is unavailable. Council's populated screen is fixture-only.
- A substrate binary existed, but no deployed durable root was available; real delivery-ledger observation is unavailable.
- The integrated live UI is a Vite development topology. The BFF does not serve `app/dist`; there is no container or packaged one-origin production server.
- `contracts/` is a preserved legacy Dart contract harness, not the application and not a pnpm workspace dependency. Its default `dart test` requires an external devbored fixture corpus that is absent from this repository, so it is not part of the accepted console release gate.
- Only `state:v1`, `review-result:v1`, and `merge-ready:v1` markers are parsed. Unknown schemas are ignored.
- There is no topology panel, database, durable console cache, authoritative timeline, or engine control surface.
- Runtime health is opaque text; delivery observation can be unavailable while GitHub business state exists.
- No real guarded issue creation, Firefox/Safari/Windows pass, clean-container setup, or public-host secret scanning has been evidenced.
- The passing GitHub workflow carries a non-blocking runner annotation: the current v4 setup actions target the deprecated Node 20 action runtime and GitHub forces those action implementations onto Node 24. The repository's own verification commands still run under the configured Node 22 toolchain.
- This two-hour demo candidate makes no production security, availability, or eligibility claim.

## External submission gates

Source publication is complete; every other row remains external and unresolved. A placeholder is not completion evidence.

| Required artifact or gate | Current truth |
|---|---|
| Public source repository, or private repo shared with both judging addresses | **PUBLISHED** — candidate source and preserved legacy lineage are integrated directly on `main`; the earlier `codex/build-week-mvp` checkpoint remains available |
| Working judge-accessible hosted demo, sandbox, or test build | **NOT PUBLISHED** — only the local fixture path is documented |
| Public YouTube video under three minutes with required audio | **NOT PUBLISHED / NOT SUPPLIED** |
| Primary Codex `/feedback` Session ID with successful upload evidence | **NOT SUPPLIED / NOT VERIFIED** |
| Completed Devpost description, category, and entry URL | **NOT PUBLISHED / NOT SUPPLIED** |
| Real durable-root substrate observation | **UNAVAILABLE / NOT VERIFIED** |
| Real guarded sandbox issue creation | **NOT PERFORMED** |
| Entrant age, location, account, and other personal eligibility | **NOT VERIFIED BY THIS REPOSITORY** |

Do not replace a row until the artifact is externally accessible and independently checked against the live submission rules.
