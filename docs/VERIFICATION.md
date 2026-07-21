# Local release verification

Checkpoint: 2026-07-22, before the 07:00 SGT implementation hard stop.

This is evidence for the local two-hour demo candidate published on the isolated [`codex/build-week-mvp`](https://github.com/ChronoAIProject/fkst-devbored/tree/codex/build-week-mvp) branch. It is not evidence that the project has been deployed, entered on Devpost, or accepted as an eligible submission. The repository's unrelated `main` history was not replaced.

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
- black-box/integration: 33/33 across 12 suites; and
- aggregate: 82/82.

The black-box total includes seven stitched live-topology cases covering the browser-origin session and issue endpoints, one bounded synthetic GitHub GraphQL read, foreign-Origin rejection before proxy rewrite, session-token enforcement, the fake guarded issue receipt, UI receipt parsing, and rejection of a non-loopback BFF target. It also includes explicit propagation of the BFF's default read-only posture into disabled New Work availability, plus two browser-lifecycle cases: a synthetic hung subprocess proves bounded exact process-group reaping, while a real complete document proves preserved network telemetry and exact profile cleanup.

Both production and recorded-demo Vite builds transformed 42 modules. The fixture smoke built the demo, served it temporarily on `127.0.0.1:4174`, verified the snapshot schema, HTML mount, and persistent recorded-data disclosure, then stopped it. The final release-tree scrub examined 100 non-ignored files plus current branch history.

The pre-audit published checkpoint `dcf1d2d798e89e39d2295526aabb5061324400d3` passed the complete [Ubuntu/Node 22 GitHub Actions verification](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29874243382); the [branch workflow](https://github.com/ChronoAIProject/fkst-devbored/actions/workflows/verify.yml?query=branch%3Acodex%2Fbuild-week-mvp) is the current hosted result. The first published run exposed an undeclared test-runner assumption: two probes could find transitive `vite-node` on the local macOS installation but not on the Linux runner. Pinning the already-used `vite-node@2.1.8` as a direct development-only dependency corrected reproducibility without changing or weakening either probe; the complete local gate, the [corrected-code workflow](https://github.com/ChronoAIProject/fkst-devbored/actions/runs/29874160311), and the subsequent documentation workflow all passed. GitHub attached a non-blocking deprecation annotation because the v4 setup actions target the Node 20 action runtime and are currently forced onto Node 24; the repository commands themselves ran under the workflow's configured Node 22 toolchain.

Independent read-only reviews reached `UX_FINAL_SOL=PASS` and `SECURITY_FINAL_SOL=PASS`. The security pass was issued only after malformed top-level GitHub entities and malformed/truncated frontend collections were changed to fail closed as partial, unknown, or null and covered by regressions.

## External-path reality checks

An authenticated, read-only local BFF launch queried `ChronoAIProject/fkst-packages-testing` through the fixed `gh api graphql` adapter with writes disabled. Acquisition succeeded and truthfully returned zero current open issues and zero current open pull requests; marker counts were consequently zero and complete for that current open set. The launch did not include `--enable-writes`, no issue POST was sent, and no real GitHub mutation has been performed during implementation or verification.

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

The credential-free local judge path remains `pnpm demo` at `http://127.0.0.1:4173`. The integrated local development path is `pnpm dev` at `http://127.0.0.1:5173`; without upstream configuration it must show unavailable/unknown sources rather than fabricated zero values.
