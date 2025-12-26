require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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
  console.log('[AUTH]');
});
