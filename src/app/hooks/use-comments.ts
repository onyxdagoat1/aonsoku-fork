import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import {
  fetchComments,
  createComment,
  deleteComment as apiDeleteComment,
  likeComment as apiLikeComment,
} from '../features/comments/api'
import { Comment, CreateCommentDto } from '../features/comments/types'

export function useComments(
  entityType: 'artist' | 'album' | 'compilation' | 'single',
  entityId: string,
) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['comments', entityType, entityId]

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: () => fetchComments(entityType, entityId),
    enabled: !!entityId,
  })

  const { mutateAsync: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to comment')

      const dto: CreateCommentDto = {
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        user_name: user.username || user.email || 'Anonymous',
        content,
      }

      return createComment(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutateAsync: deleteComment } = useMutation({
    mutationFn: (commentId: number) => apiDeleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutateAsync: likeComment } = useMutation({
    mutationFn: async (commentId: number) => {
      if (!user) throw new Error('Must be logged in to like')
      return apiLikeComment(commentId, user.id)
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey })

      const previousComments = queryClient.getQueryData<Comment[]>(queryKey)

      queryClient.setQueryData<Comment[]>(queryKey, (old) => {
        if (!old) return old
        return old.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.user_has_liked
                ? comment.likes - 1
                : comment.likes + 1,
              user_has_liked: !comment.user_has_liked,
            }
          }
          return comment
        })
      })

      return { previousComments }
    },
    onError: (err, commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
    likeComment,
    isAddingComment,
  }
}
