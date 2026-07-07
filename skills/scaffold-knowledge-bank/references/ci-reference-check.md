# Reference: the docs-check CI gate (opt-in)

A small, dependency-free deterministic check that fails CI when a knowledge-bank file references
something that doesn't exist. It is the mechanical counterpart to the weekly LLM drift-sync
(populate-knowledge-bank): the script proves what a script can prove for free; the LLM pass judges
prose-vs-behaviour. **Opt-in** — like the code graph, it's off by default; add it when a repo wants
its `[x](path)` links and `file#Lnn` code-drawer references guaranteed to resolve on every PR.

## What it catches (and what it deliberately doesn't)

The knowledge bank's code drawer opens a referenced source file to exact lines. That breaks
*silently*: move a file and every link to it 404s; edit a referenced file and its `#Lnn` anchors
drift. Those two modes drift **continuously** and are exactly what a weekly grep-based LLM pass
won't reliably re-verify.

| Drift mode | Weekly LLM drift-sync | docs-check (CI) |
| --- | --- | --- |
| Prose says X, code does Y (semantic) | ✅ its core strength | ❌ can't judge meaning |
| `file#Lnn` ref points at the wrong line | ⚠️ unreliable — won't re-verify every ref | ✅ resolves every ref in ms |
| Broken `[x](path)` after a file move | ⚠️ only if the move is in its diff range | ✅ asserts target exists |

Three structural reasons it earns its place even with drift-sync running:

1. **Line refs drift continuously** — every edit to a referenced file shifts the lines the code
   drawer jumps to; a script re-checks all of them on every PR.
2. **Per-PR beats weekly** — CI fails on the PR that caused the drift (cheap, in-context) instead of
   days later in a batch.
3. **The weekly run gets cheaper and higher-signal** — it stops spending tokens re-checking link
   validity a script proves for free.

It only validates **in-repo** references. External links (`http(s)`, `mailto`, `tel`), bare
`#anchors`, and any unresolvable destination form are ignored — a false positive is worse than a
miss, because a check that cries wolf gets turned off.

## Opt in (4 steps)

1. **Vendor the two files** (they travel together; the test imports the script):
   - `assets/docs-check.mjs` → `tooling/docs-check.mjs`
   - `assets/docs-check.test.mjs` → `tooling/docs-check.test.mjs`
2. **Substitute the surface seam** in `tooling/docs-check.mjs` (see below).
3. **Add the scripts** to `package.json`:
   ```json
   "docs:check": "node tooling/docs-check.mjs",
   "docs:check:test": "node --test tooling/docs-check.test.mjs"
   ```
4. **Wire a CI job.** It's dependency-free, so it skips the project install entirely. GitHub Actions:
   ```yaml
   docs-check:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
           node-version: 20
       - run: node tooling/docs-check.mjs
       - run: node --test tooling/docs-check.test.mjs
   ```
   On other CI, the equivalent is two commands after a Node 18.20+/20 setup: run the checker, then
   the test. No `npm/pnpm install` needed.

## The surface seam

`docs-check.mjs` opens with a `// SKILL: replace` block defining which files it validates. Match it
to the knowledge bank's layout — the same surface the meta generator and the drift-sync skill walk:

```js
const ROOT_FILES     = ["CONTEXT.md", "CONTEXT-MAP.md", "CLAUDE.md", "AGENTS.md"];
const DOC_DIRS       = ["docs"];                  // walked recursively for *.md
const CONTEXT_GROUPS = ["packages", "apps"];      // monorepo */CONTEXT.md
const EXTRA_FILES    = ["ops/CONTEXT.md"];        // one-off context files
```

- **Single-context repo:** drop `CONTEXT-MAP.md` and `CONTEXT_GROUPS` (set `[]`).
- **`AGENTS.md` vs `CLAUDE.md`:** keep whichever the repo uses (listing a non-existent file is
  harmless — missing roots are skipped, not flagged).
- The defaults are forgiving: any listed root/dir/file that doesn't exist is silently skipped, so an
  over-broad list won't cause false failures — but trim it so the check covers what you actually
  document.

## The ignore marker

A file opts out entirely with `<!-- docs-check-ignore-file -->` in an HTML comment — for scaffolds
and templates whose links are illustrative placeholders. The ADR template
(`docs/adr/0000-template.md`) is the canonical case: it contains example links like
`[ADR NNNN](NNNN-slug.md)` that aren't meant to resolve. Add the marker there when you seed the
template. Explicit opt-out beats teaching the checker to guess what's a placeholder.

## Verify

```bash
node --test tooling/docs-check.test.mjs   # 8 cases, all green
node tooling/docs-check.mjs               # "no broken references found." (exit 0) on a clean bank
```
The first real failure you'll likely see is the ADR template's placeholder link — that's the signal
to add the ignore marker, not to "fix" the template.

## Provenance note

Unlike the SPA and the meta/graph generators, **docs-check is locally authored, not vendored from the
upstream snapshot** — `scripts/refresh-spa.mjs` re-vendors the four machinery files only and will not
touch it. It has no runtime dependencies and no version to pin; maintain it in-repo like any small
tool.
