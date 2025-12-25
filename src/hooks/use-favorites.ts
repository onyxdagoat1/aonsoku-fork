import { useState, useEffect, useCallback } from 'react'

const FAVORITES_KEY = 'art-gallery-favorites'

export interface Favorite {
  id: string
  type: 'album' | 'custom'
  timestamp: number
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }, [favorites])

  const toggleFavorite = useCallback(
    (id: string, type: 'album' | 'custom') => {
      setFavorites((prev) => {
        const exists = prev.some((fav) => fav.id === id && fav.type === type)
        if (exists) {
          return prev.filter((fav) => !(fav.id === id && fav.type === type))
        }
        return [...prev, { id, type, timestamp: Date.now() }]
      })
    },
    []
  )

  const isFavorite = useCallback(
    (id: string, type: 'album' | 'custom') => {
      return favorites.some((fav) => fav.id === id && fav.type === type)
    },
    [favorites]
  )

  const getFavoritesByType = useCallback(
    (type: 'album' | 'custom') => {
      return favorites
        .filter((fav) => fav.type === type)
        .sort((a, b) => b.timestamp - a.timestamp)
    },
    [favorites]
  )

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    count: favorites.length,
  }
}
