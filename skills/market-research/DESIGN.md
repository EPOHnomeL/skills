# market-research — design notes

Why this skill is shaped the way it is. Read this if you're maintaining the
skill or deciding how far to trust its output; the operational detail lives in
`SKILL.md` and `references/`.

## The problem

A software consultancy (Yknot) repeatedly needs to answer the same shape of
question about a vertical or horizontal opportunity: *is there a real,
reachable, defensible market here, and should we consult on it, build into it,
or pass?* Answering it well means covering several distinct angles — market
size, competition, customer demand, technical feasibility, regulation — each of
which is a small research project in its own right. Done by one agent in one
pass, the angles crowd each other out: the context fills with search output,
early findings get forgotten, and the "analysis" degrades into whatever's still
in the window.

## The architecture: orchestrator → parallel sub-agents → synthesis

```
                         ┌─────────────────────────────┐
                         │        ORCHESTRATOR          │
                         │   (the main conversation)    │
                         │  scope · frame · fan out ·   │
                         │   reconcile · recommend      │
                         └──────────────┬──────────────┘
             fan out one sub-agent per lens (parallel, read-only)
   ┌───────────┬───────────┬───────────┬───────────┬───────────┐
   ▼           ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
│Market │  │Compet-│  │Customer│ │Feasi- │  │Regul- │
│size & │  │itive  │  │& demand│ │bility │  │ation, │
│dynamics│ │landsc.│  │(JTBD) │  │(build │  │risk & │
│(TAM..)│  │(5F)   │  │        │ │vs buy)│  │macro  │
└───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘
    └──────────┴─────┬────┴──────────┴──────────┘
       each returns ONE structured brief (findings +
       framework output + source table + confidence)
                     ▼
         ┌─────────────────────────────┐
         │   SYNTHESIS (orchestrator)   │
         │ merge sources · reconcile    │
         │ conflicts · overall confid.  │
         │ · Yknot play · report        │
         └──────────────┬──────────────┘
                        ▼
        draft report  →  confirm  →  handoff
     (review-red-team / to-envision / to-proposal)
```

Three roles, deliberately separated:

1. **Orchestrator** (main thread) — scopes the opportunity with the user,
   decides which lenses apply, writes each sub-agent's brief, then does the
   cross-lens judgement the sub-agents can't: reconciling conflicts, setting
   overall confidence, and making the recommendation.
2. **Lens sub-agents** — five parallel researchers, one per angle. Each gets a
   full, clean context to dig into exactly one question and returns a
   fixed-shape brief. They *gather and structure*; they don't *judge* the
   opportunity overall.
3. **Synthesis** — back in the orchestrator, the five briefs become one report
   with a single reconciled source table and an explicit Yknot-play call.

## Why five lenses

The five (`references/lenses.md`) are the minimal set that covers the decision
without redundancy: **size** (is the prize big?), **competition** (can we win?),
**demand** (is the pain paid-for?), **feasibility** (can we build it?), and
**regulation/macro** (what could gate it?). Drop any one and a predictable class
of expensive mistake reappears — chasing a tiny market, walking into a saturated
one, building for a pain nobody pays to solve, promising something not yet
buildable, or ignoring a regulatory wall.

The lenses overlap at the edges on purpose (pricing appears in both competition
and demand). The overlap is the raw material for synthesis: agreement across
lenses raises confidence, disagreement flags something that needs resolving
before anyone acts.

## Design decisions worth knowing

- **Parallel, not sequential.** The lenses are independent enough to run at
  once; the only join point is synthesis, which needs all briefs before it
  starts. Synthesising from a partial set is the one thing the orchestrator must
  not do.
- **A fixed output contract per lens.** Every sub-agent returns the same six-part
  brief (`references/orchestration.md`). Uniform shape is what lets synthesis
  merge five briefs mechanically instead of re-reading five essays.
- **Source traceability is mandatory, mirroring `update-reports`.** Every
  material claim carries a source and a confidence tag; synthesis builds one
  de-duplicated source table so shared sources aren't mistaken for independent
  corroboration. A number with no visible derivation doesn't ship.
- **The method is person- and topic-agnostic.** Nothing about a specific
  company, client, or vertical is baked into the skill — the opportunity is an
  input. This keeps the skill shareable across the team, the same way
  `clock-me` keeps user specifics in config.
- **It ends in a decision, not a data dump.** The deliverable is a
  *recommendation* — consult / build / partner / pass — with its confidence and
  caveats. A report that doesn't make the call hasn't finished the job.
- **Draft → confirm → handoff.** The skill never publishes or sends anything on
  its own. It produces a draft for review and offers the downstream Yknot skills
  (red-team, envision, proposal); acting on the recommendation is the user's
  call.

## Limits

- **Only as good as its sources.** Public web/market data is uneven; private
  market intelligence (analyst subscriptions, expert calls) will beat it. The
  confidence tags exist precisely so a reader knows which findings are solid.
- **Point-in-time.** A run is a snapshot. Fast-moving spaces need re-running.
- **Not a substitute for red-teaming.** Synthesis reconciles the *lenses'*
  findings; it does not adversarially attack its own conclusion. That's why the
  red-team handoff exists.
