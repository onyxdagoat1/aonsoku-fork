import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { supabase } from '@/lib/supabase'
import {
  Notification,
  notificationsService,
} from '@/service/notifications.service'

interface NotificationsState {
  notifications: Notification[]
  isLoading: boolean
  unreadCount: number

  actions: {
    load: () => Promise<void>
    markRead: (id: string) => Promise<void>
    markAllRead: () => Promise<void>
    clearAll: () => Promise<void>
    handleRealtimeNotification: (n: Notification) => void
  }
}

export const useNotificationsStore = createWithEqualityFn<NotificationsState>()(
  devtools(
    immer((set, get) => ({
      notifications: [],
      isLoading: false,
      unreadCount: 0,

      actions: {
        load: async () => {
          set({ isLoading: true })
          try {
            const data = await notificationsService.getNotifications()
            set((state) => {
              state.notifications = data
              state.unreadCount = data.filter((n) => !n.is_read).length
            })
          } catch (err) {
            console.error('Failed to load notifications:', err)
          } finally {
            set({ isLoading: false })
          }
        },

        markRead: async (id: string) => {
          // Optimistic update
          set((state) => {
            const n = state.notifications.find((ni) => ni.id === id)
            if (n && !n.is_read) {
              n.is_read = true
              state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
          })

          try {
            await notificationsService.markAsRead(id)
          } catch (err) {
            console.error(err)
            // Revert logic could go here
          }
        },

        markAllRead: async () => {
          set((state) => {
            state.notifications.forEach((n) => (n.is_read = true))
            state.unreadCount = 0
          })

          try {
            await notificationsService.markAllAsRead()
          } catch (err) {
            console.error(err)
          }
        },

        clearAll: async () => {
          set({ notifications: [], unreadCount: 0 })
          try {
            await notificationsService.clearAll()
          } catch (err) {
            console.error(err)
          }
        },

        handleRealtimeNotification: (n: Notification) => {
          set((state) => {
            // Avoid duplicates
            if (state.notifications.find((existing) => existing.id === n.id))
              return

            state.notifications.unshift(n)
            if (!n.is_read) state.unreadCount++
          })
        },
      },
    })),
    { name: 'notifications_store' },
  ),
)

export const useNotifications = () =>
  useNotificationsStore((s) => s.notifications)
export const useUnreadCount = () => useNotificationsStore((s) => s.unreadCount)
export const useNotificationsActions = () =>
  useNotificationsStore((s) => s.actions)

// Realtime subscription hook setup
export const subscribeToNotifications = async () => {
  const actions = useNotificationsStore.getState().actions

  // We need user ID for subscription channel
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return () => {}

  const channel = supabase
    .channel(`notifications:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        actions.handleRealtimeNotification(payload.new as Notification)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
