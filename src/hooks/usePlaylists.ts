import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'react-toastify'

interface Playlist {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  cover_art_url: string | null
  song_count: number
  created_at: string
  updated_at: string
  profiles: {
    username: string
    display_name: string | null
  }
}

interface CreatePlaylistData {
  name: string
  description?: string
  is_public?: boolean
}

export const usePlaylists = (userId?: string) => {
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()

  // Fetch user's playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists', userId],
    queryFn: async () => {
      if (!configured) return []

      let query = supabase
        .from('playlists')
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .order('updated_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Playlist[]
    },
    enabled: configured,
  })

  // Fetch public playlists
  const { data: publicPlaylists } = useQuery({
    queryKey: ['playlists', 'public'],
    queryFn: async () => {
      if (!configured) return []

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as Playlist[]
    },
    enabled: configured,
  })

  // Create playlist mutation
  const createPlaylist = useMutation({
    mutationFn: async (newPlaylist: CreatePlaylistData) => {
      if (!configured) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('playlists')
        .insert([newPlaylist])
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      toast.success('Playlist created!')
    },
    onError: (error) => {
      console.error('Error creating playlist:', error)
      toast.error('Failed to create playlist')
    },
  })

  // Delete playlist mutation
  const deletePlaylist = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!configured) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      toast.success('Playlist deleted')
    },
    onError: (error) => {
      console.error('Error deleting playlist:', error)
      toast.error('Failed to delete playlist')
    },
  })

  // Update playlist mutation
  const updatePlaylist = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Playlist> & { id: string }) => {
      if (!configured) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      toast.success('Playlist updated')
    },
    onError: (error) => {
      console.error('Error updating playlist:', error)
      toast.error('Failed to update playlist')
    },
  })

  return {
    playlists: playlists || [],
    publicPlaylists: publicPlaylists || [],
    isLoading,
    createPlaylist: createPlaylist.mutate,
    deletePlaylist: deletePlaylist.mutate,
    updatePlaylist: updatePlaylist.mutate,
    isCreating: createPlaylist.isPending,
  }
}
