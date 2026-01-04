import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Image, Loader2, Music, SendHorizontal, Smile, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'

import { getCoverArtUrl } from '@/api/httpClient'
import { MusicSearchPicker } from '@/app/components/social/MusicSearchPicker'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { postsService } from '@/service/posts.service'

interface PostComposerProps {
  onPostCreated?: () => void
  replyToId?: string
  className?: string
  placeholder?: string
  forcedAttachment?: MusicAttachment
}

interface MusicAttachment {
  id: string
  type: 'track' | 'album'
  name: string
  artist: string
  coverArt?: string
}

export function PostComposer({
  onPostCreated,
  className,
  placeholder = "What's on your mind?",
  replyToId,
  forcedAttachment,
}: PostComposerProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Image attachment
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Music attachment
  const [musicAttachment, setMusicAttachment] =
    useState<MusicAttachment | null>(forcedAttachment || null)

  const handleImageSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be less than 5MB')
          return
        }
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        toast.success('Image attached', { position: 'bottom-center' })
      }
    }
    input.click()
  }

  const handleMusicSelect = (result: {
    id: string
    name: string
    artist: string
    coverArt?: string
    type: 'track' | 'album'
  }) => {
    setMusicAttachment({
      id: result.id,
      type: result.type,
      name: result.name,
      artist: result.artist,
      coverArt: result.coverArt,
    })
    toast.success(`${result.type === 'track' ? 'Track' : 'Album'} attached`, {
      position: 'bottom-center',
    })
  }

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
  }

  const clearMusic = () => {
    setMusicAttachment(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `post-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !musicAttachment) return
    if (!user) return

    setIsLoading(true)
    try {
      let imageUrl: string | null = null

      // Upload image if present
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          toast.error('Failed to upload image')
          setIsLoading(false)
          return
        }
      }

      if (replyToId) {
        // Create reply (note: replies don't support attachments in current schema)
        await postsService.reply(replyToId, content)
      } else {
        // Create post with attachments
        let postType: any = 'text'
        if (imageUrl && musicAttachment) {
          postType = 'media'
        } else if (imageUrl) {
          postType = 'image'
        } else if (musicAttachment) {
          postType = 'track_share'
        }

        await postsService.createPost(
          content,
          postType,
          musicAttachment
            ? {
                id: musicAttachment.id,
                type: musicAttachment.type,
                name: musicAttachment.name,
                artist: musicAttachment.artist,
                coverArt: musicAttachment.coverArt,
              }
            : undefined,
          imageUrl || undefined,
        )
      }

      setContent('')
      clearImage()
      clearMusic()
      setIsExpanded(false)
      toast.success(replyToId ? 'Reply posted!' : 'Post created!')
      if (onPostCreated) onPostCreated()
    } catch (err: unknown) {
      console.error('Failed to create post:', err)
      const error = err as { message?: string }
      const errorMsg = error?.message || 'Failed to post'
      toast.error(`Failed to post: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 ${className}`}
    >
      <div className="flex gap-4">
        <Avatar className="w-10 h-10 border border-white/10">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 w-full">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] bg-muted/20 border-white/5 resize-none focus-visible:ring-1 mb-2"
            onClick={() => setIsExpanded(true)}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mb-2 group bg-black/40 rounded-lg overflow-hidden border border-white/5">
              <img
                src={imagePreview}
                alt="Attached"
                className="w-full max-h-[500px] object-contain mx-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Music Preview */}
          {musicAttachment && (
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg mb-2 relative">
              <div className="w-12 h-12 rounded overflow-hidden bg-background flex-shrink-0">
                {musicAttachment.coverArt ? (
                  <img
                    src={getCoverArtUrl(
                      musicAttachment.coverArt,
                      'album',
                      '100',
                    )}
                    alt={musicAttachment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary">
                    <Music className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {musicAttachment.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {musicAttachment.artist}
                </div>
              </div>
              {!forcedAttachment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive"
                  onClick={clearMusic}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {(isExpanded || content.length > 0) && (
            <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary gap-2"
                  onClick={handleImageSelect}
                  disabled={!!imageFile}
                >
                  <Image className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Image</span>
                </Button>
                {!forcedAttachment && (
                  <MusicSearchPicker onSelect={handleMusicSelect}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary gap-2"
                      disabled={!!musicAttachment}
                    >
                      <Music className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">Music</span>
                    </Button>
                  </MusicSearchPicker>
                )}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-muted-foreground hover:text-primary gap-2',
                      showEmojiPicker && 'text-primary bg-primary/10',
                    )}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Emoji</span>
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-50 shadow-xl rounded-xl overflow-hidden">
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowEmojiPicker(false)}
                      />
                      <div className="relative z-50">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setContent((prev) => prev + emojiData.emoji)
                            setShowEmojiPicker(false)
                          }}
                          theme={Theme.DARK}
                          lazyLoadEmojis={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  (!content.trim() && !imageFile && !musicAttachment) ||
                  isLoading
                }
                className="gap-2 rounded-full px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
