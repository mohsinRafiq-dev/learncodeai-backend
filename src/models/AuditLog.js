import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true },
    targetType: { type: String, default: "" },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

auditLogSchema.statics.record = async function (req, action, targetType, targetId, metadata = {}) {
  try {
    const actor = req.user;
    if (!actor) return null;
    return await this.create({
      actor: actor._id,
      actorEmail: actor.email || "",
      action,
      targetType: targetType || "",
      targetId: targetId || null,
      metadata,
      ip: req.ip || req.headers?.["x-forwarded-for"] || "",
      userAgent: req.headers?.["user-agent"] || "",
    });
  } catch (e) {
    console.warn("AuditLog write failed:", e.message);
    return null;
  }
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
