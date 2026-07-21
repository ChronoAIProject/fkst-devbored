# FKST local delivery-ledger BFF

This local-only server exposes one read endpoint for the Substrate engine delivery
ledger. It is not a business/work-status authority and it has no control or remote
effect surface.

## Start

From the `fkst-devbored` repository root:

```sh
node local-bff/server.mjs
```

In a second terminal, serve the demo from the same repository root:

```sh
python3 -m http.server 8471 -d demo
```

Open <http://127.0.0.1:8471/runtime.html>. Stop each server with `Ctrl-C`.

The API is `GET http://127.0.0.1:8472/api/v1/connections/local/engine`.
The first start creates `/tmp/fkst-bff-sandbox` if necessary. A missing delivery
database is an expected `offline` result: the response keeps `ledger` and all
snapshot-derived counts absent rather than representing the unavailable ledger as
zero.

## Local effect boundary

- The HTTP server binds only to `127.0.0.1:8472`.
- Cross-origin browser reads are accepted only from the loopback demo origin on
  port `8471` (`127.0.0.1`, `localhost`, or IPv6 loopback spelling).
- Only `GET` is supported.
- The server uses `execFile` with an argv array, a five-second timeout, and a 1 MiB
  output cap.
- The binary, durable root, and complete observe argv are a closed source-code
  allowlist. They cannot be overridden by request data, process argv, or environment
  variables.
- The allowlisted command is exactly:

  ```text
  /Users/chronoai/Desktop/aelf-frontend-work/FKST/substrate/target/release/fkst-framework observe --durable-root /tmp/fkst-bff-sandbox --json --limit 1000
  ```

- The server never opens the observe socket or `delivery.redb` directly, performs
  no GitHub/network calls, and has no write target outside the durable root under
  `/tmp`.

## Note for reviewers without a substrate build

The allowlisted engine binary path is machine-specific. If `fkst-framework`
is not present at that path, the BFF stays up and the Engine screen honestly
reports **unknown / observe_failed** (HTTP 502 envelope) — it never crashes
and never fabricates data. Building `fkst-substrate` locally and updating the
one allowlist path in `server.mjs` enables the real snapshot read.
