import jwt from "jsonwebtoken";
import User from "../models/User.js";
import emailService from "../services/emailService.js";

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "your-super-secret-jwt-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "90d",
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  };

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Step 1: Initial signup - creates user and sends verification email
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, email, password, and confirm password",
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email, please enter a valid email",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but not verified, resend verification email
      if (
        !existingUser.isEmailVerified &&
        existingUser.accountStatus === "pending"
      ) {
        // Update user details if provided (in case they want to change name/password)
        if (name !== existingUser.name) {
          existingUser.name = name;
        }
        if (password) {
          existingUser.password = password; // This will be hashed by the pre-save middleware
        }
        await existingUser.save();

        // Generate and send new verification OTP
        const otp = emailService.generateOTP();
        await existingUser.setEmailVerificationOTP(otp);

        if (emailService.isAvailable()) {
          try {
            await emailService.sendVerificationOTP(
              email,
              otp,
              existingUser.name
            );

            return res.status(200).json({
              status: "success",
              message:
                "Account already exists but not verified. New verification code sent to your email.",
              data: {
                email: existingUser.email,
                name: existingUser.name,
                needsVerification: true,
                isResend: true,
              },
            });
          } catch (emailError) {
            return res.status(500).json({
              status: "error",
              message: "Failed to send verification email. Please try again.",
            });
          }
        } else {
          // If email service not available, auto-verify
          await existingUser.clearEmailVerificationOTP();
          createSendToken(existingUser, 200, res);
          return;
        }
      }

      return res.status(400).json({
        status: "fail",
        message: "User with this email already exists and is verified",
      });
    }

    // Create new user (account will be pending until email verification)
    const newUser = await User.create({
      name,
      email,
      password,
      accountStatus: "pending",
      isEmailVerified: false,
    });

    // Generate and save verification OTP
    const otp = emailService.generateOTP();
    await newUser.setEmailVerificationOTP(otp);

    // Send verification email if email service is available
    if (emailService.isAvailable()) {
      try {
        await emailService.sendVerificationOTP(email, otp, name);

        res.status(201).json({
          status: "success",
          message:
            "Account created successfully! Please check your email for verification code.",
          data: {
            email: newUser.email,
            name: newUser.name,
            needsVerification: true,
          },
        });
      } catch (emailError) {
        // If email fails, delete the user and return error
        await User.findByIdAndDelete(newUser._id);

        return res.status(500).json({
          status: "error",
          message: "Enter a valid email.",
        });
      }
    } else {
      // If email service not available, auto-verify for development
      console.log(
        "⚠️  Email service not available - auto-verifying user for development"
      );
      await newUser.clearEmailVerificationOTP();

      createSendToken(newUser, 201, res);
    }
  } catch (error) {
    console.error("Signup error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: errors.join(". "),
      });
    }

    res.status(500).json({
      status: "error",
      message: "Something went wrong during signup",
    });
  }
};

// Step 2: Verify email with OTP
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("📧 Email verification attempt:", {
      email,
      otp: otp ? "****" : "missing",
    });

    if (!email || !otp) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and OTP",
      });
    }

    // Find user - more flexible query
    const user = await User.findOne({ email });
    console.log(
      "📧 User found:",
      user
        ? {
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            accountStatus: user.accountStatus,
            hasOTP: !!user.emailVerificationOTP,
            otpExpires: user.emailVerificationOTPExpires,
          }
        : "No user found"
    );

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email address",
      });
    }

    // Check if account is already verified
    if (user.isEmailVerified && user.accountStatus === "active") {
      return res.status(400).json({
        status: "fail",
        message: "Account is already verified",
      });
    }

    // Check if user has a valid OTP set
    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      return res.status(400).json({
        status: "fail",
        message:
          "No pending verification found for this email. Please request a new verification code.",
      });
    }

    // Verify OTP
    console.log("📧 Verifying OTP:", {
      providedOTP: otp,
      storedOTP: user.emailVerificationOTP,
      isExpired: Date.now() > user.emailVerificationOTPExpires,
      expiresAt: new Date(user.emailVerificationOTPExpires),
    });

    const otpIsValid = user.verifyEmailOTP(otp);
    console.log("📧 OTP verification result:", otpIsValid);

    if (!otpIsValid) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP and activate account
    console.log("📧 Clearing OTP and activating account...");
    await user.clearEmailVerificationOTP();
    console.log("📧 Account activated successfully");

    // Send JWT token
    createSendToken(user, 200, res);
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong during email verification",
    });
  }
};

// Resend verification OTP
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email",
      });
    }

    // Find user with pending verification
    const user = await User.findOne({
      email,
      accountStatus: "pending",
      isEmailVerified: false,
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "No pending verification found for this email",
      });
    }

    // Generate new OTP
    const otp = emailService.generateOTP();
    await user.setEmailVerificationOTP(otp);

    // Send verification email
    if (emailService.isAvailable()) {
      try {
        await emailService.sendVerificationOTP(email, otp, user.name);

        res.status(200).json({
          status: "success",
          message: "Verification code sent to your email",
        });
      } catch (emailError) {
        res.status(500).json({
          status: "error",
          message: "Failed to send verification email. Please try again.",
        });
      }
    } else {
      res.status(500).json({
        status: "error",
        message: "Email service is not available",
      });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong while resending OTP",
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    // Verify password first
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      // Check if account is currently locked (only for wrong password)
      if (user.isAccountLocked()) {
        const lockTimeRemaining = Math.ceil(
          (user.accountLockedUntil - Date.now()) / (60 * 1000)
        ); // minutes
        return res.status(423).json({
          status: "fail",
          message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
          accountLocked: true,
          lockTimeRemaining,
        });
      }

      // Increment failed attempts
      await user.incrementFailedAttempts();

      const attemptsRemaining = 5 - user.failedLoginAttempts;

      if (user.failedLoginAttempts >= 5) {
        return res.status(423).json({
          status: "fail",
          message:
            "Account has been temporarily locked due to too many failed login attempts. Please try again in 30 minutes.",
          accountLocked: true,
          lockTimeRemaining: 30,
        });
      }

      return res.status(401).json({
        status: "fail",
        message: `Incorrect email or password. ${attemptsRemaining} attempts remaining before account lockout.`,
        attemptsRemaining,
      });
    }

    // Password is correct - reset failed attempts if any (even if account was locked)
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      await user.resetFailedAttempts();
    }

    // Check if email is verified
    if (!user.isEmailVerified || user.accountStatus === "pending") {
      // Generate and send new verification OTP automatically
      const otp = emailService.generateOTP();
      await user.setEmailVerificationOTP(otp);

      if (emailService.isAvailable()) {
        try {
          await emailService.sendVerificationOTP(email, otp, user.name);

          return res.status(401).json({
            status: "fail",
            message:
              "Your email is not verified. We sent a new verification code to your email.",
            needsEmailVerification: true,
            email: user.email,
            autoResent: true,
          });
        } catch (emailError) {
          return res.status(401).json({
            status: "fail",
            message:
              "Please verify your email before signing in. Failed to send verification email.",
            needsEmailVerification: true,
            email: user.email,
            autoResent: false,
          });
        }
      } else {
        return res.status(401).json({
          status: "fail",
          message: "Please verify your email before signing in",
          needsEmailVerification: true,
          email: user.email,
          autoResent: false,
        });
      }
    }

    // Check if account is suspended
    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        status: "fail",
        message:
          "Your account has been suspended. Please contact support for more information.",
        accountStatus: "suspended",
        isSuspended: true,
      });
    }

    // Update last login
    await user.updateLastLogin();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong during signin",
    });
  }
};

export const protect = async (req, res, next) => {
  try {
    // Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // Verification token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key"
    );

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token does no longer exist.",
      });
    }

    // Check if account is suspended
    if (currentUser.accountStatus === "suspended") {
      return res.status(403).json({
        status: "fail",
        message: "Your account has been suspended. Please contact support.",
      });
    }

    // Check if account is currently locked due to failed login attempts
    if (currentUser.isAccountLocked()) {
      const lockTimeRemaining = Math.ceil(
        (currentUser.accountLockedUntil - Date.now()) / (60 * 1000)
      ); // minutes
      return res.status(423).json({
        status: "fail",
        message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
        accountLocked: true,
        lockTimeRemaining,
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error("Auth protection error:", error);
    return res.status(401).json({
      status: "fail",
      message: "Invalid token. Please log in again!",
    });
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// OAuth success callback
export const oauthSuccess = (req, res) => {
  // User is authenticated via passport
  const user = req.user;

  if (!user) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/signin?error=oauth_failed`
    );
  }

  // Check if account is suspended
  if (user.accountStatus === "suspended") {
    return res.redirect(
      `${process.env.FRONTEND_URL}/signin?error=account_suspended`
    );
  }

  // Update last login
  user.updateLastLogin();

  // Create JWT token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "your-super-secret-jwt-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "90d",
    }
  );

  // Set cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookieOptions);

  // Redirect to frontend with success
  res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
};

// OAuth failure callback
export const oauthFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
};

// Password Reset Functions

// Step 1: Request password reset - sends OTP to email
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email address",
      });
    }

    // Find user by email
    const user = await User.findOne({
      email,
      accountStatus: "active",
      isEmailVerified: true,
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        status: "success",
        message:
          "If an account with this email exists, you will receive a password reset code.",
      });
    }

    // Generate and save password reset OTP
    const otp = emailService.generateOTP();
    await user.setPasswordResetOTP(otp);

    // Send password reset email if email service is available
    if (emailService.isAvailable()) {
      try {
        await emailService.sendPasswordResetOTP(email, otp, user.name);

        res.status(200).json({
          status: "success",
          message: "Password reset code sent to your email",
        });
      } catch (emailError) {
        res.status(500).json({
          status: "error",
          message: "Failed to send reset email. Please try again.",
        });
      }
    } else {
      // Email service not available - for development, still return success
      console.log(
        `⚠️  Email service not available - password reset OTP for ${email}: ${otp}`
      );
      res.status(200).json({
        status: "success",
        message: "Password reset code generated (email service unavailable)",
      });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong while processing your request",
    });
  }
};

// Step 2: Verify password reset OTP
export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and OTP",
      });
    }

    // Find user
    const user = await User.findOne({
      email,
      accountStatus: "active",
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email",
      });
    }

    // Verify OTP
    if (!user.verifyPasswordResetOTP(otp)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired OTP",
      });
    }

    // Generate temporary token for password reset (valid for 10 minutes)
    const resetToken = jwt.sign(
      {
        id: user._id,
        purpose: "password-reset",
      },
      process.env.JWT_SECRET || "your-super-secret-jwt-key",
      { expiresIn: "10m" }
    );

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Password reset OTP verification error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong during OTP verification",
    });
  }
};

// Step 3: Reset password with new password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide reset token, new password, and confirm password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || "your-super-secret-jwt-key"
      );

      if (decoded.purpose !== "password-reset") {
        throw new Error("Invalid token purpose");
      }
    } catch (jwtError) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired reset token",
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Update password and clear reset OTP
    user.password = newPassword;
    await user.clearPasswordResetOTP();
    await user.save();

    // Generate JWT token for automatic login
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-super-secret-jwt-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      token,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong during password reset",
    });
  }
};

