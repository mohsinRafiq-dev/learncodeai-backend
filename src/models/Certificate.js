import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseEnrollment",
      required: true,
    },
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null, // null = no expiry
    },
    finalScore: {
      type: Number,
      required: true,
    },
    certificateURL: {
      type: String,
      default: null,
    },
    template: {
      type: String,
      default: "standard",
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Add unique compound index for user and course (one certificate per user per course)
// Using sparse index to allow multiple null values
certificateSchema.index(
  { user: 1, course: 1 },
  { unique: true, sparse: true }
);

// Generate certificate number before saving
certificateSchema.pre("save", async function (next) {
  if (!this.certificateNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.certificateNumber = `CERT-${date.getFullYear()}-${random}-${timestamp}`;
  }
  next();
});

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;

