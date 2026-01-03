import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type SocialPlaylist = Database['public']['Tables']['playlists']['Row']

export const socialPlaylistsService = {
  /**
   * Get all public playlists
   */
  async getPublicPlaylists() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_public', true)
      .order('followed_count', { ascending: false })
      .limit(50)

    if (error) throw error
    return data as SocialPlaylist[]
  },

  /**
   * Get playlists followed by current user
   */
  async getFollowedPlaylists(userId: string) {
    const { data, error } = await supabase.rpc('get_followed_playlists', {
      p_user_id: userId,
    })

    if (error) throw error
    return data as SocialPlaylist[]
  },

  /**
   * Follow a playlist
   */
  async followPlaylist(playlistId: string) {
    const { error } = await supabase.rpc('follow_playlist', {
      p_playlist_id: playlistId,
    })
    if (error) throw error
  },

  /**
   * Unfollow a playlist
   */
  async unfollowPlaylist(playlistId: string) {
    const { error } = await supabase.rpc('unfollow_playlist', {
      p_playlist_id: playlistId,
    })
    if (error) throw error
  },

  /**
   * Check if user follows a playlist
   */
  async isFollowing(playlistId: string) {
    const { data, error } = await supabase
      .from('playlist_follows')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is no rows
    return !!data
  },

  /**
   * Sync playlist from Navidrome to Supabase
   */
  async syncPlaylist(playlist: {
    id: string
    name: string
    description?: string
    is_public: boolean
    song_count?: number
    cover_art_url?: string
  }) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { error } = await supabase.from('playlists').upsert({
      id: playlist.id,
      user_id: user.id,
      name: playlist.name,
      description: playlist.description,
      is_public: playlist.is_public,
      song_count: playlist.song_count || 0,
      cover_art_url: playlist.cover_art_url,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },
}
