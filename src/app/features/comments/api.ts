import type { Comment, CreateCommentData } from './types'

/**
 * API functions for the comment system
 * 
 * NOTE: These are currently mock implementations.
 * Replace with actual API calls to your backend.
 */

// Mock data store (replace with actual API calls)
const mockComments: Comment[] = []
let mockIdCounter = 1

export async function getComments(
  entityType: string,
  entityId: string,
): Promise<Comment[]> {
  // TODO: Replace with actual API call
  // Example:
  // const response = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`)
  // return response.json()

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockComments.filter(
    (c) => c.entityType === entityType && c.entityId === entityId,
  )
}

export async function createComment(
  data: CreateCommentData,
): Promise<Comment> {
  // TODO: Replace with actual API call
  // Example:
  // const response = await fetch('/api/comments', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // })
  // return response.json()

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500))
  const newComment: Comment = {
    id: mockIdCounter++,
    ...data,
    createdAt: new Date().toISOString(),
    likes: 0,
    userHasLiked: false,
  }
  mockComments.push(newComment)
  return newComment
}

export async function deleteComment(commentId: number): Promise<void> {
  // TODO: Replace with actual API call
  // Example:
  // await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockComments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    mockComments.splice(index, 1)
  }
}

export async function likeComment(
  commentId: number,
  userId: string,
): Promise<{ likes: number }> {
  // TODO: Replace with actual API call
  // Example:
  // const response = await fetch(`/api/comments/${commentId}/like`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ userId }),
  // })
  // return response.json()

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 300))
  const comment = mockComments.find((c) => c.id === commentId)
  if (comment) {
    if (comment.userHasLiked) {
      comment.likes = Math.max(0, comment.likes - 1)
      comment.userHasLiked = false
    } else {
      comment.likes += 1
      comment.userHasLiked = true
    }
    return { likes: comment.likes }
  }
  return { likes: 0 }
}
