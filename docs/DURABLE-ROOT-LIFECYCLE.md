# Durable-root lifecycle and human gate (E5/E7)

This documents the supported lifecycle of the substrate delivery durable root
exactly as the two pinned dependencies define it. Sources: `fkst-substrate`
`e38358a0552c4133414836bf52df6593908fe547` (README "Framework CLI",
`crates/fkst-framework/src/observe.rs`, `crates/fkst-common/src/durable_layout.rs`,
`crates/fkst-framework/src/supervise/delivery_store.rs`) and the public devloop
`ChronoAIProject/fkst-packages` `f6ad297c672c1d9d38c82e0a0ea50c96e2843e0b`
(`scripts/run.sh`, `scripts/board.py`, `scripts/bin_bootstrap.sh`). Both
checkouts are read-only evidence; nothing here was executed against a user
durable root and no durable root was initialized.

## Supported lifecycle

There is **no standalone init command** for a durable root. The pinned
`fkst-framework` CLI exposes no `init`/`create` durable-root subcommand, and the
public devloop does not add one. The lifecycle is:

1. **Create/initialize (STATE-CHANGING — human-gated).** The only sanctioned
   creator is the supervise path. `fkst-framework supervise` opens the delivery
   store with `Database::create` (`delivery_store.rs:107`), which creates
   `<durable-root>/delivery.redb` on first run. The public devloop wraps this as:

   ```
   scripts/run.sh supervise --project-root <HOST> --platform-root <PKGSRC> \
     --platform-packages "<names>" --durable-root <path> [--runtime-root <fresh>]
   ```

   (`run.sh` also has a legacy package-local form, `scripts/run.sh supervise
   <package>`, which `mkdir -p`s `.fkst/run/durable` inside the checkout and
   requires `FKST_RATE_POOL_ROOT`.) Because this creates durable state **and
   starts the real engine event loop**, it requires explicit human approval of
   the exact disposable root path before any invocation. A disposable root is
   removed afterwards by deleting the approved directory; no engine command
   deletes roots.

2. **Read (read-only, no gate).** Post-init acceptance is exactly:

   ```
   fkst-framework observe --durable-root <path> --json [--limit <n>]
   ```

   `observe` never creates state: `DurableLayout::new` only validates the path
   string, and the store is opened with `DeliveryStore::open_existing` →
   `Database::open`, which fails if `delivery.redb` is absent. A live engine is
   answered through its observe socket; a stopped engine is answered from the
   database snapshot.

## Verified failure evidence (real transcripts, 2026-07-22)

Binary: pre-existing `fkst-substrate/target/debug/fkst-framework` at the pinned
checkout; probe roots under `/tmp`, never user roots. Root absent and
database absent produce the **same** exit code and message, so the engine alone
cannot distinguish them:

```
$ fkst-framework observe --durable-root /tmp/fable-e5-missing-root --json
[framework] startup error: open existing durable delivery database `/tmp/fable-e5-missing-root/delivery.redb`: I/O error: No such file or directory (os error 2)
exit=2

$ mkdir /tmp/fable-e5-empty-root && fkst-framework observe --durable-root /tmp/fable-e5-empty-root --json
[framework] startup error: open existing durable delivery database `/tmp/fable-e5-empty-root/delivery.redb`: I/O error: No such file or directory (os error 2)
exit=2
```

The console therefore distinguishes `durable_root_missing` from
`observe_database_missing` with typed read-only `stat` probes
(`server/src/observe.ts`, `classifyMissingDurableState`): only `ENOENT` counts
as absent, malformed shapes surface as `durable_root_invalid`/
`observe_database_invalid`, permission or I/O errors stay unclassified, and
the database contents are never read. Health additionally requires the pinned
devloop failure signature (exit 1 plus the documented `board.py` stderr shape)
before narrowing, and projects only structured evidence — never raw stderr.
On the successful observe path the ledger's `source.database` is accepted only
when it equals exactly `<configured root>/delivery.redb`, and the snapshot
redacts both the configured root and that derived database path to the
sentinels `[configured-local-root]`/`[configured-local-database]`, so no
absolute local path reaches `/api/v1/snapshot`.

Health, run twice with identical outcome (`BIN` pinned to the existing binary,
`FKST_NO_AUTOBUILD=1`, `FKST_DURABLE_ROOT=/tmp/fable-e5-missing-root`):

```
$ scripts/run.sh health          # invocation 1 and invocation 2, byte-identical
warning: FKST_NO_AUTOBUILD set; skipping fkst-framework freshness build
error: fkst-framework observe --json failed; fkst-substrate#81 is required for scripts/run.sh board: [framework] startup error: open existing durable delivery database `/tmp/fable-e5-missing-root/delivery.redb`: I/O error: No such file or directory (os error 2)
exit=1
```

No verdict line is printed on this path, so the documented first-line contract
(`HEALTHY` / `N ANOMALIES NEEDING ATTENTION`) is never reached. The expected
acceptable readiness outcome for a configured-but-uninitialized root is
`UNAVAILABLE (durable_root_missing)` — not `HEALTHY`, and not an opaque
`UNKNOWN`.

## `scripts/run.sh` side effects an operator must know

A nominally read-only `run.sh health`/`board` invocation is **not** guaranteed
side-effect free:

- `resolve_bin` may fall back to a **pinned source cache clone/build** of
  `fkst-substrate` (documented resolution order: `$BIN` > repo `.fkst/env` >
  `PATH` > sibling checkout > pinned cache bootstrap into
  `FKST_BIN_CACHE_ROOT`/`XDG_CACHE_HOME`/`~/.cache/fkst`).
- `ensure_fresh_bin` runs `cargo build` inside the traced `fkst-substrate`
  checkout unless `FKST_NO_AUTOBUILD=1` (or CI) is set.
- On a **successful** board/health read, `board.py` writes a TTL cache to
  `<packages>/.fkst/run/board-cache.json`; on the failure path above it writes
  nothing.

The console adapter does not itself implement any of these writes: it invokes
the fixed `observe` argv against the engine binary directly, and it invokes
only the bounded `health` subcommand of the configured script. But when
`FKST_HEALTH_SCRIPT` points at the public `scripts/run.sh`, that script's own
entry path (`resolve_bin`/`ensure_fresh_bin`) still runs and can trigger the
documented side effects above — pinned-cache bootstrap, freshness `cargo
build`, and the success-path board cache write. The child process inherits the
server's environment, so operators should launch the BFF and preflight with
`BIN` pinned to a known engine binary, `FKST_NO_AUTOBUILD=1` exported, and
awareness of the `~/.cache/fkst` (or `FKST_BIN_CACHE_ROOT`) bootstrap cache.
The recorded health transcripts above were captured under exactly those
guards.

## Human gate summary

| Action | State-changing | Gate |
| --- | --- | --- |
| `fkst-framework observe --durable-root <path> --json` | No | none (read-only acceptance read) |
| `scripts/run.sh health` / `board` with `BIN` + `FKST_NO_AUTOBUILD=1` on the failure path | No | none |
| `scripts/run.sh health` / `board` without those guards | Possibly (cache bootstrap/build, board cache write) | operator awareness |
| `scripts/run.sh supervise ... --durable-root <path>` (or legacy `supervise <package>`) | **Yes** — creates `delivery.redb`, starts the engine | **explicit human approval of the exact disposable root, before invocation** |
