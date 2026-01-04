import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import {
  IAlbum,
  IArtist,
  IGenre,
  IPlaylist,
  ISearchResult,
  ISong,
} from '@/types/responses'

// Query keys factory
export const queryKeys = {
  albums: {
    all: ['albums'] as const,
    list: (type: string, page: number) =>
      ['albums', 'list', type, page] as const,
    detail: (id: string) => ['albums', 'detail', id] as const,
  },
  artists: {
    all: ['artists'] as const,
    list: () => ['artists', 'list'] as const,
    detail: (id: string) => ['artists', 'detail', id] as const,
  },
  playlists: {
    all: ['playlists'] as const,
    list: () => ['playlists', 'list'] as const,
    detail: (id: string) => ['playlists', 'detail', id] as const,
  },
  songs: {
    starred: () => ['songs', 'starred'] as const,
    random: (count: number, genre?: string) =>
      ['songs', 'random', count, genre] as const,
    byGenre: (genre: string) => ['songs', 'byGenre', genre] as const,
  },
  genres: {
    all: ['genres'] as const,
  },
  search: {
    query: (query: string) => ['search', query] as const,
  },
  radios: {
    all: ['radios'] as const,
  },
  podcasts: {
    all: ['podcasts'] as const,
  },
}

// Albums hooks
export function useAlbumList(
  type: string = 'recent',
  page: number = 0,
  size: number = 20,
) {
  return useQuery({
    queryKey: queryKeys.albums.list(type, page),
    queryFn: () => subsonic.getAlbumList2(type, size, page * size),
  })
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: queryKeys.albums.detail(id),
    queryFn: () => subsonic.getAlbum(id),
    enabled: !!id,
  })
}

// Artists hooks
export function useArtists() {
  return useQuery({
    queryKey: queryKeys.artists.list(),
    queryFn: () => subsonic.getArtists(),
  })
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: queryKeys.artists.detail(id),
    queryFn: () => subsonic.getArtist(id),
    enabled: !!id,
  })
}

// Playlists hooks
export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists.list(),
    queryFn: () => subsonic.getPlaylists(),
  })
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: queryKeys.playlists.detail(id),
    queryFn: () => subsonic.getPlaylist(id),
    enabled: !!id,
  })
}

// Songs hooks
export function useStarredSongs() {
  return useQuery({
    queryKey: queryKeys.songs.starred(),
    queryFn: () => subsonic.getStarred(),
  })
}

export function useRandomSongs(count: number = 20, genre?: string) {
  return useQuery({
    queryKey: queryKeys.songs.random(count, genre),
    queryFn: () => subsonic.getRandomSongs(count, genre),
  })
}

// Genres hooks
export function useGenres() {
  return useQuery({
    queryKey: queryKeys.genres.all,
    queryFn: () => subsonic.getGenres(),
  })
}

// Search hook
export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => subsonic.search3(query, 10, 10, 20),
    enabled: query.length >= 2,
  })
}

// Radio hooks
export function useRadios() {
  return useQuery({
    queryKey: queryKeys.radios.all,
    queryFn: () => subsonic.getInternetRadioStations(),
  })
}

// Podcasts hooks
export function usePodcasts() {
  return useQuery({
    queryKey: queryKeys.podcasts.all,
    queryFn: () => subsonic.getPodcasts(),
  })
}

// Star/Unstar mutations
export function useStarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      return isStarred ? subsonic.unstar(id) : subsonic.star(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.starred() })
    },
  })
}

// Playlist mutations
export function useCreatePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, songIds }: { name: string; songIds?: string[] }) => {
      return subsonic.createPlaylist(name, songIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all })
    },
  })
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => subsonic.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all })
    },
  })
}
