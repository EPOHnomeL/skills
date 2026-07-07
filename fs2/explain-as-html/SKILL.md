---
name: explain-as-html
description: Produce a self-contained, interactive HTML knowledge-transfer document explaining a code area or concept. Use when the user says "explain as html", "knowledge transfer doc", "write up this code as HTML", or invokes /explain-as-html.
argument-hint: "What code, file, package, or concept to explain"
---

Act as an expert software architect and technical writer. Produce a **single self-contained HTML file** that teaches the subject the user provided **through interaction, not prose**.

## Teaching philosophy (read this twice)

The reader learns by _doing_, not by _reading_. Prose is scaffolding; the diagrams, sliders, toggles, and live examples are where the actual explanation lives.

For every concept you would normally explain in a paragraph, ask: **can the reader discover this by clicking, dragging, or stepping through it?** If yes, build that instead of writing the paragraph. Keep prose to one or two sentences per section — just enough to frame the interaction.

## Workflow

1. **Identify the subject.** Use the user's argument. If they pointed at a path, read the relevant files first — routers, lib helpers, Prisma models, Inngest functions, callers. Trace at least one level of callers/callees before writing. Don't bluff.
2. **List the "aha" moments.** Before writing any HTML, jot down (in your head) the 3–6 things the reader must _grok_. Each one becomes an interactive widget. If you can't think of an interaction for it, you don't understand it well enough — read more code.
3. **Slugify** the subject into `<slug>` (kebab-case, ascii).
4. **Write the file** to `.scratch/explain/<slug>.html` (create the directory if missing). `.scratch/` is gitignored.
5. **Tell the user the absolute path** when done.

## Required interactive elements

At minimum the doc must contain **all** of:

- **Clickable architecture/flow diagram.** Mermaid with `click` handlers, OR an inline SVG where each node is `<g onclick>` and reveals a side-panel with the file path, what it does, and the real symbol name. The diagram is the table of contents — clicking a node jumps the reader to that node's deep-dive section.
- **Step-through walkthrough.** A "Step 1 / 2 / 3…" widget with Prev/Next buttons that highlights the active node in the diagram and swaps an explanation panel. Plain JS, no framework. The reader watches execution unfold instead of reading a numbered list.
- **At least one tunable parameter.** A slider, number input, or toggle that re-runs a small computation in-page and shows how an output changes. Examples appropriate to fs2:
  - REC matching: slider for "buyer demand vs available supply" updating a matched/unmatched count.
  - Issuance: toggle "EVIDENT vs IREC origin" flipping which account the certificate lands in.
  - Auth: toggle "session vs api-key" flipping which middleware path runs.
  - Inngest retry: slider for "attempt #" showing back-off delay.
    Pick something _real_ from the code, not a contrived demo.
- **Minimal runnable example.** A `<textarea>` or pre-filled input plus a "Run" button that executes a small pure JS function in-page (`eval`-free; just call a function you defined in `<script>`) and prints the result. Use this especially for bug explanations: pre-fill the buggy input, let the reader hit Run and see the wrong output, then a "Apply fix" toggle that swaps in the fixed function and re-runs.
- **Compare-the-versions toggle.** For bugs or refactors: a "Before / After" switch that swaps two code blocks in place, ideally with the diff highlighted (red/green background on changed lines).
- **Hover-to-reveal annotations.** Every domain term (`participant account`, `custodial trade account`, `IREC issuance`, `KYC`, `Inngest step`, etc.) wrapped in `<abbr title="…">` or a `<span class="cursor-help" data-tip="…">` so the reader gets the definition without leaving the page.

## Required sections (in this order)

1. **Header** — title, one-line subtitle, generated date, and a short "How to use this page" callout that tells the reader to click nodes, drag sliders, and hit Run.
2. **Executive Summary** — two sentences. What it does, why fs2 cares. No more.
3. **Interactive Architecture / Flow Diagram** — the clickable diagram. This is the centrepiece of the page.
4. **Step-Through Walkthrough** — the Prev/Next widget driving the diagram above.
5. **Try It** — the tunable-parameter widget(s) and the minimal runnable example. For bugs, this is where Before/After lives.
6. **Concept Deep-Dives** — one collapsible `<details>` per "aha" moment from step 2 of the workflow. Each contains a _minimal_ runnable demo or a focused sub-diagram, not paragraphs.
7. **Common Pitfalls** — each pitfall as a collapsible `<details>` with a _reproducer_: a tiny input that triggers the pitfall when the reader clicks Run, plus the fix.
8. **Source references** — table of files inspected with role and a link (`file:///` or `vscode://file/...` — pick file paths the reader can copy).

## Self-contained file requirements

The page must **look like a premium, state-of-the-art interactive dashboard that belongs in the fs2 app**. Visual excellence is paramount: use vibrant, modern palettes, dynamic theme-aware variables, soft card shadows, polished micro-animations, and complete interactive responsiveness.

The explainer page **MUST support full interactive Light and Dark Mode switching** to align with the fs2 environment's color schemes.

### Head

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;600;700&display=swap"
  rel="stylesheet"
/>

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Prism.js Syntax Highlighting Theme (VS Code / Tomorrow Night style) -->
<link
  href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css"
  rel="stylesheet"
/>

<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        fontFamily: {
          inter: ["Inter", "ui-sans-serif", "system-ui"],
          lexend: ["Lexend", "ui-sans-serif", "system-ui"],
        },
        colors: {
          background: "var(--bg-color)",
          foreground: "var(--text-color)",
          card: {
            DEFAULT: "var(--card-bg)",
            border: "var(--card-border)",
          },
          muted: {
            DEFAULT: "var(--muted-color)",
            foreground: "var(--muted-text)",
          },
          primary: {
            DEFAULT: "var(--primary-color)",
            dark: "var(--primary-dark)",
            foreground: "var(--primary-foreground)",
          },
          secondary: {
            DEFAULT: "var(--secondary-color)",
            dark: "var(--secondary-dark)",
            foreground: "var(--secondary-foreground)",
          },
        },
        boxShadow: {
          card: "var(--shadow-card)",
          glow: "0 0 15px rgba(150, 199, 72, 0.15)",
        },
        borderRadius: { DEFAULT: "0.75rem" },
      },
    },
  };
</script>

<style>
  /* Base Core Styling using dynamic Theme Variables */
  :root {
    --bg-color: #f3f9f8;
    --text-color: #484848;
    --card-bg: #ffffff;
    --card-border: #f1f1f1;
    --muted-color: #e3e3e3;
    --muted-text: #929292;

    --primary-color: #96c748;
    --primary-dark: #7aa83a;
    --primary-foreground: #ffffff;

    --secondary-color: #4e36f5;
    --secondary-dark: #432ad8;
    --secondary-foreground: #ffffff;

    --shadow-card: 0px 1px 0 rgba(0, 0, 0, 0.02),
      0px 2px 6px rgba(0, 0, 0, 0.05);

    /* State Callout Colors (dynamic variants) */
    --red-bg: rgba(247, 212, 214, 0.4);
    --red-border: #f7d4d6;
    --red-text: #c50000;

    --orange-bg: rgba(255, 239, 207, 0.4);
    --orange-border: #ffefcf;
    --orange-text: #ab570a;

    --blue-bg: rgba(211, 229, 255, 0.3);
    --blue-border: #d3e5ff;
    --blue-text: #0761d1;

    --green-bg: rgba(185, 249, 207, 0.4);
    --green-border: #b9f9cf;
    --green-text: #11843c;
  }

  .dark {
    --bg-color: #08090e;
    --text-color: #dfdfdf;
    --card-bg: #111216;
    --card-border: #222222;
    --muted-color: #333333;
    --muted-text: #666666;

    --primary-color: #96c748;
    --primary-dark: #b6e469; /* adjusted contrast for dark mode */
    --primary-foreground: #08090e;

    --secondary-color: #dde3ff;
    --secondary-dark: #cbd4ff;
    --secondary-foreground: #08090e;

    --shadow-card: 0px 4px 20px rgba(0, 0, 0, 0.4),
      0px 1px 3px rgba(0, 0, 0, 0.2);

    --red-bg: rgba(80, 0, 0, 0.4);
    --red-border: #800000;
    --red-text: #ffc1c1;

    --orange-bg: rgba(68, 29, 4, 0.4);
    --orange-border: #441d04;
    --orange-text: #fcea8b;

    --blue-bg: rgba(13, 51, 94, 0.4);
    --blue-border: #0d335e;
    --blue-text: #b5e9ff;

    --green-bg: rgba(3, 48, 22, 0.4);
    --green-border: #033016;
    --green-text: #b9f9cf;
  }

  body {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: "Lexend", ui-sans-serif, system-ui, sans-serif;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--text-color);
  }

  /* Beautiful glowing accents for sections */
  .section-accent {
    border-left: 4px solid var(--primary-color);
    padding-left: 0.75rem;
  }

  /* Micro-interactions & animations */
  .hover-card-trigger {
    transition:
      transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.2s ease;
  }
  .hover-card-trigger:hover {
    transform: translateY(-2px);
    box-shadow:
      var(--shadow-card),
      0 10px 25px -5px rgba(0, 0, 0, 0.05);
  }

  /* Mermaid Dynamic styling overrides linked to Theme CSS Variables */
  .mermaid svg {
    background: transparent !important;
  }
  .mermaid rect.node {
    fill: var(--card-bg) !important;
    stroke: var(--primary-color) !important;
    stroke-width: 2px !important;
    rx: 8px !important;
    ry: 8px !important;
    transition:
      fill 0.3s ease,
      stroke 0.3s ease !important;
  }
  .mermaid .node:hover rect {
    fill: var(--bg-color) !important;
    stroke: var(--primary-dark) !important;
    cursor: pointer;
  }
  .mermaid .edgePath .path {
    stroke: var(--muted-text) !important;
    stroke-width: 1.5px !important;
  }
  .mermaid .edgeLabel {
    background-color: var(--card-bg) !important;
    color: var(--text-color) !important;
    font-family: "Inter", sans-serif !important;
    font-size: 11px !important;
    padding: 2px 4px !important;
    border-radius: 4px !important;
  }
  .mermaid .label {
    color: var(--text-color) !important;
    font-family: "Inter", sans-serif !important;
    font-weight: 600 !important;
  }
</style>

<!-- Load Mermaid -->
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

  window.mermaid = mermaid;
  mermaid.initialize({
    startOnLoad: true,
    securityLevel: "loose",
    theme: "base",
    themeVariables: {
      primaryColor: "#96c748",
      primaryTextColor: "#111111",
      primaryBorderColor: "#7aa83a",
      lineColor: "#666666",
      secondaryColor: "#dde3ff",
      tertiaryColor: "#f1f1f1",
      fontFamily: "Inter, ui-sans-serif, system-ui",
    },
  });
</script>

<!-- Prism Core & Autoloader for crisp syntax coloring -->
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
```

`securityLevel: "loose"` is required for Mermaid `click` handlers. All page JavaScript inline in one `<script>` at the end of the `<body>` (theme toggler, interactive slider state triggers, walkthrough logic). No build step. No `eval`. No `fetch`. Must run perfectly from `file://`.

### Body / Shell

- **Shell structure**:

  ```html
  <body class="bg-background font-inter text-sm text-foreground antialiased">
    <main class="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <!-- Premium Top Header with Title and Mode Switcher -->
      <header
        class="border-card-border flex items-center justify-between border-b pb-6"
      >
        <div>
          <h1 class="font-lexend text-3xl tracking-tight text-gray-900">
            Interactive Explainer
          </h1>
          <p id="generated-meta" class="mt-1 text-xs text-muted-foreground">
            Generated YYYY-MM-DD • fs2 Core System
          </p>
        </div>
        <button
          id="theme-toggle"
          class="border-card-border bg-card inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
        >
          <!-- Moon Icon -->
          <svg
            id="theme-toggle-moon"
            class="h-4 w-4 text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <!-- Sun Icon -->
          <svg
            id="theme-toggle-sun"
            class="hidden h-4 w-4 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
          <span>Theme Toggle</span>
        </button>
      </header>

      <!-- Content sections -->
    </main>
  </body>
  ```

- **Section Card**: `<section class="bg-card rounded-lg shadow-card border border-card-border p-6 hover-card-trigger">`.
- **Section Heading**: `<h2 class="font-lexend text-2xl text-gray-900 section-accent flex items-center justify-between pb-1 mb-6">...</h2>`. Don't use a heavy plain underline — use `.section-accent` and a small padding.
- **Accents**: Use standard Tailwind config classes (`text-primary`, `bg-primary`, `ring-primary`).

### Controls

- **Primary Button**: `class="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:bg-primary-dark hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 shadow-sm"`.
- **Secondary Button**: `class="inline-flex items-center px-4 py-2 rounded-lg border border-card-border bg-card text-foreground text-sm font-semibold transition-all duration-200 hover:bg-muted/20 active:scale-95 shadow-sm"`.
- **Slider/Range Input**: `class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary"` with a live readout box styled as `<span class="px-2 py-0.5 rounded bg-muted/40 font-mono text-xs text-foreground font-semibold border border-card-border">`.
- **Theme-Compliant Pill Toggle**: Instead of generic checkmarks, use a fully animated pure CSS sliding toggle block:
  ```html
  <label class="relative inline-flex cursor-pointer select-none items-center">
    <input type="checkbox" class="peer sr-only" id="interactive-switch" />
    <div
      class="after:border-card-border peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/40 dark:peer-focus:ring-primary/20"
    ></div>
    <span class="ml-3 text-sm font-medium text-foreground">Action Mode</span>
  </label>
  ```
- **Form Labels**: `class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"`.

### Code, Diff, Callouts

- **Prism Code Block**: `<pre class="rounded-lg overflow-x-auto text-xs shadow-inner !bg-gray-900 border border-gray-800"><code class="language-javascript">...</code></pre>`. Always set the appropriate language class (e.g. `language-javascript`, `language-typescript`, `language-json`) to activate Prism's autoloader. All HTML symbols (`<`, `>`) inside code tags must be correctly escaped as `&lt;` and `&gt;`.
- **Diff highlighting**: Use `<ins class="bg-green-500/20 text-green-400 no-underline px-1 py-0.5 rounded">...</ins>` for additions and `<del class="bg-red-500/20 text-red-400 line-through px-1 py-0.5 rounded"></del>` for removals inside code snippets.
- **Info Callout**: `class="rounded-lg border border-blue-border bg-[var(--blue-bg)] text-[var(--blue-text)] p-4 flex items-start gap-3"` (using the custom theme variables).
- **Warning Callout**: `class="rounded-lg border border-orange-border bg-[var(--orange-bg)] text-[var(--orange-text)] p-4 flex items-start gap-3"`.
- **Danger Callout / Cluster Banner**: `class="rounded-lg border border-red-border bg-[var(--red-bg)] text-[var(--red-text)] p-4 flex items-start gap-3 shadow-sm animate-pulse"`.

### Layout

- **Interactive Splits**: Two-column grids for side-by-side visual walkthroughs (`grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8`).
- **State Persistence Script**: Include the standard persistence block inside `<script>` at the end of the page to save theme, active walkthrough index, and input configuration ranges:

  ```javascript
  // Persistent Theme State Handler
  const themeToggle = document.getElementById("theme-toggle");
  const toggleMoon = document.getElementById("theme-toggle-moon");
  const toggleSun = document.getElementById("theme-toggle-sun");

  function setTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      toggleMoon.classList.add("hidden");
      toggleSun.classList.remove("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      toggleMoon.classList.remove("hidden");
      toggleSun.classList.add("hidden");
    }
    localStorage.setItem("fs2-explain-theme", theme);
  }

  const currentTheme =
    localStorage.getItem("fs2-explain-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  setTheme(currentTheme);

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  });
  ```

- **Design Cleanliness**: Strictly no basic clip-art emojis, no generic primary gradient fills, and maintain uniform spacing rules (`space-y-8` sections, `p-6` card pads).

## Interaction quality bar (the most important section)

Every interaction must **change the reader's mental model**. If a reader can predict the output before clicking, the interaction is worthless — delete it.

Before you ship a widget, answer all three:

1. **What misconception does this correct, or what invariant does it reveal?** If the answer is "it shows the function works", cut it.
2. **Can the reader be wrong about the output before they interact?** If no, there's nothing to learn — the interaction is just animation.
3. **Does dragging/clicking expose a non-linearity, a threshold, a branch, or a state transition the reader wouldn't guess?** If it's a smooth `output = input * 2`, cut it.

### Trivial interactions to avoid

- A slider for "number of items" that just shows `n` rendered list items. The reader already knew that.
- A button labelled "Run" that prints `Hello, world` or echoes its input. Zero teaching value.
- A toggle that flips a label from "on" to "off" with no downstream effect.
- A diagram where clicking a node opens a panel that says "this is the X service" — the node label already said that.
- A counter that goes up. Nothing is learned.
- Identity transforms: input "5" → output "5", or input "ZAR" → output "ZAR".

### Non-trivial interactions that earn their place

- A slider for **buyer demand** against a fixed supply curve that crosses a **matching threshold** — the reader watches matched-REC count jump discontinuously when demand crosses an integer boundary, revealing that the matching engine is bucket-quantised, not continuous.
- A toggle between **EVIDENT origin** and **IREC origin** that re-routes the certificate through _different accounts_ in the diagram (participant vs custodial trade), with the receiving account highlighted — the reader discovers the routing rule by watching it switch, not by reading it.
- A "**replay this Inngest step**" button that increments an attempt counter and shows the same idempotency key being used — the reader sees that the second call is a no-op, internalising why idempotency keys exist.
- A **session vs api-key** toggle that walks the request through different middleware in the diagram and reveals that the admin-API-key path _bypasses_ the role check — the reader learns a security-relevant branch by watching the highlight skip a node.
- A **Before/After** bug reproducer where the "Before" function silently returns `null` on a falsy input and the "After" throws — the reader presses Run, sees nothing, presses "Apply fix", sees the error, and understands why error propagation matters (CLAUDE.md "Errors propagate" principle made tactile).
- A slider over **KYC status values** (`PENDING / APPROVED / REJECTED`) that re-evaluates `authProcedure` checks and shows which procedures unlock at each state — turns an enum into a state machine the reader can scrub through.
- A **counter for retry attempts** that plots Inngest's actual back-off curve (not linear), so the reader sees attempt 5 doesn't fire when they naively expected it to.

### The "would my future self thank me?" test

If a teammate landed on the page cold, would the interaction make them say _"oh — I didn't realise it worked like that"_? If yes, ship it. If they'd say _"yes, obviously"_, delete it and try again.

## Quality bar

- **No interaction is decoration.** Every widget must teach something the reader couldn't get faster from a paragraph. If a widget just animates without revealing anything, cut it.
- **Use real symbols, not placeholders.** Diagram nodes are real function/procedure/file names from the codebase. The minimal runnable example reproduces real logic (rewritten in pure browser JS — drop the Prisma/IREC/chain calls and replace with hard-coded inputs).
- **Bugs get reproducers.** If the subject is a bug or has known foot-guns (the CLAUDE.md "Gotchas"), the Pitfalls section MUST contain at least one Before/After live reproducer where the reader presses a button and sees the wrong behaviour, then sees it fixed.
- **Load-bearing clusters get a warning banner.** If the subject touches Auth, DB, IREC Issuance, On-chain, API layer, Validators, Notifications, or Inngest (see CLAUDE.md "Cluster map"), put a red-bordered callout at the top of the page that names the cluster and links the blast-radius warning text.
- **Honesty over fluency.** If you can't determine something (external API behaviour, race condition specifics), say so explicitly in the relevant deep-dive instead of inventing.
- **Zero syntax errors.** Always perform a thorough check of the generated HTML structure, CSS rules, script blocks, and text segments to ensure there are no syntax errors, unescaped characters, unclosed brackets/tags, or typos in sample code blocks before ending execution.

## Done

End your reply with the absolute path to the generated HTML file on one line, and a one-sentence summary of what it covers. Nothing else.
