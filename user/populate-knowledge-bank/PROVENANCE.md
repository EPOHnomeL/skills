# Provenance & refresh

The machinery assets (`assets/index.html`, `assets/docs-meta.mjs`, `assets/docs-graph.mjs`) are a
SHA-pinned snapshot of the upstream knowledge-bank system, tracked via the `refresh-spa` ritual. Don't
hand-edit the machinery — edit upstream and re-pull, or the refresh diff becomes a merge conflict.

| Field | Value |
| --- | --- |
| Source repo | `<set your source repo URL>` |
| Pinned ref (SHA) | `9aa1d25e0c9180cefff7e4f1e2c7302a9f874bf0` |
| Branch at snapshot | `<snapshot branch>` |
| Snapshot taken | 2026-06-04 |

## Refresh inputs

- **Fetch source:** pass `--repo <url>` to `scripts/refresh-spa.mjs` (no default — supply your own).
- **Files pulled:** `docs/architecture/index.html`, `docs/architecture/README.md`,
  `tooling/docs-meta.mjs`, `tooling/docs-graph.mjs` (optional).
- **Prefer a stable branch ref** (e.g. `main`/`dev`) over a one-off feature-branch SHA, which may be
  squashed/rebased away on merge.
- **Sentinel anchoring:** the refresh re-inserts `// SKILL: replace` markers on **syntactic
  landmarks** (`const CONTEXTS =`, `const NODE_TO_SLUG = {`, `const contextSlugByName = {`), never line
  numbers — an upstream refactor moves lines but not those declarations.

## Verified facts

- `NODE_TO_SLUG` has 18 entries; `overview.md`'s mermaid has 17 domain-context nodes. `identity-access`
  is in the registry + `contextSlugByName` but has no node on the current system map — confirming
  `NODE_TO_SLUG` must be read back out of an authored `overview.md`, and the registry can legitimately
  carry an entry with no backing node.
