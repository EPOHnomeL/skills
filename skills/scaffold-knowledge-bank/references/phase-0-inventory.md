# Phase 0 — inventory & single-vs-multi

The goal is to know the repo's shape before writing anything, because the single-vs-multi-context
choice drives every registry and the meta generator's behavior downstream.

## 1. Toolchain check
- **Node 18.20+** — the meta/graph generators use `node:` imports and spawn `npx`.
- **A script-running package manager** — pnpm/npm/yarn. the reference repo uses pnpm; the bundled `documentation`
  scripts call `pnpm dlx serve`. If the repo uses npm/yarn, swap to `npx serve` / `yarn dlx serve`.
- **git** — `docs-meta.mjs` reads `git log -1 --format=%cI` per file for "last updated". Without git
  it silently falls back to file mtime (the generator try/catches), so it still runs.

## 2. Inventory the contexts
Read the top-level layout. Each `packages/*` and `apps/*` (and `ops/` if present) is a candidate
**context**. In a single-package repo there is exactly one context. Write the list down — it becomes
the `CONTEXTS` registry and, in order, the sidebar.

## 3. Single vs multi (confirm with the user)
- **Single-context** (most repos): one root `CONTEXT.md` + `docs/adr/`. No `CONTEXT-MAP.md`. ADR
  chips come from each page's `adrs:` frontmatter, so `contextSlugByName` in `docs-meta.mjs` can be
  near-empty.
- **Multi-context** (the reference repo): `CONTEXT-MAP.md` at root with a **cluster map**, per-package `CONTEXT.md`
  files, and a populated `contextSlugByName` synonym table. This is the heavier path; most of the
  registry-derivation work in Phase 2b only matters here.

The generator discovers `packages/*/CONTEXT.md`, `apps/*/CONTEXT.md`, and `ops/CONTEXT.md`
dynamically — adding a package later needs no generator edit. But `GLOSSARY_SOURCES` and `REFERENCES`
in the SPA are manual indexes; those you update by hand when contexts change.

**Done when:** a written context list exists and single-vs-multi is chosen and confirmed by the user.
