import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  getComments,
  createComment,
  deleteComment,
  likeComment,
} from '@/app/features/comments/api'
import type { Comment, CreateCommentData } from '@/app/features/comments/types'
import { useAuth } from './use-auth'

export function useComments(
  entityType: 'artist' | 'album' | 'compilation' | 'single',
  entityId: string,
) {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => getComments(entityType, entityId),
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments', newComment.entityType, newComment.entityId],
      })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData([
        'comments',
        newComment.entityType,
        newComment.entityId,
      ])

      // Optimistically update
      queryClient.setQueryData<Comment[]>(
        ['comments', newComment.entityType, newComment.entityId],
        (old = []) => [
          {
            id: Date.now(), // temporary ID
            ...newComment,
            createdAt: new Date().toISOString(),
            likes: 0,
            userHasLiked: false,
          },
          ...old,
        ],
      )

      return { previousComments }
    },
    onError: (err, newComment, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['comments', newComment.entityType, newComment.entityId],
        context?.previousComments,
      )
      toast.error('Failed to post comment')
    },
    onSuccess: (data, variables) => {
      // Invalidate to refetch with real data
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      })
      toast.success('Comment posted!')
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      toast.success('Comment deleted')
    },
    onError: () => {
      toast.error('Failed to delete comment')
    },
  })
}

export function useLikeComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: number; userId: string }) =>
      likeComment(commentId, userId),
    onMutate: async ({ commentId }) => {
      // Find the comment in all queries
      const queries = queryClient.getQueriesData<Comment[]>({
        queryKey: ['comments'],
      })

      queries.forEach(([queryKey, comments]) => {
        if (comments) {
          queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
            old.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    likes: comment.userHasLiked
                      ? comment.likes - 1
                      : comment.likes + 1,
                    userHasLiked: !comment.userHasLiked,
                  }
                : comment,
            ),
          )
        }
      })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}
