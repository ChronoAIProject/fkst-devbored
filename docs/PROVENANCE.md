# Prior work and dependency provenance

## Build Week work product

The submission-cut work product is the code in this repository: a React/Vite console, a loopback Node/TypeScript BFF, one normalized fixture/live presentation contract, recorded sanitized fixtures, black-box/security tests, and deterministic packaging.

The repository began from Build Week workspace commit `9308b5a018af28049c35517946aaae113e323c20`. The final implementation is preserved by the release commit on `codex/build-week-mvp`; the primary Codex `/feedback` Session ID remains external submission evidence until a successful upload is captured.

## Pre-existing primary integrations

| Integration | Repository | Locally inspected revision | Relationship |
|---|---|---|---|
| `fkst-substrate` | <https://github.com/ChronoAIProject/fkst-substrate> | `e38358a0552c4133414836bf52df6593908fe547` | External local CLI integration for `observe --json`; not vendored. |
| Public devloop | <https://github.com/ChronoAIProject/fkst-packages> | `f6ad297c672c1d9d38c82e0a0ea50c96e2843e0b` | External GitHub-native workflow and opaque health integration; not vendored. |

These projects predate the event. Their runtime, marker contracts, sandbox history, and engine behavior must not be described as newly built console functionality. The console's Apache-2.0 license applies only to this repository and does not relicense either upstream.

## Reference-only prior work

`fkst-devbored` and older `devbored`, `github-devloop*`, consensus, hosted, desktop/Flutter, and proxy materials informed specifications or design discussions but are not primary runtime dependencies of this web cut. The console uses app-owned Workflow and Council concepts without importing the full devbored product.

The historical Flutter scaffold is explicitly excluded. This repository contains no Flutter/Dart application.

## Sandbox evidence and fixture relationship

- <https://github.com/ChronoAIProject/fkst-packages-testing/issues/111> demonstrates the historical issue-side thinking → ready → implementing arc.
- <https://github.com/ChronoAIProject/fkst-packages-testing/pull/77> demonstrates the historical review-result → merge-ready → merged evidence chain.

Those public artifacts validated the contracts. They do not form one console-created end-to-end run, and the README/video must narrate that seam. The committed fixture replaces IDs, actors, repository names, URLs, hashes, run identifiers, and prose. Its schema/state spellings and authority semantics are retained, but its replacement #42/#17 identifiers are not direct links to #111/#77.

## Toolchain dependencies

The pnpm lockfile records JavaScript packages and their exact resolution. React, Vite, TypeScript, Vitest, Node.js, pnpm, GitHub CLI, and browser engines remain under their respective licenses. Their presence is a toolchain/runtime dependency, not a third primary FKST product integration.

Seven Space Grotesk / IBM Plex WOFF2 files are bundled under `app/src/assets/fonts/`. Copyright, reserved-name, upstream-project, and SIL OFL 1.1 notices are retained in [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and [`docs/third-party/SIL-OFL-1.1.txt`](third-party/SIL-OFL-1.1.txt). [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) also records each file's SHA-256, its exact pinned `@fontsource` package version, npm tarball, lockfile integrity, source filename, and the source frontend commit from which the pin was verified.

No prompt, source file, or asset from the upstream repositories is copied into this repository unless separately identified. The recorded fixture contains schema-compatible factual shapes and sanitized example prose, not upstream source code.

## Codex/GPT-5.6 authorship record

Codex with GPT-5.6 Sol was directed to implement and integrate the submission cut. Concrete contributions include contract-to-type translation, fixture and marker projection, BFF/read/write boundary implementation, UI construction, tests, packaging, scrub automation, and judge documentation. The prior condensed-contract review corrected six errors before implementation; that work remains prior-session context.

Required final evidence is still external: the primary Codex session ID returned by a successful `/feedback` upload, visible GPT-5.6 configuration/run metadata, and public video narration. Until supplied, those remain explicit placeholders rather than repository-verified claims.
