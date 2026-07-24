---
name: market-research
description: Use when the user wants market research on a topic, industry, or opportunity — "do market research on <X>", "research the market for <opportunity>", "size the market for <X>", "who competes in <space>", "should we build/consult in <vertical>". Runs several sub-agents in parallel — market size, competition, customer demand, technical feasibility, and regulation/risk — each researching one lens, then synthesizes the findings into one report with an explicit consult/build/partner/pass recommendation for a software consultancy.
---

# market-research

Assess whether an opportunity is worth pursuing by researching it through five
lenses at once, then synthesizing a decision. This skill is built for a software
consultancy (Yknot) sizing up a vertical or horizontal opportunity — the output
is not a data dump, it's a recommendation: **consult** on it, **build** into it,
**partner**, or **pass**.

The engine is a fan-out: the main conversation is an **orchestrator** that
spawns one research **sub-agent per lens**, each digging into a single question
in its own clean context, then returning a fixed-shape brief. The orchestrator
reconciles the five briefs into one report. See
[DESIGN.md](DESIGN.md) for why it's built this way.

## The five lenses

Each becomes one sub-agent. Full detail in [references/lenses.md](references/lenses.md).

| # | Lens | The question it owns |
| --- | --- | --- |
| 1 | Market size & dynamics | How big is it, how fast growing, how mature? |
| 2 | Competitive landscape | Who serves this demand, how, how well? |
| 3 | Customer & demand | Who buys, what job, what do they pay? |
| 4 | Technology & feasibility | Can it be built, with what, why now? |
| 5 | Regulation, risk & macro | What rules or forces could gate it? |

## Workflow

Do these in order. Use TodoWrite to track the steps.

### 1. Scope the opportunity and confirm the framing

Pull the opportunity, geography, and horizon from the request. Before spending
research effort, confirm a one-line framing with the user and don't guess when
it's ambiguous:

- **Opportunity** — the topic/vertical/horizontal under research, stated as a
  single sentence.
- **Angle** — is Yknot considering *consulting* for clients in this space,
  *building* a novel solution, or genuinely undecided? This shapes the lenses'
  emphasis, not their existence.
- **Geography & horizon** — primary market region(s) and the time horizon
  (default: 1–3 years).
- **Depth** — a full five-lens pass, or a narrower cut (e.g. "just the
  competitive landscape")? If narrowed, name the lenses you're skipping so the
  gap is visible.

If the opportunity is a single sentence with no more detail, ask for the angle
and geography before fanning out — a mis-scoped fan-out wastes five sub-agents.

### 2. Decompose into lens briefs

Load [references/lenses.md](references/lenses.md) and
[references/frameworks.md](references/frameworks.md). For each lens in scope,
write a per-lens brief using the template in
[references/orchestration.md](references/orchestration.md) — same shape for
every lens, filled with that lens's questions, frameworks, and the shared
opportunity/geography/horizon context.

### 3. Fan out one sub-agent per lens (in parallel)

Load [references/orchestration.md](references/orchestration.md) before
launching. Spawn the lens sub-agents to run **in parallel**, each with its brief,
each **read-only** (they research; they don't write or publish). Instruct them
explicitly to run concurrently rather than in sequence.

Each sub-agent must return the six-part output contract from
`orchestration.md`: headline, findings (each with source + confidence tag),
framework output, implication for the Yknot play, source table, and gaps.

Wait for **all** in-scope lenses to return before synthesizing. Do not
synthesize from a partial set — a missing lens is a hole in the decision, not a
rounding error. If the runtime has no sub-agent facility, fall back to running
the lenses sequentially in the main thread per `orchestration.md`; the output
contract is unchanged.

### 4. Synthesize the briefs into findings

Load [references/synthesis.md](references/synthesis.md) and follow its five
moves in order — it is the single source of truth for how the briefs become a
decision. Do not concatenate the briefs; reconcile them.

### 5. Draft the report

Load [references/report-template.md](references/report-template.md) and assemble
the report in that structure: executive summary, opportunity thesis, per-lens
findings, competitive matrix, market-sizing table, SWOT, risk register, the
Yknot-play recommendation, and a consolidated sources-and-confidence appendix.

Every material claim must trace to a source in the appendix. A market size must
show its derivation. Label inferences as inferences. If a lens returned thin,
say so in that section rather than padding it.

### 6. Present for review, then offer handoffs

Present the draft in the conversation. **Never** publish it, send it, or write
it into any external system (Notion, email, Drive) without the user's explicit
confirmation — drafting is this skill's job; publishing is the user's call.

Then offer the relevant downstream Yknot handoff (don't invoke automatically):

- **review-red-team** — pressure-test the thesis and recommendation before it
  goes to a client or leadership.
- **review-novelty** — check it says something non-obvious.
- **to-envision** / **to-proposal** — if the play is *build* or *consult*,
  restructure into the client-facing Yknot format.
- **grill-cost-estimate** — if the play is *build*, size the effort behind the
  feasibility lens.

## Keep the skill shareable

The skill is the **method** and stays topic- and person-agnostic. The
opportunity, geography, and angle are inputs supplied per run — never hard-code a
specific company, client, vertical, or market into `SKILL.md` or the references.
When a run surfaces a reusable framing improvement, refine the method; when it
surfaces a fact about a specific market, it belongs in that run's report, not in
the skill.

## Source discipline

Mirror `update-reports`' evidence discipline: keep a source table while
gathering, record "couldn't find X" as a finding rather than a silent omission,
and never present an unsourced number as fact. Confidence tags (High/Medium/Low,
defined in `references/frameworks.md`) are mandatory on material claims — an
unmarked low-confidence claim is the failure mode this skill exists to prevent.
