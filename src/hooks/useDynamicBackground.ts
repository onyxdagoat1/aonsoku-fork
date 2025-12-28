import { useEffect, useState } from 'react'
import { FastAverageColor } from 'fast-average-color'
import { usePlayerCurrentSong } from '@/store/player.store'
import { useBackgroundSettings } from '@/store/layout.store'
import { logger } from '@/utils/logger'

interface BackgroundColors {
  primary: string
  secondary: string
  accent: string
}

const fac = new FastAverageColor()

export function useDynamicBackground() {
  const currentSong = usePlayerCurrentSong()
  const { enabled, intensity, blurAmount } = useBackgroundSettings()
  const [colors, setColors] = useState<BackgroundColors>({
    primary: 'rgba(0, 0, 0, 0)',
    secondary: 'rgba(0, 0, 0, 0)',
    accent: 'rgba(0, 0, 0, 0)',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !currentSong?.id) {
      setColors({
        primary: 'rgba(0, 0, 0, 0)',
        secondary: 'rgba(0, 0, 0, 0)',
        accent: 'rgba(0, 0, 0, 0)',
      })
      return
    }

    const extractColors = async () => {
      try {
        setIsLoading(true)
        
        // Create a temporary image element
        const img = document.createElement('img')
        img.crossOrigin = 'Anonymous'
        
        // Get album art URL (adjust based on your API)
        const artworkUrl = currentSong.coverArt
          ? `/api/getCoverArt?id=${currentSong.coverArt}&size=500`
          : null

        if (!artworkUrl) {
          setIsLoading(false)
          return
        }

        img.src = artworkUrl

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load image'))
        })

        // Extract primary color
        const primaryColor = await fac.getColorAsync(img, {
          algorithm: 'dominant',
          ignoredColor: [[255, 255, 255, 255, 50]],
        })

        // Extract secondary color from different region
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get colors from different regions for variation
        const topColor = await fac.getColorAsync(img, {
          top: 0,
          left: 0,
          width: img.width,
          height: img.height / 3,
          algorithm: 'simple',
        })

        const bottomColor = await fac.getColorAsync(img, {
          top: (img.height * 2) / 3,
          left: 0,
          width: img.width,
          height: img.height / 3,
          algorithm: 'simple',
        })

        // Apply intensity
        const applyIntensity = (rgba: string, alpha: number) => {
          const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
          if (!match) return rgba
          const [, r, g, b] = match
          return `rgba(${r}, ${g}, ${b}, ${alpha * intensity})`
        }

        setColors({
          primary: applyIntensity(primaryColor.rgba, 0.8),
          secondary: applyIntensity(topColor.rgba, 0.6),
          accent: applyIntensity(bottomColor.rgba, 0.4),
        })

        logger.info('[DynamicBackground] Colors extracted', {
          primary: primaryColor.hex,
          secondary: topColor.hex,
          accent: bottomColor.hex,
        })
      } catch (error) {
        logger.error('[DynamicBackground] Error extracting colors', error)
        setColors({
          primary: 'rgba(0, 0, 0, 0)',
          secondary: 'rgba(0, 0, 0, 0)',
          accent: 'rgba(0, 0, 0, 0)',
        })
      } finally {
        setIsLoading(false)
      }
    }

    extractColors()
  }, [currentSong?.id, enabled, intensity])

  return {
    colors,
    isLoading,
    enabled,
    blurAmount,
  }
}
