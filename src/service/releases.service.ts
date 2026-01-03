import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

export type ScheduledRelease = Database['public']['Tables']['scheduled_releases']['Row']

export const releasesService = {
  /**
   * Get upcoming active releases
   */
  async getUpcomingReleases() {
    const { data, error } = await supabase.rpc('get_upcoming_releases')
    
    if (error) throw error
    return data as ScheduledRelease[]
  },

  /**
   * Admin: Create a release
   */
  async createRelease(release: Database['public']['Tables']['scheduled_releases']['Insert']) {
    const { data, error } = await supabase
      .from('scheduled_releases')
      .insert(release)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Toggle pre-save / reminder (Local logic or backend if table exists)
   * For now we just return true/false as UI toggle
   */
  async toggleReminder(releaseId: string) {
    // TODO: Implement reminder logic (push notification or email)
    console.log('Toggled reminder for', releaseId)
    return true
  }
}
