import { useEffect, useRef } from 'react'
import { lastfmService } from '@/service/lastfmService'
import { useAuth } from '@/contexts/AuthContext'
import { usePlayerStore } from '@/store/player.store'

export function useLastFmScrobbling() {
  const { profile } = useAuth()
  const currentSong = usePlayerStore((state) => state.songlist.currentSong)
  const isPlaying = usePlayerStore((state) => state.playerState.isPlaying)
  const scrobbleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nowPlayingSentRef = useRef(false)

  // Send "now playing" update when track starts playing
  useEffect(() => {
    if (!profile?.lastfm_enabled || !currentSong || !isPlaying) {
      return
    }

    const sendNowPlaying = async () => {
      try {
        await lastfmService.updateNowPlaying(
          currentSong.artist || 'Unknown Artist',
          currentSong.title || 'Unknown Track',
          currentSong.album,
          currentSong.duration
        )
        nowPlayingSentRef.current = true
        console.log('Last.fm now playing updated:', currentSong.title)
      } catch (error) {
        console.error('Error updating Last.fm now playing:', error)
      }
    }

    // Send now playing immediately when track starts
    sendNowPlaying()

    // Cleanup when track stops or changes
    return () => {
      nowPlayingSentRef.current = false
    }
  }, [currentSong?.id, isPlaying, profile?.lastfm_enabled])

  // Set up scrobbling after track plays for sufficient time
  useEffect(() => {
    if (!profile?.lastfm_enabled || !currentSong || !isPlaying) {
      if (scrobbleTimeoutRef.current) {
        clearTimeout(scrobbleTimeoutRef.current)
        scrobbleTimeoutRef.current = null
      }
      return
    }

    // Clear any existing timeout
    if (scrobbleTimeoutRef.current) {
      clearTimeout(scrobbleTimeoutRef.current)
    }

    // Calculate scrobble time (minimum 50% of track or 4 minutes, whichever comes first)
    const duration = currentSong.duration || 240 // Default 4 minutes if no duration
    const scrobbleTime = Math.min(duration * 0.5, 240) * 1000 // Convert to milliseconds

    // Set timeout to scrobble after the required time
    scrobbleTimeoutRef.current = setTimeout(async () => {
      if (isPlaying && nowPlayingSentRef.current) {
        try {
          await lastfmService.scrobble(
            currentSong.artist || 'Unknown Artist',
            currentSong.title || 'Unknown Track',
            currentSong.album,
            Math.floor(Date.now() / 1000) - Math.floor(duration), // Approximate start time
            currentSong.duration
          )
          console.log('Last.fm scrobbled:', currentSong.title)
        } catch (error) {
          console.error('Error scrobbling to Last.fm:', error)
        }
      }
    }, scrobbleTime)

    // Cleanup timeout
    return () => {
      if (scrobbleTimeoutRef.current) {
        clearTimeout(scrobbleTimeoutRef.current)
        scrobbleTimeoutRef.current = null
      }
    }
  }, [currentSong?.id, isPlaying, profile?.lastfm_enabled, currentSong?.duration])

  // Manual scrobble function for immediate scrobbling
  const scrobbleNow = async () => {
    if (!profile?.lastfm_enabled || !currentSong) return

    try {
      await lastfmService.scrobble(
        currentSong.artist || 'Unknown Artist',
        currentSong.title || 'Unknown Track',
        currentSong.album,
        Math.floor(Date.now() / 1000),
        currentSong.duration
      )
      console.log('Last.fm manually scrobbled:', currentSong.title)
    } catch (error) {
      console.error('Error manual scrobbling to Last.fm:', error)
    }
  }

  return {
    scrobbleNow,
    canScrobble: !!profile?.lastfm_enabled && !!currentSong,
    isConnected: !!profile?.lastfm_enabled,
  }
}
