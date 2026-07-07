# Dogfooding harness — build to this contract (Phase 4a)

The harness finds where the docs fail a real reader: hand a fresh agent a ticket, let it read **only**
`docs/`, watch where it gets stuck. Its output is a prioritised list of concrete doc defects, each tied
to a page and a real reader-task. `examples/dogfooding-run.md` is the *resolution* loop (Phase 3 + 4b),
**not** this one — do not model the gap-*finding* structure on it. Build to the contract below.

## The gate: enforce doc-only, or the whole loop is worthless
If the triaging agent can reach source, "the docs were sufficient" is unprovable. **Solve this before
building anything else.**

- **Necessary but not sufficient:** a custom `agentType` denying `Read`/`Grep`/`Glob` outside `docs/`.
  If that agent still has **`Bash`**, `cat packages/foo.ts` voids the claim. Deny or sandbox Bash and
  any MCP/file tool that can reach source too.
- **Airtight variant (recommended): enforce by tool-*absence*.** Give the triager **no** read/bash
  tools at all. The harness reads `docs/` itself and passes the content in as context. Absence is
  verifiable; path-scoping has escape hatches (Bash is exactly one). The triager cannot read source
  because it has no way to read anything it wasn't handed.

> **Not verifiable in the skill-build sandbox.** The `agentType` tool-denial is a Claude Code config
> that has to be exercised in your environment — there's no way to confirm a tool is actually denied
> from here. Prototype and assert it (see the test below) before trusting any DOC-GAP output.

## Contract

```
TRIAGER  (doc-only; no source/Bash tools — content handed in, not fetched)
  in:  one ticket  +  docs/ content (the harness reads docs/ and injects it)
  out: plan { files_to_touch, terms_and_defs_used, adrs_cited, steps }
       + DOC-GAP[]  — one per ambiguity / omission / contradiction / wrong-steer

DOC-GAP record:
  { page, anchor, kind: missing|ambiguous|contradictory|wrong-steer,
    claim_made, what_was_needed }

SCORER  (may read code; checks are MECHANICAL, not LLM judgment)
  in:  triager plan + DOC-GAP[]
  out: per item -> confirmed | refuted, with the ground-truth check run:
         - file/path the triager named actually exists?  (test -f / git ls-files)
         - enum value / identifier exists in the schema/source?  (rg in code)
         - ADR cited actually governs this area?  (grep CONTEXT-MAP cluster -> ADRs)
  confirmed DOC-GAPs -> the drift list that feeds the resolution loop (4b).
```

Only the *interpretation* of a confirmed mismatch is reasoning; the existence checks are grep-able
ground truth. (v1's lesson: deterministic assertions beat agent-judges — so don't let the scorer
"judge" whether a file exists, have it run `test -f`.)

## Tickets
Prefer real ones from the issue tracker (per `docs/agents/issue-tracker.md`). If none, synthesise one
per context from its gotchas. Fan out one triager per ticket/context; pipeline each into a scorer.

## How to test the harness (parallels v1 Gate A)
The **enforcement** is the testable claim, not gap quality:
- **Path-scoped variant:** assert the triager's tool-call log contains no read of a non-`docs/` path.
- **Airtight variant:** assert the triager was instantiated with an empty read/bash toolset.
- The scorer's checks are deterministic, so they're assertable against a fixture with a planted gap
  (a doc that names an identifier the code doesn't have → scorer must mark that DOC-GAP `refuted`, and
  a real omission → `confirmed`).
- Gap *quality* (did it find the gaps a human would?) is judgement, not CI.
