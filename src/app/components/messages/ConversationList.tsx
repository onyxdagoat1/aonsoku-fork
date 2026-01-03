import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Skeleton } from '@/app/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMessagesStore } from '@/store/messages.store'

export function ConversationList() {
  const {
    conversations,
    activeConversationId,
    loadConversations,
    selectConversation,
    isLoading,
  } = useMessagesStore()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 opacity-50">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center h-40">
        <span className="opacity-50">No conversations yet.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
      <AnimatePresence initial={false}>
        {conversations.map((conv, i) => {
          const otherParticipant = conv.participants?.[0]
          const isActive = activeConversationId === conv.id

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left transition-all duration-200 rounded-2xl relative group overflow-hidden',
                  isActive
                    ? 'bg-primary/20 hover:bg-primary/25 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                    : 'hover:bg-white/5',
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                )}

                <div className="relative">
                  <Avatar
                    className={cn(
                      'w-12 h-12 border-2 transition-all duration-300',
                      isActive
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-white/10 group-hover:border-white/30',
                    )}
                  >
                    <AvatarImage
                      src={otherParticipant?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                      {otherParticipant?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Mock Online Status */}
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-background rounded-full transition-all',
                      isActive
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                        : 'bg-green-500/70',
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0 z-10">
                  <div className="flex justify-between items-baseline mb-1">
                    <span
                      className={cn(
                        'font-bold truncate transition-colors text-sm',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-foreground/90 group-hover:text-foreground',
                      )}
                    >
                      {otherParticipant?.display_name || 'Unknown User'}
                    </span>
                    {conv.last_message_at && (
                      <span
                        className={cn(
                          'text-[10px] flex-shrink-0 ml-2 font-medium transition-colors',
                          isActive
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground/60',
                        )}
                      >
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'text-xs truncate transition-colors max-w-[140px]',
                        isActive
                          ? 'text-primary-foreground/80'
                          : conv.unread_count && conv.unread_count > 0
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground group-hover:text-muted-foreground/80',
                      )}
                    >
                      <span className="truncate">
                        {conv.last_message_preview || 'Started a conversation'}
                      </span>
                    </p>

                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg animate-in zoom-in duration-300">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
