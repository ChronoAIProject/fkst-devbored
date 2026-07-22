# P0 — Reality & contract freeze

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md) Step 0.

**Exit gate: G0.** No product code until this phase closes. Spike code is
disposable and expected.

Task ID: `P0A-nn` reality spikes · `P0B-nn` fixtures · `P0C-nn` contracts.
Size: S ≤1d · M ≤3d · L ≤1w · XL >1w.

---

## P0A — Reality spikes

These answer "does this seam exist?" Every one of them can invalidate a spec.

### P0A-01 — Council config seam (upstream) · XL · **blocks Council authoring**
Determine whether a host-owned roster/flow configuration can be read by a real
supervise run and used to seat personas.
Known today: `default_angles` is a hardcoded local; `max_angles = 4`; no env
knob exists; the only seam is `proposal.angles` set by the raising package.
Work: specify the host-owned config format; identify the loader (new env knob
vs config file vs raiser change); write the upstream proposal in `fkst-packages`;
get a decision.
**Done:** either (a) a real supervise run seats personas from a host-owned
config — Council authoring is unblocked; or (b) a recorded decision that it will
not exist in this timeframe — Council ships read-only and `docs/01` R4.1/R4.2
are amended.
**Owner:** K + PM. **Do not start H or Council authoring tasks until this lands.**

### P0A-02 — Marker schema inventory · L
Enumerate the real marker schemas, their fields, version-ordering rules, and
which fields the debate model actually needs (`changedFrom`, narrowed question,
per-seat verdicts, permalinks).
**Done:** a table of every marker schema → fields → whether the spec's debate
model is derivable. Unsupported fields are marked for nulling or removal.

### P0A-03 — Scoring derivability · M
Determine whether "objection upheld" is mechanically derivable — do markers
link an objection to a disposition (patch, file, check, explicit outcome)?
**Done:** either structured evidence exists and the derivation is specified, or
`objectionsUpheld` / `upheldRate` / `trend` are **cut from v1**. Introducing an
LLM grader is not an acceptable outcome.

### P0A-04 — Process-tree termination · M · **architecture-invalidating**
Prove a spawned `run.sh`'s descendants are reaped on timeout, cancellation, and
app exit — from a **signed, Finder-launched** app (restricted `PATH`).
**Done:** no orphan processes after each of: deadline kill, user cancel, app
quit, output-cap abort. Method documented.

### P0A-05 — gh rate metadata · M
Ordinary `gh issue/pr` commands do not uniformly expose rate headers. Decide the
mechanism: `gh api --include`, GraphQL `rateLimit`, or other.
**Done:** a named mechanism proven to return remaining budget + reset for every
call class the adapters need. **Blocks D3 design.**

### P0A-06 — Field derivability matrix · L · **the gate itself**
For every observed field in `docs/05`: exact source command or file, trust rule,
behaviour when missing, parser owner, fixture reference.
**Done:** no field is marked "expected to be derivable". Every field is proven,
nulled, or removed. **This matrix is G0.**

### P0A-07 — Stack confirmation · S
Confirm Flutter (ADR-012) or choose otherwise. **Blocks A, B, J.**
**Done:** ADR appended; a hello-world signed build exists.

### P0A-08 — Auth context isolation · M
Test inherited `GH_TOKEN`, multiple `GH_CONFIG_DIR`, Enterprise hosts, actor
change mid-session, expired credentials, two connections sharing one actor.
**Done:** a documented isolation method; the shared-actor case is proven to
share one budget.

---

## P0B — Fixtures

### P0B-01 — Raw capture pipeline · M
Capture raw command output from one real deployment, preserved **separately**
from expected projections, recording platform commit, argv, capture time, and
schema versions.
**Done:** raw and expected are distinct artifacts; a projection change cannot
silently rewrite its own input.

### P0B-02 — Sanitisation · M
Redact tokens, identities, private repo names, paths. **Must not** mutate marker
ordering, hashes, or IDs used by tests. Versioned sanitiser.
**Done:** a secret scan over the corpus is clean; a round-trip proves ordering
and IDs survived.

### P0B-03 — Adversarial corpus · M
Capture or construct: untrusted author, malformed marker, unknown schema
version, out-of-order versions, missing marker, partial/capped comment fetch,
unreachable source, rate-limited response.
**Done:** every degradation path in `docs/02` has a fixture. These are the
cases that will otherwise be discovered in production.

---

## P0C — Contract revision (from advisory findings)

Sol found the contracts would force an early re-freeze. Fix before freezing.

### P0C-01 — Nullable state + expanded parse status · S
`Entity.state` becomes nullable; `parseStatus` expands to `noMarker`,
`untrusted`, `malformed`, `unsupportedSchema`, `partial`, `parsed`.
*Why: a newly-enabled issue has no trustworthy state, and `0`-like defaults
would launder that into a lie.*

### P0C-02 — Add the snapshot/error seam · M
Add `DataState<T>`, `DegradedReason`, `ArtifactProvenance`, `Page<T>`,
`RateBudget`, and connection/fleet snapshot types.
*Why: the UI is required to render typed degradation, staleness, partial
failure, pagination, and rate state — none of which the contracts expressed.
Two streams could both "conform" and be incompatible.*

### P0C-03 — Split `RuntimeSnapshot` · S
Separate `ObserveSnapshot` and `HealthSnapshot`; compose in a connection view.
*Why: they are two artifacts with independent age, reachability, and failure;
one `asOf/reachable` cannot represent partial success.*

### P0C-04 — Remove roster authority from the DB · S
Drop `Connection.rosterId` / `Roster.connectionIds` duplication; derive the
active roster from authoritative config; keep only staged selection locally.
*Why: as written, SQLite could decide the active roster — a direct ADR-001
violation.*

### P0C-05 — Normalise Council types · M
Single ownership for seating (`FlowStep.seatedIds`, drop `Persona.seatedAt`);
add stable `FlowStepId`; typed branch conditions/destinations; validate
referential integrity, reachability, loops, default uniqueness, routing
precedence. Depends on P0A-01's outcome.

### P0C-06 — Stable historical voice identity · M
Console-generated `PersonaId` cannot identify seats in historical markers.
Define a platform-derived `VoiceKey` plus a config revision; map persona
metadata onto it **without rewriting historical evidence**.
*Why: without this, retiring or renaming a persona corrupts the debate record.*

### P0C-07 — Council history authority · S
Retired-persona history cannot live only in SQLite (ADR-001). Retain versioned
records in git or authoritative config; the DB may only index them.

### P0C-08 — Narrow R5.3 · S
Lifecycle state comes only from trusted markers; ordinary GitHub metadata
(title, labels, CI, comment count, links) comes from GitHub with **separate
provenance**. Amend `docs/01` R5.3.

### P0C-09 — Nullable comment count + completeness · S
`commentCount` nullable with a completeness status; `DebateHeat` computed only
from a complete, defined population.
*Why: pagination caps and rate limits make `0` ambiguous.*

### P0C-10 — Split write unions · S
Separate `GitHubWriteIntent/Result` from `ConfigApplyIntent/Result`; each with
its own error set and audit outcome. Exempt transient intent bodies from the
no-body rule explicitly, while keeping observed/cache contracts body-free.

### P0C-11 — Discriminated materialisation states · S
Replace the flat tri-state with `Draft`, `Conflict`, `Applied{backupPath,
appliedHash}`; runtime activation is a separate `unknown`.
*Why: a draft cannot already have a backup path.*

### P0C-12 — Serialisation rules · M
Canonical JSON schemas: `Path`, `Url`, `Instant`, `Duration`, UUID, enum casing,
map ordering, unknown-field policy, numeric bounds, version negotiation. Plus
generated round-trip tests.
**Done:** a fixture round-trips byte-identically.

### P0C-13 — Typed provenance · S
Replace free-form `source: String` with typed provenance (artifact kind,
locator, platform revision, capture time, freshness, completeness).

### P0C-14 — Amend requirements to match reality · M
Reconcile `docs/01` R4 with P0A-01/03 outcomes; append ADRs; update
`docs/05` to `contracts/v1` and mark **frozen**.
**Done:** G0 closes.

---

## G0 exit checklist

- [ ] P0A-06 matrix complete — every field proven, nulled, or removed
- [ ] P0A-01 decided — Council authoring unblocked or explicitly deferred
- [ ] P0A-03 decided — scoring derivable or cut (no LLM grader)
- [ ] P0A-04 passed — no orphan processes from a signed build
- [ ] P0A-05 named a rate mechanism
- [ ] P0A-07 stack confirmed
- [ ] Fixture corpus captured, sanitised, adversarial cases present
- [ ] All P0C revisions applied; round-trip tests pass
- [ ] `docs/01` amended where reality differed
- [ ] Advisor review passed
- [ ] `contracts/v1` **frozen**

⟦AI:FKST⟧
