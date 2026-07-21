# 03 — Frontend spec (UI layer)

Status: **LEGACY SOURCE** — superseded by
[`docs/spec/05-UX-SPEC.md`](spec/05-UX-SPEC.md).
Date: 2026-07-20
Depends on: `docs/05-DATA-CONTRACTS.md` (frozen), `docs/06-DESIGN-LANGUAGE.md`

## 0. Target stack

**Standing decision: Flutter desktop**, inherited from `SPEC-CONSOLE-V2-FLUTTER`
and the existing app skeleton at `FKST/desktop` (`fkst_console`).
See `docs/08` **ADR-012 — flagged for reconfirmation before Stream A starts**,
because the mock-artifacts are HTML and a web/Tauri target is a live
alternative. Everything else in this document is stack-neutral: view inventory,
hierarchy, states, and data needs hold either way.

The mocks are **design artifacts to be ported**, not a codebase to extend.

## 1. Rules

- The UI layer never spawns a process, parses a marker, or knows a schema
  version. It renders view-models from `docs/05` and emits intents.
- Every view renders from fixtures with no live source (R8.3). If a view cannot
  be built against a fixture, the contract is wrong — raise it, don't reach
  around it.
- No view invents a status vocabulary. `MarkerState` and `Stage` are distinct
  and must never be mapped onto each other (see `docs/09`).
- Every panel shows its artifact and snapshot age. This is a component
  (`ProvenanceFooter`), not per-view prose.

## 2. Navigation

Persistent left sidebar, Linear-shaped:

```
[workspace]  FKST ▾                    [＋ new issue]
  Inbox                       n
  All work                            → list / board views
  Council                     n
  ─ Connections ─────────────
    ● fkst-packages          11
    ● devloop-sandbox         3
    ◐ godgpt-sdk              —        (unreachable ⇒ dash, never 0)
  ─────────────────────────
  DRY-RUN · synced 2m ago              (posture + freshness, always visible)
```

- Connections behave like Linear teams: selecting one scopes the work views.
- **All work** scopes across connections; every row/card is repo-qualified.
- View toggle (list ↔ board) and grouping switcher live in the view bar, not
  the sidebar.

## 3. View inventory

| View | Mock | Purpose |
|---|---|---|
| Fleet overview | *(to design)* | per-connection health, counts, posture, last error |
| Work · list | `linear-list.html` | grouped rows by state — the dense default |
| Work · board | `linear-board.html` | kanban by status |
| Work · board (stage) | `linear-board-stage.html` | Design→Build→Review→Ship |
| Work · board (swimlanes) | `linear-board-swimlanes.html` | status × connection |
| Work · board (claims) | `linear-board-claims.html` | grouped by lease holder |
| Drill-in | *(peek in v1 mocks)* | marker timeline, gate, links, composer |
| Council · Personas | `linear-council.html` | define lenses |
| Council · Flows | `linear-council.html` | define routing |
| Council · Scores | `linear-council.html` | seat performance |
| Debate reader | `linear-council-debate.html` | evidence, speaker filter |
| Runtime | *(to design)* | queues, deliveries, DLQ, verbatim health |
| Doctor | *(to design)* | connection validation report |
| Settings | *(to design)* | connections, auth contexts, write toggle |

Views marked *(to design)* are specified below but have no mock yet; producing
them is part of Stream A.

## 4. Shared components

| Component | Contract | Notes |
|---|---|---|
| `StatusIcon` | `MarkerState` | icon-shape language, `docs/06` §4 — never hue alone |
| `StageChip` | `Stage` | visually distinct from `StatusIcon` |
| `ClaimAvatar` | `Claim` | initials; dashed = unclaimed; amber ring = human; tooltip carries mode + age or *unknown* |
| `CommentCount` | `Int` + `DebateHeat` | bubble + count; escalates when contested; click → debate |
| `LabelChip` | `Label` | hint styling; drift marker when `labelDrift` |
| `PostureChip` | `Posture` | always reads "configured next-launch" |
| `ProvenanceFooter` | `asOf` + `source` | mandatory on every panel |
| `SnapshotAgeBadge` | `Instant` | escalates with age |
| `PersonaDot` | `Persona` | colour token + initials, three sizes |
| `VerdictBadge` | `Verdict` | approve/reject/concern/veto/waiting |
| `DegradedState` | typed reason | one component for all of R7.5 |
| `UnknownValue` | — | renders *unknown*; **the only** way to render an absent number |

`UnknownValue` exists so no engineer can accidentally render `0` for absent
data (R7.4). Reviews should reject any raw `0` fallback.

## 5. Work views — spec

### 5.1 List
Rows grouped by `MarkerState`, group header = icon + name + count + `＋`.
Row: `StatusIcon` · id · title (ellipsis) · flex · `LabelChip`s · linked-PR ref
· `CommentCount` · age · `ClaimAvatar`. Row height per `docs/06`. Terminal
groups render collapsed by default.

### 5.2 Board (all groupings)
Column header = grouping icon + name + count + column actions. Cards per
`docs/06` §6 — **multi-line, never single-line** (ADR-004). Card: top row
(status icon, id, claim avatar), 2-line title, bottom row (labels, comment
count, age). Column trouble rules for Review/Ship on the stage board only.

Groupings share one card component; only the grouping key changes:
`status | stage | connection | claim`.

### 5.3 Drill-in
Marker timeline (versions, current node emphasised) · consensus digest · merge
gate table · dependency blockers · CI rollup · links out · human composer.
Opens as a peek panel where space allows, modal otherwise.

## 6. Council — spec

### 6.1 Personas
Card grid. Card: `PersonaDot` + name + seat toggle, brief, meta tags (model +
effort, seated-at, veto). Retired personas in a separate **Library** section at
reduced emphasis with retirement date and debate count. `＋ New persona` as a
dashed card. Editing opens a form: name, brief, model, effort, seated-at, veto,
colour token.

### 6.2 Flows
Flow selector pills (Default / High-risk / Docs-only / ＋). Selected flow
renders as a vertical stepper. Each step: title + description + edit; seated
`PersonaDot`s with `＋`; rules grid (agreement, budgets, stall); **branches
block** listing agree / disagree / exhausted with destinations.
The merge-gate step renders `isMachineGate` with **no seat affordances** and a
note that its checks are machine facts (R4.2.4).

### 6.3 Scores
Table: persona · spoke · objected · upheld% · changed-mind · caught-alone ·
trend sparkline. Retired personas in a second table below. `upheldRate == null`
renders as `—`, never `0%`. Each row links to filtered debates.
A short interpretation line beneath each table is **allowed and encouraged**,
but must be visibly editorial, not presented as a derived metric.

### 6.4 Debate reader
Left: debates by heat. Centre: speaker filter chips + threaded rounds. Right:
where-each-voice-stands tally, volume bar, convergence trace.
The speaker filter is **multi-select**, updates counts live, hides emptied round
headers, and states what is being shown. Human messages are visually
distinguished. Position changes carry a `changedFrom` marker.

## 7. Runtime, Doctor, Settings

**Runtime:** queue table, delivery counters, DLQ, `healthLine` rendered
verbatim in a monospace block with no parsing. Codex activity panel is
**absent** unless a current-runtime pointer resolves (R7.2).

**Doctor:** check list with pass/warn/fail/detail; a connection that has not
passed shows an "unverified" ribbon on its boards.

**Settings:** connections CRUD, auth-context selection (non-secret id +
resolved actor display), global write toggle (default off), per-connection
write allowlist, cache purge, diagnostics export.

## 8. Write affordances

Composer shows the resolved actor inline (`as <login> ✓ human`) and disables
itself when the guard fails, with the typed reason. Create-issue is a modal:
repo (allowlisted only), title, body, apply-opt-in-label checkbox. After a
write, the resulting URL is shown and linked. **No merge, approve, close, or
state-label control exists anywhere in the UI** (R6.4) — not disabled, absent.

## 9. States

Every view specifies all six: **loading** (skeleton, never a spinner over stale
data), **empty** (distinguish "nothing matches filter" from "nothing exists"),
**stale** (age badge escalation; data stays visible), **degraded** (typed
`DegradedState`), **unverified** (doctor not passed), **fixture** (visible
"recorded data" marker).

Design judging and operator trust both live here — a polished happy path with
unhandled empties reads as a demo.

## 10. Interaction

Keyboard: `⌘K` command palette, `g` then view key for navigation, `/` search,
`j/k` row movement, `Enter` drill-in, `Esc` close. Full keyboard reachability
is a requirement (R8.2), not a nicety.
Transitions ≤120ms on colour/background only. No transform bounce. Respect
`prefers-reduced-motion`.

⟦AI:FKST⟧
