# Architecture and data authority

FKST Console has two intentionally separate execution shapes.

```text
Recorded judge path
sanitized snapshot.v1.json ── static Vite build ── browser

Optional local path
GitHub ─ gh argv adapter ────────┐
                                ├─ 127.0.0.1 Node BFF ─ HTTP/SSE ─ browser
substrate ─ observe argv adapter ┤
devloop ─ health argv adapter ───┘
```

## Components

`app/` owns the React/Vite UI and its normalization into one presentation model. Fixture mode reads `/fixtures/snapshot.v1.json`; live mode reads the BFF snapshot and SSE routes. It never receives GitHub credentials or runs local processes.

`server/` owns the Node/TypeScript BFF. It is fixed to `127.0.0.1`, constructs child-process argument arrays, and keeps disposable snapshot projections in memory. It has no database and is not an FKST engine control plane.

`demo/fixtures/` owns sanitized, deterministic recorded data. It is part of the frontend public tree only for demo builds. Capture and sanitization metadata travel with the fixture.

`test/` owns black-box and static security checks. Fake `gh`, `health`, and `fkst-framework` executables keep tests deterministic and prevent a real write.

Root scripts own package orchestration, fixture smoke, and repository scrub. They do not reinterpret business data.

## Authority table

| Displayed fact | Deciding artifact | Console treatment |
|---|---|---|
| Issue state | Latest accepted trusted-bot `state:v1` marker | Marker-derived state and `stage_rank`; labels only warn about drift. |
| Review decision | Accepted trusted `review-result:v1` marker | Approve or valid reject; rejected markers without reader-required evidence are ignored. |
| Merge readiness | Trusted `merge-ready:v1` marker bound to a valid head SHA | Evidence only; the console never merges. |
| Delivery snapshot | `fkst-framework observe --durable-root … --json` | Current delivery/lease facts; never business progress or full history. |
| Health | First line of public devloop `scripts/run.sh health` | Verbatim opaque text; exit zero is not interpreted as healthy. |
| Council | App-owned recorded/projected evidence | Displays roster, decision, round, and dissent with provenance. The populated projection is fixture-only in this cut. |
| Fixture values | `demo/fixtures/snapshot.v1.json` | Persistent recorded-data banner and read-only posture. |

## Live degradation

Every upstream source is independently fallible. Missing observe configuration, a missing database, invalid JSON, a failed health command, or unconfigured GitHub reads maps to unavailable/unknown data with a reason. The console must not coerce absence into zero. The last browser snapshot can remain visible after SSE disconnect only with its original age continuing to increase.

The current local provider implements substrate observation, opaque health, and bounded GitHub issue/PR/comment reads when one repository and trusted bot are configured. Missing GitHub configuration or read errors return unavailable collections. Live Council acquisition is not implemented and remains unavailable. This is preferable to showing an authoritative-looking empty board.

## Integration topology

`pnpm dev` starts a verified same-origin development topology: BFF on `127.0.0.1:8472`, Vite on `127.0.0.1:5173`, and a guarded `/api` proxy. Vite rejects a foreign Origin before proxy rewrite, rewrites only an admitted same-origin request to the BFF authority, exposes no permissive CORS response, and rejects non-loopback proxy targets.

The BFF does not serve `app/dist`. `pnpm start` is therefore API/SSE-only, not a production static UI server. Fixture mode remains the primary credential-free judge path.

## Deliberate exclusions

No topology scraping, config editing, engine lifecycle, ledger access, observe-socket access, arbitrary command execution, generic GitHub mutation, PR mutation, merge, or console database exists in this cut.
