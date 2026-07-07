---
name: populate-knowledge-bank
disable-model-invocation: true
description: >-
  Fill and keep current the knowledge bank that scaffold-knowledge-bank (v1) stood up: author the
  domain narrative pages from code, find where the docs fail a real reader via a doc-only dogfooding
  harness, resolve those gaps, and wire a headless weekly doc-sync routine so the docs stay in line
  with the code. Use this skill whenever the user wants to populate, fill in, author, dogfood, or
  keep-in-sync an existing interactive knowledge bank / architecture docs / CONTEXT pages — or asks for
  "self-healing docs", "docs that don't go stale", "draft the context pages from code", "find gaps in
  our docs", or "set up the weekly doc-sync". Runs AFTER scaffold-knowledge-bank (it assumes the
  infrastructure, glossary, and nav already exist). Bundles the repo-local doc-sync skill and installs
  it into the target repo.
---

# populate-knowledge-bank

v1 left a working-but-empty knowledge bank (infra + glossary + nav + minimal system map). v2 fills it
and keeps it current. **"Self-healing" is three things together — authoring, a dogfooding sweep, and
doc-sync — human-gated. It is not doc-sync alone**; sync only catches identifier drift, not behaviour
changes behind a stable signature or brand-new surfaces.

## Step 0 — Prerequisites (probe, stop loud)
- **v1 must have run:** `docs/architecture/` SPA, `CONTEXT.md`(+map), `docs/adr/`, `docs/agents/` exist.
  If not, stop — run `scaffold-knowledge-bank` first.
- **Required sub-skill:** `grill-with-docs` (resolve via `.claude/skills/` / `.agents/skills/` / global,
  per v1's gate).
- **`doc-sync` is bundled, never expected** — it's repo-local. This skill ships it in `assets/doc-sync/`
  and **installs** it into the target repo (Phase 1). Do not assume it's already present.

## Sequence — machinery is linear, content is a LOOP
Do not reorder. The weekly routine is the *output*, not the start.

### Phase 1 — Install doc-sync into the target repo (lowest risk; do first)
Apply `references/doc-sync-genericize-note.md` to `assets/doc-sync/doc-sync-skill.md` for *this* repo (most is
already genericized — placeholders, baseline marker, conditional CONTEXT-MAP/globs; you mainly confirm
the layout assumptions hold). Then write it to the target repo **as** `.agents/skills/doc-sync/SKILL.md` (the bundle stores it as `doc-sync-skill.md` so this skill itself has only one SKILL.md; the install renames it) and register it
into `.claude/skills/doc-sync/`. doc-sync has nothing to sync yet — that's fine; the weekly routine
(Phase 4) needs it *in the repo* because it runs headless against a bare checkout.

### Phase 2 — Build the dogfooding harness machinery (highest design risk; its own pass)
**Solve doc-only enforcement before anything else** — see `references/dogfooding-harness-spec.md`.
Recommended: enforce by tool-*absence* (the triager gets no read/Bash tools; the harness hands `docs/`
in). Then build triager → scorer → drift-list to the 4a contract. The scorer's checks are mechanical
(file-exists, identifier-in-schema), not LLM judgment. This builds before content exists; it can't
*run* until Phase 3 produces pages.

### Phase 3 — Author ⇄ run ⇄ resolve (a LOOP, not a gate)
1. **Author** a pass of `docs/architecture/contexts/*` (and sub-modules where depth warrants) from
   code, matching the depth of the v1 exemplar (`examples/exemplar-context.md`). Drop a
   `(verify with author: …)` tag anywhere you can't confirm from code — never guess. Parallelise one
   subagent per context for the first pass.
2. **Run** the harness over the authored pages → confirmed `DOC-GAP`s.
3. **Resolve** gaps + verify-tags, evidence-first: resolve from code (cite `file:line`); escalate
   intent/policy questions to the human via `grill-with-docs` (it updates CONTEXT.md/ADRs inline); file
   genuine bugs as issues, don't bury them in prose. `examples/dogfooding-run.md` is the worked
   template for *this* resolve step (it's a Phase 3+4b run). Bump `status` (stub→draft→exemplar) only
   when a page is genuinely gap-free.
4. Repeat. The harness needs pages to fire; authoring needs the harness to know what's good enough — they co-advance.

### Phase 4 — Weekly self-healing (LAST; only works once 1–3 exist)
Wire the installed doc-sync to run after code lands (it anchors on `.docs-sync-baseline`, not a
commit-subject heuristic) plus a periodic dogfooding sweep. `examples/routine.md` is the
headless harness. Reset expectation with the user: it bounds and surfaces drift for human merge; the
merge latency is the part that actually rots, and sync is blind to semantic drift — that's why the
periodic dogfooding sweep is part of the routine, not optional.

## Verification (headless, parallels v1 Gate A)
- **doc-sync:** `tests/baseline-marker-test.sh` (bundled) proves the baseline marker catches a code
  commit the old heuristic dropped — **PASS**. For a fuller fixture test, plant a code change + a doc
  referencing the changed identifier; assert the drift map names the right surfaces and an
  ADR-contradiction is **flagged, not edited**.
- **harness:** the testable claim is *enforcement* — assert the triager touched no non-`docs/` path (or
  had no read/Bash tools). Gap quality is judgement, not CI. **The `agentType` tool-denial can't be
  verified in this build sandbox — prototype and assert it in your environment.**
- **Gate B caveat (same as v1):** anything needing SPA render stays manual-visual.

## Bundled resources
- `assets/doc-sync/doc-sync-skill.md` — genericized, portable doc-sync (baseline-marker boundary; install into target repo).
- `references/doc-sync-genericize-note.md` — the 3-bucket swap map (confirm layout assumptions per repo).
- `references/dogfooding-harness-spec.md` — the 4a contract + doc-only enforcement design (build to this).
- `examples/dogfooding-run.md` — worked Phase 3+4b resolution run (the template for *resolving*, not finding).
- `examples/routine.md` — the headless weekly routine on the baseline marker.
- `tests/baseline-marker-test.sh` — correction-#1 regression (PASS).
- `PROVENANCE.md` — snapshot pin + refresh inputs.
