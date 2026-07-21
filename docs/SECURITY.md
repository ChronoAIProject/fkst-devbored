# Security boundary

This is a local demo candidate, not a claim of production hardening. Its meaningful boundary is narrow: browser code is unprivileged, the BFF is loopback-only, reads use fixed adapters, and one issue-admission mutation is denied unless every independent guard passes.

## Read boundary

- The BFF binds exactly `127.0.0.1`; there is no host flag that widens it.
- `gh`, `fkst-framework`, and the health runner are invoked with `execFile` and explicit argv arrays. No business input is assembled into a shell command.
- Observe accepts only the configured binary and durable root, calls the CLI, validates schema/casing/absence invariants, and redacts the configured local root in its projection.
- The console never opens `delivery.redb` and never accesses `/tmp/fkst-observe-*.sock`.
- The server sets no permissive CORS headers and rejects unexpected Host, Origin, query strings, methods, and routes.
- SSE has bounded clients and heartbeat behavior. HTTP headers, request time, connections, and request bodies are bounded.

## Sole write boundary

The only allowed mutation is one `gh issue create` argv containing both the issue contents and `--label fkst-dev:enabled` for the configured repository.

Required guards:

1. `--enable-writes` is present; default startup is read-only.
2. Demo mode is false.
3. Exactly one syntactically valid `owner/name` sandbox repository is configured.
4. The request is POST to the issue resource.
5. Host and Origin exactly match this loopback launch.
6. The constant-time-checked per-launch session token is present.
7. The bounded JSON body contains exactly `title` and `body`.
8. `gh api user` resolves a valid actor.
9. After trim/lowercase/anchored `[bot]` removal, that actor differs from the configured bot.
10. The returned URL is HTTPS on `github.com`, belongs to the exact configured repository, and ends in a positive issue number.

No flag disables an individual guard. Demo and write mode are mutually exclusive.

## Explicitly impossible through the product

- marker or bot-comment writes;
- issue edits, closes, or label-only mutations;
- PR approvals, closes, or merges;
- `FKST_GITHUB_WRITE` mutation;
- engine start/stop/retry/requeue or terminal-goal resume;
- direct ledger or socket access;
- browser-held GitHub tokens; and
- arbitrary executable or argv selection from an HTTP request.

## Fixture and test containment

Fixture URLs use `example.invalid`, identities are replacements, local paths and credentials are excluded, and fixture posture is read-only. Black-box tests use repository-local fake executables. The repository scrub is read-only and scans tracked/untracked non-ignored text plus committed patch history for likely credentials; current files also receive developer-home-path and known-identity checks.

## Before any real sandbox write

Run `gh auth status`, confirm the displayed account is a human test identity, confirm the sandbox owner/name, leave the upstream deployment's global posture unchanged, and run the negative guard suite. A real write has not been authorized merely because the server launches with `--enable-writes`; the browser request still needs every request- and actor-level guard.

Do not test the mutation against `fkst-packages`, `fkst-substrate`, or any non-sandbox repository.
