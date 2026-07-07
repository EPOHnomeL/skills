---
name: thermo-nuclear-code-quality-review
description: Run an extremely strict maintainability review for abstraction quality, giant files, and spaghetti-condition growth. Use for a thermo-nuclear code quality review, thermonuclear review, deep code quality audit, or especially harsh maintainability review.
disable-model-invocation: true
---

# Thermo-Nuclear Code Quality Review

An unusually strict maintainability review of the current branch's changes. Above all it hunts **code judo**: a restructuring that preserves behaviour while making the implementation dramatically simpler, smaller, and more direct — the move that makes whole branches, helpers, modes, or layers disappear, so the change feels inevitable in hindsight. Do not stop at local cleanup; prefer deleting complexity to rearranging it.

Seed the audit with this prompt:

> Perform a deep code quality audit of the current branch's changes.
> Rethink how to structure / implement the changes to meaningfully improve code quality without impacting behavior.
> Improve abstractions and modularity, reduce spaghetti, improve succinctness and legibility.
> Be ambitious: if there is a clear path to a better implementation that involves restructuring some of the codebase, go for it.
> Be extremely thorough and rigorous. Measure twice, cut once.

## Review dimensions

Judge every meaningful change against each dimension below. Each pairs the smell to catch with the remedy to push — flag the smell aggressively, and push the remedy rather than accepting a merely tidier version of the same messy idea.

1. **Code judo (the ambitious default).** For each change ask: is there a reframing that makes whole branches, concepts, or helper layers unnecessary? Push for the version that _deletes_ complexity — a simpler state model, a different ownership boundary, a default flow with fewer exceptions — over one that spreads the same complexity around. Phrase: `i think there's a code-judo move here that makes this much simpler. can we reframe this so these branches disappear?`

2. **File size.** A PR pushing a file from under 1000 lines to over is a presumptive blocker. Push to decompose first — extract helpers, subcomponents, modules — and waive only for a compelling structural reason with the result still clearly organized. Phrase: `this pushes the file past 1k lines. can we decompose this first?`

3. **Spaghetti growth.** Be highly suspicious of ad-hoc conditionals, scattered special cases, and one-off branches bolted onto unrelated flows — a design problem, not a style nit. Push the logic into a dedicated abstraction, helper, state machine, or policy object. Phrase: `this adds another special-case branch into an already busy flow. can we move this behind its own abstraction?`

4. **Directness over magic.** Treat brittle, ad-hoc, or "magic" behaviour as a quality problem. Be skeptical of generic mechanisms that hide simple data-shape assumptions, and flag thin wrappers, identity abstractions, or pass-through helpers that add indirection without buying clarity. Phrase: `this abstraction seems unnecessary. can we just keep the direct flow?`

5. **Type & boundary cleanliness.** Question unnecessary optionality, `unknown`, `any`, or cast-heavy code where a clearer type boundary could exist. When a branch relies on a silent fallback to paper over an unclear invariant, push to make the boundary explicit instead. Phrase: `why does this need a cast / optional here? can we make the boundary more explicit instead?`

6. **Canonical layer & reuse.** Call out feature logic leaking into shared paths, implementation details leaking through APIs, and bespoke one-offs that duplicate a canonical helper. Push code toward the package/module that already owns the concept. Phrase: `this looks like a bespoke helper for something we already have. can we reuse the canonical one?`

7. **Orchestration & atomicity.** Flag independent work serialized for no reason, and related updates that can leave state half-applied. Push for parallel execution where it also simplifies, and for a more atomic structure where partial state would be hard to reason about — without over-indexing on micro-optimizations.

## Output

Prioritise findings structural-first:

1. Structural regressions and missed code-judo simplifications
2. Spaghetti / branching-complexity increases
3. Boundary, type-contract, and abstraction problems that obscure the real design
4. File-size / decomposition concerns
5. Remaining modularity and legibility issues

Prefer a few high-conviction comments over a long list of cosmetic nits. Do not approve on "it works" alone: any dimension regressing is a presumptive blocker the author must justify. Leave explicit, actionable feedback pushing for the cleaner decomposition.

## Tone

Direct, serious, demanding — not rude. Do not soften a major maintainability issue into a mild suggestion; if a change makes the codebase messier or misses an obvious dramatic simplification, say so plainly. More calibration phrases:

- `this works, but it makes the surrounding code more spaghetti. let's keep the behavior and restructure the implementation.`
- `this feels like feature logic leaking into a shared path. can we isolate it?`
- `this refactor moves complexity around, but doesn't really delete it. is there a way to make the model itself simpler?`
