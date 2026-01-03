import { create } from 'zustand'
import { YouTubeVideo } from '@/types/youtube'

interface YouTubePlayerState {
  activeVideo: YouTubeVideo | null
  isMinimized: boolean
  isPlaying: boolean

  // Actions
  playVideo: (video: YouTubeVideo) => void
  closeVideo: () => void
  minimize: () => void
  maximize: () => void
  setPlaying: (playing: boolean) => void
}

export const useYouTubePlayerStore = create<YouTubePlayerState>((set) => ({
  activeVideo: null,
  isMinimized: false,
  isPlaying: false,

  playVideo: (video) =>
    set({ activeVideo: video, isMinimized: false, isPlaying: true }),
  closeVideo: () => set({ activeVideo: null, isPlaying: false }),
  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  setPlaying: (playing) => set({ isPlaying: playing }),
}))
