import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
config();

// Validate required configuration
function validateConfig() {
  const required = ['MUSIC_PATH'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please create a .env file with these variables.`
    );
  }

  // Validate music path exists
  const musicPath = resolve(process.env.MUSIC_PATH);
  if (!existsSync(musicPath)) {
    throw new Error(
      `MUSIC_PATH does not exist: ${musicPath}\n` +
      `Please create the directory or fix the path in .env`
    );
  }

  return true;
}

validateConfig();

export default {
  // Server
  port: parseInt(process.env.PORT) || 3001,
  
  // Paths (absolute, resolved)
  musicPath: resolve(process.env.MUSIC_PATH),
  uploadPath: resolve(process.env.UPLOAD_PATH || './uploads'),
  dataPath: resolve(process.env.DATA_PATH || './data'),
  
  // Navidrome integration (optional)
  navidrome: {
    enabled: !!(process.env.NAVIDROME_URL && process.env.NAVIDROME_USER),
    url: process.env.NAVIDROME_URL,
    username: process.env.NAVIDROME_USER,
    password: process.env.NAVIDROME_PASSWORD,
  },
  
  // Limits
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 50,
};
