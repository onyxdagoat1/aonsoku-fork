import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { commentsService } from '@/service/comments.service'
import type {
  ContentType,
  CreateCommentInput,
  ReactionType,
  UpdateCommentInput,
} from '@/types/comments'

interface UseCommentsOptions {
  contentType: ContentType
  contentId: string
  userId?: string
}

/**
 * Hook to fetch and manage comments for a specific content
 */
export function useComments({
  contentType,
  contentId,
  userId,
}: UseCommentsOptions) {
  const queryClient = useQueryClient()
  const queryKey = ['comments', contentType, contentId]

  // Fetch comments
  const query = useQuery({
    queryKey,
    queryFn: () => commentsService.getComments(contentType, contentId, userId),
    staleTime: 10000, // 10 seconds - comments don't change that frequently
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (
      input: CreateCommentInput & { username: string; userAvatar?: string },
    ) =>
      commentsService.createComment(
        {
          content_type: input.content_type,
          content_id: input.content_id,
          text: input.text,
          parent_id: input.parent_id,
        },
        userId!,
        input.username,
        input.userAvatar,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Comment posted!')
    },
    onError: (error) => {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment')
    },
  })

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCommentInput }) =>
      commentsService.updateComment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Comment updated!')
    },
    onError: (error) => {
      console.error('Failed to update comment:', error)
      toast.error('Failed to update comment')
    },
  })

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Comment deleted')
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    },
  })

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({
      commentId,
      reactionType,
    }: {
      commentId: string
      reactionType: ReactionType
    }) => commentsService.addReaction(commentId, userId!, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      console.error('Failed to add reaction:', error)
      toast.error('Failed to add reaction')
    },
  })

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentsService.removeReaction(commentId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      toast.error('Failed to remove reaction')
    },
  })

  // Report comment mutation
  const reportMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.reportComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Comment reported to moderators')
    },
    onError: (error) => {
      console.error('Failed to report comment:', error)
      toast.error('Failed to report comment')
    },
  })

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createComment: createMutation.mutate,
    updateComment: updateMutation.mutate,
    deleteComment: deleteMutation.mutate,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    reportComment: reportMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

/**
 * Hook to fetch comment statistics
 */
export function useCommentStats(contentType: ContentType, contentId: string) {
  return useQuery({
    queryKey: ['comment-stats', contentType, contentId],
    queryFn: () => commentsService.getCommentStats(contentType, contentId),
    staleTime: 60000, // 1 minute
  })
}
