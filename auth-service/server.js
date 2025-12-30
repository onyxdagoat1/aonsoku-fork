require('dotenv').config()
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')

const app = express()

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  }),
)

// Configuration
const NAVIDROME_URL = process.env.NAVIDROME_URL
const ADMIN_USER = process.env.NAVIDROME_ADMIN_USER
const ADMIN_PASSWORD = process.env.NAVIDROME_ADMIN_PASSWORD

console.log('[AUTH] [Auth Service] Configuration:')
console.log(`[AUTH]   Navidrome URL: ${NAVIDROME_URL}`)
console.log(`[AUTH]   Admin User: ${ADMIN_USER ? '✓ Set' : '✗ Missing'}`)
console.log(
  `[AUTH]   Admin Password: ${ADMIN_PASSWORD ? '✓ Set' : '✗ Missing'}`,
)
console.log('[AUTH]')

// Rate limiting
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
  },
})

const oauthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: 'Too many OAuth requests. Please try again later.',
  },
})

// Helper function to generate secure random password
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length)
}

// Helper function to sanitize username
function sanitizeUsername(email) {
  // Extract username from email and sanitize
  let username = email.split('@')[0]
  // Replace invalid characters with underscores
  username = username.replace(/[^a-zA-Z0-9_-]/g, '_')
  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(username)) {
    username = 'user_' + username
  }
  // Truncate to 20 chars max
  return username.slice(0, 20)
}

// Helper function to get Navidrome auth token
async function getNavidromeToken() {
  try {
    const response = await axios.post(`${NAVIDROME_URL}/auth/login`, {
      username: ADMIN_USER,
      password: ADMIN_PASSWORD,
    })
    return response.data.token
  } catch (error) {
    console.error(
      '[AUTH] [Auth Service] Failed to get Navidrome token:',
      error.message,
    )
    throw new Error('Failed to authenticate with Navidrome')
  }
}

// Helper function to check if user exists in Navidrome
async function checkNavidromeUserExists(username, token) {
  try {
    const response = await axios.get(`${NAVIDROME_URL}/api/user`, {
      headers: {
        'X-ND-Authorization': `Bearer ${token}`,
      },
    })

    // Handle different response formats (array, paginated, or object with data property)
    let users = []
    if (Array.isArray(response.data)) {
      users = response.data
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      users = response.data.data
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      users = response.data.items
    } else if (response.data?.content && Array.isArray(response.data.content)) {
      users = response.data.content
    }

    // Check if user exists in the list (case-insensitive comparison)
    const foundUser = users.find(
      (user) =>
        user.userName && user.userName.toLowerCase() === username.toLowerCase(),
    )

    if (foundUser) {
      console.log(
        '[AUTH] [Auth Service] User found in Navidrome:',
        foundUser.userName,
      )
    }

    return foundUser || null
  } catch (error) {
    console.error(
      '[AUTH] [Auth Service] Failed to check user existence:',
      error.message,
    )
    if (error.response) {
      console.error(
        '[AUTH] [Auth Service] Response status:',
        error.response.status,
      )
      console.error('[AUTH] [Auth Service] Response data:', error.response.data)
    }
    return null
  }
}

// OAuth callback endpoint - creates/retrieves Navidrome account for OAuth users
app.post('/api/auth/oauth-callback', oauthLimiter, async (req, res) => {
  try {
    const { email, userId } = req.body

    console.log('[AUTH] [Auth Service] OAuth callback received:', {
      email,
      userId,
    })

    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Email and userId are required',
      })
    }

    // Sanitize username from email
    const baseUsername = sanitizeUsername(email)

    // Get admin auth token
    const token = await getNavidromeToken()

    // For OAuth users, always create a fresh account
    // Use userId to ensure uniqueness if username already exists
    let username = baseUsername
    let password = generateSecurePassword()
    let counter = 0
    const maxAttempts = 10

    // Find available username (append userId suffix if needed)
    while (counter < maxAttempts) {
      const existingUser = await checkNavidromeUserExists(username, token)

      if (!existingUser) {
        // Username is available, break and create account
        break
      }

      // Username exists, try with userId suffix
      if (counter === 0) {
        // First attempt: use first 8 chars of userId
        const userIdSuffix = userId.replace(/-/g, '').substring(0, 8)
        username = baseUsername.substring(0, 12) + userIdSuffix
      } else {
        // Subsequent attempts: append counter
        username = baseUsername.substring(0, 15) + counter
      }

      counter++
    }

    // Create new user with unique username
    const userData = {
      userName: username,
      name: username,
      email: email,
      password: password,
      isAdmin: false,
    }

    console.log(
      '[AUTH] [Auth Service] Creating new OAuth user in Navidrome:',
      username,
    )

    try {
      const response = await axios.post(`${NAVIDROME_URL}/api/user`, userData, {
        headers: {
          'X-ND-Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 200 || response.status === 201) {
        console.log(
          '[AUTH] [Auth Service] OAuth user created successfully:',
          username,
        )
        return res.json({
          success: true,
          username: username,
          password: password, // Return password so it can be stored in Supabase
          message: 'Account created successfully',
        })
      } else {
        return res.status(400).json({
          success: false,
          error: 'Failed to create user',
        })
      }
    } catch (createError) {
      // If creation fails due to username conflict, try one more time with different username
      if (createError.response?.status === 409 && counter < maxAttempts) {
        // Username conflict, try with full userId
        const userIdSuffix = userId.replace(/-/g, '').substring(0, 12)
        username = 'user' + userIdSuffix
        password = generateSecurePassword()

        const retryUserData = {
          userName: username,
          name: username,
          email: email,
          password: password,
          isAdmin: false,
        }

        try {
          const retryResponse = await axios.post(
            `${NAVIDROME_URL}/api/user`,
            retryUserData,
            {
              headers: {
                'X-ND-Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          )

          if (retryResponse.status === 200 || retryResponse.status === 201) {
            console.log(
              '[AUTH] [Auth Service] OAuth user created successfully (retry):',
              username,
            )
            return res.json({
              success: true,
              username: username,
              password: password,
              message: 'Account created successfully',
            })
          }
        } catch (retryError) {
          console.error(
            '[AUTH] [Auth Service] Retry also failed:',
            retryError.message,
          )
        }
      }

      throw createError
    }
  } catch (error) {
    console.error(
      '[AUTH] [Auth Service] OAuth callback error:',
      error.response?.data || error.message,
    )

    if (error.response?.status === 409) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
      })
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

// Registration endpoint
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body

    console.log('[AUTH] [Auth Service] Registration request received:', {
      username,
      email,
    })

    // Validation
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and email are required',
      })
    }

    // Username validation (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error:
          'Username must be 3-20 characters (letters, numbers, underscore, hyphen only)',
      })
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      })
    }

    // Get admin auth token
    const token = await getNavidromeToken()

    // Create user via Navidrome internal API
    const userData = {
      userName: username,
      name: username,
      email: email,
      password: password,
      isAdmin: false,
    }

    console.log('[AUTH] [Auth Service] Creating user in Navidrome:', username)

    const response = await axios.post(`${NAVIDROME_URL}/api/user`, userData, {
      headers: {
        'X-ND-Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    // Check response
    if (response.status === 200 || response.status === 201) {
      console.log('[AUTH] [Auth Service] User created successfully:', username)
      return res.json({
        success: true,
        message: 'Account created successfully',
        username: username,
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user',
      })
    }
  } catch (error) {
    console.error(
      '[AUTH] [Auth Service] Registration error:',
      error.response?.data || error.message,
    )

    // Handle specific errors
    if (error.response?.status === 409) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
      })
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed. Check admin credentials.',
      })
    }

    if (error.message === 'Failed to authenticate with server') {
      return res.status(500).json({
        success: false,
        error: 'Cannot connect to server. Check admin credentials.',
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Registration service running',
    navidromeUrl: NAVIDROME_URL,
  })
})

// Start server
const PORT = process.env.PORT || 3005
app.listen(PORT, () => {
  console.log('[AUTH]    Auth Service')
  console.log(`[AUTH]    Running on port ${PORT}`)
  console.log(`[AUTH]    Navidrome: ${NAVIDROME_URL}`)
  console.log(
    `[AUTH]    Registration endpoint: http://localhost:${PORT}/api/auth/register`,
  )
  console.log(
    `[AUTH]    OAuth callback endpoint: http://localhost:${PORT}/api/auth/oauth-callback`,
  )
  console.log('[AUTH]')
})
