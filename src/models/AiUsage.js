import mongoose from "mongoose";

// Per-user, per-period AI credit consumption.
//
// The pricing page has always advertised AI limits ("5 prompts/day" on Free,
// "unlimited" on Pro) but nothing enforced them: User.aiPromptsUsedToday
// existed and was never read. Free users therefore had unmetered access to a
// paid API — no upgrade incentive, and a real cost per signup.
//
// One document per user per period keeps the hot path a single indexed
// findOneAndUpdate, and leaves a month-by-month history for analytics.

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // "YYYY-MM" for the billing period this row covers. String rather than a
    // date range because it is an exact-match key, not something we scan.
    period: { type: String, required: true, index: true },

    // Allowance for the plan the user was on when the period opened. Stored
    // rather than looked up so a mid-period downgrade cannot retroactively put
    // someone over their limit.
    creditsAllocated: { type: Number, required: true },
    creditsUsed: { type: Number, default: 0 },

    // Which plan set the allocation, for support and analytics.
    planKey: { type: String, default: "free" },

    // Breakdown by action, so the Studio can show where credits went and the
    // evaluation can report cost per feature.
    byAction: {
      chat: { type: Number, default: 0 },
      code_help: { type: Number, default: 0 },
      quiz_generation: { type: Number, default: 0 },
      verified_generation: { type: Number, default: 0 },
    },

    // Requests refused because the balance was exhausted. A useful upgrade
    // signal: high values mean the limit is biting.
    deniedCount: { type: Number, default: 0 },

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

// One row per user per period, and the lookup index for the hot path.
aiUsageSchema.index({ user: 1, period: 1 }, { unique: true });

aiUsageSchema.virtual("creditsRemaining").get(function () {
  return Math.max(0, this.creditsAllocated - this.creditsUsed);
});

aiUsageSchema.virtual("percentUsed").get(function () {
  if (!this.creditsAllocated) return 100;
  return Math.min(100, Math.round((this.creditsUsed / this.creditsAllocated) * 100));
});

/** Current period key, e.g. "2026-08". */
aiUsageSchema.statics.currentPeriod = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
export default AiUsage;
