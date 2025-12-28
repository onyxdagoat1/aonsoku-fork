import { supabase } from '@/lib/supabase'
import type { Comment, CreateCommentData } from './types'

/**
 * Get comments for an entity with user like status
 */
export async function getComments(
  entityType: string,
  entityId: string,
  userId?: string
): Promise<Comment[]> {
  try {
    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (commentsError) throw commentsError
    if (!comments) return []

    // If no user, return comments without like status
    if (!userId) {
      return comments.map(comment => ({
        id: comment.id,
        entityType: comment.entity_type,
        entityId: comment.entity_id,
        userId: comment.user_id,
        username: comment.username,
        content: comment.content,
        createdAt: comment.created_at,
        likes: comment.likes,
        userHasLiked: false,
      }))
    }

    // Get user's likes for these comments
    const commentIds = comments.map(c => c.id)
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds)

    const likedCommentIds = new Set(likes?.map(l => l.comment_id) || [])

    // Combine comments with like status
    return comments.map(comment => ({
      id: comment.id,
      entityType: comment.entity_type,
      entityId: comment.entity_id,
      userId: comment.user_id,
      username: comment.username,
      content: comment.content,
      createdAt: comment.created_at,
      likes: comment.likes,
      userHasLiked: likedCommentIds.has(comment.id),
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  data: CreateCommentData
): Promise<Comment> {
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      entity_type: data.entityType,
      entity_id: data.entityId,
      user_id: data.userId,
      username: data.username,
      content: data.content,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: comment.id,
    entityType: comment.entity_type,
    entityId: comment.entity_id,
    userId: comment.user_id,
    username: comment.username,
    content: comment.content,
    createdAt: comment.created_at,
    likes: comment.likes,
    userHasLiked: false,
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: number): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}

/**
 * Like or unlike a comment
 */
export async function likeComment(
  commentId: number,
  userId: string
): Promise<{ likes: number }> {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single()

  if (existingLike) {
    // Unlike: delete the like
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)

    if (error) throw error
  } else {
    // Like: insert new like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId,
      })

    if (error) throw error
  }

  // Get updated like count
  const { data: comment } = await supabase
    .from('comments')
    .select('likes')
    .eq('id', commentId)
    .single()

  return { likes: comment?.likes || 0 }
}
