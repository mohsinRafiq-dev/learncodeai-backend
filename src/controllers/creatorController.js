// Creator-facing endpoints: apply to become a creator, read your own profile,
// and see your Studio dashboard.
//
// Admin-side review lives in adminCreatorController.js — keeping the two apart
// means a creator route can never accidentally expose an approval action.
//
// Spec: docs/BUSINESS_MODEL.md §1

import CreatorProfile from "../models/CreatorProfile.js";
import Course from "../models/Course.js";
import Order from "../models/Order.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Payout from "../models/Payout.js";
import User from "../models/User.js";
import emailService from "../services/emailService.js";

const APPLICATION_COOLDOWN_DAYS = 30;

// POST /api/creator/apply
export const apply = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      displayName,
      headline,
      bio,
      expertise,
      portfolioUrls,
      payoutCountry,
      motivation,
    } = req.body || {};

    if (!displayName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A display name is required.",
      });
    }
    if (!payoutCountry || payoutCountry.length !== 2) {
      return res.status(400).json({
        success: false,
        message:
          "A two-letter payout country is required — Stripe cannot change it later.",
      });
    }

    const existing = await CreatorProfile.findOne({ user: userId });

    if (existing) {
      if (existing.status === "approved") {
        return res.status(409).json({
          success: false,
          message: "You are already an approved creator.",
        });
      }
      if (existing.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "Your application is already under review.",
        });
      }
      if (existing.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your creator account is suspended. Contact support.",
        });
      }

      // Rejected: allow a re-application, but not immediately. Without a
      // cooldown a rejected applicant can resubmit in a loop and flood the
      // review queue.
      const since = existing.review?.reviewedAt;
      if (since) {
        const days = (Date.now() - new Date(since)) / 86400000;
        if (days < APPLICATION_COOLDOWN_DAYS) {
          return res.status(429).json({
            success: false,
            message: `You can re-apply ${Math.ceil(
              APPLICATION_COOLDOWN_DAYS - days
            )} day(s) from now.`,
          });
        }
      }

      existing.status = "pending";
      existing.application = {
        displayName: displayName.trim(),
        headline,
        bio,
        expertise: expertise ?? [],
        portfolioUrls: portfolioUrls ?? [],
        payoutCountry: payoutCountry.toUpperCase(),
        motivation,
        submittedAt: new Date(),
      };
      existing.review = { reviewedBy: null, reviewedAt: null, reason: null };
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Application resubmitted for review.",
        data: existing,
      });
    }

    const profile = await CreatorProfile.create({
      user: userId,
      status: "pending",
      application: {
        displayName: displayName.trim(),
        headline,
        bio,
        expertise: expertise ?? [],
        portfolioUrls: portfolioUrls ?? [],
        payoutCountry: payoutCountry.toUpperCase(),
        motivation,
        submittedAt: new Date(),
      },
    });

    await User.findByIdAndUpdate(userId, { creatorProfile: profile._id });

    res.status(201).json({
      success: true,
      message: "Application submitted. We'll review it shortly.",
      data: profile,
    });
  } catch (error) {
    console.error("Creator application failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/me — profile + whatever is currently blocking the creator
export const getMyProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: { status: "none", canApply: true },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...profile.toObject(),
        canSellPaidCourses: profile.canSellPaidCourses(),
        canPublishFreeCourses: profile.canPublishFreeCourses(),
        // A single actionable sentence beats making the UI infer the state.
        paidPublishBlocker: profile.paidPublishBlocker(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/dashboard — the Studio landing figures
export const getDashboard = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const profile = await CreatorProfile.findOne({ user: creatorId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "No creator profile." });
    }

    const [courses, balance, pendingPayouts, recentOrders, salesAgg] =
      await Promise.all([
        Course.find({ instructor: creatorId })
          .select("title status priceCents salesCount grossRevenueCents enrollmentCount averageRating includedInPro updatedAt")
          .sort({ updatedAt: -1 })
          .lean(),
        LedgerEntry.balanceFor(creatorId),
        Payout.pendingTotalFor(creatorId),
        Order.find({ creator: creatorId, status: "paid" })
          .sort({ paidAt: -1 })
          .limit(10)
          .populate("user", "name")
          .select("snapshot grossCents creatorEarningsCents paidAt user")
          .lean(),
        Order.aggregate([
          { $match: { creator: creatorId, status: { $in: ["paid", "partially_refunded"] } } },
          {
            $group: {
              _id: null,
              sales: { $sum: 1 },
              gross: { $sum: "$grossCents" },
              earnings: { $sum: "$creatorEarningsCents" },
            },
          },
        ]),
      ]);

    const totals = salesAgg[0] ?? { sales: 0, gross: 0, earnings: 0 };
    const byStatus = courses.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        profile: {
          status: profile.status,
          displayName: profile.application?.displayName,
          payoutsEnabled: profile.payoutsEnabled,
          paidPublishBlocker: profile.paidPublishBlocker(),
          platformFeeBps: profile.platformFeeBps,
        },
        courses: { total: courses.length, byStatus, list: courses },
        sales: {
          count: totals.sales,
          grossCents: totals.gross,
          earningsCents: totals.earnings,
        },
        balance: {
          ...balance,
          // Funds already committed to an unsettled payout cannot be
          // requested again.
          withdrawableCents: Math.max(0, balance.availableCents - pendingPayouts),
          pendingPayoutCents: pendingPayouts,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Creator dashboard failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/earnings — ledger history, paginated
export const getEarnings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit ?? "25", 10));

    const [entries, total, balance] = await Promise.all([
      LedgerEntry.find({ creator: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("course", "title")
        .lean(),
      LedgerEntry.countDocuments({ creator: req.user._id }),
      LedgerEntry.balanceFor(req.user._id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        entries,
        balance,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Notify an applicant of the review decision. Best-effort. */
export const notifyDecision = async (userId, approved, reason) => {
  try {
    const user = await User.findById(userId).select("email name");
    if (!user || !emailService.isAvailable()) return;

    await emailService.sendGenericEmail?.({
      to: user.email,
      subject: approved
        ? "You're approved as a LearnCode AI creator"
        : "Update on your LearnCode AI creator application",
      html: approved
        ? `<p>Hi ${user.name},</p><p>Your creator application has been approved. You can now create courses from your Creator Studio.</p>`
        : `<p>Hi ${user.name},</p><p>We weren't able to approve your creator application at this time.</p><p><strong>Reason:</strong> ${
            reason || "Not specified"
          }</p><p>You're welcome to apply again in 30 days.</p>`,
    });
  } catch (err) {
    console.warn("Creator decision email failed:", err.message);
  }
};

export default { apply, getMyProfile, getDashboard, getEarnings, notifyDecision };
