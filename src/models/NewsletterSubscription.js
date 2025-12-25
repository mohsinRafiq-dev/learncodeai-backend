import mongoose from "mongoose";

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
newsletterSubscriptionSchema.index({ email: 1 });
newsletterSubscriptionSchema.index({ subscribedAt: -1 });
newsletterSubscriptionSchema.index({ isActive: 1 });

export default mongoose.model(
  "NewsletterSubscription",
  newsletterSubscriptionSchema
);

