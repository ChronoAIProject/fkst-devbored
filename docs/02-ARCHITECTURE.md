# 02 — Architecture

Status: **LEGACY SOURCE** — superseded by
[`docs/spec/02-ARCHITECTURE.md`](spec/02-ARCHITECTURE.md) and
[`docs/spec/06-SECURITY-OPERATIONS.md`](spec/06-SECURITY-OPERATIONS.md).
Date: 2026-07-20

## Shape

One process. No server, no daemon, no port. "Frontend" and "backend" here mean
**UI layer** and **service layer** inside the same application — the split
exists to let streams work in parallel, and the seam between them is
`docs/05-DATA-CONTRACTS.md`.

```
┌──────────────────────────── application process ────────────────────────────┐
│                                                                             │
│  UI LAYER  (docs/03)                                                        │
│    views: fleet · list · board(status|stage|swimlane|claim) · drill-in      │
│           council(personas|flows|scores) · debate · runtime · doctor        │
│    state: view-models only — never calls a process, never parses a marker   │
│                                                                             │
│  ══════════════ contract seam (docs/05) — frozen before code ══════════════ │
│                                                                             │
│  SERVICE LAYER  (docs/04)                                                   │
│    projection    marker parse → Entity/Claim/Debate  (pure, fixture-tested) │
│    discovery     opt-in surfaces → entity set                              │
│    council       roster/flow read + staged edit + materialise               │
│    scoring       merged outcomes → PersonaScore                             │
│    scheduler     one global poller: bounded, fair, visibility-aware         │
│    ratelimit     one budget per {host, auth-context}                        │
│    writes        identity guard → adapter → audit                           │
│    store         drift/SQLite on its own isolate (4 data classes)           │
│                                                                             │
│  ADAPTER LAYER  (docs/04 §2)                                                │
│    process supervisor (Process.start, deadlines, kill-tracking, sanitised)  │
│      ├── observe CLI    fkst-framework observe --durable-root … --json      │
│      ├── gh             argv only, one module                               │
│      ├── git            argv only, app-managed worktrees for authoring      │
│      └── run.sh health  output consumed verbatim                            │
│    filesystem  platform checkout (read-only) · host profile (guarded write) │
└─────────────────────────────────────────────────────────────────────────────┘
        ↑ reads                                    ↓ human writes only
   GitHub (markers = truth) · git · engine durable ledger (via observe)
```

## Layer rules

**The UI layer may not**: spawn a process, parse a marker, know a schema
version, or hold authority. It renders view-models and emits intents.

**The service layer may not**: import a widget, assume a view exists, or return
a type not declared in `docs/05`.

**The adapter layer may not**: interpret. It runs a command and returns bytes
or a typed error. Meaning is added by projection.

This is what makes parallel streams possible: UI work is testable against
fixture view-models, service work is testable against recorded command output,
and neither waits for the other.

## Data flow — one poll cycle

1. **Scheduler** wakes a connection (adaptive cadence, jitter, suspended when
   the window is hidden unless notifications are enabled).
2. **Rate coordinator** grants a budget slot for `{host, auth-context}`, or
   defers the cycle. Deduplicates repo queries already in flight.
3. **Adapters** run: `observe --json`, `gh` list queries, `health`. Each has a
   deadline; failure is a typed error, never an exception that blanks a view.
4. **Discovery** unions the opt-in surfaces into a candidate entity set.
5. **Projection** parses trusted bot markers into `Entity`, `Claim`, `Debate`.
   Unknown schema version → **fail closed**, entity marked unparseable, banner
   raised. Never guessed.
6. **Store** writes `cache_*` rows keyed by generation; old generations are
   dropped, not merged.
7. **UI** receives a new immutable snapshot with its `asOf` and provenance.

A failure at any step degrades that connection only, with a typed reason the
fleet view can render (R3.2, R7.5).

## Trust derivation (per cycle, never cached as authority)

```
effective host profile ──► trusted bot logins ──► marker author check
        (file)                (derived)            ([bot] normalised)
                                   │
                          unverifiable ──► fail closed: markers render UNTRUSTED
```

The trusted set is recomputed every projection. It is never stored as an
editable preference — see R3.1.

## Concurrency model

- **One** DB isolate. All store access goes through it.
- **One** global scheduler in the main runtime. `Process.start` is already
  async; per-connection isolates would duplicate parser state and complicate
  cancellation, DB ownership, and rate limiting for no gain.
- Compute isolates only where profiling proves a CPU-bound parse.
- Bounded global subprocess concurrency; no unbounded fan-out on fleet refresh.

## Write path

```
intent ─► write allowlist (per connection)
       ─► auth context resolve  ─► actor ≠ every trusted bot login?  ──no──► HARD FAIL
       ─► adapter (argv)        ─► result URL
       ─► audit_log (durable)   ─► UI shows resolved actor + URL
```

Council configuration writes take a different path — a guarded file
materialisation with base-hash compare, three-way diff on conflict, timestamped
backup, atomic replace, and preserved unknown keys (see `docs/04 §6`).

## Failure posture

| Condition | Behaviour |
|---|---|
| Engine offline | Runtime panel reads *unknown*; boards still render from GitHub |
| gh unauthenticated | Boards degrade to cache with an explicit banner; writes disabled |
| Rate limited | Header-driven backoff to reset; UI shows the reset time |
| Unknown marker schema | Entity flagged unparseable; **never** guessed |
| Doctor not passed | Board rendered but visibly unverified |
| Stale snapshot | Age badge escalates; data is not hidden |
| Connection unreachable | That connection reads *unknown*, never `0`; fleet continues |

⟦AI:FKST⟧
