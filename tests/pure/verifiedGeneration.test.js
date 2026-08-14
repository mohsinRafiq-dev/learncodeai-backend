// Tests for the closed-loop verified generation pipeline.
//
// Provider, verifier, and retriever are all injected fakes, so these exercise
// the control flow and the metric arithmetic without API keys or a sandbox.
// The metric arithmetic is what the evaluation chapter reports, so it needs to
// be pinned down by tests rather than trusted.

import { jest } from "@jest/globals";
import { VerifiedGenerationService } from "../../src/services/ai/verifiedGeneration.js";
import { VERDICT } from "../../src/services/ai/executionVerifier.js";

const fence = (lang, body) => "```" + lang + "\n" + body + "\n```";

/** Provider that returns queued responses in order. */
const fakeProvider = (responses) => {
  const queue = [...responses];
  const calls = [];
  return {
    calls,
    complete: jest.fn(async (args) => {
      calls.push(args);
      const text = queue.length > 1 ? queue.shift() : queue[0];
      return {
        text,
        provider: "fake",
        model: "fake-1",
        latencyMs: 1,
        attempts: 1,
      };
    }),
  };
};

/** Verifier that returns queued verdicts in order, per call. */
const fakeVerifier = (verdicts) => {
  const queue = [...verdicts];
  const seen = [];
  return {
    seen,
    verify: jest.fn(async (code) => {
      seen.push(code);
      const v = queue.length > 1 ? queue.shift() : queue[0];
      const ok = v === VERDICT.OK;
      return {
        verdict: v,
        ok,
        repairable: !ok && v !== VERDICT.EXECUTOR_UNAVAILABLE,
        output: ok ? "ok" : "boom",
        diagnostic: ok ? null : `diagnostic for ${v}`,
        wrapped: false,
        durationMs: 1,
      };
    }),
  };
};

const noRetrieval = { retrieve: () => [], formatAsContext: () => "" };

const build = ({ provider, verifier, retriever = noRetrieval }) =>
  new VerifiedGenerationService({ provider, verifier, retriever });

describe("verified generation: happy path", () => {
  it("passes clean code through untouched and reports a 100% rate", async () => {
    const provider = fakeProvider([`Explanation.\n\n${fence("python", "print(1)")}`]);
    const verifier = fakeVerifier([VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "teach print", language: "python" });

    expect(verifier.verify).toHaveBeenCalledTimes(1);
    // Only the generation call: no repair was needed.
    expect(provider.complete).toHaveBeenCalledTimes(1);
    expect(result.content).toContain("print(1)");
    expect(result.metrics.firstTryPassRate).toBe(100);
    expect(result.metrics.finalPassRate).toBe(100);
    expect(result.metrics.repaired).toBe(0);
    expect(result.blocks[0].finalVerdict).toBe(VERDICT.OK);
  });
});

describe("verified generation: repair loop", () => {
  it("repairs a failing block and substitutes the fixed code into the content", async () => {
    const provider = fakeProvider([
      `Here you go.\n\n${fence("python", "prnt(1)")}`, // generation (broken)
      fence("python", "print(1)"), // repair
    ]);
    const verifier = fakeVerifier([VERDICT.RUNTIME_ERROR, VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "teach print", language: "python" });

    expect(provider.complete).toHaveBeenCalledTimes(2);
    expect(verifier.verify).toHaveBeenCalledTimes(2);

    // The broken snippet must not survive into the delivered content.
    expect(result.content).toContain("print(1)");
    expect(result.content).not.toContain("prnt(1)");

    expect(result.metrics.firstTryPassRate).toBe(0);
    expect(result.metrics.finalPassRate).toBe(100);
    expect(result.metrics.repaired).toBe(1);
    expect(result.blocks[0].repaired).toBe(true);
    expect(result.blocks[0].attempts).toBe(2);
  });

  it("feeds the real sandbox diagnostic into the repair prompt", async () => {
    const provider = fakeProvider([
      fence("python", "prnt(1)"),
      fence("python", "print(1)"),
    ]);
    const verifier = fakeVerifier([VERDICT.RUNTIME_ERROR, VERDICT.OK]);
    const svc = build({ provider, verifier });

    await svc.generate({ prompt: "x", language: "python" });

    const repairPrompt = provider.calls[1].prompt;
    expect(repairPrompt).toContain("diagnostic for runtime_error");
    expect(repairPrompt).toContain("prnt(1)");
    expect(provider.calls[1].temperature).toBeLessThan(0.5);
  });

  it("stops after maxRepairAttempts and reports the failure honestly", async () => {
    const provider = fakeProvider([
      fence("python", "bad0"),
      fence("python", "bad1"),
      fence("python", "bad2"),
      fence("python", "bad3"),
    ]);
    const verifier = fakeVerifier([VERDICT.RUNTIME_ERROR]); // never recovers
    const svc = build({ provider, verifier });

    const result = await svc.generate({
      prompt: "x",
      language: "python",
      maxRepairAttempts: 2,
    });

    // 1 initial + 2 repairs = 3 verifications.
    expect(verifier.verify).toHaveBeenCalledTimes(3);
    expect(result.blocks[0].attempts).toBe(3);
    expect(result.metrics.finalPassRate).toBe(0);
    expect(result.metrics.failedFinal).toBe(1);
    expect(result.blocks[0].repaired).toBe(false);
  });

  it("gives up early when the model returns an unchanged snippet", async () => {
    const provider = fakeProvider([fence("python", "same"), fence("python", "same")]);
    const verifier = fakeVerifier([VERDICT.RUNTIME_ERROR]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({
      prompt: "x",
      language: "python",
      maxRepairAttempts: 3,
    });

    // Verified once, repaired once, saw no change, stopped.
    expect(verifier.verify).toHaveBeenCalledTimes(1);
    expect(result.blocks[0].attempts).toBe(1);
  });
});

describe("verified generation: metric integrity", () => {
  it("excludes sandbox outages from pass-rate denominators", async () => {
    const provider = fakeProvider([
      `${fence("python", "a")}\n\n${fence("python", "b")}`,
    ]);
    // First block OK, second block hits an unavailable executor.
    const verifier = fakeVerifier([VERDICT.OK, VERDICT.EXECUTOR_UNAVAILABLE]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "x", language: "python" });

    expect(result.metrics.verifiedBlocks).toBe(2);
    expect(result.metrics.executorUnavailable).toBe(1);
    // Denominator is 1 (the judged block), so the rate is 100 and not 50.
    expect(result.metrics.judgedBlocks).toBe(1);
    expect(result.metrics.finalPassRate).toBe(100);
  });

  it("does not attempt repair on an infrastructure fault", async () => {
    const provider = fakeProvider([fence("python", "a")]);
    const verifier = fakeVerifier([VERDICT.EXECUTOR_UNAVAILABLE]);
    const svc = build({ provider, verifier });

    await svc.generate({ prompt: "x", language: "python" });

    // Generation only: no repair call was made.
    expect(provider.complete).toHaveBeenCalledTimes(1);
  });

  it("excludes non-runnable blocks from the denominator", async () => {
    const provider = fakeProvider([
      `${fence("python", "print(1)")}\n\n${fence("output", "1")}\n\n${fence(
        "bash",
        "ls"
      )}`,
    ]);
    const verifier = fakeVerifier([VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "x", language: "python" });

    expect(result.metrics.totalBlocks).toBe(3);
    expect(result.metrics.runnableBlocks).toBe(1);
    expect(result.metrics.skippedBlocks).toBe(2);
    expect(verifier.verify).toHaveBeenCalledTimes(1);
    expect(result.metrics.finalPassRate).toBe(100);
  });

  it("reports null rates rather than 0 when nothing was judged", async () => {
    const provider = fakeProvider(["Prose only, no code at all."]);
    const verifier = fakeVerifier([VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "x", language: "python" });

    expect(result.metrics.totalBlocks).toBe(0);
    // A null rate means "no evidence", which is not the same as a 0% rate.
    expect(result.metrics.finalPassRate).toBeNull();
  });
});

describe("verified generation: ablation arms", () => {
  it("skips execution entirely when verified=false", async () => {
    const provider = fakeProvider([fence("python", "prnt(1)")]);
    const verifier = fakeVerifier([VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({
      prompt: "x",
      language: "python",
      verified: false,
    });

    expect(verifier.verify).not.toHaveBeenCalled();
    // Broken code passes through untouched: this is the baseline arm.
    expect(result.content).toContain("prnt(1)");
    // Denominator still counts the block, so arms stay comparable.
    expect(result.metrics.runnableBlocks).toBe(1);
    expect(result.metrics.finalPassRate).toBeNull();
  });

  it("skips retrieval when grounded=false", async () => {
    const retriever = { retrieve: jest.fn(() => []), formatAsContext: jest.fn(() => "") };
    const provider = fakeProvider([fence("python", "print(1)")]);
    const svc = build({ provider, verifier: fakeVerifier([VERDICT.OK]), retriever });

    const result = await svc.generate({
      prompt: "explain loops",
      language: "python",
      grounded: false,
    });

    expect(retriever.retrieve).not.toHaveBeenCalled();
    expect(result.citations).toEqual([]);
    expect(provider.calls[0].prompt).toBe("explain loops");
  });

  it("injects retrieved sources and returns citations when grounded=true", async () => {
    const retriever = {
      retrieve: jest.fn(() => [
        {
          id: "tutorial:python:1:Loops",
          title: "Loops",
          source: "tutorial",
          language: "python",
          difficulty: "beginner",
          excerpt: "A for loop iterates.",
          score: 9.1,
        },
      ]),
      formatAsContext: jest.fn(() => "[SOURCE 1 | tutorial: \"Loops\"]\nA for loop iterates."),
    };
    const provider = fakeProvider([fence("python", "print(1)")]);
    const svc = build({ provider, verifier: fakeVerifier([VERDICT.OK]), retriever });

    const result = await svc.generate({
      prompt: "explain loops",
      language: "python",
      grounded: true,
    });

    expect(retriever.retrieve).toHaveBeenCalled();
    expect(provider.calls[0].prompt).toContain("A for loop iterates.");
    expect(provider.calls[0].system).toContain("[SOURCE n]");
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].title).toBe("Loops");
  });
});

describe("verified generation: multi-block documents", () => {
  it("verifies every runnable block independently", async () => {
    const provider = fakeProvider([
      `${fence("python", "a")}\n\ntext\n\n${fence("python", "b")}\n\n${fence("python", "c")}`,
      fence("python", "b_fixed"),
    ]);
    // a OK, b fails then fixed, c OK.
    const verifier = fakeVerifier([VERDICT.OK, VERDICT.RUNTIME_ERROR, VERDICT.OK, VERDICT.OK]);
    const svc = build({ provider, verifier });

    const result = await svc.generate({ prompt: "x", language: "python" });

    expect(result.blocks).toHaveLength(3);
    expect(result.metrics.judgedBlocks).toBe(3);
    expect(result.metrics.passedFirstTry).toBe(2);
    expect(result.metrics.passedFinal).toBe(3);
    expect(result.metrics.finalPassRate).toBe(100);
    expect(result.metrics.firstTryPassRate).toBeCloseTo(66.7, 1);
    expect(result.content).toContain("b_fixed");
  });
});
