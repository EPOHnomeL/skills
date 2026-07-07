# Registry substitution — Phase 2b

The SPA (`docs/architecture/index.html`) and the meta generator (`tooling/docs-meta.mjs`) are
vendored **verbatim**. The only repo-specific parts are six registries near the top of the SPA's
`<script type="module">` block, the brand label, and one synonym table in the meta generator. Each is
marked with a `// SKILL: replace <name>` sentinel.

**The mechanism (find-replace) is trivial. Deriving the content is the work.** Do not paste empty or
guessed values — a wrong registry produces a SPA with a broken or empty nav, which is the most common
failure of this skill. Derive each from the Phase-0 inventory and the Phase-1 CONTEXT files.

Order of derivation matters: `overview.md` mermaid node ids must exist before `NODE_TO_SLUG` can map
them, and `docs/adr/` files must exist before `ADRS` can index them. Do `overview.md` and any ADRs
first, then derive the registries.

## The dependency DAG (read this first)

```
Phase-0 inventory ─┬─► CONTEXTS         (order = judgement; drives nav + prev/next)
                   ├─► GLOSSARY_SOURCES (mechanical: one per CONTEXT.md found)
                   └─► REFERENCES       (mostly mechanical; agent-context + reference groups)
CONTEXT-MAP cluster headings ─► contextSlugByName  (SEMANTIC synonym map — AUTHOR it. Cluster
                                  headings like "Order Capture & Checkout" map to slugs like
                                  "ordering" with little/no string overlap. A string-matcher yields
                                  empty contextToAdrs and silently drops every ADR chip.)
overview.md (AUTHORED FIRST) ─► NODE_TO_SLUG  (read node ids back out. A context can legitimately
                                  have a registry entry with NO node on the map, so you cannot
                                  generate this from the context list — keys come from the authored
                                  map. A key with no backing node is harmless-but-dead.)
docs/adr/* ─► ADRS                 (mechanical: one row per NNNN-*.md file)
context warrants 3rd zoom level ─► SUBMODULES  (empty by design in v1)
```

---

## 1. `CONTEXTS` — the spine of the sidebar

Shape: `{ slug, name, file, status }`, one per context page. **Order is load-bearing** — it drives
sidebar order and prev/next.

- One entry per context from the Phase-0 inventory.
- `slug`: kebab-case, stable, used in routes. `name`: human label.
- `file`: path to the context page, e.g. `contexts/04-issuance.md`. The numeric prefix encodes order;
  keep it consistent with the array order.
- `status`: **`stub` for every entry in v1** (bodies aren't authored yet). v2 promotes to `draft`/`exemplar`.
- Ask the user to confirm the order — it's a judgement call (usually most-foundational or
  highest-blast-radius first), not derivable mechanically.

## 2. `SUBMODULES` — 3rd zoom level

Shape: `{ slug: "parent/child", parent, name, file }`. **Empty `[]` in v1** unless sub-module pages
already exist. v2 adds these when a context warrants a state machine / webhook contract / specialised
flow page. The parent context page needs no change when a submodule is added.

## 3. `GLOSSARY_SOURCES` — what feeds the hover-glossary

Shape: `{ source, url }`, one per `CONTEXT.md` to harvest terms from. `url` is **repo-root-relative**.

- Single-context: one entry, `/CONTEXT.md`.
- Multi-context: `/CONTEXT.md` plus one per package, e.g. `/packages/api/CONTEXT.md`,
  `/packages/irec/CONTEXT.md`. Derive directly from the list of CONTEXT.md files Phase 1 produced —
  glob `**/CONTEXT.md` (excluding node_modules) and map each to a root-relative url.

## 4. `REFERENCES` — sidebar entries below the contexts, two groups

- `agent-context` group: the root agent docs (`CLAUDE.md`/`AGENTS.md`, `CONTEXT-MAP.md`) **and** every
  per-package `CONTEXT.md`, named by repo-relative path so an agent can match by path. Derive from the
  same glob as `GLOSSARY_SOURCES` plus the root agent file Phase 1a edited.
- `reference` group: the fixed special routes — `_adrs`, `_codegraph` (only if the graph is enabled),
  diagnostics. Mostly static; drop `_codegraph` if Phase 2d is skipped.

## 5. `ADRS` — the manual ADR index

Shape: `{ num, slug, title }`, one per ADR. There is no server directory listing, so this array is the
index — **a row must be added whenever an ADR is added.**

- Derive by globbing `docs/adr/NNNN-*.md` (excluding `0000-template.md`).
- `num` = the four-digit prefix; `slug` = the filename slug; `title` = the ADR's `#` H1 or frontmatter
  title. This one *is* safely auto-derivable — script it.

## 6. `NODE_TO_SLUG` — clickable system map (the fiddly one)

Shape: a map of mermaid node id → context slug. It makes nodes on `overview.md`'s top-level diagram
navigate to their context.

- **Requires `overview.md` to exist first**, with a mermaid diagram whose node ids you control.
- For each node id in that diagram, map to the matching `CONTEXTS` slug. There is no way to derive this
  without reading the diagram — author `overview.md` (start from `examples/overview.md`), name the nodes
  to match your contexts, then build the map by hand.
- If you ship `overview.md` with the bundled placeholder nodes and forget to remap, clicking the system map
  navigates nowhere. Verify every node id appears as a key.

## 7. Brand label

A single string (the product/repo name shown in the SPA header). Plain string replace at its two
sentinels (title + sidebar).

## 8. Theme (project styling) — `SKILL: replace theme`

The `:root` design tokens carry the **example** palette, not the project's. Substitute them with the
target project's colors/fonts — see `references/theming.md` for the token list, how to derive them
(existing CSS vars / Tailwind theme / brand guide, else ask), and the two non-token colors (mermaid
`classDef`s, code-drawer bg) to handle separately. The line-highlight band already uses
`var(--primary-soft)`, so it follows the theme automatically.

## Code drawer — file references open to the right

No substitution needed; just author links correctly. A markdown link whose href is a repo-root file
path under a `CODE_PREFIXES` entry **with a recognised code extension** (`CODE_EXTS`) opens the
right-hand code drawer at the exact `#L42` / `#L42-L51` lines, closes on click-outside / Esc, and
offers a VS Code deep-link. Links to context pages or bare directories/modules navigate normally
instead. If the project uses a language not in `CODE_EXTS`, add its extension there (Prism's autoloader
highlights it). Serve the **repo root** (`pnpm documentation`) or `/packages/...` paths 404.


---

## `contextSlugByName` (in `tooling/docs-meta.mjs`)

Not a SPA registry — a synonym table in the meta generator that maps **cluster-map names** →
**context slugs**, so ADR chips land on the right context pages.

- The generator parses `CONTEXT-MAP.md`'s cluster map: it keys off `- **Name**` … `**ADRs:**` … with
  four-digit numbers, under a heading containing "cluster map". Your `CONTEXT-MAP.md` (Phase 1b) must
  match that exact shape or the chips won't generate.

> **VERIFIED GOTCHA — cluster entries must be ONE physical line.** The parser is line-based: it reads
> the `- **Name**` line and searches for `**ADRs:**` *on that same line*. If the entry wraps so the
> `**ADRs:**` part sits on the next line, the ADRs are **silently dropped** — `contextToAdrs` comes back
> empty and every context page loses its ADR chips with no error. The source `setup-knowledge-bank.md`
> playbook's own example (its lines ~127–131) shows a wrapped entry, which would mislead an author into
> writing exactly the broken format. Keep each cluster bullet on a single unwrapped line. Confirmed by
> running the real `docs-meta.mjs` against the test fixture: wrapped → `0 contexts`; single-line → all
> three contexts resolved.
- Build one entry per cluster: the cluster **Name** as it appears in `CONTEXT-MAP.md`, **lowercased**
  (the parser does `nameMatch[1].trim().toLowerCase()` before lookup, so keys MUST be lowercase or the
  match silently fails), → the `slug` from `CONTEXTS`. Cluster names rarely equal slugs verbatim, which
  is why the synonym table exists — fill it deliberately. Multiple aliases mapping to one slug is fine
  (e.g. map both "billing" and "billing & invoicing" → `billing`).

> Aside (optional code graph): `assets/docs-graph.mjs` hardcodes `CODE_DIRS = ["packages/", "apps/",
> "ops/", "tooling/", "turbo/"]`. If you enable the graph in a non-monorepo or differently-laid-out
> repo, adjust that array — it's the one repo-specific spot in that file.
- **Single-context repos:** there's no cluster map; the table is trivial (one entry, or empty) and ADR
  chips come from each page's `adrs:` frontmatter instead. Confirm the generator still runs clean
  (`pnpm documentation:meta`) and writes `_meta.json`.

---

## After substitution — sanity checks

1. `pnpm documentation:meta` runs without throwing and writes `docs/architecture/_meta.json`.
2. Every `CONTEXTS` slug is reachable in the rendered sidebar.
3. The glossary drawer (`g`) lists terms — proves `GLOSSARY_SOURCES` urls resolve.
4. Clicking a node on the overview map navigates — proves `NODE_TO_SLUG` is mapped.
5. No leftover `// SKILL: replace` sentinels remain in either vendored file. Grep for them.
