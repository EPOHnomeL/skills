---
name: test
description: Run the fs2 test suite (default `pnpm test:api`) or a user-scoped subset, optionally in the background. On failure, summarise failing tests and recommend next steps (/diagnose, /to-issues, /explain-as-html).
argument-hint: "(optional) test file path, -t pattern, or 'all' / 'chain' / 'meters' / 'ui'"
---

# /test — run fs2 tests + route failures

Run the test suite, capture results, then either confirm green or route the user to the next skill based on what broke.

## Pick the command

Argument routing:

| User input                 | Command                                            |
| -------------------------- | -------------------------------------------------- |
| _(none)_ or `all` or `api` | `pnpm test:api`                                    |
| `chain`                    | `pnpm test:chain`                                  |
| `meters`                   | `pnpm test:meters`                                 |
| `ui`                       | `pnpm test:ui`                                     |
| `services`                 | `pnpm test:with-services`                          |
| A file path                | `pnpm -F @repo/api exec vitest run <path>`         |
| A test-name pattern        | `pnpm -F @repo/api exec vitest run -t "<pattern>"` |
| Anything else              | Ask the user which scope they meant                |

Test env defaults (from CLAUDE.md): `TEST_REGISTRY=ZARECS`, `TEST_USE_REAL_BLOCKCHAIN=false`, `RANDOM_SEED` pinned. Don't change `RANDOM_SEED` unless the user is also resetting the DB.

The harness assumes a seeded local DB and a running Inngest dev server (`pnpm inngest`). If either is missing the run will fail with infra errors, not real test failures — call this out before recommending diagnosis.

## Run it (foreground vs background)

**Foreground (default for small scopes — single file, single `-t` pattern):**
Just run it via Bash and wait. Print the summary.

**Background (for full suites — `test:api`, `test:with-services`, `test:chain`):**
Run with `run_in_background: true`. Tell the user you've started it and will report when it completes. Don't poll — the harness will notify on completion.

```bash
pnpm test:api                             # foreground OK for targeted runs
# or background for the full suite
```

## On green

One line: `✔ <N> tests passed in <scope>`. Stop. Don't suggest next steps.

## On failure — route by shape

Read the vitest output and classify:

### 1 failing test, clear assertion mismatch

→ Print the failing test name, file, and the assertion diff. **Suggest `/diagnose`** as the next step. Don't propose a fix on the spot — diagnose first.

### 2–5 failing tests in the same file or feature area

→ Group and print them. **Suggest `/diagnose`** for the cluster — they likely share a root cause.

### 6+ failing tests, or failures spanning multiple unrelated areas

→ Print a categorised summary (by router / lib / package). **Suggest `/to-issues`** to break the breakage into independently-grabbable tickets, and a `/diagnose` for each cluster.

### Logic error / surprising behaviour (not infra)

A test that fails because the code does something unexpected — wrong calculation, wrong branch, wrong state transition — not because of a flaky timeout or missing fixture.
→ **Suggest `/explain-as-html`** with a subject derived from the failing flow. Useful when the user needs to understand _why_ the logic broke before fixing it.

### Infra failure (not real failure)

Symptoms: `ECONNREFUSED` on Mongo, "Inngest dev server not reachable", `PrismaClientInitializationError`, env validation errors.
→ Tell the user to check: Mongo (`docker compose up -d`), Inngest dev server (`pnpm inngest`), `.env` values. Don't recommend `/diagnose` for these — fix infra first.

## Output shape

After the run, print:

```
<scope>: <N passed> / <M failed> in <duration>

Failures:
  • <file>::<test name>
    <one-line reason>
  ...

Next: /diagnose | /to-issues | /explain-as-html  ← pick one based on shape above
```

Keep it tight. The user knows what these skills do.

## Quick reference

| Failure shape                 | Suggest                                |
| ----------------------------- | -------------------------------------- |
| 1 test, clear diff            | `/diagnose`                            |
| 2–5 same area                 | `/diagnose` (one investigation)        |
| 6+ or scattered               | `/to-issues` + `/diagnose` per cluster |
| Logic / "why is this broken"  | `/explain-as-html` first               |
| Infra (Mongo / Inngest / env) | Fix infra, re-run, no skill needed     |
| All green                     | Nothing. Stop.                         |

## Red flags — STOP

- Recommending `/diagnose` for an infra failure → user wastes time on the wrong loop
- Recommending a fix before `/diagnose` for non-trivial failures
- Changing `RANDOM_SEED` to "make tests pass" without resetting the DB → masks real failures
- Running `pnpm test` at the workspace root when you mean a single package — Turbo will run every package's `test` script and you'll wait forever
