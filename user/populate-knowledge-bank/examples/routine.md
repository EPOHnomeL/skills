# Weekly doc-sync routine (headless, scheduled)

Paste into a scheduled/headless agent (e.g. a Claude Code routine or cron). Runs against a fresh
checkout, opens **one** PR for a human to merge. Generic — set the `<BRACKETED>` values for your repo.
Built on the **`.docs-sync-baseline` marker**, never a commit-subject heuristic.

> **Prerequisite.** v1 + v2 have run, and the genericized `doc-sync` is installed in this repo at
> `.agents/skills/doc-sync/SKILL.md` **using the baseline marker** (not the old `docs:`-subject
> boundary). The cron checks out only the repo — it has no global skills. If the repo's doc-sync still
> uses the subject heuristic, this routine inherits the bug; fix the installed skill first.

```
STEP 0 — Read the rules
  Read .agents/skills/doc-sync/SKILL.md, the root agent file (CLAUDE.md or AGENTS.md), CONTEXT.md,
  and CONTEXT-MAP.md (if multi-context). Follow doc-sync exactly EXCEPT: open a PR instead of
  stopping. As-is pages (docs/architecture/**) edited freely; CONTEXT.md glossary-only; never
  auto-write/rewrite an ADR (flag instead); walk sync-chains; match scope (only this range's drift).

STEP 1 — Clean branch off the integration branch
  git fetch origin
  git checkout -B docs/weekly-doc-sync origin/<INTEGRATION_BRANCH>   # fixed name reuses ONE PR
  # rebuild from the current integration branch each week; never accumulate stale commits

STEP 2 — Range via the BASELINE MARKER (not a commit-subject heuristic)
  BOUNDARY=$(cat .docs-sync-baseline 2>/dev/null || git rev-list --max-parents=0 HEAD | tail -1)
  Extract changed identifiers in $BOUNDARY..origin/<INTEGRATION_BRANCH>; map to at-risk docs
  (symbol-grep + CONTEXT-MAP); build the DRIFT MAP.
  If empty / no genuine drift / no flags:
    -> print "No doc drift since $BOUNDARY. Nothing to do." and exit 0 (do NOT open a PR).
  # Why not "newest docs-subject commit": any interstitial docs commit (a typo fix, last week's own
  # auto-sync) advances it and silently swallows the code behind it. Proven in
  # tests/baseline-marker-test.sh.

STEP 3 — Apply doc edits (doc-sync per-surface rules)
  Edit docs in the working tree. Collect ADR-contradiction / ADR-candidate items as FLAGS — never
  edit an ADR.

STEP 4 — Commit (incl. baseline) + open/update ONE PR
  git rev-parse HEAD > .docs-sync-baseline                  # record synced point BEFORE committing
  git add <the specific doc paths> .docs-sync-baseline      # NOT git add -A
  git commit -m "docs: weekly auto-sync (<short-range>)"
  git push --force-with-lease origin docs/weekly-doc-sync   # let hooks run; do NOT use --no-verify
  gh pr list --head docs/weekly-doc-sync --state open       # else:
  gh pr create --base <INTEGRATION_BRANCH> --head docs/weekly-doc-sync \
    --title "docs: weekly auto-sync ($(date +%F))" --body-file <tmp>

  PR BODY (in order):
    ## Summary       range reviewed (BOUNDARY..origin/<INTEGRATION_BRANCH>, N commits) + surfaces touched
    ## Drift map     the full DRIFT MAP from STEP 2 (changed code area -> docs edited)
    ## Flags         every ADR-contradiction / ADR-candidate w/ SHA; "None." if none — human action, NOT auto-edited
    ## Review notes  docs-only PR; code-targeted reviews don't apply here — say so explicitly
```

## Hard constraints
- NEVER merge; NEVER push to the integration branch directly; a human merges.
- NEVER write/rewrite an ADR — flag only. NEVER edit code files — flag instead. Docs-only.
- `git add` the specific doc paths (+ the baseline file), never `git add -A` — a stray file in the
  checkout must not ride along.
- `--force-with-lease` reuses one PR, but **discards last week's unmerged reviewed edits** if the PR
  sat open — a stale-PR backlog is the real failure mode. Merge weekly or the routine fights you.
- If `gh`/push/hooks fail unrecoverably, STOP: print the branch, the commit SHA, and what failed;
  leave the branch clean for a human.
- Scope to this range's drift only — no refactors, no fixing pre-existing unrelated drift.

## What this does NOT do
Catches *identifier* drift (renames, signature/structure changes). Blind to **semantic** drift
(behaviour changed behind a stable signature) and **new surfaces** (a brand-new context names nothing,
so it maps to nothing). Pair with the periodic **dogfooding sweep** and **authoring**. "Self-healing"
= sync + dogfooding + authoring, human-gated — not sync alone.
