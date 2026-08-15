import mongoose from "mongoose";

// What a user may access, and why.
//
// Replaces User.purchasedCourses[]. An array of ids cannot express why access
// was granted, cannot expire, cannot be revoked cleanly on refund, and cannot
// be audited. An entitlement can do all four, so a refund becomes a state
// change rather than an array splice.

const entitlementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // What is being granted.
    resourceType: {
      type: String,
      enum: ["course", "tutorial", "platform"], // "platform" = whole-catalogue access
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "resourceType",
      default: null, // null for platform-wide grants
    },

    // Why they have it. Drives what happens on refund or cancellation.
    source: {
      type: String,
      enum: ["purchase", "subscription", "grant", "creator", "bundle"],
      required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    // For "grant": which admin issued it and why.
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    grantReason: { type: String, default: null },

    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
      index: true,
    },

    // null = perpetual. Subscription-derived entitlements carry the period end.
    expiresAt: { type: Date, default: null },

    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
  },
  { timestamps: true }
);

// The hot path: "does this user have access to this resource right now".
entitlementSchema.index({ user: 1, resourceType: 1, resource: 1, status: 1 });
// Prevents two active entitlements for the same thing from the same order.
entitlementSchema.index(
  { user: 1, resource: 1, order: 1 },
  { unique: true, partialFilterExpression: { order: { $type: "objectId" } } }
);

entitlementSchema.methods.isCurrentlyValid = function () {
  if (this.status !== "active") return false;
  if (this.expiresAt && this.expiresAt <= new Date()) return false;
  return true;
};

/**
 * Grant access, idempotently. Re-running with the same order does not create a
 * duplicate — it returns the existing entitlement.
 */
entitlementSchema.statics.grant = async function ({
  user,
  resourceType,
  resource = null,
  source,
  order = null,
  expiresAt = null,
  grantedBy = null,
  grantReason = null,
}) {
  const existing = await this.findOne({
    user,
    resourceType,
    resource,
    ...(order ? { order } : { source }),
  });

  if (existing) {
    // Reactivate rather than duplicate — covers re-purchase after a refund.
    if (existing.status !== "active") {
      existing.status = "active";
      existing.revokedAt = null;
      existing.revokedReason = null;
    }
    existing.expiresAt = expiresAt;
    await existing.save();
    return existing;
  }

  return this.create({
    user, resourceType, resource, source, order, expiresAt, grantedBy, grantReason,
  });
};

/** Revoke everything tied to an order. Used on refund and chargeback. */
entitlementSchema.statics.revokeByOrder = async function (orderId, reason = "refunded") {
  return this.updateMany(
    { order: orderId, status: "active" },
    { $set: { status: "revoked", revokedAt: new Date(), revokedReason: reason } }
  );
};

/** Active, unexpired entitlements for a user. */
entitlementSchema.statics.activeFor = function (userId) {
  const now = new Date();
  return this.find({
    user: userId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();
};

const Entitlement = mongoose.model("Entitlement", entitlementSchema);
export default Entitlement;
