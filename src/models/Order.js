import mongoose from "mongoose";
import { CURRENCY } from "../config/monetization.js";

// One row per purchase attempt. This is the financial audit trail — every
// entitlement and every ledger entry traces back to an Order.
//
// Amounts are integer minor units (cents) throughout. The split is recorded as
// it was computed at purchase time, so a later change to the platform fee
// never rewrites history.

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: ["course", "subscription", "lifetime"],
      required: true,
      index: true,
    },

    // Set for kind === "course".
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    // Snapshot of what was bought, so the receipt still reads correctly after
    // the course is renamed, repriced, or deleted.
    snapshot: {
      title: String,
      priceCents: Number,
      creatorName: String,
    },

    // ---------- Money ----------
    currency: { type: String, default: CURRENCY },
    grossCents: { type: Number, required: true, min: 0 },
    platformFeeCents: { type: Number, default: 0, min: 0 },
    creatorEarningsCents: { type: Number, default: 0, min: 0 },
    feeBps: { type: Number, default: 0 },
    // What Stripe actually charged in processing fees, from the balance
    // transaction. Borne by the platform out of its cut.
    stripeFeeCents: { type: Number, default: 0 },

    // ---------- Stripe ----------
    // Unique so a replayed checkout.session.completed cannot create a second
    // order for the same session. This is the idempotency guarantee.
    stripeSessionId: { type: String, default: null, unique: true, sparse: true },
    stripePaymentIntentId: { type: String, default: null, index: true },
    stripeChargeId: { type: String, default: null },
    stripeTransferId: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },

    paidAt: { type: Date, default: null },

    // ---------- Refunds ----------
    refundedCents: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },

    // Every webhook event id already applied to this order. Belt-and-braces
    // against Stripe's at-least-once delivery.
    processedEvents: [{ type: String }],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ creator: 1, status: 1, paidAt: -1 });

// Has this webhook event already been applied? Callers should check before
// mutating, so a redelivery is a no-op rather than a double-credit.
orderSchema.methods.hasProcessed = function (eventId) {
  return this.processedEvents.includes(eventId);
};

orderSchema.methods.markProcessed = function (eventId) {
  if (!this.processedEvents.includes(eventId)) this.processedEvents.push(eventId);
};

// Net revenue recognised by the platform on this order, after refunds.
orderSchema.virtual("netPlatformCents").get(function () {
  if (this.status === "refunded") return 0;
  if (this.status === "partially_refunded") {
    // Refunds come proportionally out of both sides.
    const remaining = this.grossCents - this.refundedCents;
    return Math.floor((remaining * this.feeBps) / 10000);
  }
  return this.platformFeeCents;
});

/** Aggregate revenue over a window, for the admin dashboard. */
orderSchema.statics.revenueSummary = async function (match = {}) {
  const [row] = await this.aggregate([
    { $match: { status: { $in: ["paid", "partially_refunded"] }, ...match } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        grossCents: { $sum: "$grossCents" },
        platformFeeCents: { $sum: "$platformFeeCents" },
        creatorEarningsCents: { $sum: "$creatorEarningsCents" },
        refundedCents: { $sum: "$refundedCents" },
      },
    },
  ]);

  return (
    row ?? {
      orders: 0,
      grossCents: 0,
      platformFeeCents: 0,
      creatorEarningsCents: 0,
      refundedCents: 0,
    }
  );
};

const Order = mongoose.model("Order", orderSchema);
export default Order;
