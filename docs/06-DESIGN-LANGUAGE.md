# 06 — Design language

Status: **LEGACY DESIGN SOURCE** — visual rationale is retained; full-app UI
authority is [`docs/spec/05-UX-SPEC.md`](spec/05-UX-SPEC.md).
Date: 2026-07-20
Transcribed from the settled mocks in `mock-artifacts/`.

## 0. Position

The old FKST console language (`FKST/fe-blueprint/DESIGN.md`) is **not used for
this product** (ADR-003). Carried over: **the oklch colour tokens** and **the
K-node wordmark**. Everything else follows Linear's conventions.

`fe-blueprint/DESIGN.md` still governs the hosted FE. This exemption is scoped
to fkst-devbored.

## 1. Tokens (oklch — compute from these, never from an approximate hex)

```
--bg        oklch(16% .011 250)   canvas
--raise     oklch(20% .012 250)   cards, sidebar wash, inputs
--raise-2   oklch(23% .013 250)   hover, chips, avatars
--line      oklch(26% .012 250)   hairline dividers (default separator)
--line-2    oklch(33% .013 250)   control outline, stronger border
--fg        oklch(97% .005 240)   primary text
--dim       oklch(72% .014 245)   secondary text
--faint     oklch(58% .014 245)   tertiary, icons
--ghost     oklch(46% .012 245)   quietest — meta, counts, timestamps

--amber     oklch(81% .15 80)     BRAND ONLY — logo node, primary action,
                                  active tab underline, focus ring, human accent
--amber-ink oklch(22% .04 80)     text on amber fills
--green     oklch(74% .13 158)    success · merged · approve · healthy
--red       oklch(67% .18 18)     failure · reject · veto · danger
--gold      oklch(80% .10 85)     pressure · in-review · contested · stale
--blue      oklch(70% .10 250)    in-progress (neutral-leaning work state)
--violet    oklch(70% .10 300)    thinking / converge
--teal      oklch(74% .09 195)    persona identity
--rose      oklch(72% .11 350)    persona identity
```

**Amber is never a status.** Persona colours are identity, not semantics — a
persona's dot colour says *who*, never *how it voted*.

## 2. Type

**Inter** throughout — 400 / 500 / 600 only. Body **13px / 1.45**, letter-
spacing `-0.005em`. Space Grotesk 700 is used **only** for the wordmark.

| Role | Size / weight |
|---|---|
| Row + card title | 13 / 500 |
| Body, lens text | 12.5–13 / 400 |
| Section heading | 12.5 / 600 |
| Sidebar item | 13 / 500 |
| Meta, counts, timestamps | 11–11.5 / 400, tabular-nums |
| Chip / tag | 10.5–11 / 500 |

Numerals that align in a column are always `tabular-nums`. No monospace font
in this product (a departure from the old language) — mono read as "terminal
output" rather than "product".

## 3. Layout

- Sidebar 236px, `color-mix(in oklab, --raise 55%, --bg)`, one hairline right.
- View bar 44px (breadcrumb + actions); filter bar 40px below it.
- **List row 37px.** Board card padding `9px 11px 10px`, radius 8px.
- Board column ~300px, gap 16px, horizontal scroll — never wrap.
- Panels are `--raise` with a `color-mix(--line 80%)` border. Cards are the
  only bordered objects; lists use hairlines between rows instead.
- Radii: 6px controls, 8px cards, 9–10px panels.

## 4. Status icon language (load-bearing)

Status is an **icon shape**, never colour alone (R8.2). Circles at 13–14px:

| State | Shape |
|---|---|
| Thinking / backlog | dashed circle outline |
| Todo / ready | solid circle outline, empty |
| In progress | circle with a **pie wedge** — fill proportion shows progress |
| In review | pie at ~⅔, `--gold` |
| Merge-ready | pie near-full, `--green` |
| Blocked / dependency-wait | circle with two pause bars, `--gold` |
| Merged / done | **filled** circle with a check knocked out in `--bg` |
| Failed / declined | filled circle with a cross knocked out |

The pie metaphor is the whole system: how full the wedge is *is* how far along
the work is. Never substitute a badge for the icon.

## 5. Chips, labels, avatars

- **Label chip:** 19–20px pill, 1px `--line` border, 10.5px/500 `--faint`, with
  a 6px colour dot. Used for hints and derived facts. Colour dot conveys
  category, text carries meaning.
- **Claim avatar:** 16–20px circle, `--raise-2` fill, `--line-2` border,
  initials 7–8.5px/600. Unclaimed = dashed border, en-dash. Human = amber-
  tinted border.
- **Comment count:** speech-bubble outline + count in `--ghost`; escalates to
  `--gold` when contested (`DebateHeat.contested`, threshold ≥14 comments —
  tune with real data).
- **Persona dot:** filled circle in the persona's identity colour, initials in
  `--bg`. Sizes 15 / 22 / 26px.

## 6. Cards — the rule that was learned the hard way

A card is **multi-line and has internal hierarchy**: a top row (status, id,
avatar), a title with room for two lines, and a bottom row (labels, comment
count, age).

**Single-line cards are forbidden** (ADR-004). A rounded box containing one row
of text reads as a pill or tag, not as an object you can open. This was tried on
the stage board and rejected.

## 7. Interaction states

- Hover: neutral brighten to `--raise-2`. **Never** amber.
- Active nav / selected: `--raise` fill, `--fg` text.
- Active tab: `--amber` 2px underline.
- Toggle on: amber track + `--amber-ink` knob.
- Focus: `2px solid --amber`, offset 1px — on **every** interactive element.
- Transitions 120ms, colour/background/border only. No transform bounce.

## 8. Anti-patterns

No glows or shadow halos · no gradients or blobs · no emoji as icons · no
rainbow status palettes · no card-in-a-box for every element · no decorative
KPI tiles · no monospace as UI type · no amber-as-status · no single-line cards
· no rendering `0` for absent data · no animated/looping indicators (they imply
live data on a poll-derived surface).

## 9. Honesty surfaces

Every panel carries a `ProvenanceFooter`: what artifact it projects and how old
it is. Stale escalates visibly. Unreachable reads *unknown*. Fixture mode is
banner-marked. Posture reads "configured next-launch". These are design
elements, not disclaimers to be minimised — an operator trusting a stale board
is the failure this product exists to prevent.

⟦AI:FKST⟧
