#!/usr/bin/env node
//
// Reproducible evaluation harness for the verified-generation pipeline.
//
// Runs a 2x2 ablation over the fixed benchmark set:
//
//                     | verified=false | verified=true
//   ------------------+----------------+---------------
//   grounded=false    | A: baseline    | B: +verify
//   grounded=true     | C: +ground     | D: full
//
// Arm A is the conventional "call an LLM and show the output" approach; arm D
// is the full pipeline. The difference between them is the contribution.
//
// Usage:
//   node evaluation/runEvaluation.js                     # all arms, all tasks
//   node evaluation/runEvaluation.js --limit 6           # quick pass
//   node evaluation/runEvaluation.js --languages python
//   node evaluation/runEvaluation.js --arms A,D
//   node evaluation/runEvaluation.js --simulate          # no API keys needed
//
// --simulate replaces the model and sandbox with deterministic stubs. It
// validates that the harness and metric arithmetic are correct end to end.
// Numbers produced under --simulate are NOT experimental results and are
// labelled as such in every output file.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { VerifiedGenerationService } from "../src/services/ai/verifiedGeneration.js";
import { VERDICT } from "../src/services/ai/executionVerifier.js";
import { BENCHMARK_VERSION, buildTaskPrompt, selectTasks } from "./benchmark.js";
import { renderReport } from "./report.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ARMS = {
  A: { key: "A", label: "Baseline (ungrounded, unverified)", grounded: false, verified: false },
  B: { key: "B", label: "Verified only", grounded: false, verified: true },
  C: { key: "C", label: "Grounded only", grounded: true, verified: false },
  D: { key: "D", label: "Full pipeline (grounded + verified)", grounded: true, verified: true },
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const parseArgs = (argv) => {
  const args = { simulate: false, arms: ["A", "B", "C", "D"], limit: null, languages: null, seed: 42 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--simulate": args.simulate = true; break;
      case "--limit": args.limit = parseInt(next(), 10); break;
      case "--seed": args.seed = parseInt(next(), 10); break;
      case "--arms": args.arms = next().split(",").map((s) => s.trim().toUpperCase()); break;
      case "--languages": args.languages = next().split(",").map((s) => s.trim()); break;
      case "--help":
        console.log("See header of evaluation/runEvaluation.js for usage.");
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }
  const unknownArms = args.arms.filter((a) => !ARMS[a]);
  if (unknownArms.length) {
    console.error(`Unknown arms: ${unknownArms.join(", ")}. Valid: A, B, C, D`);
    process.exit(1);
  }
  return args;
};

// ---------------------------------------------------------------------------
// Deterministic simulation stubs (--simulate)
// ---------------------------------------------------------------------------

/** Mulberry32: small, fast, seedable PRNG so simulated runs are reproducible. */
const makeRng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Rough per-language difficulty of emitting runnable code, used only to give
// the simulation a plausible shape. Not measurements.
const SIM_BASE_FAILURE = { python: 0.18, javascript: 0.22, cpp: 0.34 };
const SIM_DIFFICULTY_PENALTY = { beginner: 0, intermediate: 0.06, advanced: 0.13 };
const SIM_GROUNDING_BENEFIT = 0.05; // grounding slightly improves conventions
const SIM_REPAIR_SUCCESS = 0.62; // per-attempt chance a repair fixes the snippet

const buildSimulation = (rng) => {
  // Tracks the intended verdict for each emitted snippet so the fake verifier
  // and fake repairer stay consistent within a task.
  const state = { failing: new Map() };

  const provider = {
    complete: async ({ prompt }) => {
      const isRepair = prompt.includes("SANDBOX OUTPUT:");
      if (isRepair) {
        const fixed = rng() < SIM_REPAIR_SUCCESS;
        const id = `s${Math.floor(rng() * 1e9)}`;
        state.failing.set(id, !fixed);
        return {
          text: "```python\n# repaired " + id + "\nprint('ok')\n```",
          provider: "simulated",
          model: "sim-1",
          latencyMs: 300,
          attempts: 1,
        };
      }

      const lang = /\b(python|javascript|cpp)\b/.exec(prompt)?.[1] ?? "python";
      const difficulty =
        /\b(beginner|intermediate|advanced)\b/.exec(prompt)?.[1] ?? "beginner";
      const grounded = prompt.includes("[SOURCE");

      const pFail = Math.max(
        0.02,
        SIM_BASE_FAILURE[lang] +
          SIM_DIFFICULTY_PENALTY[difficulty] -
          (grounded ? SIM_GROUNDING_BENEFIT : 0)
      );

      const blocks = [];
      for (let i = 0; i < 2; i++) {
        const id = `s${Math.floor(rng() * 1e9)}`;
        state.failing.set(id, rng() < pFail);
        blocks.push("```" + lang + "\n// snippet " + id + "\nprint('x')\n```");
      }

      return {
        text: `Explanation prose.\n\n${blocks.join("\n\n")}\n`,
        provider: "simulated",
        model: "sim-1",
        latencyMs: 800,
        attempts: 1,
      };
    },
  };

  const verifier = {
    verify: async (code) => {
      const id = /s\d+/.exec(code)?.[0];
      const fails = id ? state.failing.get(id) === true : false;
      const verdict = fails
        ? rng() < 0.4
          ? VERDICT.COMPILE_ERROR
          : VERDICT.RUNTIME_ERROR
        : VERDICT.OK;
      return {
        verdict,
        ok: !fails,
        repairable: fails,
        output: fails ? "simulated failure" : "x",
        diagnostic: fails ? `simulated ${verdict} diagnostic` : null,
        wrapped: false,
        durationMs: 120,
      };
    },
  };

  return { provider, verifier };
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const aggregate = (taskResults) => {
  // Sum raw counts rather than averaging per-task percentages, so a task that
  // emitted 4 snippets is not weighted equally with one that emitted 1.
  const totals = taskResults.reduce(
    (acc, r) => {
      const m = r.metrics;
      acc.tasks += 1;
      acc.totalBlocks += m.totalBlocks;
      acc.runnableBlocks += m.runnableBlocks;
      acc.judged += m.judgedBlocks;
      acc.passedFirstTry += m.passedFirstTry;
      acc.passedFinal += m.passedFinal;
      acc.repaired += m.repaired;
      acc.repairAttempts += m.repairAttempts;
      acc.executorUnavailable += m.executorUnavailable;
      acc.latencyMs += m.latencyMs;
      return acc;
    },
    {
      tasks: 0, totalBlocks: 0, runnableBlocks: 0, judged: 0, passedFirstTry: 0,
      passedFinal: 0, repaired: 0, repairAttempts: 0, executorUnavailable: 0, latencyMs: 0,
    }
  );

  const pct = (n) => (totals.judged > 0 ? Number(((n / totals.judged) * 100).toFixed(1)) : null);

  return {
    ...totals,
    firstTryPassRate: pct(totals.passedFirstTry),
    finalPassRate: pct(totals.passedFinal),
    meanLatencyMs: totals.tasks ? Math.round(totals.latencyMs / totals.tasks) : 0,
  };
};

const byLanguage = (taskResults) => {
  const groups = {};
  for (const r of taskResults) {
    (groups[r.language] ??= []).push(r);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([lang, rs]) => [lang, aggregate(rs)])
  );
};

const runArm = async (arm, tasks, service, { onProgress }) => {
  const taskResults = [];

  for (const task of tasks) {
    const prompt = buildTaskPrompt(task);
    const startedAt = Date.now();

    try {
      const result = await service.generate({
        prompt,
        language: task.language,
        difficulty: task.difficulty,
        retrievalQuery: `${task.topic} ${task.language}`,
        grounded: arm.grounded,
        verified: arm.verified,
      });

      taskResults.push({
        taskId: task.id,
        topic: task.topic,
        language: task.language,
        difficulty: task.difficulty,
        metrics: result.metrics,
        citations: result.citations.map((c) => c.id),
        blocks: result.blocks.map((b) => ({
          index: b.index,
          runnable: b.runnable,
          skipReason: b.skipReason,
          finalVerdict: b.finalVerdict,
          attempts: b.attempts,
          passedFirstTry: b.passedFirstTry,
          repaired: b.repaired,
        })),
        error: null,
      });
    } catch (err) {
      // A failed task is recorded, not silently dropped: excluding failures
      // would bias the reported rates upward.
      taskResults.push({
        taskId: task.id,
        topic: task.topic,
        language: task.language,
        difficulty: task.difficulty,
        metrics: {
          totalBlocks: 0, runnableBlocks: 0, skippedBlocks: 0, verifiedBlocks: 0,
          judgedBlocks: 0, executorUnavailable: 0, passedFirstTry: 0, passedFinal: 0,
          repaired: 0, failedFinal: 0, firstTryPassRate: null, finalPassRate: null,
          repairAttempts: 0, latencyMs: Date.now() - startedAt,
        },
        citations: [],
        blocks: [],
        error: err.message,
      });
    }

    onProgress?.(arm, task, taskResults.length, tasks.length);
  }

  return {
    arm: arm.key,
    label: arm.label,
    config: { grounded: arm.grounded, verified: arm.verified },
    summary: aggregate(taskResults),
    byLanguage: byLanguage(taskResults),
    tasks: taskResults,
  };
};

const main = async () => {
  const args = parseArgs(process.argv);
  const tasks = selectTasks({ languages: args.languages, limit: args.limit });

  if (tasks.length === 0) {
    console.error("No benchmark tasks matched the given filters.");
    process.exit(1);
  }

  let service;
  if (args.simulate) {
    const rng = makeRng(args.seed);
    const { provider, verifier } = buildSimulation(rng);
    service = new VerifiedGenerationService({
      provider,
      verifier,
      // Grounding still exercises the real BM25 index in simulation mode.
      retriever: (await import("../src/services/ai/retrievalService.js")).default,
    });
  } else {
    const aiProvider = (await import("../src/services/ai/aiProvider.js")).default;
    if (!aiProvider.isConfigured()) {
      console.error(
        "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY,\n" +
          "or run with --simulate to validate the harness without API access."
      );
      process.exit(1);
    }
    service = new VerifiedGenerationService();
  }

  console.log(`\nVerified-generation evaluation`);
  console.log(`  benchmark : v${BENCHMARK_VERSION}`);
  console.log(`  tasks     : ${tasks.length}`);
  console.log(`  arms      : ${args.arms.join(", ")}`);
  console.log(`  mode      : ${args.simulate ? "SIMULATED (not experimental results)" : "live"}\n`);

  const startedAt = Date.now();
  const armResults = [];

  for (const armKey of args.arms) {
    const arm = ARMS[armKey];
    process.stdout.write(`  [${arm.key}] ${arm.label} `);
    const result = await runArm(arm, tasks, service, {
      onProgress: () => process.stdout.write("."),
    });
    const s = result.summary;
    process.stdout.write(
      ` done  first-try ${s.firstTryPassRate ?? "n/a"}%  final ${s.finalPassRate ?? "n/a"}%\n`
    );
    armResults.push(result);
  }

  const run = {
    benchmarkVersion: BENCHMARK_VERSION,
    generatedAt: new Date().toISOString(),
    simulated: args.simulate,
    seed: args.simulate ? args.seed : null,
    taskCount: tasks.length,
    durationMs: Date.now() - startedAt,
    arms: armResults,
  };

  const outDir = path.join(__dirname, "results");
  await fs.mkdir(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prefix = args.simulate ? "simulated" : "live";
  const jsonPath = path.join(outDir, `${prefix}-${stamp}.json`);
  const mdPath = path.join(outDir, `${prefix}-${stamp}.md`);
  const latestMd = path.join(outDir, `latest-${prefix}.md`);

  const report = renderReport(run);
  await fs.writeFile(jsonPath, JSON.stringify(run, null, 2));
  await fs.writeFile(mdPath, report);
  await fs.writeFile(latestMd, report);

  console.log(`\n${report}\n`);
  console.log(`Raw data : ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Report   : ${path.relative(process.cwd(), mdPath)}\n`);
};

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
