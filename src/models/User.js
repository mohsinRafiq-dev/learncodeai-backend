import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
        },
        message: "Invalid email, please enter a valid email",
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.githubId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
      validate: {
        validator: function (password) {
          if (!password || this.googleId || this.githubId) return true;
          // Strong password requirements:
          // - At least 8 characters
          // - At least one lowercase letter
          // - At least one uppercase letter  
          // - At least one number
          // - At least one special character
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return strongPasswordRegex.test(password);
        },
        message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character"
      },
      select: false,
    },
    googleId: { type: String, default: null, sparse: true },
    githubId: { type: String, default: null, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastLogin: { type: Date, default: null },
    profilePicture: { type: String, default: null },

    // Profile Information
    dateOfBirth: { type: Date, default: null },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: null,
    },
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: null,
    },
    github: { type: String, default: null },
    linkedin: { type: String, default: null },
    website: { type: String, default: null },

    // Skills and Interests
    programmingLanguages: [{ type: String }],
    skills: [{ type: String }],
    interests: [{ type: String }],
    experience: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert", null],
      default: null,
    },

    // Profile Completion
    isProfileComplete: { type: Boolean, default: false },
    profileCompletionPromptShown: { type: Boolean, default: false },

    // OTPs
    emailVerificationOTP: { type: String, default: null },
    emailVerificationOTPExpires: { type: Date, default: null },
    passwordResetOTP: { type: String, default: null },
    passwordResetOTPExpires: { type: Date, default: null },

    // Account status
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },

    // Failed login attempts tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
      default: null,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },

    // Preferences
    preferences: {
      emailNotifications: { type: Boolean, default: true },
    },

    // Linked data
    enrolledTutorials: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tutorial" },
    ],
    enrolledCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CourseEnrollment" },
    ],
    savedCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "CodeSnippet" }],
    progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],
    certificates: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    ],

    // Recent AI chat messages
    recentAIChats: [
      {
        message: String,
        response: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Gamification
    gamification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserGamification",
      default: null,
    },
    streak: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Streak",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔐 Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🧩 Methods
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return await bcrypt.compare(candidate, hashed);
};
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.setEmailVerificationOTP = function (otp) {
  this.emailVerificationOTP = otp;
  this.emailVerificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.verifyEmailOTP = function (otp) {
  if (
    !this.emailVerificationOTP ||
    Date.now() > this.emailVerificationOTPExpires
  )
    return false;
  return this.emailVerificationOTP === otp;
};
userSchema.methods.clearEmailVerificationOTP = function () {
  this.emailVerificationOTP = null;
  this.emailVerificationOTPExpires = null;
  this.isEmailVerified = true;
  // Only set to active if account is currently pending
  // Don't override suspended or other statuses
  if (this.accountStatus === "pending") {
    this.accountStatus = "active";
  }
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.setPasswordResetOTP = function (otp) {
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.verifyPasswordResetOTP = function (otp) {
  if (!this.passwordResetOTP || Date.now() > this.passwordResetOTPExpires)
    return false;
  return this.passwordResetOTP === otp;
};
userSchema.methods.clearPasswordResetOTP = function () {
  this.passwordResetOTP = null;
  this.passwordResetOTPExpires = null;
  return this.save({ validateBeforeSave: false });
};

// Failed login attempt methods
userSchema.methods.isAccountLocked = function () {
  // If there's a lock time set but it has expired, clear it
  if (this.accountLockedUntil && this.accountLockedUntil <= Date.now()) {
    this.accountLockedUntil = null;
    // Don't automatically reset failed attempts here to preserve the count
    // They will be reset on successful login
    this.save({ validateBeforeSave: false });
    return false;
  }
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

userSchema.methods.incrementFailedAttempts = function () {
  // If we have a previous failed login attempt and it's been more than 2 hours,
  // reset the counter (this gives users a fresh start after some time)
  if (
    this.lastFailedLogin &&
    Date.now() - this.lastFailedLogin > 2 * 60 * 60 * 1000
  ) {
    this.failedLoginAttempts = 1;
  } else {
    this.failedLoginAttempts += 1;
  }

  this.lastFailedLogin = new Date();

  // If we've reached 5 failed attempts, lock the account for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  return this.save({ validateBeforeSave: false });
};

userSchema.methods.resetFailedAttempts = function () {
  if (
    this.failedLoginAttempts ||
    this.lastFailedLogin ||
    this.accountLockedUntil
  ) {
    this.failedLoginAttempts = 0;
    this.lastFailedLogin = null;
    this.accountLockedUntil = null;
    return this.save({ validateBeforeSave: false });
  }
  return Promise.resolve();
};

const User = mongoose.model("User", userSchema);
export default User;

