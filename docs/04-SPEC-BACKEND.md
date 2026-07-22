# 04 — Backend spec (service + adapter layers)

Status: **LEGACY SOURCE** — superseded by
[`docs/spec/02-ARCHITECTURE.md`](spec/02-ARCHITECTURE.md) and
[`docs/spec/04-DATA-CONTRACTS.md`](spec/04-DATA-CONTRACTS.md).
Date: 2026-07-20
Depends on: `docs/05-DATA-CONTRACTS.md` (frozen)

"Backend" here is the in-process service layer. There is no server (R1.1).

## 1. Modules

| Module | Owns | Pure? |
|---|---|---|
| `supervisor` | process spawn, deadlines, kill-tracking, env sanitisation | no |
| `adapters` | observe / gh / git / health command construction + typed errors | no |
| `projection` | markers → `Entity`, `Claim`, `Debate` | **yes** |
| `discovery` | opt-in surfaces → candidate entity set | yes (given inputs) |
| `council` | roster + flow read, staged edits, validation | yes |
| `materialiser` | guarded host-profile write | no |
| `scoring` | merged outcomes → `PersonaScore` | **yes** |
| `scheduler` | one global poll loop, fairness, visibility | no |
| `ratelimit` | budget per `{host, authContext}` | no |
| `writes` | guard → adapter → audit | no |
| `store` | drift/SQLite on its own isolate | no |

`projection` and `scoring` are pure and fixture-testable with **no process or
network access** (R8.4). This is the highest-value test surface in the system;
keep it uncontaminated.

## 2. Process supervisor + adapters

**Supervisor** (R1.2): resolve absolute executable (GUI `PATH` is restricted —
never rely on it); argv arrays only; per-call deadline that kills the child and
its group; output caps with typed truncation errors; UTF-8 decode with
replacement; bounded stderr; child env sanitised — strip inherited
`GH_TOKEN`/`GITHUB_TOKEN` unless the selected auth context supplies them, set
`GH_PROMPT_DISABLED=1`, `GIT_TERMINAL_PROMPT=0`; explicit working directory.

**observe adapter**
`fkst-framework observe --durable-root <p> --json` — the **only** engine read
path. Never connect to `/tmp/fkst-observe-*.sock`, never open `delivery.redb`
(exclusive lock while supervise runs). Treat `subscriber_status=unknown` as a
valid offline state, not an error.

**gh adapter**
Single module, argv only. Owns: entity discovery queries, comment fetch,
check-run rollup, actor resolution (`gh api user`), and the R6 writes. Captures
rate-limit headers on every call and reports them to `ratelimit`. Classifies
errors into `WriteError` / typed read errors — never raises raw.

**git adapter**
Read: branch/ref facts. Write: authoring only, inside **app-managed worktrees**
— never switch branches or modify the operator's active checkout. Serialise
per-repo. Validate canonical paths against allowlisted roots (reject symlink
escape).

**health adapter**
Runs `scripts/run.sh health`; returns the line **verbatim** as an opaque
string. Any parsing here is a spec violation (R7.1).

## 3. Snapshots

Each cycle produces an immutable `RuntimeSnapshot` + entity set, generation-
keyed. Generations replace, never merge — partial merges are how stale rows
survive as phantom truth. Old generations are dropped after the UI swaps.

## 4. Discovery

Candidate set = union of:
1. issues carrying the opt-in label,
2. issues assigned to a trusted bot login,
3. open PRs authored by a trusted bot login.

Then per-entity comment fetch for markers. **Never filter by `fkst-dev:<state>`
labels** (R5.4) — they drift and `dependency_wait` shares `ready`'s label.
Dedupe by `EntityRef`. Cap per-cycle fetches; log what was dropped rather than
silently truncating.

## 5. Projection (pure)

Input: raw comment records + `ConnectionDerived`. Output: `Entity`, `Claim`,
`Debate`.

Rules:
- Trust only markers authored by a login in `trustedBotLogins`, compared after
  `[bot]` suffix normalisation. `trustSource == unverifiable` ⇒ everything
  projects as `untrusted`.
- Version ordering per the platform's total order; the highest wins.
- **Unknown schema version ⇒ `parseStatus = unparseableSchema`.** Never guess,
  never default to the nearest known shape.
- Labels never contribute state; they set `labelDrift` when they disagree.
- Claim resolution branches on `claimMode`; `since` only from timeline events,
  else `ageUnknown = true`.
- Excerpts are bounded and produced here; raw bodies never leave this module
  (R2.2).

Fixtures are pinned to a platform commit and carry `schemaVersion` +
`capturedAt`. They are a **regression net, not a schema authority** — the
durable fix is a platform-owned marker projection, proposed upstream
(`docs/08` ADR-011).

## 6. Council service

**Read:** roster + flows from the deployment config; personas' briefs and seat
assignments. Platform prompt files are read-only inputs shown for reference.

**Staged edits:** held in `staged_*` with a base hash and per-key base values.

**Validation before save:** every non-machine `FlowStep` covers agree /
disagree / exhausted; veto personas are seated at the step referencing them;
no persona is seated at a `isMachineGate` step; roster references resolve.

**Materialisation** (guarded write):
1. Restricted managed-key grammar (`KEY=value`). Duplicate keys, `export`,
   interpolation, or command substitution on a managed key ⇒ **fail closed**,
   hands off the file.
2. Reload and compare base hash; on drift show a three-way diff and require
   fresh confirmation. Drafts are **never** auto-applied — not on startup,
   migration, connection switch, or restart.
3. Reject symlink targets; preserve owner/mode; timestamped backup;
   write → fsync → rename → fsync-dir.
4. Preserve untouched byte ranges verbatim.
5. Result carries the tri-state `draft | appliedOnDisk | activeRuntimeUnknown`.

The console can prove it wrote a file. It can never prove the running process
read it. The UI must say exactly that.

## 7. Scoring (pure)

For each persona over a window: count debates seated, spoke, objected;
determine **upheld** by whether the final merged diff reflects the objection;
**caught alone** when no other seat raised it that round; **changed position**
from `changedFrom` transitions.

`upheldRate` is `null` when `objected == 0` — never `0.0`. Derivation string is
mandatory and must name the basis. **Nothing is self-reported by a persona**
(R4.3.2).

## 8. Scheduler, rate limiting, writes

**Scheduler:** one global loop; adaptive cadence per connection (activity-
driven), jitter, visibility-aware suspension, manual refresh override, bounded
global subprocess concurrency, per-connection fairness so one slow connection
cannot starve the fleet. Paused connections are skipped entirely.

**Rate coordinator:** one budget per `{githubHost, authContextId}`. Dedupe
identical in-flight repo queries. Back off using response reset headers, not a
fixed timer. One auth probe per budget window. Surface remaining budget and
reset time to the UI.

**Write pipeline:** allowlist → resolve actor → reject if actor matches any
trusted bot login (normalised) → adapter → audit row with result URL. The
bot-actor rejection has **no override path**. Writes are disabled entirely in
fixture mode.

## 9. Store

Four data classes per R2.1 with mechanically distinct table prefixes. One DB
isolate. Versioned migrations with pre-migration backup and export/restore;
never resolve corruption by deletion. Caches carry generation + TTL; a purge
drops all `cache_*` without touching `audit_log` or `staged_*`.

## 10. Errors

Every adapter returns a typed error that names the layer, the command, and
whether it is retryable. No raw exceptions cross the seam. Errors map to
`DegradedState` reasons the UI already renders — adding a new failure mode
means adding a typed reason, not a new string.

⟦AI:FKST⟧
