import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import { getCoverArtUrl } from '@/api/httpClient'
import { IAlbum } from '@/types/responses/album'
import { CustomArtwork } from '@/store/artwork.store'

export interface DownloadProgress {
  current: number
  total: number
  status: 'idle' | 'downloading' | 'zipping' | 'complete' | 'error'
  error?: string
}

export function useBulkDownload() {
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  })

  const downloadAlbums = useCallback(async (albums: IAlbum[]) => {
    if (albums.length === 0) return

    setProgress({ current: 0, total: albums.length, status: 'downloading' })

    try {
      const zip = new JSZip()

      for (let i = 0; i < albums.length; i++) {
        const album = albums[i]
        setProgress({ current: i + 1, total: albums.length, status: 'downloading' })

        try {
          const coverUrl = getCoverArtUrl(album.coverArt, 'album', '800')
          const response = await fetch(coverUrl)
          const blob = await response.blob()
          const fileName = `${album.artist} - ${album.name}.jpg`
            .replace(/[/\\?%*:|"<>]/g, '-') // Remove invalid filename chars
          zip.file(fileName, blob)
        } catch (error) {
          console.error(`Failed to download ${album.name}:`, error)
          // Continue with next album
        }
      }

      setProgress({ current: albums.length, total: albums.length, status: 'zipping' })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `album-covers-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setProgress({ current: albums.length, total: albums.length, status: 'complete' })

      // Reset after 2 seconds
      setTimeout(() => {
        setProgress({ current: 0, total: 0, status: 'idle' })
      }, 2000)
    } catch (error) {
      console.error('Bulk download failed:', error)
      setProgress({
        current: 0,
        total: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed',
      })
      setTimeout(() => {
        setProgress({ current: 0, total: 0, status: 'idle' })
      }, 3000)
    }
  }, [])

  const downloadCustomArtworks = useCallback(async (artworks: CustomArtwork[]) => {
    if (artworks.length === 0) return

    setProgress({ current: 0, total: artworks.length, status: 'downloading' })

    try {
      const zip = new JSZip()

      for (let i = 0; i < artworks.length; i++) {
        const artwork = artworks[i]
        setProgress({ current: i + 1, total: artworks.length, status: 'downloading' })

        try {
          // Convert base64 to blob
          const base64Data = artwork.imageData.split(',')[1]
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'image/png' })

          const fileName = `${artwork.artistName} - ${artwork.artworkName}.png`
            .replace(/[/\\?%*:|"<>]/g, '-')
          zip.file(fileName, blob)
        } catch (error) {
          console.error(`Failed to add ${artwork.artworkName}:`, error)
        }
      }

      setProgress({ current: artworks.length, total: artworks.length, status: 'zipping' })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `custom-artwork-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setProgress({ current: artworks.length, total: artworks.length, status: 'complete' })

      setTimeout(() => {
        setProgress({ current: 0, total: 0, status: 'idle' })
      }, 2000)
    } catch (error) {
      console.error('Bulk download failed:', error)
      setProgress({
        current: 0,
        total: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed',
      })
      setTimeout(() => {
        setProgress({ current: 0, total: 0, status: 'idle' })
      }, 3000)
    }
  }, [])

  const cancel = useCallback(() => {
    setProgress({ current: 0, total: 0, status: 'idle' })
  }, [])

  return {
    progress,
    downloadAlbums,
    downloadCustomArtworks,
    cancel,
    isDownloading: progress.status === 'downloading' || progress.status === 'zipping',
  }
}
