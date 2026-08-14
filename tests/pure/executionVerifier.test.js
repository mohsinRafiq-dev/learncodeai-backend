// Tests for sandbox verdict classification.
//
// The distinction that matters most here is code failure vs infrastructure
// failure. If a sandbox outage is classified as a runtime error, the repair
// loop burns tokens "fixing" code that was never broken, and the evaluation
// credits the pipeline with rescuing failures that were not the model's fault.

import { jest } from "@jest/globals";
import { ExecutionVerifier, VERDICT } from "../../src/services/ai/executionVerifier.js";

const verifierReturning = (response) =>
  new ExecutionVerifier({
    executor: { executeCode: jest.fn(async () => response) },
  });

describe("verdict vocabulary", () => {
  it("exposes the documented verdicts", () => {
    expect(Object.values(VERDICT).sort()).toEqual([
      "compile_error",
      "executor_unavailable",
      "ok",
      "output_mismatch",
      "runtime_error",
      "timeout",
    ]);
  });
});

describe("successful execution", () => {
  it("returns ok for clean output", async () => {
    const v = verifierReturning({ output: "hello", error: false });
    const r = await v.verify('print("hello")', "python");

    expect(r.verdict).toBe(VERDICT.OK);
    expect(r.ok).toBe(true);
    expect(r.output).toBe("hello");
    expect(r.diagnostic).toBeNull();
  });

  it("normalises trailing whitespace and CRLF in output", async () => {
    const v = verifierReturning({ output: "a  \r\nb   \r\n\r\n", error: false });
    expect((await v.verify("x", "python")).output).toBe("a\nb");
  });
});

describe("code failures", () => {
  it("classifies a python SyntaxError as a compile error", async () => {
    const v = verifierReturning({ output: "SyntaxError: invalid syntax", error: true });
    expect((await v.verify("x =", "python")).verdict).toBe(VERDICT.COMPILE_ERROR);
  });

  it("classifies a python NameError as a runtime error", async () => {
    const v = verifierReturning({ output: "NameError: name 'prnt' is not defined", error: true });
    expect((await v.verify('prnt("x")', "python")).verdict).toBe(VERDICT.RUNTIME_ERROR);
  });

  it("classifies a C++ compiler diagnostic as a compile error", async () => {
    const v = verifierReturning({ output: "main.cpp:3:5: error: 'cout' was not declared", error: true });
    expect((await v.verify("cout << 1;", "cpp")).verdict).toBe(VERDICT.COMPILE_ERROR);
  });

  it("classifies a C++ link failure as a compile error", async () => {
    const v = verifierReturning({ output: "undefined reference to `foo()'", error: true });
    expect((await v.verify("int main(){foo();}", "cpp")).verdict).toBe(VERDICT.COMPILE_ERROR);
  });

  it("classifies a timeout regardless of the error flag", async () => {
    const v = verifierReturning({ output: "Error: Code execution timed out (10 second limit)", error: true });
    const r = await v.verify("while True: pass", "python");

    expect(r.verdict).toBe(VERDICT.TIMEOUT);
    expect(r.diagnostic).toMatch(/infinite loop|unbounded recursion/i);
  });

  it("marks code failures as repairable", async () => {
    const v = verifierReturning({ output: "NameError: x", error: true });
    expect((await v.verify("x", "python")).repairable).toBe(true);
  });
});

describe("infrastructure failures", () => {
  // Regression: the public Piston instance became whitelist-only in Feb 2026
  // and answers 401. A pattern matching only 5xx let that through as a
  // runtime_error, which would have corrupted every evaluation run.
  it("treats a Piston 401 as an executor outage, not a code failure", async () => {
    const v = verifierReturning({
      output:
        'Piston error 401: {"message":"Public Piston API is now whitelist only as of 2/15/2026."}',
      error: true,
    });
    const r = await v.verify('print("hi")', "python");

    expect(r.verdict).toBe(VERDICT.EXECUTOR_UNAVAILABLE);
    expect(r.repairable).toBe(false);
  });

  it.each([
    ["Piston error 503: upstream unavailable"],
    ["Piston error 429: too many requests"],
    ["Cannot connect to the Docker daemon"],
    ["WebSocket error: connect ECONNREFUSED"],
    ["Execution failed: fetch failed"],
    ["Unsupported language: rust"],
  ])("treats %s as an executor outage", async (output) => {
    const v = verifierReturning({ output, error: true });
    const r = await v.verify("x", "python");

    expect(r.verdict).toBe(VERDICT.EXECUTOR_UNAVAILABLE);
    expect(r.repairable).toBe(false);
  });

  it("reports an outage when the executor throws", async () => {
    const v = new ExecutionVerifier({
      executor: {
        executeCode: async () => {
          throw new Error("socket hang up");
        },
      },
    });
    expect((await v.verify("x", "python")).verdict).toBe(VERDICT.EXECUTOR_UNAVAILABLE);
  });
});

describe("expected-output checking", () => {
  it("flags a mismatch when output differs from expected", async () => {
    const v = verifierReturning({ output: "4", error: false });
    const r = await v.verify("print(2+2)", "python", { expectedOutput: "5" });

    expect(r.verdict).toBe(VERDICT.OUTPUT_MISMATCH);
    expect(r.diagnostic).toContain("Expected:");
    expect(r.diagnostic).toContain("Actual:");
  });

  it("passes when output matches after normalisation", async () => {
    const v = verifierReturning({ output: "4\r\n", error: false });
    expect((await v.verify("print(2+2)", "python", { expectedOutput: "4" })).verdict).toBe(
      VERDICT.OK
    );
  });

  it("ignores an empty expected output rather than failing on it", async () => {
    const v = verifierReturning({ output: "anything", error: false });
    expect((await v.verify("x", "python", { expectedOutput: "" })).verdict).toBe(VERDICT.OK);
  });
});

describe("fragment wrapping", () => {
  it("reports when a C++ fragment was wrapped for execution", async () => {
    const v = verifierReturning({ output: "42", error: false });
    expect((await v.verify("cout << 42 << endl;", "cpp")).wrapped).toBe(true);
  });

  it("does not report wrapping for python", async () => {
    const v = verifierReturning({ output: "1", error: false });
    expect((await v.verify("print(1)", "python")).wrapped).toBe(false);
  });
});

describe("statistics", () => {
  it("accumulates verdict counts across runs", async () => {
    const v = verifierReturning({ output: "ok", error: false });
    await v.verify("a", "python");
    await v.verify("b", "python");

    const stats = v.getStats();
    expect(stats.runs).toBe(2);
    expect(stats.byVerdict.ok).toBe(2);
  });

  it("resets cleanly", async () => {
    const v = verifierReturning({ output: "ok", error: false });
    await v.verify("a", "python");
    v.resetStats();
    expect(v.getStats()).toEqual({ runs: 0, byVerdict: {} });
  });
});
