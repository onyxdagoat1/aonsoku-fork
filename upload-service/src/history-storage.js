import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../data/upload-history.json');
const MAX_HISTORY_ITEMS = 1000;

/**
 * Load upload history from persistent storage
 */
export async function loadHistory() {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
    
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(data);
    console.log(`Loaded ${history.length} items from upload history`);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing upload history found, starting fresh');
      return [];
    }
    console.error('Error loading upload history:', error);
    return [];
  }
}

/**
 * Save upload history to persistent storage
 */
export async function saveHistory(history) {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
    
    // Limit history size
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    await fs.writeFile(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving upload history:', error);
    return false;
  }
}

/**
 * Add item to history and save
 */
export async function addToHistory(history, item) {
  history.unshift(item);
  await saveHistory(history);
  return history;
}

/**
 * Update a file path in history (when file is moved/renamed)
 */
export async function updateHistoryPath(history, oldPath, newPath) {
  let updated = false;
  
  for (const item of history) {
    if (item.path === oldPath) {
      item.path = newPath;
      updated = true;
      console.log(`Updated history path: ${oldPath} -> ${newPath}`);
    }
  }
  
  if (updated) {
    await saveHistory(history);
  }
  
  return history;
}
