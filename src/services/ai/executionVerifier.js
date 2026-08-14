// Executes AI-generated code in the platform's sandbox and classifies the
// outcome.
//
// codeExecutorWSService already owns the backend fallback chain
// (Docker/WS → Piston → in-process). This layer adds the part verification
// needs: a typed verdict, a compact diagnostic the repair prompt can consume,
// and optional expected-output checking.

import wsExecutor from "../codeExecutorWSService.js";
import { prepareForExecution } from "./codeBlockExtractor.js";

export const VERDICT = {
  OK: "ok",
  COMPILE_ERROR: "compile_error",
  RUNTIME_ERROR: "runtime_error",
  TIMEOUT: "timeout",
  OUTPUT_MISMATCH: "output_mismatch",
  EXECUTOR_UNAVAILABLE: "executor_unavailable",
};

// Verdicts the repair loop can plausibly fix. An unavailable executor is an
// infrastructure fault, not a code fault — retrying the model would be wrong.
const REPAIRABLE = new Set([
  VERDICT.COMPILE_ERROR,
  VERDICT.RUNTIME_ERROR,
  VERDICT.TIMEOUT,
  VERDICT.OUTPUT_MISMATCH,
]);

const EXECUTOR_FAULT_PATTERNS = [
  /docker (daemon|timeout)/i,
  /cannot connect to the docker/i,
  /executor (failed|unavailable)/i,
  /websocket error/i,
  // Any Piston HTTP status, not just 5xx: the public instance became
  // whitelist-only in Feb 2026 and now answers 401, which must be read as an
  // infrastructure fault. Classifying it as a code failure would silently
  // charge a sandbox outage to the model and inflate the measured benefit of
  // the repair loop.
  /piston error \d{3}/i,
  /whitelist only/i,
  /unsupported language:/i,
  /execution failed:/i,
  /econnrefused|enotfound|socket hang up|fetch failed/i,
];

const TIMEOUT_PATTERNS = [/timed?\s?out/i, /execution timed out/i, /infinite loop/i];

const COMPILE_PATTERNS = {
  cpp: [/error:/i, /undefined reference/i, /compilation (failed|terminated)/i, /\bfatal error\b/i],
  python: [/SyntaxError/, /IndentationError/, /TabError/],
  javascript: [/SyntaxError/, /Unexpected token/, /Unexpected identifier/],
};

const normalizeOutput = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();

class ExecutionVerifier {
  /**
   * @param {object} [deps]
   * @param {{executeCode: Function}} [deps.executor] Injected for testing.
   */
  constructor({ executor = wsExecutor } = {}) {
    this.executor = executor;
    this.stats = { runs: 0, byVerdict: {} };
  }

  /**
   * Run one snippet and classify the result.
   *
   * @param {string}  code
   * @param {string}  language          python | javascript | cpp
   * @param {object} [opts]
   * @param {string} [opts.input]           stdin
   * @param {string} [opts.expectedOutput]  when set, output is compared
   * @returns {Promise<{verdict: string, ok: boolean, repairable: boolean,
   *                    output: string, diagnostic: string|null,
   *                    wrapped: boolean, durationMs: number}>}
   */
  async verify(code, language, { input = "", expectedOutput = null } = {}) {
    const startedAt = Date.now();
    const { code: runnable, wrapped } = prepareForExecution(code, language);

    let result;
    try {
      result = await this.executor.executeCode(runnable, language, input);
    } catch (err) {
      // The executor chain normally resolves rather than throws, but a
      // rejected Docker promise can surface here as a result-shaped object.
      result =
        err && typeof err === "object" && "output" in err
          ? err
          : { output: `Executor failed: ${err?.message ?? err}`, error: true };
    }

    const durationMs = Date.now() - startedAt;
    const output = normalizeOutput(result?.output);
    const hadError = Boolean(result?.error);

    const verdict = this.#classify({ output, hadError, language, expectedOutput });
    const ok = verdict === VERDICT.OK;

    this.stats.runs += 1;
    this.stats.byVerdict[verdict] = (this.stats.byVerdict[verdict] ?? 0) + 1;

    return {
      verdict,
      ok,
      repairable: REPAIRABLE.has(verdict),
      output,
      diagnostic: ok ? null : this.#buildDiagnostic({ verdict, output, expectedOutput }),
      wrapped,
      durationMs,
    };
  }

  #classify({ output, hadError, language, expectedOutput }) {
    if (EXECUTOR_FAULT_PATTERNS.some((re) => re.test(output))) {
      return VERDICT.EXECUTOR_UNAVAILABLE;
    }
    if (TIMEOUT_PATTERNS.some((re) => re.test(output))) {
      return VERDICT.TIMEOUT;
    }

    if (hadError) {
      const patterns = COMPILE_PATTERNS[language] ?? [];
      return patterns.some((re) => re.test(output))
        ? VERDICT.COMPILE_ERROR
        : VERDICT.RUNTIME_ERROR;
    }

    if (expectedOutput != null) {
      const expected = normalizeOutput(expectedOutput);
      if (expected && expected !== output) return VERDICT.OUTPUT_MISMATCH;
    }

    return VERDICT.OK;
  }

  #buildDiagnostic({ verdict, output, expectedOutput }) {
    // Keep it tight — this goes straight into a repair prompt, and a wall of
    // stack trace crowds out the code itself.
    const trimmed = output.slice(0, 1200);

    switch (verdict) {
      case VERDICT.TIMEOUT:
        return "The code did not finish within the time limit. It most likely contains an infinite loop or unbounded recursion.";
      case VERDICT.OUTPUT_MISMATCH:
        return `The code ran, but printed the wrong thing.\nExpected:\n${normalizeOutput(
          expectedOutput
        ).slice(0, 600)}\n\nActual:\n${trimmed.slice(0, 600)}`;
      case VERDICT.EXECUTOR_UNAVAILABLE:
        return "The execution sandbox was unavailable.";
      default:
        return trimmed;
    }
  }

  getStats() {
    return structuredClone(this.stats);
  }

  resetStats() {
    this.stats = { runs: 0, byVerdict: {} };
  }
}

const executionVerifier = new ExecutionVerifier();
export { ExecutionVerifier };
export default executionVerifier;
