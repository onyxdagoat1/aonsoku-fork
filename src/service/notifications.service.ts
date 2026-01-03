import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

export type Notification = Database['public']['Tables']['notifications']['Row'] & {
    sender?: Database['public']['Tables']['profiles']['Row']
}

export const notificationsService = {
    /**
     * Get recent notifications
     */
    async getNotifications(limit = 50) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data as Notification[]
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
        
        if (error) throw error
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
        
        if (error) throw error
    },

    /**
     * Clear all notifications (delete)
     */
    async clearAll() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
        
        if (error) throw error
    }
}
