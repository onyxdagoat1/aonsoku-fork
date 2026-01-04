import { IPodcastEpisode, IRadio, ISong } from './responses'

export enum LoopState {
  Off = 0,
  All = 1,
  One = 2,
}

export type MediaType = 'song' | 'radio' | 'podcast'

export interface ISongList {
  shuffledList: ISong[]
  originalList: ISong[]
  originalSongIndex: number
  currentSong: ISong
  currentList: ISong[]
  currentSongIndex: number
  radioList: IRadio[]
  podcastList: IPodcastEpisode[]
  podcastListProgresses: number[]
}

export interface IPlayerState {
  isPlaying: boolean
  loopState: LoopState
  isShuffleActive: boolean
  isSongStarred: boolean
  isScrobbled: boolean
  volume: number
  currentDuration: number
  mediaType: MediaType
  mainDrawerState: boolean
  queueState: boolean
  lyricsState: boolean
  currentPlaybackRate: number
  hasPrev: boolean
  hasNext: boolean
}

export interface IPlayerProgress {
  progress: number
}

export interface IPlayerColors {
  currentSongColor: string | null
  currentSongColorIntensity: number
}
