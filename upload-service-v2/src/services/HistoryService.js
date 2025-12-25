import { promises as fs } from 'fs';
import { join } from 'path';
import config from '../config.js';
import FileService from './FileService.js';

/**
 * HistoryService - Track upload history
 */
class HistoryService {
  constructor() {
    this.historyFile = join(config.dataPath, 'history.json');
    this.history = [];
    this.loaded = false;
  }

  /**
   * Load history from disk
   */
  async load() {
    try {
      await fs.mkdir(config.dataPath, { recursive: true });
      const data = await fs.readFile(this.historyFile, 'utf-8');
      this.history = JSON.parse(data);
      this.loaded = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, start with empty history
        this.history = [];
        this.loaded = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Save history to disk
   */
  async save() {
    await fs.mkdir(config.dataPath, { recursive: true });
    await fs.writeFile(
      this.historyFile,
      JSON.stringify(this.history, null, 2),
      'utf-8'
    );
  }

  /**
   * Add upload to history
   */
  async add(item) {
    if (!this.loaded) await this.load();

    const entry = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...item,
    };

    this.history.unshift(entry); // Add to beginning
    
    // Keep only last 200 uploads
    if (this.history.length > 200) {
      this.history = this.history.slice(0, 200);
    }

    await this.save();
    return entry;
  }

  /**
   * Get history (optionally limited)
   */
  async getAll(limit = 100) {
    if (!this.loaded) await this.load();
    return this.history.slice(0, limit);
  }

  /**
   * Update path in history (when file is moved)
   */
  async updatePath(oldPath, newPath) {
    if (!this.loaded) await this.load();

    let updated = false;
    for (const entry of this.history) {
      if (entry.path === oldPath) {
        entry.path = newPath;
        updated = true;
      }
    }

    if (updated) {
      await this.save();
    }

    return updated;
  }

  /**
   * Clear all history
   */
  async clear() {
    this.history = [];
    await this.save();
  }
}

// Export singleton
export default new HistoryService();
