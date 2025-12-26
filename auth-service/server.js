const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const config = {
  navidromeUrl: process.env.NAVIDROME_URL || 'http://localhost:4533',
  navidromeUsername: process.env.NAVIDROME_USERNAME,
  navidromePassword: process.env.NAVIDROME_PASSWORD
};

console.log('[Auth Service] Configuration:');
console.log('  Navidrome URL:', config.navidromeUrl);
console.log('  Admin User:', config.navidromeUsername ? '✓ Set' : '✗ Not set');

// Helper: Create user in Navidrome
async function createNavidromeUser(username, password, email) {
  try {
    console.log('[Auth Service] Creating Navidrome user:', username);

    // First, authenticate as admin to get a token
    const authParams = new URLSearchParams({
      u: config.navidromeUsername,
      p: config.navidromePassword,
      v: '1.16.0',
      c: 'aonsoku-auth',
      f: 'json'
    });

    const pingResponse = await axios.get(
      `${config.navidromeUrl}/rest/ping?${authParams.toString()}`
    );

    if (pingResponse.data['subsonic-response']?.status !== 'ok') {
      throw new Error('Failed to authenticate with Navidrome as admin');
    }

    console.log('[Auth Service] Admin authentication successful');

    // Create the new user via Navidrome API
    // Note: Navidrome's Subsonic API doesn't have a createUser endpoint
    // We need to use Navidrome's internal API
    const createUserUrl = `${config.navidromeUrl}/api/user`;
    
    // First, get admin session token
    const loginResponse = await axios.post(
      `${config.navidromeUrl}/auth/login`,
      {
        username: config.navidromeUsername,
        password: config.navidromePassword
      }
    );

    const token = loginResponse.data.token || loginResponse.headers['x-nd-authorization'];
    
    if (!token) {
      throw new Error('Failed to obtain admin token from Navidrome');
    }

    console.log('[Auth Service] Admin token obtained');

    // Create the new user
    const createResponse = await axios.post(
      createUserUrl,
      {
        userName: username,
        password: password,
        email: email || `${username}@local.host`,
        isAdmin: false,
        name: username
      },
      {
        headers: {
          'x-nd-authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Auth Service] User created successfully:', createResponse.data);
    return { success: true, user: createResponse.data };

  } catch (error) {
    console.error('[Auth Service] Error creating Navidrome user:');
    console.error('  Message:', error.message);
    
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
      
      // Handle specific errors
      if (error.response.status === 409 || 
          error.response.data?.message?.includes('already exists')) {
        return { 
          success: false, 
          error: 'Username already exists' 
        };
      }
    }
    
    throw error;
  }
}

// API: Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    console.log('[Auth Service] Registration request received:', { username, email });

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Create user in Navidrome
    const result = await createNavidromeUser(username, password, email);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    console.log('[Auth Service] Registration successful for:', username);

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        username: username,
        email: email
      }
    });

  } catch (error) {
    console.error('[Auth Service] Registration error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user. Please check server logs.',
      details: error.message
    });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aonsoku-auth-service',
    version: '1.0.0',
    navidromeUrl: config.navidromeUrl
  });
});

// API: Test Navidrome connection
app.get('/api/test-navidrome', async (req, res) => {
  try {
    const params = new URLSearchParams({
      u: config.navidromeUsername,
      p: config.navidromePassword,
      v: '1.16.0',
      c: 'aonsoku-auth',
      f: 'json'
    });

    const response = await axios.get(
      `${config.navidromeUrl}/rest/ping?${params.toString()}`
    );

    res.json({
      success: true,
      navidrome: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🔐 Aonsoku Auth Service`);
  console.log(`   Running on port ${PORT}`);
  console.log(`   Navidrome: ${config.navidromeUrl}`);
  console.log(`   Registration endpoint: http://localhost:${PORT}/api/auth/register\n`);
});
