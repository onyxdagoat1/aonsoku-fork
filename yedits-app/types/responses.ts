// Types for the Subsonic/Navidrome API responses

export interface ISong {
  id: string
  parent?: string
  isDir: boolean
  title: string
  album?: string
  albumId?: string
  artist?: string
  artistId?: string
  track?: number
  year?: number
  genre?: string
  coverArt?: string
  size?: number
  contentType?: string
  suffix?: string
  duration?: number
  bitRate?: number
  path?: string
  playCount?: number
  discNumber?: number
  created?: string
  starred?: string
  type?: string
  mediaType?: string
  bpm?: number
  comment?: string
  replayGain?: {
    trackGain?: number
    trackPeak?: number
    albumGain?: number
    albumPeak?: number
  }
}

export interface IAlbum {
  id: string
  name: string
  artist?: string
  artistId?: string
  coverArt?: string
  songCount?: number
  duration?: number
  playCount?: number
  created?: string
  starred?: string
  year?: number
  genre?: string
  songs?: ISong[]
}

export interface IArtist {
  id: string
  name: string
  coverArt?: string
  albumCount?: number
  starred?: string
  biography?: string
  musicBrainzId?: string
  sortName?: string
  lastFmUrl?: string
  smallImageUrl?: string
  mediumImageUrl?: string
  largeImageUrl?: string
  similarArtist?: IArtist[]
}

export interface IPlaylist {
  id: string
  name: string
  comment?: string
  owner?: string
  public?: boolean
  songCount?: number
  duration?: number
  created?: string
  changed?: string
  coverArt?: string
  songs?: ISong[]
}

export interface IRadio {
  id: string
  streamUrl: string
  name: string
  homePageUrl?: string
}

export interface IGenre {
  songCount: number
  albumCount: number
  value: string
}

export interface ISearchResult {
  artists?: IArtist[]
  albums?: IAlbum[]
  songs?: ISong[]
}

export interface IPodcast {
  id: string
  url: string
  title: string
  description?: string
  coverArt?: string
  originalImageUrl?: string
  status?: string
  episodes?: IPodcastEpisode[]
}

export interface IPodcastEpisode {
  id: string
  parent?: string
  isDir: boolean
  title: string
  description?: string
  publishDate?: string
  duration?: number
  size?: number
  coverArt?: string
  contentType?: string
  suffix?: string
  streamId?: string
  channelId?: string
  status?: string
}
