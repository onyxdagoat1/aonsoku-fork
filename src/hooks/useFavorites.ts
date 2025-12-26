import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'react-toastify'

interface Favorite {
  id: string
  user_id: string
  song_id: string
  created_at: string
}

export const useFavorites = (userId?: string) => {
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()

  // Fetch user's favorites
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!configured || !userId) return []

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Favorite[]
    },
    enabled: configured && !!userId,
  })

  // Check if song is favorited
  const isFavorite = (songId: string) => {
    return favorites?.some((fav) => fav.song_id === songId) ?? false
  }

  // Add to favorites mutation
  const addFavorite = useMutation({
    mutationFn: async (songId: string) => {
      if (!configured || !userId) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('favorites')
        .insert([{ song_id: songId }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      toast.success('Added to favorites')
    },
    onError: (error) => {
      console.error('Error adding favorite:', error)
      toast.error('Failed to add to favorites')
    },
  })

  // Remove from favorites mutation
  const removeFavorite = useMutation({
    mutationFn: async (songId: string) => {
      if (!configured || !userId) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('song_id', songId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      toast.success('Removed from favorites')
    },
    onError: (error) => {
      console.error('Error removing favorite:', error)
      toast.error('Failed to remove from favorites')
    },
  })

  // Toggle favorite
  const toggleFavorite = (songId: string) => {
    if (isFavorite(songId)) {
      removeFavorite.mutate(songId)
    } else {
      addFavorite.mutate(songId)
    }
  }

  return {
    favorites: favorites || [],
    isLoading,
    isFavorite,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
  }
}
