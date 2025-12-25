import { promises as fs } from 'fs';
import { join, resolve, relative, normalize, isAbsolute, basename, dirname, extname } from 'path';
import config from '../config.js';

/**
 * FileService - Handles ALL file operations with bulletproof path resolution
 */
class FileService {
  constructor() {
    this.musicPath = config.musicPath;
  }

  /**
   * Resolve any path input to absolute path within music library
   * Handles: absolute paths, relative paths, Navidrome paths, upload history paths
   */
  async resolvePath(inputPath) {
    if (!inputPath) {
      throw new Error('Path is required');
    }

    let attempts = [];
    
    // Strategy 1: If absolute, check if it's within or equals music path
    if (isAbsolute(inputPath)) {
      const normalized = normalize(inputPath);
      attempts.push({ strategy: 'absolute', path: normalized });
      
      if (await this._fileExists(normalized)) {
        // Verify it's within music library for security
        if (this._isWithinMusicPath(normalized)) {
          return normalized;
        }
      }
    }

    // Strategy 2: Treat as relative to music path
    const relativePath = join(this.musicPath, inputPath);
    const normalized = normalize(relativePath);
    attempts.push({ strategy: 'relative-to-music', path: normalized });
    
    if (await this._fileExists(normalized)) {
      return normalized;
    }

    // Strategy 3: Try just the filename in music path
    const filename = basename(inputPath);
    const filenamePath = join(this.musicPath, filename);
    attempts.push({ strategy: 'basename-in-music', path: filenamePath });
    
    if (await this._fileExists(filenamePath)) {
      return filenamePath;
    }

    // All strategies failed
    const error = new Error('File not found');
    error.code = 'FILE_NOT_FOUND';
    error.inputPath = inputPath;
    error.musicPath = this.musicPath;
    error.attempts = attempts;
    throw error;
  }

  /**
   * Get relative path from music library root
   */
  getRelativePath(absolutePath) {
    return relative(this.musicPath, absolutePath);
  }

  /**
   * Get absolute path from relative path
   */
  getAbsolutePath(relativePath) {
    return join(this.musicPath, relativePath);
  }

  /**
   * Check if file exists
   */
  async exists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file
   */
  async readFile(path) {
    const resolved = await this.resolvePath(path);
    return fs.readFile(resolved);
  }

  /**
   * Write file
   */
  async writeFile(path, data) {
    const resolved = await this.resolvePath(path);
    return fs.writeFile(resolved, data);
  }

  /**
   * Move/rename file (works across filesystems)
   */
  async moveFile(sourcePath, destPath) {
    const source = await this.resolvePath(sourcePath);
    const dest = isAbsolute(destPath) ? destPath : join(this.musicPath, destPath);

    // Ensure destination directory exists
    await fs.mkdir(dirname(dest), { recursive: true });

    try {
      // Try rename first (fast, same filesystem)
      await fs.rename(source, dest);
    } catch (error) {
      if (error.code === 'EXDEV') {
        // Cross-filesystem, use copy + delete
        await fs.copyFile(source, dest);
        await fs.unlink(source);
      } else {
        throw error;
      }
    }

    return dest;
  }

  /**
   * Ensure directory exists
   */
  async ensureDir(path) {
    await fs.mkdir(path, { recursive: true });
  }

  /**
   * Delete file
   */
  async deleteFile(path) {
    const resolved = await this.resolvePath(path);
    await fs.unlink(resolved);
  }

  /**
   * Clean up empty directories
   */
  async cleanupEmptyDirs(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rmdir(dirPath);
        // Recursively clean parent
        const parent = dirname(dirPath);
        if (parent !== this.musicPath && parent.startsWith(this.musicPath)) {
          await this.cleanupEmptyDirs(parent);
        }
      }
    } catch (error) {
      // Ignore errors (dir might not be empty or might not exist)
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(path) {
    const resolved = await this.resolvePath(path);
    const stats = await fs.stat(resolved);
    return {
      path: resolved,
      relativePath: this.getRelativePath(resolved),
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
    };
  }

  /**
   * Build organized path for music file
   */
  buildMusicPath(artist, album, title, extension) {
    const sanitize = (str) => str.replace(/[/\\?%*:|"<>]/g, '-').trim();
    
    const safeArtist = sanitize(artist || 'Unknown Artist');
    const safeAlbum = sanitize(album || 'Unknown Album');
    const safeTitle = sanitize(title || 'Untitled');
    
    return join(this.musicPath, safeArtist, safeAlbum, `${safeTitle}${extension}`);
  }

  // Private helpers
  
  async _fileExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  _isWithinMusicPath(path) {
    const normalized = normalize(path);
    const musicPathNormalized = normalize(this.musicPath);
    return normalized.startsWith(musicPathNormalized);
  }
}

// Export singleton instance
export default new FileService();
