// Admin review of creator applications.
//
// Kept apart from creatorController so that no creator-facing route can reach
// an approval action — the person who submits an application must never share a
// controller with the person who decides it.

import CreatorProfile from "../models/CreatorProfile.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import { notifyDecision } from "./creatorController.js";
import {
  MIN_PLATFORM_FEE_BPS,
  MAX_PLATFORM_FEE_BPS,
} from "../config/monetization.js";

// AuditLog.record captures the actor, IP and user-agent from the request and
// already swallows its own failures, so an audit write can never block the
// action it is recording.
const logAction = (req, action, targetId, meta = {}) =>
  AuditLog.record(req, action, "CreatorProfile", targetId, meta);

// GET /api/admin/creators?status=pending
export const listApplications = async (req, res) => {
  try {
    const { status = "pending", search = "" } = req.query;
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit ?? "20", 10));

    const query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query["application.displayName"] = { $regex: search, $options: "i" };
    }

    const [profiles, total, counts] = await Promise.all([
      CreatorProfile.find(query)
        .populate("user", "name email profilePicture createdAt")
        .populate("review.reviewedBy", "name")
        .sort({ "application.submittedAt": -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CreatorProfile.countDocuments(query),
      CreatorProfile.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        applications: profiles,
        counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/creators/:id — full detail for the review screen
export const getApplication = async (req, res) => {
  try {
    const profile = await CreatorProfile.findById(req.params.id)
      .populate("user", "name email profilePicture createdAt lastLogin")
      .populate("review.reviewedBy", "name");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    // Context a reviewer actually needs: has this person engaged with the
    // platform at all, and have they sold anything before?
    const [courseCount, orderSummary] = await Promise.all([
      Course.countDocuments({ instructor: profile.user._id }),
      Order.revenueSummary({ creator: profile.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: { ...profile.toObject(), context: { courseCount, orderSummary } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/creators/:id/decision  { decision, reason, platformFeeBps }
export const decide = async (req, res) => {
  try {
    const { decision, reason, platformFeeBps } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "decision must be 'approve' or 'reject'.",
      });
    }
    if (decision === "reject" && !reason?.trim()) {
      // A rejection without a reason is not actionable for the applicant and
      // is the main thing that generates support load.
      return res.status(400).json({
        success: false,
        message: "A reason is required when rejecting an application.",
      });
    }

    const profile = await CreatorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    if (profile.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `This application is already ${profile.status}.`,
      });
    }

    // Needed to decide the role change without clobbering an existing one.
    const user = await User.findById(profile.user).select("role");

    profile.status = decision === "approve" ? "approved" : "rejected";
    profile.review = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      reason: reason?.trim() ?? null,
    };

    if (decision === "approve" && platformFeeBps !== undefined) {
      const bps = parseInt(platformFeeBps, 10);
      if (
        Number.isNaN(bps) ||
        bps < MIN_PLATFORM_FEE_BPS ||
        bps > MAX_PLATFORM_FEE_BPS
      ) {
        return res.status(400).json({
          success: false,
          message: `platformFeeBps must be between ${MIN_PLATFORM_FEE_BPS} and ${MAX_PLATFORM_FEE_BPS}.`,
        });
      }
      profile.platformFeeBps = bps;
    }

    await profile.save();

    // The role is what unlocks the Studio, but it must never overwrite admin.
    // Creator status is additive (docs/BUSINESS_MODEL.md §1): an admin who is
    // approved as a creator is both, and blanket-assigning "creator" silently
    // stripped their admin access — locking them out of this very screen.
    if (decision === "approve") {
      await User.findByIdAndUpdate(profile.user, {
        creatorProfile: profile._id,
        // Only promote an ordinary user; leave admin (and creator) alone.
        ...(user?.role === "user" ? { role: "creator" } : {}),
      });
    }

    await logAction(req, `creator_${decision}`, profile._id, {
      reason: reason ?? null,
      platformFeeBps: profile.platformFeeBps,
    });

    notifyDecision(profile.user, decision === "approve", reason).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Application ${profile.status}.`,
      data: profile,
    });
  } catch (error) {
    console.error("Creator decision failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/creators/:id/suspend  { suspend: boolean, reason }
export const setSuspension = async (req, res) => {
  try {
    const { suspend, reason } = req.body || {};
    const profile = await CreatorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Creator not found." });
    }

    // Same rule as approval: suspending a creator must not strip an unrelated
    // admin role. Only the creator role is added or removed here.
    const target = await User.findById(profile.user).select("role");

    if (suspend) {
      profile.status = "suspended";
      profile.review.reason = reason ?? "Suspended by admin";
      // Pull their catalogue while suspended. Existing buyers keep access via
      // their entitlements — a policy breach by the creator must not retro-
      // actively take content away from learners who paid for it.
      await Course.updateMany(
        { instructor: profile.user, status: "published" },
        { $set: { status: "suspended", isPublished: false } }
      );
      if (target?.role === "creator") {
        await User.findByIdAndUpdate(profile.user, { role: "user" });
      }
    } else {
      profile.status = "approved";
      profile.review.reason = null;
      if (target?.role === "user") {
        await User.findByIdAndUpdate(profile.user, { role: "creator" });
      }
    }

    await profile.save();
    await logAction(req, suspend ? "creator_suspend" : "creator_reinstate", profile._id, {
      reason: reason ?? null,
    });

    res.status(200).json({
      success: true,
      message: suspend ? "Creator suspended." : "Creator reinstated.",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { listApplications, getApplication, decide, setSuspension };
