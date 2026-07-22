# P3 — Council

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md) Step 6.

**Entry:** G2 closed. **Exit gate: G3.**

**This phase is split by the P0A-01 outcome.** P3a (read-only) ships
regardless — it observes what the loop actually did, which the markers already
support. P3b (authoring) ships **only if** a platform config seam exists.

> Verified 2026-07-20: `default_angles` is a hardcoded local
> (`consensus/core.lua:9`), `max_angles = 4`, and no angle/seat/persona/roster
> env knob exists. The only seam is `proposal.angles`, set per-proposal by the
> raising package. **Authoring is blocked until P0A-01 changes this.**

---

## P3a — Council read-only *(unconditional)*

### P3a-F-01 — Voice roster from evidence · M
Render the seats that actually ran, derived from markers via C's `VoiceKey`
mapping — not from a console-authored roster.
**Done:** the roster shown matches the seats present in real debates; a seat
never seen is not displayed as configured.

### P3a-F-02 — Flow observation · L
Render the flow the loop **actually followed** for a piece of work: steps
reached, agreement outcomes, converge rounds, veto events, terminal reason.
**Done:** the rendered flow is reconstructed from markers; no step is displayed
that cannot be evidenced.
*Note: this is observation, not configuration. Labelling it "the configured
flow" would be a lie until P0A-01 lands.*

### P3a-F-03 — Debate reader · L
Rounds, messages, verdicts, speaker filter (multi-select, live counts, empty
round headers hidden), human messages distinguished, `changedFrom` markers,
convergence trace.
**Done:** filtering by any voice subset is correct against the fixture corpus;
unsupported fields are absent rather than inferred.

### P3a-F-04 — Observable scores · M · *scope set by P0A-03*
Only mechanically derivable counters: debates seated, spoke, objected, changed
position, caught alone. **`objectionsUpheld` / `upheldRate` / `trend` ship only
if P0A-03 proved a structured disposition link.**
**Done:** every displayed figure traces to a marker; `upheldRate` renders `—`
(never `0%`) when undefined. No LLM grader exists anywhere in the path.

### P3a-F-05 — Scores → debates linkage · S
Each score row opens the debates behind it.
**Done:** a score is never presented without a path to its evidence.

---

## P3b — Council authoring *(conditional on P0A-01)*

**Do not start any task below until P0A-01 has landed a real loader.**

### P3b-K-01 — Upstream config seam · XL *(stream K, in `fkst-packages`)*
Host-owned config format, loader, schema + version, validation, restart
behaviour, conformance tests, historical identity preservation.
**Done:** a real supervise run seats personas from host-owned config; upstream
tests cover it.

### P3b-H-01 — Council domain model · M
Single owner for persona/roster/flow schema, validation, IDs, and active-vs-
staged state. **F consumes this; it does not define its own.**
*Why: F and H were falsely parallel — both would have owned Council schema.*
**Done:** one domain module; no duplicate type in the UI layer.

### P3b-H-02 — Flow validation · M
Referential integrity, reachability, loop detection, default uniqueness,
routing precedence, branch coverage (agree/disagree/exhausted), no seats on
machine gates.
**Done:** an invalid flow cannot be saved; each rule has a failing test case.

### P3b-H-03 — Restricted profile grammar · M
Parser/renderer for the managed-key subset. Duplicate keys, `export`,
interpolation, or command substitution on a managed key ⇒ **fail closed**.
**Done:** property tests prove unknown bytes round-trip **exactly**.

### P3b-H-04 — Guarded materialisation · L
Base-hash CAS, per-key conflict detection, three-way diff, symlink rejection,
owner/mode preservation, timestamped backup, write → fsync → rename →
fsync-dir, pre/post hash audit.
**Done:** a crash injected at every filesystem step leaves either the complete
old file or the complete new one — never a partial. Concurrent external edits
cannot be overwritten silently.

### P3b-H-05 — Round-trip proof · M
A restarted supervise consumes the applied config and seats the configured
personas.
**Done:** end-to-end evidence — the console's write demonstrably changed the
loop's behaviour. **Without this, H has shipped dead configuration.**

### P3b-F-06 — Authoring UI · L
Persona editor, roster management, flow editor with the branch model, staged-vs-
applied tri-state, "applies on next supervise start" surfaced honestly.
**Done:** the UI can never present a draft as active; the runtime state reads
*unknown* by construction.

---

## G3 exit checklist

**Unconditional:**
- [ ] Council renders real seats, real verdicts, real flow-as-followed
- [ ] Debate reader with working speaker filter over live data
- [ ] Scores show only derivable figures; undefined renders `—`
- [ ] No LLM grader anywhere in the scoring path
- [ ] Every displayed Council fact traces to a marker

**If P3b ran:**
- [ ] Upstream loader merged and covered by platform tests
- [ ] Crash-injection proves atomic materialisation
- [ ] Restarted supervise provably consumes the written config
- [ ] Draft/applied/runtime-unknown tri-state honest in the UI

- [ ] Advisor review passed

⟦AI:FKST⟧
