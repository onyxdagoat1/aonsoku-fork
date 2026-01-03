import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Conversation =
  Database['public']['Tables']['conversations']['Row'] & {
    participants?: Database['public']['Tables']['profiles']['Row'][]
    unread_count?: number
  }

export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: Database['public']['Tables']['profiles']['Row']
}

export const messagesService = {
  /**
   * Get all conversations for current user
   */
  async getConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('last_message_at', { ascending: false })

    if (error) throw error

    // Fetch participant profiles and unread count
    const conversations = await Promise.all(
      data.map(async (conv) => {
        const otherUserIds = conv.participant_ids.filter((id) => id !== user.id)

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherUserIds)

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id)

        return {
          ...conv,
          participants: profiles || [],
          unread_count: count || 0,
        } as Conversation
      }),
    )

    return conversations
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)') // Explicit join
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      // Fallback if specific FK join fails - try simple profiles join
      const { data: data2, error: error2 } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error2) throw error2
      return data2 as Message[]
    }

    return data as Message[]
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, content: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select('*, sender:profiles(*)')
      .single()

    if (error) throw error

    return data as Message
  },

  /**
   * Start or get existing conversation with a user
   */
  async startConversation(otherUserId: string) {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: otherUserId,
    })

    if (error) throw error
    return data as string // Returns conversation ID
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Mark all messages in this conversation NOT sent by me as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)
  },
}
