require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

// Configuration
const NAVIDROME_URL = process.env.NAVIDROME_URL;
const ADMIN_USER = process.env.NAVIDROME_ADMIN_USER;
const ADMIN_PASSWORD = process.env.NAVIDROME_ADMIN_PASSWORD;

console.log('[AUTH] [Auth Service] Configuration:');
console.log(`[AUTH]   Navidrome URL: ${NAVIDROME_URL}`);
console.log(`[AUTH]   Admin User: ${ADMIN_USER ? '✓ Set' : '✗ Missing'}`);
console.log(`[AUTH]   Admin Password: ${ADMIN_PASSWORD ? '✓ Set' : '✗ Missing'}`);
console.log('[AUTH]');

// Rate limiting
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { 
    success: false, 
    error: 'Too many registration attempts. Please try again later.' 
  }
});

const oauthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: { 
    success: false, 
    error: 'Too many OAuth requests. Please try again later.' 
  }
});

// Helper function to generate secure random password
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Helper function to sanitize username
function sanitizeUsername(email) {
  // Extract username from email and sanitize
  let username = email.split('@')[0];
  // Replace invalid characters with underscores
  username = username.replace(/[^a-zA-Z0-9_-]/g, '_');
  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(username)) {
    username = 'user_' + username;
  }
  // Truncate to 20 chars max
  return username.slice(0, 20);
}

// Helper function to get Navidrome auth token
async function getNavidromeToken() {
  try {
    const response = await axios.post(`${NAVIDROME_URL}/auth/login`, {
      username: ADMIN_USER,
      password: ADMIN_PASSWORD
    });
    return response.data.token;
  } catch (error) {
    console.error('[AUTH] [Auth Service] Failed to get Navidrome token:', error.message);
    throw new Error('Failed to authenticate with Navidrome');
  }
}

// Helper function to check if user exists in Navidrome
async function checkNavidromeUserExists(username, token) {
  try {
    const response = await axios.get(
      `${NAVIDROME_URL}/api/user`,
      {
        headers: {
          'X-ND-Authorization': `Bearer ${token}`
        }
      }
    );
    
    // Check if user exists in the list
    const users = response.data || [];
    return users.find(user => user.userName === username);
  } catch (error) {
    console.error('[AUTH] [Auth Service] Failed to check user existence:', error.message);
    return null;
  }
}

// OAuth callback endpoint - creates/retrieves Navidrome account for OAuth users
app.post('/api/auth/oauth-callback', oauthLimiter, async (req, res) => {
  try {
    const { email, userId } = req.body;

    console.log('[AUTH] [Auth Service] OAuth callback received:', { email, userId });

    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Email and userId are required'
      });
    }

    // Sanitize username from email
    const baseUsername = sanitizeUsername(email);
    
    // Get admin auth token
    const token = await getNavidromeToken();

    // Check if user already exists
    let existingUser = await checkNavidromeUserExists(baseUsername, token);
    let username = baseUsername;
    let password = null;

    if (existingUser) {
      console.log('[AUTH] [Auth Service] User already exists:', username);
      
      // For existing OAuth users, we need to retrieve their stored password
      // This should ideally be stored in Supabase user_metadata
      // For now, return username only - password should be retrieved from Supabase
      return res.json({
        success: true,
        username: username,
        message: 'User already exists',
        requiresPasswordFromMetadata: true
      });
    } else {
      // Generate secure random password for new user
      password = generateSecurePassword();

      // Create new user
      const userData = {
        userName: username,
        name: username,
        email: email,
        password: password,
        isAdmin: false
      };

      console.log('[AUTH] [Auth Service] Creating new OAuth user in Navidrome:', username);

      const response = await axios.post(
        `${NAVIDROME_URL}/api/user`,
        userData,
        {
          headers: {
            'X-ND-Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('[AUTH] [Auth Service] OAuth user created successfully:', username);
        return res.json({
          success: true,
          username: username,
          password: password, // Return password so it can be stored in Supabase
          message: 'Account created successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Failed to create user'
        });
      }
    }

  } catch (error) {
    console.error('[AUTH] [Auth Service] OAuth callback error:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed with Navidrome'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Registration endpoint
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    console.log('[AUTH] [Auth Service] Registration request received:', { username, email });

    // Validation
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and email are required'
      });
    }

    // Username validation (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-20 characters (letters, numbers, underscore, hyphen only)'
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Get admin auth token
    const token = await getNavidromeToken();

    // Create user via Navidrome internal API
    const userData = {
      userName: username,
      name: username,
      email: email,
      password: password,
      isAdmin: false
    };

    console.log('[AUTH] [Auth Service] Creating user in Navidrome:', username);

    const response = await axios.post(
      `${NAVIDROME_URL}/api/user`,
      userData,
      {
        headers: {
          'X-ND-Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check response
    if (response.status === 200 || response.status === 201) {
      console.log('[AUTH] [Auth Service] User created successfully:', username);
      return res.json({
        success: true,
        message: 'Account created successfully',
        username: username
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user'
      });
    }

  } catch (error) {
    console.error('[AUTH] [Auth Service] Registration error:', error.response?.data || error.message);
    
    // Handle specific errors
    if (error.response?.status === 409) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed with Navidrome. Check admin credentials.'
      });
    }

    if (error.message === 'Failed to authenticate with Navidrome') {
      return res.status(500).json({
        success: false,
        error: 'Cannot connect to Navidrome. Check admin credentials.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Registration service running',
    navidromeUrl: NAVIDROME_URL 
  });
});

// Start server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log('[AUTH] 🔐 Aonsoku Auth Service');
  console.log(`[AUTH]    Running on port ${PORT}`);
  console.log(`[AUTH]    Navidrome: ${NAVIDROME_URL}`);
  console.log(`[AUTH]    Registration endpoint: http://localhost:${PORT}/api/auth/register`);
  console.log(`[AUTH]    OAuth callback endpoint: http://localhost:${PORT}/api/auth/oauth-callback`);
  console.log('[AUTH]');
});
