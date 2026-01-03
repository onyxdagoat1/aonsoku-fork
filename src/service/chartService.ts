import { supabase } from '@/lib/supabase'

export interface ArtistChart {
  artistId: string
  artistName: string
  followerCount: number
  artistImage?: string
}

export interface AlbumChart {
  albumId: string
  albumName: string
  artistName: string
  coverArt?: string
  year?: number
  likeCount?: number
  averageRating?: number
  ratingCount?: number
  isCompilation?: boolean
  songCount?: number
}

export interface TrackChart {
  trackId: string
  trackName: string
  artistName: string
  albumName?: string
  albumId?: string
  coverArt?: string
  duration?: number
  playCount: number
}

export const chartService = {
  /**
   * Get top artists by follower count
   */
  async getTopArtists(limit = 10): Promise<ArtistChart[]> {
    const { data, error } = await supabase
      .from('artist_follows')
      .select('artist_id')
      .limit(1000)

    if (error) throw error

    // Count followers per artist
    const artistCounts = (data || []).reduce(
      (acc, { artist_id }) => {
        acc[artist_id] = (acc[artist_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Sort and take top N
    return Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([artistId, count]) => ({
        artistId,
        artistName: artistId, // Will be enriched by frontend
        followerCount: count,
      }))
  },

  /**
   * Get most liked albums
   */
  async getMostLikedAlbums(limit = 10): Promise<AlbumChart[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('content_id, content_type')
      .eq('content_type', 'album')
      .limit(1000)

    if (error) throw error

    // Count likes per album
    const albumCounts = (data || []).reduce(
      (acc, { content_id }) => {
        acc[content_id] = (acc[content_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(albumCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([albumId, count]) => ({
        albumId,
        albumName: albumId, // Will be enriched by frontend
        artistName: '',
        likeCount: count,
      }))
  },

  /**
   * Get highest rated albums
   */
  async getTopRatedAlbums(limit = 10): Promise<AlbumChart[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('content_id, rating')
      .eq('content_type', 'album')

    if (error) throw error

    // Calculate average ratings per album
    const albumRatings = (data || []).reduce(
      (acc, { content_id, rating }) => {
        if (!acc[content_id]) {
          acc[content_id] = { total: 0, count: 0 }
        }
        acc[content_id].total += rating
        acc[content_id].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>,
    )

    // Calculate averages and sort
    return Object.entries(albumRatings)
      .filter(([, stats]) => stats.count >= 3) // Minimum 3 ratings
      .map(([albumId, stats]) => ({
        albumId,
        albumName: albumId,
        artistName: '',
        averageRating: Math.round((stats.total / stats.count) * 10) / 10,
        ratingCount: stats.count,
      }))
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, limit)
  },

  /**
   * Get most streamed tracks
   */
  async getMostStreamedTracks(limit = 10): Promise<TrackChart[]> {
    const { data, error } = await supabase
      .from('play_counts')
      .select('content_id')
      .eq('content_type', 'track')
      .limit(5000)

    if (error) throw error

    // Count plays per track
    const trackCounts = (data || []).reduce(
      (acc, { content_id }) => {
        acc[content_id] = (acc[content_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(trackCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([trackId, count]) => ({
        trackId,
        trackName: trackId,
        artistName: '',
        playCount: count,
      }))
  },

  /**
   * Record a play count
   */
  async recordPlay(contentId: string, contentType: 'track' | 'album') {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('play_counts').insert({
      content_id: contentId,
      content_type: contentType,
      user_id: user.id,
    })
  },

  /**
   * Follow an artist
   */
  async followArtist(artistId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase.from('artist_follows').upsert({
      user_id: user.id,
      artist_id: artistId,
    })
  },

  /**
   * Unfollow an artist
   */
  async unfollowArtist(artistId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase
      .from('artist_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
  },
}
