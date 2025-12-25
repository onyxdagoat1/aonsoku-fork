import { useCallback, useEffect, useState } from 'react'

export const SPEED_PRESETS = [
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: 'Normal', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '1.75x', value: 1.75 },
  { label: '2x', value: 2 },
]

export function usePlaybackSpeed(audioElement: HTMLAudioElement | null) {
  const [speed, setSpeed] = useState<number>(1)
  const [preservePitch, setPreservePitch] = useState<boolean>(true)

  // Apply speed to audio element
  useEffect(() => {
    if (!audioElement) return

    audioElement.playbackRate = speed
    audioElement.preservesPitch = preservePitch
  }, [audioElement, speed, preservePitch])

  const changeSpeed = useCallback((newSpeed: number) => {
    // Clamp between 0.25x and 2x
    const clampedSpeed = Math.max(0.25, Math.min(2, newSpeed))
    setSpeed(clampedSpeed)
  }, [])

  const resetSpeed = useCallback(() => {
    setSpeed(1)
  }, [])

  const increaseSpeed = useCallback(() => {
    setSpeed((prev) => {
      const newSpeed = prev + 0.25
      return Math.min(2, newSpeed)
    })
  }, [])

  const decreaseSpeed = useCallback(() => {
    setSpeed((prev) => {
      const newSpeed = prev - 0.25
      return Math.max(0.25, newSpeed)
    })
  }, [])

  const togglePreservePitch = useCallback(() => {
    setPreservePitch((prev) => !prev)
  }, [])

  return {
    speed,
    changeSpeed,
    resetSpeed,
    increaseSpeed,
    decreaseSpeed,
    preservePitch,
    togglePreservePitch,
  }
}
