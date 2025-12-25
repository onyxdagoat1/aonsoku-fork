import { useCallback, useEffect, useRef } from 'react'

export interface CrossfadeOptions {
  duration: number // in seconds
  enabled: boolean
}

export function useAudioCrossfade(
  audioElement: HTMLAudioElement | null,
  audioContext: AudioContext | null,
  options: CrossfadeOptions,
) {
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const currentVolumeRef = useRef<number>(1)

  // Initialize gain node for crossfading
  useEffect(() => {
    if (!audioContext || !audioElement || !options.enabled) return

    // Create source node if it doesn't exist
    if (!sourceRef.current) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(audioElement)
      } catch (e) {
        // Source already connected
        return
      }
    }

    // Create gain node if it doesn't exist
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain()
      gainNodeRef.current.gain.value = currentVolumeRef.current
      
      // Connect: source -> gain -> destination
      sourceRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(audioContext.destination)
    }

    return () => {
      // Cleanup handled when component unmounts
    }
  }, [audioContext, audioElement, options.enabled])

  // Fade out
  const fadeOut = useCallback(
    (duration?: number) => {
      if (!audioContext || !gainNodeRef.current || !options.enabled) return Promise.resolve()

      const fadeTime = duration || options.duration
      const currentTime = audioContext.currentTime
      const gainNode = gainNodeRef.current

      // Cancel any scheduled changes
      gainNode.gain.cancelScheduledValues(currentTime)
      
      // Start from current value
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      
      // Exponential fade out for more natural sound
      gainNode.gain.exponentialRampToValueAtTime(
        0.001, // Can't fade to 0 with exponential ramp
        currentTime + fadeTime,
      )

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (gainNode) {
            gainNode.gain.value = 0
          }
          resolve()
        }, fadeTime * 1000)
      })
    },
    [audioContext, options.duration, options.enabled],
  )

  // Fade in
  const fadeIn = useCallback(
    (targetVolume: number = 1, duration?: number) => {
      if (!audioContext || !gainNodeRef.current || !options.enabled) return Promise.resolve()

      const fadeTime = duration || options.duration
      const currentTime = audioContext.currentTime
      const gainNode = gainNodeRef.current

      // Cancel any scheduled changes
      gainNode.gain.cancelScheduledValues(currentTime)
      
      // Start from very low value
      gainNode.gain.setValueAtTime(0.001, currentTime)
      
      // Exponential fade in
      gainNode.gain.exponentialRampToValueAtTime(
        targetVolume,
        currentTime + fadeTime,
      )

      currentVolumeRef.current = targetVolume

      return new Promise<void>((resolve) => {
        setTimeout(resolve, fadeTime * 1000)
      })
    },
    [audioContext, options.duration, options.enabled],
  )

  // Crossfade between tracks
  const crossfade = useCallback(
    async (onTransition: () => void | Promise<void>) => {
      if (!options.enabled) {
        await onTransition()
        return
      }

      // Fade out current track
      await fadeOut()
      
      // Perform the transition (change track)
      await onTransition()
      
      // Fade in new track
      await fadeIn()
    },
    [fadeOut, fadeIn, options.enabled],
  )

  // Set volume (used for manual volume changes)
  const setVolume = useCallback(
    (volume: number) => {
      if (!gainNodeRef.current) return
      
      const clampedVolume = Math.max(0, Math.min(1, volume))
      gainNodeRef.current.gain.value = clampedVolume
      currentVolumeRef.current = clampedVolume
    },
    [],
  )

  return {
    fadeOut,
    fadeIn,
    crossfade,
    setVolume,
  }
}
