import mongoose from "mongoose";
import { PLATFORM_FEE_BPS } from "../config/monetization.js";

// A creator is a user with an approved CreatorProfile. The profile carries the
// application, the review decision, the Stripe Connect account, and the
// aggregates the Creator Studio renders.
//
// Kept separate from User so that the vast majority of users (learners) do not
// carry a dozen empty marketplace fields, and so revoking creator status is a
// state change on one document rather than a scattered cleanup.

const creatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ---------- Application ----------
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },
    application: {
      displayName: { type: String, required: true, trim: true, maxlength: 60 },
      headline: { type: String, trim: true, maxlength: 120 },
      bio: { type: String, trim: true, maxlength: 1500 },
      expertise: [{ type: String, trim: true }],
      // Links to prior work — the main thing a reviewer actually assesses.
      portfolioUrls: [{ type: String, trim: true }],
      // Stripe Connect needs the country up front; it cannot be changed later.
      payoutCountry: { type: String, uppercase: true, minlength: 2, maxlength: 2 },
      motivation: { type: String, trim: true, maxlength: 1000 },
      submittedAt: { type: Date, default: Date.now },
    },
    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, default: null },
      // Shown to the applicant on rejection, so the decision is actionable.
      reason: { type: String, trim: true, maxlength: 1000, default: null },
    },

    // ---------- Commercial terms ----------
    // Per-creator override of the platform cut. Bounded in monetization.js so a
    // mistyped value cannot give away the platform's entire margin.
    platformFeeBps: {
      type: Number,
      default: PLATFORM_FEE_BPS,
      min: 0,
      max: 10000,
    },

    // ---------- Stripe Connect ----------
    stripeAccountId: { type: String, default: null, index: true },
    // Mirrored from account.updated webhooks. A paid course cannot be published
    // until payoutsEnabled is true.
    chargesEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false },
    // Stripe's outstanding requirements, surfaced verbatim in the Studio so the
    // creator knows exactly what is blocking them.
    requirementsDue: [{ type: String }],
    onboardingCompletedAt: { type: Date, default: null },

    // ---------- Aggregates ----------
    // Denormalised for the dashboard. Authoritative figures always come from
    // the Order and LedgerEntry collections; these are a cache.
    stats: {
      publishedCourses: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      grossRevenueCents: { type: Number, default: 0 },
      netEarningsCents: { type: Number, default: 0 },
      paidOutCents: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

creatorProfileSchema.index({ status: 1, createdAt: -1 });

// Can this creator sell a paid course right now?
creatorProfileSchema.methods.canSellPaidCourses = function () {
  return this.status === "approved" && this.payoutsEnabled === true;
};

// Free courses only need approval, not payout onboarding.
creatorProfileSchema.methods.canPublishFreeCourses = function () {
  return this.status === "approved";
};

// Human-readable reason a paid publish is blocked, for the Studio UI.
creatorProfileSchema.methods.paidPublishBlocker = function () {
  if (this.status === "pending") return "Your creator application is still under review.";
  if (this.status === "rejected") return "Your creator application was not approved.";
  if (this.status === "suspended") return "Your creator account is suspended.";
  if (!this.stripeAccountId) return "Connect a payout account to sell paid courses.";
  if (!this.detailsSubmitted) return "Finish your Stripe onboarding to sell paid courses.";
  if (!this.payoutsEnabled) {
    return this.requirementsDue?.length
      ? `Stripe still needs: ${this.requirementsDue.slice(0, 3).join(", ")}`
      : "Stripe has not enabled payouts on your account yet.";
  }
  return null;
};

const CreatorProfile = mongoose.model("CreatorProfile", creatorProfileSchema);
export default CreatorProfile;
