# Synthesis — turning five briefs into one decision

Synthesis is the orchestrator's job and the point of the whole skill. The
sub-agents gathered evidence; synthesis is where it becomes a defensible
recommendation. Concatenating five briefs is *not* synthesis — the value is in
the cross-lens judgement the individual sub-agents couldn't make because none of
them saw the others' findings.

Work through these five moves in order.

## 1. Merge and de-duplicate sources

Combine every lens's source table into one. Then:

- **Collapse duplicates** — the same report/article cited by three lenses is one
  source, not three.
- **Flag shared origins** — two "independent" sources that both trace to the
  same analyst report are *not* independent corroboration. Agreement between
  them tells you nothing extra; mark it.
- **Rate the source base** — is the thesis resting on primary evidence
  (company filings, pricing pages, user signals) or on a single secondary
  estimate everyone repeats? This caps how high overall confidence can go.

## 2. Reconcile conflicts between lenses

The lenses overlap on purpose, so they *will* sometimes disagree. Don't paper
over it — a surfaced conflict is a finding. Common ones:

| Tension | What it usually means | How to resolve |
| --- | --- | --- |
| Big market (L1) **vs.** saturated competition (L2) | the prize is real but taken | look for the seam (L2) — is there an underserved slice, or is this a "pass"? |
| Strong stated need (L3) **vs.** no active budget (L3) | vitamin, not painkiller | downgrade urgency; the play needs a budget-holder trigger |
| Feasible to build (L4) **vs.** regulatory gate (L5) | buildable but not shippable yet | timing play — the enabler is regulatory, not technical |
| Bullish enablers (L4) **vs.** no "why now" changed (L4) | hype without a catalyst | treat "why now" as unanswered; that's a reason to wait |

For each material conflict: state it, say which lens's evidence is stronger and
why, and either resolve it or explicitly bracket it as an open question in the
report.

## 3. Assign overall confidence

Overall confidence in the opportunity thesis is **capped by the weakest link in
the chain that leads to the recommendation** — not an average. A bulletproof
market size doesn't rescue a thesis whose demand evidence is one blog post.

- **High** — the core argument's every link has multiple independent, current,
  credible sources.
- **Medium** — the core argument holds but at least one link rests on a single
  source or a reasoned inference.
- **Low** — a load-bearing link is thin, dated, or inferred. Say so plainly;
  a low-confidence "build" recommendation is a call to *validate*, not to
  commit.

## 4. Make the Yknot-play call

Choose **one** primary call. The lenses' "implication for the play" lines are
votes, not the decision — weigh them.

| Call | Choose when | Wedge to name |
| --- | --- | --- |
| **Build** | real growing market + a defensible seam + a buildable differentiator + a "why now" | the segment/capability to lead with |
| **Consult** | real demand but the value is integration/advisory, not a product; or the market's too contested to own but clients need help navigating it | the service offer |
| **Partner** | the opportunity is real but a key capability or channel sits with someone else | who, and what each side brings |
| **Pass** | small or shrinking market, saturated with no seam, pain nobody pays for, not yet buildable, or a regulatory wall | the single disqualifying finding |

State the reasoning as a chain: *market says X → competition says Y → so the
opening is Z → therefore <call>*. Attach the top two or three risks from the
register as the caveats that would change the call.

## 5. Name what would raise confidence

Every synthesis ends with the cheapest next step that would most reduce
uncertainty — the gaps the lenses flagged, prioritised by how load-bearing they
are. This turns a Medium/Low call into an action instead of a dead end, and it's
the natural bridge to the `review-red-team` and `grill-cost-estimate` handoffs.

---

## The failure modes synthesis exists to prevent

- **Additive optimism** — five separately-positive lenses do not multiply into
  certainty; the weakest link still caps confidence.
- **Laundered single sources** — one estimate repeated across lenses looks like
  consensus. De-duplication catches it.
- **Buried conflict** — the tidy report that never mentions the two lenses
  disagreed. Surface it.
- **The data dump with no call** — findings without a decision. The report must
  choose consult / build / partner / pass.
