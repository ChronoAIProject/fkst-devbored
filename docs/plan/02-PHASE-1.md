# P1 — Foundation

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md).

**Entry:** G0 closed. **Exit gate: G1.**

The deliverable is **one signed vertical slice**, not four parallel half-stacks.
Sol's finding: packaging depends on the supervisor and the store, not just the
shell — so the first thing that exists must be an app that launches from Finder
and successfully shells the real tools.

---

## Stream J — Packaging (starts first, gates G1)

### P1-J-01 — Signed skeleton · M
App skeleton, signed and notarisable, launches from Finder.
**Done:** a notarised build opens on a clean machine without quarantine
warnings.

### P1-J-02 — GUI PATH + tool discovery · M
Resolve absolute paths for `gh`, `git`, `fkst-framework`, `run.sh` under a
Finder-launched app's restricted `PATH`.
**Done:** all four resolve with no shell profile sourced; failure to resolve is
a typed error surfaced in the doctor, not a crash.

### P1-J-03 — Native deps · M
SQLite packaged and opening a DB from the app bundle; app-data location chosen;
minimum OS version set.
**Done:** DB opens and migrates in a signed build.

### P1-J-04 — Release mechanics · M
Installer format, upgrade behaviour, DB compatibility across versions, uninstall
semantics, crash-reporting posture, signing credential ownership.
**Done:** documented; an upgrade over an existing install preserves data.

---

## Stream B — Supervisor & adapters

### P1-B-01 — Process supervisor · L · *highest-risk task in P1*
`Process.start` wrapper: absolute exec resolution, argv only, deadlines with
**process-tree** termination, output caps, UTF-8 decode with replacement,
bounded stderr, sanitised env (`GH_PROMPT_DISABLED=1`,
`GIT_TERMINAL_PROMPT=0`, stripped inherited tokens), explicit cwd.
**Done:** P0A-04's orphan tests pass from the signed build; cancellation is
immediate; output overflow aborts cleanly.

### P1-B-02 — observe adapter · M
`fkst-framework observe --durable-root <p> --json` → `ObserveSnapshot`.
Never the socket, never redb. `subscriber_status=unknown` is a valid state.
**Done:** parses the fixture corpus; offline and unreachable produce typed
states, not exceptions.

### P1-B-03 — health adapter · S
Runs `run.sh health`; returns the line **verbatim** as opaque text.
**Done:** no parsing exists; a review check enforces it.

### P1-B-04 — gh adapter (read) · L
Entity discovery queries, comment fetch, check-run rollup, actor resolution.
Captures rate metadata per P0A-05. Typed errors including rate-limited,
unauthenticated, not-found, transport.
**Done:** every call class returns budget + reset; pagination caps are reported,
never silently truncated.

### P1-B-05 — git adapter (read) · S
Branch and ref facts only. Authoring deferred to P4.
**Done:** no command mutates the operator's working tree.

---

## Stream D1 — Store

### P1-D1-01 — Schema + four data classes · M
`cache_*`, `prefs`, `staged_*`, `audit_log` with mechanically distinct prefixes.
Generation-keyed caches with TTL.
**Done:** dropping every `cache_*` table changes only latency; cold start
against an empty DB works.

### P1-D1-02 — Migrations + WAL-safe backup · L
Versioned migrations; pre-migration backup using **SQLite backup/checkpoint
facilities, not file copy** (WAL makes file copy invalid); export/restore.
**Done:** interrupted migration recovers; downgrade is refused with a clear
error; disk-full is handled; restore round-trips.

### P1-D1-03 — DB isolate · S
All store access through one isolate.
**Done:** no store call originates outside it.

---

## Stream I1 — Connection model & doctor *(moved earlier — G1 depends on it)*

### P1-I1-01 — Connection model · M
Full profile per `docs/05` §2, plus `ConnectionDerived` recomputed per cycle.
**Done:** derived facts are never persisted as editable prefs; hand-editing the
DB cannot change trust.

### P1-I1-02 — Trust derivation · M
Effective profile → trusted bot logins, `[bot]`-normalised; `unverifiable`
fails closed to all-markers-untrusted.
**Done:** the untrusted fixture projects as `untrusted`, never as state.

### P1-I1-03 — Auth context model · M
Non-secret context id + host; `GH_CONFIG_DIR` isolation per P0A-08; actor
resolution surfaced to the UI.
**Done:** two connections sharing an actor are correctly identified as sharing
one budget.

### P1-I1-04 — Doctor core · L
Checks per R3.6: canonical paths, duplicate durable roots, binary version,
workspace/lock vs platform HEAD, observe schema, marker-schema support, health
command, gh actor + scopes, repo access, write allowlist, profile provenance.
**Done:** a misconfigured connection produces a specific, actionable failure —
not a generic error. Redaction applies to `detail` (P5).

---

## Stream A — Shell & design system

### P1-A-01 — Theme from tokens · M
`docs/06` tokens computed from **oklch** (never approximate hex); type scale;
one theme object.
**Done:** changing one token changes every surface.

### P1-A-02 — App shell + navigation · M
Sidebar (workspace, views, connections-as-teams, posture + freshness footer),
view bar, filter bar.
**Done:** navigation works against fixtures with no live source.

### P1-A-03 — Status icon language · M
The `StatusIcon` pie/dash/check system from `docs/06` §4 as one component.
**Done:** every `MarkerState` including null/unparseable has a defined
rendering; hue is never the sole carrier.

### P1-A-04 — Shared components · L
`StageChip`, `ClaimAvatar`, `CommentCount`, `LabelChip`, `PostureChip`,
`ProvenanceFooter`, `SnapshotAgeBadge`, `PersonaDot`, `VerdictBadge`,
`DegradedState`, **`UnknownValue`**.
**Done:** `UnknownValue` is the only path to rendering absent data; a lint or
review check rejects raw `0` fallbacks.

### P1-A-05 — Six view states · M
Loading, empty, stale, degraded, unverified, fixture — as reusable scaffolding.
**Done:** any view can adopt all six without bespoke code.

---

## G1 exit checklist

- [ ] Signed build launches from Finder; shells observe, health, gh, git
- [ ] No orphan processes under any termination path
- [ ] Store migrates; WAL-safe backup and restore proven
- [ ] Doctor passes on a real connection and fails informatively on a broken one
- [ ] Trust derivation fails closed
- [ ] Shell renders from fixtures with all six states reachable
- [ ] Advisor review passed

⟦AI:FKST⟧
