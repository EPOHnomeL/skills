# Frameworks — quick reference

The frameworks each lens uses, compressed to what a sub-agent needs to apply
them correctly and *not misuse them*. A framework is a lens for organising
evidence, never a substitute for it: fill every cell from a real source, and
leave a cell blank (with a note) rather than inventing a plausible entry.

---

## TAM / SAM / SOM (Lens 1)

Three nested market sizes:

- **TAM** — Total Addressable Market: total revenue if every possible buyer
  bought. Ceiling, not a target.
- **SAM** — Serviceable Addressable Market: the TAM slice reachable with a
  realistic offering, geography, and channel.
- **SOM** — Serviceable Obtainable Market: what's actually winnable in 1–3
  years given competition and capacity.

Compute **two ways and reconcile**:

- *Top-down*: start from an analyst market figure, apply defensible filters
  (geography %, segment %, addressable %). Fast, but inherits the source's
  assumptions.
- *Bottom-up*: `#target_buyers × annual_contract_value × attach_rate`. Slower,
  far more defensible, and it exposes the assumptions as explicit numbers.

Always show the arithmetic. A market size with no visible derivation is a
guess wearing a suit.

## Porter's Five Forces (Lens 2)

Rate each force and, more importantly, say *why* — the justification is the
deliverable, the rating is just the index.

| Force | High when… | Reduces attractiveness because… |
| --- | --- | --- |
| Competitive rivalry | many similar players, slow growth, low differentiation | margins compete away |
| Threat of new entrants | low capital/regulatory barriers, no network effects | any advantage is temporary |
| Buyer power | few large buyers, low switching cost, easy comparison | buyers dictate price |
| Supplier power | few key suppliers (e.g. a single model/API vendor) | costs and terms set elsewhere |
| Threat of substitutes | a "good enough" alternative exists (incl. do-nothing) | caps the price ceiling |

## Strategic-group map (Lens 2)

Plot competitors on two axes that *actually separate* them (breadth × price;
self-serve × enterprise; horizontal × vertical). The empty regions are candidate
positions. Reject axes on which everyone clusters — they carry no information.

## Jobs-to-be-Done (Lens 3)

"People don't want a quarter-inch drill; they want a quarter-inch hole." Frame
the demand as a job the buyer hires a solution to do:

> When **[situation]**, I want to **[motivation]**, so I can **[expected
> outcome]**.

Capture the functional, emotional, and social dimensions, the *current* hire
(the workaround/incumbent), and why it underdelivers. The gap between the job
and the current hire is the opportunity.

## Segmentation & DMU (Lens 3)

- **Segment** by the axis that changes the buying decision (firmographic, use
  case, maturity) — not demographics for their own sake.
- **DMU / buying centre**: economic buyer, user, technical gatekeeper,
  champion, blocker. Note who holds budget and who can veto.
- **WTP anchors**: comparable tool pricing, the budget line the spend comes
  from, and the value metric (per-seat, per-usage, per-outcome) buyers accept.

## Build vs buy vs partner (Lens 4)

For each capability in the solution, classify: **commodity** (buy/integrate),
**differentiator** (build), or **leverage** (partner). The moat lives only in
the differentiators — if every capability is commodity, there is no defensible
product, only a services engagement.

## Technology-enabler scan (Lens 4)

The "why now." List the concrete shifts that make this newly feasible — a model
capability crossing a threshold, an API/platform opening up, a cost curve
bending, data becoming available, a regulation opening a market. If nothing has
changed recently, "why now" has no answer, which is itself a finding.

## PESTEL (Lens 5)

Political, Economic, Social, Technological, Environmental, Legal. Use it as a
*checklist against blind spots*, not a section to fill for its own sake — report
only factors that materially move this specific market, each with a direction
(tailwind/headwind) and a source.

## SWOT (synthesis)

Assembled at synthesis, **from the Yknot vantage point**, not the market's:
Strengths/Weaknesses are internal to Yknot's ability to play; Opportunities/
Threats are external. Each cell must trace to a lens finding — SWOT summarises,
it does not introduce new claims.

## Risk register (Lens 5 + synthesis)

Each row: risk, category (market/execution/regulatory/timing/concentration),
likelihood (L/M/H), impact (L/M/H), and a mitigation or early-warning signal.
Sort by likelihood × impact. The top three drive the recommendation's caveats.

## Confidence tagging (all lenses)

Every material claim carries a confidence marker so synthesis can weight it:

- **High** — multiple independent, credible, current sources agree.
- **Medium** — one credible source, or several that may share an origin.
- **Low** — single weak/dated source, or a reasoned inference from adjacent
  facts. Label inferences as inferences.

A low-confidence claim is not forbidden — an unmarked one is.
