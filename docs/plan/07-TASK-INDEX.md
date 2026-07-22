# 07 — Task index

> **Historical index.** The active cold-start steps are in
> [`plans/full-app-construction.md`](../../plans/full-app-construction.md).

Flat index of every task. Size: S ≤1d · M ≤3d · L ≤1w · XL >1w.
`⛔` = blocks other work · `⚠` = can invalidate architecture.

## P0 — Reality & freeze *(no product code)*

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P0A-01 | ~~Council config seam (upstream)~~ **resolved by ADR-024**; only optional cap raise remains → PE-N-04 | K | S | — | — |
| P0A-02 | Marker schema inventory | C | L | — | ⛔ |
| P0A-03 | Scoring derivability | C | M | P0A-02 | ⛔ |
| P0A-04 | Process-tree termination | B | M | P0A-07 | ⚠ |
| P0A-05 | gh rate metadata | B | M | — | ⛔ |
| P0A-06 | Field derivability matrix | PM+C | L | P0A-02,03 | ⛔ **=G0** |
| P0A-07 | Stack confirmation | PM | S | — | ⛔ |
| P0A-08 | Auth context isolation | B | M | P0A-07 | — |
| P0B-01 | Raw capture pipeline | C | M | — | — |
| P0B-02 | Sanitisation | C | M | P0B-01 | — |
| P0B-03 | Adversarial corpus | C | M | P0B-02 | — |
| P0C-01 | Nullable state + parse status | PM | S | P0A-02 | — |
| P0C-02 | Snapshot/error seam types | PM | M | — | ⛔ |
| P0C-03 | Split RuntimeSnapshot | PM | S | — | — |
| P0C-04 | Remove roster authority from DB | PM | S | — | — |
| P0C-05 | Normalise Council types | PM | M | P0A-01 | — |
| P0C-06 | Stable historical voice identity | PM+C | M | P0A-02 | ⛔ |
| P0C-07 | Council history authority | PM | S | P0A-01 | — |
| P0C-08 | Narrow R5.3 | PM | S | — | — |
| P0C-09 | Nullable comment count | PM | S | — | — |
| P0C-10 | Split write unions | PM | S | — | — |
| P0C-11 | Discriminated materialisation states | PM | S | — | — |
| P0C-12 | Serialisation rules + round-trip | PM+C | M | P0C-01..11 | ⛔ |
| P0C-13 | Typed provenance | PM | S | — | — |
| P0C-14 | Amend requirements; freeze | PM | M | all P0 | **G0** |

## P-E2E — Local host & complete run *(between P1 and P2)*

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| PE-L-01 | Host root layout | L | M | P1-B-01 | ⛔ |
| PE-L-02 | Sibling reference resolution | L | M | PE-L-01 | — |
| PE-L-03 | Composition control | L | M | PE-L-01 | — |
| PE-L-04 | Per-connection roots | L | S | PE-L-01 | — |
| PE-M-01 | Supervise launch | M | L | PE-L-01..04 | ⛔ |
| PE-M-02 | Stop & restart | M | M | PE-M-01 | ⚠ |
| PE-M-03 | Adopted vs owned | M | M | PE-M-01 | — |
| PE-M-04 | Crash surfacing | M | M | PE-M-01 | — |
| PE-M-05 | Log stream | M | M | PE-M-01 | — |
| PE-N-01 | devbored-council package | N | L | PE-L-01 | ⛔ |
| PE-N-02 | Roster → angles (4-seat cap) | N | M | PE-N-01 | — |
| PE-N-03 | Roster config format | N | M | PE-N-02 | — |
| PE-N-04 | Upstream cap proposal (optional) | K | S | — | — |
| PE-X-01 | DRY-RUN complete run | X | L | all PE | **G1.5** |
| PE-X-02 | LIVE run | X | M | PE-X-01 | — |
| PE-X-03 | Custom roster proof | X | M | PE-N-03 | **key** |
| PE-X-04 | Restart mid-flight | X | M | PE-M-02 | — |
| PE-X-05 | Failure drills | X | M | PE-M-04 | — |

## P1 — Foundation

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P1-J-01 | Signed skeleton | J | M | P0A-07 | ⛔ |
| P1-J-02 | GUI PATH + tool discovery | J | M | P1-J-01 | ⚠ |
| P1-J-03 | Native deps (SQLite) | J | M | P1-J-01 | ⚠ |
| P1-J-04 | Release mechanics | J | M | P1-J-03 | — |
| P1-B-01 | Process supervisor | B | L | P0A-04, P1-J-02 | ⚠ |
| P1-B-02 | observe adapter | B | M | P1-B-01 | — |
| P1-B-03 | health adapter | B | S | P1-B-01 | — |
| P1-B-04 | gh adapter (read) | B | L | P1-B-01, P0A-05 | — |
| P1-B-05 | git adapter (read) | B | S | P1-B-01 | — |
| P1-D1-01 | Schema + four data classes | D1 | M | P0C-12 | — |
| P1-D1-02 | Migrations + WAL-safe backup | D1 | L | P1-D1-01 | ⚠ |
| P1-D1-03 | DB isolate | D1 | S | P1-D1-01 | — |
| P1-I1-01 | Connection model | I1 | M | P0C-04 | ⛔ |
| P1-I1-02 | Trust derivation | I1 | M | P1-I1-01 | ⛔ |
| P1-I1-03 | Auth context model | I1 | M | P0A-08 | ⛔ |
| P1-I1-04 | Doctor core | I1 | L | P1-B-*, P1-I1-01..03 | **G1** |
| P1-A-01 | Theme from tokens | A | M | P0A-07 | — |
| P1-A-02 | App shell + navigation | A | M | P1-A-01 | — |
| P1-A-03 | Status icon language | A | M | P1-A-01 | — |
| P1-A-04 | Shared components | A | L | P1-A-01 | — |
| P1-A-05 | Six view states | A | M | P1-A-04 | — |

## P2 — Read plane

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P2-C-01 | Trust normalisation | C | S | P1-I1-02 | — |
| P2-C-02 | State resolution | C | M | P2-C-01 | ⛔ |
| P2-C-03 | Claim resolution | C | M | P2-C-01 | — |
| P2-C-04 | Metadata vs marker facts | C | S | P2-C-02 | — |
| P2-C-05 | Discovery union | C | M | P1-B-04 | — |
| P2-C-06 | Debate assembly | C | L | P0A-02, P2-C-02 | — |
| P2-C-07 | Voice identity mapping | C | M | P0C-06 | — |
| P2-C-08 | Completeness & partial fetch | C | M | P2-C-05 | — |
| P2-C-09 | Differential + hand audit | C | L | P2-C-01..08 | **G2** |
| P2-D2-01 | Poll loop (fake clock) | D2 | L | P1-B-01 | — |
| P2-D2-02 | Lifecycle handling | D2 | M | P2-D2-01 | — |
| P2-D2-03 | Generation swap | D2 | S | P2-D2-01, P1-D1-01 | — |
| P2-D3-01 | Budget per {host, auth} | D3 | L | P0A-05, P1-I1-03 | ⛔ |
| P2-D3-02 | Budget surfacing | D3 | S | P2-D3-01 | — |
| P2-E-01 | List view | E | M | P1-A-04 | — |
| P2-E-02 | Board + 4 groupings | E | L | P1-A-04 | — |
| P2-E-03 | Drill-in | E | M | P2-E-01 | — |
| P2-E-04 | Live integration | E | L | P2-C-09, P2-D2-01 | **G2** |
| P2-E-05 | Virtualisation | E | M | P2-E-02 | — |
| P2-R-01 | Runtime view | E | M | P1-B-02 | — |

## P3 — Council

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P3a-F-01 | Voice roster from evidence | F | M | P2-C-07 | — |
| P3a-F-02 | Flow observation | F | L | P2-C-06 | — |
| P3a-F-03 | Debate reader | F | L | P2-C-06 | — |
| P3a-F-04 | Observable scores | F | M | P0A-03 | — |
| P3a-F-05 | Scores → debates linkage | F | S | P3a-F-03,04 | **G3** |
| P3b-K-01 | Upstream config seam | K | XL | P0A-01 | ⛔ |
| P3b-H-01 | Council domain model | H | M | P3b-K-01 | — |
| P3b-H-02 | Flow validation | H | M | P3b-H-01 | — |
| P3b-H-03 | Restricted profile grammar | H | M | P3b-K-01 | — |
| P3b-H-04 | Guarded materialisation | H | L | P3b-H-03 | ⚠ |
| P3b-H-05 | Round-trip proof | H | M | P3b-H-04 | **gate** |
| P3b-F-06 | Authoring UI | F | L | P3b-H-01..02 | — |

## P4 — Writes

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P4-G-01 | Identity guard | G | M | P1-I1-03, P2-C-01 | ⛔ |
| P4-G-02 | Allowlist + toggle | G | S | P4-G-01 | — |
| P4-G-03 | Create issue | G | M | P4-G-01 | — |
| P4-G-04 | Comment | G | M | P4-G-01 | — |
| P4-G-05 | Ambiguous outcomes | G | L | P4-G-03,04 | ⚠ |
| P4-G-06 | Audit | G | M | P1-D1-01 | — |
| P4-G-07 | Write composers (UI) | G | M | P4-G-01 | — |
| P4-H-06 | Config apply pipeline | H | M | P3b-H-05 | — |

## P5 — Fleet & RC

| ID | Task | Stream | Size | Depends | Flag |
|---|---|---|---|---|---|
| P5-I2-01 | Fleet overview | I2 | M | P2-D2-01 | — |
| P5-I2-02 | Fleet controls | I2 | M | P5-I2-01 | — |
| P5-I2-03 | Cross-connection views | I2 | M | P5-I2-01 | — |
| P5-I2-04 | Version compatibility matrix | I2 | S | P1-I1-04 | — |
| P5-N-01 | Notification pipeline | D2 | M | P2-D2-02 | — |
| P5-X-01 | Accessibility pass | A | L | P2-E-* | — |
| P5-X-02 | Redaction & diagnostics | I1 | M | P1-I1-04 | — |
| P5-X-03 | Performance | E | M | P2-E-05 | — |
| P5-X-04 | Fixture demo mode | A | M | P0B-03 | — |
| P5-X-05 | Doc/reality reconciliation | PM | M | all | **blocker** |
| P5-X-06 | Release | J | M | P1-J-04 | **G5** |

---

## Critical path

```
P0A-07 stack ─► P1-J-01 signed skeleton ─► P1-J-02 PATH ─► P1-B-01 supervisor
   └─► P0A-04 orphan spike ──┘                                    │
P0A-02 schemas ─► P0A-03 scoring ─► P0A-06 MATRIX ═ G0 ═══════════┤
P0A-05 rate ────────────────────────────────┐                     │
                                            ├─► P2-D3-01 budget   │
P1-I1-01..03 ─► P1-I1-04 doctor ═ G1 ═══════┴─► P2-C-* ─► P2-C-09 ═ G2
                                                       └─► P2-E-04 ┘
P3a-F-* ═ G3 ─► P4-G-01 guard ─► P4-G-05 ambiguous ═ G4 ─► P5 ═ G5

P0A-01 council seam ──(if passes)──► P3b-K-01 ─► P3b-H-* ─► P3b-F-06
```

**Longest chain runs through the derivability matrix (P0A-06) and the doctor
(P1-I1-04).** Council authoring is a parallel track that may never start.

## Sizing by stream

| Stream | Size | Biggest risk to the estimate |
|---|---:|---|
| A shell/design | L | accessibility + six states across the full view inventory |
| B adapters | XL | descendant-process termination; gh auth/rate behaviour |
| C projection | XL | marker schemas may not support the debate model |
| D1 store | L | WAL-safe backup and interrupted migrations |
| D2 scheduler | L | fairness and deterministic testing without wall-clock |
| D3 rate/auth | L | rate metadata mechanism may not exist uniformly |
| E work views | L | virtualisation, pagination, stable grouping at scale |
| F Council UI | L | scope collapses or expands entirely on P0A-01/03 |
| G writes | L | ambiguous remote success; audit failure after side effect |
| H materialiser | XL | shell-profile round-trip; dead config if K fails |
| I1 conn/doctor | L | provenance validation across heterogeneous installs |
| I2 fleet | M | — |
| J packaging | L | signing credentials; Finder-launched child execution |
| K platform ext | XL | upstream decision is not ours to make |

⟦AI:FKST⟧
