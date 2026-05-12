import dotenv from "dotenv";

// MUST load environment variables FIRST before importing any other modules
dotenv.config();

import express from "express";
import { initSentry, sentryErrorHandler } from "./config/sentry.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import loggerConfig from "./config/logger.js";
import codeExecutionRoutes from "./routes/codeExecutionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tutorialRoutes from "./routes/tutorialRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminTutorialRoutes from "./routes/adminTutorialRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import codeSnippetRoutes from "./routes/codeSnippetRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";
import codeHelpRoutes from "./routes/codeHelpRoutes.js";
import codeChatRoutes from "./routes/codeChatRoutes.js";
import viewTrackingRoutes from "./routes/viewTrackingRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import practiceQuizRoutes from "./routes/practiceQuizRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import progressTrackingRoutes from "./routes/progressTrackingRoutes.js";
import dailyChallengeRoutes from "./routes/dailyChallengeRoutes.js";
import codeDraftRoutes from "./routes/codeDraftRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import connectDB from "./config/database.js";
import passport, { initializeOAuthStrategies } from "./config/oauthConfig.js";
import emailService from "./services/emailService.js";
import gamificationService from "./services/gamificationService.js";
import { maintenanceMode } from "./middleware/maintenanceMode.js";
import { startScheduledPublishService } from "./services/scheduledPublishService.js";

// Connect to MongoDB
connectDB();

// Initialize OAuth strategies
const oauthStrategies = initializeOAuthStrategies();
console.log("OAuth strategies initialized:", oauthStrategies);

// Initialize email service
emailService.initialize();

const app = express();

// Sentry must be initialized before any other middleware
initSentry(app);

const environment = process.env.NODE_ENV || "development";
const logger = loggerConfig[environment];

if (Array.isArray(logger)) {
  logger.forEach((loggerMiddleware) => app.use(loggerMiddleware));
} else {
  app.use(logger);
}

// Build allowed origins from env (comma-separated FRONTEND_URLS) + sane local defaults.
const allowedOrigins = [
  ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / curl / server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow any *.vercel.app preview deploy by default
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Trust Railway/Heroku-style reverse proxies so req.ip + secure cookies work
app.set("trust proxy", 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files as static assets
app.use("/uploads", express.static("uploads"));

// Session configuration for OAuth
const isProd = process.env.NODE_ENV === "production";
if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16)) {
  console.warn("⚠️  SESSION_SECRET is missing or weak — set a strong value in production env.");
}
if (isProd && !process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET is missing — auth tokens will not work safely in production.");
}

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "your-session-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      sameSite: isProd ? "none" : "lax", // cross-site (Vercel → Railway) needs none + secure
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("LearnCode AI Backend API 🚀");
});

// Health check (used by Railway/uptime monitors). Cheap and skips DB.
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Maintenance gate (auth/admin paths bypass internally)
app.use("/api", maintenanceMode);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/code", codeExecutionRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/snippets", codeSnippetRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/tutorials", adminTutorialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/aichat", aiChatRoutes);
app.use("/api/codehelp", codeHelpRoutes);
app.use("/api/codechat", codeChatRoutes);
app.use("/api/views", viewTrackingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/practice-quizzes", practiceQuizRoutes);
console.log("✅ Practice quiz routes registered at /api/practice-quizzes");
app.use("/api/discussions", discussionRoutes);
console.log("✅ Discussion forum routes registered at /api/discussions");
app.use("/api/gamification", gamificationRoutes);
console.log("✅ Gamification routes registered at /api/gamification");
app.use("/api/progress", progressTrackingRoutes);
console.log("✅ Progress tracking routes registered at /api/progress");
app.use("/api/daily-challenge", dailyChallengeRoutes);
console.log("✅ Daily challenge routes registered at /api/daily-challenge");
app.use("/api/drafts", codeDraftRoutes);
console.log("✅ Code drafts routes registered at /api/drafts");
app.use("/api/recommendations", recommendationRoutes);
console.log("✅ Recommendation routes registered at /api/recommendations");

// Initialize default badges on startup
gamificationService.initializeBadges();

// Start scheduled publish runner (auto-publishes content when publishAt arrives)
startScheduledPublishService();

// Sentry error handler — must be before all other error middleware
app.use(sentryErrorHandler());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

export default app;
