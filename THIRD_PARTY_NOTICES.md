# Third-party notices

The Apache-2.0 license in `LICENSE` applies to FKST Console code and documentation only. The following bundled font software remains under the SIL Open Font License, Version 1.1, reproduced at [docs/third-party/SIL-OFL-1.1.txt](docs/third-party/SIL-OFL-1.1.txt).

## Space Grotesk

Bundled files:

- `app/src/assets/fonts/space-grotesk-600.woff2` — SHA-256 `685bbbf69fa616df1ef81847c85fc76be097ddfb3468ff2257be54511ab3130f`
- `app/src/assets/fonts/space-grotesk-700.woff2` — SHA-256 `35f8aec56cfd5cbfdb03cc68733a54a0b05bb3617ffcd5fd332badc0b045ca55`

Copyright 2020 The Space Grotesk Project Authors.

Upstream project and license notice: <https://github.com/floriankarsten/space-grotesk>. The upstream project states that Space Grotesk is licensed under SIL Open Font License 1.1.

## IBM Plex Sans and IBM Plex Mono

Bundled files:

- `app/src/assets/fonts/ibm-plex-sans-400.woff2` — SHA-256 `3b646991d30055a93a4ecc499713d4347953a74a947ecab435ab72070cbdab0e`
- `app/src/assets/fonts/ibm-plex-sans-500.woff2` — SHA-256 `0717336fb31fcdcde4b8deb3675bb4a0f7f6d484864afcd6751ac29975962203`
- `app/src/assets/fonts/ibm-plex-sans-600.woff2` — SHA-256 `8960851d691c054ed38e259bdcf1a6190d157b4203ed5bb32c632a863fb8ec2f`
- `app/src/assets/fonts/ibm-plex-mono-400.woff2` — SHA-256 `08949f728dc52d528e69b1667d15c89a5686a4ee9a296ff90983985f99c380f7`
- `app/src/assets/fonts/ibm-plex-mono-500.woff2` — SHA-256 `01d285447409c8a588692162439a038b8cbd7871309ee20267b0d2d91c6e8e22`

Copyright © 2017 IBM Corp. with Reserved Font Name “Plex”.

Upstream project and license notice: <https://github.com/IBM/plex>. The upstream project distributes IBM Plex under SIL Open Font License 1.1.

## Binary-source qualification

The seven bundled files are byte-identical to the named Latin-normal WOFF2 files in the following pinned npm packages. The pins come from the source frontend's committed `package-lock.json` at commit `93e4ff67881210bf6500301f25b550fcb0d1dd64`; the SHA-256 values above were rechecked against both the installed package files and this repository's copies.

| Package | Version | npm tarball | Lockfile integrity | Files used |
|---|---:|---|---|---|
| `@fontsource/space-grotesk` | `5.2.10` | `https://registry.npmjs.org/@fontsource/space-grotesk/-/space-grotesk-5.2.10.tgz` | `sha512-XNXEbT74OIITPqw2H6HXwPDp85fy43uxfBwFR5PU+9sLnjuLj12KlhVM9nZVN6q6dlKjkuN8JisW/OBxwxgUew==` | `space-grotesk-latin-600-normal.woff2`, `space-grotesk-latin-700-normal.woff2` |
| `@fontsource/ibm-plex-sans` | `5.2.8` | `https://registry.npmjs.org/@fontsource/ibm-plex-sans/-/ibm-plex-sans-5.2.8.tgz` | `sha512-eztSXjDhPhcpxNIiGTgMebdLP9qS4rWkysuE1V7c+DjOR0qiezaiDaTwQE7bTnG5HxAY/8M43XKDvs3cYq6ZYQ==` | `ibm-plex-sans-latin-400-normal.woff2`, `ibm-plex-sans-latin-500-normal.woff2`, `ibm-plex-sans-latin-600-normal.woff2` |
| `@fontsource/ibm-plex-mono` | `5.2.7` | `https://registry.npmjs.org/@fontsource/ibm-plex-mono/-/ibm-plex-mono-5.2.7.tgz` | `sha512-MKAb8qV+CaiMQn2B0dIi1OV3565NYzp3WN5b4oT6LTkk+F0jR6j0ZN+5BKJiIhffDC3rtBULsYZE65+0018z9w==` | `ibm-plex-mono-latin-400-normal.woff2`, `ibm-plex-mono-latin-500-normal.woff2` |

This records asset provenance only. None of these packages is an FKST product integration or runtime dependency of the console.
