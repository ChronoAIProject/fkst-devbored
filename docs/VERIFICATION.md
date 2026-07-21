# Local release verification

Checkpoint: 2026-07-22, before the 07:00 SGT implementation hard stop.

This is evidence for the local two-hour demo candidate on `codex/build-week-mvp`. It is not evidence that the project has been published, deployed, entered on Devpost, or accepted as an eligible submission.

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

- React app: 12/12 across four files;
- loopback BFF: 36/36;
- black-box/integration: 30/30 across ten suites; and
- aggregate: 78/78.

The black-box total includes seven stitched live-topology cases covering the browser-origin session and issue endpoints, one bounded synthetic GitHub GraphQL read, foreign-Origin rejection before proxy rewrite, session-token enforcement, the fake guarded issue receipt, UI receipt parsing, and rejection of a non-loopback BFF target.

Both production and recorded-demo Vite builds transformed 42 modules. The fixture smoke built the demo, served it temporarily on `127.0.0.1:4174`, verified the snapshot schema, HTML mount, and persistent recorded-data disclosure, then stopped it. The repository scrub examined 96 non-ignored files plus committed history.

Independent read-only reviews reached `UX_FINAL_SOL=PASS` and `SECURITY_FINAL_SOL=PASS`. The security pass was issued only after malformed top-level GitHub entities and malformed/truncated frontend collections were changed to fail closed as partial, unknown, or null and covered by regressions.

## External-path reality checks

An authenticated, read-only local BFF launch queried `ChronoAIProject/fkst-packages-testing` through the fixed `gh api graphql` adapter with writes disabled. Acquisition succeeded and truthfully returned zero current open issues and zero current open pull requests; marker counts were consequently zero and complete for that current open set. The launch did not include `--enable-writes`, no issue POST was sent, and no real GitHub mutation has been performed during implementation or verification.

A local `fkst-framework` release binary was found, but no deployed durable root was available to observe. Live substrate delivery data therefore remains explicitly unavailable. The recorded fixture demonstrates the contracted runtime presentation without claiming to be live status.

The only positive mutation-path evidence uses a repository-local fake `gh` executable. It proves the fully guarded request reaches exactly one argv-only `gh issue create` operation with `fkst-dev:enabled`; it does not write to GitHub.

## Still external and unverified

The following are required release/submission work, not completed local-code gates:

- a public repository URL, or a private repository shared with both judging addresses;
- a working judge-accessible demo, sandbox, or test build;
- a public YouTube demo under three minutes with audio explaining both Codex and GPT-5.6 use;
- the primary Codex `/feedback` Session ID for the thread containing most core implementation;
- the completed Devpost description, category, and submission URL;
- entrant legal/personal eligibility; and
- a real durable-root substrate observation and a real guarded sandbox issue creation, if those live behaviors are to be claimed in submission materials.

The credential-free local judge path remains `pnpm demo` at `http://127.0.0.1:4173`. The integrated local development path is `pnpm dev` at `http://127.0.0.1:5173`; without upstream configuration it must show unavailable/unknown sources rather than fabricated zero values.
