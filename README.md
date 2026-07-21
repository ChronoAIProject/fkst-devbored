# FKST Console

FKST Console is a local web console for observing an FKST GitHub-native development loop. It presents Workflow state, pull-request evidence, Council decisions, and the substrate delivery snapshot without becoming a second source of truth. The repository also includes a deterministic, read-only fixture replay that requires no GitHub account, credentials, `fkst-substrate`, or devloop checkout.

This is the time-boxed OpenAI Build Week web demo candidate. It is a React/Vite/TypeScript frontend plus a loopback Node/TypeScript BFF—not Flutter, Dart, Electron, Tauri, a hosted control plane, or a production-complete FKST application.

## Five-minute fixture judge path

Prerequisites: Node.js 22.6–26 and pnpm 10.17.1. No GitHub or FKST credentials are needed.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm demo
```

Open <http://127.0.0.1:4173>. The page must retain a visible **Recorded demo data** disclosure. The fixture is committed at `demo/fixtures/snapshot.v1.json`, is copied into the Vite public output, and uses invalid example URLs so no demo interaction can mutate a real repository.

Suggested five-minute review:

1. Confirm the recorded-data banner and read-only posture before looking at any counts.
2. Inspect Workflow and the PR lane, including the `state:v1`, `review-result:v1`, and head-bound `merge-ready:v1` evidence.
3. Open an item and inspect its marker-derived detail and source/age footer.
4. Inspect Council seats and the recorded decision, including disclosed dissent.
5. Inspect Runtime. Queue/DLQ values are explicitly delivery-ledger facts; offline subscriber state is `unknown`, and the UI does not claim a historical timeline.

For a deterministic build-and-probe instead of the interactive development server:

```bash
pnpm smoke:fixture
```

That command builds fixture mode, starts a loopback-only preview on port 4174, checks the fixture schema and HTML shell, verifies the built UI contains its recorded-data disclosure, then stops the preview. It does not contact GitHub or substrate.

The longer step-by-step checklist is in [docs/JUDGE-RUNBOOK.md](docs/JUDGE-RUNBOOK.md), and the settled local release evidence is recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Submission links

These are deliberately explicit placeholders. They are not evidence of a completed submission.

| Artifact | Status |
|---|---|
| Public source repository | **PLACEHOLDER — repository URL has not been supplied** |
| Hosted read-only fixture demo | **PLACEHOLDER — hosted URL has not been published** |
| Public YouTube video (<3 minutes) | **PLACEHOLDER — video URL has not been supplied** |
| Devpost submission | **PLACEHOLDER — submission URL has not been supplied** |
| Primary Codex `/feedback` Session ID | **PLACEHOLDER — successful upload evidence must be captured before submission** |

The local fixture path above is the currently documented judge path. Do not replace a placeholder until the linked artifact is public and verified.

## Commands

All root commands delegate to package-owned scripts. Verification runs serially so failures and logs are reproducible.

| Command | Exact behavior |
|---|---|
| `pnpm install --frozen-lockfile` | Install the pinned workspace resolution without changing `pnpm-lock.yaml`. |
| `pnpm install:locked` | Package-script alias for the same frozen install. |
| `pnpm demo` | Start the Vite app in fixture mode on `127.0.0.1:4173`; no BFF is started. |
| `pnpm dev` | Start the BFF on `127.0.0.1:8472` and the Vite live-mode app on `127.0.0.1:5173` with a guarded same-origin `/api` proxy. |
| `pnpm typecheck` | Run every workspace package's declared `typecheck` script, one package at a time. |
| `pnpm test` | Run every workspace package's declared `test` script, one package at a time. Tests use fake local executables and must never perform a live GitHub write. |
| `pnpm build` | Run every declared workspace build, one package at a time. The Node BFF intentionally runs TypeScript with Node's type stripping and has no emitted bundle. |
| `pnpm build:demo` | Produce the static fixture-mode frontend under `app/dist/`. |
| `pnpm start` | Start the loopback BFF using safe argv assembled from the documented environment values. It does not imply that a frontend is served. |
| `pnpm smoke:fixture` | Build and non-destructively probe the static fixture path. |
| `pnpm scrub` | Scan tracked/untracked non-ignored text files and committed history for common secrets; current files are also checked for known unsanitized identities and developer-home paths. It never rewrites files. |
| `pnpm check` | Run typecheck, tests, build, fixture smoke, and repository scrub in that order. |

The equivalent convenience wrapper is `./scripts/run.sh <command>`, where command is `install`, `demo`, `dev`, `build`, `typecheck`, `test`, `start`, `smoke`, or `scrub`.

## Fixture behavior versus live behavior

| Capability | Fixture mode (`pnpm demo`) | Local BFF mode |
|---|---|---|
| Browser data source | Committed `snapshot.v1.json` | `GET /api/v1/snapshot` and `GET /api/v1/events` |
| GitHub credentials | Not used | Required only for configured GitHub reads or the optional write |
| Substrate | Not used | Optional `fkst-framework observe --durable-root … --json` child process |
| Devloop health | Recorded, visibly labeled | Optional opaque `scripts/run.sh health` output |
| Write posture | Always read-only | Read-only by default; optional issue admission only after every guard passes |
| Historical truth | Recorded illustrative sequence only | None: polling can miss acknowledged deliveries |
| Unreachable source | Fixture remains available | `unknown`/`unavailable`, never fabricated zero |

Fixture values are sanitized replay data, not current repository or engine status. The fixture includes one deliberately untrusted marker to demonstrate that author filtering happens before parsing. Unknown marker schemas are ignored rather than promoted to facts.

## Architecture and truth boundary

```text
fixture mode
demo/fixtures/snapshot.v1.json ── Vite static copy ── browser

local mode
GitHub ── gh argv adapter ─────────────┐
fkst-substrate ─ observe --json argv ──┼─ loopback BFF ─ HTTP/SSE ─ browser
public devloop ─ health argv ──────────┘
```

There is no console database. Authority remains outside the console:

- Trusted `state:v1` GitHub comment markers are business-state authority. State labels are hints, and their known collisions are lossy.
- `review-result:v1` and `merge-ready:v1` are the only additional marker schemas projected in this cut. The trust gate runs before any marker parse.
- `fkst-framework observe --json` describes the current delivery ledger only. Queue depth and dead letters are not business progress.
- Devloop health is displayed opaquely from its first output line. Exit code zero does not distinguish `HEALTHY` from an anomaly verdict.
- Client-side deltas are not an authoritative timeline. Acknowledged deliveries can disappear between polls, and at-least-once delivery can repeat IDs.

The BFF binds only `127.0.0.1`, uses safe argv arrays with `execFile` rather than shell strings, sends no permissive CORS headers, and exposes GET-only reads plus one POST-only mutation. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Live prerequisites and startup

Live mode is optional; fixture mode is the credential-free judging path. A useful live runtime panel requires:

- a local clone/build of `fkst-substrate` containing the `fkst-framework` executable;
- a durable root owned by an existing deployment;
- optionally, the public devloop checkout's `scripts/run.sh` for its opaque health verdict;
- Node.js 22.6–26 and pnpm 10.17.1; and
- `gh` authenticated as a human only if GitHub integration is configured. The human actor must differ from the normalized trusted bot login.

The console never opens `delivery.redb`, never touches the observe socket, never starts or controls the engine, and never sets `FKST_GITHUB_WRITE`.

The server's exact read-only CLI is:

```bash
pnpm --filter ./server start \
  --port 8472 \
  --observe-bin /absolute/path/to/fkst-framework \
  --durable-root /absolute/path/to/durable-root \
  --health-script /absolute/path/to/fkst-packages/scripts/run.sh
```

`--observe-bin` and `--durable-root` must be supplied together. With neither configured, runtime data degrades to unavailable/unknown rather than zero. The default server URL is <http://127.0.0.1:8472>; API probes are `GET /api/v1/health`, `GET /api/v1/snapshot`, `GET /api/v1/session`, and `GET /api/v1/events`.

`pnpm start` accepts the same settings through exported variables listed in `.env.example`; the wrapper translates them into a direct argv vector. It deliberately does not source `.env` or execute configuration as shell code. `console.config.example.jsonc` is a reviewable mapping of the same settings, not an automatically loaded configuration file in this demo cut.

For the development topology, export any optional values from `.env.example` and run `pnpm dev`, then open <http://127.0.0.1:5173>. The wrapper fixes the BFF at port 8472 and Vite proxies `/api` to that exact loopback origin. The proxy rejects foreign browser Origins before rewriting the validated same-origin request to the BFF Host/Origin, and it accepts only an origin-only `http://127.0.0.1:<port>` test override.

`pnpm start` remains intentionally BFF-only: it does not serve `app/dist`. There is no one-command production/static live UI in this two-hour cut; use `pnpm dev` for the integrated local UI and `pnpm demo` for the credential-free fixture UI.

## The only optional mutation

The sole mutation is creating one issue in exactly one configured sandbox repository with `fkst-dev:enabled` attached by the same `gh issue create` invocation. Enabling it requires all of the following:

- explicit `--enable-writes` (or `FKST_ENABLE_WRITES=1` through the root wrapper);
- exactly one valid `--sandbox-repo OWNER/REPOSITORY`;
- a configured `--bot-login`;
- a resolved `gh api user` actor distinct from that bot after trim/lowercase/`[bot]` normalization;
- POST to the one issue endpoint;
- exact loopback Host and Origin;
- the per-launch session token; and
- a valid bounded JSON body.

Example launch posture only—this command does not itself create an issue:

```bash
export FKST_SANDBOX_REPO=OWNER/REPOSITORY
export FKST_BOT_LOGIN=trusted-loop-agent
export FKST_ENABLE_WRITES=1
pnpm start
```

The UI must display the resolved actor and resulting issue URL. Demo mode cannot enable writes. There are no issue edits, generic label mutations, marker writes, bot comments, PR approvals, merges, engine controls, config writes, terminal-goal resume, or arbitrary command endpoints.

## Platform honesty

The integration scripts and package graph were exercised on macOS 26.5.2 arm64 with Node.js 26.3.0, pnpm 10.17.1, and Chrome 150.0.7871.129. The package contract supports Node 22.6 through 26 because the BFF uses Node's TypeScript type stripping. The CI definition targets the latest Node 22 on Ubuntu, but Linux is not claimed as verified until that workflow has completed successfully in the published repository. Windows is not supported or claimed for this demo: the convenience shell wrapper is POSIX, and no Windows/browser pass has been run.

Modern Chromium, Firefox, and Safari should support the standards used by the app, but only the Chrome version above is locally evidenced at this checkpoint.

## Prior work and external dependency provenance

The submission period began 2026-07-13. The work attributed to that period is this console repository: its React UI, loopback BFF, normalized snapshot contract, sanitized fixture replay, tests, and packaging. It does not claim that the FKST runtime was created during Build Week. This two-hour integration worktree began from `9308b5a018af28049c35517946aaae113e323c20`; the final implementation is preserved by the release commit on `codex/build-week-mvp`, while the required primary Codex `/feedback` Session ID remains external submission evidence.

Two pre-existing projects are the only primary FKST runtime integrations:

- [`ChronoAIProject/fkst-substrate`](https://github.com/ChronoAIProject/fkst-substrate), locally inspected at `e38358a0552c4133414836bf52df6593908fe547`;
- the public devloop in [`ChronoAIProject/fkst-packages`](https://github.com/ChronoAIProject/fkst-packages), locally inspected at `f6ad297c672c1d9d38c82e0a0ea50c96e2843e0b`.

They are external runtime/tool integrations, not vendored or relicensed by this repository's Apache-2.0 license. Node, pnpm, React, Vite, TypeScript, and `gh` are toolchain/runtime dependencies governed by their own licenses. The complete devbored product/specification is reference-only provenance and is not in the shipped import or runtime graph. More detail is recorded in [docs/PROVENANCE.md](docs/PROVENANCE.md).

Public historical evidence used to validate the contract includes [sandbox issue #111](https://github.com/ChronoAIProject/fkst-packages-testing/issues/111) for the issue-side state arc and [sandbox PR #77](https://github.com/ChronoAIProject/fkst-packages-testing/pull/77) for the completed review/merge evidence chain. The sanitized committed fixture uses replacement IDs and `example.invalid` URLs; it must not be narrated as a byte-for-byte capture of those links or as a single newly completed console-created-to-merge run.

## Codex and GPT-5.6 attribution

The Build Week cut was developed through Codex sessions directed to use GPT-5.6 Sol. Codex accelerated the work by turning the frozen substrate/devloop contracts into typed fixture and live snapshot paths, implementing the trust-first three-schema marker projection, building the guarded loopback BFF and React console, generating negative write-boundary and black-box tests, and packaging the deterministic judge path and repository scrub.

Pre-existing contract work also used Codex review to identify and correct six integration errors before this cut began. That review is prior-work context, not a claim that the underlying substrate or devloop was built during this event.

Repository prose alone is not proof of model identity or submission eligibility. The final public video must show the relevant Codex/GPT-5.6 configuration or run metadata and explain both how Codex built the console and how Codex workers participate in the loop. A successful `/feedback` upload from the primary build session must replace the placeholder above. Neither artifact has been verified in this worktree.

## Known limitations

- The fixture is a sanitized deterministic replay, not live status. Its invalid URLs intentionally do not navigate to real targets.
- The fixture demonstrates the contracted evidence model but is not a one-to-one replay of the public issue #111 / PR #77 identifiers.
- Live GitHub issue/PR/marker reads are available only when one repository and trusted bot are configured; the bounded adapter then enumerates and projects trusted evidence. With either value absent or a read failure, the collections report unavailable rather than fabricating zero. Live Council acquisition is not implemented and remains unavailable.
- The integrated same-origin live UI is a Vite development topology. The production BFF does not serve `app/dist`, so there is no packaged one-origin production server or container image in this cut.
- Only three marker schemas are parsed. Unknown schemas are ignored gracefully.
- There is no topology panel or topology read contract, no database, no durable console cache, and no authoritative timeline.
- Runtime health is opaque text, and delivery observation may be unavailable even while GitHub business state exists.
- Hosted demo, repository, video, Devpost, and `/feedback` artifacts are explicit placeholders.
- Public-repository secret scanning is not enabled or verified because no public repository URL/configuration exists yet; the local scrub covers the current tree and committed history but is not a substitute for the host feature.
- Linux CI, Firefox, Safari, Windows, clean-container setup, and a real guarded sandbox issue creation have not yet been evidenced at this checkpoint.
- This is a two-hour demo candidate, not a production security or availability claim.

## License

The console code in this repository is licensed under Apache License 2.0; see [LICENSE](LICENSE). That license does not relicense the external FKST dependencies, GitHub-hosted evidence, package-manager dependencies, fonts, or third-party tools. Bundled Space Grotesk and IBM Plex font notices, exact package pins and hashes, and the SIL OFL 1.1 text are preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
