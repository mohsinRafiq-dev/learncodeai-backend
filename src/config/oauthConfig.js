import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

// Ensure environment variables are loaded
dotenv.config();

// Google OAuth Strategy
export const initializeGoogleStrategy = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("✅ Initializing Google OAuth strategy");

    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({
              $or: [
                { googleId: profile.id },
                { email: profile.emails[0].value },
              ],
            });

            if (user) {
              // User exists, ensure they are verified and active
              let needsUpdate = false;

              if (!user.googleId) {
                user.googleId = profile.id;
                needsUpdate = true;
              }

              if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                needsUpdate = true;
              }

              if (user.accountStatus !== "active") {
                user.accountStatus = "active";
                needsUpdate = true;
              }

              if (needsUpdate) {
                await user.save();
              }

              return done(null, user);
            }

            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              isEmailVerified: true,
              accountStatus: "active",
              profilePicture: profile.photos[0]?.value || null,
            });

            done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
            done(error, null);
          }
        }
      )
    );

    return true;
  } else {
    console.log(
      "❌ Google OAuth strategy NOT initialized (missing credentials)"
    );
    return false;
  }
};

// GitHub OAuth Strategy
export const initializeGitHubStrategy = () => {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log("✅ Initializing GitHub OAuth strategy");

    passport.use(
      "github",
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: "/api/auth/github/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with this GitHub ID
            let user = await User.findOne({
              $or: [
                { githubId: profile.id },
                { email: profile.emails?.[0]?.value },
              ],
            });

            if (user) {
              // User exists, ensure they are verified and active
              let needsUpdate = false;

              if (!user.githubId) {
                user.githubId = profile.id;
                needsUpdate = true;
              }

              // GitHub OAuth authentication verifies identity, mark as verified
              if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                needsUpdate = true;
              }

              // Activate account for GitHub OAuth users
              if (user.accountStatus !== "active") {
                user.accountStatus = "active";
                needsUpdate = true;
              }

              if (needsUpdate) {
                await user.save();
              }

              return done(null, user);
            }

            // Create new user - GitHub OAuth authentication verifies identity
            user = await User.create({
              githubId: profile.id,
              name: profile.displayName || profile.username,
              email:
                profile.emails?.[0]?.value ||
                `${profile.username}@github.local`,
              isEmailVerified: true, // OAuth authentication verifies identity
              accountStatus: "active", // Allow access for all GitHub OAuth users
              profilePicture: profile.photos?.[0]?.value || null,
            });

            done(null, user);
          } catch (error) {
            console.error("GitHub OAuth error:", error);
            done(error, null);
          }
        }
      )
    );

    return true;
  } else {
    console.log(
      "❌ GitHub OAuth strategy NOT initialized (missing credentials)"
    );
    return false;
  }
};

// Initialize all strategies
export const initializeOAuthStrategies = () => {
  console.log("🚀 Initializing OAuth strategies...");

  const googleInitialized = initializeGoogleStrategy();
  const githubInitialized = initializeGitHubStrategy();

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return {
    google: googleInitialized,
    github: githubInitialized,
  };
};

// Check if a strategy is available
export const isStrategyAvailable = (strategyName) => {
  try {
    return passport._strategy(strategyName) !== undefined;
  } catch (error) {
    return false;
  }
};

export default passport;

