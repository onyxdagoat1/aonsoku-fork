import { supabase } from '@/lib/supabase'

export interface BlacklistedWord {
  id: string
  word: string
  severity: 'warn' | 'block' | 'shadow_ban'
  created_at: string
}

export interface ContentReport {
  id: string
  reporter_id: string
  content_type: string
  content_id: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  created_at: string
}

export const moderationService = {
  // --- Blacklist ---
  async getBlacklist() {
    const { data, error } = await supabase
      .from('blacklisted_words')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as BlacklistedWord[]
  },

  async addBlacklistedWord(word: string, severity = 'block') {
    const { error } = await supabase
      .from('blacklisted_words')
      .insert({ word, severity })
    
    if (error) throw error
  },

  async removeBlacklistedWord(id: string) {
    const { error } = await supabase
      .from('blacklisted_words')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // --- Reports ---
  async getReports(status = 'pending') {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*, reporter:profiles(*)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ContentReport[]
  },

  async submitReport(contentType: string, contentId: string, reason: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        description
      })
    
    if (error) throw error
  },

  async resolveReport(reportId: string, action: 'dismiss' | 'actioned') {
     const { data: { user } } = await supabase.auth.getUser()
     
     const { error } = await supabase
       .from('content_reports')
       .update({ 
         status: action,
         reviewed_by: user?.id,
         reviewed_at: new Date().toISOString()
       })
       .eq('id', reportId)
     
     if (error) throw error
  }
}
