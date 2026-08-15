import mongoose from "mongoose";
import { CURRENCY } from "../config/monetization.js";

// Append-only record of every movement against a creator's balance.
//
// Nothing here is ever updated or deleted. A refund posts a *reversing* entry
// rather than editing the original, so the history always reconciles and the
// balance is derivable by replaying entries. This is what makes creator
// earnings auditable rather than a mutable running total.

const ledgerEntrySchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "sale",           // credit: a course sold
        "refund",         // debit: sale reversed
        "pool_payout",    // credit: share of the Pro revenue pool
        "payout",         // debit: money sent to the creator
        "payout_reversal",// credit: a failed transfer returned
        "adjustment",     // credit or debit: manual admin correction
      ],
      required: true,
      index: true,
    },

    // Positive credits the creator, negative debits them. Integer cents.
    amountCents: { type: Number, required: true },
    currency: { type: String, default: CURRENCY },

    // Provenance — every entry points at whatever caused it.
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    payout: { type: mongoose.Schema.Types.ObjectId, ref: "Payout", default: null },
    poolPeriod: { type: mongoose.Schema.Types.ObjectId, ref: "RevenuePoolPeriod", default: null },
    // Reverses this entry, for refunds and failed transfers.
    reverses: { type: mongoose.Schema.Types.ObjectId, ref: "LedgerEntry", default: null },

    // Funds are held briefly after a sale so a fast refund does not create a
    // negative balance. Null means immediately available.
    availableAt: { type: Date, default: null, index: true },

    description: { type: String, maxlength: 300 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Guards against double-posting from a replayed webhook.
    idempotencyKey: { type: String, default: null, unique: true, sparse: true },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ creator: 1, createdAt: -1 });
ledgerEntrySchema.index({ creator: 1, type: 1 });

// Entries are immutable once written. Any "correction" must be a new entry.
ledgerEntrySchema.pre("findOneAndUpdate", function (next) {
  next(new Error("LedgerEntry is append-only; post a reversing entry instead."));
});
ledgerEntrySchema.pre("updateOne", function (next) {
  next(new Error("LedgerEntry is append-only; post a reversing entry instead."));
});

/**
 * Balance for a creator, derived by replaying entries.
 *
 * - `pending`   credited but still inside the hold window
 * - `available` clear of the hold and not yet paid out
 * - `paidOut`   already transferred
 */
ledgerEntrySchema.statics.balanceFor = async function (creatorId) {
  const now = new Date();
  const rows = await this.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(String(creatorId)) } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$type", "payout"] },
            "payout",
            {
              $cond: [
                {
                  $and: [
                    { $ne: ["$availableAt", null] },
                    { $gt: ["$availableAt", now] },
                  ],
                },
                "pending",
                "available",
              ],
            },
          ],
        },
        total: { $sum: "$amountCents" },
      },
    },
  ]);

  const bucket = Object.fromEntries(rows.map((r) => [r._id, r.total]));
  const pendingCents = bucket.pending ?? 0;
  // Payout entries are negative, so adding them reduces the available figure.
  const availableCents = (bucket.available ?? 0) + (bucket.payout ?? 0);

  return {
    pendingCents,
    availableCents: Math.max(0, availableCents),
    paidOutCents: Math.abs(bucket.payout ?? 0),
    lifetimeCents: pendingCents + (bucket.available ?? 0),
  };
};

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
export default LedgerEntry;
