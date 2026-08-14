import mongoose from "mongoose";

// One record per verified-generation request.
//
// This is the production telemetry behind the evaluation: it captures whether
// each generated snippet ran, how many repair attempts it took, and which
// curriculum passages grounded the answer. Aggregated, it gives a live
// first-try vs post-repair pass rate rather than a one-off benchmark number.

const blockRecordSchema = new mongoose.Schema(
  {
    index: Number,
    language: String,
    runnable: Boolean,
    skipReason: String,
    finalVerdict: {
      type: String,
      enum: [
        "ok",
        "compile_error",
        "runtime_error",
        "timeout",
        "output_mismatch",
        "executor_unavailable",
        null,
      ],
      default: null,
    },
    attempts: { type: Number, default: 0 },
    passedFirstTry: { type: Boolean, default: null },
    repaired: { type: Boolean, default: false },
    history: [
      {
        _id: false,
        attempt: Number,
        verdict: String,
        diagnostic: String,
        durationMs: Number,
      },
    ],
  },
  { _id: false }
);

const citationSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    source: String,
    language: String,
    difficulty: String,
    score: Number,
  },
  { _id: false }
);

const generationTraceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Which product surface triggered generation (tutorial, quiz, chat, ...).
    feature: { type: String, required: true, index: true },
    topic: String,
    language: { type: String, index: true },
    difficulty: String,

    config: {
      grounded: Boolean,
      verified: Boolean,
      maxRepairAttempts: Number,
    },

    provider: {
      name: String,
      model: String,
      latencyMs: Number,
      attempts: Number,
    },

    citations: [citationSchema],
    blocks: [blockRecordSchema],

    metrics: {
      totalBlocks: Number,
      runnableBlocks: Number,
      skippedBlocks: Number,
      verifiedBlocks: Number,
      judgedBlocks: Number,
      executorUnavailable: Number,
      passedFirstTry: Number,
      passedFinal: Number,
      repaired: Number,
      failedFinal: Number,
      firstTryPassRate: Number,
      finalPassRate: Number,
      repairAttempts: Number,
      latencyMs: Number,
    },
  },
  { timestamps: true }
);

// Supports the admin dashboard's "pass rate over time, by language" query.
generationTraceSchema.index({ createdAt: -1, language: 1 });

/**
 * Aggregate pass rates over a time window. Sums counts rather than averaging
 * per-request percentages, so a request with 6 snippets is not weighted the
 * same as one with a single snippet.
 */
generationTraceSchema.statics.aggregateRates = async function (match = {}) {
  const [row] = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        requests: { $sum: 1 },
        judged: { $sum: "$metrics.judgedBlocks" },
        passedFirstTry: { $sum: "$metrics.passedFirstTry" },
        passedFinal: { $sum: "$metrics.passedFinal" },
        repaired: { $sum: "$metrics.repaired" },
        repairAttempts: { $sum: "$metrics.repairAttempts" },
        avgLatencyMs: { $avg: "$metrics.latencyMs" },
      },
    },
  ]);

  if (!row || row.judged === 0) {
    return {
      requests: row?.requests ?? 0,
      judged: 0,
      firstTryPassRate: null,
      finalPassRate: null,
      repaired: 0,
      repairAttempts: 0,
      avgLatencyMs: row?.avgLatencyMs ?? null,
    };
  }

  const pct = (n) => Number(((n / row.judged) * 100).toFixed(1));
  return {
    requests: row.requests,
    judged: row.judged,
    firstTryPassRate: pct(row.passedFirstTry),
    finalPassRate: pct(row.passedFinal),
    repaired: row.repaired,
    repairAttempts: row.repairAttempts,
    avgLatencyMs: Math.round(row.avgLatencyMs ?? 0),
  };
};

const GenerationTrace = mongoose.model("GenerationTrace", generationTraceSchema);
export default GenerationTrace;
