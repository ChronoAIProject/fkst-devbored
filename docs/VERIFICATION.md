# Local release verification

Checkpoint: 2026-07-22, post-08:00 SGT reviewed integration.

This is evidence for the local two-hour recorded UI candidate and the subsequent recovery work integrated with the repository's preserved `main` lineage. Port 4173 is a fixture viewer with no BFF or external connections. The recovery proves populated GitHub acquisition and same-origin API proxy stitching, plus a controlled fake-backed Chrome rendering of the Vite+BFF topology. It does not prove a real-GitHub-backed browser run, full end-to-end integration, deployment, Devpost entry, or eligible submission. Neither Git lineage was force-replaced.

## Reproducible local gates

The settled tree passed:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:fixture
pnpm scrub
git diff --check
```

Test totals at this checkpoint:

- React app: 13/13 across four files;
- loopback BFF: 51/51;
- black-box/integration: 63/63 across 16 suites; and
- aggregate: 127/127.

The black-box total includes seven stitched live-topology cases covering the browser-origin session and issue endpoints, one bounded synthetic GitHub GraphQL read, foreign-Origin rejection before proxy rewrite, session-token enforcement, the fake guarded issue receipt, UI receipt parsing, and rejection of a non-loopback BFF target. Fourteen preflight cases cover configuration, missing/invalid durable state, generic failures, exact signature gating, and secret/path non-disclosure. Six Chrome/CDP cases prove a populated controlled live topology, honest Council/Runtime unavailability, read-only session posture, app-origin API routing, no fixture/external request, screenshot/no-exception evidence, no mutation, and exact profile cleanup. The total also retains explicit propagation of the BFF's default read-only posture into disabled New Work availability and the two earlier browser-lifecycle cases.

Both production and recorded-demo Vite builds transformed 42 modules. The fixture smoke built the demo, served it temporarily on `127.0.0.1:4174`, verified the snapshot schema, HTML mount, and persistent recorded-data disclosure, then stopped it. The merged release-tree scrub examined 258 non-ignored files plus reachable history after current-tree legacy paths and actor examples were sanitized; the original histories remain preserved by the merge.

The 07:44 published recovery checkpoint `562a675750deecf54da747daf0f6242aaaac2754` passed the complete [Ubuntu/Node 22 GitHub Actions verification](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29878085596) with 98 tests. Pinning the already-used `vite-node@2.1.8` as a direct development-only dependency had earlier corrected a Linux-runner reproducibility defect without weakening either probe. Hosted verification of the 127-test merged tree is not complete until GitHub Actions passes for its exact pushed SHA.

Independent read-only reviews reached `UX_FINAL_SOL=PASS` and `SECURITY_FINAL_SOL=PASS`. The security pass was issued only after malformed top-level GitHub entities and malformed/truncated frontend collections were changed to fail closed as partial, unknown, or null and covered by regressions.

The preserved specification graph also passed `node tool/verify_accelerated_plan.mjs`: 211 requirements map once to 35 packages and 40 acyclic graph nodes, with exactly `fkst-substrate` and public devloop as primary dependencies, Workflow/Council as app authority, and R-059 intentionally outside the RUN family. Because the public legacy lineage is a squashed snapshot, the verifier explicitly reports use of pinned public-snapshot blobs; it cryptographically verifies current path-redacted evidence differs from the original blobs only by the recorded developer-home literal replacement. The legacy static Council self-check passed 26/26 declarative cases, 14/14 definition cases, and 15/15 round cases; marker transition parity passed 51/51 assertions.

The preserved `contracts/` Dart harness is not part of the React/BFF release gate. Its default tests require the external devbored fixture corpus and failed closed with `PathNotFoundException` when that corpus was absent; no Dart code is used by `pnpm demo`, `pnpm dev`, or `pnpm check`.

## External-path reality checks

An authenticated, read-only local BFF launch queried `ChronoAIProject/fkst-packages-testing` through the fixed `gh api graphql` adapter with writes disabled. Acquisition succeeded and truthfully returned zero current open issues and zero current open pull requests; marker counts were consequently zero and complete for that current open set. The launch did not include `--enable-writes`, no issue POST was sent, and no real GitHub mutation has been performed during implementation or verification.

At 07:29 SGT on 2026-07-22, a second authenticated read-only launch queried `ChronoAIProject/fkst-packages` with trusted marker author `ElonSG`, again without `--enable-writes`. `GET /api/v1/session` reported `posture=read-only` and writes unavailable. The snapshot contained five current open issues and one current open pull request; marker filtering was available and complete, with 18 comments ignored as untrusted. Vite's same-origin `/api/v1/snapshot` proxy returned the same populated counts. Council reported `council_source_not_configured`; Runtime reported `observe_not_configured`; health reported `health_not_configured`. These changing repository counts evidence one timestamped read and must not be used as fixed assertions.

Fable's later real `pnpm preflight:live` run reproduced the GitHub 5/1 result, classified the missing substrate database as `UNAVAILABLE`, and classified the public-devloop health probe as `UNKNOWN` after the existing bounded command failed. During main-PM integration, the fake-backed preflight suite passed 6/6, but a fresh real run authenticated the GitHub actor and then returned `github_projection_read_failed`; substrate and health retained the same unavailable/unknown classifications. The failed real attempt is retained as reliability evidence and prevents any claim that the live read is continuously available.

Two earlier attempts to capture a real-GitHub-backed page timed out and supplied no accepted real-live DOM evidence. A later controlled fake-backed Chrome/CDP test successfully captured and validated the browser-rendered local topology. This raises only the controlled-topology contract claim; the real GitHub claim still stops at BFF and app-origin proxy responses.

A local `fkst-framework` release binary was found, but no deployed durable root was available to observe. Missing roots/databases are now specifically `UNAVAILABLE`, invalid path shapes are `FAIL`, inaccessible/unclassified failures remain `UNKNOWN`, and raw stderr plus configured local paths are never projected. No root was initialized and live substrate delivery data therefore remains explicitly unavailable. The recorded fixture demonstrates the contracted runtime presentation without claiming to be live status.

The only positive mutation-path evidence uses a repository-local fake `gh` executable. It proves the fully guarded request reaches exactly one argv-only `gh issue create` operation with `fkst-dev:enabled`; it does not write to GitHub.

## Still external and unverified

The following are required release/submission work, not completed local-code gates:

- a working judge-accessible demo, sandbox, or test build;
- a public YouTube demo under three minutes with audio explaining both Codex and GPT-5.6 use;
- the primary Codex `/feedback` Session ID for the thread containing most core implementation;
- the completed Devpost description, category, and submission URL;
- entrant legal/personal eligibility; and
- a real durable-root substrate observation and a real guarded sandbox issue creation, if those live behaviors are to be claimed in submission materials.

The credential-free local judge path remains `pnpm demo` at `http://127.0.0.1:4173`. The integrated local development path is `pnpm dev`; it defaults to `http://127.0.0.1:5173`, while `FKST_CONSOLE_PORT` and `FKST_CONSOLE_UI_PORT` select non-conflicting loopback ports. Without upstream configuration it must show unavailable/unknown sources rather than fabricated zero values.
