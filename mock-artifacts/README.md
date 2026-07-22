# fkst-devbored — design variants

**Start at `index.html`** — a catalog of every view with a description of what
each one is for.

> **Council is a configurator (2026-07-20, user call):** Council does not just
> *read* debates — it **sets the personas for each loop and the flows a piece of
> work moves through**, and **scores personas** (including retired ones) on
> whether they earn their seat. `linear-council.html` = Personas / Flows /
> Scores (working tabs). The debate reader moved to
> `linear-council-debate.html` and is now framed as *the evidence behind the
> scores*.


> **Council + debate legibility (2026-07-20, user call):** "Responsibility" is
> renamed **Council** everywhere — these are seats that deliberate, not a
> permissions matrix. Every card and row now carries a **comment count**
> (gold when the thread is hot, ≥14), because comment volume is the honest
> signal of how contested a decision was. **`linear-council.html`** is the new
> debate reader: pick a voice (teleology · parsimony · fidelity ·
> natural-ownership · proportional-containment · security · meta-judge ·
> human) and read only what it said, across rounds — the speaker filter is
> live JS, not a mockup. Right rail shows where each voice stands, debate
> volume per voice, and the convergence trace (including seats that *changed
> position* after the meta-judge narrowed the question). The slim single-line
> stage cards were rejected — they read as pills; the stage board now uses
> full cards.
>
> **Direction change (2026-07-20, user call):** the FKST UI conventions
> (DESIGN.md layout/type/eyebrow language) are **abandoned for this product** —
> keep only the **oklch color tokens and the K-node logo**. The current drafts
> are faithful Linear clones: **`linear-list.html`** (Inter 13px, icon status
> language — dashed/open/pie/check circles, tight 37px rows, Filter/Display
> bar, quiet sidebar with connections-as-teams) and **`linear-board.html`**
> (same shell, Linear board columns + small cards; the two link to each other
> via the list/board toggle). The three variants below are the superseded
> first round — kept for history only.

Three Linear-inspired design directions for the devloop board ("simple, no BS,
just view + basic GH access to your substrate"). Grounded in the **locked**
design system (`fe-blueprint/DESIGN.md` v2) and the v2 Flutter spec
(`SPEC-CONSOLE-V2-FLUTTER.md`, R3/R5/R6/R7).

All three share the locked, non-negotiable layer — tokens computed from the
**oklch** values (never the ≈hex), Space Grotesk / IBM Plex Sans / IBM Plex
Mono, one amber accent (brand only, never status), hairline dividers, no
glows/gradients/emoji/rainbow states, honesty footers (`as of <n> ago`,
unreachable = *unknown* never 0), discreet DRY-RUN/LIVE posture chip, the v2
K-node wordmark, amber `:focus-visible`. **The variants differ in structure,
not in language.**

Open each file in a browser. 1440px-capped, dark only.

## V1 — Tracker (`variant-1-tracker.html`)
Linear's list-first philosophy: a left rail (views + connections), a dense
**grouped list by raw marker state** (reviewing / merge-ready / implementing /
ready / thinking / dependency-wait / merged), and a right **peek panel** with
the marker timeline, merge gate, and comment composer. Highest information
density per scroll; the board is a list, claims are a column, drill-in never
leaves the screen. Best when you treat the loop like an inbox you triage.
- Maps to: R5.1 (raw-state granularity), R5.3 claims column, R6 comment-in-peek,
  R3.2 connections in-rail with counts.

## V2 — Board (`variant-2-board.html`)
The DESIGN.md §6 Overview shape as the whole product: **stage kanban**
(Design · Build · Review · Ship as the four columns, Intake/Merged as slim
end-caps, per the goal-stage contract — stage is `state:v1`-derived), with a
`Stages / Raw states` toggle, **connection tabs** across the top, and cards
per the locked board spec (subtle `--raise` card, mono id + state badge,
2-line title, claim avatar + age). The most spatial/visual variant; the modal
(not shown) carries drill-in per DESIGN.md §7.
- Maps to: R5.1 (stage lanes + column trouble-rules), R3.2 fleet-as-tabs,
  memory rule "stage vs status — two vocabularies, don't map one onto the
  other" (the toggle keeps both honest).

## V3 — Ledger (`variant-3-ledger.html`)
The "no BS" extreme: **no cards at all**. A permanent split — left, a
mono-forward **transition ledger** (every open entity as one line: time · id ·
state · title · claimant · age, sorted by last transition, terminal drawer
below); right, an always-open detail pane (timeline, merge gate, composer).
Closest to a TUI; zero chrome, everything is text + hairlines. Best when the
operator watches transitions, not columns.
- Maps to: R5.4 drill-in as a permanent pane, R5.2 marker-honesty rendered
  literally ("rows are trusted state:v1 transitions"), R7.5 unknown-state
  honesty in the ledger footer.

## Shared demo data
Same dataset in all three (so they compare fairly): fkst-packages +
devloop-sandbox + an unreachable godgpt-sdk connection; issues #2441/#2453/
#2460/#2437/#2466/#2412, PRs #2444/#2439/#2431/#2418; claims split between
`integration-ElonSG`, `integration-mac-mini`, and unclaimed; DRY-RUN posture;
HEALTHY verdict; 2m-old snapshot.

## Decision axes (what actually differs)
| axis | V1 Tracker | V2 Board | V3 Ledger |
|---|---|---|---|
| primary structure | grouped list | stage kanban | transition ledger |
| state vocabulary | raw marker states | stages (+ raw toggle) | raw states, time-sorted |
| drill-in | peek panel | modal | permanent pane |
| fleet | rail section | tabs | top chips |
| density | high | medium | maximum |
| feels like | Linear list | Linear board | tig/k9s with taste |

Next step: pick one (or a hybrid — e.g. V2's board with V1's peek panel is a
natural pair) and port it into the Flutter theme (`FKST/desktop` app) per
SPEC-CONSOLE-V2-FLUTTER.md R1.5 — tokens from oklch, same hierarchy contract.

⟦AI:FKST⟧
