// Renders an evaluation run as a markdown report.
//
// Includes a two-proportion z-test between the baseline and the full pipeline.
// A pass-rate difference without a significance test invites the obvious
// reviewer question ("is that just noise on 36 tasks?"), so the harness answers
// it up front.

const pct = (v) => (v == null ? "n/a" : `${v.toFixed(1)}%`);

/** Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation. */
const normalCdf = (z) => {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
};

/**
 * Two-proportion z-test.
 * @returns {{z: number, p: number, significant: boolean}|null}
 */
export const twoProportionZTest = (successesA, nA, successesB, nB) => {
  if (!nA || !nB) return null;

  const p1 = successesA / nA;
  const p2 = successesB / nB;
  const pooled = (successesA + successesB) / (nA + nB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));

  if (se === 0) return null;

  const z = (p2 - p1) / se;
  const p = 2 * (1 - normalCdf(Math.abs(z))); // two-tailed
  return { z: Number(z.toFixed(3)), p: Number(p.toFixed(5)), significant: p < 0.05 };
};

/** Wilson score interval — better than normal approximation at extreme rates. */
export const wilsonInterval = (successes, n, z = 1.96) => {
  if (!n) return null;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return {
    low: Number((100 * Math.max(0, centre - margin)).toFixed(1)),
    high: Number((100 * Math.min(1, centre + margin)).toFixed(1)),
  };
};

export const renderReport = (run) => {
  const lines = [];
  const armsByKey = Object.fromEntries(run.arms.map((a) => [a.arm, a]));

  lines.push(`# Verified Generation — Evaluation Report`);
  lines.push("");

  if (run.simulated) {
    lines.push(
      `> **SIMULATED RUN — NOT EXPERIMENTAL RESULTS.**`,
      `> Model responses and sandbox verdicts were produced by deterministic stubs`,
      `> (seed \`${run.seed}\`) to validate the harness and the metric arithmetic.`,
      `> Do not cite these numbers. Re-run without \`--simulate\` for real results.`,
      ""
    );
  }

  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| Benchmark version | \`${run.benchmarkVersion}\` |`);
  lines.push(`| Generated | ${run.generatedAt} |`);
  lines.push(`| Tasks per arm | ${run.taskCount} |`);
  lines.push(`| Wall-clock | ${(run.durationMs / 1000).toFixed(1)}s |`);
  lines.push(`| Mode | ${run.simulated ? "simulated" : "live"} |`);
  lines.push("");

  // ---- Main results table -------------------------------------------------
  lines.push(`## Results`);
  lines.push("");
  lines.push(
    `Rates are over *judged snippets* — runnable code blocks the sandbox returned a verdict for.`,
    `Non-runnable blocks (expected-output dumps, shell commands, deliberate counter-examples)`,
    `and blocks hit by a sandbox outage are excluded from the denominator.`,
    ""
  );
  lines.push(
    `| Arm | Configuration | Snippets | First-try pass | Final pass | 95% CI (final) | Repaired |`
  );
  lines.push(`|---|---|---:|---:|---:|:---:|---:|`);

  for (const arm of run.arms) {
    const s = arm.summary;
    const ci = s.judged ? wilsonInterval(s.passedFinal, s.judged) : null;
    const config = [
      arm.config.grounded ? "grounded" : "ungrounded",
      arm.config.verified ? "verified" : "unverified",
    ].join(" + ");

    lines.push(
      `| **${arm.arm}** | ${config} | ${s.judged || s.runnableBlocks} | ${pct(
        s.firstTryPassRate
      )} | ${pct(s.finalPassRate)} | ${ci ? `${ci.low}–${ci.high}%` : "n/a"} | ${s.repaired} |`
    );
  }
  lines.push("");

  // ---- Headline comparison ------------------------------------------------
  // The comparison below is internal to a single verified arm (its own
  // first-try rate vs its post-repair rate), so it does not depend on the
  // unverified arms being present in the run.
  const full =
    armsByKey.D ?? armsByKey.B ?? run.arms.find((a) => a.config.verified);

  if (full && full.summary.judged > 0) {
    // The unverified arms never execute anything, so their "pass rate" is
    // unmeasured by construction. The honest comparison is the verified arm's
    // own first-try rate (what a user would have received without the loop)
    // against its final rate (what the loop actually delivered).
    const s = full.summary;
    const test = twoProportionZTest(s.passedFirstTry, s.judged, s.passedFinal, s.judged);
    const delta = (s.finalPassRate ?? 0) - (s.firstTryPassRate ?? 0);

    lines.push(`## Effect of the repair loop`);
    lines.push("");
    lines.push(
      `Within arm **${full.arm}** (${full.label}), comparing what the model produced`,
      `on its first attempt against what the pipeline finally delivered:`,
      ""
    );
    lines.push(`| Measure | Value |`);
    lines.push(`|---|---:|`);
    lines.push(`| Snippets judged | ${s.judged} |`);
    lines.push(`| Passed on first attempt | ${s.passedFirstTry} (${pct(s.firstTryPassRate)}) |`);
    lines.push(`| Passed after repair | ${s.passedFinal} (${pct(s.finalPassRate)}) |`);
    lines.push(`| **Absolute improvement** | **+${delta.toFixed(1)} pp** |`);
    lines.push(`| Snippets rescued by repair | ${s.repaired} |`);
    lines.push(`| Repair attempts spent | ${s.repairAttempts} |`);
    lines.push(
      `| Broken snippets still delivered | ${s.judged - s.passedFinal} (${pct(
        100 - (s.finalPassRate ?? 0)
      )}) |`
    );
    if (test) {
      lines.push(
        `| Two-proportion z-test | z = ${test.z}, p ${
          test.p < 0.0001 ? "< 0.0001" : `= ${test.p}`
        }${test.significant ? " ✓" : " (n.s.)"} |`
      );
    }
    lines.push("");
  }

  // ---- Per-language breakdown --------------------------------------------
  const verifiedArms = run.arms.filter((a) => a.config.verified);
  if (verifiedArms.length) {
    lines.push(`## Per-language breakdown`);
    lines.push("");
    lines.push(`| Arm | Language | Snippets | First-try | Final | Δ |`);
    lines.push(`|---|---|---:|---:|---:|---:|`);
    for (const arm of verifiedArms) {
      for (const [lang, s] of Object.entries(arm.byLanguage)) {
        const delta = (s.finalPassRate ?? 0) - (s.firstTryPassRate ?? 0);
        lines.push(
          `| ${arm.arm} | ${lang} | ${s.judged} | ${pct(s.firstTryPassRate)} | ${pct(
            s.finalPassRate
          )} | +${delta.toFixed(1)} pp |`
        );
      }
    }
    lines.push("");
  }

  // ---- Failure analysis ---------------------------------------------------
  const verdictCounts = {};
  let taskErrors = 0;
  for (const arm of run.arms) {
    for (const task of arm.tasks) {
      if (task.error) taskErrors += 1;
      for (const b of task.blocks) {
        if (b.finalVerdict && b.finalVerdict !== "ok") {
          verdictCounts[b.finalVerdict] = (verdictCounts[b.finalVerdict] ?? 0) + 1;
        }
      }
    }
  }

  if (Object.keys(verdictCounts).length) {
    lines.push(`## Residual failures by type`);
    lines.push("");
    lines.push(`Snippets still failing after the repair budget was exhausted.`);
    lines.push("");
    lines.push(`| Failure type | Count |`);
    lines.push(`|---|---:|`);
    for (const [verdict, count] of Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| \`${verdict}\` | ${count} |`);
    }
    lines.push("");
  }

  if (taskErrors > 0) {
    lines.push(
      `> ${taskErrors} task(s) errored outright (provider or harness failure) and are`,
      `> counted with zero judged snippets rather than dropped.`,
      ""
    );
  }

  lines.push(`## Reproducing`);
  lines.push("");
  lines.push("```bash");
  lines.push(
    run.simulated
      ? `node evaluation/runEvaluation.js --simulate --seed ${run.seed}`
      : `node evaluation/runEvaluation.js`
  );
  lines.push("```");

  return lines.join("\n");
};

export default { renderReport, twoProportionZTest, wilsonInterval };
