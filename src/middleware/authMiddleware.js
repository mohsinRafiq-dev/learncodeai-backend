import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies user is authenticated via JWT token in Authorization header or via Passport session
 */
export const auth = async (req, res, next) => {
  try {
    let user = null;
    let token = null;

    // Check for JWT token in Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    }
    
    // Also check for token in query parameters (for downloads)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
        
        // Fetch user from database to ensure they still exist
        user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found. Please log in again.'
          });
        }

        // Check if account is suspended
        if (user.accountStatus === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'Your account has been suspended. Please contact support.',
            accountStatus: 'suspended',
            isSuspended: true
          });
        }

        // Check if account is currently locked due to failed login attempts
        if (user.isAccountLocked()) {
          const lockTimeRemaining = Math.ceil((user.accountLockedUntil - Date.now()) / (60 * 1000)); // minutes
          return res.status(423).json({
            success: false,
            message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
            accountLocked: true,
            lockTimeRemaining
          });
        }

        // Attach user to request
        req.user = user;
        return next();
      } catch (tokenError) {
        if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired. Please log in again.'
          });
        }
        console.error('Token verification error:', tokenError.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }
    }

    // Fallback to Passport session authentication
    if (req.user) {
      return next();
    }

    // No authentication found
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in first.'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional Auth Middleware
 * Allows anonymous users but attaches user info if authenticated
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (tokenError) {
        console.error('Token verification error:', tokenError.message);
        // Continue without user if token is invalid
      }
    }

    // Continue to next middleware/route
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

export default auth;

