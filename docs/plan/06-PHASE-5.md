# P5 — Fleet & release candidate

> **Historical phase.** Use
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md) Steps 8–10.

**Entry:** G4 closed. **Exit gate: G5.**

---

## Stream I2 — Fleet

### P5-I2-01 — Fleet overview · M
Per-connection health verdict, counts by state, DLQ, posture, last success,
last error, partial-failure status.
**Done:** one unreachable connection degrades only its own row; the fleet keeps
rendering. Unreachable reads *unknown*, never `0`.

### P5-I2-02 — Fleet controls · M
Pause/resume, manual refresh, search/filter, pagination, cache purge.
**Done:** a paused connection is skipped entirely by the scheduler; purge drops
`cache_*` without touching `audit_log` or `staged_*`.

### P5-I2-03 — Cross-connection views · M
All-work list and claims grouping across connections, every row repo-qualified.
**Done:** two same-numbered issues in different repos never collide anywhere —
cache, keys, notifications, audit.

### P5-I2-04 — Version compatibility matrix · S
Surface platform/binary/schema versions per connection and flag incompatibility.
**Done:** a connection on an unsupported schema is visibly unverified.

---

## Notifications

### P5-N-01 — Notification pipeline · M
Fire only from fresh successful polls; suppress cold-start baseline and fixture
mode; persist a projection-versioned last-notified identity; invalidate safely
when trust config changes.
**Done:** a cache replay, a cold start, and a parser migration each produce
zero false notifications.

---

## Hardening

### P5-X-01 — Accessibility pass · L
WCAG AA contrast throughout; status never hue-alone; full keyboard reachability;
visible focus everywhere; reduced-motion respected.
**Done:** keyboard-only operation of every flow; an automated contrast check
passes; a screen-reader pass on the primary views.

### P5-X-02 — Redaction & diagnostics · M
`DoctorCheck.detail`, adapter command descriptions, paths, repo names, actors,
and errors can leak even without raw stderr. Typed redacted export.
**Done:** a diagnostics bundle from a real deployment passes a secret scan and
contains no private repo names or absolute user paths.

### P5-X-03 — Performance · M
Cache-first paint <1s on a 5-connection fleet; subprocess cap respected under
full refresh; virtualised lists stay smooth at 1000 entities.
**Done:** measured on the reference machine and recorded.

### P5-X-04 — Fixture demo mode · M
Every view renderable from the corpus with a visible "recorded data" banner and
all writes disabled.
**Done:** the app runs end-to-end with no engine, no gh, and no network.

### P5-X-05 — Doc/reality reconciliation · M
Walk `docs/01`–`docs/09` against the built product; amend every drift; append
ADRs for decisions taken during implementation.
**Done:** no doc statement is false. **This is a release blocker, not
housekeeping** — a spec that lies is worse than no spec.

### P5-X-06 — Release · M
Installer, upgrade path over an existing install, uninstall, crash-reporting
posture, signing credential ownership documented.
**Done:** a clean-machine install and an in-place upgrade both verified.

---

## G5 exit checklist

- [ ] 5-connection fleet operates without starvation or budget violation
- [ ] Accessibility pass complete
- [ ] Diagnostics export passes a secret scan
- [ ] Demo mode runs with no external dependency
- [ ] Docs reconciled — no false statement remains
- [ ] Clean install and in-place upgrade verified
- [ ] Advisor review passed

---

## Explicitly not scheduled

Recorded so they are not reintroduced as "small additions":

- Topology / DAG panel — gated on the upstream `graph_json()` invocation spike
- Self-host mode (console managed by its own devloop)
- Mobile or web deployment
- Staged R6.5 mutations (milestone, close-own, priority labels)
- **Any engine control surface** — permanently out of scope (ADR-016)

⟦AI:FKST⟧
