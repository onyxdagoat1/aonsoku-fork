import { Audio, AVPlaybackStatus } from 'expo-av'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subsonic } from '@/service/subsonic'
import { LoopState, MediaType } from '@/types/playerContext'
import { IPodcastEpisode, IRadio, ISong } from '@/types/responses'

interface IPlayerState {
  // Current playback
  currentSong: ISong | null
  currentIndex: number
  queue: ISong[]
  originalQueue: ISong[]

  // Playback state
  isPlaying: boolean
  loopState: LoopState
  isShuffleActive: boolean
  progress: number
  duration: number
  volume: number
  mediaType: MediaType

  // Radio/Podcast
  radioList: IRadio[]
  podcastList: IPodcastEpisode[]

  // UI state
  isPlayerVisible: boolean
  isFullPlayerOpen: boolean
  isQueueOpen: boolean
  isLyricsOpen: boolean

  // Colors
  currentSongColor: string | null

  // Audio instance
  sound: Audio.Sound | null

  // Actions
  initPlayer: () => Promise<void>
  playSong: (song: ISong) => Promise<void>
  playSongList: (
    songs: ISong[],
    index: number,
    shuffle?: boolean,
  ) => Promise<void>
  playRadio: (radio: IRadio) => Promise<void>
  pause: () => Promise<void>
  play: () => Promise<void>
  togglePlayPause: () => Promise<void>
  skipToNext: () => Promise<void>
  skipToPrevious: () => Promise<void>
  seekTo: (position: number) => Promise<void>
  setVolume: (volume: number) => void
  toggleLoop: () => void
  toggleShuffle: () => void
  addToQueue: (songs: ISong[], next?: boolean) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => Promise<void>
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentSong: (song: ISong | null, index: number) => void
  setQueue: (queue: ISong[]) => void
  setCurrentSongColor: (color: string | null) => void
  setFullPlayerOpen: (open: boolean) => void
  setQueueOpen: (open: boolean) => void
  setLyricsOpen: (open: boolean) => void
}

// Shuffle array (Fisher-Yates)
const shuffleArray = <T>(array: T[], startIndex: number = 0): T[] => {
  const currentItem = array[startIndex]
  const rest = [...array.slice(0, startIndex), ...array.slice(startIndex + 1)]

  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }

  return [currentItem, ...rest]
}

export const usePlayerStore = create<IPlayerState>()(
  immer((set, get) => ({
    // State
    currentSong: null,
    currentIndex: 0,
    queue: [],
    originalQueue: [],
    isPlaying: false,
    loopState: LoopState.Off,
    isShuffleActive: false,
    progress: 0,
    duration: 0,
    volume: 1,
    mediaType: 'song',
    radioList: [],
    podcastList: [],
    isPlayerVisible: false,
    isFullPlayerOpen: false,
    isQueueOpen: false,
    isLyricsOpen: false,
    currentSongColor: null,
    sound: null,

    // Initialize audio
    initPlayer: async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        })
      } catch (error) {
        console.error('Failed to initialize audio:', error)
      }
    },

    // Play a single song
    playSong: async (song: ISong) => {
      try {
        const { sound: currentSound } = get()
        if (currentSound) {
          await currentSound.unloadAsync()
        }

        const streamUrl = subsonic.getStreamUrl(song.id)
        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              set((state) => {
                state.progress = status.positionMillis / 1000
                state.duration = (status.durationMillis || 0) / 1000
                state.isPlaying = status.isPlaying
              })

              // Auto-play next when finished
              if (status.didJustFinish) {
                const { loopState, currentIndex, queue } = get()
                if (loopState === LoopState.One) {
                  sound.replayAsync()
                } else if (currentIndex < queue.length - 1) {
                  get().skipToNext()
                } else if (loopState === LoopState.All && queue.length > 0) {
                  get().playSongList(queue, 0)
                }
              }
            }
          },
        )

        set((state) => {
          state.sound = sound
          state.currentSong = song
          state.currentIndex = 0
          state.queue = [song]
          state.originalQueue = [song]
          state.isPlaying = true
          state.isPlayerVisible = true
          state.mediaType = 'song'
          state.progress = 0
        })
      } catch (error) {
        console.error('Failed to play song:', error)
      }
    },

    // Play a list of songs
    playSongList: async (songs: ISong[], index: number, shuffle = false) => {
      try {
        const { sound: currentSound } = get()
        if (currentSound) {
          await currentSound.unloadAsync()
        }

        const originalSongs = [...songs]
        let playQueue = songs
        let playIndex = index

        if (shuffle) {
          playQueue = shuffleArray(songs, index)
          playIndex = 0
        }

        const songToPlay = playQueue[playIndex]
        const streamUrl = subsonic.getStreamUrl(songToPlay.id)

        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              set((state) => {
                state.progress = status.positionMillis / 1000
                state.duration = (status.durationMillis || 0) / 1000
                state.isPlaying = status.isPlaying
              })

              if (status.didJustFinish) {
                const { loopState, currentIndex, queue } = get()
                if (loopState === LoopState.One) {
                  sound.replayAsync()
                } else if (currentIndex < queue.length - 1) {
                  get().skipToNext()
                } else if (loopState === LoopState.All && queue.length > 0) {
                  get().playSongList(queue, 0)
                }
              }
            }
          },
        )

        set((state) => {
          state.sound = sound
          state.queue = playQueue
          state.originalQueue = originalSongs
          state.currentIndex = playIndex
          state.currentSong = songToPlay
          state.isPlaying = true
          state.isPlayerVisible = true
          state.isShuffleActive = shuffle
          state.mediaType = 'song'
          state.progress = 0
        })
      } catch (error) {
        console.error('Failed to play song list:', error)
      }
    },

    // Play radio
    playRadio: async (radio: IRadio) => {
      try {
        const { sound: currentSound } = get()
        if (currentSound) {
          await currentSound.unloadAsync()
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: radio.streamUrl },
          { shouldPlay: true },
        )

        set((state) => {
          state.sound = sound
          state.currentSong = null
          state.queue = []
          state.radioList = [radio]
          state.isPlaying = true
          state.isPlayerVisible = true
          state.mediaType = 'radio'
        })
      } catch (error) {
        console.error('Failed to play radio:', error)
      }
    },

    // Control methods
    pause: async () => {
      const { sound } = get()
      if (sound) {
        await sound.pauseAsync()
      }
      set((state) => {
        state.isPlaying = false
      })
    },

    play: async () => {
      const { sound } = get()
      if (sound) {
        await sound.playAsync()
      }
      set((state) => {
        state.isPlaying = true
      })
    },

    togglePlayPause: async () => {
      const { sound, isPlaying } = get()
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync()
          set((state) => {
            state.isPlaying = false
          })
        } else {
          await sound.playAsync()
          set((state) => {
            state.isPlaying = true
          })
        }
      }
    },

    skipToNext: async () => {
      const { queue, currentIndex, loopState, sound: currentSound } = get()
      const nextIndex = currentIndex + 1

      if (currentSound) {
        await currentSound.unloadAsync()
      }

      if (nextIndex < queue.length) {
        const nextSong = queue[nextIndex]
        const streamUrl = subsonic.getStreamUrl(nextSong.id)

        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              set((state) => {
                state.progress = status.positionMillis / 1000
                state.duration = (status.durationMillis || 0) / 1000
                state.isPlaying = status.isPlaying
              })

              if (status.didJustFinish) {
                get().skipToNext()
              }
            }
          },
        )

        set((state) => {
          state.sound = sound
          state.currentIndex = nextIndex
          state.currentSong = nextSong
          state.progress = 0
          state.isPlaying = true
        })
      } else if (loopState === LoopState.All && queue.length > 0) {
        get().playSongList(queue, 0)
      }
    },

    skipToPrevious: async () => {
      const { queue, currentIndex, progress, sound: currentSound } = get()

      // If more than 3 seconds in, restart current song
      if (progress > 3 && currentSound) {
        await currentSound.setPositionAsync(0)
        set((state) => {
          state.progress = 0
        })
        return
      }

      if (currentIndex > 0 && currentSound) {
        await currentSound.unloadAsync()

        const prevSong = queue[currentIndex - 1]
        const streamUrl = subsonic.getStreamUrl(prevSong.id)

        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              set((state) => {
                state.progress = status.positionMillis / 1000
                state.duration = (status.durationMillis || 0) / 1000
                state.isPlaying = status.isPlaying
              })
            }
          },
        )

        set((state) => {
          state.sound = sound
          state.currentIndex = currentIndex - 1
          state.currentSong = prevSong
          state.progress = 0
          state.isPlaying = true
        })
      }
    },

    seekTo: async (position: number) => {
      const { sound } = get()
      if (sound) {
        await sound.setPositionAsync(position * 1000)
      }
      set((state) => {
        state.progress = position
      })
    },

    setVolume: (volume: number) => {
      const { sound } = get()
      if (sound) {
        sound.setVolumeAsync(volume)
      }
      set((state) => {
        state.volume = volume
      })
    },

    toggleLoop: () => {
      const { loopState } = get()
      const nextState = (loopState + 1) % 3
      set((state) => {
        state.loopState = nextState
      })
    },

    toggleShuffle: () => {
      const { isShuffleActive, queue, originalQueue, currentSong } = get()

      if (isShuffleActive) {
        // Restore original order
        const currentId = currentSong?.id
        const newIndex = originalQueue.findIndex((s) => s.id === currentId)

        set((state) => {
          state.queue = originalQueue
          state.currentIndex = newIndex >= 0 ? newIndex : 0
          state.isShuffleActive = false
        })
      } else {
        // Shuffle queue
        const currentId = currentSong?.id
        const currentIdx = queue.findIndex((s) => s.id === currentId)
        const shuffled = shuffleArray(queue, currentIdx)

        set((state) => {
          state.queue = shuffled
          state.currentIndex = 0
          state.isShuffleActive = true
        })
      }
    },

    addToQueue: (songs: ISong[], next = false) => {
      const { currentIndex } = get()

      if (next) {
        const insertIndex = currentIndex + 1
        set((state) => {
          state.queue.splice(insertIndex, 0, ...songs)
        })
      } else {
        set((state) => {
          state.queue.push(...songs)
        })
      }
    },

    removeFromQueue: (index: number) => {
      const { currentIndex } = get()
      set((state) => {
        state.queue.splice(index, 1)
        if (index < currentIndex) {
          state.currentIndex = currentIndex - 1
        }
      })
    },

    clearQueue: async () => {
      const { sound } = get()
      if (sound) {
        await sound.unloadAsync()
      }
      set((state) => {
        state.sound = null
        state.queue = []
        state.originalQueue = []
        state.currentSong = null
        state.currentIndex = 0
        state.isPlaying = false
        state.isPlayerVisible = false
        state.progress = 0
      })
    },

    // State setters
    setProgress: (progress: number) =>
      set((state) => {
        state.progress = progress
      }),
    setDuration: (duration: number) =>
      set((state) => {
        state.duration = duration
      }),
    setIsPlaying: (playing: boolean) =>
      set((state) => {
        state.isPlaying = playing
      }),
    setCurrentSong: (song: ISong | null, index: number) =>
      set((state) => {
        state.currentSong = song
        state.currentIndex = index
      }),
    setQueue: (queue: ISong[]) =>
      set((state) => {
        state.queue = queue
      }),
    setCurrentSongColor: (color: string | null) =>
      set((state) => {
        state.currentSongColor = color
      }),
    setFullPlayerOpen: (open: boolean) =>
      set((state) => {
        state.isFullPlayerOpen = open
      }),
    setQueueOpen: (open: boolean) =>
      set((state) => {
        state.isQueueOpen = open
      }),
    setLyricsOpen: (open: boolean) =>
      set((state) => {
        state.isLyricsOpen = open
      }),
  })),
)

// Selectors
export const useCurrentSong = () => usePlayerStore((state) => state.currentSong)
export const useIsPlaying = () => usePlayerStore((state) => state.isPlaying)
export const useQueue = () => usePlayerStore((state) => state.queue)
export const useProgress = () =>
  usePlayerStore((state) => ({
    progress: state.progress,
    duration: state.duration,
  }))
export const usePlayerActions = () =>
  usePlayerStore((state) => ({
    playSong: state.playSong,
    playSongList: state.playSongList,
    togglePlayPause: state.togglePlayPause,
    skipToNext: state.skipToNext,
    skipToPrevious: state.skipToPrevious,
    seekTo: state.seekTo,
    toggleLoop: state.toggleLoop,
    toggleShuffle: state.toggleShuffle,
  }))
