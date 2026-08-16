// Admin approval and execution of creator payouts.
//
// Creators request; an admin approves; Stripe transfers. Payouts are manual by
// design (the connected accounts are configured with a manual schedule) so the
// platform decides when funds move and can reconcile against its own ledger
// rather than discovering a Stripe sweep after the fact.
//
// Spec: docs/BUSINESS_MODEL.md §3, §8

import mongoose from "mongoose";
import Payout from "../models/Payout.js";
import LedgerEntry from "../models/LedgerEntry.js";
import CreatorProfile from "../models/CreatorProfile.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import connectService from "../services/billing/connectService.js";
import { PAYOUT, formatMoney } from "../config/monetization.js";

// GET /api/admin/payouts?status=requested
export const list = async (req, res) => {
  try {
    const { status = "requested" } = req.query;
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit ?? "25", 10));

    const query = status && status !== "all" ? { status } : {};

    const [payouts, total, counts] = await Promise.all([
      Payout.find(query)
        .populate("creator", "name email")
        .populate("creatorProfile", "application.displayName stripeAccountId payoutsEnabled")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payout.countDocuments(query),
      Payout.aggregate([
        { $group: { _id: "$status", n: { $sum: 1 }, cents: { $sum: "$amountCents" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payouts,
        counts: Object.fromEntries(counts.map((c) => [c._id, { count: c.n, cents: c.cents }])),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/payouts/:id — everything needed to decide
export const getOne = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate("creator", "name email")
      .populate("creatorProfile")
      .lean();
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }

    const [balance, recentOrders, otherPending] = await Promise.all([
      LedgerEntry.balanceFor(payout.creator._id),
      Order.find({ creator: payout.creator._id, status: "paid" })
        .sort({ paidAt: -1 })
        .limit(10)
        .select("snapshot grossCents creatorEarningsCents paidAt")
        .lean(),
      Payout.pendingTotalFor(payout.creator._id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payout,
        balance,
        recentOrders,
        // The check a reviewer actually needs: is this amount still covered
        // once everything else in flight is accounted for?
        coverage: {
          availableCents: balance.availableCents,
          committedCents: otherPending,
          sufficient: balance.availableCents >= payout.amountCents,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/payouts/:id/approve
 *
 * Approves and executes in one step: creates the Stripe transfer and posts the
 * matching ledger debit. Splitting approval from execution would leave a state
 * where the platform has promised money it has not moved.
 */
export const approve = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const payout = await Payout.findById(req.params.id).populate("creatorProfile");
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status !== "requested") {
      return res.status(409).json({
        success: false,
        message: `This payout is already ${payout.status}.`,
      });
    }

    const profile = payout.creatorProfile;
    if (!profile?.stripeAccountId || !profile.payoutsEnabled) {
      return res.status(409).json({
        success: false,
        message:
          profile?.paidPublishBlocker?.() ??
          "This creator's payout account is not ready to receive transfers.",
      });
    }

    // Re-check the balance at execution time. It was verified when the creator
    // requested, but a refund may have landed since, and paying out money that
    // no longer exists is not recoverable.
    const balance = await LedgerEntry.balanceFor(payout.creator);
    if (balance.availableCents < payout.amountCents) {
      payout.status = "cancelled";
      payout.failureReason = "Insufficient balance at approval time";
      await payout.save();
      return res.status(409).json({
        success: false,
        message:
          `Balance has fallen to ${formatMoney(balance.availableCents)}, below the ` +
          `${formatMoney(payout.amountCents)} requested. Payout cancelled.`,
      });
    }

    payout.status = "processing";
    payout.approvedBy = req.user._id;
    payout.approvedAt = new Date();
    await payout.save();

    let transfer;
    try {
      transfer = await connectService.createTransfer({
        destinationAccountId: profile.stripeAccountId,
        amountCents: payout.amountCents,
        metadata: {
          payoutId: String(payout._id),
          creatorId: String(payout.creator),
        },
        // Keyed on the payout, so a retried request can never pay twice.
        idempotencyKey: `payout_${payout._id}`,
      });
    } catch (stripeError) {
      payout.status = "failed";
      payout.failureReason = stripeError.message;
      await payout.save();
      console.error("Stripe transfer failed:", stripeError);
      return res.status(502).json({
        success: false,
        message: `Transfer failed: ${stripeError.message}`,
      });
    }

    payout.stripeTransferId = transfer.id;
    payout.status = "paid";
    payout.paidAt = new Date();
    await payout.save();

    // The debit is what removes the funds from the creator's available balance.
    // Idempotency-keyed so a retry cannot double-debit them.
    await LedgerEntry.create({
      creator: payout.creator,
      type: "payout",
      amountCents: -payout.amountCents,
      payout: payout._id,
      description: `Payout to Stripe account ${profile.stripeAccountId}`,
      createdBy: req.user._id,
      idempotencyKey: `payout:${payout._id}`,
    }).catch((err) => {
      if (err.code !== 11000) throw err;
    });

    await CreatorProfile.findByIdAndUpdate(profile._id, {
      $inc: { "stats.paidOutCents": payout.amountCents },
    });

    await AuditLog.record(req, "payout_approved", "Payout", payout._id, {
      amountCents: payout.amountCents,
      transferId: transfer.id,
    });

    res.status(200).json({
      success: true,
      message: `${formatMoney(payout.amountCents)} sent.`,
      data: payout,
    });
  } catch (error) {
    console.error("Payout approval failed:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
};

// POST /api/admin/payouts/:id/reject  { reason }
export const reject = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A reason is required when rejecting a payout.",
      });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status !== "requested") {
      return res.status(409).json({
        success: false,
        message: `This payout is already ${payout.status}.`,
      });
    }

    payout.status = "cancelled";
    payout.failureReason = reason.trim();
    await payout.save();

    // No ledger entry: a rejected request never debited anything, so the funds
    // simply remain available. Posting a reversal would credit money twice.

    await AuditLog.record(req, "payout_rejected", "Payout", payout._id, {
      amountCents: payout.amountCents,
      reason: reason.trim(),
    });

    res.status(200).json({ success: true, message: "Payout cancelled.", data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/payouts/meta/summary — platform-level money view
export const summary = async (_req, res) => {
  try {
    const [revenue, payoutTotals, outstanding] = await Promise.all([
      Order.revenueSummary(),
      Payout.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, cents: { $sum: "$amountCents" }, n: { $sum: 1 } } },
      ]),
      Payout.aggregate([
        { $match: { status: { $in: ["requested", "approved", "processing"] } } },
        { $group: { _id: null, cents: { $sum: "$amountCents" }, n: { $sum: 1 } } },
      ]),
    ]);

    const paidOut = payoutTotals[0] ?? { cents: 0, n: 0 };
    const pending = outstanding[0] ?? { cents: 0, n: 0 };

    res.status(200).json({
      success: true,
      data: {
        grossCents: revenue.grossCents,
        platformFeeCents: revenue.platformFeeCents,
        creatorEarningsCents: revenue.creatorEarningsCents,
        refundedCents: revenue.refundedCents,
        orders: revenue.orders,
        paidOutCents: paidOut.cents,
        paidOutCount: paidOut.n,
        pendingPayoutCents: pending.cents,
        pendingPayoutCount: pending.n,
        // What the platform still owes creators but has not yet transferred.
        owedToCreatorsCents: Math.max(
          0,
          revenue.creatorEarningsCents - paidOut.cents - pending.cents
        ),
        minimumPayoutCents: PAYOUT.MINIMUM_CENTS,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { list, getOne, approve, reject, summary };
