import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { AuthType } from '@/types/serverConfig'

const STORAGE_KEYS = {
  SERVER_URL: 'server_url',
  USERNAME: 'username',
  AUTH_TOKEN: 'auth_token',
  AUTH_TYPE: 'auth_type',
}

// Subsonic API client
class SubsonicClient {
  private instance: AxiosInstance | null = null
  private baseUrl: string = ''
  private username: string = ''
  private token: string = ''
  private authType: AuthType = AuthType.TOKEN
  private protocolVersion: string = '1.16.0'
  private clientName: string = 'yedits-app'

  async loadFromStorage() {
    try {
      this.baseUrl = (await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL)) || ''
      this.username = (await AsyncStorage.getItem(STORAGE_KEYS.USERNAME)) || ''
      this.token = (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) || ''
      this.authType =
        ((await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TYPE)) as AuthType) ||
        AuthType.TOKEN

      if (this.baseUrl && this.username && this.token) {
        this.createInstance()
      }
    } catch (e) {
      console.error('Failed to load subsonic config:', e)
    }
  }

  private createInstance() {
    this.instance = axios.create({
      baseURL: `${this.baseUrl}/rest`,
      timeout: 15000,
    })
  }

  async configure(
    url: string,
    username: string,
    token: string,
    authType: AuthType = AuthType.TOKEN,
  ) {
    this.baseUrl = url
    this.username = username
    this.token = token
    this.authType = authType

    // Persist to storage
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url)
    await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, username)
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TYPE, authType)

    this.createInstance()
  }

  async clearConfig() {
    this.baseUrl = ''
    this.username = ''
    this.token = ''
    this.instance = null

    await AsyncStorage.removeItem(STORAGE_KEYS.SERVER_URL)
    await AsyncStorage.removeItem(STORAGE_KEYS.USERNAME)
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TYPE)
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.username && this.token && this.instance)
  }

  private getAuthParams(): Record<string, string> {
    const params: Record<string, string> = {
      u: this.username,
      v: this.protocolVersion,
      c: this.clientName,
      f: 'json',
    }

    if (this.authType === AuthType.TOKEN) {
      // Token auth: t=token, s=salt (included in token)
      const [token, salt] = this.token.split(':')
      params.t = token || ''
      params.s = salt || ''
    } else {
      // Password auth (legacy): p=enc:hexEncodedPassword
      params.p = this.token
    }

    return params
  }

  async request<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    if (!this.instance) {
      throw new Error('Subsonic client not configured')
    }

    const config: AxiosRequestConfig = {
      params: {
        ...this.getAuthParams(),
        ...params,
      },
    }

    const response = await this.instance.get(endpoint, config)

    // Check for Subsonic API errors
    const subsonicResponse = response.data?.['subsonic-response']
    if (!subsonicResponse) {
      throw new Error('Invalid Subsonic response')
    }

    if (subsonicResponse.status !== 'ok') {
      const error = subsonicResponse.error
      throw new Error(error?.message || 'Subsonic API error')
    }

    return subsonicResponse
  }

  // Get stream URL for a song
  getStreamUrl(id: string, maxBitRate?: number, format?: string): string {
    const params = new URLSearchParams({
      ...this.getAuthParams(),
      id,
      ...(maxBitRate && { maxBitRate: maxBitRate.toString() }),
      ...(format && { format }),
    })

    return `${this.baseUrl}/rest/stream?${params.toString()}`
  }

  // Get cover art URL
  getCoverArtUrl(id: string, size?: number): string {
    if (!this.baseUrl || !id) return ''

    const params = new URLSearchParams({
      ...this.getAuthParams(),
      id,
      ...(size && { size: size.toString() }),
    })

    return `${this.baseUrl}/rest/getCoverArt?${params.toString()}`
  }

  // API Methods

  async ping(): Promise<boolean> {
    try {
      await this.request('ping')
      return true
    } catch {
      return false
    }
  }

  async getArtists() {
    const response = await this.request('getArtists')
    return response.artists?.index || []
  }

  async getArtist(id: string) {
    const response = await this.request('getArtist', { id })
    return response.artist
  }

  async getAlbumList2(
    type: string = 'recent',
    size: number = 20,
    offset: number = 0,
  ) {
    const response = await this.request('getAlbumList2', { type, size, offset })
    return response.albumList2?.album || []
  }

  async getAlbum(id: string) {
    const response = await this.request('getAlbum', { id })
    return response.album
  }

  async getSong(id: string) {
    const response = await this.request('getSong', { id })
    return response.song
  }

  async getPlaylists() {
    const response = await this.request('getPlaylists')
    return response.playlists?.playlist || []
  }

  async getPlaylist(id: string) {
    const response = await this.request('getPlaylist', { id })
    return response.playlist
  }

  async createPlaylist(name: string, songIds?: string[]) {
    const params: Record<string, any> = { name }
    if (songIds?.length) {
      params.songId = songIds
    }
    const response = await this.request('createPlaylist', params)
    return response.playlist
  }

  async updatePlaylist(
    id: string,
    name?: string,
    comment?: string,
    public_?: boolean,
    songIdsToAdd?: string[],
    songIndexesToRemove?: number[],
  ) {
    const params: Record<string, any> = { playlistId: id }
    if (name) params.name = name
    if (comment) params.comment = comment
    if (public_ !== undefined) params.public = public_
    if (songIdsToAdd?.length) params.songIdToAdd = songIdsToAdd
    if (songIndexesToRemove?.length)
      params.songIndexToRemove = songIndexesToRemove
    await this.request('updatePlaylist', params)
  }

  async deletePlaylist(id: string) {
    await this.request('deletePlaylist', { id })
  }

  async search3(
    query: string,
    artistCount = 5,
    albumCount = 5,
    songCount = 10,
  ) {
    const response = await this.request('search3', {
      query,
      artistCount,
      albumCount,
      songCount,
    })
    return response.searchResult3 || {}
  }

  async getGenres() {
    const response = await this.request('getGenres')
    return response.genres?.genre || []
  }

  async getRandomSongs(size = 10, genre?: string) {
    const params: Record<string, any> = { size }
    if (genre) params.genre = genre
    const response = await this.request('getRandomSongs', params)
    return response.randomSongs?.song || []
  }

  async getSongsByGenre(genre: string, count = 50, offset = 0) {
    const response = await this.request('getSongsByGenre', {
      genre,
      count,
      offset,
    })
    return response.songsByGenre?.song || []
  }

  async getStarred() {
    const response = await this.request('getStarred2')
    return response.starred2 || {}
  }

  async star(id: string, albumId?: string, artistId?: string) {
    const params: Record<string, any> = {}
    if (id) params.id = id
    if (albumId) params.albumId = albumId
    if (artistId) params.artistId = artistId
    await this.request('star', params)
  }

  async unstar(id: string, albumId?: string, artistId?: string) {
    const params: Record<string, any> = {}
    if (id) params.id = id
    if (albumId) params.albumId = albumId
    if (artistId) params.artistId = artistId
    await this.request('unstar', params)
  }

  async scrobble(id: string, submission = true) {
    await this.request('scrobble', { id, submission })
  }

  async getInternetRadioStations() {
    const response = await this.request('getInternetRadioStations')
    return response.internetRadioStations?.internetRadioStation || []
  }

  async getPodcasts() {
    const response = await this.request('getPodcasts', {
      includeEpisodes: true,
    })
    return response.podcasts?.channel || []
  }

  async getNewestPodcasts(count = 20) {
    const response = await this.request('getNewestPodcasts', { count })
    return response.newestPodcasts?.episode || []
  }

  async getLyrics(artist?: string, title?: string) {
    const params: Record<string, any> = {}
    if (artist) params.artist = artist
    if (title) params.title = title
    const response = await this.request('getLyrics', params)
    return response.lyrics
  }

  async getLyricsBySongId(id: string) {
    try {
      const response = await this.request('getLyricsBySongId', { id })
      return response.lyricsList?.structuredLyrics || []
    } catch {
      return []
    }
  }
}

// Singleton instance
export const subsonic = new SubsonicClient()
