import { useEffect, useRef } from 'react'
import { chartsService } from '@/service/charts.service'
import { usePlayerStore } from '@/store/player.store'

export function useStreamTracking() {
  const currentSong = usePlayerStore((state) => state.songlist.currentSong)
  const isPlaying = usePlayerStore((state) => state.playerState.isPlaying)
  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ref to track if we already recorded a stream for the current song ID
  // This prevents duplicates if the user pauses/plays the same song repeatedly
  const trackedSongIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentSong?.id) {
      // Reset when no song is playing
      trackedSongIdRef.current = null
      return
    }

    // specific check: if we switched songs, reset the tracker
    if (trackedSongIdRef.current !== currentSong.id) {
      trackedSongIdRef.current = null // Ready to track new song
    }
  }, [currentSong?.id])

  useEffect(() => {
    if (!currentSong || !currentSong.id) {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current)
        trackingTimeoutRef.current = null
      }
      return
    }

    // If we already tracked this specific song session, don't track again
    // Note: If user plays song A, then song B, then song A again, it SHOULD track song A again.
    // The previous useEffect handles the ID switch reset.
    // However, we need a local state for "have we tracked this instance of the song yet?"
    // Actually, `trackedSongIdRef.current === currentSong.id` check is sufficient.

    if (trackedSongIdRef.current === currentSong.id) {
      return
    }

    if (!isPlaying) {
      // pause timer if paused?
      // Standard scrobble logic: usually you just need to listen for X amount of time.
      // Simple implementation: If they pause, we clear timeout. If they resume, we restart timeout?
      // That would mean they have to listen 30s CONTINUOUSLY. That's probably fine for V1.
      // Better: use a cumulative timer, but that's complex.
      // Let's stick to: "Must play for 30s continuous or remaining duration"

      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current)
        trackingTimeoutRef.current = null
      }
      return
    }

    // Clear any existing timeout
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current)
    }

    // Calculate time to record: 30 seconds or 50% of track, whichever is smaller?
    // Usually 30s is the industry standard for a stream count.
    const recordTime = 30 * 1000 // 30 seconds

    // But if song is shorter than 30s?
    // Then we track at the end? Or maybe just 30s threshold is strictly enforced.
    // Let's just use 30s for now.

    trackingTimeoutRef.current = setTimeout(async () => {
      if (isPlaying && currentSong) {
        // Double check
        try {
          await chartsService.recordStream(
            currentSong.id,
            currentSong.duration || 0,
            currentSong.albumId || null,
            currentSong.artistId || null,
          )
          console.log('Stream recorded:', currentSong.title)
          trackedSongIdRef.current = currentSong.id // Mark as tracked
        } catch (error) {
          console.error('Error recording stream:', error)
        }
      }
    }, recordTime)

    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current)
        trackingTimeoutRef.current = null
      }
    }
  }, [currentSong?.id, isPlaying])
}
