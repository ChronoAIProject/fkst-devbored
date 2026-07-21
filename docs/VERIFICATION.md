# Local release verification

Checkpoint: 2026-07-22, before the 07:00 SGT implementation hard stop.

This is evidence for the local two-hour recorded UI candidate and the subsequent read-only live recovery on the isolated [`codex/build-week-mvp`](https://github.com/ChronoAIProject/fkst-devbored/tree/codex/build-week-mvp) branch. Port 4173 is a fixture viewer with no BFF or external connections. The later recovery proves populated GitHub acquisition and same-origin API proxy stitching, not a browser-rendered or full end-to-end integration, deployment, Devpost entry, or eligible submission. The repository's unrelated `main` history was not replaced.

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
- loopback BFF: 36/36;
- black-box/integration: 49/49 across 15 suites; and
- aggregate: 98/98.

The black-box total includes seven stitched live-topology cases covering the browser-origin session and issue endpoints, one bounded synthetic GitHub GraphQL read, foreign-Origin rejection before proxy rewrite, session-token enforcement, the fake guarded issue receipt, UI receipt parsing, and rejection of a non-loopback BFF target. It also includes explicit propagation of the BFF's default read-only posture into disabled New Work availability, plus two browser-lifecycle cases: a synthetic hung subprocess proves bounded exact process-group reaping, while a real complete document proves preserved network telemetry and exact profile cleanup.

Both production and recorded-demo Vite builds transformed 42 modules. The fixture smoke built the demo, served it temporarily on `127.0.0.1:4174`, verified the snapshot schema, HTML mount, and persistent recorded-data disclosure, then stopped it. The final release-tree scrub examined 105 non-ignored files plus current branch history.

The pre-audit published checkpoint `dcf1d2d798e89e39d2295526aabb5061324400d3` passed the complete [Ubuntu/Node 22 GitHub Actions verification](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29874243382); the [branch workflow](https://github.com/ChronoAIProject/fkst-devbored/actions/workflows/verify.yml?query=branch%3Acodex%2Fbuild-week-mvp) is the current hosted result. The first published run exposed an undeclared test-runner assumption: two probes could find transitive `vite-node` on the local macOS installation but not on the Linux runner. Pinning the already-used `vite-node@2.1.8` as a direct development-only dependency corrected reproducibility without changing or weakening either probe; the complete local gate, the [corrected-code workflow](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29874160311), and the subsequent documentation workflow all passed. GitHub attached a non-blocking deprecation annotation because the v4 setup actions target the Node 20 action runtime and are currently forced onto Node 24; the repository commands themselves ran under the workflow's configured Node 22 toolchain.

Independent read-only reviews reached `UX_FINAL_SOL=PASS` and `SECURITY_FINAL_SOL=PASS`. The security pass was issued only after malformed top-level GitHub entities and malformed/truncated frontend collections were changed to fail closed as partial, unknown, or null and covered by regressions.

## External-path reality checks

An authenticated, read-only local BFF launch queried `ChronoAIProject/fkst-packages-testing` through the fixed `gh api graphql` adapter with writes disabled. Acquisition succeeded and truthfully returned zero current open issues and zero current open pull requests; marker counts were consequently zero and complete for that current open set. The launch did not include `--enable-writes`, no issue POST was sent, and no real GitHub mutation has been performed during implementation or verification.

At 07:29 SGT on 2026-07-22, a second authenticated read-only launch queried `ChronoAIProject/fkst-packages` with trusted marker author `ElonSG`, again without `--enable-writes`. `GET /api/v1/session` reported `posture=read-only` and writes unavailable. The snapshot contained five current open issues and one current open pull request; marker filtering was available and complete, with 18 comments ignored as untrusted. Vite's same-origin `/api/v1/snapshot` proxy returned the same populated counts. Council reported `council_source_not_configured`; Runtime reported `observe_not_configured`; health reported `health_not_configured`. These changing repository counts evidence one timestamped read and must not be used as fixed assertions.

Fable's later real `pnpm preflight:live` run reproduced the GitHub 5/1 result, classified the missing substrate database as `UNAVAILABLE`, and classified the public-devloop health probe as `UNKNOWN` after the existing bounded command failed. During main-PM integration, the fake-backed preflight suite passed 6/6, but a fresh real run authenticated the GitHub actor and then returned `github_projection_read_failed`; substrate and health retained the same unavailable/unknown classifications. The failed real attempt is retained as reliability evidence and prevents any claim that the live read is continuously available.

Two attempts to capture the rendered live page with the local headless Chrome process timed out after abnormal renderer/network-service termination. No DOM evidence was accepted. The live claim therefore stops at BFF and app-origin proxy responses.

A local `fkst-framework` release binary was found, but no deployed durable root was available to observe. Live substrate delivery data therefore remains explicitly unavailable. The recorded fixture demonstrates the contracted runtime presentation without claiming to be live status.

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
