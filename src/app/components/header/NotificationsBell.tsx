import { Bell, Heart, Mail, MessageSquare, UserPlus } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import {
  useNotifications,
  useNotificationsActions,
  useUnreadCount,
} from '@/store/notifications.store'

export function NotificationsBell() {
  const unreadCount = useUnreadCount()
  const notifications = useNotifications()
  const actions = useNotificationsActions()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-[400px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => actions.markAllRead()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    actions.markRead(notification.id)
                    // TODO: Navigate to content
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === 'like' && (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                      {notification.type === 'reply' && (
                        <MessageSquare className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                      {notification.type === 'follow' && (
                        <UserPlus className="w-4 h-4 text-green-500 fill-green-500" />
                      )}
                      {notification.type === 'system' && (
                        <Bell className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {notification.type === 'message' && (
                        <Mail className="w-4 h-4 text-purple-500 fill-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
