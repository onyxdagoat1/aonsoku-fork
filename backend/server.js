const express = require('express')
const cors = require('cors')
const NodeID3 = require('node-id3')
const fs = require('fs').promises
const path = require('path')
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Configuration
const config = {
  navidromeUrl: process.env.NAVIDROME_URL || 'http://localhost:4533',
  navidromeUsername: process.env.NAVIDROME_USERNAME,
  navidromePassword: process.env.NAVIDROME_PASSWORD,
  musicLibraryPath: process.env.MUSIC_LIBRARY_PATH,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
}

// Initialize Supabase client (use service role key if available, otherwise anon key)
const supabase =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey)
    : null

// Helper: Get file path from song ID via Navidrome API
async function getSongFilePath(songId) {
  try {
    const params = new URLSearchParams({
      u: config.navidromeUsername,
      p: config.navidromePassword,
      v: '1.16.0',
      c: 'aonsoku-tag-service',
      f: 'json',
      id: songId,
    })

    const response = await axios.get(
      `${config.navidromeUrl}/rest/getSong?${params.toString()}`,
    )

    if (response.data['subsonic-response']?.song?.path) {
      const relativePath = response.data['subsonic-response'].song.path
      return path.join(config.musicLibraryPath, relativePath)
    }

    throw new Error('Song path not found in server response')
  } catch (error) {
    console.error('Error getting song file path:', error.message)
    throw error
  }
}

// Helper: Trigger Navidrome library scan
async function triggerNavidromeScan() {
  try {
    const params = new URLSearchParams({
      u: config.navidromeUsername,
      p: config.navidromePassword,
      v: '1.16.0',
      c: 'aonsoku-tag-service',
      f: 'json',
    })

    await axios.get(
      `${config.navidromeUrl}/rest/startScan?${params.toString()}`,
    )

    console.log('Library scan triggered')
    return true
  } catch (error) {
    console.error('Error triggering Library scan:', error.message)
    return false
  }
}

// Helper: Convert base64 image to buffer
function base64ToBuffer(base64String) {
  const matches = base64String.match(/^data:image\/([a-z]+);base64,(.+)$/)
  if (matches) {
    return {
      mime: `image/${matches[1]}`,
      buffer: Buffer.from(matches[2], 'base64'),
    }
  }
  // If no data URL prefix, assume it's just base64
  return {
    mime: 'image/jpeg',
    buffer: Buffer.from(base64String, 'base64'),
  }
}

// API: Update song metadata
app.post('/api/update-song-tags', async (req, res) => {
  try {
    const { songId, metadata, coverArt } = req.body

    if (!songId) {
      return res.status(400).json({ error: 'Song ID is required' })
    }

    // Get the file path from Navidrome
    const filePath = await getSongFilePath(songId)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      return res.status(404).json({
        error: 'Audio file not found',
        path: filePath,
      })
    }

    // Prepare ID3 tags
    const tags = {}

    if (metadata.title) tags.title = metadata.title
    if (metadata.artist) tags.artist = metadata.artist
    if (metadata.album) tags.album = metadata.album
    if (metadata.albumArtist) tags.performerInfo = metadata.albumArtist
    if (metadata.year) tags.year = metadata.year.toString()
    if (metadata.genre) tags.genre = metadata.genre
    if (metadata.track) tags.trackNumber = metadata.track.toString()
    if (metadata.disc) tags.partOfSet = metadata.disc.toString()
    if (metadata.composer) tags.composer = metadata.composer
    if (metadata.bpm) tags.bpm = metadata.bpm.toString()
    if (metadata.comment) tags.comment = { text: metadata.comment }
    if (metadata.lyrics) {
      tags.unsynchronisedLyrics = {
        language: 'eng',
        text: metadata.lyrics,
      }
    }

    // Handle cover art
    if (coverArt) {
      const imageData = base64ToBuffer(coverArt)
      tags.image = {
        mime: imageData.mime,
        type: {
          id: 3, // Front cover
        },
        description: 'Cover',
        imageBuffer: imageData.buffer,
      }
    }

    // Write tags to file
    const fileExtension = path.extname(filePath).toLowerCase()

    if (fileExtension === '.mp3') {
      // Use node-id3 for MP3 files
      const success = NodeID3.write(tags, filePath)

      if (success !== true) {
        throw new Error('Failed to write ID3 tags')
      }
    } else if (['.flac', '.m4a', '.aac', '.ogg'].includes(fileExtension)) {
      // For non-MP3 formats, we'd need different libraries
      // For now, return an informative error
      return res.status(400).json({
        error: `Tag writing for ${fileExtension} files is not yet implemented`,
        suggestion:
          'Currently only MP3 files are supported. Support for FLAC, M4A, and OGG coming soon.',
      })
    } else {
      return res.status(400).json({
        error: 'Unsupported file format',
        format: fileExtension,
      })
    }

    // Trigger Navidrome rescan
    const scanTriggered = await triggerNavidromeScan()

    res.json({
      success: true,
      message: 'Tags updated successfully',
      filePath,
      scanTriggered,
      updatedFields: Object.keys(tags),
    })
  } catch (error) {
    console.error('Error updating song tags:', error)
    res.status(500).json({
      error: 'Failed to update song tags',
      details: error.message,
    })
  }
})

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aonsoku-tag-service',
    version: '1.0.0',
    navidromeUrl: config.navidromeUrl,
    musicLibraryPath: config.musicLibraryPath,
  })
})

// API: Test Navidrome connection
app.get('/api/test-navidrome', async (req, res) => {
  try {
    const params = new URLSearchParams({
      u: config.navidromeUsername,
      p: config.navidromePassword,
      v: '1.16.0',
      c: 'aonsoku-tag-service',
      f: 'json',
    })

    const response = await axios.get(
      `${config.navidromeUrl}/rest/ping?${params.toString()}`,
    )

    res.json({
      success: true,
      navidrome: response.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// API: Get users list for admin panel (requires authentication)
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase not configured',
      })
    }

    // Get auth token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized - No token provided',
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized - Invalid token',
      })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.is_admin) {
      return res.status(403).json({
        error: 'Forbidden - Admin access required',
      })
    }

    // Get all profiles with user emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw profilesError
    }

    // Get emails from auth.users (requires service role key)
    // If we only have anon key, we'll return profiles without emails
    let usersWithEmails = profiles || []

    if (
      config.supabaseServiceKey &&
      config.supabaseServiceKey !== process.env.SUPABASE_ANON_KEY
    ) {
      // We have service role key, can get emails
      try {
        const {
          data: { users },
          error: usersError,
        } = await supabase.auth.admin.listUsers()

        if (!usersError && users) {
          usersWithEmails = (profiles || []).map((profile) => {
            const authUser = users.find((u) => u.id === profile.id)
            return {
              ...profile,
              email: authUser?.email || 'N/A',
            }
          })
        }
      } catch (err) {
        console.error('Error fetching user emails:', err)
        // Continue without emails
      }
    }

    res.json({
      success: true,
      users: usersWithEmails,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message,
    })
  }
})

// API: Proxy Tenor search
app.get('/api/proxy/tenor/search', async (req, res) => {
  try {
    const { q, limit } = req.query
    const apiKey = process.env.TENOR_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Tenor API key not configured' })
    }

    const params = new URLSearchParams({
      q: q || '',
      key: apiKey,
      client_key: 'aonsoku',
      limit: limit || '20',
      country: 'US',
      locale: 'en_US',
      contentfilter: 'medium',
      media_filter: 'minimal',
    })

    const response = await axios.get(
      `https://tenor.googleapis.com/v2/search?${params.toString()}`,
    )

    res.json({ results: response.data.results })
  } catch (error) {
    console.error('Tenor proxy error:', error.message)
    res.status(500).json({ error: 'Failed to fetch from Tenor' })
  }
})

// API: Proxy Tenor trending
app.get('/api/proxy/tenor/trending', async (req, res) => {
  try {
    const { limit } = req.query
    const apiKey = process.env.TENOR_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Tenor API key not configured' })
    }

    const params = new URLSearchParams({
      key: apiKey,
      client_key: 'aonsoku',
      limit: limit || '20',
      country: 'US',
      locale: 'en_US',
      contentfilter: 'medium',
      media_filter: 'minimal',
    })

    const response = await axios.get(
      `https://tenor.googleapis.com/v2/featured?${params.toString()}`,
    )

    res.json({ results: response.data.results })
  } catch (error) {
    console.error('Tenor proxy error:', error.message)
    res.status(500).json({ error: 'Failed to fetch from Tenor' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`\n Aonsoku Tag Service`)
  console.log(`   Running on port ${PORT}`)
  console.log(`   Navidrome: ${config.navidromeUrl}`)
  console.log(`   Music Library: ${config.musicLibraryPath}\n`)
})
