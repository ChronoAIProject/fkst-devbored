# Judge runbook

## Credential-free fixture route

Expected elapsed time after dependency download: under five minutes.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm demo
```

Open <http://127.0.0.1:4173>. Do not configure GitHub, substrate, or a `.env` file for this path.

Pass criteria:

- the page visibly says **Recorded demo data** at all times;
- **Workflow** is the primary mechanism and has useful issues plus a PR evidence lane;
- Council has named seats, a decision, and disclosed dissent;
- Runtime names its artifact and describes current delivery state rather than business progress;
- the fixture posture is read-only and New Work cannot perform a live mutation;
- all source footers expose artifact/authority and snapshot age; and
- no request is sent to GitHub from the browser.

Stop the interactive demo with `Ctrl-C`.

## Deterministic fixture smoke

```bash
pnpm smoke:fixture
```

This builds `app` in demo mode, starts a temporary loopback preview at <http://127.0.0.1:4174>, checks `/fixtures/snapshot.v1.json`, checks the HTML mount, verifies the built JavaScript retains the recorded-data disclosure, and shuts down the preview. It does not alter fixtures or call external APIs.

## Full local verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:fixture
pnpm scrub
```

`pnpm check` runs those five gates in the same order. Individual commands are shown because they make the failing acceptance criterion unambiguous.

## Optional BFF probe

The BFF is loopback-only and defaults to read-only unknown/unavailable sources:

```bash
pnpm start
```

In a second terminal:

```bash
curl --fail --show-error http://127.0.0.1:8472/api/v1/health
curl --fail --show-error http://127.0.0.1:8472/api/v1/snapshot
curl --fail --show-error http://127.0.0.1:8472/api/v1/session
```

Expected behavior without upstream configuration is an operational BFF plus explicit unavailable/unknown upstream facts—not zero queues, zero DLQ, a healthy upstream, or an empty business board.

Before starting a configured live topology, run the non-mutating readiness report:

```bash
pnpm preflight:live
```

It always performs a read-only `gh` actor check and probes repository, observe, and health sources only when their corresponding environment configuration is present. `PASS`, `FAIL`, `UNKNOWN`, and `UNAVAILABLE` are distinct; details and JSON output are documented in [LIVE-PREFLIGHT.md](LIVE-PREFLIGHT.md).

For an integrated live-development UI, stop the standalone BFF and run `pnpm dev`; open <http://127.0.0.1:5173>. That command defaults to BFF port 8472 and UI port 5173 with a guarded Vite same-origin `/api` proxy. If either port is occupied, select unused loopback ports with `FKST_CONSOLE_PORT` and `FKST_CONSOLE_UI_PORT`; the proxy follows the chosen BFF automatically. Without upstream configuration, the UI must render disconnected/unavailable source facts honestly. `pnpm start` remains API-only and does not serve the built frontend.

An authenticated read-only populated probe can use:

```bash
FKST_CONSOLE_PORT=18472 \
FKST_CONSOLE_UI_PORT=15173 \
FKST_SANDBOX_REPO=ChronoAIProject/fkst-packages \
FKST_BOT_LOGIN=ElonSG \
pnpm dev
```

Do not set `FKST_ENABLE_WRITES=1`. At the recorded July 22 checkpoint, the BFF and Vite proxy returned five open issues and one open PR, while Council, Runtime, and health remained explicitly unavailable. This is populated acquisition/proxy evidence; the recovery plan still requires a browser-DOM proof before calling the live UI demonstrated.

## Submission evidence still outside this repository

- public candidate source: [`codex/build-week-mvp`](https://github.com/ChronoAIProject/fkst-devbored/tree/codex/build-week-mvp) (isolated branch; unrelated `main` unchanged);
- hosted static fixture URL: placeholder;
- public narrated video under three minutes: placeholder;
- primary Codex `/feedback` Session ID: placeholder; and
- Devpost submission URL: placeholder.

Do not infer completion from the existence of this runbook.
