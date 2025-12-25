import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
  musicLibraryPath: process.env.MUSIC_LIBRARY_PATH || '/music',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  navidromeUrl: process.env.NAVIDROME_URL || '',
  navidromeUsername: process.env.NAVIDROME_USERNAME || '',
  navidromePassword: process.env.NAVIDROME_PASSWORD || '',
};

export default config;
