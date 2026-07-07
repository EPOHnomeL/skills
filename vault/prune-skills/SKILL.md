---
name: prune-skills
description: Audit your global skills' real per-turn context load, grill you on the unused ones with usage evidence, run a reversible cleanup, then offer /writing-great-skills on the survivors.
disable-model-invocation: true
---

# prune-skills

**Prune** the global skill set: cut back what's overgrown, keep what's healthy. Skills accrete —
each one you install taxes every turn, and the pile grows because adding feels safe and removing
feels risky. This skill makes removal safe (reversible) and evidence-backed (usage from transcripts),
then hands the survivors to `/writing-great-skills` to sharpen.

## The two loads (state this to the user once, up front)

Every skill costs on one of two axes. Cutting one axis without watching the other just moves the mess.

- **Context load** — a *model-invocable* skill's `name+description` sits in the window **every turn**. Measurable in tokens. This is what the headline number reclaims.
- **Cognitive load** — a *user-invoked* skill costs zero context, but **you** become the index that has to remember it exists to type it. 28 user-invoked skills is an index no human recalls.

So: **convert relocates cost, only delete erases both.** That is why the default leans delete, not convert. A skill you'll never remember to type is not "saved" by converting it — it's hidden. Delete it.

## Step 1 — Scan

Run the scanner beside this file and capture the `<SCAN>…</SCAN>` block:

```
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scan.ps1"
```

It emits header lines (`TOTAL_LOAD_TOK`, `MODEL_INVOCABLE_COUNT`, `USER_INVOKED_COUNT`, `DISABLED_SKILLS`, `DISABLED_PLUGINS`) then a TSV table: `name  category  loadTok  userInvoked  timesUsed  lastUsed  calledBy`. All token figures are `~estimates` (chars/4) — say "~est." and never present them as exact.

**Completion criterion:** you have parsed every table row into `{name, category, loadTok, userInvoked, timesUsed, lastUsed, calledBy}`. If the script errors, fix the invocation before proceeding — do not hand-improvise the scan.

## Step 2 — Assign a proposed disposition to every row

Apply these rules mechanically. `today` for "rarely" math comes from the conversation's current date.

- **Reachability guard (hard block).** `calledBy` non-empty and not `PLUGIN` ⇒ **KEEP**. Another skill invokes this one; converting or deleting it silently breaks that caller (the `banner-design → ui-ux-pro-max` failure). Flag it: "reached by <callers> — leave it."
- **`category = plugin:*`.** Not individually editable — you can only disable the whole plugin or scope it per-project. Do **not** propose editing its frontmatter. Group all rows of one plugin together; if the *whole* plugin is cold (every skill never/rarely used) ⇒ propose **DISABLE-PLUGIN** (or scope-per-project). If some are hot, propose **KEEP-PLUGIN**.
- **Personal, `never` used, not called** ⇒ **DELETE**. Strongest candidate — no evidence you've ever reached for it.
- **Personal, rarely used** (`timesUsed ≤ 2` or `lastUsed` > 60 days ago), not called ⇒ **CONVERT-OR-DELETE**: propose delete, but if it's currently model-invocable offer convert *only if the user can name when they'd type it*.
- **Personal, used often, `loadTok < 80`** ⇒ **KEEP**.
- **Personal, used often, `loadTok ≥ 80`** ⇒ **KEEP+TIGHTEN** (survivor for Step 5).
- **User-invoked (`loadTok = 0`), `never` used, not called** ⇒ **DELETE**. Reclaims no context but shrinks the cognitive index toward the router threshold. This is sediment — name it as such.

**Completion criterion:** every row carries exactly one disposition and, where a guard or plugin-grouping applied, the one-line reason.

## Step 3 — Report

Present, in this order:

1. **Headline:** current `TOTAL_LOAD_TOK` (~est.) and the **reclaimable delta** if all proposed deletes/converts/disables are applied. The delta is the hook — lead with it.
2. **The table**, sorted model-invocable-first then by `loadTok` desc, with the proposed disposition and reason per row.
3. **Footnote (labelled zero-cost):** `DISABLED_SKILLS` count + `DISABLED_PLUGINS` list — "already cost nothing; listed for disk-reclaim only, not a target."
4. **Router nudge:** if surviving user-invoked count would still exceed 15, say so and note the cure is a router skill that names them.

## Step 4 — Grill, then execute on confirm

Grill in **batches by evidence tier** — a never-used skill hasn't earned an individual interrogation; evidence already made its case. Reserve one-at-a-time dialogue for the `CONVERT-OR-DELETE` middle, where the signal is genuinely ambiguous.

- Batch the obvious: *"These N were never invoked (~X tok / index slots). Delete all, or deselect any?"*
- One-at-a-time the ambiguous: *"`<name>` — used <n>× (last <date>). Delete, or can you name when you'd type it (→ convert)?"*
- Plugins: *"The whole `atlassian` set is cold except `triage-issue`. Disable the plugin, scope it per-project, or keep?"*

Execute only what's confirmed. Every mutation is **reversible or backed up**:

- **Delete personal skill** → move its directory to `~/.claude/skills-disabled/<name>` (the established idiom on this box — 53 already live there). Never hard `rm`; a regret is one `mv` back.
- **Convert personal skill** → insert `disable-model-invocation: true` on its own line right after the `name:` line in frontmatter. Guard against double-insert (skip if already present).
- **Disable plugin** → back up `settings.json` to `settings.json.bak-<epoch>` first, then set its `enabledPlugins` entry to `false`. **Never** edit a plugin skill's frontmatter — it lives in the cache and is not yours to hand-edit.

**Completion criterion:** every confirmed disposition is applied, every skipped one is left untouched, and no plugin skill file was edited.

## Step 5 — Verify, then offer to sharpen

Re-run `scan.ps1` and print the **before → after**: `TOTAL_LOAD_TOK` and user-invoked count, with the actual reclaimed figure. This closes the loop with observed numbers, not predicted ones.

Then — and only now, after the cull is committed — list the survivors kept model-invocable with `loadTok ≥ 80` (the fat ones) and offer `/writing-great-skills` on them **one at a time, opt-in**. Tightening a description is a real editing session, not a checkbox; never auto-run it, and never sharpen a skill you were about to delete.
