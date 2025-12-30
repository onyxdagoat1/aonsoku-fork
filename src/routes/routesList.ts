import { AlbumListType } from '@/types/responses/album'
import { AlbumsFilters, YearFilter } from '@/utils/albumsFilter'

const LIBRARY = {
  HOME: '/',
  ARTISTS: '/library/artists',
  SONGS: '/library/songs',
  ALBUMS: '/library/albums',
  PLAYLISTS: '/library/playlists',
  PODCASTS: '/library/podcasts',
  EPISODES: '/library/episodes',
  RADIOS: '/library/radios',
  ART: '/library/art',
  YOUTUBE: '/library/youtube',
}

const ARTIST = {
  PAGE: (artistId: string) => `${LIBRARY.ARTISTS}/${artistId}`,
  PATH: `${LIBRARY.ARTISTS}/:artistId`,
}

const ALBUM = {
  PAGE: (albumId: string) => `${LIBRARY.ALBUMS}/${albumId}`,
  PATH: `${LIBRARY.ALBUMS}/:albumId`,
}

const ALBUMS = {
  GENRE: (genre: string) =>
    `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.ByGenre}&genre=${encodeURIComponent(genre)}`,
  ARTIST: (id: string, name: string) =>
    `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.ByDiscography}&artistId=${id}&artistName=${encodeURIComponent(name)}`,
  RECENTLY_PLAYED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.RecentlyPlayed}`,
  MOST_PLAYED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.MostPlayed}`,
  RECENTLY_ADDED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.RecentlyAdded}`,
  RANDOM: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.Random}`,
  SEARCH: (query: string) =>
    `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.Search}&query=${encodeURIComponent(query)}`,
  YEAR: (yearFilter: YearFilter) =>
    `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.ByYear}&yearFilter=${yearFilter}`,
  GENERIC: (filter: AlbumListType) => `${LIBRARY.ALBUMS}?filter=${filter}`,
}

const SONGS = {
  SEARCH: (query: string) =>
    `${LIBRARY.SONGS}?filter=${AlbumsFilters.Search}&query=${encodeURIComponent(query)}`,
  ARTIST_TRACKS: (id: string, name: string) =>
    `${LIBRARY.SONGS}?artistId=${id}&artistName=${encodeURIComponent(name)}`,
}

const PLAYLIST = {
  PAGE: (playlistId: string) => `${LIBRARY.PLAYLISTS}/${playlistId}`,
  PATH: `${LIBRARY.PLAYLISTS}/:playlistId`,
}

const PODCASTS = {
  PAGE: (podcastId: string) => `${LIBRARY.PODCASTS}/${podcastId}`,
  PATH: `${LIBRARY.PODCASTS}/:podcastId`,
}

const EPISODES = {
  PAGE: (episodeId: string) => `${LIBRARY.EPISODES}/${episodeId}`,
  PATH: `${LIBRARY.EPISODES}/:episodeId`,
  LATEST: `${LIBRARY.EPISODES}/latest`,
}

const UPLOAD = '/upload'
const PROFILE = '/profile/:id?'
const ADMIN = '/admin'

const YEDITOR = {
  PAGE: (yeditorId: string) => `/yeditor/${yeditorId}`,
  PATH: '/yeditor/:id',
}

const COLLECTION = {
  PAGE: (id: string) => `/collection/${id}`,
  PATH: '/collection/:id',
}

const SERVER_CONFIG = '/login'
const REGISTER = '/register'

export const ROUTES = {
  LIBRARY,
  ARTIST,
  ALBUM,
  ALBUMS,
  SONGS,
  PLAYLIST,
  PODCASTS,
  EPISODES,
  UPLOAD,
  PROFILE,
  ADMIN,
  YEDITOR,
  COLLECTION,
  SERVER_CONFIG,
  REGISTER,
}
