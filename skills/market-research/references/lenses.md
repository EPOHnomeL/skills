# Research lenses

A market-research pass is decomposed into **five lenses**. Each lens becomes one
sub-agent (see [orchestration.md](orchestration.md)). Together they answer the
one question a software consultancy actually cares about: *is there a real,
reachable, defensible opportunity here — and should Yknot consult on it, build
into it, or walk away?*

Run all five by default. Drop or merge a lens only when the user scopes the
request narrowly (e.g. "just the competitive landscape") — and say which lenses
you skipped so the gap is visible.

| # | Lens | The question it owns | Primary frameworks |
| --- | --- | --- | --- |
| 1 | **Market size & dynamics** | How big is it, how fast is it growing, how mature is it? | TAM/SAM/SOM, S-curve/adoption stage, value chain |
| 2 | **Competitive landscape** | Who already serves this demand, how, and how well? | Porter's Five Forces, strategic-group map, feature/pricing matrix |
| 3 | **Customer & demand** | Who buys, what job are they hiring a solution for, what do they pay? | Jobs-to-be-Done, segmentation, buying-process/DMU, willingness-to-pay |
| 4 | **Technology & solution feasibility** | Can it be built, with what, and is now the time? | Build-vs-buy, tech-enabler scan, capability map, TRL/readiness |
| 5 | **Regulation, risk & macro** | What rules, standards, and external forces shape or gate it? | PESTEL, regulatory/standards scan, risk register |

The lenses deliberately overlap at the edges (pricing shows up in both
competition and demand; enablers in both feasibility and macro). Overlap is
where synthesis earns its keep — see [synthesis.md](synthesis.md). It is not
duplicated work: each lens owns the *decision* the question feeds, and reports
the adjacent fact only as context.

---

## Lens 1 — Market size & dynamics

**Owns the decision:** is the prize big enough and growing fast enough to matter?

Questions to answer:

- **TAM / SAM / SOM** — total addressable, serviceable-addressable (the slice
  reachable with a plausible offering + geography), and serviceable-obtainable
  (a realistic 1–3 year capture). Show the arithmetic and the assumptions, not
  just a headline number.
- **Growth** — CAGR over a stated horizon, and *why* it's growing or slowing
  (demand shift, regulation, tech unlock, capital cycle).
- **Maturity / adoption stage** — emerging, growth, mature, or declining;
  where on the adoption S-curve. This sets the whole tone: an emerging market
  rewards a novel build; a mature one rewards a sharper wedge or a services
  play.
- **Value chain** — who captures margin today, and where the money actually
  sits (upstream tooling, integration/services, the end application).

Method notes: build market size **bottom-up** (units × price × attach) wherever
possible and cross-check against any top-down analyst figure; never report a
single sourced number as fact without a sanity cross-check. Flag every estimate
with its derivation and confidence.

## Lens 2 — Competitive landscape

**Owns the decision:** can a newcomer win, and where is the seam?

Questions to answer:

- **Who competes** — incumbents, challengers, adjacent players moving in, and
  *substitutes* (the spreadsheet, the manual process, the in-house tool). Name
  real companies/products; do not describe an abstract "competitor A."
- **Porter's Five Forces** — rivalry intensity, threat of new entrants, buyer
  power, supplier power, substitute threat. Each force rated with a one-line
  justification, not just high/medium/low.
- **Positioning** — a strategic-group map (two axes that actually separate the
  players, e.g. breadth-of-suite × price, or self-serve × enterprise) and a
  feature/pricing matrix.
- **The seam** — the underserved segment, the capability nobody combines, the
  price point nobody hits. This is the direct input to the Yknot-play call.

## Lens 3 — Customer & demand

**Owns the decision:** is the pain real, urgent, and paid-for?

Questions to answer:

- **Segments** — who has this problem, sized and prioritised. Distinguish the
  economic buyer from the user.
- **Jobs-to-be-Done** — the functional, emotional, and social job the buyer is
  hiring a solution for; the current workaround and why it's inadequate.
- **Pain & urgency** — is this a vitamin or a painkiller? Evidence of active
  budget and search behaviour beats asserted need.
- **Buying process / DMU** — who's in the decision-making unit, sales cycle
  length, procurement gates, switching costs.
- **Willingness to pay** — pricing anchors from comparable tools, budget line
  items the spend comes out of, and the value metric buyers accept.

## Lens 4 — Technology & solution feasibility

**Owns the decision:** can *we* build a defensible solution, and is now the time?

Questions to answer:

- **Build vs buy vs partner** — what's a commodity component versus genuine
  differentiator; what can be assembled from existing platforms.
- **Enablers** — the specific tech shifts that make this newly viable (a model
  capability, an API, a cost curve, a regulation opening data). Timing lives
  here.
- **Capability map** — what the winning solution must do, and which parts are
  hard (the moat) versus easy (table stakes).
- **Readiness / TRL** — is the core approach production-proven or still
  research? What's the integration and data-availability reality?
- **Effort & moat** — rough build complexity and where durable advantage would
  come from (data, network effects, integration depth, switching cost).

This lens is where Yknot's software-engineering perspective is a genuine edge —
be concrete about stack, not hand-wavy about "AI."

## Lens 5 — Regulation, risk & macro

**Owns the decision:** what could gate, delay, or kill this regardless of merit?

Questions to answer:

- **PESTEL** — political, economic, social, technological, environmental, legal
  forces bearing on the space. Report only the factors that actually move this
  market; skip the boilerplate.
- **Regulation & standards** — the specific rules, certifications, data/privacy
  regimes, and industry standards a solution must satisfy (and any that are a
  moat because they're hard to clear).
- **Risk register** — the top risks (market, execution, regulatory,
  concentration, timing) with likelihood × impact and any mitigation.
- **Macro & timing** — capital environment, adjacent-market tailwinds/headwinds,
  and why-now / why-not-yet.

---

## Cross-lens deliverables

Two things every lens contributes to, assembled at synthesis:

- **Opportunity thesis** — one paragraph: the bet, in plain language, that the
  evidence supports (or the evidence against betting).
- **Yknot play** — the recommendation, chosen explicitly from: *consult*
  (advise a client already in the space), *build* (a novel product/solution
  Yknot could own), *partner*, or *pass*. Every lens feeds this; synthesis
  makes the call and states the confidence.
