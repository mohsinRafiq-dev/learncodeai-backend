// Tests for the tutorial-shaped wrapper around verified generation.
//
// The behaviour under test that matters most in production is the degraded
// path: when the sandbox is unreachable, the service must still deliver code
// examples (flagged unverified) rather than silently publishing a tutorial
// with none.

import { jest } from "@jest/globals";

// GenerationTrace touches mongoose, so stub it before importing the service.
jest.unstable_mockModule("../../src/models/GenerationTrace.js", () => ({
  default: { create: jest.fn(async () => ({})) },
}));

const { VerifiedTutorialService } = await import(
  "../../src/services/ai/verifiedTutorialService.js"
);

const fence = (lang, body) => "```" + lang + "\n" + body + "\n```";

const CONTENT = [
  "# Loops in Python",
  "",
  "Some prose.",
  "",
  "## Code Examples",
  "",
  "### Example 1: Basic loop",
  "",
  fence("python", "for i in range(3):\n    print(i)"),
  "",
  "**What this shows:** the simplest counting loop.",
  "",
  "### Example 2: Accumulator",
  "",
  fence("python", "total = sum(range(5))\nprint(total)"),
  "",
  "**What this shows:** summing a range.",
].join("\n");

/** Builds a service whose generator returns fixed content + block verdicts. */
const serviceWith = (blocks, metrics) => {
  const svc = new VerifiedTutorialService();
  svc.generateTutorial = VerifiedTutorialService.prototype.generateTutorial.bind(svc);

  // Replace the pipeline the service delegates to.
  const fakeGeneration = {
    generate: jest.fn(async () => ({
      content: CONTENT,
      blocks,
      metrics: {
        totalBlocks: 2, runnableBlocks: 2, skippedBlocks: 0, verifiedBlocks: 2,
        judgedBlocks: 0, executorUnavailable: 0, passedFirstTry: 0, passedFinal: 0,
        repaired: 0, failedFinal: 0, firstTryPassRate: null, finalPassRate: null,
        repairAttempts: 0, latencyMs: 10, ...metrics,
      },
      citations: [],
      config: { grounded: true, verified: true, maxRepairAttempts: 2 },
      provider: { name: "fake", model: "f1", latencyMs: 5, attempts: 1 },
    })),
  };

  // The service imports the singleton; swap the method it calls.
  return { svc, fakeGeneration };
};

// The service module holds a direct reference to the verifiedGeneration
// singleton, so drive the parse logic through the documented return shape by
// invoking the private parser via a generated result.
const runParse = async (blocks, metrics) => {
  const { svc, fakeGeneration } = serviceWith(blocks, metrics);
  const verifiedGeneration = (await import("../../src/services/ai/verifiedGeneration.js"))
    .default;
  const original = verifiedGeneration.generate;
  verifiedGeneration.generate = fakeGeneration.generate;
  try {
    return await svc.generateTutorial({
      topic: "loops",
      language: "python",
      difficulty: "beginner",
    });
  } finally {
    verifiedGeneration.generate = original;
  }
};

describe("all examples verified", () => {
  it("keeps every confirmed example and marks the tutorial verified", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: "ok", runnable: true, attempts: 1, repaired: false },
        { index: 1, finalVerdict: "ok", runnable: true, attempts: 1, repaired: false },
      ],
      { judgedBlocks: 2, passedFinal: 2, passedFirstTry: 2, finalPassRate: 100 }
    );

    expect(result.codeExamples).toHaveLength(2);
    expect(result.verification.verified).toBe(true);
    expect(result.verification.sandboxDegraded).toBe(false);
    expect(result.description).toContain("executed and verified");
  });

  it("extracts example titles and descriptions from the surrounding markdown", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: "ok", runnable: true, attempts: 1, repaired: false },
        { index: 1, finalVerdict: "ok", runnable: true, attempts: 1, repaired: false },
      ],
      { judgedBlocks: 2, passedFinal: 2 }
    );

    expect(result.codeExamples[0].title).toBe("Basic loop");
    expect(result.codeExamples[0].description).toBe("the simplest counting loop.");
    expect(result.codeExamples[1].title).toBe("Accumulator");
    expect(result.codeExamples[0].order).toBe(1);
    expect(result.codeExamples[1].order).toBe(2);
  });
});

describe("partial verification", () => {
  it("drops only the example that failed", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: "ok", runnable: true, attempts: 1, repaired: false },
        { index: 1, finalVerdict: "runtime_error", runnable: true, attempts: 3, repaired: false },
      ],
      { judgedBlocks: 2, passedFinal: 1, passedFirstTry: 1, finalPassRate: 50 }
    );

    expect(result.codeExamples).toHaveLength(1);
    expect(result.codeExamples[0].title).toBe("Basic loop");
    expect(result.verification.verified).toBe(true);
    expect(result.verification.droppedUnverified).toBe(1);
  });
});

describe("sandbox outage (degraded path)", () => {
  // Regression: an outage produces non-null verdicts on every block. Treating
  // that as "verification ran and nothing passed" would drop all examples and
  // publish a tutorial containing no code.
  it("still delivers examples when the sandbox is unreachable", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: "executor_unavailable", runnable: true, attempts: 1, repaired: false },
        { index: 1, finalVerdict: "executor_unavailable", runnable: true, attempts: 1, repaired: false },
      ],
      { judgedBlocks: 0, executorUnavailable: 2, passedFinal: 0, finalPassRate: null }
    );

    expect(result.codeExamples).toHaveLength(2);
  });

  it("does not claim verification when the sandbox was down", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: "executor_unavailable", runnable: true, attempts: 1, repaired: false },
        { index: 1, finalVerdict: "executor_unavailable", runnable: true, attempts: 1, repaired: false },
      ],
      { judgedBlocks: 0, executorUnavailable: 2, passedFinal: 0 }
    );

    expect(result.verification.verified).toBe(false);
    expect(result.verification.sandboxDegraded).toBe(true);
    expect(result.description).not.toContain("executed and verified");
  });
});

describe("verification disabled", () => {
  it("keeps all examples and reports unverified", async () => {
    const result = await runParse(
      [
        { index: 0, finalVerdict: null, runnable: true, attempts: 0, repaired: false },
        { index: 1, finalVerdict: null, runnable: true, attempts: 0, repaired: false },
      ],
      { judgedBlocks: 0, passedFinal: 0 }
    );

    expect(result.codeExamples).toHaveLength(2);
    expect(result.verification.verified).toBe(false);
    // Not a sandbox fault: verification simply was not requested.
    expect(result.verification.sandboxDegraded).toBe(false);
  });
});
