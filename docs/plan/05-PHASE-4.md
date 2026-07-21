# P4 — Writes

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md) Step 7.

**Entry:** G3 closed, plus B + C trust derivation + D1 + D3 + I1.
**Exit gate: G4.**

Sol's finding: G originally depended on "B and D". It actually needs auth
contexts (I1), trusted-bot derivation (C), shared rate state (D3), and durable
audit semantics (D1). Writes ship **after** the shared-budget load test, not
before.

---

## Stream G — Write pipeline

### P4-G-01 — Identity guard · M · *the load-bearing control*
Resolve the actor for the selected auth context; reject if it matches any
trusted bot login after `[bot]` normalisation. **No override path exists.**
Re-verify before every write session, not once at startup.
**Done:** a bot actor hard-fails; an expired credential fails with a distinct
typed error; the resolved actor is displayed at every write control.

### P4-G-02 — Allowlist + global toggle · S
Per-connection write allowlist; global writes-off default; writes disabled
entirely in fixture mode.
**Done:** a non-allowlisted repo cannot be targeted from any path; fixture mode
has no write affordance at all.

### P4-G-03 — Create issue · M
Repo (allowlisted only), title, body, optional opt-in label applied in the same
operation.
**Done:** the resulting URL is returned, displayed, and audited.

### P4-G-04 — Comment · M
Human comment on an issue or PR from drill-in and from the debate reader.
**Done:** the comment appears as the human actor, never the bot; it is visually
distinguished in the debate thread on the next poll.

### P4-G-05 — Ambiguous outcome handling · L · *the task most likely to be skipped*
A timed-out request may have succeeded remotely. Pending audit rows,
`outcomeUnknown`, reconciliation by returned or request fingerprint where
possible, and a user-confirmed retry path that **cannot blind-duplicate**.
**Done:** an injected timeout after a successful remote write is reconciled on
the next poll, not duplicated. A retry always requires confirmation when the
outcome is unknown.

### P4-G-06 — Audit · M
Durable row per write: intent, actor, auth context, result, URL, timestamp,
outcome state.
**Done:** an audit write failure **after** a successful side effect is itself
recorded and surfaced — the operator is never told a write vanished.

### P4-G-07 — Write composers (UI) · M
Composer with inline resolved actor, typed guard failures, create-issue modal.
**Done:** guard failure disables the control with the specific reason; no
merge, approve, close, or state-label control exists anywhere (R6.4) — absent,
not disabled.

---

## Stream H — Config apply *(only if P3b ran)*

### P4-H-06 — Config apply pipeline · M
`ConfigApplyIntent` separate from GitHub writes, with its own error set and
audit outcome (P0C-10).
**Done:** a config apply never shares a code path or error type with a GitHub
write.

---

## Failure-path test matrix *(G4 evidence)*

Every row is a required test, not a nice-to-have:

| Condition | Expected |
|---|---|
| Actor is a trusted bot | hard fail, no override offered |
| Credential expired mid-session | typed auth error; guard re-runs |
| Repo not allowlisted | control absent, not just disabled |
| Global writes off | no write path reachable |
| Rate limited during a write | typed error with real reset time |
| Request times out, remote succeeded | reconciled, not duplicated |
| Request times out, remote failed | safe retry offered |
| Audit write fails after side effect | recorded and surfaced |
| Two writes race on one entity | second sees fresh state; no lost update |
| Fixture mode | zero write affordances |

---

## G4 exit checklist

- [ ] Every row of the failure-path matrix has a passing test
- [ ] Identity guard has no override path — verified by code review
- [ ] Ambiguous-outcome reconciliation proven with injected timeouts
- [ ] Audit is durable and survives an app kill mid-write
- [ ] **5-connection shared-budget load test passed** *(moved before writes
      ship, per advisory)*
- [ ] No merge/approve/close/state-label control exists anywhere
- [ ] Advisor review passed

⟦AI:FKST⟧
