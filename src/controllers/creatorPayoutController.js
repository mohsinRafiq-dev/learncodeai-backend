// Creator payout onboarding and withdrawal requests.

import connectService from "../services/billing/connectService.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Payout from "../models/Payout.js";
import { PAYOUT, formatMoney } from "../config/monetization.js";

const frontend = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

// POST /api/creator/payouts/onboard — start or resume Stripe onboarding
export const startOnboarding = async (req, res) => {
  try {
    if (!connectService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Payouts are not configured on this server.",
      });
    }

    const profile = req.creatorProfile;
    await connectService.ensureConnectedAccount(profile, req.user);

    const url = await connectService.createOnboardingLink(profile, {
      returnUrl: `${frontend()}/creator/payouts?onboarding=complete`,
      refreshUrl: `${frontend()}/creator/payouts?onboarding=refresh`,
    });

    res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    console.error("Connect onboarding failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/payouts/status — capability state + balance
export const getStatus = async (req, res) => {
  try {
    const profile = req.creatorProfile;

    // Re-read from Stripe rather than trusting our mirror: the creator has
    // usually just returned from onboarding and expects to see it reflected.
    if (profile.stripeAccountId && connectService.isConfigured()) {
      await connectService.syncAccountStatus(profile).catch((e) =>
        console.warn("Connect status sync failed:", e.message)
      );
    }

    const [balance, pendingPayouts] = await Promise.all([
      LedgerEntry.balanceFor(req.user._id),
      Payout.pendingTotalFor(req.user._id),
    ]);

    const withdrawable = Math.max(0, balance.availableCents - pendingPayouts);

    res.status(200).json({
      success: true,
      data: {
        onboarded: Boolean(profile.stripeAccountId),
        payoutsEnabled: profile.payoutsEnabled,
        chargesEnabled: profile.chargesEnabled,
        detailsSubmitted: profile.detailsSubmitted,
        requirementsDue: profile.requirementsDue,
        blocker: profile.paidPublishBlocker(),
        balance: {
          ...balance,
          withdrawableCents: withdrawable,
          pendingPayoutCents: pendingPayouts,
        },
        minimumPayoutCents: PAYOUT.MINIMUM_CENTS,
        canRequestPayout:
          profile.payoutsEnabled && withdrawable >= PAYOUT.MINIMUM_CENTS,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/payouts/dashboard-link — Stripe Express dashboard
export const getDashboardLink = async (req, res) => {
  try {
    const url = await connectService.createDashboardLink(req.creatorProfile);
    res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        "Could not open your Stripe dashboard. Finish payout onboarding first.",
    });
  }
};

// POST /api/creator/payouts/request  { amountCents? }
export const requestPayout = async (req, res) => {
  try {
    const profile = req.creatorProfile;
    const creatorId = req.user._id;

    if (!profile.payoutsEnabled) {
      return res.status(403).json({
        success: false,
        code: "PAYOUTS_NOT_ENABLED",
        message: profile.paidPublishBlocker() ?? "Payouts are not enabled.",
      });
    }

    // Recomputed server-side from the ledger. The client never states an
    // available balance, only how much of it to withdraw.
    const [balance, pending] = await Promise.all([
      LedgerEntry.balanceFor(creatorId),
      Payout.pendingTotalFor(creatorId),
    ]);
    const withdrawable = Math.max(0, balance.availableCents - pending);

    const requested = req.body?.amountCents
      ? parseInt(req.body.amountCents, 10)
      : withdrawable;

    if (!Number.isInteger(requested) || requested <= 0) {
      return res.status(400).json({
        success: false,
        message: "amountCents must be a positive integer.",
      });
    }
    if (requested > withdrawable) {
      return res.status(400).json({
        success: false,
        message: `You can withdraw at most ${formatMoney(withdrawable)}.`,
        withdrawableCents: withdrawable,
      });
    }
    if (requested < PAYOUT.MINIMUM_CENTS) {
      return res.status(400).json({
        success: false,
        message: `The minimum payout is ${formatMoney(PAYOUT.MINIMUM_CENTS)}.`,
      });
    }

    const payout = await Payout.create({
      creator: creatorId,
      creatorProfile: profile._id,
      amountCents: requested,
      status: "requested",
      stripeDestinationAccount: profile.stripeAccountId,
      periodEnd: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Payout requested. It will be reviewed and sent shortly.",
      data: payout,
    });
  } catch (error) {
    console.error("Payout request failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/payouts — this creator's payout history
export const listMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  startOnboarding,
  getStatus,
  getDashboardLink,
  requestPayout,
  listMyPayouts,
};
