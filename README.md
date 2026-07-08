# skills

My personal [Claude Code](https://claude.com/claude-code) skills — one version-controlled source
of truth, installable into any agent with [`npx skills`](https://github.com/vercel-labs/skills).

Everything lives flat under [`skills/`](skills/), one directory per skill, so the whole set is
discoverable by the `skills` CLI. The groups below are declared in
[`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json), so `npx skills add` shows them
as selectable sections (toggle a header to grab the whole group — e.g. both knowledge-bank skills at
once). On disk it stays a flat catalog; the manifest just maps each skill to a group by path.

## Install

```sh
# Browse and pick interactively (choose skills + which agents to install into)
npx skills add epohnomel/skills

# See everything on offer without installing
npx skills add epohnomel/skills --list

# Grab specific skills
npx skills add epohnomel/skills --skill design --skill graphify

# Install one skill globally into Claude Code, no prompts
npx skills add epohnomel/skills --skill worklist -g -a claude-code -y

# Everything, everywhere (no prompts)
npx skills add epohnomel/skills --all
```

`npx skills` uses GitHub as its registry — `epohnomel/skills` resolves to this repo. Manage what's
installed with `npx skills list` and `npx skills remove <name>`.

## What's inside

**Docs & knowledge**
- `learn` — manage project learnings.
- `graphify` — turn any input (code, docs, papers, images, video) into a knowledge graph.
- `scaffold-knowledge-bank` — stand up a `docs/architecture` knowledge bank (SPA + glossary + conventions) in a repo.
- `populate-knowledge-bank` — fill and keep current the knowledge bank that scaffold stood up.

**Design & front-end**
- `design` — comprehensive design skill: brand identity, tokens, UI styling, logo generation.
- `design-system` — three-layer token architecture, component specs, slide generation.
- `brand` — brand voice, visual identity, messaging frameworks, asset management.
- `banner-design` — banners for social, ads, web heroes, print.
- `slides` — strategic HTML presentations with Chart.js, tokens, copywriting formulas.
- `ui-styling` — accessible UIs with shadcn/ui + Tailwind.
- `ui-ux-pro-max` — UI/UX design intelligence (styles, palettes, font pairings, stacks).
- `web-perf` — Core Web Vitals audit via Chrome DevTools MCP.

**Integrations**
- `turnstile-spin` — set up Cloudflare Turnstile end-to-end in a project.

**fs2 project skills** (coupled to the fs2 codebase — Prisma, Jira, `pnpm test:api`, a `dev` branch)
- `worklist` — pull my Jira work and cross-reference open PRs.
- `do` — run a single Jira BUG ticket to its next lifecycle step.
- `pull` / `push` — rebase `dev` / push via the right flow with fs2 rules.
- `test` / `test-plan` — run the fs2 suite / produce a staging test plan for a ticket or PR.
- `incident` — blameless prod post-mortem under `docs/incidents/`.
- `doc-sync` — update docs to match code landed since the last docs commit.
- `explain-as-html` — self-contained interactive HTML knowledge-transfer doc.
- `html-demo-wizard` — high-fidelity standalone HTML product demos and flow simulations.
- `thermo-nuclear-code-quality-review` — extremely strict maintainability review.

**hindi-learning project skills** (the learning-course platform — Topics, Editions, the Hub, cloud Routines)
- `grill-my-knowledge` — examiner that grills me to the edge of a domain and hands the gap list to `teach`.
- `teach` — author interactive HTML lessons for a Topic in a teaching workspace (missions, references, learning records).
- `translate` — the translate Routine: render a completed course into one target-language Edition and publish it back to the Hub.

**Admin**
- `fs-board` — build a PR board into the Obsidian vault.
- `prune-skills` — audit global skills' per-turn context load and prune the unused.

## Companion skills

A few of these orchestrate skills that don't live here (I keep only my own work in this repo).
Install the companions separately if you use the skills that call them:

- **[mattpocock/skills](https://github.com/mattpocock/skills)** — `incident` and the
  `*-knowledge-bank` skills delegate to Matt Pocock's engineering primitives (`grill-with-docs`,
  `domain-modeling`, `setup-matt-pocock-skills`). Install: `npx skills add mattpocock/skills`.
- **gstack** — `learn` runs against a `gstack` install (`~/.claude/skills/gstack/`).
- **claudekit design helpers** — `banner-design` calls sibling `ai-artist`, `ai-multimodal`, and
  `chrome-devtools` skills for image generation and screenshots.

## Provenance

Not everything here is authored by me. The design set (`design`, `design-system`, `brand`,
`banner-design`, `slides`, `ui-styling`) is vendored from **claudekit** (MIT); `graphify` and
`ui-ux-pro-max` are third-party skills I've adopted. They're kept because I intend to sharpen them
with `/writing-great-skills` — treat their upstreams as canonical until then.

## Working on the skills

This repo carries `writing-great-skills` as its **own** project skill at
[`.claude/skills/writing-great-skills/`](.claude/skills/writing-great-skills/), so
`/writing-great-skills` is available the moment you open Claude Code here — run it on anything under
[`skills/`](skills/) to tighten it.

> `writing-great-skills` is itself a [Matt Pocock](https://github.com/mattpocock/skills) skill, kept
> here only as my local authoring tool — **not** shipped in the distributed catalog. It's marked
> `metadata.internal` so `npx skills` skips it.
