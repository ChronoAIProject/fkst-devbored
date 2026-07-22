# 10 — Local run (the complete E2E)

Status: **LEGACY RUN PROPOSAL** — superseded by the lifecycle and runbook in
[`docs/spec/`](spec/README.md).
Date: 2026-07-20

## What changed

The console is no longer only an observer. **It is the host that runs the
devloop locally.** It composes the platform, launches `supervise`, seeds work,
watches the loop execute, lets a human intervene, and stops it again.

This reverses ADR-016 (no engine control) — deliberately, by decision, recorded
as ADR-022. The authority invariant is **unchanged**: the loop still writes its
truth to GitHub; the console still holds no business state. What the console
gains is a *lifecycle* role, not an authority role.

## Reference, never clone

The console repo is a **host repo**. `substrate` and `packages` are referenced
by path from their existing sibling checkouts. Nothing is vendored, copied, or
forked.

```
FKST/
  substrate/          ← referenced: engine source + built binary
  packages/           ← referenced: platform Lua behaviour
  fkst-devbored/      ← this repo: the host
    .fkst/
      env                       BIN + runtime/durable roots  (gitignored)
      compose/package-roots     which roots compose into the graph
      local-packages/           HOST-OWNED packages only
        devbored-council/       the reinterpreted loop seam (see §4)
    console.config.jsonc        paths to the siblings, per connection
```

Rules:
- The console **never writes** into `../substrate` or `../packages`. They are
  read-only inputs. Violating this is how a "local convenience" becomes an
  unreproducible deployment.
- Paths are configured per connection, so several checkouts (or several
  branches via worktrees) can be hosted side by side.
- The engine binary is `../substrate/target/debug/fkst-framework`. If it is
  missing or stale, the doctor says so and offers the build command — the
  console does not silently build someone else's repo.

## 1. Composition

The console launches through the platform's own host entrypoint rather than
re-implementing package-root wiring:

```
packages/scripts/run.sh supervise
    --project-root      <console host root>
    --platform-root     ../packages
    --platform-packages "github-proxy consensus github-devloop …"
    --host-packages     "devbored-council"
    --durable-root      <app-data>/connections/<id>/durable
    --runtime-root      <app-data>/connections/<id>/runtime
```

Using the platform's entrypoint means BIN resolution, freshness checks, and
package-root assembly stay owned upstream. The console supplies composition and
environment, and nothing else.

**Durable root is per connection and never shared.** Two connections pointing at
one durable root is a corruption path; the doctor rejects it (P1-I1-04).

## 2. Lifecycle

The console owns the supervise process for connections it started.

| Action | Behaviour |
|---|---|
| **Start** | spawn through the process supervisor; stream stdout/stderr to a per-connection log; record pid + start time |
| **Stop** | signal, wait, escalate; **in-flight codex children are orphaned, not killed** — this is the platform's crash-only contract, not a bug |
| **Restart** | stop → confirm exit → start; the loop re-derives state from GitHub |
| **Adopt** | a supervise this console did not start is shown as *external* — observable, never controllable |
| **Crash** | detected, surfaced with the exit code and last log lines; **never auto-restarted** silently |

Two facts the UI must state honestly:

1. **Restart is a routine operation**, not a recovery of last resort — the loop
   is crash-only and re-derives from GitHub. The UI should not treat it as
   dangerous.
2. **The console cannot prove the running process's environment.** Once started
   it can report the env it *passed*; a process it adopted reads *unknown*. This
   is why the posture chip says "configured", not "active" (R7.3) — with one
   exception: for a connection **this console started**, posture is known, and
   the UI may say so.

## 3. The complete run

This is the E2E acceptance path. Every UI surface must serve a step of it
(`docs/11`), and the run must work end to end before release.

```
 1  Configure   point at ../substrate + ../packages; set repo, bot login,
                auth context, posture, integration branch
 2  Doctor      every path, binary, schema, token, and repo access verified
 3  Compose     choose platform packages + host packages
 4  Council     define the roster → written to host config (§4)
 5  Start       supervise launches; runtime panel shows queues filling
 6  Seed        create an issue + opt-in label from the console
 7  Intake      the loop admits it; state marker appears; board shows it
 8  Design      consensus runs with the configured roster; debate populates
 9  Implement   worktree + codex worker; board moves to implementing
10  PR          branch pushed, PR opened, board moves to review
11  Review      seats vote; debate reader shows verdicts and any narrowing
12  Intervene   human comment from the console; appears in the thread
13  Merge       gates evaluated; DRY-RUN holds at the gate, LIVE merges
14  Evidence    debate reader + scores reflect the run that just happened
15  Stop        supervise stops cleanly; no orphan console-owned processes
```

**Acceptance:** steps 1–15 complete against a sandbox repo in DRY-RUN, and
steps 1–13 complete in LIVE against a sandbox repo, with every state transition
visible in the console within one poll.

## 4. The reinterpreted loop — corrected

**Verified, and it corrects an earlier assumption (ADR-026).**

The consensus seam is real and deliberate. `consensus/core.lua:251`
`normalized_angles(proposal)` reads `proposal.angles`, and line 258 comments
that *"angle is untrusted (event-overridable)"* — the engine expects events to
override the roster.

**But nothing in the devloop path fills it.** The proposal is built by
`libraries/devloop/payloads/builders.lua:390` `C.build_proposal(issue)` — a
fixed table with no `angles` key — and raised by `github-devloop` departments
(`observe_issue:292`, `execute_start:68`, `loop:194`). A host-owned package
sits outside that path.

### Options

| # | Approach | Cost | Verdict |
|---|---|---|---|
| **A** | Host package replaces the issue-side lifecycle | reimplement most of ~9,430 lines | rejected — not 24h work, and it forks the loop |
| **B** | Upstream: `build_proposal` reads an angles config key | ~10 lines + one `config.lua` allowlist entry | **recommended** |
| **C** | Council ships read-only for v1 | none | fallback if B is refused |

### Option B, concretely

```lua
-- libraries/devloop/payloads/builders.lua, inside C.build_proposal
-- after the existing return table is assembled:
local angles = config.consensus_angles()   -- nil when unset
if angles then proposal.angles = angles end
```
plus `FKST_DEVLOOP_CONSENSUS_ANGLES` added to the allowed-env list in
`libraries/devloop/config.lua`, parsed as a comma-separated list.

Two properties make this the right shape: it uses a seam the engine already
declares as event-overridable, and it leaves the default path untouched
(absent key ⇒ `default_angles`, exactly as today).

**The change is small enough that the devloop can build it itself** — file it
as an issue in `fkst-packages`, let the loop take it through consensus,
implement, review, and merge. The console's first configured roster then argues
its own enabling change. That is also the strongest possible demonstration of
the product.

### Constraint (unchanged)

`core.lua:11` sets `max_angles = 4` and `normalized_angles` returns nil above
it, while `default_angles` has five entries. **Custom rosters are capped at 4
seats**; the editor enforces this with the reason shown. Raising the cap is a
second small upstream change, optional.

## 5. What the console still must not do

Unchanged and permanent:

- No writing state markers, `fkst-dev:<state>` labels, or bot-authored comments.
- No merge, approve, or close of others' work.
- No redb access, no observe-socket connection, no queue mutation.
- No editing platform package internals.
- Posture (`FKST_GITHUB_WRITE`) is set **only** as launch configuration for a
  connection the console starts, shown explicitly, defaulting to DRY-RUN. It is
  never toggled against a running process.

Owning the process lifecycle does not make the console an authority over the
loop's decisions. It starts the machine; it does not vote.

⟦AI:FKST⟧
