import { User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/app/components/ui/command'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function CommandUserResult({
  query,
  runCommand,
}: {
  query: string
  runCommand: (command: () => unknown) => void
}) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setUsers([])
      return
    }

    const searchUsers = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(5)

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (users.length === 0 && !loading) return null

  return (
    <>
      <CommandSeparator />
      <CommandGroup heading="Users">
        {users.map((user) => (
          <CommandItem
            key={user.id}
            value={user.display_name || user.username}
            onSelect={() => {
              runCommand(() => navigate(`/profile/${user.id}`))
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">
                {user.display_name || user.username}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                @{user.username}
              </span>
            </div>
          </CommandItem>
        ))}
        {loading && (
          <div className="p-2 text-xs text-muted-foreground text-center animate-pulse">
            Searching users...
          </div>
        )}
      </CommandGroup>
    </>
  )
}
