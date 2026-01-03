import { MessageSquare, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConversationList } from '@/app/components/messages/ConversationList'
import { MessageInput } from '@/app/components/messages/MessageInput'
import { MessageThread } from '@/app/components/messages/MessageThread'
import { NewConversationModal } from '@/app/components/messages/NewConversationModal'
import { Button } from '@/app/components/ui/button'
import { useMessagesStore } from '@/store/messages.store'

export default function MessagesPage() {
  const { setupRealtimeSubscription, cleanupRealtimeSubscription } =
    useMessagesStore()
  const [showNewConversation, setShowNewConversation] = useState(false)

  useEffect(() => {
    // Setup realtime subscription when component mounts
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      cleanupRealtimeSubscription()
    }
  }, [setupRealtimeSubscription, cleanupRealtimeSubscription])

  return (
    <div className="relative h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse delay-1000 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 h-full flex gap-6 p-6 max-w-[1600px] mx-auto">
        {/* Floating Sidebar */}
        <div className="w-80 flex-none flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-foreground tracking-tight">
                Messages
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowNewConversation(true)}
              className="gap-2 rounded-xl shadow-lg hover:shadow-primary/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>
        </div>

        {/* Floating Chat Area */}
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 delay-100 min-w-0">
          {/* Messages Thread */}
          <div className="flex-1 overflow-hidden relative">
            <MessageThread />
          </div>

          {/* Input Area */}
          <div className="relative z-20">
            <MessageInput />
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
      />
    </div>
  )
}
