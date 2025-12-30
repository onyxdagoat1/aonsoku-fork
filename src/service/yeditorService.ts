import { supabase } from '@/lib/supabase'

export interface Yeditor {
  id: string
  name: string
  user_id: string | null
  bio: string | null
  avatar_url: string | null
  social_links: Record<string, string>
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface YeditorStats {
  total_works: number
  followers: number
  songs: number
  albums: number
  singles: number
}

export interface ContentYeditor {
  id: string
  content_id: string
  content_type: 'song' | 'album' | 'single' | 'compilation'
  yeditor_id: string
  created_at: string
}

export type ContentType = 'song' | 'album' | 'single' | 'compilation'

class YeditorService {
  /**
   * Get a yeditor by ID
   */
  async getYeditor(id: string): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('yeditors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching yeditor:', error)
      return null
    }

    return data
  }

  /**
   * Get a yeditor by name
   */
  async getYeditorByName(name: string): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('yeditors')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      console.error('Error fetching yeditor by name:', error)
      return null
    }

    return data
  }

  /**
   * Get yeditor for specific content
   */
  async getYeditorForContent(
    contentId: string,
    contentType: ContentType,
  ): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('content_yeditors')
      .select('yeditor_id, yeditors(*)')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching yeditor for content:', error)
      }
      return null
    }

    return data?.yeditors as unknown as Yeditor
  }

  /**
   * Get yeditors for multiple content items
   */
  async getYeditorsForContent(
    contentIds: string[],
    contentType: ContentType,
  ): Promise<Record<string, Yeditor>> {
    if (contentIds.length === 0) return {}

    const { data, error } = await supabase
      .from('content_yeditors')
      .select('content_id, yeditors(*)')
      .in('content_id', contentIds)
      .eq('content_type', contentType)

    if (error) {
      console.error('Error fetching yeditors for content:', error)
      return {}
    }

    const result: Record<string, Yeditor> = {}
    data?.forEach((item) => {
      if (item.yeditors) {
        result[item.content_id] = item.yeditors as unknown as Yeditor
      }
    })

    return result
  }

  /**
   * Set yeditor for content
   */
  async setYeditorForContent(
    contentId: string,
    contentType: ContentType,
    yeditorId: string,
  ): Promise<boolean> {
    const { error } = await supabase.from('content_yeditors').upsert(
      {
        content_id: contentId,
        content_type: contentType,
        yeditor_id: yeditorId,
      },
      { onConflict: 'content_id,content_type' },
    )

    if (error) {
      console.error('Error setting yeditor for content:', error)
      return false
    }

    return true
  }

  /**
   * Remove yeditor from content
   */
  async removeYeditorFromContent(
    contentId: string,
    contentType: ContentType,
  ): Promise<boolean> {
    const { error } = await supabase
      .from('content_yeditors')
      .delete()
      .eq('content_id', contentId)
      .eq('content_type', contentType)

    if (error) {
      console.error('Error removing yeditor from content:', error)
      return false
    }

    return true
  }

  /**
   * Get all work by a yeditor
   */
  async getYeditorWork(yeditorId: string): Promise<ContentYeditor[]> {
    const { data, error } = await supabase
      .from('content_yeditors')
      .select('*')
      .eq('yeditor_id', yeditorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching yeditor work:', error)
      return []
    }

    return data || []
  }

  /**
   * Get yeditor stats
   */
  async getYeditorStats(yeditorId: string): Promise<YeditorStats | null> {
    const { data, error } = await supabase.rpc('get_yeditor_stats', {
      yeditor_uuid: yeditorId,
    })

    if (error) {
      console.error('Error fetching yeditor stats:', error)
      return null
    }

    return data
  }

  /**
   * Create a new yeditor
   */
  async createYeditor(
    name: string,
    bio?: string,
    avatarUrl?: string,
  ): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('yeditors')
      .insert({
        name,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating yeditor:', error)
      return null
    }

    return data
  }

  /**
   * Update yeditor profile
   */
  async updateYeditor(
    id: string,
    updates: Partial<
      Pick<Yeditor, 'name' | 'bio' | 'avatar_url' | 'social_links'>
    >,
  ): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('yeditors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating yeditor:', error)
      return null
    }

    return data
  }

  /**
   * Admin: Link yeditor to user account
   */
  async linkYeditorToUser(yeditorId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('yeditors')
      .update({ user_id: userId })
      .eq('id', yeditorId)

    if (error) {
      console.error('Error linking yeditor to user:', error)
      return false
    }

    return true
  }

  /**
   * Admin: Unlink yeditor from user account
   */
  async unlinkYeditorFromUser(yeditorId: string): Promise<boolean> {
    const { error } = await supabase
      .from('yeditors')
      .update({ user_id: null })
      .eq('id', yeditorId)

    if (error) {
      console.error('Error unlinking yeditor from user:', error)
      return false
    }

    return true
  }

  /**
   * Search yeditors by name
   */
  async searchYeditors(query: string, limit = 10): Promise<Yeditor[]> {
    const { data, error } = await supabase
      .from('yeditors')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)
      .order('name')

    if (error) {
      console.error('Error searching yeditors:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all yeditors (for admin or listing)
   */
  async getAllYeditors(): Promise<Yeditor[]> {
    const { data, error } = await supabase
      .from('yeditors')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching all yeditors:', error)
      return []
    }

    return data || []
  }

  /**
   * Get yeditor leaderboard
   */
  async getYeditorLeaderboard(
    limit = 10,
  ): Promise<(Yeditor & { work_count: number; follower_count: number })[]> {
    const { data, error } = await supabase
      .from('yeditor_leaderboard')
      .select('*')
      .limit(limit)

    if (error) {
      console.error('Error fetching yeditor leaderboard:', error)
      return []
    }

    return data || []
  }

  /**
   * Get yeditor by linked user ID
   */
  async getYeditorByUserId(userId: string): Promise<Yeditor | null> {
    const { data, error } = await supabase
      .from('yeditors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching yeditor by user ID:', error)
      }
      return null
    }

    return data
  }

  /**
   * Verify/unverify a yeditor (admin only)
   */
  async setYeditorVerified(
    yeditorId: string,
    verified: boolean,
  ): Promise<boolean> {
    const { error } = await supabase
      .from('yeditors')
      .update({ is_verified: verified })
      .eq('id', yeditorId)

    if (error) {
      console.error('Error setting yeditor verified status:', error)
      return false
    }

    return true
  }
}

export const yeditorService = new YeditorService()
