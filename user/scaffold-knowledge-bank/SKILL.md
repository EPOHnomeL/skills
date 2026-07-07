---
name: scaffold-knowledge-bank
disable-model-invocation: true
description: >-
  Scaffold a self-contained, build-free interactive documentation system (a
  "knowledge bank") into any repository — a domain
  glossary (CONTEXT.md / CONTEXT-MAP.md), Architecture Decision Records, and a
  zero-build single-page docs app served with `pnpm documentation` that gives you
  a hover-glossary, command palette, ADR chips, zoomable mermaid diagrams, and an
  inline code drawer. Use this skill whenever the user wants to set up, port,
  bootstrap, or stand up a documentation system, knowledge bank, docs SPA, domain
  glossary, CONTEXT.md, CONTEXT-MAP, or ADR structure in a codebase — including
  phrasings like "set up an interactive docs site", "interactive docs site for this repo",
  "bootstrap a knowledge bank", or "add a glossary/ADR system here". This v1
  scaffolder stands up the infrastructure, glossary, and authoring conventions
  (Phases 0–2) but stops short of authoring narrative pages from code — that is the
  companion populate-knowledge-bank skill (v2).
---

# scaffold-knowledge-bank

Stand up the **infrastructure and glossary layers** of an interactive knowledge bank in
a target repo, then hand off to humans/v2 for narrative authoring. You **vendor the
machinery** (the SPA, the meta generator) and **derive the repo-specific registries**
from the repo's own shape. You never re-derive the 3,800-line SPA — that is bundled
verbatim in `assets/`.

## What you produce (v1 scope)

- **Glossary layer** — `CONTEXT.md` (+ per-package, multi-context) and `CONTEXT-MAP.md`,
  authored by orchestrating `grill-with-docs` (interactive). The canonical domain language.
- **Decision layer** — `docs/adr/` seeded with a template; ADRs captured sparingly during grilling.
- **Infrastructure layer** — `docs/architecture/index.html` (vendored SPA), `tooling/docs-meta.mjs`
  (vendored), the `documentation` package scripts, and the six registries + meta synonym table
  substituted to match this repo.
- **Authoring conventions** — bundled as a reference doc so a later author (human or v2) knows the
  frontmatter, `[[term]]` linking, mermaid, and verify-tag rules. **You do not author context pages
  in v1** — you create at most empty `stub`-status entries so the nav renders.

Out of scope (v2 `populate-knowledge-bank`): drafting context/sub-module pages from code, the
verify-tag → grill → resolve loop, bundling `doc-sync`, and the doc-only dogfooding harness. If the
user is asking for self-healing / never-stale docs, tell them that is v2 — v1 gives them a working
but empty knowledge bank (real value: infra + glossary + nav).

## Step 0 — Prerequisite check (do this first; do not skip)

This skill orchestrates other skills by name. On the author's own machine they are installed
globally via `~/.agents/skills` → `~/.claude/skills`, but **a teammate's machine or CI may not have
them**, and silently assuming they exist is how Phase 1 dies with no explanation. So verify, then
stop loud if anything is missing.

**Probe, don't trust a name.** For each required skill, confirm its `SKILL.md` actually exists in one
of the concrete search paths — `.claude/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md`, or
the global `~/.claude/skills/<name>/SKILL.md`. "The name is familiar" and "it's invocable here" are
different facts (the `doc-sync` case proves it: globally absent, repo-local only).

Gate is **tiered by phase**:
- **v1 requires:** `setup-matt-pocock-skills`, `grill-with-docs`.
- **v2 will additionally require:** `doc-sync` — which is repo-local and not globally installed, so
  v2's only honest resolution is to **bundle** it, not expect it. (Stated now so v2 doesn't reopen the
  hole.)

If any required skill is missing, **stop and report exactly which one is missing and offer two fixes**:
(a) install the global suite, or (b) the cross-machine-safe path — vendor the suite into this repo's
`.agents/skills/` (the exact pattern the reference repo uses). Do not attempt the phase without it; do not improvise a
replacement.

> Portability note for the maintainer: for true cross-machine/CI use, prefer vendoring the suite
> into the consuming repo (vendor the suite into the consuming repo — pin copies under `<repo>/.agents/skills/`) rather than
> relying on a personal global symlink. v1 orchestrates-by-name for lightness; document this tradeoff
> wherever the skill is published.

## Phase 0 — Inventory & single-vs-multi decision

Read `references/phase-0-inventory.md`. In short:

1. Confirm toolchain: Node 18.20+, a script-running package manager (pnpm/npm/yarn), `git`.
2. Inventory candidate **contexts** — each `packages/*` and `apps/*` in a monorepo; one context in a
   single-package repo. Write the list down; it becomes the `CONTEXTS` registry.
3. Decide **single-context** (one root `CONTEXT.md` + `docs/adr/`) vs **multi-context**
   (`CONTEXT-MAP.md` at root pointing at per-package `CONTEXT.md`s). This drives everything downstream,
   so confirm it with the user before proceeding.

**Done when:** a written context list exists and single-vs-multi is chosen and confirmed.

## Phase 1 — Glossary + decision layers (orchestrated)

1. **Run `setup-matt-pocock-skills`** to scaffold `docs/agents/{issue-tracker,triage-labels,domain}.md`
   and the `## Agent skills` block in the existing `CLAUDE.md`/`AGENTS.md`. Pass through the Phase-0
   single-vs-multi decision when it asks.
2. **Run `grill-with-docs`** per context to author `CONTEXT.md` (and, multi-context, `CONTEXT-MAP.md`
   with its cluster map + `ADRs:` lines). This is **interactive** — it interviews the user one question
   at a time. Do not fabricate glossary terms to skip the interview.
   - The CONTEXT.md format and the rules that keep it useful (glossary-only, one sentence per term, be
     opinionated, domain-specific only, flag ambiguities) live in `references/CONTEXT-FORMAT.md`.
   - The cluster-map shape matters: the meta generator parses `- **Name** … **ADRs:** … NNNN` under a
     heading containing "cluster map". See `references/registry-substitution.md` §contextSlugByName.
3. **Capture ADRs sparingly.** Only when a decision is hard to reverse AND surprising without context
   AND the result of a real trade-off. Seed `docs/adr/0000-template.md` from `references/ADR-FORMAT.md`
   lazily, on the first real ADR.

**Done when:** `docs/agents/*` + `## Agent skills` block exist; root `CONTEXT.md` (and per-package +
`CONTEXT-MAP.md` cluster map, multi-context) exist with real terms; `docs/adr/` holds whatever surfaced.

## Phase 2 — Documentation infrastructure (`pnpm documentation`)

The whole point: **vendor verbatim, substitute the registries.** Never regenerate the SPA.

1. **Lay down the tree and scripts** — see `references/phase-2-infra.md` for the exact directory layout
   and the `documentation` / `documentation:meta` / `documentation:setup-graph` scripts to add to
   `package.json`. The serve script runs the meta generator, then serves the **repo root** statically so
   the SPA can fetch `/CONTEXT.md`, `/packages/*/CONTEXT.md`, etc.
2. **Vendor the assets**: copy `assets/index.html` → `docs/architecture/index.html`,
   `assets/docs-meta.mjs` → `tooling/docs-meta.mjs`. Copy `examples/overview.md` →
   `docs/architecture/overview.md` and `references/authoring-conventions.md` →
   `docs/architecture/README.md` as starting points.
3. **Derive and substitute the six registries + the meta synonym table.** This is the real work and is
   NOT a blind find-replace. Follow `references/registry-substitution.md` exactly: it tells you how to
   compute `CONTEXTS`, `SUBMODULES`, `GLOSSARY_SOURCES`, `REFERENCES`, `ADRS`, `NODE_TO_SLUG`, the brand
   label, and `contextSlugByName` from the Phase-0 inventory and the Phase-1 CONTEXT files, and where the
   `// SKILL: replace` sentinels are. In v1, `SUBMODULES` is typically empty (no sub-module pages yet)
   and `CONTEXTS` entries start at `status: stub`.
4. **(Optional) Code graph** — `assets/docs-graph.mjs` → `tooling/docs-graph.mjs` only if the user opts
   in; it pulls the GitNexus `npx` dependency. Off by default in v1.
5. **(Optional) docs-check CI gate** — a dependency-free deterministic check that fails CI when a
   knowledge-bank file references a file/line that doesn't exist (broken `[x](path)` links and
   drifted `file#Lnn` code-drawer anchors). It's the mechanical counterpart to v2's weekly
   drift-sync — catches the continuously-drifting reference modes an LLM pass can't reliably
   re-verify. Opt-in: vendor `assets/docs-check.mjs` + `assets/docs-check.test.mjs` → `tooling/`,
   substitute the surface seam, add the `docs:check` scripts and a CI job. Full steps, the
   complementarity table, and the surface seam are in `references/ci-reference-check.md`. Off by
   default.

**Done when:** `pnpm documentation` serves the SPA without error; the sidebar shows your contexts; the
glossary drawer populates from your `CONTEXT.md` files; `_meta.json` is generated; at least one `stub`
page renders in the nav.

## Phase 3 — Conventions only (no authoring in v1)

Do **not** write narrative pages. Just ensure the authoring contract is in the repo so the next author
(human or v2) has the depth target and the rules:

- `docs/architecture/README.md` (from `references/authoring-conventions.md`) — frontmatter,
  `[[term]]` linking, mermaid click-through, file/cross-page link rules, verify-tags, status lifecycle.
- `examples/exemplar-context.md` — the depth target. Leave it under `examples/` as the reference; do not
  copy the reference repo's domain content into the target repo as if it were real.

**Done when:** the conventions reference and exemplar are present and discoverable, and every registered
context has a `stub` entry (empty body) so the nav is complete.

## Verification (the v1 done-gate)

The gate splits because Phase 1b (`grill-with-docs`) is interactive and can't be checked headlessly:

- **Gate A — data layer (headless).** `_meta.json` generates clean; the registries resolve to correct
  values (**`SUBMODULES` correct == empty in v1**); `contextToAdrs` is populated for multi-context
  (proves `contextSlugByName` was authored, not string-matched); doc surfaces serve 200. The bundled
  `tests/run-gate-a.sh` runs this against `tests/fixture-repo/`.
- **Gate B — rendering (needs a headless browser).** Sidebar nav renders, glossary drawer (`g`)
  populates, command palette finds pages. Either add Playwright or do one manual visual check
  (`pnpm documentation`). See `references/testing-notes.md`.

Common failure modes: root-not-served (the serve must target the **repo root**, not `docs/`); empty
registries (an unfilled `SKILL: replace` seam — grep for leftover markers); a wrapped `CONTEXT-MAP.md`
cluster line silently dropping ADR chips (see `references/registry-substitution.md`).

## Maintaining the vendored machinery

upstream is canonical. To pull a newer snapshot, run `node scripts/refresh-spa.mjs --ref <stable
ref>` — it re-vendors the four machinery files, re-inserts the sentinels by anchoring on durable `const`
declarations (not line numbers), and re-stamps `PROVENANCE.md`. Prefer a stable branch over the interim
feature-branch SHA. The git fetch uses your credentials against the private repo.

## Bundled resources

- `assets/index.html` — vendored SPA, 7 seams sentinel-marked (`SKILL: replace`). Substitute, don't regenerate.
- `assets/docs-meta.mjs` — vendored meta generator; `contextSlugByName` seam marked.
- `assets/docs-graph.mjs` — optional code-graph generator; `CODE_DIRS` seam marked. Off by default.
- `assets/docs-check.mjs` + `assets/docs-check.test.mjs` — optional dependency-free CI gate that
  asserts every in-repo link / `file#Lnn` reference resolves; surface seam marked. Off by default;
  see `references/ci-reference-check.md`.
- `assets/docs-index-redirect.html` — the root `docs/index.html` redirect.
- `references/ci-reference-check.md` — the opt-in docs-check CI gate: what it catches, the drift-sync complementarity table, the 4-step opt-in, and the surface seam.
- `references/registry-substitution.md` — how to derive + substitute the registries + synonym table (start here for Phase 2b; opens with the dependency DAG).
- `references/theming.md` — apply the project's palette/fonts to the SPA (the `theme` seam) + the code-drawer behaviour.
- `references/CONTEXT-FORMAT.md`, `references/ADR-FORMAT.md` — glossary + ADR formats.
- `references/authoring-conventions.md` — the upstream `docs/architecture/README.md` (the authoring contract).
- `references/phase-0-inventory.md`, `references/phase-2-infra.md`, `references/testing-notes.md`.
- `examples/exemplar-context.md` (the bundled exemplar), `examples/overview.md` (system-map template).
- `scripts/refresh-spa.mjs` — re-vendor from upstream. `tests/fixture-repo/` + `tests/run-gate-a.sh` — the Gate-A harness.
- `PROVENANCE.md` — snapshot pin + refresh inputs.
