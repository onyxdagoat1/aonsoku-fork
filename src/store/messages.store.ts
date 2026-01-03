import type { RealtimeChannel } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import {
  Conversation,
  Message,
  messagesService,
} from '@/service/messages.service'

interface MessagesState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]> // keyed by conversationId
  isLoading: boolean
  realtimeChannel: RealtimeChannel | null

  // Actions
  loadConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  startConversation: (userId: string) => Promise<string>
  setupRealtimeSubscription: () => void
  cleanupRealtimeSubscription: () => void

  // Realtime handlers
  handleNewMessage: (msg: Message) => void
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoading: false,
  realtimeChannel: null,

  loadConversations: async () => {
    set({ isLoading: true })
    try {
      const convs = await messagesService.getConversations()
      set({ conversations: convs })
    } catch (err) {
      console.error(err)
    } finally {
      set({ isLoading: false })
    }
  },

  selectConversation: async (id: string) => {
    set({ activeConversationId: id })

    // reset unread count locally
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unread_count: 0 } : c,
      ),
    }))

    // Load messages if not already loaded
    if (!get().messages[id]) {
      try {
        const msgs = await messagesService.getMessages(id)
        set((state) => ({
          messages: { ...state.messages, [id]: msgs },
        }))
      } catch (err) {
        console.error(err)
      }
    }

    // Mark as read
    messagesService.markAsRead(id)
  },

  sendMessage: async (content: string) => {
    const { activeConversationId } = get()
    if (!activeConversationId) return

    try {
      // Fetch current message with sender info (already done in service)
      const msg = await messagesService.sendMessage(
        activeConversationId,
        content,
      )
      // handleNewMessage will be triggered by realtime, but we can call it here too
      // if we want to ensure immediate feedback even if realtime lags
      get().handleNewMessage(msg)
    } catch (err) {
      console.error(err)
    }
  },

  startConversation: async (userId: string) => {
    try {
      const id = await messagesService.startConversation(userId)
      await get().loadConversations() // Refresh list
      await get().selectConversation(id)
      return id
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  setupRealtimeSubscription: () => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message
          get().handleNewMessage(newMessage)
        },
      )
      .subscribe()

    set({ realtimeChannel: channel })
  },

  cleanupRealtimeSubscription: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  handleNewMessage: async (msg: Message) => {
    const state = get()
    const convId = msg.conversation_id
    const currentMsgs = state.messages[convId] || []

    // Check for duplicate
    if (currentMsgs.find((m) => m.id === msg.id)) return

    // If sender profile is missing (common in realtime payloads), fetch it
    let hydratedMsg = msg
    if (!msg.sender) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', msg.sender_id)
          .single()
        if (profile) {
          hydratedMsg = { ...msg, sender: profile }
        }
      } catch (err) {
        console.error('Error hydrating message sender:', err)
      }
    }

    set((state) => {
      const isActive = state.activeConversationId === convId

      const updatedConversations = state.conversations
        .map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              last_message_at: hydratedMsg.created_at,
              last_message_preview: hydratedMsg.content,
              unread_count: isActive ? 0 : (c.unread_count || 0) + 1,
            }
          }
          return c
        })
        .sort(
          (a, b) =>
            new Date(b.last_message_at || 0).getTime() -
            new Date(a.last_message_at || 0).getTime(),
        )

      return {
        messages: {
          ...state.messages,
          [convId]: [...(state.messages[convId] || []), hydratedMsg],
        },
        conversations: updatedConversations,
      }
    })
  },
}))
