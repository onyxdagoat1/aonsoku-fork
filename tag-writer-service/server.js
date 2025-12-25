const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const NodeID3 = require('node-id3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const NAVIDROME_URL = process.env.NAVIDROME_URL || 'http://localhost:4533';
const MUSIC_LIBRARY_PATH = process.env.MUSIC_LIBRARY_PATH || '/music';
const NAVIDROME_USERNAME = process.env.NAVIDROME_USERNAME;
const NAVIDROME_PASSWORD = process.env.NAVIDROME_PASSWORD;

// CORS configuration
const corsOptions = {
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper function to get Navidrome API credentials
function getNavidromeAuth() {
  const salt = 'navidrome';
  const token = require('crypto')
    .createHash('md5')
    .update(NAVIDROME_PASSWORD + salt)
    .digest('hex');
  
  return {
    u: NAVIDROME_USERNAME,
    t: token,
    s: salt,
    v: '1.16.0',
    c: 'TagWriter',
    f: 'json',
  };
}

// Helper function to trigger Navidrome rescan
async function triggerNavidromeRescan() {
  try {
    const auth = getNavidromeAuth();
    const params = new URLSearchParams(auth);
    await axios.get(`${NAVIDROME_URL}/rest/startScan?${params}`);
    console.log('Navidrome rescan triggered');
    return true;
  } catch (error) {
    console.error('Failed to trigger Navidrome rescan:', error.message);
    return false;
  }
}

// Helper function to get song info from Navidrome
async function getSongFromNavidrome(songId) {
  try {
    const auth = getNavidromeAuth();
    const params = new URLSearchParams({ ...auth, id: songId });
    const response = await axios.get(`${NAVIDROME_URL}/rest/getSong?${params}`);
    return response.data['subsonic-response']?.song;
  } catch (error) {
    console.error('Failed to get song from Navidrome:', error.message);
    return null;
  }
}

// Convert metadata to node-id3 format
function convertToID3Tags(metadata, existingTags = {}) {
  const tags = { ...existingTags };
  
  if (metadata.title) tags.title = metadata.title;
  if (metadata.artist) tags.artist = metadata.artist;
  if (metadata.album) tags.album = metadata.album;
  if (metadata.albumArtist) tags.performerInfo = metadata.albumArtist;
  if (metadata.year) tags.year = metadata.year.toString();
  if (metadata.genre) tags.genre = metadata.genre;
  if (metadata.track) tags.trackNumber = metadata.track.toString();
  if (metadata.disc) tags.partOfSet = metadata.disc.toString();
  if (metadata.composer) tags.composer = metadata.composer;
  if (metadata.bpm) tags.bpm = metadata.bpm.toString();
  if (metadata.comment) tags.comment = { text: metadata.comment };
  if (metadata.lyrics) tags.unsynchronisedLyrics = { text: metadata.lyrics };
  
  return tags;
}

// Endpoint to update song metadata
app.post('/api/update-tags', async (req, res) => {
  try {
    const { songId, metadata } = req.body;
    
    if (!songId || !metadata) {
      return res.status(400).json({ error: 'Missing songId or metadata' });
    }
    
    // Get song info from Navidrome to find file path
    const song = await getSongFromNavidrome(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found in Navidrome' });
    }
    
    // Construct full file path
    const filePath = path.join(MUSIC_LIBRARY_PATH, song.path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Music file not found on disk' });
    }
    
    // Read existing tags
    const existingTags = NodeID3.read(filePath);
    
    // Merge with new metadata
    const tags = convertToID3Tags(metadata, existingTags);
    
    // Write tags to file
    const success = NodeID3.write(tags, filePath);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to write tags' });
    }
    
    // Trigger Navidrome rescan
    await triggerNavidromeRescan();
    
    res.json({ 
      success: true, 
      message: 'Tags updated successfully',
      path: song.path,
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update cover art
app.post('/api/update-cover-art', upload.single('coverArt'), async (req, res) => {
  try {
    const { songId } = req.body;
    const coverArtFile = req.file;
    
    if (!songId || !coverArtFile) {
      return res.status(400).json({ error: 'Missing songId or coverArt' });
    }
    
    // Get song info from Navidrome
    const song = await getSongFromNavidrome(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found in Navidrome' });
    }
    
    // Construct full file path
    const filePath = path.join(MUSIC_LIBRARY_PATH, song.path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Music file not found on disk' });
    }
    
    // Read existing tags
    const existingTags = NodeID3.read(filePath) || {};
    
    // Add cover art
    existingTags.image = {
      mime: coverArtFile.mimetype,
      type: { id: 3, name: 'front cover' },
      description: 'Cover',
      imageBuffer: coverArtFile.buffer,
    };
    
    // Write tags to file
    const success = NodeID3.write(existingTags, filePath);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to write cover art' });
    }
    
    // Trigger Navidrome rescan
    await triggerNavidromeRescan();
    
    res.json({ 
      success: true, 
      message: 'Cover art updated successfully',
    });
  } catch (error) {
    console.error('Error updating cover art:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get current tags
app.get('/api/get-tags/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    
    // Get song info from Navidrome
    const song = await getSongFromNavidrome(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found in Navidrome' });
    }
    
    // Construct full file path
    const filePath = path.join(MUSIC_LIBRARY_PATH, song.path);
    
    // Read tags
    const tags = NodeID3.read(filePath);
    
    res.json({ 
      success: true, 
      tags,
      path: song.path,
    });
  } catch (error) {
    console.error('Error reading tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to trigger manual rescan
app.post('/api/rescan', async (req, res) => {
  try {
    const success = await triggerNavidromeRescan();
    
    if (success) {
      res.json({ success: true, message: 'Rescan triggered' });
    } else {
      res.status(500).json({ error: 'Failed to trigger rescan' });
    }
  } catch (error) {
    console.error('Error triggering rescan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Tag Writer Service running on port ${PORT}`);
  console.log(`Navidrome URL: ${NAVIDROME_URL}`);
  console.log(`Music Library: ${MUSIC_LIBRARY_PATH}`);
});
