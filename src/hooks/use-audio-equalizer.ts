import { useEffect, useRef, useState } from 'react'

export interface EqualizerBand {
  frequency: number
  gain: number
  Q: number
}

export interface EqualizerPreset {
  name: string
  bands: number[]
}

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Pop', bands: [-1, -0.5, 0, 1, 3, 3, 1, 0, -0.5, -1] },
  { name: 'Rock', bands: [4, 3, 2, 1, -1, -1, 0, 1, 2, 3] },
  { name: 'Jazz', bands: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3] },
  { name: 'Classical', bands: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3] },
  { name: 'Bass Boost', bands: [6, 5, 4, 2, 1, 0, 0, 0, 0, 0] },
  { name: 'Treble Boost', bands: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6] },
  { name: 'Vocal Boost', bands: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2] },
  { name: 'Electronic', bands: [4, 3, 1, 0, -2, 2, 0, 1, 3, 4] },
  { name: 'Hip Hop', bands: [5, 4, 1, 2, -1, -1, 1, 0, 2, 3] },
]

// 10-band equalizer frequencies (Hz)
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

export function useAudioEqualizer(
  audioElement: HTMLAudioElement | null,
  audioContext: AudioContext | null,
) {
  const [enabled, setEnabled] = useState(false)
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0))
  const [activePreset, setActivePreset] = useState<string>('Flat')
  
  const filtersRef = useRef<BiquadFilterNode[]>([])
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  // Initialize equalizer filters
  useEffect(() => {
    if (!audioContext || !audioElement) return

    // Create source node if it doesn't exist
    if (!sourceRef.current) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(audioElement)
      } catch (e) {
        // Source already connected
        return
      }
    }

    // Create filters if they don't exist
    if (filtersRef.current.length === 0) {
      const filters = EQ_FREQUENCIES.map((frequency, index) => {
        const filter = audioContext.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = frequency
        filter.Q.value = 1
        filter.gain.value = gains[index]
        return filter
      })

      filtersRef.current = filters

      // Connect filters in series
      let previousNode: AudioNode = sourceRef.current
      filters.forEach((filter) => {
        previousNode.connect(filter)
        previousNode = filter
      })
      previousNode.connect(audioContext.destination)
    }

    return () => {
      // Cleanup is handled when component unmounts
    }
  }, [audioContext, audioElement, gains])

  // Update filter gains when changed
  useEffect(() => {
    if (!enabled || filtersRef.current.length === 0) return

    filtersRef.current.forEach((filter, index) => {
      filter.gain.value = gains[index]
    })
  }, [gains, enabled])

  const setGain = (index: number, gain: number) => {
    setGains((prev) => {
      const newGains = [...prev]
      newGains[index] = Math.max(-12, Math.min(12, gain))
      return newGains
    })
    setActivePreset('Custom')
  }

  const applyPreset = (presetName: string) => {
    const preset = EQUALIZER_PRESETS.find((p) => p.name === presetName)
    if (preset) {
      setGains(preset.bands)
      setActivePreset(presetName)
    }
  }

  const resetEqualizer = () => {
    setGains(new Array(10).fill(0))
    setActivePreset('Flat')
  }

  const toggleEnabled = () => {
    setEnabled((prev) => !prev)
    if (!enabled) {
      // Reset gains when disabling
      filtersRef.current.forEach((filter) => {
        filter.gain.value = 0
      })
    }
  }

  return {
    enabled,
    toggleEnabled,
    gains,
    setGain,
    activePreset,
    applyPreset,
    resetEqualizer,
    frequencies: EQ_FREQUENCIES,
  }
}
