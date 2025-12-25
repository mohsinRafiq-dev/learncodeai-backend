import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

// Google OAuth Strategy - only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log("✅ Registering Google OAuth strategy");
  passport.use(
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
            $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
          });

          if (user) {
            // Check if account is suspended
            if (user.accountStatus === 'suspended') {
              return done(null, false, { message: 'Account is suspended' });
            }
            
            // User exists, update Google ID if not set (without triggering save)
            if (!user.googleId) {
              // Use findByIdAndUpdate to avoid triggering default values
              await User.findByIdAndUpdate(
                user._id,
                { 
                  googleId: profile.id,
                  isEmailVerified: true
                },
                { new: false } // Don't return the updated doc, just update
              );
              user.googleId = profile.id;
              user.isEmailVerified = true;
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            isEmailVerified: true,
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
} else {
  console.log("❌ Google OAuth strategy NOT registered (missing credentials)");
}

// GitHub OAuth Strategy - only initialize if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log("✅ Registering GitHub OAuth strategy");
  passport.use(
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
            // Check if account is suspended
            if (user.accountStatus === 'suspended') {
              return done(null, false, { message: 'Account is suspended' });
            }
            
            // User exists, update GitHub ID if not set (without triggering save)
            if (!user.githubId) {
              // Use findByIdAndUpdate to avoid triggering default values
              await User.findByIdAndUpdate(
                user._id,
                { 
                  githubId: profile.id,
                  isEmailVerified: true
                },
                { new: false } // Don't return the updated doc, just update
              );
              user.githubId = profile.id;
              user.isEmailVerified = true;
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            email:
              profile.emails?.[0]?.value || `${profile.username}@github.local`,
            isEmailVerified: profile.emails?.[0]?.value ? true : false,
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
} else {
  console.log("❌ GitHub OAuth strategy NOT registered (missing credentials)");
}

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

export default passport;

