# Live-read preflight

`pnpm preflight:live` reports whether a real live read can start, without
performing any write. It probes only dependencies that are explicitly
configured through the same environment variables `.env.example` documents for
`pnpm start`, and it reuses the reviewed server adapters verbatim rather than
re-deriving command lines:

- **github** — resolves the actor with `gh api user --jq .login` through
  `GhAdapter.resolveActor`, then (only when `FKST_SANDBOX_REPO` and
  `FKST_BOT_LOGIN` are both set) performs the single bounded read-only GraphQL
  projection read via `acquireGithubProjection`.
- **observe** — requires the `FKST_OBSERVE_BIN`/`FKST_DURABLE_ROOT` pair and
  invokes `acquireObserveRuntime`, which runs the fixed argv
  `observe --durable-root <root> --json --limit 1000` and validates the
  `fkst.delivery.observe.v1` schema and durable-root allowlisting.
- **health** — requires `FKST_HEALTH_SCRIPT` and invokes `acquireHealth`,
  which runs only the bounded `health` subcommand (5 s timeout, 128 KiB output
  cap) and accepts only the documented verdict lines.

## Statuses

Each integration reports one of:

| Status | Meaning |
| --- | --- |
| `PASS` | The configured dependency answered the reviewed read and validated. |
| `FAIL` | Configuration or output is malformed (for example an invalid ledger JSON or an unrecognized health verdict). |
| `UNKNOWN` | The command ran but its failure cannot be classified further. |
| `UNAVAILABLE` | Not configured, or the configured binary/database is absent. Missing is never reported as `PASS`. |

The process exits `1` only when at least one integration is `FAIL`;
unconfigured (`UNAVAILABLE`) integrations exit `0` because that is a valid
read-only posture.

## Output

The default mode prints a human summary followed by a single
`LIVE_PREFLIGHT_JSON=<json>` line; `--json` prints only the pretty-printed
`fkst.console.live-preflight.v1` report. No secrets, tokens, or shell
invocations are involved: every probe is a direct `execFile` with `shell:
false`, and configuration comes exclusively from the environment.

`test/live-preflight.test.mjs` exercises the command against the audited
tripwire fakes in `test/bin/`, asserting the exact read argv, the absence of
any mutation, and that missing or malformed dependencies never report `PASS`.
