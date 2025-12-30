import dotenv from 'dotenv'

dotenv.config()

const musicLibraryPathRaw = process.env.MUSIC_LIBRARY_PATH || '/music'
const musicLibraryPaths = musicLibraryPathRaw
  .split(',')
  .map((p) => p.trim())
  .filter((p) => p)

const config = {
  port: process.env.PORT || 3001,
  uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
  musicLibraryPath: musicLibraryPaths[0] || '/music',
  allMusicLibraryPaths: musicLibraryPaths,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  navidromeUrl: process.env.NAVIDROME_URL || '',
  navidromeUsername: process.env.NAVIDROME_USERNAME || '',
  navidromePassword: process.env.NAVIDROME_PASSWORD || '',
}

export default config
