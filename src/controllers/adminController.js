import User from "../models/User.js";
import Tutorial from "../models/Tutorial.js";
import AIChat from "../models/AIChat.js";
import Progress from "../models/Progress.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";
import NewsletterSubscription from "../models/NewsletterSubscription.js";
import ErrorLog from "../models/ErrorLog.js";
import ContentVersion from "../models/ContentVersion.js";
import PlatformSettings from "../models/PlatformSettings.js";
import AuditLog from "../models/AuditLog.js";
import { invalidateMaintenanceCache } from "../middleware/maintenanceMode.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ accountStatus: "active" });
    const suspendedUsers = await User.countDocuments({ accountStatus: "suspended" });
    const totalTutorials = await Tutorial.countDocuments();
    const totalChats = await AIChat.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await CourseEnrollment.countDocuments();

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate previous period for growth rate
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const userGrowthRate = previousPeriodUsers > 0 
      ? (((newUsersLast30Days - previousPeriodUsers) / previousPeriodUsers) * 100).toFixed(1)
      : "0.0";

    // Get recent enrollments (last 30 days)
    const recentEnrollments = await CourseEnrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo },
    });

    const previousEnrollments = await CourseEnrollment.countDocuments({
      enrolledAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const enrollmentGrowthRate = previousEnrollments > 0
      ? (((recentEnrollments - previousEnrollments) / previousEnrollments) * 100).toFixed(1)
      : "0.0";

    // Get recent tutorials (last 30 days)
    const recentTutorials = await Tutorial.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const previousTutorials = await Tutorial.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const tutorialGrowthRate = previousTutorials > 0
      ? (((recentTutorials - previousTutorials) / previousTutorials) * 100).toFixed(1)
      : "0.0";

    // Get recent AI chats (last 30 days)
    const recentChats = await AIChat.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const previousChats = await AIChat.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const chatGrowthRate = previousChats > 0
      ? (((recentChats - previousChats) / previousChats) * 100).toFixed(1)
      : "0.0";

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        totalTutorials,
        totalChats,
        totalCourses,
        totalEnrollments,
        newUsersLast30Days,
        suspensionRate: ((suspendedUsers / totalUsers) * 100).toFixed(2),
        userGrowthRate,
        enrollmentGrowthRate,
        tutorialGrowthRate,
        chatGrowthRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.accountStatus = status;

    const users = await User.find(filter)
      .select("-password")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user status (suspend, activate, etc.)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus, reason } = req.body;

    if (!["pending", "active", "suspended"].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send notification email
    await notifyUserStatusChange(user, accountStatus, reason);

    AuditLog.record(req, 'user_status_changed', 'User', user._id, { accountStatus, reason });

    res.status(200).json({
      success: true,
      message: `User status updated to ${accountStatus}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change user role (promote to admin)
export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent self-demotion from admin
    if (req.user._id.toString() === userId && role === "user") {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself from admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    AuditLog.record(req, 'user_role_changed', 'User', user._id, { role });

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user account
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    AuditLog.record(req, 'user_deleted', 'User', user._id, { email: user.email });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user details (admin edit)
export const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, bio, profilePicture, skills, programmingLanguages, interests, experience } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (skills) updateData.skills = skills;
    if (programmingLanguages) updateData.programmingLanguages = programmingLanguages;
    if (interests) updateData.interests = interests;
    if (experience && experience !== "") updateData.experience = experience;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send email to user
export const sendEmailToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Import email service
    const emailService = (await import('../services/emailService.js')).default;

    if (!emailService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Email service is not available",
      });
    }

    // Send custom email
    await emailService.sendCustomEmail(user.email, subject, message, user.name);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send notification email on account status change
export const notifyUserStatusChange = async (user, accountStatus, reason = "") => {
  try {
    const emailService = (await import('../services/emailService.js')).default;
    
    if (!emailService.isAvailable()) {
      console.log("Email service not available, skipping notification");
      return;
    }

    let subject = "";
    let message = "";

    if (accountStatus === "suspended") {
      subject = "Your Account Has Been Suspended - LearnCode AI";
      message = `
        <p>Dear ${user.name},</p>
        <p>Your LearnCode AI account has been suspended.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>If you believe this is an error, please contact our support team.</p>
        <p>Best regards,<br>LearnCode AI Team</p>
      `;
    } else if (accountStatus === "active") {
      subject = "Your Account Has Been Activated - LearnCode AI";
      message = `
        <p>Dear ${user.name},</p>
        <p>Good news! Your LearnCode AI account has been reactivated and is now fully operational.</p>
        <p>You can now log in and access all features of the platform.</p>
        ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
        <p>Thank you for being part of our community!</p>
        <p>Best regards,<br>LearnCode AI Team</p>
      `;
    }

    if (subject && message) {
      await emailService.sendCustomEmail(user.email, subject, message, user.name);
    }
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
};

// Get all tutorials
export const getAllTutorials = async (req, res) => {
  try {
    const { page = 1, limit = 10, language = "", search = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (language) filter.language = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { concept: { $regex: search, $options: "i" } },
      ];
    }

    const tutorials = await Tutorial.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Tutorial.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tutorials,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update tutorial
export const updateTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const updateData = req.body;
    const changeNote = req.body.__changeNote || "";
    delete updateData.__changeNote;

    // Snapshot the existing content before update
    const existing = await Tutorial.findById(tutorialId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Tutorial not found" });
    }

    const tutorial = await Tutorial.findByIdAndUpdate(
      tutorialId,
      updateData,
      { new: true, runValidators: true }
    );

    // Persist version history (best-effort; don't fail update if this errors)
    ContentVersion.recordVersion({
      contentType: "tutorial",
      contentId: tutorialId,
      snapshot: existing,
      changedBy: req.user?._id || null,
      changeNote,
    }).catch((e) => console.warn("Tutorial version save failed:", e.message));

    res.status(200).json({
      success: true,
      message: "Tutorial updated successfully",
      data: tutorial,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete tutorial
export const deleteTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findByIdAndDelete(tutorialId);

    if (!tutorial) {
      return res.status(404).json({ success: false, message: "Tutorial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tutorial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new tutorial (by admin)
export const createTutorial = async (req, res) => {
  try {
    const { title, description, language, concept, content, difficulty, codeExamples, tags, notes, tips } = req.body;

    const tutorial = await Tutorial.create({
      title,
      description,
      language,
      concept,
      content,
      difficulty,
      codeExamples,
      tags,
      notes,
      tips,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Tutorial created successfully",
      data: tutorial,
    });
  } catch (error) {
    console.error("Error creating tutorial:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics data
// Simple in-memory cache for the analytics endpoint
const analyticsCache = new Map();
const ANALYTICS_TTL_MS = 5 * 60 * 1000;

export const getAnalytics = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const cacheKey = `analytics:${days}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.at < ANALYTICS_TTL_MS) {
      return res.status(200).json({ success: true, cached: true, data: cached.data });
    }
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Top-line KPIs
    const [
      totalUsers,
      activeUsers,
      newSignups,
      totalCourses,
      totalTutorials,
      publishedTutorials,
      totalChats,
      totalEnrollments,
      totalCertificates,
      totalErrors,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "active" }),
      User.countDocuments({ createdAt: { $gte: since } }),
      Course.countDocuments(),
      Tutorial.countDocuments(),
      Tutorial.countDocuments({ isPublished: true }),
      AIChat.countDocuments({ createdAt: { $gte: since } }),
      CourseEnrollment.countDocuments(),
      Certificate.countDocuments(),
      ErrorLog.countDocuments({ occurredAt: { $gte: since } }),
    ]);

    // User signup trend (per day)
    const userTrend = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most used languages (from progress + errors)
    const languageStats = await Progress.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Error frequency stats
    const [errorsByType, errorsByLanguage, errorTrend] = await Promise.all([
      ErrorLog.aggregate([
        { $match: { occurredAt: { $gte: since } } },
        { $group: { _id: "$errorType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ErrorLog.aggregate([
        { $match: { occurredAt: { $gte: since } } },
        { $group: { _id: "$language", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ErrorLog.aggregate([
        { $match: { occurredAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // AI chat category breakdown (by context)
    const chatCategories = await AIChat.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $ifNull: ["$context", "general"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Top performing courses (by enrollments + average completion)
    const topCourses = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: "$course",
          enrollments: { $sum: 1 },
          avgProgress: { $avg: "$overallProgress" },
          avgTimeMinutes: { $avg: "$totalTimeSpentMinutes" },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 1,
          name: "$course.title",
          category: "$course.language",
          views: "$enrollments",
          completion: { $round: [{ $ifNull: ["$avgProgress", 0] }, 0] },
          avgTime: { $round: [{ $ifNull: ["$avgTimeMinutes", 0] }, 0] },
        },
      },
    ]);

    // Engagement summary
    const totalTimeSpent = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: null,
          minutes: { $sum: "$totalTimeSpentMinutes" },
        },
      },
    ]);

    const payload = {
      rangeDays: days,
      totals: {
        totalUsers,
        activeUsers,
        newSignups,
        totalCourses,
        totalTutorials,
        publishedTutorials,
        totalChats,
        totalEnrollments,
        totalCertificates,
        totalErrors,
        totalEngagementMinutes: totalTimeSpent[0]?.minutes || 0,
      },
      userTrend,
      languageStats,
      errors: {
        byType: errorsByType,
        byLanguage: errorsByLanguage,
        trend: errorTrend,
      },
      chatCategories,
      topCourses,
    };

    analyticsCache.set(cacheKey, { at: Date.now(), data: payload });
    res.status(200).json({ success: true, cached: false, data: payload });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Funnel: signup → first lesson → first quiz → first certificate
export const getFunnel = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const signups = await User.countDocuments({ createdAt: { $gte: since } });

    const firstEnrollments = await CourseEnrollment.distinct("user", {
      enrolledAt: { $gte: since },
    });
    const enrolledCount = firstEnrollments.length;

    // Users with at least one completed lesson
    const lessonStarted = await CourseEnrollment.countDocuments({
      enrolledAt: { $gte: since },
      "sectionProgress.0": { $exists: true },
    });

    // Users who completed at least one quiz attempt (score field set)
    const quizUsers = await CourseEnrollment.distinct("user", {
      enrolledAt: { $gte: since },
      "sectionProgress.score": { $gte: 0 },
    });

    // Users who earned at least one certificate
    const certifiedUsers = await Certificate.distinct("user", {
      createdAt: { $gte: since },
    });

    const funnel = [
      { step: "Signed Up", count: signups },
      { step: "Enrolled", count: enrolledCount },
      { step: "Started Lesson", count: lessonStarted },
      { step: "Took Quiz", count: quizUsers.length },
      { step: "Earned Certificate", count: certifiedUsers.length },
    ];

    // Compute conversion rates relative to top of funnel
    const top = funnel[0].count || 1;
    funnel.forEach((s) => {
      s.conversionRate = Math.round((s.count / top) * 100);
    });

    res.status(200).json({ success: true, data: { rangeDays: days, funnel } });
  } catch (error) {
    console.error("Funnel error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search users with auto-complete
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const users = await User.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      { _id: 1, name: 1, email: 1, role: 1, accountStatus: 1 }
    )
      .limit(10);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent users
    const recentUsers = await User.find()
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(3);

    // Get recent tutorials (only genuinely new ones, not just viewed)
    const recentTutorials = await Tutorial.find()
      .select("title createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(3);

    // Get recently updated tutorials (only if manually updated, not just viewed)
    // Check if updatedAt is significantly different from createdAt (more than 1 minute)
    const updatedTutorials = await Tutorial.find()
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5);

    // Get recent courses
    const recentCourses = await Course.find()
      .select("title createdAt")
      .sort({ createdAt: -1 })
      .limit(2);

    // Combine and format activities
    const activities = [];

    recentUsers.forEach((user) => {
      activities.push({
        type: "user_signup",
        text: `${user.name} signed up.`,
        timestamp: user.createdAt,
      });
    });

    recentTutorials.forEach((tutorial) => {
      activities.push({
        type: "tutorial_created",
        text: `Tutorial "${tutorial.title}" was published.`,
        timestamp: tutorial.createdAt,
      });
    });

    updatedTutorials.forEach((tutorial) => {
      // Check if truly updated (not just created)
      if (tutorial.updatedAt > tutorial.createdAt) {
        activities.push({
          type: "content_updated",
          text: `Content "${tutorial.title}" was updated.`,
          timestamp: tutorial.updatedAt,
        });
      }
    });

    recentCourses.forEach((course) => {
      activities.push({
        type: "course_created",
        text: `Course "${course.title}" was created.`,
        timestamp: course.createdAt,
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: sortedActivities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending certificates for approval
export const getPendingCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify Certificate model is available
    if (!Certificate) {
      throw new Error("Certificate model not loaded");
    }

    const certificates = await Certificate.find({ approvalStatus: "pending" })
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments({ approvalStatus: "pending" });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: certificates,
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: error.message,
      errorType: error.name
    });
  }
};

// Get all certificates (pending, approved, rejected)
export const getAllCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify Certificate model is available
    if (!Certificate) {
      throw new Error("Certificate model not loaded");
    }

    const filter = {};
    if (status) {
      filter.approvalStatus = status;
    }

    const certificates = await Certificate.find(filter)
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(filter);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: certificates,
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: error.message,
      errorType: error.name
    });
  }
};

// Delete a certificate
export const deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findByIdAndDelete(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve a certificate
export const approveCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const adminId = req.user._id; // From auth middleware

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    certificate.approvalStatus = "approved";
    certificate.approvedBy = adminId;
    certificate.approvalDate = new Date();
    await certificate.save();

    res.status(200).json({
      success: true,
      message: "Certificate approved successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error approving certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a certificate
export const rejectCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id; // From auth middleware

    if (!rejectionReason) {
      return res.status(400).json({ 
        success: false, 
        message: "Rejection reason is required" 
      });
    }

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    certificate.approvalStatus = "rejected";
    certificate.approvedBy = adminId;
    certificate.approvalDate = new Date();
    certificate.rejectionReason = rejectionReason;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: "Certificate rejected successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error rejecting certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== COURSE MANAGEMENT ==========

// Get all courses for admin
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, language = "", category = "", search = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (language) {
      filter.language = language.toLowerCase();
    }
    
    if (category) {
      filter.category = category.toLowerCase();
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new course (by admin)
export const createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      shortDescription, 
      language, 
      category, 
      difficulty, 
      estimatedHours,
      certificateTemplate,
      tags,
      prerequisites
    } = req.body;

    if (!title || !description || !shortDescription || !language || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, shortDescription, language, and category are required"
      });
    }

    const course = await Course.create({
      title,
      description,
      shortDescription,
      language: language.toLowerCase(),
      category: category.toLowerCase(),
      difficulty: difficulty || "beginner",
      estimatedHours: estimatedHours || 0,
      certificateTemplate: certificateTemplate || "standard",
      tags: tags || [],
      prerequisites: prerequisites || [],
      instructor: req.user._id,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;
    const changeNote = req.body.__changeNote || "";
    delete updateData.__changeNote;

    const existing = await Course.findById(courseId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    );

    ContentVersion.recordVersion({
      contentType: "course",
      contentId: courseId,
      snapshot: existing,
      changedBy: req.user?._id || null,
      changeNote,
    }).catch((e) => console.warn("Course version save failed:", e.message));

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compute a simple line-level diff between two strings
function lineDiff(a = "", b = "") {
  const aLines = String(a).split("\n");
  const bLines = String(b).split("\n");
  const out = [];
  // Greedy LCS-ish: walk together, mark mismatches
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i++) {
    if (aLines[i] === bLines[i]) {
      out.push({ type: "ctx", line: aLines[i] ?? "" });
    } else {
      if (aLines[i] !== undefined) out.push({ type: "del", line: aLines[i] });
      if (bLines[i] !== undefined) out.push({ type: "add", line: bLines[i] });
    }
  }
  return out;
}

function diffObjects(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const result = {};
  for (const k of keys) {
    const av = a?.[k];
    const bv = b?.[k];
    if (typeof av === "string" && typeof bv === "string" && (av.includes("\n") || bv.includes("\n"))) {
      const lines = lineDiff(av, bv);
      if (lines.some((l) => l.type !== "ctx")) result[k] = { kind: "text", lines };
    } else if (JSON.stringify(av) !== JSON.stringify(bv)) {
      result[k] = { kind: "value", before: av, after: bv };
    }
  }
  return result;
}

// GET /api/admin/versions/diff?versionAId=...&versionBId=...
export const diffContentVersions = async (req, res) => {
  try {
    const ContentVersion = (await import("../models/ContentVersion.js")).default;
    const { versionAId, versionBId } = req.query;
    if (!versionAId || !versionBId) {
      return res.status(400).json({ success: false, message: "versionAId and versionBId are required" });
    }
    const [a, b] = await Promise.all([
      ContentVersion.findById(versionAId).lean(),
      ContentVersion.findById(versionBId).lean(),
    ]);
    if (!a || !b) {
      return res.status(404).json({ success: false, message: "Version not found" });
    }
    if (a.contentType !== b.contentType || String(a.contentId) !== String(b.contentId)) {
      return res.status(400).json({ success: false, message: "Versions belong to different content" });
    }
    const changes = diffObjects(a.snapshot, b.snapshot);
    res.status(200).json({
      success: true,
      data: {
        contentType: a.contentType,
        contentId: a.contentId,
        from: { id: a._id, version: a.versionNumber, at: a.createdAt },
        to: { id: b._id, version: b.versionNumber, at: b.createdAt },
        changes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============== CONTENT VERSION HISTORY ==============
export const getContentVersions = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    if (!["tutorial", "course", "lesson"].includes(contentType)) {
      return res.status(400).json({ success: false, message: "Invalid content type" });
    }

    const versions = await ContentVersion.find({ contentType, contentId })
      .sort({ versionNumber: -1 })
      .populate("changedBy", "name email")
      .lean();

    res.status(200).json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreContentVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await ContentVersion.findById(versionId).lean();
    if (!version) {
      return res.status(404).json({ success: false, message: "Version not found" });
    }

    let Model;
    if (version.contentType === "tutorial") Model = Tutorial;
    else if (version.contentType === "course") Model = Course;
    else {
      return res.status(400).json({ success: false, message: "Restore not supported for this content type" });
    }

    const current = await Model.findById(version.contentId).lean();
    if (!current) {
      return res.status(404).json({ success: false, message: "Content no longer exists" });
    }

    // Snapshot current before restoring
    await ContentVersion.recordVersion({
      contentType: version.contentType,
      contentId: version.contentId,
      snapshot: current,
      changedBy: req.user?._id || null,
      changeNote: `Pre-restore snapshot (restoring v${version.versionNumber})`,
    });

    // Strip immutable fields
    const restorePayload = { ...version.snapshot };
    delete restorePayload._id;
    delete restorePayload.createdAt;
    delete restorePayload.updatedAt;

    const restored = await Model.findByIdAndUpdate(
      version.contentId,
      restorePayload,
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: `Restored to version ${version.versionNumber}`,
      data: restored,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get newsletter subscriptions
export const getNewsletterSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};

    // Add search functionality
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const subscriptions = await NewsletterSubscription.find(query)
      .sort({ subscribedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await NewsletterSubscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching newsletter subscriptions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch newsletter subscriptions" 
    });
  }
};



// ============== PLATFORM SETTINGS ==============
export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const allowed = [
      'siteName', 'defaultTheme', 'primaryColor', 'accentColor', 'logoUrl',
      'features', 'maintenance', 'update', 'execution',
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          settings[key] = { ...(settings[key]?.toObject?.() || settings[key]), ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      }
    });
    settings.updatedBy = req.user?._id || null;
    await settings.save();
    invalidateMaintenanceCache();
    AuditLog.record(req, 'platform_settings_updated', 'PlatformSettings', settings._id, {
      keys: Object.keys(req.body || {}),
    });
    res.status(200).json({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Audit log viewer
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', actor = '' } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (actor) filter.actor = actor;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('actor', 'name email')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

