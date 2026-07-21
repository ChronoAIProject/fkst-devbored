# FKST Devbored — project writeup

> Devpost-ready description. Repo: <https://github.com/ChronoAIProject/fkst-devbored>

## Inspiration

The loop is all the rage — engineers at Anthropic and OpenAI now describe
their day job as building the loop that builds the code. OpenAI's **Symphony**
and the harness-engineering conversation crystallized the idea for us: the
interesting problems live in the *harness* around the loop, not the model
inside it. A loop that runs 24/7 without staying aligned to your judgment
isn't autonomy — it's loop vibing. We wanted the smallest honest tool that
lets a developer run Codex in a loop **and still trust what they're looking
at**.

## What it does

FKST Devbored is a **lean harness for Codex dev loops** with a no-build HTML
console over it:

- **Board** — the loop's work, grouped by *signal authority*: trusted marker
  facts vs. label hints, never conflated.
- **Evidence chain** — every state transition as its actual carrier: three
  `state:v1` markers, a separate `result:v1` decision, a merge **label**
  rendered as a hint. Markers = fact, labels = hints, unknown ≠ zero.
- **Who decided** — the recorded five-seat consensus with each seat's real
  argument prose.
- **Council sandbox** — author a review team against the real council
  contract: every dropdown and bound comes from the contract file, invalid
  definitions can't export, decisions preview under the real agreement
  reducer.
- **Contract self-check** — 55 human-readable cases run in the browser and
  headless (`node demo/tools/selfcheck.mjs`).
- **Engine snapshot** — a loopback, read-only view of the substrate delivery
  ledger that renders *offline* and *unknown* honestly instead of fake zeros.

Three design choices keep it approachable: lean editable architecture,
**GitHub as the durable layer** (issues/comments/labels hold business state,
auditable by any human), and a **light HTML front end** with no build step —
clone, two commands, running in under a minute.

## How we built it

**With the kind of loop the product visualizes.** Codex implemented
everything: 52 sessions on final-assembly day (25 headless `codex exec`
build/review streams), each with a written spec, exclusive file ownership,
and a hard test gate — recorded model `gpt-5.6-sol`. A PM froze interfaces
between streams so they could run in parallel; independent reviews verified
actual files with hostile probes (attacker-comment injection, forged states,
contract mutations) before anything was accepted; a human held the gates.
Codex also reviewed adversarially: it RETURNed our first scope dossier with 8
blocking fixes and found 5 latent semantic faults at round-close — all fixed
and re-verified. Even the repo's **name** came from a recorded 6-seat council
deliberation reduced with the repo's own validator (FKST-devbored won 5/6).

## Challenges we ran into

Honesty is harder than features. The recurring bug class wasn't crashes — it
was **quiet overclaims**: a board column promoting a label hint to a fact, a
"live" badge on an offline database read, truncated arrays rendered as exact
totals, a marker parser that accepted decisions as lifecycle states, a CAS
comparator that disagreed with the engine's on version equivalence. Each was
invisible on the happy-path fixture and wrong under other data. The fix was
process: adversarial review lenses, hostile fixtures asserting exact failure
codes, and a 51-case parity corpus derived from the engine's own tests.

## Accomplishments we're proud of

- A demo where **every claim on screen is auditable** — and a build trail to
  match: every stream's session ID is published in
  [`docs/SUBMISSION.md`](SUBMISSION.md).
- A contract validator whose self-check reads like English ("A Council
  definition with no reviewer seats is rejected") — 55/55 green, in-browser
  and headless.
- A faithful browser port of the engine's transition-version comparator,
  proven against engine-written ordering keys.
- Cold-clone to running console in under a minute, no build step.

## What we learned

Harness engineering is about making the loop work **the way you want** —
splitting work into small durable issues beats big contexts, and durable
evidence is what lets a human check an agent's judgment and reformulate the
loop when they disagree. Multi-session builds with frozen seams parallelize
beautifully — and leave seams a cold-eyes review must catch.

## What's next

Live read-only GitHub business reads behind the local BFF (trust-gated,
truncation-honest), then launch-snapshot Workflow/Council configuration —
councils authored in the sandbox, applied only at loop launch with explicit
acceptance receipts. Remote writes stay behind explicit human authorization
at every step. `fkst-substrate` — the provider-independent engine under it
all — is public and forkable.

## Built with

`codex` (gpt-5.6-sol) · `fkst-substrate` (Rust engine) · vanilla HTML/CSS/JS
(no build) · Node (loopback BFF + headless checks) · GitHub as the durable
state layer
