# Live-read preflight

`pnpm preflight:live` reports whether a real live read can start, without
performing any write. It uses the same environment variables `.env.example`
documents for `pnpm start`, and it reuses the reviewed server adapters verbatim
rather than re-deriving command lines. The default/configured `gh` binary is
always checked for read-only authentication; repository, observe, and health
reads occur only when their source configuration is supplied:

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

When a real binary and durable root are configured but the durable state has
never been initialized, observe and health report specific `UNAVAILABLE`
reasons instead of an opaque `UNKNOWN`: `durable_root_missing` (the configured
`FKST_DURABLE_ROOT` path does not exist — only `ENOENT` counts as absent) or
`observe_database_missing` (the directory exists but `delivery.redb` does
not). The engine emits one identical exit-2 failure for both cases, so the
distinction comes from typed read-only `stat` probes; nothing is created and
the database contents are never read. A malformed shape (a plain file as the
root, or a directory named `delivery.redb`) is `FAIL` with
`durable_root_invalid`/`observe_database_invalid`, and an inaccessible path
(permission or I/O error) stays `UNKNOWN` — never "missing".

Health narrows a failure to a durable-state reason only when the exit code and
stderr match the pinned public devloop's documented missing-database signature
*and* the probe confirms the absence; an unrelated nonzero exit (for example a
permission error) stays `UNKNOWN (health_command_failed)`. Failure evidence is
structured and allowlisted — the exit code and the validated signature name
(`public_devloop_observe_read_failed`) — and raw stderr is never projected
into the report or the BFF snapshot. See `docs/DURABLE-ROOT-LIFECYCLE.md` for
the state-changing, human-gated initialization lifecycle.

The process exits `1` only when at least one integration is `FAIL`;
unconfigured (`UNAVAILABLE`) integrations exit `0` because that is a valid
read-only posture.

## Output

The default mode prints a human summary followed by a single
`LIVE_PREFLIGHT_JSON=<json>` line. For stdout containing only the
pretty-printed `fkst.console.live-preflight.v1` report, use either
`pnpm --silent preflight:live -- --json` or
`./scripts/run.sh preflight --json`; plain pnpm lifecycle output otherwise
precedes the command's stdout. No secrets, tokens, or shell invocations are
involved: every probe is a direct `execFile` with `shell: false`, and
configuration comes exclusively from the environment.

`test/live-preflight.test.mjs` exercises the command against the audited
tripwire fakes in `test/bin/`, asserting the exact read argv, the absence of
any mutation, and that missing or malformed dependencies never report `PASS`.
