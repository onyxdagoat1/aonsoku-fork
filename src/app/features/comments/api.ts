import { subsonic } from '@/app/clients/subsonic'
import { Comment, CreateCommentDto } from './types'

export async function fetchComments(
  entityType: string,
  entityId: string,
): Promise<Comment[]> {
  const params = {
    entityType,
    entityId,
  }

  const response = await subsonic.request('getComments', params)
  return response.comments?.comment || []
}

export async function createComment(
  dto: CreateCommentDto,
): Promise<Comment> {
  const params = {
    ...dto,
  }

  const response = await subsonic.request('createComment', params)
  return response.comment
}

export async function deleteComment(commentId: number): Promise<void> {
  await subsonic.request('deleteComment', { id: commentId })
}

export async function likeComment(
  commentId: number,
  userId: string,
): Promise<void> {
  await subsonic.request('likeComment', { id: commentId, userId })
}
