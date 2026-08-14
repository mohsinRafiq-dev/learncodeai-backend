# Verified Generation Subsystem

Closed-loop AI content generation: **no AI-produced code reaches a learner until
it has been executed in the sandbox.**

Most AI learning tools call a model and render the response. When the model
emits code that does not compile, the student sees it anyway — and on a teaching
platform, a broken example is worse than no example, because the learner cannot
tell whether the mistake is theirs. This subsystem closes that loop by treating
the platform's existing execution sandbox as a verifier.

---

## Pipeline

```
                prompt
                   |
      [1] retrieve  |  BM25 over the platform's own curriculum
                   v
             grounded prompt  ---------> [SOURCE n] citations
                   |
      [2] generate |  LLM (Gemini / OpenAI, with failover)
                   v
             markdown + fenced code blocks
                   |
      [3] extract  |  classify runnable vs illustrative
                   v
            +--- for each runnable block ---+
            |                               |
            |   execute in sandbox          |
            |          |                    |
            |     pass? --yes--> keep       |
            |          |                    |
            |          no                   |
            |          v                    |
            |   feed real diagnostic        |
            |   back to the model           |
            |          |                    |
            |          v                    |
            |   regenerate (<= N attempts)  |
            +-------------------------------+
                   |
                   v
        content + per-block verification record
```

## Modules

| File | Responsibility |
|---|---|
| `aiProvider.js` | Unified LLM interface. Retries with backoff, cross-provider failover, usage accounting. Replaces the duplicated `geminiService`/`openaiService` pair. |
| `retrievalService.js` | BM25 retrieval over the seeded curriculum (108 documents). Zero dependencies, deterministic. |
| `codeBlockExtractor.js` | Pulls fenced blocks out of markdown and decides which are executable. Wraps bare C++ fragments into a translation unit. |
| `executionVerifier.js` | Runs a snippet through the sandbox and classifies the verdict. Separates code failures from infrastructure failures. |
| `verifiedGeneration.js` | The orchestrator. Owns the repair loop and computes the metrics. |
| `verifiedTutorialService.js` | Tutorial-shaped wrapper. Drop-in replacement for the old `geminiService.generateTutorial`. |

## Design decisions worth defending

**BM25 rather than embeddings.** Deterministic (the same query returns the same
passages every run, so groundedness numbers are comparable across experiments),
dependency-free, and competitive on programming queries, which are dense in
exact identifiers (`__init__`, `std::vector`, `useEffect`). The scoring function
is isolated in `#score()`, so a dense backend can be added behind the same
interface.

*Known limitation:* purely lexical matching collides on overloaded terms. The
query "base case in recursion" retrieves "Inheritance and Virtual Functions",
because "base" matches "base class". This is the standard motivation for hybrid
lexical + dense retrieval, and is the clearest next improvement.

**Not every fenced block is executed.** Expected-output dumps, shell commands,
and deliberate "don't do this" counter-examples are detected and excluded. If
they were executed, the reported pass rate would be wrong in the pessimistic
direction, and the repair loop would waste tokens "fixing" code that was
supposed to fail.

**Infrastructure failures are excluded from the denominator.** A sandbox outage
is not a model failure. `executor_unavailable` is a terminal verdict: it never
triggers a repair attempt, and those snippets are removed from the pass-rate
denominator rather than counted as failures. Conflating the two would inflate
the apparent benefit of the repair loop.

**Repair runs at low temperature (0.2).** Repair is a precision task, not a
creative one. Generation stays at the caller's temperature.

**The loop stops early when a repair returns unchanged code.** Further attempts
against an unchanged snippet are unlikely to help and cost tokens.

## Metrics

Emitted per request and persisted to `GenerationTrace`:

| Metric | Meaning |
|---|---|
| `judgedBlocks` | Runnable snippets the sandbox returned a verdict for. The denominator. |
| `firstTryPassRate` | % that ran on the model's first attempt — i.e. what the learner would have received *without* this pipeline. |
| `finalPassRate` | % that ran after the repair loop — what the learner actually receives. |
| `repaired` | Snippets rescued by the loop. |
| `repairAttempts` | Extra model calls spent on repair (the cost side of the trade). |

The gap between `firstTryPassRate` and `finalPassRate` is the contribution.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | — | At least one required. |
| `AI_PROVIDER_ORDER` | `gemini,openai` | Primary provider first; the rest are failover. |
| `AI_MAX_RETRIES` | `3` | Per-provider retry budget. |
| `AI_MAX_REPAIR_ATTEMPTS` | `2` | Repair attempts per snippet. |
| `CODE_EXEC_BACKEND` | `docker` | `docker` \| `piston` \| `fallback`. |
| `PISTON_URL` | public instance | **Must be self-hosted** — see below. |

> **The public Piston API returns 401 as of 2026-02-15** (whitelist-only). Any
> deployment relying on it as a fallback has no working second-tier executor.
> Set `PISTON_URL` to a self-hosted instance.

> **`CODE_EXEC_BACKEND=fallback` is not sandboxed.** It shells out to `python`
> and `node` on the host. It is a development convenience only and must never
> be reachable in production.

## Running the evaluation

```bash
# Validate the harness with deterministic stubs — no API key or sandbox needed.
npm run evaluate:simulate

# Live run (requires an API key AND a working sandbox).
npm run evaluate            # full 36-task benchmark, 4 arms
npm run evaluate:quick      # 6 tasks, verified arms only
```

Results are written to `evaluation/results/` as JSON (raw) and Markdown
(report, including a two-proportion z-test and Wilson confidence intervals).

## Tests

```bash
npm run test:pure    # 78 tests, no DB or Docker required
```

Covers block classification, C++ fragment wrapping, verdict classification
(including the Piston-401 regression), the repair loop's control flow, metric
arithmetic, and the report statistics.
