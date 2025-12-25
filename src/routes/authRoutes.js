import express from 'express';
import passport, { isStrategyAvailable } from '../config/oauthConfig.js';
import User from '../models/User.js';
import { 
  signup, 
  signin, 
  logout, 
  protect, 
  oauthSuccess, 
  oauthFailure,
  verifyEmail,
  resendVerificationOTP,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationOTP);

// Password reset routes
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'Google OAuth is not configured'
    });
  }
  
  // Check if Google strategy is available
  if (!isStrategyAvailable('google')) {
    return res.status(500).json({
      status: 'error',
      message: 'Google OAuth strategy is not available. Please check server configuration.'
    });
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_not_configured`);
  }
  
  if (!isStrategyAvailable('google')) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_strategy_unavailable`);
  }
  
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Check if it's a suspended account
      if (info && info.message === 'Account is suspended') {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=account_suspended`);
      }
      return res.redirect('/api/auth/failure');
    }
    // Manually log in the user
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return oauthSuccess(req, res);
    });
  })(req, res, next);
});

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'GitHub OAuth is not configured'
    });
  }
  
  if (!isStrategyAvailable('github')) {
    return res.status(500).json({
      status: 'error',
      message: 'GitHub OAuth strategy is not available. Please check server configuration.'
    });
  }
  
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_not_configured`);
  }
  
  if (!isStrategyAvailable('github')) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_strategy_unavailable`);
  }
  
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Check if it's a suspended account
      if (info && info.message === 'Account is suspended') {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=account_suspended`);
      }
      return res.redirect('/api/auth/failure');
    }
    // Manually log in the user
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return oauthSuccess(req, res);
    });
  })(req, res, next);
});

// OAuth failure route
router.get('/failure', oauthFailure);

// Test protected route
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// Development only endpoints
if (process.env.NODE_ENV === 'development') {
  // Check account status
  router.get('/dev/account-status/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email });
      
      if (user) {
        res.json({ 
          status: 'success', 
          data: {
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified,
            accountStatus: user.accountStatus,
            hasOTP: !!user.emailVerificationOTP,
            otpExpires: user.emailVerificationOTPExpires,
            createdAt: user.createdAt
          }
        });
      } else {
        res.status(404).json({ status: 'fail', message: 'Account not found' });
      }
    } catch {
      res.status(500).json({ status: 'error', message: 'Failed to check account' });
    }
  });

  // Delete unverified account
  router.delete('/dev/delete-unverified/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ 
        email, 
        accountStatus: 'pending',
        isEmailVerified: false 
      });
      
      if (user) {
        await User.findByIdAndDelete(user._id);
        res.json({ status: 'success', message: 'Unverified account deleted' });
      } else {
        res.status(404).json({ status: 'fail', message: 'No unverified account found' });
      }
    } catch {
      res.status(500).json({ status: 'error', message: 'Failed to delete account' });
    }
  });
}

export default router;
