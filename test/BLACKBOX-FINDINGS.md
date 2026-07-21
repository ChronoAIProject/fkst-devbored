# Black-box findings — FKST Build Week two-hour demo

Updated: 2026-07-22 04:56 SGT. This file is an S4 report to the PM and S1/S2 owners; it does not modify owner paths.

## Open blockers

None.

## Resolved during S4

### BB-001 — live Vite/BFF topology emitted permissive CORS

- **File / behavior:** `app/vite.config.ts` safely proxies `/api` to a validated `http://127.0.0.1:<port>` BFF and gates foreign Origin before rewrite, but Vite's default CORS middleware initially added `Access-Control-Allow-Origin: *` to valid proxied API responses.
- **Severity:** P1 / S1+S2 security acceptance blocker. Session and mutation traffic work, but the requested same-origin-only response posture is not met.
- **Correction applied by owner:** `server.cors: false` in `app/vite.config.ts`, retaining loopback target validation, the pre-rewrite Origin gate, proxy Host/Origin canonicalization, BFF checks, and session token.
- **Verification:** `pnpm --filter ./test run test:topology` passes 7/7. Valid same-origin session and POST work without CORS; foreign Origin is denied without token leakage.

### BB-002 — declared BFF start command rejected TypeScript parameter properties

- **File / behavior:** `server/package.json` uses Node strip-only TypeScript execution. Earlier parameter properties in `server/src/gh-adapter.ts`, `server/src/http-server.ts`, and `server/src/snapshot.ts` raised `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` before bind.
- **Severity:** P0 at discovery.
- **Correction applied by owner:** explicit fields and constructor assignments replaced parameter properties.
- **Verification:** `pnpm --filter ./test run test:bff` now passes 16/16.

### BB-003 — black-box foreign-Host probe did not preserve the Host header

- **File / behavior:** Node fetch/undici ignored the requested foreign Host, allowing one test probe to reach fake `gh` and contaminate the shared audit.
- **Severity:** S4 harness blocker; no server defect.
- **Correction applied in S4:** foreign-Host probes now use `node:http.request`; audit assertions use per-probe cursors.
- **Verification:** both Host probes receive `403 invalid_host`; `test:bff` passes 16/16 with zero fake-gh mutation calls on all denial paths.

### BB-004 — UI session-token and success-receipt contracts were incompatible

- **File / behavior:** the UI previously looked for an absent meta token and parsed a flat receipt while the BFF exposes `GET /api/v1/session` and a nested `actor`/`issue` receipt.
- **Severity:** P0 at discovery.
- **Correction applied by owner:** the UI now obtains the token from `/api/v1/session`, sends `x-fkst-session-token`, and consumes the BFF's nested typed receipt.
- **Verification:** the Vite-transformed `test/probes/ui-consumer.mts` contract and end-to-end browser-origin topology both pass.

### BB-005 — Vite proxy rewrote foreign Origin before validation

- **File / behavior:** the initial proxy design canonicalized every Origin to the BFF origin, which would let a foreign-origin request reach the BFF as apparently same-origin.
- **Severity:** P1 at discovery.
- **Correction applied by owner:** a pre-rewrite `/api` middleware now requires the browser Origin to equal the loopback Vite Host, and the BFF target parser accepts only origin-only `http://127.0.0.1:<port>` URLs.
- **Verification:** topology tests prove foreign Origin receives `403` with no session-token material and no fake-gh mutation, and an external proxy target exits before Vite binds.

### BB-006 — fake GitHub harness lagged the bounded GraphQL read contract

- **File / behavior:** `test/bin/gh` initially modeled actor lookup and mutation denial only. Once sandbox repo and bot were configured, the stabilized server correctly performed a bounded GraphQL read during health/snapshot acquisition.
- **Severity:** S4 harness blocker; no live-read or server defect.
- **Correction applied in S4:** the fake now accepts only the exact eight-element query argv, requires query-not-mutation, six `first: 100` bounds, six `pageInfo { hasNextPage }` selections, exact owner/name fields, and returns deterministic complete empty connections.
- **Verification:** topology records at least one exact synthetic read before the write path. The positive path records exactly one separate fake issue-create mutation; every denial path records zero new mutations. Complete black-box result: 30/30.
