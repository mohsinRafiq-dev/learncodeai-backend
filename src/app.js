import dotenv from "dotenv";

// MUST load environment variables FIRST before importing any other modules
dotenv.config();

import express from "express";
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
import connectDB from "./config/database.js";
import passport, { initializeOAuthStrategies } from "./config/oauthConfig.js";
import emailService from "./services/emailService.js";

// Connect to MongoDB
connectDB();

// Initialize OAuth strategies
const oauthStrategies = initializeOAuthStrategies();
console.log("OAuth strategies initialized:", oauthStrategies);

// Initialize email service
emailService.initialize();

const app = express();

const environment = process.env.NODE_ENV || "development";
const logger = loggerConfig[environment];

if (Array.isArray(logger)) {
  logger.forEach((loggerMiddleware) => app.use(loggerMiddleware));
} else {
  app.use(logger);
}

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files as static assets
app.use("/uploads", express.static("uploads"));

// Session configuration for OAuth
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "your-session-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("LearnCode AI Backend API 🚀");
});

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

export default app;
