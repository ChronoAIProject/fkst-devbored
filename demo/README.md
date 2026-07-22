# FKST Console — Recorded Demo (fixture mode)

Board, evidence, debate, Council sandbox, and self-test render recorded
fixtures. Engine is an optional read-only local substrate snapshot reader
(live or offline). No live GitHub/devloop business reads, no engine controls,
no configuration activation, no remote writes.

The recorded surfaces use captured evidence from the public sandbox repository
`ChronoAIProject/fkst-packages-testing`. They make no runtime network requests
and use no external fonts or CDNs; fixture screens carry the banner *Recorded
demo data — fixture mode, no live engine.*

`runtime.html` plus the optional local BFF (`local-bff/`) can show the local
substrate engine's current delivery-ledger snapshot (read-only, loopback-only,
with offline and unknown states rendered explicitly — see
`local-bff/README.md`). It neither reads GitHub business state nor writes or
controls the engine.

## Run

```bash
npx serve demo          # or: python3 -m http.server -d demo 8080
# open http://localhost:3000 (or :8080) → index.html
```

No install, no build step, no external font/CDN requests (fonts vendored).

## The E2E flow (demo script, ~5 beats)

1. **Board** (`board.html`) — the dev-loop's recorded work: issues #92, #98,
   #100, and #106 grouped by loop stage, plus **#111** completed.
2. Click **#111 → Evidence detail** (`evidence.html`) — the exact captured
   carriers: three `state:v1` markers (`thinking → ready → implementing`), a
   separate `result:v1` decision=approve, and the `fkst-dev:merged` **label**
   shown as a hint-chip. Provenance rule on screen: **markers = fact, labels
   = hints.**
3. **Who decided** (`debate.html`) — the recorded consensus: 5 verdicts
   (teleology · parsimony · fidelity · natural-ownership ·
   proportional-containment), all approve, real prose. Rendered as *history*
   from the reference deployment.
4. **Council sandbox** (`council.html`) — author a new CouncilDefinition
   against the app's real integrated contract: every dropdown/bound comes from
   `fixtures/contract/council-v1.contract.json` (commit `b71e6ac`). Live
   validation; local JSON export. Decision preview is a **limited preview**
   (agreement reduction only). Activates nothing.
5. **Self-test** (`selftest.html`) — the JS validator run against the
   contract's own corpus on screen: 26 declarative fixtures + 14 definition
   cases + 15 round cases. Headless equivalent:
   `node demo/tools/selfcheck.mjs`.

## Honest claims (read this)

- The five fixture-backed surfaces are a recorded demonstration, not a claim of
  live GitHub/devloop connectivity.
- Engine is an optional read-only local substrate snapshot reader, not a
  control plane or a business-state authority.
- There are no live GitHub/devloop business reads, engine controls,
  configuration activation, or remote writes.
- The sandbox **authors** definitions; nothing is applied to any running loop.
- No digest/canonical-byte parity is claimed (the contract defers digests to
  R-010).
- The #111 lenses are reference-deployment history; the app contract defines
  its own `seatLens` vocabulary — the demo renders both, labeled, and never
  conflates them.
- Fixtures sanitized: contributor identity aliased to `devloop-bot`, local
  paths redacted, public repo path kept, marker ordering bytes untouched.
- Unreachable/unknown is rendered as *unknown*, never zero.

## Provenance

Fixtures were captured 2026-07-20 from public sandbox issues
[#92](https://github.com/ChronoAIProject/fkst-packages-testing/issues/92),
[#98](https://github.com/ChronoAIProject/fkst-packages-testing/issues/98),
[#100](https://github.com/ChronoAIProject/fkst-packages-testing/issues/100),
[#106](https://github.com/ChronoAIProject/fkst-packages-testing/issues/106),
and [#111](https://github.com/ChronoAIProject/fkst-packages-testing/issues/111).
These links document fixture provenance; the demo does not fetch them at
runtime. Contract files were copied byte-exact from `fkst-devbored` candidate
commit `b71e6ac` (`AP-02 Workflow/Council kernel`, `CANDIDATE_INTEGRATED`).
