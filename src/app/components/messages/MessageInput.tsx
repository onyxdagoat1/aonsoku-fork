import { Image, Paperclip, Send, Smile, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { GifPicker } from '@/app/components/shared/GifPicker'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { useMessagesStore } from '@/store/messages.store'

const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
  ],
  Gestures: [
    '👍',
    '👎',
    '👌',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '✋',
    '🤚',
    '🖐️',
    '🖖',
    '👋',
    '🤝',
    '🙏',
    '💪',
    '🦾',
    '🙌',
    '👏',
    '🤲',
    '👐',
  ],
  Hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
  ],
  Objects: [
    '🎵',
    '🎶',
    '🎤',
    '🎧',
    '🎼',
    '🎹',
    '🎸',
    '🎺',
    '🎷',
    '🥁',
    '🔥',
    '⭐',
    '✨',
    '💫',
    '💥',
    '💯',
    '🎉',
    '🎊',
    '🎁',
    '🏆',
  ],
}

export function MessageInput() {
  const [content, setContent] = useState('')
  const { sendMessage, activeConversationId } = useMessagesStore()
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (
      (!content.trim() && !attachedFile) ||
      !activeConversationId ||
      isSending
    )
      return

    setIsSending(true)
    try {
      if (attachedFile) {
        toast.info('File attachments coming soon!')
      }

      await sendMessage(content)
      setContent('')
      setAttachedFile(null)
      inputRef.current?.focus()
    } finally {
      setIsSending(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum 10MB.')
        return
      }
      setAttachedFile(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-background/20 backdrop-blur-xl border-border/50">
      {/* Attachment Preview */}
      {attachedFile && (
        <div className="px-4 pt-3 pb-2 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg text-sm border border-primary/20 animate-in slide-in-from-bottom-2 duration-300">
            <Paperclip className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {attachedFile.name}
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4">
        <div className="flex gap-3 items-end max-w-6xl mx-auto">
          {/* Left Actions */}
          <div className="flex gap-1 pb-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9 transition-colors"
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9 transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-2 shadow-2xl border-border/50"
                align="start"
                side="top"
              >
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {Object.entries(EMOJI_CATEGORIES).map(
                    ([category, emojis]) => (
                      <div key={category}>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 mb-1 px-2">
                          {category}
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className="text-xl hover:bg-primary/10 rounded p-1.5 transition-all hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <GifPicker
              onGifSelect={(url) => {
                // Send immediately or add to content?
                // Usually GIFs are sent immediately.
                sendMessage(url)
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9 transition-colors"
                title="Add GIF"
              >
                <span className="font-bold text-xs">GIF</span>
              </Button>
            </GifPicker>
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                activeConversationId
                  ? 'Type a message...'
                  : 'Select a conversation'
              }
              className="bg-muted/10 border-border/50 focus:border-primary focus:ring-0 transition-all rounded-2xl shadow-inner h-12 text-base"
              disabled={!activeConversationId}
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={
              (!content.trim() && !attachedFile) ||
              isSending ||
              !activeConversationId
            }
            className={`rounded-full h-11 w-11 shadow-lg shadow-primary/20 transition-all duration-300 ${
              content.trim() || attachedFile
                ? 'bg-primary hover:bg-primary/90 scale-100 hover:scale-110 active:scale-95'
                : 'bg-muted text-muted-foreground scale-95 opacity-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
