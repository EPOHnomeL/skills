# Report template

The structure the synthesized report follows. Order is deliberate: the decision
comes first (an executive reader may stop after the summary), the evidence
supports it below, and the sources anchor it at the end. Fill every section from
the lens briefs — this template organises findings, it does not invent them.
Drop a section only if its lens was explicitly out of scope, and say so. See
[docs/example-report.md](../docs/example-report.md) for a worked example.

---

```markdown
# Market research: <opportunity> — <date>

## Executive summary
- **Opportunity:** <one sentence>
- **Recommendation:** <Consult | Build | Partner | Pass> — <one sentence why>
- **Overall confidence:** <High | Medium | Low>
- **The three things that matter most:** <3 bullets — the findings that drive
  the call, each traceable to a lens>

## Opportunity thesis
One paragraph, plain language: the bet the evidence supports (or the case
against betting). What has to be true for this to work, and whether the research
says it is.

## Lens findings

### 1. Market size & dynamics
- Headline (≤2 sentences).
- **Market sizing:**

  | Layer | Value | Basis / derivation | Confidence |
  | --- | --- | --- | --- |
  | TAM | | top-down and/or bottom-up arithmetic | |
  | SAM | | filters applied to TAM | |
  | SOM | | realistic 1–3yr capture | |

- Growth (CAGR + why), maturity/adoption stage, value-chain margin capture.
- Implication for the play.

### 2. Competitive landscape
- Headline.
- **Five Forces:**

  | Force | Rating | Justification |
  | --- | --- | --- |
  | Rivalry | | |
  | New entrants | | |
  | Buyer power | | |
  | Supplier power | | |
  | Substitutes | | |

- **Competitor matrix:**

  | Competitor | Positioning | Segment | Pricing model | Strength | Weakness |
  | --- | --- | --- | --- | --- | --- |

- Strategic-group map (describe the two axes and where the empty space is).
- **The seam** — the underserved position this analysis exposes.
- Implication for the play.

### 3. Customer & demand
- Headline.
- Priority segments (sized, buyer vs. user distinguished).
- **Jobs-to-be-Done:** "When [situation], I want to [motivation], so I can
  [outcome]" + the current workaround and why it underdelivers.
- Pain & urgency (painkiller vs. vitamin; evidence of active budget).
- Buying process / DMU, switching costs, sales-cycle length.
- Willingness to pay (anchors + value metric).
- Implication for the play.

### 4. Technology & solution feasibility
- Headline.
- Build vs. buy vs. partner, per capability (which parts are the moat).
- **Why now** — the specific enabler(s) that make this newly viable.
- Capability map: table stakes vs. hard/differentiating.
- Readiness (production-proven vs. research), build complexity, data reality.
- Implication for the play.

### 5. Regulation, risk & macro
- Headline.
- PESTEL factors that materially move this market (direction + source each).
- Regulation/standards a solution must clear (and any that are a moat).
- Macro & timing (why-now / why-not-yet).
- Implication for the play.

## SWOT (from Yknot's vantage)

| | Helpful | Harmful |
| --- | --- | --- |
| **Internal (Yknot)** | Strengths | Weaknesses |
| **External (market)** | Opportunities | Threats |

Each cell traces to a lens finding above.

## Risk register

| Risk | Category | Likelihood | Impact | Mitigation / early signal |
| --- | --- | --- | --- | --- |

Sorted by likelihood × impact; the top three feed the recommendation's caveats.

## Recommendation — the Yknot play
- **Call:** Consult / Build / Partner / Pass.
- **Reasoning:** the chain from findings to call.
- **If we act:** the wedge — the segment, position, or capability to lead with.
- **Confidence & caveats:** overall confidence and the conditions that would
  change the call.
- **What would raise confidence:** the specific research/validation to do next
  (the gaps the lenses flagged).

## Sources & confidence
Consolidated, de-duplicated across all lenses.

| # | Source | Lens(es) | What it supported | Date | Confidence |
| --- | --- | --- | --- | --- | --- |

Note any source used by multiple lenses (not independent corroboration) and any
material gap where no adequate source was found.
```

---

## Filling notes

- **Lead with the decision.** The executive summary states the call up front;
  don't bury it under a market-size preamble.
- **Numbers show their work.** Every market size, growth rate, or price point
  either shows its derivation inline or cites a source in the appendix. No
  free-floating figures.
- **Thin is honest.** If a lens found little, the section says "limited public
  data; here's what exists and what's missing" — it does not pad to match the
  others.
- **The matrix names names.** Real competitors and products, not "Vendor A."
- **Confidence is everywhere material.** Tag claims; make the overall confidence
  no stronger than the weakest link in the argument that leads to the call.
