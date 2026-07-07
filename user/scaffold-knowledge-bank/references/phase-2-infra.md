# Phase 2 — documentation infrastructure

Vendor the machinery verbatim; substitute the registries. **Never regenerate the SPA.**

## 2a. Directory + scripts

```
docs/
├── index.html                 ← root redirect (assets/docs-index-redirect.html)
├── architecture/
│   ├── index.html             ← the SPA (assets/index.html, after registry substitution)
│   ├── README.md              ← authoring contract (references/authoring-conventions.md)
│   ├── overview.md            ← system map — AUTHOR THIS (gates NODE_TO_SLUG)
│   ├── contexts/              ← one stub .md per context in v1
│   └── sub-modules/           ← empty in v1
├── adr/                       ← seeded lazily (ADR-FORMAT.md → 0000-template.md)
└── agents/                    ← from setup-matt-pocock-skills (Phase 1a)
tooling/
├── docs-meta.mjs              ← assets/docs-meta.mjs (after contextSlugByName substitution)
└── docs-graph.mjs             ← optional (assets/docs-graph.mjs), off by default
```

Add to `package.json` (serve the **repo root** so the SPA can fetch `/CONTEXT.md`,
`/packages/*/CONTEXT.md`):

```jsonc
{
  "scripts": {
    "documentation": "node tooling/docs-meta.mjs && pnpm dlx serve@latest --listen tcp://127.0.0.1:3000 .",
    "documentation:meta": "node tooling/docs-meta.mjs",
    "documentation:setup-graph": "node tooling/docs-graph.mjs"
  }
}
```

Then open `http://localhost:3000/docs/architecture/`. (Non-pnpm repos: swap `pnpm dlx` for
`npx`/`yarn dlx`.)

## 2b. Vendor + substitute
1. Copy `assets/index.html` → `docs/architecture/index.html`, `assets/docs-meta.mjs` →
   `tooling/docs-meta.mjs`, `assets/docs-index-redirect.html` → `docs/index.html`,
   `references/authoring-conventions.md` → `docs/architecture/README.md`, and author
   `docs/architecture/overview.md` (start from `examples/overview.md`).
2. **Substitute the seams.** Each is marked `// SKILL: replace <name>` (or `<!-- SKILL: replace … -->`
   for the brand). Follow `references/registry-substitution.md` — it's derivation, not a blind swap.
   Author `overview.md` **before** filling `NODE_TO_SLUG` (its keys are the map's node ids). After
   each substitution, delete the sentinel line.
3. **Grep that no `SKILL: replace` markers remain** before serving — a leftover means an unfilled seam.

## 2c. Verify (Gate A, headless)
`pnpm documentation:meta` must run clean and write `docs/architecture/_meta.json`. Then: sidebar
lists contexts; glossary drawer (`g`) lists terms; a stub renders; `contextToAdrs` in `_meta.json` is
populated (multi-context). The fixture's `tests/run-gate-a.sh` exercises the headless data layer; the
browser-rendered checks (nav, drawer) are Gate B — see `references/testing-notes.md`.

## Known constraints (state these to the user; don't bury them)
- **CDN-backed, network on first load.** The SPA imports marked/mermaid/prismjs/svg-pan-zoom from
  esm.sh/jsdelivr. It is build-free but not offline (except the saved-page offline snapshot mode).
- **Cross-page links must be relative `.md` paths** (`../sub-modules/x/y.md`), not in-page anchors —
  the SPA router only matches the former. File-system links use repo-root-relative paths
  (`/packages/api/...`) and must start with a `CODE_PREFIXES` entry to open the code drawer.
- **`stateDiagram-v2` mermaid blocks don't support `<br/>`** — use single-line labels.
