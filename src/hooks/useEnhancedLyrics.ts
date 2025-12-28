import { useEffect, useState } from 'react'
import { usePlayerCurrentSong } from '@/store/player.store'
import { fetchLyricsFromLRCLIB, type LRCLIBLyrics } from '@/utils/lyricsApi'
import { logger } from '@/utils/logger'

export interface LyricsData {
  plain: string | null
  synced: string | null
  source: 'navidrome' | 'lrclib' | 'none'
  isInstrumental: boolean
}

export function useEnhancedLyrics() {
  const currentSong = usePlayerCurrentSong()
  const [lyrics, setLyrics] = useState<LyricsData>({
    plain: null,
    synced: null,
    source: 'none',
    isInstrumental: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentSong?.id) {
      setLyrics({
        plain: null,
        synced: null,
        source: 'none',
        isInstrumental: false,
      })
      return
    }

    const fetchLyrics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // First, check if lyrics exist in Navidrome
        // @ts-expect-error - lyrics property may not be in type definition
        const navidromeLyrics = currentSong.lyrics || currentSong.unsyncedLyrics

        if (navidromeLyrics) {
          logger.info('[EnhancedLyrics] Using Navidrome lyrics')
          setLyrics({
            plain: navidromeLyrics,
            synced: null, // Navidrome typically doesn't provide synced lyrics
            source: 'navidrome',
            isInstrumental: false,
          })
          setIsLoading(false)
          return
        }

        // If no lyrics in Navidrome, try LRCLIB
        logger.info('[EnhancedLyrics] No Navidrome lyrics, trying LRCLIB')
        
        const lrclibLyrics = await fetchLyricsFromLRCLIB(
          currentSong.title,
          currentSong.artist || '',
          currentSong.album || undefined,
          currentSong.duration || undefined,
        )

        if (lrclibLyrics) {
          setLyrics({
            plain: lrclibLyrics.plainLyrics,
            synced: lrclibLyrics.syncedLyrics,
            source: 'lrclib',
            isInstrumental: lrclibLyrics.instrumental,
          })
          logger.info('[EnhancedLyrics] LRCLIB lyrics loaded', {
            hasPlain: !!lrclibLyrics.plainLyrics,
            hasSynced: !!lrclibLyrics.syncedLyrics,
          })
        } else {
          setLyrics({
            plain: null,
            synced: null,
            source: 'none',
            isInstrumental: false,
          })
          setError('No lyrics found')
          logger.info('[EnhancedLyrics] No lyrics found anywhere')
        }
      } catch (err) {
        logger.error('[EnhancedLyrics] Error fetching lyrics', err)
        setError('Failed to fetch lyrics')
        setLyrics({
          plain: null,
          synced: null,
          source: 'none',
          isInstrumental: false,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLyrics()
  }, [currentSong?.id])

  return {
    lyrics,
    isLoading,
    error,
    hasLyrics: lyrics.source !== 'none',
  }
}
