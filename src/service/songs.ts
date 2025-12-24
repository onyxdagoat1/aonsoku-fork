import { httpClient } from '@/api/httpClient'
import {
  GetSongResponse,
  RandomSongsResponse,
  TopSongsResponse,
} from '@/types/responses/song'
import { search } from './search'

interface GetRandomSongsParams {
  size?: number
  genre?: string
  fromYear?: number
  toYear?: number
}

interface UpdateSongMetadataParams {
  id: string
  title?: string
  artist?: string
  album?: string
  albumArtist?: string
  year?: number
  track?: number
  discNumber?: number
  genre?: string
  bpm?: number
  comment?: string
}

async function getRandomSongs({
  size,
  genre,
  fromYear,
  toYear,
}: GetRandomSongsParams) {
  const response = await httpClient<RandomSongsResponse>('/getRandomSongs', {
    method: 'GET',
    query: {
      size: size?.toString(),
      genre,
      fromYear: fromYear?.toString(),
      toYear: toYear?.toString(),
    },
  })

  return response?.data.randomSongs.song
}

async function getTopSongs(artistName: string) {
  const response = await httpClient<TopSongsResponse>('/getTopSongs', {
    method: 'GET',
    query: {
      artist: artistName,
    },
  })

  return response?.data.topSongs.song
}

async function getAllSongs(songCount: number) {
  const response = await search.get({
    query: '',
    albumCount: 0,
    artistCount: 0,
    songCount,
    songOffset: 0,
  })

  return response?.song ?? []
}

async function getSong(id: string) {
  const response = await httpClient<GetSongResponse>('/getSong', {
    method: 'GET',
    query: {
      id,
    },
  })

  return response?.data.song
}

// Update song metadata using Subsonic's updateSong endpoint
async function updateSong(params: UpdateSongMetadataParams) {
  const query: Record<string, string> = {
    id: params.id,
  }

  if (params.title) query.title = params.title
  if (params.artist) query.artist = params.artist
  if (params.album) query.album = params.album
  if (params.albumArtist) query.albumArtist = params.albumArtist
  if (params.year) query.year = params.year.toString()
  if (params.track) query.track = params.track.toString()
  if (params.discNumber) query.discNumber = params.discNumber.toString()
  if (params.genre) query.genre = params.genre
  if (params.bpm) query.bpm = params.bpm.toString()
  if (params.comment !== undefined) query.comment = params.comment

  const response = await httpClient('/updateSong', {
    method: 'GET',
    query,
  })

  return response
}

export const songs = {
  getAllSongs,
  getRandomSongs,
  getTopSongs,
  getSong,
  updateSong,
}
