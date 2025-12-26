// Loads environment variables from parent .env file
const dotenv = require('dotenv');
const path = require('path');

// Load from parent directory's .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Map prefixed variables to expected names
process.env.PORT = process.env.TAG_WRITER_PORT || '3001';
process.env.MUSIC_LIBRARY_PATH = process.env.TAG_WRITER_MUSIC_PATH || '';
process.env.CORS_ORIGINS = process.env.TAG_WRITER_CORS_ORIGINS || 'http://localhost:3000';

// Also set Navidrome variables
process.env.NAVIDROME_URL = process.env.NAVIDROME_URL || 'http://localhost:4533';
process.env.NAVIDROME_USERNAME = process.env.NAVIDROME_USERNAME || '';
process.env.NAVIDROME_PASSWORD = process.env.NAVIDROME_PASSWORD || '';
