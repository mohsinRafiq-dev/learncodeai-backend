// Tests for the evaluation report's statistics.
//
// These numbers end up in a write-up, so they are checked against values
// computed independently (R / scipy) rather than against the implementation's
// own output.

import { twoProportionZTest, wilsonInterval, renderReport } from "../../evaluation/report.js";
import { selectTasks, BENCHMARK_TASKS } from "../../evaluation/benchmark.js";

describe("twoProportionZTest", () => {
  it("matches a hand-computed reference case using pooled variance", () => {
    // p1 = 0.45, p2 = 0.60, pooled p = 0.525
    // SE = sqrt(0.525 * 0.475 * (1/100 + 1/100)) = 0.0706222
    // z  = (0.60 - 0.45) / 0.0706222 = 2.1240
    //
    // Note: the unpooled (Wald) SE would give z = 2.1483. Pooled variance is
    // the correct choice when testing the null hypothesis p1 == p2, and is
    // what statsmodels' proportions_ztest uses by default.
    const result = twoProportionZTest(45, 100, 60, 100);
    expect(result.z).toBeCloseTo(2.124, 3);
    expect(result.p).toBeCloseTo(0.0337, 3);
    expect(result.significant).toBe(true);
  });

  it("reports no significance for a small difference", () => {
    const result = twoProportionZTest(50, 100, 54, 100);
    expect(result.significant).toBe(false);
    expect(result.p).toBeGreaterThan(0.05);
  });

  it("is sign-correct when the second proportion is lower", () => {
    expect(twoProportionZTest(60, 100, 45, 100).z).toBeLessThan(0);
  });

  it("is symmetric in magnitude", () => {
    const a = twoProportionZTest(45, 100, 60, 100);
    const b = twoProportionZTest(60, 100, 45, 100);
    expect(Math.abs(a.z)).toBeCloseTo(Math.abs(b.z), 6);
    expect(a.p).toBeCloseTo(b.p, 6);
  });

  it("returns null for empty samples", () => {
    expect(twoProportionZTest(0, 0, 5, 10)).toBeNull();
    expect(twoProportionZTest(5, 10, 0, 0)).toBeNull();
  });

  it("returns null when both proportions are degenerate", () => {
    // All successes in both groups: pooled variance is zero, z is undefined.
    expect(twoProportionZTest(10, 10, 10, 10)).toBeNull();
  });

  it("detects a large, clearly significant improvement", () => {
    const result = twoProportionZTest(70, 100, 96, 100);
    expect(result.significant).toBe(true);
    expect(result.p).toBeLessThan(0.0001);
  });
});

describe("wilsonInterval", () => {
  it("matches a known reference case", () => {
    // Wilson 95% CI for 60/100 is approximately [50.0, 69.2].
    const ci = wilsonInterval(60, 100);
    expect(ci.low).toBeCloseTo(50.0, 0);
    expect(ci.high).toBeCloseTo(69.2, 0);
  });

  it("stays inside [0, 100] at the boundary", () => {
    const ci = wilsonInterval(20, 20);
    expect(ci.low).toBeGreaterThan(0);
    expect(ci.high).toBeLessThanOrEqual(100);
  });

  it("does not produce a negative lower bound at zero successes", () => {
    const ci = wilsonInterval(0, 20);
    expect(ci.low).toBe(0);
    expect(ci.high).toBeGreaterThan(0);
  });

  it("narrows as the sample grows", () => {
    const small = wilsonInterval(15, 20);
    const large = wilsonInterval(150, 200);
    expect(large.high - large.low).toBeLessThan(small.high - small.low);
  });

  it("returns null for an empty sample", () => {
    expect(wilsonInterval(0, 0)).toBeNull();
  });
});

describe("benchmark task selection", () => {
  it("stratifies a limited run across languages instead of truncating", () => {
    const tasks = selectTasks({ limit: 6 });
    expect(tasks).toHaveLength(6);

    const counts = tasks.reduce((acc, t) => {
      acc[t.language] = (acc[t.language] ?? 0) + 1;
      return acc;
    }, {});
    // Three languages, six slots: two each.
    expect(counts).toEqual({ python: 2, javascript: 2, cpp: 2 });
  });

  it("returns every task when the limit exceeds the set size", () => {
    expect(selectTasks({ limit: 999 })).toHaveLength(BENCHMARK_TASKS.length);
    expect(selectTasks({})).toHaveLength(BENCHMARK_TASKS.length);
  });

  it("filters by language", () => {
    const tasks = selectTasks({ languages: ["cpp"] });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.language === "cpp")).toBe(true);
  });

  it("preserves benchmark order in a stratified selection", () => {
    const tasks = selectTasks({ limit: 9 });
    const positions = tasks.map((t) => BENCHMARK_TASKS.findIndex((b) => b.id === t.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses globally unique task ids", () => {
    const ids = BENCHMARK_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("renderReport", () => {
  const run = {
    benchmarkVersion: "1.0.0",
    generatedAt: "2026-01-01T00:00:00.000Z",
    simulated: false,
    seed: null,
    taskCount: 2,
    durationMs: 1000,
    arms: [
      {
        arm: "D",
        label: "Full pipeline",
        config: { grounded: true, verified: true },
        summary: {
          tasks: 2, totalBlocks: 4, runnableBlocks: 4, judged: 4,
          passedFirstTry: 2, passedFinal: 4, repaired: 2, repairAttempts: 3,
          executorUnavailable: 0, latencyMs: 1000, firstTryPassRate: 50,
          finalPassRate: 100, meanLatencyMs: 500,
        },
        byLanguage: {
          python: {
            judged: 4, firstTryPassRate: 50, finalPassRate: 100,
            passedFirstTry: 2, passedFinal: 4,
          },
        },
        tasks: [{ error: null, blocks: [{ finalVerdict: "runtime_error" }] }],
      },
    ],
  };

  it("renders the headline improvement", () => {
    const md = renderReport(run);
    expect(md).toContain("+50.0 pp");
    expect(md).toContain("Snippets rescued by repair");
  });

  it("omits the simulation banner on a live run", () => {
    expect(renderReport(run)).not.toContain("SIMULATED RUN");
  });

  it("shows a prominent banner on a simulated run", () => {
    const md = renderReport({ ...run, simulated: true, seed: 42 });
    expect(md).toContain("SIMULATED RUN — NOT EXPERIMENTAL RESULTS");
    expect(md).toContain("Do not cite these numbers");
  });

  it("lists residual failures by type", () => {
    expect(renderReport(run)).toContain("`runtime_error`");
  });
});
