const express = require('express');
const passport = require('passport');
const {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword
} = require('../models/user');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirationMs,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
} = require('../utils/jwt');
const { validate, registerValidation, loginValidation } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { v4: uuidv4 } = require('uuid');

function createAuthRoutes(db) {
  const router = express.Router();

  /**
   * Register new user
   */
  router.post('/register', authLimiter, validate(registerValidation), async (req, res) => {
    try {
      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await findUserByEmail(db, email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }

      // Create user
      const user = await createUser(db, { email, username, password });

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const tokenId = uuidv4();
      const expiresAt = new Date(Date.now() + getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN));

      if (db.type === 'sqlite') {
        db.run(
          'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
          [tokenId, user.id, refreshToken, expiresAt.toISOString()]
        );
      } else {
        await db.query(
          'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
          [tokenId, user.id, refreshToken, expiresAt]
        );
      }

      // Set cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax'
      };

      res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: getTokenExpirationMs(JWT_EXPIRES_IN)
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN)
      });

      // Remove sensitive data
      delete user.password_hash;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  });

  /**
   * Login with email and password
   */
  router.post('/login', authLimiter, validate(loginValidation), async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await findUserByEmail(db, email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Verify password
      if (!user.password_hash) {
        return res.status(401).json({
          error: 'OAuth account',
          message: 'This account uses OAuth login. Please sign in with Google or Discord.'
        });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const tokenId = uuidv4();
      const expiresAt = new Date(Date.now() + getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN));

      if (db.type === 'sqlite') {
        db.run(
          'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
          [tokenId, user.id, refreshToken, expiresAt.toISOString()]
        );
      } else {
        await db.query(
          'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
          [tokenId, user.id, refreshToken, expiresAt]
        );
      }

      // Set cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax'
      };

      res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: getTokenExpirationMs(JWT_EXPIRES_IN)
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN)
      });

      // Remove sensitive data
      delete user.password_hash;

      res.json({
        success: true,
        message: 'Login successful',
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  });

  /**
   * Logout
   */
  router.post('/logout', requireAuth(db), async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        // Delete refresh token from database
        if (db.type === 'sqlite') {
          db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        } else {
          await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        }
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  });

  /**
   * Refresh access token
   */
  router.post('/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'No refresh token',
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
      }

      // Check if token exists in database
      let tokenRecord;
      if (db.type === 'sqlite') {
        tokenRecord = db.get(
          'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
          [refreshToken, decoded.id]
        );
      } else {
        const result = await db.query(
          'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
          [refreshToken, decoded.id]
        );
        tokenRecord = result.rows[0];
      }

      if (!tokenRecord) {
        return res.status(401).json({
          error: 'Token not found',
          message: 'Refresh token has been revoked'
        });
      }

      // Get user
      const user = await findUserById(db, decoded.id);
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'User associated with this token does not exist'
        });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      // Set cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        maxAge: getTokenExpirationMs(JWT_EXPIRES_IN)
      });

      // Remove sensitive data
      delete user.password_hash;

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user,
        tokens: {
          access_token: accessToken,
          expires_in: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  });

  /**
   * Get current user
   */
  router.get('/me', requireAuth(db), async (req, res) => {
    try {
      const user = { ...req.user };
      delete user.password_hash;

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user',
        message: error.message
      });
    }
  });

  /**
   * Google OAuth - Start
   */
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  /**
   * Google OAuth - Callback
   */
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
      try {
        const user = req.user;
        
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        const tokenId = uuidv4();
        const expiresAt = new Date(Date.now() + getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN));

        if (db.type === 'sqlite') {
          db.run(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.id, refreshToken, expiresAt.toISOString()]
          );
        } else {
          await db.query(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
            [tokenId, user.id, refreshToken, expiresAt]
          );
        }

        // Set cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: process.env.COOKIE_SAME_SITE || 'lax'
        };

        res.cookie('access_token', accessToken, {
          ...cookieOptions,
          maxAge: getTokenExpirationMs(JWT_EXPIRES_IN)
        });

        res.cookie('refresh_token', refreshToken, {
          ...cookieOptions,
          maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN)
        });

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?success=true`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
      }
    }
  );

  /**
   * Discord OAuth - Start
   */
  router.get(
    '/discord',
    passport.authenticate('discord')
  );

  /**
   * Discord OAuth - Callback
   */
  router.get(
    '/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }),
    async (req, res) => {
      try {
        const user = req.user;
        
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        const tokenId = uuidv4();
        const expiresAt = new Date(Date.now() + getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN));

        if (db.type === 'sqlite') {
          db.run(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.id, refreshToken, expiresAt.toISOString()]
          );
        } else {
          await db.query(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
            [tokenId, user.id, refreshToken, expiresAt]
          );
        }

        // Set cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: process.env.COOKIE_SAME_SITE || 'lax'
        };

        res.cookie('access_token', accessToken, {
          ...cookieOptions,
          maxAge: getTokenExpirationMs(JWT_EXPIRES_IN)
        });

        res.cookie('refresh_token', refreshToken, {
          ...cookieOptions,
          maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN)
        });

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?success=true`);
      } catch (error) {
        console.error('Discord OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
      }
    }
  );

  return router;
}

module.exports = { createAuthRoutes };
