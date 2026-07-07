# Dogfooding / resolution run — illustrative template

> **Illustrative, not a real log.** This shows the *shape* of an author⇄run⇄resolve pass (Phase 3 +
> 4b) on the generic example domain, so you can derive the harness's resolution structure. Numbers are
> made up. Build the gap-*finding* half to `references/dogfooding-harness-spec.md` (the 4a contract).

## Run summary (example)

```
Authored:   3 context stubs -> draft   (ordering, billing, fulfillment)
Verify-tags raised:  9      ("(verify with author: …)" markers the author couldn't confirm from code)
Resolved from code:  6      (cited file:line; e.g. capture path -> packages/ordering/src/checkout.ts)
Resolved by grilling: 2     (intent/policy questions escalated via grill-with-docs; CONTEXT.md updated)
Escalated to issues:  1     (a genuine bug, filed in the tracker — not buried in prose)
Status bumped:        ordering stub->draft->exemplar; billing stub->draft; fulfillment left stub
```

## What each lane means

- **Verify-tag** — anywhere the author wrote a claim it could not confirm from the code. Never guessed;
  tagged `(verify with author: …)` and left for resolution.
- **Resolved from code** — evidence-first: open the cited source, confirm or correct, drop the tag,
  cite `file:line`. The default lane; most tags resolve here.
- **Resolved by grilling** — questions about *intent* or *policy* that the code can't answer go to the
  human via `grill-with-docs`, which writes the answer into `CONTEXT.md` / an ADR inline.
- **Escalated to issue** — a tag that turns out to be a real defect in the code/system becomes a filed
  ticket, not a doc edit. Don't paper over bugs in prose.
- **Status bump** — a page graduates `stub -> draft -> exemplar` only when it's genuinely gap-free at
  that depth. Don't bump on word count.

## How this pairs with the gap-finder (4a)

The doc-only triager (no source/Bash tools) produces `DOC-GAP`s; the mechanical scorer confirms them
against code; confirmed gaps + the author's own verify-tags form the worklist this resolution pass
burns down. See `references/dogfooding-harness-spec.md`.
