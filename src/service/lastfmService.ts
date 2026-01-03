import axios from 'axios'
import MD5 from 'crypto-js/md5'
import { supabase } from '@/lib/supabase'

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const API_SECRET = import.meta.env.VITE_LASTFM_API_SECRET
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export const lastfmService = {
  // Get a token for authentication
  async getAuthToken() {
    const callbackUrl = `${window.location.origin}/profile?lastfm_callback=true`
    return window.location.href = `http://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${callbackUrl}`
  },

  // Create a session using the token
  async getSession(token: string) {
    const params: Record<string, string> = {
      api_key: API_KEY,
      method: 'auth.getSession',
      token: token,
    }

    const signature = this.generateSignature(params)
    
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          ...params,
          api_sig: signature,
          format: 'json',
        },
      })

      if (response.data.session) {
        return response.data.session
      }
      throw new Error('Failed to get session')
    } catch (error) {
      console.error('Last.fm session error:', error)
      throw error
    }
  },

  // Update "Now Playing" status
  async updateNowPlaying(artist: string, track: string, album?: string, duration?: number) {
    const sessionKey = await this.getSessionKey()
    if (!sessionKey) return

    const params: Record<string, string> = {
      method: 'track.updateNowPlaying',
      artist,
      track,
      api_key: API_KEY,
      sk: sessionKey,
    }

    if (album) params.album = album
    if (duration) params.duration = Math.floor(duration).toString()

    const signature = this.generateSignature(params)

    try {
      await axios.post(BASE_URL, null, {
        params: {
          ...params,
          api_sig: signature,
          format: 'json',
        },
      })
    } catch (error) {
      console.error('Last.fm now playing error:', error)
    }
  },

  // Scrobble a track
  async scrobble(artist: string, track: string, album?: string, timestamp?: number, duration?: number) {
    const sessionKey = await this.getSessionKey()
    if (!sessionKey) return

    const params: Record<string, string> = {
      method: 'track.scrobble',
      artist,
      track,
      timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
      api_key: API_KEY,
      sk: sessionKey,
    }

    if (album) params.album = album
    if (duration) params.duration = Math.floor(duration).toString()

    const signature = this.generateSignature(params)

    try {
      await axios.post(BASE_URL, null, {
        params: {
          ...params,
          api_sig: signature,
          format: 'json',
        },
      })
    } catch (error) {
      console.error('Last.fm scrobble error:', error)
    }
  },

  // Get user information from Last.fm
  async getUserInfo() {
    const sessionKey = await this.getSessionKey()
    if (!sessionKey) return null

    const params: Record<string, string> = {
      method: 'user.getInfo',
      api_key: API_KEY,
      sk: sessionKey,
    }

    const signature = this.generateSignature(params)

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          ...params,
          api_sig: signature,
          format: 'json',
        },
      })

      if (response.data.user) {
        return response.data.user
      }
      throw new Error('Failed to get user info')
    } catch (error) {
      console.error('Last.fm user info error:', error)
      throw error
    }
  },

  // Get user's recent tracks
  async getRecentTracks(limit = 10) {
    const sessionKey = await this.getSessionKey()
    if (!sessionKey) return null

    const params: Record<string, string> = {
      method: 'user.getRecentTracks',
      api_key: API_KEY,
      sk: sessionKey,
      limit: limit.toString(),
    }

    const signature = this.generateSignature(params)

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          ...params,
          api_sig: signature,
          format: 'json',
        },
      })

      if (response.data.recenttracks) {
        return response.data.recenttracks
      }
      throw new Error('Failed to get recent tracks')
    } catch (error) {
      console.error('Last.fm recent tracks error:', error)
      throw error
    }
  },

  // Helper to generate MD5 signature
  generateSignature(params: Record<string, string>) {
    const keys = Object.keys(params).sort()
    let stringToSign = ''
    
    keys.forEach(key => {
      if (key !== 'format' && key !== 'callback') {
        stringToSign += key + params[key]
      }
    })
    
    stringToSign += API_SECRET
    return MD5(stringToSign).toString()
  },

  // Get session key from Supabase profile
  async getSessionKey() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('lastfm_session_key, lastfm_enabled')
      .eq('id', user.id)
      .single()

    if (data && data.lastfm_enabled) {
      return data.lastfm_session_key
    }
    return null
  }
}
