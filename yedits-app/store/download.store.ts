import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subsonic } from '@/service/subsonic'
import { ISong } from '@/types/responses'

export interface DownloadedSong extends ISong {
  localPath: string
  downloadedAt: string
  fileSize: number
}

interface DownloadProgress {
  songId: string
  progress: number
  status: 'pending' | 'downloading' | 'complete' | 'error'
  error?: string
}

interface IDownloadStore {
  downloads: Record<string, DownloadedSong>
  activeDownloads: Record<string, DownloadProgress>
  totalSize: number

  // Actions
  init: () => Promise<void>
  downloadSong: (song: ISong) => Promise<void>
  downloadAlbum: (songs: ISong[]) => Promise<void>
  removeSong: (songId: string) => Promise<void>
  removeAlbum: (albumId: string) => Promise<void>
  clearAllDownloads: () => Promise<void>
  isDownloaded: (songId: string) => boolean
  getLocalPath: (songId: string) => string | null
  updateProgress: (songId: string, progress: DownloadProgress) => void
}

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`
const STORAGE_KEY = 'downloads_v1'

export const useDownloadStore = create<IDownloadStore>()(
  immer((set, get) => ({
    downloads: {},
    activeDownloads: {},
    totalSize: 0,

    init: async () => {
      try {
        // Ensure download directory exists
        const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR)
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, {
            intermediates: true,
          })
        }

        // Load saved downloads from storage
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored) {
          const downloads = JSON.parse(stored)

          // Verify files still exist
          const validDownloads: Record<string, DownloadedSong> = {}
          let totalSize = 0

          for (const [id, song] of Object.entries(downloads) as [
            string,
            DownloadedSong,
          ][]) {
            const fileInfo = await FileSystem.getInfoAsync(song.localPath)
            if (fileInfo.exists) {
              validDownloads[id] = song
              totalSize += song.fileSize
            }
          }

          set((state) => {
            state.downloads = validDownloads
            state.totalSize = totalSize
          })
        }
      } catch (error) {
        console.error('Failed to init downloads:', error)
      }
    },

    downloadSong: async (song: ISong) => {
      const { downloads, updateProgress } = get()

      // Skip if already downloaded
      if (downloads[song.id]) return

      const fileName = `${song.id}.${song.suffix || 'mp3'}`
      const localPath = `${DOWNLOAD_DIR}${fileName}`

      updateProgress(song.id, {
        songId: song.id,
        progress: 0,
        status: 'downloading',
      })

      try {
        const streamUrl = subsonic.getStreamUrl(song.id)

        const downloadResumable = FileSystem.createDownloadResumable(
          streamUrl,
          localPath,
          {},
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite
            updateProgress(song.id, {
              songId: song.id,
              progress,
              status: 'downloading',
            })
          },
        )

        const result = await downloadResumable.downloadAsync()

        if (result && result.uri) {
          const fileInfo = await FileSystem.getInfoAsync(result.uri)
          const fileSize = (fileInfo as any).size || 0

          const downloadedSong: DownloadedSong = {
            ...song,
            localPath: result.uri,
            downloadedAt: new Date().toISOString(),
            fileSize,
          }

          set((state) => {
            state.downloads[song.id] = downloadedSong
            state.totalSize += fileSize
            delete state.activeDownloads[song.id]
          })

          // Persist to storage
          const { downloads: currentDownloads } = get()
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(currentDownloads),
          )

          updateProgress(song.id, {
            songId: song.id,
            progress: 1,
            status: 'complete',
          })
        }
      } catch (error: any) {
        updateProgress(song.id, {
          songId: song.id,
          progress: 0,
          status: 'error',
          error: error.message,
        })
        console.error('Download failed:', error)
      }
    },

    downloadAlbum: async (songs: ISong[]) => {
      for (const song of songs) {
        await get().downloadSong(song)
      }
    },

    removeSong: async (songId: string) => {
      const { downloads } = get()
      const song = downloads[songId]

      if (song) {
        try {
          await FileSystem.deleteAsync(song.localPath, { idempotent: true })
        } catch (error) {
          console.error('Failed to delete file:', error)
        }

        set((state) => {
          state.totalSize -= song.fileSize
          delete state.downloads[songId]
        })

        const { downloads: currentDownloads } = get()
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(currentDownloads),
        )
      }
    },

    removeAlbum: async (albumId: string) => {
      const { downloads, removeSong } = get()

      const songsToRemove = Object.values(downloads).filter(
        (song) => song.albumId === albumId,
      )

      for (const song of songsToRemove) {
        await removeSong(song.id)
      }
    },

    clearAllDownloads: async () => {
      try {
        await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true })
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, {
          intermediates: true,
        })
      } catch (error) {
        console.error('Failed to clear downloads:', error)
      }

      set((state) => {
        state.downloads = {}
        state.activeDownloads = {}
        state.totalSize = 0
      })

      await AsyncStorage.removeItem(STORAGE_KEY)
    },

    isDownloaded: (songId: string) => {
      return !!get().downloads[songId]
    },

    getLocalPath: (songId: string) => {
      return get().downloads[songId]?.localPath || null
    },

    updateProgress: (songId: string, progress: DownloadProgress) => {
      set((state) => {
        if (progress.status === 'complete') {
          delete state.activeDownloads[songId]
        } else {
          state.activeDownloads[songId] = progress
        }
      })
    },
  })),
)

// Selectors
export const useDownloads = () =>
  useDownloadStore((state) => Object.values(state.downloads))
export const useActiveDownloads = () =>
  useDownloadStore((state) => Object.values(state.activeDownloads))
export const useTotalDownloadSize = () =>
  useDownloadStore((state) => state.totalSize)
export const useIsDownloaded = (songId: string) =>
  useDownloadStore((state) => state.isDownloaded(songId))
