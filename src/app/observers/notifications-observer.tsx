import { useEffect } from 'react'
import {
  subscribeToNotifications,
  useNotificationsActions,
} from '@/store/notifications.store'

export function NotificationsObserver() {
  const { load } = useNotificationsActions()

  useEffect(() => {
    // Initial load
    load()

    // Subscribe to realtime updates
    let cleanup: (() => void) | undefined
    let mounted = true

    subscribeToNotifications().then((unsub) => {
      if (mounted) {
        cleanup = unsub
      } else {
        unsub() // Immediately unsubscribe if already unmounted
      }
    })

    return () => {
      mounted = false
      if (cleanup) {
        cleanup()
      }
    }
  }, [load])

  return null
}
