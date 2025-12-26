import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'react-toastify'

interface Comment {
  id: string
  user_id: string
  song_id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CreateCommentData {
  song_id: string
  content: string
  parent_id?: string
}

export const useComments = (songId: string) => {
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()

  // Fetch comments for a song
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', songId],
    queryFn: async () => {
      if (!configured) return []

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('song_id', songId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Comment[]
    },
    enabled: configured && !!songId,
  })

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async (newComment: CreateCommentData) => {
      if (!configured) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('comments')
        .insert([newComment])
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', songId] })
      toast.success('Comment posted!')
    },
    onError: (error) => {
      console.error('Error creating comment:', error)
      toast.error('Failed to post comment')
    },
  })

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!configured) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', songId] })
      toast.success('Comment deleted')
    },
    onError: (error) => {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    },
  })

  // Update comment mutation
  const updateComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!configured) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', songId] })
      toast.success('Comment updated')
    },
    onError: (error) => {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    },
  })

  return {
    comments: comments || [],
    isLoading,
    createComment: createComment.mutate,
    deleteComment: deleteComment.mutate,
    updateComment: updateComment.mutate,
    isCreating: createComment.isPending,
  }
}
