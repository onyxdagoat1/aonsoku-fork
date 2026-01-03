import { format, isToday, isYesterday } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, MessageSquareDashed, Music } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { useMessagesStore } from '@/store/messages.store'

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) {
    return format(date, 'h:mm a')
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`
  } else {
    return format(date, 'MMM d, h:mm a')
  }
}

export function MessageThread() {
  const { activeConversationId, messages, conversations } = useMessagesStore()
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeMessages = activeConversationId
    ? messages[activeConversationId] || []
    : []

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  )

  const otherParticipant = activeConversation?.participants?.[0]

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages.length])

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background/30 p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <MessageSquareDashed className="w-10 h-10 text-primary/70" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Your Messages
        </h3>
        <p className="max-w-xs text-sm opacity-70">
          Select a conversation from the list or start a new one to begin
          chatting with your friends.
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar relative"
      ref={scrollRef}
    >
      {/* Conversation Header - Floating Glass Panel */}
      {otherParticipant && (
        <div className="sticky top-0 z-20 pb-4">
          <div className="flex items-center justify-between p-3 pl-4 pr-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative group/avatar cursor-pointer">
                <Avatar className="w-10 h-10 border border-white/10 shadow-md transition-transform group-hover/avatar:scale-105">
                  <AvatarImage src={otherParticipant.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                    {otherParticipant.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-foreground text-sm tracking-wide">
                  {otherParticipant.display_name || 'Unknown User'}
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  @{otherParticipant.username || 'unknown'} • Active now
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Music className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence initial={false}>
        {activeMessages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const showAvatar =
            !isMe &&
            (i === 0 || activeMessages[i - 1]?.sender_id !== msg.sender_id)
          const showTimestamp =
            i === activeMessages.length - 1 ||
            activeMessages[i + 1]?.sender_id !== msg.sender_id ||
            new Date(activeMessages[i + 1]?.created_at).getTime() -
              new Date(msg.created_at).getTime() >
              5 * 60 * 1000 // 5 minutes

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
              className={cn(
                'flex gap-3 max-w-[85%] relative group',
                isMe ? 'ml-auto flex-row-reverse' : '',
              )}
            >
              {/* Avatar */}
              {!isMe && (
                <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 rounded-full border border-white/10 shadow-sm">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/10 text-xs">
                        {msg.sender?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className="flex flex-col gap-1 min-w-0">
                <div
                  className={cn(
                    'px-4 py-2.5 shadow-md backdrop-blur-sm relative transition-all duration-200',
                    isMe
                      ? 'bg-primary/90 text-primary-foreground rounded-2xl rounded-tr-sm'
                      : 'bg-white/10 hover:bg-white/15 text-foreground rounded-2xl rounded-tl-sm border border-white/5',
                  )}
                >
                  {msg.content.match(
                    /^https?:\/\/.*\.(gif|png|jpg|jpeg|webp)$/i,
                  ) || msg.content.includes('tenor.com') ? (
                    <div className="rounded-lg overflow-hidden my-1 bg-black/20 max-w-sm">
                      <img
                        src={msg.content}
                        alt="GIF"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <p className="leading-relaxed text-sm break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}

                  {/* Timestamp (always visible on mobile, hover on desktop) */}
                  {showTimestamp && (
                    <div
                      className={cn(
                        'text-[10px] flex items-center gap-1.5 mt-1.5 opacity-70',
                        isMe
                          ? 'justify-end text-primary-foreground/90'
                          : 'text-muted-foreground',
                      )}
                    >
                      <span>{formatMessageTime(msg.created_at)}</span>
                      {isMe && <CheckCheck className="w-3 h-3 opacity-90" />}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {activeMessages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-in fade-in duration-700 slide-in-from-bottom-5">
          <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-4 border border-white/10 shadow-2xl rotate-3">
            <MessageSquareDashed className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            No messages yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Say hi to start the conversation! 👋
          </p>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  )
}
