// Loads environment variables from parent .env file
const dotenv = require('dotenv');
const path = require('path');

// Load from parent directory's .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Map prefixed variables to expected names
process.env.PORT = process.env.AUTH_PORT || '3005';
process.env.NODE_ENV = process.env.AUTH_NODE_ENV || 'development';
process.env.FRONTEND_URL = process.env.AUTH_FRONTEND_URL || 'http://localhost:3000';
process.env.DATABASE_TYPE = process.env.AUTH_DATABASE_TYPE || 'sqlite';
process.env.DATABASE_PATH = process.env.AUTH_DATABASE_PATH || './data/auth.db';
process.env.JWT_SECRET = process.env.AUTH_JWT_SECRET || '';
process.env.JWT_REFRESH_SECRET = process.env.AUTH_JWT_REFRESH_SECRET || '';
process.env.SESSION_SECRET = process.env.AUTH_SESSION_SECRET || '';
process.env.JWT_EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN || '7d';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.AUTH_JWT_REFRESH_EXPIRES_IN || '30d';
process.env.GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_CLIENT_ID || '';
process.env.GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_CLIENT_SECRET || '';
process.env.GOOGLE_CALLBACK_URL = process.env.AUTH_GOOGLE_CALLBACK_URL || '';
process.env.DISCORD_CLIENT_ID = process.env.AUTH_DISCORD_CLIENT_ID || '';
process.env.DISCORD_CLIENT_SECRET = process.env.AUTH_DISCORD_CLIENT_SECRET || '';
process.env.DISCORD_CALLBACK_URL = process.env.AUTH_DISCORD_CALLBACK_URL || '';
process.env.RATE_LIMIT_WINDOW_MS = process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '100';
process.env.BCRYPT_ROUNDS = process.env.AUTH_BCRYPT_ROUNDS || '12';
process.env.COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';
process.env.COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE || 'lax';
process.env.YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || '';

// Also set Navidrome variables
process.env.NAVIDROME_URL = process.env.NAVIDROME_URL || 'http://localhost:4533';
process.env.NAVIDROME_USERNAME = process.env.NAVIDROME_USERNAME || '';
process.env.NAVIDROME_PASSWORD = process.env.NAVIDROME_PASSWORD || '';
