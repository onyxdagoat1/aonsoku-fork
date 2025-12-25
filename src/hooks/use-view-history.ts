import { useState, useEffect, useCallback } from 'react'

const VIEW_HISTORY_KEY = 'art-gallery-view-history'
const MAX_HISTORY_ITEMS = 100

export interface ViewHistoryItem {
  id: string
  type: 'album' | 'custom'
  timestamp: number
  name: string
  artist: string
  imageUrl?: string
}

export function useViewHistory() {
  const [history, setHistory] = useState<ViewHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(VIEW_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save view history:', error)
    }
  }, [history])

  const addToHistory = useCallback(
    (item: Omit<ViewHistoryItem, 'timestamp'>) => {
      setHistory((prev) => {
        // Remove existing entry if present
        const filtered = prev.filter(
          (h) => !(h.id === item.id && h.type === item.type)
        )
        // Add new entry at the beginning
        const updated = [
          { ...item, timestamp: Date.now() },
          ...filtered,
        ]
        // Keep only last MAX_HISTORY_ITEMS
        return updated.slice(0, MAX_HISTORY_ITEMS)
      })
    },
    []
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const getRecentHistory = useCallback(
    (limit: number = 20) => {
      return history.slice(0, limit)
    },
    [history]
  )

  return {
    history,
    addToHistory,
    clearHistory,
    getRecentHistory,
    count: history.length,
  }
}
