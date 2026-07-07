# Testing notes

## What's testable headless, and what isn't
`grill-with-docs` (Phase 1b) is interactive, so the skill's eval must NOT try to validate it — that's
a dependency with its own suite. The skill's own responsibility is scaffold/wire correctness, which
splits into two gates against a **fixture repo** (a small pre-authored repo so no human is needed):

- **Gate A — data layer (fully headless).** `tests/run-gate-a.sh`. Asserts: `docs-meta.mjs` runs;
  `_meta.json` has the right shape; `contextToAdrs` is populated and correct (proves
  `contextSlugByName` was *authored*, not string-matched); doc surfaces serve 200. This is the gate
  that catches the silent failures — empty registries, the wrapped-cluster-line bug, an unauthored
  synonym table. Run it: `bash tests/run-gate-a.sh`.
- **Gate B — rendering (needs a headless browser).** "Stub renders in the nav" and "glossary drawer
  populates" require executing the SPA's client-side JS. That needs Playwright (or similar) driving a
  real browser against a substituted SPA in the fixture. **Decision pending:** add Playwright to CI,
  or accept Gate A + one manual visual check (`pnpm documentation`, eyeball the nav and press `g`).
  Recommendation: data-layer in CI now, manual visual once per change; add Playwright only if drawer
  rendering must be CI-gated.

## The fixture (`tests/fixture-repo/`)
A 3-context multi-context repo (ordering / billing / fulfillment). It deliberately uses **cluster
names that don't string-match their slugs** ("Order Capture & Checkout" → `ordering`) so Gate A fails
loudly if `contextSlugByName` is ever string-matched instead of authored. Its `CONTEXT-MAP.md` cluster
entries are **single physical lines** — the parser drops ADRs from wrapped entries (verified; see
`registry-substitution.md`).

Gaps to close when you extend the fixture:
- It carries a placeholder `docs/architecture/README.md`, not the reference repo's real one.
- It has no substituted SPA at `docs/architecture/index.html` yet, so Gate A serves the other
  surfaces but not a rendered SPA. To enable Gate B, run the skill's Phase-2b substitution against the
  fixture's inventory to produce that file, then point Playwright at it.

## Description optimization
`run_loop.py` / `run_eval.py` need the `claude` CLI (Claude Code only). Skip on Claude.ai. If you do
optimize the triggering description later, do it **after** the skill is otherwise final.
