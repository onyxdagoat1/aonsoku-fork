import { useState, useEffect, useCallback } from 'react'

const DOWNLOAD_HISTORY_KEY = 'art-gallery-download-history'

export interface DownloadHistoryItem {
  id: string
  type: 'album' | 'custom'
  count: number
  lastDownloaded: number
  name: string
  artist: string
}

export function useDownloadHistory() {
  const [downloads, setDownloads] = useState<Record<string, DownloadHistoryItem>>(() => {
    try {
      const stored = localStorage.getItem(DOWNLOAD_HISTORY_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(downloads))
    } catch (error) {
      console.error('Failed to save download history:', error)
    }
  }, [downloads])

  const recordDownload = useCallback(
    (id: string, type: 'album' | 'custom', name: string, artist: string) => {
      setDownloads((prev) => {
        const key = `${type}-${id}`
        const existing = prev[key]
        return {
          ...prev,
          [key]: {
            id,
            type,
            count: existing ? existing.count + 1 : 1,
            lastDownloaded: Date.now(),
            name,
            artist,
          },
        }
      })
    },
    []
  )

  const getDownloadCount = useCallback(
    (id: string, type: 'album' | 'custom') => {
      const key = `${type}-${id}`
      return downloads[key]?.count || 0
    },
    [downloads]
  )

  const getTotalDownloads = useCallback(() => {
    return Object.values(downloads).reduce((sum, item) => sum + item.count, 0)
  }, [downloads])

  const getMostDownloaded = useCallback(
    (limit: number = 10) => {
      return Object.values(downloads)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    },
    [downloads]
  )

  const clearHistory = useCallback(() => {
    setDownloads({})
  }, [])

  return {
    downloads,
    recordDownload,
    getDownloadCount,
    getTotalDownloads,
    getMostDownloaded,
    clearHistory,
  }
}
