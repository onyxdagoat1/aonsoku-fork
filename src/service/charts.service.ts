import { supabase } from '@/lib/supabase'

export interface ChartEntry {
  rank: number
  score: number
  content_id: string
  content_type: 'track' | 'album' | 'artist'
  snapshot_date: string
}

export interface StreamChartEntry {
  track_id: string
  stream_count: number
}

export const chartsService = {
  /**
   * Get top streamed tracks (Real-time aggregation)
   */
  async getTopStreamedTracks(period: 'today' | 'week' | 'month' | 'all_time' = 'week', limit = 50) {
    const { data, error } = await supabase.rpc('get_top_streamed_tracks', {
      limit_count: limit,
      period
    })
    
    if (error) throw error
    return data as StreamChartEntry[]
  },

  /**
   * Get historical charts from snapshots
   */
  async getChart(
    chartType: 'streams' | 'follows' | 'likes',
    contentType: 'track' | 'album' | 'artist',
    limit = 50,
    date?: string // YYYY-MM-DD
  ) {
    const { data, error } = await supabase.rpc('get_chart', {
      p_chart_type: chartType,
      p_content_type: contentType,
      p_limit: limit,
      p_date: date // Defaults to current date in RPC if null
    })

    if (error) throw error
    return data as ChartEntry[]
  },

  /**
   * Record a stream (to be called by player)
   */
  async recordStream(trackId: string, duration: number, albumId?: string | null, artistId?: string | null) {
    const { error } = await supabase.rpc('record_stream', {
      p_track_id: trackId,
      p_duration: duration,
      p_album_id: albumId,
      p_artist_id: artistId
    })

    if (error) console.error('Failed to record stream:', error)
  }
}
