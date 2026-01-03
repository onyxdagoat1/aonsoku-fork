import { supabase } from '@/lib/supabase'

export interface EOTWWeek {
  id: string
  week_start: string
  voting_ends_at: string
  status: 'nominations' | 'voting' | 'completed'
  winner_content_id?: string | null
  winner_content_type?: string | null
  description?: string | null
  credits?: string | null
  is_archived?: boolean
  created_at: string
  updated_at?: string
}

export interface EOTWNominee {
  id: string
  week_id: string
  content_id: string
  content_type: string
  content_name?: string | null
  content_artist?: string | null
  content_cover?: string | null
  description?: string | null
  credits?: string | null
  vote_count?: number
}

export interface EOTWWeekWithResults extends EOTWWeek {
  nominees: EOTWNominee[]
  winner?: EOTWNominee
  runnerUps?: EOTWNominee[]
}

export const eotwService = {
  /**
   * Get the current active week (voting or nominations)
   */
  async getCurrentWeek(): Promise<EOTWWeek | null> {
    const { data, error } = await supabase
      .from('eotw_weeks')
      .select('*')
      .in('status', ['nominations', 'voting'])
      .order('week_start', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Get nominees for a week with vote counts
   */
  async getNominees(weekId: string): Promise<EOTWNominee[]> {
    const { data, error } = await supabase
      .from('eotw_nominee_votes')
      .select('*')
      .eq('week_id', weekId)
      .order('vote_count', { ascending: false })

    if (error) throw error
    return (data || []).map((n) => ({
      id: n.nominee_id,
      week_id: n.week_id,
      content_id: n.content_id,
      content_type: n.content_type,
      content_name: n.content_name,
      content_artist: n.content_artist,
      content_cover: n.content_cover,
      vote_count: n.vote_count,
    }))
  },

  /**
   * Vote for a nominee
   */
  async vote(nomineeId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('eotw_votes').upsert({
      nominee_id: nomineeId,
      user_id: user.id,
    })

    if (error) throw error
  },

  /**
   * Check if user has voted for a nominee
   */
  async getUserVote(weekId: string): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('eotw_votes')
      .select('nominee_id, eotw_nominees!inner(week_id)')
      .eq('user_id', user.id)
      .eq('eotw_nominees.week_id', weekId)
      .limit(1)
      .single()

    return data?.nominee_id || null
  },

  /**
   * Get past weeks with results
   */
  async getPastWeeks(limit = 10): Promise<EOTWWeekWithResults[]> {
    const { data: weeks, error } = await supabase
      .from('eotw_weeks')
      .select('*')
      .eq('status', 'completed')
      .order('week_start', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!weeks) return []

    const results: EOTWWeekWithResults[] = []

    for (const week of weeks) {
      const nominees = await this.getNominees(week.id)
      const sortedNominees = nominees.sort(
        (a, b) => (b.vote_count || 0) - (a.vote_count || 0),
      )

      results.push({
        ...week,
        nominees: sortedNominees,
        winner: sortedNominees[0],
        runnerUps: sortedNominees.slice(1, 3),
      })
    }

    return results
  },

  // ========== ADMIN FUNCTIONS ==========

  /**
   * Create a new week (admin only)
   */
  async createWeek(weekStart: Date, votingEndsAt: Date): Promise<EOTWWeek> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('eotw_weeks')
      .insert({
        week_start: weekStart.toISOString().split('T')[0],
        voting_ends_at: votingEndsAt.toISOString(),
        status: 'nominations',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Add a nominee (admin only)
   */
  async addNominee(
    weekId: string,
    contentId: string,
    contentType: string,
    contentName?: string,
    contentArtist?: string,
    contentCover?: string,
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('eotw_nominees').insert({
      week_id: weekId,
      content_id: contentId,
      content_type: contentType,
      content_name: contentName,
      content_artist: contentArtist,
      content_cover: contentCover,
      nominated_by: user.id,
    })

    if (error) throw error
  },

  /**
   * Remove a nominee (admin only)
   */
  async removeNominee(nomineeId: string): Promise<void> {
    const { error } = await supabase
      .from('eotw_nominees')
      .delete()
      .eq('id', nomineeId)

    if (error) throw error
  },

  /**
   * Start voting phase (admin only)
   */
  async startVoting(weekId: string): Promise<void> {
    const { error } = await supabase
      .from('eotw_weeks')
      .update({ status: 'voting' })
      .eq('id', weekId)

    if (error) throw error
  },

  /**
   * Crown a winner and complete the week (admin only)
   */
  async crownWinner(
    weekId: string,
    winnerContentId: string,
    winnerContentType: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('eotw_weeks')
      .update({
        status: 'completed',
        winner_content_id: winnerContentId,
        winner_content_type: winnerContentType,
      })
      .eq('id', weekId)

    if (error) throw error
  },

  /**
   * Check if an album is an EOTW winner
   */
  async isEOTWWinner(contentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('eotw_weeks')
      .select('id')
      .eq('winner_content_id', contentId)
      .limit(1)
      .single()

    return !!data
  },

  /**
   * Update week details (admin only)
   */
  async updateWeek(
    weekId: string,
    updates: {
      week_start?: Date
      voting_ends_at?: Date
      description?: string
      credits?: string
    },
  ): Promise<void> {
    const updateData: any = {}
    if (updates.week_start) {
      updateData.week_start = updates.week_start.toISOString().split('T')[0]
    }
    if (updates.voting_ends_at) {
      updateData.voting_ends_at = updates.voting_ends_at.toISOString()
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }
    if (updates.credits !== undefined) {
      updateData.credits = updates.credits
    }
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('eotw_weeks')
      .update(updateData)
      .eq('id', weekId)

    if (error) throw error
  },

  /**
   * Archive a week (admin only)
   */
  async archiveWeek(weekId: string): Promise<void> {
    const { error } = await supabase
      .from('eotw_weeks')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', weekId)

    if (error) throw error
  },

  /**
   * Unarchive a week (admin only)
   */
  async unarchiveWeek(weekId: string): Promise<void> {
    const { error } = await supabase
      .from('eotw_weeks')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', weekId)

    if (error) throw error
  },

  /**
   * Get archived weeks
   */
  async getArchivedWeeks(limit = 20): Promise<EOTWWeek[]> {
    const { data, error } = await supabase
      .from('eotw_weeks')
      .select('*')
      .eq('is_archived', true)
      .order('week_start', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get all weeks (optionally including archived)
   */
  async getAllWeeks(includeArchived = false): Promise<EOTWWeek[]> {
    let query = supabase
      .from('eotw_weeks')
      .select('*')
      .order('week_start', { ascending: false })

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Update nominee details (admin only)
   */
  async updateNominee(
    nomineeId: string,
    updates: {
      description?: string
      credits?: string
      content_name?: string
      content_artist?: string
    },
  ): Promise<void> {
    const { error } = await supabase
      .from('eotw_nominees')
      .update(updates)
      .eq('id', nomineeId)

    if (error) throw error
  },

  /**
   * Delete a week permanently (admin only)
   */
  async deleteWeek(weekId: string): Promise<void> {
    const { error } = await supabase
      .from('eotw_weeks')
      .delete()
      .eq('id', weekId)

    if (error) throw error
  },
}
