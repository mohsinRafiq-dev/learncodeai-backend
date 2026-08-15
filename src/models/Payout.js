import mongoose from "mongoose";
import { CURRENCY } from "../config/monetization.js";

// A transfer of accumulated earnings to a creator's connected Stripe account.
//
// Created in `requested`, moves to `processing` when the Stripe transfer is
// created, then `paid` or `failed` from webhooks. A corresponding debit is
// posted to the ledger when the transfer is created, and reversed if it fails.

const payoutSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    creatorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorProfile",
      required: true,
    },

    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: CURRENCY },

    status: {
      type: String,
      enum: ["requested", "approved", "processing", "paid", "failed", "cancelled"],
      default: "requested",
      index: true,
    },

    // Earnings window this payout settles, for the creator's statement.
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },

    stripeTransferId: { type: String, default: null },
    stripeDestinationAccount: { type: String, default: null },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },

    failureReason: { type: String, default: null },
    notes: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true }
);

payoutSchema.index({ creator: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

// Amount tied up in payouts that have not yet settled. Subtracted from the
// available balance so a creator cannot request the same funds twice.
payoutSchema.statics.pendingTotalFor = async function (creatorId) {
  const [row] = await this.aggregate([
    {
      $match: {
        creator: new mongoose.Types.ObjectId(String(creatorId)),
        status: { $in: ["requested", "approved", "processing"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountCents" } } },
  ]);
  return row?.total ?? 0;
};

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
