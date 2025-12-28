import axios from 'axios'
import { logger } from '@/utils/logger'

export interface LRCLIBLyrics {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

const LRCLIB_API_BASE = 'https://lrclib.net/api'

const lyricsCache = new Map<string, LRCLIBLyrics | null>()

/**
 * Fetch lyrics from LRCLIB API
 * @param trackName - Name of the track
 * @param artistName - Name of the artist
 * @param albumName - Name of the album (optional)
 * @param duration - Duration of the track in seconds (optional, helps with accuracy)
 * @returns LRCLIBLyrics object or null if not found
 */
export async function fetchLyricsFromLRCLIB(
  trackName: string,
  artistName: string,
  albumName?: string,
  duration?: number,
): Promise<LRCLIBLyrics | null> {
  try {
    // Create cache key
    const cacheKey = `${artistName}-${trackName}-${albumName || ''}-${duration || ''}`
    
    // Check cache first
    if (lyricsCache.has(cacheKey)) {
      return lyricsCache.get(cacheKey) || null
    }

    const params: Record<string, string | number> = {
      track_name: trackName,
      artist_name: artistName,
    }

    if (albumName) {
      params.album_name = albumName
    }

    if (duration) {
      params.duration = Math.round(duration)
    }

    logger.info('[LyricsAPI] Fetching lyrics from LRCLIB', params)

    const response = await axios.get<LRCLIBLyrics>(`${LRCLIB_API_BASE}/get`, {
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Aonsoku/1.0.0',
      },
    })

    if (response.data) {
      lyricsCache.set(cacheKey, response.data)
      logger.info('[LyricsAPI] Successfully fetched lyrics', {
        track: trackName,
        hasPlain: !!response.data.plainLyrics,
        hasSynced: !!response.data.syncedLyrics,
      })
      return response.data
    }

    lyricsCache.set(cacheKey, null)
    return null
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        logger.info('[LyricsAPI] No lyrics found for track', { trackName, artistName })
      } else {
        logger.error('[LyricsAPI] Error fetching lyrics', error)
      }
    } else {
      logger.error('[LyricsAPI] Unexpected error', error)
    }
    return null
  }
}

/**
 * Search for lyrics on LRCLIB
 * @param query - Search query
 * @returns Array of potential matches
 */
export async function searchLyricsOnLRCLIB(
  query: string,
): Promise<LRCLIBLyrics[]> {
  try {
    logger.info('[LyricsAPI] Searching lyrics', { query })

    const response = await axios.get<LRCLIBLyrics[]>(
      `${LRCLIB_API_BASE}/search`,
      {
        params: { q: query },
        timeout: 10000,
        headers: {
          'User-Agent': 'Aonsoku/1.0.0',
        },
      },
    )

    logger.info('[LyricsAPI] Search results', { count: response.data?.length || 0 })
    return response.data || []
  } catch (error) {
    logger.error('[LyricsAPI] Error searching lyrics', error)
    return []
  }
}

/**
 * Clear the lyrics cache
 */
export function clearLyricsCache(): void {
  lyricsCache.clear()
  logger.info('[LyricsAPI] Cache cleared')
}

/**
 * Get cache size
 */
export function getLyricsCacheSize(): number {
  return lyricsCache.size
}
