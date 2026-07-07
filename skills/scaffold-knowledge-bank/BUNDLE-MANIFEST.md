# Bundle manifest — final (v1)

All assets vendored and verified.

## assets/ (the reference repo machinery — vendored, sentinel-marked)
| File | Seams marked `SKILL: replace` |
| --- | --- |
| `index.html` | CONTEXTS, SUBMODULES, GLOSSARY_SOURCES, REFERENCES, ADRS, NODE_TO_SLUG, brand×2, CODE_PREFIXES (9 markers) |
| `docs-meta.mjs` | contextSlugByName |
| `docs-graph.mjs` | CODE_DIRS (optional) |
| `docs-check.mjs` | surface seam: ROOT_FILES/DOC_DIRS/CONTEXT_GROUPS/EXTRA_FILES (optional CI gate, locally authored — not in the upstream refresh set) |
| `docs-check.test.mjs` | none (repo-agnostic; builds tmp trees) |
| `docs-index-redirect.html` | none (root redirect) |

## references/  CONTEXT-FORMAT.md · ADR-FORMAT.md · authoring-conventions.md · registry-substitution.md · phase-0-inventory.md · phase-2-infra.md · testing-notes.md · ci-reference-check.md
## examples/    exemplar-context.md · overview.md
## scripts/     refresh-spa.mjs  (re-vendor from upstream; `node scripts/refresh-spa.mjs --ref <stable-ref>`)
## tests/       fixture-repo/ · run-gate-a.sh  (Gate A passes: contextToAdrs correct, surfaces serve 200)
## root         SKILL.md · PROVENANCE.md

## Verified this build
- SPA module passes `node --check` after sentinel insertion (markers are comments; script intact).
- `refresh-spa.mjs --from-local` reproduces all shipped assets (script is authoritative).
- `tests/run-gate-a.sh` → GATE A PASS.

## Open / deferred
- Gate B (browser render) — Playwright vs manual visual: your pick (recommend manual now).
- Re-pin to a stable `main`/`dev` SHA when refreshing from upstream.
- v2 `populate-knowledge-bank`: Phase 3 authoring + Phase 4 dogfooding + bundle `doc-sync`.
