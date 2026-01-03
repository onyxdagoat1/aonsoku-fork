import { Search, User, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useMessagesStore } from '@/store/messages.store'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface NewConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewConversationModal({
  open,
  onOpenChange,
}: NewConversationModalProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { startConversation } = useMessagesStore()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .neq('id', user?.id || '') // Exclude current user
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = async (userId: string) => {
    try {
      await startConversation(userId)
      onOpenChange(false)
      setSearchQuery('')
      setSearchResults([])
      toast.success('Conversation started!')
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for a user to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username..."
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Searching...
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No users found
              </div>
            )}

            {!isSearching && !searchQuery && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Type to search for users
              </div>
            )}

            {!isSearching &&
              searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectUser(profile.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">
                      {profile.display_name || profile.username}
                    </p>
                    {profile.display_name && (
                      <p className="text-xs text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
