import { supabase } from '@/lib/supabase'

export interface Highlight {
  id: string
  type: HighlightType
  content_id: string
  content_type: ContentType
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  start_date: string | null
  end_date: string | null
  countdown_date: string | null
  external_url: string | null
  display_order: number
  is_active: boolean
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  seconds_until_release?: number | null
}

export type HighlightType =
  | 'eotw'
  | 'definitive'
  | 'featured'
  | 'upcoming'
  | 'collection'
  | 'playlist'
export type ContentType =
  | 'song'
  | 'album'
  | 'single'
  | 'compilation'
  | 'artwork'
  | 'playlist'

export interface CreateHighlightData {
  type: HighlightType
  content_id: string
  content_type: ContentType
  title: string
  subtitle?: string
  description?: string
  image_url?: string
  start_date?: string
  end_date?: string
  countdown_date?: string
  external_url?: string
  display_order?: number
  is_active?: boolean
  metadata?: Record<string, unknown>
}

export interface UpdateHighlightData extends Partial<CreateHighlightData> {}

class HighlightsService {
  /**
   * Get all active highlights
   */
  async getActiveHighlights(type?: HighlightType): Promise<Highlight[]> {
    let query = supabase
      .from('active_highlights')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching active highlights:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all highlights (for admin)
   */
  async getAllHighlights(type?: HighlightType): Promise<Highlight[]> {
    let query = supabase
      .from('highlights')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching all highlights:', error)
      return []
    }

    return data || []
  }

  /**
   * Get a single highlight by ID
   */
  async getHighlight(id: string): Promise<Highlight | null> {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching highlight:', error)
      return null
    }

    return data
  }

  /**
   * Create a new highlight (admin only)
   */
  async createHighlight(data: CreateHighlightData): Promise<Highlight | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: highlight, error } = await supabase
      .from('highlights')
      .insert({
        ...data,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating highlight:', error)
      return null
    }

    return highlight
  }

  /**
   * Update a highlight (admin only)
   */
  async updateHighlight(
    id: string,
    updates: UpdateHighlightData,
  ): Promise<Highlight | null> {
    const { data, error } = await supabase
      .from('highlights')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating highlight:', error)
      return null
    }

    return data
  }

  /**
   * Delete a highlight (admin only)
   */
  async deleteHighlight(id: string): Promise<boolean> {
    const { error } = await supabase.from('highlights').delete().eq('id', id)

    if (error) {
      console.error('Error deleting highlight:', error)
      return false
    }

    return true
  }

  /**
   * Toggle highlight active status
   */
  async toggleHighlightActive(id: string): Promise<boolean> {
    const highlight = await this.getHighlight(id)
    if (!highlight) return false

    const { error } = await supabase
      .from('highlights')
      .update({ is_active: !highlight.is_active })
      .eq('id', id)

    if (error) {
      console.error('Error toggling highlight active:', error)
      return false
    }

    return true
  }

  /**
   * Reorder highlights
   */
  async reorderHighlights(orderedIds: string[]): Promise<boolean> {
    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('highlights')
        .update({ display_order: update.display_order })
        .eq('id', update.id)

      if (error) {
        console.error('Error reordering highlights:', error)
        return false
      }
    }

    return true
  }

  /**
   * Get Edit of the Week
   */
  async getEditOfTheWeek(): Promise<Highlight | null> {
    const highlights = await this.getActiveHighlights('eotw')
    return highlights[0] || null
  }

  /**
   * Get definitive edits
   */
  async getDefinitiveEdits(limit = 10): Promise<Highlight[]> {
    const highlights = await this.getActiveHighlights('definitive')
    return highlights.slice(0, limit)
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(limit = 10): Promise<Highlight[]> {
    const highlights = await this.getActiveHighlights('featured')
    return highlights.slice(0, limit)
  }

  /**
   * Get upcoming releases
   */
  async getUpcomingReleases(limit = 10): Promise<Highlight[]> {
    const highlights = await this.getActiveHighlights('upcoming')
    // Filter to only those with future countdown dates
    return highlights
      .filter(
        (h) => h.countdown_date && new Date(h.countdown_date) > new Date(),
      )
      .slice(0, limit)
  }

  /**
   * Get curated playlists
   */
  async getCuratedPlaylists(limit = 10): Promise<Highlight[]> {
    const highlights = await this.getActiveHighlights('playlist')
    return highlights.slice(0, limit)
  }

  /**
   * Get curated collections
   */
  async getCuratedCollections(limit = 10): Promise<Highlight[]> {
    const highlights = await this.getActiveHighlights('collection')
    return highlights.slice(0, limit)
  }

  /**
   * Check if content is highlighted
   */
  async isHighlighted(
    contentId: string,
    contentType: ContentType,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('highlights')
      .select('id')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error checking if highlighted:', error)
      return false
    }

    return !!data
  }

  /**
   * Get highlights for specific content
   */
  async getHighlightsForContent(
    contentId: string,
    contentType: ContentType,
  ): Promise<Highlight[]> {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching highlights for content:', error)
      return []
    }

    return data || []
  }
}

export const highlightsService = new HighlightsService()
