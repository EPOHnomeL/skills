# Orchestration — running the sub-agents

This skill uses the **orchestrator → parallel sub-agents → synthesis** pattern.
The main conversation is the orchestrator; each research lens
([lenses.md](lenses.md)) runs as its own sub-agent so that (a) each lens gets a
full, uncluttered context to dig into its question, and (b) the verbose
searching stays out of the main thread — only a structured findings brief
returns.

See [DESIGN.md](../DESIGN.md) for why the skill is shaped as
orchestrator → parallel sub-agents → synthesis. This file covers the mechanics
of launching them.

## How to launch them (Claude Code)

Spawn the five lens sub-agents to **run in parallel**. In Claude Code, ask for
them explicitly in one instruction — e.g. *"Research the market-size,
competitive, customer, feasibility, and regulatory lenses in parallel using
separate sub-agents"* — so they fan out rather than run in sequence. Each is a
research task; none needs write access.

Practical limits and settings:

- **Concurrency** — the five default lenses run comfortably inside Claude Code's
  concurrent-sub-agent cap (20 by default). If you split a lens into
  sub-questions, keep total live sub-agents under the cap.
- **Model** — lens research is reasoning-heavy; let the sub-agents inherit the
  main model (the default) or set `sonnet`. Don't downgrade to `haiku` for the
  research itself.
- **Read-only** — sub-agents research; they do not write files or publish.
  Nothing in this workflow writes to an external system without the user's
  confirmation (see the skill's final step).
- **Background vs foreground** — running them in the background lets the user
  keep working; the orchestrator waits for all five completion notifications
  before synthesising. Do not synthesise from a partial set.

If the target surface has no sub-agent facility, fall back to running the five
lenses **sequentially in the main thread**, one section at a time, writing each
lens's brief to a scratch note before starting the next so context pressure
stays bounded. The output contract is identical.

## The per-lens brief (input to each sub-agent)

Give every sub-agent the same brief shape, filled in for its lens. This is what
makes the returned findings composable.

```
LENS: <name, e.g. Competitive landscape>
OPPORTUNITY: <one-line statement of the topic/opportunity under research>
CONTEXT: <who's asking and why — Yknot, a software consultancy, assessing
          whether to consult on / build into this space>
GEOGRAPHY & HORIZON: <e.g. primary market region(s); 1–3 year horizon>

YOUR QUESTIONS (own these; report adjacent facts only as context):
  - <the 3–6 questions for this lens, from lenses.md>

FRAMEWORKS TO APPLY: <the named frameworks for this lens, from frameworks.md>

OUTPUT CONTRACT — return exactly this, nothing else:
  1. Headline (≤2 sentences): the answer to this lens's core question.
  2. Findings: bullet points, each with an inline source and a confidence tag
     [High|Medium|Low]. Label inferences as inferences.
  3. Framework output: the filled framework(s) — table or worksheet.
  4. Implication for the Yknot play: does this lens argue for consult / build /
     partner / pass, and how strongly?
  5. Source table: | source | what it supported | date | confidence |
  6. Gaps: what you could not find, and what would resolve it.
```

Once all briefs return, hand off to synthesis: see
[synthesis.md](synthesis.md) for the reconciliation procedure and
[report-template.md](report-template.md) for the assembled report. Handoffs to
downstream Yknot skills are covered in the skill's final step (`SKILL.md`).
